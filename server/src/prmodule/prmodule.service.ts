import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
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
import { ConfigService } from '@nestjs/config';

@Injectable()
export class PrmoduleService {
  private readonly logger = new Logger(PrmoduleService.name);
  private readonly ceilL1: number;
  private readonly ceilL2: number;
  private readonly ceilL3: number;

  constructor(
    private readonly repository: PrRepository,
    private readonly prisma: PrismaService,
    private readonly approvalService: ApprovalModuleService,
    private readonly aiService: AiService,
    private readonly budgetService: BudgetModuleService,
    private readonly budgetOverrideService: BudgetOverrideService,
    private readonly emailService: EmailService,
    private readonly configService: ConfigService,
  ) {
    this.ceilL1 = this.configService.get<number>('PR_CEILING_L1', 10_000_000);
    this.ceilL2 = this.configService.get<number>('PR_CEILING_L2', 30_000_000);
    this.ceilL3 = this.configService.get<number>('PR_CEILING_L3', 100_000_000);
  }

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
      if (totalAmount < this.ceilL1) {
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
      } else if (totalAmount >= this.ceilL1 && totalAmount < this.ceilL2) {
        const allowedRoles: UserRole[] = [
          UserRole.REQUESTER,
          UserRole.DEPT_APPROVER,
          UserRole.DIRECTOR,
          UserRole.CEO,
        ];
        if (!allowedRoles.includes(role)) {
          throw new BadRequestException(
            `Hạn mức khởi tạo của bạn tối đa là ${this.ceilL1.toLocaleString('vi-VN')} VND.`,
          );
        }
      } else if (totalAmount >= this.ceilL2 && totalAmount < this.ceilL3) {
        const allowedRoles: UserRole[] = [
          UserRole.DIRECTOR,
          UserRole.CEO,
          UserRole.REQUESTER,
        ];
        if (!allowedRoles.includes(role)) {
          throw new BadRequestException(
            `Hạn mức khởi tạo của bạn tối đa là ${this.ceilL2.toLocaleString('vi-VN')} VND.`,
          );
        }
      } else if (totalAmount >= this.ceilL3) {
        if (role !== UserRole.CEO) {
          throw new BadRequestException(
            `Hạn mức khởi tạo của bạn tối đa là ${this.ceilL3.toLocaleString('vi-VN')} VND.`,
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

      this.logger.log(`Submitting PR: ${id} (Status: ${pr.status})`);

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
            this.logger.log(
              `Budget exceeded. Creating override request for PR: ${pr.id}`,
            );

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

              // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
              return this.findOne(pr.id);
            }
          }
          throw budgetError;
        }
      }

      // 3. Kích hoạt luồng duyệt (Multi-level Approval)
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

      this.logger.log(`Workflow initiated for PR: ${pr.id}`);

      // 4. Trạng thái PENDING_APPROVAL đã được cập nhật bên trong initiateWorkflow
      // nhưng ta vẫn trả về PR mới nhất để đồng bộ UI
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      return this.findOne(pr.id);
    } catch (error) {
      this.logger.error(
        `submitPR failed: ${error instanceof Error ? error.message : String(error)}`,
      );
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

  async findPaginated(orgId: string, skip: number, take: number): Promise<PurchaseRequisition[]> {
    return this.prisma.purchaseRequisition.findMany({
      where: { orgId },
      orderBy: { createdAt: 'desc' },
      skip,
      take,
      include: { items: true, requester: true, department: true },
    });
  }

  async count(orgId: string): Promise<number> {
    return this.prisma.purchaseRequisition.count({
      where: { orgId },
    });
  }
}
