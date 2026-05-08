import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface WebSearchResult {
  title: string;
  url: string;
  content: string;
  score: number;
}

@Injectable()
export class WebSearchService {
  private readonly logger = new Logger(WebSearchService.name);
  private readonly tavilyApiKey: string | undefined;
  private _usingMock = false;

  get isMockMode(): boolean {
    return this._usingMock;
  }

  constructor(private readonly configService: ConfigService) {
    this.tavilyApiKey = this.configService.get<string>('TAVILY_API_KEY');
    if (!this.tavilyApiKey) this._usingMock = true;
  }

  async search(query: string, maxResults = 10): Promise<WebSearchResult[]> {
    if (!this.tavilyApiKey) {
      this.logger.warn(
        'TAVILY_API_KEY not set — using mock results for development',
      );
      return this.mockResults(query);
    }

    try {
      const response = await fetch('https://api.tavily.com/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          api_key: this.tavilyApiKey,
          query,
          search_depth: 'basic',
          include_answer: false,
          include_images: false,
          include_raw_content: false,
          max_results: maxResults,
        }),
      });

      if (response.status === 401 || response.status === 403) {
        this.logger.error(
          `Tavily API key is invalid or unauthorized (${response.status}). ` +
            'Using mock results. Please update TAVILY_API_KEY in your .env file.',
        );
        this._usingMock = true;
        return this.mockResults(query);
      }

      if (!response.ok) {
        throw new Error(`Tavily API error: ${response.status}`);
      }

      const data = (await response.json()) as {
        results: {
          title: string;
          url: string;
          content: string;
          score: number;
        }[];
      };

      return (data.results ?? []).map((r) => ({
        title: r.title,
        url: r.url,
        content: r.content,
        score: r.score ?? 0,
      }));
    } catch (err: any) {
      this.logger.error(`Web search failed: ${err.message}`);
      this._usingMock = true;
      return this.mockResults(query);
    }
  }

  private mockResults(query: string): WebSearchResult[] {
    return [
      {
        title: `Công ty TNHH ABC Supply (Kết quả demo cho: ${query})`,
        url: 'https://abcsupply.vn',
        content:
          'Chuyên cung cấp thiết bị văn phòng, laptop, máy tính. Địa chỉ: 123 Cầu Giấy, Hà Nội. Email: sales@abcsupply.vn. Tel: 024-3828-xxxx. ISO 9001:2015.',
        score: 0.95,
      },
      {
        title: 'XYZ Technology Vietnam',
        url: 'https://xyztechvn.com',
        content:
          'Nhà phân phối chính hãng Dell, HP, Lenovo tại Việt Nam. Giao hàng toàn quốc trong 24h. Email: info@xyztechvn.com. Hotline: 1800-xxxx.',
        score: 0.88,
      },
      {
        title: 'Thiết bị văn phòng Minh Đức',
        url: 'https://minhduc.com.vn',
        content:
          'Cung cấp văn phòng phẩm, máy in, mực in tại TP.HCM và Hà Nội. Giá cạnh tranh, bảo hành chính hãng. ĐT: 028-xxxx.',
        score: 0.81,
      },
    ];
  }
}
