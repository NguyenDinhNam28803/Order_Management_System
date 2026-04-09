import {
  Body,
  Controller,
  Param,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import type { Queue } from 'bull';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
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

@ApiTags('RAG (Retrieval-Augmented Generation)')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
@Controller('rag')
export class RagController {
  constructor(
    private readonly query: RagQueryService,
    private readonly ingest: RagIngestService,
    private readonly prGenerator: RagPrGeneratorService,
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
}
