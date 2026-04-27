import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ConfigService } from '@nestjs/config';
import * as imaps from 'imap-simple';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const pdfParse = require('pdf-parse') as (
  buf: Buffer,
) => Promise<{ text: string }>;
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
    let retries = 2;

    while (retries > 0) {
      try {
        connection = await imaps.connect(this.imapConfig);

        // Thêm handler bắt lỗi socket để tránh EPIPE gây crash
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        (connection as any).imap.socket.on('error', (err: any) => {
          this.logger.error('IMAP Socket Error:', err.message);
        });

        await connection.openBox('INBOX');

        const searchCriteria = ['UNSEEN'];
        const fetchOptions = {
          bodies: ['HEADER', 'TEXT'],
          markSeen: false,
          struct: true,
        };

        const messages = await connection.search(searchCriteria, fetchOptions);

        const batch = messages.slice(0, 5);
        if (messages.length > 5) {
          this.logger.warn(
            `${messages.length} unseen emails found — processing first 5`,
          );
        }

        for (const message of batch) {
          try {
            const headerPart = message.parts.find(
              (p: any) => p.which === 'HEADER',
            );
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
            const header: Record<string, string[]> = headerPart?.body ?? {};

            let body = '';
            const attachmentNames: string[] = [];
            if (message.attributes.struct) {
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
                body = Buffer.isBuffer(raw)
                  ? raw.toString('utf-8')
                  : String(raw ?? '');
              }

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
                  body = html
                    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
                    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
                    .replace(/<[^>]+>/g, ' ')
                    .replace(/\s{2,}/g, ' ')
                    .trim();
                }
              }

              for (const part of allParts) {
                // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
                const disposition = part.disposition;
                // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
                const filename =
                  disposition?.params?.filename ??
                  part.params?.name ??
                  part.filename;
                if (!filename) continue;
                attachmentNames.push(String(filename));

                if (part.subtype?.toLowerCase() === 'pdf' && !body.trim()) {
                  try {
                    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
                    const raw = await connection.getPartData(message, part);
                    const buf = Buffer.isBuffer(raw)
                      ? raw
                      : Buffer.from(String(raw ?? ''), 'binary');
                    const parsed = await pdfParse(buf);
                    if (parsed.text?.trim()) body = parsed.text.trim();
                  } catch (pdfErr: any) {
                    this.logger.warn(`PDF parse failed: ${pdfErr.message}`);
                  }
                }
              }
            }

            const rawMessageId = String(
              header['message-id']?.[0] ?? `uid-${message.attributes.uid}`,
            );
            const messageId = rawMessageId.replace(/[<>\s]/g, '').slice(0, 200);

            const emailData = {
              from: String(header.from?.[0] ?? ''),
              subject: String(header.subject?.[0] ?? '(no subject)'),
              body: (
                body +
                (attachmentNames.length > 0
                  ? `\n\n[File: ${attachmentNames.join(', ')}]`
                  : '')
              ).slice(0, 6000),
              messageId,
              attachments: attachmentNames,
            };

            const filterResult = await this.emailFilter.filter(emailData);
            if (filterResult.shouldProcess) {
              await this.emailProcessor.processIncomingEmail(emailData);
              await connection.addFlags(message.attributes.uid, ['\\Seen']);
            }

            await new Promise((resolve) => setTimeout(resolve, 4000));
          } catch (msgErr: any) {
            this.logger.error(`Error processing message: ${msgErr.message}`);
          }
        }
        break; // Success
      } catch (error: any) {
        retries--;
        this.logger.error(
          `IMAP session error (retries left: ${retries}): ${error.message}`,
        );
        await new Promise((resolve) => setTimeout(resolve, 5000));
      } finally {
        if (connection) {
          try {
            connection.end();
          } catch (e) {
            this.logger.warn('Error closing IMAP connection: ' + e);
          }
          connection = undefined;
        }
      }
    }
  }
}
