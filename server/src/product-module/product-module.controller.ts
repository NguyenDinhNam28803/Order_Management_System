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

  /**
   * Tạo một danh mục sản phẩm mới
   * @param createCategoryDto Dữ liệu tạo danh mục
   * @returns Danh mục vừa tạo
   */
  @Post('categories')
  @ApiOperation({
    summary: 'Tạo danh mục sản phẩm',
    description: 'Tạo một danh mục sản phẩm mới',
  })
  async createCategory(@Body() createCategoryDto: CreateProductCategoryDto) {
    return this.productService.createCategory(createCategoryDto);
  }

  /**
   * Lấy danh sách tất cả các danh mục sản phẩm hiện có
   * @returns Danh sách các danh mục
   */
  @Get('categories')
  @ApiOperation({
    summary: 'Lấy tất cả danh mục sản phẩm',
    description: 'Trả về danh sách tất cả danh mục sản phẩm',
  })
  async findAllCategories() {
    return this.productService.findAllCategories();
  }

  /**
   * Lấy thông tin chi tiết của một danh mục sản phẩm theo ID
   * @param id ID của danh mục
   * @returns Chi tiết danh mục
   */
  @Get('categories/:id')
  @ApiOperation({
    summary: 'Lấy danh mục sản phẩm theo ID',
    description: 'Trả về thông tin của một danh mục sản phẩm cụ thể',
  })
  async findCategoryById(@Param('id') id: string) {
    return this.productService.findCategoryById(id);
  }

  /**
   * Cập nhật thông tin của một danh mục sản phẩm theo ID
   * @param id ID của danh mục
   * @param updateCategoryDto Dữ liệu cập nhật
   * @returns Danh mục sau khi cập nhật
   */
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

  /**
   * Xóa một danh mục sản phẩm khỏi hệ thống theo ID
   * @param id ID của danh mục cần xóa
   * @returns Kết quả xóa
   */
  @Delete('categories/:id')
  @ApiOperation({
    summary: 'Xóa danh mục sản phẩm',
    description: 'Xóa một danh mục sản phẩm cụ thể',
  })
  async removeCategory(@Param('id') id: string) {
    return this.productService.removeCategory(id);
  }

  // --- Product Endpoints ---

  /**
   * Tạo một sản phẩm mới trong hệ thống
   * @param createProductDto Dữ liệu tạo sản phẩm
   * @returns Sản phẩm vừa tạo
   */
  @Post()
  @ApiOperation({
    summary: 'Tạo sản phẩm mới',
    description: 'Tạo một sản phẩm mới trong hệ thống',
  })
  async createProduct(@Body() createProductDto: CreateProductDto) {
    return this.productService.createProduct(createProductDto);
  }

  /**
   * Lấy danh sách tất cả các sản phẩm hiện có
   * @returns Danh sách sản phẩm
   */
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

  /**
   * Lấy thông tin chi tiết của một sản phẩm cụ thể theo ID
   * @param id ID của sản phẩm
   * @returns Chi tiết sản phẩm
   */
  @Get(':id')
  @ApiOperation({
    summary: 'Lấy sản phẩm theo ID',
    description: 'Trả về thông tin của một sản phẩm cụ thể',
  })
  async findProductById(@Param('id') id: string) {
    return this.productService.findProductById(id);
  }

  /**
   * Cập nhật thông tin của một sản phẩm theo ID
   * @param id ID của sản phẩm
   * @param updateProductDto Dữ liệu cập nhật
   * @returns Sản phẩm sau khi cập nhật
   */
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

  /**
   * Xóa một sản phẩm khỏi hệ thống theo ID
   * @param id ID của sản phẩm cần xóa
   * @returns Kết quả xóa
   */
  @Delete(':id')
  @ApiOperation({
    summary: 'Xóa sản phẩm',
    description: 'Xóa một sản phẩm cụ thể',
  })
  async removeProduct(@Param('id') id: string) {
    return this.productService.removeProduct(id);
  }
}
