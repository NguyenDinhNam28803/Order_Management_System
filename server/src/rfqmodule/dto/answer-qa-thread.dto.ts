import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsBoolean } from 'class-validator';

export class AnswerQaThreadDto {
  @ApiProperty({ description: 'Answer from the buyer' })
  @IsString()
  answer: string;

  @ApiProperty({
    description: 'Whether the question and answer should be public',
  })
  @IsBoolean()
  @IsOptional()
  isPublic?: boolean;
}
