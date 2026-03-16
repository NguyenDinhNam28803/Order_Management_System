import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { GrnmoduleService } from './grnmodule.service';
import { CreateGrnmoduleDto } from './dto/create-grnmodule.dto';
import { UpdateGrnmoduleDto } from './dto/update-grnmodule.dto';

@Controller('grnmodule')
export class GrnmoduleController {
  constructor(private readonly grnmoduleService: GrnmoduleService) {}

  /**
   * Tạo một phiếu nhập kho (Goods Receipt Note - GRN) mới
   * @param createGrnmoduleDto Dữ liệu tạo phiếu nhập kho
   * @returns Phiếu nhập kho vừa tạo
   */
  @Post()
  create(@Body() createGrnmoduleDto: CreateGrnmoduleDto) {
    return this.grnmoduleService.create(createGrnmoduleDto);
  }

  /**
   * Lấy danh sách tất cả các phiếu nhập kho
   * @returns Danh sách phiếu nhập kho
   */
  @Get()
  findAll() {
    return this.grnmoduleService.findAll();
  }

  /**
   * Lấy thông tin chi tiết một phiếu nhập kho theo ID
   * @param id ID của phiếu nhập kho
   * @returns Chi tiết phiếu nhập kho
   */
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.grnmoduleService.findOne(+id);
  }

  /**
   * Cập nhật thông tin phiếu nhập kho theo ID
   * @param id ID của phiếu nhập kho
   * @param updateGrnmoduleDto Dữ liệu cập nhật
   * @returns Phiếu nhập kho sau khi cập nhật
   */
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateGrnmoduleDto: UpdateGrnmoduleDto,
  ) {
    return this.grnmoduleService.update(+id, updateGrnmoduleDto);
  }

  /**
   * Xóa một phiếu nhập kho khỏi hệ thống theo ID
   * @param id ID của phiếu nhập kho cần xóa
   * @returns Kết quả xóa
   */
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.grnmoduleService.remove(+id);
  }
}
