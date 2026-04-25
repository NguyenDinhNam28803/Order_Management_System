import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron, CronExpression } from '@nestjs/schedule';
import * as imaps from 'imap-simple';
import type * as Imap from 'imap';
import { EmbeddingService } from './embedding.service';
import { PrismaService } from '../prisma/prisma.service';

// ─── Kiểu trả về của một email đã được parse ───────────────────────────────
export interface ParsedEmail {
  messageId: string; // UID duy nhất của email (từ Message-ID header)
  subject: string; // Tiêu đề email
  from: string; // Người gửi
  to: string; // Người nhận
  date: Date; // Ngày gửi
  body: string; // Nội dung thuần text (tối đa 2000 ký tự)
}

@Injectable()
export class EmailRagService {
  private readonly logger = new Logger(EmailRagService.name);

  // Config IMAP đọc từ .env — dùng cùng tài khoản với EmailListenerService
  private readonly imapConfig: imaps.ImapSimpleOptions;

  constructor(
    private readonly configService: ConfigService,
    private readonly embedding: EmbeddingService, // service tạo vector embedding
    private readonly prisma: PrismaService,
  ) {
    this.imapConfig = {
      imap: {
        user: this.configService.get<string>('EMAIL_USER')!,
        password: this.configService.get<string>('EMAIL_PASS')!,
        host:
          this.configService.get<string>('EMAIL_IMAP_HOST') ?? 'imap.gmail.com',
        port: 993, // Port IMAP SSL của Gmail
        tls: true, // Bắt buộc TLS
        tlsOptions: { rejectUnauthorized: false },
        authTimeout: 10000,
      },
    };
  }

  // ─── 1. Lấy email thô từ INBOX ─────────────────────────────────────────────
  /**
   * Kết nối IMAP, tìm email trong 30 ngày gần nhất, parse thành ParsedEmail[].
   * @param limit  Số email tối đa cần lấy (mặc định 30)
   */
  async fetchRecentEmails(limit = 30): Promise<ParsedEmail[]> {
    let connection: imaps.ImapSimple | undefined;

    try {
      // Mở kết nối IMAP tới Gmail
      connection = await imaps.connect(this.imapConfig);
      await connection.openBox('INBOX');

      // Tìm email từ 30 ngày trước đến nay
      const since = new Date();
      since.setDate(since.getDate() - 30);
      // imap-simple nhận định dạng ngày ISO "YYYY-MM-DD"
      const sinceStr = since.toISOString().slice(0, 10);

      const searchCriteria: any[] = [['SINCE', sinceStr]];
      const fetchOptions: Imap.FetchOptions = {
        // bodies: mảng chỉ định những phần header nào cần tải
        // 'HEADER.FIELDS (FROM TO SUBJECT DATE MESSAGE-ID)' → chỉ lấy 5 field header
        // 'TEXT' → lấy phần nội dung thuần
        bodies: ['HEADER.FIELDS (FROM TO SUBJECT DATE MESSAGE-ID)', 'TEXT'],
        struct: true, // Cần struct để biết cấu trúc MIME (tìm phần text/plain)
      };

      const messages = await connection.search(searchCriteria, fetchOptions);

      // Chỉ lấy `limit` email mới nhất (slice từ cuối)
      const recent = messages.slice(-limit);

      const emails: ParsedEmail[] = [];

      for (const msg of recent) {
        // Parse header: tìm phần body có which = tên header request
        const headerPart = msg.parts.find(
          (p) => p.which === 'HEADER.FIELDS (FROM TO SUBJECT DATE MESSAGE-ID)',
        );
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        const header: Record<string, string[]> = headerPart?.body ?? {};

        // Bug fix #1: guard against missing struct (some IMAP servers omit it)
        let body = '';
        if (msg.attributes.struct) {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
          const allParts = imaps.getParts(msg.attributes.struct as any);
          // Bug fix #2: case-insensitive comparison — servers may return uppercase types
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          const textPart = allParts.find(
            (p: any) =>
              p.type?.toLowerCase() === 'text' &&
              p.subtype?.toLowerCase() === 'plain',
          );
          if (textPart) {
            // Bug fix #3: getPartData may return a Buffer for binary-encoded parts
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
            const raw = await connection.getPartData(msg, textPart);
            body = Buffer.isBuffer(raw)
              ? raw.toString('utf-8')
              : String(raw ?? '');
          }
        }

        // Sanitize messageId: loại bỏ ký tự đặc biệt để dùng làm source_id trong DB
        const rawId = String(
          header['message-id']?.[0] ?? `uid-${msg.attributes.uid}`,
        );
        const sourceId = rawId.replace(/[<>\s]/g, '').slice(0, 200);

        emails.push({
          messageId: sourceId,
          subject: String(header.subject?.[0] ?? '(no subject)'),
          from: String(header.from?.[0] ?? ''),
          to: String(header.to?.[0] ?? ''),
          // Bug fix #4: guard against malformed date strings → Invalid Date
          date: (() => {
            const d = new Date(header.date?.[0] ?? '');
            return isNaN(d.getTime()) ? new Date() : d;
          })(),
          // Giới hạn 2000 ký tự để tránh chunk quá lớn
          body: body.slice(0, 2000),
        });
      }

      this.logger.log(`Fetched ${emails.length} emails from INBOX`);
      console.log(`[EmailRAG] AI lấy được ${emails.length} email từ INBOX:`);
      emails.forEach((email, index) => {
        console.log(`  [${index + 1}] messageId: ${email.messageId}`);
        console.log(`       from   : ${email.from}`);
        console.log(`       to     : ${email.to}`);
        console.log(`       subject: ${email.subject}`);
        console.log(`       date   : ${email.date.toLocaleString('vi-VN')}`);
        console.log(
          `       body   : ${email.body.slice(0, 150)}${email.body.length > 150 ? '...' : ''}`,
        );
      });
      return emails;
    } catch (error: any) {
      this.logger.error(`IMAP fetch failed: ${error.message}`);
      throw error;
    } finally {
      // Luôn đóng kết nối dù có lỗi hay không
      if (connection) connection.end();
    }
  }

  // ─── 2. Ingest email vào Vector Store ──────────────────────────────────────
  /**
   * Lấy email → chuyển thành text có cấu trúc → embed → lưu vào document_embeddings.
   * Sau khi ingest, RAG query (/rag/query) có thể tìm kiếm nội dung email bình thường.
   *
   * @param limit  Số email tối đa cần ingest
   */
  async ingestEmails(
    limit = 50,
  ): Promise<{ ingested: number; skipped: number }> {
    const emails = await this.fetchRecentEmails(limit);
    let ingested = 0;
    let skipped = 0;

    for (const email of emails) {
      // Tạo text chunk có cấu trúc để embedding hiểu ngữ cảnh tốt hơn
      const content = [
        `Tiêu đề email: ${email.subject}`,
        `Từ: ${email.from}`,
        `Đến: ${email.to}`,
        `Ngày: ${email.date.toLocaleString('vi-VN')}`,
        `Nội dung: ${email.body}`,
      ].join('\n');

      try {
        // Gọi FPT AI Embedding để tạo vector 768-dim cho đoạn text trên
        const vector = await this.embedding.embed(content);
        const vectorStr = `[${vector.join(',')}]`;

        // Delete existing embedding then insert new one (no unique constraint yet)
        await this.prisma.$executeRaw`
          DELETE FROM document_embeddings WHERE source_table = 'emails' AND source_id = ${email.messageId}
        `;
        // $executeRawUnsafe needed for ::vector and ::jsonb type casts; all values are bound params.
        await this.prisma.$executeRawUnsafe(
          `
          INSERT INTO document_embeddings
            (content, embedding, source_table, source_id, metadata)
          VALUES
            ($1, $2::vector, 'emails', $3, $4::jsonb)
          `,
          content,
          vectorStr,
          email.messageId,
          JSON.stringify({
            table: 'emails',
            id: email.messageId,
            name: email.subject,
            from: email.from,
            date: email.date.toISOString(),
          }),
        );

        ingested++;
      } catch (err: any) {
        this.logger.warn(`Skipped email "${email.subject}": ${err.message}`);
        skipped++;
      }
    }

    this.logger.log(
      `Email ingest complete: ${ingested} ingested, ${skipped} skipped`,
    );
    return { ingested, skipped };
  }

  // ─── 2b. Ingest một email đơn lẻ (gọi trực tiếp từ EmailProcessorService) ──
  /**
   * Ingest một email đã được parse ngay lập tức vào vector store,
   * không cần chờ cron 5 phút. ON CONFLICT đảm bảo không duplicate.
   */
  async ingestSingleEmail(email: ParsedEmail): Promise<void> {
    const content = [
      `Tiêu đề email: ${email.subject}`,
      `Từ: ${email.from}`,
      `Đến: ${email.to}`,
      `Ngày: ${email.date.toLocaleString('vi-VN')}`,
      `Nội dung: ${email.body}`,
    ].join('\n');

    const vector = await this.embedding.embed(content);
    const vectorStr = `[${vector.join(',')}]`;

    await this.prisma.$executeRaw`
      DELETE FROM document_embeddings WHERE source_table = 'emails' AND source_id = ${email.messageId}
    `;
    // $executeRawUnsafe needed for ::vector and ::jsonb type casts; all values are bound params.
    await this.prisma.$executeRawUnsafe(
      `
      INSERT INTO document_embeddings
        (content, embedding, source_table, source_id, metadata)
      VALUES
        ($1, $2::vector, 'emails', $3, $4::jsonb)
      `,
      content,
      vectorStr,
      email.messageId,
      JSON.stringify({
        table: 'emails',
        id: email.messageId,
        name: email.subject,
        from: email.from,
        date: email.date.toISOString(),
      }),
    );

    this.logger.log(`Ingested single email into RAG: "${email.subject}"`);
  }

  // ─── 3. Cron job tự động sync mỗi 5 phút ──────────────────────────────────
  /**
   * Tự động pull email mới và cập nhật vector store mỗi 5 phút.
   * Nhờ ON CONFLICT trong SQL, email đã ingest sẽ không bị duplicate.
   */
  @Cron(CronExpression.EVERY_5_MINUTES)
  async autoSyncEmails(): Promise<void> {
    try {
      this.logger.log('Auto-syncing emails to RAG...');
      await this.ingestEmails(20); // Mỗi lần pull 20 email mới nhất
    } catch (err: any) {
      // Không throw để không crash scheduler — chỉ log warning
      this.logger.error(`Auto-sync failed: ${err.message}`);
    }
  }
}
