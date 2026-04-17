/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenAI, ThinkingLevel } from '@google/genai';
import { PrismaService } from '../prisma/prisma.service';

// --- INTERFACES ---
export interface AiDatabaseResponse<T = unknown> {
  length?: number;
  cons?: string[];
  score?: number;
  success: boolean;
  summary: string;
  data: T[];
  total: number;
  message?: string;
}

export interface AiSupplierEvaluation {
  overallScore: number;
  otdScore: number;
  qualityScore: number;
  priceScore: number;
  tierRecommendation: string;
  analysis: string;
  improvementPlan: string;
  pros: string[];
  cons: string[];
}

export interface AiQuotationAnalysis {
  score: number;
  assessment: string;
  pros: string[];
  cons: string[];
  recommendation: 'RECOMMEND' | 'CONSIDER' | 'REJECT';
}

/** Dữ liệu trích xuất từ email báo giá nhà cung cấp */
export interface QuotationEmailData {
  rfqNumber?: string; // Mã RFQ được đề cập trong email
  quotationNumber?: string; // Mã báo giá của NCC
  totalPrice?: number;
  currency?: string; // VND | USD | EUR
  leadTimeDays?: number;
  validityDays?: number;
  paymentTerms?: string;
  items?: {
    description: string;
    qty: number;
    unitPrice: number;
  }[];
  notes?: string;
}

/** Dữ liệu trích xuất từ email xác nhận PO */
export interface PoConfirmationEmailData {
  poNumber?: string; // Mã PO được xác nhận
  confirmedDate?: string; // ISO date string
  estimatedDelivery?: string; // ISO date string
  notes?: string;
}

/** Dữ liệu trích xuất từ email thông báo giao hàng */
export interface ShippingNotificationEmailData {
  poNumber?: string; // Mã PO liên quan
  trackingNumber?: string;
  carrier?: string; // Đơn vị vận chuyển
  shippedDate?: string; // ISO date string
  estimatedArrival?: string; // ISO date string
  notes?: string;
}

export type SupplierEmailIntent =
  | 'QUOTATION' // NCC gửi báo giá
  | 'PO_CONFIRMATION' // NCC xác nhận đã nhận / đồng ý PO
  | 'SHIPPING_NOTIFICATION' // NCC thông báo đang giao hàng
  | 'GENERAL_INQUIRY'; // Không thuộc 3 loại trên

export interface AiEmailAnalysis {
  intent: SupplierEmailIntent;
  data:
    | QuotationEmailData
    | PoConfirmationEmailData
    | ShippingNotificationEmailData
    | Record<string, unknown>;
  confidence: number;
}

@Injectable()
export class AiService implements OnModuleInit {
  // ... (giữ nguyên constructor và các method khác)
  private client: GoogleGenAI;

  constructor(
    private configService: ConfigService,
    private prisma: PrismaService,
  ) {
    const apiKey = this.configService.get<string>('GEMINI_API_KEY');
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY is not defined in environment variables');
    }
    this.client = new GoogleGenAI({
      apiKey: apiKey,
    });
  }
  /**
   * Phân tích email từ nhà cung cấp và phân loại vào 3 intent chính:
   * QUOTATION | PO_CONFIRMATION | SHIPPING_NOTIFICATION | GENERAL_INQUIRY
   */
  async analyzeEmailContent(emailContent: string): Promise<AiEmailAnalysis> {
    const prompt = `Bạn là AI phân tích email trong hệ thống quản lý mua hàng B2B (ERP).
Nhiệm vụ: xác định email này từ nhà cung cấp thuộc loại nào, và trích xuất dữ liệu cấu trúc.

EMAIL CẦN PHÂN TÍCH:
${emailContent}

CÁC LOẠI EMAIL (intent):
1. QUOTATION — Nhà cung cấp gửi báo giá / đề xuất giá cho RFQ / yêu cầu mua hàng
   Dấu hiệu: có bảng giá, đơn giá, tổng tiền, thời gian giao hàng, điều khoản thanh toán
   data cần trích: rfqNumber, quotationNumber, totalPrice, currency, leadTimeDays, validityDays, paymentTerms, items[{description,qty,unitPrice}]

2. PO_CONFIRMATION — Nhà cung cấp xác nhận đã nhận và đồng ý thực hiện đơn hàng (PO)
   Dấu hiệu: đề cập số PO, xác nhận đơn hàng, thông báo đồng ý, ước tính ngày giao
   data cần trích: poNumber, confirmedDate, estimatedDelivery, notes

3. SHIPPING_NOTIFICATION — Nhà cung cấp thông báo đã xuất kho / đang giao hàng
   Dấu hiệu: mã vận đơn, tracking number, tên hãng vận chuyển, ngày dự kiến đến
   data cần trích: poNumber, trackingNumber, carrier, shippedDate, estimatedArrival, notes

4. GENERAL_INQUIRY — Không thuộc 3 loại trên (hỏi thông tin, khiếu nại, khác)

LUẬT QUAN TRỌNG:
- Chỉ trả về JSON thuần, KHÔNG markdown, KHÔNG giải thích
- confidence: 0.0-1.0 (mức độ chắc chắn về intent)
- Nếu không tìm thấy giá trị cho một field → dùng null
- Số tiền luôn là number (không có dấu phẩy, không có ký hiệu tiền tệ)
- Ngày giờ luôn là ISO 8601 string hoặc null

TRẢ VỀ JSON:
{
  "intent": "QUOTATION" | "PO_CONFIRMATION" | "SHIPPING_NOTIFICATION" | "GENERAL_INQUIRY",
  "confidence": number,
  "data": { ... (theo loại intent tương ứng ở trên) }
}`;

    const result = await this.client.models.generateContent({
      model: 'gemini-3.1-flash-lite-preview',
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
    });

    return this.parseSpecificJson<AiEmailAnalysis>(result.text ?? '');
  }

  async onModuleInit() {
    await this.listModels();
  }

  /**
   * Phân tích và chấm điểm báo giá dựa trên yêu cầu của RFQ
   */
  async analyzeQuotation(
    rfqData: any,
    quotationData: any,
    supplierData: any,
  ): Promise<AiQuotationAnalysis> {
    const prompt = `
      Đóng vai một chuyên gia mua sắm (Procurement Expert). Hãy phân tích báo giá sau:
      1. YÊU CẦU (RFQ): ${JSON.stringify(rfqData.items)}
      2. BÁO GIÁ (Quotation): ${quotationData.totalPrice}
      3. NHÀ CUNG CẤP: ${supplierData.name}

      TRẢ VỀ ĐỊNH DẠNG JSON DUY NHẤT:
      {
        "score": number,
        "assessment": "string",
        "pros": ["string"],
        "cons": ["string"],
        "recommendation": "RECOMMEND" | "CONSIDER" | "REJECT"
      }
    `;

    const result = await this.client.models.generateContent({
      model: 'gemini-3.1-flash-lite-preview',
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
    });

    const parsed = this.parseSpecificJson<AiQuotationAnalysis>(
      result.text ?? '',
    );

    // VALIDATION: Ensure score matches assessment
    // If assessment indicates major issues (unreasonable price, fraud suspicion), cap the score
    const assessmentLower = parsed.assessment?.toLowerCase() || '';
    const hasPriceIssue =
      assessmentLower.includes('vô lý') ||
      assessmentLower.includes('quá cao') ||
      assessmentLower.includes('gian lận') ||
      assessmentLower.includes('không hợp lý') ||
      assessmentLower.includes('vượt xa giá trị');

    const hasManyCons =
      parsed.cons &&
      parsed.cons.length > 0 &&
      parsed.cons.length >= (parsed.pros?.length || 0);

    // If there are significant issues, ensure score doesn't exceed 3
    if ((hasPriceIssue || hasManyCons) && parsed.score > 3) {
      console.warn(
        `[AI Validation] Score ${parsed.score} too high for problematic quotation. Capping to 3.`,
      );
      parsed.score = 3;
    }

    return parsed;
  }

  /**
   * Phân tích hiệu năng nhà cung cấp
   */
  async analyzeSupplierPerformance(
    supplierData: any,
    performanceData: any,
  ): Promise<AiSupplierEvaluation> {
    const prompt = `
      Đóng vai chuyên gia Quản lý Nhà cung cấp. Phân tích hiệu năng: ${supplierData.name}. 
      Dữ liệu hiệu năng: ${JSON.stringify(performanceData)}.
      
      TRẢ VỀ ĐỊNH DẠNG JSON DUY NHẤT:
      {
        "overallScore": number,
        "otdScore": number,
        "qualityScore": number,
        "priceScore": number,
        "tierRecommendation": "STRATEGIC" | "PREFERRED" | "APPROVED" | "CONDITIONAL" | "DISQUALIFIED",
        "analysis": "string",
        "improvementPlan": "string",
        "pros": ["string"],
        "cons": ["string"]
      }
    `;

    const result = await this.client.models.generateContent({
      model: 'gemini-3.1-flash-lite-preview',
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
    });

    return this.parseSpecificJson<AiSupplierEvaluation>(result.text ?? '');
  }

  /**
   * Phương thức chính để AI tương tác với database qua Prisma (Full logic)
   */
  async askAiAboutDatabase(userPrompt: string): Promise<AiDatabaseResponse> {
    try {
      const systemInstruction = `
        # ROLE: Bạn là Giám đốc Sách lược Mua sắm (CPO).
        # CONTEXT: Bạn có quyền truy cập vào database qua 'query_database'.
        # MODELS: organization, purchaseRequisition, purchaseOrder, rfqRequest, supplierKpiScore.
        # OUTPUT: Phải trả về JSON đúng cấu trúc AiDatabaseResponse.
      `;

      const tools: any = [
        {
          functionDeclarations: [
            {
              name: 'query_database',
              description: 'Truy vấn dữ liệu từ database thông qua Prisma.',
              parameters: {
                type: 'OBJECT',
                properties: {
                  modelName: { type: 'STRING' },
                  action: { type: 'STRING' },
                  queryArgs: { type: 'OBJECT' },
                },
                required: ['modelName', 'action'],
              },
            },
          ],
        },
      ];

      let response = await this.client.models.generateContent({
        model: 'gemini-3.1-flash-lite-preview',
        config: {
          systemInstruction: { parts: [{ text: systemInstruction }] },
          thinkingConfig: { thinkingLevel: ThinkingLevel.HIGH },
          tools: tools,
        },
        contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
      });

      const chatHistory: any[] = [
        { role: 'user', parts: [{ text: userPrompt }] },
      ];

      while (
        response.candidates?.[0]?.content?.parts?.some(
          (part) => part.functionCall,
        )
      ) {
        const parts = response.candidates[0].content.parts;
        chatHistory.push({ role: 'model', parts: parts });

        const functionResponses: any[] = [];
        for (const part of parts) {
          if (part.functionCall) {
            const { name, args } = part.functionCall;
            if (name === 'query_database') {
              const { modelName, action, queryArgs } = args as any;
              const data = await this.executePrismaQuery(
                // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
                modelName,
                // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
                action,
                queryArgs,
              );
              functionResponses.push({
                functionResponse: {
                  name: 'query_database',
                  response: { content: data },
                },
              });
            }
          }
        }

        chatHistory.push({ role: 'function', parts: functionResponses });
        response = await this.client.models.generateContent({
          model: 'gemini-3.1-flash-lite-preview',
          config: { tools: tools },
          contents: chatHistory,
        });
      }

      return this.parseSpecificJson<AiDatabaseResponse>(response.text ?? '');
    } catch (error) {
      console.error('Error in askAiAboutDatabase:', error);
      return {
        success: false,
        summary: 'Lỗi hệ thống AI.',
        data: [],
        total: 0,
        message: error.message,
      };
    }
  }

  private async executePrismaQuery(
    modelName: string,
    action: string,
    queryArgs: any,
  ) {
    try {
      const model = (this.prisma as any)[modelName];
      if (!model || typeof model[action] !== 'function') {
        return { error: `Model hoặc Action không hợp lệ.` };
      }
      const args = queryArgs || {};
      if (
        (action === 'findMany' || action === 'findFirst') &&
        (!args.take || args.take > 10)
      ) {
        args.take = 10;
      }
      const result = await model[action](args);
      return JSON.parse(
        JSON.stringify(result, (_, v) =>
          typeof v === 'bigint' ? v.toString() : v,
        ),
      );
    } catch (error) {
      return { error: error.message };
    }
  }

  private parseSpecificJson<T>(text: string): T {
    // 1. Thử tìm JSON trong các khối code block markdown
    const match = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    let cleaned = match ? match[1].trim() : text.trim();

    try {
      return JSON.parse(cleaned) as T;
    } catch {
      // 2. Nếu parse thất bại, thử tìm JSON object bằng cách tìm dấu { và }
      const start = cleaned.indexOf('{');
      const end = cleaned.lastIndexOf('}');
      if (start !== -1 && end !== -1 && end > start) {
        cleaned = cleaned.substring(start, end + 1);
      }
      try {
        return JSON.parse(cleaned) as T;
      } catch {
        // Trả về object rỗng nếu không parse được thay vì throw để app không crash
        console.error('AI response parse failed:', text);
        return {} as T;
      }
    }
  }

  async getCompanySuggestion(items: any[]) {
    const itemDescriptions = items
      .map((i) => i.productDesc || 'Sản phẩm')
      .join(', ');
    const userPrompt = `Gợi ý nhà cung cấp cho: [${itemDescriptions}]`;
    return this.askAiAboutDatabase(userPrompt);
  }

  async listModels() {
    try {
      return await this.client.models.list();
    } catch {
      return [];
    }
  }
}
