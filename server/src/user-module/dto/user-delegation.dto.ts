import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsDateString, IsEnum, IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';
import { UserRole } from '@prisma/client';

export class CreateUserDelegationDto {
  @ApiProperty({ description: 'ID người được ủy quyền' })
  @IsUUID()
  @IsNotEmpty()
  delegateId: string;

  @ApiProperty({ description: 'Vai trò ủy quyền', enum: UserRole })
  @IsEnum(UserRole)
  @IsNotEmpty()
  role: UserRole;

  @ApiPropertyOptional({ description: 'Phạm vi ủy quyền (ví dụ: PR_ONLY, ALL)' })
  @IsOptional()
  @IsString()
  scope?: string;

  @ApiProperty({ description: 'Ngày bắt đầu có hiệu lực' })
  @IsDateString()
  @IsNotEmpty()
  validFrom: string;

  @ApiProperty({ description: 'Ngày kết thúc hiệu lực' })
  @IsDateString()
  @IsNotEmpty()
  validUntil: string;

  @ApiPropertyOptional({ description: 'Lý do ủy quyền' })
  @IsOptional()
  @IsString()
  reason?: string;
}

export class UpdateUserDelegationDto {
  @ApiPropertyOptional({ description: 'Trạng thái hoạt động' })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
