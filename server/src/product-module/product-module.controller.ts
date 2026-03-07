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
export class ProductModuleController {
  constructor(private readonly productService: ProductModuleService) {}

  // --- Category Endpoints ---

  @Post('categories')
  @ApiOperation({ summary: 'Create a new product category' })
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard)
  async createCategory(@Body() createCategoryDto: CreateProductCategoryDto) {
    return this.productService.createCategory(createCategoryDto);
  }

  @Get('categories')
  @ApiOperation({ summary: 'Get all product categories' })
  async findAllCategories() {
    return this.productService.findAllCategories();
  }

  @Get('categories/:id')
  @ApiOperation({ summary: 'Get a product category by ID' })
  async findCategoryById(@Param('id') id: string) {
    return this.productService.findCategoryById(id);
  }

  @Patch('categories/:id')
  @ApiOperation({ summary: 'Update a product category' })
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard)
  async updateCategory(
    @Param('id') id: string,
    @Body() updateCategoryDto: UpdateProductCategoryDto,
  ) {
    return this.productService.updateCategory(id, updateCategoryDto);
  }

  @Delete('categories/:id')
  @ApiOperation({ summary: 'Delete a product category' })
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard)
  async removeCategory(@Param('id') id: string) {
    return this.productService.removeCategory(id);
  }

  // --- Product Endpoints ---

  @Post()
  @ApiOperation({ summary: 'Create a new product' })
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard)
  async createProduct(@Body() createProductDto: CreateProductDto) {
    return this.productService.createProduct(createProductDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all products' })
  async findAllProducts() {
    return this.productService.findAllProducts();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a product by ID' })
  async findProductById(@Param('id') id: string) {
    return this.productService.findProductById(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a product' })
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard)
  async updateProduct(
    @Param('id') id: string,
    @Body() updateProductDto: UpdateProductDto,
  ) {
    return this.productService.updateProduct(id, updateProductDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a product' })
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard)
  async removeProduct(@Param('id') id: string) {
    return this.productService.removeProduct(id);
  }
}
