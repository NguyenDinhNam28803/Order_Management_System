import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDate,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';

export class CreateGrnItemDto {
  @ApiProperty({
    description:
      'ID của dòng sản phẩm trong đơn hàng (Purchase Order Item ID) mà bạn muốn nhận.',
    example: '325f187a-c1f6-4a4e-8692-234b6e50334a',
  })
  @IsUUID('4')
  @IsNotEmpty()
  poItemId: string;

  @ApiProperty({
    description: 'Số lượng hàng hóa thực tế nhận được tại kho.',
    example: 100,
  })
  @IsNumber()
  @Min(0)
  @IsNotEmpty()
  receivedQty: number;

  @ApiPropertyOptional({
    description:
      'Số lô sản xuất của nhà cung cấp (dùng để truy xuất nguồn gốc).',
    example: 'BATCH-001',
  })
  @IsString()
  @IsOptional()
  batchNumber?: string;

  @ApiPropertyOptional({
    description: 'Hạn sử dụng của lô hàng (nếu có).',
    example: '2027-01-01T00:00:00Z',
  })
  @Transform(({ value }) => (value === '' ? undefined : value))
  @Type(() => Date)
  @IsDate()
  @IsOptional()
  expiryDate?: Date;

  @ApiPropertyOptional({
    description: 'Vị trí lưu kho cụ thể (Kệ, dãy, tầng, khoang...).',
    example: 'Shelf A-1',
  })
  @IsString()
  @IsOptional()
  storageLocation?: string;
}
