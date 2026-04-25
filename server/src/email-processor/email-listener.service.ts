import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ConfigService } from '@nestjs/config';
import * as imaps from 'imap-simple';
import { EmailProcessorService } from './email-processor.service';
import { EmailFilterService } from './email-filter.service';

@Injectable()
export class EmailListenerService implements OnModuleInit {
  private readonly logger = new Logger(EmailListenerService.name);
  private imapConfig: imaps.ImapSimpleOptions;

  constructor(
    private configService: ConfigService,
    private emailProcessor: EmailProcessorService,
    private emailFilter: EmailFilterService,
  ) {
    this.imapConfig = {
      imap: {
        user: this.configService.get<string>('EMAIL_USER')!,
        password: this.configService.get<string>('EMAIL_PASS')!,
        host: this.configService.get<string>(
          'EMAIL_IMAP_HOST',
          'imap.gmail.com',
        ),
        port: 993,
        tls: true,
        tlsOptions: { rejectUnauthorized: false },
        authTimeout: 10000,
      },
    };
  }

  onModuleInit() {
    this.logger.log(
      'EmailListenerService initialized — polling INBOX every minute',
    );
  }

  @Cron(CronExpression.EVERY_MINUTE)
  async handleCron() {
    let connection: imaps.ImapSimple | undefined;
    try {
      connection = await imaps.connect(this.imapConfig);
      await connection.openBox('INBOX');

      const searchCriteria = ['UNSEEN'];
      const fetchOptions = {
        bodies: ['HEADER', 'TEXT'],
        markSeen: true,
        struct: true,
      };

      const messages = await connection.search(searchCriteria, fetchOptions);

      // Giới hạn 5 email/lần để tránh vượt quota Gemini free tier (15 req/phút)
      const batch = messages.slice(0, 5);
      if (messages.length > 5) {
        this.logger.warn(
          `${messages.length} unseen emails found — processing first 5, rest deferred to next cycle`,
        );
      }

      for (const message of batch) {
        try {
          // ── Đọc header (from, subject, message-id) ─────────────────────────

          const headerPart = message.parts.find(
            (p: any) => p.which === 'HEADER',
          );
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          const header: Record<string, string[]> = headerPart?.body ?? {};

          // ── Đọc phần body text/plain + text/html + attachment metadata ───
          let body = '';
          const attachmentNames: string[] = [];
          if (message.attributes.struct) {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
            const allParts = imaps.getParts(message.attributes.struct as any);

            // 1. Ưu tiên text/plain
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
            const textPart = allParts.find(
              (part: any) =>
                part.type?.toLowerCase() === 'text' &&
                part.subtype?.toLowerCase() === 'plain',
            );
            if (textPart) {
              // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
              const raw = await connection.getPartData(message, textPart);
              body = Buffer.isBuffer(raw)
                ? raw.toString('utf-8')
                : String(raw ?? '');
            }

            // 2. Fallback: lấy text/html nếu không có text/plain
            if (!body.trim()) {
              // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
              const htmlPart = allParts.find(
                (part: any) =>
                  part.type?.toLowerCase() === 'text' &&
                  part.subtype?.toLowerCase() === 'html',
              );
              if (htmlPart) {
                // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
                const raw = await connection.getPartData(message, htmlPart);
                const html = Buffer.isBuffer(raw)
                  ? raw.toString('utf-8')
                  : String(raw ?? '');
                // Strip HTML tags để AI đọc được
                body = html
                  .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
                  .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
                  .replace(/<[^>]+>/g, ' ')
                  .replace(/&nbsp;/g, ' ')
                  .replace(/&amp;/g, '&')
                  .replace(/&lt;/g, '<')
                  .replace(/&gt;/g, '>')
                  .replace(/\s{2,}/g, ' ')
                  .trim();
              }
            }

            // 3. Thu thập tên file đính kèm để AI biết có attachment nào
            for (const part of allParts) {
              const disposition = (part as any).disposition;
              const params = (part as any).params ?? {};
              const dispParams = disposition?.params ?? {};
              const filename =
                dispParams.filename ?? params.name ?? (part as any).filename;
              if (filename) {
                attachmentNames.push(String(filename));
              }
            }
          }

          // ── Sanitize message-id dùng làm source_id trong DB ───────────────
          const rawMessageId = String(
            header['message-id']?.[0] ?? `uid-${message.attributes.uid}`,
          );
          const messageId = rawMessageId.replace(/[<>\s]/g, '').slice(0, 200);

          // ── Log email AI đọc được ─────────────────────────────────────────
          // Thêm danh sách file đính kèm vào body để AI biết context
          const attachmentNote =
            attachmentNames.length > 0
              ? `\n\n[File đính kèm: ${attachmentNames.join(', ')}]`
              : '';
          const emailData = {
            from: String(header.from?.[0] ?? ''),
            subject: String(header.subject?.[0] ?? '(no subject)'),
            body: (body + attachmentNote).slice(0, 6000),
            messageId,
            attachments: attachmentNames,
          };
          this.logger.log(`Email nhận: "${emailData.subject}" (id: ${emailData.messageId})`);

          // ── Lọc email trước khi xử lý (system rules → AI) ────────────────
          const filterResult = await this.emailFilter.filter(emailData);
          if (!filterResult.shouldProcess) {
            this.logger.log(
              `Email "${emailData.subject}" bị lọc [${filterResult.filterType}]: ${filterResult.reason}`,
            );
            continue;
          }
          this.logger.log(
            `Email "${emailData.subject}" vượt qua bộ lọc [${filterResult.filterType}]: ${filterResult.reason}`,
          );

          // ── Gửi đến EmailProcessorService (ingest RAG + phân tích AI) ──────
          await this.emailProcessor.processIncomingEmail(emailData);

          // Delay 4s giữa các email để tránh vượt Gemini free tier 15 req/phút
          await new Promise((resolve) => setTimeout(resolve, 4000));
        } catch (msgErr: any) {
          this.logger.error(`Error processing message: ${msgErr.message}`);
        }
      }
    } catch (error: any) {
      this.logger.error(`IMAP polling error: ${error.message}`);
    } finally {
      if (connection) {
        try {
          connection.end();
        } catch {
          /* ignore */
        }
      }
    }
  }
}
