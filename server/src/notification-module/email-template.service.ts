import { Injectable } from '@nestjs/common';

export type EmailEventType =
  | 'USER_LOGIN'
  | 'USER_REGISTERED'
  | 'RFQ_INVITATION'
  | 'PO_APPROVAL_REQUEST'
  | 'PO_APPROVED'
  // ── Magic Link templates (open process) ──
  | 'RFQ_MAGIC_LINK'          // NCC báo giá qua link, không cần đăng nhập
  | 'PR_APPROVAL_LINK'        // Approver duyệt PR qua email 1-click
  | 'PO_CONFIRM_LINK'         // NCC xác nhận nhận PO
  | 'GRN_MILESTONE_UPDATE'    // NCC cập nhật trạng thái giao hàng
  | 'INVOICE_SUBMIT_LINK'     // NCC nộp hóa đơn sau GRN
  | 'PAYMENT_CONFIRMED'       // Xác nhận đã thanh toán thành công
  | string;

@Injectable()
export class EmailTemplatesService {

  // ── Helpers ────────────────────────────────────────────────────────────────
  private fmt(amount: number): string {
    return new Intl.NumberFormat('vi-VN').format(amount) + ' VNĐ';
  }

  private fmtDate(val: string | Date): string {
    const d = typeof val === 'string' ? new Date(val) : val;
    return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
  }

  /**
   * Trả về HTML email dựa trên eventType.
   */
  render(eventType: EmailEventType, data: Record<string, any>): string {
    switch (eventType) {
      case 'USER_LOGIN':            return this.templateWelcomeBack(data);
      case 'USER_REGISTERED':       return this.templateNewMember(data);
      case 'RFQ_INVITATION':        return this.templateRfqInvitation(data);
      case 'PO_APPROVAL_REQUEST':   return this.templatePoApprovalRequest(data);
      case 'PO_APPROVED':           return this.templatePoApproved(data);
      // ── Magic Link ──
      case 'RFQ_MAGIC_LINK':        return this.templateRfqMagicLink(data);
      case 'PR_APPROVAL_LINK':      return this.templatePrApprovalLink(data);
      case 'PO_CONFIRM_LINK':       return this.templatePoConfirmLink(data);
      case 'GRN_MILESTONE_UPDATE':  return this.templateGrnMilestoneUpdate(data);
      case 'INVOICE_SUBMIT_LINK':   return this.templateInvoiceSubmitLink(data);
      case 'PAYMENT_CONFIRMED':     return this.templatePaymentConfirmed(data);
      default:                      return this.templateGeneric(data);
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // MAGIC LINK 1 — RFQ_MAGIC_LINK
  // NCC báo giá qua link, không cần tài khoản
  //
  // data: {
  //   rfqCode, rfqTitle, supplierName, rfqLink,
  //   deadline (string|Date), contactPerson, contactEmail,
  //   paymentTerms?,
  //   items: [{ name, qty, unit }]
  // }
  // ═══════════════════════════════════════════════════════════════════════════
  private templateRfqMagicLink(data: Record<string, any>): string {
    const rfqCode      = data.rfqCode      ?? '';
    const rfqTitle     = data.rfqTitle     ?? '';
    const supplierName = data.supplierName ?? 'Quý đối tác';
    const rfqLink      = data.rfqLink      ?? '#';
    const deadline     = data.deadline     ? this.fmtDate(data.deadline) : '';
    const contactName  = data.contactPerson ?? '';
    const contactEmail = data.contactEmail  ?? '';
    const payTerms     = data.paymentTerms  ?? '';
    const items: Array<{ name: string; qty: number; unit: string }> = data.items ?? [];

    const rows = items.map((item, i) => `
      <tr>
        <td>${i + 1}</td>
        <td>${item.name}</td>
        <td style="text-align:center">${item.qty}</td>
        <td style="text-align:center">${item.unit}</td>
      </tr>`).join('');

    const content = `
      <div class="header">
        <div class="header-label">${rfqCode}</div>
        <h1>Mời báo giá hàng hóa</h1>
      </div>
      <div class="body">
        <p>Xin chào <strong>${supplierName}</strong>,</p>
        <p>Chúng tôi trân trọng mời quý vị báo giá cho yêu cầu <strong>${rfqTitle}</strong>.
           Vui lòng nhấn <em>Báo Giá Ngay</em> — <strong>không cần tài khoản hay đăng nhập</strong>.</p>

        <table class="info-table">
          <thead>
            <tr>
              <td><strong>#</strong></td>
              <td><strong>Mặt hàng</strong></td>
              <td style="text-align:center"><strong>Số lượng</strong></td>
              <td style="text-align:center"><strong>Đơn vị</strong></td>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>

        <div class="btn-wrap">
          <a href="${rfqLink}" class="btn">Báo Giá Ngay</a>
        </div>
        <p style="text-align:center;font-size:12px;color:#aaa;margin-top:8px">
          Link hết hạn lúc 23:59 ngày ${deadline} · Chỉ dùng được 1 lần
        </p>

        <hr class="divider"/>

        <table class="info-table">
          ${contactName  ? `<tr><td>Người liên hệ</td><td>${contactName} · ${contactEmail}</td></tr>` : ''}
          ${deadline     ? `<tr><td>Hạn chót</td><td>${deadline}</td></tr>` : ''}
          ${payTerms     ? `<tr><td>Điều kiện TT</td><td>${payTerms}</td></tr>` : ''}
        </table>
      </div>
      <div class="footer">
        Nếu link không hoạt động, hãy trả lời email này hoặc liên hệ ${contactEmail}<br/>
        Đây là email tự động từ hệ thống SPMS
      </div>`;

    return this.base('#1d4ed8', content);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // MAGIC LINK 2 — PR_APPROVAL_LINK
  // Approver duyệt PR qua email, không cần vào hệ thống
  //
  // data: {
  //   prCode, prTitle, approverName, requesterName, requesterDept,
  //   totalAmount (number), remainingBudget (number), justification,
  //   slaDeadline (string|Date),
  //   approveLink, rejectLink, detailLink
  // }
  // ═══════════════════════════════════════════════════════════════════════════
  private templatePrApprovalLink(data: Record<string, any>): string {
    const prCode          = data.prCode          ?? '';
    const prTitle         = data.prTitle         ?? '';
    const approverName    = data.approverName    ?? '';
    const requesterName   = data.requesterName   ?? '';
    const requesterDept   = data.requesterDept   ?? '';
    const totalAmount     = Number(data.totalAmount     ?? 0);
    const remainingBudget = Number(data.remainingBudget ?? 0);
    const justification   = data.justification   ?? '';
    const slaDeadline     = data.slaDeadline     ? this.fmtDate(data.slaDeadline) : '';
    const approveLink     = data.approveLink     ?? '#';
    const rejectLink      = data.rejectLink      ?? '#';
    const detailLink      = data.detailLink      ?? '#';

    const content = `
      <div class="header">
        <div class="header-label">Cần phê duyệt</div>
        <h1>${prCode} đang chờ duyệt</h1>
      </div>
      <div class="body">
        <p>Xin chào <strong>${approverName}</strong>,</p>
        <p>Có một yêu cầu mua hàng cần bạn phê duyệt. Xem thông tin bên dưới và chọn hành động.</p>

        <table class="info-table">
          <tr><td>Tiêu đề PR</td><td>${prTitle}</td></tr>
          <tr><td>Người yêu cầu</td><td>${requesterName} · ${requesterDept}</td></tr>
          <tr><td>Tổng giá trị</td><td><strong style="color:#1d4ed8">${this.fmt(totalAmount)}</strong></td></tr>
          <tr><td>Ngân sách còn lại</td><td><strong style="color:#059669">${this.fmt(remainingBudget)}</strong></td></tr>
          <tr><td>Lý do yêu cầu</td><td>${justification}</td></tr>
        </table>

        <div class="alert">
          ⚠️ SLA: Vui lòng phê duyệt trước <strong>${slaDeadline}</strong>.
          Quá giờ hệ thống sẽ tự động chuyển lên cấp trên.
        </div>

        <div class="btn-wrap" style="display:flex;gap:10px;justify-content:center">
          <a href="${approveLink}" class="btn" style="background:#16a34a">✅ Phê Duyệt</a>
          <a href="${rejectLink}"  class="btn" style="background:#dc2626">❌ Từ Chối</a>
        </div>
        <p style="text-align:center;margin-top:12px">
          <a href="${detailLink}" style="font-size:13px;color:#6b7280">Xem chi tiết đầy đủ →</a>
        </p>
      </div>
      <div class="footer">
        Không cần đăng nhập hệ thống · Link hết hạn sau 48 giờ<br/>
        Nếu bạn đã xử lý, hãy bỏ qua email này
      </div>`;

    return this.base('#7c3aed', content);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // MAGIC LINK 3 — PO_CONFIRM_LINK
  // NCC xác nhận nhận PO + file PDF đính kèm
  //
  // data: {
  //   poCode, supplierName, confirmLink, poPdfUrl,
  //   issuedDate, deliveryDate (string|Date),
  //   deliveryAddress, paymentTerms, latePenaltyPct (number),
  //   contactEmail, contactPhone, totalAmount (number),
  //   items: [{ name, qty, unitPrice, total }]
  // }
  // ═══════════════════════════════════════════════════════════════════════════
  private templatePoConfirmLink(data: Record<string, any>): string {
    const poCode         = data.poCode         ?? '';
    const supplierName   = data.supplierName   ?? 'Quý đối tác';
    const confirmLink    = data.confirmLink    ?? '#';
    const poPdfUrl       = data.poPdfUrl       ?? '#';
    const issuedDate     = data.issuedDate     ? this.fmtDate(data.issuedDate)   : '';
    const deliveryDate   = data.deliveryDate   ? this.fmtDate(data.deliveryDate) : '';
    const deliveryAddr   = data.deliveryAddress ?? '';
    const paymentTerms   = data.paymentTerms   ?? '';
    const penalty        = Number(data.latePenaltyPct ?? 0.1);
    const contactEmail   = data.contactEmail   ?? '';
    const contactPhone   = data.contactPhone   ?? '';
    const totalAmount    = Number(data.totalAmount ?? 0);
    const items: Array<{ name: string; qty: number; unitPrice: number; total: number }> = data.items ?? [];

    const rows = items.map(item => `
      <tr>
        <td>${item.name}</td>
        <td style="text-align:center">${item.qty}</td>
        <td style="text-align:right">${this.fmt(item.unitPrice)}</td>
        <td style="text-align:right">${this.fmt(item.total)}</td>
      </tr>`).join('');

    const content = `
      <div class="header">
        <div class="header-label">${poCode}</div>
        <h1>Đơn mua hàng chính thức</h1>
      </div>
      <div class="body">
        <p>Kính gửi <strong>${supplierName}</strong>,</p>
        <p>Chúng tôi trân trọng gửi đơn mua hàng chính thức. Vui lòng xác nhận đã nhận và có thể thực hiện đơn hàng.</p>

        <table class="info-table">
          <thead>
            <tr>
              <td><strong>Mặt hàng</strong></td>
              <td style="text-align:center"><strong>SL</strong></td>
              <td style="text-align:right"><strong>Đơn giá</strong></td>
              <td style="text-align:right"><strong>Thành tiền</strong></td>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
        <p style="text-align:right;font-size:13px">
          Tổng cộng (chưa VAT): <strong style="font-size:15px">${this.fmt(totalAmount)}</strong>
        </p>

        <hr class="divider"/>

        <table class="info-table">
          <tr><td>Ngày phát hành</td><td>${issuedDate}</td></tr>
          <tr><td>Giao hàng trước</td><td>${deliveryDate}</td></tr>
          <tr><td>Địa chỉ giao</td><td>${deliveryAddr}</td></tr>
          <tr><td>Điều kiện TT</td><td>${paymentTerms}</td></tr>
          <tr><td>Phạt giao trễ</td><td>${penalty}%/ngày, tối đa 30 ngày</td></tr>
        </table>

        <div class="alert" style="background:#f0fdf4;border-color:#16a34a;color:#166534">
          📄 File PDF đính kèm đầy đủ điều khoản.
          <a href="${poPdfUrl}" style="color:#0f766e;margin-left:4px">Tải file PDF PO →</a>
        </div>

        <div class="btn-wrap">
          <a href="${confirmLink}" class="btn">Xác Nhận Nhận PO</a>
        </div>
        <p style="text-align:center;font-size:12px;color:#aaa;margin-top:8px">
          Không cần đăng nhập · Link hết hạn sau 7 ngày
        </p>
      </div>
      <div class="footer">
        Liên hệ: ${contactEmail} · ĐT: ${contactPhone}
      </div>`;

    return this.base('#0f766e', content);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // MAGIC LINK 4 — GRN_MILESTONE_UPDATE
  // NCC cập nhật trạng thái giao hàng (không cần đăng nhập)
  //
  // data: {
  //   poCode, supplierName, updateLink, warehouseEmail,
  //   expectedDelivery (string|Date),
  //   completedSteps: string[],
  //   currentStep: string,
  //   pendingSteps: string[]
  // }
  // ═══════════════════════════════════════════════════════════════════════════
  private templateGrnMilestoneUpdate(data: Record<string, any>): string {
    const poCode         = data.poCode         ?? '';
    const supplierName   = data.supplierName   ?? 'Quý đối tác';
    const updateLink     = data.updateLink     ?? '#';
    const warehouseEmail = data.warehouseEmail ?? '';
    const expectedDel    = data.expectedDelivery ? this.fmtDate(data.expectedDelivery) : '';
    const completedSteps: string[] = data.completedSteps ?? [];
    const currentStep:    string   = data.currentStep    ?? '';
    const pendingSteps:   string[] = data.pendingSteps   ?? [];

    const doneItems = completedSteps.map(s => `
      <tr>
        <td style="padding:7px 12px;color:#059669">
          <span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:#059669;margin-right:8px;vertical-align:middle"></span>${s}
        </td>
      </tr>`).join('');

    const activeItem = `
      <tr style="background:#eff6ff">
        <td style="padding:7px 12px;color:#1d4ed8;font-weight:bold">
          <span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:#1d4ed8;margin-right:8px;vertical-align:middle"></span>${currentStep} — Cần cập nhật
        </td>
      </tr>`;

    const pendingItems = pendingSteps.map(s => `
      <tr>
        <td style="padding:7px 12px;color:#9ca3af">
          <span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:#d1d5db;margin-right:8px;vertical-align:middle"></span>${s}
        </td>
      </tr>`).join('');

    const content = `
      <div class="header">
        <div class="header-label">Shipment Tracking</div>
        <h1>Cập nhật giao hàng<br/>${poCode}</h1>
      </div>
      <div class="body">
        <p>Kính gửi <strong>${supplierName}</strong>,</p>
        <p>Vui lòng cập nhật trạng thái giao hàng cho đơn <strong>${poCode}</strong> bằng cách nhấn nút bên dưới.</p>

        <table style="width:100%;border-collapse:collapse;margin:12px 0 16px">
          ${doneItems}
          ${activeItem}
          ${pendingItems}
        </table>

        <table class="info-table">
          <tr><td>Ngày giao dự kiến</td><td>${expectedDel}</td></tr>
        </table>

        <div class="btn-wrap">
          <a href="${updateLink}" class="btn">Cập Nhật Trạng Thái</a>
        </div>
        <p style="text-align:center;font-size:12px;color:#aaa;margin-top:8px">
          Nhập số vận đơn, đơn vị vận chuyển, ngày giao dự kiến · Không cần tài khoản
        </p>

        <div class="alert">
          ✉️ Sau khi cập nhật, bộ phận kho hàng sẽ nhận thông báo tự động để chuẩn bị tiếp nhận.
        </div>
      </div>
      <div class="footer">
        Cập nhật trạng thái giúp giảm thiểu liên lạc qua lại · Liên hệ kho: ${warehouseEmail}
      </div>`;

    return this.base('#b45309', content);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // MAGIC LINK 5 — INVOICE_SUBMIT_LINK
  // NCC nộp hóa đơn sau khi GRN xác nhận
  //
  // data: {
  //   poCode, grnCode, supplierName, submitLink, financeEmail,
  //   grnConfirmedAt (string|Date), poAmount (number), grnPercent (number),
  //   paymentTerms, estimatedPaymentDate (string|Date), financeContact
  // }
  // ═══════════════════════════════════════════════════════════════════════════
  private templateInvoiceSubmitLink(data: Record<string, any>): string {
    const poCode          = data.poCode          ?? '';
    const grnCode         = data.grnCode         ?? '';
    const supplierName    = data.supplierName    ?? 'Quý đối tác';
    const submitLink      = data.submitLink      ?? '#';
    const financeEmail    = data.financeEmail    ?? '';
    const grnConfirmedAt  = data.grnConfirmedAt  ? this.fmtDate(data.grnConfirmedAt)      : '';
    const poAmount        = Number(data.poAmount ?? 0);
    const grnPercent      = Number(data.grnPercent ?? 100);
    const paymentTerms    = data.paymentTerms    ?? '';
    const estPayDate      = data.estimatedPaymentDate ? this.fmtDate(data.estimatedPaymentDate) : '';
    const financeContact  = data.financeContact  ?? '';

    const content = `
      <div class="header">
        <div class="header-label">Nộp hóa đơn</div>
        <h1>GRN xác nhận — Sẵn sàng nhận invoice</h1>
      </div>
      <div class="body">
        <p>Kính gửi <strong>${supplierName}</strong>,</p>
        <p>Chúng tôi đã xác nhận nhận hàng cho đơn <strong>${poCode}</strong> (${grnCode}) vào ngày ${grnConfirmedAt}. Vui lòng nộp hóa đơn qua link bên dưới.</p>

        <table class="info-table">
          <tr>
            <td>Giá trị PO</td>
            <td><strong style="color:#166534">${this.fmt(poAmount)}</strong></td>
          </tr>
          <tr>
            <td>GRN xác nhận</td>
            <td><strong style="color:#166534">${grnPercent}% — Đủ số lượng</strong></td>
          </tr>
        </table>

        <p style="margin:8px 0">
          <span style="display:inline-block;background:#dcfce7;color:#166534;font-size:11px;font-weight:bold;padding:3px 10px;border-radius:4px;margin-right:6px">3-Way Match sẵn sàng</span>
          <span style="display:inline-block;background:#dbeafe;color:#1e40af;font-size:11px;font-weight:bold;padding:3px 10px;border-radius:4px">Hệ thống tự động đối chiếu</span>
        </p>

        <div class="alert" style="background:#eff6ff;border-color:#1d4ed8;color:#1e3a8a">
          📋 Vui lòng upload file PDF hóa đơn VAT và điền số tiền đúng với PO.
          Hệ thống sẽ tự động đối chiếu PO ↔ GRN ↔ Invoice.
        </div>

        <div class="btn-wrap">
          <a href="${submitLink}" class="btn">Nộp Hóa Đơn Ngay</a>
        </div>
        <p style="text-align:center;font-size:12px;color:#aaa;margin-top:8px">
          Upload PDF invoice + điền số tiền · Không cần đăng nhập · Link hết hạn sau 14 ngày
        </p>

        <hr class="divider"/>

        <table class="info-table">
          <tr><td>Điều kiện TT</td><td>${paymentTerms}</td></tr>
          <tr><td>Hạn TT dự kiến</td><td>${estPayDate}</td></tr>
          <tr><td>Người xử lý</td><td>${financeContact} · ${financeEmail}</td></tr>
        </table>
      </div>
      <div class="footer">
        Hệ thống tự đối chiếu 3 chiều PO ↔ GRN ↔ Invoice · Nếu sai lệch sẽ tạo dispute ticket tự động
      </div>`;

    return this.base('#1e40af', content);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // MAGIC LINK 6 — PAYMENT_CONFIRMED
  // Xác nhận đã thanh toán thành công cho NCC
  //
  // data: {
  //   paymentCode, invoiceCode, poCode, supplierName,
  //   amount (number), bankRef, paidAt (string|Date),
  //   paymentMethod, historyLink, financeEmail, financePhone
  // }
  // ═══════════════════════════════════════════════════════════════════════════
  private templatePaymentConfirmed(data: Record<string, any>): string {
    const paymentCode   = data.paymentCode   ?? '';
    const invoiceCode   = data.invoiceCode   ?? '';
    const poCode        = data.poCode        ?? '';
    const supplierName  = data.supplierName  ?? 'Quý đối tác';
    const amount        = Number(data.amount ?? 0);
    const bankRef       = data.bankRef       ?? '';
    const paidAt        = data.paidAt        ? this.fmtDate(data.paidAt) : '';
    const paymentMethod = data.paymentMethod ?? 'Chuyển khoản ngân hàng';
    const historyLink   = data.historyLink   ?? '#';
    const financeEmail  = data.financeEmail  ?? '';
    const financePhone  = data.financePhone  ?? '';

    const content = `
      <div class="header">
        <div class="header-label">Thanh toán thành công</div>
        <h1>Đã chuyển khoản thành công</h1>
      </div>
      <div class="body">
        <p>Kính gửi <strong>${supplierName}</strong>,</p>
        <p>Chúng tôi xác nhận đã thực hiện thanh toán thành công. Vui lòng kiểm tra tài khoản trong vòng 1–2 ngày làm việc.</p>

        <div style="background:#f0fdf4;border-radius:8px;padding:20px;text-align:center;margin:16px 0">
          <div style="font-size:12px;color:#6b7280;margin-bottom:4px">Số tiền đã thanh toán</div>
          <div style="font-size:28px;font-weight:bold;color:#065f46">${this.fmt(amount)}</div>
          <div style="font-size:12px;color:#6b7280;margin-top:4px">Bao gồm VAT 10%</div>
        </div>

        <table class="info-table">
          <tr><td>Mã thanh toán</td><td>${paymentCode}</td></tr>
          <tr><td>Hóa đơn</td><td>${invoiceCode}</td></tr>
          <tr><td>Đơn mua hàng</td><td>${poCode}</td></tr>
          <tr><td>Phương thức</td><td>${paymentMethod}</td></tr>
          <tr><td>Mã GD ngân hàng</td><td>${bankRef}</td></tr>
          <tr><td>Ngày thanh toán</td><td>${paidAt}</td></tr>
        </table>

        <div class="alert" style="background:#f0fdf4;border-color:#16a34a;color:#166534">
          ✓ Dữ liệu đã được đồng bộ tự động vào hệ thống kế toán MISA.
          Vui lòng đối chiếu sao kê nếu cần.
        </div>

        <div class="btn-wrap">
          <a href="${historyLink}" class="btn">Xem Lịch Sử Giao Dịch</a>
        </div>

        <hr class="divider"/>

        <p style="font-size:13px;color:#999">
          Nếu sau 3 ngày làm việc chưa nhận được tiền, vui lòng liên hệ
          <strong>${financeEmail}</strong> hoặc gọi ${financePhone}.
          Ghi rõ mã <strong>${paymentCode}</strong> khi liên hệ.
        </p>
      </div>
      <div class="footer">
        Cảm ơn quý vị đã hợp tác · Hệ thống SPMS<br/>
        Đây là email tự động, vui lòng không reply trực tiếp
      </div>`;

    return this.base('#065f46', content);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // CÁC TEMPLATE CŨ — giữ nguyên
  // ═══════════════════════════════════════════════════════════════════════════

  private templateRfqInvitation(data: Record<string, any>): string {
    const rfqNumber    = data.rfqNumber    ?? '';
    const rfqTitle     = data.rfqTitle     ?? '';
    const deadline     = data.deadline     ?? '';
    const itemsSummary = data.itemsSummary ?? '';

    const content = `
      <div class="header">
        <div class="header-label">Lời mời báo giá</div>
        <h1>Yêu cầu báo giá mới</h1>
      </div>
      <div class="body">
        <p>Kính gửi Quý đối tác,</p>
        <p>Công ty chúng tôi trân trọng kính mời Quý đối tác gửi báo giá cho yêu cầu: <b>${rfqTitle}</b> (Mã: <b>${rfqNumber}</b>).</p>
        <table class="info-table">
          <tr><td>Hạn cuối</td><td>${deadline}</td></tr>
        </table>
        <p><b>Danh sách hàng hóa:</b></p>
        <p style="font-size: 14px; color: #666;">${itemsSummary}</p>
        <div class="btn-wrap">
          <a href="#" class="btn">Xem chi tiết & Gửi báo giá</a>
        </div>
      </div>`;
    return this.base('#0d9488', content);
  }

  private templatePoApprovalRequest(data: Record<string, any>): string {
    const poNumber    = data.poNumber    ?? '';
    const supplierName = data.supplierName ?? '';
    const totalAmount = data.totalAmount ?? '0';
    const currency    = data.currency    ?? 'VND';

    const content = `
      <div class="header">
        <div class="header-label">Phê duyệt đơn hàng</div>
        <h1>Cần phê duyệt PO: ${poNumber}</h1>
      </div>
      <div class="body">
        <p>Chào bạn, bạn có một đơn hàng mới cần phê duyệt gấp.</p>
        <table class="info-table">
          <tr><td>Số PO</td><td>${poNumber}</td></tr>
          <tr><td>Nhà cung cấp</td><td>${supplierName}</td></tr>
          <tr><td>Giá trị</td><td>${totalAmount} ${currency}</td></tr>
        </table>
        <div class="btn-wrap">
          <a href="#" class="btn">Phê duyệt ngay</a>
        </div>
      </div>`;
    return this.base('#f59e0b', content);
  }

  private templatePoApproved(data: Record<string, any>): string {
    const poNumber = data.poNumber ?? '';
    const content = `
      <div class="header">
        <div class="header-label">Phê duyệt thành công</div>
        <h1>PO ${poNumber} đã được phê duyệt</h1>
      </div>
      <div class="body">
        <p>Chúc mừng, đơn hàng <b>${poNumber}</b> đã được phê duyệt thành công bởi bộ phận quản lý.</p>
        <p>Hệ thống sẽ tiến hành gửi PO này tới nhà cung cấp ngay lập tức.</p>
      </div>`;
    return this.base('#0d7c4e', content);
  }

  private templateWelcomeBack(data: Record<string, any>): string {
    const name     = data.name    ?? 'bạn';
    const time     = data.loginAt ?? new Date().toLocaleString('vi-VN');
    const device   = data.device  ?? 'Không xác định';
    const location = data.location ?? 'Không xác định';
    const dashUrl  = data.dashUrl  ?? '#';

    const content = `
      <div class="header">
        <div class="header-label">Đăng nhập thành công</div>
        <h1>Chào mừng trở lại,<br/>${name} 👋</h1>
      </div>
      <div class="body">
        <p>Chúng tôi ghi nhận một phiên đăng nhập mới vào tài khoản của bạn.</p>
        <table class="info-table">
          <tr><td>Thời gian</td><td>${time}</td></tr>
          <tr><td>Thiết bị</td><td>${device}</td></tr>
          <tr><td>Vị trí</td><td>${location}</td></tr>
        </table>
        <div class="alert">
          ⚠️ Nếu bạn <strong>không thực hiện</strong> đăng nhập này, hãy đổi mật khẩu ngay lập tức và liên hệ quản trị viên.
        </div>
        <div class="btn-wrap">
          <a href="${dashUrl}" class="btn">Vào Dashboard</a>
        </div>
      </div>
      <div class="footer">
        Email này được gửi tự động khi có đăng nhập mới.<br/>
        <a href="#">Quản lý thông báo</a> &nbsp;·&nbsp; <a href="#">Hỗ trợ</a>
      </div>`;
    return this.base('#0f4c81', content);
  }

  private templateNewMember(data: Record<string, any>): string {
    const name      = data.name         ?? 'bạn';
    const email     = data.email        ?? '';
    const role      = data.role         ?? 'Member';
    const org       = data.orgName      ?? 'Hệ thống';
    const loginUrl  = data.loginUrl     ?? '#';
    const tempPass  = data.tempPassword;

    const content = `
      <div class="header">
        <div class="header-label">Chào mừng thành viên mới</div>
        <h1>Xin chào,<br/>${name}! 🎉</h1>
      </div>
      <div class="body">
        <p>Tài khoản của bạn đã được tạo thành công trong hệ thống <strong>${org}</strong>.</p>
        <table class="info-table">
          <tr><td>Họ tên</td><td>${name}</td></tr>
          <tr><td>Email</td><td>${email}</td></tr>
          <tr><td>Vai trò</td><td>${role}</td></tr>
          <tr><td>Tổ chức</td><td>${org}</td></tr>
          ${tempPass ? `<tr><td>Mật khẩu tạm</td><td><strong>${tempPass}</strong></td></tr>` : ''}
        </table>
        ${tempPass ? `<div class="alert">🔐 Đây là mật khẩu tạm thời. Vui lòng <strong>đổi mật khẩu ngay</strong> sau khi đăng nhập lần đầu.</div>` : ''}
        <div class="btn-wrap">
          <a href="${loginUrl}" class="btn">Đăng nhập ngay</a>
        </div>
        <hr class="divider"/>
        <p style="font-size:13px;color:#999;text-align:center">
          Cần hỗ trợ? Liên hệ quản trị viên hệ thống hoặc reply email này.
        </p>
      </div>
      <div class="footer">
        Bạn nhận email này vì tài khoản vừa được tạo trong hệ thống.<br/>
        <a href="#">Chính sách bảo mật</a> &nbsp;·&nbsp; <a href="#">Hỗ trợ</a>
      </div>`;
    return this.base('#0d7c4e', content);
  }

  private templateGeneric(data: Record<string, any>): string {
    const title   = data.title   ?? 'Thông báo hệ thống';
    const message = data.message ?? '';
    const content = `
      <div class="header">
        <div class="header-label">Thông báo</div>
        <h1>${title}</h1>
      </div>
      <div class="body">
        <p>${message}</p>
      </div>
      <div class="footer">© 2025 Order Management System</div>`;
    return this.base('#334155', content);
  }

  // ─────────────────────────────────────────────────────────────
  // Base layout — giữ nguyên 100% từ file gốc
  // ─────────────────────────────────────────────────────────────
  private base(accentColor: string, content: string): string {
    return `
<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>OMS Notification</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600&family=DM+Serif+Display&display=swap');
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      background: #f0f2f5;
      font-family: 'DM Sans', sans-serif;
      color: #1a1a2e;
      padding: 40px 16px;
    }
    .wrapper { max-width: 560px; margin: 0 auto; }
    .card {
      background: #ffffff;
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 4px 24px rgba(0,0,0,0.08);
    }
    .header {
      background: ${accentColor};
      padding: 36px 40px 32px;
      position: relative;
      overflow: hidden;
    }
    .header::after {
      content: '';
      position: absolute;
      bottom: -40px; right: -40px;
      width: 140px; height: 140px;
      border-radius: 50%;
      background: rgba(255,255,255,0.08);
    }
    .header-label {
      font-size: 11px;
      font-weight: 600;
      letter-spacing: 3px;
      text-transform: uppercase;
      color: rgba(255,255,255,0.65);
      margin-bottom: 8px;
    }
    .header h1 {
      font-family: 'DM Serif Display', serif;
      font-size: 28px;
      color: #ffffff;
      line-height: 1.25;
    }
    .body { padding: 36px 40px; }
    .body p { font-size: 15px; line-height: 1.7; color: #444; margin-bottom: 16px; }
    .body p:last-child { margin-bottom: 0; }
    .info-table { width: 100%; border-collapse: collapse; margin: 20px 0; }
    .info-table td {
      padding: 10px 14px;
      font-size: 14px;
      border-bottom: 1px solid #f0f0f0;
      vertical-align: top;
    }
    .info-table td:first-child {
      font-weight: 600;
      color: #888;
      width: 38%;
      white-space: nowrap;
    }
    .btn-wrap { text-align: center; margin: 28px 0 8px; }
    .btn {
      display: inline-block;
      padding: 14px 36px;
      background: ${accentColor};
      color: #ffffff !important;
      text-decoration: none;
      border-radius: 50px;
      font-weight: 600;
      font-size: 15px;
      letter-spacing: 0.3px;
    }
    .divider { border: none; border-top: 1px solid #f0f0f0; margin: 24px 0; }
    .alert {
      background: #fff8e1;
      border-left: 4px solid #f59e0b;
      border-radius: 0 8px 8px 0;
      padding: 12px 16px;
      font-size: 13px;
      color: #78350f;
      margin: 20px 0;
      line-height: 1.6;
    }
    .footer {
      padding: 20px 40px 28px;
      text-align: center;
      font-size: 12px;
      color: #aaa;
      line-height: 1.7;
      background: #fafafa;
      border-top: 1px solid #f0f0f0;
    }
    .footer a { color: #aaa; text-decoration: underline; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="card">
      ${content}
    </div>
    <p style="text-align:center; margin-top:20px; font-size:12px; color:#bbb;">
      © 2025 Order Management System &nbsp;·&nbsp; Email tự động, vui lòng không reply.
    </p>
  </div>
</body>
</html>`;
  }
}