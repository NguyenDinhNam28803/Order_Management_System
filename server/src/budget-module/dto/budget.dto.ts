import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import {
  IsBoolean,
  IsDate,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { CurrencyCode } from '@prisma/client';

export class CreateBudgetPeriodDto {
  @ApiProperty({ example: 2026 })
  @IsNumber()
  @IsNotEmpty()
  fiscalYear: number;

  @ApiPropertyOptional({ example: 'ANNUAL', default: 'ANNUAL' })
  @IsString()
  @IsOptional()
  periodType?: string;

  @ApiPropertyOptional({ example: 1, default: 1 })
  @IsNumber()
  @IsOptional()
  periodNumber?: number;

  @ApiProperty({ example: '2026-01-01' })
  @Transform(({ value }) => (value === '' ? undefined : value))
  @Type(() => Date)
  @IsDate()
  @IsNotEmpty()
  startDate: Date;

  @ApiProperty({ example: '2026-12-31' })
  @Transform(({ value }) => (value === '' ? undefined : value))
  @Type(() => Date)
  @IsDate()
  @IsNotEmpty()
  endDate: Date;

  @ApiPropertyOptional({ example: true, default: true })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

export class UpdateBudgetPeriodDto extends PartialType(CreateBudgetPeriodDto) {}

export class CreateBudgetAllocationDto {
  @ApiProperty({ example: '325f187a-c1f6-4a4e-8692-234b6e50334a' })
  @IsUUID('4')
  @IsNotEmpty()
  budgetPeriodId: string;

  @ApiProperty({ example: '325f187a-c1f6-4a4e-8692-234b6e50334b' })
  @IsUUID('4')
  @IsNotEmpty()
  costCenterId: string;

  @ApiPropertyOptional({ example: '325f187a-c1f6-4a4e-8692-234b6e50334c' })
  @IsUUID('4')
  @IsOptional()
  deptId?: string;

  @ApiPropertyOptional({ example: '325f187a-c1f6-4a4e-8692-234b6e50334d' })
  @IsUUID('4')
  @IsOptional()
  categoryId?: string;

  @ApiProperty({ example: 1000000.0 })
  @IsNumber()
  @IsNotEmpty()
  allocatedAmount: number;

  @ApiPropertyOptional({ enum: CurrencyCode, default: CurrencyCode.VND })
  @IsEnum(CurrencyCode)
  @IsOptional()
  currency?: CurrencyCode;

  @ApiPropertyOptional({ example: 'Budget for IT equipment' })
  @IsString()
  @IsOptional()
  notes?: string;
}

export class UpdateBudgetAllocationDto extends PartialType(CreateBudgetAllocationDto) {}
