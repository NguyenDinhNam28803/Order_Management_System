import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateBudgetAllocationDto,
  CreateBudgetPeriodDto,
  UpdateBudgetAllocationDto,
  UpdateBudgetPeriodDto,
} from './dto/budget.dto';
import { BudgetAllocation, BudgetPeriod } from '@prisma/client';
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
}
