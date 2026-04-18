import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenAI } from '@google/genai';

export interface ExtractedSupplierInfo {
  name: string;
  email?: string;
  phone?: string;
  website: string;
  address?: string;
  province?: string;
  industry?: string;
  products?: string[];
  certifications?: string[];
  description?: string;
  taxCode?: string;
}

@Injectable()
export class WebScraperService {
  private readonly logger = new Logger(WebScraperService.name);
  private readonly client: GoogleGenAI;

  constructor(private readonly configService: ConfigService) {
    const apiKey = this.configService.get<string>('GEMINI_API_KEY') ?? '';
    this.client = new GoogleGenAI({ apiKey });
  }

  async extractSupplierInfo(
    url: string,
    title: string,
    content: string,
  ): Promise<ExtractedSupplierInfo> {
    const prompt = `Bạn là AI trích xuất thông tin nhà cung cấp từ kết quả tìm kiếm web.

DỮ LIỆU ĐẦU VÀO:
- URL: ${url}
- Tiêu đề: ${title}
- Nội dung snippet: ${content}

NHIỆM VỤ: Trích xuất thông tin nhà cung cấp dưới dạng JSON. Nếu không có thông tin, để null.

CHỈ TRẢ VỀ JSON (không markdown, không giải thích):
{
  "name": "Tên công ty đầy đủ",
  "email": "email liên hệ hoặc null",
  "phone": "số điện thoại hoặc null",
  "website": "${url}",
  "address": "địa chỉ đầy đủ hoặc null",
  "province": "tỉnh/thành phố hoặc null",
  "industry": "ngành nghề chính",
  "products": ["sản phẩm 1", "sản phẩm 2"],
  "certifications": ["ISO 9001", "..."] hoặc [],
  "description": "mô tả ngắn 1-2 câu về công ty",
  "taxCode": "mã số thuế hoặc null"
}`;

    try {
      const result = await this.client.models.generateContent({
        model: 'gemini-2.0-flash-lite',
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
      });

      const text = result.text ?? '{}';
      const cleaned = text
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .trim();
      return JSON.parse(cleaned) as ExtractedSupplierInfo;
    } catch (err: any) {
      this.logger.warn(`Extract failed for ${url}: ${err.message}`);
      // Fallback: use title as name
      return {
        name: title,
        website: url,
        description: content.slice(0, 200),
        products: [],
        certifications: [],
      };
    }
  }
}
