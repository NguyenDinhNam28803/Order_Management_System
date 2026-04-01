import { ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import {
  CreateInvoiceModuleDto,
  CreateInvoiceItemDto,
} from './create-invoice-module.dto';
import { IsArray, IsOptional, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateInvoiceModuleDto extends PartialType(
  CreateInvoiceModuleDto,
) {
  // PartialType đã tự động làm tất cả các trường từ CreateInvoiceModuleDto thành optional.
  // Tuy nhiên, nếu bạn muốn ghi đè hoặc thêm trường cụ thể, bạn có thể định nghĩa tại đây.

  @ApiPropertyOptional({ type: [CreateInvoiceItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateInvoiceItemDto)
  @IsOptional()
  items?: CreateInvoiceItemDto[];
}
