import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsDateString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';

export class CreateRfqDto {
  @ApiProperty({ example: '325f187a-c1f6-4a4e-8692-234b6e50334a' })
  @IsUUID('4')
  @IsNotEmpty()
  prId: string;

  @ApiProperty({ example: 'Request for Laptops' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiPropertyOptional({ example: 'Need high quality laptops' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ example: '2026-03-20T10:00:00Z' })
  @IsDateString()
  @IsNotEmpty()
  deadline: string;

  @ApiPropertyOptional({ example: 3 })
  @IsNumber()
  @IsOptional()
  minSuppliers?: number;

  @ApiProperty({
    type: [String],
    example: ['supplier-uuid-1', 'supplier-uuid-2'],
  })
  @IsArray()
  @IsUUID('4', { each: true })
  supplierIds: string[];
}
