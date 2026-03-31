import { Module } from '@nestjs/common';
import { ApprovalModuleService } from './approval-module.service';
import { ApprovalModuleController } from './approval-module.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { BudgetModuleModule } from '../budget-module/budget-module.module';
import { AutomationModule } from '../common/automation/automation.module';

@Module({
  imports: [PrismaModule, BudgetModuleModule, AutomationModule],
  controllers: [ApprovalModuleController],
  providers: [ApprovalModuleService],
  exports: [ApprovalModuleService],
})
export class ApprovalModuleModule {}
