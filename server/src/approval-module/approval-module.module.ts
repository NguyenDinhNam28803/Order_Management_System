import { Module } from '@nestjs/common';
import { ApprovalModuleService } from './approval-module.service';
import { ApprovalModuleController } from './approval-module.controller';

@Module({
  controllers: [ApprovalModuleController],
  providers: [ApprovalModuleService],
})
export class ApprovalModuleModule {}
