import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  IsDate,
  IsUrl,
  ValidateNested,
  IsArray,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { GrnStatus } from '@prisma/client';
import { CreateGrnItemDto } from './create-grn-item.dto';

export class CreateGrnmoduleDto {
  @ApiProperty({
    description: 'ID của Đơn mua hàng (Purchase Order) cần nhập kho.',
    example: '325f187a-c1f6-4a4e-8692-234b6e50334a',
  })
  @IsUUID('4')
  @IsNotEmpty()
  poId: string;

  @ApiPropertyOptional({
    description:
      'ID của kho hàng hoặc phòng ban tiếp nhận (Warehouse/Department).',
    example: '325f187a-c1f6-4a4e-8692-234b6e50334b',
  })
  @IsUUID('4')
  @IsOptional()
  warehouseId?: string;

  @ApiProperty({
    description: 'Danh sách chi tiết các mặt hàng được nhập trong đợt này.',
    type: [CreateGrnItemDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateGrnItemDto)
  items: CreateGrnItemDto[];

  @ApiPropertyOptional({
    description:
      'Trạng thái ban đầu của phiếu nhập kho (thường là DRAFT hoặc INSPECTING).',
    enum: GrnStatus,
    default: GrnStatus.DRAFT,
  })
  @IsEnum(GrnStatus)
  @IsOptional()
  status?: GrnStatus;

  @ApiPropertyOptional({
    description: 'Loại nhập kho (FULL: nhập đủ, PARTIAL: nhập một phần).',
    example: 'FULL',
    default: 'FULL',
  })
  @IsString()
  @IsOptional()
  grnType?: string;

  @ApiPropertyOptional({
    description: 'Thời gian thực tế hàng về đến kho.',
    example: '2026-03-12T10:00:00Z',
  })
  @Transform(({ value }) => (value === '' ? undefined : value))
  @Type(() => Date)
  @IsDate()
  @IsOptional()
  receivedAt?: Date;

  @ApiPropertyOptional({
    description: 'Thời gian hoàn tất kiểm tra chất lượng (QC).',
    example: '2026-03-12T12:00:00Z',
  })
  @Transform(({ value }) => (value === '' ? undefined : value))
  @Type(() => Date)
  @IsDate()
  @IsOptional()
  inspectionCompletedAt?: Date;

  @ApiPropertyOptional({
    description: 'Thời gian xác nhận nhập kho (chốt sổ).',
    example: '2026-03-12T14:00:00Z',
  })
  @Transform(({ value }) => (value === '' ? undefined : value))
  @Type(() => Date)
  @IsDate()
  @IsOptional()
  confirmedAt?: Date;

  @ApiPropertyOptional({
    description: 'Link tải file Packing List (Phiếu đóng gói) từ nhà cung cấp.',
    example: 'https://storage.example.com/grn/packing-list.pdf',
  })
  @IsUrl()
  @IsOptional()
  packingListUrl?: string;

  @ApiPropertyOptional({
    description: 'Số vận đơn (Bill of Lading / Waybill Number).',
    example: 'WB-12345',
  })
  @IsString()
  @IsOptional()
  waybillNumber?: string;

  @ApiPropertyOptional({
    description:
      'Ghi chú thêm về đợt nhập hàng (tình trạng bao bì, xe giao hàng...).',
    example: 'Hàng về đủ, bao bì nguyên vẹn.',
  })
  @IsString()
  @IsOptional()
  notes?: string;
}
