import { Module } from '@nestjs/common';
import { BudgetModuleService } from './budget-module.service';
import { BudgetModuleController } from './budget-module.controller';
import { AuditModuleModule } from '../audit-module/audit-module.module';

@Module({
  imports: [AuditModuleModule],
  providers: [BudgetModuleService],
  controllers: [BudgetModuleController],
  exports: [BudgetModuleService],
})
export class BudgetModuleModule {}
