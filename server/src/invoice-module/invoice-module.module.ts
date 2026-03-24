import { Module } from '@nestjs/common';
import { InvoiceModuleService } from './invoice-module.service';
import { InvoiceModuleController } from './invoice-module.controller';

@Module({
  controllers: [InvoiceModuleController],
  providers: [InvoiceModuleService],
})
export class InvoiceModuleModule {}
