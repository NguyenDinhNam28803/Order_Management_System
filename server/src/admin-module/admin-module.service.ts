import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAdminModuleDto } from './dto/create-admin-module.dto';
import { UpdateAdminModuleDto } from './dto/update-admin-module.dto';
import { JwtPayload } from '../auth-module/interfaces/jwt-payload.interface';

@Injectable()
export class AdminModuleService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateAdminModuleDto, user: JwtPayload) {
    return this.prisma.auditLog.create({
      data: {
        orgId: dto.orgId ?? null,
        userId: user.sub,
        action: dto.action,
        entityType: dto.entityType,
        entityId: dto.entityId,
        newValue: dto.note ? { note: dto.note } : undefined,
      },
    });
  }

  async findAll(page = 1, limit = 50) {
    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.auditLog.count(),
    ]);
    return { items, total, page, limit };
  }

  async findOne(id: string) {
    const log = await this.prisma.auditLog.findUnique({
      where: { id: BigInt(id) },
    });
    if (!log) throw new NotFoundException(`Audit log #${id} không tồn tại`);
    return log;
  }

  async update(id: string, dto: UpdateAdminModuleDto) {
    await this.findOne(id);
    return this.prisma.auditLog.update({
      where: { id: BigInt(id) },
      data: {
        newValue: dto.note ? { note: dto.note } : undefined,
      },
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.prisma.auditLog.delete({ where: { id: BigInt(id) } });
    return { message: `Audit log #${id} đã được xóa` };
  }

  async getPlatformStats() {
    const [orgCount, userCount, poCount, invoiceCount, disputeCount] =
      await Promise.all([
        this.prisma.organization.count(),
        this.prisma.user.count(),
        this.prisma.purchaseOrder.count(),
        this.prisma.supplierInvoice.count(),
        this.prisma.dispute.count(),
      ]);
    return { orgCount, userCount, poCount, invoiceCount, disputeCount };
  }
}
