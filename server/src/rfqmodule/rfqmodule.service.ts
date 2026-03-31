import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { PrStatus } from '@prisma/client';
import { CreateRfqDto } from './dto/create-rfq.dto';
import { CreateQuotationDto } from './dto/create-quotation.dto';
import { CreateCounterOfferDto } from './dto/create-counter-offer.dto';
import { RfqRepository } from './rfq.repository';
import { RfqStatus, QuotationStatus } from '@prisma/client';
import { AiService } from '../ai-service/ai-service.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationModuleService } from 'src/notification-module/notification-module.service';
import { AutomationService } from 'src/common/automation/automation.service';

export class RfqSupplierCreateManyInput {
  rfqId: string;
  supplierId: string;
  isRecommended: boolean;
}

export class RFQItem {
  name: string;
  description: string;
  qty: number;
}

@Injectable()
export class RfqmoduleService {
  constructor(
    private readonly repository: RfqRepository,
    private readonly aiService: AiService,
    private readonly prisma: PrismaService,
    private readonly notificationService: NotificationModuleService,
    @Inject(forwardRef(() => AutomationService))
    private readonly automationService: AutomationService,
  ) {}

  /**
   * Sử dụng AI để tìm kiếm nhà cung cấp và tự động thêm vào RFQ.
   * @param rfqId ID của RFQ
   * @returns Danh sách các RfqSupplier vừa được tạo
   */
  async searchAndAddSuppliers(rfqId: string) {
    const rfq = await this.repository.findOne(rfqId);
    if (!rfq) {
      throw new NotFoundException(`RFQ with ID ${rfqId} not found`);
    }

    // Chuẩn bị dữ liệu mặt hàng
    const items = rfq.items.map((item: any) => ({
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      name: item.name,
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      productDesc: item.description,
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      qty: item.qty,
    }));

    // Gọi AI gợi ý nhà cung cấp
    const suggestedSupplierIds =
      await this.aiService.getCompanySuggestion(items);

    console.log(suggestedSupplierIds);
    if (
      !suggestedSupplierIds ||
      !suggestedSupplierIds.data ||
      suggestedSupplierIds.data.length === 0
    ) {
      return [];
    }

    // Extract supplier IDs from the AI response and ensure they are valid strings
    const rawSupplierData = Array.isArray(suggestedSupplierIds.data)
      ? suggestedSupplierIds.data
      : [suggestedSupplierIds.data];

    const validSupplierIds = rawSupplierData
      .map((item: any) => {
        if (typeof item === 'string') return item;
        if (item && typeof item === 'object')
          return item.id || item.supplierId || item.orgId;
        return null;
      })
      .filter((id): id is string => typeof id === 'string' && id.length > 0);

    if (validSupplierIds.length === 0) {
      return [];
    }

    const supplierData: RfqSupplierCreateManyInput[] = validSupplierIds.map(
      (sId: string) => ({
        rfqId: rfq.id,
        supplierId: sId,
        isRecommended: true,
      }),
    );

    return await this.prisma.rfqSupplier.createMany({
      data: supplierData,
      skipDuplicates: true,
    });
  }

  // ============ AI Integration Methods ============

  /**
   * Sử dụng AI để phân tích và chấm điểm báo giá chi tiết.
   * Kết quả phân tích sẽ được lưu vào database.
   * @param quotationId ID của báo giá cần phân tích
   */
  async analyzeQuotationWithAi(quotationId: string) {
    // 1. Lấy dữ liệu đầy đủ
    const quotation = await this.repository.findQuotationById(quotationId);
    if (!quotation) throw new NotFoundException('Báo giá không tồn tại');

    const rfq = await this.repository.findOne(quotation.rfqId);

    if (!rfq) {
      return;
    }
    // 2. Chuẩn bị dữ liệu cho AI
    const rfqData = {
      items: rfq.items.map((i: any) => ({
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        name: i.description,
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        qty: i.qty,
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        targetPrice: i.targetPrice,
      })),
      totalEstimate: rfq.pr?.totalEstimate || 'Không rõ',
      deadline: rfq.deadline,
    };

    const quotationData = {
      totalPrice: quotation.totalPrice,
      leadTimeDays: quotation.leadTimeDays,
      paymentTerms: quotation.paymentTerms,
    };

    // Tìm thông tin nhà cung cấp từ danh sách mời thầu
    const supplierInfo = rfq.suppliers.find(
      (s: any) => s.supplierId === quotation.supplierId,
    );

    const supplierData = {
      name: supplierInfo?.supplier?.name || 'Nhà cung cấp',
      trustScore: supplierInfo?.supplier?.trustScore || 50,
      tier: 'STANDARD',
    };

    // 3. Gọi AI Service
    const aiResult = await this.aiService.analyzeQuotation(
      rfqData,
      quotationData,
      supplierData,
    );

    // 4. Lưu kết quả vào DB (Update Quotation)
    if (aiResult.success !== false) {
      await this.prisma.rfqQuotation.update({
        where: { id: quotationId },
        data: {
          aiScore: aiResult.score,
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          aiBreakdown: aiResult as any, // Lưu full JSON kết quả
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          aiFlags: aiResult.cons, // Lưu rủi ro vào flags
        },
      });
    }

    return aiResult;
  }

  /**
   * Sử dụng AI để phân tích nội dung RFQ và gợi ý các nhà cung cấp phù hợp từ database.
   * AI sẽ dựa vào mô tả mặt hàng, ngành nghề kinh doanh và điểm tin cậy (trustScore) của nhà cung cấp.
   * @param rfqId ID của RFQ cần gợi ý nhà cung cấp
   * @returns Danh sách gợi ý từ AI kèm theo lý do
   */
  // async suggestSuppliersWithAi(rfqId: string) {
  //   const rfq = await this.repository.findOne(rfqId);
  //   if (!rfq) {
  //     throw new NotFoundException(`RFQ with ID ${rfqId} not found`);
  //   }

  //   // Chuẩn bị dữ liệu mặt hàng để AI phân tích
  //   const items = rfq.items.map((item) => ({
  //     productDesc: item.description,
  //     qty: item.qty,
  //   }));

  //   // Gọi AI Service để tìm kiếm nhà cung cấp phù hợp trong DB
  //   const aiSuggestion = await this.aiService.getCompanySuggestion(items);

  //   return aiSuggestion;
  // }

  // ============ RFQ Request Methods ============

  async create(createRfqDto: CreateRfqDto, user: any) {
    // Validation tạo khi tìm thấy PR và khi đã được duyệt
    const purchase_requestion = await this.prisma.purchaseRequisition.findFirst(
      {
        where: {
          id: createRfqDto.prId,
        },
      },
    );

    if (!purchase_requestion) {
      throw new NotFoundException('Không tìm thấy yêu cầu mua hàng !');
    }

    if (purchase_requestion.status !== PrStatus.APPROVED) {
      throw new NotFoundException('Yêu cầu mua hàng chưa được duyệt !');
    }

    const rfqNumber = `RFQ-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const rfq = await this.repository.create(
      createRfqDto,
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      user.sub,
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      user.orgId,
      rfqNumber,
    );

    // Gửi email cho các nhà cung cấp
    if (createRfqDto.supplierIds?.length > 0) {
      await this.sendInvitationEmails(rfq, createRfqDto.supplierIds);
    }

    return rfq;
  }

  private async sendInvitationEmails(rfq: any, supplierIds: string[]) {
    // Tìm các user có role SUPPLIER thuộc các org này
    const suppliers = await this.prisma.user.findMany({
      where: {
        orgId: { in: supplierIds },
        role: 'SUPPLIER',
      },
    });

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const itemsSummary = rfq.items
      .map((i: any) => `${i.description} (${i.qty} ${i.unit})`)
      .join(', ');

    for (const supplier of suppliers) {
      await this.notificationService.sendNotification({
        recipientId: supplier.id,
        eventType: 'RFQ_INVITATION', // Phải khớp với eventType trong db
        referenceType: 'RFQ',
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        referenceId: rfq.id,
        data: {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          rfqNumber: rfq.rfqNumber,
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          rfqTitle: rfq.title,
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          deadline: rfq.deadline.toLocaleDateString(),
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          itemsSummary: itemsSummary,
        },
      });
    }
  }

  async findAll(user: any) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    return this.repository.findAll(user.orgId);
  }

  async findOne(id: string) {
    const rfq = await this.repository.findOne(id);
    if (!rfq) {
      throw new NotFoundException(`RFQ with ID ${id} not found`);
    }
    return rfq;
  }

  async updateStatus(id: string, status: RfqStatus) {
    const rfq = await this.repository.findOne(id);
    if (!rfq) {
      throw new NotFoundException(`RFQ with ID ${id} not found`);
    }
    return this.repository.updateStatus(id, status);
  }

  async delete(id: string) {
    const rfq = await this.repository.findOne(id);
    if (!rfq) {
      throw new NotFoundException(`RFQ with ID ${id} not found`);
    }
    return this.repository.delete(id);
  }

  // ============ Quotation Methods ============

  async createQuotation(rfqId: string, createQuotationDto: CreateQuotationDto) {
    const rfq = await this.repository.findOne(rfqId);
    if (!rfq) {
      throw new NotFoundException(`RFQ with ID ${rfqId} not found`);
    }

    // Verify supplier is invited for this RFQ
    const supplierInRfq = rfq.suppliers.some(
      (s: any) => s.supplierId === createQuotationDto.supplierId,
    );
    if (!supplierInRfq) {
      throw new BadRequestException('Supplier is not invited for this RFQ');
    }

    const quotationNumber = `QUO-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
    return this.repository.createQuotation(
      rfqId,
      createQuotationDto.supplierId,
      createQuotationDto,
      quotationNumber,
    );
  }

  async getQuotationsByRfq(rfqId: string) {
    const rfq = await this.repository.findOne(rfqId);
    if (!rfq) {
      throw new NotFoundException(`RFQ with ID ${rfqId} not found`);
    }
    return this.repository.findQuotationsByRfqId(rfqId);
  }

  async getQuotation(id: string) {
    const quotation = await this.repository.findQuotationById(id);
    if (!quotation) {
      throw new NotFoundException(`Quotation with ID ${id} not found`);
    }
    return quotation;
  }

  /**
   * Xác nhận nộp báo giá, chuyển trạng thái sang "Submitted" và ghi nhận thời gian nộp báo giá
   * @param id ID của báo giá cần nộp | RFQ ID để nộp báo giá mới
   * @returns Báo giá đã được nộp với trạng thái cập nhật
   */
  async submitQuotation(id: string) {
    const quotation = await this.repository.findQuotationById(id);
    if (!quotation) {
      throw new NotFoundException(`Quotation with ID ${id} not found`);
    }
    return this.repository.submitQuotation(id);
  }

  /**
   * Xác nhận đã xem xét báo giá, ghi nhận người xem xét và thời gian xem xét
   * @param id ID của báo giá cần xem xét
   * @param reviewedById ID của người xem xét báo giá
   * @returns Báo giá đã được cập nhật thông tin xem xét
   */
  async reviewQuotation(id: string, reviewedById: string) {
    const quotation = await this.repository.findQuotationById(id);
    if (!quotation) {
      throw new NotFoundException(`Quotation with ID ${id} not found`);
    }
    return this.repository.reviewQuotation(id, reviewedById, new Date());
  }

  /**
   * Chấp nhận báo giá, cập nhật trạng thái sang "Accepted" và ghi nhận người xem xét cùng thời gian xem xét
   * @param id ID của báo giá cần chấp nhận
   * @param reviewedById ID của người chấp nhận báo giá | Role: Buyer hoặc người có quyền duyệt báo giá
   * @returns Báo giá đã được cập nhật trạng thái "Accepted"
   */
  async acceptQuotation(id: string, reviewedById: string) {
    const quotation = await this.repository.findQuotationById(id);
    if (!quotation) {
      throw new NotFoundException(`Quotation with ID ${id} not found`);
    }
    await this.repository.reviewQuotation(id, reviewedById, new Date());
    return this.repository.updateQuotationStatus(id, QuotationStatus.ACCEPTED);
  }

  /**
   * Từ chối báo giá, cập nhật trạng thái sang "Rejected" và ghi nhận người xem xét cùng thời gian xem xét
   * @param id ID của báo giá cần từ chối
   * @param reviewedByI ID của người từ chối báo giá | Role: Buyer hoặc người có quyền duyệt báo giá
   * @returns Báo giá đã được cập nhật trạng thái "Rejected"
   */
  async rejectQuotation(id: string, reviewedById: string) {
    const quotation = await this.repository.findQuotationById(id);
    if (!quotation) {
      throw new NotFoundException(`Quotation with ID ${id} not found`);
    }
    await this.repository.reviewQuotation(id, reviewedById, new Date());
    return this.repository.updateQuotationStatus(id, QuotationStatus.REJECTED);
  }

  async updateQuotationAiScore(id: string, aiScore: number) {
    const quotation = await this.repository.findQuotationById(id);
    if (!quotation) {
      throw new NotFoundException(`Quotation with ID ${id} not found`);
    }
    return this.repository.updateQuotationAiScore(id, aiScore);
  }

  // ============ QA Thread Methods ============

  /**
   * Tạo luồng hỏi đáp (Q&A Thread) cho một RFQ cụ thể giữa người mua và nhà cung cấp.
   * Luồng hỏi đáp này cho phép nhà cung cấp đặt câu hỏi về RFQ và người mua trả lời, hoặc ngược lại.
   * Mỗi luồng hỏi đáp sẽ liên kết với một nhà cung cấp cụ thể trong RFQ đó, đảm bảo tính riêng tư nếu cần thiết.
   * @param rfqId ID của RFQ mà luồng hỏi đáp này liên quan đến
   * @param supplierId ID của nhà cung cấp tham gia vào luồng hỏi đáp này
   * @param question Nội dung câu hỏi được đặt ra bởi nhà cung cấp hoặc người mua
   * @param askedById ID của người đặt câu hỏi (có thể là nhà cung cấp hoặc người mua)
   * @param isPublic Xác định xem câu hỏi này có được hiển thị công khai cho tất cả nhà cung cấp trong RFQ hay chỉ riêng nhà cung cấp được hỏi và người mua mới thấy (mặc định là false - chỉ riêng tư)
   * @returns Thông tin về luồng hỏi đáp mới được tạo ra, bao gồm ID, nội dung câu hỏi, người đặt câu hỏi, thời gian tạo và trạng thái trả lời (nếu đã có câu trả lời)
   * @throws NotFoundException nếu RFQ không tồn tại hoặc nhà cung cấp không được mời tham gia RFQ đó
   * @throws BadRequestException nếu nhà cung cấp không được mời tham gia RFQ đó
   */
  async createQaThread(
    rfqId: string,
    supplierId: string,
    question: string,
    askedById: string,
    isPublic = false,
  ) {
    const rfq = await this.repository.findOne(rfqId);
    if (!rfq) {
      throw new NotFoundException(`RFQ with ID ${rfqId} not found`);
    }

    const supplierInRfq = rfq.suppliers.some(
      (s: any) => s.supplierId === supplierId,
    );
    if (!supplierInRfq) {
      throw new BadRequestException('Supplier is not invited for this RFQ');
    }

    return this.repository.createQandAThread(
      rfqId,
      supplierId,
      question,
      askedById,
      isPublic,
    );
  }

  /**
   * Lấy tất cả luồng hỏi đáp (Q&A Threads) liên quan đến một RFQ cụ thể, bao gồm cả câu hỏi và câu trả lời.
   * Kết quả trả về sẽ bao gồm thông tin về từng luồng hỏi đáp, như ID, nội dung câu hỏi, người đặt câu hỏi, thời gian tạo, trạng thái trả lời và nếu đã có câu trả lời thì cũng bao gồm nội dung câu trả lời cùng người trả lời và thời gian trả lời.
   * Chỉ những luồng hỏi đáp liên quan đến RFQ đó mới được trả về, đảm bảo tính riêng tư nếu có những luồng hỏi đáp chỉ dành riêng cho một nhà cung cấp cụ thể.
   * @param rfqId ID của RFQ mà bạn muốn lấy các luồng hỏi đáp liên quan đến nó
   * @returns Danh sách các luồng hỏi đáp liên quan đến RFQ, bao gồm cả câu hỏi và câu trả lời (nếu có)
   */
  async getQaThreadsByRfq(rfqId: string) {
    const rfq = await this.repository.findOne(rfqId);
    if (!rfq) {
      throw new NotFoundException(`RFQ with ID ${rfqId} not found`);
    }
    return this.repository.findQandAThreadByRfqId(rfqId);
  }

  async getQaThread(id: string) {
    const thread = await this.repository.findQandAThreadById(id);
    if (!thread) {
      throw new NotFoundException(`QA Thread with ID ${id} not found`);
    }
    return thread;
  }

  /**
   * Trả lời một câu hỏi trong luồng hỏi đáp (Q&A Thread) cụ thể, cập nhật trạng thái trả lời và ghi nhận người trả lời cùng thời gian trả lời.
   * Chỉ người mua hoặc nhà cung cấp liên quan đến câu hỏi đó mới có quyền trả lời.
   * @param id ID của luồng hỏi đáp mà bạn muốn trả lời câu hỏi trong đó
   * @param answer Nội dung câu trả lời mà bạn muốn cung cấp cho câu hỏi đó
   * @param answeredById ID của người trả lời câu hỏi (có thể là nhà cung cấp hoặc người mua)
   * @returns Thông tin về luồng hỏi đáp sau khi đã được cập nhật với câu trả lời mới, bao gồm nội dung câu hỏi, người đặt câu hỏi, thời gian tạo, nội dung câu trả lời, người trả lời và thời gian trả lời
   * @throws NotFoundException nếu luồng hỏi đáp không tồn tại
   * @throws BadRequestException nếu người trả lời không có quyền trả lời câu hỏi đó (không phải là nhà cung cấp hoặc người mua liên quan)
   */
  async answerQaThread(id: string, answer: string, answeredById: string) {
    const thread = await this.repository.findQandAThreadById(id);
    if (!thread) {
      throw new NotFoundException(`QA Thread with ID ${id} not found`);
    }
    return this.repository.answerQandAThread(id, answer, answeredById);
  }

  async getQaThreadsBySupplier(supplierId: string, rfqId: string) {
    const rfq = await this.repository.findOne(rfqId);
    if (!rfq) {
      throw new NotFoundException(`RFQ with ID ${rfqId} not found`);
    }
    return this.repository.findQandAThreadBySupplierAndRfq(supplierId, rfqId);
  }

  // ============ RFQ Supplier Management Methods ============

  /**
   * Mời thêm nhà cung cấp tham gia vào RFQ.
   * @param rfqId ID của RFQ
   * @param supplierIds Danh sách ID của các nhà cung cấp được mời
   * @returns Kết quả mời nhà cung cấp
   */
  async inviteSuppliers(rfqId: string, supplierIds: string[]) {
    const rfq = await this.repository.findOne(rfqId);
    if (!rfq) {
      throw new NotFoundException(`RFQ with ID ${rfqId} not found`);
    }
    return this.repository.inviteSuppliers(rfqId, supplierIds);
  }

  /**
   * Loại bỏ một nhà cung cấp khỏi RFQ.
   * @param rfqId ID của RFQ
   * @param supplierId ID của nhà cung cấp cần loại bỏ
   * @returns Kết quả loại bỏ
   */
  async removeSupplier(rfqId: string, supplierId: string) {
    const rfq = await this.repository.findOne(rfqId);
    if (!rfq) {
      throw new NotFoundException(`RFQ with ID ${rfqId} not found`);
    }
    return this.repository.removeSupplier(rfqId, supplierId);
  }

  // ============ Counter Offer Methods ============

  /**
   *  Tạo một counter offer mới dựa trên một báo giá đã tồn tại, cho phép nhà cung cấp hoặc người mua đề xuất một mức giá hoặc điều khoản khác so với báo giá ban đầu.
   *  Counter offer này sẽ liên kết với báo giá gốc và có thể được chấp nhận hoặc từ chối bởi bên còn lại.
   *  Việc tạo counter offer sẽ không thay đổi trạng thái của báo giá gốc cho đến khi counter offer được chấp nhận, lúc đó báo giá gốc sẽ được cập nhật trạng thái tương ứng (ví dụ: "Accepted" nếu counter offer được chấp nhận).
   * @param quotationId ID của báo giá mà bạn muốn tạo counter offer dựa trên đó
   * @param offeredById ID của người tạo counter offer (có thể là nhà cung cấp hoặc người mua)
   * @param data Thông tin chi tiết về counter offer, bao gồm mức giá mới, điều khoản mới hoặc bất kỳ thông tin nào khác cần thiết để mô tả counter offer đó
   * @returns Thông tin về counter offer mới được tạo ra, bao gồm ID, nội dung counter offer, người tạo, thời gian tạo và trạng thái hiện tại của counter offer
   */
  async createCounterOffer(
    quotationId: string,
    offeredById: string,
    data: CreateCounterOfferDto,
  ) {
    const quotation = await this.repository.findQuotationById(quotationId);
    if (!quotation) {
      throw new NotFoundException(`Quotation with ID ${quotationId} not found`);
    }
    return this.repository.createCounterOffer(quotationId, offeredById, data);
  }

  async getCounterOffersByQuotation(quotationId: string) {
    const quotation = await this.repository.findQuotationById(quotationId);
    if (!quotation) {
      throw new NotFoundException(`Quotation with ID ${quotationId} not found`);
    }
    return this.repository.findCounterOffersByQuotationId(quotationId);
  }

  async getCounterOffer(id: string) {
    const offer = await this.repository.findCounterOfferById(id);
    if (!offer) {
      throw new NotFoundException(`Counter Offer with ID ${id} not found`);
    }
    return offer;
  }

  /**
   * Xác nhận phản hồi đối với một counter offer cụ thể, cho phép bên còn lại chấp nhận hoặc từ chối counter offer đó.
   * Nếu counter offer được chấp nhận, trạng thái của counter offer sẽ được cập nhật thành "Accepted" và báo giá gốc sẽ được cập nhật tương ứng (ví dụ: cập nhật mức giá mới nếu counter offer đề xuất một mức giá khác).
   * Nếu counter offer bị từ chối, trạng thái của counter offer sẽ được cập nhật thành "Rejected" và báo giá gốc sẽ giữ nguyên trạng thái ban đầu.
   * @param id ID counter offer
   * @param response Thông tin trả về
   * @param status Trạng thái phản hồi (ACCEPTED hoặc REJECTED)
   * @returns Thông tin counter offer sau khi phản hồi
   */
  async respondCounterOffer(
    id: string,
    response: string,
    status: 'ACCEPTED' | 'REJECTED',
  ) {
    const offer = await this.repository.findCounterOfferById(id);
    if (!offer) {
      throw new NotFoundException(`Counter Offer with ID ${id} not found`);
    }
    return this.repository.respondCounterOffer(id, response, status);
  }

  // ============ Awarding Methods ============

  /**
   * Trao thầu cho một nhà cung cấp dựa trên báo giá của họ.
   * Quá trình này sẽ:
   * 1. Cập nhật RFQ sang trạng thái AWARDED.
   * 2. Gán nhà cung cấp thắng thầu cho RFQ.
   * 3. Chấp nhận báo giá được chọn.
   * 4. Từ chối tất cả các báo giá còn lại của RFQ này.
   * @param rfqId ID của RFQ
   * @param quotationId ID của báo giá thắng thầu
   * @param awardedById ID của người thực hiện trao thầu
   * @returns Thông tin RFQ sau khi trao thầu
   */
  async awardQuotation(
    rfqId: string,
    quotationId: string,
    awardedById: string,
  ) {
    const rfq = await this.repository.findOne(rfqId);
    if (!rfq) {
      throw new NotFoundException(`RFQ with ID ${rfqId} not found`);
    }

    const quotation = await this.repository.findQuotationById(quotationId);
    if (!quotation) {
      throw new NotFoundException(`Quotation with ID ${quotationId} not found`);
    }

    if (quotation.rfqId !== rfqId) {
      throw new BadRequestException('Quotation does not belong to this RFQ');
    }

    const result = await this.repository.awardQuotation(
      rfqId,
      quotationId,
      awardedById,
    );

    // Kích hoạt tự động hóa tạo PO
    void this.automationService.handleRfqAwarded(rfqId, quotationId);

    return result;
  }
}
