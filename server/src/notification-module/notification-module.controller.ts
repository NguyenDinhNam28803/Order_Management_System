import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { NotificationModuleService } from './notification-module.service';
import { CreateNotificationTemplateDto } from './dto/create-notification-template.dto';
import { SendNotificationDto } from './dto/send-notification.dto';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth-module/jwt-auth.guard';

@ApiTags('Notification Management')
@Controller('notifications')
export class NotificationModuleController {
  constructor(private readonly service: NotificationModuleService) {}

  /**
   * Tạo một mẫu thông báo (template) mới
   * @param dto Dữ liệu mẫu thông báo
   * @returns Mẫu thông báo vừa tạo
   */
  @Post('templates')
  @ApiOperation({ summary: 'Create a new notification template' })
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard)
  async createTemplate(@Body() dto: CreateNotificationTemplateDto) {
    return this.service.createTemplate(dto);
  }

  /**
   * Lấy danh sách tất cả các mẫu thông báo hiện có
   * @returns Danh sách các mẫu thông báo
   */
  @Get('templates')
  @ApiOperation({ summary: 'Get all notification templates' })
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard)
  async findAllTemplates() {
    return this.service.findAllTemplates();
  }

  /**
   * Gửi thông báo cho một người dùng cụ thể
   * @param dto Dữ liệu gửi thông báo (người nhận, nội dung, loại thông báo)
   * @returns Kết quả gửi thông báo
   */
  @Post('send')
  @ApiOperation({ summary: 'Send a notification to a user' })
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard)
  async sendNotification(@Body() dto: SendNotificationDto) {
    return this.service.sendNotification(dto);
  }

  /**
   * Lấy tất cả các thông báo của một người nhận cụ thể theo ID
   * @param id ID của người nhận thông báo
   * @returns Danh sách các thông báo của người nhận đó
   */
  @Get('recipient/:id')
  @ApiOperation({ summary: 'Get all notifications for a specific recipient' })
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard)
  async findAllByRecipient(@Param('id') id: string) {
    return this.service.findAllByRecipient(id);
  }
}
