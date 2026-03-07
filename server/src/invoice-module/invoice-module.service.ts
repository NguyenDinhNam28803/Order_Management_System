import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { InvoiceStatus } from '@prisma/client';

@Injectable()
export class InvoiceModuleService {
  constructor(private readonly prisma: PrismaService) {}

  async markAsPaid(id: string) {
    const invoice = await this.prisma.supplierInvoice.findUnique({
      where: { id },
      include: { po: true },
    });

    if (!invoice) throw new NotFoundException('Hóa đơn không tồn tại');
    if (invoice.status === InvoiceStatus.PAID) {
      throw new BadRequestException('Hóa đơn này đã được thanh toán trước đó');
    }

    return this.prisma.\$transaction(async (tx) => {
      // 1. Cập nhật trạng thái hóa đơn
      const updatedInvoice = await tx.supplierInvoice.update({
        where: { id },
        data: {
          status: InvoiceStatus.PAID,
          paidAt: new Date(),
        },
      });

      // 2. Chuyển ngân sách từ Committed sang Spent
      if (invoice.po.deptId && invoice.po.costCenterId) {
        const budget = await tx.budgetAllocation.findFirst({
          where: {
            orgId: invoice.po.orgId,
            deptId: invoice.po.deptId,
            costCenterId: invoice.po.costCenterId,
            currency: invoice.po.currency,
          },
        });

        if (budget) {
          await tx.budgetAllocation.update({
            where: { id: budget.id },
            data: {
              committedAmount: { decrement: invoice.totalAmount },
              spentAmount: { increment: invoice.totalAmount },
            },
          });
        }
      }

      return updatedInvoice;
    });
  }

  async findAll(orgId: string) {
    return this.prisma.supplierInvoice.findMany({
      where: { orgId },
      include: { po: true, supplier: true },
    });
  }

  async findOne(id: string) {
    return this.prisma.supplierInvoice.findUnique({
      where: { id },
      include: { po: true, supplier: true, items: true },
    });
  }
}
