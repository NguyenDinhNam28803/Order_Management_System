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

@Controller('approval-module')
@UseGuards(JwtAuthGuard)
export class ApprovalModuleController {
  constructor(private readonly approvalService: ApprovalModuleService) {}

  /**
   * Lấy danh sách các yêu cầu đang chờ tôi duyệt
   * GET /approval-module/pending
   */
  @Get('pending')
  async getMyPending(@Req() req: any) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const userId = req.user.sub || req.user.id; // Tùy thuộc vào payload của JWT
    return this.approvalService.getMyPendingApprovals(userId as string);
  }

  /**
   * Thực hiện hành động Duyệt hoặc Từ chối
   * POST /approval-module/:id/action
   */
  @Post(':id/action')
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
