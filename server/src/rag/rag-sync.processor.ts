import { Process, Processor } from '@nestjs/bull';
import type { Job } from 'bull';
import { Logger } from '@nestjs/common';
import { RagIngestService } from './rag-ingest.service';

export const RAG_SYNC_QUEUE = 'rag-sync';

@Processor(RAG_SYNC_QUEUE)
export class RagSyncProcessor {
  private readonly logger = new Logger(RagSyncProcessor.name);

  constructor(private readonly ingest: RagIngestService) {}

  @Process('sync-all')
  async handleSyncAll(job: Job) {
    this.logger.log('Starting full RAG sync...');
    const tables = [
      'customers',
      'products',
      'purchase_requisitions',
      'rfq_requests',
      'rfq_quotations',
      'purchase_orders',
      'goods_receipts',
      'supplier_invoices',
      'payments',
      'contracts',
      'supplier_kpi_scores',
    ] as const;

    for (const table of tables) {
      const result = await this.ingest.ingestTable(table);
      this.logger.log(`[${table}] ${result.inserted} chunks synced`);
      await job.progress((tables.indexOf(table) + 1) * (100 / tables.length));
    }
  }

  @Process('sync-table')
  async handleSyncTable(job: Job<{ table: string }>) {
    const { table } = job.data;
    this.logger.log(`Syncing table: ${table}`);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    await this.ingest.ingestTable(table as any);
  }
}
