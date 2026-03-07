import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
  private transporter: nodemailer.Transporter;
  private readonly logger = new Logger(EmailService.name);

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: parseInt(process.env.EMAIL_PORT || '587'),
      secure: process.env.EMAIL_SECURE === 'true', // true for 465, false for other ports
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });
  }

  async sendEmail(to: string, subject: string, body: string) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const info = await this.transporter.sendMail({
        from: `"${process.env.EMAIL_FROM_NAME || 'OMS System'}" <${process.env.EMAIL_FROM_EMAIL}>`,
        to,
        subject,
        html: body,
      });
      this.logger.log(`Email sent: ${info.messageId}`);
      return true;
    } catch (error) {
      this.logger.error(`Error sending email to ${to}:`, error);
      throw error;
    }
  }
}
