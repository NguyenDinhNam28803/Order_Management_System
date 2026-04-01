import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  PaymentStatus,
  InvoiceStatus,
  PoStatus,
  DocumentType,
} from '@prisma/client';
import { CreatePaymentModuleDto } from './dto/create-payment-module.dto';
import { BudgetModuleService } from '../budget-module/budget-module.service';
import { JwtPayload } from '../auth-module/interfaces/jwt-payload.interface';

@Injectable()
export class PaymentModuleService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly budgetService: BudgetModuleService,
  ) {}

  /**
   * Tạo yêu cầu thanh toán cho một hóa đơn
   */
  async create(createPaymentDto: CreatePaymentModuleDto, user: JwtPayload) {
    const { invoiceId, amount, method } = createPaymentDto;

    const invoice = await this.prisma.supplierInvoice.findUnique({
      where: { id: invoiceId },
      include: { po: true },
    });

    if (!invoice) throw new NotFoundException('Không tìm thấy hóa đơn');

    // Kiểm tra hóa đơn phải được duyệt thanh toán hoặc tự động duyệt (Sau matching)
    if (
      invoice.status !== InvoiceStatus.PAYMENT_APPROVED &&
      invoice.status !== InvoiceStatus.AUTO_APPROVED
    ) {
      throw new BadRequestException(
        `Hóa đơn chưa sẵn sàng để thanh toán. Trạng thái hiện tại: ${invoice.status}`,
      );
    }

    const paymentNumber = `PAY-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

    return this.prisma.$transaction(async (tx) => {
      // 1. Tạo bản ghi thanh toán
      const payment = await tx.payment.create({
        data: {
          paymentNumber,
          invoiceId: invoice.id,
          poId: invoice.poId,
          supplierId: invoice.supplierId,
          amount: amount || invoice.totalAmount,
          currency: invoice.currency,
          method: method,
          status: PaymentStatus.PENDING,
          createdById: user.sub,
        },
      });

      // 2. Cập nhật trạng thái hóa đơn sang PAYMENT_PROCESSING
      await tx.supplierInvoice.update({
        where: { id: invoice.id },
        data: { status: InvoiceStatus.PAYMENT_PROCESSING },
      });

      return payment;
    });
  }

  /**
   * Xác nhận thanh toán thành công (Xử lý tiền và ngân sách)
   */
  async completePayment(paymentId: string, user: JwtPayload) {
    const payment = await this.prisma.payment.findUnique({
      where: { id: paymentId },
      include: { po: true, invoice: true },
    });

    if (!payment)
      throw new NotFoundException('Không tìm thấy giao dịch thanh toán');
    if (payment.status === PaymentStatus.COMPLETED) {
      throw new BadRequestException('Giao dịch này đã được hoàn tất trước đó.');
    }

    return this.prisma.$transaction(async (tx) => {
      // 1. Cập nhật trạng thái thanh toán
      const updatedPayment = await tx.payment.update({
        where: { id: paymentId },
        data: {
          status: PaymentStatus.COMPLETED,
          processedAt: new Date(),
          approvedById: user.sub,
          approvedAt: new Date(),
        },
      });

      // 2. Cập nhật hóa đơn sang PAID
      await tx.supplierInvoice.update({
        where: { id: payment.invoiceId },
        data: { status: InvoiceStatus.PAID, paidAt: new Date() },
      });

      // 3. Cập nhật PO sang COMPLETED nếu đây là hóa đơn cuối cùng
      // (Logic đơn giản: Giả sử 1 PO 1 Invoice cho Happy Path)
      await tx.purchaseOrder.update({
        where: { id: payment.poId },
        data: { status: PoStatus.COMPLETED, completedAt: new Date() },
      });

      // 4. Cập nhật Ngân sách (Spent Amount)
      if (payment.po.costCenterId) {
        // Chuyển từ Committed sang Spent
        await tx.budgetAllocation.updateMany({
          where: {
            costCenterId: payment.po.costCenterId,
            orgId: payment.po.orgId,
            currency: payment.currency,
          },
          data: {
            committedAmount: { decrement: payment.amount },
            spentAmount: { increment: payment.amount },
          },
        });
      }

      return updatedPayment;
    });
  }

  async findAll(orgId: string) {
    return this.prisma.payment.findMany({
      where: { po: { orgId } },
      include: { invoice: true, po: true },
    });
  }

  async findOne(id: string) {
    return this.prisma.payment.findUnique({
      where: { id },
      include: { invoice: true, po: true },
    });
  }
}
