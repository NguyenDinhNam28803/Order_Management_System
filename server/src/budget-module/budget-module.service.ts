import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateBudgetAllocationDto,
  CreateBudgetPeriodDto,
  UpdateBudgetAllocationDto,
  UpdateBudgetPeriodDto,
} from './dto/budget.dto';
import {
  Prisma,
  BudgetAllocation,
  BudgetPeriod,
  BudgetPeriodType,
  BudgetAllocationStatus,
  UserRole,
} from '@prisma/client';
import { JwtPayload } from '../auth-module/interfaces/jwt-payload.interface';
import { AuditModuleService } from '../audit-module/audit-module.service';

@Injectable()
export class BudgetModuleService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditModuleService,
  ) {}

  // Budget Period
  async createPeriod(
    dto: CreateBudgetPeriodDto,
    user: JwtPayload,
  ): Promise<BudgetPeriod> {
    const period = await this.prisma.budgetPeriod.create({
      data: {
        ...dto,
        orgId: user.orgId,
      } as unknown as Prisma.BudgetPeriodCreateInput,
    });

    // Audit log
    await this.auditService.create(
      {
        action: 'CREATE_BUDGET_PERIOD',
        entityType: 'BudgetPeriod',
        entityId: period.id,
        newValue: period,
      },
      user,
    );

    return period;
  }

  async findAllPeriods(user: JwtPayload): Promise<BudgetPeriod[]> {
    return this.prisma.budgetPeriod.findMany({
      where: { orgId: user.orgId },
      orderBy: { fiscalYear: 'desc' },
    });
  }

  async findPeriodsByType(
    type: BudgetPeriodType,
    user: JwtPayload,
  ): Promise<BudgetPeriod[]> {
    return this.prisma.budgetPeriod.findMany({
      where: {
        orgId: user.orgId,
        periodType: type,
      },
      orderBy: { fiscalYear: 'desc' },
    });
  }

  async updatePeriod(
    id: string,
    dto: UpdateBudgetPeriodDto,
    user: JwtPayload,
  ): Promise<BudgetPeriod> {
    const oldPeriod = await this.prisma.budgetPeriod.findUnique({
      where: { id },
    });
    const updated = await this.prisma.budgetPeriod.update({
      where: { id },
      data: dto,
    });

    // Audit log
    await this.auditService.create(
      {
        action: 'UPDATE_BUDGET_PERIOD',
        entityType: 'BudgetPeriod',
        entityId: id,
        oldValue: oldPeriod,
        newValue: updated,
      },
      user,
    );

    return updated;
  }

  async removePeriod(id: string, user: JwtPayload): Promise<BudgetPeriod> {
    const oldPeriod = await this.prisma.budgetPeriod.findUnique({
      where: { id },
    });
    const deleted = await this.prisma.budgetPeriod.delete({
      where: { id },
    });

    // Audit log
    await this.auditService.create(
      {
        action: 'DELETE_BUDGET_PERIOD',
        entityType: 'BudgetPeriod',
        entityId: id,
        oldValue: oldPeriod,
      },
      user,
    );

    return deleted;
  }

  // Budget Allocation
  async createAllocation(
    dto: CreateBudgetAllocationDto,
    user: JwtPayload,
  ): Promise<BudgetAllocation> {
    // Check for existing allocation with same unique key
    const existingAllocation = await this.prisma.budgetAllocation.findFirst({
      where: {
        budgetPeriodId: dto.budgetPeriodId,
        costCenterId: dto.costCenterId,
        deptId: dto.deptId || user.deptId,
        categoryId: dto.categoryId || null,
      },
    });

    let allocation: BudgetAllocation;

    if (existingAllocation) {
      // Update existing allocation
      allocation = await this.prisma.budgetAllocation.update({
        where: { id: existingAllocation.id },
        data: {
          allocatedAmount: dto.allocatedAmount,
          currency: dto.currency,
          notes: dto.notes,
          status: BudgetAllocationStatus.DRAFT,
        },
      });

      // Audit log
      await this.auditService.create(
        {
          action: 'UPDATE_BUDGET_ALLOCATION',
          entityType: 'BudgetAllocation',
          entityId: allocation.id,
          oldValue: existingAllocation,
          newValue: allocation,
        },
        user,
      );
    } else {
      // Create new allocation
      allocation = await this.prisma.budgetAllocation.create({
        data: {
          ...dto,
          deptId: dto.deptId || user.deptId,
          orgId: user.orgId,
          createdById: user.sub,
          status: BudgetAllocationStatus.DRAFT,
        },
      });

      // Audit log
      await this.auditService.create(
        {
          action: 'CREATE_BUDGET_ALLOCATION',
          entityType: 'BudgetAllocation',
          entityId: allocation.id,
          newValue: allocation,
        },
        user,
      );
    }

    return allocation;
  }

  async findAllAllocations(user: JwtPayload): Promise<BudgetAllocation[]> {
    return this.prisma.budgetAllocation.findMany({
      where: { orgId: user.orgId },
      include: {
        budgetPeriod: true,
        costCenter: true,
        department: true,
        category: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findAllocationOne(id: string, orgId?: string): Promise<BudgetAllocation> {
    const allocation = await this.prisma.budgetAllocation.findUnique({
      where: { id },
      include: {
        budgetPeriod: true,
        costCenter: true,
        department: true,
        category: true,
        createdBy: { select: { fullName: true, email: true } },
      },
    });

    if (!allocation) {
      throw new NotFoundException(`Budget Allocation with ID ${id} not found`);
    }

    // Prevent cross-org access when orgId is provided
    if (orgId && allocation.orgId !== orgId) {
      throw new NotFoundException(`Budget Allocation with ID ${id} not found`);
    }

    return allocation;
  }

  async updateAllocation(
    id: string,
    dto: UpdateBudgetAllocationDto,
    user: JwtPayload,
  ): Promise<BudgetAllocation> {
    const oldAllocation = await this.findAllocationOne(id, user.orgId);
    const updated = await this.prisma.budgetAllocation.update({
      where: { id },
      data: dto,
    });

    // Audit log
    await this.auditService.create(
      {
        action: 'UPDATE_BUDGET_ALLOCATION',
        entityType: 'BudgetAllocation',
        entityId: id,
        oldValue: oldAllocation,
        newValue: updated,
      },
      user,
    );

    return updated;
  }

  async removeAllocation(
    id: string,
    user: JwtPayload,
  ): Promise<BudgetAllocation> {
    const oldAllocation = await this.findAllocationOne(id, user.orgId);
    const deleted = await this.prisma.budgetAllocation.delete({
      where: { id },
    });

    // Audit log
    await this.auditService.create(
      {
        action: 'DELETE_BUDGET_ALLOCATION',
        entityType: 'BudgetAllocation',
        entityId: id,
        oldValue: oldAllocation,
      },
      user,
    );

    return deleted;
  }

  /**
   * Giữ chỗ ngân sách theo Category (Atomic Reservation)
   * Gọi khi PO được tạo với categoryId
   */
  async reserveBudgetByCategory(
    costCenterId: string,
    categoryId: string | undefined,
    orgId: string,
    amount: number,
    user: JwtPayload,
  ): Promise<BudgetAllocation> {
    // const now = new Date();
    // const fiscalYear = now.getFullYear();
    // const quarter = Math.ceil((now.getMonth() + 1) / 3);

    // 1. Find BudgetAllocation by costCenterId + categoryId
    const allocation = await this.prisma.budgetAllocation.findFirst({
      where: {
        costCenterId,
        categoryId: categoryId || null,
        orgId,
        status: 'APPROVED',
      },
    });

    if (!allocation) {
      throw new BadRequestException(
        `Không tìm thấy cấp phát ngân sách cho Cost Center + Category này. Vui lòng kiểm tra lại kế hoạch ngân sách.`,
      );
    }

    // 2. Thực hiện cập nhật committedAmount một cách nguyên tử (Atomic)
    const updated = await this.prisma.budgetAllocation.update({
      where: { id: allocation.id },
      data: {
        committedAmount: { increment: amount },
      },
    });

    const available =
      Number(updated.allocatedAmount) -
      Number(updated.committedAmount) -
      Number(updated.spentAmount);

    if (available < 0) {
      // Rollback nếu vượt hạn mức (Giảm lại số tiền vừa cộng)
      await this.prisma.budgetAllocation.update({
        where: { id: updated.id },
        data: { committedAmount: { decrement: amount } },
      });

      throw new BadRequestException(
        `Vượt hạn mức ngân sách danh mục. Hạn mức cần thêm: ${Math.abs(available).toLocaleString()} VND. Vui lòng xin phê duyệt vượt ngân sách.`,
      );
    }

    // Audit log for reservation
    await this.auditService.create(
      {
        action: 'RESERVE_BUDGET_CATEGORY',
        entityType: 'BudgetAllocation',
        entityId: updated.id,
        newValue: {
          reservedAmount: amount,
          currentCommitted: updated.committedAmount,
          category: categoryId,
        },
      },
      user,
    );

    return updated;
  }

  /**
   * Giữ chỗ ngân sách (Atomic Reservation)
   * Gọi khi PR được submit cho việc phê duyệt
   */
  async reserveBudget(
    costCenterId: string,
    orgId: string,
    amount: number,
    user: JwtPayload,
  ): Promise<BudgetAllocation> {
    const now = new Date();
    const fiscalYear = now.getFullYear();
    const quarter = Math.ceil((now.getMonth() + 1) / 3);

    // 1. Kiểm tra ngân sách quý và tự động trích từ quỹ dự phòng nếu cần
    const allocation = await this.checkAndPullFromReserve(
      costCenterId,
      orgId,
      fiscalYear,
      quarter,
      amount,
      user, // Pass user for internal audit logging
    );

    if (!allocation) {
      throw new BadRequestException(
        `Không tìm thấy ngân sách cho Cost Center trong Quý ${quarter}/${fiscalYear}`,
      );
    }

    // 2. Thực hiện cập nhật committedAmount một cách nguyên tử (Atomic)
    // Đồng thời kiểm tra điều kiện ngân sách không bị âm sau khi cập nhật
    const updated = await this.prisma.budgetAllocation.update({
      where: { id: allocation.id },
      data: {
        committedAmount: { increment: amount },
      },
    });

    const available =
      Number(updated.allocatedAmount) -
      Number(updated.committedAmount) -
      Number(updated.spentAmount);

    if (available < 0) {
      // Rollback nếu vượt hạn mức (Giảm lại số tiền vừa cộng)
      await this.prisma.budgetAllocation.update({
        where: { id: updated.id },
        data: { committedAmount: { decrement: amount } },
      });
      throw new BadRequestException(
        `Vượt hạn mức ngân sách. Hạn mức khả dụng còn lại: ${(Number(available) + amount).toLocaleString()} VND`,
      );
    }

    // Audit log for reservation
    await this.auditService.create(
      {
        action: 'RESERVE_BUDGET',
        entityType: 'BudgetAllocation',
        entityId: updated.id,
        newValue: {
          reservedAmount: amount,
          currentCommitted: updated.committedAmount,
        },
      },
      user,
    );

    return updated;
  }

  /**
   * Giải phóng ngân sách đã giữ chỗ (Atomic Release)
   * Gọi khi PR/PO bị hủy hoặc bị từ chối
   */
  async releaseBudget(
    costCenterId: string,
    orgId: string,
    amount: number,
    user: JwtPayload,
  ): Promise<void> {
    const now = new Date();
    const fiscalYear = now.getFullYear();
    const quarter = Math.ceil((now.getMonth() + 1) / 3);

    const period = await this.prisma.budgetPeriod.findFirst({
      where: {
        orgId,
        fiscalYear,
        periodType: 'QUARTERLY',
        periodNumber: quarter,
      },
    });

    if (!period) return;

    const updated = await this.prisma.budgetAllocation.updateMany({
      where: {
        costCenterId,
        budgetPeriodId: period.id,
        committedAmount: { gte: amount }, // Chỉ giảm nếu committed >= amount để tránh âm
      },
      data: {
        committedAmount: { decrement: amount },
      },
    });

    if (updated.count > 0) {
      await this.auditService.create(
        {
          action: 'RELEASE_BUDGET',
          entityType: 'BudgetAllocation',
          entityId: costCenterId, // CC ID used as entity ID for summary log
          newValue: { releasedAmount: amount },
        },
        user,
      );
    }
  }

  /**
   * Chuyển từ Giữ chỗ sang Chi tiêu thực tế (Atomic Commit)
   * Gọi khi PO hoàn thành hoặc Invoice được thanh toán
   */
  async commitSpentBudget(
    costCenterId: string,
    orgId: string,
    amount: number,
    user: JwtPayload,
  ): Promise<void> {
    const now = new Date();
    const fiscalYear = now.getFullYear();
    const quarter = Math.ceil((now.getMonth() + 1) / 3);

    const period = await this.prisma.budgetPeriod.findFirst({
      where: {
        orgId,
        fiscalYear,
        periodType: 'QUARTERLY',
        periodNumber: quarter,
      },
    });

    if (!period) return;

    const updated = await this.prisma.budgetAllocation.updateMany({
      where: {
        costCenterId,
        budgetPeriodId: period.id,
      },
      data: {
        committedAmount: { decrement: amount },
        spentAmount: { increment: amount },
      },
    });

    if (updated.count > 0) {
      await this.auditService.create(
        {
          action: 'COMMIT_SPENT_BUDGET',
          entityType: 'BudgetAllocation',
          entityId: costCenterId,
          newValue: { spentAmount: amount },
        },
        user,
      );
    }
  }

  // Phân bổ ngân sách hàng năm: 20% Dự phòng, 80% chia đều cho 4 Quý (mỗi quý 20%)
  async distributeAnnualBudget(
    costCenterId: string,
    fiscalYear: number,
    user: JwtPayload,
  ) {
    const costCenter = await this.prisma.costCenter.findUnique({
      where: { id: costCenterId },
    });

    if (!costCenter) {
      throw new NotFoundException(
        `Cost Center với ID ${costCenterId} không tồn tại.`,
      );
    }

    const annualBudget = Number(costCenter.budgetAnnual);
    const reserveAmount = annualBudget * 0.2;
    const quarterAmount = (annualBudget * 0.8) / 4;
    const periods: { periodId: string; amount: number; notes: string }[] = [];

    // Reserve Period
    let reservePeriod = await this.prisma.budgetPeriod.findFirst({
      where: { orgId: user.orgId, fiscalYear, periodType: 'RESERVE' },
    });
    if (!reservePeriod) {
      reservePeriod = await this.prisma.budgetPeriod.create({
        data: {
          orgId: user.orgId,
          fiscalYear,
          periodType: 'RESERVE',
          periodNumber: 1,
          startDate: new Date(`${fiscalYear}-01-01`),
          endDate: new Date(`${fiscalYear}-12-31`),
        },
      });
    }
    periods.push({
      periodId: reservePeriod.id,
      amount: reserveAmount,
      notes: 'Quỹ dự phòng 20%',
    });

    // 4 Quarter Periods
    for (let q = 1; q <= 4; q++) {
      let qPeriod = await this.prisma.budgetPeriod.findFirst({
        where: {
          orgId: user.orgId,
          fiscalYear,
          periodType: 'QUARTERLY',
          periodNumber: q,
        },
      });
      if (!qPeriod) {
        const startMonth = (q - 1) * 3 + 1;
        const endMonth = q * 3;
        const endDay = q === 1 || q === 4 ? '31' : '30';
        qPeriod = await this.prisma.budgetPeriod.create({
          data: {
            orgId: user.orgId,
            fiscalYear,
            periodType: 'QUARTERLY',
            periodNumber: q,
            startDate: new Date(
              `${fiscalYear}-${startMonth.toString().padStart(2, '0')}-01`,
            ),
            endDate: new Date(
              `${fiscalYear}-${endMonth.toString().padStart(2, '0')}-${endDay}`,
            ),
          },
        });
      }
      periods.push({
        periodId: qPeriod.id,
        amount: quarterAmount,
        notes: `Ngân sách Quý ${q} (20%)`,
      });
    }

    // 2. Tạo hoặc cập nhật BudgetAllocation
    const results: BudgetAllocation[] = [];
    for (const p of periods) {
      // Vì categoryId có thể null và là một phần của khóa unique, Prisma
      // xử lý khóa phức hợp với trường null theo cách riêng.
      const existing = await this.prisma.budgetAllocation.findFirst({
        where: {
          budgetPeriodId: p.periodId,
          costCenterId: costCenterId,
          categoryId: null,
        },
      });

      if (existing) {
        const updated = await this.prisma.budgetAllocation.update({
          where: { id: existing.id },
          data: {
            allocatedAmount: p.amount,
            notes: p.notes,
          },
        });
        results.push(updated);
      } else {
        const created = await this.prisma.budgetAllocation.create({
          data: {
            orgId: user.orgId,
            budgetPeriodId: p.periodId,
            costCenterId: costCenterId,
            categoryId: null,
            allocatedAmount: p.amount,
            currency: costCenter.currency,
            notes: p.notes,
            createdById: user.sub,
          },
        });
        results.push(created);
      }
    }

    // Audit log for mass distribution
    await this.auditService.create(
      {
        action: 'DISTRIBUTE_ANNUAL_BUDGET',
        entityType: 'CostCenter',
        entityId: costCenterId,
        newValue: {
          fiscalYear,
          totalBudget: annualBudget,
          distribution: results,
        },
      },
      user,
    );

    return results;
  }

  // Trích tiền từ quỹ dự phòng nếu ngân sách quý hiện tại hết
  async checkAndPullFromReserve(
    costCenterId: string,
    orgId: string,
    fiscalYear: number,
    quarter: number,
    neededAmount: number,
    user: JwtPayload,
  ) {
    // 1. Tìm phân bổ quý hiện tại
    const currentPeriod = await this.prisma.budgetPeriod.findFirst({
      where: {
        orgId,
        fiscalYear,
        periodType: 'QUARTERLY',
        periodNumber: quarter,
      },
    });

    if (!currentPeriod) return null;

    const currentAlloc = await this.prisma.budgetAllocation.findFirst({
      where: {
        budgetPeriodId: currentPeriod.id,
        costCenterId,
        categoryId: null, // Mặc định trích từ ngân sách chung của CC
      },
    });

    if (!currentAlloc) return null;

    const available =
      Number(currentAlloc.allocatedAmount) -
      Number(currentAlloc.committedAmount) -
      Number(currentAlloc.spentAmount);

    if (available >= neededAmount) return currentAlloc;

    // 2. Nếu thiếu, tìm quỹ dự phòng
    const shortfall = neededAmount - available;

    const reservePeriod = await this.prisma.budgetPeriod.findFirst({
      where: { orgId, fiscalYear, periodType: 'RESERVE' },
    });

    if (!reservePeriod) return currentAlloc;

    const reserveAlloc = await this.prisma.budgetAllocation.findFirst({
      where: {
        budgetPeriodId: reservePeriod.id,
        costCenterId,
        categoryId: null,
      },
    });

    if (!reserveAlloc) return currentAlloc;

    const reserveAvailable =
      Number(reserveAlloc.allocatedAmount) -
      Number(reserveAlloc.committedAmount) -
      Number(reserveAlloc.spentAmount);

    if (reserveAvailable <= 0) return currentAlloc;

    const pullAmount = Math.min(shortfall, reserveAvailable);

    // 3. Thực hiện chuyển tiền (Giao dịch Prisma)
    const result = await this.prisma.$transaction(async (tx) => {
      // Giảm quỹ dự phòng
      await tx.budgetAllocation.update({
        where: { id: reserveAlloc.id },
        data: {
          allocatedAmount: { decrement: pullAmount },
          notes:
            (reserveAlloc.notes || '') +
            `\n[System] Trích ${pullAmount} bù cho Quý ${quarter}`,
        },
      });

      // Tăng ngân sách quý hiện tại
      return tx.budgetAllocation.update({
        where: { id: currentAlloc.id },
        data: {
          allocatedAmount: { increment: pullAmount },
          notes:
            (currentAlloc.notes || '') +
            `\n[System] Nhận ${pullAmount} từ quỹ dự phòng`,
        },
      });
    });

    // Audit log for internal transfer
    await this.auditService.create(
      {
        action: 'PULL_FROM_RESERVE',
        entityType: 'BudgetAllocation',
        entityId: currentAlloc.id,
        newValue: {
          amount: pullAmount,
          reason: `Shortfall in Quarter ${quarter}`,
        },
      },
      user,
    );

    return result;
  }

  // Kết thúc quý: Chuyển tiền thừa vào quỹ dự phòng
  async reconcileQuarterToReserve(
    costCenterId: string,
    orgId: string,
    fiscalYear: number,
    quarter: number,
    user: JwtPayload,
  ) {
    const currentPeriod = await this.prisma.budgetPeriod.findFirst({
      where: {
        orgId,
        fiscalYear,
        periodType: 'QUARTERLY',
        periodNumber: quarter,
      },
    });

    if (!currentPeriod) return null;

    const currentAlloc = await this.prisma.budgetAllocation.findFirst({
      where: {
        budgetPeriodId: currentPeriod.id,
        costCenterId,
        categoryId: null,
      },
    });

    if (!currentAlloc) return null;

    const surplus =
      Number(currentAlloc.allocatedAmount) -
      Number(currentAlloc.committedAmount) -
      Number(currentAlloc.spentAmount);

    const reservePeriod = await this.prisma.budgetPeriod.findFirst({
      where: { orgId, fiscalYear, periodType: 'RESERVE' },
    });

    if (!reservePeriod) return currentAlloc;

    const reserveAlloc = await this.prisma.budgetAllocation.findFirst({
      where: {
        budgetPeriodId: reservePeriod.id,
        costCenterId,
        categoryId: null,
      },
    });

    if (!reserveAlloc) return currentAlloc;

    const result = await this.prisma.$transaction(async (tx) => {
      // Giảm ngân sách quý (thu hồi tiền thừa)
      await tx.budgetAllocation.update({
        where: { id: currentAlloc.id },
        data: {
          allocatedAmount: { decrement: surplus },
          notes:
            (currentAlloc.notes || '') +
            `\n[System] Chuyển ${surplus} tiền thừa vào quỹ dự phòng`,
        },
      });

      // Tăng quỹ dự phòng
      return tx.budgetAllocation.update({
        where: { id: reserveAlloc.id },
        data: {
          allocatedAmount: { increment: surplus },
          notes:
            (reserveAlloc.notes || '') +
            `\n[System] Nhận ${surplus} tiền thừa từ Quý ${quarter}`,
        },
      });
    });

    // Audit log for reconciliation
    await this.auditService.create(
      {
        action: 'RECONCILE_QUARTER_TO_RESERVE',
        entityType: 'BudgetAllocation',
        entityId: currentAlloc.id,
        newValue: { surplusAmount: surplus },
      },
      user,
    );

    return result;
  }

  // Lấy phân bổ ngân sách theo quý
  async findQuarterlyAllocation(
    costCenterId: string,
    orgId: string,
    fiscalYear: number,
    quarter: number,
  ) {
    const period = await this.prisma.budgetPeriod.findFirst({
      where: {
        orgId,
        fiscalYear,
        periodType: 'QUARTERLY',
        periodNumber: quarter,
      },
    });

    if (!period) {
      // Fallback: Nếu chưa có period, ta trích xuất thông tin Cost Center để trả về "Virtual Budget" (20%)
      const cc = await this.prisma.costCenter.findUnique({
        where: { id: costCenterId },
      });
      if (!cc || !cc.budgetAnnual) return null;

      const virtualAlloc = Number(cc.budgetAnnual) * 0.2;
      return {
        isVirtual: true,
        allocatedAmount: virtualAlloc,
        spentAmount: Number(cc.budgetUsed) * 0.2, // Giả định dùng 20% thực tế
        committedAmount: 0,
        currency: cc.currency,
        notes: `Ngân sách dự kiến Quý ${quarter} (Tính tự động 20% từ tổng năm)`,
      };
    }

    const alloc = await this.prisma.budgetAllocation.findFirst({
      where: {
        budgetPeriodId: period.id,
        costCenterId,
        categoryId: null,
      },
      include: {
        budgetPeriod: true,
      },
    });

    if (!alloc) {
      const cc = await this.prisma.costCenter.findUnique({
        where: { id: costCenterId },
      });
      if (!cc || !cc.budgetAnnual) return null;
      const virtualAlloc = Number(cc.budgetAnnual) * 0.2;
      return {
        isVirtual: true,
        allocatedAmount: virtualAlloc,
        spentAmount: 0,
        committedAmount: 0,
        currency: cc.currency,
        notes: `Ngân sách dự kiến Quý ${quarter} (Tính tự động 20% từ tổng năm)`,
      };
    }

    return alloc;
  }

  async submitAllocation(
    id: string,
    user: JwtPayload,
  ): Promise<BudgetAllocation> {
    const allocation = await this.findAllocationOne(id);

    if (
      user.role === UserRole.DEPT_APPROVER &&
      allocation.deptId !== user.deptId
    ) {
      throw new BadRequestException(
        'Bạn không có quyền gửi ngân sách của phòng ban khác.',
      );
    }

    if (
      allocation.status !== BudgetAllocationStatus.DRAFT &&
      allocation.status !== BudgetAllocationStatus.REJECTED
    ) {
      throw new BadRequestException(
        'Chỉ có thể gửi ngân sách ở trạng thái Nháp hoặc Bị từ chối.',
      );
    }

    const updated = await this.prisma.budgetAllocation.update({
      where: { id },
      data: { status: BudgetAllocationStatus.SUBMITTED },
    });

    // 🔄 NOTE: ApprovalModuleService.initiateWorkflow() sẽ được gọi từ controller
    // để tạo Approval Workflow tự động. Xem budget-module.controller.ts
    // Điều này tránh circular dependency modules.

    await this.auditService.create(
      {
        action: 'SUBMIT_BUDGET_ALLOCATION',
        entityType: 'BudgetAllocation',
        entityId: id,
        oldValue: allocation,
        newValue: updated,
      },
      user,
    );

    return updated;
  }

  // async approveAllocation(
  //   id: string,
  //   user: JwtPayload,
  // ): Promise<BudgetAllocation> {
  //   // ⚠️ DEPRECATED: Duyệt phải thông qua ApprovalWorkflow (Approval Module)
  //   // Endpoint này chỉ là fallback khi không có workflow được tạo
  //   // Flow đúng: submitAllocation() → initiateWorkflow() → handleAction() (approval) → updateSourceDocumentStatus()

  //   // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  //   const allocation = (await this.findAllocationOne(id)) as any;

  //   if (allocation.status !== BudgetAllocationStatus.SUBMITTED) {
  //     throw new BadRequestException(
  //       'Chỉ có thể duyệt ngân sách đang ở trạng thái Đã gửi.',
  //     );
  //   }

  //   // Kiểm tra xem có ApprovalWorkflow nào chưa được duyệt không
  //   const pendingApprovals = await this.prisma.approvalWorkflow.count({
  //     where: {
  //       documentType: 'BUDGET_ALLOCATION',
  //       documentId: id,
  //       status: 'PENDING',
  //     },
  //   });

  //   if (pendingApprovals > 0) {
  //     throw new BadRequestException(
  //       'Ngân sách này đang có bước duyệt chưa hoàn thiện. Vui lòng duyệt qua Approval Workflow.',
  //     );
  //   }

  //   // Tạo budgetCode nếu chưa có
  //   if (!allocation.budgetCode) {
  //     // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  //     const { budgetPeriod, department, category, costCenter } = allocation;
  //     // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  //     const deptCode = department?.code || costCenter?.code || 'ORG';
  //     // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  //     const catCode = category?.code || 'GEN';
  //     // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  //     const year = budgetPeriod.fiscalYear;
  //     let periodCode = '';

  //     switch (budgetPeriod.periodType) {
  //       case 'MONTHLY':
  //         periodCode = `M${budgetPeriod.periodNumber}`;
  //         break;
  //       case 'QUARTERLY':
  //         periodCode = `Q${budgetPeriod.periodNumber}`;
  //         break;
  //       case 'ANNUAL':
  //         periodCode = 'FY';
  //         break;
  //       case 'RESERVE':
  //         periodCode = 'RS';
  //         break;
  //       default:
  //         periodCode = `P${budgetPeriod.periodNumber}`;
  //     }

  //     const budgetCode =
  //       `BG-${deptCode}-${catCode}-${year}-${periodCode}`.toUpperCase();

  //     const updated = await this.prisma.budgetAllocation.update({
  //       where: { id },
  //       data: {
  //         status: BudgetAllocationStatus.APPROVED,
  //         approvedById: user.sub,
  //         approvedAt: new Date(),
  //         budgetCode,
  //       },
  //     });

  //     await this.auditService.create(
  //       {
  //         action: 'APPROVE_BUDGET_ALLOCATION',
  //         entityType: 'BudgetAllocation',
  //         entityId: id,
  //         // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  //         oldValue: allocation,
  //         newValue: updated,
  //       },
  //       user,
  //     );

  //     return updated;
  //   } else {
  //     // budgetCode đã được tạo bởi ApprovalWorkflow
  //     return allocation;
  //   }
  // }

  // async rejectAllocation(
  //   id: string,
  //   rejectedReason: string,
  //   user: JwtPayload,
  // ): Promise<BudgetAllocation> {
  //   const allocation = await this.findAllocationOne(id);

  //   if (allocation.status !== BudgetAllocationStatus.SUBMITTED) {
  //     throw new BadRequestException(
  //       'Chỉ có thể từ chối ngân sách đang ở trạng thái Đã gửi.',
  //     );
  //   }

  //   const updated = await this.prisma.budgetAllocation.update({
  //     where: { id },
  //     data: {
  //       status: BudgetAllocationStatus.REJECTED,
  //       rejectedReason,
  //     },
  //   });

  //   await this.auditService.create(
  //     {
  //       action: 'REJECT_BUDGET_ALLOCATION',
  //       entityType: 'BudgetAllocation',
  //       entityId: id,
  //       oldValue: allocation,
  //       newValue: updated,
  //     },
  //     user,
  //   );

  //   return updated;
  // }

  async findMyDeptAllocations(user: JwtPayload): Promise<BudgetAllocation[]> {
    if (!user.deptId) {
      throw new BadRequestException('Người dùng không thuộc phòng ban nào.');
    }

    return this.prisma.budgetAllocation.findMany({
      where: {
        orgId: user.orgId,
        deptId: user.deptId,
      },
      include: {
        budgetPeriod: true,
        costCenter: true,
        department: true,
        category: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}
