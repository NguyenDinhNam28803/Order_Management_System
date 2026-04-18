import { Module } from '@nestjs/common';
import { ContractModuleService } from './contract-module.service';
import { ContractModuleController } from './contract-module.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { NotificationModuleModule } from '../notification-module/notification-module.module';

@Module({
  imports: [PrismaModule, NotificationModuleModule],
  controllers: [ContractModuleController],
  providers: [ContractModuleService],
  exports: [ContractModuleService],
})
export class ContractModuleModule {}
