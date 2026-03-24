import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  IsDate,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { PaymentMethod, PaymentStatus, CurrencyCode } from '@prisma/client';

export class CreatePaymentModuleDto {
  @ApiProperty({ example: '325f187a-c1f6-4a4e-8692-234b6e50334a' })
  @IsUUID('4')
  @IsNotEmpty()
  invoiceId: string;

  @ApiProperty({ example: '325f187a-c1f6-4a4e-8692-234b6e50334b' })
  @IsUUID('4')
  @IsNotEmpty()
  poId: string;

  @ApiProperty({ example: '325f187a-c1f6-4a4e-8692-234b6e50334c' })
  @IsUUID('4')
  @IsNotEmpty()
  supplierId: string;

  @ApiProperty({ enum: PaymentMethod })
  @IsEnum(PaymentMethod)
  @IsNotEmpty()
  method: PaymentMethod;

  @ApiProperty({ example: 1000.0 })
  @IsNumber()
  @IsNotEmpty()
  amount: number;

  @ApiPropertyOptional({ enum: CurrencyCode, default: CurrencyCode.VND })
  @IsEnum(CurrencyCode)
  @IsOptional()
  currency?: CurrencyCode;

  @ApiPropertyOptional({ enum: PaymentStatus, default: PaymentStatus.PENDING })
  @IsEnum(PaymentStatus)
  @IsOptional()
  status?: PaymentStatus;

  @ApiPropertyOptional({ example: '2026-03-12' })
  @Transform(({ value }) => (value === '' ? undefined : value))
  @Type(() => Date)
  @IsDate()
  @IsOptional()
  paymentDate?: Date;

  @ApiPropertyOptional({ example: '2026-03-15' })
  @Transform(({ value }) => (value === '' ? undefined : value))
  @Type(() => Date)
  @IsDate()
  @IsOptional()
  scheduledDate?: Date;

  @ApiPropertyOptional({ example: 'GATEWAY-123' })
  @IsString()
  @IsOptional()
  gatewayRef?: string;

  @ApiPropertyOptional({ example: 'BANK-123' })
  @IsString()
  @IsOptional()
  bankRef?: string;
}
