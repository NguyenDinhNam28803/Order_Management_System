import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import type { Queue } from 'bull';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth-module/jwt-auth.guard';
import { RagQueryService, RagResult } from './rag-query.service';
import { RagIngestService } from './rag-ingest.service';
import { RAG_SYNC_QUEUE } from './rag-sync.processor';
import { QueryRequiredDto } from './dto/rag-query.dto';
import { RagPrGeneratorService } from './rag-pr-generator.service';
import {
  GeneratePrDraftDto,
  PrDraftResponse,
} from './dto/generate-pr-draft.dto';
import { JwtPayload } from '../auth-module/interfaces/jwt-payload.interface';
import { EmailRagService, ParsedEmail } from './email-rag.service';

@ApiTags('RAG (Retrieval-Augmented Generation)')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
@Controller('rag')
export class RagController {
  constructor(
    private readonly query: RagQueryService,
    private readonly ingest: RagIngestService,
    private readonly prGenerator: RagPrGeneratorService,
    private readonly emailRag: EmailRagService,
    @InjectQueue(RAG_SYNC_QUEUE) private readonly syncQueue: Queue,
  ) {}

  @Post('query')
  @ApiOperation({
    summary: 'Query dữ liệu từ RAG',
    description:
      'Sử dụng AI và Vector Search để tìm câu trả lời từ dữ liệu nội bộ.',
  })
  @ApiBody({ type: QueryRequiredDto })
  @ApiResponse({
    status: 200,
    description: 'Trả về câu trả lời và các nguồn tham khảo.',
  })
  ask(@Body() body: QueryRequiredDto): Promise<RagResult> {
    return this.query.query(body.question, body.topK ?? 5);
  }

  @Post('ingest/:table')
  @ApiOperation({
    summary: 'Ingest dữ liệu từ table vào Vector DB',
    description:
      'Lấy dữ liệu từ một bảng database, tạo embedding và lưu vào Vector DB.',
  })
  @ApiResponse({
    status: 201,
    description: 'Đã hoàn thành việc ingest dữ liệu.',
  })
  ingestTable(@Param('table') table: string) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    return this.ingest.ingestTable(table as any);
  }

  @Post('sync')
  @ApiOperation({
    summary: 'Kích hoạt Full Sync dữ liệu',
    description: 'Đưa job đồng bộ toàn bộ dữ liệu vào hàng đợi xử lý.',
  })
  @ApiResponse({ status: 202, description: 'Job đã được đưa vào hàng đợi.' })
  async triggerFullSync() {
    await this.syncQueue.add('sync-all', {}, { attempts: 3 });
    return { message: 'Sync job queued' };
  }

  @Post('generate-pr-draft')
  @ApiOperation({
    summary: 'Tạo PR Draft bằng AI (RAG)',
    description: `Sử dụng AI và RAG để phân tích yêu cầu của người dùng và tạo PR Draft.
    
    Hệ thống sẽ:
    1. Tìm kiếm sản phẩm/danh mục liên quan từ Vector DB
    2. Gợi ý nhà cung cấp phù hợp
    3. Tạo PR Draft với items, giá ước tính, cost center đề xuất
    
    Người dùng có thể xem trước, chỉnh sửa và submit PR.`,
  })
  @ApiBody({ type: GeneratePrDraftDto })
  @ApiResponse({
    status: 200,
    description: 'PR Draft được tạo thành công',
    type: Object,
  })
  async generatePrDraft(
    @Body() body: GeneratePrDraftDto,
    @Request() req: { user: JwtPayload },
  ): Promise<PrDraftResponse> {
    // Lấy orgId từ body hoặc từ JWT token (đã được set bởi auth middleware)
    console.log('orgId:', req.user?.orgId, 'role:', req.user?.role);
    return this.prGenerator.generatePrDraft(
      body.prompt,
      req.user?.orgId,
      req.user,
    );
  }

  // ─── Email RAG Endpoints ────────────────────────────────────────────────────

  /**
   * GET /rag/emails
   * Lấy danh sách email thô từ INBOX (không cần ingest trước).
   * Dùng để xem nhanh email, hoặc kiểm tra kết nối IMAP.
   */
  @Get('emails')
  @ApiOperation({
    summary: 'Lấy email gần nhất từ Gmail INBOX',
    description:
      'Kết nối IMAP tới Gmail và trả về danh sách email dạng raw. ' +
      'Không cần ingest trước — dùng để xem nhanh hoặc debug.',
  })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 20 })
  @ApiResponse({ status: 200, description: 'Danh sách ParsedEmail[]' })
  fetchEmails(@Query('limit') limit?: string): Promise<ParsedEmail[]> {
    return this.emailRag.fetchRecentEmails(limit ? parseInt(limit) : 20);
  }

  /**
   * POST /rag/emails/ingest
   * Ingest email vào Vector Store để RAG query có thể tìm kiếm.
   * Sau khi gọi endpoint này, dùng POST /rag/query với câu hỏi về email.
   */
  @Post('emails/ingest')
  @ApiOperation({
    summary: 'Ingest email Gmail vào Vector Store',
    description:
      'Đọc email từ INBOX, tạo embedding bằng FPT AI và lưu vào document_embeddings. ' +
      'Sau bước này, RAG query (/rag/query) có thể tìm kiếm nội dung email.',
  })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 50 })
  @ApiResponse({
    status: 201,
    description: 'Kết quả ingest: { ingested: number, skipped: number }',
  })
  ingestEmails(
    @Query('limit') limit?: string,
  ): Promise<{ ingested: number; skipped: number }> {
    return this.emailRag.ingestEmails(limit ? parseInt(limit) : 50);
  }
}
