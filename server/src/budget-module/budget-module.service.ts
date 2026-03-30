import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateBudgetAllocationDto,
  CreateBudgetPeriodDto,
  UpdateBudgetAllocationDto,
  UpdateBudgetPeriodDto,
} from './dto/budget.dto';
import {
  BudgetAllocation,
  BudgetPeriod,
  BudgetPeriodType,
} from '@prisma/client';
import { JwtPayload } from '../auth-module/interfaces/jwt-payload.interface';

@Injectable()
export class BudgetModuleService {
  constructor(private readonly prisma: PrismaService) {}

  // Budget Period
  async createPeriod(
    dto: CreateBudgetPeriodDto,
    user: JwtPayload,
  ): Promise<BudgetPeriod> {
    return this.prisma.budgetPeriod.create({
      data: {
        ...dto,
        orgId: user.orgId,
      },
    });
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
  ): Promise<BudgetPeriod> {
    return this.prisma.budgetPeriod.update({
      where: { id },
      data: dto,
    });
  }

  async removePeriod(id: string): Promise<BudgetPeriod> {
    return this.prisma.budgetPeriod.delete({
      where: { id },
    });
  }

  // Budget Allocation
  async createAllocation(
    dto: CreateBudgetAllocationDto,
    user: JwtPayload,
  ): Promise<BudgetAllocation> {
    return this.prisma.budgetAllocation.create({
      data: {
        ...dto,
        orgId: user.orgId,
        createdById: user.sub,
      },
    });
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

  async findAllocationOne(id: string): Promise<BudgetAllocation> {
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

    return allocation;
  }

  async updateAllocation(
    id: string,
    dto: UpdateBudgetAllocationDto,
  ): Promise<BudgetAllocation> {
    await this.findAllocationOne(id);
    return this.prisma.budgetAllocation.update({
      where: { id },
      data: dto,
    });
  }

  async removeAllocation(id: string): Promise<BudgetAllocation> {
    await this.findAllocationOne(id);
    return this.prisma.budgetAllocation.delete({
      where: { id },
    });
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

    // 1. Đảm bảo có BudgetPeriod cho Reserve và 4 Quý
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
      const allocation = await this.prisma.budgetAllocation.upsert({
        where: {
          budgetPeriodId_costCenterId: {
            budgetPeriodId: p.periodId,
            costCenterId: costCenterId,
          },
        },
        update: {
          allocatedAmount: p.amount,
          notes: p.notes,
        },
        create: {
          orgId: user.orgId,
          budgetPeriodId: p.periodId,
          costCenterId: costCenterId,
          allocatedAmount: p.amount,
          currency: costCenter.currency,
          notes: p.notes,
          createdById: user.sub,
        },
      });
      results.push(allocation);
    }

    return results;
  }

  // Trích tiền từ quỹ dự phòng nếu ngân sách quý hiện tại hết
  async checkAndPullFromReserve(
    costCenterId: string,
    orgId: string,
    fiscalYear: number,
    quarter: number,
    neededAmount: number,
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

    const currentAlloc = await this.prisma.budgetAllocation.findUnique({
      where: {
        budgetPeriodId_costCenterId: {
          budgetPeriodId: currentPeriod.id,
          costCenterId,
        },
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

    const reserveAlloc = await this.prisma.budgetAllocation.findUnique({
      where: {
        budgetPeriodId_costCenterId: {
          budgetPeriodId: reservePeriod.id,
          costCenterId,
        },
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
    return this.prisma.$transaction(async (tx) => {
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
  }

  // Kết thúc quý: Chuyển tiền thừa vào quỹ dự phòng
  async reconcileQuarterToReserve(
    costCenterId: string,
    orgId: string,
    fiscalYear: number,
    quarter: number,
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

    const currentAlloc = await this.prisma.budgetAllocation.findUnique({
      where: {
        budgetPeriodId_costCenterId: {
          budgetPeriodId: currentPeriod.id,
          costCenterId,
        },
      },
    });

    if (!currentAlloc) return null;

    const surplus =
      Number(currentAlloc.allocatedAmount) -
      Number(currentAlloc.committedAmount) -
      Number(currentAlloc.spentAmount);

    if (surplus <= 0) return currentAlloc;

    const reservePeriod = await this.prisma.budgetPeriod.findFirst({
      where: { orgId, fiscalYear, periodType: 'RESERVE' },
    });

    if (!reservePeriod) return currentAlloc;

    const reserveAlloc = await this.prisma.budgetAllocation.findUnique({
      where: {
        budgetPeriodId_costCenterId: {
          budgetPeriodId: reservePeriod.id,
          costCenterId,
        },
      },
    });

    if (!reserveAlloc) return currentAlloc;

    return this.prisma.$transaction(async (tx) => {
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
  }
}
