import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProductCategoryDto } from './dto/create-product-category.dto';
import { UpdateProductCategoryDto } from './dto/update-product-category.dto';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { Product, ProductCategory } from '@prisma/client';
import { AiService } from '../ai-service/ai-service.service';

@Injectable()
export class ProductModuleRepository {
  constructor(
    private readonly prisma: PrismaService,
    private readonly aiService: AiService,
  ) {}

  private isValidUUID(id: string): boolean {
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return uuidRegex.test(id);
  }

  // --- Product Category Methods ---

  async createCategory(
    data: CreateProductCategoryDto,
  ): Promise<ProductCategory> {
    return this.prisma.productCategory.create({ data });
  }

  async findAllCategories(): Promise<ProductCategory[]> {
    return this.prisma.productCategory.findMany({
      include: { children: true },
    });
  }

  async findCategoryById(id: string): Promise<ProductCategory | null> {
    if (!this.isValidUUID(id)) return null;
    return this.prisma.productCategory.findUnique({
      where: { id },
      include: { children: true, products: true },
    });
  }

  async updateCategory(
    id: string,
    data: UpdateProductCategoryDto,
  ): Promise<ProductCategory> {
    if (!this.isValidUUID(id)) throw new Error('Invalid UUID');
    return this.prisma.productCategory.update({
      where: { id },
      data,
    });
  }

  async removeCategory(id: string): Promise<ProductCategory> {
    if (!this.isValidUUID(id)) throw new Error('Invalid UUID');
    return this.prisma.productCategory.delete({
      where: { id },
    });
  }

  // --- Product Methods ---

  async createProduct(data: CreateProductDto): Promise<Product> {
    return this.prisma.product.create({ data });
  }

  async findAllProducts(): Promise<Product[]> {
    return this.prisma.product.findMany({
      include: { category: true },
    });
  }

  async findProductById(id: string): Promise<Product | null> {
    if (!this.isValidUUID(id)) return null;
    return this.prisma.product.findUnique({
      where: { id },
      include: { category: true },
    });
  }

  async updateProduct(id: string, data: UpdateProductDto): Promise<Product> {
    if (!this.isValidUUID(id)) throw new Error('Invalid UUID');
    return this.prisma.product.update({
      where: { id },
      data,
    });
  }

  async removeProduct(id: string): Promise<Product> {
    if (!this.isValidUUID(id)) throw new Error('Invalid UUID');
    return this.prisma.product.delete({
      where: { id },
    });
  }

  // async smartSearchProducts(text: string) {
  //   // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  //   const queryVector = await this.aiService.getEmbedding(text);

  //   const results = await this.prisma.$queryRaw`
  //     SELECT id, name, description,
  //            (1 - (embedding <=> ${queryVector}::vector)) AS similarity
  //     FROM "Product"
  //     WHERE embedding IS NOT NULL
  //     ORDER BY embedding <=> ${queryVector}::vector ASC
  //     LIMIT 5;
  //   `;

  //   return results;
  // }

  async responsetest() {
    // Giả sử service AI có hàm này, nếu không bạn hãy xóa đi
    if (typeof this.aiService['responsetest'] === 'function') {
      return this.aiService['responsetest']();
    }
    return { message: 'responsetest method not found in AiService' };
  }
}
