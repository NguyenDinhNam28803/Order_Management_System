import { IsNumber, IsBoolean, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ProcessAutomationDto {
  @ApiProperty({ description: 'Ngưỡng giá tối thiểu để tạo hợp đồng (VND)', default: 50000000 })
  @IsNumber()
  @IsOptional()
  contractThreshold?: number = 50000000;

  @ApiProperty({ description: 'Số ngày hiệu lực hợp đồng mặc định', default: 365 })
  @IsNumber()
  @IsOptional()
  defaultContractDays?: number = 365;

  @ApiProperty({ description: 'Tự động gửi email cho nhà cung cấp', default: true })
  @IsBoolean()
  @IsOptional()
  autoSendEmail?: boolean = true;
}
