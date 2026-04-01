// rag-query.service.ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EmbeddingService } from './embedding.service';

export interface RagResult {
  answer: string;
  sources: { table: string; id: string; content: string; similarity: number }[];
}

@Injectable()
export class RagQueryService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly embedding: EmbeddingService,
  ) {}

  async query(question: string, topK = 5): Promise<RagResult> {
    // 1. Embed câu hỏi
    const queryVector = await this.embedding.embed(question);
    const vectorStr = `[${queryVector.join(',')}]`;

    // 2. Semantic search
    const chunks = await this.prisma.$queryRaw<any[]>`
      SELECT
        content,
        source_table,
        source_id,
        1 - (embedding <=> ${vectorStr}::vector) AS similarity
      FROM document_embeddings
      ORDER BY embedding <=> ${vectorStr}::vector
      LIMIT ${topK}
    `;

    if (!chunks.length) {
      return { answer: 'Không tìm thấy dữ liệu liên quan.', sources: [] };
    }

    // 3. Build context
    const context = chunks
      .map((c, i) => `[${i + 1}] [${c.source_table}] ${c.content}`)
      .join('\n\n');

    // 4. Gọi FPT LLM — dùng fetch thay vì openai SDK
    const answer = await this.callFptLlm(question, context);

    return {
      answer,
      sources: chunks.map((c) => ({
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        table: c.source_table,
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        id: c.source_id,
        content: c.content.slice(0, 120) + '...',
        similarity: parseFloat(Number(c.similarity).toFixed(3)),
      })),
    };
  }

  private async callFptLlm(question: string, context: string): Promise<string> {
    const response = await fetch(
      `${process.env.FPT_AI_BASE_URL}/chat/completions`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${process.env.FPT_AI_API_KEY}`,
        },
        body: JSON.stringify({
          model: process.env.FPT_LLM_MODEL ?? 'SaoLa4-medium',
          messages: [
            {
              role: 'system',
              content: `Bạn là trợ lý AI hỗ trợ nghiệp vụ nội bộ.
                Dựa VÀO DỮ LIỆU ĐƯỢC CUNG CẤP để trả lời câu hỏi.
                Nếu dữ liệu không đủ, hãy nói rõ và KHÔNG bịa thêm thông tin.
                Trả lời bằng tiếng Việt, ngắn gọn, chính xác.

                DỮ LIỆU:
                ${context}`,
            },
            { role: 'user', content: question },
          ],
          streaming: false, // ← FPT dùng "streaming" không phải "stream"
          temperature: 0.2,
          max_tokens: 1024,
          top_p: 1,
          top_k: 40,
          presence_penalty: 0,
          frequency_penalty: 0,
        }),
      },
    );

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`FPT LLM error: ${response.status} - ${err}`);
    }

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const data = await response.json();
    return data.choices?.[0]?.message?.content ?? 'Không có phản hồi.';
  }
}
