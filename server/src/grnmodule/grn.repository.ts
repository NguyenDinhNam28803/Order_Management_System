import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateGrnmoduleDto } from './dto/create-grnmodule.dto';
import { GrnStatus, QcResult } from '@prisma/client';
import { UpdateGrnItemQcResultDto } from './dto/update-grn-item-qc.dto';

@Injectable()
export class GrnRepository {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Create GRN with transaction (Header + Items)
   */
  async create(
    data: CreateGrnmoduleDto,
    grnNumber: string,
    orgId: string,
    receivedById: string,
  ) {
    const { items, ...headerData } = data;

    return this.prisma.$transaction(async (tx) => {
      // 1. Create Header
      const grn = await tx.goodsReceipt.create({
        data: {
          ...headerData,
          grnNumber,
          orgId,
          receivedById,
          status: GrnStatus.INSPECTING, // Default to Inspecting upon creation
          items: {
            create: items.map((item) => ({
              poItemId: item.poItemId,
              receivedQty: item.receivedQty,
              acceptedQty: item.receivedQty, // Default accepted = received, QC will adjust later
              rejectedQty: 0,
              qcResult: QcResult.PENDING,
              batchNumber: item.batchNumber,
              expiryDate: item.expiryDate,
              storageLocation: item.storageLocation,
            })),
          },
        },
        include: { items: true },
      });

      return grn;
    });
  }

  async findAll(orgId: string) {
    return this.prisma.goodsReceipt.findMany({
      where: { orgId },
      include: {
        po: {
          select: { poNumber: true, supplier: { select: { name: true } } },
        },
        receivedBy: { select: { fullName: true } },
        items: true, // Include items for 3-way matching
        _count: { select: { items: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    return this.prisma.goodsReceipt.findUnique({
      where: { id },
      include: {
        items: {
          include: {
            poItem: {
              select: {
                sku: true,
                description: true,
                unit: true,
                qty: true, // Ordered Qty
              },
            },
          },
        },
        po: true,
        receivedBy: true,
        inspectedBy: true,
        confirmedBy: true,
        warehouse: true,
      },
    });
  }

  async findByPoId(poId: string) {
    return this.prisma.goodsReceipt.findMany({
      where: { poId },
      include: { items: true },
    });
  }

  async updateStatus(id: string, status: GrnStatus, userId?: string) {
    const data: any = { status };
    if (status === GrnStatus.INSPECTION_DONE) {
      data.inspectionCompletedAt = new Date();
      if (userId) data.inspectedById = userId;
    } else if (status === GrnStatus.CONFIRMED) {
      data.confirmedAt = new Date();
      if (userId) data.confirmedById = userId;
    }

    return this.prisma.goodsReceipt.update({
      where: { id },
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      data,
    });
  }

  async updateItemQc(itemId: string, dto: UpdateGrnItemQcResultDto) {
    return this.prisma.grnItem.update({
      where: { id: itemId },
      data: {
        qcResult: dto.qcResult,
        acceptedQty: dto.acceptedQty,
        rejectedQty: dto.rejectedQty,
        rejectionReason: dto.rejectionReason,
        qcNotes: dto.qcNotes,
      },
    });
  }

  async delete(id: string) {
    return this.prisma.goodsReceipt.delete({ where: { id } });
  }
}
