import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Request,
  Patch,
} from '@nestjs/common';
import { GrnmoduleService } from './grnmodule.service';
import { CreateGrnmoduleDto } from './dto/create-grnmodule.dto';
import { JwtAuthGuard } from '../auth-module/jwt-auth.guard';
import { RolesGuard } from '../common/roles.guard';
import { Roles } from '../common/roles.guard';
import { UserRole, GrnStatus } from '@prisma/client';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtPayload } from '../auth-module/interfaces/jwt-payload.interface';
import { UpdateGrnItemQcResultDto } from './dto/update-grn-item-qc.dto';

@ApiTags('Goods Receipt (GRN)')
@Controller('grn')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
export class GrnmoduleController {
  constructor(private readonly grnmoduleService: GrnmoduleService) {}

  @Post()
  @Roles(UserRole.WAREHOUSE, UserRole.PLATFORM_ADMIN)
  @ApiOperation({ summary: 'Tạo phiếu nhập kho (GRN)' })
  create(@Body() createGrnDto: CreateGrnmoduleDto, @Request() req: any) {
    return this.grnmoduleService.create(createGrnDto, req.user as JwtPayload);
  }

  @Get()
  @Roles(UserRole.WAREHOUSE, UserRole.FINANCE, UserRole.PLATFORM_ADMIN)
  @ApiOperation({ summary: 'Lấy danh sách phiếu nhập kho' })
  findAll(@Request() req: any) {
    return this.grnmoduleService.findAll(req.user as JwtPayload);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Chi tiết phiếu nhập kho' })
  findOne(@Param('id') id: string) {
    return this.grnmoduleService.findOne(id);
  }

  @Patch(':id/status')
  @Roles(UserRole.WAREHOUSE, UserRole.PLATFORM_ADMIN)
  @ApiOperation({ summary: 'Cập nhật trạng thái GRN' })
  updateStatus(
    @Param('id') id: string,
    @Body('status') status: GrnStatus,
    @Request() req: any,
  ) {
    const user = req.user as JwtPayload;
    return this.grnmoduleService.updateStatus(id, status, user.sub);
  }

  @Patch(':id/items/:itemId/qc')
  @Roles(UserRole.WAREHOUSE, UserRole.PLATFORM_ADMIN)
  @ApiOperation({ summary: 'Cập nhật kết quả QC cho item' })
  updateItemQc(
    @Param('id') id: string,
    @Param('itemId') itemId: string,
    @Body() dto: UpdateGrnItemQcResultDto,
  ) {
    return this.grnmoduleService.updateItemQc(id, itemId, dto);
  }

  @Patch(':id/confirm')
  @Roles(UserRole.WAREHOUSE, UserRole.PLATFORM_ADMIN)
  @ApiOperation({ summary: 'Xác nhận nhập kho hoàn tất' })
  confirmGrn(@Param('id') id: string, @Request() req: any) {
    return this.grnmoduleService.confirmGrn(id, req.user as JwtPayload);
  }
}
