import { Module } from '@nestjs/common';
import { SupplierKpimoduleService } from './supplier-kpimodule.service';
import { SupplierKpimoduleController } from './supplier-kpimodule.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { AiServiceModule } from '../ai-service/ai-service.module';
import { SupplierKpiTaskService } from './supplier-kpi-task.service';

@Module({
  imports: [PrismaModule, AiServiceModule],
  controllers: [SupplierKpimoduleController],
  providers: [SupplierKpimoduleService, SupplierKpiTaskService],
  exports: [SupplierKpimoduleService],
})
export class SupplierKpimoduleModule {}
