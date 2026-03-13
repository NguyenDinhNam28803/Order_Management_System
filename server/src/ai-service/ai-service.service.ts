/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenAI } from '@google/genai';

import { PrismaService } from '../prisma/prisma.service';

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
  }

  /**
   * Phương thức chính để AI tương tác với database qua Prisma
   */
  async askAiAboutDatabase(userPrompt: string) {
    try {
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
                  modelName: {
                    type: 'STRING',
                    description:
                      'Tên của model (ví dụ: organization, user, purchaseOrder).',
                  },
                  action: {
                    type: 'STRING',
                    description:
                      'Hành động: findMany, findUnique, findFirst, count.',
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
        model: 'gemini-2.5-flash',
        config: {
          systemInstruction: {
            parts: [{ text: systemInstruction }],
          },
          tools: tools,
        },
        contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
      });

      const chatHistory: any[] = [
        { role: 'user', parts: [{ text: userPrompt }] },
      ];

      // Vòng lặp xử lý Function Calling
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
          model: 'gemini-2.5-flash',
          config: {
            systemInstruction: {
              parts: [{ text: systemInstruction }],
            },
            tools: tools,
          },
          contents: chatHistory,
        });
      }

      return response.text;
    } catch (error) {
      console.error('Error in askAiAboutDatabase:', error);
      throw error;
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
}
