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
    const queryVector = await this.embedding.embed(question);
    const vectorStr = `[${queryVector.join(',')}]`;

    // Dùng $queryRawUnsafe thay vì $queryRaw
    const chunks = await this.prisma.$queryRawUnsafe<any[]>(
      `
    SELECT
      content,
      source_table,
      source_id,
      metadata,
      1 - (embedding <=> $1::vector) AS similarity
    FROM document_embeddings
    ORDER BY embedding <=> $1::vector
    LIMIT $2
    `,
      vectorStr,
      topK,
    );

    if (!chunks.length) {
      return { answer: 'Không tìm thấy dữ liệu liên quan.', sources: [] };
    }

    const context = chunks
      .map((c, i) => `[${i + 1}] [${c.source_table}] ${c.content}`)
      .join('\n\n');

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
              content: `
                Bạn là AI Assistant hỗ trợ nghiệp vụ nội bộ doanh nghiệp (ERP, EIP, Workflow, PO, PR, Invoice,...).

                Nguyên tắc bắt buộc:
                - Chỉ trả lời dựa trên thông tin có trong CONTEXT.
                - Không suy luận vượt ngoài dữ liệu.
                - Không tự tạo thông tin mới.
                - Nếu không tìm thấy thông tin liên quan trong CONTEXT, trả lời:
                  "Không tìm thấy thông tin phù hợp trong dữ liệu hiện có."
                - Nếu câu hỏi không rõ ràng, hãy yêu cầu người dùng cung cấp thêm thông tin.

                Hướng dẫn trả lời:
                - Ưu tiên thuật ngữ nghiệp vụ đúng theo CONTEXT.
                - Trả lời ngắn gọn, chính xác, đúng trọng tâm.
                - Có thể trình bày dạng bullet points nếu phù hợp.
                - Nếu CONTEXT chứa nhiều đoạn liên quan, hãy tổng hợp lại logic.

                CONTEXT:
                ${context}
                `,
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
