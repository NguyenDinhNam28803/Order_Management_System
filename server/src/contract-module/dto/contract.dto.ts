import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';
import { ContractStatus, CurrencyCode } from '@prisma/client';

export class CreateContractDto {
  @ApiProperty({ example: '325f187a-c1f6-4a4e-8692-234b6e50334a' })
  @IsUUID('4')
  @IsNotEmpty()
  supplierId: string;

  @ApiProperty({ example: 'IT Equipment Supply Contract 2026' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiPropertyOptional({ example: 'Annual supply of laptops and accessories' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ example: 'PURCHASE', default: 'PURCHASE' })
  @IsString()
  @IsOptional()
  contractType?: string;

  @ApiPropertyOptional({ example: 500000.0 })
  @IsNumber()
  @IsOptional()
  value?: number;

  @ApiPropertyOptional({ enum: CurrencyCode, default: CurrencyCode.VND })
  @IsEnum(CurrencyCode)
  @IsOptional()
  currency?: CurrencyCode;

  @ApiPropertyOptional({ example: '2026-01-01' })
  @IsDateString()
  @IsOptional()
  startDate?: string;

  @ApiPropertyOptional({ example: '2026-12-31' })
  @IsDateString()
  @IsOptional()
  endDate?: string;

  @ApiPropertyOptional({ example: false, default: false })
  @IsBoolean()
  @IsOptional()
  autoRenew?: boolean;

  @ApiPropertyOptional({ example: 30, default: 30 })
  @IsNumber()
  @IsOptional()
  renewalNoticeDays?: number;

  @ApiPropertyOptional({ example: 'Standard terms and conditions...' })
  @IsString()
  @IsOptional()
  terms?: string;

  @ApiPropertyOptional({ example: 'Internal notes for this contract' })
  @IsString()
  @IsOptional()
  notes?: string;

  @ApiPropertyOptional({
    example: 'https://storage.example.com/contracts/contract-001.pdf',
  })
  @IsString()
  @IsOptional()
  fileUrl?: string;

  @ApiPropertyOptional({
    example: 'https://storage.example.com/contracts/nda-001.pdf',
  })
  @IsString()
  @IsOptional()
  ndaUrl?: string;
}

export class UpdateContractDto {
  @ApiPropertyOptional({ example: 'Updated title' })
  @IsString()
  @IsOptional()
  title?: string;

  @ApiPropertyOptional({ example: 'Updated description' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ enum: ContractStatus })
  @IsEnum(ContractStatus)
  @IsOptional()
  status?: ContractStatus;

  @ApiPropertyOptional({ example: 600000.0 })
  @IsNumber()
  @IsOptional()
  value?: number;

  @ApiPropertyOptional({ example: '2027-12-31' })
  @IsDateString()
  @IsOptional()
  endDate?: string;

  @ApiPropertyOptional({ example: true })
  @IsBoolean()
  @IsOptional()
  autoRenew?: boolean;

  @ApiPropertyOptional({ example: 'Updated terms...' })
  @IsString()
  @IsOptional()
  terms?: string;

  @ApiPropertyOptional({ example: 'Updated notes...' })
  @IsString()
  @IsOptional()
  notes?: string;
}
