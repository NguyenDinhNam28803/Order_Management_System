import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { CreateGrnmoduleDto } from './dto/create-grnmodule.dto';
// import { UpdateGrnmoduleDto } from './dto/update-grnmodule.dto';
import { GrnRepository } from './grn.repository';
import { PrismaService } from '../prisma/prisma.service';
import { GrnStatus, PoStatus } from '@prisma/client';
import { JwtPayload } from '../auth-module/interfaces/jwt-payload.interface';
import { UpdateGrnItemQcResultDto } from './dto/update-grn-item-qc.dto';

@Injectable()
export class GrnmoduleService {
  constructor(
    private readonly repository: GrnRepository,
    private readonly prisma: PrismaService,
  ) {}

  async create(createGrnDto: CreateGrnmoduleDto, user: JwtPayload) {
    const { poId, items } = createGrnDto;

    // 1. Validate PO
    const po = await this.prisma.purchaseOrder.findUnique({
      where: { id: poId },
      include: { items: true },
    });

    if (!po) {
      throw new NotFoundException(`Purchase Order with ID ${poId} not found`);
    }

    if (
      po.status !== PoStatus.ISSUED &&
      po.status !== PoStatus.IN_PROGRESS &&
      //po.status !== PoStatus.PARTIALLY_RECEIVED &&
      po.status !== PoStatus.ACKNOWLEDGED
    ) {
      throw new BadRequestException(
        `PO must be in ISSUED, ACKNOWLEDGED, or IN_PROGRESS state to receive goods. Current: ${po.status}`,
      );
    }

    // 2. Validate Items belong to PO
    const poItemIds = new Set(po.items.map((i) => i.id));
    for (const item of items) {
      if (!poItemIds.has(item.poItemId)) {
        throw new BadRequestException(
          `Item ${item.poItemId} does not belong to PO ${poId}`,
        );
      }
    }

    // 3. Create GRN
    const grnNumber = `GRN-${new Date().getFullYear()}-${Math.floor(10000 + Math.random() * 90000)}`;
    const grn = await this.repository.create(
      createGrnDto,
      grnNumber,
      po.orgId,
      user.sub,
    );

    // 4. Update PO Status
    // TODO: Calculate if fully received or partially
    await this.prisma.purchaseOrder.update({
      where: { id: poId },
      data: { status: PoStatus.GRN_CREATED }, // Or PARTIALLY_RECEIVED
    });

    return grn;
  }

  async findAll(user: JwtPayload) {
    return this.repository.findAll(user.orgId);
  }

  async findOne(id: string) {
    const grn = await this.repository.findOne(id);
    if (!grn) throw new NotFoundException(`GRN with ID ${id} not found`);
    return grn;
  }

  // async update(id: string, updateGrnDto: UpdateGrnmoduleDto) {
  //   // Basic update logic if needed
  //   return `This action updates a #${id} grnmodule`;
  // }

  async updateStatus(id: string, status: GrnStatus, userId: string) {
    const grn = await this.repository.findOne(id);
    if (!grn) throw new NotFoundException(`GRN with ID ${id} not found`);

    return this.repository.updateStatus(id, status, userId);
  }

  async updateItemQc(
    id: string,
    itemId: string,
    dto: UpdateGrnItemQcResultDto,
  ) {
    // Verify item belongs to GRN
    const grn = await this.repository.findOne(id);
    if (!grn) throw new NotFoundException(`GRN with ID ${id} not found`);

    const item = grn.items.find((i) => i.id === itemId);
    if (!item) {
      throw new NotFoundException(`Item ${itemId} not found in GRN ${id}`);
    }

    return this.repository.updateItemQc(itemId, dto);
  }

  async confirmGrn(id: string, userId: string) {
    return this.updateStatus(id, GrnStatus.CONFIRMED, userId);
  }

  // async remove(id: number) {
  //   // Only allow delete if DRAFT
  //   return `This action removes a #${id} grnmodule`;
  // }
}
