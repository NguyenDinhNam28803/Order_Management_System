import { Module } from '@nestjs/common';
import { SystemConfigModuleService } from './system-config-module.service';
import { SystemConfigModuleController } from './system-config-module.controller';

@Module({
  providers: [SystemConfigModuleService],
  controllers: [SystemConfigModuleController],
})
export class SystemConfigModuleModule {}
