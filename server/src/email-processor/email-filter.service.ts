import { Injectable, Logger } from '@nestjs/common';
import { AiService } from '../ai-service/ai-service.service';
import { IncomingEmailData } from './email-processor.service';

// ─── Kết quả lọc email ───────────────────────────────────────────────────────
export type FilterType =
  | 'system_blocked' // Rule-based: chắc chắn spam/không liên quan
  | 'system_allowed' // Rule-based: chắc chắn hợp lệ (trusted sender)
  | 'ai_blocked' // AI phán quyết: không liên quan đến hệ thống
  | 'ai_allowed'; // AI phán quyết: hợp lệ, nên xử lý

export interface EmailFilterResult {
  shouldProcess: boolean;
  filterType: FilterType;
  reason: string;
}

// ─── Cấu hình rule-based ─────────────────────────────────────────────────────

/** Từ khoá trong subject → tự động block (spam/marketing/auto-reply) */
const BLOCKED_SUBJECT_KEYWORDS = [
  'unsubscribe',
  'newsletter',
  'promotion',
  'promo',
  'sale',
  'offer',
  'click here',
  'free',
  'win',
  'winner',
  'congratulation',
  'auto-reply',
  'out of office',
  'automatic reply',
  'delivery failed',
  'mailer-daemon',
  'noreply',
  'no-reply',
  'verify your email',
  'confirm your account',
  'password reset',
  'security alert',
];

/** Từ khoá trong sender → tự động block */
const BLOCKED_SENDER_KEYWORDS = [
  'noreply@',
  'no-reply@',
  'donotreply@',
  'mailer-daemon@',
  'postmaster@',
  'bounce@',
  'notifications@',
  'alerts@',
];

/** Domain được tin tưởng → bypass AI filter, xử lý thẳng */
const TRUSTED_DOMAINS: string[] = [
  // Thêm domain công ty của bạn ở đây, ví dụ: 'company.com', 'partner.vn'
];

/** Từ khoá trong subject → dấu hiệu liên quan procurement, ưu tiên allow */
const PROCUREMENT_SUBJECT_KEYWORDS = [
  'purchase',
  'order',
  'requisition',
  'pr ',
  ' pr',
  'mua hàng',
  'yêu cầu',
  'đặt hàng',
  'quotation',
  'báo giá',
  'rfq',
  'invoice',
  'hóa đơn',
  'delivery',
  'giao hàng',
  'supplier',
  'nhà cung cấp',
  'contract',
  'hợp đồng',
  'budget',
  'ngân sách',
];

@Injectable()
export class EmailFilterService {
  private readonly logger = new Logger(EmailFilterService.name);

  constructor(private readonly aiService: AiService) {}

  /**
   * Lọc email qua 2 tầng:
   * 1. System filter (rule-based, không tốn AI quota)
   * 2. AI filter (chỉ gọi khi email mơ hồ)
   *
   * @returns EmailFilterResult với shouldProcess = true/false và lý do
   */
  async filter(email: IncomingEmailData): Promise<EmailFilterResult> {
    const subjectLower = email.subject.toLowerCase();
    const fromLower = email.from.toLowerCase();
    const bodyLower = email.body.toLowerCase();

    // ── Tầng 1a: Block ngay nếu khớp spam rules ───────────────────────────────
    const blockedSubject = BLOCKED_SUBJECT_KEYWORDS.find((kw) =>
      subjectLower.includes(kw),
    );
    if (blockedSubject) {
      this.logger.log(`BLOCKED — subject chứa spam keyword: "${blockedSubject}"`);
      return {
        shouldProcess: false,
        filterType: 'system_blocked',
        reason: `Subject chứa từ khoá spam: "${blockedSubject}"`,
      };
    }

    const blockedSender = BLOCKED_SENDER_KEYWORDS.find((kw) =>
      fromLower.includes(kw),
    );
    if (blockedSender) {
      this.logger.log(`BLOCKED — sender là auto/no-reply: "${blockedSender}"`);
      return {
        shouldProcess: false,
        filterType: 'system_blocked',
        reason: `Sender là auto-reply/no-reply: "${blockedSender}"`,
      };
    }

    if (email.body.trim().length < 10) {
      this.logger.log(`BLOCKED — body quá ngắn (${email.body.trim().length} ký tự)`);
      return {
        shouldProcess: false,
        filterType: 'system_blocked',
        reason: 'Body email quá ngắn hoặc rỗng',
      };
    }

    // ── Tầng 1b: Allow ngay nếu sender thuộc trusted domain ──────────────────
    if (TRUSTED_DOMAINS.length > 0) {
      const trusted = TRUSTED_DOMAINS.find((domain) =>
        fromLower.includes(`@${domain.toLowerCase()}`),
      );
      if (trusted) {
        this.logger.log(`ALLOWED — trusted domain: "${trusted}"`);
        return {
          shouldProcess: true,
          filterType: 'system_allowed',
          reason: `Sender thuộc trusted domain: "${trusted}"`,
        };
      }
    }

    // ── Tầng 1c: Allow ngay nếu subject rõ ràng là procurement ───────────────
    const procurementKw = PROCUREMENT_SUBJECT_KEYWORDS.find((kw) =>
      subjectLower.includes(kw),
    );
    if (procurementKw) {
      this.logger.log(`ALLOWED — subject khớp procurement keyword: "${procurementKw}"`);
      return {
        shouldProcess: true,
        filterType: 'system_allowed',
        reason: `Subject chứa từ khoá procurement: "${procurementKw}"`,
      };
    }

    // ── Tầng 2: AI filter cho email mơ hồ ────────────────────────────────────
    this.logger.log(`Chuyển sang AI filter: "${email.subject}"`);
    return await this.filterWithAi(email, subjectLower, bodyLower);
  }

  // ── Gọi Gemini để phán quyết email không rõ ràng ──────────────────────────
  private async filterWithAi(
    email: IncomingEmailData,
    _subjectLower: string,
    _bodyLower: string,
  ): Promise<EmailFilterResult> {
    try {
      const result = await this.aiService.filterEmailRelevance(
        email.subject,
        email.from,
        email.body,
      );

      const shouldProcess = result.relevant && result.confidence >= 0.65;

      this.logger.log(
        `AI filter "${email.subject}": relevant=${result.relevant} confidence=${result.confidence.toFixed(2)} — ${result.reason}`,
      );

      return {
        shouldProcess,
        filterType: shouldProcess ? 'ai_allowed' : 'ai_blocked',
        reason: `AI: ${result.reason} (confidence=${result.confidence.toFixed(2)})`,
      };
    } catch (err: any) {
      // Nếu AI lỗi → mặc định cho qua để không mất email quan trọng
      this.logger.warn(
        `AI filter lỗi cho "${email.subject}": ${err.message} — fallback: ALLOW`,
      );
      return {
        shouldProcess: true,
        filterType: 'ai_allowed',
        reason: `AI filter lỗi (${err.message}) — fallback cho qua`,
      };
    }
  }
}
