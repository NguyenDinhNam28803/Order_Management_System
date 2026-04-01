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

    // 4. Lấy số lượng tranh chấp (Disputes)
    const disputeCount = await this.prisma.dispute.count({
      where: {
        againstOrgId: supplierId,
        openedOrgId: buyerOrgId,
        createdAt: { gte: sixMonthsAgo },
      },
    });

    // 5. Chuẩn bị dữ liệu cho AI
    const performanceMetrics = {
      otdScore: otdScore.toFixed(2),
      qualityScore: qualityScore.toFixed(2),
      poCount: totalPos,
      disputeCount: disputeCount,
    };

    // 6. Gọi AI đánh giá với Kiểu dữ liệu RÕ RÀNG
    const aiEvaluation: AiSupplierEvaluation =
      await this.aiService.analyzeSupplierPerformance(
        supplier,
        performanceMetrics,
      );

    // 7. Lưu hoặc cập nhật kết quả vào database
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

    return {
      kpiScore,
      aiInsights: aiEvaluation,
    };
  }

  async getSupplierReport(supplierId: string, buyerOrgId: string) {
    return this.prisma.supplierKpiScore.findMany({
      where: { supplierId, buyerOrgId },
      orderBy: { periodYear: 'desc' },
      take: 4,
    });
  }
}
