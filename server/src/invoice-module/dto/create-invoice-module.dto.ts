import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDate,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  IsUrl,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { InvoiceStatus, CurrencyCode } from '@prisma/client';

export class CreateInvoiceModuleDto {
  @ApiProperty({ example: '325f187a-c1f6-4a4e-8692-234b6e50334a' })
  @IsUUID('4')
  @IsNotEmpty()
  poId: string;

  @ApiPropertyOptional({ example: '325f187a-c1f6-4a4e-8692-234b6e50334b' })
  @IsUUID('4')
  @IsOptional()
  grnId?: string;

  @ApiProperty({ example: 'INV-2026-001' })
  @IsString()
  @IsNotEmpty()
  invoiceNumber: string;

  @ApiProperty({ example: '325f187a-c1f6-4a4e-8692-234b6e50334c' })
  @IsUUID('4')
  @IsNotEmpty()
  supplierId: string;

  @ApiProperty({ example: '325f187a-c1f6-4a4e-8692-234b6e50334d' })
  @IsUUID('4')
  @IsNotEmpty()
  orgId: string;

  @ApiPropertyOptional({ enum: InvoiceStatus, default: InvoiceStatus.DRAFT })
  @IsEnum(InvoiceStatus)
  @IsOptional()
  status?: InvoiceStatus;

  @ApiProperty({ example: 1000.0 })
  @IsNumber()
  @IsNotEmpty()
  subtotal: number;

  @ApiPropertyOptional({ example: 10, default: 10 })
  @IsNumber()
  @IsOptional()
  taxRate?: number;

  @ApiProperty({ example: 1100.0 })
  @IsNumber()
  @IsNotEmpty()
  totalAmount: number;

  @ApiPropertyOptional({ enum: CurrencyCode, default: CurrencyCode.VND })
  @IsEnum(CurrencyCode)
  @IsOptional()
  currency?: CurrencyCode;

  @ApiProperty({ example: '2026-03-12' })
  @Transform(({ value }) => (value === '' ? undefined : value))
  @Type(() => Date)
  @IsDate()
  @IsNotEmpty()
  invoiceDate: Date;

  @ApiPropertyOptional({ example: '2026-04-12' })
  @Transform(({ value }) => (value === '' ? undefined : value))
  @Type(() => Date)
  @IsDate()
  @IsOptional()
  dueDate?: Date;

  @ApiPropertyOptional({ example: 'Net 30' })
  @IsString()
  @IsOptional()
  paymentTerms?: string;

  @ApiPropertyOptional({
    example: 'https://storage.example.com/invoices/inv-001.pdf',
  })
  @IsUrl()
  @IsOptional()
  eInvoiceUrl?: string;

  @ApiPropertyOptional({ example: 'REF-12345' })
  @IsString()
  @IsOptional()
  eInvoiceRef?: string;

  @ApiPropertyOptional({ example: 'Internal notes' })
  @IsString()
  @IsOptional()
  notes?: string;
}
