import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { ApiOperation } from '@nestjs/swagger/dist/decorators/api-operation.decorator';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  /**
   * Kiểm tra trạng thái hoạt động của ứng dụng (Health check)
   * @returns Chuỗi chào mừng từ hệ thống
   */
  @Get()
  @ApiOperation({
    summary: 'Kiểm tra trạng thái hoạt động của ứng dụng',
    description:
      'Trả về một chuỗi chào mừng để xác nhận rằng API đang hoạt động bình thường',
  })
  getHello(): string {
    return this.appService.getHello();
  }
}
