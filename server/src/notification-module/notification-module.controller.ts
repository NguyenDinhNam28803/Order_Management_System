import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { NotificationModuleService } from './notification-module.service';
import { CreateNotificationTemplateDto } from './dto/create-notification-template.dto';
import { SendNotificationDto } from './dto/send-notification.dto';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiProperty,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth-module/jwt-auth.guard';
import { EmailService } from './email.service';
import { EmailTemplatesService } from './email-template.service';
import { IsEmail, IsNotEmpty, IsObject, IsString } from 'class-validator';

export class EmailRequest {
  @ApiProperty({ example: 'user@gmail.com', description: 'Email người nhận' })
  @IsEmail()
  @IsNotEmpty()
  to!: string;

  @ApiProperty({ example: 'Thông báo đơn hàng', description: 'Tiêu đề email' })
  @IsString()
  @IsNotEmpty()
  subject!: string;

  @ApiProperty({
    example: { orderId: '123', status: 'Approved' },
    description: 'Dữ liệu để render template',
  })
  @IsObject()
  @IsNotEmpty()
  data!: Record<string, any>;
}

@ApiTags('Notification Management')
@Controller('notifications')
export class NotificationModuleController {
  constructor(
    private readonly service: NotificationModuleService,
    private readonly emailService: EmailService,
    private readonly emailTemplatesService: EmailTemplatesService,
  ) {}

  /**
   * Tạo một mẫu thông báo (template) mới
   * @param dto Dữ liệu mẫu thông báo
   * @returns Mẫu thông báo vừa tạo
   */
  @Post('templates')
  @ApiOperation({ summary: 'Tạo mẫu thông báo mới' })
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
  @ApiOperation({ summary: 'Lấy tất cả mẫu thông báo' })
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
  @ApiOperation({ summary: 'Gửi thông báo cho người dùng' })
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
  @ApiOperation({ summary: 'Lấy tất cả thông báo của một người nhận' })
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard)
  async findAllByRecipient(@Param('id') id: string) {
    return this.service.findAllByRecipient(id);
  }

  /**
   * Check connection email
   */
  @Post('/check-connection')
  @ApiOperation({
    summary: 'Check kết nối',
  })
  async Check() {
    return await this.emailService.verifyConnection();
  }

  /**
   *  Gửi email thông báo với nội dung được tạo từ mẫu
   * @param to Địa chỉ email người nhận
   * @param subject Chủ đề email
   * @param data Dữ liệu để điền vào mẫu email
   * @return Kết quả gửi email
   * @description Phương thức này sẽ sử dụng EmailTemplatesService để tạo nội dung email dựa trên mẫu và dữ liệu đầu vào, sau đó sử dụng EmailService để gửi email đến người nhận.
   */
  @Post('send-email')
  @ApiOperation({
    summary: 'test gửi email',
    description: 'Gửi email thông báo với nội dung được tạo từ mẫu',
  })
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard)
  async sendEmailNotification(@Body() data: EmailRequest) {
    const html = this.emailTemplatesService.render(data.subject, data.data);
    await this.emailService.sendEmail(data.to, data.subject, html);
  }
}
