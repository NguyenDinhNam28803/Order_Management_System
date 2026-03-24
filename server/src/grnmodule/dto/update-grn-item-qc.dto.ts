import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { QcResult } from '@prisma/client';

export class UpdateGrnItemQcResultDto {
  @ApiProperty({
    description:
      'Kết quả kiểm tra chất lượng (PASS: Đạt, FAIL: Hỏng, PARTIAL_PASS: Đạt một phần).',
    enum: QcResult,
    example: QcResult.PASS,
  })
  @IsEnum(QcResult)
  @IsNotEmpty()
  qcResult: QcResult;

  @ApiProperty({
    description: 'Số lượng sản phẩm đạt chuẩn được chấp nhận nhập kho.',
    example: 100,
  })
  @IsNumber()
  @Min(0)
  @IsNotEmpty()
  acceptedQty: number;

  @ApiProperty({
    description: 'Số lượng sản phẩm bị từ chối (hỏng, sai quy cách...).',
    example: 0,
  })
  @IsNumber()
  @Min(0)
  @IsNotEmpty()
  rejectedQty: number;

  @ApiPropertyOptional({
    description: 'Lý do từ chối (nếu có sản phẩm bị từ chối).',
    example: 'Bao bì bị rách, sản phẩm bị móp.',
  })
  @IsString()
  @IsOptional()
  rejectionReason?: string;

  @ApiPropertyOptional({
    description: 'Ghi chú chi tiết của nhân viên QC.',
    example: 'Sản phẩm đạt chuẩn, đóng gói kỹ.',
  })
  @IsString()
  @IsOptional()
  qcNotes?: string;
}
