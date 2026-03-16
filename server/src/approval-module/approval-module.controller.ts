import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Req,
} from '@nestjs/common';
import { ApprovalModuleService } from './approval-module.service';
import { JwtAuthGuard } from '../auth-module/jwt-auth.guard';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

@ApiTags('Approval Workflow')
@Controller('approval-module')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
export class ApprovalModuleController {
  constructor(private readonly approvalService: ApprovalModuleService) {}

  /**
   * Lấy danh sách các yêu cầu đang chờ người dùng hiện tại phê duyệt
   * @param req Yêu cầu chứa thông tin người dùng từ JWT
   * @returns Danh sách các yêu cầu đang chờ duyệt
   */
  @Get('pending')
  @ApiOperation({
    summary: 'Lấy danh sách các yêu cầu đang chờ tôi duyệt',
    description: 'Trả về danh sách các yêu cầu đang chờ tôi duyệt',
  })
  async getMyPending(@Req() req: any) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const userId = req.user.sub || req.user.id; // Tùy thuộc vào payload của JWT
    return this.approvalService.getMyPendingApprovals(userId as string);
  }

  /**
   * Thực hiện hành động Duyệt (APPROVE) hoặc Từ chối (REJECT) cho một yêu cầu
   * @param workflowId ID của quy trình phê duyệt
   * @param body Dữ liệu hành động (action) và nhận xét (comment)
   * @param req Thông tin người thực hiện hành động
   * @returns Kết quả xử lý phê duyệt
   */
  @Post(':id/action')
  @ApiOperation({
    summary: 'Thực hiện hành động Duyệt hoặc Từ chối',
    description:
      'Thực hiện hành động Duyệt hoặc Từ chối cho một yêu cầu cụ thể đang chờ duyệt',
  })
  async action(
    @Param('id') workflowId: string,
    @Body() body: { action: 'APPROVE' | 'REJECT'; comment?: string },
    @Req() req: any,
  ) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const userId = req.user.sub || req.user.id;
    return this.approvalService.handleAction(
      workflowId,
      userId as string,
      body.action,
      body.comment,
    );
  }
}
