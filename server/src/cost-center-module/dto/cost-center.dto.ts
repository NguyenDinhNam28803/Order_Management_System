import {
  IsNotEmpty,
  IsString,
  IsOptional,
  IsNumber,
  IsEnum,
  IsBoolean,
  IsInt,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { CurrencyCode } from '@prisma/client';

export class CreateCostCenterDto {
  @ApiProperty({ description: 'Organization ID' })
  @IsNotEmpty()
  @IsString()
  orgId: string;

  @ApiProperty({ description: 'Department ID', required: false })
  @IsOptional()
  @IsString()
  deptId?: string;

  @ApiProperty({ description: 'Cost Center Code' })
  @IsNotEmpty()
  @IsString()
  code: string;

  @ApiProperty({ description: 'Cost Center Name' })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({ description: 'General Ledger Account', required: false })
  @IsOptional()
  @IsString()
  glAccount?: string;

  @ApiProperty({ description: 'Annual Budget Amount', default: 0 })
  @IsOptional()
  @IsNumber()
  budgetAnnual?: number;

  @ApiProperty({
    description: 'Currency Code',
    enum: CurrencyCode,
    default: CurrencyCode.VND,
  })
  @IsOptional()
  @IsEnum(CurrencyCode)
  currency?: CurrencyCode;

  @ApiProperty({ description: 'Fiscal Year', required: false })
  @IsOptional()
  @IsInt()
  fiscalYear?: number;
}

export class UpdateCostCenterDto {
  @ApiProperty({ description: 'Department ID', required: false })
  @IsOptional()
  @IsString()
  deptId?: string;

  @ApiProperty({ description: 'Cost Center Name', required: false })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({ description: 'General Ledger Account', required: false })
  @IsOptional()
  @IsString()
  glAccount?: string;

  @ApiProperty({ description: 'Annual Budget Amount', required: false })
  @IsOptional()
  @IsNumber()
  budgetAnnual?: number;

  @ApiProperty({ description: 'Is Active', required: false })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
