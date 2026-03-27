import { PartialType, ApiProperty } from '@nestjs/swagger';
import { CreateUserModuleDto } from './create-user-module.dto';
import { IsBoolean, IsOptional } from 'class-validator';

export class UpdateUserModuleDto extends PartialType(CreateUserModuleDto) {
  @ApiProperty({ required: false })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
