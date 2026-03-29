import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { AdminModuleService } from './admin-module.service';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth-module/jwt-auth.guard';
import { RolesGuard, Roles } from '../common/roles.guard';
import { UserRole } from '@prisma/client';

@ApiTags('Admin Module')
@Controller('admin')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.PLATFORM_ADMIN, UserRole.SYSTEM)
export class AdminModuleController {
  constructor(private readonly adminModuleService: AdminModuleService) {}

  /**
   * Tạo mới một bản ghi quản trị
   * @returns Bản ghi vừa được tạo
   */
  @Post()
  @ApiOperation({ summary: 'Tạo bản ghi quản trị mới' })
  create() {
    return this.adminModuleService.create();
  }

  /**
   * Lấy danh sách tất cả các bản ghi quản trị
   * @returns Danh sách bản ghi
   */
  @Get()
  @ApiOperation({ summary: 'Lấy tất cả bản ghi quản trị' })
  findAll() {
    return this.adminModuleService.findAll();
  }

  /**
   * Lấy thông tin chi tiết một bản ghi quản trị theo ID
   * @param id ID của bản ghi
   * @returns Thông tin chi tiết bản ghi
   */
  @Get(':id')
  @ApiOperation({ summary: 'Lấy chi tiết bản ghi quản trị theo ID' })
  findOne(@Param('id') id: string) {
    return this.adminModuleService.findOne(+id);
  }

  /**
   * Cập nhật thông tin một bản ghi quản trị theo ID
   * @param id ID của bản ghi cần cập nhật
   * @returns Bản ghi sau khi cập nhật
   */
  @Patch(':id')
  @ApiOperation({ summary: 'Cập nhật bản ghi quản trị theo ID' })
  update(@Param('id') id: string) {
    return this.adminModuleService.update(+id);
  }

  /**
   * Xóa một bản ghi quản trị theo ID
   * @param id ID của bản ghi cần xóa
   * @returns Kết quả xóa
   */
  @Delete(':id')
  @ApiOperation({ summary: 'Xóa bản ghi quản trị theo ID' })
  remove(@Param('id') id: string) {
    return this.adminModuleService.remove(+id);
  }
}
