import { Module } from '@nestjs/common';
import { DisputeModuleService } from './dispute-module.service';
import { DisputeModuleController } from './dispute-module.controller';

@Module({
  controllers: [DisputeModuleController],
  providers: [DisputeModuleService],
})
export class DisputeModuleModule {}
