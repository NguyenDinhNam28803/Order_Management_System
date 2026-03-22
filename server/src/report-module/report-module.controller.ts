import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { ReportModuleService } from './report-module.service';
import { CreateReportModuleDto } from './dto/create-report-module.dto';
import { UpdateReportModuleDto } from './dto/update-report-module.dto';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

@ApiTags('Report Management')
@Controller('reports')
export class ReportModuleController {
  constructor(private readonly reportModuleService: ReportModuleService) {}

  /**
   * Tạo một báo cáo mới trong hệ thống
   * @param createReportModuleDto Dữ liệu tạo báo cáo
   * @returns Báo cáo vừa tạo
   */
  @Post()
  @ApiOperation({ summary: 'Tạo báo cáo mới' })
  create(@Body() createReportModuleDto: CreateReportModuleDto) {
    return this.reportModuleService.create(createReportModuleDto);
  }

  /**
   * Lấy danh sách tất cả các báo cáo hiện có
   * @returns Danh sách báo cáo
   */
  @Get()
  @ApiOperation({ summary: 'Lấy tất cả báo cáo' })
  findAll() {
    return this.reportModuleService.findAll();
  }

  /**
   * Lấy thông tin chi tiết của một báo cáo cụ thể theo ID
   * @param id ID của báo cáo
   * @returns Chi tiết báo cáo
   */
  @Get(':id')
  @ApiOperation({ summary: 'Lấy chi tiết báo cáo theo ID' })
  findOne(@Param('id') id: string) {
    return this.reportModuleService.findOne(+id);
  }

  /**
   * Cập nhật thông tin của một báo cáo theo ID
   * @param id ID của báo cáo
   * @param updateReportModuleDto Dữ liệu cập nhật
   * @returns Báo cáo sau khi cập nhật
   */
  @Patch(':id')
  @ApiOperation({ summary: 'Cập nhật báo cáo theo ID' })
  update(
    @Param('id') id: string,
    @Body() updateReportModuleDto: UpdateReportModuleDto,
  ) {
    return this.reportModuleService.update(+id, updateReportModuleDto);
  }

  /**
   * Xóa một báo cáo khỏi hệ thống theo ID
   * @param id ID của báo cáo cần xóa
   * @returns Kết quả xóa
   */
  @Delete(':id')
  @ApiOperation({ summary: 'Xóa báo cáo theo ID' })
  remove(@Param('id') id: string) {
    return this.reportModuleService.remove(+id);
  }
}
