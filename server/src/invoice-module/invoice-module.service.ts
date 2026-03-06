import { Injectable } from '@nestjs/common';
import { CreateInvoiceModuleDto } from './dto/create-invoice-module.dto';
import { UpdateInvoiceModuleDto } from './dto/update-invoice-module.dto';

@Injectable()
export class InvoiceModuleService {
  create(createInvoiceModuleDto: CreateInvoiceModuleDto) {
    return 'This action adds a new invoiceModule';
  }

  findAll() {
    return `This action returns all invoiceModule`;
  }

  findOne(id: number) {
    return `This action returns a #${id} invoiceModule`;
  }

  update(id: number, updateInvoiceModuleDto: UpdateInvoiceModuleDto) {
    return `This action updates a #${id} invoiceModule`;
  }

  remove(id: number) {
    return `This action removes a #${id} invoiceModule`;
  }
}
