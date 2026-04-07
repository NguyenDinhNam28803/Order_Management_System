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
import { RolesGuard, Roles } from '../common/roles.guard';
import { UserRole } from '@prisma/client';
import type { JwtPayload } from '../auth-module/interfaces/jwt-payload.interface';

@ApiTags('Purchase Order (PO)')
@Controller('purchase-orders')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.PROCUREMENT, UserRole.FINANCE, UserRole.PLATFORM_ADMIN, UserRole.SUPPLIER)
export class PomoduleController {
  constructor(private readonly poService: PomoduleService) {}

  /**
   * Tạo một đơn đặt hàng (Purchase Order - PO) mới từ báo giá đã được chấp nhận
   * @param createPoDto Dữ liệu tạo đơn đặt hàng
   * @param req Thông tin người dùng thực hiện yêu cầu
   * @returns Đơn đặt hàng vừa tạo
   */
  @Post()
  @ApiOperation({
    summary: 'Tạo đơn hàng mới từ báo giá đã được chấp nhận',
    description: 'Tạo một đơn hàng mới từ một báo giá đã được chấp nhận',
  })
  create(@Body() createPoDto: CreatePoDto, @Request() req: any) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    return this.poService.create(createPoDto, req.user);
  }

  /**
   * Đặt lại trạng thái của đơn hàng về DRAFT để có thể chỉnh sửa lại
   * @param id ID của đơn hàng cần đặt lại trạng thái
   * @returns Đơn hàng sau khi đã được đặt lại trạng thái
   */
  @Post(':id/reset')
  @ApiOperation({
    summary: 'Reset trạng thái đơn hàng về DRAFT',
    description:
      'Đặt lại trạng thái của đơn hàng về DRAFT để có thể chỉnh sửa lại',
  })
  resetPoStatus(@Param('id') id: string) {
    return this.poService.resetPoStatus(id);
  }

  /**
   * Nhà cung cấp xác nhận đơn hàng (ACK)
   * @param id ID của đơn hàng cần xác nhận
   * @returns Đơn hàng sau khi đã được xác nhận
   */
  @Post(':id/acknowledge')
  @ApiOperation({
    summary: 'Nhà cung cấp xác nhận đơn hàng (ACK)',
    description: 'Nhà cung cấp xác nhận đồng ý thực hiện đơn hàng, chuyển trạng thái sang ACKNOWLEDGED',
  })
  @Roles(UserRole.SUPPLIER, UserRole.PROCUREMENT, UserRole.PLATFORM_ADMIN)
  acknowledgePo(@Param('id') id: string) {
    return this.poService.confirmPo(id);
  }

  /**
   * Xác nhận đơn hàng, chuyển trạng thái sang CONFIRMED
   * @param id ID của đơn hàng cần xác nhận
   * @returns Đơn hàng sau khi đã được xác nhận
   */
  @Post(':id/confirm')
  @ApiOperation({
    summary: 'Xác nhận đơn hàng',
    description: 'Xác nhận đơn hàng, chuyển trạng thái sang CONFIRMED',
  })
  confirmPo(@Param('id') id: string) {
    return this.poService.confirmPo(id);
  }

  /**
   * Từ chối đơn hàng, chuyển trạng thái sang REJECTED
   * @param id ID của đơn hàng cần từ chối
   * @returns Đơn hàng sau khi đã được cập nhật trạng thái
   */
  @Post(':id/reject')
  @ApiOperation({
    summary: 'Từ chối đơn hàng',
    description: 'Từ chối đơn hàng, chuyển trạng thái sang REJECTED',
  })
  rejectPo(@Param('id') id: string) {
    return this.poService.rejectPo(id);
  }

  /**
   * Gửi đơn hàng đi phê duyệt (chuyển sang PENDING_APPROVAL)
   * @param id ID của đơn hàng
   * @param req Thông tin người dùng thực hiện yêu cầu
   * @returns Đơn hàng sau khi gửi duyệt
   */
  @Post('create-from-pr')
  async createFromPr(
    @Body() body: { prId: string; supplierId: string },
    @Request() req: JwtPayload,
  ) {
    return this.poService.createFromPr(body.prId, body.supplierId, req);
  }

  @Post(':id/submit')
  @ApiOperation({
    summary: 'Gửi đơn hàng phê duyệt',
    description: 'Kích hoạt luồng duyệt cho đơn hàng',
  })
  submit(@Param('id') id: string) {
    return this.poService.submit(id);
  }

  @Get('supplier/:supplierId')
  @ApiOperation({
    summary: 'Lấy danh sách PO cho nhà cung cấp',
    description: 'Trả về danh sách tất cả đơn hàng của một nhà cung cấp cụ thể',
  })
  @Roles(UserRole.SUPPLIER, UserRole.PROCUREMENT, UserRole.PLATFORM_ADMIN)
  findBySupplier(@Param('supplierId') supplierId: string) {
    return this.poService.findBySupplier(supplierId);
  }

  /**
   * Lấy danh sách tất cả các đơn đặt hàng của tổ chức hiện tại
   * @param req Thông tin người dùng để xác định tổ chức
   * @returns Danh sách các đơn đặt hàng
   */
  @Get()
  @Roles(UserRole.SUPPLIER, UserRole.PROCUREMENT, UserRole.PLATFORM_ADMIN, UserRole.DEPT_APPROVER, UserRole.FINANCE, UserRole.WAREHOUSE)
  @ApiOperation({
    summary: 'Lấy tất cả đơn hàng cho tổ chức',
    description: 'Trả về danh sách tất cả đơn hàng cho tổ chức hiện tại',
  })
  findAll(@Request() req: any) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    return this.poService.findAll(req.user.orgId);
  }

  @Get('all')
  @Roles(UserRole.SUPPLIER, UserRole.PROCUREMENT, UserRole.PLATFORM_ADMIN, UserRole.FINANCE, UserRole.DEPT_APPROVER, UserRole.WAREHOUSE)
  @ApiOperation({
    summary: 'Lấy tất cả đơn hàng',
    description: 'Trả về danh sách tất cả đơn hàng',
  })
  getAll() {
    return this.poService.getAll();
  }

  /**
   * Lấy thông tin chi tiết của một đơn đặt hàng cụ thể theo ID
   * @param id ID của đơn đặt hàng
   * @returns Chi tiết đơn đặt hàng
   */
  @Get(':id')
  @ApiOperation({
    summary: 'Lấy chi tiết đơn hàng',
    description: 'Trả về thông tin chi tiết của một đơn hàng cụ thể',
  })
  findOne(@Param('id') id: string) {
    return this.poService.findOne(id);
  }

  /**
   * Cập nhật trạng thái của một đơn đặt hàng (ví dụ: Chờ xử lý, Đã hoàn thành, Hủy)
   * @param id ID của đơn đặt hàng
   * @param body Chứa trạng thái mới cần cập nhật
   * @returns Đơn đặt hàng sau khi cập nhật trạng thái
   */
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
