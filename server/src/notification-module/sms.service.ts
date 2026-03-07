import { Injectable, Logger } from '@nestjs/common';
import twilio from 'twilio';

@Injectable()
export class SmsService {
  private readonly logger = new Logger(SmsService.name);
  private readonly twilioClient: twilio.Twilio;

  constructor() {
    this.twilioClient = twilio(
      process.env.TWILIO_ACCOUNT_SID,
      process.env.TWILIO_AUTH_TOKEN,
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
