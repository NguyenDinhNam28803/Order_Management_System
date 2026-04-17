"use client";

import React, { createContext, useContext, useState, useCallback, ReactNode, useMemo, useRef, useEffect } from "react";
import Cookies from 'js-cookie';
import {
    Organization, CostCenter, Department, CurrencyCode, CompanyType, KycStatus, UserRole, 
    PrStatus, RfqStatus, QuotationStatus, PoStatus, GrnStatus, InvoiceStatus, ApprovalStatus, DocumentType, 
    BudgetAllocationStatus, BudgetOverrideStatus, BudgetPeriodType,
    ApiResponse, LoginPayload, LoginResponse, RegisterPayload, CreatePrDto, UpdatePrDto, CreateRfqDto, ConsolidateRfqDto, 
    CreateGrnDto, CreateInvoiceDto, CreateQuoteDto, CreateOrganizationPayload, UpdateOrganizationPayload, 
    CreateCostCenterPayload, UpdateCostCenterPayload, CreateDepartmentPayload, UpdateDepartmentPayload, 
    Product, ProductCategory, CreateProductDtoShort, UpdateProductDtoShort, CreateCategoryDto, UpdateCategoryDto,
    User, BudgetPeriod, BudgetAllocation, CreateUserPayload, UpdateUserPayload, CreateBudgetPeriodPayload, UpdateBudgetPeriodPayload,
    CreateBudgetAllocationPayload, UpdateBudgetAllocationPayload, CreatePoDto,
    PR, PRItem, QuoteRequest, QuoteRequestItem, BudgetOverride, PrType, QuoteRequestStatus,
    Contract, Dispute, AuditLog, SupplierEvaluation,
    Quotation, QuotationItem, CreateQuotationDto, QAThread, CreateQAThreadDto, AnswerQAThreadDto,
    CounterOffer, CreateCounterOfferDto, RespondCounterOfferDto,
    Payment, CreatePaymentDto, PaymentStatus,
    UserDelegation, CreateDelegationDto,
    ContractMilestone, UpdateMilestoneDto,
    UpdateInvoiceDto, UpdateGrnStatusDto,
    SupplierKPI, AuditLogFilterDto,
    RefreshTokenDto, ValidateTokenDto
} from "../types/api-types";

export type { 
    Organization, CostCenter, Department, Product, ProductCategory, User, BudgetPeriod, BudgetAllocation, 
    PR, PRItem, QuoteRequest, QuoteRequestItem, BudgetOverride,
    Contract, Dispute, AuditLog, SupplierEvaluation 
};

export {
    CurrencyCode, CompanyType, KycStatus, UserRole, PrStatus, RfqStatus, QuotationStatus, 
    PoStatus, GrnStatus, InvoiceStatus, ApprovalStatus, DocumentType, BudgetAllocationStatus, BudgetOverrideStatus, BudgetPeriodType,
    PrType, QuoteRequestStatus
};

export interface Notification {
    id: number; message: string; type: 'success' | 'error' | 'info' | 'warning'; role?: string;
}

// ── PO Consolidation ──────────────────────────────────────────────────────────
export interface ConsolidatePRsInput {
    prIds: string[];
    supplierId: string;
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

export interface ConsolidatePRsResult {
    id: string;
    poNumber: string;
    consolidationSummary: ConsolidationSummary;
}

// ── Spend Report ──────────────────────────────────────────────────────────────
export interface SpendOverview {
    prCount: number;
    poCount: number;
    invoiceCount: number;
    supplierCount: number;
    totalSpent: number;
}

export interface SpendBySupplier {
    supplierName: string;
    totalAmount: number;
    poCount: number;
}

export interface SpendByCategory {
    categoryName: string;
    totalAmount: number;
}

export interface POItem {
    id: string; description: string; qty: number; estimatedPrice?: number; unitPrice?: number; total?: number;
}

export interface PO {
    id: string; poNumber: string; vendor: string; supplierId?: string; orgId?: string; items: POItem[]; status: PoStatus | string; total: number; createdAt?: string;
}

export interface RFQ {
    id: string; prId: string; rfqNumber: string; vendor: string; status: RfqStatus | string; 
    title?: string; createdAt?: string; items?: PRItem[]; supplierIds?: string[];
    type: "RFQ" | "PO_CONFIRMATION";
    price?: number; stock?: number; leadTime?: number; note?: string;
    deadline?: string;
    description?: string;
    pr?: PR;
    createdBy?: { fullName?: string; name?: string; email?: string };
    suppliers?: { supplierId: string; supplier?: { name?: string } }[];
}

export interface GRN {
    id: string; grnNumber: string; poId: string; receivedItems: Record<string, number>; createdAt: string;
    items?: { id: string; poItemId: string; acceptedQty?: number; receivedQty?: number }[];
}

export interface Invoice {
    id: string; invoiceNumber: string; vendor: string; poId: string; amount: number; status: InvoiceStatus | string; createdAt: string;
}

export interface BudgetStats {
    allocated: number; committed: number; spent: number;
}

export interface ApprovalWorkflow {
    id: string; documentId: string; documentType: DocumentType; status: ApprovalStatus; comment?: string; createdAt?: string;
}

export interface SimulationState {
    workflow: "CATALOG" | "NON_CATALOG" | null; step: number; isActive: boolean;
}

export interface ProcurementState {
    currentUser: User | null; prs: PR[]; myPrs: PR[]; pos: PO[]; allPos: PO[]; rfqs: RFQ[]; grns: GRN[]; invoices: Invoice[]; 
    budgets: BudgetStats | null; users: User[]; departments: Department[]; notifications: Notification[]; 
    approvals: ApprovalWorkflow[]; costCenters: CostCenter[]; budgetPeriods: BudgetPeriod[]; 
    budgetAllocations: BudgetAllocation[]; budgetOverrides: BudgetOverride[]; organizations: Organization[]; products: Product[]; 
    categories: ProductCategory[]; quoteRequests: QuoteRequest[]; loadingMyPrs: boolean; 
    simulation: SimulationState;
    contracts: Contract[]; disputes: Dispute[]; auditLogs: AuditLog[]; 
    supplierEvaluations: SupplierEvaluation[];
    isAuthChecking: boolean;
}

export interface ProcurementContextType extends ProcurementState {
    login: (email: string, password?: string) => Promise<boolean>;
    logout: () => Promise<void>;
    refreshData: () => Promise<void>;
    apiFetch: (url: string, options?: RequestInit) => Promise<Response>;
    addPR: (d: CreatePrDto) => Promise<PR | null>;
    submitPR: (id: string) => Promise<boolean>;
    approvePR: (id: string, comment?: string) => Promise<boolean>;
    updatePR: (id: string, d: UpdatePrDto) => Promise<boolean>;
    fetchPrDetail: (id: string) => Promise<PR | null>;
    createPO: (d: CreatePoDto) => Promise<boolean>;
    createPOFromPR: (prId: string, vendorId?: string) => Promise<boolean>;
    processPOAutomation: (poId: string) => Promise<{ success: boolean; contractCreated?: boolean; message: string } | null>;
    ackPO: (id: string) => Promise<boolean>;
    shipPO: (id: string) => Promise<boolean>;
    fetchPOById: (id: string) => Promise<PO | null>;
    confirmPO: (id: string) => Promise<PO | null>;
    submitPO: (id: string) => Promise<PO | null>;
    fetchSupplierPOs: (supplierId: string) => Promise<PO[]>;
    rejectPO: (id: string) => Promise<PO | null>;
    createRFQ: (d: CreateRfqDto) => Promise<RFQ | null>;
    createRFQConsolidated: (d: ConsolidateRfqDto) => Promise<boolean>;
    awardQuotation: (id: string, supplierId: string) => Promise<boolean>;
    actionApproval: (id: string, action: 'APPROVE' | 'REJECT', comment?: string) => Promise<boolean>;
    addDept: (d: CreateDepartmentPayload) => Promise<boolean>;
    updateDept: (id: string, d: UpdateDepartmentPayload) => Promise<boolean>;
    removeDept: (id: string) => Promise<boolean>;
    addUser: (d: CreateUserPayload) => Promise<boolean>;
    updateUser: (id: string, d: UpdateUserPayload) => Promise<boolean>;
    removeUser: (id: string) => Promise<boolean>;
    addOrganization: (d: CreateOrganizationPayload) => Promise<boolean>;
    updateOrganization: (id: string, d: UpdateOrganizationPayload) => Promise<boolean>;
    removeOrganization: (id: string) => Promise<boolean>;
    addProduct: (d: CreateProductDtoShort) => Promise<boolean>;
    updateProduct: (id: string, d: UpdateProductDtoShort) => Promise<boolean>;
    removeProduct: (id: string) => Promise<boolean>;
    addCategory: (d: CreateCategoryDto) => Promise<boolean>;
    updateCategory: (id: string, d: UpdateCategoryDto) => Promise<boolean>;
    removeCategory: (id: string) => Promise<boolean>;
    payInvoice: (id: string) => Promise<boolean>;
    matchInvoice: (id: string) => Promise<boolean>;
    addCostCenter: (d: CreateCostCenterPayload) => Promise<boolean>;
    updateCostCenter: (id: string, d: UpdateCostCenterPayload) => Promise<boolean>;
    removeCostCenter: (id: string) => Promise<boolean>;
    fetchCostCenter: (id: string) => Promise<CostCenter | null>;
    fetchMyDeptCostCenters: () => Promise<CostCenter[]>;
    addBudgetPeriod: (d: CreateBudgetPeriodPayload) => Promise<boolean>;
    addBudgetAllocation: (d: CreateBudgetAllocationPayload) => Promise<BudgetAllocation | null>;
    submitAllocation: (id: string) => Promise<boolean>;
    approveAllocation: (id: string) => Promise<boolean>;
    rejectAllocation: (id: string, reason: string) => Promise<boolean>;
    distributeAnnualBudget: (costCenterId: string, fiscalYear: number) => Promise<boolean>;
    reconcileQuarter: (costCenterId: string, fiscalYear: number, quarter: number) => Promise<boolean>;
    fetchQuarterlyAllocation: (cc: string, year: number, quarter: number) => Promise<BudgetAllocation | null>;
    addQuoteRequest: (d: Record<string, unknown>) => Promise<QuoteRequest | null>;
    updateQuoteRequest: (id: string, d: Partial<QuoteRequest>) => Promise<boolean>;
    submitQuoteRequest: (id: string) => Promise<boolean>;
    convertQuoteToPR: (qrId: string) => Promise<boolean>;
    sendQuoteRequestToSupplier: (id: string, supplierIds: string[]) => Promise<boolean>;
    createPRFromQuoteRequest: (qrId: string) => Promise<boolean>;
    startSimulation: (wf: "CATALOG" | "NON_CATALOG") => void;
    nextSimulationStep: () => void;
    stopSimulation: () => void;
    confirmCatalogPrice: (d: Record<string, unknown>) => Promise<boolean>;
    approveOverride: (id: string) => Promise<boolean>;
    rejectOverride: (id: string, reason: string) => Promise<boolean>;
    removeNotification: (id: number) => void;
    notify: (message: string, type?: Notification['type']) => void;
    register: (d: RegisterPayload) => Promise<boolean>;
    logoutApi: () => Promise<boolean>;
    refreshToken: (refreshToken: string) => Promise<boolean>;
    validateToken: (token: string) => Promise<boolean>;
    fetchUserProfile: () => Promise<User | null>;
    fetchUserById: (id: string) => Promise<User | null>;
    createDelegation: (d: CreateDelegationDto) => Promise<boolean>;
    fetchMyDelegations: () => Promise<UserDelegation[]>;
    toggleDelegation: (id: string, isActive: boolean) => Promise<boolean>;
    fetchOrganizationById: (id: string) => Promise<Organization | null>;
    fetchMyOrganization: () => Promise<Organization | null>;
    fetchDepartmentById: (id: string) => Promise<Department | null>;
    updateBudgetPeriod: (id: string, d: UpdateBudgetPeriodPayload) => Promise<boolean>;
    removeBudgetPeriod: (id: string) => Promise<boolean>;
    updateBudgetAllocation: (id: string, d: UpdateBudgetAllocationPayload) => Promise<boolean>;
    removeBudgetAllocation: (id: string) => Promise<boolean>;
    fetchBudgetPeriodsByType: (type: string) => Promise<BudgetPeriod[]>;
    fetchMyDeptBudgets: () => Promise<BudgetAllocation[]>;
    fetchBudgetAllocationById: (id: string) => Promise<BudgetAllocation | null>;
    fetchBudgetOverrideById: (id: string) => Promise<BudgetOverride | null>;
    createQuote: (d: CreateQuoteDto) => Promise<Quotation | null>;
    fetchQuotationsByRfq: (rfqId: string) => Promise<Quotation[]>;
    fetchQuotationById: (id: string) => Promise<Quotation | null>;
    submitQuotation: (id: string) => Promise<boolean>;
    reviewQuotation: (id: string) => Promise<boolean>;
    acceptQuotation: (id: string) => Promise<boolean>;
    rejectQuotation: (id: string) => Promise<boolean>;
    updateQuotationAiScore: (id: string, aiScore: number) => Promise<boolean>;
    createQAThread: (rfqId: string, d: CreateQAThreadDto) => Promise<boolean>;
    fetchQAThreadsByRfq: (rfqId: string) => Promise<QAThread[]>;
    fetchQAThreadById: (id: string) => Promise<QAThread | null>;
    answerQAThread: (id: string, answer: string) => Promise<boolean>;
    fetchQAThreadsBySupplier: (rfqId: string, supplierId: string) => Promise<QAThread[]>;
    inviteSuppliersToRFQ: (rfqId: string, supplierIds: string[]) => Promise<boolean>;
    removeSupplierFromRFQ: (rfqId: string, supplierId: string) => Promise<boolean>;
    searchAndAddSuppliers: (rfqId: string) => Promise<boolean>;
    createCounterOffer: (quotationId: string, d: CreateCounterOfferDto) => Promise<boolean>;
    fetchCounterOffersByQuotation: (quotationId: string) => Promise<CounterOffer[]>;
    fetchCounterOfferById: (id: string) => Promise<CounterOffer | null>;
    respondCounterOffer: (id: string, response: 'ACCEPT' | 'REJECT', notes?: string) => Promise<boolean>;
    deleteRFQ: (id: string) => Promise<boolean>;
    updateRFQStatus: (id: string, status: RfqStatus) => Promise<boolean>;
    fetchRFQById: (id: string) => Promise<RFQ | null>;
    fetchSuppliersByRFQ: (rfqId: string) => Promise<User[]>;
    analyzeQuotationWithAI: (quotationId: string) => Promise<unknown>;
    fetchMySupplierRFQs: () => Promise<RFQ[]>;
    fetchContractById: (id: string) => Promise<Contract | null>;
    updateContract: (id: string, d: Partial<Contract>) => Promise<boolean>;
    removeContract: (id: string) => Promise<boolean>;
    submitContractForApproval: (id: string, approverId: string) => Promise<boolean>;
    updateContractMilestone: (milestoneId: string, d: UpdateMilestoneDto) => Promise<boolean>;
    fetchContractsBySupplier: (supplierId: string) => Promise<Contract[]>;
    fetchGRNById: (id: string) => Promise<GRN | null>;
    updateGRNStatus: (id: string, status: GrnStatus) => Promise<boolean>;
    confirmGRN: (id: string) => Promise<boolean>;
    fetchInvoiceById: (id: string) => Promise<Invoice | null>;
    updateInvoice: (id: string, d: UpdateInvoiceDto) => Promise<boolean>;
    removeInvoice: (id: string) => Promise<boolean>;
    fetchInvoices: () => Promise<Invoice[]>;
    runMatching: (id: string) => Promise<Invoice | null>;
    createPayment: (d: CreatePaymentDto) => Promise<boolean>;
    completePayment: (id: string) => Promise<boolean>;
    fetchPayments: () => Promise<Payment[]>;
    fetchPaymentById: (id: string) => Promise<Payment | null>;
    fetchSupplierReviews: (supplierId: string) => Promise<unknown[]>;
    fetchBuyerRatings: () => Promise<unknown[]>;
    evaluateSupplierKPI: (supplierId: string) => Promise<SupplierKPI | null>;
    fetchSupplierKPIReport: (supplierId: string) => Promise<SupplierKPI[]>;
    fetchAuditLogsByEntity: (type: string, id: string) => Promise<AuditLog[]>;
    fetchAuditLogById: (id: string) => Promise<AuditLog | null>;
    createAuditLog: (dto: { entityType: string; entityId: string; action: string; oldValue?: unknown; newValue?: unknown }) => Promise<boolean>;
    createGRN: (d: CreateGrnDto) => Promise<boolean>;
    updateGrnItemQc: (id: string, itemId: string, status: string, notes?: string) => Promise<boolean>;
    createInvoice: (d: CreateInvoiceDto) => Promise<boolean>;
    createContract: (d: Partial<Contract>) => Promise<boolean>;
    signContract: (id: string, isBuyer: boolean) => Promise<boolean>;
    createDispute: (d: Partial<Dispute>) => Promise<boolean>;
    createReview: (d: { type: 'BUYER' | 'SUPPLIER'; rating: number; comment: string; relatedId: string }) => Promise<boolean>;
    // PO Consolidation
    consolidatePRs: (dto: ConsolidatePRsInput) => Promise<ConsolidatePRsResult | null>;
    // RAG / AI Sync
    syncRAG: () => Promise<boolean>;
    ingestRAGEntity: (entity: string) => Promise<boolean>;
    // Spend Reports
    fetchSpendOverview: () => Promise<SpendOverview | null>;
    fetchSpendBySupplier: () => Promise<SpendBySupplier[]>;
    fetchSpendByCategory: () => Promise<SpendByCategory[]>;
}

const ProcurementContext = createContext<ProcurementContextType | undefined>(undefined);

export function ProcurementProvider({ children }: { children: ReactNode }) {
    const [state, setState] = useState<ProcurementState>({
        currentUser: null, prs: [], myPrs: [], pos: [], allPos: [], rfqs: [], grns: [], invoices: [], 
        budgets: null, users: [], departments: [], notifications: [], approvals: [], 
        costCenters: [], budgetPeriods: [], budgetAllocations: [], budgetOverrides: [], organizations: [], 
        products: [], categories: [], quoteRequests: [], loadingMyPrs: false,
        simulation: { workflow: null, step: 0, isActive: false },
        contracts: [], disputes: [], auditLogs: [], supplierEvaluations: [],
        isAuthChecking: true
    });

    const notify = useCallback((message: string, type: Notification['type'] = 'info') => {
        const id = Date.now();
        setState(prev => ({ ...prev, notifications: [...prev.notifications, { id, message, type }] }));
        setTimeout(() => setState(prev => ({ ...prev, notifications: prev.notifications.filter(n => n.id !== id) })), 5000);
    }, []);

    const removeNotification = useCallback((id: number) => {
        setState(prev => ({ ...prev, notifications: prev.notifications.filter(n => n.id !== id) }));
    }, []);

    const apiFetch = useCallback(async (url: string, options: RequestInit = {}) => {
        const token = Cookies.get('token');
        const headers: Record<string, string> = {
            'Content-Type': 'application/json',
            ...(options.headers as Record<string, string> || {})
        };
        if (token) headers['Authorization'] = `Bearer ${token}`;

        const baseUrl = 'http://localhost:5000';
        // process.env.NEXT_PUBLIC_API_URL ||
        return fetch(`${baseUrl}${url}`, { ...options, headers });
    }, []);

    // Helper function to run promises in batches with delay
    const runInBatches = async <T,>(
        factories: (() => Promise<T>)[],
        batchSize: number
    ): Promise<T[]> => {
        const results: T[] = [];
        for (let i = 0; i < factories.length; i += batchSize) {
            const batch = factories.slice(i, i + batchSize);
            const batchResults = await Promise.all(batch.map(fn => fn()));
            results.push(...batchResults);
            if (i + batchSize < factories.length) {
                await new Promise(resolve => setTimeout(resolve, 150));
            }
        }
        return results;
    };

    const refreshData = useCallback(async () => {
        setState(prev => ({ ...prev, loadingMyPrs: true }));
        try {
            const userJson = Cookies.get('user');
            const user = userJson ? JSON.parse(userJson) : null;
            
            // Split API calls into batches of 5 to avoid overwhelming the connection pool
            const apiCalls = [
                () => apiFetch('/budgets/periods'),
                () => apiFetch('/budgets/allocations'),
                () => apiFetch('/procurement-requests'),
                () => apiFetch('/procurement-requests/my'),
                () => apiFetch('/approvals/pending'),
                () => apiFetch('/organizations'),
                () => apiFetch('/departments'),
                () => apiFetch('/users'),
                () => apiFetch('/products'),
                () => apiFetch('/products/categories'),
                () => apiFetch('/cost-centers'),
                () => apiFetch('/purchase-orders'),
                () => apiFetch('/purchase-orders/all'),
                () => apiFetch('/request-for-quotations'),
                () => apiFetch('/grn'),
                () => apiFetch('/invoices'),
                () => apiFetch('/contracts'),
                () => apiFetch('/disputes')
            ];
            
            const [
                periodsResp, allocsResp, prsResp, myPrsResp, approvalsResp, 
                orgsResp, deptsResp, usersResp, productsResp, categoriesResp, 
                ccResp, posResp, posAllResp, rfqsResp, grnsResp, invoicesResp,
                contractsResp, disputesResp
            ] = await runInBatches(apiCalls, 2);

            if (user && ["FINANCE", "DIRECTOR", "CEO", "PLATFORM_ADMIN"].includes(user.role)) {
                const overridesResp = await apiFetch('/budgets/overrides');
                if (overridesResp.ok) {
                    const res = await overridesResp.json();
                    const data = res.data || res;
                    if (Array.isArray(data)) setState(prev => ({ ...prev, budgetOverrides: data }));
                }

                const auditResp = await apiFetch('/audit-logs');
                if (auditResp.ok) {
                    const res = await auditResp.json();
                    const data = res.data || res;
                    if (Array.isArray(data)) setState(prev => ({ ...prev, auditLogs: data }));
                }
            }

            if (contractsResp.ok) {
                const res = await contractsResp.json();
                const data = res.data || res;
                if (Array.isArray(data)) setState(prev => ({ ...prev, contracts: data }));
            }

            if (disputesResp.ok) {
                const res = await disputesResp.json();
                const data = res.data || res;
                if (Array.isArray(data)) setState(prev => ({ ...prev, disputes: data }));
            }

            if (periodsResp.ok) {
                const res = await periodsResp.json();
                const data = res.data || res;
                if (Array.isArray(data)) setState(prev => ({ ...prev, budgetPeriods: data }));
            }

            if (allocsResp.ok) {
                const res = await allocsResp.json();
                const data = res.data || res;
                if (Array.isArray(data)) setState(prev => ({ ...prev, budgetAllocations: data }));
            }
            
            if (prsResp.ok) {
                const res = await prsResp.json();
                const data = res.data || res;
                if (Array.isArray(data)) {
                    setState(prev => ({ 
                        ...prev, 
                        prs: data.map((p: PR) => ({
                            ...p,
                            title: p.title || p.description || p.prNumber || "Yêu cầu mua sắm",
                            type: p.type || PrType.NON_CATALOG,
                            requester: p.requester || { id: "u-unknown" }
                        })) 
                    }));
                }
            }
            if (myPrsResp.ok) {
                const res = await myPrsResp.json();
                const data = res.data || res;
                if (Array.isArray(data)) {
                    setState(prev => ({ 
                        ...prev, 
                        myPrs: data.map((p: PR) => ({
                            ...p,
                            title: p.title || p.description || p.prNumber || "Yêu cầu mua sắm",
                            type: p.type || PrType.NON_CATALOG,
                            requester: p.requester || { id: "u-unknown" }
                        }))
                    }));
                }
            }
            if (ccResp && ccResp.ok) {
                const res = await ccResp.json();
                const data = res.data || res;
                if (Array.isArray(data)) setState(prev => ({ ...prev, costCenters: data }));
            }
            if (posResp && posResp.ok) {
                const res = await posResp.json();
                const data = res.data || res;
                if (Array.isArray(data)) {
                    setState(prev => ({ ...prev, pos: data }));
                }
            }
            if (posAllResp && posAllResp.ok) {
                // Lưu tất cả PO trong hệ thống vào allPos (riêng biệt với pos)
                const res = await posAllResp.json();
                const data = res.data || res;
                if (Array.isArray(data)) setState(prev => ({ ...prev, allPos: data }));
            }
            if (rfqsResp && rfqsResp.ok) {
                const res = await rfqsResp.json();
                const data = res.data || res;
                if (Array.isArray(data)) setState(prev => ({ ...prev, rfqs: data }));
            }
            if (grnsResp && grnsResp.ok) {
                const res = await grnsResp.json();
                const data = res.data || res;
                if (Array.isArray(data)) setState(prev => ({ ...prev, grns: data }));
            }
            if (invoicesResp && invoicesResp.ok) {
                const res = await invoicesResp.json();
                const data = res.data || res;
                if (Array.isArray(data)) setState(prev => ({ ...prev, invoices: data }));
            }
            if (orgsResp.ok) {
                const res = await orgsResp.json();
                const data = res.data || res;
                if (Array.isArray(data)) setState(prev => ({ ...prev, organizations: data }));
            }
            if (deptsResp.ok) {
                const res = await deptsResp.json();
                const data = res.data || res;
                if (Array.isArray(data)) setState(prev => ({ ...prev, departments: data }));
            }
            if (usersResp.ok) {
                const res = await usersResp.json();
                const data = res.data || res;
                if (Array.isArray(data)) setState(prev => ({ ...prev, users: data }));
            }
            if (productsResp.ok) {
                const res = await productsResp.json();
                const data = res.data || res;
                if (Array.isArray(data)) setState(prev => ({ ...prev, products: data }));
            }
            if (categoriesResp.ok) {
                const res = await categoriesResp.json();
                const data = res.data || res;
                if (Array.isArray(data)) setState(prev => ({ ...prev, categories: data }));
            }
            if (approvalsResp.ok) {
                const res = await approvalsResp.json();
                const data = res.data || res;
                console.log("Pending Approvals", data);
                if (Array.isArray(data)) setState(prev => ({ ...prev, approvals: data }));
            }
        } catch (e) {
            console.error("Refresh Data Error", e);
        } finally {
            setState(prev => ({ ...prev, loadingMyPrs: false }));
        }
    }, [apiFetch]);

    // Restore user from cookies on mount
    const refreshDataRef = useRef(refreshData);
    useEffect(() => {
        refreshDataRef.current = refreshData;
    }, [refreshData]);
    
    useEffect(() => {
        const restoreUserFromCookies = () => {
            try {
                const token = Cookies.get('token');
                const userJson = Cookies.get('user');
                
                if (token && userJson) {
                    const user = JSON.parse(userJson);
                    setState(prev => ({ ...prev, currentUser: user, isAuthChecking: false }));
                    // Refresh data in background
                    refreshDataRef.current().catch(() => {});
                } else {
                    setState(prev => ({ ...prev, isAuthChecking: false }));
                }
            } catch {
                // Invalid user data in cookies, clear them
                Cookies.remove('token');
                Cookies.remove('user');
                setState(prev => ({ ...prev, isAuthChecking: false }));
            }
        };

        restoreUserFromCookies();
    }, []);

    const login = useCallback(async (email: string, password?: string) => {
        try {
            const response = await apiFetch('/auth/login', {
                method: 'POST',
                body: JSON.stringify({ email, password: password || 'password123' })
            });
            if (response.ok) {
                const res = await response.json();
                Cookies.set('token', res.data.accessToken);
                Cookies.set('user', JSON.stringify(res.data.user));
                setState(prev => ({ ...prev, currentUser: res.data.user }));
                await refreshData();
                return true;
            }
        } catch {}
        return false;
    }, [apiFetch, refreshData]);

    const logout = useCallback(async () => {
        Cookies.remove('token');
        Cookies.remove('user');
        setState(prev => ({ ...prev, currentUser: null }));
    }, []);


    const addPR = useCallback(async (d: CreatePrDto) => {
        const resp = await apiFetch('/procurement-requests', { method: 'POST', body: JSON.stringify(d) });
        if (resp.ok) { const res = await resp.json(); await refreshData(); return res.data; }
        return null;
    }, [apiFetch, refreshData]);

    const submitPR = useCallback(async (id: string) => {
        const resp = await apiFetch(`/procurement-requests/${id}/submit`, { method: 'POST' });
        if (resp.ok) { notify("Gửi duyệt thành công", "success"); await refreshData(); return true; }
        return false;
    }, [apiFetch, refreshData, notify]);

    const updatePR = useCallback(async (id: string, d: UpdatePrDto) => {
        const resp = await apiFetch(`/procurement-requests/${id}`, { method: 'PATCH', body: JSON.stringify(d) });
        if (resp.ok) { notify("Cập nhật thành công", "success"); await refreshData(); return true; }
        return false;
    }, [apiFetch, refreshData, notify]);

    const fetchPrDetail = useCallback(async (id: string) => {
        const resp = await apiFetch(`/procurement-requests/${id}`);
        if (resp.ok) { const res = await resp.json(); return res.data; }
        return null;
    }, [apiFetch]);


    const actionApproval = useCallback(async (id: string, action: 'APPROVE' | 'REJECT', comment?: string) => {
        const resp = await apiFetch(`/approvals/${id}/action`, { method: 'POST', body: JSON.stringify({ action, comment }) });
        if (resp.ok) { notify("Phê duyệt thành công", "success"); await refreshData(); return true; }
        return false;
    }, [apiFetch, refreshData, notify]);

    const addBudgetAllocation = useCallback(async (d: CreateBudgetAllocationPayload) => {
        const resp = await apiFetch('/budgets/allocations', { method: 'POST', body: JSON.stringify(d) });
        if (resp.ok) { 
            const res = await resp.json();
            await refreshData(); 
            return res.data || res; 
        }
        return false;
    }, [apiFetch, refreshData]);

    const submitAllocation = useCallback(async (id: string) => {
        const resp = await apiFetch(`/budgets/allocations/${id}/submit`, { method: 'PATCH' });
        if (resp.ok) { notify("Đã gửi duyệt ngân sách", "success"); await refreshData(); return true; }
        return false;
    }, [apiFetch, refreshData, notify]);

    const approveAllocation = useCallback(async (id: string) => {
        const resp = await apiFetch(`/budgets/allocations/${id}/approve`, { method: 'PATCH' });
        if (resp.ok) { notify("Đã duyệt ngân sách thành công", "success"); await refreshData(); return true; }
        return false;
    }, [apiFetch, refreshData, notify]);

    const rejectAllocation = useCallback(async (id: string, reason: string) => {
        const resp = await apiFetch(`/budgets/allocations/${id}/reject`, { method: 'PATCH', body: JSON.stringify({ rejectedReason: reason }) });
        if (resp.ok) { notify("Đã từ chối ngân sách!", "success"); await refreshData(); return true; }
        notify("Lỗi khi từ chối ngân sách", "error"); return false;
    }, [apiFetch, refreshData, notify]);

    const distributeAnnualBudget = useCallback(async (costCenterId: string, fiscalYear: number) => {
        const resp = await apiFetch(`/budgets/distribute-annual/${costCenterId}/${fiscalYear}`, { method: 'POST' });
        if (resp.ok) { notify("Phân bổ 20/80 thành công", "success"); await refreshData(); return true; }
        return false;
    }, [apiFetch, refreshData, notify]);

    const reconcileQuarter = useCallback(async (costCenterId: string, fiscalYear: number, quarter: number) => {
        const resp = await apiFetch(`/budgets/reconcile-quarter/${costCenterId}/${fiscalYear}/${quarter}`, { method: 'POST' });
        if (resp.ok) { notify("Quyết toán thành công", "success"); await refreshData(); return true; }
        return false;
    }, [apiFetch, refreshData, notify]);

    const approveOverride = useCallback(async (id: string) => {
        const resp = await apiFetch(`/budgets/overrides/${id}/approve`, { method: 'PATCH' });
        if (resp.ok) { notify("Đã duyệt vượt định mức", "success"); await refreshData(); return true; }
        return false;
    }, [apiFetch, refreshData, notify]);

    const rejectOverride = useCallback(async (id: string, reason: string) => {
        const resp = await apiFetch(`/budgets/overrides/${id}/reject`, { method: 'PATCH', body: JSON.stringify({ reason }) });
        if (resp.ok) { notify("Đã từ chối", "info"); await refreshData(); return true; }
        return false;
    }, [apiFetch, refreshData, notify]);

    const createPO = useCallback(async (d: CreatePoDto) => {
        const resp = await apiFetch('/purchase-orders', { method: 'POST', body: JSON.stringify(d) });
        if (resp.ok) { notify("Tạo đơn hàng thành công!", "success"); await refreshData(); return true; }
        return false;
    }, [apiFetch, refreshData, notify]);

    const createPOFromPR = useCallback(async (prId: string, supplierId?: string) => {
        const resp = await apiFetch('/purchase-orders/create-from-pr', { 
            method: 'POST', 
            body: JSON.stringify({ prId, supplierId }) 
        });
        if (resp.ok) { 
            const result = await resp.json();
            notify("Tạo đơn hàng từ PR thành công!", "success"); 
            await refreshData(); 
            return result.data || result; 
        }
        return null;
    }, [apiFetch, refreshData, notify]);

    const processPOAutomation = useCallback(async (poId: string) => {
        const resp = await apiFetch(`/po-automation/process/${poId}`, { method: 'POST' });
        if (resp.ok) { 
            const result = await resp.json();
            if (result.contractCreated) {
                notify(result.message, "success");
            } else {
                notify(result.message, "info");
            }
            await refreshData();
            return result;
        }
        return null;
    }, [apiFetch, refreshData, notify]);

    const ackPO = useCallback(async (id: string) => {
        const resp = await apiFetch(`/purchase-orders/${id}/acknowledge`, { method: 'POST' });
        if (resp.ok) { notify("Đã xác nhận đơn hàng", "success"); await refreshData(); return true; }
        return false;
    }, [apiFetch, refreshData, notify]);

    const rejectPO = useCallback(async (id: string) => {
        const resp = await apiFetch(`/purchase-orders/${id}/reject`, { method: 'POST' });
        if (resp.ok) { 
            notify("Đã từ chối đơn hàng", "success"); 
            await refreshData(); 
            const res = await resp.json();
            return res.data || res;
        }
        return null;
    }, [apiFetch, refreshData, notify]);

    const shipPO = useCallback(async (id: string) => {
        const resp = await apiFetch(`/purchase-orders/${id}/status`, { method: 'PUT', body: JSON.stringify({ status: 'SHIPPED' }) });
        if (resp.ok) { notify("Đã cập nhật trạng thái giao hàng", "success"); await refreshData(); return true; }
        return false;
    }, [apiFetch, refreshData, notify]);

    const fetchQuarterlyAllocation = useCallback(async (cc: string, year: number, quarter: number) => {
        const resp = await apiFetch(`/budgets/allocations/quarterly/${cc}/${year}/${quarter}`);
        if (resp.ok) { const res = await resp.json(); return res.data || res; }
        return null;
    }, [apiFetch]);

    const createRFQ = useCallback(async (d: CreateRfqDto) => {
        const resp = await apiFetch('/request-for-quotations', { method: 'POST', body: JSON.stringify(d) });
        if (resp.ok) { 
            notify("Tạo RFQ thành công!", "success"); 
            await refreshData(); 
            const res = await resp.json();
            return res.data || res; 
        }
        return null;
    }, [apiFetch, refreshData, notify]);

    const awardQuotation = useCallback(async (rfqId: string, quotationId: string) => {
        const resp = await apiFetch(`/request-for-quotations/${rfqId}/award`, { 
            method: 'PUT', 
            body: JSON.stringify({ quotationId }) 
        });
        if (resp.ok) { notify("Đã chọn nhà thầu thành công!", "success"); await refreshData(); return true; }
        return false;
    }, [apiFetch, refreshData, notify]);

    const createGRN = useCallback(async (d: CreateGrnDto) => {
        const resp = await apiFetch('/grn', { method: 'POST', body: JSON.stringify(d) });
        if (resp.ok) { notify("Nhập kho thành công!", "success"); await refreshData(); return true; }
        return false;
    }, [apiFetch, refreshData, notify]);

    const createInvoice = useCallback(async (d: CreateInvoiceDto) => {
        const resp = await apiFetch('/invoices', { method: 'POST', body: JSON.stringify(d) });
        if (resp.ok) { notify("Tạo hóa đơn thành công!", "success"); await refreshData(); return true; }
        return false;
    }, [apiFetch, refreshData, notify]);

    const payInvoice = useCallback(async (id: string) => {
        const resp = await apiFetch(`/invoices/${id}/pay`, { method: 'POST' });
        if (resp.ok) { notify("Đã thanh toán hóa đơn", "success"); await refreshData(); return true; }
        return false;
    }, [apiFetch, refreshData, notify]);

    const matchInvoice = useCallback(async (id: string) => {
        const resp = await apiFetch(`/invoices/${id}/run-matching`, { method: 'POST' });
        if (resp.ok) { notify("Đã thực hiện đối soát 3 bên", "success"); await refreshData(); return true; }
        return false;
    }, [apiFetch, refreshData, notify]);

    const convertQuoteToPR = useCallback(async (qrId: string) => {
        const qr = state.quoteRequests.find(q => q.id === qrId);
        if (!qr) return false;
        const newPR = await addPR({
            title: `PR từ ${qr.qrNumber}`,
            description: `Tự động từ QR: ${qr.title}`,
            items: qr.items.map(i => ({ productDesc: i.productName, qty: i.qty, unit: i.unit, estimatedPrice: i.unitPrice || 0 }))
        });
        if (newPR) { await submitPR(newPR.id); return true; }
        return false;
    }, [state.quoteRequests, addPR, submitPR]);

    const addOrganization = useCallback(async (d: CreateOrganizationPayload) => {
        const resp = await apiFetch('/organizations', { method: 'POST', body: JSON.stringify(d) });
        if (resp.ok) { notify("Tạo tổ chức thành công!", "success"); await refreshData(); return true; }
        notify("Lỗi khi tạo tổ chức", "error"); return false;
    }, [apiFetch, refreshData, notify]);

    const updateOrganization = useCallback(async (id: string, d: UpdateOrganizationPayload) => {
        const resp = await apiFetch(`/organizations/${id}`, { method: 'PATCH', body: JSON.stringify(d) });
        if (resp.ok) { notify("Cập nhật tổ chức thành công!", "success"); await refreshData(); return true; }
        notify("Lỗi khi cập nhật tổ chức", "error"); return false;
    }, [apiFetch, refreshData, notify]);

    const removeOrganization = useCallback(async (id: string) => {
        const resp = await apiFetch(`/organizations/${id}`, { method: 'DELETE' });
        if (resp.ok) { notify("Đã xóa tổ chức", "success"); await refreshData(); return true; }
        notify("Lỗi khi xóa tổ chức", "error"); return false;
    }, [apiFetch, refreshData, notify]);

    const addDept = useCallback(async (d: CreateDepartmentPayload) => {
        const resp = await apiFetch('/departments', { method: 'POST', body: JSON.stringify(d) });
        if (resp.ok) { notify("Tạo phòng ban thành công!", "success"); await refreshData(); return true; }
        notify("Lỗi khi tạo phòng ban", "error"); return false;
    }, [apiFetch, refreshData, notify]);

    const updateDept = useCallback(async (id: string, d: UpdateDepartmentPayload) => {
        const resp = await apiFetch(`/departments/${id}`, { method: 'PATCH', body: JSON.stringify(d) });
        if (resp.ok) { notify("Cập nhật phòng ban thành công!", "success"); await refreshData(); return true; }
        notify("Lỗi khi cập nhật phòng ban", "error"); return false;
    }, [apiFetch, refreshData, notify]);

    const removeDept = useCallback(async (id: string) => {
        const resp = await apiFetch(`/departments/${id}`, { method: 'DELETE' });
        if (resp.ok) { notify("Đã xóa phòng ban", "success"); await refreshData(); return true; }
        notify("Lỗi khi xóa phòng ban", "error"); return false;
    }, [apiFetch, refreshData, notify]);

    const addProduct = useCallback(async (d: CreateProductDtoShort) => {
        const resp = await apiFetch('/products', { method: 'POST', body: JSON.stringify(d) });
        if (resp.ok) { notify("Tạo sản phẩm thành công!", "success"); await refreshData(); return true; }
        notify("Lỗi khi tạo sản phẩm", "error"); return false;
    }, [apiFetch, refreshData, notify]);

    const updateProduct = useCallback(async (id: string, d: UpdateProductDtoShort) => {
        const resp = await apiFetch(`/products/${id}`, { method: 'PATCH', body: JSON.stringify(d) });
        if (resp.ok) { notify("Cập nhật sản phẩm thành công!", "success"); await refreshData(); return true; }
        notify("Lỗi khi cập nhật sản phẩm", "error"); return false;
    }, [apiFetch, refreshData, notify]);

    const removeProduct = useCallback(async (id: string) => {
        const resp = await apiFetch(`/products/${id}`, { method: 'DELETE' });
        if (resp.ok) { notify("Đã xóa sản phẩm", "success"); await refreshData(); return true; }
        return false;
    }, [apiFetch, refreshData, notify]);

    const fetchCostCenter = useCallback(async (id: string) => {
        const resp = await apiFetch(`/cost-centers/${id}`);
        if (resp.ok) { const res = await resp.json(); return res.data || res; }
        return null;
    }, [apiFetch]);

    const fetchMyDeptCostCenters = useCallback(async () => {
        const resp = await apiFetch('/cost-centers/department');
        if (resp.ok) { 
            const res = await resp.json(); 
            const data = res.data || res;
            if (Array.isArray(data)) {
                setState(prev => ({ ...prev, costCenters: data }));
            }
            return data; 
        }
        return [];
    }, [apiFetch]);

    const addCostCenter = useCallback(async (d: CreateCostCenterPayload) => {
        const resp = await apiFetch('/cost-centers', { method: 'POST', body: JSON.stringify(d) });
        if (resp.ok) { 
            notify("Đã thêm Cost Center", "success"); 
            await refreshData(); 
            return true; 
        } else {
            const errRes = await resp.json().catch(() => ({}));
            const msg = Array.isArray(errRes.message) ? errRes.message[0] : (errRes.message || "Lỗi khi tạo Cost Center");
            notify(msg, "error");
        }
        return false;
    }, [apiFetch, refreshData, notify]);

    const updateCostCenter = useCallback(async (id: string, d: UpdateCostCenterPayload) => {
        const resp = await apiFetch(`/cost-centers/${id}`, { method: 'PATCH', body: JSON.stringify(d) });
        if (resp.ok) { 
            notify("Đã cập nhật Cost Center", "success"); 
            await refreshData(); 
            return true; 
        } else {
            const errRes = await resp.json().catch(() => ({}));
            const msg = Array.isArray(errRes.message) ? errRes.message[0] : (errRes.message || "Lỗi khi cập nhật Cost Center");
            notify(msg, "error");
        }
        return false;
    }, [apiFetch, refreshData, notify]);


    const removeCostCenter = useCallback(async (id: string) => {
        const resp = await apiFetch(`/cost-centers/${id}`, { method: 'DELETE' });
        if (resp.ok) { notify("Đã xóa trung tâm chi phí", "success"); await refreshData(); return true; }
        return false;
    }, [apiFetch, refreshData, notify]);

    const addCategory = useCallback(async (d: CreateCategoryDto) => {
        const resp = await apiFetch('/products/categories', { method: 'POST', body: JSON.stringify(d) });
        if (resp.ok) { notify("Tạo danh mục thành công!", "success"); await refreshData(); return true; }
        return false;
    }, [apiFetch, refreshData, notify]);

    const updateCategory = useCallback(async (id: string, d: UpdateCategoryDto) => {
        const resp = await apiFetch(`/products/categories/${id}`, { method: 'PATCH', body: JSON.stringify(d) });
        if (resp.ok) { notify("Cập nhật danh mục thành công!", "success"); await refreshData(); return true; }
        return false;
    }, [apiFetch, refreshData, notify]);

    const removeCategory = useCallback(async (id: string) => {
        const resp = await apiFetch(`/products/categories/${id}`, { method: 'DELETE' });
        if (resp.ok) { notify("Đã xóa danh mục", "success"); await refreshData(); return true; }
        return false;
    }, [apiFetch, refreshData, notify]);

    const addUser = useCallback(async (d: CreateUserPayload) => {
        const resp = await apiFetch('/users', { method: 'POST', body: JSON.stringify(d) });
        if (resp.ok) { notify("Tạo người dùng thành công!", "success"); await refreshData(); return true; }
        return false;
    }, [apiFetch, refreshData, notify]);

    const updateUser = useCallback(async (id: string, d: UpdateUserPayload) => {
        const resp = await apiFetch(`/users/${id}`, { method: 'PATCH', body: JSON.stringify(d) });
        if (resp.ok) { notify("Cập nhật người dùng thành công!", "success"); await refreshData(); return true; }
        return false;
    }, [apiFetch, refreshData, notify]);

    const removeUser = useCallback(async (id: string) => {
        const resp = await apiFetch(`/users/${id}`, { method: 'DELETE' });
        if (resp.ok) { notify("Đã xóa người dùng", "success"); await refreshData(); return true; }
        return false;
    }, [apiFetch, refreshData, notify]);

    const updateGrnItemQc = useCallback(async (id: string, itemId: string, status: string, notes?: string) => {
        const resp = await apiFetch(`/grn/${id}/items/${itemId}/qc`, { 
            method: 'PATCH', 
            body: JSON.stringify({ status, notes }) 
        });
        if (resp.ok) { notify("Cập nhật kết quả QC thành công", "success"); await refreshData(); return true; }
        return false;
    }, [apiFetch, refreshData, notify]);

    const createContract = useCallback(async (d: Partial<Contract>) => {
        const resp = await apiFetch('/contracts', { method: 'POST', body: JSON.stringify(d) });
        if (resp.ok) { notify("Tạo hợp đồng thành công", "success"); await refreshData(); return true; }
        return false;
    }, [apiFetch, refreshData, notify]);

    const signContract = useCallback(async (id: string, isBuyer: boolean) => {
        const resp = await apiFetch(`/contracts/${id}/sign`, { method: 'POST', body: JSON.stringify({ isBuyer }) });
        if (resp.ok) { notify("Ký hợp đồng thành công", "success"); await refreshData(); return true; }
        return false;
    }, [apiFetch, refreshData, notify]);

    const createDispute = useCallback(async (d: Partial<Dispute>) => {
        const resp = await apiFetch('/disputes', { method: 'POST', body: JSON.stringify(d) });
        if (resp.ok) { notify("Tạo khiếu nại thành công", "success"); await refreshData(); return true; }
        return false;
    }, [apiFetch, refreshData, notify]);

    const createReview = useCallback(async (d: { type: 'BUYER' | 'SUPPLIER', rating: number, comment: string, relatedId: string }) => {
        const url = d.type === 'BUYER' ? '/reviews/buyer-rating' : '/reviews/supplier-review';
        const resp = await apiFetch(url, { method: 'POST', body: JSON.stringify(d) });
        if (resp.ok) { notify("Đã gửi đánh giá thành công", "success"); await refreshData(); return true; }
        return false;
    }, [apiFetch, refreshData, notify]);

    // ========== Auth Module ==========
    const register = useCallback(async (d: RegisterPayload) => {
        const resp = await apiFetch('/auth/register', { method: 'POST', body: JSON.stringify(d) });
        if (resp.ok) { notify("Đăng ký thành công!", "success"); return true; }
        return false;
    }, [apiFetch, notify]);

    const logoutApi = useCallback(async () => {
        const resp = await apiFetch('/auth/logout', { method: 'POST' });
        if (resp.ok) { 
            Cookies.remove('token');
            Cookies.remove('user');
            setState(prev => ({ ...prev, currentUser: null }));
            notify("Đã đăng xuất", "info"); 
            return true; 
        }
        return false;
    }, [apiFetch, notify]);

    const refreshToken = useCallback(async (refreshToken: string) => {
        const resp = await apiFetch('/auth/refresh-token', { method: 'POST', body: JSON.stringify({ token: refreshToken }) });
        if (resp.ok) { 
            const res = await resp.json();
            if (res.data?.accessToken) {
                Cookies.set('token', res.data.accessToken);
            }
            return true; 
        }
        return false;
    }, [apiFetch]);

    const validateToken = useCallback(async (token: string) => {
        const resp = await apiFetch('/auth/validate-token', { method: 'POST', body: JSON.stringify({ token }) });
        if (resp.ok) { return true; }
        return false;
    }, [apiFetch]);

    // ========== Users Module ==========
    const fetchUserProfile = useCallback(async () => {
        const resp = await apiFetch('/users/profile');
        if (resp.ok) { const res = await resp.json(); return res.data || res; }
        return null;
    }, [apiFetch]);

    const fetchUserById = useCallback(async (id: string) => {
        const resp = await apiFetch(`/users/${id}`);
        if (resp.ok) { const res = await resp.json(); return res.data || res; }
        return null;
    }, [apiFetch]);

    const createDelegation = useCallback(async (d: CreateDelegationDto) => {
        const resp = await apiFetch('/users/delegations', { method: 'POST', body: JSON.stringify(d) });
        if (resp.ok) { notify("Tạo ủy quyền thành công", "success"); return true; }
        return false;
    }, [apiFetch, notify]);

    const fetchMyDelegations = useCallback(async () => {
        const resp = await apiFetch('/users/delegations/me');
        if (resp.ok) { const res = await resp.json(); return res.data || res; }
        return [];
    }, [apiFetch]);

    const toggleDelegation = useCallback(async (id: string, isActive: boolean) => {
        const resp = await apiFetch(`/users/delegations/${id}/toggle`, { method: 'PATCH', body: JSON.stringify({ isActive }) });
        if (resp.ok) { notify("Cập nhật trạng thái ủy quyền thành công", "success"); return true; }
        return false;
    }, [apiFetch, notify]);

    // ========== Organizations & Departments ==========
    const fetchOrganizationById = useCallback(async (id: string) => {
        const resp = await apiFetch(`/organizations/${id}`);
        if (resp.ok) { const res = await resp.json(); return res.data || res; }
        return null;
    }, [apiFetch]);

    const fetchMyOrganization = useCallback(async () => {
        const resp = await apiFetch('/organizations/my-org');
        if (resp.ok) { const res = await resp.json(); return res.data || res; }
        return null;
    }, [apiFetch]);

    const fetchDepartmentById = useCallback(async (id: string) => {
        const resp = await apiFetch(`/departments/${id}`);
        if (resp.ok) { const res = await resp.json(); return res.data || res; }
        return null;
    }, [apiFetch]);

    // ========== Budget Periods & Allocations ==========
    const addBudgetPeriod = useCallback(async (d: CreateBudgetPeriodPayload) => {
        const resp = await apiFetch('/budgets/periods', { method: 'POST', body: JSON.stringify(d) });
        if (resp.ok) { notify("Tạo chu kỳ ngân sách thành công", "success"); await refreshData(); return true; }
        return false;
    }, [apiFetch, refreshData, notify]);

    const updateBudgetPeriod = useCallback(async (id: string, d: UpdateBudgetPeriodPayload) => {
        const resp = await apiFetch(`/budgets/periods/${id}`, { method: 'PATCH', body: JSON.stringify(d) });
        if (resp.ok) { notify("Cập nhật chu kỳ ngân sách thành công", "success"); await refreshData(); return true; }
        return false;
    }, [apiFetch, refreshData, notify]);

    const removeBudgetPeriod = useCallback(async (id: string) => {
        const resp = await apiFetch(`/budgets/periods/${id}`, { method: 'DELETE' });
        if (resp.ok) { notify("Đã xóa chu kỳ ngân sách", "success"); await refreshData(); return true; }
        return false;
    }, [apiFetch, refreshData, notify]);

    const updateBudgetAllocation = useCallback(async (id: string, d: UpdateBudgetAllocationPayload) => {
        const resp = await apiFetch(`/budgets/allocations/${id}`, { method: 'PATCH', body: JSON.stringify(d) });
        if (resp.ok) { notify("Cập nhật phân bổ ngân sách thành công", "success"); await refreshData(); return true; }
        return false;
    }, [apiFetch, refreshData, notify]);

    const removeBudgetAllocation = useCallback(async (id: string) => {
        const resp = await apiFetch(`/budgets/allocations/${id}`, { method: 'DELETE' });
        if (resp.ok) { notify("Đã xóa phân bổ ngân sách", "success"); await refreshData(); return true; }
        return false;
    }, [apiFetch, refreshData, notify]);

    const fetchBudgetPeriodsByType = useCallback(async (type: string) => {
        const resp = await apiFetch(`/budgets/periods/type/${type}`);
        if (resp.ok) { const res = await resp.json(); return res.data || res; }
        return [];
    }, [apiFetch]);

    const fetchMyDeptBudgets = useCallback(async () => {
        const resp = await apiFetch('/budgets/my-department');
        if (resp.ok) { const res = await resp.json(); return res.data || res; }
        return [];
    }, [apiFetch]);

    const fetchBudgetAllocationById = useCallback(async (id: string) => {
        const resp = await apiFetch(`/budgets/allocations/${id}`);
        if (resp.ok) { const res = await resp.json(); return res.data || res; }
        return null;
    }, [apiFetch]);

    const fetchBudgetOverrideById = useCallback(async (id: string) => {
        const resp = await apiFetch(`/budgets/overrides/${id}`);
        if (resp.ok) { const res = await resp.json(); return res.data || res; }
        return null;
    }, [apiFetch]);

    // ========== Quotations ==========
    const createQuote = useCallback(async (d: CreateQuoteDto): Promise<Quotation | null> => {
        const resp = await apiFetch(`/request-for-quotations/${d.rfqId}/quotations`, { method: 'POST', body: JSON.stringify(d) });
        if (resp.ok) { 
            const res = await resp.json();
            notify("Tạo báo giá thành công", "success"); 
            await refreshData(); 
            return res.data || res; 
        }
        return null;
    }, [apiFetch, refreshData, notify]);

    const fetchQuotationsByRfq = useCallback(async (rfqId: string) => {
        const resp = await apiFetch(`/request-for-quotations/${rfqId}/quotations`);
        if (resp.ok) { const res = await resp.json(); return res.data || res; }
        return [];
    }, [apiFetch]);

    const fetchQuotationById = useCallback(async (id: string) => {
        const resp = await apiFetch(`/request-for-quotations/quotations/${id}`);
        if (resp.ok) { const res = await resp.json(); return res.data || res; }
        return null;
    }, [apiFetch]);

    const submitQuotation = useCallback(async (id: string) => {
        const resp = await apiFetch(`/request-for-quotations/quotations/${id}/submit`, { method: 'PUT' });
        if (resp.ok) { notify("Đã gửi báo giá", "success"); await refreshData(); return true; }
        return false;
    }, [apiFetch, refreshData, notify]);

    const reviewQuotation = useCallback(async (id: string) => {
        const resp = await apiFetch(`/request-for-quotations/quotations/${id}/review`, { method: 'PUT' });
        if (resp.ok) { notify("Đã xem xét báo giá", "success"); await refreshData(); return true; }
        return false;
    }, [apiFetch, refreshData, notify]);

    const acceptQuotation = useCallback(async (id: string) => {
        const resp = await apiFetch(`/request-for-quotations/quotations/${id}/accept`, { method: 'PUT' });
        if (resp.ok) { notify("Đã chấp nhận báo giá", "success"); await refreshData(); return true; }
        return false;
    }, [apiFetch, refreshData, notify]);

    const rejectQuotation = useCallback(async (id: string) => {
        const resp = await apiFetch(`/request-for-quotations/quotations/${id}/reject`, { method: 'PUT' });
        if (resp.ok) { notify("Đã từ chối báo giá", "info"); await refreshData(); return true; }
        return false;
    }, [apiFetch, refreshData, notify]);

    const updateQuotationAiScore = useCallback(async (id: string, aiScore: number) => {
        const resp = await apiFetch(`/request-for-quotations/quotations/${id}/ai-score`, { method: 'PUT', body: JSON.stringify({ aiScore }) });
        if (resp.ok) { notify("Đã cập nhật điểm AI", "success"); return true; }
        return false;
    }, [apiFetch, notify]);

    // ========== Q&A Threads ==========
    const createQAThread = useCallback(async (rfqId: string, d: CreateQAThreadDto) => {
        const resp = await apiFetch(`/request-for-quotations/${rfqId}/qa-threads`, { method: 'POST', body: JSON.stringify(d) });
        if (resp.ok) { notify("Tạo câu hỏi thành công", "success"); return true; }
        return false;
    }, [apiFetch, notify]);

    const fetchQAThreadsByRfq = useCallback(async (rfqId: string) => {
        const resp = await apiFetch(`/request-for-quotations/${rfqId}/qa-threads`);
        if (resp.ok) { const res = await resp.json(); return res.data || res; }
        return [];
    }, [apiFetch]);

    const fetchQAThreadById = useCallback(async (id: string) => {
        const resp = await apiFetch(`/request-for-quotations/qa-threads/${id}`);
        if (resp.ok) { const res = await resp.json(); return res.data || res; }
        return null;
    }, [apiFetch]);

    const answerQAThread = useCallback(async (id: string, answer: string) => {
        const resp = await apiFetch(`/request-for-quotations/qa-threads/${id}/answer`, { method: 'PUT', body: JSON.stringify({ answer }) });
        if (resp.ok) { notify("Đã trả lời câu hỏi", "success"); return true; }
        return false;
    }, [apiFetch, notify]);

    const fetchQAThreadsBySupplier = useCallback(async (rfqId: string, supplierId: string) => {
        const resp = await apiFetch(`/request-for-quotations/${rfqId}/qa-threads/supplier/${supplierId}`);
        if (resp.ok) { const res = await resp.json(); return res.data || res; }
        return [];
    }, [apiFetch]);

    // ========== RFQ Suppliers ==========
    const inviteSuppliersToRFQ = useCallback(async (rfqId: string, supplierIds: string[]) => {
        const resp = await apiFetch(`/request-for-quotations/${rfqId}/suppliers/invite`, { method: 'POST', body: JSON.stringify({ supplierIds }) });
        if (resp.ok) { notify("Đã mời nhà cung cấp", "success"); return true; }
        return false;
    }, [apiFetch, notify]);

    const removeSupplierFromRFQ = useCallback(async (rfqId: string, supplierId: string) => {
        const resp = await apiFetch(`/request-for-quotations/${rfqId}/suppliers/${supplierId}`, { method: 'DELETE' });
        if (resp.ok) { notify("Đã xóa nhà cung cấp", "success"); return true; }
        return false;
    }, [apiFetch, notify]);

    const searchAndAddSuppliers = useCallback(async (rfqId: string) => {
        const resp = await apiFetch(`/request-for-quotations/${rfqId}/search-and-add-suppliers`, { method: 'POST' });
        if (resp.ok) { notify("Đã tìm và thêm nhà cung cấp", "success"); return true; }
        return false;
    }, [apiFetch, notify]);

    // ========== Counter Offers ==========
    const createCounterOffer = useCallback(async (quotationId: string, d: CreateCounterOfferDto) => {
        const resp = await apiFetch(`/request-for-quotations/quotations/${quotationId}/counter-offers`, { method: 'POST', body: JSON.stringify(d) });
        if (resp.ok) { notify("Tạo đề xuất phản hồi thành công", "success"); return true; }
        return false;
    }, [apiFetch, notify]);

    const fetchCounterOffersByQuotation = useCallback(async (quotationId: string) => {
        const resp = await apiFetch(`/request-for-quotations/quotations/${quotationId}/counter-offers`);
        if (resp.ok) { const res = await resp.json(); return res.data || res; }
        return [];
    }, [apiFetch]);

    const fetchCounterOfferById = useCallback(async (id: string) => {
        const resp = await apiFetch(`/request-for-quotations/counter-offers/${id}`);
        if (resp.ok) { const res = await resp.json(); return res.data || res; }
        return null;
    }, [apiFetch]);

    const respondCounterOffer = useCallback(async (id: string, response: 'ACCEPT' | 'REJECT', notes?: string) => {
        const resp = await apiFetch(`/request-for-quotations/counter-offers/${id}/respond`, { 
            method: 'PUT', 
            body: JSON.stringify({ response, status: response === 'ACCEPT' ? 'ACCEPTED' : 'REJECTED', notes }) 
        });
        if (resp.ok) { notify(`Đã ${response === 'ACCEPT' ? 'chấp nhận' : 'từ chối'} đề xuất`, "success"); return true; }
        return false;
    }, [apiFetch, notify]);

    // ========== RFQ Management ==========
    const deleteRFQ = useCallback(async (id: string) => {
        const resp = await apiFetch(`/request-for-quotations/${id}`, { method: 'DELETE' });
        if (resp.ok) { notify("Đã xóa RFQ", "success"); await refreshData(); return true; }
        return false;
    }, [apiFetch, refreshData, notify]);

    const updateRFQStatus = useCallback(async (id: string, status: RfqStatus) => {
        const resp = await apiFetch(`/request-for-quotations/${id}/status`, { method: 'PUT', body: JSON.stringify({ status }) });
        if (resp.ok) { notify("Cập nhật trạng thái RFQ thành công", "success"); await refreshData(); return true; }
        return false;
    }, [apiFetch, refreshData, notify]);

    const fetchRFQById = useCallback(async (id: string) => {
        const resp = await apiFetch(`/request-for-quotations/${id}`);
        if (resp.ok) { const res = await resp.json(); return res.data || res; }
        return null;
    }, [apiFetch]);

    const fetchSuppliersByRFQ = useCallback(async (rfqId: string) => {
        const resp = await apiFetch(`/request-for-quotations/${rfqId}/suppliers`);
        if (resp.ok) { const res = await resp.json(); return res.data || res; }
        return [];
    }, [apiFetch]);

    const analyzeQuotationWithAI = useCallback(async (quotationId: string) => {
        const resp = await apiFetch(`/request-for-quotations/quotations/${quotationId}/analyze`, { method: 'POST' });
        if (resp.ok) { 
            notify("Đã phân tích báo giá bằng AI", "success");
            const res = await resp.json();
            return res.data || res; 
        }
        return null;
    }, [apiFetch, notify]);

    const fetchMySupplierRFQs = useCallback(async () => {
        const resp = await apiFetch('/request-for-quotations/my-supplier-rfqs');
        if (resp.ok) {
            const res = await resp.json();
            console.log("My supplier RFQs:", res.data);
            return res.data || res;
        }
        return [];
    }, [apiFetch]);

    // ========== Contracts ==========
    const fetchContractById = useCallback(async (id: string) => {
        const resp = await apiFetch(`/contracts/${id}`);
        if (resp.ok) { const res = await resp.json(); return res.data || res; }
        return null;
    }, [apiFetch]);

    const updateContract = useCallback(async (id: string, d: Partial<Contract>) => {
        const resp = await apiFetch(`/contracts/${id}`, { method: 'PATCH', body: JSON.stringify(d) });
        if (resp.ok) { notify("Cập nhật hợp đồng thành công", "success"); await refreshData(); return true; }
        return false;
    }, [apiFetch, refreshData, notify]);

    const removeContract = useCallback(async (id: string) => {
        const resp = await apiFetch(`/contracts/${id}`, { method: 'DELETE' });
        if (resp.ok) { notify("Đã xóa hợp đồng", "success"); await refreshData(); return true; }
        return false;
    }, [apiFetch, refreshData, notify]);

    const submitContractForApproval = useCallback(async (id: string, approverId: string) => {
        const resp = await apiFetch(`/contracts/${id}/submit`, { method: 'POST', body: JSON.stringify({ approverId }) });
        if (resp.ok) { notify("Đã gửi hợp đồng để phê duyệt", "success"); return true; }
        return false;
    }, [apiFetch, notify]);

    const updateContractMilestone = useCallback(async (milestoneId: string, d: UpdateMilestoneDto) => {
        const resp = await apiFetch(`/contracts/milestones/${milestoneId}`, { method: 'PATCH', body: JSON.stringify(d) });
        if (resp.ok) { notify("Cập nhật milestone thành công", "success"); return true; }
        return false;
    }, [apiFetch, notify]);

    const fetchContractsBySupplier = useCallback(async (supplierId: string) => {
        const resp = await apiFetch(`/contracts/supplier/${supplierId}`);
        if (resp.ok) { const res = await resp.json(); return res.data || res; }
        return [];
    }, [apiFetch]);

    // ========== GRN ==========
    const fetchGRNById = useCallback(async (id: string) => {
        const resp = await apiFetch(`/grn/${id}`);
        if (resp.ok) { const res = await resp.json(); return res.data || res; }
        return null;
    }, [apiFetch]);

    const updateGRNStatus = useCallback(async (id: string, status: GrnStatus) => {
        const resp = await apiFetch(`/grn/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) });
        if (resp.ok) { notify("Cập nhật trạng thái GRN thành công", "success"); await refreshData(); return true; }
        return false;
    }, [apiFetch, refreshData, notify]);

    const confirmGRN = useCallback(async (id: string) => {
        const resp = await apiFetch(`/grn/${id}/confirm`, { method: 'POST' });
        if (resp.ok) { notify("Đã xác nhận GRN", "success"); await refreshData(); return true; }
        return false;
    }, [apiFetch, refreshData, notify]);

    // ========== Invoices ==========
    const fetchInvoiceById = useCallback(async (id: string) => {
        const resp = await apiFetch(`/invoices/${id}`);
        if (resp.ok) { const res = await resp.json(); return res.data || res; }
        return null;
    }, [apiFetch]);

    const updateInvoice = useCallback(async (id: string, d: UpdateInvoiceDto) => {
        const resp = await apiFetch(`/invoices/${id}`, { method: 'PATCH', body: JSON.stringify(d) });
        if (resp.ok) { notify("Cập nhật hóa đơn thành công", "success"); await refreshData(); return true; }
        return false;
    }, [apiFetch, refreshData, notify]);

    const removeInvoice = useCallback(async (id: string) => {
        const resp = await apiFetch(`/invoices/${id}`, { method: 'DELETE' });
        if (resp.ok) { notify("Đã xóa hóa đơn", "success"); await refreshData(); return true; }
        return false;
    }, [apiFetch, refreshData, notify]);

    // ========== Payments ==========
    const createPayment = useCallback(async (d: CreatePaymentDto) => {
        const resp = await apiFetch('/payments', { method: 'POST', body: JSON.stringify(d) });
        if (resp.ok) { notify("Tạo thanh toán thành công", "success"); return true; }
        return false;
    }, [apiFetch, notify]);

    const completePayment = useCallback(async (id: string) => {
        const resp = await apiFetch(`/payments/${id}/complete`, { method: 'POST' });
        if (resp.ok) { notify("Đã hoàn tất thanh toán", "success"); await refreshData(); return true; }
        return false;
    }, [apiFetch, refreshData, notify]);

    const fetchPayments = useCallback(async () => {
        const resp = await apiFetch('/payments');
        if (resp.ok) { const res = await resp.json(); return res.data || res; }
        return [];
    }, [apiFetch]);

    const fetchPaymentById = useCallback(async (id: string) => {
        const resp = await apiFetch(`/payments/${id}`);
        if (resp.ok) { const res = await resp.json(); return res.data || res; }
        return null;
    }, [apiFetch]);

    // ========== Reviews ==========
    const fetchSupplierReviews = useCallback(async (supplierId: string) => {
        const resp = await apiFetch(`/reviews/supplier/${supplierId}`);
        if (resp.ok) { const res = await resp.json(); return res.data || res; }
        return [];
    }, [apiFetch]);

    const fetchBuyerRatings = useCallback(async () => {
        const resp = await apiFetch('/reviews/buyer-ratings');
        if (resp.ok) { const res = await resp.json(); return res.data || res; }
        return [];
    }, [apiFetch]);

    // ========== PO ==========
    const fetchPOById = useCallback(async (id: string) => {
        const resp = await apiFetch(`/purchase-orders/${id}`);
        if (resp.ok) { const res = await resp.json(); return res.data || res; }
        return null;
    }, [apiFetch]);

    const fetchSupplierPOs = useCallback(async (supplierId: string) => {
        const resp = await apiFetch(`/purchase-orders/supplier/${supplierId}`);
        if (resp.ok) { const res = await resp.json(); return res.data || res || []; }
        return [];
    }, [apiFetch]);

    const confirmPO = useCallback(async (id: string) => {
        const resp = await apiFetch(`/purchase-orders/${id}/confirm`, { method: 'POST' });
        if (resp.ok) { 
            notify("Đã xác nhận đơn hàng", "success"); 
            const res = await resp.json();
            return res.data || res; 
        }
        return null;
    }, [apiFetch, notify]);

    const submitPO = useCallback(async (id: string) => {
        const resp = await apiFetch(`/purchase-orders/${id}/submit`, { method: 'POST' });
        if (resp.ok) { 
            notify("Đã gửi đơn hàng phê duyệt", "success"); 
            const res = await resp.json();
            return res.data || res; 
        }
        return null;
    }, [apiFetch, notify]);

    // ========== Invoices ==========
    const fetchInvoices = useCallback(async () => {
        const resp = await apiFetch('/invoices');
        if (resp.ok) { const res = await resp.json(); return res.data || res; }
        return [];
    }, [apiFetch]);

    const runMatching = useCallback(async (id: string) => {
        const resp = await apiFetch(`/invoices/${id}/run-matching`, { method: 'POST' });
        if (resp.ok) { 
            notify("Đã thực hiện đối soát 3 bên", "success"); 
            const res = await resp.json();
            return res.data || res; 
        }
        return null;
    }, [apiFetch, notify]);

    // ========== Supplier KPI ==========
    const evaluateSupplierKPI = useCallback(async (supplierId: string) => {
        const orgId = state.currentUser?.orgId;
        const resp = await apiFetch(`/supplier-kpis/evaluate/${supplierId}`, { 
            method: 'POST',
            body: JSON.stringify({ orgId })
        });
        if (resp.ok) { 
            notify("Đánh giá KPI thành công", "success"); 
            const res = await resp.json();
            const data = res.data || res;
            const kpiScore = data?.kpiScore || data;
            const aiInsights = data?.aiInsights;
            
            // Map API tier values to UI expected values
            const tierMap: Record<string, string> = {
                'STRATEGIC': 'GOLD',
                'PREFERRED': 'SILVER',
                'APPROVED': 'BRONZE',
                'PROVISIONAL': 'BRONZE',
                'BLACKLISTED': 'BRONZE',
            };
            
            // Transform API data to match UI expected structure
            return {
                ...kpiScore,
                score: aiInsights?.overallScore ?? kpiScore?.overallScore ?? kpiScore?.otdScore ?? 0,
                quarter: `Q${kpiScore?.periodQuarter || 1} ${kpiScore?.periodYear || 2026}`,
                tier: tierMap[kpiScore?.tier] || 'BRONZE',
                supplier: kpiScore?.supplier || { id: supplierId, name: 'Nhà cung cấp' },
                metrics: {
                    onTimeDelivery: { score: kpiScore?.otdScore ?? 0 },
                    qualityScore: { score: kpiScore?.qualityScore ?? 0 },
                    priceCompetitiveness: { score: kpiScore?.priceScore ?? 0 },
                    invoiceAccuracy: { score: parseFloat(kpiScore?.invoiceAccuracy) || 0 },
                    responsiveness: { score: parseFloat(kpiScore?.responseTimeScore) || 0 },
                    orderFulfillment: { score: parseFloat(kpiScore?.fulfillmentRate) || 0 },
                },
                aiInsights,
            }; 
        }
        return null;
    }, [apiFetch, notify, state.currentUser]);

    const fetchSupplierKPIReport = useCallback(async (supplierId: string) => {
        const orgId = state.currentUser?.orgId;
        const resp = await apiFetch(`/supplier-kpis/report/${supplierId}`, {
            method: 'POST', // Changed to POST to send body
            body: JSON.stringify({ orgId })
        });
        if (resp.ok) { 
            const res = await resp.json(); 
            const data = res.data || res;
            // Handle both single object and array responses
            const items = Array.isArray(data) ? data : [data];
            const tierMap: Record<string, string> = {
                'STRATEGIC': 'GOLD',
                'PREFERRED': 'SILVER',
                'APPROVED': 'BRONZE',
                'PROVISIONAL': 'BRONZE',
                'BLACKLISTED': 'BRONZE',
            };
            return items.map((item: Record<string, unknown>) => {
                const kpiScore = item?.kpiScore || item;
                const aiInsights = item?.aiInsights;
                return {
                    ...kpiScore,
                    score: aiInsights?.overallScore ?? kpiScore?.overallScore ?? kpiScore?.otdScore ?? 0,
                    quarter: `Q${kpiScore?.periodQuarter || 1} ${kpiScore?.periodYear || 2026}`,
                    tier: tierMap[kpiScore?.tier] || 'BRONZE',
                    supplier: kpiScore?.supplier || { id: supplierId, name: 'Nhà cung cấp' },
                    metrics: {
                        onTimeDelivery: { score: kpiScore?.otdScore ?? 0 },
                        qualityScore: { score: kpiScore?.qualityScore ?? 0 },
                        priceCompetitiveness: { score: kpiScore?.priceScore ?? 0 },
                        invoiceAccuracy: { score: parseFloat(kpiScore?.invoiceAccuracy) || 0 },
                        responsiveness: { score: parseFloat(kpiScore?.responseTimeScore) || 0 },
                        orderFulfillment: { score: parseFloat(kpiScore?.fulfillmentRate) || 0 },
                    },
                    aiInsights,
                };
            });
        }
        return [];
    }, [apiFetch, state.currentUser]);

    // ========== Audit Logs ==========
    const fetchAuditLogsByEntity = useCallback(async (type: string, id: string) => {
        const resp = await apiFetch(`/audit-logs/entity?type=${type}&id=${id}`);
        if (resp.ok) { const res = await resp.json(); return res.data || res; }
        return [];
    }, [apiFetch]);

    const fetchAuditLogById = useCallback(async (id: string) => {
        const resp = await apiFetch(`/audit-logs/${id}`);
        if (resp.ok) { const res = await resp.json(); return res.data || res; }
        return null;
    }, [apiFetch]);

    const createAuditLog = useCallback(async (dto: { entityType: string; entityId: string; action: string; oldValue?: unknown; newValue?: unknown }) => {
        const resp = await apiFetch('/audit-logs', { method: 'POST', body: JSON.stringify(dto) });
        if (resp.ok) { return true; }
        return false;
    }, [apiFetch]);

    const addQuoteRequest = useCallback(async (d: Record<string, unknown>): Promise<QuoteRequest | null> => {
        const id = "qr-" + Math.random().toString(36).substring(2, 11);
        const newQR: QuoteRequest = {
            id,
            qrNumber: "QR-" + id.substring(0, 5).toUpperCase(),
            title: d.title as string,
            description: (d.description as string) || "",
            status: QuoteRequestStatus.DRAFT,
            createdAt: new Date().toISOString(),
            items: (d.items as QuoteRequestItem[]) || [],
            requiredDate: d.requiredDate as string | undefined
        };
        setState(prev => ({ ...prev, quoteRequests: [...prev.quoteRequests, newQR] }));
        notify("Tạo yêu cầu báo giá thành công (Mô phỏng)", "success");
        return newQR;
    }, [notify]);

    const updateQuoteRequest = useCallback(async (id: string, d: Partial<QuoteRequest>): Promise<boolean> => {
        setState(prev => ({
            ...prev,
            quoteRequests: prev.quoteRequests.map(qr => qr.id === id ? { ...qr, ...d } : qr)
        }));
        notify("Cập nhật yêu cầu báo giá thành công", "success");
        return true;
    }, [notify]);

    const submitQuoteRequest = useCallback(async (id: string): Promise<boolean> => {
        setState(prev => ({
            ...prev,
            quoteRequests: prev.quoteRequests.map(qr => qr.id === id ? { ...qr, status: QuoteRequestStatus.SUBMITTED } : qr)
        }));
        notify("Đã gửi yêu cầu báo giá", "success");
        return true;
    }, [notify]);

    // ========== PO Consolidation ==========
    const consolidatePRs = useCallback(async (dto: ConsolidatePRsInput): Promise<ConsolidatePRsResult | null> => {
        const resp = await apiFetch('/purchase-orders/consolidate', {
            method: 'POST',
            body: JSON.stringify(dto),
        });
        if (resp.ok) {
            const res = await resp.json();
            const data = res.data || res;
            notify(`PO gộp ${data.poNumber} tạo thành công`, 'success');
            return data as ConsolidatePRsResult;
        }
        const errText = await resp.text().catch(() => '');
        notify(errText || 'Không thể tạo PO gộp', 'error');
        return null;
    }, [apiFetch, notify]);

    // ========== RAG / AI Sync ==========
    const syncRAG = useCallback(async (): Promise<boolean> => {
        const resp = await apiFetch('/rag/sync', { method: 'POST' });
        if (resp.ok) {
            notify('Đồng bộ RAG toàn hệ thống thành công', 'success');
            return true;
        }
        notify('Lỗi khi đồng bộ RAG', 'error');
        return false;
    }, [apiFetch, notify]);

    const ingestRAGEntity = useCallback(async (entity: string): Promise<boolean> => {
        const resp = await apiFetch(`/rag/ingest/${entity}`, { method: 'POST' });
        if (resp.ok) return true;
        notify(`Lỗi ingest entity: ${entity}`, 'error');
        return false;
    }, [apiFetch, notify]);

    // ========== Spend Reports ==========
    const fetchSpendOverview = useCallback(async (): Promise<SpendOverview | null> => {
        const resp = await apiFetch('/reports/overview');
        if (resp.ok) { const res = await resp.json(); return (res.data || res) as SpendOverview; }
        return null;
    }, [apiFetch]);

    const fetchSpendBySupplier = useCallback(async (): Promise<SpendBySupplier[]> => {
        const resp = await apiFetch('/reports/spend-by-supplier');
        if (resp.ok) { const res = await resp.json(); const d = res.data || res; return Array.isArray(d) ? d : []; }
        return [];
    }, [apiFetch]);

    const fetchSpendByCategory = useCallback(async (): Promise<SpendByCategory[]> => {
        const resp = await apiFetch('/reports/spend-by-category');
        if (resp.ok) { const res = await resp.json(); const d = res.data || res; return Array.isArray(d) ? d : []; }
        return [];
    }, [apiFetch]);

    const contextValue: ProcurementContextType = {
        ...state,
        login, logout, refreshData, apiFetch, addPR, submitPR, updatePR, fetchPrDetail, actionApproval,
        addBudgetAllocation, submitAllocation, approveAllocation, rejectAllocation, distributeAnnualBudget, reconcileQuarter,
        approveOverride, rejectOverride, convertQuoteToPR,
        removeNotification, notify,
        createPO, createPOFromPR, processPOAutomation, ackPO, shipPO, fetchPOById, confirmPO, submitPO, fetchSupplierPOs, rejectPO,
        createRFQ, createRFQConsolidated: async () => true, awardQuotation,
        addDept, updateDept, removeDept,
        addUser, updateUser, removeUser,
        addOrganization, updateOrganization, removeOrganization,
        addProduct, updateProduct, removeProduct,
        addCategory, updateCategory, removeCategory,
        addCostCenter, updateCostCenter, removeCostCenter, fetchCostCenter, fetchMyDeptCostCenters,
        addBudgetPeriod, updateBudgetPeriod, removeBudgetPeriod,
        updateBudgetAllocation, removeBudgetAllocation,
        fetchQuarterlyAllocation,
        addQuoteRequest, updateQuoteRequest, submitQuoteRequest,
        sendQuoteRequestToSupplier: async () => true, createPRFromQuoteRequest: async () => true,
        startSimulation: () => {}, nextSimulationStep: () => {}, stopSimulation: () => {},
        confirmCatalogPrice: async () => true, register, createQuote,
        createGRN, updateGrnItemQc, createInvoice, payInvoice, matchInvoice,
        approvePR: async () => true,
        createContract, signContract, createDispute, createReview,
        // Auth
        logoutApi, refreshToken, validateToken,
        // Users
        fetchUserProfile, fetchUserById, createDelegation, fetchMyDelegations, toggleDelegation,
        // Organizations & Departments
        fetchOrganizationById, fetchMyOrganization, fetchDepartmentById,
        // Budget
        fetchBudgetPeriodsByType, fetchMyDeptBudgets, fetchBudgetAllocationById, fetchBudgetOverrideById,
        // RFQ Quotations
        fetchQuotationsByRfq, fetchQuotationById, submitQuotation, reviewQuotation, acceptQuotation, rejectQuotation, updateQuotationAiScore,
        // Q&A Threads
        createQAThread, fetchQAThreadsByRfq, fetchQAThreadById, answerQAThread, fetchQAThreadsBySupplier,
        // RFQ Suppliers
        inviteSuppliersToRFQ, removeSupplierFromRFQ, searchAndAddSuppliers,
        // Counter Offers
        createCounterOffer, fetchCounterOffersByQuotation, fetchCounterOfferById, respondCounterOffer,
        // RFQ Management
        deleteRFQ, updateRFQStatus, fetchRFQById, fetchSuppliersByRFQ, analyzeQuotationWithAI, fetchMySupplierRFQs,
        // Contracts
        fetchContractById, updateContract, removeContract, submitContractForApproval, updateContractMilestone, fetchContractsBySupplier,
        // GRN
        fetchGRNById, updateGRNStatus, confirmGRN,
        // Invoices
        fetchInvoiceById, updateInvoice, removeInvoice, fetchInvoices, runMatching,
        // Payments
        createPayment, completePayment, fetchPayments, fetchPaymentById,
        // Reviews
        fetchSupplierReviews, fetchBuyerRatings,
        // Supplier KPI
        evaluateSupplierKPI, fetchSupplierKPIReport,
        // Audit Logs
        fetchAuditLogsByEntity, fetchAuditLogById, createAuditLog,
        // PO Consolidation
        consolidatePRs,
        // RAG / AI Sync
        syncRAG, ingestRAGEntity,
        // Spend Reports
        fetchSpendOverview, fetchSpendBySupplier, fetchSpendByCategory,
    };

    return <ProcurementContext.Provider value={contextValue}>{children}</ProcurementContext.Provider>;
}

export const useProcurement = () => {
    const context = useContext(ProcurementContext);
    if (!context) throw new Error("useProcurement must be used within a ProcurementProvider");
    return context;
};
