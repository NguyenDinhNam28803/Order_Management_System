import { Module, forwardRef } from '@nestjs/common';
import { BudgetModuleService } from './budget-module.service';
import { BudgetModuleController } from './budget-module.controller';
import { BudgetOverrideService } from './budget-override.service';
import { AuditModuleModule } from '../audit-module/audit-module.module';
import { ApprovalModuleModule } from '../approval-module/approval-module.module';
import { NotificationModuleModule } from '../notification-module/notification-module.module';

@Module({
  imports: [
    AuditModuleModule,
    forwardRef(() => ApprovalModuleModule),
    NotificationModuleModule,
  ],
  providers: [BudgetModuleService, BudgetOverrideService],
  controllers: [BudgetModuleController],
  exports: [BudgetModuleService, BudgetOverrideService],
})
export class BudgetModuleModule {}
