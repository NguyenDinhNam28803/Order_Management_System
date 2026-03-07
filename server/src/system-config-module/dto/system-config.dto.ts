import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class UpsertSystemConfigDto {
  @ApiProperty({ example: 'PO_APPROVAL_THRESHOLD' })
  @IsString()
  @IsNotEmpty()
  configKey: string;

  @ApiProperty({ example: '1000000' })
  @IsString()
  @IsNotEmpty()
  configValue: string;

  @ApiPropertyOptional({ example: 'NUMBER', default: 'STRING' })
  @IsString()
  @IsOptional()
  valueType?: string;

  @ApiPropertyOptional({ example: 'Threshold for requiring CEO approval' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ example: false, default: false })
  @IsBoolean()
  @IsOptional()
  isEncrypted?: boolean;
}
