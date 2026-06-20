import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class EmailService {
  private transporter: nodemailer.Transporter;
  private readonly logger = new Logger(EmailService.name);
  private readonly configService: ConfigService;

  constructor(configService: ConfigService) {
    this.configService = configService;
    this.transporter = nodemailer.createTransport({
      host: this.configService.get('EMAIL_HOST'),
      port: parseInt(this.configService.get('EMAIL_PORT') || '587'),
      secure: this.configService.get('EMAIL_SECURE') === 'true', // true for 465, false for other ports
      auth: {
        user: this.configService.get('EMAIL_USER'),
        pass: this.configService.get('EMAIL_PASS'),
      },
    });
  }

  // Xác minh connection email
  async verifyConnection() {
    try {
      await this.transporter.verify();
      this.logger.log('✅ Mail server connected successfully');
      return '✅ Check thành công';
    } catch (error: any) {
      this.logger.error('❌ Mail server connection failed:', error.message);
      return '❌ Kết nối thất bại';
    }
  }

  sendEmail(
    to: string,
    subject: string,
    _body: string,
    _attachments?: { filename: string; content: Buffer; contentType: string }[],
  ) {
    // EMAIL DISABLED — tất cả gửi email đã bị tắt hoàn toàn
    this.logger.warn(
      `[EMAIL DISABLED] Bỏ qua gửi email → to=${to} subject="${subject}"`,
    );
    return Promise.resolve(true);
  }
}
