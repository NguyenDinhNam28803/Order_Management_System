import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import bull from 'bull';
import { NotificationRepository } from './notification.repository';
import { EmailService } from './email.service';
import { SmsService } from './sms.service';
import { EmailTemplatesService } from './email-template.service';
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
    private readonly emailTemplates: EmailTemplatesService,
    @InjectQueue('email-queue') private readonly emailQueue: bull.Queue, // Thêm queue
  ) {}

  onModuleInit() {
    this.logger.log('NotificationModuleService initialized');
  }

  async createTemplate(dto: CreateNotificationTemplateDto) {
    return this.repository.createTemplate(dto);
  }

  async findAllTemplates() {
    return this.repository.findAllTemplates();
  }

  async sendNotification(dto: SendNotificationDto) {
    const { recipientId, eventType, data, referenceType, referenceId } = dto;

    const user = await this.prisma.user.findUnique({
      where: { id: recipientId },
    });

    if (!user) {
      throw new NotFoundException(`Recipient with ID ${recipientId} not found`);
    }

    const templates = await this.repository.findTemplateByEventType(eventType);

    if (templates.length === 0) {
      this.logger.warn(`No templates found for event type: ${eventType}`);
      return { message: 'No templates found' };
    }

    const results: any[] = [];

    for (const template of templates) {
      const renderedSubject = template.subject
        ? this.renderTemplate(template.subject, data)
        : undefined;

      const renderedBody =
        template.channel === NotificationChannel.EMAIL
          ? this.emailTemplates.render(eventType, {
              ...data,
              name: user.fullName ?? user.email,
              email: user.email,
            })
          : this.renderTemplate(template.bodyTemplate, data);

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
        if (template.channel === NotificationChannel.EMAIL) {
          if (user.email) {
            try {
              // Thử đẩy vào hàng đợi trước
              await this.emailQueue.add('send-email', {
                to: user.email,
                subject: renderedSubject || 'OMS Notification',
                body: renderedBody,
                notificationId: notification.id,
              });
              results.push({ channel: template.channel, status: 'QUEUED' });
            } catch (queueError) {
              this.logger.warn(
                `Queue failed, fallback to direct email: ${queueError.message}`,
              );
              // Fallback: Gửi trực tiếp nếu Queue lỗi
              await this.emailService.sendEmail(
                user.email,
                renderedSubject || 'OMS Notification',
                renderedBody,
              );
              await this.repository.updateNotificationStatus(
                notification.id,
                NotificationStatus.SENT,
              );
              results.push({ channel: template.channel, status: 'SENT' });
            }
          } else {
            throw new Error('User does not have an email address');
          }
        } else if (template.channel === NotificationChannel.SMS) {
          if (user.phone) {
            const success = await this.smsService.sendSms(
              user.phone,
              renderedBody,
            );
            if (success) {
              await this.repository.updateNotificationStatus(
                notification.id,
                NotificationStatus.SENT,
              );
              results.push({ channel: template.channel, status: 'SENT' });
            }
          } else {
            throw new Error('User does not have a phone number');
          }
        } else if (template.channel === NotificationChannel.IN_APP) {
          results.push({ channel: template.channel, status: 'SENT' });
        }
      } catch (error) {
        this.logger.error(
          `Failed to queue notification ${notification.id}:`,
          error,
        );
        await this.repository.updateNotificationStatus(
          notification.id,
          NotificationStatus.FAILED,
          (error as Error).message,
        );
        results.push({
          channel: template.channel,
          status: 'FAILED',
          reason: (error as Error).message,
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
