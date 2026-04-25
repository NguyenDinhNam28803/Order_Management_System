import { Injectable, Logger } from '@nestjs/common';
import { AiService } from '../ai-service/ai-service.service';
import { PrismaService } from '../prisma/prisma.service';
import { EmailRagService, ParsedEmail } from '../rag/email-rag.service';
import {
  RfqStatus,
  PoStatus,
  QuotationStatus,
  CompanyType,
  InvoiceStatus,
  CurrencyCode,
} from '@prisma/client';

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

    if (analysis.confidence < 0.65) {
      this.logger.log(
        `Confidence thấp (${analysis.confidence}), bỏ qua xử lý tự động`,
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
    // Tìm RFQ theo rfqNumber hoặc RFQ mở mới nhất của NCC này
    let rfq: { id: string; orgId: string } | null = null;

    if (data.rfqNumber) {
      rfq = await this.prisma.rfqRequest.findFirst({
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        where: { rfqNumber: data.rfqNumber },
        select: { id: true, orgId: true },
      });
    }

    if (!rfq) {
      // Fallback: RFQ ở trạng thái SENT hoặc OPEN có NCC này trong danh sách mời
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
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const quotationNumber = data.quotationNumber ?? `QUO-EMAIL-${Date.now()}`;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const totalPrice = data.totalPrice ?? 0;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const leadTimeDays = data.leadTimeDays ?? 7;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const validityDays = data.validityDays ?? 30;

    // Tạo hoặc cập nhật RfqQuotation
    const existing = await this.prisma.rfqQuotation.findFirst({
      where: { rfqId: rfq.id, supplierId },
    });

    let quotationId: string;

    if (existing) {
      await this.prisma.rfqQuotation.update({
        where: { id: existing.id },
        data: {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          quotationNumber,
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          totalPrice,
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          currency: (data.currency as any) ?? 'VND',
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          leadTimeDays,
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          validityDays,
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          paymentTerms: data.paymentTerms ?? null,
          notes: subject,
          status: QuotationStatus.SUBMITTED,
          submittedAt: new Date(),
        },
      });
      quotationId = existing.id;
      this.logger.log(`Đã cập nhật RfqQuotation ${existing.id} từ email`);
    } else {
      const created = await this.prisma.rfqQuotation.create({
        data: {
          rfqId: rfq.id,
          supplierId,
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          quotationNumber,
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          totalPrice,
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          currency: (data.currency as any) ?? 'VND',
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          leadTimeDays,
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          validityDays,
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          paymentTerms: data.paymentTerms ?? null,
          notes: subject,
          status: QuotationStatus.SUBMITTED,
          submittedAt: new Date(),
        },
      });
      quotationId = created.id;
      this.logger.log(`Đã tạo RfqQuotation ${created.id} từ email`);
    }

    // Chuyển RFQ sang QUOTATION_RECEIVED nếu chưa ở trạng thái đó
    const rfqFull = await this.prisma.rfqRequest.findUnique({
      where: { id: rfq.id },
      select: { status: true },
    });
    if (
      rfqFull &&
      rfqFull.status !== RfqStatus.QUOTATION_RECEIVED &&
      rfqFull.status !== RfqStatus.AWARDED &&
      rfqFull.status !== RfqStatus.CLOSED
    ) {
      await this.prisma.rfqRequest.update({
        where: { id: rfq.id },
        data: { status: RfqStatus.QUOTATION_RECEIVED },
      });
      this.logger.log(`RFQ ${rfq.id} → QUOTATION_RECEIVED`);
    }

    return {
      success: true,
      intent: 'QUOTATION',
      action: existing ? 'updated_quotation' : 'created_quotation',
      entityId: quotationId,
      ingested: true,
    };
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

    // Tránh tạo trùng nếu email bị xử lý 2 lần
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

    // 5. Tạo hoá đơn với status SUBMITTED (chờ procurement xác nhận)
    const invoice = await this.prisma.supplierInvoice.create({
      data: {
        invoiceNumber,
        status: InvoiceStatus.SUBMITTED,
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

    this.logger.log(
      `Tạo hoá đơn ${invoice.id} (${invoiceNumber}) từ email NCC ${supplierId}`,
    );

    return {
      success: true,
      intent: 'INVOICE_SUBMISSION',
      action: 'invoice_created',
      entityId: invoice.id,
      ingested: true,
    };
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

    // 2. Khớp theo domain website (domain từ email @domain.com vs website domain.com)
    const domain = email.split('@')[1];
    if (domain) {
      const byDomain = await this.prisma.organization.findFirst({
        where: {
          website: { contains: domain, mode: 'insensitive' },
          companyType: { in: [CompanyType.SUPPLIER, CompanyType.BOTH] },
          isActive: true,
        },
        select: { id: true },
      });
      if (byDomain) return byDomain;
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
