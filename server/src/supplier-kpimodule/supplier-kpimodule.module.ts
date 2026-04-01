import { Module } from '@nestjs/common';
import { SupplierKpimoduleService } from './supplier-kpimodule.service';
import { SupplierKpimoduleController } from './supplier-kpimodule.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { AiServiceModule } from '../ai-service/ai-service.module';

@Module({
  imports: [PrismaModule, AiServiceModule],
  controllers: [SupplierKpimoduleController],
  providers: [SupplierKpimoduleService],
  exports: [SupplierKpimoduleService],
})
export class SupplierKpimoduleModule {}
