import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateRfqDto } from './dto/create-rfq.dto';
import { RfqStatus } from '@prisma/client';

@Injectable()
export class RfqRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    data: CreateRfqDto,
    createdById: string,
    orgId: string,
    rfqNumber: string,
  ) {
    const { prId, supplierIds, ...rfqData } = data;

    // Lấy items từ PR để copy sang RFQ
    const prItems = await this.prisma.prItem.findMany({
      where: { prId },
    });

    return this.prisma.$transaction(async (tx) => {
      const rfq = await tx.rfqRequest.create({
        data: {
          ...rfqData,
          rfqNumber,
          prId,
          createdById,
          orgId,
          status: RfqStatus.SENT,
          items: {
            create: prItems.map((item) => ({
              prItemId: item.id,
              lineNumber: item.lineNumber,
              description: item.productDesc,
              qty: item.qty,
              unit: item.unit,
              categoryId: item.categoryId,
              sku: item.sku,
            })),
          },
          suppliers: {
            create: supplierIds.map((supplierId) => ({
              supplierId,
            })),
          },
        },
        include: { items: true, suppliers: true },
      });

      // Cập nhật trạng thái PR sang IN_SOURCING
      await tx.purchaseRequisition.update({
        where: { id: prId },
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        data: { status: 'IN_SOURCING' as any },
      });

      return rfq;
    });
  }

  async findAll(orgId: string) {
    return this.prisma.rfqRequest.findMany({
      where: { orgId },
      include: { pr: true, createdBy: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    return this.prisma.rfqRequest.findUnique({
      where: { id },
      include: {
        items: true,
        suppliers: { include: { supplier: true } },
        pr: true,
        createdBy: true,
        quotations: true,
      },
    });
  }
}
