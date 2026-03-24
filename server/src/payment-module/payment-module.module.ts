import { Module } from '@nestjs/common';
import { PaymentModuleService } from './payment-module.service';
import { PaymentModuleController } from './payment-module.controller';

@Module({
  controllers: [PaymentModuleController],
  providers: [PaymentModuleService],
})
export class PaymentModuleModule {}
