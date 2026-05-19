import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateBuyerRatingDto,
  CreateSupplierManualReviewDto,
} from './dto/review.dto';
// import { UserRole } from '@prisma/client';

@Injectable()
export class ReviewModuleService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Nhà cung cấp đánh giá người mua (Buyer Rating) sau khi hoàn thành PO
   */
  async createBuyerRating(
    dto: CreateBuyerRatingDto,
    raterId: string,
    raterOrgId: string,
  ) {
    // 1. Kiểm tra PO có tồn tại và thuộc về nhà cung cấp này không
    const po = await this.prisma.purchaseOrder.findUnique({
      where: { id: dto.poId },
    });

    if (!po) throw new NotFoundException('Đơn hàng không tồn tại');
    if (po.supplierId !== raterOrgId) {
      throw new BadRequestException(
        'Bạn chỉ có thể đánh giá người mua cho các đơn hàng của mình',
      );
    }

    // 2. Tạo đánh giá
    return this.prisma.buyerRating.create({
      data: {
        ...dto,
        buyerOrgId: po.orgId,
        ratedById: raterId,
      },
    });
  }

  /**
   * Người mua đánh giá thủ công hiệu suất nhà cung cấp (Supplier Manual Review)
   */
  async createSupplierManualReview(
    dto: CreateSupplierManualReviewDto,
    reviewerId: string,
  ) {
    // 1. Lấy thông tin người đánh giá để lấy role
    const reviewer = await this.prisma.user.findUnique({
      where: { id: reviewerId },
    });
    if (!reviewer) throw new NotFoundException('Người đánh giá không tồn tại');

    // 2. Tính toán điểm trung bình overall
    const scores = [
      dto.packagingScore,
      dto.labelingScore,
      dto.coaAccuracyScore,
      dto.communicationScore,
      dto.flexibilityScore,
      dto.complianceScore,
    ].filter((s) => s !== undefined);

    const overallScore =
      scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;

    // 3. Tạo đánh giá thủ công
    return this.prisma.supplierManualReview.create({
      data: {
        ...dto,
        reviewerId,
        reviewerRole: reviewer.role,
        overallScore,
      },
    });
  }

  /**
   * Lấy danh sách đánh giá của một nhà cung cấp
   */
  async getSupplierReviews(supplierId: string) {
    return this.prisma.supplierManualReview.findMany({
      where: {
        kpiScore: {
          supplierId,
        },
      },
      include: {
        reviewer: {
          select: {
            fullName: true,
            jobTitle: true,
          },
        },
        po: {
          select: {
            poNumber: true,
          },
        },
      },
      orderBy: { reviewedAt: 'desc' },
    });
  }

  /**
   * Lấy danh sách đánh giá của một người mua (tổ chức)
   */
  async getBuyerRatings(buyerOrgId: string) {
    return this.prisma.buyerRating.findMany({
      where: { buyerOrgId },
      include: {
        ratedBy: {
          select: {
            fullName: true,
          },
        },
        supplier: {
          select: {
            name: true,
          },
        },
        po: {
          select: {
            poNumber: true,
          },
        },
      },
      orderBy: { ratedAt: 'desc' },
    });
  }
}
