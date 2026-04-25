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
import { NotificationModuleService } from '../notification-module/notification-module.service';
import { TokenType } from '../external-token-module/external-token.service';

@Injectable()
export class GrnmoduleService {
  constructor(
    private readonly repository: GrnRepository,
    private readonly prisma: PrismaService,
    private readonly notificationService: NotificationModuleService,
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

    // 3. Validate Quantity (Received vs PO) — single batch query instead of N+1
    const incomingPoItemIds = items.map((i) => i.poItemId);
    const prevReceivedRows = await this.prisma.grnItem.groupBy({
      by: ['poItemId'],
      where: {
        poItemId: { in: incomingPoItemIds },
        grn: { status: { not: GrnStatus.DISPUTED } },
      },
      _sum: { receivedQty: true },
    });
    const prevReceivedMap = new Map<string, number>(
      prevReceivedRows.map((r) => [
        r.poItemId,
        Number(r._sum.receivedQty) || 0,
      ]),
    );

    for (const item of items) {
      const poItem = po.items.find((i) => i.id === item.poItemId);
      if (!poItem) continue;

      const totalReceived =
        (prevReceivedMap.get(item.poItemId) || 0) + Number(item.receivedQty);
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

    // Gửi magic link cho NCC để cập nhật trạng thái giao hàng
    void this.notifyGrnMilestoneUpdate(grn.id, po).catch(() => {});

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
      // Batch query instead of N+1 per PO item
      const confirmedRows = await this.prisma.grnItem.groupBy({
        by: ['poItemId'],
        where: {
          poItemId: { in: po.items.map((i) => i.id) },
          grn: { status: GrnStatus.CONFIRMED },
        },
        _sum: { acceptedQty: true },
      });
      const confirmedMap = new Map<string, number>(
        confirmedRows.map((r) => [
          r.poItemId,
          Number(r._sum.acceptedQty) || 0,
        ]),
      );
      const allReceived = po.items.every(
        (poItem) =>
          (confirmedMap.get(poItem.id) || 0) >= Number(poItem.qty),
      );

      // Nếu đã nhận đủ, chuyển PO sang trạng thái COMPLETED hoặc GRN_CREATED (Dựa trên Enum)
      if (allReceived) {
        await this.prisma.purchaseOrder.update({
          where: { id: po.id },
          data: { status: PoStatus.GRN_CREATED },
        });
      }
    }

    // Gửi email GRN_CONFIRMED cho các finance user trong org
    void this.notifyGrnConfirmed(id, grn).catch(() => {});

    return result;
  }

  private async notifyGrnMilestoneUpdate(grnId: string, po: any) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const supplierOrgId: string | undefined = po?.supplierId;
    if (!supplierOrgId) return;

    const supplierUser = await this.prisma.user.findFirst({
      where: {
        orgId: supplierOrgId,
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        role: 'SUPPLIER' as any,
        isActive: true,
      },
      include: { organization: true },
    });
    if (!supplierUser?.email) return;

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const supplierName: string =
      (supplierUser.organization as any)?.name ??
      supplierUser.fullName ??
      supplierUser.email;

    await this.notificationService.sendExternalEmailWithMagicLink({
      to: supplierUser.email,
      subject: `[Cập nhật giao hàng] ${po.poNumber as string}`,
      eventType: 'GRN_MILESTONE_UPDATE',
      referenceId: grnId,
      tokenType: TokenType.GRN_MILESTONE,
      expiresInDays: 7,
      data: {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        poCode: po.poNumber,
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        supplierName,
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        expectedDelivery: po.deliveryDate ?? new Date(),
        completedSteps: ['Đặt hàng', 'Xác nhận PO'],
        currentStep: 'Đang giao hàng',
        pendingSteps: ['Xác nhận nhận hàng'],
        warehouseEmail:
          process.env['WAREHOUSE_EMAIL'] ??
          process.env['EMAIL_FROM_EMAIL'] ??
          '',
      },
    });
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  private async notifyGrnConfirmed(grnId: string, grn: any) {
    const fullGrn = await this.prisma.goodsReceipt.findUnique({
      where: { id: grnId },
      include: { po: { include: { supplier: true } } },
    });
    if (!fullGrn) return;

    const financeUsers = await this.prisma.user.findMany({
      where: {
        orgId: fullGrn.orgId,
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        role: { in: ['FINANCE', 'ADMIN'] as any },
        isActive: true,
      },
    });

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const supplierName = (fullGrn.po as any)?.supplier?.name ?? 'Nhà cung cấp';
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const poCode = (fullGrn.po as any)?.poNumber ?? '';
    const totalAmount = Number((fullGrn.po as any)?.totalAmount ?? 0);

    for (const user of financeUsers) {
      if (!user.email) continue;
      await this.notificationService.sendDirectEmail(
        user.email,
        `[Xác nhận nhận hàng] GRN ${fullGrn.grnNumber}`,
        'GRN_CONFIRMED',
        {
          name: user.fullName || user.email,
          grnCode: fullGrn.grnNumber,
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          poCode,
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          supplierName,
          confirmedAt: new Date(),
          totalAmount,
          loginUrl: process.env['FRONTEND_URL'] ?? '#',
        },
      );
    }
  }
}
