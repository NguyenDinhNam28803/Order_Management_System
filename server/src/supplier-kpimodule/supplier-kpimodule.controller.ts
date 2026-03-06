import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { SupplierKpimoduleService } from './supplier-kpimodule.service';
import { CreateSupplierKpimoduleDto } from './dto/create-supplier-kpimodule.dto';
import { UpdateSupplierKpimoduleDto } from './dto/update-supplier-kpimodule.dto';

@Controller('supplier-kpimodule')
export class SupplierKpimoduleController {
  constructor(private readonly supplierKpimoduleService: SupplierKpimoduleService) {}

  @Post()
  create(@Body() createSupplierKpimoduleDto: CreateSupplierKpimoduleDto) {
    return this.supplierKpimoduleService.create(createSupplierKpimoduleDto);
  }

  @Get()
  findAll() {
    return this.supplierKpimoduleService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.supplierKpimoduleService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateSupplierKpimoduleDto: UpdateSupplierKpimoduleDto) {
    return this.supplierKpimoduleService.update(+id, updateSupplierKpimoduleDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.supplierKpimoduleService.remove(+id);
  }
}
