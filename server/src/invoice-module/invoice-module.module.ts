import { Module } from '@nestjs/common';
import { InvoiceModuleService } from './invoice-module.service';
import { InvoiceModuleController } from './invoice-module.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { NotificationModuleModule } from '../notification-module/notification-module.module';
import { AiServiceModule } from '../ai-service/ai-service.module';

@Module({
  imports: [PrismaModule, NotificationModuleModule, AiServiceModule],
  controllers: [InvoiceModuleController],
  providers: [InvoiceModuleService],
  exports: [InvoiceModuleService],
})
export class InvoiceModuleModule {}
