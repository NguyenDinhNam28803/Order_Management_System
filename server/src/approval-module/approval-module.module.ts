import { Module } from '@nestjs/common';
import { ApprovalModuleService } from './approval-module.service';
import { ApprovalModuleController } from './approval-module.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { BudgetModuleModule } from '../budget-module/budget-module.module';
import { AutomationModule } from '../common/automation/automation.module';
import { UserModuleModule } from '../user-module/user-module.module';

@Module({
  imports: [
    PrismaModule,
    BudgetModuleModule,
    AutomationModule,
    UserModuleModule,
  ],
  controllers: [ApprovalModuleController],
  providers: [ApprovalModuleService],
  exports: [ApprovalModuleService],
})
export class ApprovalModuleModule {}
