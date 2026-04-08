import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  AiService,
  AiSupplierEvaluation,
} from '../ai-service/ai-service.service';
import { SupplierTier } from '@prisma/client';

@Injectable()
export class SupplierKpimoduleService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly aiService: AiService,
  ) {}

  /**
   * Tính toán và đánh giá KPI nhà cung cấp bằng AI
   */
  async evaluateSupplierPerformance(supplierId: string, buyerOrgId: string) {
    // Validate required fields
    if (!buyerOrgId) {
      throw new Error('buyerOrgId is required for supplier evaluation');
    }

    // 1. Lấy thông tin nhà cung cấp
    const supplier = await this.prisma.organization.findUnique({
      where: { id: supplierId },
    });
    if (!supplier) throw new NotFoundException('Supplier not found');

    // 2. Lấy dữ liệu PO trong 6 tháng gần nhất
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const pos = await this.prisma.purchaseOrder.findMany({
      where: {
        supplierId,
        orgId: buyerOrgId,
        createdAt: { gte: sixMonthsAgo },
        status: { in: ['COMPLETED', 'SHIPPED', 'GRN_CREATED'] },
      },
      include: {
        goodsReceipts: {
          include: { items: true },
        },
      },
    });

    // 3. Tính toán các chỉ số thô (Raw Metrics)
    const totalPos = pos.length;
    let onTimePos = 0;
    let totalItemsReceived = 0;
    let totalItemsAccepted = 0;

    pos.forEach((po) => {
      // Check OTD (On-Time Delivery)
      const grn = po.goodsReceipts[0];
      if (grn && grn.receivedAt <= po.deliveryDate) {
        onTimePos++;
      }

      // Check Quality
      po.goodsReceipts.forEach((grn) => {
        grn.items.forEach((item) => {
          totalItemsReceived += Number(item.receivedQty);
          totalItemsAccepted += Number(item.acceptedQty);
        });
      });
    });

    const otdScore = totalPos > 0 ? (onTimePos / totalPos) * 100 : 100;
    const qualityScore =
      totalItemsReceived > 0
        ? (totalItemsAccepted / totalItemsReceived) * 100
        : 100;

    // 4. Lấy các đánh giá thủ công (Manual Reviews & Buyer Ratings)
    const manualReviews = await this.prisma.supplierManualReview.findMany({
      where: {
        po: { supplierId, orgId: buyerOrgId },
        reviewedAt: { gte: sixMonthsAgo },
      },
    });

    const buyerRatings = await this.prisma.buyerRating.findMany({
      where: {
        supplierId,
        buyerOrgId,
        ratedAt: { gte: sixMonthsAgo },
      },
    });

    let totalManualScore = 0;
    let manualReviewCount = 0;

    manualReviews.forEach((review) => {
      totalManualScore += Number(review.overallScore);
      manualReviewCount++;
    });

    buyerRatings.forEach((rating) => {
      // Tính trung bình các tiêu chí trong BuyerRating (thang điểm 1-5 hoặc 1-10 tùy config, giả định là thang điểm đã chuẩn hóa)
      const avgRating =
        (rating.paymentTimelinessScore +
          rating.specClarityScore +
          rating.communicationScore +
          rating.processComplianceScore +
          rating.disputeFairnessScore) /
        5;
      totalManualScore += avgRating * 20; // Giả sử chuẩn hóa lên thang 100
      manualReviewCount++;
    });

    const manualScore =
      manualReviewCount > 0 ? totalManualScore / manualReviewCount : 100;

    // 5. Lấy số lượng tranh chấp (Disputes)
    const disputeCount = await this.prisma.dispute.count({
      where: {
        againstOrgId: supplierId,
        openedOrgId: buyerOrgId,
        createdAt: { gte: sixMonthsAgo },
      },
    });

    // 6. Chuẩn bị dữ liệu cho AI
    const performanceMetrics = {
      otdScore: otdScore.toFixed(2),
      qualityScore: qualityScore.toFixed(2),
      manualScore: manualScore.toFixed(2),
      poCount: totalPos,
      disputeCount: disputeCount,
    };

    // 7. Gọi AI đánh giá với Kiểu dữ liệu RÕ RÀNG
    const aiEvaluation: AiSupplierEvaluation =
      await this.aiService.analyzeSupplierPerformance(
        supplier,
        performanceMetrics,
      );

    // 8. Lưu hoặc cập nhật kết quả vào database
    const currentYear = new Date().getFullYear();
    const currentQuarter = Math.floor(new Date().getMonth() / 3) + 1;

    const kpiScore = await this.prisma.supplierKpiScore.upsert({
      where: {
        supplierId_buyerOrgId_periodYear_periodQuarter: {
          supplierId,
          buyerOrgId,
          periodYear: currentYear,
          periodQuarter: currentQuarter,
        },
      },
      update: {
        otdScore: otdScore,
        qualityScore: qualityScore,
        manualScore: manualScore,
        priceScore: aiEvaluation.priceScore,
        tier: aiEvaluation.tierRecommendation as SupplierTier,
        poCount: totalPos,
        disputeCount: disputeCount,
        notes: aiEvaluation.analysis,
        improvementPlan: aiEvaluation.improvementPlan,
        calculatedAt: new Date(),
      },
      create: {
        supplierId,
        buyerOrgId,
        periodYear: currentYear,
        periodQuarter: currentQuarter,
        otdScore: otdScore,
        qualityScore: qualityScore,
        manualScore: manualScore,
        priceScore: aiEvaluation.priceScore,
        tier: aiEvaluation.tierRecommendation as SupplierTier,
        poCount: totalPos,
        disputeCount: disputeCount,
        notes: aiEvaluation.analysis,
        improvementPlan: aiEvaluation.improvementPlan,
      },
    });

    // 8. Cập nhật Organization
    await this.prisma.organization.update({
      where: { id: supplierId },
      data: {
        trustScore: aiEvaluation.overallScore,
        supplierTier: aiEvaluation.tierRecommendation as SupplierTier,
      },
    });

    // Convert Decimal values to numbers for JSON serialization
    return {
      kpiScore: {
        ...kpiScore,
        otdScore: Number(kpiScore.otdScore),
        qualityScore: Number(kpiScore.qualityScore),
        priceScore: Number(kpiScore.priceScore),
        manualScore: Number(kpiScore.manualScore),
      },
      aiInsights: aiEvaluation,
    };
  }

  async getSupplierReport(supplierId: string, buyerOrgId: string) {
    const scores = await this.prisma.supplierKpiScore.findMany({
      where: { supplierId, buyerOrgId },
      orderBy: [{ periodYear: 'desc' }, { periodQuarter: 'desc' }],
      take: 4,
    });
    
    // Convert Decimal to number for JSON serialization
    return scores.map(score => {
      const otdScore = Number(score.otdScore);
      const qualityScore = Number(score.qualityScore);
      const priceScore = Number(score.priceScore);
      const manualScore = Number(score.manualScore);
      
      // Calculate overall score (weighted average)
      const overallScore = Math.round(
        (otdScore * 0.3 + qualityScore * 0.3 + priceScore * 0.2 + manualScore * 0.2) * 10
      ) / 10;
      
      return {
        ...score,
        otdScore,
        qualityScore,
        priceScore,
        manualScore,
        invoiceAccuracy: Number(score.invoiceAccuracy),
        fulfillmentRate: Number(score.fulfillmentRate),
        responseTimeScore: Number(score.responseTimeScore),
        overallScore,
      };
    });
  }
}
