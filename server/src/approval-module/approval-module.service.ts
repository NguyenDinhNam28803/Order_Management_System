import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AutomationService } from '../common/automation/automation.service';
import { EventsGateway } from '../gateway/events.gateway';
import {
  DocumentType,
  ApprovalStatus,
  UserRole,
  PrStatus,
  PoStatus,
  GrnStatus,
  InvoiceStatus,
  PaymentStatus,
  VettingStatus,
} from '@prisma/client';
import { BudgetModuleService } from '../budget-module/budget-module.service';
import { JwtPayload } from '../auth-module/interfaces/jwt-payload.interface';
import { UserModuleService } from '../user-module/user-module.service';
import { AuditModuleService } from '../audit-module/audit-module.service';
import { NotificationModuleService } from '../notification-module/notification-module.service';

@Injectable()
export class ApprovalModuleService {
  private readonly logger = new Logger(ApprovalModuleService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly automationService: AutomationService,
    @Inject(forwardRef(() => BudgetModuleService))
    private readonly budgetService: BudgetModuleService,
    private readonly userService: UserModuleService,
    private readonly auditService: AuditModuleService,
    private readonly notificationService: NotificationModuleService,
    private readonly eventsGateway: EventsGateway,
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

    // Idempotency guard: if workflow steps already exist for this document,
    // the previous attempt created them but failed before updating status —
    // just update the status and return to avoid duplicate workflow chains.
    const existingSteps = await this.prisma.approvalWorkflow.count({
      where: { documentType: docType, documentId: docId },
    });
    if (existingSteps > 0) {
      const hasPending = await this.prisma.approvalWorkflow.count({
        where: {
          documentType: docType,
          documentId: docId,
          status: ApprovalStatus.PENDING,
        },
      });
      const retryStatus = hasPending > 0 ? 'PENDING_APPROVAL' : 'APPROVED';
      await this.updateSourceDocumentStatus(docType, docId, retryStatus, user);
      return {
        message: 'Workflow already exists, status synced',
        stepsCreated: existingSteps,
        allAutoApproved: hasPending === 0,
      };
    }

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
      this.logger.log(`No rules found for ${docType} ${docId}. Auto-approving...`);
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

    await this.prisma.approvalWorkflow.createMany({ data: workflowData });

    const finalStatus = allAutoApproved ? 'APPROVED' : 'PENDING_APPROVAL';
    try {
      await this.updateSourceDocumentStatus(docType, docId, finalStatus, user);
    } catch (err) {
      // Status update failed — roll back workflow so the idempotency guard above
      // doesn't block a clean retry on the next submit attempt.
      await this.prisma.approvalWorkflow.deleteMany({
        where: { documentType: docType, documentId: docId },
      });
      throw err;
    }

    // ── Gửi email thông báo cho từng approver chưa được tự động duyệt ────────
    if (!allAutoApproved) {
      const docLabel = this.getDocumentLabel(docType);
      for (const step of workflowData) {
        if (step.status === ApprovalStatus.PENDING) {
          void this.notifyApprover(
            step.approverId,
            docLabel,
            docId,
            totalAmount,
          );
        }
      }
    }

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
      void this.notifyRequesterOnResult(
        currentStep.documentType,
        currentStep.documentId,
        'REJECTED',
        comment,
      );
      void this.emitApprovalEvent(currentStep, 'REJECTED', user.orgId);
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
      // Thông báo cho người yêu cầu biết tài liệu đã được duyệt hoàn toàn
      void this.notifyRequesterOnResult(
        currentStep.documentType,
        currentStep.documentId,
        'APPROVED',
      );
      void this.emitApprovalEvent(currentStep, 'APPROVED', user.orgId);
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

      case DocumentType.BUDGET_ALLOCATION: {
        let status = 'SUBMITTED'; // Default
        let updateData: any = {};

        if (actionStatus === 'APPROVED') {
          status = 'APPROVED';

          // Lấy BudgetAllocation để tạo budgetCode
          const budget = await this.prisma.budgetAllocation.findUnique({
            where: { id },
            include: {
              budgetPeriod: true,
              department: true,
              category: true,
              costCenter: true,
            },
          });

          if (budget) {
            // Tạo budgetCode (giống như trong approveAllocation)
            const deptCode =
              budget.department?.code || budget.costCenter?.code || 'ORG';
            const catCode = budget.category?.code || 'GEN';
            const year = budget.budgetPeriod?.fiscalYear;
            let periodCode = '';

            switch (budget.budgetPeriod?.periodType) {
              case 'MONTHLY':
                periodCode = `M${budget.budgetPeriod?.periodNumber}`;
                break;
              case 'QUARTERLY':
                periodCode = `Q${budget.budgetPeriod?.periodNumber}`;
                break;
              case 'ANNUAL':
                periodCode = 'FY';
                break;
              case 'RESERVE':
                periodCode = 'RS';
                break;
              default:
                periodCode = `P${budget.budgetPeriod?.periodNumber}`;
            }

            const budgetCode =
              `BG-${deptCode}-${catCode}-${year}-${periodCode}`.toUpperCase();

            updateData = {
              status,
              budgetCode,
              approvedById: user?.sub,
              approvedAt: new Date(),
            };
          }
        } else if (actionStatus === 'REJECTED') {
          status = 'REJECTED';
          updateData = {
            status: ApprovalStatus.REJECTED,
          };
        } else if (actionStatus === 'PENDING_APPROVAL') {
          status = 'SUBMITTED';
          updateData = {
            status: ApprovalStatus.PENDING,
          };
        }

        await this.prisma.budgetAllocation.update({
          where: { id },
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          data: updateData,
        });
        // await this.auditService.create(
        //   {
        //     action: 'APPROVE_BUDGET_ALLOCATION',
        //     entityType: 'BudgetAllocation',
        //     entityId: id,
        //     oldValue: location,
        //     // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        //     newValue: updateData,
        //   },
        //   user!,
        // );
        break;
      }

      case DocumentType.SUPPLIER_VETTING: {
        let vStatus: VettingStatus = VettingStatus.PENDING_APPROVAL;
        if (actionStatus === 'APPROVED') vStatus = VettingStatus.APPROVED;
        if (actionStatus === 'REJECTED') vStatus = VettingStatus.REJECTED;
        await this.prisma.supplierVettingRequest.update({
          where: { id },
          data: { status: vStatus },
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
      // include: {
      //   purchaseRequisition: true,
      // },
      orderBy: { createdAt: 'desc' },
    });
  }

  // ── Helpers thông báo email ──────────────────────────────────────────────────

  /** Gửi email thông báo cho approver khi có tài liệu chờ duyệt */
  private async notifyApprover(
    approverId: string,
    docLabel: string,
    docId: string,
    totalAmount: number,
  ): Promise<void> {
    try {
      const approver = await this.prisma.user.findUnique({
        where: { id: approverId },
      });
      if (!approver?.email) return;

      await this.notificationService.sendDirectEmail(
        approver.email,
        `[OMS] Yêu cầu phê duyệt ${docLabel} mới`,
        'PO_APPROVAL_REQUEST',
        {
          name: approver.fullName ?? approver.email,
          docType: docLabel,
          docId,
          totalAmount:
            new Intl.NumberFormat('vi-VN').format(totalAmount) + ' VNĐ',
          approveLink: `${process.env.FRONTEND_URL ?? ''}/approvals`,
        },
      );
    } catch (err: any) {
      this.logger.warn(
        `notifyApprover failed for ${approverId}: ${err.message}`,
      );
    }
  }

  /** Gửi email thông báo kết quả (APPROVED / REJECTED) cho người yêu cầu */
  private async notifyRequesterOnResult(
    docType: DocumentType,
    docId: string,
    result: 'APPROVED' | 'REJECTED',
    comment?: string,
  ): Promise<void> {
    try {
      const requesterId = await this.getRequesterId(docType, docId);
      if (!requesterId) return;

      const requester = await this.prisma.user.findUnique({
        where: { id: requesterId },
      });
      if (!requester?.email) return;

      const docLabel = this.getDocumentLabel(docType);
      const eventType =
        result === 'APPROVED' ? 'PO_APPROVED' : 'PO_APPROVAL_REQUEST';
      const subject =
        result === 'APPROVED'
          ? `[OMS] ${docLabel} của bạn đã được phê duyệt`
          : `[OMS] ${docLabel} của bạn bị từ chối`;

      await this.notificationService.sendDirectEmail(
        requester.email,
        subject,
        eventType,
        {
          name: requester.fullName ?? requester.email,
          docType: docLabel,
          docId,
          status: result === 'APPROVED' ? 'Đã phê duyệt' : 'Bị từ chối',
          comment: comment ?? '',
          detailLink: `${process.env.FRONTEND_URL ?? ''}/pr`,
        },
      );
    } catch (err: any) {
      this.logger.warn(
        `notifyRequesterOnResult failed for ${docId}: ${err.message}`,
      );
    }
  }

  /** Lấy requesterId từ tài liệu nguồn */
  private async getRequesterId(
    docType: DocumentType,
    docId: string,
  ): Promise<string | null> {
    switch (docType) {
      case DocumentType.PURCHASE_REQUISITION: {
        const pr = await this.prisma.purchaseRequisition.findUnique({
          where: { id: docId },
          select: { requesterId: true },
        });
        return pr?.requesterId ?? null;
      }
      case DocumentType.PURCHASE_ORDER: {
        const po = await this.prisma.purchaseOrder.findUnique({
          where: { id: docId },
          select: { buyerId: true },
        });
        return po?.buyerId ?? null;
      }
      default:
        return null;
    }
  }

  /** Trả về tên hiển thị của loại tài liệu */
  private getDocumentLabel(docType: DocumentType): string {
    const labels: Partial<Record<DocumentType, string>> = {
      [DocumentType.PURCHASE_REQUISITION]: 'Phiếu yêu cầu mua hàng (PR)',
      [DocumentType.PURCHASE_ORDER]: 'Đơn đặt hàng (PO)',
      [DocumentType.GRN]: 'Biên bản nhận hàng (GRN)',
      [DocumentType.SUPPLIER_INVOICE]: 'Hóa đơn nhà cung cấp',
      [DocumentType.PAYMENT]: 'Thanh toán',
      [DocumentType.BUDGET_ALLOCATION]: 'Phân bổ ngân sách',
      [DocumentType.SUPPLIER_VETTING]: 'Xét duyệt nhà cung cấp',
    };
    return labels[docType] ?? docType;
  }

  private emitApprovalEvent(step: any, status: 'APPROVED' | 'REJECTED', orgId: string) {
    try {
      this.eventsGateway.emitApprovalUpdate(orgId, {
        workflowId: step.id as string,
        documentId: step.documentId as string,
        documentType: step.documentType as string,
        status,
        approverId: step.approverId as string | undefined,
      });
    } catch {
      // Never block the main flow on WS emit failure
    }
  }
}
