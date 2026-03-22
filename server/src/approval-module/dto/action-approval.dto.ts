import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';

export enum ApprovalAction {
  APPROVE = 'APPROVE',
  REJECT = 'REJECT',
}

export class ActionApprovalDto {
  @ApiProperty({
    description: 'Hành động thực hiện',
    enum: ApprovalAction,
  })
  @IsEnum(ApprovalAction)
  action: ApprovalAction;

  @ApiPropertyOptional({
    description: 'Nhận xét về quyết định',
  })
  @IsOptional()
  @IsString()
  comment?: string;
}
