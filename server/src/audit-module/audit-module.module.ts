import { Module } from '@nestjs/common';
import { AuditModuleService } from './audit-module.service';
import { AuditModuleController } from './audit-module.controller';

@Module({
  providers: [AuditModuleService],
  controllers: [AuditModuleController],
})
export class AuditModuleModule {}
