import { Module } from '@nestjs/common';
import { BudgetModuleService } from './budget-module.service';
import { BudgetModuleController } from './budget-module.controller';
import { BudgetOverrideService } from './budget-override.service';
import { AuditModuleModule } from '../audit-module/audit-module.module';

@Module({
  imports: [AuditModuleModule],
  providers: [BudgetModuleService, BudgetOverrideService],
  controllers: [BudgetModuleController],
  exports: [BudgetModuleService, BudgetOverrideService],
})
export class BudgetModuleModule {}
