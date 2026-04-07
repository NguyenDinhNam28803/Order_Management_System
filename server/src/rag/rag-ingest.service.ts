import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CompanyType } from '@prisma/client';
import { EmbeddingService } from './embedding.service';

type SourceTable =
  | 'customers'
  | 'products'
  | 'purchase_requisitions'
  | 'rfq_requests'
  | 'rfq_quotations'
  | 'purchase_orders'
  | 'goods_receipts'
  | 'supplier_invoices'
  | 'payments'
  | 'contracts'
  | 'supplier_kpi_scores'
  | 'users'
  | 'departments'
  | 'organizations'
  | 'grn_items'
  | 'invoice_items'
  | 'budget_allocations'
  | 'pr_items'
  | 'disputes'
  | 'notifications';

@Injectable()
export class RagIngestService {
  private readonly logger = new Logger(RagIngestService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly embedding: EmbeddingService,
  ) {}

  async ingestTable(table: SourceTable): Promise<{ inserted: number }> {
    const records = await this.fetchRecords(table);
    let inserted = 0;

    // Xử lý từng batch 10 records thay vì từng record
    const RECORD_BATCH = 10;

    for (let i = 0; i < records.length; i += RECORD_BATCH) {
      const batch = records.slice(i, i + RECORD_BATCH);

      // 1. Chuẩn bị tất cả chunks của batch
      const allRows: {
        content: string;
        sourceId: string;
        metadata: object;
      }[] = [];

      for (const record of batch) {
        const chunks = this.toChunks(record, table);
        for (const chunk of chunks) {
          allRows.push({
            content: chunk,
            sourceId: String(record.id),
            metadata: this.buildMetadata(record, table),
          });
        }
      }

      // 2. Embed tất cả cùng lúc (1 lần gọi API)
      const vectors = await this.embedding.embedBatch(
        allRows.map((r) => r.content),
      );

      // 3. Batch insert 1 query duy nhất thay vì N queries
      await this.batchUpsert(
        allRows.map((row, idx) => ({
          ...row,
          vector: vectors[idx],
          sourceTable: table,
        })),
      );

      inserted += allRows.length;
      this.logger.log(
        `[${table}] ${Math.min(i + RECORD_BATCH, records.length)}/${records.length} records processed`,
      );
    }

    this.logger.log(`[${table}] Done — ${inserted} chunks total`);
    return { inserted };
  }

  private async batchUpsert(
    rows: {
      content: string;
      vector: number[];
      sourceTable: string;
      sourceId: string;
      metadata: object;
    }[],
  ) {
    if (!rows.length) return;

    // Lấy danh sách sourceId của batch này
    const sourceIds = [...new Set(rows.map((r) => r.sourceId))];
    const sourceTable = rows[0].sourceTable;

    // Xóa chunks cũ của các record này
    await this.prisma.$executeRawUnsafe(
      `DELETE FROM document_embeddings 
     WHERE source_table = $1 
     AND source_id = ANY($2::text[])`,
      sourceTable,
      sourceIds,
    );

    // Insert mới
    const values: any[] = [];
    const placeholders = rows.map((row, i) => {
      const base = i * 5;
      values.push(
        row.content,
        `[${row.vector.join(',')}]`,
        row.sourceTable,
        row.sourceId,
        JSON.stringify(row.metadata),
      );
      return `($${base + 1}, $${base + 2}::vector, $${base + 3}, $${base + 4}, $${base + 5}::jsonb)`;
    });

    await this.prisma.$executeRawUnsafe(
      `INSERT INTO document_embeddings
       (content, embedding, source_table, source_id, metadata)
     VALUES ${placeholders.join(', ')}`,
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      ...values,
    );
  }

  // ----- Private helpers -----

  private async fetchRecords(table: SourceTable): Promise<any[]> {
    switch (table) {
      case 'customers':
        return this.prisma.organization.findMany({
          where: {
            companyType: CompanyType.BOTH || CompanyType.SUPPLIER,
          },
        });
      case 'products':
        return this.prisma.product.findMany({
          include: {
            category: true,
          },
        });
      case 'purchase_requisitions':
        return this.prisma.purchaseRequisition.findMany({
          include: {
            requester: true,
            department: true,
            items: true,
          },
        });
      case 'rfq_requests':
        return this.prisma.rfqRequest.findMany({
          include: {
            organization: true,
            pr: true,
            createdBy: true,
          },
        });
      case 'rfq_quotations':
        return this.prisma.rfqQuotation.findMany({
          include: {
            rfq: true,
            reviewedBy: true,
          },
        });
      case 'purchase_orders':
        return this.prisma.purchaseOrder.findMany({
          include: {
            buyerOrg: true,
            supplier: true,
            buyer: true,
            items: true,
          },
        });
      case 'goods_receipts':
        return this.prisma.goodsReceipt.findMany({
          include: {
            po: true,
            receivedBy: true,
            items: true,
          },
        });
      case 'supplier_invoices':
        return this.prisma.supplierInvoice.findMany({
          include: {
            po: true,
            supplier: true,
            buyerOrg: true,
          },
        });
      case 'payments':
        return this.prisma.payment.findMany({
          include: {
            invoice: true,
            po: true,
          },
        });
      case 'contracts':
        return this.prisma.contract.findMany({
          include: {
            buyerOrg: true,
            supplierOrg: true,
          },
        });
      case 'supplier_kpi_scores':
        return this.prisma.supplierKpiScore.findMany({
          include: {
            supplier: true,
            buyerOrg: true,
          },
        });
      case 'users':
        return this.prisma.user.findMany({
          include: {
            organization: true,
            department: true,
          },
        });
      case 'departments':
        return this.prisma.department.findMany({
          include: {
            organization: true,
            head: true,
          },
        });
      case 'organizations':
        return this.prisma.organization.findMany({
          include: {
            users: true,
            costCenters: true,
            departments: true,
          },
        });
      case 'grn_items':
        return this.prisma.grnItem.findMany({
          include: {
            grn: true,
            poItem: true,
          },
        });
      case 'invoice_items':
        return this.prisma.invoiceItem.findMany({
          include: {
            invoice: true,
            poItem: true,
            grnItem: true,
          },
        });
      case 'budget_allocations':
        return this.prisma.budgetAllocation.findMany({
          include: {
            budgetPeriod: true,
            costCenter: true,
            department: true,
          },
        });
      case 'pr_items':
        return this.prisma.prItem.findMany({
          include: {
            pr: true,
            product: true,
          },
        });
      case 'disputes':
        return this.prisma.dispute.findMany({
          include: {
            po: true,
            grn: true,
            invoice: true,
            openedBy: true,
          },
        });
      case 'notifications':
        return this.prisma.notification.findMany({
          include: {
            recipient: true,
          },
        });
    }
  }

  // Chuyển record → mảng text chunk (mỗi chunk ≤ 400 từ)
  private toChunks(record: any, table: SourceTable): string[] {
    const text = this.recordToText(record, table);
    return this.chunkText(text, 400);
  }

  private recordToText(record: any, table: SourceTable): string {
    switch (table) {
      case 'customers':
        return [
          `Khách hàng: ${record.name}`,
          `Mã KH: ${record.code}`,
          `Email: ${record.email}`,
          `Địa chỉ: ${record.address}`,
          `Trạng thái: ${record.isActive ? 'Hoạt động' : 'Ngưng'}`,
          `Ngành nghề: ${record.industry ?? 'N/A'}`,
        ].join('. ');

      case 'products':
        return [
          `Sản phẩm: ${record.name}`,
          `Danh mục: ${record.category?.name}`,
          `Giá tham khảo: ${record.unitPriceRef?.toLocaleString('vi-VN')} VND`,
          `Mô tả: ${record.description ?? ''}`,
          `Đơn vị: ${record.unit}`,
        ].join('. ');

      case 'purchase_requisitions':
        return [
          `Yêu cầu mua sắm (PR): ${record.prNumber}`,
          `Tiêu đề: ${record.title}`,
          `Người yêu cầu: ${record.requester?.fullName}`,
          `Phòng ban: ${record.department?.name}`,
          `Trạng thái: ${record.status}`,
          `Tổng ước tính: ${record.totalEstimate?.toLocaleString('vi-VN')} ${record.currency}`,
          `Ngày cần hàng: ${record.requiredDate?.toLocaleDateString('vi-VN')}`,
          `Lý do: ${record.justification ?? ''}`,
          `Nội dung: ${record.description ?? ''}`,
          `Các mặt hàng: ${record.items?.map((i: any) => i.productDesc).join(', ')}`,
        ].join('. ');

      case 'rfq_requests':
        return [
          `Yêu cầu báo giá (RFQ): ${record.rfqNumber}`,
          `Tiêu đề: ${record.title}`,
          `Dựa trên PR: ${record.pr?.prNumber}`,
          `Trạng thái: ${record.status}`,
          `Hạn chót: ${record.deadline?.toLocaleDateString('vi-VN')}`,
          `Mô tả: ${record.description ?? ''}`,
          `Yêu cầu kỹ thuật: ${record.technicalSpec ?? ''}`,
        ].join('. ');

      case 'rfq_quotations':
        return [
          `Báo giá: ${record.quotationNumber}`,
          `Từ RFQ: ${record.rfq?.rfqNumber}`,
          `Tổng giá: ${record.totalPrice?.toLocaleString('vi-VN')} ${record.currency}`,
          `Thời gian giao hàng: ${record.leadTimeDays} ngày`,
          `Trạng thái: ${record.status}`,
          `Ghi chú: ${record.notes ?? ''}`,
        ].join('. ');

      case 'purchase_orders':
        return [
          `Đơn mua hàng (PO): ${record.poNumber}`,
          `Nhà cung cấp: ${record.supplier?.name}`,
          `Người mua: ${record.buyer?.fullName}`,
          `Tổng tiền: ${record.totalAmount?.toLocaleString('vi-VN')} ${record.currency}`,
          `Trạng thái: ${record.status}`,
          `Ngày giao hàng: ${record.deliveryDate?.toLocaleDateString('vi-VN')}`,
          `Điều khoản thanh toán: ${record.paymentTerms ?? ''}`,
        ].join('. ');

      case 'goods_receipts':
        return [
          `Phiếu nhập kho (GRN): ${record.grnNumber}`,
          `Từ PO: ${record.po?.poNumber}`,
          `Người nhận: ${record.receivedBy?.fullName}`,
          `Trạng thái: ${record.status}`,
          `Ngày nhận: ${record.receivedAt?.toLocaleDateString('vi-VN')}`,
          `Ghi chú: ${record.notes ?? ''}`,
        ].join('. ');

      case 'supplier_invoices':
        return [
          `Hóa đơn: ${record.invoiceNumber}`,
          `Từ PO: ${record.po?.poNumber}`,
          `Nhà cung cấp: ${record.supplier?.name}`,
          `Tổng tiền: ${record.totalAmount?.toLocaleString('vi-VN')} ${record.currency}`,
          `Trạng thái: ${record.status}`,
          `Ngày hóa đơn: ${record.invoiceDate?.toLocaleDateString('vi-VN')}`,
          `Hạn thanh toán: ${record.dueDate?.toLocaleDateString('vi-VN')}`,
        ].join('. ');

      case 'payments':
        return [
          `Thanh toán: ${record.paymentNumber}`,
          `Hóa đơn: ${record.invoice?.invoiceNumber}`,
          `Đơn hàng: ${record.po?.poNumber}`,
          `Số tiền: ${record.amount?.toLocaleString('vi-VN')} ${record.currency}`,
          `Phương thức: ${record.method}`,
          `Trạng thái: ${record.status}`,
          `Ngày thanh toán: ${record.paymentDate?.toLocaleDateString('vi-VN')}`,
        ].join('. ');

      case 'contracts':
        return [
          `Hợp đồng: ${record.contractNumber}`,
          `Tiêu đề: ${record.title}`,
          `Đối tác: ${record.supplierOrg?.name}`,
          `Giá trị: ${record.value?.toLocaleString('vi-VN')} ${record.currency}`,
          `Trạng thái: ${record.status}`,
          `Ngày bắt đầu: ${record.startDate?.toLocaleDateString('vi-VN')}`,
          `Ngày kết thúc: ${record.endDate?.toLocaleDateString('vi-VN')}`,
        ].join('. ');

      case 'supplier_kpi_scores':
        return [
          `Đánh giá nhà cung cấp: ${record.supplier?.name}`,
          `Giai đoạn: Quý ${record.periodQuarter}/${record.periodYear}`,
          `Điểm OTD: ${record.otdScore}`,
          `Điểm chất lượng: ${record.qualityScore}`,
          `Điểm giá: ${record.priceScore}`,
          `Tỉ lệ hoàn thành: ${record.fulfillmentRate}`,
          `Phân hạng: ${record.tier}`,
          `Ghi chú: ${record.notes ?? ''}`,
        ].join('. ');

      case 'users':
        return [
          `Nhân viên: ${record.fullName}`,
          `Email: ${record.email}`,
          `Chức vụ: ${record.jobTitle ?? 'N/A'}`,
          `Phòng ban: ${record.department?.name ?? 'N/A'}`,
          `Tổ chức: ${record.organization?.name ?? 'N/A'}`,
          `Vai trò: ${record.role}`,
          `Trạng thái: ${record.isActive ? 'Hoạt động' : 'Không hoạt động'}`,
        ].join('. ');

      case 'departments':
        return [
          `Phòng ban: ${record.name}`,
          `Mã: ${record.code}`,
          `Tổ chức: ${record.organization?.name ?? 'N/A'}`,
          `Trưởng phòng: ${record.head?.fullName ?? 'Chưa có'}`,
          `Ngân sách năm: ${record.budgetAnnual?.toLocaleString('vi-VN')} VND`,
          `Đã dùng: ${record.budgetUsed?.toLocaleString('vi-VN')} VND`,
        ].join('. ');

      case 'organizations':
        return [
          `Tổ chức: ${record.name}`,
          `Mã: ${record.code}`,
          `Tên pháp lý: ${record.legalName ?? 'N/A'}`,
          `Mã số thuế: ${record.taxCode ?? 'N/A'}`,
          `Loại: ${record.companyType}`,
          `Ngành nghề: ${record.industry ?? 'N/A'}`,
          `Địa chỉ: ${record.address ?? 'N/A'}`,
          `Email: ${record.email ?? 'N/A'}`,
          `Điện thoại: ${record.phone ?? 'N/A'}`,
          `Trạng thái KYC: ${record.kycStatus}`,
          `Phân hạng NCC: ${record.supplierTier}`,
          `Trust Score: ${record.trustScore}`,
        ].join('. ');

      case 'grn_items':
        return [
          `GRN Item: ${record.id}`,
          `GRN: ${record.grn?.grnNumber ?? 'N/A'}`,
          `Số lượng nhận: ${record.receivedQty}`,
          `Số lượng đạt: ${record.acceptedQty}`,
          `Số lượng từ chối: ${record.rejectedQty}`,
          `Kết quả QC: ${record.qcResult}`,
          `Lý do từ chối: ${record.rejectionReason ?? 'Không có'}`,
          `Ghi chú QC: ${record.qcNotes ?? 'N/A'}`,
          `Số lô: ${record.batchNumber ?? 'N/A'}`,
          `Hạn sử dụng: ${record.expiryDate?.toLocaleDateString('vi-VN') ?? 'N/A'}`,
        ].join('. ');

      case 'invoice_items':
        return [
          `Invoice Item: ${record.id}`,
          `Hóa đơn: ${record.invoice?.invoiceNumber ?? 'N/A'}`,
          `Mô tả: ${record.description ?? 'N/A'}`,
          `Số lượng: ${record.qty}`,
          `Đơn giá: ${record.unitPrice?.toLocaleString('vi-VN')} VND`,
          `Tổng: ${record.total?.toLocaleString('vi-VN')} VND`,
          `Trạng thái đối soát: ${record.matchStatus}`,
        ].join('. ');

      case 'budget_allocations':
        return [
          `Phân bổ ngân sách: ${record.id}`,
          `Kỳ ngân sách: ${record.budgetPeriod?.fiscalYear} - ${record.budgetPeriod?.periodType} ${record.budgetPeriod?.periodNumber}`,
          `Phòng ban: ${record.department?.name ?? 'N/A'}`,
          `Cost Center: ${record.costCenter?.name ?? 'N/A'}`,
          `Ngân sách phân bổ: ${record.allocatedAmount?.toLocaleString('vi-VN')} VND`,
          `Đã cam kết: ${record.committedAmount?.toLocaleString('vi-VN')} VND`,
          `Đã chi tiêu: ${record.spentAmount?.toLocaleString('vi-VN')} VND`,
          `Còn lại: ${(record.allocatedAmount - record.committedAmount - record.spentAmount)?.toLocaleString('vi-VN')} VND`,
          `Trạng thái: ${record.status}`,
        ].join('. ');

      case 'pr_items':
        return [
          `PR Item: ${record.id}`,
          `PR: ${record.pr?.prNumber ?? 'N/A'}`,
          `Sản phẩm: ${record.product?.name ?? record.productDesc}`,
          `SKU: ${record.sku ?? 'N/A'}`,
          `Số lượng: ${record.qty} ${record.unit}`,
          `Giá ước tính: ${record.estimatedPrice?.toLocaleString('vi-VN')} VND`,
          `Danh mục: ${record.category?.name ?? 'N/A'}`,
        ].join('. ');

      case 'disputes':
        return [
          `Tranh chấp: ${record.disputeNumber}`,
          `Loại: ${record.type}`,
          `Trạng thái: ${record.status}`,
          `PO: ${record.po?.poNumber ?? 'N/A'}`,
          `GRN: ${record.grn?.grnNumber ?? 'N/A'}`,
          `Hóa đơn: ${record.invoice?.invoiceNumber ?? 'N/A'}`,
          `Người mở: ${record.openedBy?.fullName ?? 'N/A'}`,
          `Mô tả: ${record.description}`,
          `Số tiền yêu cầu: ${record.claimedAmount?.toLocaleString('vi-VN') ?? 'N/A'} VND`,
          `Số tiền giải quyết: ${record.resolutionAmount?.toLocaleString('vi-VN') ?? 'N/A'} VND`,
          `Ghi chú giải quyết: ${record.resolutionNote ?? 'N/A'}`,
        ].join('. ');

      case 'notifications':
        return [
          `Thông báo: ${record.subject ?? 'N/A'}`,
          `Người nhận: ${record.recipient?.fullName ?? 'N/A'}`,
          `Loại sự kiện: ${record.eventType}`,
          `Kênh: ${record.channel}`,
          `Nội dung: ${record.body}`,
          `Trạng thái: ${record.status}`,
          `Độ ưu tiên: ${record.priority}`,
          `Đã gửi: ${record.sentAt?.toLocaleString('vi-VN') ?? 'Chưa'}`,
          `Đã đọc: ${record.readAt?.toLocaleString('vi-VN') ?? 'Chưa'}`,
        ].join('. ');

      default:
        return '';
    }
  }

  private chunkText(text: string, maxWords: number): string[] {
    const words = text.split(/\s+/);
    if (words.length <= maxWords) return [text];

    const chunks: string[] = [];
    const overlap = 50; // 50 từ overlap giữa các chunk để giữ context
    for (let i = 0; i < words.length; i += maxWords - overlap) {
      chunks.push(words.slice(i, i + maxWords).join(' '));
      if (i + maxWords >= words.length) break;
    }
    return chunks;
  }

  private buildMetadata(record: any, table: SourceTable): object {
    return {
      table,
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      id: record.id,
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      name:
        record.name ??
        record.title ??
        record.prNumber ??
        record.rfqNumber ??
        record.quotationNumber ??
        record.poNumber ??
        record.grnNumber ??
        record.invoiceNumber ??
        record.paymentNumber ??
        record.contractNumber ??
        `Record ${record.id}`,
    };
  }

  private async upsertEmbedding(params: {
    content: string;
    vector: number[];
    sourceTable: string;
    sourceId: string;
    metadata: object;
  }) {
    const { content, vector, sourceTable, sourceId, metadata } = params;

    // Prisma $executeRaw không nhận template literal tốt với vector cast
    // Dùng $executeRawUnsafe để control string hoàn toàn
    const vectorStr = `[${vector.join(',')}]`;
    const metadataStr = JSON.stringify(metadata);

    await this.prisma.$executeRawUnsafe(
      `
    INSERT INTO document_embeddings 
      (content, embedding, source_table, source_id, metadata)
    VALUES 
      ($1, $2::vector, $3, $4, $5::jsonb)
    ON CONFLICT (source_table, source_id, content)
    DO UPDATE SET 
      embedding = EXCLUDED.embedding,
      metadata  = EXCLUDED.metadata
    `,
      content,
      vectorStr,
      sourceTable,
      sourceId,
      metadataStr,
    );
  }
}
