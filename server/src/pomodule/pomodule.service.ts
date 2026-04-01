import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PoRepository } from './po.repository';
import { CreatePoDto } from './dto/create-po.dto';
import { JwtPayload } from '../auth-module/interfaces/jwt-payload.interface';
import { PoStatus, PrStatus, DocumentType } from '@prisma/client';
import { ApprovalModuleService } from '../approval-module/approval-module.service';
import { SupplierKpimoduleService } from '../supplier-kpimodule/supplier-kpimodule.service';
import { BudgetModuleService } from '../budget-module/budget-module.service';

@Injectable()
export class PomoduleService {
  constructor(
    private readonly repository: PoRepository,
    private readonly prisma: PrismaService,
    private readonly approvalService: ApprovalModuleService,
    private readonly supplierKpiService: SupplierKpimoduleService,
    private readonly budgetService: BudgetModuleService,
  ) {}

  async create(createPoDto: CreatePoDto, user: JwtPayload) {
    const { orgId, costCenterId, totalAmount } = createPoDto;

    // 1. Giữ chỗ ngân sách (Budget Reservation) sử dụng BudgetService tập trung
    if (costCenterId) {
      await this.budgetService.reserveBudget(
        costCenterId,
        orgId,
        Number(totalAmount),
        user,
      );
    }

    const poNumber = `PO-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
    return this.repository.create(createPoDto, user.sub, orgId, poNumber);
  }

  /**
   * Tạo PO từ một PR đã được duyệt hoàn toàn
   * @param prId ID của Purchase Requisition
   * @param supplierId ID của Nhà cung cấp được chọn
   * @param user Thông tin người thực hiện (Procurement/Buyer)
   */
  async createFromPr(prId: string, supplierId: string, user: JwtPayload) {
    // 1. Kiểm tra PR
    const pr = await this.prisma.purchaseRequisition.findUnique({
      where: { id: prId },
      include: { items: true },
    });

    if (!pr) throw new NotFoundException('Không tìm thấy yêu cầu mua sắm (PR)');
    if (pr.status !== 'APPROVED') {
      throw new BadRequestException(
        'Chỉ có thể tạo PO từ PR đã được duyệt hoàn toàn.',
      );
    }

    // 2. Chuẩn bị dữ liệu PO từ PR
    const poNumber = `PO-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

    const po = await this.prisma.$transaction(async (tx) => {
      // A. Tạo PO
      const newPo = await tx.purchaseOrder.create({
        data: {
          poNumber,
          orgId: pr.orgId,
          prId: pr.id,
          supplierId: supplierId,
          buyerId: user.sub,
          deptId: pr.deptId,
          costCenterId: pr.costCenterId,
          status: PoStatus.DRAFT,
          totalAmount: pr.totalEstimate,
          currency: pr.currency,
          deliveryDate:
            pr.requiredDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        },
      });

      // B. Copy các item từ PR sang PO
      for (const item of pr.items) {
        await tx.poItem.create({
          data: {
            poId: newPo.id,
            prItemId: item.id,
            lineNumber: item.lineNumber,
            sku: item.sku,
            description: item.productDesc,
            qty: item.qty,
            unit: item.unit,
            unitPrice: item.estimatedPrice,
            total: Number(item.qty) * Number(item.estimatedPrice),
          },
        });
      }

      // C. Cập nhật trạng thái PR
      await tx.purchaseRequisition.update({
        where: { id: pr.id },
        data: { status: 'PO_CREATED' as PrStatus },
      });

      return newPo;
    });

    return po;
  }

  async submit(id: string) {
    const po = await this.prisma.purchaseOrder.findUnique({
      where: { id },
    });

    if (!po) throw new NotFoundException('PO not found');
    if (po.status !== PoStatus.DRAFT) {
      throw new BadRequestException('Only draft POs can be submitted');
    }

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

  async confirmPo(poId: string) {
    const po = await this.prisma.purchaseOrder.findUnique({
      where: { id: poId },
    });
    if (!po) throw new NotFoundException('PO not found');

    const updatedPo = await this.repository.confirmPoFromSupplier(poId);

    try {
      await this.supplierKpiService.evaluateSupplierPerformance(
        po.supplierId,
        po.orgId,
      );
    } catch (aiError) {
      console.error('AI Evaluation failed, continuing flow:', aiError);
    }

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
      const isReleasingStatus =
        status === PoStatus.CANCELLED || status === PoStatus.REJECTED;
      const wasActiveStatus =
        po.status !== PoStatus.CANCELLED && po.status !== PoStatus.REJECTED;

      if (isReleasingStatus && wasActiveStatus) {
        if (po.costCenterId) {
          // Using a generic budget release if needed, or keeping existing logic
          // For now, keeping it simple to avoid breaking changes
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
