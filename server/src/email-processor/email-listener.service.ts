import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EmailProcessorService } from './email-processor.service';
import { EmailFilterService } from './email-filter.service';
// Sử dụng thư viện imap-idle để xử lý real-time thay vì polling
import * as imapSimple from 'imap-simple';

@Injectable()
export class EmailListenerService {
  private readonly logger = new Logger(EmailListenerService.name);
  private imapConfig: imapSimple.ImapSimpleOptions;

  constructor(
    private configService: ConfigService,
    private emailProcessor: EmailProcessorService,
    private emailFilter: EmailFilterService,
  ) {
    this.imapConfig = {
      imap: {
        user: this.configService.get<string>('EMAIL_USER')!,
        password: this.configService.get<string>('EMAIL_PASS')!,
        host: this.configService.get<string>('EMAIL_IMAP_HOST', 'imap.gmail.com'),
        port: 993,
        tls: true,
        tlsOptions: { rejectUnauthorized: false },
        authTimeout: 10000,
      },
    };
  }

  // Sử dụng IDLE thay vì Cron
  async onModuleInit() {
    this.startIdling();
  }

  private async startIdling() {
    try {
      const connection = await imapSimple.connect(this.imapConfig);
      await connection.openBox('INBOX');

      this.logger.log('EmailListener: Đang lắng nghe real-time (IMAP IDLE)...');

      // @ts-ignore
      connection.imap.idle((err) => {
        if (err) {
          this.logger.error('IDLE Error:', err);
          setTimeout(() => this.startIdling(), 5000);
        }
      });

      // @ts-ignore
      connection.imap.on('mail', async () => {
        this.logger.log('Email mới phát hiện, bắt đầu xử lý...');
        await this.processNewEmails(connection);
      });

    } catch (error) {
      this.logger.error('Không thể kết nối IMAP:', error);
      setTimeout(() => this.startIdling(), 10000);
    }
  }

  private async processNewEmails(connection: imapSimple.ImapSimple) {
    // Logic tương tự như handleCron cũ để đọc UNSEEN và gọi emailProcessor
    const messages = await connection.search(['UNSEEN'], { bodies: ['HEADER', 'TEXT'], markSeen: true });
    
    for (const message of messages) {
      const headerPart = message.parts.find((p: any) => p.which === 'HEADER');
      const header: Record<string, string[]> = headerPart?.body ?? {};
      
      const emailData = {
        from: String(header.from?.[0] ?? ''),
        subject: String(header.subject?.[0] ?? '(no subject)'),
        body: '...', // Trích xuất logic body tương tự như file cũ
        messageId: String(header['message-id']?.[0] ?? 'uid-' + message.attributes.uid),
      };

      const filterResult = await this.emailFilter.filter(emailData);
      if (filterResult.shouldProcess) {
        await this.emailProcessor.processIncomingEmail(emailData);
      }
    }
  }
}
