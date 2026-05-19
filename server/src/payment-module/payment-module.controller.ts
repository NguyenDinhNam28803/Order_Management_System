import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { PaymentModuleService } from './payment-module.service';
import { CreatePaymentModuleDto } from './dto/create-payment-module.dto';
import { JwtAuthGuard } from '../auth-module/jwt-auth.guard';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import type { JwtPayload } from '../auth-module/interfaces/jwt-payload.interface';

@ApiTags('Payment Management')
@Controller('payments')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
export class PaymentModuleController {
  constructor(private readonly paymentService: PaymentModuleService) {}

  @Post()
  @ApiOperation({ summary: 'Tạo yêu cầu thanh toán' })
  create(
    @Body() createPaymentDto: CreatePaymentModuleDto,
    @Request() req: JwtPayload,
  ) {
    return this.paymentService.create(createPaymentDto, req);
  }

  @Post(':id/complete')
  @ApiOperation({ summary: 'Xác nhận hoàn tất thanh toán' })
  complete(@Param('id') id: string, @Request() req: any) {
    return this.paymentService.completePayment(id, req.user as JwtPayload);
  }

  @Get()
  @ApiOperation({ summary: 'Lấy danh sách thanh toán của tổ chức' })
  findAll(@Request() req: any) {
    const user = req.user as JwtPayload;
    return this.paymentService.findAll(user.orgId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Chi tiết thanh toán' })
  findOne(@Param('id') id: string) {
    return this.paymentService.findOne(id);
  }
}
