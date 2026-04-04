import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { JwtPayload } from '../auth-module/interfaces/jwt-payload.interface';
import { BudgetOverrideStatus } from '@prisma/client';
import { AuditModuleService } from '../audit-module/audit-module.service';

@Injectable()
export class BudgetOverrideService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditModuleService,
  ) {}

  async createRequest(
    data: {
      budgetAllocId: string;
      prId: string;
      overrideAmount: number;
      reason: string;
    },
    user: JwtPayload,
  ) {
    const request = await this.prisma.budgetOverrideRequest.create({
      data: {
        budgetAllocId: data.budgetAllocId,
        prId: data.prId,
        requestedById: user.sub,
        overrideAmount: data.overrideAmount,
        reason: data.reason,
        status: BudgetOverrideStatus.PENDING,
      },
      include: {
        budgetAlloc: true,
        requestedBy: { select: { fullName: true, email: true } },
      },
    });

    await this.auditService.create(
      {
        action: 'CREATE_BUDGET_OVERRIDE_REQUEST',
        entityType: 'BudgetOverrideRequest',
        entityId: request.id,
        newValue: request,
      },
      user,
    );

    return request;
  }

  async findByOrg(user: JwtPayload) {
    return this.prisma.budgetOverrideRequest.findMany({
      where: {
        budgetAlloc: { orgId: user.orgId },
      },
      include: {
        budgetAlloc: { include: { budgetPeriod: true, costCenter: true } },
        requestedBy: { select: { fullName: true, email: true } },
        approvedBy: { select: { fullName: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const request = await this.prisma.budgetOverrideRequest.findUnique({
      where: { id },
      include: {
        budgetAlloc: { include: { budgetPeriod: true, costCenter: true } },
        requestedBy: { select: { fullName: true, email: true } },
        approvedBy: { select: { fullName: true, email: true } },
      },
    });

    if (!request) {
      throw new NotFoundException(`Override request with ID ${id} not found`);
    }

    return request;
  }

  async approveRequest(id: string, user: JwtPayload) {
    const request = await this.findOne(id);

    if (request.status !== BudgetOverrideStatus.PENDING) {
      throw new BadRequestException(
        'Chỉ có thể duyệt yêu cầu đang ở trạng thái Chờ duyệt.',
      );
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      // 1. Approve the request
      const req = await tx.budgetOverrideRequest.update({
        where: { id },
        data: {
          status: BudgetOverrideStatus.APPROVED,
          approvedById: user.sub,
          approvedAt: new Date(),
        },
      });

      // 2. Increase the allocated amount in BudgetAllocation
      await tx.budgetAllocation.update({
        where: { id: request.budgetAllocId },
        data: {
          allocatedAmount: { increment: request.overrideAmount },
          notes:
            (request.budgetAlloc.notes || '') +
            `\n[Override Approved] Tăng ${request.overrideAmount.toString()} theo yêu cầu ${id}`,
        },
      });

      return req;
    });

    await this.auditService.create(
      {
        action: 'APPROVE_BUDGET_OVERRIDE_REQUEST',
        entityType: 'BudgetOverrideRequest',
        entityId: id,
        oldValue: request,
        newValue: updated,
      },
      user,
    );

    return updated;
  }

  async rejectRequest(id: string, reason: string, user: JwtPayload) {
    const request = await this.findOne(id);

    if (request.status !== BudgetOverrideStatus.PENDING) {
      throw new BadRequestException(
        'Chỉ có thể từ chối yêu cầu đang ở trạng thái Chờ duyệt.',
      );
    }

    const updated = await this.prisma.budgetOverrideRequest.update({
      where: { id },
      data: {
        status: BudgetOverrideStatus.REJECTED,
        approvedById: user.sub,
        approvedAt: new Date(),
        rejectedReason: reason,
      },
    });

    await this.auditService.create(
      {
        action: 'REJECT_BUDGET_OVERRIDE_REQUEST',
        entityType: 'BudgetOverrideRequest',
        entityId: id,
        oldValue: request,
        newValue: updated,
      },
      user,
    );

    return updated;
  }
}
