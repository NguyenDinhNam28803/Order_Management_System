import { Module } from '@nestjs/common';
import { EmailProcessorService } from './email-processor.service';
import { EmailListenerService } from './email-listener.service';
import { AiService } from '../ai-service/ai-service.service';
import { PrismaService } from '../prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import { RagModule } from '../rag/rag.module';

@Module({
  imports: [
    RagModule, // Cần EmailRagService để ingest email vào vector store ngay lập tức
  ],
  providers: [
    EmailProcessorService,
    EmailListenerService,
    AiService,
    PrismaService,
    ConfigService,
  ],
  exports: [EmailProcessorService],
})
export class EmailProcessorModule {}
