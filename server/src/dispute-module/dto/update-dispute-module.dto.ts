import { PartialType } from '@nestjs/mapped-types';
import { CreateDisputeModuleDto } from './create-dispute-module.dto';

export class UpdateDisputeModuleDto extends PartialType(
  CreateDisputeModuleDto,
) {}
