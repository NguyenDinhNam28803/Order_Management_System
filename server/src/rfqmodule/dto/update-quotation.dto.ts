import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsOptional,
  IsString,
  IsNumber,
  IsArray,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { QuotationItemDto } from './create-quotation.dto';

export class UpdateQuotationDto {
  @ApiPropertyOptional({ description: 'Total price of quotation' })
  @IsNumber()
  @IsOptional()
  totalPrice?: number;

  @ApiPropertyOptional({ description: 'Payment terms' })
  @IsString()
  @IsOptional()
  paymentTerms?: string;

  @ApiPropertyOptional({ description: 'Delivery terms' })
  @IsString()
  @IsOptional()
  deliveryTerms?: string;

  @ApiPropertyOptional({ description: 'Validity period in days' })
  @IsNumber()
  @IsOptional()
  validityDays?: number;

  @ApiPropertyOptional({ description: 'General notes' })
  @IsString()
  @IsOptional()
  notes?: string;

  @ApiPropertyOptional({
    type: [QuotationItemDto],
    description: 'Updated quotation items',
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => QuotationItemDto)
  @IsOptional()
  items?: QuotationItemDto[];
}
