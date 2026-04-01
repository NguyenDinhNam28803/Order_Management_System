import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { RagController } from './rag.controller';
import { EmbeddingService } from './embedding.service';
import { RagIngestService } from './rag-ingest.service';
import { RagQueryService } from './rag-query.service';
import { RagSyncProcessor, RAG_SYNC_QUEUE } from './rag-sync.processor';

@Module({
  imports: [BullModule.registerQueue({ name: RAG_SYNC_QUEUE })],
  controllers: [RagController],
  providers: [
    EmbeddingService,
    RagIngestService,
    RagQueryService,
    RagSyncProcessor,
  ],
  exports: [RagQueryService], // export để dùng trong module khác nếu cần
})
export class RagModule {}
