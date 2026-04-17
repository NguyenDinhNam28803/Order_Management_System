// Notification Types for Client
// Maps to server email templates

export type EmailEventType =
  | 'USER_LOGIN'
  | 'USER_REGISTERED'
  | 'RFQ_INVITATION'
  | 'PO_APPROVAL_REQUEST'
  | 'PO_APPROVED'
  // Magic Link templates
  | 'RFQ_MAGIC_LINK'
  | 'PR_APPROVAL_LINK'
  | 'PO_CONFIRM_LINK'
  | 'GRN_MILESTONE_UPDATE'
  | 'INVOICE_SUBMIT_LINK'
  | 'PAYMENT_CONFIRMED';

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

// Template data interfaces for each event type
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

export interface GrnMilestoneUpdateData {
  poCode: string;
  supplierName: string;
  updateLink: string;
  completedSteps: string[];
  currentStep: string;
  pendingSteps: string[];
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

export interface PaymentConfirmedData {
  paymentCode: string;
  poCode: string;
  amount: number;
  vatAmount: number;
  totalWithVat: number;
  bankRef: string;
  paidAt: string | Date;
}

export type TemplateData =
  | RFQMagicLinkData
  | PRApprovalLinkData
  | POConfirmLinkData
  | GrnMilestoneUpdateData
  | InvoiceSubmitLinkData
  | PaymentConfirmedData
  | Record<string, unknown>;
