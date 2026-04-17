import {
  Controller,
  Post,
  Get,
  Delete,
  Body,
  Param,
  Query,
  BadRequestException,
} from '@nestjs/common';
import type {
  CreateExternalTokenDto,
  TokenType,
} from './external-token.service';
import { ExternalTokenService as ExternalTokenServiceImpl } from './external-token.service';
import { PrismaService } from '../prisma/prisma.service';

@Controller('external-token')
export class ExternalTokenController {
  constructor(
    private readonly externalTokenService: ExternalTokenServiceImpl,
    private readonly prisma: PrismaService,
  ) {}

  @Post('create')
  async createToken(@Body() dto: CreateExternalTokenDto) {
    return this.externalTokenService.createToken(dto);
  }

  @Get('validate/:token')
  async validateToken(@Param('token') token: string) {
    return this.externalTokenService.validateToken(token);
  }

  @Post('use/:token')
  async markTokenAsUsed(@Param('token') token: string) {
    await this.externalTokenService.markTokenAsUsed(token);
    return { success: true };
  }

  @Delete('revoke/:token')
  async revokeToken(@Param('token') token: string) {
    await this.externalTokenService.revokeToken(token);
    return { success: true };
  }

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

  // ── Public endpoints — no JWT required ─────────────────────────────────────

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
   * Body: { supplierId, totalPrice, leadTimeDays, paymentTerms?, deliveryTerms?, notes?, items: [{rfqItemId, unitPrice, qtyOffered?, notes?}] }
   */
  @Post('rfq-public/:token/submit')
  async submitQuotationByToken(
    @Param('token') token: string,
    @Body() body: any,
  ) {
    const tokenInfo = await this.externalTokenService.validateToken(token);

    const rfq = await this.prisma.rfqRequest.findUnique({
      where: { id: tokenInfo.referenceId },
      include: { suppliers: true },
    });
    if (!rfq) throw new BadRequestException('RFQ không tồn tại');

    // Tìm supplierId từ targetEmail nếu body không truyền
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    let supplierId: string = body.supplierId;
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
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        totalPrice: body.totalPrice,
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        currency: body.currency ?? 'VND',
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        leadTimeDays: body.leadTimeDays,
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        paymentTerms: body.paymentTerms ?? null,
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        deliveryTerms: body.deliveryTerms ?? null,
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        validityDays: body.validityDays ?? 30,
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        notes: body.notes ?? null,
        status: 'SUBMITTED',
        submittedAt: new Date(),
        items: {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          create: (body.items ?? []).map((item: any) => ({
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
            rfqItemId: item.rfqItemId,
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
            unitPrice: item.unitPrice,
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
            qtyOffered: item.qtyOffered ?? null,
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
            discountPct: item.discountPct ?? null,
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
            leadTimeDays: item.leadTimeDays ?? null,
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
            notes: item.notes ?? null,
          })),
        },
      },
      include: { items: true },
    });

    // Đánh dấu token đã dùng — không thể gửi báo giá lại qua link này
    await this.externalTokenService.markTokenAsUsed(token);

    return { success: true, quotation };
  }
}
