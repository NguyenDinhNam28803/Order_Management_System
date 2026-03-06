import { PartialType } from '@nestjs/mapped-types';
import { CreatePrmoduleDto } from './create-prmodule.dto';

export class UpdatePrmoduleDto extends PartialType(CreatePrmoduleDto) {}
