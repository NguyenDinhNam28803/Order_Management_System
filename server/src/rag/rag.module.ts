import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { ConfigModule } from '@nestjs/config';
import { RagController } from './rag.controller';
import { EmbeddingService } from './embedding.service';
import { RagIngestService } from './rag-ingest.service';
import { RagQueryService } from './rag-query.service';
import { RagSyncProcessor, RAG_SYNC_QUEUE } from './rag-sync.processor';
import { RagPrGeneratorService } from './rag-pr-generator.service';

@Module({
  imports: [BullModule.registerQueue({ name: RAG_SYNC_QUEUE }), ConfigModule],
  controllers: [RagController],
  providers: [
    EmbeddingService,
    RagIngestService,
    RagQueryService,
    RagSyncProcessor,
    RagPrGeneratorService,
  ],
  exports: [RagQueryService, RagPrGeneratorService],
})
export class RagModule {}
