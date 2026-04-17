import { Module } from '@nestjs/common';
import { PaymentModuleService } from './payment-module.service';
import { PaymentModuleController } from './payment-module.controller';
import { BudgetModuleModule } from '../budget-module/budget-module.module';
import { NotificationModuleModule } from '../notification-module/notification-module.module';

@Module({
  imports: [BudgetModuleModule, NotificationModuleModule],
  controllers: [PaymentModuleController],
  providers: [PaymentModuleService],
})
export class PaymentModuleModule {}
