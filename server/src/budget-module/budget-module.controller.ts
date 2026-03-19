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
import { JwtPayload } from '../auth-module/interfaces/jwt-payload.interface';
import { BudgetModuleService } from './budget-module.service';
import {
  CreateBudgetAllocationDto,
  CreateBudgetPeriodDto,
  UpdateBudgetAllocationDto,
} from './dto/budget.dto';

@ApiTags('Budget Management')
@Controller('budgets')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
export class BudgetModuleController {
  constructor(private readonly budgetService: BudgetModuleService) {}

  // Budget Periods
  /**
   * Tạo một chu kỳ ngân sách mới
   * @param dto Dữ liệu chu kỳ ngân sách
   * @param req Thông tin người dùng từ JWT
   * @returns Chu kỳ ngân sách vừa tạo
   */
  @Post('periods')
  @ApiOperation({ summary: 'Tạo mới chu kỳ ngân sách' })
  async createPeriod(
    @Body() dto: CreateBudgetPeriodDto,
    @Request() req: { user: JwtPayload },
  ) {
    return this.budgetService.createPeriod(dto, req.user);
  }

  /**
   * Lấy danh sách tất cả các chu kỳ ngân sách
   * @param req Thông tin người dùng từ JWT
   * @returns Danh sách các chu kỳ ngân sách
   */
  @Get('periods')
  @ApiOperation({ summary: 'Get all budget periods' })
  async findAllPeriods(@Request() req: { user: JwtPayload }) {
    return this.budgetService.findAllPeriods(req.user);
  }

  // Budget Allocations
  /**
   * Tạo một khoản phân bổ ngân sách mới
   * @param dto Dữ liệu phân bổ ngân sách
   * @param req Thông tin người dùng từ JWT
   * @returns Khoản phân bổ vừa tạo
   */
  @Post('allocations')
  @ApiOperation({ summary: 'Create a new budget allocation' })
  async createAllocation(
    @Body() dto: CreateBudgetAllocationDto,
    @Request() req: { user: JwtPayload },
  ) {
    return this.budgetService.createAllocation(dto, req.user);
  }

  /**
   * Lấy danh sách tất cả các khoản phân bổ ngân sách
   * @param req Thông tin người dùng từ JWT
   * @returns Danh sách các khoản phân bổ ngân sách
   */
  @Get('allocations')
  @ApiOperation({ summary: 'Get all budget allocations' })
  async findAllAllocations(@Request() req: { user: JwtPayload }) {
    return this.budgetService.findAllAllocations(req.user);
  }

  /**
   * Lấy thông tin chi tiết một khoản phân bổ ngân sách theo ID
   * @param id ID của khoản phân bổ
   * @returns Thông tin chi tiết phân bổ ngân sách
   */
  @Get('allocations/:id')
  @ApiOperation({ summary: 'Get budget allocation detail by ID' })
  async findAllocationOne(@Param('id') id: string) {
    return this.budgetService.findAllocationOne(id);
  }

  /**
   * Cập nhật thông tin một khoản phân bổ ngân sách theo ID
   * @param id ID của khoản phân bổ
   * @param dto Dữ liệu cập nhật
   * @returns Khoản phân bổ sau khi cập nhật
   */
  @Patch('allocations/:id')
  @ApiOperation({ summary: 'Update budget allocation' })
  async updateAllocation(
    @Param('id') id: string,
    @Body() dto: UpdateBudgetAllocationDto,
  ) {
    return this.budgetService.updateAllocation(id, dto);
  }

  /**
   * Xóa một khoản phân bổ ngân sách theo ID
   * @param id ID của khoản phân bổ
   * @returns Kết quả xóa
   */
  @Delete('allocations/:id')
  @ApiOperation({ summary: 'Delete a budget allocation' })
  async removeAllocation(@Param('id') id: string) {
    return this.budgetService.removeAllocation(id);
  }
}
