import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
} from '@nestjs/common';
import { InvoiceModuleService } from './invoice-module.service';
import { CreateInvoiceModuleDto } from './dto/create-invoice-module.dto';
import { UpdateInvoiceModuleDto } from './dto/update-invoice-module.dto';
import { JwtAuthGuard } from '../auth-module/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('invoice-module')
export class InvoiceModuleController {
  constructor(private readonly invoiceModuleService: InvoiceModuleService) {}

  @Post()
  create(@Body() createInvoiceModuleDto: CreateInvoiceModuleDto) {
    return this.invoiceModuleService.create(createInvoiceModuleDto);
  }

  @Get()
  findAll(@Request() req: any) {
    return this.invoiceModuleService.findAll(req.user.orgId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.invoiceModuleService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateInvoiceModuleDto: UpdateInvoiceModuleDto,
  ) {
    return this.invoiceModuleService.update(id, updateInvoiceModuleDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.invoiceModuleService.remove(id);
  }
}
