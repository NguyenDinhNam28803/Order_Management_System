import { Injectable, Logger } from '@nestjs/common';
import { AiService } from '../ai-service/ai-service.service';
import { PrismaService } from '../prisma/prisma.service';
import { EmailRagService, ParsedEmail } from '../rag/email-rag.service';

export interface IncomingEmailData {
  from: string;      // Người gửi (vd: "Nguyen Van A <a@company.com>")
  subject: string;   // Tiêu đề email
  body: string;      // Nội dung text thuần
  messageId: string; // Message-ID duy nhất (đã sanitize)
}

@Injectable()
export class EmailProcessorService {
  private readonly logger = new Logger(EmailProcessorService.name);

  constructor(
    private readonly aiService: AiService,
    private readonly prisma: PrismaService,
    private readonly emailRagService: EmailRagService,
  ) {}

  /**
   * Xử lý email đến: ingest vào RAG ngay lập tức, sau đó phân tích bằng AI
   * để tự động tạo PR nếu email là yêu cầu mua hàng.
   */
  async processIncomingEmail(emailData: IncomingEmailData) {
    const { from, subject, body, messageId } = emailData;

    // ── Bước 1: Ingest vào RAG ngay lập tức (không chờ cron 5 phút) ──────────
    const parsedEmail: ParsedEmail = {
      messageId,
      subject,
      from,
      to: '',
      date: new Date(),
      body,
    };
    await this.emailRagService.ingestSingleEmail(parsedEmail).catch((err: Error) => {
      this.logger.warn(`RAG ingest failed for email "${subject}": ${err.message}`);
    });

    // ── Bước 2: Phân tích nội dung email bằng Gemini AI ──────────────────────
    const analysis = await this.aiService.analyzeEmailContent(
      `Tiêu đề: ${subject}\n\n${body}`,
    );

    if (analysis.confidence < 0.7) {
      this.logger.log(
        `Email từ ${from} có confidence thấp (${analysis.confidence}), bỏ qua tự động xử lý`,
      );
      return { success: false, reason: 'Low confidence', ingested: true };
    }

    // ── Bước 3: Tìm user gửi email trong hệ thống ────────────────────────────
    const senderEmail = this.extractEmail(from);
    const senderUser = senderEmail
      ? await this.prisma.user.findFirst({
          where: { email: { equals: senderEmail, mode: 'insensitive' }, isActive: true },
        })
      : null;

    if (!senderUser) {
      this.logger.warn(
        `Người gửi "${from}" không có trong hệ thống — không thể tạo PR tự động`,
      );
      return { success: false, reason: 'Sender not registered in system', ingested: true };
    }

    // ── Bước 4: Xử lý theo intent ────────────────────────────────────────────
    if (analysis.intent === 'CREATE_PR') {
      return await this.createDraftPR(analysis.data, senderUser, subject);
    }

    return { success: false, message: 'Unsupported intent', ingested: true };
  }

  // ── Tạo PR nháp từ dữ liệu AI phân tích ──────────────────────────────────
  private async createDraftPR(
    data: any,
    user: { id: string; orgId: string; deptId: string | null },
    subject: string,
  ) {
    const pr = await this.prisma.purchaseRequisition.create({
      data: {
        prNumber: `PR-EMAIL-${Date.now()}`,
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        title: data?.description || subject || 'Yêu cầu mua hàng từ email',
        description: `Tự động tạo từ email.\nNội dung AI phân tích: ${data?.description ?? 'N/A'}`,
        status: 'DRAFT',
        orgId: user.orgId,
        requesterId: user.id,
        ...(user.deptId ? { deptId: user.deptId } : {}),
        items: {
          create: [
            {
              lineNumber: 1,
              // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
              qty: data?.quantity ?? 1,
              // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
              productDesc: data?.description ?? 'Sản phẩm từ email (cần bổ sung)',
              estimatedPrice: 0,
            },
          ],
        },
      },
    });

    this.logger.log(`PR nháp tạo từ email: ${pr.prNumber} cho user ${user.id}`);
    return { success: true, prId: pr.id, prNumber: pr.prNumber };
  }

  // ── Trích xuất địa chỉ email từ chuỗi "Name <email>" hoặc "email" ─────────
  private extractEmail(from: string): string | null {
    const angleMatch = from.match(/<([^>]+@[^>]+)>/);
    if (angleMatch) return angleMatch[1].trim().toLowerCase();
    const plainMatch = from.match(/([^\s]+@[^\s]+)/);
    return plainMatch ? plainMatch[1].trim().toLowerCase() : null;
  }
}
