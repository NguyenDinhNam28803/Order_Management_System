// rag-query.service.ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EmbeddingService } from './embedding.service';

export interface RagResult {
  answer: any;
  sources: {
    table: string;
    id: string;
    content: string;
    metadata: any;
    similarity: number;
  }[];
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
      return {
        answer: {
          summary: 'Không tìm thấy dữ liệu liên quan.',
          data: [],
          found: false,
        },
        sources: [],
      };
    }

    const context = chunks
      .map((c, i) => {
        const meta = JSON.stringify(c.metadata);
        return `[Tài liệu ${i + 1}]
                Bảng: ${c.source_table}
                ID: ${c.source_id}
                Metadata: ${meta}
                Nội dung: ${c.content}`;
      })
      .join('\n\n---\n\n');

    const rawAnswer = await this.callFptLlm(question, context);

    let parsedAnswer: any;
    try {
      // Thử parse JSON nếu LLM trả về đúng định dạng
      // Đôi khi LLM bọc trong ```json ... ```
      const jsonMatch =
        rawAnswer.match(/```json\s*([\s\S]*?)\s*```/) ||
        rawAnswer.match(/\{[\s\S]*\}/);
      const jsonStr = jsonMatch ? jsonMatch[0] : rawAnswer;
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      parsedAnswer = JSON.parse(jsonStr.replace(/```json|```/g, '').trim());
    } catch {
      parsedAnswer = {
        summary: rawAnswer,
        data: [],
        found: true,
        parseError: 'Could not parse JSON from LLM',
      };
    }

    return {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      answer: parsedAnswer,
      sources: chunks.map((c) => ({
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        table: c.source_table,
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        id: c.source_id,
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        content: c.content,
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        metadata: c.metadata,
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
                - Nếu không tìm thấy thông tin phù hợp trong CONTEXT, trả về JSON với found: false.

                QUY ĐỊNH ĐỊNH DẠNG TRẢ LỜI:
                - BẮT BUỘC trả về định dạng JSON thuần túy, không kèm văn bản giải thích ngoài JSON.
                - Trường dữ liệu details được chuyển đổi thành JSON từ text được truy vấn
                - Cấu trúc JSON mong muốn:
                  {
                    "summary": "Tóm tắt câu trả lời một cách tự nhiên",
                    "data": [
                      {
                        "id": "ID bản ghi",
                        "table": "Tên bảng",
                        "name": "Tên hoặc Số hiệu bản ghi (từ metadata)",
                        "details": "Các thông tin chi tiết trích xuất được từ nội dung" (Chuyển đổi sang định dạng JSON),
                        "status": "Trạng thái (nếu có)",
                        "amount": "Số tiền/Giá trị (nếu có)"
                      }
                    ],
                    "found": true
                  }

                CONTEXT:
                ${context}
                `,
            },
            { role: 'user', content: question },
          ],
          streaming: false,
          temperature: 0.1, // Thấp hơn để output JSON ổn định hơn
          max_tokens: 2048,
          top_p: 1,
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
