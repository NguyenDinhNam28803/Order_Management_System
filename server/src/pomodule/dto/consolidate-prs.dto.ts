import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  ArrayMinSize,
  IsArray,
  IsDate,
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';

/**
 * Hai chế độ matching khi gộp PR item vào PO:
 *
 * SKU_MATCH      → Gộp các item có cùng SKU (mã hàng hóa) chính xác.
 *                  Nếu item không có SKU, fallback so sánh productDesc (lowercase).
 *                  Dùng khi hàng hóa được định danh bằng mã cụ thể (văn phòng phẩm, IT equipment…)
 *
 * CATEGORY_MATCH → Gộp các item có cùng categoryId (danh mục sản phẩm).
 *                  Nếu item không có categoryId, fallback so sánh productDesc.
 *                  Dùng khi muốn gộp theo nhóm ngành hàng (vật tư cơ khí, thiết bị điện…)
 */
export type ConsolidationMode = 'SKU_MATCH' | 'CATEGORY_MATCH';

export class ConsolidatePRsDto {
  @ApiProperty({
    description:
      'Danh sách ID của các PR đã APPROVED cần gộp vào 1 PO (tối thiểu 2 PR)',
    type: [String],
    example: ['uuid-pr-001', 'uuid-pr-002', 'uuid-pr-003'],
  })
  @IsArray()
  @IsUUID('4', { each: true })
  @ArrayMinSize(2, { message: 'Cần ít nhất 2 PR để gộp' })
  prIds!: string[];

  @ApiProperty({
    description: 'ID nhà cung cấp được chọn để gửi PO gộp',
    example: 'uuid-supplier-001',
  })
  @IsUUID('4')
  supplierId!: string;

  @ApiPropertyOptional({
    description:
      'Chế độ gộp item:\n' +
      '- SKU_MATCH: gộp theo mã SKU (mặc định)\n' +
      '- CATEGORY_MATCH: gộp theo danh mục sản phẩm',
    enum: ['SKU_MATCH', 'CATEGORY_MATCH'],
    default: 'SKU_MATCH',
  })
  @IsEnum(['SKU_MATCH', 'CATEGORY_MATCH'])
  @IsOptional()
  consolidationMode?: ConsolidationMode;

  @ApiProperty({
    description: 'Ngày giao hàng dự kiến',
    example: '2026-05-01',
  })
  @Transform(({ value }) => (value === '' ? undefined : value))
  @Type(() => Date)
  @IsDate()
  deliveryDate!: Date;

  @ApiPropertyOptional({
    description: 'Điều khoản thanh toán',
    example: 'Net 30',
  })
  @IsString()
  @IsOptional()
  paymentTerms?: string;

  @ApiPropertyOptional({
    description: 'Địa chỉ giao hàng',
    example: '123 Nguyễn Huệ, Q1, TP.HCM',
  })
  @IsString()
  @IsOptional()
  deliveryAddress?: string;

  @ApiPropertyOptional({
    description: 'Ghi chú cho PO gộp',
    example: 'PO gộp tháng 4 cho nhà cung cấp ABC',
  })
  @IsString()
  @IsOptional()
  notes?: string;
}
