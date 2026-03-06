import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { UserRole } from '../../../generated/prisma';

export class UserResponseDto {
  @ApiProperty({ example: '325f187a-c1f6-4a4e-8692-234b6e50334a' })
  id: string;

  @ApiProperty({ example: 'user@example.com' })
  email: string;

  @ApiProperty({ example: 'John Doe' })
  fullName: string;

  @ApiProperty({ enum: UserRole })
  role: UserRole;

  @ApiProperty({ example: '325f187a-c1f6-4a4e-8692-234b6e50334a' })
  orgId: string;

  @ApiPropertyOptional({ example: '85f0967a-c1f6-4a4e-8692-234b6e50334b' })
  deptId?: string;

  @ApiPropertyOptional({ example: 'DEV-001' })
  employeeCode?: string;

  @ApiPropertyOptional({ example: 'Software Engineer' })
  jobTitle?: string;

  @ApiProperty({ example: true })
  isActive: boolean;

  @ApiProperty({ example: false })
  isVerified: boolean;
}

export class AuthResponseDto {
  @ApiProperty({ description: 'Thông tin người dùng' })
  user: UserResponseDto;

  @ApiProperty({ description: 'JWT Access Token' })
  accessToken: string;

  @ApiPropertyOptional({ description: 'JWT Refresh Token' })
  refreshToken?: string;
}
