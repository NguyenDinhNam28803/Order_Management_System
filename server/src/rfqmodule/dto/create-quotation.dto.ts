import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNumber,
  IsUUID,
  IsOptional,
  IsArray,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { CurrencyCode } from '@prisma/client';

export class QuotationItemDto {
  @ApiProperty({ description: 'RFQ Item ID' })
  @IsUUID()
  rfqItemId: string;

  @ApiProperty({ description: 'Unit price offered' })
  @IsNumber()
  unitPrice: number;

  @ApiProperty({ description: 'Quantity offered' })
  @IsNumber()
  @IsOptional()
  qtyOffered?: number;

  @ApiProperty({ description: 'Discount percentage' })
  @IsNumber()
  @IsOptional()
  discountPct?: number;

  @ApiProperty({ description: 'Lead time in days for this item' })
  @IsNumber()
  @IsOptional()
  leadTimeDays?: number;

  @ApiProperty({ description: 'Notes for this item' })
  @IsString()
  @IsOptional()
  notes?: string;
}

export class CreateQuotationDto {
  @ApiProperty({ description: 'RFQ ID' })
  @IsUUID()
  rfqId: string;

  @ApiProperty({ description: 'Supplier Organization ID' })
  @IsUUID()
  supplierId: string;

  @ApiProperty({ description: 'Total price of quotation' })
  @IsNumber()
  totalPrice: number;

  @ApiProperty({
    description: 'Currency of quotation',
    enum: CurrencyCode,
    default: CurrencyCode.VND,
  })
  @IsOptional()
  currency?: CurrencyCode;

  @ApiProperty({ description: 'Overall lead time in days' })
  @IsNumber()
  leadTimeDays: number;

  @ApiProperty({ description: 'Payment terms' })
  @IsString()
  @IsOptional()
  paymentTerms?: string;

  @ApiProperty({ description: 'Delivery terms' })
  @IsString()
  @IsOptional()
  deliveryTerms?: string;

  @ApiProperty({ description: 'Validity period in days' })
  @IsNumber()
  @IsOptional()
  validityDays?: number;

  @ApiProperty({ description: 'General notes' })
  @IsString()
  @IsOptional()
  notes?: string;

  @ApiProperty({ type: [QuotationItemDto], description: 'Quotation items' })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => QuotationItemDto)
  items: QuotationItemDto[];
}
