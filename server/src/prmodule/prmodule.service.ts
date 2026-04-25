import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { CreatePrDto, CreatePrItemDto } from './dto/create-pr.dto';
import { PrRepository } from './pr.repository';
import {
  PrStatus,
  PurchaseRequisition,
  DocumentType,
  UserRole,
  BudgetAllocationStatus,
} from '@prisma/client';
import { JwtPayload } from '../auth-module/interfaces/jwt-payload.interface';
import { PrismaService } from '../prisma/prisma.service';
import { ApprovalModuleService } from '../approval-module/approval-module.service';
import { AiService } from '../ai-service/ai-service.service';
import { BudgetModuleService } from '../budget-module/budget-module.service';
import { BudgetOverrideService } from '../budget-module/budget-override.service';
import { EmailService } from '../notification-module/email.service';

@Injectable()
export class PrmoduleService {
  constructor(
    private readonly repository: PrRepository,
    private readonly prisma: PrismaService,
    private readonly approvalService: ApprovalModuleService,
    private readonly aiService: AiService,
    private readonly budgetService: BudgetModuleService,
    private readonly budgetOverrideService: BudgetOverrideService,
    private readonly emailService: EmailService,
  ) {}

  async create(
    createPrDto: CreatePrDto,
    user: JwtPayload,
  ): Promise<PurchaseRequisition> {
    // 1. Tính tổng giá trị PR
    const totalAmount = createPrDto.items.reduce(
      (sum, item) => sum + item.estimatedPrice * item.qty,
      0,
    );

    if (totalAmount <= 0) {
      throw new BadRequestException('Giá trị PR phải lớn hơn 0.');
    }

    // 2. Kiểm tra Budget by Category (nếu item có categoryId)
    // NOTE: Flow routing (STABLE/VOLATILE) được handle ở AutomationService
    for (const item of createPrDto.items) {
      if (item.categoryId && createPrDto.costCenterId) {
        const itemCost = item.estimatedPrice * item.qty;

        const budgetAlloc = await this.prisma.budgetAllocation.findFirst({
          where: {
            costCenterId: createPrDto.costCenterId,
            categoryId: item.categoryId,
            orgId: user.orgId,
            status: BudgetAllocationStatus.APPROVED,
          },
        });

        if (!budgetAlloc) {
          throw new BadRequestException(
            `Chưa có cấp phát ngân sách cho danh mục này trong phòng ban. Vui lòng liên hệ kế toán.`,
          );
        }

        // Tính available balance
        const allocated = Number(budgetAlloc.allocatedAmount);
        const committed = Number(budgetAlloc.committedAmount);
        const spent = Number(budgetAlloc.spentAmount);
        const availableBudget = allocated - committed - spent;

        if (itemCost > availableBudget) {
          throw new BadRequestException(
            `Ngân sách cho danh mục này không đủ. Yêu cầu: ${itemCost.toLocaleString('vi-VN')} VND, Khả dụng: ${availableBudget.toLocaleString('vi-VN')} VND. Vui lòng xin phê duyệt vượt ngân sách hoặc giảm số lượng.`,
          );
        }
      }
    }

    // 3. Kiểm tra Quyền khởi tạo PR theo Hạn mức trần (Hierarchical Ceiling)
    const role = user.role as UserRole;
    const isPlatformAdmin = role === UserRole.PLATFORM_ADMIN;

    if (!isPlatformAdmin) {
      if (totalAmount < 10000000) {
        // Mọi Role nghiệp vụ đều có quyền tạo PR dưới 10tr
        const allowedRoles: UserRole[] = [
          UserRole.REQUESTER,
          UserRole.DEPT_APPROVER,
          UserRole.DIRECTOR,
          UserRole.CEO,
        ];
        if (!allowedRoles.includes(role)) {
          throw new BadRequestException(
            'Bạn không có quyền khởi tạo yêu cầu mua sắm.',
          );
        }
      } else if (totalAmount >= 10000000 && totalAmount < 30000000) {
        // Chỉ Approver trở lên mới được tạo PR từ 10tr - 30tr
        const allowedRoles: UserRole[] = [
          UserRole.REQUESTER, // test hợp đồng
          UserRole.DEPT_APPROVER,
          UserRole.DIRECTOR,
          UserRole.CEO,
        ];
        if (!allowedRoles.includes(role)) {
          throw new BadRequestException(
            'Hạn mức khởi tạo của bạn tối đa là 10 triệu VND.',
          );
        }
      } else if (totalAmount >= 30000000 && totalAmount < 100000000) {
        // Chỉ Director trở lên mới được tạo PR từ 30tr - 100tr
        const allowedRoles: UserRole[] = [
          UserRole.DIRECTOR,
          UserRole.CEO,
          UserRole.REQUESTER,
        ];
        if (!allowedRoles.includes(role)) {
          throw new BadRequestException(
            'Hạn mức khởi tạo của bạn tối đa là 30 triệu VND.',
          );
        }
      } else if (totalAmount >= 100000000) {
        // Chỉ CEO mới được tạo PR trên 100tr
        if (role !== UserRole.CEO) {
          throw new BadRequestException(
            'Hạn mức khởi tạo của bạn tối đa là 100 triệu VND.',
          );
        }
      }
    }

    const prNumber = `PR-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const orgId = user.orgId;
    let deptId = user.deptId;

    if (!deptId) {
      const userFromDb = await this.prisma.user.findUnique({
        where: { id: user.sub },
        select: { deptId: true },
      });
      if (!userFromDb?.deptId) {
        throw new BadRequestException('Người dùng không thuộc phòng ban nào.');
      }
      deptId = userFromDb.deptId;
    }

    return this.repository.create(
      createPrDto,
      user.sub,
      orgId,
      deptId,
      prNumber,
    );
  }

  // AI gợi ý công ty phù hợp dựa trên mô tả sản phẩm
  // const aiSuggestion = await this.AiSuggest(createPrDto.items);
  // console.log('AI Suggestion:', aiSuggestion);

  async AiSuggest(items: CreatePrItemDto[]) {
    const aiSuggestion = await this.aiService.getCompanySuggestion(items);
    return aiSuggestion;
  }

  async findAll(user: JwtPayload): Promise<PurchaseRequisition[]> {
    return this.repository.findAll(user.orgId);
  }

  async findOne(id: string): Promise<any> {
    // Thử tìm theo ID (UUID) trước, nếu không phải UUID thì tìm theo prNumber
    const isUuid =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
        id,
      );

    let pr;
    if (isUuid) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      pr = await this.repository.findOne(id);
    } else {
      pr = await this.prisma.purchaseRequisition.findUnique({
        where: { prNumber: id },
        include: {
          items: true,
          requester: true,
          department: true,
          costCenter: true,
          procurement: true,
        },
      });
    }

    if (!pr) {
      throw new NotFoundException(
        `Purchase Requisition with identifier ${id} not found`,
      );
    }
    return pr;
  }

  async submit(id: string, user: JwtPayload): Promise<PurchaseRequisition> {
    if (!id) {
      throw new BadRequestException(`Purchase Requisition ID is required`);
    }

    try {
      // 1. Tìm PR
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const pr = await this.findOne(id);
      if (!pr) {
        throw new NotFoundException(
          `Purchase Requisition with ID ${id} not found`,
        );
      }

      console.log(`[PR-SUBMIT] Submitting PR: ${id} (Status: ${pr.status})`);

      if (pr.status !== PrStatus.DRAFT) {
        throw new BadRequestException(
          `Chỉ hồ sơ ở trạng thái NHÁP mới được sửa hoặc gửi duyệt. Trạng thái hiện tại: ${pr.status}`,
        );
      }

      // 2. Khóa ngân sách (Budget Reservation) - CHỈ KHI SUBMIT
      if (pr.costCenterId) {
        try {
          await this.budgetService.reserveBudget(
            // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
            pr.costCenterId,
            // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
            pr.orgId,
            Number(pr.totalEstimate),
            user,
          );
        } catch (budgetError) {
          if (
            budgetError instanceof BadRequestException &&
            budgetError.message.includes('Vượt hạn mức ngân sách')
          ) {
            // TỰ ĐỘNG tạo yêu cầu duyệt vượt mức nếu hết tiền
            // Tìm allocation hiện tại để lấy ID
            const allocation = await this.budgetService.findQuarterlyAllocation(
              // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
              pr.costCenterId,
              // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
              pr.orgId,
              new Date().getFullYear(),
              Math.ceil((new Date().getMonth() + 1) / 3),
            );

            if (allocation && !('isVirtual' in allocation)) {
              await this.budgetOverrideService.createRequest(
                {
                  budgetAllocId: allocation.id,
                  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
                  prId: pr.id,
                  overrideAmount: Number(pr.totalEstimate),
                  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
                  reason: pr.justification || 'Vượt hạn mức ngân sách quý.',
                },
                user,
              );

              // Cập nhật trạng thái PR thành PENDING_OVERRIDE
              await this.prisma.purchaseRequisition.update({
                // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
                where: { id: pr.id },
                data: { status: PrStatus.PENDING_OVERRIDE },
              });

              // Thông báo Finance qua email
              void this.notifyFinanceBudgetExceeded(pr, allocation, user).catch(
                () => {},
              );

              // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
              return this.findOne(pr.id);
            }
          }
          throw budgetError;
        }
      }

      // 3. Kích hoạt luồng duyệt (Multi-level Approval)
      try {
        await this.approvalService.initiateWorkflow({
          docType: DocumentType.PURCHASE_REQUISITION,
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          docId: pr.id,
          totalAmount: Number(pr.totalEstimate),
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          orgId: pr.orgId,
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          requesterId: pr.requesterId,
        });
      } catch (workflowError) {
        // Workflow thất bại → hoàn trả ngân sách đã rào để tránh double-reservation lần retry
        if (pr.costCenterId) {
          await this.budgetService
            .releaseBudget(
              // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
              pr.costCenterId,
              // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
              pr.orgId,
              Number(pr.totalEstimate),
              user,
            )
            .catch((releaseErr: unknown) => {
              console.error(
                '[PR-SUBMIT] Failed to release budget after workflow error:',
                releaseErr,
              );
            });
        }
        throw workflowError;
      }

      console.log(`[PR-SUBMIT] Workflow initiated for PR: ${pr.id}`);

      // 4. Trạng thái PENDING_APPROVAL đã được cập nhật bên trong initiateWorkflow
      // nhưng ta vẫn trả về PR mới nhất để đồng bộ UI
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      return this.findOne(pr.id);
    } catch (error) {
      console.error('[PR-SUBMIT] CRITICAL ERROR:', error);
      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }
      throw new BadRequestException(
        `Không thể gửi duyệt PR: ${error || 'Lỗi không xác định'}`,
      );
    }
  }

  async findMyPrs(userId: string): Promise<PurchaseRequisition[]> {
    return this.repository.findByRequester(userId);
  }

  private async notifyFinanceBudgetExceeded(
    pr: any,
    allocation: any,
    requester: JwtPayload,
  ) {
    const financeUsers = await this.prisma.user.findMany({
      where: {
        orgId: requester.orgId,
        role: UserRole.FINANCE,
        isActive: true,
      },
      select: { id: true, email: true, fullName: true },
    });

    if (financeUsers.length === 0) return;

    const allocated = Number(allocation.allocatedAmount ?? 0);
    const committed = Number(allocation.committedAmount ?? 0);
    const spent = Number(allocation.spentAmount ?? 0);
    const available = allocated - committed - spent;
    const requested = Number(pr.totalEstimate ?? 0);
    const exceeded = requested - available;

    const fmt = (n: number) =>
      n.toLocaleString('vi-VN', { maximumFractionDigits: 0 }) + ' VND';

    const emailBody = `
<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;border:1px solid #e2e8f0;border-radius:8px">
  <div style="background:#dc2626;color:#fff;padding:16px 20px;border-radius:6px 6px 0 0;margin:-20px -20px 20px">
    <h2 style="margin:0;font-size:18px">⚠️ Cảnh báo vượt ngân sách</h2>
  </div>
  <p>Kính gửi <strong>${'Finance Team'}</strong>,</p>
  <p>Một phiếu mua hàng (PR) vừa được gửi duyệt nhưng <strong>vượt hạn mức ngân sách</strong>. Yêu cầu cần được xem xét và phê duyệt.</p>

  <table style="width:100%;border-collapse:collapse;margin:16px 0">
    <tr style="background:#f8fafc">
      <td style="padding:10px 14px;border:1px solid #e2e8f0;font-weight:bold;width:40%">Số PR</td>
      <td style="padding:10px 14px;border:1px solid #e2e8f0">${pr.prNumber ?? pr.id}</td>
    </tr>
    <tr>
      <td style="padding:10px 14px;border:1px solid #e2e8f0;font-weight:bold">Người tạo</td>
      <td style="padding:10px 14px;border:1px solid #e2e8f0">${requester.email ?? 'N/A'}</td>
    </tr>
    <tr style="background:#f8fafc">
      <td style="padding:10px 14px;border:1px solid #e2e8f0;font-weight:bold">Lý do / Mô tả</td>
      <td style="padding:10px 14px;border:1px solid #e2e8f0">${pr.justification ?? pr.title ?? '—'}</td>
    </tr>
    <tr>
      <td style="padding:10px 14px;border:1px solid #e2e8f0;font-weight:bold">Ngân sách được phân bổ</td>
      <td style="padding:10px 14px;border:1px solid #e2e8f0">${fmt(allocated)}</td>
    </tr>
    <tr style="background:#f8fafc">
      <td style="padding:10px 14px;border:1px solid #e2e8f0;font-weight:bold">Đã sử dụng (committed + spent)</td>
      <td style="padding:10px 14px;border:1px solid #e2e8f0">${fmt(committed + spent)}</td>
    </tr>
    <tr>
      <td style="padding:10px 14px;border:1px solid #e2e8f0;font-weight:bold">Còn khả dụng</td>
      <td style="padding:10px 14px;border:1px solid #e2e8f0;color:#16a34a">${fmt(available)}</td>
    </tr>
    <tr style="background:#fef2f2">
      <td style="padding:10px 14px;border:1px solid #e2e8f0;font-weight:bold">Số tiền PR yêu cầu</td>
      <td style="padding:10px 14px;border:1px solid #e2e8f0;color:#dc2626;font-weight:bold">${fmt(requested)}</td>
    </tr>
    <tr style="background:#fef2f2">
      <td style="padding:10px 14px;border:1px solid #e2e8f0;font-weight:bold">Vượt ngân sách</td>
      <td style="padding:10px 14px;border:1px solid #e2e8f0;color:#dc2626;font-weight:bold">+${fmt(exceeded)}</td>
    </tr>
  </table>

  <p>PR hiện đang ở trạng thái <strong>PENDING_OVERRIDE</strong>. Vui lòng đăng nhập vào hệ thống để xem xét và phê duyệt yêu cầu vượt ngân sách này.</p>
  <p style="color:#64748b;font-size:13px">Email này được gửi tự động bởi hệ thống OMS.</p>
</div>`;

    await Promise.allSettled(
      financeUsers.map((u) =>
        this.emailService.sendEmail(
          u.email,
          `[OMS] ⚠️ PR vượt ngân sách cần duyệt — ${pr.prNumber ?? pr.id}`,
          emailBody,
        ),
      ),
    );
  }
}
