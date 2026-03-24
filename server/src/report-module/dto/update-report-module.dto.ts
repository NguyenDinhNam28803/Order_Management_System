import { PartialType } from '@nestjs/mapped-types';
import { CreateReportModuleDto } from './create-report-module.dto';

export class UpdateReportModuleDto extends PartialType(CreateReportModuleDto) {}
