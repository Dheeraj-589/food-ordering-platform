import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { ProductsService } from './products.service';
import { Product, ProductCategory } from './entities/product.entity';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';

@ApiTags('Products')
@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get()
  @ApiOperation({ summary: 'Retrieve available products list' })
  @ApiQuery({ name: 'category', required: false, enum: ProductCategory })
  @ApiResponse({ status: 200, description: 'Products catalog returned.' })
  async findAll(@Query('category') category?: ProductCategory) {
    return this.productsService.findAll(category);
  }

  @Get('categories')
  @ApiOperation({ summary: 'Retrieve active menu categories list' })
  @ApiResponse({ status: 200, description: 'Categories list returned.' })
  async findCategories() {
    return this.productsService.findCategories();
  }

  @Get('coupons')
  @ApiOperation({ summary: 'Retrieve active public coupons list' })
  @ApiResponse({ status: 200, description: 'Coupons list returned.' })
  async findCoupons() {
    return this.productsService.findCoupons();
  }

  @Get('cms')
  @ApiOperation({ summary: 'Retrieve layouts CMS banners strings' })
  @ApiResponse({ status: 200, description: 'CMS layouts returned.' })
  async getPublicCms() {
    return this.productsService.getPublicCms();
  }

  @Get('settings')
  @ApiOperation({ summary: 'Retrieve public system settings' })
  @ApiResponse({ status: 200, description: 'Public system settings returned.' })
  async getPublicSettings() {
    return this.productsService.getPublicSettings();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Retrieve specific product detail by ID' })
  @ApiResponse({ status: 200, description: 'Product detail returned.' })
  @ApiResponse({ status: 404, description: 'Product not found.' })
  async findById(@Param('id', ParseIntPipe) id: number) {
    return this.productsService.findById(id);
  }

  @Get('slug/:slug')
  @ApiOperation({ summary: 'Retrieve specific product detail by slug' })
  @ApiResponse({ status: 200, description: 'Product detail returned.' })
  @ApiResponse({ status: 404, description: 'Product not found.' })
  async findBySlug(@Param('slug') slug: string) {
    return this.productsService.findBySlug(slug);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create new catalog item (Admin only)' })
  @ApiResponse({ status: 201, description: 'Product created.' })
  @ApiResponse({ status: 401, description: 'Unauthorized request.' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden access (requires admin).',
  })
  async create(@Body() productData: Partial<Product>) {
    return this.productsService.create(productData);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update catalog item (Admin only)' })
  @ApiResponse({ status: 200, description: 'Product updated.' })
  @ApiResponse({ status: 404, description: 'Product not found.' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() productData: Partial<Product>,
  ) {
    return this.productsService.update(id, productData);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Remove item from catalog (Admin only)' })
  @ApiResponse({ status: 200, description: 'Product removed.' })
  @ApiResponse({ status: 404, description: 'Product not found.' })
  async remove(@Param('id', ParseIntPipe) id: number) {
    return this.productsService.remove(id);
  }
}
