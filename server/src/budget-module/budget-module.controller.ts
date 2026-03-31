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
import { BudgetPeriodType, UserRole } from '@prisma/client';
import type { JwtPayload } from '../auth-module/interfaces/jwt-payload.interface';
import { BudgetModuleService } from './budget-module.service';
import {
  CreateBudgetAllocationDto,
  CreateBudgetPeriodDto,
  UpdateBudgetAllocationDto,
  UpdateBudgetPeriodDto,
} from './dto/budget.dto';

@ApiTags('Budget Management')
@Controller('budgets')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
export class BudgetModuleController {
  constructor(private readonly budgetService: BudgetModuleService) {}

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
  /**
   * Tạo một khoản phân bổ ngân sách mới
   */
  @Post('allocations')
  @Roles(
    UserRole.FINANCE,
    UserRole.DIRECTOR,
    UserRole.CEO,
    UserRole.PLATFORM_ADMIN,
  )
  @ApiOperation({
    summary: 'Tạo một phân bổ ngân sách mới',
    description:
      'Cấp ngân sách cho một trung tâm chi phí cụ thể trong một chu kỳ ngân sách nhất định. Dành cho vai trò Tài chính, Giám đốc hoặc Quản trị hệ thống.',
  })
  async createAllocation(
    @Body() dto: CreateBudgetAllocationDto,
    @Request() req: { user: JwtPayload },
  ) {
    return this.budgetService.createAllocation(dto, req.user);
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
    summary: 'Phân bổ ngân sách năm (20% Dự phòng, 80% Quý)',
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
  @Roles(UserRole.FINANCE, UserRole.PLATFORM_ADMIN)
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
}
