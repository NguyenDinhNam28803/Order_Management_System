import { IsString, IsOptional, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateAdminModuleDto {
  @ApiProperty({
    description: 'Hành động được ghi nhận',
    example: 'MANUAL_OVERRIDE',
  })
  @IsString()
  action: string;

  @ApiProperty({
    description: 'Loại đối tượng bị tác động',
    example: 'PurchaseOrder',
  })
  @IsString()
  entityType: string;

  @ApiProperty({ description: 'ID của đối tượng bị tác động' })
  @IsUUID()
  entityId: string;

  @ApiProperty({ required: false, description: 'ID tổ chức liên quan' })
  @IsOptional()
  @IsUUID()
  orgId?: string;

  @ApiProperty({ required: false, description: 'Ghi chú bổ sung' })
  @IsOptional()
  @IsString()
  note?: string;
}
