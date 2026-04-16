import { Module } from '@nestjs/common';
import { InvoiceModuleService } from './invoice-module.service';
import { InvoiceModuleController } from './invoice-module.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { NotificationModuleModule } from '../notification-module/notification-module.module';

@Module({
  imports: [PrismaModule, NotificationModuleModule],
  controllers: [InvoiceModuleController],
  providers: [InvoiceModuleService],
  exports: [InvoiceModuleService],
})
export class InvoiceModuleModule {}
