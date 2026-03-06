import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { PaymentModuleService } from './payment-module.service';
import { CreatePaymentModuleDto } from './dto/create-payment-module.dto';
import { UpdatePaymentModuleDto } from './dto/update-payment-module.dto';

@Controller('payment-module')
export class PaymentModuleController {
  constructor(private readonly paymentModuleService: PaymentModuleService) {}

  @Post()
  create(@Body() createPaymentModuleDto: CreatePaymentModuleDto) {
    return this.paymentModuleService.create(createPaymentModuleDto);
  }

  @Get()
  findAll() {
    return this.paymentModuleService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.paymentModuleService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updatePaymentModuleDto: UpdatePaymentModuleDto) {
    return this.paymentModuleService.update(+id, updatePaymentModuleDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.paymentModuleService.remove(+id);
  }
}
