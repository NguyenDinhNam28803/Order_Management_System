import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { PaymentModuleService } from './payment-module.service';
import { CreatePaymentModuleDto } from './dto/create-payment-module.dto';
import { UpdatePaymentModuleDto } from './dto/update-payment-module.dto';
import { JwtAuthGuard } from '../auth-module/jwt-auth.guard';
import { ApiOperation, ApiTags, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('Payment Management')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@Controller('payment-module')
export class PaymentModuleController {
  constructor(private readonly paymentModuleService: PaymentModuleService) {}

  /**
   * Tạo một yêu cầu hoặc bản ghi thanh toán mới
   * @param createPaymentModuleDto Dữ liệu tạo thanh toán
   * @returns Bản ghi thanh toán vừa tạo
   */
  @Post()
  @ApiOperation({ summary: 'Tạo thanh toán mới' })
  create(@Body() createPaymentModuleDto: CreatePaymentModuleDto) {
    return this.paymentModuleService.create(createPaymentModuleDto);
  }

  /**
   * Lấy danh sách tất cả các bản ghi thanh toán
   * @returns Danh sách thanh toán
   */
  @Get()
  @ApiOperation({ summary: 'Lấy tất cả bản ghi thanh toán' })
  findAll() {
    return this.paymentModuleService.findAll();
  }

  /**
   * Lấy thông tin chi tiết của một bản ghi thanh toán theo ID
   * @param id ID của bản ghi thanh toán
   * @returns Chi tiết bản ghi thanh toán
   */
  @Get(':id')
  @ApiOperation({ summary: 'Lấy chi tiết thanh toán theo ID' })
  findOne(@Param('id') id: string) {
    return this.paymentModuleService.findOne(+id);
  }

  /**
   * Cập nhật thông tin bản ghi thanh toán theo ID
   * @param id ID của bản ghi thanh toán
   * @param updatePaymentModuleDto Dữ liệu cập nhật
   * @returns Bản ghi sau khi cập nhật
   */
  @Patch(':id')
  @ApiOperation({ summary: 'Cập nhật thanh toán theo ID' })
  update(
    @Param('id') id: string,
    @Body() updatePaymentModuleDto: UpdatePaymentModuleDto,
  ) {
    return this.paymentModuleService.update(+id, updatePaymentModuleDto);
  }

  /**
   * Xóa một bản ghi thanh toán khỏi hệ thống theo ID
   * @param id ID của bản ghi thanh toán cần xóa
   * @returns Kết quả xóa
   */
  @Delete(':id')
  @ApiOperation({ summary: 'Xóa thanh toán theo ID' })
  remove(@Param('id') id: string) {
    return this.paymentModuleService.remove(+id);
  }
}
