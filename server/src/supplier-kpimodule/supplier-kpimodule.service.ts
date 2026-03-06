import { Injectable } from '@nestjs/common';
import { CreateSupplierKpimoduleDto } from './dto/create-supplier-kpimodule.dto';
import { UpdateSupplierKpimoduleDto } from './dto/update-supplier-kpimodule.dto';

@Injectable()
export class SupplierKpimoduleService {
  create(createSupplierKpimoduleDto: CreateSupplierKpimoduleDto) {
    return 'This action adds a new supplierKpimodule';
  }

  findAll() {
    return `This action returns all supplierKpimodule`;
  }

  findOne(id: number) {
    return `This action returns a #${id} supplierKpimodule`;
  }

  update(id: number, updateSupplierKpimoduleDto: UpdateSupplierKpimoduleDto) {
    return `This action updates a #${id} supplierKpimodule`;
  }

  remove(id: number) {
    return `This action removes a #${id} supplierKpimodule`;
  }
}
