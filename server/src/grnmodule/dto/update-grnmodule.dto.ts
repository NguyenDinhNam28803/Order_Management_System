import { PartialType } from '@nestjs/mapped-types';
import { CreateGrnmoduleDto } from './create-grnmodule.dto';

export class UpdateGrnmoduleDto extends PartialType(CreateGrnmoduleDto) {}
