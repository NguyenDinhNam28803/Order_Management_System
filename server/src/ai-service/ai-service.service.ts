/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenAI, ThinkingLevel } from '@google/genai';

import { PrismaService } from '../prisma/prisma.service';

export interface AiDatabaseResponse<T = unknown> {
  cons: any;
  score: number;
  success: boolean;
  summary: string;
  data: T[];
  total: number;
  message?: string;
}
@Injectable()
export class AiService implements OnModuleInit {
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

  async onModuleInit() {
    await this.listModels();
    // await this.responsetest();
  }

  /**
   * Phân tích và chấm điểm báo giá dựa trên yêu cầu của RFQ
   */
  async analyzeQuotation(rfqData: any, quotationData: any, supplierData: any) {
    const prompt = `
      Đóng vai một chuyên gia mua sắm (Procurement Expert). Hãy phân tích báo giá sau:

      1. YÊU CẦU (RFQ):
      - Mặt hàng: ${JSON.stringify(rfqData.items)}
      - Tổng ngân sách dự kiến: ${rfqData.totalEstimate || 'Không rõ'}
      - Hạn chót cần hàng: ${rfqData.deadline}

      2. BÁO GIÁ CỦA NHÀ CUNG CẤP (Quotation):
      - Tổng tiền: ${quotationData.totalPrice}
      - Thời gian giao hàng: ${quotationData.leadTimeDays} ngày
      - Điều khoản thanh toán: ${quotationData.paymentTerms}

      3. THÔNG TIN NHÀ CUNG CẤP:
      - Tên: ${supplierData.name}
      - Điểm tin cậy (Trust Score): ${supplierData.trustScore}/100
      - Xếp hạng: ${supplierData.tier}

      NHIỆM VỤ:
      Hãy đánh giá báo giá này trên thang điểm 100 dựa trên các tiêu chí: Giá cả (40%), Thời gian (30%), Uy tín (30%).
      
      TRẢ VỀ ĐỊNH DẠNG JSON DUY NHẤT (Không markdown):
      {
        "score": number, // Điểm số 0-100
        "assessment": "Nhận xét tổng quan ngắn gọn",
        "pros": ["Điểm mạnh 1", "Điểm mạnh 2"],
        "cons": ["Rủi ro/Điểm yếu 1"],
        "recommendation": "RECOMMEND" | "CONSIDER" | "REJECT"
      }
    `;

    // Gọi Gemini (không dùng function calling, chỉ text generation thuần túy để nhanh hơn)
    const result = await this.client.models.generateContent({
      model: 'gemini-2.0-flash', // Model nhanh và rẻ cho task phân tích text
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
    });

    const responseText = result.text;
    return this.parseJsonResponse(responseText ?? ''); // Tận dụng hàm parse có sẵn
  }

  /**
   * Phương thức chính để AI tương tác với database qua Prisma
   */
  async askAiAboutDatabase(userPrompt: string) {
    try {
      // Hướng dẫn chi tiết cho AI về cách sử dụng công cụ và cấu trúc database
      const systemInstruction = `
        # ROLE
        Bạn là Giám đốc Sách lược Mua sắm (Chief Procurement Officer - CPO) tại hệ thống OMS này. Mục tiêu của bạn là tối ưu hóa chi phí, giảm thiểu rủi ro chuỗi cung ứng và đảm bảo tính minh bạch.

        # CONTEXT
        Bạn có quyền truy cập vào database của hệ thống thông qua công cụ 'query_database'.
        Cấu trúc database (Prisma models):
        - organization: Thông tin công ty, nhà cung cấp, khách hàng.
        - user: Người dùng.
        - purchaseRequisition (PR): Yêu cầu mua hàng.
        - purchaseOrder (PO): Đơn mua hàng.
        - rfqRequest (RFQ): Yêu cầu báo giá.
        - rfqQuotation: Báo giá.
        - goodsReceipt (GRN): Phiếu nhập kho.
        - supplierInvoice: Hóa đơn.
        - supplierKpiScore: Chỉ số KPI nhà cung cấp.

        # OPERATING PRINCIPLES
        1. Dữ liệu là ưu tiên: Mọi đánh giá phải dựa trên chỉ số (TrustScore, LeadTime, Giá, Chất lượng).
        2. Tối ưu chi phí: Luôn tìm phương án cân bằng giữa giá thành và thời gian giao hàng.
        3. Dự đoán rủi ro: Nếu nhà cung cấp có xu hướng trễ hàng hoặc chất lượng giảm sút, hãy cảnh báo.
        4. Minh bạch: Mọi gợi ý phải tuân thủ ma trận phê duyệt.

        # QUY TẮC TƯƠNG TÁC
        1. LUÔN LUÔN sử dụng công cụ 'query_database' khi người dùng hỏi về dữ liệu thực tế.
        2. Đối với 'findMany', sử dụng 'take: 10' để tránh quá tải dữ liệu.
        3. Kết hợp dữ liệu cứng (KPI/Đơn hàng) và dữ liệu mềm (phản hồi trong Dispute) khi phân tích nhà cung cấp.

        ===== ĐỊNH DẠNG ĐẦU RA BẮT BUỘC =====
        Bạn PHẢI trả về JSON hợp lệ:
        {
          "success": true,
          "summary": "Mô tả ngắn gọn kết quả bằng tiếng Việt (giọng điệu CPO chuyên nghiệp)",
          "data": <mảng hoặc object dữ liệu thực tế>,
          "total": <số lượng bản ghi>,
          "message": "Thông báo bổ sung nếu cần"
        }
        TUYỆT ĐỐI không thêm markdown, chỉ JSON thuần túy.
      `;

      // Định nghĩa công cụ cho Function Calling
      const tools: any = [
        {
          functionDeclarations: [
            {
              name: 'query_database',
              description:
                'Truy vấn và quản lý dữ liệu từ database thông qua Prisma.',
              parameters: {
                type: 'OBJECT',
                properties: {
                  modelName: {
                    type: 'STRING',
                    description:
                      'Tên của model (ví dụ: organization, user, purchaseOrder).',
                  },
                  action: {
                    type: 'STRING',
                    description:
                      'Hành động: findMany, findUnique, findFirst, count, create, update, delete.',
                  },
                  queryArgs: {
                    type: 'OBJECT',
                    description:
                      'Đối số Prisma (where, include, take, skip, orderBy).',
                  },
                },
                required: ['modelName', 'action'],
              },
            },
          ],
        },
      ];

      // Request đầu tiên
      let response = await this.client.models.generateContent({
        model: 'gemini-3.1-flash-lite-preview',
        config: {
          systemInstruction: {
            parts: [{ text: systemInstruction }],
          },
          thinkingConfig: {
            thinkingLevel: ThinkingLevel.HIGH,
          },
          tools: tools,
        },
        contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
      });

      const chatHistory: any[] = [
        { role: 'user', parts: [{ text: userPrompt }] },
      ];

      // Vòng lặp xử lý Function Calling
      /**
       * Vòng lặp này sẽ tiếp tục cho đến khi AI không còn yêu cầu gọi hàm nào nữa. Mỗi lần AI yêu cầu gọi hàm, chúng ta sẽ thực thi hàm đó, thêm kết quả vào lịch sử trò chuyện, và gửi lại toàn bộ lịch sử để AI có thể đưa ra câu trả lời cuối cùng dựa trên dữ liệu mới nhất.
       * Điều này cho phép AI có thể thực hiện nhiều truy vấn liên tiếp nếu cần thiết để trả lời câu hỏi của người dùng một cách chính xác và đầy đủ nhất.
       */
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

        // Gửi lại lịch sử kèm kết quả hàm
        response = await this.client.models.generateContent({
          model: 'gemini-3.1-flash-lite-preview',
          config: {
            systemInstruction: {
              parts: [{ text: systemInstruction }],
            },
            tools: tools,
          },
          contents: chatHistory,
        });
      }

      return this.parseJsonResponse(response.text ?? '');
    } catch (error) {
      console.error('Error in askAiAboutDatabase:', error);
      throw error;
    }
  }

  /**
   * Parse JSON an toàn từ response text của AI
   */
  private parseJsonResponse(text: string): AiDatabaseResponse {
    const cleaned = text
      .replace(/^```json\s*/i, '')
      .replace(/^```\s*/i, '')
      .replace(/```$/, '')
      .trim();

    try {
      return JSON.parse(cleaned) as AiDatabaseResponse;
    } catch {
      // AI không tuân thủ format JSON — wrap lại
      console.warn(
        'AI response is not valid JSON, wrapping as text:',
        cleaned.slice(0, 100),
      );
      return {
        success: true,
        summary: cleaned,
        data: [],
        total: 0,
        message: 'Response không phải JSON chuẩn, đây là text gốc.',
        cons: undefined,
        score: 0,
      };
    }
  }

  /**
   * Thực thi truy vấn Prisma một cách an toàn
   */
  private async executePrismaQuery(
    modelName: string,
    action: string,
    queryArgs: any,
  ) {
    try {
      if (!(modelName in this.prisma)) {
        return { error: `Model '${modelName}' không tồn tại.` };
      }

      const model = this.prisma[modelName];
      if (typeof model[action] !== 'function') {
        return {
          error: `Hành động '${action}' không hợp lệ cho ${modelName}.`,
        };
      }

      // Giới hạn dữ liệu trả về
      const args = queryArgs || {};
      if (
        (action === 'findMany' || action === 'findFirst') &&
        (!args.take || args.take > 10)
      ) {
        args.take = 10;
      }

      console.log(
        `AI Query: prisma.${modelName}.${action}(${JSON.stringify(args)})`,
      );
      const result = await model[action](args);

      return JSON.parse(
        JSON.stringify(result, (_, value) =>
          typeof value === 'bigint' ? value.toString() : value,
        ),
      );
    } catch (error) {
      console.error('Prisma AI Query Error:', error);
      return { error: error.message };
    }
  }

  async listModels() {
    try {
      const response = await this.client.models.list();
      return response;
    } catch (error) {
      console.error('Không thể lấy danh sách model:', error);
      return [];
    }
  }

  async responsetest() {
    return this.askAiAboutDatabase('Liệt kê 3 tổ chức đầu tiên');
  }

  async getCompanySuggestion(items: any[]) {
    const itemDescriptions = items
      .map(
        (item) =>
          `${item.productName || item.productDesc || 'Sản phẩm'} (số lượng: ${item.qty})`,
      )
      .join(', ');

    const userPrompt = `
      Với tư cách là CPO, hãy thực hiện phân tích chuyên sâu để gợi ý nhà cung cấp cho yêu cầu mua hàng (PR) sau: [${itemDescriptions}].

      QUY TRÌNH PHÂN TÍCH:
      1. TRA CỨU NỘI BỘ (Database):
         - Tìm các nhà cung cấp (Organization.companyType='SUPPLIER') có 'industry' hoặc 'metadata' phù hợp với loại mặt hàng trên.
         - Sử dụng 'supplierKpiScore' để đánh giá hiệu suất thực tế (OTD, chất lượng) của họ trong quá khứ.
      
      2. TRA CỨU BỔ SUNG (Internet):
         - Nếu dữ liệu nội bộ không đủ hoặc muốn mở rộng lựa chọn, hãy tìm kiếm các nhà cung cấp uy tín hàng đầu trong ngành hàng tương ứng tại Việt Nam.

      3. TỔNG HỢP & GỢI Ý (Ranking):
         - Trả về danh sách TỐI ĐA 5 nhà cung cấp tốt nhất.
         - Sắp xếp dựa trên điểm tổng hợp (kết hợp TrustScore, độ phù hợp ngành hàng, và khả năng cung ứng).
         - Với mỗi nhà cung cấp, hãy cung cấp "Bản tóm tắt CPO":
            - Lý do lựa chọn (Thế mạnh).
            - Mức độ tin cậy (TrustScore).
            - Cảnh báo rủi ro (nếu có lịch sử tranh chấp/trễ hàng).

      LƯU Ý: Nếu nhà cung cấp đã có sẵn trong database, hãy ưu tiên đưa họ lên đầu danh sách.
    `;

    return this.askAiAboutDatabase(userPrompt);
  }
}
