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
// PR ENDPOINTS
// ==========================================
export const prAPI = {
  list: async () => {
    const res = await fetch(`${API_BASE}/procurement-requests`);
    if (!res.ok) throw new Error('Failed to fetch PRs');
    return res.json();
  },

  myPRs: async () => {
    const res = await fetch(`${API_BASE}/procurement-requests/my`);
    if (!res.ok) throw new Error('Failed to fetch my PRs');
    return res.json();
  },

  getById: async (id: string) => {
    const res = await fetch(`${API_BASE}/procurement-requests/${id}`);
    if (!res.ok) throw new Error('Failed to fetch PR');
    return res.json();
  },

  create: async (data: PRCreateData) => {
    const res = await fetch(`${API_BASE}/procurement-requests`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to create PR');
    return res.json();
  },

  submit: async (id: string, reviewers: string[]) => {
    const res = await fetch(`${API_BASE}/procurement-requests/${id}/submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reviewerIds: reviewers }),
    });
    if (!res.ok) throw new Error('Failed to submit PR');
    return res.json();
  },

  aiSuggest: async (keyword: string) => {
    const res = await fetch(`${API_BASE}/procurement-requests/ai-suggest`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ keyword }),
    });
    if (!res.ok) throw new Error('Failed to get AI suggestions');
    return res.json();
  },
};

// ==========================================
// PO ENDPOINTS
// ==========================================
export const poAPI = {
  list: async () => {
    const res = await fetch(`${API_BASE}/purchase-orders`);
    if (!res.ok) throw new Error('Failed to fetch POs');
    return res.json();
  },

  getById: async (id: string) => {
    const res = await fetch(`${API_BASE}/purchase-orders/${id}`);
    if (!res.ok) throw new Error('Failed to fetch PO');
    return res.json();
  },

  create: async (data: POCreateData) => {
    const res = await fetch(`${API_BASE}/purchase-orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to create PO');
    return res.json();
  },

  createFromPR: async (prId: string, supplierId: string) => {
    const res = await fetch(`${API_BASE}/purchase-orders/create-from-pr`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prId, supplierId }),
    });
    if (!res.ok) throw new Error('Failed to create PO from PR');
    return res.json();
  },

  confirm: async (id: string) => {
    const res = await fetch(`${API_BASE}/purchase-orders/${id}/confirm`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
    if (!res.ok) throw new Error('Failed to confirm PO');
    return res.json();
  },

  submit: async (id: string) => {
    const res = await fetch(`${API_BASE}/purchase-orders/${id}/submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
    if (!res.ok) throw new Error('Failed to submit PO');
    return res.json();
  },

  updateStatus: async (id: string, status: string) => {
    const res = await fetch(`${API_BASE}/purchase-orders/${id}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    if (!res.ok) throw new Error('Failed to update PO status');
    return res.json();
  },

  reject: async (id: string, reason: string) => {
    const res = await fetch(`${API_BASE}/purchase-orders/${id}/reject`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason }),
    });
    if (!res.ok) throw new Error('Failed to reject PO');
    return res.json();
  },

  reset: async (id: string) => {
    const res = await fetch(`${API_BASE}/purchase-orders/${id}/reset`, {
      method: 'POST',
    });
    if (!res.ok) throw new Error('Failed to reset PO');
    return res.json();
  },
};

// ==========================================
// RFQ ENDPOINTS
// ==========================================
export const rfqAPI = {
  list: async () => {
    const res = await fetch(`${API_BASE}/request-for-quotations`);
    if (!res.ok) throw new Error('Failed to fetch RFQs');
    return res.json();
  },

  getById: async (id: string) => {
    const res = await fetch(`${API_BASE}/request-for-quotations/${id}`);
    if (!res.ok) throw new Error('Failed to fetch RFQ');
    return res.json();
  },

  create: async (data: RFQCreateData) => {
    const res = await fetch(`${API_BASE}/request-for-quotations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to create RFQ');
    return res.json();
  },

  updateStatus: async (id: string, status: string) => {
    const res = await fetch(`${API_BASE}/request-for-quotations/${id}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    if (!res.ok) throw new Error('Failed to update RFQ status');
    return res.json();
  },

  // Supplier Management
  getSuppliers: async (rfqId: string) => {
    const res = await fetch(
      `${API_BASE}/request-for-quotations/${rfqId}/suppliers`
    );
    if (!res.ok) throw new Error('Failed to fetch suppliers');
    return res.json();
  },

  inviteSuppliers: async (rfqId: string, supplierIds: string[]) => {
    const res = await fetch(
      `${API_BASE}/request-for-quotations/${rfqId}/suppliers/invite`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ supplierIds }),
      }
    );
    if (!res.ok) throw new Error('Failed to invite suppliers');
    return res.json();
  },

  removeSupplier: async (rfqId: string, supplierId: string) => {
    const res = await fetch(
      `${API_BASE}/request-for-quotations/${rfqId}/suppliers/${supplierId}`,
      { method: 'DELETE' }
    );
    if (!res.ok) throw new Error('Failed to remove supplier');
    return res.json();
  },

  aiSearchAndAddSuppliers: async (rfqId: string, keyword: string) => {
    const res = await fetch(
      `${API_BASE}/request-for-quotations/${rfqId}/search-and-add-suppliers`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ keyword }),
      }
    );
    if (!res.ok) throw new Error('Failed to search suppliers');
    return res.json();
  },

  // Quotation Management
  getQuotations: async (rfqId: string) => {
    const res = await fetch(
      `${API_BASE}/request-for-quotations/${rfqId}/quotations`
    );
    if (!res.ok) throw new Error('Failed to fetch quotations');
    return res.json();
  },

  getQuotationById: async (id: string) => {
    const res = await fetch(
      `${API_BASE}/request-for-quotations/quotations/${id}`
    );
    if (!res.ok) throw new Error('Failed to fetch quotation');
    return res.json();
  },

  submitQuotation: async (id: string, data: QuotationSubmitData) => {
    const res = await fetch(
      `${API_BASE}/request-for-quotations/quotations/${id}/submit`,
      {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      }
    );
    if (!res.ok) throw new Error('Failed to submit quotation');
    return res.json();
  },

  acceptQuotation: async (id: string) => {
    const res = await fetch(
      `${API_BASE}/request-for-quotations/quotations/${id}/accept`,
      { method: 'PUT' }
    );
    if (!res.ok) throw new Error('Failed to accept quotation');
    return res.json();
  },

  rejectQuotation: async (id: string, reason: string) => {
    const res = await fetch(
      `${API_BASE}/request-for-quotations/quotations/${id}/reject`,
      {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason }),
      }
    );
    if (!res.ok) throw new Error('Failed to reject quotation');
    return res.json();
  },

  updateAIScore: async (id: string, score: number) => {
    const res = await fetch(
      `${API_BASE}/request-for-quotations/quotations/${id}/ai-score`,
      {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ aiScore: score }),
      }
    );
    if (!res.ok) throw new Error('Failed to update AI score');
    return res.json();
  },

  analyzeQuotation: async (id: string) => {
    const res = await fetch(
      `${API_BASE}/request-for-quotations/quotations/${id}/analyze`,
      { method: 'POST' }
    );
    if (!res.ok) throw new Error('Failed to analyze quotation');
    return res.json();
  },

  // Q&A Threads
  getQAThreads: async (rfqId: string) => {
    const res = await fetch(
      `${API_BASE}/request-for-quotations/${rfqId}/qa-threads`
    );
    if (!res.ok) throw new Error('Failed to fetch Q&A threads');
    return res.json();
  },

  createQAThread: async (rfqId: string, data: QAThreadData) => {
    const res = await fetch(
      `${API_BASE}/request-for-quotations/${rfqId}/qa-threads`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      }
    );
    if (!res.ok) throw new Error('Failed to create Q&A thread');
    return res.json();
  },

  answerQAThread: async (id: string, answer: string) => {
    const res = await fetch(
      `${API_BASE}/request-for-quotations/qa-threads/${id}/answer`,
      {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answer }),
      }
    );
    if (!res.ok) throw new Error('Failed to answer Q&A thread');
    return res.json();
  },

  // Counter Offers
  createCounterOffer: async (quotationId: string, data: CounterOfferData) => {
    const res = await fetch(
      `${API_BASE}/request-for-quotations/quotations/${quotationId}/counter-offers`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      }
    );
    if (!res.ok) throw new Error('Failed to create counter offer');
    return res.json();
  },

  getCounterOffers: async (quotationId: string) => {
    const res = await fetch(
      `${API_BASE}/request-for-quotations/quotations/${quotationId}/counter-offers`
    );
    if (!res.ok) throw new Error('Failed to fetch counter offers');
    return res.json();
  },

  respondToCounterOffer: async (id: string, response: CounterOfferResponse) => {
    const res = await fetch(
      `${API_BASE}/request-for-quotations/counter-offers/${id}/respond`,
      {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(response),
      }
    );
    if (!res.ok) throw new Error('Failed to respond to counter offer');
    return res.json();
  },

  // Award
  award: async (rfqId: string, quotationId: string) => {
    const res = await fetch(
      `${API_BASE}/request-for-quotations/${rfqId}/award`,
      {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ selectedQuotationId: quotationId }),
      }
    );
    if (!res.ok) throw new Error('Failed to award quotation');
    return res.json();
  },
};

// ==========================================
// GRN ENDPOINTS
// ==========================================
export const grnAPI = {
  list: async () => {
    const res = await fetch(`${API_BASE}/grn`);
    if (!res.ok) throw new Error('Failed to fetch GRNs');
    return res.json();
  },

  getById: async (id: string) => {
    const res = await fetch(`${API_BASE}/grn/${id}`);
    if (!res.ok) throw new Error('Failed to fetch GRN');
    return res.json();
  },

  create: async (data: GRNCreateData) => {
    const res = await fetch(`${API_BASE}/grn`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to create GRN');
    return res.json();
  },

  updateStatus: async (id: string, status: string) => {
    const res = await fetch(`${API_BASE}/grn/${id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    if (!res.ok) throw new Error('Failed to update GRN status');
    return res.json();
  },

  updateItemQC: async (id: string, itemId: string, qcResult: QCResultData) => {
    const res = await fetch(`${API_BASE}/grn/${id}/items/${itemId}/qc`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(qcResult),
    });
    if (!res.ok) throw new Error('Failed to update item QC');
    return res.json();
  },

  confirm: async (id: string) => {
    const res = await fetch(`${API_BASE}/grn/${id}/confirm`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
    if (!res.ok) throw new Error('Failed to confirm GRN');
    return res.json();
  },
};

// ==========================================
// INVOICE ENDPOINTS
// ==========================================
export const invoiceAPI = {
  list: async () => {
    const res = await fetch(`${API_BASE}/invoices`);
    if (!res.ok) throw new Error('Failed to fetch invoices');
    return res.json();
  },

  getById: async (id: string) => {
    const res = await fetch(`${API_BASE}/invoices/${id}`);
    if (!res.ok) throw new Error('Failed to fetch invoice');
    return res.json();
  },

  create: async (data: InvoiceCreateData) => {
    const res = await fetch(`${API_BASE}/invoices`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to create invoice');
    return res.json();
  },

  update: async (id: string, data: InvoiceUpdateData) => {
    const res = await fetch(`${API_BASE}/invoices/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to update invoice');
    return res.json();
  },

  runMatching: async (id: string) => {
    const res = await fetch(`${API_BASE}/invoices/${id}/run-matching`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
    if (!res.ok) throw new Error('Failed to run 3-way matching');
    return res.json();
  },

  pay: async (id: string) => {
    const res = await fetch(`${API_BASE}/invoices/${id}/pay`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
    if (!res.ok) throw new Error('Failed to pay invoice');
    return res.json();
  },

  delete: async (id: string) => {
    const res = await fetch(`${API_BASE}/invoices/${id}`, {
      method: 'DELETE',
    });
    if (!res.ok) throw new Error('Failed to delete invoice');
    return res.json();
  },
};

// ==========================================
// PAYMENT ENDPOINTS
// ==========================================
export const paymentAPI = {
  list: async () => {
    const res = await fetch(`${API_BASE}/payments`);
    if (!res.ok) throw new Error('Failed to fetch payments');
    return res.json();
  },

  getById: async (id: string) => {
    const res = await fetch(`${API_BASE}/payments/${id}`);
    if (!res.ok) throw new Error('Failed to fetch payment');
    return res.json();
  },

  create: async (data: PaymentCreateData) => {
    const res = await fetch(`${API_BASE}/payments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to create payment');
    return res.json();
  },

  complete: async (id: string) => {
    const res = await fetch(`${API_BASE}/payments/${id}/complete`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
    if (!res.ok) throw new Error('Failed to complete payment');
    return res.json();
  },
};

// ==========================================
// SUPPLIER KPI ENDPOINTS
// ==========================================
export const supplierKPIAPI = {
  evaluate: async (supplierId: string) => {
    const res = await fetch(
      `${API_BASE}/supplier-kpis/evaluate/${supplierId}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      }
    );
    if (!res.ok) throw new Error('Failed to evaluate supplier');
    return res.json();
  },

  getReport: async (supplierId: string) => {
    const res = await fetch(`${API_BASE}/supplier-kpis/report/${supplierId}`);
    if (!res.ok) throw new Error('Failed to fetch KPI report');
    return res.json();
  },
};
