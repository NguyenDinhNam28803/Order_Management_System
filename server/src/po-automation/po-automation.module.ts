import { Module } from '@nestjs/common';
import { POAutomationController } from './po-automation.controller';
import { POAutomationService } from './po-automation.service';
import { PrismaModule } from '../prisma/prisma.module';
import { NotificationModuleModule } from '../notification-module/notification-module.module';

@Module({
  imports: [PrismaModule, NotificationModuleModule],
  controllers: [POAutomationController],
  providers: [POAutomationService],
  exports: [POAutomationService],
})
export class POAutomationModule {}
