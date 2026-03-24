import { PartialType } from '@nestjs/mapped-types';
import { CreateRfqmoduleDto } from './create-rfqmodule.dto';

export class UpdateRfqmoduleDto extends PartialType(CreateRfqmoduleDto) {}
