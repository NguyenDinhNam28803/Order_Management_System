import { Module } from '@nestjs/common';
import { AdminModuleService } from './admin-module.service';
import { AdminModuleController } from './admin-module.controller';

@Module({
  controllers: [AdminModuleController],
  providers: [AdminModuleService],
})
export class AdminModuleModule {}
