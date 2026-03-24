import { ApiProperty } from '@nestjs/swagger';

export class SmartSearchDto {
  @ApiProperty({
    description: 'Nội dung tìm kiếm thông minh',
    example: 'Tôi muốn tìm máy in văn phòng giá rẻ',
  })
  query: string;
}
