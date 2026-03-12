import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { CostCenterModuleService } from './cost-center-module.service';
import {
  CreateCostCenterDto,
  UpdateCostCenterDto,
} from './dto/cost-center.dto';
import { JwtAuthGuard } from '../auth-module/jwt-auth.guard';

@ApiTags('cost-center-module')
@Controller('cost-center')
@UseGuards(JwtAuthGuard)
export class CostCenterModuleController {
  constructor(private readonly costCenterService: CostCenterModuleService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new cost center' })
  create(@Body() createCostCenterDto: CreateCostCenterDto) {
    return this.costCenterService.create(createCostCenterDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all cost centers for an organization' })
  @ApiQuery({ name: 'orgId', required: true })
  findAll(@Query('orgId') orgId: string) {
    return this.costCenterService.findAll(orgId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single cost center by ID' })
  findOne(@Param('id') id: string) {
    return this.costCenterService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a cost center' })
  update(
    @Param('id') id: string,
    @Body() updateCostCenterDto: UpdateCostCenterDto,
  ) {
    return this.costCenterService.update(id, updateCostCenterDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a cost center' })
  remove(@Param('id') id: string) {
    return this.costCenterService.remove(id);
  }
}
