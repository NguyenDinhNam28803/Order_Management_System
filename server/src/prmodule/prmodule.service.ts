import { Injectable, NotFoundException } from '@nestjs/common';
import { CreatePrDto } from './dto/create-pr.dto';
import { PrRepository } from './pr.repository';
import { PrStatus, PurchaseRequisition } from '@prisma/client';
import { JwtPayload } from '../auth-module/interfaces/jwt-payload.interface';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PrmoduleService {
  constructor(
    private readonly repository: PrRepository,
    private readonly prisma: PrismaService,
  ) {}

  async create(
    createPrDto: CreatePrDto,
    user: JwtPayload,
  ): Promise<PurchaseRequisition> {
    const prNumber = `PR-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

    // Giả sử user object có orgId và deptId từ JWT payload
    const orgId = user.orgId;
    let deptId = user.deptId;

    if (!deptId) {
      const userFromDb = await this.prisma.user.findUnique({
        where: { id: user.sub },
        select: { deptId: true },
      });
      if (!userFromDb?.deptId) {
        throw new Error('User does not belong to any department');
      }
      deptId = userFromDb.deptId;
    }

    return this.repository.create(
      createPrDto,
      user.sub,
      orgId,
      deptId,
      prNumber,
    );
  }

  async findAll(user: JwtPayload): Promise<PurchaseRequisition[]> {
    return this.repository.findAll(user.orgId);
  }

  async findOne(id: string): Promise<any> {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const pr = await this.repository.findOne(id);
    if (!pr) {
      throw new NotFoundException(
        `Purchase Requisition with ID ${id} not found`,
      );
    }
    return pr;
  }

  async submit(id: string): Promise<PurchaseRequisition> {
    if (!id) {
      throw new NotFoundException(`Purchase Requisition ID is required`);
    }
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const pr = await this.findOne(id);
    if (pr.status !== PrStatus.DRAFT) {
      throw new Error('Only draft PRs can be submitted');
    }
    return this.repository.updateStatus(id, PrStatus.PENDING_APPROVAL);
  }

  async findMyPrs(userId: string): Promise<PurchaseRequisition[]> {
    return this.repository.findByRequester(userId);
  }
}
