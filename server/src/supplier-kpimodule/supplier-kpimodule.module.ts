import { Module } from '@nestjs/common';
import { SupplierKpimoduleService } from './supplier-kpimodule.service';
import { SupplierKpimoduleController } from './supplier-kpimodule.controller';

@Module({
  controllers: [SupplierKpimoduleController],
  providers: [SupplierKpimoduleService],
})
export class SupplierKpimoduleModule {}
