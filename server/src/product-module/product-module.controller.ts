import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { ProductModuleService } from './product-module.service';
import { CreateProductCategoryDto } from './dto/create-product-category.dto';
import { UpdateProductCategoryDto } from './dto/update-product-category.dto';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ApiBearerAuth, ApiTags, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth-module/jwt-auth.guard';

@ApiTags('Product Management')
@Controller('products')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
export class ProductModuleController {
  constructor(private readonly productService: ProductModuleService) {}

  // --- Category Endpoints ---

  @Post('categories')
  @ApiOperation({
    summary: 'Tạo danh mục sản phẩm',
    description: 'Tạo một danh mục sản phẩm mới',
  })
  async createCategory(@Body() createCategoryDto: CreateProductCategoryDto) {
    return this.productService.createCategory(createCategoryDto);
  }

  @Get('categories')
  @ApiOperation({
    summary: 'Lấy tất cả danh mục sản phẩm',
    description: 'Trả về danh sách tất cả danh mục sản phẩm',
  })
  async findAllCategories() {
    return this.productService.findAllCategories();
  }

  @Get('categories/:id')
  @ApiOperation({
    summary: 'Lấy danh mục sản phẩm theo ID',
    description: 'Trả về thông tin của một danh mục sản phẩm cụ thể',
  })
  async findCategoryById(@Param('id') id: string) {
    return this.productService.findCategoryById(id);
  }

  @Patch('categories/:id')
  @ApiOperation({
    summary: 'Cập nhật danh mục sản phẩm',
    description: 'Cập nhật thông tin của một danh mục sản phẩm cụ thể',
  })
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard)
  async updateCategory(
    @Param('id') id: string,
    @Body() updateCategoryDto: UpdateProductCategoryDto,
  ) {
    return this.productService.updateCategory(id, updateCategoryDto);
  }

  @Delete('categories/:id')
  @ApiOperation({
    summary: 'Xóa danh mục sản phẩm',
    description: 'Xóa một danh mục sản phẩm cụ thể',
  })
  async removeCategory(@Param('id') id: string) {
    return this.productService.removeCategory(id);
  }

  // --- Product Endpoints ---

  @Post()
  @ApiOperation({
    summary: 'Tạo sản phẩm mới',
    description: 'Tạo một sản phẩm mới trong hệ thống',
  })
  async createProduct(@Body() createProductDto: CreateProductDto) {
    return this.productService.createProduct(createProductDto);
  }

  @Get()
  @ApiOperation({
    summary: 'Lấy tất cả sản phẩm',
    description: 'Trả về danh sách tất cả sản phẩm',
  })
  async findAllProducts() {
    return this.productService.findAllProducts();
  }

  // // CÁC ROUTE CỐ ĐỊNH PHẢI ĐẶT TRƯỚC :id
  // @Get('search/smart')
  // @ApiOperation({ summary: 'Smart search products by text query' })
  // async smartSearchProducts(@Query('query') query: string) {
  //   return this.productService.smartSearchProducts(query);
  // }

  @Get(':id')
  @ApiOperation({
    summary: 'Lấy sản phẩm theo ID',
    description: 'Trả về thông tin của một sản phẩm cụ thể',
  })
  async findProductById(@Param('id') id: string) {
    return this.productService.findProductById(id);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Cập nhật sản phẩm',
    description: 'Cập nhật thông tin của một sản phẩm cụ thể',
  })
  async updateProduct(
    @Param('id') id: string,
    @Body() updateProductDto: UpdateProductDto,
  ) {
    return this.productService.updateProduct(id, updateProductDto);
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Xóa sản phẩm',
    description: 'Xóa một sản phẩm cụ thể',
  })
  async removeProduct(@Param('id') id: string) {
    return this.productService.removeProduct(id);
  }
}
