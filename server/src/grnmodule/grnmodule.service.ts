import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { CreateGrnmoduleDto } from './dto/create-grnmodule.dto';
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

    // Kiểm tra trạng thái PO cho phép nhập kho (Dựa trên Enum thực tế trong Schema)
    const allowedPoStatuses: PoStatus[] = [
      PoStatus.ISSUED,
      PoStatus.ACKNOWLEDGED,
      PoStatus.IN_PROGRESS,
      PoStatus.SHIPPED,
      PoStatus.GRN_CREATED,
    ];

    if (!allowedPoStatuses.includes(po.status)) {
      throw new BadRequestException(
        `PO must be in active state to receive goods. Current: ${po.status}`,
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

    // 3. Validate Quantity (Received vs PO)
    for (const item of items) {
      const poItem = po.items.find((i) => i.id === item.poItemId);
      if (!poItem) continue;

      const previouslyReceived = await this.prisma.grnItem.aggregate({
        where: {
          poItemId: item.poItemId,
          grn: { status: { not: GrnStatus.DISPUTED } },
        },
        _sum: { receivedQty: true },
      });

      const totalReceived =
        (Number(previouslyReceived._sum.receivedQty) || 0) +
        Number(item.receivedQty);
      if (totalReceived > Number(poItem.qty)) {
        throw new BadRequestException(
          `Tổng số lượng nhận (${totalReceived}) vượt quá số lượng đặt hàng (${poItem.qty.toString()}) cho item ${poItem.sku}`,
        );
      }
    }

    // 4. Create GRN
    const grnNumber = `GRN-${new Date().getFullYear()}-${Math.floor(10000 + Math.random() * 90000)}`;
    const grn = await this.repository.create(
      createGrnDto,
      grnNumber,
      po.orgId,
      user.sub,
    );

    // 5. Update PO Status sang IN_PROGRESS (Enum chuẩn)
    await this.prisma.purchaseOrder.update({
      where: { id: poId },
      data: { status: PoStatus.IN_PROGRESS },
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

  async updateStatus(id: string, status: GrnStatus, userId: string) {
    const grn = await this.repository.findOne(id);
    if (!grn) throw new NotFoundException(`GRN with ID ${id} not found`);

    const result = await this.repository.updateStatus(id, status, userId);

    // Auto-create a Return To Vendor record when GRN is marked DISPUTED
    if (status === GrnStatus.DISPUTED && grn.po?.supplierId) {
      const rtvNumber = `RTV-${new Date().getFullYear()}-${Math.floor(10000 + Math.random() * 90000)}`;
      await this.prisma.returnToVendor.create({
        data: {
          rtvNumber,
          grnId: id,
          poId: grn.poId,
          supplierId: grn.po.supplierId,
          reason: 'Hàng bị tranh chấp tại GRN — cần xem xét và trả hàng',
          returnType: 'REPLACE',
          status: 'PENDING',
          createdById: userId,
        },
      });
    }

    return result;
  }

  async updateItemQc(
    id: string,
    itemId: string,
    dto: UpdateGrnItemQcResultDto,
  ) {
    const grn = await this.repository.findOne(id);
    if (!grn) throw new NotFoundException(`GRN with ID ${id} not found`);

    const item = grn.items.find((i) => i.id === itemId);
    if (!item) {
      throw new NotFoundException(`Item ${itemId} not found in GRN ${id}`);
    }

    return this.repository.updateItemQc(itemId, dto);
  }

  async confirmGrn(id: string, user: JwtPayload) {
    const grn = await this.repository.findOne(id);
    if (!grn) throw new NotFoundException(`GRN with ID ${id} not found`);

    const result = await this.repository.updateStatus(
      id,
      GrnStatus.CONFIRMED,
      user.sub,
    );

    // Kiểm tra xem PO đã nhận hết hàng chưa
    const po = await this.prisma.purchaseOrder.findUnique({
      where: { id: grn.poId },
      include: { items: true },
    });

    if (po) {
      let allReceived = true;
      for (const poItem of po.items) {
        const received = await this.prisma.grnItem.aggregate({
          where: { poItemId: poItem.id, grn: { status: GrnStatus.CONFIRMED } },
          _sum: { acceptedQty: true },
        });
        if ((Number(received._sum.acceptedQty) || 0) < Number(poItem.qty)) {
          allReceived = false;
          break;
        }
      }

      // Nếu đã nhận đủ, chuyển PO sang trạng thái COMPLETED hoặc GRN_CREATED (Dựa trên Enum)
      if (allReceived) {
        await this.prisma.purchaseOrder.update({
          where: { id: po.id },
          data: { status: PoStatus.GRN_CREATED },
        });
      }
    }

    return result;
  }
}
