import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ReportModuleService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Lấy tổng quan về số lượng các thực thể chính trong tổ chức
   */
  async getProcurementOverview(orgId: string) {
    const [prCount, poCount, invoiceCount, supplierCount] = await Promise.all([
      this.prisma.purchaseRequisition.count({ where: { orgId } }),
      this.prisma.purchaseOrder.count({ where: { orgId } }),
      this.prisma.supplierInvoice.count({ where: { orgId } }),
      this.prisma.organization.count({ where: { companyType: 'SUPPLIER' } }),
    ]);

    const totalSpent = await this.prisma.purchaseOrder.aggregate({
      where: { orgId, status: 'COMPLETED' },
      _sum: { totalAmount: true },
    });

    return {
      prCount,
      poCount,
      invoiceCount,
      supplierCount,
      totalSpent: totalSpent._sum.totalAmount || 0,
    };
  }

  /**
   * Thống kê chi tiêu theo nhà cung cấp
   */
  async getSpendBySupplier(orgId: string) {
    const spend = await this.prisma.purchaseOrder.groupBy({
      by: ['supplierId'],
      where: { orgId, status: { in: ['COMPLETED', 'SHIPPED', 'GRN_CREATED'] } },
      _sum: { totalAmount: true },
      _count: { id: true },
    });

    // Lấy tên nhà cung cấp
    const result = await Promise.all(
      spend.map(async (item) => {
        const supplier = await this.prisma.organization.findUnique({
          where: { id: item.supplierId },
          select: { name: true },
        });
        return {
          supplierName: supplier?.name || 'Unknown',
          totalAmount: item._sum.totalAmount,
          poCount: item._count.id,
        };
      }),
    );

    return result.sort((a, b) => Number(b.totalAmount) - Number(a.totalAmount));
  }

  /**
   * Thống kê chi tiêu theo danh mục sản phẩm (Category)
   */
  async getSpendByCategory(orgId: string) {
    // Lưu ý: Category nằm ở PrItem hoặc PoItem thông qua Product
    // Ở đây ta đơn giản hóa bằng cách lấy từ SpendAnalyticsSnapshot nếu có,
    // hoặc tính toán trực tiếp từ PoItem
    const poItems = await this.prisma.poItem.findMany({
      where: {
        po: { orgId, status: { in: ['COMPLETED', 'SHIPPED', 'GRN_CREATED'] } },
      },
      include: {
        prItem: {
          include: { category: true },
        },
      },
    });

    const categoryMap = new Map();
    poItems.forEach((item) => {
      const categoryName = item.prItem?.category?.name || 'Uncategorized';
      const amount = Number(item.total);
      categoryMap.set(
        categoryName,
        (categoryMap.get(categoryName) || 0) + amount,
      );
    });

    return Array.from(categoryMap.entries())
      .map(([name, total]) => ({
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        categoryName: name,
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        totalAmount: total,
      }))
      .sort((a, b) => b.totalAmount - a.totalAmount);
  }

  /**
   * Lấy lịch sử Snapshot chi tiêu theo thời gian
   */
  async getSpendHistory(orgId: string) {
    return this.prisma.spendAnalyticsSnapshot.findMany({
      where: { orgId },
      orderBy: { snapshotDate: 'asc' },
    });
  }
}
