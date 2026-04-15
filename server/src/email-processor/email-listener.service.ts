import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ConfigService } from '@nestjs/config';
import * as imaps from 'imap-simple';
import { EmailProcessorService } from './email-processor.service';

@Injectable()
export class EmailListenerService implements OnModuleInit {
  private readonly logger = new Logger(EmailListenerService.name);
  private imapConfig: imaps.ImapSimpleOptions;

  constructor(
    private configService: ConfigService,
    private emailProcessor: EmailProcessorService,
  ) {
    this.imapConfig = {
      imap: {
        user: this.configService.get<string>('EMAIL_USER')!,
        password: this.configService.get<string>('EMAIL_PASS')!,
        host: this.configService.get<string>('EMAIL_IMAP_HOST', 'imap.gmail.com')!,
        port: 993,
        tls: true,
        tlsOptions: { rejectUnauthorized: false },
        authTimeout: 10000,
      },
    };
  }

  onModuleInit() {
    this.logger.log('EmailListenerService initialized — polling INBOX every minute');
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

      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const messages = await connection.search(searchCriteria, fetchOptions);

      for (const message of messages) {
        try {
          // ── Đọc header (from, subject, message-id) ─────────────────────────
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          const headerPart = message.parts.find((p: any) => p.which === 'HEADER');
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          const header: Record<string, string[]> = headerPart?.body ?? {};

          // ── Đọc phần body text/plain ───────────────────────────────────────
          let body = '';
          if (message.attributes.struct) {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
            const allParts = imaps.getParts(message.attributes.struct as any);
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
            const textPart = allParts.find(
              (part: any) =>
                part.type?.toLowerCase() === 'text' &&
                part.subtype?.toLowerCase() === 'plain',
            );
            if (textPart) {
              // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
              const raw = await connection.getPartData(message, textPart);
              body = Buffer.isBuffer(raw) ? raw.toString('utf-8') : String(raw ?? '');
            }
          }

          // ── Sanitize message-id dùng làm source_id trong DB ───────────────
          const rawMessageId = String(
            header['message-id']?.[0] ?? `uid-${message.attributes.uid}`,
          );
          const messageId = rawMessageId.replace(/[<>\s]/g, '').slice(0, 200);

          // ── Gửi đến EmailProcessorService (ingest RAG + phân tích AI) ──────
          await this.emailProcessor.processIncomingEmail({
            from: String(header.from?.[0] ?? ''),
            subject: String(header.subject?.[0] ?? '(no subject)'),
            body: body.slice(0, 5000), // Giới hạn để tránh prompt AI quá dài
            messageId,
          });
        } catch (msgErr: any) {
          this.logger.error(`Error processing message: ${msgErr.message}`);
        }
      }
    } catch (error: any) {
      this.logger.error(`IMAP polling error: ${error.message}`);
    } finally {
      if (connection) {
        try { connection.end(); } catch { /* ignore */ }
      }
    }
  }
}
