import { PartialType } from '@nestjs/mapped-types';
import { CreateInvoiceModuleDto } from './create-invoice-module.dto';

export class UpdateInvoiceModuleDto extends PartialType(CreateInvoiceModuleDto) {}
