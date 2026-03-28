import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { RfqmoduleService } from '../../rfqmodule/rfqmodule.service';
import { DocumentType, PrStatus, RfqStatus, PoStatus } from '@prisma/client';

@Injectable()
export class AutomationService {
  private readonly logger = new Logger(AutomationService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly rfqService: RfqmoduleService,
  ) {}

  /**
   * Xử lý sau khi một tài liệu được duyệt hoàn toàn
   */
  async handleDocumentApproved(docType: DocumentType, docId: string) {
    this.logger.log(`Handling automation for approved ${docType}: ${docId}`);

    if (docType === DocumentType.PURCHASE_REQUISITION) {
      await this.autoCreateRfqFromPr(docId);
    }
  }

  /**
   * Xử lý sau khi RFQ được trao thầu
   */
  async handleRfqAwarded(rfqId: string, quotationId: string) {
    this.logger.log(
      `Handling automation for awarded RFQ: ${rfqId}, Quotation: ${quotationId}`,
    );
    await this.autoCreatePoFromRfq(rfqId, quotationId);
  }

  /**
   * Tự động tạo PO từ RFQ và Quotation thắng thầu
   */
  private async autoCreatePoFromRfq(rfqId: string, quotationId: string) {
    try {
      // 1. Lấy thông tin RFQ và Quotation thắng thầu
      const rfq = await this.prisma.rfqRequest.findUnique({
        where: { id: rfqId },
        include: {
          pr: true,
          items: {
            include: { prItem: true },
          },
        },
      });

      const quotation = await this.prisma.rfqQuotation.findUnique({
        where: { id: quotationId },
        include: { items: true },
      });

      if (!rfq || !quotation) {
        this.logger.error(`RFQ or Quotation not found for auto PO creation.`);
        return;
      }

      // 2. Kiểm tra xem PO đã tồn tại cho RFQ này chưa
      const existingPo = await this.prisma.purchaseOrder.findFirst({
        where: { rfqId: rfq.id },
      });

      if (existingPo) {
        this.logger.warn(`PO already exists for RFQ ${rfqId}. Skipping.`);
        return;
      }

      this.logger.log(`Auto-creating PO for RFQ: ${rfq.rfqNumber}`);

      // 3. Chuẩn bị dữ liệu PO
      const poNumber = `PO-AUTO-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

      // Tính toán ngày giao hàng dựa trên leadTime của báo giá
      const deliveryDate = new Date();
      deliveryDate.setDate(
        deliveryDate.getDate() + (quotation.leadTimeDays || 7),
      );

      await this.prisma.$transaction(async (tx) => {
        // Tạo PO chính thức
        const po = await tx.purchaseOrder.create({
          data: {
            poNumber,
            orgId: rfq.orgId,
            prId: rfq.prId,
            rfqId: rfq.id,
            quotationId: quotation.id,
            supplierId: quotation.supplierId,
            buyerId: rfq.createdById, // Người tạo RFQ là người mua
            deptId: rfq.pr?.deptId,
            costCenterId: rfq.pr?.costCenterId,
            status: PoStatus.ISSUED, // Tự động phát hành PO luôn
            totalAmount: quotation.totalPrice,
            currency: quotation.currency,
            paymentTerms: quotation.paymentTerms,
            deliveryDate: deliveryDate,
            notes: `PO được tạo tự động từ RFQ ${rfq.rfqNumber} và Báo giá ${quotation.quotationNumber}`,
            items: {
              create: quotation.items.map((qItem, index) => {
                const rfqItem = rfq.items.find((i) => i.id === qItem.rfqItemId);
                return {
                  lineNumber: index + 1,
                  prItemId: rfqItem?.prItemId,
                  quotationItemId: qItem.id,
                  description: rfqItem?.description || 'N/A',
                  qty: qItem.qtyOffered || rfqItem?.qty || 0,
                  unitPrice: qItem.unitPrice,
                  discountPct: qItem.discountPct,
                  total:
                    Number(qItem.unitPrice) *
                    Number(qItem.qtyOffered || rfqItem?.qty || 0) *
                    (1 - Number(qItem.discountPct) / 100),
                };
              }),
            },
          },
        });

        // 4. Cập nhật cam kết ngân sách (Budget Commitment)
        if (rfq.pr?.costCenterId && rfq.pr?.deptId) {
          const budget = await tx.budgetAllocation.findFirst({
            where: {
              orgId: rfq.orgId,
              costCenterId: rfq.pr.costCenterId,
              deptId: rfq.pr.deptId,
            },
          });

          if (budget) {
            await tx.budgetAllocation.update({
              where: { id: budget.id },
              data: {
                committedAmount: { increment: quotation.totalPrice },
              },
            });
          }
        }

        this.logger.log(`PO ${po.poNumber} created and budget committed.`);
      });
    } catch (error) {
      this.logger.error(
        `Failed to auto-create PO from RFQ ${rfqId}: ${error.message}`,
        error.stack,
      );
    }
  }

  /**
   * Tự động tạo RFQ từ PR đã duyệt
   */
  private async autoCreateRfqFromPr(prId: string) {
    try {
      // 1. Lấy thông tin PR chi tiết
      const pr = await this.prisma.purchaseRequisition.findUnique({
        where: { id: prId },
        include: { items: true, requester: true },
      });

      if (!pr || pr.status !== PrStatus.APPROVED) {
        this.logger.warn(
          `PR ${prId} is not in APPROVED status. Skipping RFQ creation.`,
        );
        return;
      }

      // 2. Kiểm tra xem đã có RFQ nào cho PR này chưa để tránh tạo trùng
      const existingRfq = await this.prisma.rfqRequest.findFirst({
        where: { prId: pr.id },
      });

      if (existingRfq) {
        this.logger.warn(`RFQ already exists for PR ${prId}. Skipping.`);
        return;
      }

      this.logger.log(`Auto-creating RFQ for PR: ${pr.prNumber}`);

      // 3. Chuẩn bị dữ liệu RFQ
      const rfqNumber = `RFQ-AUTO-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

      // Tạo RFQ Request
      const rfq = await this.prisma.rfqRequest.create({
        data: {
          rfqNumber,
          orgId: pr.orgId,
          prId: pr.id,
          title: `RFQ tự động cho ${pr.title}`,
          description:
            pr.description ||
            `Được tạo tự động từ yêu cầu mua hàng ${pr.prNumber}`,
          deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Mặc định 7 ngày sau
          status: RfqStatus.SENT,
          createdById: pr.requesterId, // Gán cho người tạo PR hoặc một System User
          items: {
            create: pr.items.map((item, index) => ({
              prItemId: item.id,
              lineNumber: index + 1,
              description: item.productDesc,
              qty: item.qty,
              unit: item.unit,
              targetPrice: item.estimatedPrice,
              categoryId: item.categoryId,
              sku: item.sku,
            })),
          },
        },
      });

      this.logger.log(
        `RFQ ${rfq.rfqNumber} created successfully. Calling AI to invite suppliers...`,
      );

      // 4. Gọi AI gợi ý và mời nhà cung cấp tự động
      await this.rfqService.searchAndAddSuppliers(rfq.id);

      this.logger.log(`Automation completed for PR ${pr.prNumber}`);
    } catch (error) {
      this.logger.error(
        `Failed to auto-create RFQ from PR ${prId}: ${error.message}`,
        error.stack,
      );
    }
  }
}
