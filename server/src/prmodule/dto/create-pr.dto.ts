import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsDate,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  ValidateNested,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { CurrencyCode } from '@prisma/client';

export class CreatePrItemDto {
  @ApiPropertyOptional({ example: '325f187a-c1f6-4a4e-8692-234b6e50334b' })
  @IsUUID('4')
  @IsOptional()
  productId?: string;

  @ApiProperty({ example: 'Laptop Dell XPS 15' })
  @IsString()
  @IsNotEmpty()
  productDesc: string;

  @ApiPropertyOptional({ example: 'SKU-001' })
  @IsString()
  @IsOptional()
  sku?: string;

  @ApiPropertyOptional({ example: '325f187a-c1f6-4a4e-8692-234b6e50334c' })
  @IsUUID('4')
  @IsOptional()
  categoryId?: string;

  @ApiPropertyOptional({ example: 'Electronics' })
  @IsString()
  @IsOptional()
  categoryName?: string;

  @ApiProperty({ example: 5 })
  @IsNumber()
  @IsNotEmpty()
  qty: number;

  @ApiPropertyOptional({ example: 'PCS', default: 'PCS' })
  @IsString()
  @IsOptional()
  unit?: string;

  @ApiProperty({ example: 1500.0 })
  @IsNumber()
  @IsNotEmpty()
  estimatedPrice: number;

  @ApiPropertyOptional({ enum: CurrencyCode, default: CurrencyCode.VND })
  @IsEnum(CurrencyCode)
  @IsOptional()
  currency?: CurrencyCode;

  @ApiPropertyOptional({ example: 'Must have 32GB RAM' })
  @IsString()
  @IsOptional()
  specNote?: string;
}

export class CreatePrDto {
  @ApiProperty({ example: 'Purchase laptops for new dev team' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiPropertyOptional({ example: 'Detailed description of the requirement' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ example: 'Justification for the purchase' })
  @IsString()
  @IsOptional()
  justification?: string;

  @ApiPropertyOptional({ example: '2026-04-01', description: 'ISO date string or Date object' })
  @Transform(({ value }) => {
    if (!value || value === '') return undefined;
    // Accept both Date object and ISO string from AI
    if (typeof value === 'string') {
      return new Date(value);
    }
    return value instanceof Date ? value : new Date(value);
  })
  @IsDate()
  @IsOptional()
  requiredDate?: Date;

  @ApiPropertyOptional({
    example: 2,
    description: 'Priority level (1-High, 2-Medium, 3-Low)',
  })
  @IsNumber()
  @IsOptional()
  priority?: number;

  @ApiPropertyOptional({ enum: CurrencyCode, default: CurrencyCode.VND })
  @IsEnum(CurrencyCode)
  @IsOptional()
  currency?: CurrencyCode;

  @ApiPropertyOptional({ example: '325f187a-c1f6-4a4e-8692-234b6e50334d' })
  @IsUUID('4')
  @IsOptional()
  costCenterId?: string;

  @ApiProperty({ type: [CreatePrItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreatePrItemDto)
  items: CreatePrItemDto[];
}
