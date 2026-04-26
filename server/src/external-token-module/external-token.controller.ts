import {
  Controller,
  Post,
  Get,
  Delete,
  Body,
  Param,
  Query,
  BadRequestException,
  UseGuards,
} from '@nestjs/common';
import type {
  CreateExternalTokenDto,
  TokenType,
} from './external-token.service';
import { ExternalTokenService as ExternalTokenServiceImpl } from './external-token.service';
import { PrismaService } from '../prisma/prisma.service';
import { AutomationService } from '../common/automation/automation.service';
import { JwtAuthGuard } from '../auth-module/jwt-auth.guard';
import { Throttle } from '@nestjs/throttler';
import {
  SubmitQuotationDto,
  ConfirmPoDto,
  UpdateShipmentDto,
} from './dto/external-token-public.dto';
import { CurrencyCode } from '@prisma/client';

@Controller('external-token')
export class ExternalTokenController {
  constructor(
    private readonly externalTokenService: ExternalTokenServiceImpl,
    private readonly prisma: PrismaService,
    private readonly automationService: AutomationService,
  ) {}

  // ── Internal management endpoints — JWT required ────────────────────────────

  @UseGuards(JwtAuthGuard)
  @Post('create')
  async createToken(@Body() dto: CreateExternalTokenDto) {
    return this.externalTokenService.createToken(dto);
  }

  @UseGuards(JwtAuthGuard)
  @Get('validate/:token')
  async validateToken(@Param('token') token: string) {
    return this.externalTokenService.validateToken(token);
  }

  @UseGuards(JwtAuthGuard)
  @Post('use/:token')
  async markTokenAsUsed(@Param('token') token: string) {
    await this.externalTokenService.markTokenAsUsed(token);
    return { success: true };
  }

  @UseGuards(JwtAuthGuard)
  @Delete('revoke/:token')
  async revokeToken(@Param('token') token: string) {
    await this.externalTokenService.revokeToken(token);
    return { success: true };
  }

  @UseGuards(JwtAuthGuard)
  @Get('by-reference/:referenceId')
  async getActiveTokensByReference(
    @Param('referenceId') referenceId: string,
    @Query('type') type?: TokenType,
  ) {
    return this.externalTokenService.getActiveTokensByReference(
      referenceId,
      type,
    );
  }

  // ── Public endpoints — no JWT, strict rate limiting ─────────────────────────

  /**
   * Lấy thông tin RFQ từ magic link token (không cần đăng nhập).
   * GET /external-token/rfq-public/:token
   */
  @Get('rfq-public/:token')
  async getRfqByToken(@Param('token') token: string) {
    const tokenInfo = await this.externalTokenService.validateToken(token);

    const rfq = await this.prisma.rfqRequest.findUnique({
      where: { id: tokenInfo.referenceId },
      include: {
        items: true,
        createdBy: { select: { fullName: true, email: true } },
      },
    });

    if (!rfq) throw new BadRequestException('RFQ không tồn tại');

    return {
      token: tokenInfo,
      rfq: {
        id: rfq.id,
        rfqNumber: rfq.rfqNumber,
        title: rfq.title,
        description: rfq.description,
        status: rfq.status,
        deadline: rfq.deadline,
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        paymentTerms: (rfq as any).paymentTerms ?? null,
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        deliveryTerms: (rfq as any).deliveryTerms ?? null,
        contactPerson: rfq.createdBy?.fullName ?? null,
        contactEmail: rfq.createdBy?.email ?? null,
        items: rfq.items.map((i: any) => ({
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          id: i.id,
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          name: i.name ?? i.description ?? 'Hàng hóa',
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          description: i.description ?? '',
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          qty: i.qty ?? i.quantity ?? 1,
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          unit: i.unit ?? 'cái',
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          targetPrice: i.targetPrice ?? null,
        })),
      },
    };
  }

  /**
   * Nộp báo giá qua magic link token (không cần đăng nhập).
   * POST /external-token/rfq-public/:token/submit
   */
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Post('rfq-public/:token/submit')
  async submitQuotationByToken(
    @Param('token') token: string,
    @Body() body: SubmitQuotationDto,
  ) {
    const tokenInfo = await this.externalTokenService.validateToken(token);

    const rfq = await this.prisma.rfqRequest.findUnique({
      where: { id: tokenInfo.referenceId },
      include: { suppliers: true },
    });
    if (!rfq) throw new BadRequestException('RFQ không tồn tại');

    let supplierId: string = body.supplierId ?? '';
    if (!supplierId) {
      const user = await this.prisma.user.findFirst({
        where: { email: tokenInfo.targetEmail },
        select: { orgId: true },
      });
      if (!user?.orgId)
        throw new BadRequestException('Không tìm được nhà cung cấp');
      supplierId = user.orgId;
    }

    const quotationNumber = `QUO-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

    const quotation = await this.prisma.rfqQuotation.create({
      data: {
        rfqId: rfq.id,
        supplierId,
        quotationNumber,
        totalPrice: body.totalPrice,
        currency: (body.currency as CurrencyCode) ?? 'VND',
        leadTimeDays: body.leadTimeDays,
        paymentTerms: body.paymentTerms ?? null,
        deliveryTerms: body.deliveryTerms ?? null,
        validityDays: body.validityDays ?? 30,
        notes: body.notes ?? null,
        status: 'SUBMITTED',
        submittedAt: new Date(),
        items: {
          create: (body.items ?? []).map((item: any) => ({
            rfqItem: {
              // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
              connect: { id: item.rfqItemId },
            },
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
            unitPrice: item.unitPrice,
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
            qtyOffered: item.qtyOffered ?? null,
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
            discountPct: item.discountPct ?? 0,
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
            leadTimeDays: item.leadTimeDays ?? null,
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
            notes: item.notes ?? null,
          })),
        },
      },
      include: { items: true },
    });

    await this.externalTokenService.markTokenAsUsed(token);

    return { success: true, quotation };
  }

  // ── PO Confirm public endpoints ─────────────────────────────────────────────

  @Get('po-public/:token')
  async getPoByToken(@Param('token') token: string) {
    const tokenInfo = await this.externalTokenService.validateToken(token);

    const po = await this.prisma.purchaseOrder.findUnique({
      where: { id: tokenInfo.referenceId },
      include: {
        items: true,
        supplier: { select: { name: true } },
        buyer: { select: { fullName: true, email: true } },
      },
    });

    if (!po) throw new BadRequestException('PO không tồn tại');

    return {
      token: tokenInfo,
      po: {
        id: po.id,
        poNumber: po.poNumber,
        status: po.status,
        totalAmount: Number(po.totalAmount),
        currency: po.currency,
        paymentTerms: po.paymentTerms ?? null,
        deliveryAddress: po.deliveryAddress ?? null,
        deliveryDate: po.deliveryDate,
        issuedAt: po.issuedAt,
        notes: po.notes ?? null,
        supplierName: po.supplier?.name ?? null,
        contactPerson: po.buyer?.fullName ?? null,
        contactEmail: po.buyer?.email ?? null,
        items: po.items.map((i: any) => ({
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          id: i.id,
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          description: i.description,
          qty: Number(i.qty),
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          unit: i.unit,
          unitPrice: Number(i.unitPrice),
          total: Number(i.total),
        })),
      },
    };
  }

  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Post('po-public/:token/confirm')
  async confirmPoByToken(
    @Param('token') token: string,
    @Body() body: ConfirmPoDto,
  ) {
    const tokenInfo = await this.externalTokenService.validateToken(token);

    const po = await this.prisma.purchaseOrder.findUnique({
      where: { id: tokenInfo.referenceId },
    });
    if (!po) throw new BadRequestException('PO không tồn tại');

    await this.prisma.purchaseOrder.update({
      where: { id: po.id },
      data: {
        status: 'ACKNOWLEDGED',
        acknowledgedAt: new Date(),
        notes: body.notes
          ? `${po.notes ?? ''}\n[NCC xác nhận]: ${body.notes}`.trim()
          : po.notes,
      },
    });

    await this.externalTokenService.markTokenAsUsed(token);

    void this.automationService
      .handlePoSupplierAccepted(po.id, po.supplierId)
      .catch(() => {});

    return { success: true };
  }

  // ── GRN Shipment Update public endpoints ────────────────────────────────────

  @Get('grn-public/:token')
  async getGrnByToken(@Param('token') token: string) {
    const tokenInfo = await this.externalTokenService.validateToken(token);

    const grn = await this.prisma.goodsReceipt.findUnique({
      where: { id: tokenInfo.referenceId },
      include: {
        po: {
          include: {
            supplier: { select: { name: true } },
            buyer: { select: { fullName: true, email: true } },
            shipmentTracking: { orderBy: { createdAt: 'desc' }, take: 1 },
          },
        },
      },
    });

    if (!grn) throw new BadRequestException('GRN không tồn tại');

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const po = grn.po as any;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const latestTracking = po.shipmentTracking?.[0] ?? null;

    return {
      token: tokenInfo,
      grn: {
        id: grn.id,
        grnNumber: grn.grnNumber,
        po: {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          poNumber: po.poNumber,
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          deliveryDate: po.deliveryDate,
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          supplierName: po.supplier?.name ?? null,
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          contactPerson: po.buyer?.fullName ?? null,
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          contactEmail: po.buyer?.email ?? null,
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          paymentTerms: po.paymentTerms ?? null,
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          deliveryAddress: po.deliveryAddress ?? null,
        },
        tracking: latestTracking
          ? {
              // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
              trackingNumber: latestTracking.trackingNumber ?? null,
              // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
              carrier: latestTracking.carrier ?? null,
              // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
              shippedAt: latestTracking.shippedAt ?? null,
              // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
              estimatedArrival: latestTracking.estimatedArrival ?? null,
            }
          : null,
      },
    };
  }

  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @Post('grn-public/:token/update')
  async updateShipmentByToken(
    @Param('token') token: string,
    @Body() body: UpdateShipmentDto,
  ) {
    const tokenInfo = await this.externalTokenService.validateToken(token);

    const grn = await this.prisma.goodsReceipt.findUnique({
      where: { id: tokenInfo.referenceId },
    });
    if (!grn) throw new BadRequestException('GRN không tồn tại');

    await this.prisma.poShipmentTracking.create({
      data: {
        poId: grn.poId,
        trackingNumber: body.trackingNumber ?? null,
        carrier: body.carrier ?? null,
        shippedAt: body.shippedAt ? new Date(body.shippedAt) : null,
        estimatedArrival: body.estimatedArrival
          ? new Date(body.estimatedArrival)
          : null,
        status: 'SHIPPED',
        notes: body.notes ?? null,
      },
    });

    await this.prisma.purchaseOrder.update({
      where: { id: grn.poId },
      data: { status: 'SHIPPED' },
    });

    return { success: true };
  }
}
