import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePrDto } from './dto/create-pr.dto';
import { PrStatus, PurchaseRequisition } from '@prisma/client';
import { AiService } from 'src/ai-service/ai-service.service';

@Injectable()
export class PrRepository {
  constructor(
    private readonly prisma: PrismaService,
    private readonly aiservice: AiService,
  ) {}

  async create(
    data: CreatePrDto,
    requesterId: string,
    orgId: string,
    deptId: string,
    prNumber: string,
  ) {
    const { items, ...prData } = data;

    // Tính toán tổng ước tính
    const totalEstimate = items.reduce(
      (sum, item) => sum + item.qty * item.estimatedPrice,
      0,
    );

    return this.prisma.$transaction(async (tx) => {
      const pr = await tx.purchaseRequisition.create({
        data: {
          ...prData,
          prNumber,
          requesterId,
          orgId,
          deptId,
          totalEstimate,
          status: PrStatus.DRAFT,
          items: {
            create: items.map((item, index) => ({
              ...item,
              lineNumber: index + 1,
            })),
          },
        },
        include: { items: true },
      });
      return pr;
    });
  }

  async findAll(orgId: string): Promise<PurchaseRequisition[]> {
    return this.prisma.purchaseRequisition.findMany({
      where: { orgId },
      include: { requester: true, department: true, items: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string): Promise<any> {
    return this.prisma.purchaseRequisition.findUnique({
      where: { id },
      include: {
        items: true,
        requester: true,
        department: true,
        costCenter: true,
        procurement: true,
      },
    });
  }

  async updateStatus(
    id: string,
    status: PrStatus,
  ): Promise<PurchaseRequisition> {
    return this.prisma.purchaseRequisition.update({
      where: { id },
      data: { status },
    });
  }

  async findByRequester(requesterId: string): Promise<PurchaseRequisition[]> {
    return this.prisma.purchaseRequisition.findMany({
      where: { requesterId },
      include: { items: true, requester: true, department: true },
      orderBy: { createdAt: 'desc' },
    });
  }
}
