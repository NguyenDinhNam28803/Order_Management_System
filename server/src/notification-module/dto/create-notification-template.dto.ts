import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { NotificationChannel } from '@prisma/client';

export class CreateNotificationTemplateDto {
  @ApiProperty({ example: 'PR_SUBMITTED' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  eventType: string;

  @ApiProperty({
    enum: NotificationChannel,
    example: NotificationChannel.EMAIL,
  })
  @IsEnum(NotificationChannel)
  @IsNotEmpty()
  channel: NotificationChannel;

  @ApiPropertyOptional({
    example: 'New Purchase Requisition Submitted: {{prNumber}}',
  })
  @IsString()
  @IsOptional()
  @MaxLength(255)
  subject?: string;

  @ApiProperty({
    example: 'Hello {{fullName}}, your PR #{{prNumber}} has been submitted.',
  })
  @IsString()
  @IsNotEmpty()
  bodyTemplate: string;

  @ApiPropertyOptional({ default: 2 })
  @IsNumber()
  @IsOptional()
  priority?: number;
}
