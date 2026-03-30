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
} from '@prisma/client';
import { JwtPayload } from '../auth-module/interfaces/jwt-payload.interface';
import { PrismaService } from '../prisma/prisma.service';
import { ApprovalModuleService } from '../approval-module/approval-module.service';
import { AiService } from '../ai-service/ai-service.service';
import { BudgetModuleService } from '../budget-module/budget-module.service';

@Injectable()
export class PrmoduleService {
  constructor(
    private readonly repository: PrRepository,
    private readonly prisma: PrismaService,
    private readonly approvalService: ApprovalModuleService,
    private readonly aiService: AiService,
    private readonly budgetService: BudgetModuleService,
  ) {}

  private async checkAndReserveBudget(
    costCenterId: string,
    orgId: string,
    amount: number,
  ) {
    const now = new Date();
    const fiscalYear = now.getFullYear();
    const month = now.getMonth() + 1;
    const quarter = Math.ceil(month / 3);

    // 1. Kiểm tra ngân sách quý và tự động trích từ quỹ dự phòng nếu cần
    const allocation = await this.budgetService.checkAndPullFromReserve(
      costCenterId,
      orgId,
      fiscalYear,
      quarter,
      amount,
    );

    if (!allocation) {
      throw new BadRequestException(
        `Không tìm thấy phân bổ ngân sách cho Cost center này trong Quý ${quarter}/${fiscalYear}.`,
      );
    }

    // 2. Kiểm tra hạn mức cuối cùng sau khi đã trích dự phòng (nếu có)
    const available =
      Number(allocation.allocatedAmount) -
      Number(allocation.committedAmount) -
      Number(allocation.spentAmount);

    if (available < amount) {
      throw new BadRequestException(
        `Ngân sách không đủ (kể cả sau khi đã trích quỹ dự phòng). Hạn mức còn lại: ${available.toLocaleString()} VND, cần: ${amount.toLocaleString()} VND.`,
      );
    }
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

    // 2. Kiểm tra Quyền khởi tạo PR theo Hạn mức trần (Hierarchical Ceiling)
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
        const allowedRoles: UserRole[] = [UserRole.DIRECTOR, UserRole.CEO];
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

    // Kiểm tra ngân sách nếu có Cost Center
    if (createPrDto.costCenterId) {
      await this.checkAndReserveBudget(
        createPrDto.costCenterId,
        orgId,
        totalAmount,
      );
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
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
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

  async submit(id: string): Promise<PurchaseRequisition> {
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

      // 2. Kích hoạt luồng duyệt (Multi-level Approval)
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

      console.log(`[PR-SUBMIT] Workflow initiated for PR: ${pr.id}`);

      // 3. Trạng thái PENDING_APPROVAL đã được cập nhật bên trong initiateWorkflow
      // nhưng ta vẫn trả về PR mới nhất để đồng bộ UI
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
        `Không thể gửi duyệt PR: ${error.message || 'Lỗi không xác định'}`,
      );
    }
  }

  async findMyPrs(userId: string): Promise<PurchaseRequisition[]> {
    return this.repository.findByRequester(userId);
  }
}
