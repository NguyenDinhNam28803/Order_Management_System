import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  IsNumber,
  IsBoolean,
  IsDateString,
  IsUUID,
  IsArray,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ContractStatus, CurrencyCode } from '@prisma/client';

class CreateContractMilestoneDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsDateString()
  @IsNotEmpty()
  dueDate: string;

  @IsBoolean()
  @IsOptional()
  paymentTrigger?: boolean;

  @IsNumber()
  @IsOptional()
  paymentPct?: number;
}

export class CreateContractDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsUUID()
  @IsNotEmpty()
  supplierId: string;

  @IsEnum(ContractStatus)
  @IsOptional()
  status?: ContractStatus;

  @IsString()
  @IsOptional()
  contractType?: string;

  @IsNumber()
  @IsOptional()
  value?: number;

  @IsEnum(CurrencyCode)
  @IsOptional()
  currency?: CurrencyCode;

  @IsDateString()
  @IsOptional()
  startDate?: string;

  @IsDateString()
  @IsOptional()
  endDate?: string;

  @IsBoolean()
  @IsOptional()
  autoRenew?: boolean;

  @IsNumber()
  @IsOptional()
  renewalNoticeDays?: number;

  @IsString()
  @IsOptional()
  terms?: string;

  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => CreateContractMilestoneDto)
  milestones?: CreateContractMilestoneDto[];
}
