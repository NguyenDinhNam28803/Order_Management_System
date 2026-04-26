import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { InvoiceStatus, PoStatus, CurrencyCode, Prisma, UserRole } from '@prisma/client';
import { AiService } from '../ai-service/ai-service.service';
import {
  CreateInvoiceModuleDto,
  CreateInvoiceItemDto,
} from './dto/create-invoice-module.dto';
import { EmailEventType } from '../notification-module/email-template.service';
import { UpdateInvoiceModuleDto } from './dto/update-invoice-module.dto';
import { NotificationModuleService } from '../notification-module/notification-module.service';
import { JwtPayload } from '../auth-module/interfaces/jwt-payload.interface';

interface MatchingItemResult {
  poItemId: string;
  qtyMatch: boolean;
  priceMatch: boolean;
  variance: number;
}

@Injectable()
export class InvoiceModuleService {
  private readonly logger = new Logger(InvoiceModuleService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationService: NotificationModuleService,
    private readonly aiService: AiService,
  ) {}

  /**
   * Đánh dấu hóa đơn đã thanh toán và cập nhật ngân sách thực tế (Spent)
   */
  async markAsPaid(id: string) {
    const invoice = await this.prisma.supplierInvoice.findUnique({
      where: { id },
      include: { po: true },
    });

    if (!invoice) throw new NotFoundException('Hóa đơn không tồn tại');

    // Chỉ cho phép thanh toán nếu hóa đơn đã được duyệt thanh toán
    const allowedStatuses: InvoiceStatus[] = [
      InvoiceStatus.PAYMENT_APPROVED,
      InvoiceStatus.AUTO_APPROVED,
    ];

    if (!allowedStatuses.includes(invoice.status)) {
      throw new BadRequestException(
        `Không thể thanh toán hóa đơn ở trạng thái: ${invoice.status}. Hóa đơn cần được duyệt trước.`,
      );
    }

    const { po, totalAmount } = invoice;

    return this.prisma.$transaction(async (tx) => {
      // 1. Cập nhật trạng thái hóa đơn
      const updatedInvoice = await tx.supplierInvoice.update({
        where: { id },
        data: {
          status: InvoiceStatus.PAID,
          paidAt: new Date(),
        },
      });

      // 2. Chuyển ngân sách từ Committed sang Spent
      if (po.deptId && po.costCenterId) {
        const budget = await tx.budgetAllocation.findFirst({
          where: {
            orgId: po.orgId,
            deptId: po.deptId,
            costCenterId: po.costCenterId,
            currency: po.currency,
          },
        });

        if (budget) {
          // decrement committedAmount và increment spentAmount
          await tx.budgetAllocation.update({
            where: { id: budget.id },
            data: {
              committedAmount: { decrement: totalAmount },
              spentAmount: { increment: totalAmount },
            },
          });
        }
      }

      return {
        ...updatedInvoice,
        subtotal: Number(updatedInvoice.subtotal),
        taxRate: updatedInvoice.taxRate ? Number(updatedInvoice.taxRate) : null,
        totalAmount: Number(updatedInvoice.totalAmount),
      };
    });
  }

  /**
   * Tạo hóa đơn và kích hoạt đối soát 3 chiều tự động
   */
  async create(createInvoiceDto: CreateInvoiceModuleDto) {
    const { items, poId, grnId, supplierId, orgId, ...invoiceData } =
      createInvoiceDto;

    const invoice = await this.prisma.supplierInvoice.create({
      data: {
        ...invoiceData,
        status: InvoiceStatus.MATCHING,
        // Sử dụng connect thay vì ID trực tiếp để tránh lỗi UncheckedUpdate
        po: { connect: { id: poId } },
        supplier: { connect: { id: supplierId } },
        buyerOrg: { connect: { id: orgId } },
        grn: grnId ? { connect: { id: grnId } } : undefined,
        items: items
          ? {
              create: items.map((item: CreateInvoiceItemDto) => ({
                poItemId: item.poItemId,
                grnItemId: item.grnItemId,
                description: item.description,
                qty: item.qty,
                unitPrice: item.unitPrice,
                total: Number(item.qty) * Number(item.unitPrice),
              })),
            }
          : undefined,
      },
      include: { items: true },
    });

    // Tự động chạy đối soát sau khi tạo (non-blocking, errors are logged)
    this.runThreeWayMatching(invoice.id).catch((err: unknown) => {
      this.logger.error(
        `3-Way Matching failed for invoice ${invoice.id}`,
        err instanceof Error ? err.stack : String(err),
      );
    });

    // Cập nhật trạng thái PO sang INVOICED (Enum chuẩn trong Schema)
    await this.prisma.purchaseOrder.update({
      where: { id: poId },
      data: { status: PoStatus.INVOICED },
    });

    // Serialize Decimal to number
    return {
      ...invoice,
      subtotal: Number(invoice.subtotal),
      taxRate: invoice.taxRate ? Number(invoice.taxRate) : null,
      totalAmount: Number(invoice.totalAmount),
      items: invoice.items?.map((item) => ({
        ...item,
        qty: Number(item.qty),
        unitPrice: Number(item.unitPrice),
        total: Number(item.total),
      })),
    };
  }

  /**
   * Logic Đối soát 3 bên (3-Way Matching) với cơ chế Tolerance (Dung sai)
   * So khớp: Purchase Order (PO) - Goods Receipt (GRN) - Supplier Invoice
   */
  async runThreeWayMatching(invoiceId: string) {
    this.logger.log(`Running 3-way matching for invoice: ${invoiceId}`);

    const invoice = await this.prisma.supplierInvoice.findUnique({
      where: { id: invoiceId },
      include: {
        items: { include: { poItem: true, grnItem: true } },
        po: { include: { items: true } },
        grn: { include: { items: true } },
      },
    });

    if (!invoice) {
      this.logger.warn(`[3-Way] Invoice ${invoiceId} not found`);
      return;
    }

    // Lấy chi tiết GRN nếu chưa có (fallback)
    if (!invoice.grn?.items && invoice.grnId) {
      const grnWithItems = await this.prisma.goodsReceipt.findUnique({
        where: { id: invoice.grnId },
        include: { items: true },
      });
      if (grnWithItems) {
        invoice.grn = grnWithItems;
      }
    }

    // Hoá đơn không có dòng hàng (thường do tạo từ email PDF không parse được)
    // → không thể đối soát, chuyển sang EXCEPTION_REVIEW để Finance xử lý thủ công
    if (invoice.items.length === 0) {
      await this.prisma.supplierInvoice.update({
        where: { id: invoiceId },
        data: {
          status: InvoiceStatus.EXCEPTION_REVIEW,
          exceptionReason:
            'Hoá đơn không có dòng hàng chi tiết — không thể đối soát tự động. Cần kiểm tra và nhập thủ công.',
          matchedAt: new Date(),
        },
      });
      this.logger.warn(
        `[3-Way] Invoice ${invoiceId} has no line items — set EXCEPTION_REVIEW`,
      );
      return;
    }

    // Cấu hình dung sai (Có thể chuyển sang SystemConfig sau này)
    const QTY_TOLERANCE_PCT = 0.02; // 2% cho số lượng
    const PRICE_TOLERANCE_PCT = 0.01; // 1% cho đơn giá

    let matchFailed = false;
    let exceptionReason = '';
    const results: MatchingItemResult[] = [];

    for (const invItem of invoice.items) {
      const poItem = invItem.poItem;
      let grnItem = invItem.grnItem;

      // Fallback: if grnItemId is null but grn exists, find by poItemId
      if (!grnItem && invoice.grn?.items) {
        grnItem =
          invoice.grn.items.find((g) => g.poItemId === invItem.poItemId) ||
          null;
        if (!grnItem) {
          // Try matching by id as fallback
          const byId = invoice.grn.items.find((g) => g.id === invItem.poItemId);
          if (byId) {
            grnItem = byId;
          }
        }
      }

      const itemMatch: MatchingItemResult = {
        poItemId: invItem.poItemId,
        qtyMatch: false,
        priceMatch: false,
        variance: 0,
      };

      // 1. Kiểm tra số lượng: Invoice Qty <= GRN Accepted Qty * (1 + Tolerance)
      // Lý do: Phải dùng acceptedQty (sau QC) thay vì receivedQty (trước QC)
      // để đảm bảo chỉ thanh toán cho hàng đạt chuẩn
      if (grnItem) {
        const invQty = Number(invItem.qty);
        const acceptedQty = Number(grnItem.acceptedQty);
        const receivedQty = Number(grnItem.receivedQty);

        // Nếu acceptedQty = 0, dùng receivedQty (trường hợp chưa QC)
        const effectiveQty = acceptedQty > 0 ? acceptedQty : receivedQty;
        const maxAllowedQty = effectiveQty * (1 + QTY_TOLERANCE_PCT);

        itemMatch.qtyMatch = invQty <= maxAllowedQty;
        if (!itemMatch.qtyMatch) {
          exceptionReason += `Dòng ${invItem.poItemId}: Số lượng hóa đơn (${invQty}) vượt quá số lượng đạt chuẩn (${effectiveQty}) sau QC (max: ${maxAllowedQty.toFixed(2)}). `;
        }
      } else {
        itemMatch.qtyMatch = false;
        exceptionReason += `Dòng ${invItem.poItemId}: Không tìm thấy thông tin nhận kho (GRN). Kiểm tra grnItemId trong invoice item. `;
        this.logger.warn(
          `[3-Way] Missing grnItem for invoice item ${invItem.id}, poItemId: ${invItem.poItemId}`,
        );
      }

      // 2. Kiểm tra đơn giá: Invoice Price <= PO Price * (1 + Tolerance)
      if (poItem) {
        const invPrice = Number(invItem.unitPrice);
        const poPrice = Number(poItem.unitPrice);
        const maxAllowedPrice = poPrice * (1 + PRICE_TOLERANCE_PCT);

        itemMatch.priceMatch = invPrice <= maxAllowedPrice;
        if (!itemMatch.priceMatch) {
          exceptionReason += `Dòng ${invItem.poItemId}: Đơn giá hóa đơn (${invPrice}) vượt quá đơn giá PO (${poPrice}) quá mức cho phép. `;
        }
      }

      if (!itemMatch.qtyMatch || !itemMatch.priceMatch) {
        matchFailed = true;
      }

      results.push(itemMatch);
    }

    // Cập nhật kết quả đối soát
    const finalStatus = matchFailed
      ? InvoiceStatus.EXCEPTION_REVIEW
      : InvoiceStatus.AUTO_APPROVED;

    await this.prisma.supplierInvoice.update({
      where: { id: invoiceId },
      data: {
        status: finalStatus,
        exceptionReason: matchFailed ? exceptionReason : null,
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        matchingResult: results as any,
        matchedAt: new Date(),
      },
    });

    this.logger.log(
      `Matching finished for ${invoiceId}. Result: ${finalStatus}`,
    );

    // Notify Finance team when manual review is required
    if (finalStatus === InvoiceStatus.EXCEPTION_REVIEW) {
      const financeUsers = await this.prisma.user.findMany({
        where: {
          orgId: invoice.orgId,
          role: UserRole.FINANCE,
          isActive: true,
        },
        select: { id: true, email: true, fullName: true },
      });

      for (const fu of financeUsers) {
        if (fu.email) {
          this.notificationService
            .sendDirectEmail(
              fu.email,
              `[ProcureSmart] Hóa đơn ${invoice.invoiceNumber} cần xét duyệt thủ công`,
              'INVOICE_SUBMIT_LINK' as EmailEventType,
              {
                recipientName: fu.fullName,
                invoiceNumber: invoice.invoiceNumber,
                exceptionReason,
                invoiceId,
              },
            )
            .catch((err: unknown) => {
              this.logger.warn(
                `Failed to notify finance user ${fu.id} about invoice exception`,
                err instanceof Error ? err.stack : String(err),
              );
            });
        }
      }
    }
  }

  /**
   * Finance override: thủ công duyệt bỏ qua exception trong 3-way matching
   */
  async approveMatchingException(invoiceId: string, user: JwtPayload) {
    const invoice = await this.prisma.supplierInvoice.findUnique({
      where: { id: invoiceId },
    });

    if (!invoice) throw new NotFoundException('Hóa đơn không tồn tại');

    if (invoice.status !== InvoiceStatus.EXCEPTION_REVIEW) {
      throw new BadRequestException(
        `Chỉ có thể duyệt exception ở trạng thái EXCEPTION_REVIEW. Hiện tại: ${invoice.status}`,
      );
    }

    const updated = await this.prisma.supplierInvoice.update({
      where: { id: invoiceId },
      data: {
        status: InvoiceStatus.PAYMENT_APPROVED,
        approvedAt: new Date(),
        approvedById: user.sub,
        exceptionReason: invoice.exceptionReason
          ? `[Override by ${user.sub}] ${invoice.exceptionReason}`
          : null,
      },
    });

    this.logger.log(
      `Invoice ${invoiceId} exception approved by user ${user.sub}`,
    );

    return {
      ...updated,
      subtotal: Number(updated.subtotal),
      taxRate: updated.taxRate ? Number(updated.taxRate) : null,
      totalAmount: Number(updated.totalAmount),
    };
  }

  async update(id: string, updateInvoiceDto: UpdateInvoiceModuleDto) {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { items, poId, grnId, supplierId, orgId, ...updateData } =
      updateInvoiceDto;

    // Tạo đối tượng data cho Prisma update
    const data: Prisma.SupplierInvoiceUpdateInput = {
      ...updateData,
    };

    // Xử lý các liên kết nếu có thay đổi ID
    if (poId) data.po = { connect: { id: poId } };
    if (supplierId) data.supplier = { connect: { id: supplierId } };
    if (orgId) data.buyerOrg = { connect: { id: orgId } };
    if (grnId) data.grn = { connect: { id: grnId } };

    const updated = await this.prisma.supplierInvoice.update({
      where: { id },
      data,
      include: { items: true },
    });

    // Serialize Decimal to number
    return {
      ...updated,
      subtotal: Number(updated.subtotal),
      taxRate: updated.taxRate ? Number(updated.taxRate) : null,
      totalAmount: Number(updated.totalAmount),
      items: updated.items?.map((item) => ({
        ...item,
        qty: Number(item.qty),
        unitPrice: Number(item.unitPrice),
        total: Number(item.total),
      })),
    };
  }

  async remove(id: string) {
    return this.prisma.supplierInvoice.delete({
      where: { id },
    });
  }

  /**
   * Dùng AI phân tích nội dung text (từ email / Zalo / điện thoại) để tạo hoá đơn tự động.
   * Procurement paste nội dung NCC gửi vào → AI trích xuất số liệu → tạo invoice draft.
   */
  async createFromText(
    rawText: string,
    supplierId: string,
    orgId: string,
    user: JwtPayload,
  ) {
    // 1. Dùng AI phân tích nội dung
    const analysis = await this.aiService.analyzeEmailContent(rawText);

    if (analysis.intent !== 'INVOICE_SUBMISSION' || analysis.confidence < 0.5) {
      throw new BadRequestException(
        `Nội dung không được nhận diện là hoá đơn (intent: ${analysis.intent}, confidence: ${analysis.confidence}). Vui lòng nhập tay.`,
      );
    }

    const data = analysis.data as {
      invoiceNumber?: string;
      poNumber?: string;
      invoiceDate?: string;
      dueDate?: string;
      subtotal?: number;
      taxRate?: number;
      taxAmount?: number;
      totalAmount?: number;
      currency?: string;
      paymentTerms?: string;
      eInvoiceRef?: string;
      notes?: string;
    };

    // 2. Tìm PO liên quan
    let po: { id: string } | null = null;
    if (data.poNumber) {
      po = await this.prisma.purchaseOrder.findFirst({
        where: { poNumber: data.poNumber, supplierId },
        select: { id: true },
      });
    }
    if (!po) {
      po = await this.prisma.purchaseOrder.findFirst({
        where: {
          supplierId,
          orgId,
          status: { in: [PoStatus.SHIPPED, PoStatus.GRN_CREATED, PoStatus.ACKNOWLEDGED, PoStatus.IN_PROGRESS] },
        },
        orderBy: { createdAt: 'desc' },
        select: { id: true },
      });
    }
    if (!po) {
      throw new BadRequestException(
        'Không tìm thấy PO phù hợp. Vui lòng tạo hoá đơn thủ công và chọn PO.',
      );
    }

    // 3. Tính tài chính
    const subtotal = data.subtotal ?? data.totalAmount ?? 0;
    const taxRate = data.taxRate ?? 10;
    const taxAmount = data.taxAmount ?? (subtotal * taxRate) / 100;
    const totalAmount = data.totalAmount ?? subtotal + taxAmount;
    const currency = (data.currency as CurrencyCode) ?? CurrencyCode.VND;
    const invoiceNumber = data.invoiceNumber ?? `INV-AI-${Date.now()}`;

    // 4. Tạo hoá đơn với status DRAFT để procurement xem lại trước khi submit
    const invoice = await this.prisma.supplierInvoice.create({
      data: {
        invoiceNumber,
        status: InvoiceStatus.DRAFT,
        invoiceDate: data.invoiceDate ? new Date(data.invoiceDate) : new Date(),
        dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
        subtotal,
        taxRate,
        taxAmount,
        totalAmount,
        currency,
        paymentTerms: data.paymentTerms ?? undefined,
        eInvoiceRef: data.eInvoiceRef ?? undefined,
        notes: `[AI từ text] confidence: ${analysis.confidence}${data.notes ? `\n${data.notes}` : ''}`,
        po: { connect: { id: po.id } },
        supplier: { connect: { id: supplierId } },
        buyerOrg: { connect: { id: orgId } },
      },
    });

    this.logger.log(
      `[AI-Text] Tạo hoá đơn draft ${invoice.id} (${invoiceNumber}) bởi ${user.email}`,
    );

    return {
      ...invoice,
      subtotal: Number(invoice.subtotal),
      taxRate: invoice.taxRate ? Number(invoice.taxRate) : null,
      totalAmount: Number(invoice.totalAmount),
      aiConfidence: analysis.confidence,
      message: 'Hoá đơn draft được tạo từ AI. Vui lòng kiểm tra và submit.',
    };
  }

  async findAll(orgId: string) {
    const invoices = await this.prisma.supplierInvoice.findMany({
      where: { orgId },
      include: { po: true, supplier: true, items: true },
    });
    // Serialize Decimal to number
    return invoices.map((inv) => ({
      ...inv,
      subtotal: Number(inv.subtotal),
      taxRate: inv.taxRate ? Number(inv.taxRate) : null,
      totalAmount: Number(inv.totalAmount),
      items: inv.items?.map((item) => ({
        ...item,
        qty: Number(item.qty),
        unitPrice: Number(item.unitPrice),
        total: Number(item.total),
      })),
    }));
  }

  async findOne(id: string) {
    const inv = await this.prisma.supplierInvoice.findUnique({
      where: { id },
      include: { po: true, supplier: true, items: true },
    });
    if (!inv) return null;
    // Serialize Decimal to number
    return {
      ...inv,
      subtotal: Number(inv.subtotal),
      taxRate: inv.taxRate ? Number(inv.taxRate) : null,
      totalAmount: Number(inv.totalAmount),
      items: inv.items?.map((item) => ({
        ...item,
        qty: Number(item.qty),
        unitPrice: Number(item.unitPrice),
        total: Number(item.total),
      })),
    };
  }
}
