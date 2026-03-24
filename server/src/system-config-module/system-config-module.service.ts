import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpsertSystemConfigDto } from './dto/system-config.dto';
import { SystemConfig } from '@prisma/client';
import { JwtPayload } from '../auth-module/interfaces/jwt-payload.interface';

@Injectable()
export class SystemConfigModuleService {
  constructor(private readonly prisma: PrismaService) {}

  async upsert(
    dto: UpsertSystemConfigDto,
    user: JwtPayload,
  ): Promise<SystemConfig> {
    const { configKey, ...rest } = dto;
    const orgId = user.orgId;

    return this.prisma.systemConfig.upsert({
      where: {
        orgId_configKey: {
          orgId,
          configKey,
        },
      },
      update: {
        ...rest,
        updatedById: user.sub,
      },
      create: {
        ...rest,
        configKey,
        orgId,
        updatedById: user.sub,
      },
    });
  }

  async findAll(user: JwtPayload): Promise<SystemConfig[]> {
    return this.prisma.systemConfig.findMany({
      where: { orgId: user.orgId },
      include: {
        updatedBy: { select: { fullName: true, email: true } },
      },
    });
  }

  async findOne(configKey: string, user: JwtPayload): Promise<SystemConfig> {
    const config = await this.prisma.systemConfig.findUnique({
      where: {
        orgId_configKey: {
          orgId: user.orgId,
          configKey,
        },
      },
    });

    if (!config) {
      throw new NotFoundException(`Config with key ${configKey} not found`);
    }

    return config;
  }

  async remove(configKey: string, user: JwtPayload): Promise<SystemConfig> {
    await this.findOne(configKey, user);

    return this.prisma.systemConfig.delete({
      where: {
        orgId_configKey: {
          orgId: user.orgId,
          configKey,
        },
      },
    });
  }
}
