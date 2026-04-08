import {
  Controller,
  Post,
  Param,
  Body,
  UseGuards,
  Request,
} from '@nestjs/common';
import { SupplierKpimoduleService } from './supplier-kpimodule.service';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth-module/jwt-auth.guard';
import { RolesGuard, Roles } from '../common/roles.guard';
import { UserRole } from '@prisma/client';
import type { JwtPayload } from '../auth-module/interfaces/jwt-payload.interface';

@ApiTags('Supplier KPI Management (AI-Powered)')
@Controller('supplier-kpis')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
export class SupplierKpimoduleController {
  constructor(
    private readonly supplierKpimoduleService: SupplierKpimoduleService,
  ) {}

  /**
   * Kích hoạt AI đánh giá hiệu năng của một nhà cung cấp dựa trên dữ liệu lịch sử
   * @param supplierId ID của nhà cung cấp cần đánh giá
   * @param req Thông tin người dùng để lấy orgId của bên mua
   * @returns Kết quả đánh giá KPI và phân tích từ AI
   */
  @Post('evaluate/:supplierId')
  @Roles(UserRole.PROCUREMENT, UserRole.FINANCE, UserRole.PLATFORM_ADMIN)
  @ApiOperation({
    summary: 'Kích hoạt AI đánh giá nhà cung cấp',
    description:
      'Tính toán OTD, Quality và gọi AI để phân tích hiệu năng nhà cung cấp',
  })
  evaluate(
    @Param('supplierId') supplierId: string,
    @Request() req: JwtPayload,
    @Body() body?: { orgId?: string },
  ) {
    // Use orgId from body as fallback if not in JWT
    const buyerOrgId = req.orgId || body?.orgId;
    if (!buyerOrgId) {
      throw new Error('orgId is required. Please provide orgId in request body or ensure user has an organization assigned.');
    }
    return this.supplierKpimoduleService.evaluateSupplierPerformance(
      supplierId,
      buyerOrgId,
    );
  }

  /**
   * Lấy báo cáo KPI tổng hợp của một nhà cung cấp (bao gồm lịch sử các quý)
   * @param supplierId ID của nhà cung cấp
   * @param req Thông tin người dùng
   * @returns Danh sách các bản ghi KPI gần nhất
   */
  @Post('report/:supplierId')
  @ApiOperation({
    summary: 'Lấy báo cáo KPI nhà cung cấp',
    description:
      'Trả về lịch sử đánh giá KPI của nhà cung cấp trong các quý gần nhất',
  })
  getReport(
    @Param('supplierId') supplierId: string,
    @Request() user: JwtPayload,
    @Body() body?: { orgId?: string },
  ) {
    // Use orgId from body as fallback if not in JWT
    const buyerOrgId = user.orgId || body?.orgId;
    if (!buyerOrgId) {
      throw new Error('orgId is required. Please provide orgId in request body or ensure user has an organization assigned.');
    }
    return this.supplierKpimoduleService.getSupplierReport(
      supplierId,
      buyerOrgId,
    );
  }
}
