import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsUUID, IsOptional, IsBoolean } from 'class-validator';

export class CreateQaThreadDto {
  @ApiProperty({ description: 'RFQ ID' })
  @IsUUID()
  rfqId: string;

  @ApiProperty({ description: 'Supplier Organization ID' })
  @IsUUID()
  supplierId: string;

  @ApiProperty({ description: 'Question from supplier' })
  @IsString()
  question: string;

  @ApiProperty({
    description: 'Whether the question and answer should be public',
    default: false,
  })
  @IsBoolean()
  @IsOptional()
  isPublic?: boolean;
}
