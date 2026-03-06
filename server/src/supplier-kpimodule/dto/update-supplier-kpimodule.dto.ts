import { PartialType } from '@nestjs/mapped-types';
import { CreateSupplierKpimoduleDto } from './create-supplier-kpimodule.dto';

export class UpdateSupplierKpimoduleDto extends PartialType(CreateSupplierKpimoduleDto) {}
