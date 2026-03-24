import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { DisputeModuleService } from './dispute-module.service';
import { CreateDisputeModuleDto } from './dto/create-dispute-module.dto';
import { UpdateDisputeModuleDto } from './dto/update-dispute-module.dto';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

@ApiTags('Dispute Management')
@Controller('disputes')
export class DisputeModuleController {
  constructor(private readonly disputeModuleService: DisputeModuleService) {}

  /**
   * Tạo một khiếu nại hoặc tranh chấp mới
   * @param createDisputeModuleDto Dữ liệu tạo tranh chấp
   * @returns Tranh chấp vừa tạo
   */
  @Post()
  @ApiOperation({ summary: 'Tạo khiếu nại/tranh chấp mới' })
  create(@Body() createDisputeModuleDto: CreateDisputeModuleDto) {
    return this.disputeModuleService.create(createDisputeModuleDto);
  }

  /**
   * Lấy danh sách tất cả các khiếu nại/tranh chấp
   * @returns Danh sách tranh chấp
   */
  @Get()
  @ApiOperation({ summary: 'Lấy tất cả khiếu nại/tranh chấp' })
  findAll() {
    return this.disputeModuleService.findAll();
  }

  /**
   * Lấy thông tin chi tiết một khiếu nại theo ID
   * @param id ID của tranh chấp
   * @returns Chi tiết tranh chấp
   */
  @Get(':id')
  @ApiOperation({ summary: 'Lấy chi tiết khiếu nại/tranh chấp theo ID' })
  findOne(@Param('id') id: string) {
    return this.disputeModuleService.findOne(+id);
  }

  /**
   * Cập nhật thông tin hoặc trạng thái của một khiếu nại
   * @param id ID của tranh chấp
   * @param updateDisputeModuleDto Dữ liệu cập nhật
   * @returns Tranh chấp sau khi cập nhật
   */
  @Patch(':id')
  @ApiOperation({ summary: 'Cập nhật khiếu nại/tranh chấp theo ID' })
  update(
    @Param('id') id: string,
    @Body() updateDisputeModuleDto: UpdateDisputeModuleDto,
  ) {
    return this.disputeModuleService.update(+id, updateDisputeModuleDto);
  }

  /**
   * Xóa một khiếu nại khỏi hệ thống theo ID
   * @param id ID của tranh chấp cần xóa
   * @returns Kết quả xóa
   */
  @Delete(':id')
  @ApiOperation({ summary: 'Xóa khiếu nại/tranh chấp theo ID' })
  remove(@Param('id') id: string) {
    return this.disputeModuleService.remove(+id);
  }
}
