/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenAI, ThinkingLevel } from '@google/genai';

import { PrismaService } from '../prisma/prisma.service';

export interface AiDatabaseResponse<T = unknown> {
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
   * Phương thức chính để AI tương tác với database qua Prisma
   */
  async askAiAboutDatabase(userPrompt: string) {
    try {
      // Hướng dẫn chi tiết cho AI về cách sử dụng công cụ và cấu trúc database
      const systemInstruction = `
        Bạn là một trợ lý AI chuyên về quản lý chuỗi cung ứng trong hệ thống Order Management System.
        Bạn có quyền truy cập vào database của hệ thống thông qua công cụ 'query_database'.

        Cấu trúc database (Prisma models):
        - organization: Thông tin công ty, nhà cung cấp, khách hàng.
        - user: Người dùng trong hệ thống.
        - purchaseRequisition: Yêu cầu mua hàng (PR).
        - purchaseOrder: Đơn mua hàng (PO).
        - rfqRequest: Yêu cầu báo giá (RFQ).
        - rfqQuotation: Báo giá từ nhà cung cấp.
        - goodsReceipt: Phiếu nhập kho (GRN).
        - supplierInvoice: Hóa đơn.
        - payment: Thông tin thanh toán.
        - product: Danh mục sản phẩm.
        - department: Phòng ban.
        - costCenter: Trung tâm chi phí.

        Quy tắc tương tác:
        1. LUÔN LUÔN sử dụng công cụ 'query_database' khi người dùng hỏi về dữ liệu thực tế trong hệ thống.
        2. Tên model trong 'query_database' phải viết đúng camelCase (ví dụ: 'purchaseOrder', 'rfqRequest').
        3. Đối với 'findMany', bạn nên sử dụng 'take: 5' hoặc 'take: 10' để tránh quá tải dữ liệu.
        4. Sau khi nhận được dữ liệu từ công cụ, hãy tổng hợp và trả lời người dùng một cách tự nhiên bằng tiếng Việt.
        5. Nếu không tìm thấy dữ liệu, hãy thông báo rõ ràng.

        ===== ĐỊNH DẠNG ĐẦU RA BẮT BUỘC =====
        Sau khi thu thập đủ dữ liệu, bạn PHẢI trả về JSON hợp lệ theo cấu trúc sau:
        {
          "success": true,
          "summary": "Mô tả ngắn gọn kết quả bằng tiếng Việt",
          "data": <mảng hoặc object dữ liệu thực tế từ database>,
          "total": <số lượng bản ghi>,
          "message": "Thông báo bổ sung nếu cần"
        }

        Nếu không tìm thấy dữ liệu:
        {
          "success": false,
          "summary": "Lý do không tìm thấy",
          "data": [],
          "total": 0
        }

        TUYỆT ĐỐI không thêm markdown, không có \`\`\`json, chỉ JSON thuần túy.
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
      .map((item) => `${item.productName} (số lượng: ${item.qty})`)
      .join(', ');

    const prompt = `Dựa trên mô tả sản phẩm: ${itemDescriptions}, hãy gợi ý 3 công ty cung cấp phù hợp nhất trong hệ thống. Trả về tên công ty và lý do ngắn gọn theo định dạng JSON.`;

    const response = await this.client.models.generateContent({
      model: 'gemini-3.1-flash-lite-preview',
      config: {
        thinkingConfig: {
          thinkingLevel: ThinkingLevel.HIGH,
        },
      },
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
    });
    return this.parseJsonResponse(response.text ?? '');
  }
}
