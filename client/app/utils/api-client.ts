// client/app/utils/api-client.ts
/**
 * Comprehensive API Client for Procurement System
 * Kết nối với tất cả server endpoints
 */

// Type definitions to replace 'any'
interface PRCreateData {
  departmentId: string;
  items: Array<{
    productId: string;
    quantity: number;
    estimatedUnitPrice?: number;
    specifications?: string;
  }>;
  justification?: string;
  reference?: string;
}

interface POCreateData {
  prId?: string;
  supplierId: string;
  items: Array<{
    productId: string;
    quantity: number;
    unitPrice: number;
  }>;
  terms?: Record<string, string>;
}

interface RFQCreateData {
  prId: string;
  supplierId?: string;
  items: Array<{
    productId: string;
    quantity: number;
    requiredDeliveryDate: string;
  }>;
  deadline?: string;
}

interface QuotationSubmitData {
  items: Array<{
    productId: string;
    unitPrice: number;
    leadTime?: number;
    notes?: string;
  }>;
  totalAmount: number;
  validityPeriod?: number;
  terms?: Record<string, string>;
}

interface CounterOfferData {
  items: Array<{
    productId: string;
    unitPrice: number;
  }>;
  totalAmount: number;
  leadTime?: number;
  notes?: string;
}

interface CounterOfferResponse {
  accepted: boolean;
  counterOffer?: CounterOfferData;
  notes?: string;
}

interface GRNCreateData {
  poId: string;
  receivedItems: Record<string, number>;
  notes?: string;
  referenceDocuments?: string[];
}

interface QCResultData {
  status: 'PASS' | 'PARTIAL_PASS' | 'FAIL';
  passedQty?: number;
  failedQty?: number;
  reason?: string;
  action?: string;
}

interface InvoiceCreateData {
  poId: string;
  invoiceNumber: string;
  invoiceDate: string;
  dueDate: string;
  items: Array<{
    poLineItemId: string;
    quantity: number;
    unitPrice: number;
    amount: number;
  }>;
  taxAmount?: number;
  totalAmount: number;
}

interface InvoiceUpdateData {
  invoiceNumber?: string;
  dueDate?: string;
  taxAmount?: number;
  totalAmount?: number;
}

interface PaymentCreateData {
  invoiceId: string;
  amount: number;
  paymentMethod: string;
  paymentDate: string;
}

interface QAThreadData {
  question: string;
  category?: string;
  attachments?: string[];
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

// ==========================================
// GENERIC API FETCH
// ==========================================
export const apiFetch = async (url: string, options: RequestInit = {}) => {
    const token = typeof document !== 'undefined' ? document.cookie.split('; ').find(row => row.startsWith('token='))?.split('=')[1] : '';
    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        ...(options.headers as Record<string, string> || {}),
    };

    const res = await fetch(`${API_BASE}${url}`, {
        ...options,
        headers,
    });

    if (!res.ok) {
        const error = await res.text();
        throw new Error(error || `Request failed: ${res.status}`);
    }

    // Parse JSON if response has content, otherwise return null
    const contentType = res.headers.get('content-type');
    if (contentType?.includes('application/json')) {
        return await res.json();
    }
    return null;
};

// ==========================================
// PR ENDPOINTS
// ==========================================
export const prAPI = {
  list: () => apiFetch('/procurement-requests'),
  myPRs: () => apiFetch('/procurement-requests/my'),
  getById: (id: string) => apiFetch(`/procurement-requests/${id}`),
  create: (data: PRCreateData) =>
    apiFetch('/procurement-requests', { method: 'POST', body: JSON.stringify(data) }),
  submit: (id: string, reviewers: string[]) =>
    apiFetch(`/procurement-requests/${id}/submit`, {
      method: 'POST',
      body: JSON.stringify({ reviewerIds: reviewers }),
    }),
  aiSuggest: (keyword: string) =>
    apiFetch('/procurement-requests/ai-suggest', {
      method: 'POST',
      body: JSON.stringify({ keyword }),
    }),
};

// ==========================================
// PO ENDPOINTS
// ==========================================
export const poAPI = {
  list: () => apiFetch('/purchase-orders'),
  getById: (id: string) => apiFetch(`/purchase-orders/${id}`),
  create: (data: POCreateData) =>
    apiFetch('/purchase-orders', { method: 'POST', body: JSON.stringify(data) }),
  createFromPR: (prId: string, supplierId: string) =>
    apiFetch('/purchase-orders/create-from-pr', {
      method: 'POST',
      body: JSON.stringify({ prId, supplierId }),
    }),
  confirm: (id: string) =>
    apiFetch(`/purchase-orders/${id}/confirm`, { method: 'POST' }),
  submit: (id: string) =>
    apiFetch(`/purchase-orders/${id}/submit`, { method: 'POST' }),
  updateStatus: (id: string, status: string) =>
    apiFetch(`/purchase-orders/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    }),
  reject: (id: string, reason: string) =>
    apiFetch(`/purchase-orders/${id}/reject`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    }),
  reset: (id: string) =>
    apiFetch(`/purchase-orders/${id}/reset`, { method: 'POST' }),
};

// ==========================================
// RFQ ENDPOINTS
// ==========================================
export const rfqAPI = {
  list: () => apiFetch('/request-for-quotations'),
  getById: (id: string) => apiFetch(`/request-for-quotations/${id}`),
  create: (data: RFQCreateData) =>
    apiFetch('/request-for-quotations', { method: 'POST', body: JSON.stringify(data) }),
  updateStatus: (id: string, status: string) =>
    apiFetch(`/request-for-quotations/${id}/status`, { method: 'PUT', body: JSON.stringify({ status }) }),

  // Supplier Management
  getSuppliers: (rfqId: string) =>
    apiFetch(`/request-for-quotations/${rfqId}/suppliers`),
  inviteSuppliers: (rfqId: string, supplierIds: string[]) =>
    apiFetch(`/request-for-quotations/${rfqId}/suppliers/invite`, {
      method: 'POST', body: JSON.stringify({ supplierIds }),
    }),
  removeSupplier: (rfqId: string, supplierId: string) =>
    apiFetch(`/request-for-quotations/${rfqId}/suppliers/${supplierId}`, { method: 'DELETE' }),
  aiSearchAndAddSuppliers: (rfqId: string, keyword: string) =>
    apiFetch(`/request-for-quotations/${rfqId}/search-and-add-suppliers`, {
      method: 'POST', body: JSON.stringify({ keyword }),
    }),

  // Quotation Management
  getQuotations: (rfqId: string) =>
    apiFetch(`/request-for-quotations/${rfqId}/quotations`),
  getQuotationById: (id: string) =>
    apiFetch(`/request-for-quotations/quotations/${id}`),
  submitQuotation: (id: string, data: QuotationSubmitData) =>
    apiFetch(`/request-for-quotations/quotations/${id}/submit`, { method: 'PUT', body: JSON.stringify(data) }),
  acceptQuotation: (id: string) =>
    apiFetch(`/request-for-quotations/quotations/${id}/accept`, { method: 'PUT' }),
  rejectQuotation: (id: string, reason: string) =>
    apiFetch(`/request-for-quotations/quotations/${id}/reject`, { method: 'PUT', body: JSON.stringify({ reason }) }),
  updateAIScore: (id: string, score: number) =>
    apiFetch(`/request-for-quotations/quotations/${id}/ai-score`, { method: 'PUT', body: JSON.stringify({ aiScore: score }) }),
  analyzeQuotation: (id: string) =>
    apiFetch(`/request-for-quotations/quotations/${id}/analyze`, { method: 'POST' }),

  // Q&A Threads
  getQAThreads: (rfqId: string) =>
    apiFetch(`/request-for-quotations/${rfqId}/qa-threads`),
  createQAThread: (rfqId: string, data: QAThreadData) =>
    apiFetch(`/request-for-quotations/${rfqId}/qa-threads`, { method: 'POST', body: JSON.stringify(data) }),
  answerQAThread: (id: string, answer: string) =>
    apiFetch(`/request-for-quotations/qa-threads/${id}/answer`, { method: 'PUT', body: JSON.stringify({ answer }) }),

  // Counter Offers
  createCounterOffer: (quotationId: string, data: CounterOfferData) =>
    apiFetch(`/request-for-quotations/quotations/${quotationId}/counter-offers`, {
      method: 'POST', body: JSON.stringify(data),
    }),
  getCounterOffers: (quotationId: string) =>
    apiFetch(`/request-for-quotations/quotations/${quotationId}/counter-offers`),
  respondToCounterOffer: (id: string, response: CounterOfferResponse) =>
    apiFetch(`/request-for-quotations/counter-offers/${id}/respond`, { method: 'PUT', body: JSON.stringify(response) }),

  // Award
  award: (rfqId: string, quotationId: string) =>
    apiFetch(`/request-for-quotations/${rfqId}/award`, {
      method: 'PUT', body: JSON.stringify({ selectedQuotationId: quotationId }),
    }),
};

// ==========================================
// GRN ENDPOINTS
// ==========================================
export const grnAPI = {
  list: () => apiFetch('/grn'),
  getById: (id: string) => apiFetch(`/grn/${id}`),
  create: (data: GRNCreateData) =>
    apiFetch('/grn', { method: 'POST', body: JSON.stringify(data) }),
  updateStatus: (id: string, status: string) =>
    apiFetch(`/grn/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),
  updateItemQC: (id: string, itemId: string, qcResult: QCResultData) =>
    apiFetch(`/grn/${id}/items/${itemId}/qc`, { method: 'PATCH', body: JSON.stringify(qcResult) }),
  confirm: (id: string) =>
    apiFetch(`/grn/${id}/confirm`, { method: 'POST' }),
};

// ==========================================
// INVOICE ENDPOINTS
// ==========================================
export const invoiceAPI = {
  list: () => apiFetch('/invoices'),
  getById: (id: string) => apiFetch(`/invoices/${id}`),
  create: (data: InvoiceCreateData) =>
    apiFetch('/invoices', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: InvoiceUpdateData) =>
    apiFetch(`/invoices/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  runMatching: (id: string) =>
    apiFetch(`/invoices/${id}/run-matching`, { method: 'POST' }),
  pay: (id: string) =>
    apiFetch(`/invoices/${id}/pay`, { method: 'POST' }),
  delete: (id: string) =>
    apiFetch(`/invoices/${id}`, { method: 'DELETE' }),
};

// ==========================================
// PAYMENT ENDPOINTS
// ==========================================
export const paymentAPI = {
  list: () => apiFetch('/payments'),
  getById: (id: string) => apiFetch(`/payments/${id}`),
  create: (data: PaymentCreateData) =>
    apiFetch('/payments', { method: 'POST', body: JSON.stringify(data) }),
  complete: (id: string) =>
    apiFetch(`/payments/${id}/complete`, { method: 'POST' }),
};

// ==========================================
// SUPPLIER KPI ENDPOINTS
// ==========================================
export const supplierKPIAPI = {
  evaluate: (supplierId: string) =>
    apiFetch(`/supplier-kpis/evaluate/${supplierId}`, { method: 'POST' }),
  getReport: (supplierId: string) =>
    apiFetch(`/supplier-kpis/report/${supplierId}`),
};

// ==========================================
// PO CONSOLIDATION  (Feature: gộp nhiều PR → 1 PO)
// POST /purchase-orders/consolidate
// ==========================================
export interface ConsolidatePRsDto {
  /** Danh sách PR ID đã APPROVED cần gộp (tối thiểu 2) */
  prIds: string[];
  /** Nhà cung cấp được chọn */
  supplierId: string;
  /** SKU_MATCH: gộp theo mã SKU | CATEGORY_MATCH: gộp theo danh mục */
  consolidationMode?: 'SKU_MATCH' | 'CATEGORY_MATCH';
  deliveryDate: string;
  paymentTerms?: string;
  deliveryAddress?: string;
  notes?: string;
}

export interface ConsolidationSummary {
  sourcePrCount: number;
  sourcePrNumbers: string[];
  mergedItemCount: number;
  totalOriginalItems: number;
  savedItems: number;
  totalAmount: number;
  budgetReservedByCostCenter: Record<string, number>;
}

export const poConsolidateAPI = {
  /** Gộp nhiều PR thành 1 PO */
  consolidate: async (dto: ConsolidatePRsDto) => {
    const res = await apiFetch('/purchase-orders/consolidate', {
      method: 'POST',
      body: JSON.stringify(dto),
    });
    return res as { poNumber: string; id: string; consolidationSummary: ConsolidationSummary };
  },
};

// ==========================================
// EMAIL RAG  (Feature: đọc Gmail → ingest vào RAG)
// GET  /rag/emails?limit=N    — lấy email thô
// POST /rag/emails/ingest?limit=N — ingest vào vector store
// ==========================================
export interface ParsedEmail {
  messageId: string;
  subject: string;
  from: string;
  to: string;
  date: string;
  body: string;
}

export const emailRagAPI = {
  /** Lấy email gần nhất từ Gmail INBOX */
  fetchEmails: async (limit = 20): Promise<ParsedEmail[]> => {
    const res = await apiFetch(`/rag/emails?limit=${limit}`);
    return res as ParsedEmail[];
  },

  /** Ingest email vào vector store để RAG query tìm kiếm được */
  ingestEmails: async (limit = 50): Promise<{ ingested: number; skipped: number }> => {
    const res = await apiFetch(`/rag/emails/ingest?limit=${limit}`, { method: 'POST' });
    return res as { ingested: number; skipped: number };
  },
};

// ==========================================
// CONTRACT ENDPOINTS
// ==========================================
export const contractAPI = {
  list: async (orgId?: string) => {
    const url = orgId ? `/contracts?orgId=${orgId}` : '/contracts';
    return apiFetch(url);
  },
  getById: async (id: string) => apiFetch(`/contracts/${id}`),
  create: async (data: Record<string, unknown>) =>
    apiFetch('/contracts', { method: 'POST', body: JSON.stringify(data) }),
  update: async (id: string, data: Record<string, unknown>) =>
    apiFetch(`/contracts/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
};

// ==========================================
// DISPUTE ENDPOINTS
// ==========================================
export const disputeAPI = {
  list: async () => apiFetch('/disputes'),
  getById: async (id: string) => apiFetch(`/disputes/${id}`),
  create: async (data: Record<string, unknown>) =>
    apiFetch('/disputes', { method: 'POST', body: JSON.stringify(data) }),
  resolve: async (id: string, data: Record<string, unknown>) =>
    apiFetch(`/disputes/${id}/resolve`, { method: 'POST', body: JSON.stringify(data) }),
};

// ==========================================
// REVIEW ENDPOINTS  (Đánh giá nhà cung cấp thủ công)
// ==========================================
export const reviewAPI = {
  list: async () => apiFetch('/reviews'),
  getById: async (id: string) => apiFetch(`/reviews/${id}`),
  create: async (data: Record<string, unknown>) =>
    apiFetch('/reviews', { method: 'POST', body: JSON.stringify(data) }),
};

// ==========================================
// REPORT ENDPOINTS
// ==========================================
export const reportAPI = {
  getSpendReport: async (params?: { orgId?: string; startDate?: string; endDate?: string }) => {
    const q = new URLSearchParams(params as Record<string, string>).toString();
    return apiFetch(`/reports/spend${q ? `?${q}` : ''}`);
  },
  getApReport: async (params?: Record<string, string>) => {
    const q = new URLSearchParams(params).toString();
    return apiFetch(`/reports/ap${q ? `?${q}` : ''}`);
  },
};

// ==========================================
// RAG ENDPOINTS  (AI / Vector Search)
// ==========================================
export const ragAPI = {
  /** Truy vấn ngữ nghĩa từ Vector DB */
  query: async (question: string, topK = 5) =>
    apiFetch('/rag/query', {
      method: 'POST',
      body: JSON.stringify({ question, topK }),
    }),

  /** Ingest một bảng dữ liệu vào Vector DB */
  ingestTable: async (table: string) =>
    apiFetch(`/rag/ingest/${table}`, { method: 'POST' }),

  /** Kích hoạt full sync toàn bộ dữ liệu */
  triggerFullSync: async () =>
    apiFetch('/rag/sync', { method: 'POST' }),

  /** AI tạo PR Draft từ mô tả ngôn ngữ tự nhiên */
  generatePrDraft: async (prompt: string) =>
    apiFetch('/rag/generate-pr-draft', {
      method: 'POST',
      body: JSON.stringify({ prompt }),
    }),

  /** Lấy email Gmail gần nhất */
  fetchEmails: async (limit = 20) =>
    apiFetch(`/rag/emails?limit=${limit}`),

  /** Ingest email vào Vector Store */
  ingestEmails: async (limit = 50) =>
    apiFetch(`/rag/emails/ingest?limit=${limit}`, { method: 'POST' }),
};

// ==========================================
// SYSTEM CONFIG ENDPOINTS
// ==========================================
export const systemConfigAPI = {
  list: async () => apiFetch('/system-configs'),
  upsert: async (data: { key: string; value: string; description?: string }) =>
    apiFetch('/system-configs', { method: 'POST', body: JSON.stringify(data) }),
};

// ==========================================
// PO ACKNOWLEDGE  (NCC xác nhận PO)
// Thêm vào poAPI nếu cần dùng trực tiếp
// ==========================================
export const poAcknowledgeAPI = {
  acknowledge: async (poId: string) =>
    apiFetch(`/purchase-orders/${poId}/acknowledge`, { method: 'POST' }),
};
