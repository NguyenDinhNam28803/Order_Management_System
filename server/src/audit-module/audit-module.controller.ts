import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Request,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth-module/jwt-auth.guard';
import { JwtPayload } from '../auth-module/interfaces/jwt-payload.interface';
import { AuditModuleService } from './audit-module.service';
import { CreateAuditLogDto } from './dto/audit.dto';

@ApiTags('Audit Logs')
@Controller('audit-logs')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
export class AuditModuleController {
  constructor(private readonly auditService: AuditModuleService) {}

  /**
   * Tạo một bản ghi nhật ký kiểm tra mới (thường dùng nội bộ)
   * @param dto Dữ liệu nhật ký kiểm tra
   * @param req Thông tin người dùng từ JWT
   * @returns Bản ghi nhật ký vừa tạo
   */
  @Post()
  @ApiOperation({ summary: 'Tạo bản ghi nhật ký kiểm tra mới' })
  async create(
    @Body() dto: CreateAuditLogDto,
    @Request() req: { user: JwtPayload },
  ) {
    return this.auditService.create(dto, req.user);
  }

  /**
   * Lấy danh sách nhật ký kiểm tra có phân trang
   * @param page Trang hiện tại
   * @param limit Số lượng log mỗi trang
   * @param req Thông tin người dùng
   */
  @Get('paginated')
  @ApiOperation({ summary: 'Lấy nhật ký kiểm tra theo phân trang' })
  async findPaginated(
    @Query('page') page = 1,
    @Query('limit') limit = 20,
    @Request() req: { user: JwtPayload },
  ) {
    const skip = (Number(page) - 1) * Number(limit);
    const take = Number(limit);
    const data = await this.auditService.findPaginated(req.user, skip, take);
    const total = await this.auditService.count(req.user);
    return { data, total, page: Number(page), limit: Number(limit) };
  }

  /**
   * Lấy tất cả các nhật ký kiểm tra cho tổ chức hiện tại (vẫn giữ để tránh breaking change)
   */
  @Get()
  @ApiOperation({ summary: 'Lấy tất cả nhật ký kiểm tra của tổ chức' })
  async findAll(@Request() req: { user: JwtPayload }) {
    return this.auditService.findAll(req.user);
  }

  /**
   * Lấy nhật ký kiểm tra theo loại thực thể và ID thực thể
   * @param type Loại thực thể (ví dụ: 'Order', 'User')
   * @param id ID của thực thể
   * @returns Danh sách nhật ký kiểm tra liên quan
   */
  @Get('entity')
  @ApiOperation({ summary: 'Lấy nhật ký kiểm tra theo loại và ID thực thể' })
  async findByEntity(@Query('type') type: string, @Query('id') id: string) {
    return this.auditService.findByEntity(type, id);
  }

  /**
   * Lấy chi tiết một bản ghi nhật ký kiểm tra theo ID
   * @param id ID của bản ghi nhật ký
   * @returns Chi tiết bản ghi nhật ký
   */
  @Get(':id')
  @ApiOperation({ summary: 'Lấy chi tiết nhật ký kiểm tra theo ID' })
  async findOne(@Param('id') id: string) {
    // Controller handles ID as string from URL, service handles it as number|bigint
    return this.auditService.findOne(BigInt(id));
  }
}
