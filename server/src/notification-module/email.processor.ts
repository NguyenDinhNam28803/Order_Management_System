import { Processor, Process } from '@nestjs/bull';
import bull from 'bull';
import { EmailService } from './email.service';
import { Logger } from '@nestjs/common';

@Processor('email-queue')
export class EmailProcessor {
  private readonly logger = new Logger(EmailProcessor.name);

  constructor(private readonly emailService: EmailService) {}

  @Process('send-email')
  async handleSendEmail(job: bull.Job) {
    this.logger.log(`Processing email job ${job.id}: ${job.data.subject}`);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const { to, subject, body, attachments } = job.data;

    try {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      await this.emailService.sendEmail(to, subject, body, attachments);
      this.logger.log(`Successfully sent email to ${to}`);
    } catch (error: any) {
      this.logger.error(`Failed to send email to ${to}: ${error.message}`);
      throw error; // Throw error để Bull thực hiện retry
    }
  }
}
