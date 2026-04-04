import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';
import { CurrencyCode, ProductType } from '@prisma/client';

export class CreateProductDto {
  @ApiPropertyOptional({ example: '325f187a-c1f6-4a4e-8692-234b6e50334a' })
  @IsUUID('4')
  @IsOptional()
  orgId?: string;

  @ApiPropertyOptional({ example: '325f187a-c1f6-4a4e-8692-234b6e50334b' })
  @IsUUID('4')
  @IsOptional()
  categoryId?: string;

  @ApiPropertyOptional({ example: 'SKU-001' })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  sku?: string;

  @ApiProperty({ example: 'Laptop Dell XPS 15' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name: string;

  @ApiPropertyOptional({ example: 'A high-end laptop for developers' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ example: 'PCS', default: 'PCS' })
  @IsString()
  @IsOptional()
  @MaxLength(30)
  unit?: string;

  @ApiPropertyOptional({ example: 1500.0 })
  @IsNumber()
  @IsOptional()
  unitPriceRef?: number;

  @ApiPropertyOptional({ enum: CurrencyCode, default: CurrencyCode.VND })
  @IsEnum(CurrencyCode)
  @IsOptional()
  currency?: CurrencyCode;

  @ApiPropertyOptional({ enum: ProductType, default: ProductType.CATALOG })
  @IsEnum(ProductType)
  @IsOptional()
  type?: ProductType;

  @ApiPropertyOptional({ example: '2026-04-01T08:30:00Z' })
  @IsOptional()
  lastPriceAt?: Date;

  @ApiPropertyOptional({ example: 'https://example.com/spec.pdf' })
  @IsString()
  @IsOptional()
  @MaxLength(500)
  specSheetUrl?: string;

  @ApiPropertyOptional({ example: ['https://example.com/img1.png'] })
  @IsOptional()
  imageUrls?: string[];

  @ApiPropertyOptional({ example: { color: 'silver', weight: '1.8kg' } })
  @IsOptional()
  attributes?: Record<string, any>;

  @ApiPropertyOptional({ default: true })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
