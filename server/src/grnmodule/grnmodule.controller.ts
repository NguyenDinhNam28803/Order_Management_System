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
import { ApiOperation, ApiTags } from '@nestjs/swagger';

@ApiTags('Goods Receipt Note (GRN)')
@Controller('grnmodule')
export class GrnmoduleController {
  constructor(private readonly grnmoduleService: GrnmoduleService) {}

  /**
   * Tạo một phiếu nhập kho (Goods Receipt Note - GRN) mới
   * @param createGrnmoduleDto Dữ liệu tạo phiếu nhập kho
   * @returns Phiếu nhập kho vừa tạo
   */
  @Post()
  @ApiOperation({ summary: 'Tạo phiếu nhập kho (GRN) mới' })
  create(@Body() createGrnmoduleDto: CreateGrnmoduleDto) {
    return this.grnmoduleService.create(createGrnmoduleDto);
  }

  /**
   * Lấy danh sách tất cả các phiếu nhập kho
   * @returns Danh sách phiếu nhập kho
   */
  @Get()
  @ApiOperation({ summary: 'Lấy tất cả phiếu nhập kho (GRN)' })
  findAll() {
    return this.grnmoduleService.findAll();
  }

  /**
   * Lấy thông tin chi tiết một phiếu nhập kho theo ID
   * @param id ID của phiếu nhập kho
   * @returns Chi tiết phiếu nhập kho
   */
  @Get(':id')
  @ApiOperation({ summary: 'Lấy chi tiết phiếu nhập kho (GRN) theo ID' })
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
  @ApiOperation({ summary: 'Cập nhật phiếu nhập kho (GRN) theo ID' })
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
  @ApiOperation({ summary: 'Xóa phiếu nhập kho (GRN) theo ID' })
  remove(@Param('id') id: string) {
    return this.grnmoduleService.remove(+id);
  }
}
