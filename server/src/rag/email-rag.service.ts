import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron, CronExpression } from '@nestjs/schedule';
import * as imaps from 'imap-simple';
import { EmbeddingService } from './embedding.service';
import { PrismaService } from '../prisma/prisma.service';

// ─── Kiểu trả về của một email đã được parse ───────────────────────────────
export interface ParsedEmail {
  messageId: string;   // UID duy nhất của email (từ Message-ID header)
  subject: string;     // Tiêu đề email
  from: string;        // Người gửi
  to: string;          // Người nhận
  date: Date;          // Ngày gửi
  body: string;        // Nội dung thuần text (tối đa 2000 ký tự)
}

@Injectable()
export class EmailRagService {
  private readonly logger = new Logger(EmailRagService.name);

  // Config IMAP đọc từ .env — dùng cùng tài khoản với EmailListenerService
  private readonly imapConfig: imaps.ImapSimpleOptions;

  constructor(
    private readonly configService: ConfigService,
    private readonly embedding: EmbeddingService,  // service tạo vector embedding
    private readonly prisma: PrismaService,
  ) {
    this.imapConfig = {
      imap: {
        user: this.configService.get<string>('EMAIL_USER')!,
        // EMAIL_PASS trong .env là App Password Gmail (xhqz arwr inls gklb)
        password: this.configService.get<string>('EMAIL_PASS')!,
        host: this.configService.get<string>('EMAIL_IMAP_HOST') ?? 'imap.gmail.com',
        port: 993,         // Port IMAP SSL của Gmail
        tls: true,         // Bắt buộc TLS
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
      const fetchOptions: imaps.FetchOptions = {
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
        const header: Record<string, string[]> = (headerPart?.body as any) ?? {};

        // Lấy nội dung text/plain từ cấu trúc MIME
        const allParts = imaps.getParts(msg.attributes.struct as any);
        const textPart = allParts.find(
          (p: any) => p.type === 'text' && p.subtype === 'plain',
        );

        let body = '';
        if (textPart) {
          // getPartData trả về nội dung đã decode (base64 / quoted-printable)
          body = await connection.getPartData(msg, textPart as any);
        }

        // Sanitize messageId: loại bỏ ký tự đặc biệt để dùng làm source_id trong DB
        const rawId = String(header['message-id']?.[0] ?? `uid-${msg.attributes.uid}`);
        const sourceId = rawId.replace(/[<>\s]/g, '').slice(0, 200);

        emails.push({
          messageId: sourceId,
          subject: String(header.subject?.[0] ?? '(no subject)'),
          from: String(header.from?.[0] ?? ''),
          to: String(header.to?.[0] ?? ''),
          date: new Date(header.date?.[0] ?? Date.now()),
          // Giới hạn 2000 ký tự để tránh chunk quá lớn
          body: body.slice(0, 2000),
        });
      }

      this.logger.log(`Fetched ${emails.length} emails from INBOX`);
      return emails;
    } catch (error: any) {
      this.logger.error(`IMAP fetch failed: ${error.message}`);
      throw error;
    } finally {
      // Luôn đóng kết nối dù có lỗi hay không
      if (connection) await connection.end();
    }
  }

  // ─── 2. Ingest email vào Vector Store ──────────────────────────────────────
  /**
   * Lấy email → chuyển thành text có cấu trúc → embed → lưu vào document_embeddings.
   * Sau khi ingest, RAG query (/rag/query) có thể tìm kiếm nội dung email bình thường.
   *
   * @param limit  Số email tối đa cần ingest
   */
  async ingestEmails(limit = 50): Promise<{ ingested: number; skipped: number }> {
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

        // Upsert vào bảng document_embeddings (có ON CONFLICT để không bị trùng)
        // source_table = 'emails' để phân biệt với các loại tài liệu khác
        await this.prisma.$executeRawUnsafe(
          `
          INSERT INTO document_embeddings
            (content, embedding, source_table, source_id, metadata)
          VALUES
            ($1, $2::vector, 'emails', $3, $4::jsonb)
          ON CONFLICT (source_table, source_id, content)
          DO UPDATE SET
            embedding = EXCLUDED.embedding,
            metadata  = EXCLUDED.metadata
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

    this.logger.log(`Email ingest complete: ${ingested} ingested, ${skipped} skipped`);
    return { ingested, skipped };
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
