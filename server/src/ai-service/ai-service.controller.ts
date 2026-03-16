import { Controller, Get, Query } from '@nestjs/common';
import { AiService } from './ai-service.service';
import { ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';

@ApiTags('AI Service')
@Controller('ai')
export class AiController {
  constructor(private readonly aiService: AiService) {}

  /**
   * Gửi câu hỏi cho AI để truy vấn thông tin từ cơ sở dữ liệu
   * @param prompt Câu hỏi từ người dùng
   * @returns Câu trả lời từ AI dựa trên dữ liệu hệ thống
   */
  @Get('ask')
  @ApiOperation({ summary: 'Hỏi AI về dữ liệu trong hệ thống' })
  @ApiQuery({
    name: 'prompt',
    description: 'Câu hỏi của bạn (ví dụ: Liệt kê 3 đơn hàng mới nhất)',
  })
  @ApiResponse({ status: 200, description: 'Câu trả lời từ AI' })
  async askAi(@Query('prompt') prompt: string) {
    if (!prompt) {
      return { message: 'Vui lòng cung cấp prompt' };
    }
    const answer = await this.aiService.askAiAboutDatabase(prompt);
    return { answer };
  }

  /**
   * Kiểm tra khả năng kết nối và phản hồi của dịch vụ AI
   * @returns Kết quả test AI query
   */
  @Get('test')
  @ApiOperation({ summary: 'Test AI query' })
  async testAi() {
    return this.aiService.responsetest();
  }
}
