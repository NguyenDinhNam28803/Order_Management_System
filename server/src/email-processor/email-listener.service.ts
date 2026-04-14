import { Injectable, OnModuleInit } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ConfigService } from '@nestjs/config';
import * as imaps from 'imap-simple';
import { EmailProcessorService } from './email-processor.service';

@Injectable()
export class EmailListenerService implements OnModuleInit {
  private imapConfig: any;

  constructor(
    private configService: ConfigService,
    private emailProcessor: EmailProcessorService,
  ) {
    this.imapConfig = {
      imap: {
        user: this.configService.get<string>('EMAIL_USER'),
        password: this.configService.get<string>('EMAIL_PASS'),
        host: this.configService.get<string>(
          'EMAIL_IMAP_HOST',
          'imap.gmail.com',
        ),
        port: 993,
        tls: true,
        authTimeout: 3000,
      },
    };
  }

  onModuleInit() {
    console.log('EmailListenerService initialized.');
  }

  @Cron(CronExpression.EVERY_MINUTE)
  async handleCron() {
    try {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const connection = await imaps.connect(this.imapConfig);
      await connection.openBox('INBOX');

      const searchCriteria = ['UNSEEN'];
      const fetchOptions = {
        bodies: ['HEADER', 'TEXT'],
        markSeen: true,
      };

      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const messages = await connection.search(searchCriteria, fetchOptions);

      for (const message of messages) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        const allParts = imaps.getParts(message.attributes.struct || []);
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        const textPart = allParts.find(
          (part) => part.type === 'text' && part.subtype === 'plain',
        );

        if (textPart) {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          const body = await connection.getPartData(message, textPart);
          // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
          await this.emailProcessor.processIncomingEmail(body);
        }
      }

      await connection.end();
    } catch (error) {
      console.error('Error fetching emails:', error);
    }
  }
}
