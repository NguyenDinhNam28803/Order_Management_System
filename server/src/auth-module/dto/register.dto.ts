import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MinLength,
} from 'class-validator';
import { UserRole } from '../../../generated/prisma';

export class RegisterDto {
  @ApiProperty({
    example: '325f187a-c1f6-4a4e-8692-234b6e50334a',
    description: 'ID của tổ chức',
  })
  @IsUUID('4', { message: 'ID tổ chức không hợp lệ' })
  @IsNotEmpty({ message: 'ID tổ chức là bắt buộc' })
  orgId: string;

  @ApiPropertyOptional({
    example: '85f0967a-c1f6-4a4e-8692-234b6e50334b',
    description: 'ID phòng ban',
  })
  @IsUUID('4', { message: 'ID phòng ban không hợp lệ' })
  @IsOptional()
  deptId?: string;

  @ApiProperty({
    example: 'john.doe@example.com',
    description: 'Email của người dùng',
  })
  @IsEmail({}, { message: 'Email không hợp lệ' })
  @IsNotEmpty({ message: 'Email không được để trống' })
  email: string;

  @ApiProperty({ example: 'John Doe', description: 'Họ và tên' })
  @IsString()
  @IsNotEmpty({ message: 'Họ và tên không được để trống' })
  fullName: string;

  @ApiPropertyOptional({ example: '0987654321', description: 'Số điện thoại' })
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiProperty({ example: 'password123', description: 'Mật khẩu' })
  @IsString()
  @IsNotEmpty({ message: 'Mật khẩu không được để trống' })
  @MinLength(6, { message: 'Mật khẩu phải có ít nhất 6 ký tự' })
  password: string;

  @ApiProperty({
    enum: UserRole,
    example: UserRole.REQUESTER,
    description: 'Vai trò người dùng',
  })
  @IsEnum(UserRole, { message: 'Vai trò không hợp lệ' })
  @IsNotEmpty({ message: 'Vai trò không được để trống' })
  role: UserRole;

  @ApiPropertyOptional({ example: 'DEV-001', description: 'Mã nhân viên' })
  @IsString()
  @IsOptional()
  employeeCode?: string;

  @ApiPropertyOptional({
    example: 'Software Engineer',
    description: 'Chức danh',
  })
  @IsString()
  @IsOptional()
  jobTitle?: string;
}
