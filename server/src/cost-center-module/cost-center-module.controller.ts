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
import {
  ApiTags,
  ApiOperation,
  ApiQuery,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { CostCenterModuleService } from './cost-center-module.service';
import {
  CreateCostCenterDto,
  UpdateCostCenterDto,
} from './dto/cost-center.dto';
import { JwtAuthGuard } from '../auth-module/jwt-auth.guard';

@ApiTags('Cost-center-module')
@Controller('cost-center')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
export class CostCenterModuleController {
  constructor(private readonly costCenterService: CostCenterModuleService) {}

  @Post()
  @ApiOperation({
    summary: 'Tạo trung tâm chi phí mới',
    description: 'Tạo một trung tâm chi phí mới cho tổ chức hiện tại',
  })
  create(@Body() createCostCenterDto: CreateCostCenterDto) {
    return this.costCenterService.create(createCostCenterDto);
  }

  @Get()
  @ApiOperation({
    summary: 'Lấy tất cả trung tâm chi phí cho một tổ chức',
    description:
      'Trả về danh sách tất cả trung tâm chi phí cho tổ chức hiện tại',
  })
  @ApiQuery({ name: 'orgId', required: true })
  findAll(@Query('orgId') orgId: string) {
    return this.costCenterService.findAll(orgId);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Lấy chi tiết trung tâm chi phí theo ID',
    description: 'Trả về thông tin chi tiết của một trung tâm chi phí cụ thể',
  })
  findOne(@Param('id') id: string) {
    return this.costCenterService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Cập nhật trung tâm chi phí',
    description: 'Cập nhật thông tin của một trung tâm chi phí cụ thể',
  })
  update(
    @Param('id') id: string,
    @Body() updateCostCenterDto: UpdateCostCenterDto,
  ) {
    return this.costCenterService.update(id, updateCostCenterDto);
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Xóa trung tâm chi phí',
    description: 'Xóa một trung tâm chi phí cụ thể',
  })
  remove(@Param('id') id: string) {
    return this.costCenterService.remove(id);
  }
}
