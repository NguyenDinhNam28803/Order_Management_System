import { Module } from '@nestjs/common';
import { BudgetModuleService } from './budget-module.service';
import { BudgetModuleController } from './budget-module.controller';

@Module({
  providers: [BudgetModuleService],
  controllers: [BudgetModuleController],
  exports: [BudgetModuleService],
})
export class BudgetModuleModule {}
