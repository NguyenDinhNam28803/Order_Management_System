import { Module } from '@nestjs/common';
import { RfqmoduleService } from './rfqmodule.service';
import { RfqmoduleController } from './rfqmodule.controller';
import { RfqRepository } from './rfq.repository';
import { PrismaModule } from '../prisma/prisma.module';
import { AiServiceModule } from '../ai-service/ai-service.module';
import { NotificationModuleModule } from '../notification-module/notification-module.module';

@Module({
  imports: [PrismaModule, AiServiceModule, NotificationModuleModule],
  controllers: [RfqmoduleController],
  providers: [RfqmoduleService, RfqRepository],
  exports: [RfqmoduleService],
})
export class RfqmoduleModule {}
