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
import { PrmoduleService } from './prmodule.service';
import { CreatePrDto, CreatePrItemDto } from './dto/create-pr.dto';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth-module/jwt-auth.guard';
import type { JwtPayload } from '../auth-module/interfaces/jwt-payload.interface';

@ApiTags('Purchase Requisition (PR)')
@Controller('procurement-requests')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
export class PrmoduleController {
  constructor(private readonly prService: PrmoduleService) {}

  /**
   * Tạo một yêu cầu mua sắm (Purchase Requisition - PR) mới
   * @param createPrDto Dữ liệu yêu cầu mua sắm
   * @param req Thông tin người dùng từ JWT
   * @returns Yêu cầu mua sắm vừa tạo
   */
  @Post()
  @ApiOperation({
    summary: 'Tạo yêu cầu mua hàng mới',
    description: 'Tạo một yêu cầu mua hàng mới trong hệ thống',
  })
  async create(
    @Body() createPrDto: CreatePrDto,
    @Request() req: { user: JwtPayload },
  ) {
    return this.prService.create(createPrDto, req.user);
  }

  @Post('/ai-suggest')
  @ApiOperation({
    summary: 'AI gợi ý công ty theo sản phẩm',
    description: 'AI hệ thống chạy để tìm kiếm công ty và gợi ý',
  })
  async suggest(@Body() items: CreatePrItemDto[]) {
    return this.prService.AiSuggest(items);
  }
  @Get('paginated')
  @ApiOperation({ summary: 'Lấy PR có phân trang' })
  async findPaginated(
    @Query('page') page = 1,
    @Query('limit') limit = 20,
    @Request() req: { user: JwtPayload },
  ) {
    const skip = (Number(page) - 1) * Number(limit);
    const take = Number(limit);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const data = await this.prService.findPaginated(req.user.orgId, skip, take);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const total = await this.prService.count(req.user.orgId);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    return { data, total, page: Number(page), limit: Number(limit) };
  }

  /**
   * Lấy danh sách tất cả các yêu cầu mua sắm của tổ chức hiện tại
   * @param req Thông tin người dùng để lọc theo tổ chức
   * @returns Danh sách các yêu cầu mua sắm
   */
  @Get()
  @ApiOperation({
    summary: 'Lấy tất cả yêu cầu mua hàng',
    description:
      'Trả về danh sách tất cả yêu cầu mua hàng của tổ chức hiện tại',
  })
  async findAll(@Request() req: { user: JwtPayload }) {
    return this.prService.findAll(req.user);
  }

  /**
   * Lấy danh sách các yêu cầu mua sắm do chính người dùng hiện tại tạo ra
   * @param req Thông tin người dùng hiện tại
   * @returns Danh sách PR cá nhân
   */
  @Get('my')
  @ApiOperation({
    summary: 'Lấy yêu cầu mua hàng của tôi',
    description: 'Trả về danh sách yêu cầu mua hàng của người dùng hiện tại',
  })
  async findMyPrs(@Request() req: { user: JwtPayload }) {
    return this.prService.findMyPrs(req.user.sub);
  }

  /**
   * Lấy thông tin chi tiết của một yêu cầu mua sắm theo ID
   * @param id ID của yêu cầu mua sắm
   * @returns Chi tiết PR
   */
  @Get(':id')
  @ApiOperation({
    summary: 'Lấy chi tiết yêu cầu mua hàng theo ID',
    description: 'Trả về thông tin chi tiết của một yêu cầu mua hàng cụ thể',
  })
  async findOne(@Param('id') id: string) {
    return this.prService.findOne(id);
  }

  /**
   * Gửi yêu cầu mua sắm để bắt đầu quy trình phê duyệt
   * @param id ID của yêu cầu mua sắm cần gửi duyệt
   * @returns Trạng thái PR sau khi gửi duyệt
   */
  @Post(':id/submit')
  @ApiOperation({
    summary: 'Gửi PR đi duyệt',
    description: 'Chuyển trạng thái PR từ DRAFT sang PENDING_APPROVAL',
  })
  async submit(@Param('id') id: string, @Body() user: JwtPayload) {
    return this.prService.submit(id, user);
  }
}
