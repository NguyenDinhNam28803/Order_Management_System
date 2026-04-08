/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EmbeddingService } from './embedding.service';
import { ConfigService } from '@nestjs/config';
import { PrDraftResponse, PrDraftItem } from './dto/generate-pr-draft.dto';

@Injectable()
export class RagPrGeneratorService {
  private readonly fptBaseUrl: string;
  private readonly fptApiKey: string;
  private readonly fptModel: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly embedding: EmbeddingService,
    private readonly configService: ConfigService,
  ) {
    this.fptBaseUrl = this.configService.get<string>('FPT_AI_BASE_URL') ?? '';
    this.fptApiKey = this.configService.get<string>('FPT_AI_API_KEY') ?? '';
    this.fptModel = this.configService.get<string>('FPT_LLM_MODEL') ?? 'SaoLa4-medium';
  }

  async generatePrDraft(prompt: string, orgId: string): Promise<PrDraftResponse> {
    try {
      // 1. Retrieve relevant data from RAG
      const queryVector = await this.embedding.embed(prompt);
      const vectorStr = `[${queryVector.join(',')}]`;

      // Query products, categories, suppliers from vector DB
      const chunks = await this.prisma.$queryRawUnsafe<any[]>(`
        SELECT 
          content,
          source_table,
          source_id,
          metadata,
          1 - (embedding <=> $1::vector) AS similarity
        FROM document_embeddings
        WHERE source_table IN ('products', 'product_categories', 'organizations', 'pr_items')
        ORDER BY embedding <=> $1::vector
        LIMIT 20
      `, vectorStr);

      // ALWAYS search products directly from DB - this is the PRIMARY source
      let dbProducts: any[] = [];
      console.log(`[RAG] orgId:`, orgId);
      if (orgId) {
        const searchTerms = prompt.toLowerCase().split(/\s+/).filter(w => w.length > 2);
        console.log(`[RAG] Searching DB with terms:`, searchTerms);
        
        if (searchTerms.length > 0) {
          // Build OR conditions properly for Prisma
          const orConditions = searchTerms.flatMap(term => [
            { name: { contains: term, mode: 'insensitive' as const } },
            { description: { contains: term, mode: 'insensitive' as const } },
            { sku: { contains: term, mode: 'insensitive' as const } },
          ]);
          
          dbProducts = await this.prisma.product.findMany({
            where: {
              orgId,
              OR: orConditions,
            },
            select: {
              id: true,
              name: true,
              description: true,
              sku: true,
              categoryId: true,
              category: { select: { id: true, name: true } },
            },
            take: 15,
          });
        } else {
          // If no search terms, get recent products
          dbProducts = await this.prisma.product.findMany({
            where: { orgId },
            select: {
              id: true,
              name: true,
              description: true,
              sku: true,
              categoryId: true,
              category: { select: { id: true, name: true } },
            },
            take: 10,
            orderBy: { updatedAt: 'desc' },
          });
        }
        console.log(`[RAG] Found ${dbProducts.length} products from DB:`, 
          dbProducts.map(p => p.name));
      } else {
        console.log(`[RAG] Warning: No orgId provided, cannot search DB products`);
      }
      
      // Also get products from RAG (vector search) as supplementary
      const ragProductIds = new Set(chunks.filter(c => c.source_table === 'products').map(c => c.source_id));

      // 2. Get cost centers for the org (skip if no valid orgId)
      const costCenters = orgId
        ? await this.prisma.costCenter.findMany({
            where: { orgId },
            select: { id: true, name: true, code: true },
            take: 10,
          })
        : [];

      // 3. Build context for LLM
      const { context, allProducts } = this.buildContext(chunks, costCenters, dbProducts);

      // 4. Call LLM to generate PR
      const draftPr = await this.callLlmForPrGeneration(prompt, context, allProducts);

      return {
        ...draftPr,
        sources: [
          ...chunks
            .filter(c => c.similarity > 0.6)
            .map(c => ({
              table: c.source_table,
              id: c.source_id,
              name: c.metadata?.name || c.metadata?.productDesc || 'Unknown',
              similarity: parseFloat(Number(c.similarity).toFixed(3)),
            })),
          ...dbProducts.map(p => ({
            table: 'products' as const,
            id: p.id,
            name: p.name,
            similarity: 0.5, // fallback similarity
          })),
        ],
      };
    } catch (error) {
      console.error('Error generating PR draft:', error);
      return {
        success: false,
        title: '',
        description: '',
        priority: 2,
        currency: 'VND',
        totalEstimate: 0,
        items: [],
        confidence: 0,
        reasoning: '',
        sources: [],
        error: error.message,
      };
    }
  }

  private buildContext(chunks: any[], costCenters: any[], additionalProducts: any[] = []): { context: string; allProducts: any[] } {
    const ragProducts = chunks.filter(c => c.source_table === 'products');
    // Merge RAG products with additional DB products, avoid duplicates
    const seenIds = new Set(ragProducts.map(p => p.source_id));
    const dbProducts = additionalProducts.filter(p => !seenIds.has(p.id));
    const allProducts = [...ragProducts, ...dbProducts.map(p => ({
      source_id: p.id,
      metadata: {
        name: p.name,
        description: p.description,
        sku: p.sku,
        categoryName: p.category?.name,
        categoryId: p.categoryId,
      },
    }))];
    
    const categories = chunks.filter(c => c.source_table === 'product_categories');
    const suppliers = chunks.filter(c => c.source_table === 'organizations');

    const context = `
## PRODUCTS (Sản phẩm có trong hệ thống):
${allProducts.map((p, i) => {
  const meta = p.metadata || {};
  return `${i + 1}. ${meta.name || 'N/A'} (ID: ${p.source_id})
   - Mô tả: ${meta.description || 'N/A'}
   - SKU: ${meta.sku || 'N/A'}
   - Danh mục: ${meta.categoryName || 'N/A'}
   - Danh mục ID: ${meta.categoryId || 'N/A'}
   - Giá tham khảo: ${meta.price || 'N/A'}`;
}).join('\n') || 'Không có sản phẩm phù hợp'}

## CATEGORIES (Danh mục sản phẩm):
${categories.map((c, i) => {
  const meta = c.metadata || {};
  return `${i + 1}. ${meta.name || 'N/A'} (ID: ${c.source_id})`;
}).join('\n') || 'Không có danh mục phù hợp'}

## SUPPLIERS (Nhà cung cấp):
${suppliers.map((s, i) => {
  const meta = s.metadata || {};
  return `${i + 1}. ${meta.name || 'N/A'} (ID: ${s.source_id})
   - Loại: ${meta.companyType || 'N/A'}
   - Tier: ${meta.supplierTier || 'N/A'}`;
}).join('\n') || 'Không có nhà cung cấp phù hợp'}

## COST CENTERS (Trung tâm chi phí hiện có):
${costCenters.map((c, i) => `${i + 1}. ${c.name} (ID: ${c.id}, Code: ${c.code})`).join('\n') || 'Không có cost center'}
`;

    return { context, allProducts };
  }

  private async callLlmForPrGeneration(
    userPrompt: string,
    context: string,
    allProducts: any[] = [],
  ): Promise<Omit<PrDraftResponse, 'sources'>> {
    const systemPrompt = `Bạn là AI Procurement Assistant. Nhiệm vụ của bạn là phân tích yêu cầu mua hàng của người dùng và tạo một PR (Purchase Requisition) Draft chi tiết.

## NGUYÊN TẮC QUAN TRỌNG:
1. Phân tích kỹ yêu cầu của người dùng
2. **BẮT BUỘC**: Nếu trong CONTEXT có sản phẩm phù hợp với yêu cầu, PHẢI sử dụng chính xác:
   - "productId": ID từ context (không được để null nếu có trong context)
   - "sku": SKU từ context
   - "categoryId": Danh mục ID từ context
   - "categoryName": Tên danh mục từ context
3. Chỉ tạo items mới (productId=null) khi KHÔNG có sản phẩm phù hợp trong context
4. Map từ khóa từ yêu cầu người dùng với tên sản phẩm trong context (fuzzy matching)
5. Ước tính giá hợp lý dựa trên thị trường (VND)
6. Gợi ý cost center phù hợp nếu có thể

## VÍ DỤ MAP:
- User yêu cầu "bút" → Tìm sản phẩm có "bút" trong tên trong context
- User yêu cầu "giấy A4" → Tìm sản phẩm có "A4" hoặc "giấy" trong context

## ĐỊNH DẠNG TRẢ LỜI (JSON):
{
  "success": true,
  "title": "Tiêu đề PR ngắn gọn (tối đa 100 ký tự)",
  "description": "Mô tả chi tiết yêu cầu",
  "justification": "Lý do mua hàng",
  "priority": 1|2|3 (1=Cao, 2=Trung bình, 3=Thấp),
  "requiredDate": "YYYY-MM-DD" (ước tính ngày cần hàng, thường là 14 ngày sau),
  "currency": "VND",
  "totalEstimate": tổng giá trị ước tính (number),
  "items": [
    {
      "lineNumber": 1,
      "productId": "ID sản phẩm từ context - BẮT BUỘC dùng nếu có trong context",
      "productDesc": "Mô tả sản phẩm chi tiết",
      "sku": "SKU từ context - BẮT BUỘC dùng nếu có",
      "categoryId": "ID danh mục từ context - BẮT BUỘC dùng nếu có",
      "categoryName": "Tên danh mục từ context",
      "qty": số lượng (number),
      "unit": "PCS" hoặc đơn vị phù hợp,
      "estimatedPrice": giá đơn vị ước tính (number),
      "currency": "VND",
      "specNote": "Ghi chú kỹ thuật (nếu có)"
    }
  ],
  "suggestedCostCenterId": "ID cost center phù hợp (hoặc null)",
  "suggestedCostCenterName": "Tên cost center",
  "confidence": độ tin cậy từ 0-1 (number),
  "reasoning": "Giải thích ngắn gọn: tại sao chọn các items này, map từ yêu cầu nào"
}`;

    const response = await fetch(`${this.fptBaseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.fptApiKey}`,
      },
      body: JSON.stringify({
        model: this.fptModel,
        messages: [
          { role: 'system', content: systemPrompt },
          {
            role: 'user',
            content: `## YÊU CẦU CỦA NGƯỜI DÙNG:\n${userPrompt}\n\n## CONTEXT (Dữ liệu từ hệ thống):\n${context}\n\nHãy tạo PR Draft dựa trên yêu cầu trên.`,
          },
        ],
        streaming: false,
        temperature: 0.3,
        max_tokens: 3000,
      }),
    });

    if (!response.ok) {
      throw new Error(`FPT LLM error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content ?? '';

    // Parse JSON response
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      const jsonStr = jsonMatch ? jsonMatch[0] : content;
      const parsed = JSON.parse(jsonStr);

      // Validate and enrich items with context data if AI missed fields
      const validatedItems = (parsed.items || []).map((item: any, idx: number) => {
        // If AI returned productId but missing sku/category, try to find from context
        if (item.productId && (!item.sku || !item.categoryId)) {
          const contextProduct = allProducts.find(p => p.source_id === item.productId);
          if (contextProduct?.metadata) {
            const meta = contextProduct.metadata;
            return {
              ...item,
              sku: item.sku || meta.sku || null,
              categoryId: item.categoryId || meta.categoryId || null,
              categoryName: item.categoryName || meta.categoryName || null,
            };
          }
        }
        return {
          lineNumber: idx + 1,
          ...item,
        };
      });

      return {
        success: true,
        title: parsed.title || 'Yêu cầu mua hàng từ AI',
        description: parsed.description || userPrompt,
        justification: parsed.justification || 'Nhu cầu công việc',
        priority: parsed.priority || 2,
        requiredDate: parsed.requiredDate || this.getDefaultRequiredDate(),
        currency: parsed.currency || 'VND',
        totalEstimate: parsed.totalEstimate || 0,
        items: validatedItems,
        suggestedCostCenterId: parsed.suggestedCostCenterId,
        suggestedCostCenterName: parsed.suggestedCostCenterName,
        confidence: parsed.confidence || 0.8,
        reasoning: parsed.reasoning || 'Đã phân tích yêu cầu và tạo PR Draft',
      };
    } catch (e) {
      console.error('Failed to parse LLM response:', content);
      throw new Error('Invalid LLM response format');
    }
  }

  private getDefaultRequiredDate(): string {
    const date = new Date();
    date.setDate(date.getDate() + 14);
    return date.toISOString().split('T')[0];
  }
}
