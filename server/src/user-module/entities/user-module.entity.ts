import { UserRole, KycStatus } from '@prisma/client';
import { ApiProperty } from '@nestjs/swagger';

export class UserModule {
  @ApiProperty()
  id: string;

  @ApiProperty()
  orgId: string;

  @ApiProperty({ required: false })
  deptId?: string;

  @ApiProperty()
  email: string;

  @ApiProperty({ required: false })
  phone?: string;

  @ApiProperty()
  fullName: string;

  @ApiProperty({ required: false })
  avatarUrl?: string;

  @ApiProperty({ required: false })
  employeeCode?: string;

  @ApiProperty({ required: false })
  jobTitle?: string;

  @ApiProperty({ enum: UserRole })
  role: UserRole;

  @ApiProperty()
  isActive: boolean;

  @ApiProperty()
  isVerified: boolean;

  @ApiProperty({ required: false })
  lastLoginAt?: Date;

  @ApiProperty({ enum: KycStatus })
  kycStatus: KycStatus;

  @ApiProperty()
  trustScore: number;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}
