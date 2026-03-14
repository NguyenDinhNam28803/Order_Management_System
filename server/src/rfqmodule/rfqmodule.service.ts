import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { CreateRfqDto } from './dto/create-rfq.dto';
import { CreateQuotationDto } from './dto/create-quotation.dto';
import { CreateCounterOfferDto } from './dto/create-counter-offer.dto';
import { RfqRepository } from './rfq.repository';
import { RfqStatus, QuotationStatus } from '@prisma/client';

@Injectable()
export class RfqmoduleService {
  constructor(private readonly repository: RfqRepository) {}

  // ============ RFQ Request Methods ============

  async create(createRfqDto: CreateRfqDto, user: any) {
    const rfqNumber = `RFQ-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
    return this.repository.create(
      createRfqDto,
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      user.sub,
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      user.orgId,
      rfqNumber,
    );
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

  async submitQuotation(id: string) {
    const quotation = await this.repository.findQuotationById(id);
    if (!quotation) {
      throw new NotFoundException(`Quotation with ID ${id} not found`);
    }
    return this.repository.submitQuotation(id);
  }

  async reviewQuotation(id: string, reviewedById: string) {
    const quotation = await this.repository.findQuotationById(id);
    if (!quotation) {
      throw new NotFoundException(`Quotation with ID ${id} not found`);
    }
    return this.repository.reviewQuotation(id, reviewedById, new Date());
  }

  async acceptQuotation(id: string, reviewedById: string) {
    const quotation = await this.repository.findQuotationById(id);
    if (!quotation) {
      throw new NotFoundException(`Quotation with ID ${id} not found`);
    }
    await this.repository.reviewQuotation(id, reviewedById, new Date());
    return this.repository.updateQuotationStatus(id, QuotationStatus.ACCEPTED);
  }

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

  // ============ Counter Offer Methods ============

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

  async respondCounterOffer(id: string, response: string) {
    const offer = await this.repository.findCounterOfferById(id);
    if (!offer) {
      throw new NotFoundException(`Counter Offer with ID ${id} not found`);
    }
    return this.repository.respondCounterOffer(id, response);
  }
}
