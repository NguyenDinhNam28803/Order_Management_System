import { Injectable } from '@nestjs/common';
import { CreatePaymentModuleDto } from './dto/create-payment-module.dto';
import { UpdatePaymentModuleDto } from './dto/update-payment-module.dto';

@Injectable()
export class PaymentModuleService {
  create(createPaymentModuleDto: CreatePaymentModuleDto) {
    return 'This action adds a new paymentModule';
  }

  findAll() {
    return `This action returns all paymentModule`;
  }

  findOne(id: number) {
    return `This action returns a #${id} paymentModule`;
  }

  update(id: number, updatePaymentModuleDto: UpdatePaymentModuleDto) {
    return `This action updates a #${id} paymentModule`;
  }

  remove(id: number) {
    return `This action removes a #${id} paymentModule`;
  }
}
