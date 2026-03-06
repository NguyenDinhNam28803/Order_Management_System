import { Module } from '@nestjs/common';
import { NotificationModuleService } from './notification-module.service';
import { NotificationModuleController } from './notification-module.controller';

@Module({
  controllers: [NotificationModuleController],
  providers: [NotificationModuleService],
})
export class NotificationModuleModule {}
