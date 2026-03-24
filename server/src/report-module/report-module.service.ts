import { Injectable } from '@nestjs/common';
import { CreateReportModuleDto } from './dto/create-report-module.dto';
import { UpdateReportModuleDto } from './dto/update-report-module.dto';

@Injectable()
export class ReportModuleService {
  create(createReportModuleDto: CreateReportModuleDto) {
    return 'This action adds a new reportModule';
  }

  findAll() {
    return `This action returns all reportModule`;
  }

  findOne(id: number) {
    return `This action returns a #${id} reportModule`;
  }

  update(id: number, updateReportModuleDto: UpdateReportModuleDto) {
    return `This action updates a #${id} reportModule`;
  }

  remove(id: number) {
    return `This action removes a #${id} reportModule`;
  }
}
