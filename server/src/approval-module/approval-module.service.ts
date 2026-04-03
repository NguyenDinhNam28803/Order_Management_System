import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AutomationService } from '../common/automation/automation.service';
import {
  DocumentType,
  ApprovalStatus,
  UserRole,
  PrStatus,
  PoStatus,
  GrnStatus,
  InvoiceStatus,
  PaymentStatus,
} from '@prisma/client';
import { BudgetModuleService } from '../budget-module/budget-module.service';
import { JwtPayload } from '../auth-module/interfaces/jwt-payload.interface';
import { UserModuleService } from '../user-module/user-module.service';

@Injectable()
export class ApprovalModuleService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly automationService: AutomationService,
    private readonly budgetService: BudgetModuleService,
    private readonly userService: UserModuleService,
  ) {}

  /**
   * 1. Khởi tạo luồng duyệt (Initiate Workflow)
   */
  async initiateWorkflow(params: {
    docType: DocumentType;
    docId: string;
    totalAmount: number;
    orgId: string;
    requesterId: string;
    user?: JwtPayload;
  }) {
    const { docType, docId, totalAmount, orgId, requesterId, user } = params;

    const rules = await this.prisma.approvalMatrixRule.findMany({
      where: {
        orgId,
        documentType: docType,
        minTotalAmount: { lte: totalAmount },
        isActive: true,
      },
      orderBy: { level: 'asc' },
    });

    if (rules.length === 0) {
      console.log(`No rules found for ${docType} ${docId}. Auto-approving...`);
      await this.updateSourceDocumentStatus(docType, docId, 'APPROVED', user);
      return { message: 'No rules found. Document auto-approved.' };
    }

    const workflowData: any[] = [];
    let allAutoApproved = true;

    for (const rule of rules) {
      const originalApproverId = await this.resolveApproverId(
        rule.approverRole,
        requesterId,
        orgId,
      );

      if (!originalApproverId) {
        throw new NotFoundException(
          `Không tìm thấy người duyệt có vai trò ${rule.approverRole} trong tổ chức.`,
        );
      }

      const delegateId =
        await this.userService.getActiveDelegate(originalApproverId);
      const approverId = delegateId ? delegateId : originalApproverId;
      const delegatedFromId = delegateId ? originalApproverId : null;

      // Tự động duyệt nếu người yêu cầu chính là người duyệt
      const isAutoApproved = approverId === requesterId;
      if (!isAutoApproved) {
        allAutoApproved = false;
      }

      workflowData.push({
        documentType: docType,
        documentId: docId,
        step: rule.level,
        approverId: approverId,
        delegatedFromId: delegatedFromId,
        status: isAutoApproved
          ? ApprovalStatus.APPROVED
          : ApprovalStatus.PENDING,
        actionedAt: isAutoApproved ? new Date() : null,
        comment: isAutoApproved
          ? 'Hệ thống tự động duyệt (Người yêu cầu là người duyệt)'
          : null,
        dueAt: new Date(Date.now() + rule.slaHours * 60 * 60 * 1000),
      });
    }

    await this.prisma.approvalWorkflow.createMany({
      data: workflowData,
    });

    const finalStatus = allAutoApproved ? 'APPROVED' : 'PENDING_APPROVAL';
    await this.updateSourceDocumentStatus(docType, docId, finalStatus, user);

    return {
      message: allAutoApproved
        ? 'Workflow auto-approved'
        : 'Workflow initiated successfully',
      stepsCreated: workflowData.length,
      allAutoApproved,
    };
  }

  /**
   * 2. Xử lý hành động duyệt (Approve/Reject)
   */
  async handleAction(
    workflowId: string,
    user: JwtPayload,
    action: 'APPROVE' | 'REJECT',
    comment?: string,
  ) {
    const userId = user.sub;
    const currentStep = await this.prisma.approvalWorkflow.findUnique({
      where: { id: workflowId },
    });

    if (!currentStep)
      throw new NotFoundException('Không tìm thấy bước duyệt này.');
    if (currentStep.approverId !== userId) {
      throw new BadRequestException('Bạn không có quyền duyệt bước này.');
    }
    if (currentStep.status !== ApprovalStatus.PENDING) {
      throw new BadRequestException('Bước duyệt này đã được xử lý trước đó.');
    }

    const newStatus =
      action === 'APPROVE' ? ApprovalStatus.APPROVED : ApprovalStatus.REJECTED;

    await this.prisma.approvalWorkflow.update({
      where: { id: workflowId },
      data: {
        status: newStatus,
        actionedAt: new Date(),
        comment,
      },
    });

    if (action === 'REJECT') {
      await this.updateSourceDocumentStatus(
        currentStep.documentType,
        currentStep.documentId,
        'REJECTED',
        user,
      );
      return { status: 'REJECTED', message: 'Tài liệu đã bị từ chối.' };
    }

    const remainingSteps = await this.prisma.approvalWorkflow.findMany({
      where: {
        documentType: currentStep.documentType,
        documentId: currentStep.documentId,
        status: ApprovalStatus.PENDING,
        step: { gt: currentStep.step },
      },
      orderBy: { step: 'asc' },
    });

    if (remainingSteps.length === 0) {
      await this.updateSourceDocumentStatus(
        currentStep.documentType,
        currentStep.documentId,
        'APPROVED',
        user,
      );
      return {
        status: 'FULLY_APPROVED',
        message: 'Tài liệu đã được duyệt hoàn toàn.',
      };
    } else {
      return {
        status: 'PARTIALLY_APPROVED',
        message: 'Đã duyệt cấp hiện tại, đang chờ cấp tiếp theo.',
      };
    }
  }

  private async resolveApproverId(
    role: UserRole,
    requesterId: string,
    orgId: string,
  ): Promise<string | null> {
    if (role === UserRole.DEPT_APPROVER) {
      const requester = await this.prisma.user.findUnique({
        where: { id: requesterId },
        include: { department: true },
      });
      return requester?.department?.headUserId || null;
    }

    const user = await this.prisma.user.findFirst({
      where: {
        orgId,
        role: role,
        isActive: true,
      },
    });

    return user?.id || null;
  }

  /**
   * Helper: Cập nhật trạng thái của tài liệu nguồn (PR, PO, GRN, v.v.)
   * Đảm bảo khớp hoàn toàn với Enum trong schema.prisma
   */
  private async updateSourceDocumentStatus(
    type: DocumentType,
    id: string,
    actionStatus: 'APPROVED' | 'REJECTED' | 'PENDING_APPROVAL',
    user?: JwtPayload,
  ) {
    switch (type) {
      case DocumentType.PURCHASE_REQUISITION: {
        let status: PrStatus = PrStatus.PENDING_APPROVAL;
        if (actionStatus === 'APPROVED') status = PrStatus.APPROVED;
        if (actionStatus === 'REJECTED') status = PrStatus.REJECTED;

        const pr = await this.prisma.purchaseRequisition.findUnique({
          where: { id },
        });

        if (
          pr &&
          actionStatus === 'REJECTED' &&
          pr.status !== PrStatus.REJECTED &&
          user
        ) {
          if (pr.costCenterId) {
            await this.budgetService.releaseBudget(
              pr.costCenterId,
              pr.orgId,
              Number(pr.totalEstimate),
              user,
            );
          }
        }

        await this.prisma.purchaseRequisition.update({
          where: { id },
          data: {
            status,
            approvedAt: actionStatus === 'APPROVED' ? new Date() : undefined,
          },
        });
        break;
      }

      case DocumentType.PURCHASE_ORDER: {
        let status: PoStatus = PoStatus.PENDING_APPROVAL;
        if (actionStatus === 'APPROVED') status = PoStatus.APPROVED;
        if (actionStatus === 'REJECTED') status = PoStatus.REJECTED;

        const po = await this.prisma.purchaseOrder.findUnique({
          where: { id },
        });
        if (
          po &&
          actionStatus === 'REJECTED' &&
          po.status !== PoStatus.REJECTED &&
          user
        ) {
          if (po.costCenterId) {
            await this.budgetService.releaseBudget(
              po.costCenterId,
              po.orgId,
              Number(po.totalAmount),
              user,
            );
          }
        }

        await this.prisma.purchaseOrder.update({
          where: { id },
          data: { status },
        });
        break;
      }

      case DocumentType.GRN: {
        let status: GrnStatus = GrnStatus.DRAFT; // Default
        if (actionStatus === 'APPROVED') status = GrnStatus.CONFIRMED;
        if (actionStatus === 'REJECTED') status = GrnStatus.DISPUTED;
        if (actionStatus === 'PENDING_APPROVAL')
          status = GrnStatus.UNDER_REVIEW;

        await this.prisma.goodsReceipt.update({
          where: { id },
          data: { status },
        });
        break;
      }

      case DocumentType.SUPPLIER_INVOICE: {
        let status: InvoiceStatus = InvoiceStatus.SUBMITTED;
        if (actionStatus === 'APPROVED')
          status = InvoiceStatus.PAYMENT_APPROVED;
        if (actionStatus === 'REJECTED') status = InvoiceStatus.REJECTED;

        await this.prisma.supplierInvoice.update({
          where: { id },
          data: {
            status,
            approvedAt: actionStatus === 'APPROVED' ? new Date() : undefined,
          },
        });
        break;
      }

      case DocumentType.PAYMENT: {
        let status: PaymentStatus = PaymentStatus.PENDING;
        if (actionStatus === 'APPROVED') status = PaymentStatus.COMPLETED;
        if (actionStatus === 'REJECTED') status = PaymentStatus.FAILED;

        await this.prisma.payment.update({
          where: { id },
          data: {
            status,
            approvedAt: actionStatus === 'APPROVED' ? new Date() : undefined,
          },
        });
        break;
      }
    }

    if (actionStatus === 'APPROVED') {
      void this.automationService.handleDocumentApproved(type, id);
    }
  }

  async getMyPendingApprovals(userId: string) {
    return this.prisma.approvalWorkflow.findMany({
      where: {
        approverId: userId,
        status: ApprovalStatus.PENDING,
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}
