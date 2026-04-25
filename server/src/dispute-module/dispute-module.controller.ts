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
import { DisputeModuleService } from './dispute-module.service';
import { CreateDisputeModuleDto } from './dto/create-dispute-module.dto';
import { UpdateDisputeModuleDto } from './dto/update-dispute-module.dto';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth-module/jwt-auth.guard';
import { RolesGuard, Roles } from '../common/roles.guard';
import { UserRole } from '@prisma/client';

@ApiTags('Dispute Management')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('disputes')
export class DisputeModuleController {
  constructor(private readonly disputeModuleService: DisputeModuleService) {}

  /**
   * Tạo một khiếu nại hoặc tranh chấp mới
   * @param createDisputeModuleDto Dữ liệu tạo tranh chấp
   * @returns Tranh chấp vừa tạo
   */
  @Post()
  @Roles(UserRole.REQUESTER, UserRole.PROCUREMENT, UserRole.FINANCE, UserRole.DEPT_APPROVER, UserRole.DIRECTOR, UserRole.CEO, UserRole.PLATFORM_ADMIN)
  @ApiOperation({ summary: 'Tạo khiếu nại/tranh chấp mới' })
  create(@Body() createDisputeModuleDto: CreateDisputeModuleDto) {
    return this.disputeModuleService.create(createDisputeModuleDto);
  }

  @Get()
  @Roles(UserRole.PROCUREMENT, UserRole.FINANCE, UserRole.DEPT_APPROVER, UserRole.DIRECTOR, UserRole.CEO, UserRole.PLATFORM_ADMIN)
  @ApiOperation({ summary: 'Lấy tất cả khiếu nại/tranh chấp' })
  findAll() {
    return this.disputeModuleService.findAll();
  }

  @Get(':id')
  @Roles(UserRole.REQUESTER, UserRole.PROCUREMENT, UserRole.FINANCE, UserRole.DEPT_APPROVER, UserRole.DIRECTOR, UserRole.CEO, UserRole.PLATFORM_ADMIN)
  @ApiOperation({ summary: 'Lấy chi tiết khiếu nại/tranh chấp theo ID' })
  findOne(@Param('id') id: string) {
    return this.disputeModuleService.findOne(+id);
  }

  @Patch(':id')
  @Roles(UserRole.PROCUREMENT, UserRole.FINANCE, UserRole.DEPT_APPROVER, UserRole.DIRECTOR, UserRole.CEO, UserRole.PLATFORM_ADMIN)
  @ApiOperation({ summary: 'Cập nhật khiếu nại/tranh chấp theo ID' })
  update(
    @Param('id') id: string,
    @Body() updateDisputeModuleDto: UpdateDisputeModuleDto,
  ) {
    return this.disputeModuleService.update(+id, updateDisputeModuleDto);
  }

  @Delete(':id')
  @Roles(UserRole.DIRECTOR, UserRole.CEO, UserRole.PLATFORM_ADMIN)
  @ApiOperation({ summary: 'Xóa khiếu nại/tranh chấp theo ID' })
  remove(@Param('id') id: string) {
    return this.disputeModuleService.remove(+id);
  }
}
