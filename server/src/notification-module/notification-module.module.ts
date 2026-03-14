import { Module } from '@nestjs/common';
import { NotificationModuleService } from './notification-module.service';
import { NotificationModuleController } from './notification-module.controller';
import { NotificationRepository } from './notification.repository';
import { EmailService } from './email.service';
import { SmsService } from './sms.service';
import { EmailTemplatesService } from './email-template.service';

@Module({
  imports: [],
  controllers: [NotificationModuleController],
  providers: [
    NotificationModuleService,
    NotificationRepository,
    EmailService,
    EmailTemplatesService, // 👈 thêm
    SmsService,
  ],
  exports: [NotificationModuleService],
})
export class NotificationModuleModule {}
