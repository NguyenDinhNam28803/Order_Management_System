import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateRfqDto } from './dto/create-rfq.dto';
import {
  CreateQuotationDto,
  QuotationItemDto,
} from './dto/create-quotation.dto';
// import { CreateQaThreadDto } from './dto/create-qa-thread.dto';
import { CreateCounterOfferDto } from './dto/create-counter-offer.dto';
import { RfqStatus, QuotationStatus } from '@prisma/client';
import { PrStatus } from '@prisma/client';

@Injectable()
export class RfqRepository {
  constructor(private readonly prisma: PrismaService) {}

  // Các phương thức liên quan đến RFQ Request
  async create(
    data: CreateRfqDto,
    createdById: string,
    orgId: string,
    rfqNumber: string,
  ) {
    const { prId, supplierIds, ...rfqData } = data;

    // Validate prId is provided
    if (!prId) {
      throw new Error('prId is required when creating RFQ');
    }

    // Lấy items từ PR để copy sang RFQ
    const prItems = await this.prisma.prItem.findMany({
      where: { prId },
    });

    return this.prisma.$transaction(async (tx) => {
      const rfq = await tx.rfqRequest.create({
        data: {
          ...rfqData,
          rfqNumber,
          prId,
          createdById,
          orgId,
          status: RfqStatus.SENT,
          items: {
            create: prItems.map((item) => ({
              prItemId: item.id,
              lineNumber: item.lineNumber,
              description: item.productDesc,
              qty: item.qty,
              unit: item.unit,
              categoryId: item.categoryId,
              sku: item.sku,
            })),
          },
          suppliers: {
            create: supplierIds.map((supplierId) => ({
              supplierId,
            })),
          },
        },
        include: { items: true, suppliers: true },
      });

      // Cập nhật trạng thái PR sang IN_SOURCING
      await tx.purchaseRequisition.update({
        where: { id: prId },
        data: { status: PrStatus.IN_SOURCING },
      });

      return rfq;
    });
  }

  async findAll(orgId: string) {
    return this.prisma.rfqRequest.findMany({
      where: { orgId },
      include: { pr: true, createdBy: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    return this.prisma.rfqRequest.findUnique({
      where: { id },
      include: {
        items: true,
        suppliers: { include: { supplier: true } },
        pr: true,
        createdBy: true,
        quotations: true,
      },
    });
  }

  async updateStatus(id: string, status: RfqStatus) {
    return this.prisma.rfqRequest.update({
      where: { id },
      data: { status },
    });
  }

  async delete(id: string) {
    return this.prisma.rfqRequest.delete({
      where: { id },
    });
  }

  async findByPrId(prId: string) {
    return this.prisma.rfqRequest.findMany({
      where: { prId },
      include: { items: true, suppliers: true },
    });
  }

  async findBySupplierId(supplierId: string) {
    return this.prisma.rfqRequest.findMany({
      where: { suppliers: { some: { supplierId } } },
      include: { items: true, suppliers: true },
    });
  }

  async findByStatus(status: RfqStatus) {
    return this.prisma.rfqRequest.findMany({
      where: { status },
      include: { items: true, suppliers: true },
    });
  }

  async findByOrgIdAndStatus(orgId: string, status: RfqStatus) {
    return this.prisma.rfqRequest.findMany({
      where: { orgId, status },
      include: { items: true, suppliers: true },
    });
  }

  // Các phương thức liên quan đến RFQ Quotation

  async findAllQuotations() {
    return this.prisma.rfqQuotation.findMany({
      include: { items: true, rfq: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createQuotation(
    rfqId: string,
    supplierId: string,
    data: CreateQuotationDto,
    quotationNumber: string,
  ) {
    return this.prisma.rfqQuotation.create({
      data: {
        quotationNumber,
        rfqId,
        supplierId,
        totalPrice: data.totalPrice,
        currency: data.currency || 'VND',
        leadTimeDays: data.leadTimeDays,
        paymentTerms: data.paymentTerms,
        deliveryTerms: data.deliveryTerms,
        validityDays: data.validityDays || 30,
        notes: data.notes,
        items: {
          create: data.items.map((item: QuotationItemDto) => ({
            rfqItemId: item.rfqItemId,
            unitPrice: item.unitPrice,
            qtyOffered: item.qtyOffered,
            discountPct: item.discountPct || 0,
            leadTimeDays: item.leadTimeDays,
            notes: item.notes,
          })),
        },
      },
      include: { items: true, rfq: true },
    });
  }

  async findQuotationsByRfqId(rfqId: string) {
    return this.prisma.rfqQuotation.findMany({
      where: { rfqId },
      include: {
        items: { include: { rfqItem: true } },
        rfq: true,
        counterOffers: true,
      },
    });
  }

  async findQuotationById(id: string) {
    return this.prisma.rfqQuotation.findUnique({
      where: { id },
      include: {
        items: { include: { rfqItem: true } },
        rfq: { include: { items: true } },
        counterOffers: true,
      },
    });
  }

  async updateQuotationStatus(id: string, status: QuotationStatus) {
    return this.prisma.rfqQuotation.update({
      where: { id },
      data: { status },
      include: { items: true },
    });
  }

  async submitQuotation(id: string) {
    return this.prisma.rfqQuotation.update({
      where: { id },
      data: { status: 'SUBMITTED', submittedAt: new Date() },
      include: { items: true, rfq: true },
    });
  }

  async reviewQuotation(id: string, reviewedById: string, reviewedAt: Date) {
    return this.prisma.rfqQuotation.update({
      where: { id },
      data: { reviewedAt, reviewedBy: { connect: { id: reviewedById } } },
      include: { items: true, rfq: true },
    });
  }

  async updateQuotationAiScore(id: string, aiScore: number) {
    return this.prisma.rfqQuotation.update({
      where: { id },
      data: { aiScore },
      include: { items: true },
    });
  }

  async deleteQuotation(id: string) {
    return this.prisma.rfqQuotation.delete({
      where: { id },
    });
  }

  async findQuotationsBySupplierId(supplierId: string) {
    return this.prisma.rfqQuotation.findMany({
      where: { supplierId },
      include: {
        items: true,
        rfq: true,
      },
    });
  }

  async findQuotationsByStatus(status: QuotationStatus) {
    return this.prisma.rfqQuotation.findMany({
      where: { status },
      include: { items: true, rfq: true },
    });
  }

  // Các phương thức liên quan đến RFQ Item

  async findItemsByRfqId(rfqId: string) {
    return this.prisma.rfqItem.findMany({
      where: { rfqId },
    });
  }

  async createItem(
    rfqId: string,
    description: string,
    qty: number,
    unit: string,
    lineNumber: number,
    categoryId?: string,
    sku?: string,
  ) {
    return this.prisma.rfqItem.create({
      data: {
        rfqId,
        description,
        qty,
        unit,
        categoryId,
        sku,
        lineNumber,
      },
    });
  }

  async findItemsByQuotationId(quotationId: string) {
    return this.prisma.rfqItem.findMany({
      where: { quotationItems: { some: { quotationId } } },
    });
  }

  async findItemsByProductId(productId: string) {
    return this.prisma.rfqItem.findMany({
      where: { quotationItems: { some: { rfqItemId: productId } } },
    });
  }

  // Các phương thức liên quan đến RFQ Supplier Management
  async findSuppliersByRfqId(rfqId: string) {
    return this.prisma.rfqSupplier.findMany({
      where: { rfqId },
      include: { supplier: true },
    });
  }

  async inviteSuppliers(rfqId: string, supplierIds: string[]) {
    const rfqSuppliers = supplierIds.map((supplierId) => ({
      rfqId,
      supplierId,
    }));

    return this.prisma.rfqSupplier.createMany({
      data: rfqSuppliers,
      skipDuplicates: true,
    });
  }

  async removeSupplier(rfqId: string, supplierId: string) {
    return this.prisma.rfqSupplier.delete({
      where: {
        rfqId_supplierId: {
          rfqId,
          supplierId,
        },
      },
    });
  }

  async deleteRfqSupplier(id: string) {
    return this.prisma.rfqSupplier.delete({
      where: { id },
    });
  }

  // Các phương thức liên quan đến RFQ Q and A thread

  async findQandAThreadByRfqId(rfqId: string) {
    return this.prisma.rfqQaThread.findMany({
      where: { rfqId },
      include: {
        askedBy: true,
        answeredBy: true,
        rfq: true,
      },
    });
  }

  async findQandAThreadById(id: string) {
    return this.prisma.rfqQaThread.findUnique({
      where: { id },
      include: {
        askedBy: true,
        answeredBy: true,
        rfq: true,
      },
    });
  }

  async createQandAThread(
    rfqId: string,
    supplierId: string,
    question: string,
    askedById: string,
    isPublic = false,
  ) {
    return this.prisma.rfqQaThread.create({
      data: {
        rfqId,
        supplierId,
        question,
        askedById,
        isPublic,
      },
      include: {
        askedBy: true,
        rfq: true,
      },
    });
  }

  async answerQandAThread(id: string, answer: string, answeredById: string) {
    return this.prisma.rfqQaThread.update({
      where: { id },
      data: {
        answer,
        answeredBy: { connect: { id: answeredById } },
        answeredAt: new Date(),
      },
      include: {
        askedBy: true,
        answeredBy: true,
      },
    });
  }

  async findQandAThreadBySupplierAndRfq(supplierId: string, rfqId: string) {
    return this.prisma.rfqQaThread.findMany({
      where: {
        rfqId,
        supplierId,
      },
      include: {
        askedBy: true,
        answeredBy: true,
      },
    });
  }

  // Các phương thức liên quan đến RFQ Counter Offer

  async createCounterOffer(
    quotationId: string,
    offeredById: string,
    data: CreateCounterOfferDto,
  ) {
    return this.prisma.rfqCounterOffer.create({
      data: {
        quotationId,
        offeredById,
        offerType: data.offerType,
        proposedPrice: data.proposedPrice,
        proposedTerms: data.proposedTerms,
        aiSuggestion: data.aiSuggestion,
      },
      include: {
        offeredBy: true,
        quotation: true,
      },
    });
  }

  async findCounterOffersByQuotationId(quotationId: string) {
    return this.prisma.rfqCounterOffer.findMany({
      where: { quotationId },
      include: {
        offeredBy: true,
        quotation: true,
      },
    });
  }

  async findCounterOfferById(id: string) {
    return this.prisma.rfqCounterOffer.findUnique({
      where: { id },
      include: {
        offeredBy: true,
        quotation: {
          include: { items: true },
        },
      },
    });
  }

  async respondCounterOffer(
    id: string,
    response: string,
    status: 'ACCEPTED' | 'REJECTED',
  ) {
    return this.prisma.$transaction(async (tx) => {
      const offer = await tx.rfqCounterOffer.update({
        where: { id },
        data: {
          response,
          respondedAt: new Date(),
        },
        include: { quotation: true },
      });

      // Nếu chấp nhận counter offer, cập nhật báo giá gốc
      if (status === 'ACCEPTED' && offer.proposedPrice) {
        await tx.rfqQuotation.update({
          where: { id: offer.quotationId },
          data: {
            totalPrice: offer.proposedPrice,
            notes: offer.proposedTerms
              ? `${offer.quotation.notes || ''}\n[Negotiated]: ${offer.proposedTerms}`
              : offer.quotation.notes,
          },
        });
      }

      return offer;
    });
  }

  // Các phương thức liên quan đến Awarding (Trao thầu)

  async awardQuotation(
    rfqId: string,
    quotationId: string,
    awardedById: string,
  ) {
    return this.prisma.$transaction(async (tx) => {
      // 1. Cập nhật RFQ sang trạng thái AWARDED và gán nhà cung cấp thắng thầu
      const quotation = await tx.rfqQuotation.findUnique({
        where: { id: quotationId },
        select: { supplierId: true },
      });

      if (!quotation) throw new Error('Quotation not found');

      const rfq = await tx.rfqRequest.update({
        where: { id: rfqId },
        data: {
          status: RfqStatus.AWARDED,
          awardedSupplierId: quotation.supplierId,
          awardedAt: new Date(),
        },
        include: {
          items: true,
        },
      });

      // 2. Cập nhật báo giá được chọn sang ACCEPTED
      await tx.rfqQuotation.update({
        where: { id: quotationId },
        data: {
          status: QuotationStatus.ACCEPTED,
          reviewedById: awardedById,
          reviewedAt: new Date(),
        },
      });

      // 3. Cập nhật các báo giá khác của RFQ này sang REJECTED
      await tx.rfqQuotation.updateMany({
        where: {
          rfqId,
          id: { not: quotationId },
          status: { not: QuotationStatus.REJECTED },
        },
        data: {
          status: QuotationStatus.REJECTED,
          reviewedById: awardedById,
          reviewedAt: new Date(),
        },
      });

      // 4. Cập nhật trạng thái PR sang PO_CREATED (Giả định sau khi award sẽ tạo PO)
      await tx.purchaseRequisition.update({
        where: { id: rfq.prId },
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        data: { status: 'PO_CREATED' as any },
      });

      return rfq;
    });
  }

  async getallRfqSupplier() {
    return this.prisma.rfqSupplier.findMany({
      include: {
        rfq: true,
        supplier: true,
      },
    });
  }
}
