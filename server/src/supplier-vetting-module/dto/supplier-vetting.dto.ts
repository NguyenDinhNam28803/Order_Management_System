import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
} from 'class-validator';

export const CHECK_TYPES = [
  'BUSINESS_LICENSE',   // Giấy phép kinh doanh
  'TAX_CODE',           // Mã số thuế
  'CERTIFICATE_OF_ORIGIN', // Chứng nhận xuất xứ (CO)
  'CUSTOMS_DOCS',       // Chứng từ hải quan
  'TAX_AUTHORITY_CALL', // Xác minh qua cơ quan thuế (gọi điện)
  'FIELD_VISIT',        // Khảo sát thực địa
  'PRICE_COMPARISON',   // So sánh giá so với thị trường
  'QUALITY_STANDARD',   // Tiêu chuẩn chất lượng
] as const;

export type CheckType = (typeof CHECK_TYPES)[number];

export const CHECK_STATUSES = ['PENDING', 'PASSED', 'FAILED', 'SKIPPED'] as const;
export type CheckStatus = (typeof CHECK_STATUSES)[number];

// ─── Create Vetting Request ────────────────────────────────────────────────────

export class CreateVettingRequestDto {
  @ApiProperty({ example: '325f187a-c1f6-4a4e-8692-234b6e50334a' })
  @IsUUID('4')
  @IsNotEmpty()
  supplierId!: string;

  @ApiPropertyOptional({ example: '325f187a-c1f6-4a4e-8692-234b6e50334b' })
  @IsUUID('4')
  @IsOptional()
  assignedToId?: string;

  @ApiPropertyOptional({ example: -15.5, description: 'Giá thấp hơn thị trường bao nhiêu % (âm = rẻ hơn)' })
  @IsNumber()
  @Min(-100)
  @Max(200)
  @IsOptional()
  priceVsMarket?: number;

  @ApiPropertyOptional({ example: 'Nhà cung cấp vật tư văn phòng Q2/2026' })
  @IsString()
  @IsOptional()
  notes?: string;
}

// ─── Update Checklist Item ─────────────────────────────────────────────────────

export class UpdateVettingCheckDto {
  @ApiProperty({ enum: CHECK_STATUSES })
  @IsEnum(CHECK_STATUSES)
  checkStatus!: CheckStatus;

  @ApiPropertyOptional({ example: 'https://storage.example.com/docs/gp-kinh-doanh.pdf' })
  @IsString()
  @IsOptional()
  fileUrl?: string;

  @ApiPropertyOptional({ example: 'Đã xác minh qua tổng cục thuế ngày 24/04/2026' })
  @IsString()
  @IsOptional()
  notes?: string;
}

// ─── Submit for Approval ──────────────────────────────────────────────────────

export class SubmitVettingDto {
  @ApiPropertyOptional({ example: 85.5 })
  @IsNumber()
  @Min(0)
  @Max(100)
  @IsOptional()
  overallScore?: number;

  @ApiPropertyOptional({ example: 'Nhà cung cấp đáp ứng đầy đủ tiêu chí pháp lý và giá tốt' })
  @IsString()
  @IsOptional()
  notes?: string;
}

// ─── Approve / Reject ─────────────────────────────────────────────────────────

export class ApproveVettingDto {
  @ApiProperty({ enum: ['APPROVED', 'CONDITIONAL'] })
  @IsEnum(['APPROVED', 'CONDITIONAL', 'PREFERRED'])
  supplierTier!: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  notes?: string;
}

export class RejectVettingDto {
  @ApiProperty({ example: 'Mã số thuế không hợp lệ, không có địa chỉ thực tế' })
  @IsString()
  @IsNotEmpty()
  rejectedReason!: string;
}
