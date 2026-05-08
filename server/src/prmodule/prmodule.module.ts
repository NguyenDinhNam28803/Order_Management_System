import { Module } from '@nestjs/common';
import { PrmoduleService } from './prmodule.service';
import { PrmoduleController } from './prmodule.controller';
import { PrRepository } from './pr.repository';
import { PrismaModule } from '../prisma/prisma.module';
import { PrismaService } from '../prisma/prisma.service';
import { ApprovalModuleModule } from '../approval-module/approval-module.module';
import { AiServiceModule } from '../ai-service/ai-service.module';
import { BudgetModuleModule } from '../budget-module/budget-module.module';
import { NotificationModuleModule } from '../notification-module/notification-module.module';

@Module({
  imports: [
    PrismaModule,
    ApprovalModuleModule,
    AiServiceModule,
    BudgetModuleModule,
    NotificationModuleModule,
  ],
  controllers: [PrmoduleController],
  providers: [PrmoduleService, PrRepository, PrismaService],
  exports: [PrmoduleService],
})
export class PrmoduleModule {}
