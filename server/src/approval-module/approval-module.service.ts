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
   * Hàm này quét bảng ApprovalMatrixRule để tạo ra các bước duyệt cụ thể trong ApprovalWorkflow.
   */
  async initiateWorkflow(params: {
    docType: DocumentType;
    docId: string;
    totalAmount: number;
    orgId: string;
    requesterId: string;
    user?: JwtPayload; // Thêm user payload để ghi audit log
  }) {
    const { docType, docId, totalAmount, orgId, requesterId, user } = params;

    // A. Tìm các quy tắc (Rules) phù hợp với loại tài liệu và hạn mức tiền
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
      // Nếu không có luật nào, tự động duyệt tài liệu
      console.log(`No rules found for ${docType} ${docId}. Auto-approving...`);
      await this.updateSourceDocumentStatus(docType, docId, 'APPROVED', user);
      return { message: 'No rules found. Document auto-approved.' };
    }

    // B. Tạo các bước duyệt (Workflow Steps)
    const workflowData: any[] = [];

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

      // --- LOGIC ỦY QUYỀN (Delegation Logic) ---
      // Kiểm tra xem người duyệt gốc có đang ủy quyền cho ai không
      const delegateId =
        await this.userService.getActiveDelegate(originalApproverId);
      const approverId = delegateId ? delegateId : originalApproverId;
      const delegatedFromId = delegateId ? originalApproverId : null;

      workflowData.push({
        documentType: docType,
        documentId: docId,
        step: rule.level,
        approverId: approverId,
        delegatedFromId: delegatedFromId, // Lưu vết người ủy quyền
        status: ApprovalStatus.PENDING,
        dueAt: new Date(Date.now() + rule.slaHours * 60 * 60 * 1000),
      });
    }

    // C. Lưu tất cả các bước vào database
    await this.prisma.approvalWorkflow.createMany({
      data: workflowData,
    });

    // D. Cập nhật trạng thái tài liệu gốc sang 'PENDING_APPROVAL'
    await this.updateSourceDocumentStatus(
      docType,
      docId,
      'PENDING_APPROVAL',
      user,
    );

    return {
      message: 'Workflow initiated successfully',
      stepsCreated: workflowData.length,
    };
  }

  /**
   * 2. Xử lý hành động duyệt (Approve/Reject)
   * Người dùng nhấn nút 'Duyệt' hoặc 'Từ chối' trên UI.
   */
  async handleAction(
    workflowId: string,
    user: JwtPayload,
    action: 'APPROVE' | 'REJECT',
    comment?: string,
  ) {
    const userId = user.sub;
    // A. Kiểm tra bước duyệt hiện tại
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

    // B. Cập nhật trạng thái bước hiện tại
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

    // C. Logic rẽ nhánh (Branching)
    if (action === 'REJECT') {
      // Nếu có 1 người từ chối -> Toàn bộ tài liệu bị REJECTED ngay lập tức
      await this.updateSourceDocumentStatus(
        currentStep.documentType,
        currentStep.documentId,
        'REJECTED',
        user,
      );
      return { status: 'REJECTED', message: 'Tài liệu đã bị từ chối.' };
    }

    // D. Nếu DUYỆT -> Kiểm tra xem còn bước nào tiếp theo chưa duyệt không
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
      // Đã duyệt hết tất cả các cấp -> Tài liệu được duyệt hoàn toàn
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
      // Còn các bước sau -> Tiếp tục chờ cấp tiếp theo duyệt
      return {
        status: 'PARTIALLY_APPROVED',
        message: 'Đã duyệt cấp hiện tại, đang chờ cấp tiếp theo.',
      };
    }
  }

  /**
   * Helper: Chuyển đổi từ Vai trò (Role) sang ID người dùng cụ thể (User ID)
   */
  private async resolveApproverId(
    role: UserRole,
    requesterId: string,
    orgId: string,
  ): Promise<string | null> {
    if (role === UserRole.DEPT_APPROVER) {
      // Tìm Trưởng phòng của người yêu cầu (Requester)
      const requester = await this.prisma.user.findUnique({
        where: { id: requesterId },
        include: { department: true },
      });
      return requester?.department?.headUserId || null;
    }

    // Với các vai trò công ty (CEO, Director, Finance, Procurement)
    // Tìm người đầu tiên đang hoạt động có vai trò này trong cùng công ty.
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
   */
  private async updateSourceDocumentStatus(
    type: DocumentType,
    id: string,
    status: string,
    user?: JwtPayload,
  ) {
    const data: any = { status };

    // Tùy vào trạng thái cuối cùng, ta có thể cập nhật thêm ngày duyệt
    if (status === 'APPROVED') {
      data.approvedAt = new Date();
      // Kích hoạt tự động hóa
      void this.automationService.handleDocumentApproved(type, id);
    }

    switch (type) {
      case DocumentType.PURCHASE_REQUISITION: {
        const pr = await this.prisma.purchaseRequisition.findUnique({
          where: { id },
          select: {
            costCenterId: true,
            orgId: true,
            totalEstimate: true,
            status: true,
          },
        });

        if (
          pr &&
          status === 'REJECTED' &&
          pr.status !== PrStatus.REJECTED &&
          user
        ) {
          // Giải phóng ngân sách đã giữ chỗ khi PR bị từ chối
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
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          data: { status: status as PrStatus, approvedAt: data.approvedAt },
        });
        break;
      }

      case DocumentType.PURCHASE_ORDER: {
        const po = await this.prisma.purchaseOrder.findUnique({
          where: { id },
        });
        if (
          po &&
          status === 'REJECTED' &&
          po.status !== PoStatus.REJECTED &&
          user
        ) {
          // Giải phóng ngân sách đã cam kết khi PO bị từ chối
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
          data: { status: status as PoStatus },
        });
        break;
      }
      // Thêm các loại khác (GRN, INVOICE, PAYMENT) khi hệ thống mở rộng
    }
  }

  /**
   * Truy vấn danh sách việc cần duyệt cho người dùng hiện tại
   */
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
