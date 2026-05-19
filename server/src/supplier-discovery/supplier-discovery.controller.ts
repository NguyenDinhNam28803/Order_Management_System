import {
  Controller,
  Post,
  Get,
  Body,
  UseGuards,
  Req,
  ForbiddenException,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth-module/jwt-auth.guard';
import { SupplierDiscoveryService } from './supplier-discovery.service';
import {
  DiscoverSupplierDto,
  EnrichSupplierDto,
  ImportSupplierDto,
} from './dto/discover-supplier.dto';

const ALLOWED_ROLES = [
  'PROCUREMENT',
  'ADMIN',
  'DIRECTOR',
  'CEO',
  'PLATFORM_ADMIN',
];
import { JwtPayload } from '../auth-module/interfaces/jwt-payload.interface';

@ApiTags('Supplier Discovery')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@Controller('supplier-discovery')
export class SupplierDiscoveryController {
  constructor(private readonly service: SupplierDiscoveryService) {}

  private checkRole(req: { user?: JwtPayload }) {
    const role = req.user?.role as string;
    if (!ALLOWED_ROLES.includes(role)) {
      throw new ForbiddenException(
        'Chức năng này chỉ dành cho PROCUREMENT / ADMIN / DIRECTOR / CEO',
      );
    }
  }

  @Post('search')
  @ApiOperation({
    summary: 'Tìm kiếm nhà cung cấp từ nguồn bên ngoài (AI + Web)',
  })
  async search(@Body() dto: DiscoverSupplierDto, @Req() req: any) {
    this.checkRole(req);
    return this.service.search(dto);
  }

  @Post('enrich')
  @ApiOperation({ summary: 'Crawl chi tiết một URL nhà cung cấp' })
  async enrich(@Body() dto: EnrichSupplierDto, @Req() req: any) {
    this.checkRole(req);
    return this.service.enrich(dto.url, dto.content);
  }

  @Post('import')
  @ApiOperation({ summary: 'Import nhà cung cấp mới vào hệ thống' })
  async import(@Body() dto: ImportSupplierDto, @Req() req: any) {
    this.checkRole(req);
    return this.service.importSupplier(dto);
  }

  @Get('categories')
  @ApiOperation({ summary: 'Lấy danh sách danh mục để populate form tìm kiếm' })
  async getCategories(@Req() req: any) {
    this.checkRole(req);
    return this.service.getCategories();
  }
}
