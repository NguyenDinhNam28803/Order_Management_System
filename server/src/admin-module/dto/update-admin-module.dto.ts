import { PartialType } from '@nestjs/mapped-types';
import { CreateAdminModuleDto } from './create-admin-module.dto';

export class UpdateAdminModuleDto extends PartialType(CreateAdminModuleDto) {}
