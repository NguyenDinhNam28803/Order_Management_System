import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsJSON,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';

export class CreateAuditLogDto {
  @ApiProperty({ example: 'CREATE_PR' })
  @IsString()
  @IsNotEmpty()
  action: string;

  @ApiProperty({ example: 'PurchaseRequisition' })
  @IsString()
  @IsNotEmpty()
  entityType: string;

  @ApiProperty({ example: '325f187a-c1f6-4a4e-8692-234b6e50334a' })
  @IsUUID('4')
  @IsNotEmpty()
  entityId: string;

  @ApiPropertyOptional({ example: { status: 'DRAFT' } })
  @IsOptional()
  oldValue?: any;

  @ApiPropertyOptional({ example: { status: 'PENDING_APPROVAL' } })
  @IsOptional()
  newValue?: any;

  @ApiPropertyOptional({ example: '127.0.0.1' })
  @IsString()
  @IsOptional()
  ipAddress?: string;

  @ApiPropertyOptional({ example: 'Mozilla/5.0...' })
  @IsString()
  @IsOptional()
  userAgent?: string;

  @ApiPropertyOptional({ example: 'session-123' })
  @IsString()
  @IsOptional()
  sessionId?: string;
}
