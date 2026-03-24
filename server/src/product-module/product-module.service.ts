import { Injectable, NotFoundException } from '@nestjs/common';
import { ProductModuleRepository } from './product-module.repository';
import { CreateProductCategoryDto } from './dto/create-product-category.dto';
import { UpdateProductCategoryDto } from './dto/update-product-category.dto';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { Product, ProductCategory } from '@prisma/client';

@Injectable()
export class ProductModuleService {
  constructor(private readonly repository: ProductModuleRepository) {}

  // --- Product Category Service Methods ---

  async createCategory(
    createProductCategoryDto: CreateProductCategoryDto,
  ): Promise<ProductCategory> {
    return this.repository.createCategory(createProductCategoryDto);
  }

  async findAllCategories(): Promise<ProductCategory[]> {
    return this.repository.findAllCategories();
  }

  async findCategoryById(id: string): Promise<ProductCategory> {
    const category = await this.repository.findCategoryById(id);
    if (!category) {
      throw new NotFoundException(`Product category with ID ${id} not found`);
    }
    return category;
  }

  async updateCategory(
    id: string,
    updateProductCategoryDto: UpdateProductCategoryDto,
  ): Promise<ProductCategory> {
    await this.findCategoryById(id);
    return this.repository.updateCategory(id, updateProductCategoryDto);
  }

  async removeCategory(id: string): Promise<ProductCategory> {
    await this.findCategoryById(id);
    return this.repository.removeCategory(id);
  }

  // --- Product Service Methods ---

  async createProduct(createProductDto: CreateProductDto): Promise<Product> {
    return this.repository.createProduct(createProductDto);
  }

  async findAllProducts(): Promise<Product[]> {
    return this.repository.findAllProducts();
  }

  async findProductById(id: string): Promise<Product> {
    const product = await this.repository.findProductById(id);
    if (!product) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }
    return product;
  }

  async updateProduct(
    id: string,
    updateProductDto: UpdateProductDto,
  ): Promise<Product> {
    await this.findProductById(id);
    return this.repository.updateProduct(id, updateProductDto);
  }

  async removeProduct(id: string): Promise<Product> {
    await this.findProductById(id);
    return this.repository.removeProduct(id);
  }

  // // --- Smart Search Method ---
  // async smartSearchProducts(text: string) {
  //   return this.repository.smartSearchProducts(text);
  // }

  // --- AI Service Test Method ---
  async responsetest() {
    return this.repository.responsetest();
  }
}
