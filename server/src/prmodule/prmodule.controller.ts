import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { PrmoduleService } from './prmodule.service';
import { CreatePrDto } from './dto/create-pr.dto';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth-module/jwt-auth.guard';
import { JwtPayload } from '../auth-module/interfaces/jwt-payload.interface';

@ApiTags('Purchase Requisition (PR)')
@Controller('pr')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
export class PrmoduleController {
  constructor(private readonly prService: PrmoduleService) {}

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

  @Get()
  @ApiOperation({
    summary: 'Lấy tất cả yêu cầu mua hàng',
    description:
      'Trả về danh sách tất cả yêu cầu mua hàng của tổ chức hiện tại',
  })
  async findAll(@Request() req: { user: JwtPayload }) {
    return this.prService.findAll(req.user);
  }

  @Get('my')
  @ApiOperation({
    summary: 'Lấy yêu cầu mua hàng của tôi',
    description: 'Trả về danh sách yêu cầu mua hàng của người dùng hiện tại',
  })
  async findMyPrs(@Request() req: { user: JwtPayload }) {
    return this.prService.findMyPrs(req.user.sub);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Lấy chi tiết yêu cầu mua hàng theo ID',
    description: 'Trả về thông tin chi tiết của một yêu cầu mua hàng cụ thể',
  })
  async findOne(@Param('id') id: string) {
    return this.prService.findOne(id);
  }

  @Post(':id/submit')
  @ApiOperation({
    summary: 'Gửi yêu cầu mua hàng để phê duyệt',
    description: 'Gửi yêu cầu mua hàng đang ở trạng thái nháp để chờ phê duyệt',
  })
  async submit(@Param('id') id: string) {
    return this.prService.submit(id);
  }
}
