import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { NotificationModuleService } from './notification-module.service';
import { NotificationModuleController } from './notification-module.controller';
import { NotificationRepository } from './notification.repository';
import { EmailService } from './email.service';
import { SmsService } from './sms.service';
import { EmailTemplatesService } from './email-template.service';
import { EmailProcessor } from './email.processor';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'email-queue',
    }),
  ],
  controllers: [NotificationModuleController],
  providers: [
    NotificationModuleService,
    NotificationRepository,
    EmailService,
    EmailTemplatesService,
    SmsService,
    EmailProcessor,
  ],
  exports: [NotificationModuleService, EmailService],
})
export class NotificationModuleModule {}
