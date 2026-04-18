import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenAI } from '@google/genai';
import { PrismaService } from '../prisma/prisma.service';
import { WebSearchService } from './web-search.service';
import {
  WebScraperService,
  ExtractedSupplierInfo,
} from './web-scraper.service';
import {
  DiscoverSupplierDto,
  ImportSupplierDto,
} from './dto/discover-supplier.dto';

export interface DiscoveredSupplier {
  name: string;
  website: string;
  email?: string;
  phone?: string;
  address?: string;
  province?: string;
  industry?: string;
  products: string[];
  certifications: string[];
  description?: string;
  taxCode?: string;
  aiScore: number;
  aiSummary: string;
  matchReasons: string[];
  sourceUrl: string;
  status: 'IN_SYSTEM' | 'WORKED_BEFORE' | 'NEW';
  existingOrgId?: string;
}

export interface DiscoverySearchResult {
  total: number;
  query: string;
  suppliers: DiscoveredSupplier[];
}

@Injectable()
export class SupplierDiscoveryService {
  private readonly logger = new Logger(SupplierDiscoveryService.name);
  private readonly client: GoogleGenAI;

  constructor(
    private readonly prisma: PrismaService,
    private readonly webSearch: WebSearchService,
    private readonly webScraper: WebScraperService,
    private readonly configService: ConfigService,
  ) {
    const apiKey = this.configService.get<string>('GEMINI_API_KEY') ?? '';
    this.client = new GoogleGenAI({ apiKey });
  }

  async search(dto: DiscoverSupplierDto): Promise<DiscoverySearchResult> {
    const limit = dto.limit ?? 10;

    // 1. Build natural-language search query
    const searchQuery = this.buildSearchQuery(dto);
    this.logger.log(`Supplier discovery search: "${searchQuery}"`);

    // 2. Web search via Tavily
    const webResults = await this.webSearch.search(
      searchQuery,
      Math.min(limit + 2, 15),
    );
    if (webResults.length === 0) {
      return { total: 0, query: searchQuery, suppliers: [] };
    }

    // 3. Extract structured info from each result (parallel)
    const extracted: (ExtractedSupplierInfo & {
      sourceUrl: string;
      webScore: number;
    })[] = await Promise.all(
      webResults.slice(0, limit).map(async (r) => {
        const info = await this.webScraper.extractSupplierInfo(
          r.url,
          r.title,
          r.content,
        );
        return { ...info, sourceUrl: r.url, webScore: r.score };
      }),
    );

    // 4. Check duplicates against internal Organization table
    const withStatus = await Promise.all(
      extracted.map(async (s) => this.checkInternalStatus(s)),
    );

    // 5. AI scoring — ask Gemini to rank all suppliers based on user criteria
    const scored = await this.aiScoreSuppliers(withStatus, dto);

    // 6. Apply excludeNames filter
    const excluded = new Set(
      (dto.excludeNames ?? []).map((n) => n.toLowerCase()),
    );
    const filtered = scored.filter((s) => !excluded.has(s.name.toLowerCase()));

    // 7. Sort: IN_SYSTEM or WORKED_BEFORE first, then by aiScore desc
    filtered.sort((a, b) => {
      const statusWeight = (s: DiscoveredSupplier) =>
        s.status === 'WORKED_BEFORE' ? 2 : s.status === 'IN_SYSTEM' ? 1 : 0;
      const sw = statusWeight(b) - statusWeight(a);
      if (sw !== 0) return sw;
      return b.aiScore - a.aiScore;
    });

    return { total: filtered.length, query: searchQuery, suppliers: filtered };
  }

  async enrich(url: string, content?: string): Promise<ExtractedSupplierInfo> {
    return this.webScraper.extractSupplierInfo(url, url, content ?? '');
  }

  async importSupplier(dto: ImportSupplierDto) {
    // Generate unique code from name
    const base = dto.name
      .replace(/[^a-zA-Z0-9]/g, '')
      .toUpperCase()
      .slice(0, 8);
    const suffix = Math.floor(100 + Math.random() * 900);
    const code = `SUP-${base}-${suffix}`;

    return this.prisma.organization.create({
      data: {
        code,
        name: dto.name,
        email: dto.email,
        phone: dto.phone,
        website: dto.website,
        address: dto.address,
        province: dto.province,
        industry: dto.industry,
        taxCode: dto.taxCode,
        companyType: 'SUPPLIER',
        isActive: true,
        kycStatus: 'PENDING',
      },
    });
  }

  async getCategories() {
    return this.prisma.productCategory.findMany({
      select: { id: true, name: true, code: true },
      orderBy: { name: 'asc' },
    });
  }

  // ── Helpers ────────────────────────────────────────────────────────────────

  private buildSearchQuery(dto: DiscoverSupplierDto): string {
    const parts: string[] = [dto.query];
    if (dto.categories?.length)
      parts.push(`danh mục: ${dto.categories.join(', ')}`);
    if (dto.products) parts.push(dto.products);
    if (dto.location) parts.push(dto.location);
    if (dto.companySize === 'ENTERPRISE') parts.push('tập đoàn lớn');
    if (dto.priorities?.includes('ISO_CERTIFIED')) parts.push('chứng chỉ ISO');
    parts.push('nhà cung cấp B2B Việt Nam');
    return parts.join(' ');
  }

  private async checkInternalStatus(
    s: ExtractedSupplierInfo & { sourceUrl: string; webScore: number },
  ): Promise<
    ExtractedSupplierInfo & {
      sourceUrl: string;
      webScore: number;
      status: 'IN_SYSTEM' | 'WORKED_BEFORE' | 'NEW';
      existingOrgId?: string;
    }
  > {
    // Check by email, taxCode, or website
    const orConditions: object[] = [];
    if (s.email) orConditions.push({ email: s.email });
    if (s.taxCode) orConditions.push({ taxCode: s.taxCode });
    if (s.website) orConditions.push({ website: s.website });

    if (orConditions.length === 0) {
      return { ...s, status: 'NEW' };
    }

    const existing = await this.prisma.organization.findFirst({
      where: {
        OR: orConditions,
        companyType: { in: ['SUPPLIER', 'BOTH'] },
      },
      select: { id: true },
    });

    if (!existing) {
      return { ...s, status: 'NEW' };
    }

    // Check if we've worked with them (has POs)
    const poCount = await this.prisma.purchaseOrder.count({
      where: { supplierId: existing.id },
    });

    return {
      ...s,
      status: poCount > 0 ? 'WORKED_BEFORE' : 'IN_SYSTEM',
      existingOrgId: existing.id,
    };
  }

  private async aiScoreSuppliers(
    suppliers: Array<
      ExtractedSupplierInfo & {
        sourceUrl: string;
        webScore: number;
        status: string;
        existingOrgId?: string;
      }
    >,
    dto: DiscoverSupplierDto,
  ): Promise<DiscoveredSupplier[]> {
    const supplierList = suppliers.map((s, i) => ({
      index: i,
      name: s.name,
      description: s.description ?? '',
      products: s.products ?? [],
      certifications: s.certifications ?? [],
      province: s.province ?? '',
      webScore: s.webScore,
    }));

    const priorityText = dto.priorities?.join(', ') ?? 'cân bằng';
    const prompt = `Bạn là chuyên gia procurement. Đánh giá và xếp hạng các nhà cung cấp dưới đây theo tiêu chí tìm kiếm.

TIÊU CHÍ TÌM KIẾM:
- Từ khóa: ${dto.query}
- Danh mục: ${dto.categories?.join(', ') ?? 'không giới hạn'}
- Khu vực: ${dto.location ?? 'toàn quốc'}
- Ưu tiên: ${priorityText}

DANH SÁCH NHÀ CUNG CẤP:
${JSON.stringify(supplierList, null, 2)}

NHIỆM VỤ: Với từng nhà cung cấp, trả về:
- score (0-100): điểm phù hợp với tiêu chí
- summary (tiếng Việt, 1-2 câu): lý do phù hợp
- matchReasons (mảng string): 2-3 điểm mạnh cụ thể

CHỈ TRẢ VỀ JSON ARRAY (không markdown):
[
  { "index": 0, "score": 85, "summary": "...", "matchReasons": ["...", "..."] },
  ...
]`;

    try {
      const result = await this.client.models.generateContent({
        model: 'gemini-2.0-flash-lite',
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
      });

      const text = result.text ?? '[]';
      const cleaned = text
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .trim();
      const scores = JSON.parse(cleaned) as Array<{
        index: number;
        score: number;
        summary: string;
        matchReasons: string[];
      }>;

      return suppliers.map((s, i) => {
        const scored = scores.find((sc) => sc.index === i);
        return {
          name: s.name,
          website: s.website,
          email: s.email,
          phone: s.phone,
          address: s.address,
          province: s.province,
          industry: s.industry,
          products: s.products ?? [],
          certifications: s.certifications ?? [],
          description: s.description,
          taxCode: s.taxCode,
          aiScore: scored?.score ?? Math.round(s.webScore * 100),
          aiSummary: scored?.summary ?? s.description ?? '',
          matchReasons: scored?.matchReasons ?? [],
          sourceUrl: s.sourceUrl,
          status: s.status as 'IN_SYSTEM' | 'WORKED_BEFORE' | 'NEW',
          existingOrgId: s.existingOrgId,
        };
      });
    } catch (err: any) {
      this.logger.warn(`AI scoring failed: ${err.message}`);
      return suppliers.map((s) => ({
        name: s.name,
        website: s.website,
        email: s.email,
        phone: s.phone,
        address: s.address,
        province: s.province,
        industry: s.industry,
        products: s.products ?? [],
        certifications: s.certifications ?? [],
        description: s.description,
        taxCode: s.taxCode,
        aiScore: Math.round(s.webScore * 100),
        aiSummary: s.description ?? '',
        matchReasons: [],
        sourceUrl: s.sourceUrl,
        status: s.status as 'IN_SYSTEM' | 'WORKED_BEFORE' | 'NEW',
        existingOrgId: s.existingOrgId,
      }));
    }
  }
}
