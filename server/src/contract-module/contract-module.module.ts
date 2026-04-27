import { Module } from '@nestjs/common';
import { ContractModuleService } from './contract-module.service';
import { ContractModuleController } from './contract-module.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { NotificationModuleModule } from '../notification-module/notification-module.module';
import { ApprovalModuleModule } from '../approval-module/approval-module.module';
import { ExternalTokenModule } from '../external-token-module/external-token.module';

@Module({
  imports: [PrismaModule, NotificationModuleModule, ApprovalModuleModule, ExternalTokenModule],
  controllers: [ContractModuleController],
  providers: [ContractModuleService],
  exports: [ContractModuleService],
})
export class ContractModuleModule {}
