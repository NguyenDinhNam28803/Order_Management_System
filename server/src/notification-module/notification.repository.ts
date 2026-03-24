import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  Notification,
  NotificationTemplate,
  NotificationStatus,
} from '@prisma/client';
import { CreateNotificationTemplateDto } from './dto/create-notification-template.dto';

@Injectable()
export class NotificationRepository {
  constructor(private readonly prisma: PrismaService) {}

  // --- Notification Template Methods ---

  async createTemplate(
    data: CreateNotificationTemplateDto,
  ): Promise<NotificationTemplate> {
    return this.prisma.notificationTemplate.create({ data });
  }

  async findTemplateByEventType(
    eventType: string,
  ): Promise<NotificationTemplate[]> {
    return this.prisma.notificationTemplate.findMany({
      where: { eventType, isActive: true },
    });
  }

  async findAllTemplates(): Promise<NotificationTemplate[]> {
    return this.prisma.notificationTemplate.findMany();
  }

  // --- Notification Methods ---

  async createNotification(data: any): Promise<Notification> {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    return this.prisma.notification.create({ data });
  }

  async updateNotificationStatus(
    id: string,
    status: NotificationStatus,
    failureReason?: string,
  ): Promise<Notification> {
    return this.prisma.notification.update({
      where: { id },
      data: {
        status,
        failureReason,
        sentAt: status === NotificationStatus.SENT ? new Date() : undefined,
      },
    });
  }

  async findAllNotificationsByRecipient(
    recipientId: string,
  ): Promise<Notification[]> {
    return this.prisma.notification.findMany({
      where: { recipientId },
      orderBy: { createdAt: 'desc' },
    });
  }
}
