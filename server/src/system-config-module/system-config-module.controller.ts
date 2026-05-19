import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Request,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth-module/jwt-auth.guard';
import { RolesGuard, Roles } from '../common/roles.guard';
import { UserRole } from '@prisma/client';
import { SystemConfigModuleService } from './system-config-module.service';
import { UpsertSystemConfigDto } from './dto/system-config.dto';
import { JwtPayload } from '../auth-module/interfaces/jwt-payload.interface';

@ApiTags('System Configuration')
@Controller('system-configs')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.PLATFORM_ADMIN, UserRole.DIRECTOR, UserRole.CEO)
export class SystemConfigModuleController {
  constructor(private readonly configService: SystemConfigModuleService) {}

  @Get()
  @ApiOperation({ summary: 'Lấy tất cả cấu hình hệ thống của tổ chức' })
  findAll(@Request() req: { user: JwtPayload }) {
    return this.configService.findAll(req.user);
  }

  @Get(':key')
  @ApiOperation({ summary: 'Lấy cấu hình theo key' })
  findOne(@Param('key') key: string, @Request() req: { user: JwtPayload }) {
    return this.configService.findOne(key, req.user);
  }

  @Post()
  @ApiOperation({ summary: 'Tạo hoặc cập nhật cấu hình hệ thống (upsert)' })
  upsert(
    @Body() dto: UpsertSystemConfigDto,
    @Request() req: { user: JwtPayload },
  ) {
    return this.configService.upsert(dto, req.user);
  }

  @Delete(':key')
  @ApiOperation({ summary: 'Xóa cấu hình theo key' })
  remove(@Param('key') key: string, @Request() req: { user: JwtPayload }) {
    return this.configService.remove(key, req.user);
  }
}
