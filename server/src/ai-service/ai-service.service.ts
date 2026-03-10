import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenAI } from '@google/genai';

@Injectable()
export class AiService implements OnModuleInit {
  private client: GoogleGenAI;

  constructor(private configService: ConfigService) {
    const apiKey = this.configService.get<string>('GEMINI_API_KEY');
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY is not defined in environment variables');
    }
    // Khởi tạo client theo SDK mới @google/genai
    this.client = new GoogleGenAI({
      apiKey: apiKey,
    });
  }

  async onModuleInit() {
    await this.listModels();
  }

  // async getEmbedding(text: string): Promise<number[]> {
  //   if (!text || text.trim().length === 0) {
  //     throw new Error('Text for embedding cannot be empty');
  //   }

  //   try {
  //     // Sử dụng cú pháp mới của @google/genai
  //     const response = await this.client.models.embedContent({
  //       model: 'text-embedding-004',
  //       content: text,
  //     });

  //     // Kết quả trả về trong response.embeddings (mảng) hoặc response.embedding
  //     return response.embeddings[0].values;
  //   } catch (error) {
  //     console.error('Error getting embedding with @google/genai:', error);

  //     // Fallback sang model cũ nếu text-embedding-004 lỗi
  //     try {
  //       const fallbackResponse = await this.client.models.embedContent({
  //         model: 'embedding-001',
  //         content: text,
  //       });
  //       return fallbackResponse.embeddings[0].values;
  //     } catch (fallbackError) {
  //       throw fallbackError;
  //     }
  //   }
  // }

  async listModels() {
    try {
      // console.log('--- Đang liệt kê các model khả dụng (@google/genai) ---');
      // const {  } = await this.client.models.list();

      // for (const m of models) {
      //   console.log(`- Model Name: ${m.name}`);
      //   // Log thêm thông tin nếu cần
      // }
      // return models;
      const response = await this.client.models.list();
      console.log('--- Available models from @google/genai ---');
      console.log(response);
    } catch (error) {
      console.error('Không thể lấy danh sách model:', error);
      return [];
    }
  }

  async responsetest() {
    try {
      const response = await this.client.models.generateContent({
        model: 'models/gemini-2.5-flash',
        contents:
          'liệt kê 5 sản phẩm máy in văn phòng giá rẻ tốt nhất hiện nay, kèm theo mô tả ngắn gọn và giá tham khảo',
      });
      console.log('Response:', response.text);
      return response.text;
    } catch (error) {
      console.error('Error generating content with Gemini 2.0 Flash:', error);
      throw error;
    }
  }
}
