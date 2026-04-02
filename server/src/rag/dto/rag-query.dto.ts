import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class QueryRequiredDto {
  @ApiProperty({
    example: 'PR và PO khác nhau như thế nào?',
    description: 'Câu hỏi gửi vào RAG',
  })
  @IsString()
  question: string;

  @ApiPropertyOptional({
    example: 5,
    default: 5,
    description: 'Số lượng document retrieve',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  topK?: number;
}
