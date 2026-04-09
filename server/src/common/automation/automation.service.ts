import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { RfqmoduleService } from '../../rfqmodule/rfqmodule.service';
import { EmailService } from '../../notification-module/email.service';
import {
  DocumentType,
  PrStatus,
  RfqStatus,
  PoStatus,
  GrnStatus,
  QcResult,
  PriceVolatility,
} from '@prisma/client';

interface AutomationConfig {
  contractThreshold: number;
  defaultContractDays: number;
  autoSendEmail: boolean;
}

@Injectable()
export class AutomationService {
  private readonly logger = new Logger(AutomationService.name);
  private config: AutomationConfig = {
    contractThreshold: 50000000,
    defaultContractDays: 365,
    autoSendEmail: true,
  };

  constructor(
    private readonly prisma: PrismaService,
    private readonly rfqService: RfqmoduleService,
    private readonly emailService: EmailService,
  ) {}

  /**
   * Xử lý sau khi một tài liệu được duyệt hoàn toàn
   */
  async handleDocumentApproved(docType: DocumentType, docId: string) {
    this.logger.log(`Handling automation for approved ${docType}: ${docId}`);

    if (docType === DocumentType.PURCHASE_REQUISITION) {
      await this.routePrApprovalFlow(docId);
    }
    // Note: GRN creation is now handled after supplier accepts PO, not immediately after PO approval
  }

  /**
   * Xử lý khi Nhà cung cấp chấp nhận PO
   * Tạo GRN draft để bộ phận kho chuẩn bị nhận hàng
   */
  async handlePoSupplierAccepted(poId: string, supplierId: string) {
    this.logger.log(
      `Supplier ${supplierId} accepted PO ${poId}. Creating draft GRN...`,
    );

    try {
      const po = await this.prisma.purchaseOrder.findUnique({
        where: { id: poId },
        include: { 
          items: true,
          supplier: true,
        },
      });

      if (!po) {
        this.logger.error(`PO ${poId} not found`);
        return;
      }

      // Kiểm tra PO đã ở trạng thái ACKNOWLEDGED (NCC đã chấp nhận)
      if (po.status !== PoStatus.ACKNOWLEDGED) {
        this.logger.warn(
          `PO ${po.poNumber} status is ${po.status}, expected ACKNOWLEDGED`,
        );
      }

      // Kiểm tra xem đã có GRN draft nào cho PO này chưa
      const existingGrn = await this.prisma.goodsReceipt.findFirst({
        where: { 
          poId: po.id,
          status: GrnStatus.DRAFT,
        },
      });

      if (existingGrn) {
        this.logger.warn(
          `Draft GRN ${existingGrn.grnNumber} already exists for PO ${po.poNumber}`,
        );
        return existingGrn;
      }

      // Tạo GRN draft
      const grnNumber = `GRN-DRAFT-${new Date().getFullYear()}-${Math.floor(10000 + Math.random() * 90000)}`;

      const grn = await this.prisma.goodsReceipt.create({
        data: {
          grnNumber,
          poId: po.id,
          orgId: po.orgId,
          // supplierId field doesn't exist in GoodsReceipt model
          receivedById: po.buyerId, // Gán người mua làm người nhận tạm thời
          status: GrnStatus.DRAFT,
          notes: `GRN draft được tạo tự động sau khi NCC ${po.supplier?.name || supplierId} chấp nhận PO ${po.poNumber}. Bộ phận kho cần cập nhật khi hàng về thực tế.`,
          items: {
            create: po.items.map((item, index) => ({
              poItemId: item.id,
              lineNumber: index + 1,
              receivedQty: item.qty, // Số lượng dự kiến nhận = số lượng đặt
              acceptedQty: 0, // Chưa nhận thực tế
              rejectedQty: 0,
              qcResult: QcResult.PENDING,
              notes: `Chờ nhận hàng thực tế từ NCC`,
            })),
          },
        },
        include: {
          items: true,
        },
      });

      // Cập nhật trạng thái PO sang GRN_CREATED
      await this.prisma.purchaseOrder.update({
        where: { id: po.id },
        data: { status: PoStatus.GRN_CREATED },
      });

      this.logger.log(
        `Draft GRN ${grn.grnNumber} created successfully for PO ${po.poNumber}. Items count: ${po.items.length}`,
      );

      // TODO: Gửi thông báo cho bộ phận kho
      // await this.notificationService.notifyWarehouseTeam(po, grn);

      return grn;
    } catch (error) {
      this.logger.error(
        `Failed to create draft GRN for PO ${poId}: ${error!}`,
      );
      throw error;
    }
  }

  /**
   * ROUTING 2 FLOWS DỰA VÀO MẶT HÀNG:
   * - Flow 1 (Giá ổn định): Tạo RFQ ngay
   * - Flow 2 (Giá thay đổi): Tạo QuotationRequest (báo giá trước) sau đó tạo PR từ giá báo
   */
  private async routePrApprovalFlow(prId: string) {
    try {
      const pr = await this.prisma.purchaseRequisition.findUnique({
        where: { id: prId },
        include: {
          items: {
            include: { product: true },
          },
        },
      });

      if (!pr || pr.status !== PrStatus.APPROVED) {
        this.logger.warn(`PR ${prId} not in APPROVED status`);
        return;
      }

      // Kiểm tra xem PR có mặt hàng yêu cầu báo giá không
      const hasVolatileItems = pr.items.some(
        (item) =>
          (item.product?.priceVolatility === PriceVolatility.VOLATILE ||
            item.product?.priceVolatility === PriceVolatility.MODERATE ||
            item.product?.requiresQuoteFirst === true) ??
          false,
      );

      if (hasVolatileItems) {
        this.logger.log(
          `PR ${pr.prNumber} contains volatile items. Creating QuotationRequest instead of RFQ...`,
        );
        await this.autoCreateQuotationRequestFromPr(prId);
      } else {
        this.logger.log(
          `PR ${pr.prNumber} contains stable items. Creating RFQ...`,
        );
        await this.autoCreateRfqFromPr(prId);
      }
    } catch (error) {
      this.logger.error(
        `Failed to route PR approval flow for ${prId}: ${error!}`,
      );
    }
  }

  /**
   * Tự động tạo GRN từ PO đã duyệt
   */
  private async autoCreateGrnFromPo(poId: string) {
    try {
      // 1. Lấy thông tin PO và Items
      const po = await this.prisma.purchaseOrder.findUnique({
        where: { id: poId },
        include: { items: true },
      });

      if (!po) {
        this.logger.error(`PO ${poId} not found for auto GRN creation.`);
        return;
      }

      // 2. Kiểm tra xem đã có GRN nào cho PO này chưa (đề phòng chạy lại)
      const existingGrn = await this.prisma.goodsReceipt.findFirst({
        where: { poId: po.id },
      });

      if (existingGrn) {
        this.logger.warn(`GRN already exists for PO ${po.poNumber}. Skipping.`);
        return;
      }

      this.logger.log(`Auto-creating GRN for PO: ${po.poNumber}`);

      // 3. Tạo GRN và GRN Items trong transaction
      const grnNumber = `GRN-AUTO-${new Date().getFullYear()}-${Math.floor(10000 + Math.random() * 90000)}`;

      await this.prisma.$transaction(async (tx) => {
        const grn = await tx.goodsReceipt.create({
          data: {
            grnNumber,
            poId: po.id,
            orgId: po.orgId,
            receivedById: po.buyerId, // Mặc định gán cho người mua, bộ phận kho sẽ cập nhật sau
            status: GrnStatus.DRAFT,
            notes: `GRN được tạo tự động từ PO ${po.poNumber} sau khi được phê duyệt.`,
            items: {
              create: po.items.map((item) => ({
                poItemId: item.id,
                receivedQty: item.qty, // Mặc định số lượng nhận bằng số lượng đặt
                acceptedQty: 0,
                qcResult: QcResult.PENDING,
              })),
            },
          },
        });

        // 4. Cập nhật trạng thái PO sang GRN_CREATED
        await tx.purchaseOrder.update({
          where: { id: po.id },
          data: { status: PoStatus.GRN_CREATED },
        });

        this.logger.log(
          `GRN ${grn.grnNumber} created automatically for PO ${po.poNumber}`,
        );
      });
    } catch (error) {
      this.logger.error(`Failed to auto-create GRN from PO ${poId}: ${error!}`);
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

        // 4. Cập nhật thông tin giá cho Product
        for (const qItem of quotation.items) {
          const rfqItem = rfq.items.find((i) => i.id === qItem.rfqItemId);
          // Tìm prItem gốc để lấy productId
          const prItem = rfqItem
            ? await tx.prItem.findUnique({
                where: { id: rfqItem.prItemId || '' },
              })
            : null;

          if (prItem?.productId) {
            await tx.product.update({
              where: { id: prItem.productId },
              data: {
                unitPriceRef: qItem.unitPrice,
                lastPriceAt: new Date(),
              },
            });
            this.logger.log(
              `Updated price for product ${prItem.productId} to ${Number(qItem.unitPrice)}`,
            );
          }
        }

        // 5. Cập nhật cam kết ngân sách (Budget Commitment)
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

        // 6. Kiểm tra tạo hợp đồng tự động nếu PO đạt ngưỡng
        const poTotal = Number(quotation.totalPrice);
        if (poTotal >= this.config.contractThreshold) {
          this.logger.log(
            `PO ${po.poNumber} value ${poTotal.toLocaleString('vi-VN')} VND exceeds threshold. Triggering contract automation...`,
          );
          // Gọi sau transaction để tránh deadlock
          setImmediate(() => {
            this.processPOAutomation(po.id)
              .then((result) => {
                if (result?.contractCreated) {
                  this.logger.log(
                    `Auto-created contract ${result.contractNumber} for PO ${po.poNumber}`,
                  );
                  console.log("Tạo hợp đồng thành công !")
                } else {
                  this.logger.warn(
                    `Contract not created for PO ${po.poNumber}: ${result?.message}`,
                  );
                  console.log("Tạo hợp đồng thất bại !")
                }
              })
              .catch((err) => {
                this.logger.error(
                  `Error in contract automation for PO ${po.poNumber}: ${err.message}`,
                );
                console.log("Tạo hợp đồng thất bại !");
                console.log(err);
              });
          });
        } else {
          this.logger.log(
            `PO ${po.poNumber} value ${poTotal.toLocaleString('vi-VN')} VND below contract threshold ${this.config.contractThreshold.toLocaleString('vi-VN')} VND`,
          );
        }

        return po;
      });
    } catch (error) {
      this.logger.error(
        `Failed to auto-create PO from RFQ ${rfqId}: ${error!}`,
      );
    }
  }

  /**
   * FLOW 2 - Tự động tạo QuotationRequest từ PR có mặt hàng giá thay đổi
   * Chờ nhà cung cấp báo giá trước, sau đó mới tạo PR/PO thực tế
   */
  private async autoCreateQuotationRequestFromPr(prId: string) {
    try {
      const pr = await this.prisma.purchaseRequisition.findUnique({
        where: { id: prId },
        include: {
          items: {
            include: { product: true },
          },
          requester: true,
        },
      });

      if (!pr) {
        this.logger.error(`PR ${prId} not found`);
        return;
      }

      this.logger.log(
        `Auto-creating QuotationRequests for PR with volatile items: ${pr.prNumber}`,
      );

      // Tạo QuotationRequest cho mỗi item (hoặc mỗi category)
      // Nhóm theo categoryId để tránh trùng lặp
      const categoryMap = new Map<string | null, number>();

      for (const item of pr.items) {
        const catId = item.categoryId || 'default';
        const totalAmount = Number(item.estimatedPrice) * Number(item.qty);

        if (categoryMap.has(catId)) {
          // Cộng gọp vào category hiện có
          categoryMap.set(catId, categoryMap.get(catId)! + totalAmount);
        } else {
          categoryMap.set(catId, totalAmount);
        }
      }

      // Tạo QuotationRequest cho từng category
      for (const [catId, budgetAmount] of categoryMap) {
        const quotationReq = await this.prisma.quotationRequest.create({
          data: {
            prId: pr.id,
            requesterId: pr.requesterId,
            categoryId: catId === 'default' ? null : catId,
            description: `Báo giá cho danh mục mặt hàng - PR ${pr.prNumber}`,
            estimatedBudget: budgetAmount,
            status: 'PENDING',
            note: `Mặt hàng có giá thay đổi liên tục. Yêu cầu báo giá chi tiết trước khi thực hiện mua.`,
          },
        });

        this.logger.log(
          `QuotationRequest created: ${quotationReq.id} for category: ${catId}`,
        );
      }

      this.logger.log(
        `Automation completed: QuotationRequests created for PR ${pr.prNumber}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to auto-create QuotationRequest from PR ${prId}: ${error!}`,
      );
    }
  }

  /**
   * FLOW 1 - Tự động tạo RFQ từ PR có mặt hàng giá ổn định
   * Tạo RFQ ngay để mời nhà cung cấp báo giá tiêu chuẩn
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
      this.logger.error(`Failed to auto-create RFQ from PR ${prId}: ${error!}`);
    }
  }

  /**
   * PO Automation: Tạo contract tự động khi PO đạt ngưỡng giá
   */
  async processPOAutomation(poId: string) {
    try {
      const po = await this.prisma.purchaseOrder.findUnique({
        where: { id: poId },
        include: {
          supplier: true,
          items: true,
        },
      });

      if (!po) {
        return { success: false, message: `PO not found: ${poId}` };
      }

      const totalAmount = Number(po.totalAmount);
      this.logger.log(`Processing PO ${po.poNumber} with value: ${totalAmount}`);

      if (totalAmount < this.config.contractThreshold) {
        return {
          success: true,
          poId: po.id,
          contractCreated: false,
          message: `PO ${po.poNumber} below threshold ${this.config.contractThreshold.toLocaleString('vi-VN')} VND`,
        };
      }

      if (po.contractId) {
        const existingContract = await this.prisma.contract.findUnique({
          where: { id: po.contractId },
        });
        if (existingContract) {
          return {
            success: true,
            poId: po.id,
            contractCreated: false,
            contractId: existingContract.id,
            message: `PO ${po.poNumber} already has contract ${existingContract.contractNumber}`,
          };
        }
      }

      const startDate = new Date();
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + this.config.defaultContractDays);

      const contractNumber = await this.generateContractNumber(po.orgId);

      const contract = await this.prisma.contract.create({
        data: {
          contractNumber,
          title: `Contract from ${po.poNumber}`,
          description: `Auto-generated contract from PO ${po.poNumber} value ${totalAmount.toLocaleString('vi-VN')} VND`,
          orgId: po.orgId,
          supplierId: po.supplierId,
          value: totalAmount,
          currency: po.currency || 'VND',
          startDate,
          endDate,
          status: 'DRAFT',
          milestones: {
            create: [
              {
                title: 'Contract Signing',
                description: 'Both parties sign the contract',
                dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
                paymentPct: 0,
                status: 'PENDING',
              },
              {
                title: 'First Delivery',
                description: 'Initial delivery as per PO',
                dueDate: po.deliveryDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
                paymentPct: 30,
                status: 'PENDING',
              },
              {
                title: 'Final Payment',
                description: 'Final payment upon completion',
                dueDate: endDate,
                paymentPct: 70,
                status: 'PENDING',
              },
            ],
          },
        },
      });

      await this.prisma.purchaseOrder.update({
        where: { id: po.id },
        data: { contractId: contract.id },
      });

      this.logger.log(`Created contract ${contract.contractNumber} from PO ${po.poNumber}`);

      let emailSent = false;
      if (this.config.autoSendEmail && po.supplier?.email) {
        emailSent = await this.sendContractNotificationEmail(contract.id, po, totalAmount);
      }

      return {
        success: true,
        poId: po.id,
        poNumber: po.poNumber,
        contractCreated: true,
        contractId: contract.id,
        contractNumber: contract.contractNumber,
        message: `Created contract ${contract.contractNumber} from PO ${po.poNumber}${emailSent ? ' and sent email' : ''}`,
        emailSent,
      };
    } catch (error) {
      this.logger.error(`PO Automation error: ${error.message}`, error.stack);
      return { success: false, message: `Error: ${error.message}` };
    }
  }

  async sendContractEmail(contractId: string) {
    const contract = await this.prisma.contract.findUnique({
      where: { id: contractId },
      include: {
        supplierOrg: true,
        purchaseOrders: {
          include: { supplier: true },
          take: 1,
        },
      },
    });

    if (!contract) {
      throw new Error(`Contract not found: ${contractId}`);
    }

    const po = contract.purchaseOrders?.[0];
    if (!po) {
      throw new Error('No PO linked to contract');
    }

    const emailSent = await this.sendContractNotificationEmail(
      contractId,
      po,
      Number(contract.value || 0)
    );

    return {
      success: emailSent,
      contractId,
      message: emailSent ? 'Email sent' : 'Failed to send email',
    };
  }

  private async generateContractNumber(orgId: string): Promise<string> {
    const year = new Date().getFullYear();
    const count = await this.prisma.contract.count({ where: { orgId } });
    return `CTR-${year}-${String(count + 1).padStart(4, '0')}`;
  }

  private async sendContractNotificationEmail(
    contractId: string,
    po: any,
    totalAmount: number,
  ): Promise<boolean> {
    try {
      const contract = await this.prisma.contract.findUnique({
        where: { id: contractId },
        include: { supplierOrg: true },
      });

      const supplierEmail = contract?.supplierOrg?.email || po?.supplier?.email;
      if (!supplierEmail) {
        this.logger.warn('Cannot send email: missing supplier info');
        return false;
      }

      const { subject, body } = this.generateContractEmailContent(contract, po, totalAmount);

      await this.emailService.sendEmail(
        supplierEmail,
        subject,
        body,
      );

      this.logger.log(`Sent contract email to ${supplierEmail}`);
      return true;
    } catch (error) {
      this.logger.error(`Email error: ${error.message}`, error.stack);
      return false;
    }
  }

  private generateContractEmailContent(contract: any, po: any, totalAmount: number) {
    const subject = `New Contract ${contract.contractNumber} - Value ${Number(contract.value || 0).toLocaleString('vi-VN')} VND`;

    const body = `
Dear ${contract.supplierOrg?.name || 'Supplier'},

A new contract has been created from PO ${po.poNumber}:

CONTRACT DETAILS:
- Number: ${contract.contractNumber}
- Title: ${contract.title}
- Value: ${Number(contract.value || 0).toLocaleString('vi-VN')} ${contract.currency}
- Start: ${contract.startDate?.toLocaleDateString('vi-VN')}
- End: ${contract.endDate?.toLocaleDateString('vi-VN')}
- Status: Pending signature

Please login to view and sign the contract.

Best regards,
Procurement System
    `;

    return { subject, body };
  }
}
