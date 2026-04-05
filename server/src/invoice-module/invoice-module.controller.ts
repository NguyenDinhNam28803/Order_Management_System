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
import { ApiOperation, ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { Roles } from '../common/roles.guard';

@ApiTags('Invoice Management')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@Controller('invoices')
export class InvoiceModuleController {
  constructor(private readonly invoiceModuleService: InvoiceModuleService) {}

  /**
   * Tạo một hóa đơn mới
   * @param createInvoiceModuleDto Dữ liệu tạo hóa đơn
   * @returns Hóa đơn vừa tạo
   */
  @Post()
  @ApiOperation({ summary: 'Tạo hóa đơn mới' })
  create(@Body() createInvoiceModuleDto: CreateInvoiceModuleDto) {
    return this.invoiceModuleService.create(createInvoiceModuleDto);
  }

  /**
   * Lấy danh sách tất cả các hóa đơn thuộc tổ chức của người dùng
   * @param req Yêu cầu chứa thông tin người dùng đã xác thực
   * @returns Danh sách hóa đơn
   */
  @Get()
  @ApiOperation({ summary: 'Lấy tất cả hóa đơn' })
  findAll(@Request() req: any) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    return this.invoiceModuleService.findAll(req.user.orgId);
  }

  /**
   * Lấy thông tin chi tiết của một hóa đơn cụ thể theo ID
   * @param id ID của hóa đơn
   * @returns Chi tiết hóa đơn
   */
  @Get(':id')
  @ApiOperation({ summary: 'Chi tiết hóa đơn' })
  findOne(@Param('id') id: string) {
    return this.invoiceModuleService.findOne(id);
  }

  @Patch(':id/pay')
  @Roles(UserRole.FINANCE, UserRole.PLATFORM_ADMIN)
  @ApiOperation({ summary: 'Xác nhận thanh toán hóa đơn' })
  payInvoice(@Param('id') id: string) {
    return this.invoiceModuleService.markAsPaid(id);
  }

  @Patch(':id/run-matching')
  @Roles(UserRole.FINANCE, UserRole.PLATFORM_ADMIN)
  @ApiOperation({ summary: 'Chạy lại đối soát 3 bên' })
  runMatching(@Param('id') id: string) {
    return this.invoiceModuleService.runThreeWayMatching(id);
  }

  /**
   * Cập nhật thông tin của một hóa đơn theo ID
   * @param id ID của hóa đơn
   * @param updateInvoiceModuleDto Dữ liệu cập nhật
   * @returns Hóa đơn sau khi cập nhật
   */
  @Patch(':id')
  @ApiOperation({ summary: 'Cập nhật hóa đơn theo ID' })
  update(
    @Param('id') id: string,
    @Body() updateInvoiceModuleDto: UpdateInvoiceModuleDto,
  ) {
    return this.invoiceModuleService.update(id, updateInvoiceModuleDto);
  }

  /**
   * Xóa một hóa đơn khỏi hệ thống theo ID
   * @param id ID của hóa đơn cần xóa
   * @returns Kết quả xóa
   */
  @Delete(':id')
  @ApiOperation({ summary: 'Xóa hóa đơn theo ID' })
  remove(@Param('id') id: string) {
    return this.invoiceModuleService.remove(id);
  }
}
