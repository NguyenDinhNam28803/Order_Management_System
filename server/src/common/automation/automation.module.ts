import { Module, Global } from '@nestjs/common';
import { AutomationService } from './automation.service';
import { RfqmoduleModule } from '../../rfqmodule/rfqmodule.module';
import { PrismaModule } from '../../prisma/prisma.module';
import { NotificationModuleModule } from '../../notification-module/notification-module.module';

@Global()
@Module({
  imports: [RfqmoduleModule, PrismaModule, NotificationModuleModule],
  providers: [AutomationService],
  exports: [AutomationService],
})
export class AutomationModule {}
