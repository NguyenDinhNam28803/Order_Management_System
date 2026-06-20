import { Controller, Post, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth-module/jwt-auth.guard';
import { RolesGuard, Roles } from '../common/roles.guard';
import { UserRole } from '@prisma/client';
import { POAutomationService } from './po-automation.service';

@ApiTags('PO Automation')
@Controller('po-automation')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.PLATFORM_ADMIN)
@ApiBearerAuth()
export class POAutomationController {
  constructor(private readonly poAutomationService: POAutomationService) {}

  @Post('process/:poId')
  @ApiOperation({ summary: 'Xử lý automation sau khi tạo PO' })
  async processPOAutomation(@Param('poId') poId: string) {
    return this.poAutomationService.processPOAutomation(poId);
  }

  // @Post('config')
  // @ApiOperation({ summary: 'Cập nhật cấu hình automation' })
  // async updateConfig(@Body() config: ProcessAutomationDto) {
  //   return this.poAutomationService.updateConfig(config);
  // }

  @Post('send-contract-email/:contractId')
  @ApiOperation({ summary: 'Gửi email thông báo hợp đồng cho nhà cung cấp' })
  async sendContractEmail(@Param('contractId') contractId: string) {
    return this.poAutomationService.sendContractEmail(contractId);
  }
}
