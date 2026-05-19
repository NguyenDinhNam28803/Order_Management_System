// Notification Types for Client
// Maps to server email templates (email-template.service.ts)

export type EmailEventType =
  // ── Account ──────────────────────────────────────────────────────────────
  | 'USER_LOGIN'
  | 'USER_REGISTERED'
  | 'NEW_USER_ACCOUNT'
  // ── Procurement flow ─────────────────────────────────────────────────────
  | 'RFQ_INVITATION'
  | 'RFQ_MAGIC_LINK'
  | 'QUOTATION_RECEIVED'
  | 'PO_APPROVAL_REQUEST'
  | 'PO_APPROVED'
  | 'PO_CONFIRM_LINK'
  // ── PR ───────────────────────────────────────────────────────────────────
  | 'PR_APPROVED'
  | 'PR_REJECTED'
  | 'PR_APPROVAL_LINK'
  // ── Warehouse / GRN ───────────────────────────────────────────────────────
  | 'GRN_CONFIRMED'
  | 'GRN_MILESTONE_UPDATE'
  // ── Finance ───────────────────────────────────────────────────────────────
  | 'INVOICE_RECEIVED'
  | 'INVOICE_SUBMIT_LINK'
  | 'PAYMENT_CONFIRMED'
  // ── Alerts ────────────────────────────────────────────────────────────────
  | 'CONTRACT_EXPIRY_WARNING'
  | 'BUDGET_LIMIT_WARNING';

// ── Per-event display config (used by NotificationInbox) ──────────────────
export interface EventDisplayConfig {
  label: string;
  colorClass: string;      // Tailwind text color
  bgClass: string;         // Tailwind bg color
  borderClass: string;     // Tailwind border color
  accentHex: string;       // Raw hex for inline styles
}

export const EVENT_DISPLAY_CONFIG: Record<EmailEventType, EventDisplayConfig> = {
  USER_LOGIN:               { label: 'Đăng nhập',          colorClass: 'text-[#CB7A62]',    bgClass: 'bg-[#B4533A]/10',    borderClass: 'border-[#B4533A]/20',    accentHex: '#B4533A' },
  USER_REGISTERED:          { label: 'Tài khoản mới',      colorClass: 'text-emerald-400', bgClass: 'bg-emerald-500/10', borderClass: 'border-emerald-500/20', accentHex: '#10b981' },
  NEW_USER_ACCOUNT:         { label: 'Tài khoản mới',      colorClass: 'text-emerald-400', bgClass: 'bg-emerald-500/10', borderClass: 'border-emerald-500/20', accentHex: '#10b981' },
  RFQ_INVITATION:           { label: 'Mời báo giá',        colorClass: 'text-teal-400',    bgClass: 'bg-teal-500/10',    borderClass: 'border-teal-500/20',    accentHex: '#14b8a6' },
  RFQ_MAGIC_LINK:           { label: 'Báo giá NCC',        colorClass: 'text-[#CB7A62]',    bgClass: 'bg-[#B4533A]/10',    borderClass: 'border-[#B4533A]/20',    accentHex: '#1d4ed8' },
  QUOTATION_RECEIVED:       { label: 'Nhận báo giá',       colorClass: 'text-[#CB7A62]',    bgClass: 'bg-[#B4533A]/10',    borderClass: 'border-[#B4533A]/20',    accentHex: '#1d4ed8' },
  PO_APPROVAL_REQUEST:      { label: 'Chờ duyệt PO',       colorClass: 'text-amber-400',   bgClass: 'bg-amber-500/10',   borderClass: 'border-amber-500/20',   accentHex: '#f59e0b' },
  PO_APPROVED:              { label: 'PO đã duyệt',        colorClass: 'text-emerald-400', bgClass: 'bg-emerald-500/10', borderClass: 'border-emerald-500/20', accentHex: '#10b981' },
  PO_CONFIRM_LINK:          { label: 'Xác nhận PO',        colorClass: 'text-teal-400',    bgClass: 'bg-teal-500/10',    borderClass: 'border-teal-500/20',    accentHex: '#0f766e' },
  PR_APPROVED:              { label: 'PR đã duyệt',        colorClass: 'text-emerald-400', bgClass: 'bg-emerald-500/10', borderClass: 'border-emerald-500/20', accentHex: '#16a34a' },
  PR_REJECTED:              { label: 'PR bị từ chối',      colorClass: 'text-rose-400',    bgClass: 'bg-rose-500/10',    borderClass: 'border-rose-500/20',    accentHex: '#dc2626' },
  PR_APPROVAL_LINK:         { label: 'Yêu cầu duyệt PR',  colorClass: 'text-violet-400',  bgClass: 'bg-violet-500/10',  borderClass: 'border-violet-500/20',  accentHex: '#7c3aed' },
  GRN_CONFIRMED:            { label: 'Xác nhận nhập kho',  colorClass: 'text-teal-400',    bgClass: 'bg-teal-500/10',    borderClass: 'border-teal-500/20',    accentHex: '#0f766e' },
  GRN_MILESTONE_UPDATE:     { label: 'Cập nhật giao hàng', colorClass: 'text-amber-400',   bgClass: 'bg-amber-500/10',   borderClass: 'border-amber-500/20',   accentHex: '#b45309' },
  INVOICE_RECEIVED:         { label: 'Nhận hóa đơn',       colorClass: 'text-teal-400',    bgClass: 'bg-teal-500/10',    borderClass: 'border-teal-500/20',    accentHex: '#0f766e' },
  INVOICE_SUBMIT_LINK:      { label: 'Nộp hóa đơn',        colorClass: 'text-[#CB7A62]',    bgClass: 'bg-[#B4533A]/10',    borderClass: 'border-[#B4533A]/20',    accentHex: '#1e40af' },
  PAYMENT_CONFIRMED:        { label: 'Thanh toán thành công', colorClass: 'text-emerald-400', bgClass: 'bg-emerald-500/10', borderClass: 'border-emerald-500/20', accentHex: '#065f46' },
  CONTRACT_EXPIRY_WARNING:  { label: 'Hợp đồng sắp hết hạn', colorClass: 'text-amber-400', bgClass: 'bg-amber-500/10',  borderClass: 'border-amber-500/20',   accentHex: '#b45309' },
  BUDGET_LIMIT_WARNING:     { label: 'Cảnh báo ngân sách', colorClass: 'text-amber-400',   bgClass: 'bg-amber-500/10',   borderClass: 'border-amber-500/20',   accentHex: '#f59e0b' },
};

// ── Notification template (admin page) ────────────────────────────────────
export interface NotificationTemplate {
  id: string;
  eventType: EmailEventType;
  name: string;
  description: string;
  subject: string;
  body: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface NotificationPayload {
  recipientId: string;
  recipientEmail: string;
  eventType: EmailEventType;
  data: Record<string, unknown>;
  referenceType?: string;
  referenceId?: string;
}

// ── Per-event data interfaces ──────────────────────────────────────────────

export interface RFQMagicLinkData {
  rfqCode: string;
  rfqTitle: string;
  supplierName: string;
  rfqLink: string;
  deadline: string | Date;
  contactPerson: string;
  contactEmail: string;
  paymentTerms?: string;
  items: Array<{ name: string; qty: number; unit: string }>;
}

export interface PRApprovalLinkData {
  prCode: string;
  prTitle: string;
  approverName: string;
  requesterName: string;
  totalAmount: number;
  remainingBudget: number;
  justification: string;
  slaDeadline: string | Date;
  approveLink: string;
  rejectLink: string;
  detailLink: string;
}

export interface PRApprovedData {
  prCode: string;
  prTitle: string;
  requesterName: string;
  approverName: string;
  totalAmount: number;
  detailLink?: string;
}

export interface PRRejectedData {
  prCode: string;
  prTitle: string;
  requesterName: string;
  approverName: string;
  reason: string;
  detailLink?: string;
}

export interface POConfirmLinkData {
  poCode: string;
  supplierName: string;
  confirmLink: string;
  poPdfUrl: string;
  orderDate: string | Date;
  deliveryDate: string | Date;
  deliveryAddress: string;
  paymentTerms: string;
  contactName: string;
  contactEmail: string;
  totalAmount: number;
  items: Array<{ name: string; qty: number; unit: string; price: number }>;
}

export interface QuotationReceivedData {
  rfqCode: string;
  supplierName: string;
  totalAmount: number;
  itemCount: number;
  detailLink?: string;
}

export interface GrnMilestoneUpdateData {
  poCode: string;
  supplierName: string;
  updateLink: string;
  completedSteps: string[];
  currentStep: string;
  pendingSteps: string[];
}

export interface GrnConfirmedData {
  grnCode: string;
  poCode: string;
  warehouseStaff: string;
  totalReceived: number;
  detailLink?: string;
}

export interface InvoiceSubmitLinkData {
  poCode: string;
  grnCode: string;
  submitLink: string;
  poAmount: number;
  grnPercent: number;
  grnAmount: number;
  supplierName: string;
}

export interface InvoiceReceivedData {
  invoiceCode: string;
  supplierName: string;
  amount: number;
  poCode: string;
  detailLink?: string;
}

export interface PaymentConfirmedData {
  paymentCode: string;
  poCode: string;
  amount: number;
  vatAmount: number;
  totalWithVat: number;
  bankRef: string;
  paidAt: string | Date;
}

export interface ContractExpiryWarningData {
  contractCode: string;
  supplierName: string;
  expiryDate: string | Date;
  daysRemaining: number;
  detailLink?: string;
}

export interface BudgetLimitWarningData {
  departmentName: string;
  budgetCode: string;
  totalBudget: number;
  usedAmount: number;
  usedPercent: number;
  remainingAmount: number;
}

export type TemplateData =
  | RFQMagicLinkData
  | PRApprovalLinkData
  | PRApprovedData
  | PRRejectedData
  | POConfirmLinkData
  | QuotationReceivedData
  | GrnMilestoneUpdateData
  | GrnConfirmedData
  | InvoiceSubmitLinkData
  | InvoiceReceivedData
  | PaymentConfirmedData
  | ContractExpiryWarningData
  | BudgetLimitWarningData
  | Record<string, unknown>;
