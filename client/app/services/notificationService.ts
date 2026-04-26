/**
 * Notification Service for Client
 * Handles email templates and notification rendering
 */

import { EmailEventType, NotificationTemplate, NotificationPayload, TemplateData } from "../types/notification-types";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export interface RenderTemplateRequest {
  eventType: EmailEventType;
  data: TemplateData;
}

export interface RenderTemplateResponse {
  subject: string;
  html: string;
}

export interface SendNotificationRequest {
  recipientId: string;
  eventType: EmailEventType;
  data: TemplateData;
  referenceType?: string;
  referenceId?: string;
}

/**
 * Fetch all notification templates
 */
export async function fetchNotificationTemplates(): Promise<NotificationTemplate[]> {
  const response = await fetch(`${API_BASE}/notifications/templates`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
  });

  if (!response.ok) {
    throw new Error('Failed to fetch notification templates');
  }

  return response.json();
}

/**
 * Render email template with data
 */
export async function renderTemplate(
  eventType: EmailEventType,
  data: TemplateData
): Promise<RenderTemplateResponse> {
  const response = await fetch(`${API_BASE}/notifications/render`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify({ eventType, data }),
  });

  if (!response.ok) {
    throw new Error('Failed to render template');
  }

  return response.json();
}

/**
 * Send notification
 */
export async function sendNotification(
  payload: SendNotificationRequest
): Promise<{ success: boolean; message: string }> {
  const response = await fetch(`${API_BASE}/notifications/send`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error('Failed to send notification');
  }

  return response.json();
}

/**
 * Preview email template (client-side rendering)
 */
export function previewTemplate(
  eventType: EmailEventType,
  data: TemplateData
): { subject: string; html: string } {
  // Client-side preview without API call
  // Basic formatting for preview purposes
  const subject = generateSubject(eventType, data);
  const html = generatePreviewHtml(eventType, data);
  
  return { subject, html };
}

function generateSubject(eventType: EmailEventType, data: TemplateData): string {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const d = data as Record<string, any>;
  
  switch (eventType) {
    case 'RFQ_MAGIC_LINK':
      return `Mời báo giá - ${d.rfqCode || 'RFQ'}`;
    case 'PR_APPROVAL_LINK':
      return `Yêu cầu phê duyệt PR - ${d.prCode || 'PR'}`;
    case 'PO_CONFIRM_LINK':
      return `Xác nhận đơn hàng PO - ${d.poCode || 'PO'}`;
    case 'GRN_MILESTONE_UPDATE':
      return `Cập nhật tiến độ giao hàng - ${d.poCode || 'PO'}`;
    case 'INVOICE_SUBMIT_LINK':
      return `Yêu cầu nộp hóa đơn - ${d.poCode || 'PO'}`;
    case 'PAYMENT_CONFIRMED':
      return `Xác nhận thanh toán - ${d.paymentCode || 'PAYMENT'}`;
    default:
      return 'Thông báo từ hệ thống ProcureSmart';
  }
}

function generatePreviewHtml(eventType: EmailEventType, data: TemplateData): string {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const d = data as Record<string, any>;
  
  // Basic preview styling
  const baseStyles = `
    <style>
      .email-preview { font-family: system-ui, -apple-system, sans-serif; max-width: 600px; margin: 0 auto; }
      .header { background: #1E3A5F; color: white; padding: 20px; text-align: center; }
      .body { padding: 20px; background: #f8fafc; }
      .info-table { width: 100%; border-collapse: collapse; margin: 16px 0; }
      .info-table th, .info-table td { padding: 12px; text-align: left; border-bottom: 1px solid #e2e8f0; }
      .info-table th { background: #f1f5f9; font-weight: 600; }
      .button { display: inline-block; padding: 12px 24px; background: #3B82F6; color: white; 
                text-decoration: none; border-radius: 6px; margin: 8px 4px; }
      .footer { padding: 20px; text-align: center; color: #64748B; font-size: 12px; }
    </style>
  `;

  let content = '';
  
  switch (eventType) {
    case 'RFQ_MAGIC_LINK':
      content = `
        <div class="header">
          <h2>Mời báo giá - ${d.rfqCode || 'RFQ'}</h2>
        </div>
        <div class="body">
          <p>Xin chào <strong>${d.supplierName || 'Quý đối tác'}</strong>,</p>
          <p>Chúng tôi trân trọng mời quý vị báo giá cho yêu cầu <strong>${d.rfqTitle || ''}</strong>.</p>
          <p><strong>Hạn chót:</strong> ${d.deadline || 'N/A'}</p>
          <a href="${d.rfqLink || '#'}" class="button">Báo Giá Ngay</a>
        </div>
      `;
      break;
      
    case 'PR_APPROVAL_LINK':
      content = `
        <div class="header">
          <h2>Yêu cầu phê duyệt PR</h2>
        </div>
        <div class="body">
          <p>Xin chào <strong>${d.approverName || ''}</strong>,</p>
          <p>Bạn có yêu cầu phê duyệt PR <strong>${d.prCode || ''}</strong>.</p>
          <table class="info-table">
            <tr><th>Tiêu đề</th><td>${d.prTitle || ''}</td></tr>
            <tr><th>Người yêu cầu</th><td>${d.requesterName || ''}</td></tr>
            <tr><th>Tổng tiền</th><td>${d.totalAmount?.toLocaleString('vi-VN') || 0} VNĐ</td></tr>
          </table>
          <a href="${d.approveLink || '#'}" class="button" style="background: #10B981;">Phê Duyệt</a>
          <a href="${d.rejectLink || '#'}" class="button" style="background: #EF4444;">Từ Chối</a>
        </div>
      `;
      break;
      
    case 'PO_CONFIRM_LINK':
      content = `
        <div class="header">
          <h2>Xác nhận đơn hàng PO</h2>
        </div>
        <div class="body">
          <p>Xin chào <strong>${d.supplierName || ''}</strong>,</p>
          <p>Vui lòng xác nhận đơn hàng <strong>${d.poCode || ''}</strong>.</p>
          <table class="info-table">
            <tr><th>Tổng tiền</th><td>${d.totalAmount?.toLocaleString('vi-VN') || 0} VNĐ</td></tr>
            <tr><th>Ngày giao</th><td>${d.deliveryDate || 'N/A'}</td></tr>
          </table>
          <a href="${d.confirmLink || '#'}" class="button">Xác Nhận PO</a>
        </div>
      `;
      break;
      
    case 'GRN_MILESTONE_UPDATE':
      content = `
        <div class="header">
          <h2>Cập nhật tiến độ giao hàng</h2>
        </div>
        <div class="body">
          <p>Xin chào <strong>${d.supplierName || ''}</strong>,</p>
          <p>Vui lòng cập nhật trạng thái giao hàng cho đơn <strong>${d.poCode || ''}</strong>.</p>
          <p><strong>Bước hiện tại:</strong> ${d.currentStep || 'N/A'}</p>
          <a href="${d.updateLink || '#'}" class="button">Cập Nhật Trạng Thái</a>
        </div>
      `;
      break;
      
    case 'INVOICE_SUBMIT_LINK':
      content = `
        <div class="header">
          <h2>Nộp hóa đơn</h2>
        </div>
        <div class="body">
          <p>Xin chào <strong>${d.supplierName || ''}</strong>,</p>
          <p>Vui lòng nộp hóa đơn cho đơn hàng <strong>${d.poCode || ''}</strong>.</p>
          <table class="info-table">
            <tr><th>GRN</th><td>${d.grnCode || ''}</td></tr>
            <tr><th>Số tiền</th><td>${d.grnAmount?.toLocaleString('vi-VN') || 0} VNĐ</td></tr>
          </table>
          <a href="${d.submitLink || '#'}" class="button">Nộp Hóa Đơn</a>
        </div>
      `;
      break;
      
    case 'PAYMENT_CONFIRMED':
      content = `
        <div class="header">
          <h2>✓ Xác nhận thanh toán</h2>
        </div>
        <div class="body">
          <p>Thanh toán <strong>${d.paymentCode || ''}</strong> đã được xử lý thành công.</p>
          <table class="info-table">
            <tr><th>Số tiền</th><td><strong style="font-size: 18px; color: #10B981;">${d.totalWithVat?.toLocaleString('vi-VN') || 0} VNĐ</strong></td></tr>
            <tr><th>Mã giao dịch</th><td>${d.bankRef || ''}</td></tr>
            <tr><th>Thời gian</th><td>${d.paidAt || 'N/A'}</td></tr>
          </table>
        </div>
      `;
      break;
      
    default:
      content = `<div class="body"><p>Thông báo từ hệ thống ProcureSmart</p></div>`;
  }
  
  return `<div class="email-preview">${baseStyles}${content}</div>`;
}

/**
 * Get template configuration for event type
 */
export function getTemplateConfig(eventType: EmailEventType): {
  name: string;
  description: string;
  icon: string;
  color: string;
} {
  const configs: Record<EmailEventType, { name: string; description: string; icon: string; color: string }> = {
    'RFQ_MAGIC_LINK': {
      name: 'RFQ Magic Link',
      description: 'Gửi link báo giá cho nhà cung cấp',
      icon: 'MessageSquare',
      color: '#3B82F6',
    },
    'PR_APPROVAL_LINK': {
      name: 'PR Approval Link',
      description: 'Gửi link phê duyệt PR cho approver',
      icon: 'FileCheck',
      color: '#10B981',
    },
    'PO_CONFIRM_LINK': {
      name: 'PO Confirm Link',
      description: 'Gửi link xác nhận PO cho nhà cung cấp',
      icon: 'ShoppingCart',
      color: '#F59E0B',
    },
    'GRN_MILESTONE_UPDATE': {
      name: 'GRN Milestone Update',
      description: 'Gửi link cập nhật tiến độ giao hàng',
      icon: 'Truck',
      color: '#8B5CF6',
    },
    'INVOICE_SUBMIT_LINK': {
      name: 'Invoice Submit Link',
      description: 'Gửi link nộp hóa đơn cho nhà cung cấp',
      icon: 'Receipt',
      color: '#EC4899',
    },
    'PAYMENT_CONFIRMED': {
      name: 'Payment Confirmed',
      description: 'Gửi xác nhận thanh toán',
      icon: 'CreditCard',
      color: '#10B981',
    },
    'USER_LOGIN': {
      name: 'User Login',
      description: 'Thông báo đăng nhập',
      icon: 'User',
      color: '#64748B',
    },
    'USER_REGISTERED': {
      name: 'User Registered',
      description: 'Thông báo đăng ký tài khoản',
      icon: 'UserPlus',
      color: '#64748B',
    },
    'NEW_USER_ACCOUNT': {
      name: 'New User Account',
      description: 'Tài khoản mới tạo',
      icon: 'UserPlus',
      color: '#64748B',
    },
    'RFQ_INVITATION': {
      name: 'RFQ Invitation',
      description: 'Mời tham gia RFQ',
      icon: 'Mail',
      color: '#3B82F6',
    },
    'QUOTATION_RECEIVED': {
      name: 'Quotation Received',
      description: 'Nhận báo giá',
      icon: 'Inbox',
      color: '#3B82F6',
    },
    'PO_APPROVAL_REQUEST': {
      name: 'PO Approval Request',
      description: 'Yêu cầu phê duyệt PO',
      icon: 'FileCheck',
      color: '#F59E0B',
    },
    'PO_APPROVED': {
      name: 'PO Approved',
      description: 'Thông báo PO đã được duyệt',
      icon: 'CheckCircle',
      color: '#10B981',
    },
    'PR_APPROVED': {
      name: 'PR Approved',
      description: 'Thông báo PR đã được duyệt',
      icon: 'CheckCircle',
      color: '#10B981',
    },
    'PR_REJECTED': {
      name: 'PR Rejected',
      description: 'Thông báo PR bị từ chối',
      icon: 'XCircle',
      color: '#EF4444',
    },
    'GRN_CONFIRMED': {
      name: 'GRN Confirmed',
      description: 'Xác nhận nhập kho',
      icon: 'Package',
      color: '#10B981',
    },
    'INVOICE_RECEIVED': {
      name: 'Invoice Received',
      description: 'Nhận hóa đơn',
      icon: 'Receipt',
      color: '#10B981',
    },
    'CONTRACT_EXPIRY_WARNING': {
      name: 'Contract Expiry',
      description: 'Cảnh báo hết hạn hợp đồng',
      icon: 'AlertTriangle',
      color: '#F59E0B',
    },
    'BUDGET_LIMIT_WARNING': {
      name: 'Budget Limit',
      description: 'Cảnh báo ngân sách',
      icon: 'AlertTriangle',
      color: '#F59E0B',
    },
  };
  
  return configs[eventType] || { name: eventType, description: '', icon: 'Mail', color: '#64748B' };
}
