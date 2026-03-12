import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  IsDate,
  IsUrl,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { GrnStatus } from '@prisma/client';

export class CreateGrnmoduleDto {
  @ApiProperty({ example: '325f187a-c1f6-4a4e-8692-234b6e50334a' })
  @IsUUID('4')
  @IsNotEmpty()
  poId: string;

  @ApiPropertyOptional({ example: '325f187a-c1f6-4a4e-8692-234b6e50334b' })
  @IsUUID('4')
  @IsOptional()
  warehouseId?: string;

  @ApiPropertyOptional({ enum: GrnStatus, default: GrnStatus.DRAFT })
  @IsEnum(GrnStatus)
  @IsOptional()
  status?: GrnStatus;

  @ApiPropertyOptional({ example: 'FULL', default: 'FULL' })
  @IsString()
  @IsOptional()
  grnType?: string;

  @ApiPropertyOptional({ example: '2026-03-12T10:00:00Z' })
  @Transform(({ value }) => (value === '' ? undefined : value))
  @Type(() => Date)
  @IsDate()
  @IsOptional()
  receivedAt?: Date;

  @ApiPropertyOptional({ example: '2026-03-12T12:00:00Z' })
  @Transform(({ value }) => (value === '' ? undefined : value))
  @Type(() => Date)
  @IsDate()
  @IsOptional()
  inspectionCompletedAt?: Date;

  @ApiPropertyOptional({ example: '2026-03-12T14:00:00Z' })
  @Transform(({ value }) => (value === '' ? undefined : value))
  @Type(() => Date)
  @IsDate()
  @IsOptional()
  confirmedAt?: Date;

  @ApiPropertyOptional({ example: 'https://storage.example.com/grn/packing-list.pdf' })
  @IsUrl()
  @IsOptional()
  packingListUrl?: string;

  @ApiPropertyOptional({ example: 'WB-12345' })
  @IsString()
  @IsOptional()
  waybillNumber?: string;

  @ApiPropertyOptional({ example: 'All items received in good condition' })
  @IsString()
  @IsOptional()
  notes?: string;
}
