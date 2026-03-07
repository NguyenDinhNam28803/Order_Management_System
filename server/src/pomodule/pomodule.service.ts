import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PoRepository } from './po.repository';
import { CreatePoDto } from './dto/create-po.dto';
import { JwtPayload } from '../auth-module/interfaces/jwt-payload.interface';
import { PoStatus, CurrencyCode } from '@prisma/client';

@Injectable()
export class PomoduleService {
  constructor(
    private readonly repository: PoRepository,
    private readonly prisma: PrismaService,
  ) {}

  async create(createPoDto: CreatePoDto, user: JwtPayload) {
    const { orgId, deptId, costCenterId, totalAmount, currency } = createPoDto;

    if (deptId && costCenterId) {
      const budget = await this.prisma.budgetAllocation.findFirst({
        where: {
          orgId,
          deptId,
          costCenterId,
          currency: currency as CurrencyCode,
        },
      });

      if (budget) {
        const availableAmount = Number(budget.allocatedAmount) - Number(budget.spentAmount);
        if (Number(totalAmount) > availableAmount) {
          throw new BadRequestException(
            `Vượt quá ngân sách! Còn lại: ${availableAmount} ${currency}. Yêu cầu: ${totalAmount}`,
          );
        }

        await this.prisma.budgetAllocation.update({
          where: { id: budget.id },
          data: { committedAmount: { increment: totalAmount } },
        });
      }
    }

    const poNumber = `PO-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
    return this.repository.create(createPoDto, user.sub, orgId, poNumber);
  }

  async updateStatus(id: string, status: PoStatus) {
    const po = await this.prisma.purchaseOrder.findUnique({ where: { id } });
    if (!po) throw new NotFoundException('PO not found');

    return this.prisma.\$transaction(async (tx) => {
      // Nếu PO bị hủy, giải phóng ngân sách đã cam kết (Committed)
      if (status === PoStatus.CANCELLED && po.status !== PoStatus.CANCELLED) {
        if (po.deptId && po.costCenterId) {
          const budget = await tx.budgetAllocation.findFirst({
            where: {
              orgId: po.orgId,
              deptId: po.deptId,
              costCenterId: po.costCenterId,
              currency: po.currency,
            },
          });

          if (budget) {
            await tx.budgetAllocation.update({
              where: { id: budget.id },
              data: { committedAmount: { decrement: po.totalAmount } },
            });
          }
        }
      }

      return tx.purchaseOrder.update({
        where: { id },
        data: { status },
      });
    });
  }

  async findAll(orgId: string) {
    return this.repository.findAll(orgId);
  }

  async findOne(id: string) {
    return this.repository.findOne(id);
  }
}
