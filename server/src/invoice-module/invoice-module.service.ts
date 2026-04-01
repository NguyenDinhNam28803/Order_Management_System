import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { InvoiceStatus, Prisma } from '@prisma/client';
import {
  CreateInvoiceModuleDto,
  CreateInvoiceItemDto,
} from './dto/create-invoice-module.dto';
import { UpdateInvoiceModuleDto } from './dto/update-invoice-module.dto';

interface MatchingItemResult {
  poItemId: string;
  qtyMatch: boolean;
  priceMatch: boolean;
  variance: number;
}

@Injectable()
export class InvoiceModuleService {
  private readonly logger = new Logger(InvoiceModuleService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Đánh dấu hóa đơn đã thanh toán và cập nhật ngân sách thực tế (Spent)
   */
  async markAsPaid(id: string) {
    const invoice = await this.prisma.supplierInvoice.findUnique({
      where: { id },
      include: { po: true },
    });

    if (!invoice) throw new NotFoundException('Hóa đơn không tồn tại');

    // Chỉ cho phép thanh toán nếu hóa đơn đã được duyệt thanh toán
    const allowedStatuses: InvoiceStatus[] = [
      InvoiceStatus.PAYMENT_APPROVED,
      InvoiceStatus.AUTO_APPROVED,
    ];

    if (!allowedStatuses.includes(invoice.status)) {
      throw new BadRequestException(
        `Không thể thanh toán hóa đơn ở trạng thái: ${invoice.status}. Hóa đơn cần được duyệt trước.`,
      );
    }

    const { po, totalAmount } = invoice;

    return this.prisma.$transaction(async (tx) => {
      // 1. Cập nhật trạng thái hóa đơn
      const updatedInvoice = await tx.supplierInvoice.update({
        where: { id },
        data: {
          status: InvoiceStatus.PAID,
          paidAt: new Date(),
        },
      });

      // 2. Chuyển ngân sách từ Committed sang Spent
      if (po.deptId && po.costCenterId) {
        const budget = await tx.budgetAllocation.findFirst({
          where: {
            orgId: po.orgId,
            deptId: po.deptId,
            costCenterId: po.costCenterId,
            currency: po.currency,
          },
        });

        if (budget) {
          // decrement committedAmount và increment spentAmount
          await tx.budgetAllocation.update({
            where: { id: budget.id },
            data: {
              committedAmount: { decrement: totalAmount },
              spentAmount: { increment: totalAmount },
            },
          });
        }
      }

      return updatedInvoice;
    });
  }

  /**
   * Tạo hóa đơn và kích hoạt đối soát 3 chiều tự động
   */
  async create(createInvoiceDto: CreateInvoiceModuleDto) {
    const { items, poId, grnId, supplierId, orgId, ...invoiceData } =
      createInvoiceDto;

    const invoice = await this.prisma.supplierInvoice.create({
      data: {
        ...invoiceData,
        status: InvoiceStatus.MATCHING,
        // Sử dụng connect thay vì ID trực tiếp để tránh lỗi UncheckedUpdate
        po: { connect: { id: poId } },
        supplier: { connect: { id: supplierId } },
        buyerOrg: { connect: { id: orgId } },
        grn: grnId ? { connect: { id: grnId } } : undefined,
        items: items
          ? {
              create: items.map((item: CreateInvoiceItemDto) => ({
                poItemId: item.poItemId,
                grnItemId: item.grnItemId,
                description: item.description,
                qty: item.qty,
                unitPrice: item.unitPrice,
                total: Number(item.qty) * Number(item.unitPrice),
              })),
            }
          : undefined,
      },
      include: { items: true },
    });

    // Tự động chạy đối soát sau khi tạo
    void this.runThreeWayMatching(invoice.id);

    return invoice;
  }

  /**
   * Logic Đối soát 3 bên (3-Way Matching)
   * So khớp: Purchase Order (PO) - Goods Receipt (GRN) - Supplier Invoice
   */
  async runThreeWayMatching(invoiceId: string) {
    this.logger.log(`Running 3-way matching for invoice: ${invoiceId}`);

    const invoice = await this.prisma.supplierInvoice.findUnique({
      where: { id: invoiceId },
      include: {
        items: { include: { poItem: true, grnItem: true } },
        po: { include: { items: true } },
        grn: { include: { items: true } },
      },
    });

    if (!invoice) return;

    let matchFailed = false;
    const results: MatchingItemResult[] = [];

    for (const invItem of invoice.items) {
      const poItem = invItem.poItem;
      const grnItem = invItem.grnItem;

      const itemMatch: MatchingItemResult = {
        poItemId: invItem.poItemId,
        qtyMatch: false,
        priceMatch: false,
        variance: 0,
      };

      // 1. Kiểm tra số lượng: Invoice Qty <= GRN Received Qty
      if (grnItem) {
        itemMatch.qtyMatch = Number(invItem.qty) <= Number(grnItem.receivedQty);
      } else {
        itemMatch.qtyMatch = false;
      }

      // 2. Kiểm tra đơn giá: Invoice Price <= PO Price
      if (poItem) {
        itemMatch.priceMatch =
          Number(invItem.unitPrice) <= Number(poItem.unitPrice);
      }

      if (!itemMatch.qtyMatch || !itemMatch.priceMatch) {
        matchFailed = true;
      }

      results.push(itemMatch);
    }

    // Cập nhật kết quả đối soát
    const finalStatus = matchFailed
      ? InvoiceStatus.EXCEPTION_REVIEW
      : InvoiceStatus.AUTO_APPROVED;

    await this.prisma.supplierInvoice.update({
      where: { id: invoiceId },
      data: {
        status: finalStatus,
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        matchingResult: results as any,
        matchedAt: new Date(),
      },
    });

    this.logger.log(
      `Matching finished for ${invoiceId}. Result: ${finalStatus}`,
    );
  }

  async update(id: string, updateInvoiceDto: UpdateInvoiceModuleDto) {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { items, poId, grnId, supplierId, orgId, ...updateData } =
      updateInvoiceDto;

    // Tạo đối tượng data cho Prisma update
    const data: Prisma.SupplierInvoiceUpdateInput = {
      ...updateData,
    };

    // Xử lý các liên kết nếu có thay đổi ID
    if (poId) data.po = { connect: { id: poId } };
    if (supplierId) data.supplier = { connect: { id: supplierId } };
    if (orgId) data.buyerOrg = { connect: { id: orgId } };
    if (grnId) data.grn = { connect: { id: grnId } };

    return this.prisma.supplierInvoice.update({
      where: { id },
      data,
    });
  }

  async remove(id: string) {
    return this.prisma.supplierInvoice.delete({
      where: { id },
    });
  }

  async findAll(orgId: string) {
    return this.prisma.supplierInvoice.findMany({
      where: { orgId },
      include: { po: true, supplier: true },
    });
  }

  async findOne(id: string) {
    return this.prisma.supplierInvoice.findUnique({
      where: { id },
      include: { po: true, supplier: true, items: true },
    });
  }
}
