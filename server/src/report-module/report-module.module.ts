import { Module } from '@nestjs/common';
import { ReportModuleService } from './report-module.service';
import { ReportModuleController } from './report-module.controller';

@Module({
  controllers: [ReportModuleController],
  providers: [ReportModuleService],
})
export class ReportModuleModule {}
