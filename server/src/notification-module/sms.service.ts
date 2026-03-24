import { Injectable, Logger } from '@nestjs/common';
import twilio from 'twilio';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class SmsService {
  private readonly logger = new Logger(SmsService.name);
  private readonly twilioClient: twilio.Twilio;
  private readonly configService: ConfigService;

  constructor(configService: ConfigService) {
    this.configService = configService;
    this.twilioClient = twilio(
      this.configService.get('TWILIO_ACCOUNT_SID'),
      this.configService.get('TWILIO_AUTH_TOKEN'),
    );
  }

  async sendSms(to: string, body: string) {
    try {
      // Logic tích hợp Twilio, Vonage, hoặc các nhà cung cấp SMS khác ở đây
      this.logger.log(`Sending SMS to ${to}: ${body}`);

      // Gửi SMS qua Twilio
      await this.twilioClient.messages.create({
        body,
        from: process.env.TWILIO_PHONE_NUMBER,
        to,
      });
      // Giả lập gửi thành công
      return true;
    } catch (error) {
      this.logger.error(`Error sending SMS to ${to}:`, error);
      throw error;
    }
  }
}
