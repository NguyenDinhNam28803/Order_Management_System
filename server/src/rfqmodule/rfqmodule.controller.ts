import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Request,
  Put,
  Delete,
} from '@nestjs/common';
import { RfqmoduleService } from './rfqmodule.service';
import { CreateRfqDto } from './dto/create-rfq.dto';
import { CreateQuotationDto } from './dto/create-quotation.dto';
import { CreateQaThreadDto } from './dto/create-qa-thread.dto';
import { CreateCounterOfferDto } from './dto/create-counter-offer.dto';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth-module/jwt-auth.guard';

@ApiTags('Request for Quotation (RFQ)')
@Controller('rfq')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
export class RfqmoduleController {
  constructor(private readonly rfqService: RfqmoduleService) {}

  // ============ RFQ Endpoints ============

  @Post()
  @ApiOperation({
    summary: 'Tạo yêu cầu báo giá mới',
    description: 'Tạo một yêu cầu báo giá mới từ một đơn hàng mua sắm',
  })
  async create(@Body() createRfqDto: CreateRfqDto, @Request() req: any) {
    return this.rfqService.create(createRfqDto, req.user);
  }

  @Get()
  @ApiOperation({
    summary: 'Lấy tất cả yêu cầu báo giá cho tổ chức',
    description: 'Trả về danh sách tất cả yêu cầu báo giá cho tổ chức hiện tại',
  })
  async findAll(@Request() req: any) {
    return this.rfqService.findAll(req.user);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get RFQ detail' })
  async findOne(@Param('id') id: string) {
    return this.rfqService.findOne(id);
  }

  @Put(':id/status')
  @ApiOperation({
    summary: 'Cập nhật trạng thái RFQ',
    description: 'Cập nhật trạng thái của một yêu cầu báo giá cụ thể',
  })
  async updateStatus(@Param('id') id: string, @Body() body: any) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    return this.rfqService.updateStatus(id, body.status);
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Xóa yêu cầu báo giá',
    description: 'Xóa một yêu cầu báo giá cụ thể',
  })
  async delete(@Param('id') id: string) {
    return this.rfqService.delete(id);
  }

  // ============ Quotation Endpoints ============

  @Post(':rfqId/quotations')
  @ApiOperation({
    summary: 'Gửi báo giá cho RFQ',
    description: 'Gửi một báo giá mới cho một yêu cầu báo giá cụ thể',
  })
  async createQuotation(
    @Param('rfqId') rfqId: string,
    @Body() createQuotationDto: CreateQuotationDto,
  ) {
    return this.rfqService.createQuotation(rfqId, createQuotationDto);
  }

  @Get(':rfqId/quotations')
  @ApiOperation({
    summary: 'Lấy tất cả báo giá cho RFQ',
    description:
      'Trả về danh sách tất cả báo giá cho một yêu cầu báo giá cụ thể',
  })
  async getQuotationsByRfq(@Param('rfqId') rfqId: string) {
    return this.rfqService.getQuotationsByRfq(rfqId);
  }

  @Get('quotations/:id')
  @ApiOperation({
    summary: 'Lấy chi tiết báo giá',
    description: 'Trả về thông tin chi tiết của một báo giá cụ thể',
  })
  async getQuotation(@Param('id') id: string) {
    return this.rfqService.getQuotation(id);
  }

  @Put('quotations/:id/submit')
  @ApiOperation({
    summary: 'Gửi báo giá',
    description: 'Gửi một báo giá mới cho một yêu cầu báo giá cụ thể',
  })
  async submitQuotation(@Param('id') id: string) {
    return this.rfqService.submitQuotation(id);
  }

  @Put('quotations/:id/review')
  @ApiOperation({
    summary: 'Xem xét báo giá',
    description: 'Xem xét một báo giá cụ thể',
  })
  async reviewQuotation(@Param('id') id: string, @Request() req: any) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    return this.rfqService.reviewQuotation(id, req.user.sub);
  }

  @Put('quotations/:id/accept')
  @ApiOperation({
    summary: 'Chấp nhận báo giá',
    description: 'Chấp nhận một báo giá cụ thể',
  })
  async acceptQuotation(@Param('id') id: string, @Request() req: any) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    return this.rfqService.acceptQuotation(id, req.user.sub);
  }

  @Put('quotations/:id/reject')
  @ApiOperation({
    summary: 'Từ chối báo giá',
    description: 'Từ chối một báo giá cụ thể',
  })
  async rejectQuotation(@Param('id') id: string, @Request() req: any) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    return this.rfqService.rejectQuotation(id, req.user.sub);
  }

  @Put('quotations/:id/ai-score')
  @ApiOperation({
    summary: 'Cập nhật điểm AI của báo giá',
    description: 'Cập nhật điểm AI cho một báo giá cụ thể',
  })
  async updateQuotationAiScore(@Param('id') id: string, @Body() body: any) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    return this.rfqService.updateQuotationAiScore(id, body.aiScore);
  }

  // ============ QA Thread Endpoints ============

  @Post(':rfqId/qa-threads')
  @ApiOperation({
    summary: 'Tạo chủ đề Q&A cho RFQ',
    description: 'Tạo một chủ đề Q&A mới cho một yêu cầu báo giá cụ thể',
  })
  async createQaThread(
    @Param('rfqId') rfqId: string,
    @Body() createQaThreadDto: CreateQaThreadDto,
    @Request() req: any,
  ) {
    return this.rfqService.createQaThread(
      rfqId,
      createQaThreadDto.supplierId,
      createQaThreadDto.question,
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      req.user.sub,
      createQaThreadDto.isPublic,
    );
  }

  @Get(':rfqId/qa-threads')
  @ApiOperation({
    summary: 'Lấy tất cả chủ đề Q&A cho RFQ',
    description:
      'Trả về danh sách tất cả chủ đề Q&A cho một yêu cầu báo giá cụ thể',
  })
  async getQaThreadsByRfq(@Param('rfqId') rfqId: string) {
    return this.rfqService.getQaThreadsByRfq(rfqId);
  }

  @Get('qa-threads/:id')
  @ApiOperation({
    summary: 'Lấy chi tiết chủ đề Q&A',
    description: 'Trả về thông tin chi tiết của một chủ đề Q&A cụ thể',
  })
  async getQaThread(@Param('id') id: string) {
    return this.rfqService.getQaThread(id);
  }

  @Put('qa-threads/:id/answer')
  @ApiOperation({
    summary: 'Trả lời chủ đề Q&A',
    description: 'Trả lời một chủ đề Q&A cụ thể',
  })
  async answerQaThread(
    @Param('id') id: string,
    @Body() body: any,
    @Request() req: any,
  ) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    return this.rfqService.answerQaThread(id, body.answer, req.user.sub);
  }

  @Get(':rfqId/qa-threads/supplier/:supplierId')
  @ApiOperation({
    summary: 'Lấy chủ đề Q&A theo nhà cung cấp cho RFQ',
    description:
      'Trả về danh sách chủ đề Q&A cho một nhà cung cấp cụ thể trong một yêu cầu báo giá',
  })
  async getQaThreadsBySupplier(
    @Param('rfqId') rfqId: string,
    @Param('supplierId') supplierId: string,
  ) {
    return this.rfqService.getQaThreadsBySupplier(supplierId, rfqId);
  }

  // ============ Counter Offer Endpoints ============

  @Post('quotations/:quotationId/counter-offers')
  @ApiOperation({
    summary: 'Tạo đề xuất phản hồi cho báo giá',
    description: 'Tạo một đề xuất phản hồi mới cho một báo giá cụ thể',
  })
  async createCounterOffer(
    @Param('quotationId') quotationId: string,
    @Body() createCounterOfferDto: CreateCounterOfferDto,
    @Request() req: any,
  ) {
    return this.rfqService.createCounterOffer(
      quotationId,
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      req.user.sub,
      createCounterOfferDto,
    );
  }

  @Get('quotations/:quotationId/counter-offers')
  @ApiOperation({
    summary: 'Lấy tất cả đề xuất phản hồi cho báo giá',
    description:
      'Trả về danh sách tất cả đề xuất phản hồi cho một báo giá cụ thể',
  })
  async getCounterOffersByQuotation(@Param('quotationId') quotationId: string) {
    return this.rfqService.getCounterOffersByQuotation(quotationId);
  }

  @Get('counter-offers/:id')
  @ApiOperation({
    summary: 'Lấy chi tiết đề xuất phản hồi',
    description: 'Trả về thông tin chi tiết của một đề xuất phản hồi cụ thể',
  })
  async getCounterOffer(@Param('id') id: string) {
    return this.rfqService.getCounterOffer(id);
  }

  @Put('counter-offers/:id/respond')
  @ApiOperation({
    summary: 'Phản hồi đề xuất phản hồi',
    description: 'Phản hồi một đề xuất phản hồi cụ thể',
  })
  async respondCounterOffer(@Param('id') id: string, @Body() body: any) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    return this.rfqService.respondCounterOffer(id, body.response);
  }
}
