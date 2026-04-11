import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class GeneratePrDraftDto {
  @ApiProperty({
    example:
      'Tôi cần mua 5 laptop Dell XPS 15 cho team dev mới, ngân sách khoảng 75 triệu',
    description: 'Mô tả yêu cầu mua hàng của người dùng',
  })
  @IsString()
  @IsNotEmpty()
  prompt: string;

  @ApiPropertyOptional({
    example: '3b9c8e6e-...',
    description: 'ID tổ chức (tự động lấy từ token, không bắt buộc khi gửi)',
  })
  @IsOptional()
  @IsString()
  orgId?: string;
}

export interface PrDraftItem {
  lineNumber: number;
  productId?: string | null;
  productDesc: string;
  sku?: string | null;
  categoryId?: string | null;
  qty: number;
  unit: string;
  estimatedPrice: number;
  currency: string;
  specNote?: string | null;
  preferredSupplierId?: string | null;
  preferredSupplierName?: string | null;
}

export interface PrDraftResponse {
  success: boolean;
  title: string;
  description?: string;
  justification?: string;
  priority: number;
  requiredDate?: string;
  currency: string;
  totalEstimate: number;
  items: PrDraftItem[];
  suggestedCostCenterId?: string;
  suggestedCostCenterName?: string;
  confidence: number;
  reasoning: string;
  sources: {
    table: string;
    id: string;
    name: string;
    similarity: number;
  }[];
  error?: string;
}
