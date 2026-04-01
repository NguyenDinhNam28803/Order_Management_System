import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PoRepository } from './po.repository';
import { CreatePoDto } from './dto/create-po.dto';
import { JwtPayload } from '../auth-module/interfaces/jwt-payload.interface';
import { PoStatus, CurrencyCode, DocumentType } from '@prisma/client';
import { ApprovalModuleService } from '../approval-module/approval-module.service';
import { SupplierKpimoduleService } from '../supplier-kpimodule/supplier-kpimodule.service';

@Injectable()
export class PomoduleService {
  constructor(
    private readonly repository: PoRepository,
    private readonly prisma: PrismaService,
    private readonly approvalService: ApprovalModuleService,
    private readonly supplierKpiService: SupplierKpimoduleService,
  ) {}

  async create(createPoDto: CreatePoDto, user: JwtPayload) {
    const { orgId, deptId, costCenterId, totalAmount, currency } = createPoDto;

    if (deptId && costCenterId) {
      const budget = await this.prisma.budgetAllocation.findFirst({
        where: {
          orgId: orgId,
          deptId: deptId,
          costCenterId: costCenterId,
          currency: currency as CurrencyCode,
        },
      });

      if (budget) {
        const availableAmount =
          Number(budget.allocatedAmount) - Number(budget.spentAmount);
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

  async submit(id: string) {
    const po = await this.prisma.purchaseOrder.findUnique({
      where: { id },
    });

    if (!po) throw new NotFoundException('PO not found');
    if (po.status !== PoStatus.DRAFT) {
      throw new BadRequestException('Only draft POs can be submitted');
    }

    // 2. Kích hoạt luồng duyệt (Multi-level Approval)
    await this.approvalService.initiateWorkflow({
      docType: DocumentType.PURCHASE_ORDER,
      docId: po.id,
      totalAmount: Number(po.totalAmount),
      orgId: po.orgId,
      requesterId: po.buyerId,
    });

    return this.findOne(id);
  }

  async resetPoStatus(poId: string) {
    return this.repository.resetPoStatus(poId);
  }

  /**
   * Nhà cung cấp chấp nhận PO
   * Kích hoạt đánh giá AI và chuẩn bị luồng nhận hàng
   */
  async confirmPo(poId: string) {
    const po = await this.prisma.purchaseOrder.findUnique({
      where: { id: poId },
    });
    if (!po) throw new NotFoundException('PO not found');

    // 1. Cập nhật trạng thái PO sang CONFIRMED
    const updatedPo = await this.repository.confirmPoFromSupplier(poId);

    // 2. Tích hợp AI: Tự động đánh giá hiệu năng/rủi ro nhà cung cấp ngay khi họ chấp nhận đơn
    // (Giúp Buyer biết được mức độ tin cậy thực tế dựa trên các đơn hàng trước đó)
    try {
      await this.supplierKpiService.evaluateSupplierPerformance(
        po.supplierId,
        po.orgId,
      );
      console.log(`AI Evaluation completed for supplier ${po.supplierId}`);
    } catch (aiError) {
      console.error('AI Evaluation failed, continuing flow:', aiError);
    }

    // 3. (Optional) Tự động cập nhật trạng thái PR liên quan nếu cần
    if (po.prId) {
      await this.prisma.purchaseRequisition.update({
        where: { id: po.prId },
        data: { status: 'PO_CREATED' },
      });
    }

    return updatedPo;
  }

  async rejectPo(poId: string) {
    const po = await this.prisma.purchaseOrder.findUnique({
      where: { id: poId },
    });
    if (!po) throw new NotFoundException('PO not found');
    return this.repository.rejectPoFromSupplier(poId);
  }

  async updateStatus(id: string, status: PoStatus) {
    const po = await this.prisma.purchaseOrder.findUnique({ where: { id } });
    if (!po) throw new NotFoundException('PO not found');

    return this.prisma.$transaction(async (tx) => {
      // Nếu PO bị hủy hoặc bị từ chối, giải phóng ngân sách đã cam kết (Committed)
      const isReleasingStatus =
        status === PoStatus.CANCELLED || status === PoStatus.REJECTED;
      const wasActiveStatus =
        po.status !== PoStatus.CANCELLED && po.status !== PoStatus.REJECTED;

      if (isReleasingStatus && wasActiveStatus) {
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
