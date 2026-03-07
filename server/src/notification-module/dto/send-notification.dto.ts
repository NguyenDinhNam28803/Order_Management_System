import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';

export class SendNotificationDto {
  @ApiProperty({ example: '325f187a-c1f6-4a4e-8692-234b6e50334a' })
  @IsUUID('4')
  @IsNotEmpty()
  recipientId: string;

  @ApiProperty({ example: 'PR_SUBMITTED' })
  @IsString()
  @IsNotEmpty()
  eventType: string;

  @ApiProperty({
    example: { prNumber: 'PR-2026-001', fullName: 'Nguyen Van A' },
  })
  @IsObject()
  @IsNotEmpty()
  data: Record<string, any>;

  @ApiPropertyOptional({ example: 'PURCHASE_REQUISITION' })
  @IsString()
  @IsOptional()
  referenceType?: string;

  @ApiPropertyOptional({ example: '325f187a-c1f6-4a4e-8692-234b6e50334b' })
  @IsUUID('4')
  @IsOptional()
  referenceId?: string;
}
