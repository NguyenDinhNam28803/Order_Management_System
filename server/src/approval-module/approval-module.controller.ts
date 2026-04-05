import {
  Controller,
  Get,
  Body,
  Param,
  UseGuards,
  Req,
  Patch,
} from '@nestjs/common';
import { ApprovalModuleService } from './approval-module.service';
import { JwtAuthGuard } from '../auth-module/jwt-auth.guard';
import { RolesGuard, Roles } from '../common/roles.guard';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { ActionApprovalDto } from './dto/action-approval.dto';

@ApiTags('Approval Workflow')
@Controller('approvals')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ApprovalModuleController {
  constructor(private readonly approvalService: ApprovalModuleService) {}

  /**
   * Lấy danh sách các yêu cầu đang chờ người dùng hiện tại phê duyệt
   * Chỉ những role có quyền duyệt mới được phép xem (FINANCE, DIRECTOR, CEO, PLATFORM_ADMIN)
   * @param req Yêu cầu chứa thông tin người dùng từ JWT
   * @returns Danh sách các yêu cầu đang chờ duyệt
   */
  @Get('pending')
  @Roles(
    UserRole.FINANCE,
    UserRole.DIRECTOR,
    UserRole.CEO,
    UserRole.PLATFORM_ADMIN,
  )
  @ApiOperation({
    summary: 'Lấy danh sách các yêu cầu đang chờ tôi duyệt',
    description:
      'Trả về danh sách các yêu cầu đang chờ tôi duyệt. Chỉ các role FINANCE, DIRECTOR, CEO, PLATFORM_ADMIN mới được xem',
  })
  async getMyPending(@Req() req: any) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const userId = req.user.sub || req.user.id; // Tùy thuộc vào payload của JWT
    return this.approvalService.getMyPendingApprovals(userId as string);
  }

  /**
   * Thực hiện hành động Duyệt (APPROVE) hoặc Từ chối (REJECT) cho một yêu cầu
   * Chỉ những role có quyền duyệt mới được phép (FINANCE, DIRECTOR, CEO, PLATFORM_ADMIN)
   * @param workflowId ID của quy trình phê duyệt
   * @param body Dữ liệu hành động (action) và nhận xét (comment)
   * @param req Thông tin người thực hiện hành động
   * @returns Kết quả xử lý phê duyệt
   */
  @Patch(':id/action')
  @Roles(
    UserRole.FINANCE,
    UserRole.DIRECTOR,
    UserRole.CEO,
    UserRole.PLATFORM_ADMIN,
  )
  @ApiOperation({
    summary: 'Thực hiện hành động Duyệt hoặc Từ chối',
    description:
      'Thực hiện hành động Duyệt hoặc Từ chối cho một yêu cầu cụ thể đang chờ duyệt. Chỉ các role FINANCE, DIRECTOR, CEO, PLATFORM_ADMIN mới được thực hiện',
  })
  async action(
    @Param('id') workflowId: string,
    @Body() body: ActionApprovalDto,
    @Req() req: any,
  ) {
    return this.approvalService.handleAction(
      workflowId,
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      req.user,
      body.action,
      body.comment,
    );
  }
}
