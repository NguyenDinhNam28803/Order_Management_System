import { Body, Controller, Param, Post } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import type { Queue } from 'bull';
import { RagQueryService, RagResult } from './rag-query.service';
import { RagIngestService } from './rag-ingest.service';
import { RAG_SYNC_QUEUE } from './rag-sync.processor';

@Controller('rag')
export class RagController {
  constructor(
    private readonly query: RagQueryService,
    private readonly ingest: RagIngestService,
    @InjectQueue(RAG_SYNC_QUEUE) private readonly syncQueue: Queue,
  ) {}

  @Post('query')
  ask(@Body() body: { question: string; topK?: number }): Promise<RagResult> {
    return this.query.query(body.question, body.topK ?? 5);
  }

  @Post('ingest/:table')
  ingestTable(@Param('table') table: string) {
    return this.ingest.ingestTable(table as any);
  }

  @Post('sync')
  async triggerFullSync() {
    await this.syncQueue.add('sync-all', {}, { attempts: 3 });
    return { message: 'Sync job queued' };
  }
}
