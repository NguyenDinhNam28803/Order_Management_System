import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Request,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { RolesGuard, Roles } from '../common/roles.guard';
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
@Controller('cost-centers')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
export class CostCenterModuleController {
  constructor(private readonly costCenterService: CostCenterModuleService) {}

  /**
   * Tạo trung tâm chi phí mới cho tổ chức hiện tại
   * @param createCostCenterDto Dữ liệu tạo trung tâm chi phí
   * @returns Trung tâm chi phí vừa tạo
   */
  @Post()
  @ApiOperation({
    summary: 'Tạo trung tâm chi phí mới',
    description: 'Tạo một trung tâm chi phí mới cho tổ chức hiện tại',
  })
  @Roles(UserRole.FINANCE, UserRole.PLATFORM_ADMIN)
  create(@Body() createCostCenterDto: CreateCostCenterDto) {
    return this.costCenterService.create(createCostCenterDto);
  }

  /**
   * Lấy danh sách tất cả trung tâm chi phí của một tổ chức
   * @request Yêu cầu chứa thông tin người dùng đã xác thực từ JWT
   * @query orgId ID của tổ chức để lọc trung tâm chi phí
   * @returns Danh sách trung tâm chi phí
   */
  @Get()
  @ApiOperation({
    summary: 'Lấy tất cả trung tâm chi phí cho một tổ chức',
    description:
      'Trả về danh sách tất cả trung tâm chi phí cho tổ chức hiện tại theo tổ chức người dùng đã xác thực',
  })
  @ApiQuery({ name: 'orgId', required: true })
  findAll(@Request() req) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    return this.costCenterService.findAll(req.user.orgId);
  }

  @Get('/department')
  @ApiOperation({
    summary: 'Lấy tất cả trung tâm chi phí cho một tổ chức, phòng ban cụ thể',
    description:
      'Trả về danh sách tất cả trung tâm chi phí cho tổ chức và phòng ban hiện tại theo tổ chức người dùng đã xác thực',
  })
  async findWithDeptId(@Request() req) {
    return this.costCenterService.findWithDeptId(
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      req.user.deptId,
    );
  }
  /**
   * Lấy thông tin chi tiết của một trung tâm chi phí theo ID
   * @param id ID của trung tâm chi phí
   * @returns Chi tiết trung tâm chi phí
   */
  @Get(':id')
  @ApiOperation({
    summary: 'Lấy chi tiết trung tâm chi phí theo ID',
    description:
      'Truy vấn thông tin chi tiết của một trung tâm chi phí theo mã UUID',
  })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.costCenterService.findOne(id);
  }

  /**
   * Cập nhật thông tin của một trung tâm chi phí theo ID
   * @param id ID của trung tâm chi phí
   * @param updateCostCenterDto Dữ liệu cập nhật
   * @returns Trung tâm chi phí sau khi cập nhật
   */
  @Patch(':id')
  @ApiOperation({
    summary: 'Cập nhật trung tâm chi phí',
    description: 'Cập nhật thông tin của một trung tâm chi phí cụ thể',
  })
  @Roles(UserRole.FINANCE, UserRole.PLATFORM_ADMIN)
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateCostCenterDto: UpdateCostCenterDto,
  ) {
    return this.costCenterService.update(id, updateCostCenterDto);
  }

  /**
   * Xóa một trung tâm chi phí theo ID
   * @param id ID của trung tâm chi phí cần xóa
   * @returns Kết quả xóa
   */
  @Delete(':id')
  @ApiOperation({
    summary: 'Xóa trung tâm chi phí',
    description: 'Xóa một trung tâm chi phí cụ thể',
  })
  @Roles(UserRole.FINANCE, UserRole.PLATFORM_ADMIN)
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.costCenterService.remove(id);
  }
}
