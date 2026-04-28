import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Req,
  ForbiddenException,
} from '@nestjs/common';
import { QualityTrendService } from './quality-trend.service';
import { PrismaService } from '../prisma/prisma.service'; // Thêm Import
import { UserRole } from '@prisma/client';
import { JwtPayload } from '../auth-module/interfaces/jwt-payload.interface';

@Controller('quality')
export class QualityController {
  constructor(
    private readonly qualityService: QualityTrendService,
    private readonly prisma: PrismaService, // Thêm Prisma vào constructor
  ) {}

  @Get('suppliers/:id/history')
  async getSupplierHistory(
    @Param('id') supplierId: string,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    @Req() req: { user: JwtPayload },
  ) {
    const items = await this.prisma.grnItem.findMany({
      where: {
        grn: {
          po: { supplierId },
          receivedAt: { gte: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000) },
        },
      },
      include: { grn: true },
      orderBy: { grn: { receivedAt: 'asc' } },
    });

    // Gom nhóm theo ngày
    const daily: Record<string, { total: number; rejected: number }> = {};
    items.forEach((item) => {
      const date = item.grn.receivedAt.toISOString().split('T')[0];
      if (!daily[date]) daily[date] = { total: 0, rejected: 0 };
      daily[date].total += Number(item.acceptedQty) + Number(item.rejectedQty);
      daily[date].rejected += Number(item.rejectedQty);
    });

    return Object.keys(daily).map((date, index) => ({
      dayLabel: `Ngày ${index + 1}`,
      defectRate: parseFloat(
        ((daily[date].rejected / daily[date].total) * 100).toFixed(2),
      ),
    }));
  }

  @Get('suppliers/:id/trend')
  getTrend(@Param('id') supplierId: string, @Req() req: any) {
    // Thêm UserRole.WAREHOUSE vào danh sách cho phép
    const allowedRoles: UserRole[] = [
      UserRole.PROCUREMENT,
      UserRole.QA,
      UserRole.DIRECTOR,
      UserRole.CEO,
      UserRole.WAREHOUSE,
    ];
    // Kiểm tra req.user trước khi truy cập req.user.role
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      throw new ForbiddenException(
        'Không có quyền truy cập dữ liệu chất lượng',
      );
    }
    return this.qualityService.getLongestIncreasingTrend(supplierId);
  }

  @Post('suppliers/:id/warning-letter')
  async generateWarningLetter(
    @Param('id') supplierId: string,
    @Body() body: any,
    @Req() req: { user: JwtPayload },
  ) {
    // Chỉ PROCUREMENT mới được quyền phát lệnh cảnh báo
    if (req.user.role !== UserRole.PROCUREMENT) {
      throw new ForbiddenException(
        'Chỉ bộ phận Thu mua (Procurement) mới có quyền gửi thư cảnh báo',
      );
    }
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    return this.qualityService.generateWarningLetter(supplierId, body);
  }
}
