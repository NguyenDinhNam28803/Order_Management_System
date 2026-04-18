import { Module } from '@nestjs/common';
import { PomoduleService } from './pomodule.service';
import { PomoduleController } from './pomodule.controller';
import { PoRepository } from './po.repository';
import { PrismaModule } from '../prisma/prisma.module';
import { ApprovalModuleModule } from '../approval-module/approval-module.module';
import { SupplierKpimoduleModule } from '../supplier-kpimodule/supplier-kpimodule.module';
import { BudgetModuleModule } from '../budget-module/budget-module.module';
import { AutomationModule } from '../common/automation/automation.module';
import { ContractModuleModule } from '../contract-module/contract-module.module';

@Module({
  imports: [
    PrismaModule,
    ApprovalModuleModule,
    SupplierKpimoduleModule,
    BudgetModuleModule,
    AutomationModule,
    ContractModuleModule,
  ],
  controllers: [PomoduleController],
  providers: [PomoduleService, PoRepository],
  exports: [PomoduleService],
})
export class PomoduleModule {}
