import { Controller, Get, Post, Patch, Param, Body, Req, ForbiddenException } from '@nestjs/common';
import { RcaService } from './rca.service';
import { UserRole } from '@prisma/client';

@Controller('quality/rca')
export class RcaController {
  constructor(private readonly rcaService: RcaService) {}

  @Post()
  async create(@Body() data: any, @Req() req: any) {
    // Procurement hoặc NCC có quyền submit
    return await this.rcaService.createRca(data);
  }

  @Get('supplier/:supplierId')
  async getBySupplier(@Param('supplierId') supplierId: string) {
    return await this.rcaService.getRcaBySupplier(supplierId);
  }

  @Patch(':id/status')
  async updateStatus(@Param('id') id: string, @Body('status') status: string, @Req() req: any) {
    // Chỉ Procurement hoặc QA mới có quyền duyệt RCA
    if (![UserRole.PROCUREMENT, UserRole.QA].includes(req.user.role)) {
      throw new ForbiddenException('Không có quyền phê duyệt RCA');
    }
    return await this.rcaService.updateRcaStatus(id, status);
  }
}
