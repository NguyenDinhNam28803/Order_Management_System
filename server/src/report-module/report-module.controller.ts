import { Controller, Get, UseGuards, Request } from '@nestjs/common';
import { ReportModuleService } from './report-module.service';
import { JwtAuthGuard } from '../auth-module/jwt-auth.guard';
import { JwtPayload } from '../auth-module/interfaces/jwt-payload.interface';
import { ApiOperation, ApiTags, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('Report Management')
@ApiBearerAuth('JWT-auth')
@Controller('reports')
@UseGuards(JwtAuthGuard)
export class ReportModuleController {
  constructor(private readonly reportModuleService: ReportModuleService) {}

  /**
   * Lấy tổng quan về các hoạt động mua hàng
   */
  @Get('overview')
  @ApiOperation({ summary: 'Lấy tổng quan hoạt động mua hàng' })
  getOverview(@Request() req: { user: JwtPayload }) {
    return this.reportModuleService.getProcurementOverview(req.user.orgId);
  }

  /**
   * Thống kê chi tiêu theo nhà cung cấp
   */
  @Get('spend-by-supplier')
  @ApiOperation({ summary: 'Thống kê chi tiêu theo nhà cung cấp' })
  getSpendBySupplier(@Request() req: { user: JwtPayload }) {
    return this.reportModuleService.getSpendBySupplier(req.user.orgId);
  }

  /**
   * Thống kê chi tiêu theo danh mục
   */
  @Get('spend-by-category')
  @ApiOperation({ summary: 'Thống kê chi tiêu theo danh mục sản phẩm' })
  getSpendByCategory(@Request() req: { user: JwtPayload }) {
    return this.reportModuleService.getSpendByCategory(req.user.orgId);
  }

  /**
   * Lấy lịch sử chi tiêu
   */
  @Get('spend-history')
  @ApiOperation({ summary: 'Lấy lịch sử chi tiêu theo thời gian' })
  getSpendHistory(@Request() req: { user: JwtPayload }) {
    return this.reportModuleService.getSpendHistory(req.user.orgId);
  }
}
