import { Module } from '@nestjs/common';
import { NotificationModuleService } from './notification-module.service';
import { NotificationModuleController } from './notification-module.controller';
import { NotificationRepository } from './notification.repository';
import { EmailService } from './email.service';
import { SmsService } from './sms.service';

@Module({
  controllers: [NotificationModuleController],
  providers: [
    NotificationModuleService,
    NotificationRepository,
    EmailService,
    SmsService,
  ],
  exports: [NotificationModuleService],
})
export class NotificationModuleModule {}
