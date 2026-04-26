/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
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

export interface QuotationEmailExtract {
  rfqNumber?: string;
  quotationNumber?: string;
  totalPrice?: number;
  currency?: string;
  leadTimeDays?: number;
  validityDays?: number;
  paymentTerms?: string;
  deliveryTerms?: string;
  items?: Array<{
    description: string;
    qty: number;
    unitPrice: number;
    unit?: string;
  }>;
}

export interface PoConfirmationEmailExtract {
  poNumber?: string;
  estimatedDelivery?: string;
  notes?: string;
}

export interface ShippingEmailExtract {
  poNumber?: string;
  trackingNumber?: string;
  carrier?: string;
  shippedDate?: string;
  estimatedArrival?: string;
  notes?: string;
}

export interface InvoiceEmailExtract {
  poNumber?: string;
  invoiceNumber?: string;
  invoiceDate?: string;
  dueDate?: string;
  subtotal?: number;
  taxRate?: number;
  taxAmount?: number;
  totalAmount?: number;
  currency?: string;
  paymentTerms?: string;
  eInvoiceRef?: string;
  notes?: string;
}

export interface AiEmailAnalysis {
  intent:
    | 'QUOTATION'
    | 'PO_CONFIRMATION'
    | 'SHIPPING_NOTIFICATION'
    | 'INVOICE_SUBMISSION'
    | 'GENERAL_INQUIRY';
  data: QuotationEmailExtract | PoConfirmationEmailExtract | ShippingEmailExtract | InvoiceEmailExtract | Record<string, never>;
  confidence: number;
}

@Injectable()
export class AiService implements OnModuleInit {
  private readonly logger = new Logger(AiService.name);
  private client: GoogleGenAI;
  private aiEnabled = true;

  constructor(
    private configService: ConfigService,
    private prisma: PrismaService,
  ) {
    const apiKey = this.configService.get<string>('GEMINI_API_KEY');
    if (!apiKey) {
      this.logger.warn(
        'GEMINI_API_KEY is not set — AI features disabled. Set the key in .env to enable.',
      );
      this.aiEnabled = false;
      this.client = {} as GoogleGenAI;
    } else {
      this.client = new GoogleGenAI({ apiKey });
    }
  }

  private ensureAiEnabled(method: string): void {
    if (!this.aiEnabled) {
      throw new Error(`AI is disabled (GEMINI_API_KEY not set) — ${method} unavailable`);
    }
  }

  /** Retry wrapper: up to 3 attempts with 1s / 2s exponential backoff. */
  private async withRetry<T>(fn: () => Promise<T>, label: string): Promise<T> {
    const MAX_ATTEMPTS = 3;
    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
      try {
        return await fn();
      } catch (err: any) {
        if (attempt === MAX_ATTEMPTS) throw err;
        const delayMs = attempt * 1000;
        this.logger.warn(
          `${label} failed (attempt ${attempt}/${MAX_ATTEMPTS}), retrying in ${delayMs}ms: ${err.message}`,
        );
        await new Promise((res) => setTimeout(res, delayMs));
      }
    }
    throw new Error('unreachable');
  }
  /**
   * Phân tích nội dung email từ nhà cung cấp, xác định loại và trích xuất dữ liệu nghiệp vụ.
   */
  /**
   * Kiểm tra email có liên quan đến procurement không (dùng trong EmailFilterService).
   * Method riêng biệt, không dùng lại analyzeEmailContent để tránh double-wrapping prompt.
   */
  async filterEmailRelevance(
    subject: string,
    from: string,
    bodySnippet: string,
  ): Promise<{ relevant: boolean; confidence: number; reason: string }> {
    this.ensureAiEnabled('filterEmailRelevance');

    const prompt = `Bạn là bộ lọc email cho hệ thống quản lý mua hàng (OMS).

Phân tích email sau và cho biết có nên xử lý không:

Subject: ${subject}
From: ${from}
Body (200 ký tự đầu): ${bodySnippet.slice(0, 200)}

Hệ thống CHỈ xử lý các email liên quan đến:
- Yêu cầu mua hàng (Purchase Requisition)
- Đặt hàng, báo giá, hợp đồng với nhà cung cấp
- Phê duyệt / từ chối đơn hàng
- Thông báo giao hàng, hóa đơn

Trả lời JSON (KHÔNG markdown, KHÔNG giải thích):
{"relevant": true hoặc false, "reason": "lý do ngắn gọn dưới 20 từ", "confidence": 0.0-1.0}`;

    const result = await this.withRetry(
      () =>
        this.client.models.generateContent({
          model: 'gemini-2.0-flash-lite',
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
        }),
      'filterEmailRelevance',
    );

    const parsed = this.parseSpecificJson<{
      relevant: boolean;
      reason: string;
      confidence: number;
    }>(result.text ?? '');

    return {
      relevant: parsed.relevant ?? false,
      confidence: parsed.confidence ?? 0,
      reason: parsed.reason ?? '',
    };
  }

  async analyzeEmailContent(emailContent: string): Promise<AiEmailAnalysis> {
    this.ensureAiEnabled('analyzeEmailContent');
    const prompt = `Bạn là trợ lý phân tích email cho hệ thống quản lý mua hàng (OMS).
Phân tích email dưới đây và xác định intent, sau đó trích xuất dữ liệu tương ứng.

EMAIL:
"""
${emailContent}
"""

INTENT CÓ THỂ CÓ (chọn đúng 1):
- QUOTATION: Nhà cung cấp gửi báo giá / đề xuất giá cho RFQ
- PO_CONFIRMATION: Nhà cung cấp xác nhận đã nhận đơn đặt hàng (PO)
- SHIPPING_NOTIFICATION: Nhà cung cấp thông báo đã xuất kho / đang vận chuyển
- INVOICE_SUBMISSION: Nhà cung cấp gửi hoá đơn đề nghị thanh toán
- GENERAL_INQUIRY: Email hỏi thông tin, không thuộc 4 loại trên

TRẢ VỀ JSON THUẦN TÚY (không markdown, không giải thích):

Nếu intent = QUOTATION:
{"intent":"QUOTATION","confidence":0.0-1.0,"data":{"rfqNumber":"RFQ-XXXX hoặc null","quotationNumber":"số báo giá hoặc null","totalPrice":số hoặc null,"currency":"VND/USD/...","leadTimeDays":số ngày hoặc null,"validityDays":số ngày hoặc null,"paymentTerms":"điều khoản thanh toán hoặc null","deliveryTerms":"điều khoản giao hàng hoặc null","items":[{"description":"tên hàng","qty":số,"unitPrice":đơn giá,"unit":"cái/kg/..."}]}}

Nếu intent = PO_CONFIRMATION:
{"intent":"PO_CONFIRMATION","confidence":0.0-1.0,"data":{"poNumber":"PO-XXXX hoặc null","estimatedDelivery":"ngày dự kiến hoặc null","notes":"ghi chú hoặc null"}}

Nếu intent = SHIPPING_NOTIFICATION:
{"intent":"SHIPPING_NOTIFICATION","confidence":0.0-1.0,"data":{"poNumber":"PO-XXXX hoặc null","trackingNumber":"mã vận đơn hoặc null","carrier":"đơn vị vận chuyển hoặc null","shippedDate":"ngày xuất kho hoặc null","estimatedArrival":"ngày dự kiến đến hoặc null","notes":"ghi chú hoặc null"}}

Nếu intent = INVOICE_SUBMISSION:
{"intent":"INVOICE_SUBMISSION","confidence":0.0-1.0,"data":{"poNumber":"PO-XXXX hoặc null","invoiceNumber":"số hoá đơn hoặc null","invoiceDate":"ngày hoặc null","dueDate":"hạn thanh toán hoặc null","subtotal":số hoặc null,"taxRate":phần trăm hoặc null,"taxAmount":số hoặc null,"totalAmount":tổng tiền hoặc null,"currency":"VND/USD","paymentTerms":"điều khoản hoặc null","eInvoiceRef":"mã hoá đơn điện tử hoặc null","notes":"ghi chú hoặc null"}}

Nếu intent = GENERAL_INQUIRY:
{"intent":"GENERAL_INQUIRY","confidence":0.0-1.0,"data":{}}

Lưu ý:
- Trả về null cho trường không tìm thấy trong email, không bịa đặt
- confidence phản ánh mức chắc chắn về intent (0.0 = không chắc, 1.0 = chắc chắn)
- Ưu tiên phân tích tiếng Việt và tiếng Anh`;

    const result = await this.withRetry(
      () =>
        this.client.models.generateContent({
          model: 'gemini-2.0-flash-lite',
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
        }),
      'analyzeEmailContent',
    );

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
    this.ensureAiEnabled('analyzeQuotation');
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

    const result = await this.withRetry(
      () =>
        this.client.models.generateContent({
          model: 'gemini-2.0-flash-lite',
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
        }),
      'analyzeQuotation',
    );

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

    if ((hasPriceIssue || hasManyCons) && parsed.score > 3) {
      this.logger.warn(
        `Score ${parsed.score} capped to 3 for problematic quotation`,
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
    this.ensureAiEnabled('analyzeSupplierPerformance');
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

    const result = await this.withRetry(
      () =>
        this.client.models.generateContent({
          model: 'gemini-2.0-flash-lite',
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
        }),
      'analyzeSupplierPerformance',
    );

    return this.parseSpecificJson<AiSupplierEvaluation>(result.text ?? '');
  }

  /**
   * Phương thức chính để AI tương tác với database qua Prisma (Full logic)
   */
  async askAiAboutDatabase(userPrompt: string): Promise<AiDatabaseResponse> {
    if (!this.aiEnabled) {
      return { success: false, summary: 'AI disabled (GEMINI_API_KEY not set)', data: [], total: 0 };
    }
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

      let response = await this.withRetry(
        () =>
          this.client.models.generateContent({
            model: 'gemini-2.0-flash-lite',
            config: {
              systemInstruction: { parts: [{ text: systemInstruction }] },
              thinkingConfig: { thinkingLevel: ThinkingLevel.HIGH },
              tools: tools,
            },
            contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
          }),
        'askAiAboutDatabase',
      );

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
        response = await this.withRetry(
          () =>
            this.client.models.generateContent({
              model: 'gemini-2.0-flash-lite',
              config: { tools: tools },
              contents: chatHistory,
            }),
          'askAiAboutDatabase:toolLoop',
        );
      }

      return this.parseSpecificJson<AiDatabaseResponse>(response.text ?? '');
    } catch (error: any) {
      this.logger.error(`askAiAboutDatabase failed: ${error.message}`);
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
    } catch (error: any) {
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
      } catch (parseErr: any) {
        this.logger.error(
          `AI response parse failed (${parseErr.message}): "${text.slice(0, 300)}"`,
        );
        // Throw instead of returning an empty object to surface failures early
        throw new Error(`AI returned unparseable response: ${parseErr.message}`);
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
