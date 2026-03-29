import { Controller, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth-module/jwt-auth.guard';
import { RolesGuard, Roles } from '../common/roles.guard';
import { UserRole } from '@prisma/client';

/**
 * Controller quản lý các cấu hình hệ thống
 */
@ApiTags('System Configuration')
@Controller('system-configs')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.PLATFORM_ADMIN, UserRole.PLATFORM_ADMIN)
export class SystemConfigModuleController {}
