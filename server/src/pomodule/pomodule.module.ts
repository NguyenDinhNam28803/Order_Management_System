import { Module } from '@nestjs/common';
import { PomoduleService } from './pomodule.service';
import { PomoduleController } from './pomodule.controller';
import { PoRepository } from './po.repository';
import { PrismaModule } from 'src/prisma/prisma.module';
import { ApprovalModuleModule } from 'src/approval-module/approval-module.module';
import { SupplierKpimoduleModule } from 'src/supplier-kpimodule/supplier-kpimodule.module';
import { BudgetModuleModule } from 'src/budget-module/budget-module.module';

@Module({
  imports: [PrismaModule, ApprovalModuleModule, SupplierKpimoduleModule, BudgetModuleModule],
  controllers: [PomoduleController],
  providers: [PomoduleService, PoRepository],
  exports: [PomoduleService],
})
export class PomoduleModule {}
