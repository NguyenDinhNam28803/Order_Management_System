/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EmbeddingService } from './embedding.service';
import { ConfigService } from '@nestjs/config';
import { PrDraftResponse, PrDraftItem } from './dto/generate-pr-draft.dto';
import { ProductModuleService } from '../product-module/product-module.service';
import { CreateProductDto } from '../product-module/dto/create-product.dto';
import { CurrencyCode, ProductType } from '@prisma/client';

@Injectable()
export class RagPrGeneratorService {
  private readonly logger = new Logger(RagPrGeneratorService.name);
  private readonly fptBaseUrl: string;
  private readonly fptApiKey: string;
  private readonly fptModel: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly embedding: EmbeddingService,
    private readonly configService: ConfigService,
    private readonly productService: ProductModuleService,
  ) {
    this.fptBaseUrl = this.configService.get<string>('FPT_AI_BASE_URL') ?? '';
    this.fptApiKey = this.configService.get<string>('FPT_AI_API_KEY') ?? '';
    this.fptModel =
      this.configService.get<string>('FPT_LLM_MODEL') ?? 'SaoLa4-medium';
  }

  async generatePrDraft(
    prompt: string,
    orgId: string,
    user?: any,
  ): Promise<PrDraftResponse> {
    try {
      // 1. Retrieve relevant data from RAG
      const queryVector = await this.embedding.embed(prompt);
      const vectorStr = `[${queryVector.join(',')}]`;

      // Query products, categories, suppliers from vector DB
      const chunks = await this.prisma.$queryRawUnsafe<any[]>(
        `
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
      `,
        vectorStr,
      );

      // ALWAYS search products directly from DB - this is the PRIMARY source
      let dbProducts: any[] = [];
      this.logger.log(`generatePrDraft orgId: ${orgId}`);
      if (orgId) {
        const searchTerms = prompt
          .toLowerCase()
          .split(/\s+/)
          .filter((w) => w.length > 2);
        this.logger.log(`Searching DB with terms: ${searchTerms.join(', ')}`);

        if (searchTerms.length > 0) {
          // Build OR conditions properly for Prisma
          const orConditions = searchTerms.flatMap((term) => [
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
        this.logger.log(`Found ${dbProducts.length} products from DB`);
      } else {
        this.logger.warn('No orgId provided, cannot search DB products');
      }

      // Also get products from RAG (vector search) as supplementary
      // const ragProductIds = new Set(
      //   chunks
      //     .filter((c) => c.source_table === 'products')
      //     .map((c) => c.source_id),
      // );

      // 2. Get cost centers and budget allocation for the org
      const costCenters = orgId
        ? await this.prisma.costCenter.findMany({
            where: { orgId },
            select: { id: true, name: true, code: true },
            take: 10,
          })
        : [];

      // 2b. Get budget allocations for user's department (to help AI choose cost center)
      const budgetAllocations =
        orgId && user?.deptId
          ? await this.prisma.budgetAllocation.findMany({
              where: {
                orgId,
                deptId: user.deptId,
                status: 'APPROVED',
                budgetPeriod: {
                  isActive: true,
                },
              },
              select: {
                id: true,
                budgetPeriodId: true,
                costCenterId: true,
                categoryId: true,
                allocatedAmount: true,
                spentAmount: true,
                committedAmount: true,
                costCenter: { select: { name: true, code: true } },
                category: { select: { name: true, id: true } },
                budgetPeriod: {
                  select: {
                    periodType: true,
                    fiscalYear: true,
                    periodNumber: true,
                  },
                },
              },
              take: 20,
            })
          : [];

      // 4. Determine price limit based on user role
      const priceLimit = this.getPriceLimitByRole(user?.role);
      this.logger.log(
        `User role: ${user?.role}, price limit: ${priceLimit.toLocaleString('vi-VN')} VND`,
      );

      // 5. Build context for LLM
      const { context, allProducts } = this.buildContext(
        chunks,
        costCenters,
        dbProducts,
        priceLimit,
        user,
        budgetAllocations,
      );

      // 4. Call LLM to generate PR
      const draftPr = await this.callLlmForPrGeneration(
        prompt,
        context,
        allProducts,
      );

      // 5. Process items without productId - create products from AI suggestions
      const processedItems = await this.processNewProducts(
        draftPr.items,
        orgId,
        // allProducts,
      );

      return {
        ...draftPr,
        items: processedItems,
        sources: [
          ...chunks
            .filter((c) => c.similarity > 0.6)
            .map((c) => ({
              table: c.source_table,
              id: c.source_id,
              name: c.metadata?.name || c.metadata?.productDesc || 'Unknown',
              similarity: parseFloat(Number(c.similarity).toFixed(3)),
            })),
          ...dbProducts.map((p) => ({
            table: 'products' as const,
            id: p.id,
            name: p.name,
            similarity: 0.5, // fallback similarity
          })),
        ],
      };
    } catch (error: any) {
      this.logger.error(`generatePrDraft error: ${error.message}`);
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

  /**
   * Process items without productId - search from AI knowledge and create products
   */
  private async processNewProducts(
    items: PrDraftItem[],
    orgId: string,
    // dbProducts: any[],
  ): Promise<PrDraftItem[]> {
    const processedItems: PrDraftItem[] = [];

    for (const item of items) {
      // If item already has productId from DB, keep it
      if (item.productId) {
        processedItems.push(item);
        continue;
      }

      this.logger.log(
        `Item "${item.productDesc}" has no productId, searching from AI...`,
      );

      // Try to find matching product in DB first (by name/description)
      const existingProduct = await this.findProductInDb(
        item.productDesc,
        orgId,
      );

      if (existingProduct) {
        this.logger.log(
          `Found existing product: ${existingProduct.name} (${existingProduct.id})`,
        );
        processedItems.push({
          ...item,
          productId: existingProduct.id,
          sku:
            item.sku ||
            existingProduct.sku ||
            this.generateSku(item.productDesc),
          categoryId: item.categoryId || existingProduct.categoryId,
        });
        continue;
      }

      // If not found in DB, search from AI knowledge (simulating internet search)
      const aiProductInfo = await this.searchProductFromAI(item.productDesc);

      if (aiProductInfo) {
        this.logger.log(`AI found product info for: ${item.productDesc}`);

        // Find or create category
        const category = await this.findOrCreateCategory(
          aiProductInfo.categoryName || 'Tổng hợp',
          aiProductInfo.categoryCode || 'MISC',
          orgId,
        );

        // Create new product in database
        const newProduct = await this.createProductFromAI({
          name: aiProductInfo.name || item.productDesc,
          description: aiProductInfo.description || item.productDesc,
          sku: aiProductInfo.sku || this.generateSku(item.productDesc),
          unitPriceRef: item.estimatedPrice,
          categoryId: category.id,
          orgId,
          unit: item.unit || 'PCS',
          currency: item.currency as CurrencyCode,
          type: ProductType.NON_CATALOG,
          attributes: aiProductInfo.attributes || {},
        });

        this.logger.log(
          `Created new product: ${newProduct.name} (${newProduct.id})`,
        );

        processedItems.push({
          ...item,
          productId: newProduct.id,
          sku: newProduct.sku,
          categoryId: category.id,
        });
      } else {
        // If AI couldn't find info, create product with available info
        this.logger.log(
          `AI couldn't find product info, creating with basic info...`,
        );

        const category = await this.findOrCreateCategory(
          'Tổng hợp',
          'MISC',
          orgId,
        );

        const newProduct = await this.createProductFromAI({
          name: item.productDesc,
          description: item.specNote || item.productDesc,
          sku: item.sku || this.generateSku(item.productDesc),
          unitPriceRef: item.estimatedPrice,
          categoryId: category.id,
          orgId,
          unit: item.unit || 'PCS',
          currency: item.currency as CurrencyCode,
          type: ProductType.NON_CATALOG,
        });

        processedItems.push({
          ...item,
          productId: newProduct.id,
          sku: newProduct.sku,
          categoryId: category.id,
        });
      }
    }

    return processedItems;
  }

  /**
   * Find product in database by name or description
   */
  private async findProductInDb(
    productDesc: string,
    orgId: string,
    // eslint-disable-next-line @typescript-eslint/no-redundant-type-constituents
  ): Promise<any | null> {
    const searchTerms = productDesc
      .toLowerCase()
      .split(/\s+/)
      .filter((w) => w.length > 2);

    if (searchTerms.length === 0) return null;

    const products = await this.prisma.product.findMany({
      where: {
        orgId,
        OR: searchTerms.flatMap((term) => [
          { name: { contains: term, mode: 'insensitive' } },
          { description: { contains: term, mode: 'insensitive' } },
        ]),
      },
      select: {
        id: true,
        name: true,
        sku: true,
        categoryId: true,
        category: { select: { id: true, name: true } },
      },
      take: 5,
    });

    // Return the first match or null
    return products.length > 0 ? products[0] : null;
  }

  /**
   * Search product information from AI knowledge (simulating internet search)
   */
  private async searchProductFromAI(productDesc: string): Promise<{
    name: string;
    description: string;
    sku: string;
    categoryName: string;
    categoryCode: string;
    attributes?: Record<string, any>;
  } | null> {
    try {
      const systemPrompt = `Bạn là AI Product Researcher. Nhiệm vụ của bạn là tìm kiếm thông tin sản phẩm từ kiến thức của bạn (như tìm kiếm trên internet).

Hãy trả về thông tin chi tiết về sản phẩm theo định dạng JSON:
{
  "name": "Tên sản phẩm chuẩn",
  "description": "Mô tả chi tiết sản phẩm",
  "sku": "Mã SKU đề xuất (tối đa 50 ký tự, không dấu, viết hoa, dùng gạch ngang)",
  "categoryName": "Tên danh mục sản phẩm phù hợp",
  "categoryCode": "Mã danh mục (viết tắt, không dấu, viết hoa, 2-10 ký tự)",
  "attributes": {
    "brand": "Thương hiệu nếu có",
    "model": "Model nếu có",
    "specs": "Thông số kỹ thuật"
  }
}

Lưu ý:
- Nếu là laptop: gợi ý thương hiệu, model, cấu hình
- Nếu là văn phòng phẩm: gợi ý thương hiệu, quy cách
- Nếu là thiết bị: gợi ý thông số kỹ thuật
- SKU phải là duy nhất, format: TỪ-KHÓA-CHÍNH-SỐ
- CategoryCode ngắn gọn: IT, OFFICE, STATIONERY, EQUIPMENT, etc.`;

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
              content: `Tìm thông tin sản phẩm: "${productDesc}"`,
            },
          ],
          streaming: false,
          temperature: 0.3,
          max_tokens: 1000,
        }),
      });

      if (!response.ok) {
        this.logger.error(`AI search HTTP error: ${response.status}`);
        return null;
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content ?? '';

      // Parse JSON response
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      const jsonStr = jsonMatch ? jsonMatch[0] : content;
      const parsed = JSON.parse(jsonStr);

      return {
        name: parsed.name || productDesc,
        description: parsed.description || productDesc,
        sku: parsed.sku || this.generateSku(productDesc),
        categoryName: parsed.categoryName || 'Tổng hợp',
        categoryCode: parsed.categoryCode || 'MISC',
        attributes: parsed.attributes || {},
      };
    } catch (error) {
      this.logger.error(
        `searchProductFromAI error: ${error instanceof Error ? error.message : String(error)}`,
      );
      return null;
    }
  }

  /**
   * Find or create category
   */
  private async findOrCreateCategory(
    categoryName: string,
    categoryCode: string,
    orgId: string,
  ): Promise<{ id: string; name: string; code: string }> {
    // Try to find existing category by name
    const existingCategory = await this.prisma.productCategory.findFirst({
      where: {
        orgId,
        OR: [
          { name: { contains: categoryName, mode: 'insensitive' } },
          { code: categoryCode },
        ],
      },
    });

    if (existingCategory) {
      return existingCategory;
    }

    // Create new category
    const newCategory = await this.prisma.productCategory.create({
      data: {
        name: categoryName,
        code: categoryCode,
        orgId,
        isActive: true,
      },
    });

    this.logger.log(
      `Created new category: ${newCategory.name} (${newCategory.id})`,
    );

    return newCategory;
  }

  /**
   * Create product from AI information
   */
  private async createProductFromAI(data: {
    name: string;
    description: string;
    sku: string;
    unitPriceRef: number;
    categoryId: string;
    orgId: string;
    unit: string;
    currency: CurrencyCode;
    type: ProductType;
    attributes?: Record<string, any>;
  }) {
    const createDto: CreateProductDto = {
      name: data.name,
      description: data.description,
      sku: data.sku,
      categoryId: data.categoryId,
      orgId: data.orgId,
      unit: data.unit,
      unitPriceRef: data.unitPriceRef,
      currency: data.currency,
      type: data.type,
      attributes: data.attributes,
      isActive: true,
    };

    return this.productService.createProduct(createDto);
  }

  /**
   * Generate SKU from product description
   */
  private generateSku(productDesc: string): string {
    // Remove special characters and convert to uppercase
    const cleanDesc = productDesc
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Remove diacritics
      .replace(/[^a-zA-Z0-9\s]/g, '') // Remove special chars
      .toUpperCase()
      .trim();

    // Get first 3 words or less
    const words = cleanDesc.split(/\s+/).slice(0, 3);

    // Create SKU: first 3 letters of each word + random number
    const prefix = words.map((w) => w.slice(0, 3)).join('-');
    const randomNum = Math.floor(1000 + Math.random() * 9000);

    return `${prefix}-${randomNum}`;
  }

  private getPriceLimitByRole(role?: string): number {
    const limits: Record<string, number> = {
      REQUESTER: 10000000, // 10 triệu
      EMPLOYEE: 10000000, // 10 triệu
      USER: 10000000, // 10 triệu
      MANAGER: 30000000, // 30 triệu (Trưởng phòng)
      DEPARTMENT_HEAD: 30000000, // 30 triệu
      DIRECTOR: 100000000, // 100 triệu (Giám đốc)
      CEO: Infinity, // Không giới hạn
      ADMIN: Infinity, // Không giới hạn
    };
    return limits[role?.toUpperCase() || ''] || 10000000; // Default 10M
  }

  private buildContext(
    chunks: any[],
    costCenters: any[],
    additionalProducts: any[] = [],
    priceLimit: number = 10000000,
    user?: any,
    budgetAllocations: any[] = [],
  ): { context: string; allProducts: any[] } {
    const ragProducts = chunks.filter((c) => c.source_table === 'products');
    // Merge RAG products with additional DB products, avoid duplicates
    const seenIds = new Set(ragProducts.map((p) => p.source_id));
    const dbProducts = additionalProducts.filter((p) => !seenIds.has(p.id));
    const allProducts = [
      ...ragProducts,
      ...dbProducts.map((p) => ({
        source_id: p.id,
        metadata: {
          name: p.name,
          description: p.description,
          sku: p.sku,
          categoryName: p.category?.name,
          categoryId: p.categoryId,
        },
      })),
    ];

    const categories = chunks.filter(
      (c) => c.source_table === 'product_categories',
    );
    const suppliers = chunks.filter((c) => c.source_table === 'organizations');

    const context = `
## PRODUCTS (Sản phẩm có trong hệ thống):
${
  allProducts
    .map((p, i) => {
      const meta = p.metadata || {};
      return `${i + 1}. ${meta.name || 'N/A'} (ID: ${p.source_id})
   - Mô tả: ${meta.description || 'N/A'}
   - SKU: ${meta.sku || 'N/A'}
   - Danh mục: ${meta.categoryName || 'N/A'}
   - Danh mục ID: ${meta.categoryId || 'N/A'}
   - Giá tham khảo: ${meta.price || 'N/A'}`;
    })
    .join('\n') || 'Không có sản phẩm phù hợp'
}

## CATEGORIES (Danh mục sản phẩm):
${
  categories
    .map((c, i) => {
      const meta = c.metadata || {};
      return `${i + 1}. ${meta.name || 'N/A'} (ID: ${c.source_id})`;
    })
    .join('\n') || 'Không có danh mục phù hợp'
}

## SUPPLIERS (Nhà cung cấp):
${
  suppliers
    .map((s, i) => {
      const meta = s.metadata || {};
      return `${i + 1}. ${meta.name || 'N/A'} (ID: ${s.source_id})
   - Loại: ${meta.companyType || 'N/A'}
   - Tier: ${meta.supplierTier || 'N/A'}`;
    })
    .join('\n') || 'Không có nhà cung cấp phù hợp'
}

## COST CENTERS (Trung tâm chi phí hiện có):
${costCenters.map((c, i) => `${i + 1}. ${c.name} (ID: ${c.id}, Code: ${c.code})`).join('\n') || 'Không có cost center'}

## BUDGET ALLOCATIONS (Ngân sách đã cấp phát theo danh mục - CHỈ được dùng các cost center có ngân sách phù hợp):
${
  budgetAllocations
    .map((b, i) => {
      const available =
        Number(b.allocatedAmount) -
        Number(b.spentAmount) -
        Number(b.committedAmount);
      return `${i + 1}. Cost Center: ${b.costCenter?.name || 'N/A'} (${b.costCenter?.code || 'N/A'})
   - Cost Center ID: ${b.costCenterId}
   - Danh mục: ${b.category?.name || 'Ngân sách chung (không có danh mục)'}
   - Category ID: ${b.categoryId || 'N/A'}
   - Ngân sách còn lại: ${available.toLocaleString('vi-VN')} VND
   - Kỳ ngân sách: ${b.budgetPeriod?.periodType || 'N/A'} ${b.budgetPeriod?.fiscalYear || ''} (P${b.budgetPeriod?.periodNumber || 'N/A'})`;
    })
    .join('\n') || 'Không có ngân sách nào được phân bổ'
}

## USER INFO (Thông tin người tạo PR):
- Role: ${user?.role || 'REQUESTER'}
- Email: ${user?.email || 'N/A'}

## PRICE LIMIT (Giới hạn giá PR theo chức vụ):
- **TỐI ĐA cho PR này**: ${priceLimit === Infinity ? 'Không giới hạn' : priceLimit.toLocaleString('vi-VN') + ' VND'}
- Vai trò: ${user?.role || 'REQUESTER'}
- Lưu ý: PR vượt quá giới hạn sẽ bị từ chối bởi hệ thống
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
5. **GIỚI HẠN GIÁ THEO CHỨC VỤ**: Tổng giá trị PR (totalEstimate) KHÔNG ĐƯỢC VƯỢT QUÁ giới hạn trong PRICE LIMIT:
   - REQUESTER/EMPLOYEE: Tối đa 10 triệu VND
   - MANAGER/DEPARTMENT_HEAD: Tối đa 30 triệu VND
   - DIRECTOR: Tối đa 100 triệu VND
   - CEO/ADMIN: Không giới hạn
6. Nếu yêu cầu của user vượt quá giới hạn, AI PHẢI:
   - Điều chỉnh số lượng xuống để phù hợp giới hạn
   - HOẶC đề xuất sản phẩm thay thế rẻ hơn
   - GIẢI THÍCH rõ trong reasoning tại sao phải điều chỉnh
7. **QUAN TRỌNG - NGÂN SÁCH THEO DANH MỤC**:
   - Trong BUDGET ALLOCATIONS có liệt kê ngân sách theo từng Cost Center + Danh mục
   - PHẢI chọn Cost Center có ngân sách phù hợp với danh mục sản phẩm
   - Ví dụ: Mua laptop (IT) → Chọn Cost Center có BUDGET ALLOCATION với danh mục IT
   - Nếu không có ngân sách cho danh mục cụ thể, chọn Cost Center có "Ngân sách chung"
   - Kiểm tra "Ngân sách còn lại" để đảm bảo đủ cho PR này
   - Trả về suggestedCostCenterId và suggestedCostCenterName từ BUDGET ALLOCATIONS

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
      const validatedItems = (parsed.items || []).map(
        (item: any, idx: number) => {
          // If AI returned productId but missing sku/category, try to find from context
          if (item.productId && (!item.sku || !item.categoryId)) {
            const contextProduct = allProducts.find(
              (p) => p.source_id === item.productId,
            );
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
        },
      );

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
    } catch (e: any) {
      this.logger.error(`Failed to parse LLM response: ${e.message}`);
      throw new Error('Invalid LLM response format');
    }
  }

  private getDefaultRequiredDate(): string {
    const date = new Date();
    date.setDate(date.getDate() + 14);
    return date.toISOString().split('T')[0];
  }
}
