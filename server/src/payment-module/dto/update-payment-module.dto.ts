import { PartialType } from '@nestjs/mapped-types';
import { CreatePaymentModuleDto } from './create-payment-module.dto';

export class UpdatePaymentModuleDto extends PartialType(CreatePaymentModuleDto) {}
