// embedding.service.ts
import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class EmbeddingService {
  private readonly logger = new Logger(EmbeddingService.name);

  private get baseURL() {
    return process.env.FPT_AI_BASE_URL;
  }
  private get apiKey() {
    return process.env.FPT_AI_API_KEY;
  }
  private get model() {
    return process.env.FPT_EMBEDDING_MODEL ?? 'bge-m3';
  }

  async embed(text: string): Promise<number[]> {
    const vectors = await this.embedBatch([text]);
    return vectors[0];
  }

  async embedBatch(texts: string[]): Promise<number[][]> {
    const BATCH = 20;
    const results: number[][] = [];

    for (let i = 0; i < texts.length; i += BATCH) {
      const batch = texts.slice(i, i + BATCH);
      const res = await fetch(`${this.baseURL}/embeddings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({ model: this.model, input: batch }),
      });

      if (!res.ok) {
        const err = await res.text();
        throw new Error(`FPT Embedding error: ${res.status} - ${err}`);
      }

      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const data = await res.json();
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      results.push(...data.data.map((d: any) => d.embedding));
      this.logger.log(`Embedded ${i + batch.length}/${texts.length}`);
    }

    return results;
  }
}
