import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class RcaService {
  constructor(private prisma: PrismaService) {}

  async createRca(data: any) {
    return await this.prisma.rootCauseAnalysis.create({ data });
  }

  async getRcaBySupplier(supplierId: string) {
    return await this.prisma.rootCauseAnalysis.findMany({
      where: { supplierId },
      orderBy: { createdAt: 'desc' }
    });
  }

  async updateRcaStatus(id: string, status: string) {
    return await this.prisma.rootCauseAnalysis.update({
      where: { id },
      data: { status }
    });
  }
}
