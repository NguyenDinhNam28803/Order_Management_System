import {
  IsString,
  IsOptional,
  IsEnum,
  IsUUID,
  IsNumber,
  Min,
} from 'class-validator';
import { DisputeType } from '@prisma/client';
import { ApiProperty } from '@nestjs/swagger';

export class CreateDisputeModuleDto {
  @ApiProperty({ description: 'ID của Purchase Order liên quan' })
  @IsUUID()
  poId: string;

  @ApiProperty({
    required: false,
    description: 'ID của GRN liên quan (nếu có)',
  })
  @IsOptional()
  @IsUUID()
  grnId?: string;

  @ApiProperty({
    required: false,
    description: 'ID của Invoice liên quan (nếu có)',
  })
  @IsOptional()
  @IsUUID()
  invoiceId?: string;

  @ApiProperty({ description: 'ID của tổ chức bị khiếu nại' })
  @IsUUID()
  againstOrgId: string;

  @ApiProperty({ enum: DisputeType, description: 'Loại tranh chấp' })
  @IsEnum(DisputeType)
  type: DisputeType;

  @ApiProperty({ description: 'Mô tả chi tiết nội dung tranh chấp' })
  @IsString()
  description: string;

  @ApiProperty({
    required: false,
    description: 'Số tiền yêu cầu bồi thường (nếu có)',
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  claimedAmount?: number;
}
