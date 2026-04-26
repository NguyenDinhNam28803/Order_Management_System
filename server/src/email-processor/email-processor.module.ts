import { Module } from '@nestjs/common';
import { EmailProcessorService } from './email-processor.service';
import { EmailListenerService } from './email-listener.service';
import { EmailFilterService } from './email-filter.service';
import { AiService } from '../ai-service/ai-service.service';
import { PrismaService } from '../prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import { RagModule } from '../rag/rag.module';
import { NotificationModuleModule } from '../notification-module/notification-module.module';

@Module({
  imports: [
    RagModule,
    NotificationModuleModule,
  ],
  providers: [
    EmailProcessorService,
    EmailListenerService,
    EmailFilterService,
    AiService,
    PrismaService,
    ConfigService,
  ],
  exports: [EmailProcessorService],
})
export class EmailProcessorModule {}
