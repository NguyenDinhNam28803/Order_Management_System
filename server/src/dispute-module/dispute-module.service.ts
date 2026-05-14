import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateDisputeModuleDto } from './dto/create-dispute-module.dto';
import { UpdateDisputeModuleDto } from './dto/update-dispute-module.dto';
import { JwtPayload } from '../auth-module/interfaces/jwt-payload.interface';
import { generateDocNumber } from '../common/utils/doc-number.util';

@Injectable()
export class DisputeModuleService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateDisputeModuleDto, user: JwtPayload) {
    const disputeNumber = generateDocNumber('DIS');
    return this.prisma.dispute.create({
      data: {
        disputeNumber,
        poId: dto.poId,
        grnId: dto.grnId,
        invoiceId: dto.invoiceId,
        openedById: user.sub,
        openedOrgId: user.orgId,
        againstOrgId: dto.againstOrgId,
        type: dto.type,
        description: dto.description,
        claimedAmount: dto.claimedAmount,
      },
      include: {
        po: true,
        openedBy: { select: { fullName: true, email: true } },
        openedOrg: { select: { id: true, name: true } },
        againstOrg: { select: { id: true, name: true } },
      },
    });
  }

  async findAll(orgId: string) {
    return this.prisma.dispute.findMany({
      where: {
        OR: [{ openedOrgId: orgId }, { againstOrgId: orgId }],
      },
      include: {
        po: { select: { id: true, poNumber: true } },
        openedBy: { select: { fullName: true, email: true } },
        openedOrg: { select: { id: true, name: true } },
        againstOrg: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const dispute = await this.prisma.dispute.findUnique({
      where: { id },
      include: {
        po: true,
        grn: true,
        invoice: true,
        openedBy: { select: { fullName: true, email: true } },
        openedOrg: { select: { id: true, name: true } },
        againstOrg: { select: { id: true, name: true } },
        evidence: true,
        messages: { orderBy: { createdAt: 'asc' } },
      },
    });
    if (!dispute) throw new NotFoundException('Không tìm thấy tranh chấp');
    return dispute;
  }

  async update(id: string, dto: UpdateDisputeModuleDto) {
    await this.findOne(id);
    return this.prisma.dispute.update({
      where: { id },
      data: dto,
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.dispute.delete({ where: { id } });
  }
}
