import { PartialType } from '@nestjs/mapped-types';
import { CreateApprovalModuleDto } from './create-approval-module.dto';

export class UpdateApprovalModuleDto extends PartialType(CreateApprovalModuleDto) {}
