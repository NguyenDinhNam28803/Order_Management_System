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
import { UserRole } from '@prisma/client';
import { JwtPayload } from '../auth-module/interfaces/jwt-payload.interface';
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
  @Roles(UserRole.FINANCE, UserRole.PLATFORM_ADMIN)
  @ApiOperation({ summary: 'Tạo mới chu kỳ ngân sách' })
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
  @ApiOperation({ summary: 'Lấy tất cả các chu kỳ ngân sách' })
  async findAllPeriods(@Request() req: { user: JwtPayload }) {
    return this.budgetService.findAllPeriods(req.user);
  }

  /**
   * Cập nhật chu kỳ ngân sách
   */
  @Patch('periods/:id')
  @Roles(UserRole.FINANCE, UserRole.PLATFORM_ADMIN)
  @ApiOperation({ summary: 'Cập nhật chu kỳ ngân sách' })
  async updatePeriod(
    @Param('id') id: string,
    @Body() dto: UpdateBudgetPeriodDto,
  ) {
    return this.budgetService.updatePeriod(id, dto);
  }

  /**
   * Xóa chu kỳ ngân sách
   */
  @Delete('periods/:id')
  @Roles(UserRole.FINANCE, UserRole.PLATFORM_ADMIN)
  @ApiOperation({ summary: 'Xóa chu kỳ ngân sách' })
  async removePeriod(@Param('id') id: string) {
    return this.budgetService.removePeriod(id);
  }

  // Budget Allocations
  /**
   * Tạo một khoản phân bổ ngân sách mới
   */
  @Post('allocations')
  @Roles(UserRole.FINANCE, UserRole.PLATFORM_ADMIN)
  @ApiOperation({ summary: 'Tạo một phân bổ ngân sách mới' })
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
  @ApiOperation({ summary: 'Lấy tất cả phân bổ ngân sách' })
  async findAllAllocations(@Request() req: { user: JwtPayload }) {
    return this.budgetService.findAllAllocations(req.user);
  }

  /**
   * Lấy thông tin chi tiết một khoản phân bổ ngân sách theo ID
   */
  @Get('allocations/:id')
  @ApiOperation({ summary: 'Lấy chi tiết phân bổ ngân sách theo ID' })
  async findAllocationOne(@Param('id') id: string) {
    return this.budgetService.findAllocationOne(id);
  }

  /**
   * Cập nhật thông tin một khoản phân bổ ngân sách theo ID
   */
  @Patch('allocations/:id')
  @Roles(UserRole.FINANCE, UserRole.PLATFORM_ADMIN)
  @ApiOperation({ summary: 'Cập nhật phân bổ ngân sách' })
  async updateAllocation(
    @Param('id') id: string,
    @Body() dto: UpdateBudgetAllocationDto,
  ) {
    return this.budgetService.updateAllocation(id, dto);
  }

  /**
   * Xóa một khoản phân bổ ngân sách theo ID
   */
  @Delete('allocations/:id')
  @Roles(UserRole.FINANCE, UserRole.PLATFORM_ADMIN)
  @ApiOperation({ summary: 'Xóa một phân bổ ngân sách' })
  async removeAllocation(@Param('id') id: string) {
    return this.budgetService.removeAllocation(id);
  }
}
