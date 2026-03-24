import { ApiProperty } from '@nestjs/swagger';

export class ValidateTokenDto {
  @ApiProperty({ example: 'your-jwt-token-here' }) // Quan trọng: Để Swagger hiển thị field này
  token: string;
}
