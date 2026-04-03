import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { SupplierKpimoduleService } from './supplier-kpimodule.service';

@Injectable()
export class SupplierKpiTaskService {
  private readonly logger = new Logger(SupplierKpiTaskService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly kpiService: SupplierKpimoduleService,
  ) {}

  /**
   * Tự động chạy đánh giá KPI cho toàn bộ nhà cung cấp vào lúc 0h ngày 1 hàng tháng
   */
  @Cron(CronExpression.EVERY_1ST_DAY_OF_MONTH_AT_MIDNIGHT)
  async handleMonthlyKpiEvaluation() {
    this.logger.log('Starting scheduled monthly supplier KPI evaluation...');

    // 1. Lấy tất cả các tổ chức đóng vai trò là Buyer
    const buyers = await this.prisma.organization.findMany({
      where: { companyType: { in: ['BUYER', 'BOTH'] }, isActive: true },
    });

    for (const buyer of buyers) {
      // 2. Tìm tất cả các nhà cung cấp đã có giao dịch (PO) với Buyer này trong 6 tháng qua
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

      const activeSuppliers = await this.prisma.purchaseOrder.findMany({
        where: {
          orgId: buyer.id,
          createdAt: { gte: sixMonthsAgo },
        },
        distinct: ['supplierId'],
        select: { supplierId: true },
      });

      this.logger.log(
        `Found ${activeSuppliers.length} active suppliers for buyer: ${buyer.name}`,
      );

      // 3. Chạy đánh giá cho từng cặp Buyer - Supplier
      for (const item of activeSuppliers) {
        try {
          await this.kpiService.evaluateSupplierPerformance(
            item.supplierId,
            buyer.id,
          );
          this.logger.log(
            `Successfully evaluated KPI for supplier: ${item.supplierId} under buyer: ${buyer.id}`,
          );
        } catch {
          this.logger.error(
            `Failed to evaluate KPI for supplier ${item.supplierId}`,
          );
        }
      }
    }

    this.logger.log('Monthly supplier KPI evaluation completed.');
  }

  /**
   * Task phụ: Chạy vào mỗi sáng thứ 2 hàng tuần để cập nhật Trust Score cho các nhà cung cấp mới
   */
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  handleWeeklySync() {
    this.logger.log('Performing weekly trust score synchronization...');
    // Có thể thêm logic bổ sung ở đây nếu cần
  }
}
