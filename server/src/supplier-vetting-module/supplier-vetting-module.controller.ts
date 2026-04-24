import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  Req,
  ParseUUIDPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth-module/jwt-auth.guard';
import { JwtPayload } from '../auth-module/interfaces/jwt-payload.interface';
import { SupplierVettingService } from './supplier-vetting-module.service';
import {
  CreateVettingRequestDto,
  UpdateVettingCheckDto,
  SubmitVettingDto,
  ApproveVettingDto,
  RejectVettingDto,
} from './dto/supplier-vetting.dto';

const ALLOWED_ROLES = ['PROCUREMENT', 'ADMIN', 'DIRECTOR', 'CEO', 'PLATFORM_ADMIN'];
const APPROVER_ROLES = ['ADMIN', 'DIRECTOR', 'CEO', 'PLATFORM_ADMIN'];

@ApiTags('Supplier Vetting')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@Controller('supplier-vetting')
export class SupplierVettingController {
  constructor(private readonly service: SupplierVettingService) {}

  private getUser(req: any): JwtPayload {
    return req.user as JwtPayload;
  }

  private checkRole(req: any, roles = ALLOWED_ROLES) {
    const role = (req.user as JwtPayload)?.role;
    if (!roles.includes(role)) {
      throw new Error('Bạn không có quyền thực hiện thao tác này');
    }
  }

  @Post()
  @ApiOperation({ summary: 'Tạo yêu cầu xét duyệt nhà cung cấp' })
  create(@Body() dto: CreateVettingRequestDto, @Req() req: any) {
    this.checkRole(req);
    return this.service.createRequest(dto, this.getUser(req));
  }

  @Get()
  @ApiOperation({ summary: 'Lấy danh sách vetting requests' })
  findAll(@Req() req: any) {
    this.checkRole(req);
    return this.service.findAll(this.getUser(req));
  }

  @Get(':id')
  @ApiOperation({ summary: 'Lấy chi tiết vetting request' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  findOne(@Param('id', ParseUUIDPipe) id: string, @Req() req: any) {
    this.checkRole(req);
    return this.service.findOne(id);
  }

  @Patch(':id/checks/:checkId')
  @ApiOperation({ summary: 'Cập nhật trạng thái 1 checklist item' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiParam({ name: 'checkId', type: 'string', format: 'uuid' })
  updateCheck(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('checkId', ParseUUIDPipe) checkId: string,
    @Body() dto: UpdateVettingCheckDto,
    @Req() req: any,
  ) {
    this.checkRole(req);
    return this.service.updateCheck(id, checkId, dto, this.getUser(req));
  }

  @Post(':id/submit')
  @ApiOperation({ summary: 'Nộp để phê duyệt' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  submit(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: SubmitVettingDto,
    @Req() req: any,
  ) {
    this.checkRole(req);
    return this.service.submitForApproval(id, dto, this.getUser(req));
  }

  @Post(':id/approve')
  @ApiOperation({ summary: 'Phê duyệt nhà cung cấp' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  approve(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ApproveVettingDto,
    @Req() req: any,
  ) {
    this.checkRole(req, APPROVER_ROLES);
    return this.service.approve(id, dto, this.getUser(req));
  }

  @Post(':id/reject')
  @ApiOperation({ summary: 'Từ chối nhà cung cấp' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  reject(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: RejectVettingDto,
    @Req() req: any,
  ) {
    this.checkRole(req, APPROVER_ROLES);
    return this.service.reject(id, dto, this.getUser(req));
  }

  @Delete(':id/cancel')
  @ApiOperation({ summary: 'Huỷ vetting request' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  cancel(@Param('id', ParseUUIDPipe) id: string, @Req() req: any) {
    this.checkRole(req);
    return this.service.cancel(id, this.getUser(req));
  }
}
