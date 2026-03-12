import { Module } from '@nestjs/common';
import { ApprovalModuleService } from './approval-module.service';
import { ApprovalModuleController } from './approval-module.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [ApprovalModuleController],
  providers: [ApprovalModuleService],
  exports: [ApprovalModuleService],
})
export class ApprovalModuleModule {}
