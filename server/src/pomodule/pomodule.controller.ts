import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Request,
  Put,
} from '@nestjs/common';
import { PomoduleService } from './pomodule.service';
import { CreatePoDto } from './dto/create-po.dto';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth-module/jwt-auth.guard';

@ApiTags('Purchase Order (PO)')
@Controller('po')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
export class PomoduleController {
  constructor(private readonly poService: PomoduleService) {}

  @Post()
  @ApiOperation({
    summary: 'Tạo đơn hàng mới từ báo giá đã được chấp nhận',
    description: 'Tạo một đơn hàng mới từ một báo giá đã được chấp nhận',
  })
  create(@Body() createPoDto: CreatePoDto, @Request() req: any) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    return this.poService.create(createPoDto, req.user);
  }

  @Get()
  @ApiOperation({
    summary: 'Lấy tất cả đơn hàng cho tổ chức',
    description: 'Trả về danh sách tất cả đơn hàng cho tổ chức hiện tại',
  })
  findAll(@Request() req: any) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    return this.poService.findAll(req.user.orgId);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Lấy chi tiết đơn hàng',
    description: 'Trả về thông tin chi tiết của một đơn hàng cụ thể',
  })
  findOne(@Param('id') id: string) {
    return this.poService.findOne(id);
  }

  // @Get(':id/approval-history')
  // @ApiOperation({
  //   summary: 'Lấy lịch sử duyệt đơn hàng',
  //   description: 'Trả về lịch sử duyệt của một đơn hàng cụ thể',
  // })
  // getApprovalHistory(@Param('id') id: string) {
  //   return this.poService.getApprovalHistory(id);
  // }

  // @Post(':id/submit')
  // @ApiOperation({
  //   summary: 'Gửi đơn hàng để phê duyệt',
  //   description: 'Gửi đơn hàng đang ở trạng thái nháp để chờ phê duyệt',
  // })
  // submit(@Param('id') id: string) {
  //   return this.poService.submit(id);
  //}

  @Put(':id/status')
  @ApiOperation({
    summary: 'Cập nhật trạng thái đơn hàng',
    description: 'Cập nhật trạng thái của một đơn hàng cụ thể',
  })
  updateStatus(@Param('id') id: string, @Body() body: any) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    return this.poService.updateStatus(id, body.status);
  }
}
