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

@Injectable()
export class PrmoduleService {
  constructor(
    private readonly repository: PrRepository,
    private readonly prisma: PrismaService,
    private readonly approvalService: ApprovalModuleService,
    private readonly aiService: AiService,
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

    // 1. Tìm kỳ ngân sách
    const period = await this.prisma.budgetPeriod.findFirst({
      where: {
        orgId,
        fiscalYear,
        periodType: 'QUARTERLY',
        periodNumber: quarter,
      },
    });

    if (!period) {
      throw new BadRequestException(
        `Không tìm thấy kỳ ngân sách Quý ${quarter}/${fiscalYear} cho tổ chức này.`,
      );
    }

    // 2. Tìm phân bổ ngân sách cho Cost Center trong kỳ đó
    const allocation = await this.prisma.budgetAllocation.findUnique({
      where: {
        budgetPeriodId_costCenterId: {
          budgetPeriodId: period.id,
          costCenterId,
        },
      },
    });

    if (!allocation) {
      throw new BadRequestException(
        `Cost center chưa được cấp ngân sách cho Quý ${quarter}/${fiscalYear}.`,
      );
    }

    // 3. Kiểm tra hạn mức
    const available =
      Number(allocation.allocatedAmount) -
      Number(allocation.committedAmount) -
      Number(allocation.spentAmount);

    if (available < amount) {
      throw new BadRequestException(
        `Ngân sách không đủ. Hạn mức còn lại: ${available.toLocaleString()} VND, cần: ${amount.toLocaleString()} VND.`,
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
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const pr = await this.repository.findOne(id);
    if (!pr) {
      throw new NotFoundException(
        `Purchase Requisition with ID ${id} not found`,
      );
    }
    return pr;
  }

  async submit(id: string): Promise<PurchaseRequisition> {
    if (!id) {
      throw new NotFoundException(`Purchase Requisition ID is required`);
    }

    // 1. Tìm PR
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const pr = await this.findOne(id);
    if (pr.status !== PrStatus.DRAFT) {
      throw new Error('Only draft PRs can be submitted');
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

    // 3. Trạng thái PENDING_APPROVAL đã được cập nhật bên trong initiateWorkflow
    // nhưng ta vẫn trả về PR mới nhất để đồng bộ UI
    return this.findOne(id);
  }

  async findMyPrs(userId: string): Promise<PurchaseRequisition[]> {
    return this.repository.findByRequester(userId);
  }
}
