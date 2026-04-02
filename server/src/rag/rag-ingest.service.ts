import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CompanyType } from '@prisma/client';
import { EmbeddingService } from './embedding.service';

type SourceTable = 'customers' | 'products'; // | 'contracts' | 'documents';

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
            _count: true,
          },
        });
      //   case 'contracts':
      //     return this.prisma.order.findMany({ include: { customer: true } });
      //   case 'documents':
      //     return this.prisma.document.findMany();
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
          `Trạng thái: ${record.status}`,
          `Ngành nghề: ${record.industry ?? 'N/A'}`,
        ].join('. ');

      case 'products':
        return [
          `Sản phẩm: ${record.name}`,
          `Danh mục: ${record.category?.name}`,
          `Giá: ${record.price?.toLocaleString('vi-VN')} VND`,
          `Mô tả: ${record.description ?? ''}`,
          `Tồn kho: ${record.stock} đơn vị`,
        ].join('. ');

      //   case 'orders':
      //     return [
      //       `Đơn hàng: #${record.orderNumber}`,
      //       `Khách hàng: ${record.customer?.name}`,
      //       `Tổng tiền: ${record.totalAmount?.toLocaleString('vi-VN')} VND`,
      //       `Trạng thái: ${record.status}`,
      //       `Ngày tạo: ${record.createdAt?.toLocaleDateString('vi-VN')}`,
      //     ].join('. ');

      //   case 'documents':
      //     return `${record.title}: ${record.content}`;
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
      name: record.name ?? record.title ?? record.orderNumber,
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
