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
import { ExternalTokenService, TokenType } from '../external-token-module/external-token.service';

@Injectable()
export class NotificationModuleService {
  private readonly logger = new Logger(NotificationModuleService.name);

  constructor(
    private readonly repository: NotificationRepository,
    private readonly emailService: EmailService,
    private readonly smsService: SmsService,
    private readonly prisma: PrismaService,
    private readonly emailTemplates: EmailTemplatesService,
    private readonly externalTokenService: ExternalTokenService,
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

  /**
   * Gửi email cho external user (NCC/Supplier) với magic link
   * Tự động tạo ExternalToken và gửi link trong email
   */
  async sendExternalEmailWithMagicLink(params: {
    to: string;
    subject: string;
    eventType: string;
    data: Record<string, any>;
    referenceId: string;
    tokenType: TokenType;
    expiresInDays?: number;
  }) {
    const { to, subject, eventType, data, referenceId, tokenType, expiresInDays = 7 } = params;

    try {
      // 1. Tạo external token
      const tokenResult = await this.externalTokenService.createToken({
        type: tokenType,
        referenceId,
        targetEmail: to,
        metadata: { eventType, ...data },
        expiresInDays,
      });

      // 2. Render email template với link
      const emailBody = this.emailTemplates.render(eventType, {
        ...data,
        email: to,
        // Thêm các biến link vào template
        rfqLink: tokenResult.link,
        approveLink: tokenResult.link,
        rejectLink: tokenResult.link.replace('?token=', '?token=').replace('/confirm', '/reject'),
        detailLink: tokenResult.link,
        confirmLink: tokenResult.link,
        updateLink: tokenResult.link,
        submitLink: tokenResult.link,
      });

      // 3. Thêm vào queue gửi email
      await this.emailQueue.add('send-email', {
        to,
        subject,
        body: emailBody,
        tokenId: tokenResult.id,
      });

      this.logger.log(`External email with magic link queued: ${to} - ${eventType}`);

      return {
        success: true,
        tokenId: tokenResult.id,
        link: tokenResult.link,
        expiresAt: tokenResult.expiresAt,
      };
    } catch (error) {
      this.logger.error(`Failed to send external email to ${to}:`, error);
      throw error;
    }
  }
}
