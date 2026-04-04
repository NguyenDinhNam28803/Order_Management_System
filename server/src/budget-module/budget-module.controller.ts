import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth-module/jwt-auth.guard';
import { RolesGuard, Roles } from '../common/roles.guard';
import { BudgetPeriodType, UserRole, DocumentType } from '@prisma/client';
import type { JwtPayload } from '../auth-module/interfaces/jwt-payload.interface';
import { BudgetModuleService } from './budget-module.service';
import { BudgetOverrideService } from './budget-override.service';
import { ApprovalModuleService } from '../approval-module/approval-module.service';
import {
  CreateBudgetAllocationDto,
  CreateBudgetPeriodDto,
  UpdateBudgetAllocationDto,
  UpdateBudgetPeriodDto,
  RejectBudgetAllocationDto,
} from './dto/budget.dto';

@ApiTags('Budget Management')
@Controller('budgets')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
export class BudgetModuleController {
  constructor(
    private readonly budgetService: BudgetModuleService,
    private readonly budgetOverrideService: BudgetOverrideService,
    private readonly approvalService: ApprovalModuleService,
  ) {}

  // Budget Override Requests
  @Get('overrides')
  @Roles(UserRole.FINANCE, UserRole.DIRECTOR, UserRole.CEO)
  @ApiOperation({ summary: 'Lấy danh sách yêu cầu vượt định mức' })
  async findAllOverrides(@Request() req: { user: JwtPayload }) {
    return this.budgetOverrideService.findByOrg(req.user);
  }

  @Get('overrides/:id')
  @ApiOperation({ summary: 'Lấy chi tiết yêu cầu vượt định mức' })
  async findOverrideOne(@Param('id') id: string) {
    return this.budgetOverrideService.findOne(id);
  }

  @Patch('overrides/:id/approve')
  @Roles(UserRole.FINANCE, UserRole.DIRECTOR, UserRole.CEO)
  @ApiOperation({ summary: 'Duyệt yêu cầu vượt định mức' })
  async approveOverride(
    @Param('id') id: string,
    @Request() req: { user: JwtPayload },
  ) {
    return this.budgetOverrideService.approveRequest(id, req.user);
  }

  @Patch('overrides/:id/reject')
  @Roles(UserRole.FINANCE, UserRole.DIRECTOR, UserRole.CEO)
  @ApiOperation({ summary: 'Từ chối yêu cầu vượt định mức' })
  async rejectOverride(
    @Param('id') id: string,
    @Body('reason') reason: string,
    @Request() req: { user: JwtPayload },
  ) {
    return this.budgetOverrideService.rejectRequest(id, reason, req.user);
  }

  // Budget Periods
  /**
   * Tạo một chu kỳ ngân sách mới
   */
  @Post('periods')
  @Roles(
    UserRole.FINANCE,
    UserRole.DIRECTOR,
    UserRole.CEO,
    UserRole.PLATFORM_ADMIN,
  )
  @ApiOperation({
    summary: 'Tạo mới chu kỳ ngân sách',
    description:
      'Tạo một chu kỳ ngân sách mới (ví dụ: Năm 2024, Quý 1/2024) để quản lý việc phân bổ ngân sách. Dành cho vai trò Tài chính, Giám đốc hoặc Quản trị hệ thống.',
  })
  async createPeriod(
    @Body() dto: CreateBudgetPeriodDto,
    @Request() req: { user: JwtPayload },
  ) {
    return this.budgetService.createPeriod(dto, req.user);
  }

  /**
   * Lấy danh sách tất cả các chu kỳ ngân sách
   */
  @Get('periods')
  @ApiOperation({
    summary: 'Lấy tất cả các chu kỳ ngân sách',
    description:
      'Truy vấn danh sách tất cả các chu kỳ ngân sách đã được định nghĩa trong hệ thống.',
  })
  async findAllPeriods(@Request() req: { user: JwtPayload }) {
    return this.budgetService.findAllPeriods(req.user);
  }

  /**
   * Lấy danh sách chu kỳ ngân sách theo loại (QUARTERLY, MONTHLY, ANNUAL, RESERVE)
   */
  @Get('periods/type/:type')
  @ApiOperation({
    summary: 'Lấy chu kỳ ngân sách theo loại',
    description:
      'Truy vấn danh sách các chu kỳ ngân sách theo loại (ví dụ: QUARTERLY, MONTHLY, RESERVE).',
  })
  async findPeriodsByType(
    @Param('type') type: BudgetPeriodType,
    @Request() req: { user: JwtPayload },
  ) {
    return this.budgetService.findPeriodsByType(type, req.user);
  }

  /**
   * Cập nhật chu kỳ ngân sách
   */
  @Patch('periods/:id')
  @Roles(
    UserRole.FINANCE,
    UserRole.DIRECTOR,
    UserRole.CEO,
    UserRole.PLATFORM_ADMIN,
  )
  @ApiOperation({
    summary: 'Cập nhật chu kỳ ngân sách',
    description:
      'Cập nhật thông tin của một chu kỳ ngân sách hiện có theo mã ID. Dành cho vai trò Tài chính, Giám đốc hoặc Quản trị hệ thống.',
  })
  async updatePeriod(
    @Param('id') id: string,
    @Body() dto: UpdateBudgetPeriodDto,
    @Request() user: JwtPayload,
  ) {
    return this.budgetService.updatePeriod(id, dto, user);
  }

  /**
   * Xóa chu kỳ ngân sách
   */
  @Delete('periods/:id')
  @Roles(
    UserRole.FINANCE,
    UserRole.DIRECTOR,
    UserRole.CEO,
    UserRole.PLATFORM_ADMIN,
  )
  @ApiOperation({
    summary: 'Xóa chu kỳ ngân sách',
    description:
      'Loại bỏ một chu kỳ ngân sách khỏi hệ thống. Dành cho vai trò Tài chính, Giám đốc hoặc Quản trị hệ thống.',
  })
  async removePeriod(@Param('id') id: string, @Request() user: JwtPayload) {
    return this.budgetService.removePeriod(id, user);
  }

  // Budget Allocations
  @Post('allocations')
  @Roles(
    UserRole.FINANCE,
    UserRole.DIRECTOR,
    UserRole.CEO,
    UserRole.PLATFORM_ADMIN,
    UserRole.DEPT_APPROVER,
  )
  @ApiOperation({
    summary: 'Trưởng phòng tạo yêu cầu phân bổ ngân sách',
    description:
      'Trưởng phòng tạo yêu cầu phân bổ ngân sách chi tiết. Sau khi hoàn thành, dùng endpoint submit để gửi duyệt tới phòng Tài chính.',
  })
  async createAllocation(
    @Body() dto: CreateBudgetAllocationDto,
    @Request() req: { user: JwtPayload },
  ) {
    return this.budgetService.createAllocation(dto, req.user);
  }

  @Get('my-department')
  @Roles(UserRole.DEPT_APPROVER)
  @ApiOperation({ summary: 'Lấy ngân sách của phòng ban tôi' })
  async findMyDeptAllocations(@Request() req: { user: JwtPayload }) {
    return this.budgetService.findMyDeptAllocations(req.user);
  }

  @Patch('allocations/:id/submit')
  @Roles(UserRole.DEPT_APPROVER)
  @ApiOperation({
    summary: 'Trưởng phòng gửi duyệt ngân sách',
    description:
      'Trưởng phòng gửi yêu cầu phân bổ ngân sách chi tiết đến phòng Tài chính để duyệt. Sau khi duyệt, ngân sách sẽ được cấp phát chính thức.',
  })
  async submitAllocation(
    @Param('id') id: string,
    @Request() req: { user: JwtPayload },
  ) {
    // 1. Submit allocation (change status to SUBMITTED)
    const submitted = await this.budgetService.submitAllocation(id, req.user);

    // 2. Tạo Approval Workflow tự động gọi ApprovalModuleService.initiateWorkflow()
    try {
      await this.approvalService.initiateWorkflow({
        docType: DocumentType.BUDGET_ALLOCATION,
        docId: id,
        totalAmount: Number(submitted.allocatedAmount),
        orgId: req.user.orgId,
        requesterId: req.user.sub,
        user: req.user,
      });
      console.log(`✅ Approval workflow created for budget allocation ${id}`);
    } catch (error) {
      console.warn(
        `⚠️ Could not create approval workflow: ${(error as Error).message}`,
      );
      // Không block submission nếu workflow creation thất bại
    }

    return submitted;
  }

  @Patch('allocations/:id/approve')
  @Roles(UserRole.FINANCE, UserRole.DIRECTOR, UserRole.CEO)
  @ApiOperation({
    summary: 'Duyệt yêu cầu phân bổ ngân sách',
    description:
      'Phòng Tài chính duyệt yêu cầu từ các phòng ban. Nếu vượt mức 500M, sẽ tự động escalate Giám đốc. Nếu vượt 1B, escalate CEO.',
  })
  async approveAllocation(
    @Param('id') id: string,
    @Request() req: { user: JwtPayload },
  ) {
    return this.budgetService.approveAllocation(id, req.user);
  }

  @Patch('allocations/:id/reject')
  @Roles(UserRole.FINANCE, UserRole.DIRECTOR, UserRole.CEO)
  @ApiOperation({
    summary: 'Từ chối yêu cầu phân bổ ngân sách',
    description:
      'Duyệt viên từ chối yêu cầu với lý do cụ thể. Trưởng phòng có thể sửa lại và gửi lại sau đó.',
  })
  async rejectAllocation(
    @Param('id') id: string,
    @Body() dto: RejectBudgetAllocationDto,
    @Request() req: { user: JwtPayload },
  ) {
    return this.budgetService.rejectAllocation(
      id,
      dto.rejectedReason || 'Không có lý do cụ thể',
      req.user,
    );
  }

  /**
   * Lấy danh sách tất cả các khoản phân bổ ngân sách
   */
  @Get('allocations')
  @ApiOperation({
    summary: 'Lấy tất cả phân bổ ngân sách',
    description:
      'Truy vấn danh sách các khoản phân bổ ngân sách, cho phép xem ngân sách được cấp và số tiền đã sử dụng của các trung tâm chi phí.',
  })
  async findAllAllocations(@Request() req: { user: JwtPayload }) {
    return this.budgetService.findAllAllocations(req.user);
  }

  /**
   * Lấy thông tin chi tiết một khoản phân bổ ngân sách theo ID
   */
  @Get('allocations/:id')
  @ApiOperation({
    summary: 'Lấy chi tiết phân bổ ngân sách theo ID',
    description:
      'Xem thông tin chi tiết của một khoản phân bổ ngân sách cụ thể, bao gồm số tiền định mức và số dư còn lại.',
  })
  async findAllocationOne(@Param('id') id: string) {
    return this.budgetService.findAllocationOne(id);
  }

  /**
   * Cập nhật thông tin một khoản phân bổ ngân sách theo ID
   */
  @Patch('allocations/:id')
  @Roles(
    UserRole.FINANCE,
    UserRole.DIRECTOR,
    UserRole.CEO,
    UserRole.PLATFORM_ADMIN,
  )
  @ApiOperation({
    summary: 'Cập nhật phân bổ ngân sách',
    description:
      'Điều chỉnh số tiền hoặc thông tin của một khoản phân bổ ngân sách hiện có. Dành cho vai trò Tài chính, Giám đốc hoặc Quản trị hệ thống.',
  })
  async updateAllocation(
    @Param('id') id: string,
    @Body() dto: UpdateBudgetAllocationDto,
    @Request() req: { user: JwtPayload },
  ) {
    return this.budgetService.updateAllocation(id, dto, req.user);
  }

  /**
   * Xóa một khoản phân bổ ngân sách theo ID
   */
  @Delete('allocations/:id')
  @Roles(
    UserRole.FINANCE,
    UserRole.DIRECTOR,
    UserRole.CEO,
    UserRole.PLATFORM_ADMIN,
  )
  @ApiOperation({
    summary: 'Xóa một phân bổ ngân sách',
    description:
      'Thu hồi hoặc xóa bỏ một khoản phân bổ ngân sách. Dành cho vai trò Tài chính, Giám đốc hoặc Quản trị hệ thống.',
  })
  async removeAllocation(
    @Param('id') id: string,
    @Request() req: { user: JwtPayload },
  ) {
    return this.budgetService.removeAllocation(id, req.user);
  }

  /**
   * Phân bổ ngân sách hàng năm theo quy tắc 20/80
   */
  @Post('distribute-annual/:costCenterId/:fiscalYear')
  @Roles(
    UserRole.FINANCE,
    UserRole.DIRECTOR,
    UserRole.CEO,
    UserRole.PLATFORM_ADMIN,
  )
  @ApiOperation({
    summary: 'Phân bổ ngân sách năm 2026 (20% Dự phòng, 80% Quý)',
    description:
      'Thực hiện phân bổ ngân sách hàng năm từ Cost Center: trích 20% vào quỹ dự phòng và chia 80% còn lại cho 4 quý (mỗi quý 20%).',
  })
  async distributeAnnual(
    @Param('costCenterId') costCenterId: string,
    @Param('fiscalYear') fiscalYear: string,
    @Request() req: { user: JwtPayload },
  ) {
    return this.budgetService.distributeAnnualBudget(
      costCenterId,
      parseInt(fiscalYear),
      req.user,
    );
  }

  /**
   * Kết thúc quý: Chuyển tiền thừa vào quỹ dự phòng
   */
  @Post('reconcile-quarter/:costCenterId/:fiscalYear/:quarter')
  @Roles(
    UserRole.FINANCE,
    UserRole.DIRECTOR,
    UserRole.CEO,
    UserRole.PLATFORM_ADMIN,
  )
  @ApiOperation({
    summary: 'Quyết toán quý: Chuyển tiền thừa vào dự phòng',
    description:
      'Thu hồi số tiền chưa sử dụng hết của một quý và cộng dồn vào quỹ dự phòng của Cost Center đó.',
  })
  async reconcileQuarter(
    @Param('costCenterId') costCenterId: string,
    @Param('fiscalYear') fiscalYear: string,
    @Param('quarter') quarter: string,
    @Request() req: { user: JwtPayload },
  ) {
    return this.budgetService.reconcileQuarterToReserve(
      costCenterId,
      req.user.orgId,
      parseInt(fiscalYear),
      parseInt(quarter),
      req.user,
    );
  }

  /**
   * Lấy phân bổ ngân sách theo quý của một trung tâm chi phí
   */
  @Get('allocations/quarterly/:costCenterId/:fiscalYear/:quarter')
  @ApiOperation({
    summary: 'Lấy phân bổ ngân sách quý',
    description:
      'Truy vấn khoản phân bổ ngân sách cụ thể của một trung tâm chi phí cho một quý và năm tài chính xác định.',
  })
  async findQuarterlyAllocation(
    @Param('costCenterId') costCenterId: string,
    @Param('fiscalYear') fiscalYear: string,
    @Param('quarter') quarter: string,
    @Request() req: { user: JwtPayload },
  ) {
    return this.budgetService.findQuarterlyAllocation(
      costCenterId,
      req.user.orgId,
      parseInt(fiscalYear),
      parseInt(quarter),
    );
  }
}
