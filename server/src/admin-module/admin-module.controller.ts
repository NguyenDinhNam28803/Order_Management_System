import { Controller, Get, Post, Patch, Param, Delete } from '@nestjs/common';
import { AdminModuleService } from './admin-module.service';
import { CreateAdminModuleDto } from './dto/create-admin-module.dto';
import { UpdateAdminModuleDto } from './dto/update-admin-module.dto';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth-module/jwt-auth.guard';
import { RolesGuard, Roles } from '../common/roles.guard';
import { UserRole } from '@prisma/client';
import { JwtPayload } from '../auth-module/interfaces/jwt-payload.interface';

@ApiTags('Admin Module')
@Controller('admin')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.PLATFORM_ADMIN, UserRole.SYSTEM)
export class AdminModuleController {
  constructor(private readonly adminModuleService: AdminModuleService) {}

  @Get('stats')
  @ApiOperation({ summary: 'Thống kê toàn hệ thống' })
  getPlatformStats() {
    return this.adminModuleService.getPlatformStats();
  }

  @Post()
  @ApiOperation({ summary: 'Tạo bản ghi audit log thủ công' })
  create(
    @Body() createAdminModuleDto: CreateAdminModuleDto,
    @Request() req: { user: JwtPayload },
  ) {
    return this.adminModuleService.create(createAdminModuleDto, req.user);
  }

  @Get()
  @ApiOperation({ summary: 'Lấy danh sách audit logs (có phân trang)' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  findAll(@Query('page') page?: string, @Query('limit') limit?: string) {
    return this.adminModuleService.findAll(
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 50,
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Lấy chi tiết audit log theo ID' })
  findOne(@Param('id') id: string) {
    return this.adminModuleService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Cập nhật ghi chú audit log theo ID' })
  update(
    @Param('id') id: string,
    @Body() updateAdminModuleDto: UpdateAdminModuleDto,
  ) {
    return this.adminModuleService.update(id, updateAdminModuleDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Xóa audit log theo ID' })
  remove(@Param('id') id: string) {
    return this.adminModuleService.remove(id);
  }
}
