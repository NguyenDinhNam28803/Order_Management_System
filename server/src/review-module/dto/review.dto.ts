import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Min,
  Max,
  IsBoolean,
} from 'class-validator';

export class CreateBuyerRatingDto {
  @ApiProperty({ example: '325f187a-c1f6-4a4e-8692-234b6e50334a' })
  @IsUUID('4')
  @IsNotEmpty()
  poId: string;

  @ApiProperty({ example: '325f187a-c1f6-4a4e-8692-234b6e50334a' })
  @IsUUID('4')
  @IsNotEmpty()
  supplierId: string;

  @ApiProperty({ example: 5, description: 'Điểm đúng hạn thanh toán (1-5)' })
  @IsInt()
  @Min(1)
  @Max(5)
  @IsNotEmpty()
  paymentTimelinessScore: number;

  @ApiProperty({ example: 5, description: 'Điểm rõ ràng đặc tính kỹ thuật (1-5)' })
  @IsInt()
  @Min(1)
  @Max(5)
  @IsNotEmpty()
  specClarityScore: number;

  @ApiProperty({ example: 5, description: 'Điểm giao tiếp (1-5)' })
  @IsInt()
  @Min(1)
  @Max(5)
  @IsNotEmpty()
  communicationScore: number;

  @ApiProperty({ example: 5, description: 'Điểm tuân thủ quy trình (1-5)' })
  @IsInt()
  @Min(1)
  @Max(5)
  @IsNotEmpty()
  processComplianceScore: number;

  @ApiProperty({ example: 5, description: 'Điểm công bằng tranh chấp (1-5)' })
  @IsInt()
  @Min(1)
  @Max(5)
  @IsNotEmpty()
  disputeFairnessScore: number;

  @ApiPropertyOptional({ example: 'Người mua rất chuyên nghiệp' })
  @IsString()
  @IsOptional()
  comment?: string;

  @ApiPropertyOptional({ example: true })
  @IsBoolean()
  @IsOptional()
  isAnonymous?: boolean;
}

export class CreateSupplierManualReviewDto {
  @ApiProperty({ example: '325f187a-c1f6-4a4e-8692-234b6e50334a' })
  @IsUUID('4')
  @IsNotEmpty()
  kpiScoreId: string;

  @ApiProperty({ example: '325f187a-c1f6-4a4e-8692-234b6e50334a' })
  @IsUUID('4')
  @IsNotEmpty()
  poId: string;

  @ApiProperty({ example: 5, description: 'Điểm đóng gói (1-5)' })
  @IsInt()
  @Min(1)
  @Max(5)
  @IsOptional()
  packagingScore?: number;

  @ApiProperty({ example: 5, description: 'Điểm dán nhãn (1-5)' })
  @IsInt()
  @Min(1)
  @Max(5)
  @IsOptional()
  labelingScore?: number;

  @ApiProperty({ example: 5, description: 'Điểm COA (1-5)' })
  @IsInt()
  @Min(1)
  @Max(5)
  @IsOptional()
  coaAccuracyScore?: number;

  @ApiProperty({ example: 5, description: 'Điểm giao tiếp (1-5)' })
  @IsInt()
  @Min(1)
  @Max(5)
  @IsOptional()
  communicationScore?: number;

  @ApiProperty({ example: 5, description: 'Điểm linh hoạt (1-5)' })
  @IsInt()
  @Min(1)
  @Max(5)
  @IsOptional()
  flexibilityScore?: number;

  @ApiProperty({ example: 5, description: 'Điểm tuân thủ (1-5)' })
  @IsInt()
  @Min(1)
  @Max(5)
  @IsOptional()
  complianceScore?: number;

  @ApiPropertyOptional({ example: 'Nhà cung cấp hỗ trợ rất tốt' })
  @IsString()
  @IsOptional()
  comment?: string;
}
