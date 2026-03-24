import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import { RfqStatus } from '@prisma/client';

export class UpdateRfqStatusDto {
  @ApiProperty({
    description: 'New RFQ status',
    enum: RfqStatus,
  })
  @IsEnum(RfqStatus)
  status: RfqStatus;
}
