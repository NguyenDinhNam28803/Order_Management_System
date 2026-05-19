import {
  IsString,
  IsOptional,
  IsArray,
  IsNumber,
  Min,
  Max,
  //IsEnum,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export type CompanySize = 'STARTUP' | 'SME' | 'ENTERPRISE';
export type SearchPriority =
  | 'PRICE'
  | 'DELIVERY_SPEED'
  | 'ISO_CERTIFIED'
  | 'EXPERIENCE';

export class DiscoverSupplierDto {
  @ApiProperty({
    description: 'Từ khóa tìm kiếm tự do',
    example: 'nhà cung cấp laptop văn phòng Hà Nội',
  })
  @IsString()
  query!: string;

  @ApiPropertyOptional({
    description: 'Danh mục sản phẩm (tên)',
    example: ['Thiết bị IT', 'Văn phòng phẩm'],
  })
  @IsOptional()
  @IsArray()
  categories?: string[];

  @ApiPropertyOptional({
    description: 'Sản phẩm cụ thể cần tìm',
    example: 'laptop Dell, máy in HP',
  })
  @IsOptional()
  @IsString()
  products?: string;

  @ApiPropertyOptional({
    description: 'Khu vực / tỉnh thành',
    example: 'Hà Nội',
  })
  @IsOptional()
  @IsString()
  location?: string;

  @ApiPropertyOptional({
    enum: ['STARTUP', 'SME', 'ENTERPRISE'],
    description: 'Quy mô công ty',
  })
  @IsOptional()
  @IsString()
  companySize?: CompanySize;

  @ApiPropertyOptional({
    description: 'Tiêu chí ưu tiên',
    example: ['PRICE', 'DELIVERY_SPEED'],
  })
  @IsOptional()
  @IsArray()
  priorities?: SearchPriority[];

  @ApiPropertyOptional({
    description: 'Loại trừ tên công ty',
    example: ['Công ty XYZ'],
  })
  @IsOptional()
  @IsArray()
  excludeNames?: string[];

  @ApiPropertyOptional({ description: 'Số kết quả tối đa', default: 10 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(20)
  limit?: number;
}

export class EnrichSupplierDto {
  @ApiProperty({ description: 'URL trang web nhà cung cấp' })
  @IsString()
  url!: string;

  @ApiPropertyOptional({ description: 'Snippet content từ web search' })
  @IsOptional()
  @IsString()
  content?: string;
}

export class ImportSupplierDto {
  @ApiProperty({ description: 'Tên công ty' })
  @IsString()
  name!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  email?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  website?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  province?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  industry?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  taxCode?: string;
}
