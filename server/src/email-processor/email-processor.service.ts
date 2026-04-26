import { Injectable, Logger } from '@nestjs/common';
import { AiService } from '../ai-service/ai-service.service';
import { PrismaService } from '../prisma/prisma.service';
import { EmailRagService, ParsedEmail } from '../rag/email-rag.service';
import { NotificationModuleService } from '../notification-module/notification-module.service';
import { InvoiceModuleService } from '../invoice-module/invoice-module.service';
import {
  RfqStatus,
  PoStatus,
  QuotationStatus,
  CompanyType,
  InvoiceStatus,
  CurrencyCode,
  UserRole,
} from '@prisma/client';

const CONFIDENCE_THRESHOLD = 0.65;

export interface IncomingEmailData {
  from: string;
  subject: string;
  body: string;
  messageId: string;
  attachments?: string[];
}

export interface EmailProcessResult {
  success: boolean;
  intent?: string;
  action?: string;
  entityId?: string;
  reason?: string;
  ingested: boolean;
}

export interface QuotationEmailData {
  rfqNumber?: string;
  quotationNumber?: string;
  totalPrice?: number;
  currency?: string;
  leadTimeDays?: number;
  validityDays?: number;
  paymentTerms?: string;
  deliveryTerms?: string;
  items?: Array<{
    description: string;
    qty: number;
    unitPrice: number;
    unit?: string;
  }>;
}

export interface PoConfirmationEmailData {
  poNumber: string;
  estimatedDelivery?: string;
  notes?: string;
}

export interface ShippingNotificationEmailData {
  poNumber: string;
  trackingNumber?: string;
  carrier?: string;
  shippedDate?: string;
  estimatedArrival?: string;
  notes?: string;
}

export interface InvoiceEmailData {
  poNumber: string;
  invoiceNumber?: string;
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
}

@Injectable()
export class EmailProcessorService {
  private readonly logger = new Logger(EmailProcessorService.name);

  constructor(
    private readonly aiService: AiService,
    private readonly prisma: PrismaService,
    private readonly emailRagService: EmailRagService,
    private readonly notificationService: NotificationModuleService,
    private readonly invoiceService: InvoiceModuleService,
  ) {}

  /**
   * Xử lý email đến từ nhà cung cấp:
   * 1. Ingest vào RAG
   * 2. AI phân loại intent: QUOTATION | PO_CONFIRMATION | SHIPPING_NOTIFICATION
   * 3. Thực hiện hành động nghiệp vụ tương ứng
   */
  async processIncomingEmail(
    emailData: IncomingEmailData,
  ): Promise<EmailProcessResult> {
    const { from, subject, body, messageId } = emailData;

    // ── Bước 1: Ingest vào RAG ngay lập tức ──────────────────────────────────
    const parsedEmail: ParsedEmail = {
      messageId,
      subject,
      from,
      to: '',
      date: new Date(),
      body,
    };
    await this.emailRagService
      .ingestSingleEmail(parsedEmail)
      .catch((err: Error) => {
        this.logger.warn(`RAG ingest failed for "${subject}": ${err.message}`);
      });

    // ── Bước 2: AI phân tích intent ───────────────────────────────────────────
    const analysis = await this.aiService.analyzeEmailContent(
      `Tiêu đề: ${subject}\n\n${body}`,
    );

    this.logger.log(
      `Email "${subject}" từ ${from} → intent: ${analysis.intent}, confidence: ${analysis.confidence}`,
    );

    if ((analysis.confidence ?? 0) < CONFIDENCE_THRESHOLD) {
      this.logger.log(
        `Confidence thấp (${analysis.confidence ?? 'undefined'}), bỏ qua xử lý tự động`,
      );
      return { success: false, reason: 'Low confidence', ingested: true };
    }

    if (analysis.intent === 'GENERAL_INQUIRY') {
      return {
        success: true,
        intent: 'GENERAL_INQUIRY',
        action: 'none',
        ingested: true,
      };
    }

    // ── Bước 3: Tìm nhà cung cấp gửi email ───────────────────────────────────
    const senderEmail = this.extractEmail(from);
    const supplier = senderEmail
      ? await this.findSupplierByEmail(senderEmail)
      : null;

    if (!supplier) {
      this.logger.warn(
        `Không tìm thấy nhà cung cấp cho email "${from}" trong hệ thống`,
      );
      return {
        success: false,
        intent: analysis.intent,
        reason: 'Supplier not found in system',
        ingested: true,
      };
    }

    // ── Bước 4: Điều phối theo intent ────────────────────────────────────────
    switch (analysis.intent) {
      case 'QUOTATION':
        return this.handleQuotation(
          analysis.data as QuotationEmailData,
          supplier.id,
          subject,
        );
      case 'PO_CONFIRMATION':
        return this.handlePoConfirmation(
          analysis.data as PoConfirmationEmailData,
          supplier.id,
        );
      case 'SHIPPING_NOTIFICATION':
        return this.handleShippingNotification(
          analysis.data as ShippingNotificationEmailData,
          supplier.id,
          subject,
        );
      case 'INVOICE_SUBMISSION':
        return this.handleInvoiceSubmission(
          analysis.data as InvoiceEmailData,
          supplier.id,
          subject,
          emailData.messageId,
        );
      default:
        return { success: false, reason: 'Unhandled intent', ingested: true };
    }
  }

  // ── Xử lý email báo giá từ nhà cung cấp ─────────────────────────────────
  private async handleQuotation(
    data: QuotationEmailData,
    supplierId: string,
    subject: string,
  ): Promise<EmailProcessResult> {
    // ── 1. Tìm RFQ theo rfqNumber hoặc RFQ mở mới nhất của NCC này ──────────
    let rfq: { id: string; orgId: string } | null = null;

    if (data.rfqNumber) {
      rfq = await this.prisma.rfqRequest.findFirst({
        where: { rfqNumber: data.rfqNumber },
        select: { id: true, orgId: true },
      });
    }

    if (!rfq) {
      // Fallback: RFQ ở trạng thái SENT hoặc SUPPLIER_REVIEWING có NCC trong danh sách mời
      rfq = await this.prisma.rfqRequest.findFirst({
        where: {
          status: { in: [RfqStatus.SENT, RfqStatus.SUPPLIER_REVIEWING] },
          suppliers: { some: { supplierId } },
        },
        orderBy: { createdAt: 'desc' },
        select: { id: true, orgId: true },
      });
    }

    if (!rfq) {
      this.logger.warn(
        `Không tìm thấy RFQ phù hợp cho báo giá từ supplier ${supplierId}`,
      );
      return {
        success: false,
        intent: 'QUOTATION',
        reason: 'No matching RFQ found',
        ingested: true,
      };
    }

    const quotationNumber = data.quotationNumber ?? `QUO-EMAIL-${Date.now()}`;
    const totalPrice = data.totalPrice ?? 0;
    const leadTimeDays = data.leadTimeDays ?? 7;
    const validityDays = data.validityDays ?? 30;

    // ── 2. Idempotency: kiểm tra quotationNumber đã tồn tại chưa ───────────
    const byNumber = await this.prisma.rfqQuotation.findFirst({
      where: { quotationNumber, supplierId },
      select: { id: true },
    });
    if (byNumber) {
      this.logger.log(
        `Báo giá ${quotationNumber} đã tồn tại (${byNumber.id}), bỏ qua`,
      );
      return {
        success: true,
        intent: 'QUOTATION',
        action: 'duplicate_skipped',
        entityId: byNumber.id,
        ingested: true,
      };
    }

    // ── 3. Lấy RfqItem records để map với line items từ email ────────────────
    const rfqItems = await this.prisma.rfqItem.findMany({
      where: { rfqId: rfq.id },
      select: { id: true, description: true, lineNumber: true },
      orderBy: { lineNumber: 'asc' },
    });

    // ── 4. Transaction: tạo/cập nhật quotation + status + line items ─────────
    const { quotationId, isNew } = await this.prisma.$transaction(
      async (tx) => {
        const existing = await tx.rfqQuotation.findFirst({
          where: { rfqId: rfq!.id, supplierId },
          select: { id: true },
        });

        let qId: string;
        let created = false;

        if (existing) {
          await tx.rfqQuotation.update({
            where: { id: existing.id },
            data: {
              quotationNumber,
              totalPrice,
              currency: (data.currency as CurrencyCode) ?? CurrencyCode.VND,
              leadTimeDays,
              validityDays,
              paymentTerms: data.paymentTerms ?? null,
              deliveryTerms: data.deliveryTerms ?? null,
              notes: `[Email] ${subject}`,
              status: QuotationStatus.SUBMITTED,
              submittedAt: new Date(),
            },
          });
          // Xóa line items cũ rồi tạo lại với dữ liệu mới
          await tx.rfqQuotationItem.deleteMany({
            where: { quotationId: existing.id },
          });
          qId = existing.id;
        } else {
          const newQ = await tx.rfqQuotation.create({
            data: {
              rfqId: rfq!.id,
              supplierId,
              quotationNumber,
              totalPrice,
              currency: (data.currency as CurrencyCode) ?? CurrencyCode.VND,
              leadTimeDays,
              validityDays,
              paymentTerms: data.paymentTerms ?? null,
              deliveryTerms: data.deliveryTerms ?? null,
              notes: `[Email] ${subject}`,
              status: QuotationStatus.SUBMITTED,
              submittedAt: new Date(),
            },
          });
          qId = newQ.id;
          created = true;
        }

        // Tạo RfqQuotationItem khi AI trích xuất được line items
        const emailItems = data.items ?? [];
        if (emailItems.length > 0 && rfqItems.length > 0) {
          const itemsToCreate = emailItems.map((emailItem, idx) => {
            // Tìm RfqItem khớp theo mô tả (không phân biệt hoa thường)
            const descLower = (emailItem.description ?? '').toLowerCase();
            let rfqItem = rfqItems.find((r) =>
              r.description.toLowerCase().includes(descLower) ||
              descLower.includes(r.description.toLowerCase()),
            );
            // Fallback: khớp theo thứ tự index nếu không tìm được
            if (!rfqItem) rfqItem = rfqItems[idx];
            if (!rfqItem) return null;

            return {
              quotationId: qId,
              rfqItemId: rfqItem.id,
              unitPrice: emailItem.unitPrice ?? 0,
              qtyOffered: emailItem.qty ?? null,
              leadTimeDays: leadTimeDays ?? null,
              notes: emailItem.unit ? `unit: ${emailItem.unit}` : null,
            };
          }).filter((item): item is NonNullable<typeof item> => item !== null);

          if (itemsToCreate.length > 0) {
            await tx.rfqQuotationItem.createMany({ data: itemsToCreate });
          }
        }

        // Cập nhật RFQ status nếu cần
        const rfqCurrent = await tx.rfqRequest.findUnique({
          where: { id: rfq!.id },
          select: { status: true },
        });
        if (
          rfqCurrent &&
          rfqCurrent.status !== RfqStatus.QUOTATION_RECEIVED &&
          rfqCurrent.status !== RfqStatus.AWARDED &&
          rfqCurrent.status !== RfqStatus.CLOSED
        ) {
          await tx.rfqRequest.update({
            where: { id: rfq!.id },
            data: { status: RfqStatus.QUOTATION_RECEIVED },
          });
          this.logger.log(`RFQ ${rfq!.id} → QUOTATION_RECEIVED`);
        }

        return { quotationId: qId, isNew: created };
      },
    );

    this.logger.log(
      `${isNew ? 'Tạo' : 'Cập nhật'} RfqQuotation ${quotationId} từ email NCC ${supplierId}`,
    );

    // ── 5. Gửi thông báo QUOTATION_RECEIVED cho người phụ trách RFQ ──────────
    void this.notifyQuotationReceivedFromEmail(rfq.id, supplierId).catch(
      (err: Error) =>
        this.logger.warn(`Gửi thông báo quotation thất bại: ${err.message}`),
    );

    return {
      success: true,
      intent: 'QUOTATION',
      action: isNew ? 'created_quotation' : 'updated_quotation',
      entityId: quotationId,
      ingested: true,
    };
  }

  /** Gửi email QUOTATION_RECEIVED tới người tạo RFQ */
  private async notifyQuotationReceivedFromEmail(
    rfqId: string,
    supplierId: string,
  ): Promise<void> {
    const [rfq, supplierOrg, quotationCount] = await Promise.all([
      this.prisma.rfqRequest.findUnique({
        where: { id: rfqId },
        include: { createdBy: { select: { fullName: true, email: true } } },
      }),
      this.prisma.organization.findUnique({
        where: { id: supplierId },
        select: { name: true },
      }),
      this.prisma.rfqQuotation.count({ where: { rfqId } }),
    ]);

    const creator = rfq?.createdBy as { fullName?: string; email?: string } | null;
    if (!rfq || !creator?.email) return;

    await this.notificationService.sendDirectEmail(
      creator.email,
      `[Báo giá mới] ${rfq.rfqNumber} — ${rfq.title ?? ''}`,
      'QUOTATION_RECEIVED',
      {
        name: creator.fullName ?? creator.email,
        rfqNumber: rfq.rfqNumber,
        rfqTitle: rfq.title ?? '',
        supplierName: supplierOrg?.name ?? 'Nhà cung cấp',
        quotationCount,
        loginUrl: process.env['FRONTEND_URL'] ?? '#',
      },
    );
  }

  // ── Xử lý email xác nhận PO từ nhà cung cấp ─────────────────────────────
  private async handlePoConfirmation(
    data: PoConfirmationEmailData,
    supplierId: string,
  ): Promise<EmailProcessResult> {
    const po = await this.findPoByNumberOrSupplier(data.poNumber, supplierId, [
      PoStatus.ISSUED,
    ]);

    if (!po) {
      this.logger.warn(
        `Không tìm thấy PO cho xác nhận từ supplier ${supplierId}, poNumber: ${data.poNumber ?? 'N/A'}`,
      );
      return {
        success: false,
        intent: 'PO_CONFIRMATION',
        reason: 'No matching PO found',
        ingested: true,
      };
    }

    let notes = po.notes ?? '';
    if (data.estimatedDelivery) {
      notes =
        `${notes}\n[NCC xác nhận] Dự kiến giao hàng: ${data.estimatedDelivery}`.trim();
    }
    if (data.notes) {
      notes = `${notes}\n${data.notes}`.trim();
    }

    await this.prisma.purchaseOrder.update({
      where: { id: po.id },
      data: {
        status: PoStatus.ACKNOWLEDGED,
        notes: notes || null,
      },
    });

    this.logger.log(`PO ${po.id} → ACKNOWLEDGED (xác nhận từ email NCC)`);
    return {
      success: true,
      intent: 'PO_CONFIRMATION',
      action: 'po_acknowledged',
      entityId: po.id,
      ingested: true,
    };
  }

  // ── Xử lý email thông báo giao hàng từ nhà cung cấp ─────────────────────
  private async handleShippingNotification(
    data: ShippingNotificationEmailData,
    supplierId: string,
    subject: string,
  ): Promise<EmailProcessResult> {
    const po = await this.findPoByNumberOrSupplier(data.poNumber, supplierId, [
      PoStatus.ACKNOWLEDGED,
      PoStatus.IN_PROGRESS,
      PoStatus.ISSUED,
    ]);

    if (!po) {
      this.logger.warn(
        `Không tìm thấy PO cho shipping notification từ supplier ${supplierId}, poNumber: ${data.poNumber ?? 'N/A'}`,
      );
      return {
        success: false,
        intent: 'SHIPPING_NOTIFICATION',
        reason: 'No matching PO found',
        ingested: true,
      };
    }

    const trackingParts: string[] = [];
    if (data.trackingNumber)
      trackingParts.push(`Mã vận đơn: ${data.trackingNumber}`);
    if (data.carrier) trackingParts.push(`Đơn vị VC: ${data.carrier}`);
    if (data.shippedDate)
      trackingParts.push(`Ngày xuất kho: ${data.shippedDate}`);
    if (data.estimatedArrival)
      trackingParts.push(`Dự kiến đến: ${data.estimatedArrival}`);
    if (data.notes) trackingParts.push(data.notes);

    const shippingNote = `[NCC thông báo giao hàng] ${subject}\n${trackingParts.join(' | ')}`;
    const notes = po.notes ? `${po.notes}\n${shippingNote}` : shippingNote;

    await this.prisma.purchaseOrder.update({
      where: { id: po.id },
      data: {
        status: PoStatus.SHIPPED,
        notes: notes.trim(),
      },
    });

    this.logger.log(
      `PO ${po.id} → SHIPPED (tracking: ${data.trackingNumber ?? 'N/A'})`,
    );
    return {
      success: true,
      intent: 'SHIPPING_NOTIFICATION',
      action: 'po_shipped',
      entityId: po.id,
      ingested: true,
    };
  }

  // ── Xử lý email hoá đơn từ nhà cung cấp ─────────────────────────────────
  private async handleInvoiceSubmission(
    data: InvoiceEmailData,
    supplierId: string,
    subject: string,
    messageId: string,
  ): Promise<EmailProcessResult> {
    // 1. Tìm PO liên quan (theo poNumber hoặc PO mới nhất ở trạng thái phù hợp)
    const po = await this.findPoForInvoice(data.poNumber, supplierId);
    if (!po) {
      this.logger.warn(
        `Không tìm thấy PO cho hoá đơn từ supplier ${supplierId}, poNumber: ${data.poNumber ?? 'N/A'}`,
      );
      return {
        success: false,
        intent: 'INVOICE_SUBMISSION',
        reason: 'No matching PO found',
        ingested: true,
      };
    }

    // 2. Tìm GRN mới nhất của PO này (nếu có)
    const grn = await this.prisma.goodsReceipt.findFirst({
      where: { poId: po.id },
      orderBy: { createdAt: 'desc' },
      select: { id: true },
    });

    // 3. Sinh số hoá đơn nếu AI không trích được
    const invoiceNumber = data.invoiceNumber ?? `INV-EMAIL-${Date.now()}`;

    // Idempotency: tránh tạo trùng nếu email bị xử lý 2 lần
    const existing = await this.prisma.supplierInvoice.findFirst({
      where: { invoiceNumber, supplierId },
      select: { id: true },
    });
    if (existing) {
      this.logger.log(`Hoá đơn ${invoiceNumber} đã tồn tại, bỏ qua`);
      return {
        success: true,
        intent: 'INVOICE_SUBMISSION',
        action: 'duplicate_skipped',
        entityId: existing.id,
        ingested: true,
      };
    }

    // 4. Tính toán các giá trị tài chính
    const subtotal = data.subtotal ?? data.totalAmount ?? 0;
    const taxRate = data.taxRate ?? 10;
    const taxAmount = data.taxAmount ?? (subtotal * taxRate) / 100;
    const totalAmount = data.totalAmount ?? subtotal + taxAmount;
    const currency = (data.currency as CurrencyCode) ?? CurrencyCode.VND;

    // 5. Tạo hoá đơn + cập nhật PO status trong transaction
    const invoice = await this.prisma.$transaction(async (tx) => {
      const created = await tx.supplierInvoice.create({
        data: {
          invoiceNumber,
          status: InvoiceStatus.MATCHING,
          invoiceDate: data.invoiceDate ? new Date(data.invoiceDate) : new Date(),
          dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
          subtotal,
          taxRate,
          taxAmount,
          totalAmount,
          currency,
          paymentTerms: data.paymentTerms ?? undefined,
          eInvoiceRef: data.eInvoiceRef ?? undefined,
          notes: `[Tạo tự động từ email] ${subject}\nMessage-ID: ${messageId}${data.notes ? `\n${data.notes}` : ''}`,
          po: { connect: { id: po.id } },
          supplier: { connect: { id: supplierId } },
          buyerOrg: { connect: { id: po.orgId } },
          grn: grn ? { connect: { id: grn.id } } : undefined,
        },
      });

      // Cập nhật PO → INVOICED (nhất quán với luồng tạo qua UI)
      await tx.purchaseOrder.update({
        where: { id: po.id },
        data: { status: PoStatus.INVOICED },
      });

      return created;
    });

    this.logger.log(
      `Tạo hoá đơn ${invoice.id} (${invoiceNumber}) từ email NCC ${supplierId} — PO ${po.id} → INVOICED`,
    );

    // 6. Kích hoạt 3-way matching (non-blocking)
    this.invoiceService
      .runThreeWayMatching(invoice.id)
      .catch((err: Error) =>
        this.logger.error(
          `3-way matching thất bại cho invoice ${invoice.id}: ${err.message}`,
        ),
      );

    // 7. Thông báo đội Finance về hóa đơn mới (non-blocking)
    void this.notifyFinanceInvoiceReceived(invoice.id, supplierId, po.orgId).catch(
      (err: Error) =>
        this.logger.warn(`Gửi thông báo Finance thất bại: ${err.message}`),
    );

    return {
      success: true,
      intent: 'INVOICE_SUBMISSION',
      action: 'invoice_created',
      entityId: invoice.id,
      ingested: true,
    };
  }

  /** Thông báo toàn bộ Finance team khi nhận hóa đơn mới qua email */
  private async notifyFinanceInvoiceReceived(
    invoiceId: string,
    supplierId: string,
    orgId: string,
  ): Promise<void> {
    const [invoice, supplier, financeUsers] = await Promise.all([
      this.prisma.supplierInvoice.findUnique({
        where: { id: invoiceId },
        include: { po: { select: { poNumber: true } } },
      }),
      this.prisma.organization.findUnique({
        where: { id: supplierId },
        select: { name: true },
      }),
      this.prisma.user.findMany({
        where: { orgId, role: UserRole.FINANCE, isActive: true },
        select: { id: true, email: true, fullName: true },
      }),
    ]);

    if (!invoice) return;

    const frontendUrl = process.env['FRONTEND_URL'] ?? '#';

    // Chờ matching hoàn thành để lấy status thực tế (tối đa 5s)
    let matchingStatus = 'PENDING';
    for (let i = 0; i < 5; i++) {
      await new Promise((r) => setTimeout(r, 1000));
      const updated = await this.prisma.supplierInvoice.findUnique({
        where: { id: invoiceId },
        select: { status: true },
      });
      if (
        updated?.status === InvoiceStatus.AUTO_APPROVED ||
        updated?.status === InvoiceStatus.EXCEPTION_REVIEW
      ) {
        matchingStatus = updated.status;
        break;
      }
    }

    for (const fu of financeUsers) {
      if (!fu.email) continue;
      await this.notificationService
        .sendDirectEmail(
          fu.email,
          `[Hóa đơn mới] ${invoice.invoiceNumber} từ ${supplier?.name ?? supplierId}`,
          'INVOICE_RECEIVED',
          {
            name: fu.fullName ?? fu.email,
            invoiceNumber: invoice.invoiceNumber,
            supplierName: supplier?.name ?? 'Nhà cung cấp',
            poNumber: invoice.po?.poNumber ?? '',
            totalAmount: Number(invoice.totalAmount),
            invoiceDate: invoice.invoiceDate,
            dueDate: invoice.dueDate ?? null,
            matchingStatus,
            loginUrl: `${frontendUrl}/finance/invoices/${invoiceId}`,
          },
        )
        .catch((err: Error) =>
          this.logger.warn(
            `Gửi email Finance ${fu.id} thất bại: ${err.message}`,
          ),
        );
    }
  }

  // ── Tìm PO phù hợp để gắn hoá đơn ───────────────────────────────────────
  private async findPoForInvoice(
    poNumber: string | null | undefined,
    supplierId: string,
  ): Promise<{ id: string; orgId: string } | null> {
    if (poNumber) {
      const po = await this.prisma.purchaseOrder.findFirst({
        where: { poNumber, supplierId },
        select: { id: true, orgId: true },
      });
      if (po) return po;
    }
    // Fallback: PO mới nhất đã giao hàng / đang tiến hành
    return this.prisma.purchaseOrder.findFirst({
      where: {
        supplierId,
        status: {
          in: [
            PoStatus.SHIPPED,
            PoStatus.GRN_CREATED,
            PoStatus.IN_PROGRESS,
            PoStatus.ACKNOWLEDGED,
          ],
        },
      },
      orderBy: { createdAt: 'desc' },
      select: { id: true, orgId: true },
    });
  }

  // ── Tìm PO theo số PO hoặc NCC + trạng thái ──────────────────────────────
  private async findPoByNumberOrSupplier(
    poNumber: string | null | undefined,
    supplierId: string,
    statuses: PoStatus[],
  ): Promise<{ id: string; notes: string | null } | null> {
    if (poNumber) {
      const po = await this.prisma.purchaseOrder.findFirst({
        where: {
          poNumber,
          supplierId,
        },
        select: { id: true, notes: true },
      });
      if (po) return po;
    }

    // Fallback: PO mới nhất của NCC này ở trạng thái phù hợp
    return this.prisma.purchaseOrder.findFirst({
      where: {
        supplierId,
        status: { in: statuses },
      },
      orderBy: { createdAt: 'desc' },
      select: { id: true, notes: true },
    });
  }

  // ── Tìm Organization nhà cung cấp theo email hoặc domain ─────────────────
  private async findSupplierByEmail(
    email: string,
  ): Promise<{ id: string } | null> {
    // 1. Khớp chính xác email công ty
    const byEmail = await this.prisma.organization.findFirst({
      where: {
        email: { equals: email, mode: 'insensitive' },
        companyType: { in: [CompanyType.SUPPLIER, CompanyType.BOTH] },
        isActive: true,
      },
      select: { id: true },
    });
    if (byEmail) return byEmail;

    // 2. Khớp user có email này (nhân viên NCC gửi từ email cá nhân)
    const byUserEmail = await this.prisma.user.findFirst({
      where: {
        email: { equals: email, mode: 'insensitive' },
        isActive: true,
        organization: {
          companyType: { in: [CompanyType.SUPPLIER, CompanyType.BOTH] },
          isActive: true,
        },
      },
      select: { orgId: true },
    });
    if (byUserEmail?.orgId) {
      return { id: byUserEmail.orgId };
    }

    // 3. Khớp theo domain — so sánh suffix domain chính xác (tránh substring false-positive)
    const domain = email.split('@')[1]?.toLowerCase();
    if (domain) {
      const candidates = await this.prisma.organization.findMany({
        where: {
          website: { not: null },
          companyType: { in: [CompanyType.SUPPLIER, CompanyType.BOTH] },
          isActive: true,
        },
        select: { id: true, website: true },
      });

      for (const org of candidates) {
        if (!org.website) continue;
        // Chuẩn hoá website: bỏ http(s)://, www., trailing slash
        const websiteDomain = org.website
          .toLowerCase()
          .replace(/^https?:\/\//, '')
          .replace(/^www\./, '')
          .split('/')[0];

        // Khớp chính xác domain (e.g. "co.uk" sẽ không khớp với "acmeco.uk")
        const emailRootDomain = domain.replace(/^www\./, '');
        if (websiteDomain === emailRootDomain) {
          return { id: org.id };
        }
      }
    }

    return null;
  }

  // ── Trích xuất địa chỉ email từ chuỗi "Name <email>" hoặc "email" ─────────
  private extractEmail(from: string): string | null {
    const angleMatch = from.match(/<([^>]+@[^>]+)>/);
    if (angleMatch) return angleMatch[1].trim().toLowerCase();
    const plainMatch = from.match(/([^\s]+@[^\s]+)/);
    return plainMatch ? plainMatch[1].trim().toLowerCase() : null;
  }
}
