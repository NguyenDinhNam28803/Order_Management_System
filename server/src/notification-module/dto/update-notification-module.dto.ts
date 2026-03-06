import { PartialType } from '@nestjs/mapped-types';
import { CreateNotificationModuleDto } from './create-notification-module.dto';

export class UpdateNotificationModuleDto extends PartialType(CreateNotificationModuleDto) {}
