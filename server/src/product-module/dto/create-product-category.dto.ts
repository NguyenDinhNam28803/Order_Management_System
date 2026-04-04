import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';

export class CreateProductCategoryDto {
  @ApiPropertyOptional({ example: '325f187a-c1f6-4a4e-8692-234b6e50334a' })
  @IsUUID('4')
  @IsOptional()
  orgId?: string;

  @ApiPropertyOptional({ example: '325f187a-c1f6-4a4e-8692-234b6e50334b' })
  @IsUUID('4')
  @IsOptional()
  parentId?: string;

  @ApiProperty({ example: 'CAT-001' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(30)
  code!: string;

  @ApiProperty({ example: 'Electronics' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  name!: string;

  @ApiPropertyOptional({ example: 'Category for electronic devices' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ default: true })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
