import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OpenAI } from 'openai';

// Dịch vụ AI để tương tác với OpenAI API, lấy embedding cho văn bản
@Injectable()
export class AiServiceService {
  private openai: OpenAI;
  constructor(private configService: ConfigService) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    this.openai = new OpenAI({
      apiKey: this.configService.get<string>('OPENAI_API_KEY'), // Đã lấy từ OpenAI
    });
  }

  // Hàm lấy embedding từ OpenAI
  async getEmbedding(text: string): Promise<number[]> {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const response = await this.openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: text,
    });
    return response.data[0].embedding;
  }
}
