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

    for (const record of records) {
      const chunks = this.toChunks(record, table);
      const vectors = await this.embedding.embedBatch(chunks);

      for (let i = 0; i < chunks.length; i++) {
        await this.upsertEmbedding({
          content: chunks[i],
          vector: vectors[i],
          sourceTable: table,
          sourceId: String(record.id),
          metadata: this.buildMetadata(record, table),
        });
        inserted++;
      }
    }

    this.logger.log(`[${table}] Ingested ${inserted} chunks`);
    return { inserted };
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
    const vectorStr = `[${vector.join(',')}]`;

    await this.prisma.$executeRaw`
      INSERT INTO document_embeddings (content, embedding, source_table, source_id, metadata)
      VALUES (${content}, ${vectorStr}::vector, ${sourceTable}, ${sourceId}, ${metadata}::jsonb)
      ON CONFLICT (source_table, source_id, content)
      DO UPDATE SET embedding = ${vectorStr}::vector, metadata = ${metadata}::jsonb
    `;
  }
}
