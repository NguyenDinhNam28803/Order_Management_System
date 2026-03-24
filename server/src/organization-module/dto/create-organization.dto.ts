import {
  IsString,
  IsOptional,
  IsEmail,
  IsEnum,
  IsBoolean,
  IsNotEmpty,
  MaxLength,
} from 'class-validator';
import { CompanyType } from '@prisma/client';

export class CreateOrganizationDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  code: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name: string;

  @IsString()
  @IsOptional()
  @MaxLength(255)
  legalName?: string;

  @IsString()
  @IsOptional()
  @MaxLength(50)
  taxCode?: string;

  @IsEnum(CompanyType)
  @IsOptional()
  companyType?: CompanyType;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  industry?: string;

  @IsString()
  @IsOptional()
  @MaxLength(2)
  countryCode?: string;

  @IsString()
  @IsOptional()
  province?: string;

  @IsString()
  @IsOptional()
  address?: string;

  @IsString()
  @IsOptional()
  @MaxLength(30)
  phone?: string;

  @IsEmail()
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  @MaxLength(255)
  website?: string;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
