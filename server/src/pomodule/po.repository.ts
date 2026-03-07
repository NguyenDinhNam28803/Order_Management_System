import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePoDto } from './dto/create-po.dto';
import { PoStatus } from '@prisma/client';

@Injectable()
export class PoRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    data: CreatePoDto,
    buyerId: string,
    orgId: string,
    poNumber: string,
  ) {
    const { quotationId, ...poData } = data;

    // Lấy thông tin quotation để có items và tổng tiền
    const quotation = await this.prisma.rfqQuotation.findUnique({
      where: { id: quotationId },
      include: { items: true },
    });

    if (!quotation) {
      throw new Error('Quotation not found');
    }

    return this.prisma.$transaction(async (tx) => {
      const po = await tx.purchaseOrder.create({
        data: {
          ...poData,
          quotationId,
          poNumber,
          buyerId,
          orgId,
          totalAmount: quotation.totalPrice,
          currency: quotation.currency,
          status: PoStatus.DRAFT,
          items: {
            create: quotation.items.map((item, index) => ({
              quotationItemId: item.id,
              lineNumber: index + 1,
              description: item.notes || 'Product from quotation',
              qty: item.qtyOffered || 0,
              unitPrice: item.unitPrice,
              total: (item.qtyOffered as any) * (item.unitPrice as any),
            })),
          },
        },
      });

      // Cập nhật trạng thái Quotation sang ACCEPTED
      await tx.rfqQuotation.update({
        where: { id: quotationId },
        data: { status: 'ACCEPTED' as any },
      });

      // Cập nhật RFQ status sang AWARDED
      if (data.rfqId) {
        await tx.rfqRequest.update({
          where: { id: data.rfqId },
          data: {
            status: 'AWARDED' as any,
            awardedSupplierId: data.supplierId,
            awardedAt: new Date(),
          },
        });
      }

      // Cập nhật PR status sang PO_CREATED
      if (data.prId) {
        await tx.purchaseRequisition.update({
          where: { id: data.prId },
          data: { status: 'PO_CREATED' as any },
        });
      }

      return po;
    });
  }

  async findAll(orgId: string) {
    return this.prisma.purchaseOrder.findMany({
      where: { orgId },
      include: { supplier: true, buyer: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    return this.prisma.purchaseOrder.findUnique({
      where: { id },
      include: {
        items: true,
        supplier: true,
        buyer: true,
        pr: true,
        rfq: true,
        quotation: true,
      },
    });
  }
}
