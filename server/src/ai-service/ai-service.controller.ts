import { Controller, Get, Query } from '@nestjs/common';
import { AiService } from './ai-service.service';
import { ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';

@ApiTags('AI Service')
@Controller('ai')
export class AiController {
  constructor(private readonly aiService: AiService) {}

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
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const answer = await this.aiService.askAiAboutDatabase(prompt);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    return { answer };
  }

  @Get('test')
  @ApiOperation({ summary: 'Test AI query' })
  async testAi() {
    return this.aiService.responsetest();
  }
}
