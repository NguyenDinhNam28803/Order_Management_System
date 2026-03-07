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

@Controller('report-module')
export class ReportModuleController {
  constructor(private readonly reportModuleService: ReportModuleService) {}

  @Post()
  create(@Body() createReportModuleDto: CreateReportModuleDto) {
    return this.reportModuleService.create(createReportModuleDto);
  }

  @Get()
  findAll() {
    return this.reportModuleService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.reportModuleService.findOne(+id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateReportModuleDto: UpdateReportModuleDto,
  ) {
    return this.reportModuleService.update(+id, updateReportModuleDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.reportModuleService.remove(+id);
  }
}
