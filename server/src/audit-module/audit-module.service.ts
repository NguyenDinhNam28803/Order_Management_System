import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAuditLogDto } from './dto/audit.dto';
import { AuditLog } from '@prisma/client';
import { JwtPayload } from '../auth-module/interfaces/jwt-payload.interface';

@Injectable()
export class AuditModuleService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateAuditLogDto, user: JwtPayload): Promise<AuditLog> {
    return this.prisma.auditLog.create({
      data: {
        ...dto,
        orgId: user.orgId,
        userId: user.sub,
      },
    });
  }

  async findPaginated(
    user: JwtPayload,
    skip: number,
    take: number,
  ): Promise<AuditLog[]> {
    return this.prisma.auditLog.findMany({
      where: { orgId: user.orgId },
      orderBy: { createdAt: 'desc' },
      skip,
      take,
    });
  }

  async count(user: JwtPayload): Promise<number> {
    return this.prisma.auditLog.count({
      where: { orgId: user.orgId },
    });
  }

  async findAll(user: JwtPayload): Promise<AuditLog[]> {
    return this.prisma.auditLog.findMany({
      where: { orgId: user.orgId },
      orderBy: { createdAt: 'desc' },
      take: 100, // Limit to recent 100 logs
    });
  }

  async findByEntity(
    entityType: string,
    entityId: string,
  ): Promise<AuditLog[]> {
    return this.prisma.auditLog.findMany({
      where: { entityType, entityId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: number | bigint): Promise<AuditLog> {
    const log = await this.prisma.auditLog.findUnique({
      where: { id },
    });

    if (!log) {
      throw new NotFoundException(`Audit Log with ID ${id} not found`);
    }

    return log;
  }
}
