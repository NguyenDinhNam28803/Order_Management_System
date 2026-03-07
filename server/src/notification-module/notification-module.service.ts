import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { NotificationRepository } from './notification.repository';
import { EmailService } from './email.service';
import { SmsService } from './sms.service';
import { SendNotificationDto } from './dto/send-notification.dto';
import { CreateNotificationTemplateDto } from './dto/create-notification-template.dto';
import { NotificationChannel, NotificationStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class NotificationModuleService {
  private readonly logger = new Logger(NotificationModuleService.name);

  constructor(
    private readonly repository: NotificationRepository,
    private readonly emailService: EmailService,
    private readonly smsService: SmsService,
    private readonly prisma: PrismaService,
  ) {}

  async createTemplate(dto: CreateNotificationTemplateDto) {
    return this.repository.createTemplate(dto);
  }

  async findAllTemplates() {
    return this.repository.findAllTemplates();
  }

  async sendNotification(dto: SendNotificationDto) {
    const { recipientId, eventType, data, referenceType, referenceId } = dto;

    // 1. Lấy user thông tin để gửi (email/phone)
    const user = await this.prisma.user.findUnique({
      where: { id: recipientId },
    });

    if (!user) {
      throw new NotFoundException(`Recipient with ID ${recipientId} not found`);
    }

    // 2. Tìm các template tương ứng với eventType
    const templates = await this.repository.findTemplateByEventType(eventType);

    if (templates.length === 0) {
      this.logger.warn(`No templates found for event type: ${eventType}`);
      return { message: 'No templates found' };
    }

    const results: any[] = [];

    // 3. Xử lý từng channel dựa trên template tìm thấy
    for (const template of templates) {
      const renderedBody = this.renderTemplate(template.bodyTemplate, data);
      const renderedSubject = template.subject
        ? this.renderTemplate(template.subject, data)
        : undefined;

      // 4. Lưu thông báo vào database (status QUEUED)
      const notification = await this.repository.createNotification({
        recipientId,
        orgId: user.orgId,
        eventType,
        channel: template.channel,
        priority: template.priority,
        subject: renderedSubject,
        body: renderedBody,
        referenceType,
        referenceId,
        status: NotificationStatus.QUEUED,
      });

      try {
        let success = false;
        // 5. Gửi thông báo qua channel tương ứng
        if (template.channel === NotificationChannel.EMAIL) {
          if (user.email) {
            success = await this.emailService.sendEmail(
              user.email,
              renderedSubject || 'OMS Notification',
              renderedBody,
            );
          } else {
            throw new Error('User does not have an email address');
          }
        } else if (template.channel === NotificationChannel.SMS) {
          if (user.phone) {
            success = await this.smsService.sendSms(user.phone, renderedBody);
          } else {
            throw new Error('User does not have a phone number');
          }
        } else if (template.channel === NotificationChannel.IN_APP) {
          // Logic for in-app notifications (e.g., via Socket.io)
          // For now just mark as SENT as it is already saved in db
          success = true;
        }

        if (success) {
          await this.repository.updateNotificationStatus(
            notification.id,
            NotificationStatus.SENT,
          );
          results.push({ channel: template.channel, status: 'SENT' });
        }
      } catch (error) {
        this.logger.error(
          `Failed to send notification ${notification.id} via ${template.channel}:`,
          error,
        );
        await this.repository.updateNotificationStatus(
          notification.id,
          NotificationStatus.FAILED,
          error.message,
        );
        results.push({
          channel: template.channel,
          status: 'FAILED',
          reason: error.message,
        });
      }
    }

    return results;
  }

  async findAllByRecipient(recipientId: string) {
    return this.repository.findAllNotificationsByRecipient(recipientId);
  }

  private renderTemplate(template: string, data: Record<string, any>): string {
    return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
      return data[key] !== undefined ? String(data[key]) : match;
    });
  }
}
