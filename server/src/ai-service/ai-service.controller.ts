import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import {
  AiService,
  AiQuotationAnalysis,
  AiSupplierEvaluation,
  AiEmailAnalysis,
} from './ai-service.service';
import {
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
  ApiBearerAuth,
  ApiBody,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth-module/jwt-auth.guard';

@ApiTags('AI Service')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@Controller('ai')
export class AiController {
  constructor(private readonly aiService: AiService) {}

  /**
   * Hỏi AI về dữ liệu hệ thống bằng ngôn ngữ tự nhiên (Gemini tool-use)
   */
  @Get('ask')
  @ApiOperation({ summary: 'Hỏi AI về dữ liệu trong hệ thống (Gemini)' })
  @ApiQuery({
    name: 'prompt',
    description: 'Câu hỏi bằng tiếng Việt, ví dụ: Liệt kê 3 PO mới nhất',
  })
  @ApiResponse({ status: 200, description: 'Câu trả lời từ AI' })
  async askAi(@Query('prompt') prompt: string) {
    if (!prompt?.trim()) {
      throw new BadRequestException('Vui lòng cung cấp prompt');
    }
    const answer = await this.aiService.askAiAboutDatabase(prompt);
    return { answer };
  }

  /**
   * Phân tích và chấm điểm một báo giá RFQ bằng AI
   */
  @Post('analyze-quotation')
  @ApiOperation({ summary: 'AI chấm điểm báo giá (Quotation Scoring)' })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['rfqData', 'quotationData', 'supplierData'],
      properties: {
        rfqData: {
          type: 'object',
          description: 'Dữ liệu RFQ (items, requirements)',
        },
        quotationData: {
          type: 'object',
          description: 'Dữ liệu báo giá (totalPrice, items)',
        },
        supplierData: {
          type: 'object',
          description: 'Dữ liệu nhà cung cấp (name, tier)',
        },
      },
    },
  })
  @ApiResponse({ status: 200, description: 'Kết quả chấm điểm AI' })
  async analyzeQuotation(
    @Body()
    body: {
      rfqData: any;
      quotationData: any;
      supplierData: any;
    },
  ): Promise<AiQuotationAnalysis> {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const { rfqData, quotationData, supplierData } = body;
    if (!rfqData || !quotationData || !supplierData) {
      throw new BadRequestException(
        'rfqData, quotationData và supplierData là bắt buộc',
      );
    }
    return this.aiService.analyzeQuotation(
      rfqData,
      quotationData,
      supplierData,
    );
  }

  /**
   * Phân tích hiệu năng nhà cung cấp và đề xuất tier
   */
  @Post('analyze-supplier')
  @ApiOperation({ summary: 'AI đánh giá hiệu năng nhà cung cấp' })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['supplierData', 'performanceData'],
      properties: {
        supplierData: { type: 'object', description: 'Thông tin nhà cung cấp' },
        performanceData: {
          type: 'object',
          description: 'Dữ liệu KPI (OTD, chất lượng, giá cả)',
        },
      },
    },
  })
  @ApiResponse({ status: 200, description: 'Kết quả đánh giá AI' })
  async analyzeSupplier(
    @Body() body: { supplierData: any; performanceData: any },
  ): Promise<AiSupplierEvaluation> {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const { supplierData, performanceData } = body;
    if (!supplierData || !performanceData) {
      throw new BadRequestException(
        'supplierData và performanceData là bắt buộc',
      );
    }
    return this.aiService.analyzeSupplierPerformance(
      supplierData,
      performanceData,
    );
  }

  /**
   * Phân tích nội dung email và nhận dạng intent mua sắm
   */
  @Post('analyze-email')
  @ApiOperation({ summary: 'AI phân tích intent email mua sắm' })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['emailContent'],
      properties: {
        emailContent: {
          type: 'string',
          description: 'Nội dung email cần phân tích',
        },
      },
    },
  })
  @ApiResponse({ status: 200, description: 'Kết quả phân tích intent' })
  async analyzeEmail(
    @Body('emailContent') emailContent: string,
  ): Promise<AiEmailAnalysis> {
    if (!emailContent?.trim()) {
      throw new BadRequestException('emailContent là bắt buộc');
    }
    return this.aiService.analyzeEmailContent(emailContent);
  }
}
