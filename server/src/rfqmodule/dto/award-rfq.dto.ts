import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsUUID } from 'class-validator';

export class AwardRfqDto {
  @ApiProperty({
    description: 'ID của bản báo giá được chọn để trao thầu',
    example: '325f187a-c1f6-4a4e-8692-234b6e50334a',
  })
  @IsUUID('4')
  @IsNotEmpty()
  quotationId: string;
}
