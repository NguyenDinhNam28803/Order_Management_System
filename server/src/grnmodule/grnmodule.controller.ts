import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  // Delete,
  UseGuards,
  Req,
} from '@nestjs/common';
import { GrnmoduleService } from './grnmodule.service';
import { CreateGrnmoduleDto } from './dto/create-grnmodule.dto';
// import { UpdateGrnmoduleDto } from './dto/update-grnmodule.dto';
import { ApiBearerAuth, ApiOperation, ApiTags, ApiBody } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth-module/jwt-auth.guard';
import { JwtPayload } from '../auth-module/interfaces/jwt-payload.interface';
import { UpdateGrnItemQcResultDto } from './dto/update-grn-item-qc.dto';

@ApiTags('Goods Receipt Note (GRN) - Quản lý Nhập kho')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('grn')
export class GrnmoduleController {
  constructor(private readonly grnService: GrnmoduleService) {}

  /**
   * Tạo phiếu nhập kho mới từ Đơn mua hàng (PO).
   * Khi tạo, hệ thống sẽ tự động chuyển trạng thái của PO sang 'GRN_CREATED'.
   *
   * @param createGrnDto Thông tin chi tiết phiếu nhập (PO ID, danh sách sản phẩm thực nhập).
   */
  @Post()
  @ApiOperation({
    summary: 'Tạo phiếu nhập kho (GRN)',
    description:
      'Tạo phiếu nhập kho dựa trên PO đã phát hành. Yêu cầu PO phải ở trạng thái ISSUED hoặc IN_PROGRESS.',
  })
  @ApiBody({
    type: CreateGrnmoduleDto,
    description: 'Dữ liệu phiếu nhập kho mới',
  })
  create(@Body() createGrnDto: CreateGrnmoduleDto, @Req() req: any) {
    return this.grnService.create(createGrnDto, req.user as JwtPayload);
  }

  /**
   * Lấy danh sách tất cả các phiếu nhập kho của tổ chức hiện tại.
   */
  @Get()
  @ApiOperation({ summary: 'Lấy danh sách phiếu nhập kho' })
  findAll(@Req() req: any) {
    return this.grnService.findAll(req.user as JwtPayload);
  }

  /**
   * Xem chi tiết một phiếu nhập kho, bao gồm thông tin Header và danh sách các mặt hàng (Lines).
   * @param id ID của phiếu nhập kho (UUID).
   */
  @Get(':id')
  @ApiOperation({ summary: 'Xem chi tiết phiếu nhập kho' })
  findOne(@Param('id') id: string) {
    return this.grnService.findOne(id);
  }

  /**
   * Cập nhật thông tin chung của phiếu nhập kho (ví dụ: ghi chú, số vận đơn).
   * Không cập nhật trạng thái hay số lượng ở đây (dùng endpoint riêng).
   */
  // @Patch(':id')
  // @ApiOperation({ summary: 'Cập nhật thông tin chung phiếu nhập kho' })
  // update(@Param('id') id: string, @Body() updateGrnDto: UpdateGrnmoduleDto) {
  //   return this.grnService.update(id, updateGrnDto);
  // }

  /**
   * Cập nhật kết quả kiểm tra chất lượng (QC) cho từng dòng sản phẩm trong phiếu nhập.
   * Cho phép ghi nhận số lượng đạt (Accepted) và hỏng (Rejected).
   *
   * @param id ID của phiếu nhập kho.
   * @param itemId ID của dòng sản phẩm (GrnItem ID).
   */
  @Patch(':id/items/:itemId/qc')
  @ApiOperation({
    summary: 'Cập nhật kết quả QC cho sản phẩm',
    description:
      'Ghi nhận kết quả kiểm tra chất lượng cho từng mặt hàng: Số lượng đạt, hỏng, lý do từ chối.',
  })
  @ApiBody({ type: UpdateGrnItemQcResultDto })
  updateItemQc(
    @Param('id') id: string,
    @Param('itemId') itemId: string,
    @Body() dto: UpdateGrnItemQcResultDto,
  ) {
    return this.grnService.updateItemQc(id, itemId, dto);
  }

  /**
   * Xác nhận hoàn tất nhập kho (Confirm GRN).
   * Hành động này sẽ khóa phiếu nhập, cập nhật tồn kho (nếu có module kho) và kích hoạt trạng thái sẵn sàng thanh toán.
   */
  @Post(':id/confirm')
  @ApiOperation({ summary: 'Xác nhận hoàn tất nhập kho' })
  confirm(@Param('id') id: string, @Req() req: any) {
    const user = req.user as JwtPayload;
    return this.grnService.confirmGrn(id, user.sub);
  }

  /**
   * Xóa phiếu nhập kho (chỉ áp dụng khi phiếu ở trạng thái Nháp - DRAFT).
   */
  // @Delete(':id')
  // @ApiOperation({ summary: 'Xóa phiếu nhập kho (chỉ DRAFT)' })
  // remove(@Param('id') id: string) {
  //   return this.grnService.remove(+id);
  // }
}
