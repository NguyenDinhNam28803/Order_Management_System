import { PartialType } from '@nestjs/mapped-types';
import { CreatePomoduleDto } from './create-pomodule.dto';

export class UpdatePomoduleDto extends PartialType(CreatePomoduleDto) {}
