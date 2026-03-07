import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';

export class CreatePoDto {
  @ApiPropertyOptional({ example: '325f187a-c1f6-4a4e-8692-234b6e50334a' })
  @IsUUID('4')
  @IsOptional()
  prId?: string;

  @ApiPropertyOptional({ example: '325f187a-c1f6-4a4e-8692-234b6e50334b' })
  @IsUUID('4')
  @IsOptional()
  rfqId?: string;

  @ApiPropertyOptional({ example: '325f187a-c1f6-4a4e-8692-234b6e50334c' })
  @IsUUID('4')
  @IsOptional()
  quotationId?: string;

  @ApiProperty({ example: '325f187a-c1f6-4a4e-8692-234b6e50334d' })
  @IsUUID('4')
  @IsNotEmpty()
  supplierId: string;

  @ApiPropertyOptional({ example: 'Standard Payment Terms' })
  @IsString()
  @IsOptional()
  paymentTerms?: string;

  @ApiPropertyOptional({ example: '123 Delivery St' })
  @IsString()
  @IsOptional()
  deliveryAddress?: string;

  @ApiProperty({ example: '2026-04-15' })
  @IsDateString()
  @IsNotEmpty()
  deliveryDate: string;

  @ApiPropertyOptional({ example: 'Urgent order' })
  @IsString()
  @IsOptional()
  notes?: string;
}
