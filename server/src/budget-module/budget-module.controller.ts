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
  @Post('periods')
  @ApiOperation({ summary: 'Create a new budget period' })
  async createPeriod(
    @Body() dto: CreateBudgetPeriodDto,
    @Request() req: { user: JwtPayload },
  ) {
    return this.budgetService.createPeriod(dto, req.user);
  }

  @Get('periods')
  @ApiOperation({ summary: 'Get all budget periods' })
  async findAllPeriods(@Request() req: { user: JwtPayload }) {
    return this.budgetService.findAllPeriods(req.user);
  }

  // Budget Allocations
  @Post('allocations')
  @ApiOperation({ summary: 'Create a new budget allocation' })
  async createAllocation(
    @Body() dto: CreateBudgetAllocationDto,
    @Request() req: { user: JwtPayload },
  ) {
    return this.budgetService.createAllocation(dto, req.user);
  }

  @Get('allocations')
  @ApiOperation({ summary: 'Get all budget allocations' })
  async findAllAllocations(@Request() req: { user: JwtPayload }) {
    return this.budgetService.findAllAllocations(req.user);
  }

  @Get('allocations/:id')
  @ApiOperation({ summary: 'Get budget allocation detail by ID' })
  async findAllocationOne(@Param('id') id: string) {
    return this.budgetService.findAllocationOne(id);
  }

  @Patch('allocations/:id')
  @ApiOperation({ summary: 'Update budget allocation' })
  async updateAllocation(
    @Param('id') id: string,
    @Body() dto: UpdateBudgetAllocationDto,
  ) {
    return this.budgetService.updateAllocation(id, dto);
  }

  @Delete('allocations/:id')
  @ApiOperation({ summary: 'Delete a budget allocation' })
  async removeAllocation(@Param('id') id: string) {
    return this.budgetService.removeAllocation(id);
  }
}
