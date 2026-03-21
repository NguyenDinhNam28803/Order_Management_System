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

  // Tạo Ai phân tích nhà cung cấp
  @Post('/ai-suggest')
  @ApiOperation({
    summary: 'Tạo yêu cầu gợi ý',
    description: 'Tạo một yêu cầu gợi ý mới từ một đơn hàng mua sắm',
  })
  async getAiSuggest(@Body() rfqId: string) {
    return this.rfqService.suggestSuppliersWithAi(rfqId);
  }

  /**
   * Tạo một yêu cầu báo giá (Request for Quotation - RFQ) mới
   * @param createRfqDto Dữ liệu tạo yêu cầu báo giá
   * @param req Thông tin người dùng tạo yêu cầu
   * @returns RFQ vừa tạo
   */
  @Post()
  @ApiOperation({
    summary: 'Tạo yêu cầu báo giá mới',
    description: 'Tạo một yêu cầu báo giá mới từ một đơn hàng mua sắm',
  })
  async create(@Body() createRfqDto: CreateRfqDto, @Request() req: any) {
    return this.rfqService.create(createRfqDto, req.user);
  }

  /**
   * Lấy danh sách tất cả các yêu cầu báo giá của tổ chức hiện tại
   * @param req Thông tin người dùng để xác định tổ chức
   * @returns Danh sách các RFQ
   */
  @Get()
  @ApiOperation({
    summary: 'Lấy tất cả yêu cầu báo giá cho tổ chức',
    description: 'Trả về danh sách tất cả yêu cầu báo giá cho tổ chức hiện tại',
  })
  async findAll(@Request() req: any) {
    return this.rfqService.findAll(req.user);
  }

  /**
   * Lấy thông tin chi tiết của một RFQ theo ID
   * @param id ID của RFQ
   * @returns Chi tiết RFQ
   */
  @Get(':id')
  @ApiOperation({ summary: 'Lấy thông tin chi tiết của yêu cầu báo giá' })
  async findOne(@Param('id') id: string) {
    return this.rfqService.findOne(id);
  }

  /**
   * Cập nhật trạng thái của RFQ (ví dụ: Mở, Đóng, Đang xét duyệt)
   * @param id ID của RFQ
   * @param body Chứa trạng thái mới cần cập nhật
   * @returns RFQ sau khi cập nhật trạng thái
   */
  @Put(':id/status')
  @ApiOperation({
    summary: 'Cập nhật trạng thái RFQ',
    description: 'Cập nhật trạng thái của một yêu cầu báo giá cụ thể',
  })
  async updateStatus(@Param('id') id: string, @Body() body: any) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    return this.rfqService.updateStatus(id, body.status);
  }

  /**
   * Xóa một RFQ khỏi hệ thống theo ID
   * @param id ID của RFQ cần xóa
   * @returns Kết quả xóa
   */
  @Delete(':id')
  @ApiOperation({
    summary: 'Xóa yêu cầu báo giá',
    description: 'Xóa một yêu cầu báo giá cụ thể',
  })
  async delete(@Param('id') id: string) {
    return this.rfqService.delete(id);
  }

  // ============ Quotation Endpoints ============

  /**
   * Sử dụng AI để phân tích và chấm điểm báo giá chi tiết.
   * @param id ID của báo giá cần phân tích
   */
  @Post('quotations/:id/analyze')
  @ApiOperation({ 
    summary: 'Dùng AI phân tích và chấm điểm báo giá',
    description: 'Phân tích báo giá dựa trên giá cả, thời gian giao hàng và độ tin cậy của nhà cung cấp.'
  })
  analyzeQuotation(@Param('id') id: string) {
    return this.rfqService.analyzeQuotationWithAi(id);
  }

  /**
   * Nhà cung cấp gửi báo giá cho một RFQ cụ thể
   * @param rfqId ID của RFQ
   * @param createQuotationDto Dữ liệu báo giá của nhà cung cấp
   * @returns Báo giá vừa tạo
   */
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

  /**
   * Lấy danh sách tất cả các báo giá đã nhận được cho một RFQ
   * @param rfqId ID của RFQ
   * @returns Danh sách các báo giá
   */
  @Get(':rfqId/quotations')
  @ApiOperation({
    summary: 'Lấy tất cả báo giá cho RFQ',
    description:
      'Trả về danh sách tất cả báo giá cho một yêu cầu báo giá cụ thể',
  })
  async getQuotationsByRfq(@Param('rfqId') rfqId: string) {
    return this.rfqService.getQuotationsByRfq(rfqId);
  }

  /**
   * Lấy thông tin chi tiết của một bản báo giá theo ID
   * @param id ID của báo giá
   * @returns Chi tiết báo giá
   */
  @Get('quotations/:id')
  @ApiOperation({
    summary: 'Lấy chi tiết báo giá',
    description: 'Trả về thông tin chi tiết của một báo giá cụ thể',
  })
  async getQuotation(@Param('id') id: string) {
    return this.rfqService.getQuotation(id);
  }

  /**
   * Gửi chính thức một báo giá (thay đổi trạng thái từ nháp sang đã gửi)
   * @param id ID của báo giá
   * @returns Trạng thái báo giá sau khi gửi
   */
  @Put('quotations/:id/submit')
  @ApiOperation({
    summary: 'Gửi báo giá',
    description: 'Gửi một báo giá mới cho một yêu cầu báo giá cụ thể',
  })
  async submitQuotation(@Param('id') id: string) {
    return this.rfqService.submitQuotation(id);
  }

  /**
   * Chuyên viên mua sắm xem xét báo giá
   * @param id ID của báo giá
   * @param req Thông tin người xem xét
   * @returns Báo giá sau khi cập nhật trạng thái xem xét
   */
  @Put('quotations/:id/review')
  @ApiOperation({
    summary: 'Xem xét báo giá',
    description: 'Xem xét một báo giá cụ thể',
  })
  async reviewQuotation(@Param('id') id: string, @Request() req: any) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    return this.rfqService.reviewQuotation(id, req.user.sub);
  }

  /**
   * Chấp nhận một báo giá và có thể tiến tới tạo đơn hàng (PO)
   * @param id ID của báo giá được chấp nhận
   * @param req Thông tin người chấp nhận
   * @returns Báo giá sau khi được chấp nhận
   */
  @Put('quotations/:id/accept')
  @ApiOperation({
    summary: 'Chấp nhận báo giá',
    description: 'Chấp nhận một báo giá cụ thể',
  })
  async acceptQuotation(@Param('id') id: string, @Request() req: any) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    return this.rfqService.acceptQuotation(id, req.user.sub);
  }

  /**
   * Từ chối một báo giá từ nhà cung cấp
   * @param id ID của báo giá bị từ chối
   * @param req Thông tin người từ chối
   * @returns Báo giá sau khi bị từ chối
   */
  @Put('quotations/:id/reject')
  @ApiOperation({
    summary: 'Từ chối báo giá',
    description: 'Từ chối một báo giá cụ thể',
  })
  async rejectQuotation(@Param('id') id: string, @Request() req: any) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    return this.rfqService.rejectQuotation(id, req.user.sub);
  }

  /**
   * Cập nhật điểm số đánh giá bởi AI cho một báo giá
   * @param id ID của báo giá
   * @param body Chứa điểm số AI
   * @returns Báo giá với điểm AI mới
   */
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

  /**
   * Tạo một luồng hỏi đáp (Q&A) cho một RFQ
   * @param rfqId ID của RFQ
   * @param createQaThreadDto Dữ liệu câu hỏi
   * @param req Thông tin người đặt câu hỏi
   * @returns Luồng Q&A vừa tạo
   */
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

  /**
   * Lấy tất cả các luồng hỏi đáp liên quan đến một RFQ
   * @param rfqId ID của RFQ
   * @returns Danh sách các luồng Q&A
   */
  @Get(':rfqId/qa-threads')
  @ApiOperation({
    summary: 'Lấy tất cả chủ đề Q&A cho RFQ',
    description:
      'Trả về danh sách tất cả chủ đề Q&A cho một yêu cầu báo giá cụ thể',
  })
  async getQaThreadsByRfq(@Param('rfqId') rfqId: string) {
    return this.rfqService.getQaThreadsByRfq(rfqId);
  }

  /**
   * Lấy thông tin chi tiết của một luồng Q&A theo ID
   * @param id ID của luồng Q&A
   * @returns Chi tiết luồng Q&A
   */
  @Get('qa-threads/:id')
  @ApiOperation({
    summary: 'Lấy chi tiết chủ đề Q&A',
    description: 'Trả về thông tin chi tiết của một chủ đề Q&A cụ thể',
  })
  async getQaThread(@Param('id') id: string) {
    return this.rfqService.getQaThread(id);
  }

  /**
   * Trả lời một câu hỏi trong luồng Q&A
   * @param id ID của luồng Q&A
   * @param body Nội dung câu trả lời
   * @param req Thông tin người trả lời
   * @returns Luồng Q&A sau khi có câu trả lời
   */
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

  /**
   * Lấy các luồng Q&A của một nhà cung cấp cụ thể cho RFQ
   * @param rfqId ID của RFQ
   * @param supplierId ID của nhà cung cấp
   * @returns Danh sách luồng Q&A
   */
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

  /**
   * Lấy danh sách các nhà cung cấp tham gia vào một RFQ
   * @param rfqId ID của RFQ
   * @returns Danh sách các nhà cung cấp
   */
  @Get(':rfqId/suppliers')
  @ApiOperation({ summary: 'Lấy danh sách nhà cung cấp của RFQ' })
  async getSuppliersByRfq(@Param('rfqId') rfqId: string) {
    return this.rfqService.findOne(rfqId).then((rfq) => rfq.suppliers);
  }

  /**
   * Mời thêm nhà cung cấp tham gia RFQ
   * @param rfqId ID của RFQ
   * @param body Danh sách ID nhà cung cấp
   * @returns Kết quả mời
   */
  @Post(':rfqId/suppliers/invite')
  @ApiOperation({ summary: 'Mời nhà cung cấp tham gia RFQ' })
  async inviteSuppliers(@Param('rfqId') rfqId: string, @Body() body: any) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    return this.rfqService.inviteSuppliers(rfqId, body.supplierIds);
  }

  /**
   * Loại bỏ nhà cung cấp khỏi RFQ
   * @param rfqId ID của RFQ
   * @param supplierId ID của nhà cung cấp
   * @returns Kết quả loại bỏ
   */
  @Delete(':rfqId/suppliers/:supplierId')
  @ApiOperation({ summary: 'Loại bỏ nhà cung cấp khỏi RFQ' })
  async removeSupplier(
    @Param('rfqId') rfqId: string,
    @Param('supplierId') supplierId: string,
  ) {
    return this.rfqService.removeSupplier(rfqId, supplierId);
  }

  // ============ AI Integration Endpoints ============

  /**
   * Yêu cầu AI gợi ý các nhà cung cấp phù hợp cho RFQ hiện tại.
   * AI sẽ quét database để tìm các nhà cung cấp có ngành nghề và uy tín phù hợp nhất.
   * @param id ID của RFQ
   * @returns Danh sách gợi ý từ AI
   */
  @Get(':id/ai-suggest-suppliers')
  @ApiOperation({
    summary: 'AI gợi ý nhà cung cấp cho RFQ',
    description: 'Sử dụng AI để tìm các nhà cung cấp phù hợp nhất từ database',
  })
  async aiSuggestSuppliers(@Param('id') id: string) {
    return this.rfqService.suggestSuppliersWithAi(id);
  }

  // ============ Counter Offer Endpoints ============

  /**
   * Tạo một đề xuất phản hồi (đàm phán giá) cho một báo giá
   * @param quotationId ID của báo giá
   * @param createCounterOfferDto Dữ liệu đề xuất phản hồi
   * @param req Thông tin người tạo đề xuất
   * @returns Đề xuất phản hồi vừa tạo
   */
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

  /**
   * Lấy tất cả các đề xuất phản hồi liên quan đến một bản báo giá
   * @param quotationId ID của báo giá
   * @returns Danh sách các đề xuất phản hồi
   */
  @Get('quotations/:quotationId/counter-offers')
  @ApiOperation({
    summary: 'Lấy tất cả đề xuất phản hồi cho báo giá',
    description:
      'Trả về danh sách tất cả đề xuất phản hồi cho một báo giá cụ thể',
  })
  async getCounterOffersByQuotation(@Param('quotationId') quotationId: string) {
    return this.rfqService.getCounterOffersByQuotation(quotationId);
  }

  /**
   * Lấy thông tin chi tiết của một đề xuất phản hồi theo ID
   * @param id ID của đề xuất phản hồi
   * @returns Chi tiết đề xuất
   */
  @Get('counter-offers/:id')
  @ApiOperation({
    summary: 'Lấy chi tiết đề xuất phản hồi',
    description: 'Trả về thông tin chi tiết của một đề xuất phản hồi cụ thể',
  })
  async getCounterOffer(@Param('id') id: string) {
    return this.rfqService.getCounterOffer(id);
  }

  /**
   * Phản hồi lại một đề xuất phản hồi (Chấp nhận hoặc Từ chối đề xuất đàm phán)
   * @param id ID của đề xuất phản hồi
   * @param body Nội dung phản hồi (accept/reject) và status (ACCEPTED/REJECTED)
   * @returns Đề xuất phản hồi sau khi được xử lý
   */
  @Put('counter-offers/:id/respond')
  @ApiOperation({
    summary: 'Phản hồi đề xuất phản hồi',
    description: 'Phản hồi một đề xuất phản hồi cụ thể',
  })
  async respondCounterOffer(@Param('id') id: string, @Body() body: any) {
    return this.rfqService.respondCounterOffer(
      id,
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      body.response,
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      body.status || 'ACCEPTED',
    );
  }

  // ============ Awarding Endpoints ============

  /**
   * Trao thầu cho nhà cung cấp dựa trên báo giá
   * @param rfqId ID của RFQ
   * @param body Chứa quotationId của nhà cung cấp thắng thầu
   * @param req Thông tin người thực hiện
   * @returns RFQ sau khi trao thầu
   */
  @Put(':rfqId/award')
  @ApiOperation({
    summary: 'Trao thầu cho nhà cung cấp',
    description: 'Chọn nhà cung cấp thắng thầu cho một yêu cầu báo giá cụ thể',
  })
  async awardQuotation(
    @Param('rfqId') rfqId: string,
    @Body() body: any,
    @Request() req: any,
  ) {
    return this.rfqService.awardQuotation(
      rfqId,
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      body.quotationId,
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      req.user.sub,
    );
  }
}
