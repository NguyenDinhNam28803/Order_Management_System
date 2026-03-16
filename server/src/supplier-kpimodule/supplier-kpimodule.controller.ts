import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { SupplierKpimoduleService } from './supplier-kpimodule.service';
import { CreateSupplierKpimoduleDto } from './dto/create-supplier-kpimodule.dto';
import { UpdateSupplierKpimoduleDto } from './dto/update-supplier-kpimodule.dto';

@Controller('supplier-kpimodule')
export class SupplierKpimoduleController {
  constructor(
    private readonly supplierKpimoduleService: SupplierKpimoduleService,
  ) {}

  /**
   * Tạo một bản ghi đánh giá chỉ số hiệu suất (KPI) mới cho nhà cung cấp
   * @param createSupplierKpimoduleDto Dữ liệu đánh giá KPI
   * @returns Bản ghi KPI vừa tạo
   */
  @Post()
  create(@Body() createSupplierKpimoduleDto: CreateSupplierKpimoduleDto) {
    return this.supplierKpimoduleService.create(createSupplierKpimoduleDto);
  }

  /**
   * Lấy danh sách tất cả các bản ghi đánh giá KPI của các nhà cung cấp
   * @returns Danh sách các bản ghi KPI
   */
  @Get()
  findAll() {
    return this.supplierKpimoduleService.findAll();
  }

  /**
   * Lấy thông tin chi tiết của một bản đánh giá KPI theo ID
   * @param id ID của bản ghi KPI
   * @returns Chi tiết bản ghi KPI
   */
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.supplierKpimoduleService.findOne(+id);
  }

  /**
   * Cập nhật thông tin hoặc kết quả đánh giá KPI theo ID
   * @param id ID của bản ghi KPI
   * @param updateSupplierKpimoduleDto Dữ liệu cập nhật
   * @returns Bản ghi KPI sau khi cập nhật
   */
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateSupplierKpimoduleDto: UpdateSupplierKpimoduleDto,
  ) {
    return this.supplierKpimoduleService.update(
      +id,
      updateSupplierKpimoduleDto,
    );
  }

  /**
   * Xóa một bản ghi đánh giá KPI khỏi hệ thống theo ID
   * @param id ID của bản ghi KPI cần xóa
   * @returns Kết quả xóa
   */
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.supplierKpimoduleService.remove(+id);
  }
}
