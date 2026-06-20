"use client";

import React, { createContext, useContext, useState, useCallback, ReactNode, useMemo, useRef, useEffect } from "react";
import Cookies from 'js-cookie';
import {
    Organization, CostCenter, Department, CurrencyCode, CompanyType, KycStatus, UserRole, 
    PrStatus, RfqStatus, QuotationStatus, PoStatus, GrnStatus, InvoiceStatus, ApprovalStatus, DocumentType, 
    BudgetAllocationStatus, BudgetOverrideStatus, BudgetPeriodType,
    RegisterPayload, CreatePrDto, UpdatePrDto, CreateRfqDto, ConsolidateRfqDto,
    CreateGrnDto, CreateInvoiceDto, CreateQuoteDto, CreateOrganizationPayload, UpdateOrganizationPayload, 
    CreateCostCenterPayload, UpdateCostCenterPayload, CreateDepartmentPayload, UpdateDepartmentPayload, 
    Product, ProductCategory, CreateProductDtoShort, UpdateProductDtoShort, CreateCategoryDto, UpdateCategoryDto,
    User, BudgetPeriod, BudgetAllocation, CreateUserPayload, UpdateUserPayload, CreateBudgetPeriodPayload, UpdateBudgetPeriodPayload,
    CreateBudgetAllocationPayload, UpdateBudgetAllocationPayload, CreatePoDto,
    PR, PRItem, QuoteRequest, QuoteRequestItem, BudgetOverride, PrType, QuoteRequestStatus,
    Contract, Dispute, AuditLog, SupplierEvaluation,
    Quotation, QAThread, CreateQAThreadDto,
    CounterOffer, CreateCounterOfferDto,
    Payment, CreatePaymentDto,
    UserDelegation, CreateDelegationDto,
    UpdateMilestoneDto,
    UpdateInvoiceDto,
    SupplierKPI,

} from "../types/api-types";
import { convertPrismaDecimal } from "../utils/formatUtils";

export type { 
    Organization, CostCenter, Department, Product, ProductCategory, User, BudgetPeriod, BudgetAllocation, 
    PR, PRItem, QuoteRequest, QuoteRequestItem, BudgetOverride,
    Contract, Dispute, AuditLog, SupplierEvaluation, Quotation
};

export {
    CurrencyCode, CompanyType, KycStatus, UserRole, PrStatus, RfqStatus, QuotationStatus, 
    PoStatus, GrnStatus, InvoiceStatus, ApprovalStatus, DocumentType, BudgetAllocationStatus, BudgetOverrideStatus, BudgetPeriodType,
    PrType, QuoteRequestStatus
};

export interface Notification {
    id: number; message: string; type: 'success' | 'error' | 'info' | 'warning'; role?: string; title?: string;
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
    prNumber?: string;
    poNumber?: string;
    consolidationSummary?: ConsolidationSummary;
    title?: string;
    reason?: string;
    description?: string;
    justification?: string;
    status: string;
    createdAt: string;
    requester?: { 
        id: string;
        fullName?: string; 
        name?: string; 
        role?: string;
        email?: string;
    };
    department?: { name: string } | string;
    deptId?: string;
    costCenterId?: string;
    costCenter?: { code: string; name?: string };
    procurementId?: string;
    totalEstimate?: number;
    total?: number;
    items?: PRItem[];
    attachments?: { name: string, url: string }[];
    creatorRole?: string; // Fallback helper
    targetApproverRole?: string;
}

export interface POItem {
    id: string; description: string; qty: number; estimatedPrice?: number; unitPrice?: number; total?: number;
}

export interface PO {
    id: string; poNumber: string; vendor?: string; supplierId?: string; orgId?: string; items: POItem[]; status: PoStatus | string; total?: number; totalAmount?: number; createdAt?: string;
    supplier?: { id?: string; name?: string; [key: string]: unknown };
}

export interface RFQ {
    id: string;
    prId: string;
    vendor: string;
    status: string;
    title?: string;
    rfqNumber?: string;
    description?: string;
    deadline?: string;
    dueDate?: string;
    type?: string;
    createdAt?: string;
    items?: PRItem[];
    attachments?: { name: string, url: string }[];
    messages?: { sender: string, senderRole: string, text: string, timestamp: string }[];
    suppliers?: Organization[];
    supplierIds?: string[];
    pr?: { id: string; prNumber?: string; title?: string; totalEstimate?: number; costCenter?: { code?: string }; department?: { name?: string }; requester?: { fullName?: string; name?: string }; [key: string]: unknown };
    createdBy?: { id: string; fullName?: string; name?: string; [key: string]: unknown };
}

export interface GRN {
    id: string; grnNumber: string; poId: string; receivedItems: Record<string, number>; createdAt: string;
    items?: { id: string; poItemId: string; acceptedQty?: number; receivedQty?: number }[];
}

export interface Invoice {
    id: string; invoiceNumber: string; vendor: string; poId: string; amount: number; totalAmount?: number; status: InvoiceStatus | string; createdAt: string;
}

export interface BudgetStats {
    allocated: number; committed: number; spent: number;
}

export interface ApprovalWorkflow {
    id: string; documentId: string; documentType: DocumentType; status: ApprovalStatus; comment?: string; createdAt?: string;
}

export interface Quote {
    id: string;
    rfqId: string;
    supplierId: string;
    totalPrice: number;
    currency: string;
    leadTimeDays: number;
    status: string;
    createdAt: string;
}

export interface SpendOverview {
    totalSpend?: number;
    totalSpent?: number;
    totalOrders?: number;
    avgOrderValue?: number;
    poCount?: number;
    prCount?: number;
    invoiceCount?: number;
    supplierCount?: number;
    currency?: string;
}

export interface SpendBySupplier {
    supplierId?: string;
    supplierName: string;
    totalSpend?: number;
    totalAmount?: number;
    orderCount?: number;
}

export interface SpendByCategory {
    category?: string;
    categoryName?: string;
    totalSpend?: number;
    totalAmount?: number;
    orderCount?: number;
}

export interface ProcurementState {
    currentUser: User | null;
    prs: PR[];
    myPrs: PR[];
    pos: PO[];
    allPos: PO[];
    rfqs: RFQ[];
    grns: GRN[];
    invoices: Invoice[];
    budgets: BudgetStats | null;
    users: User[];
    departments: Department[];
    costCenters: CostCenter[];
    organizations: Organization[];
    budgetPeriods: BudgetPeriod[];
    budgetAllocations: BudgetAllocation[];
    budgetOverrides: BudgetOverride[];
    notifications: Notification[];
    quotes: Quote[];
    products: Product[];
    categories: ProductCategory[];
    approvals: ApprovalWorkflow[];
    fiscalYears: number[];
    quoteRequests: QuoteRequest[];
    loadingMyPrs: boolean;
    simulation: { workflow: 'CATALOG' | 'NON_CATALOG' | null; step: number; isActive: boolean };
    contracts: Contract[];
    disputes: Dispute[];
    auditLogs: AuditLog[];
    supplierEvaluations: SupplierEvaluation[];
    isAuthChecking: boolean;
}

export interface ProcurementContextType extends ProcurementState {
    login: (email: string, password?: string) => Promise<boolean>;
    logout: () => Promise<void>;
    refreshData: () => Promise<void>;
    apiFetch: (url: string, options?: RequestInit) => Promise<Response>;
    addPR: (data: Partial<PR>) => Promise<string>;
    approvePR: (id: string) => Promise<boolean>;
    createRFQ: (d: CreateRfqDto) => Promise<unknown>;
    createRFQConsolidated: (d: ConsolidateRfqDto) => Promise<boolean>;
    actionApproval: (workflowId: string, action: string, memo?: string) => Promise<boolean>;
    addDept: (data: CreateDepartmentPayload) => Promise<boolean>;
    updateDept: (id: string, data: UpdateDepartmentPayload) => Promise<boolean>;
    removeDept: (id: string) => Promise<boolean>;
    addUser: (data: Partial<User>) => Promise<boolean>;
    updateUser: (id: string, data: Partial<User>) => Promise<boolean>;
    addBudgetAllocationBundle?: (data: Partial<BudgetAllocation>[]) => Promise<boolean>;
    addCostCenter: (d: CreateCostCenterPayload) => Promise<boolean>;
    updateCostCenter: (id: string, d: UpdateCostCenterPayload) => Promise<boolean>;
    removeCostCenter: (id: string) => Promise<boolean>;
    addOrganization: (data: CreateOrganizationPayload) => Promise<boolean>;
    updateOrganization: (id: string, data: UpdateOrganizationPayload) => Promise<boolean>;
    removeOrganization: (id: string) => Promise<boolean>;
    ackPO: (id: string) => Promise<boolean>;
    shipPO: (id: string) => Promise<boolean>;
    payInvoice: (id: string) => Promise<boolean>;
    matchInvoice: (id: string) => Promise<boolean>;
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
    fetchSuppliersByRFQ: (rfqId: string) => Promise<Organization[]>;
    analyzeQuotationWithAI: (quotationId: string) => Promise<unknown>;
    fetchMySupplierRFQs: () => Promise<RFQ[]>;
    fetchContractById: (id: string) => Promise<Contract | null>;
    updateContract: (id: string, d: Partial<Contract>) => Promise<boolean>;
    removeContract: (id: string) => Promise<boolean>;
    submitContractForApproval: (id: string) => Promise<boolean>;
    terminateContract: (id: string, reason: string) => Promise<boolean>;
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
    consolidatePRs: (dto: ConsolidatePRsInput) => Promise<ConsolidatePRsResult>;
    // RAG / AI Sync
    syncRAG: () => Promise<boolean>;
    ingestRAGEntity: (entity: string) => Promise<boolean>;
    clearRAGEntity: (entity: string) => Promise<boolean>;
    clearRAG: () => Promise<boolean>;
    // Spend Reports
    fetchSpendOverview: () => Promise<SpendOverview | null>;
    fetchSpendBySupplier: () => Promise<SpendBySupplier[]>;
    fetchSpendByCategory: () => Promise<SpendByCategory[]>;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    fetchBuyerDashboard: () => Promise<any>;
    // PO helpers
    fetchPOById: (id: string) => Promise<PO | null>;
    confirmPO: (id: string) => Promise<unknown>;
    submitPO: (id: string) => Promise<unknown>;
    rejectPO: (id: string) => Promise<unknown>;
    createPOFromPR: (prId: string, supplierId?: string) => Promise<unknown>;
    processPOAutomation: (poId: string) => Promise<unknown>;
    awardQuotation: (rfqId: string, quotationId: string) => Promise<boolean>;
    fetchPrDetail: (id: string) => Promise<PR | null>;
    // Categories CRUD
    addCategory: (data: Partial<ProductCategory>) => Promise<boolean>;
    updateCategory: (id: string, data: Partial<ProductCategory>) => Promise<boolean>;
    removeCategory: (id: string) => Promise<boolean>;
    // Products CRUD
    addProduct: (data: Partial<Product>) => Promise<boolean>;
    updateProduct: (id: string, data: Partial<Product>) => Promise<boolean>;
    removeProduct: (id: string) => Promise<boolean>;
    // PR helpers
    submitPR: (id: string) => Promise<boolean>;
    // User management
    removeUser: (id: string) => Promise<boolean>;
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
        isAuthChecking: true, fiscalYears: [], quotes: []
    });

    useEffect(() => {
        const savedData = localStorage.getItem('erp_sim_state');
        if (savedData) {
            try {
                const parsed = JSON.parse(savedData);
                setState(prev => ({
                    ...prev,
                    ...parsed,
                    currentUser: prev.currentUser
                }));
            } catch (e) { console.error(e); }
        }
    }, []);

    const removeNotification = useCallback((id: number) => {
        setState(prev => ({ ...prev, notifications: prev.notifications.filter(n => n.id !== id) }));
    }, []);

    const notify = useCallback((message: string, type: Notification['type'] = 'info', role?: string) => {
        const id = Date.now();
        setState(prev => ({
            ...prev,
            notifications: [...prev.notifications, { id, message, type, role }]
        }));
        setTimeout(() => {
            setState(prev => ({ ...prev, notifications: prev.notifications.filter(n => n.id !== id) }));
        }, 5000);
    }, []);

    const apiFetch = useCallback(async (url: string, options: RequestInit = {}) => {
        const token = Cookies.get('token');
        const headers: Record<string, string> = {
            'Content-Type': 'application/json',
            ...(options.headers as Record<string, string> || {})
        };
        if (token) headers['Authorization'] = `Bearer ${token}`;

        const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
        return fetch(`${baseUrl}${url}`, { ...options, headers });
    }, []);

    const refreshDataCore = useCallback(async () => {
        setState(prev => ({ ...prev, loadingMyPrs: true }));
        try {
            const userJson = Cookies.get('user');
            const user = userJson ? JSON.parse(userJson) : null;

            // Fire all requests in parallel — no artificial batching delay
            const [
                periodsResp, allocsResp, prsResp, myPrsResp, approvalsResp,
                orgsResp, deptsResp, usersResp, productsResp, categoriesResp,
                ccResp, posResp, posAllResp, rfqsResp, grnsResp, invoicesResp,
                contractsResp, disputesResp
            ] = await Promise.all([
                apiFetch('/budgets/periods'),
                apiFetch('/budgets/allocations'),
                apiFetch('/procurement-requests'),
                apiFetch('/procurement-requests/my'),
                apiFetch('/approvals/pending'),
                apiFetch('/organizations'),
                apiFetch('/departments'),
                apiFetch('/users'),
                apiFetch('/products'),
                apiFetch('/products/categories'),
                apiFetch('/cost-centers'),
                apiFetch('/purchase-orders'),
                apiFetch('/purchase-orders/all'),
                apiFetch('/request-for-quotations'),
                apiFetch('/grn'),
                apiFetch('/invoices'),
                apiFetch('/contracts'),
                apiFetch('/disputes'),
            ]);

            // Role-gated calls (parallel with each other)
            let newBudgetOverrides: BudgetOverride[] | null = null;
            let newAuditLogs: AuditLog[] | null = null;
            if (user && ["FINANCE", "DIRECTOR", "CEO", "PLATFORM_ADMIN"].includes(user.role)) {
                const [overridesResp, auditResp] = await Promise.all([
                    apiFetch('/budgets/overrides'),
                    apiFetch('/audit-logs'),
                ]);
                if (overridesResp.ok) {
                    const res = await overridesResp.json();
                    const d = res.data || res;
                    if (Array.isArray(d)) {
                        newBudgetOverrides = d.map((override: BudgetOverride) => ({
                            ...override,
                            overrideAmount: convertPrismaDecimal(override.overrideAmount),
                        }));
                    }
                }
                if (auditResp.ok) {
                    const res = await auditResp.json();
                    const d = res.data || res;
                    if (Array.isArray(d)) newAuditLogs = d;
                }
            }

            // Parse all responses into local variables
            const parseArr = async (resp: Response) => {
                const res = await resp.json();
                const d = res.data || res;
                return Array.isArray(d) ? d : null;
            };

            const [
                periodsData, allocsData, rawPrsData, rawMyPrsData, approvalsData,
                orgsData, deptsData, usersData, productsData, categoriesData,
                ccData, posData, posAllData, rfqsData, grnsData, invoicesData,
                contractsData, disputesData,
            ] = await Promise.all([
                periodsResp.ok  ? parseArr(periodsResp)    : Promise.resolve(null),
                allocsResp.ok   ? parseArr(allocsResp)     : Promise.resolve(null),
                prsResp.ok      ? parseArr(prsResp)        : Promise.resolve(null),
                myPrsResp.ok    ? parseArr(myPrsResp)      : Promise.resolve(null),
                approvalsResp.ok? parseArr(approvalsResp)  : Promise.resolve(null),
                orgsResp.ok     ? parseArr(orgsResp)       : Promise.resolve(null),
                deptsResp.ok    ? parseArr(deptsResp)      : Promise.resolve(null),
                usersResp.ok    ? parseArr(usersResp)      : Promise.resolve(null),
                productsResp.ok ? parseArr(productsResp)   : Promise.resolve(null),
                categoriesResp.ok? parseArr(categoriesResp): Promise.resolve(null),
                ccResp?.ok      ? parseArr(ccResp)         : Promise.resolve(null),
                posResp?.ok     ? parseArr(posResp)        : Promise.resolve(null),
                posAllResp?.ok  ? parseArr(posAllResp)     : Promise.resolve(null),
                rfqsResp?.ok    ? parseArr(rfqsResp)       : Promise.resolve(null),
                grnsResp?.ok    ? parseArr(grnsResp)       : Promise.resolve(null),
                invoicesResp?.ok? parseArr(invoicesResp)   : Promise.resolve(null),
                contractsResp.ok? parseArr(contractsResp)  : Promise.resolve(null),
                disputesResp.ok ? parseArr(disputesResp)   : Promise.resolve(null),
            ]);

            const normalizePR = (p: PR): PR => ({
                ...p,
                title:     p.title || p.description || p.prNumber || "Yêu cầu mua sắm",
                type:      p.type || PrType.NON_CATALOG,
                requester: p.requester || { id: "u-unknown" },
                totalEstimate: convertPrismaDecimal(p.totalEstimate),
                items: p.items?.map(item => ({
                    ...item,
                    qty: convertPrismaDecimal(item.qty),
                    quantity: convertPrismaDecimal(item.quantity),
                    estimatedPrice: convertPrismaDecimal(item.estimatedPrice),
                    totalPrice: convertPrismaDecimal(item.totalPrice),
                })) || p.items,
            });

            const normalizeBudgetAlloc = (b: BudgetAllocation): BudgetAllocation => ({
                ...b,
                allocatedAmount: convertPrismaDecimal(b.allocatedAmount),
                committedAmount: convertPrismaDecimal(b.committedAmount),
                spentAmount: convertPrismaDecimal(b.spentAmount),
            });

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const normalizeInvoice = (i: any): Invoice => {
                const canonical = convertPrismaDecimal(i.totalAmount ?? i.amount ?? i.total);
                return {
                    ...i,
                    totalAmount: canonical,
                    amount: canonical,
                    vendor: i.vendor || i.supplierName || i.supplier?.name || 'N/A',
                };
            };

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const normalizePO = (p: any): PO => ({
                ...p,
                total: convertPrismaDecimal(p.total ?? p.totalAmount),
                totalAmount: convertPrismaDecimal(p.totalAmount ?? p.total),
                vendor: p.vendor || p.supplierName || p.supplier?.name || p.supplierId || 'N/A',
                items: p.items?.map((item: Record<string, unknown>) => ({
                    ...item,
                    qty: convertPrismaDecimal(item.qty ?? item.quantity),
                    quantity: convertPrismaDecimal(item.quantity ?? item.qty),
                    unitPrice: convertPrismaDecimal(item.unitPrice ?? item.estimatedPrice),
                    estimatedPrice: convertPrismaDecimal(item.estimatedPrice ?? item.unitPrice),
                    totalPrice: convertPrismaDecimal(item.totalPrice ?? item.total),
                })) || [],
            });

            const prsData   = rawPrsData   ? rawPrsData.map(normalizePR)   : null;
            const myPrsData = rawMyPrsData ? rawMyPrsData.map(normalizePR) : null;
            const allocsDataNormalized = allocsData ? allocsData.map(normalizeBudgetAlloc) : null;
            const invoicesNormalized   = invoicesData ? invoicesData.map(normalizeInvoice) : null;
            const posNormalized        = posData  ? posData.map(normalizePO)  : null;
            const posAllNormalized     = posAllData ? posAllData.map(normalizePO) : null;

            // Single atomic setState — triggers exactly 1 re-render
            setState(prev => ({
                ...prev,
                ...(periodsData    !== null && { budgetPeriods: periodsData }),
                ...(allocsDataNormalized !== null && { budgetAllocations: allocsDataNormalized }),
                ...(prsData        !== null && { prs: prsData }),
                ...(myPrsData      !== null && { myPrs: myPrsData }),
                ...(approvalsData  !== null && { approvals: approvalsData }),
                ...(orgsData       !== null && { organizations: orgsData }),
                ...(deptsData      !== null && { departments: deptsData }),
                ...(usersData      !== null && { users: usersData }),
                ...(productsData   !== null && { products: productsData }),
                ...(categoriesData !== null && { categories: categoriesData }),
                ...(ccData         !== null && { costCenters: ccData }),
                ...(posNormalized        !== null && { pos: posNormalized }),
                ...(posAllNormalized     !== null && { allPos: posAllNormalized }),
                ...(rfqsData       !== null && { rfqs: rfqsData }),
                ...(grnsData       !== null && { grns: grnsData }),
                ...(invoicesNormalized   !== null && { invoices: invoicesNormalized }),
                ...(contractsData  !== null && { contracts: (contractsData as Contract[]).map((c) => ({ ...c, totalValue: (c as unknown as Record<string,unknown>).totalValue ?? (c as unknown as Record<string,unknown>).value ?? 0, supplier: (c as unknown as Record<string,unknown>).supplierOrg ?? c.supplier })) as Contract[] }),
                ...(disputesData   !== null && { disputes: disputesData }),
                ...(newBudgetOverrides !== null && { budgetOverrides: newBudgetOverrides }),
                ...(newAuditLogs       !== null && { auditLogs: newAuditLogs }),
                loadingMyPrs: false,
            }));
        } catch {
            setState(prev => ({ ...prev, loadingMyPrs: false }));
        }
    }, [apiFetch]);

    const refreshData = useCallback(async (attempt = 0): Promise<void> => {
        try {
            await refreshDataCore();
        } catch {
            if (attempt < 2) {
                await new Promise(res => setTimeout(res, (attempt + 1) * 1000));
                // eslint-disable-next-line react-hooks/immutability
                return refreshData(attempt + 1);
            }
        }
    }, [refreshDataCore]);

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

    const addPR = useCallback(async (data: Partial<PR>): Promise<string> => {
        const resp = await apiFetch('/procurement-requests', { method: 'POST', body: JSON.stringify(data) });
        if (resp.ok) {
            const res = await resp.json();
            const created = res.data || res;
            notify("Tạo yêu cầu mua sắm thành công!", "success");
            await refreshData();
            return created.id as string;
        }
        notify("Tạo yêu cầu mua sắm thất bại", "error");
        return "";
    }, [apiFetch, refreshData, notify]);

    const reconcileQuarter = useCallback(async (costCenterId: string, fiscalYear: number, quarter: number) => {
        const resp = await apiFetch(`/budgets/reconcile-quarter/${costCenterId}/${fiscalYear}/${quarter}`, { method: 'POST' });
        if (resp.ok) { notify("Quyết toán thành công", "success"); await refreshData(); return true; }
        notify("Quyết toán thất bại", "error"); return false;
    }, [apiFetch, refreshData, notify]);

    const approveOverride = useCallback(async (id: string) => {
        const resp = await apiFetch(`/budgets/overrides/${id}/approve`, { method: 'PATCH' });
        if (resp.ok) { notify("Đã duyệt vượt định mức", "success"); await refreshData(); return true; }
        notify("Duyệt vượt định mức thất bại", "error"); return false;
    }, [apiFetch, refreshData, notify]);

    const rejectOverride = useCallback(async (id: string, reason: string) => {
        const resp = await apiFetch(`/budgets/overrides/${id}/reject`, { method: 'PATCH', body: JSON.stringify({ reason }) });
        if (resp.ok) { notify("Đã từ chối", "info"); await refreshData(); return true; }
        notify("Từ chối vượt định mức thất bại", "error"); return false;
    }, [apiFetch, refreshData, notify]);

    const createPO = useCallback(async (d: CreatePoDto) => {
        const resp = await apiFetch('/purchase-orders', { method: 'POST', body: JSON.stringify(d) });
        if (resp.ok) { notify("Tạo đơn hàng thành công!", "success"); await refreshData(); return true; }
        notify("Tạo đơn hàng thất bại", "error"); return false;
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
        notify("Tạo đơn hàng từ PR thất bại", "error"); return null;
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
        notify("Xử lý tự động PO thất bại", "error"); return null;
    }, [apiFetch, refreshData, notify]);

    const ackPO = useCallback(async (id: string) => {
        const resp = await apiFetch(`/purchase-orders/${id}/acknowledge`, { method: 'POST' });
        if (resp.ok) { notify("Đã xác nhận đơn hàng", "success"); await refreshData(); return true; }
        notify("Xác nhận đơn hàng thất bại", "error"); return false;
    }, [apiFetch, refreshData, notify]);

    const rejectPO = useCallback(async (id: string) => {
        const resp = await apiFetch(`/purchase-orders/${id}/reject`, { method: 'POST' });
        if (resp.ok) {
            notify("Đã từ chối đơn hàng", "success");
            await refreshData();
            const res = await resp.json();
            return res.data || res;
        }
        notify("Từ chối đơn hàng thất bại", "error"); return null;
    }, [apiFetch, refreshData, notify]);

    const shipPO = useCallback(async (id: string) => {
        const resp = await apiFetch(`/purchase-orders/${id}/status`, { method: 'PUT', body: JSON.stringify({ status: 'SHIPPED' }) });
        if (resp.ok) { notify("Đã cập nhật trạng thái giao hàng", "success"); await refreshData(); return true; }
        notify("Cập nhật trạng thái giao hàng thất bại", "error"); return false;
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
            refreshData(); // Run in background
            const res = await resp.json();
            return res.data || res;
        }
        notify("Tạo RFQ thất bại", "error"); return null;
    }, [apiFetch, refreshData, notify]);

    const createRFQConsolidated = useCallback(async (d: ConsolidateRfqDto): Promise<boolean> => {
        const { prIds, title, description, deadline, supplierIds } = d;
        let anySuccess = false;
        let anyFail = false;
        for (const prId of prIds) {
            const resp = await apiFetch('/request-for-quotations', {
                method: 'POST',
                body: JSON.stringify({ prId, title, description, deadline, supplierIds })
            });
            if (resp.ok) { anySuccess = true; }
            else { anyFail = true; }
        }
        if (anySuccess) {
            notify(anyFail ? "Một số RFQ tạo thành công, một số thất bại" : "Tạo RFQ thành công!", anyFail ? "info" : "success");
            refreshData(); // background
        } else {
            notify("Tạo RFQ thất bại", "error");
        }
        return anySuccess && !anyFail;
    }, [apiFetch, refreshData, notify]);

    const awardQuotation = useCallback(async (rfqId: string, quotationId: string) => {
        const resp = await apiFetch(`/request-for-quotations/${rfqId}/award`, {
            method: 'PUT',
            body: JSON.stringify({ quotationId })
        });
        if (resp.ok) {
            notify("Đã chọn nhà thầu thành công!", "success");
            refreshData(); // background
            return true;
        }
        notify("Chọn nhà thầu thất bại", "error"); return false;
    }, [apiFetch, refreshData, notify]);

    const createGRN = useCallback(async (d: CreateGrnDto) => {
        const resp = await apiFetch('/grn', { method: 'POST', body: JSON.stringify(d) });
        if (resp.ok) { notify("Nhập kho thành công!", "success"); await refreshData(); return true; }
        notify("Nhập kho thất bại", "error"); return false;
    }, [apiFetch, refreshData, notify]);

    const createInvoice = useCallback(async (d: CreateInvoiceDto) => {
        const resp = await apiFetch('/invoices', { method: 'POST', body: JSON.stringify(d) });
        if (resp.ok) { notify("Tạo hóa đơn thành công!", "success"); await refreshData(); return true; }
        notify("Tạo hóa đơn thất bại", "error"); return false;
    }, [apiFetch, refreshData, notify]);

    const payInvoice = useCallback(async (id: string) => {
        const resp = await apiFetch(`/invoices/${id}/pay`, { method: 'POST' });
        if (resp.ok) { notify("Đã thanh toán hóa đơn", "success"); await refreshData(); return true; }
        notify("Thanh toán hóa đơn thất bại", "error"); return false;
    }, [apiFetch, refreshData, notify]);

    const matchInvoice = useCallback(async (id: string) => {
        const resp = await apiFetch(`/invoices/${id}/run-matching`, { method: 'POST' });
        if (resp.ok) { notify("Đã thực hiện đối soát 3 bên", "success"); await refreshData(); return true; }
        notify("Đối soát 3 bên thất bại", "error"); return false;
    }, [apiFetch, refreshData, notify]);

    const submitPR = useCallback(async (id: string) => {
        const resp = await apiFetch(`/procurement-requests/${id}/submit`, { method: 'POST' });
        if (resp.ok) { notify("Đã gửi yêu cầu", "success"); await refreshData(); return true; }
        notify("Gửi yêu cầu thất bại", "error"); return false;
    }, [apiFetch, refreshData, notify]);

    const convertQuoteToPR = useCallback(async (qrId: string) => {
        const qr = state.quoteRequests.find(q => q.id === qrId);
        if (!qr) return false;
        const newPRId = await addPR({
            title: `PR từ ${qr.qrNumber}`,
            description: `Tự động từ QR: ${qr.title}`,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            items: qr.items.map(i => ({ id: '', productName: i.productName, productDesc: i.productName, qty: i.qty, unit: i.unit, estimatedPrice: i.unitPrice || 0 })) as any
        });
        if (newPRId) { await submitPR(newPRId); return true; }
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

    const removeCostCenter = useCallback(async (id: string) => {
        const resp = await apiFetch(`/cost-centers/${id}`, { method: 'DELETE' });
        if (resp.ok) { notify("Đã xóa trung tâm chi phí", "success"); await refreshData(); return true; }
        return false;
    }, [apiFetch, refreshData, notify]);

    const updateCostCenter = useCallback((id: string, data: Partial<CostCenter>) => {
        setState(prev => ({ ...prev, costCenters: prev.costCenters.map(cc => cc.id === id ? { ...cc, ...data } : cc) }));
        return Promise.resolve(true);
    }, []);

    const removeCategory = useCallback(async (id: string) => {
        const resp = await apiFetch(`/products/categories/${id}`, { method: 'DELETE' });
        if (resp.ok) { notify("Đã xóa danh mục", "success"); await refreshData(); return true; }
        return false;
    }, [apiFetch, refreshData, notify]);

    const removeUser = useCallback(async (id: string) => {
        const resp = await apiFetch(`/users/${id}`, { method: 'DELETE' });
        if (resp.ok) { notify("Đã xóa người dùng", "success"); await refreshData(); return true; }
        notify("Xóa người dùng thất bại", "error"); return false;
    }, [apiFetch, refreshData, notify]);

    const addUser = useCallback((data: Partial<User> & { employeeCode?: string }) => {
        setState(prev => {
            const nextId = prev.users.length + 1;
            const newUser = { ...data, id: `user-${nextId}`, employeeCode: data.employeeCode || `EMP-${String(nextId).padStart(3, '0')}` };
            return { ...prev, users: [...prev.users, newUser as User] };
        });
        return Promise.resolve(true);
    }, []);

    const updateUser = useCallback((id: string, data: Partial<User>) => {
        setState(prev => ({ ...prev, users: prev.users.map(u => u.id === id ? { ...u, ...data } : u) }));
        return Promise.resolve(true);
    }, []);

    const createReview = useCallback(async (d: { type: 'BUYER' | 'SUPPLIER', rating: number, comment: string, relatedId: string }) => {
        const url = d.type === 'BUYER' ? '/reviews/buyer-rating' : '/reviews/supplier-review';
        const resp = await apiFetch(url, { method: 'POST', body: JSON.stringify(d) });
        if (resp.ok) { notify("Đã gửi đánh giá thành công", "success"); await refreshData(); return true; }
        notify("Gửi đánh giá thất bại", "error"); return false;
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
        if (resp.ok) {
            const res = await resp.json();
            const arr = res.data || res;
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            return Array.isArray(arr) ? arr.map((q: any) => ({
                ...q,
                totalPrice: convertPrismaDecimal(q.totalPrice ?? q.total ?? q.amount),
                leadTimeDays: q.leadTimeDays ?? q.leadTime ?? null,
                items: Array.isArray(q.items) ? q.items.map((i: Record<string, unknown>) => ({
                    ...i,
                    unitPrice: convertPrismaDecimal(i.unitPrice ?? i.price),
                    totalPrice: convertPrismaDecimal(i.totalPrice ?? i.total),
                    qty: convertPrismaDecimal(i.qty ?? i.quantity),
                })) : [],
            })) : [];
        }
        return [];
    }, [apiFetch]);

    const addBudgetAllocation = useCallback(async (data: CreateBudgetAllocationPayload): Promise<BudgetAllocation | null> => {
        const resp = await apiFetch('/budgets/allocations', { method: 'POST', body: JSON.stringify(data) });
        if (resp.ok) {
            const res = await resp.json();
            notify("Tạo phân bổ ngân sách thành công", "success");
            await refreshData();
            return (res.data || res) as BudgetAllocation;
        }
        notify("Tạo phân bổ ngân sách thất bại", "error");
        return null;
    }, [apiFetch, refreshData, notify]);

    const updateRFQStatus = useCallback(async (id: string, status: RfqStatus) => {
        const resp = await apiFetch(`/request-for-quotations/${id}/status`, { method: 'PUT', body: JSON.stringify({ status }) });
        if (resp.ok) { notify("Cập nhật trạng thái RFQ thành công", "success"); await refreshData(); return true; }
        return false;
    }, [apiFetch, refreshData, notify]);

    const addBudgetAllocationBundle = useCallback((data: Partial<BudgetAllocation>[]) => {
        console.log("addBudgetAllocationBundle called with:", data);
        return Promise.resolve(true);
    }, []);

    const terminateContract = useCallback(async (id: string, reason: string) => {
        const resp = await apiFetch(`/contracts/${id}/terminate`, { method: 'POST', body: JSON.stringify({ reason }) });
        if (resp.ok) { notify("Đã chấm dứt hợp đồng", "success"); await refreshData(); return true; }
        try {
            const errBody = await resp.json();
            const msg = errBody?.message ?? "Chấm dứt hợp đồng thất bại";
            notify(Array.isArray(msg) ? msg.join('; ') : String(msg), "error");
        } catch { notify("Chấm dứt hợp đồng thất bại", "error"); }
        return false;
    }, [apiFetch, notify, refreshData]);

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
        if (resp.ok) {
            const res = await resp.json();
            const arr = res.data || res;
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            return Array.isArray(arr) ? arr.map((p: any) => ({
                ...p,
                amount: convertPrismaDecimal(p.amount ?? p.totalAmount),
            })) : [];
        }
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
        notify("Xác nhận đơn hàng thất bại", "error"); return null;
    }, [apiFetch, notify]);

    const submitPO = useCallback(async (id: string) => {
        const resp = await apiFetch(`/purchase-orders/${id}/submit`, { method: 'POST' });
        if (resp.ok) {
            notify("Đã gửi đơn hàng phê duyệt", "success");
            const res = await resp.json();
            return res.data || res;
        }
        notify("Gửi đơn hàng phê duyệt thất bại", "error"); return null;
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
        notify("Đối soát 3 bên thất bại", "error"); return null;
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
            interface KpiScoreData {
                overallScore?: number;
                otdScore?: number;
                qualityScore?: number;
                priceScore?: number;
                invoiceAccuracy?: string;
                responseTimeScore?: string;
                fulfillmentRate?: string;
                periodQuarter?: number;
                periodYear?: number;
                tier?: string;
                supplier?: { id?: string; name?: string };
            }
            interface AiInsightsData {
                overallScore?: number;
            }
            return items.map((item: Record<string, unknown>) => {
                const kpiScore = (item?.kpiScore || item) as KpiScoreData;
                const aiInsights = item?.aiInsights as AiInsightsData | undefined;
                const overallScore = aiInsights?.overallScore ?? kpiScore?.overallScore ?? kpiScore?.otdScore ?? 0;
                return {
                    id: (item?.id as string) || `${supplierId}-kpi-${Date.now()}`,
                    supplierId: supplierId,
                    period: `Q${kpiScore?.periodQuarter || 1} ${kpiScore?.periodYear || 2026}`,
                    onTimeDeliveryScore: kpiScore?.otdScore ?? 0,
                    qualityScore: kpiScore?.qualityScore ?? 0,
                    priceScore: kpiScore?.priceScore ?? 0,
                    responsivenessScore: parseFloat(kpiScore?.responseTimeScore || '0') || 0,
                    complianceScore: parseFloat(kpiScore?.invoiceAccuracy || '0') || 0,
                    overallScore: overallScore,
                    tier: (tierMap[kpiScore?.tier || ''] || 'BRONZE') as import('../types/api-types').SupplierTier,
                    evaluatedAt: new Date().toISOString(),
                    quarter: `Q${kpiScore?.periodQuarter || 1} ${kpiScore?.periodYear || 2026}`,
                    supplier: kpiScore?.supplier || { id: supplierId, name: 'Nhà cung cấp' },
                    metrics: {
                        onTimeDelivery: { score: kpiScore?.otdScore ?? 0 },
                        qualityScore: { score: kpiScore?.qualityScore ?? 0 },
                        priceCompetitiveness: { score: kpiScore?.priceScore ?? 0 },
                        invoiceAccuracy: { score: parseFloat(kpiScore?.invoiceAccuracy || '0') || 0 },
                        responsiveness: { score: parseFloat(kpiScore?.responseTimeScore || '0') || 0 },
                        orderFulfillment: { score: parseFloat(kpiScore?.fulfillmentRate || '0') || 0 },
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
    const consolidatePRs = useCallback(async (dto: ConsolidatePRsInput): Promise<ConsolidatePRsResult> => {
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
        const errBody = await resp.json().catch(() => ({}));
        const errMsg = errBody?.message || 'Không thể tạo PO gộp';
        notify(errMsg, 'error');
        throw new Error(errMsg);
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

    const clearRAGEntity = useCallback(async (entity: string): Promise<boolean> => {
        const resp = await apiFetch(`/rag/clear/${entity}`, { method: 'DELETE' });
        if (resp.ok) {
            notify(`Đã xóa dữ liệu RAG: ${entity}`, 'success');
            return true;
        }
        notify(`Lỗi xóa dữ liệu RAG: ${entity}`, 'error');
        return false;
    }, [apiFetch, notify]);

    const clearRAG = useCallback(async (): Promise<boolean> => {
        const resp = await apiFetch('/rag/clear', { method: 'DELETE' });
        if (resp.ok) {
            notify('Đã xóa toàn bộ dữ liệu RAG', 'success');
            return true;
        }
        notify('Lỗi khi xóa dữ liệu RAG', 'error');
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

    const fetchBuyerDashboard = useCallback(async () => {
        const resp = await apiFetch('/reports/buyer-dashboard');
        if (resp.ok) { const res = await resp.json(); return res.data || res; }
        return null;
    }, [apiFetch]);

    // ========== Stubs for unimplemented methods ==========
    const approvePR = useCallback(async (id: string) => {
        const resp = await apiFetch(`/procurement-requests/${id}/approve`, { method: 'POST' });
        if (resp.ok) { notify("Đã phê duyệt yêu cầu", "success"); await refreshData(); return true; }
        notify("Phê duyệt thất bại", "error"); return false;
    }, [apiFetch, refreshData, notify]);

    const actionApproval = useCallback(async (workflowId: string, action: string, memo?: string) => {
        const resp = await apiFetch(`/approvals/${workflowId}/${action}`, { method: 'POST', body: JSON.stringify({ memo }) });
        if (resp.ok) { notify("Thao tác phê duyệt thành công", "success"); await refreshData(); return true; }
        notify("Thao tác phê duyệt thất bại", "error"); return false;
    }, [apiFetch, refreshData, notify]);

    const addCategory = useCallback(async (data: Partial<ProductCategory>) => {
        const resp = await apiFetch('/products/categories', { method: 'POST', body: JSON.stringify(data) });
        if (resp.ok) { notify("Tạo danh mục thành công!", "success"); await refreshData(); return true; }
        notify("Lỗi khi tạo danh mục", "error"); return false;
    }, [apiFetch, refreshData, notify]);

    const updateCategory = useCallback(async (id: string, data: Partial<ProductCategory>) => {
        const resp = await apiFetch(`/products/categories/${id}`, { method: 'PATCH', body: JSON.stringify(data) });
        if (resp.ok) { notify("Cập nhật danh mục thành công!", "success"); await refreshData(); return true; }
        notify("Lỗi khi cập nhật danh mục", "error"); return false;
    }, [apiFetch, refreshData, notify]);

    const startSimulation = useCallback((wf: "CATALOG" | "NON_CATALOG") => {
        setState(prev => ({ ...prev, simulation: { workflow: wf, step: 0, isActive: true } }));
    }, []);

    const nextSimulationStep = useCallback(() => {
        setState(prev => ({ ...prev, simulation: { ...prev.simulation, step: prev.simulation.step + 1 } }));
    }, []);

    const stopSimulation = useCallback(() => {
        setState(prev => ({ ...prev, simulation: { workflow: null, step: 0, isActive: false } }));
    }, []);

    const confirmCatalogPrice = useCallback(async (_d: Record<string, unknown>) => {
        return Promise.resolve(true);
    }, []);

    const submitAllocation = useCallback(async (id: string) => {
        const resp = await apiFetch(`/budgets/allocations/${id}/submit`, { method: 'POST' });
        if (resp.ok) { notify("Đã gửi phân bổ", "success"); await refreshData(); return true; }
        notify("Gửi phân bổ thất bại", "error"); return false;
    }, [apiFetch, refreshData, notify]);

    const approveAllocation = useCallback(async (id: string) => {
        const resp = await apiFetch(`/budgets/allocations/${id}/approve`, { method: 'POST' });
        if (resp.ok) { notify("Đã duyệt phân bổ", "success"); await refreshData(); return true; }
        notify("Duyệt phân bổ thất bại", "error"); return false;
    }, [apiFetch, refreshData, notify]);

    const rejectAllocation = useCallback(async (id: string, reason: string) => {
        const resp = await apiFetch(`/budgets/allocations/${id}/reject`, { method: 'POST', body: JSON.stringify({ reason }) });
        if (resp.ok) { notify("Đã từ chối phân bổ", "info"); await refreshData(); return true; }
        notify("Từ chối phân bổ thất bại", "error"); return false;
    }, [apiFetch, refreshData, notify]);

    const distributeAnnualBudget = useCallback(async (costCenterId: string, fiscalYear: number) => {
        const resp = await apiFetch(`/budgets/distribute/${costCenterId}/${fiscalYear}`, { method: 'POST' });
        if (resp.ok) { notify("Phân bổ ngân sách năm thành công", "success"); await refreshData(); return true; }
        notify("Phân bổ ngân sách năm thất bại", "error"); return false;
    }, [apiFetch, refreshData, notify]);

    const sendQuoteRequestToSupplier = useCallback(async (id: string, supplierIds: string[]) => {
        const resp = await apiFetch(`/quote-requests/${id}/send`, { method: 'POST', body: JSON.stringify({ supplierIds }) });
        if (resp.ok) { notify("Đã gửi yêu cầu báo giá", "success"); return true; }
        notify("Gửi yêu cầu báo giá thất bại", "error"); return false;
    }, [apiFetch, notify]);

    const createPRFromQuoteRequest = useCallback(async (qrId: string) => {
        const qr = state.quoteRequests.find(q => q.id === qrId);
        if (!qr) return false;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const id = await addPR({ title: `PR từ ${qr.qrNumber}`, description: qr.title, items: qr.items.map(i => ({ id: '', productName: i.productName, productDesc: i.productName, qty: i.qty, unit: i.unit, estimatedPrice: i.unitPrice || 0 })) as any });
        if (id) { await submitPR(id); return true; }
        return false;
    }, [state.quoteRequests, addPR, submitPR]);

    const fetchQuotationById = useCallback(async (id: string): Promise<Quotation | null> => {
        const resp = await apiFetch(`/quotations/${id}`);
        if (resp.ok) { const res = await resp.json(); return res.data || res; }
        return null;
    }, [apiFetch]);

    const submitQuotation = useCallback(async (id: string) => {
        const resp = await apiFetch(`/quotations/${id}/submit`, { method: 'POST' });
        if (resp.ok) { notify("Đã gửi báo giá", "success"); await refreshData(); return true; }
        notify("Gửi báo giá thất bại", "error"); return false;
    }, [apiFetch, refreshData, notify]);

    const reviewQuotation = useCallback(async (id: string) => {
        const resp = await apiFetch(`/quotations/${id}/review`, { method: 'POST' });
        if (resp.ok) { notify("Đã xem xét báo giá", "success"); await refreshData(); return true; }
        return false;
    }, [apiFetch, refreshData, notify]);

    const acceptQuotation = useCallback(async (id: string) => {
        const resp = await apiFetch(`/quotations/${id}/accept`, { method: 'POST' });
        if (resp.ok) { notify("Đã chấp nhận báo giá", "success"); await refreshData(); return true; }
        notify("Chấp nhận báo giá thất bại", "error"); return false;
    }, [apiFetch, refreshData, notify]);

    const rejectQuotation = useCallback(async (id: string) => {
        const resp = await apiFetch(`/quotations/${id}/reject`, { method: 'POST' });
        if (resp.ok) { notify("Đã từ chối báo giá", "info"); await refreshData(); return true; }
        notify("Từ chối báo giá thất bại", "error"); return false;
    }, [apiFetch, refreshData, notify]);

    const updateQuotationAiScore = useCallback(async (id: string, aiScore: number) => {
        const resp = await apiFetch(`/quotations/${id}/ai-score`, { method: 'PATCH', body: JSON.stringify({ aiScore }) });
        if (resp.ok) { await refreshData(); return true; }
        return false;
    }, [apiFetch, refreshData]);

    const createQAThread = useCallback(async (rfqId: string, d: CreateQAThreadDto) => {
        const resp = await apiFetch(`/request-for-quotations/${rfqId}/qa`, { method: 'POST', body: JSON.stringify(d) });
        if (resp.ok) { notify("Đã tạo câu hỏi", "success"); await refreshData(); return true; }
        notify("Tạo câu hỏi thất bại", "error"); return false;
    }, [apiFetch, refreshData, notify]);

    const fetchQAThreadsByRfq = useCallback(async (rfqId: string) => {
        const resp = await apiFetch(`/request-for-quotations/${rfqId}/qa`);
        if (resp.ok) { const res = await resp.json(); const d = res.data || res; return Array.isArray(d) ? d : []; }
        return [];
    }, [apiFetch]);

    const fetchQAThreadById = useCallback(async (id: string) => {
        const resp = await apiFetch(`/qa-threads/${id}`);
        if (resp.ok) { const res = await resp.json(); return res.data || res; }
        return null;
    }, [apiFetch]);

    const answerQAThread = useCallback(async (id: string, answer: string) => {
        const resp = await apiFetch(`/qa-threads/${id}/answer`, { method: 'POST', body: JSON.stringify({ answer }) });
        if (resp.ok) { notify("Đã trả lời câu hỏi", "success"); await refreshData(); return true; }
        notify("Trả lời câu hỏi thất bại", "error"); return false;
    }, [apiFetch, refreshData, notify]);

    const fetchQAThreadsBySupplier = useCallback(async (rfqId: string, supplierId: string) => {
        const resp = await apiFetch(`/request-for-quotations/${rfqId}/qa/supplier/${supplierId}`);
        if (resp.ok) { const res = await resp.json(); const d = res.data || res; return Array.isArray(d) ? d : []; }
        return [];
    }, [apiFetch]);

    const inviteSuppliersToRFQ = useCallback(async (rfqId: string, supplierIds: string[]) => {
        const resp = await apiFetch(`/request-for-quotations/${rfqId}/invite`, { method: 'POST', body: JSON.stringify({ supplierIds }) });
        if (resp.ok) { notify("Đã mời nhà cung cấp", "success"); await refreshData(); return true; }
        notify("Mời nhà cung cấp thất bại", "error"); return false;
    }, [apiFetch, refreshData, notify]);

    const removeSupplierFromRFQ = useCallback(async (rfqId: string, supplierId: string) => {
        const resp = await apiFetch(`/request-for-quotations/${rfqId}/suppliers/${supplierId}`, { method: 'DELETE' });
        if (resp.ok) { notify("Đã xóa nhà cung cấp khỏi RFQ", "success"); await refreshData(); return true; }
        return false;
    }, [apiFetch, refreshData, notify]);

    const searchAndAddSuppliers = useCallback(async (rfqId: string) => {
        const resp = await apiFetch(`/request-for-quotations/${rfqId}/search-suppliers`, { method: 'POST' });
        if (resp.ok) { notify("Đã tìm và thêm nhà cung cấp", "success"); await refreshData(); return true; }
        return false;
    }, [apiFetch, refreshData, notify]);

    const createCounterOffer = useCallback(async (quotationId: string, d: CreateCounterOfferDto) => {
        const resp = await apiFetch(`/quotations/${quotationId}/counter-offer`, { method: 'POST', body: JSON.stringify(d) });
        if (resp.ok) { notify("Đã tạo đề nghị mặc cả", "success"); await refreshData(); return true; }
        notify("Tạo đề nghị mặc cả thất bại", "error"); return false;
    }, [apiFetch, refreshData, notify]);

    const fetchCounterOffersByQuotation = useCallback(async (quotationId: string) => {
        const resp = await apiFetch(`/quotations/${quotationId}/counter-offers`);
        if (resp.ok) { const res = await resp.json(); const d = res.data || res; return Array.isArray(d) ? d : []; }
        return [];
    }, [apiFetch]);

    const fetchCounterOfferById = useCallback(async (id: string) => {
        const resp = await apiFetch(`/counter-offers/${id}`);
        if (resp.ok) { const res = await resp.json(); return res.data || res; }
        return null;
    }, [apiFetch]);

    const respondCounterOffer = useCallback(async (id: string, response: 'ACCEPT' | 'REJECT', notes?: string) => {
        const resp = await apiFetch(`/counter-offers/${id}/respond`, { method: 'POST', body: JSON.stringify({ response, notes }) });
        if (resp.ok) { notify("Đã phản hồi đề nghị mặc cả", "success"); await refreshData(); return true; }
        notify("Phản hồi đề nghị mặc cả thất bại", "error"); return false;
    }, [apiFetch, refreshData, notify]);

    const deleteRFQ = useCallback(async (id: string) => {
        const resp = await apiFetch(`/request-for-quotations/${id}`, { method: 'DELETE' });
        if (resp.ok) { notify("Đã xóa RFQ", "success"); await refreshData(); return true; }
        notify("Xóa RFQ thất bại", "error"); return false;
    }, [apiFetch, refreshData, notify]);

    const fetchRFQById = useCallback(async (id: string) => {
        const resp = await apiFetch(`/request-for-quotations/${id}`);
        if (resp.ok) { const res = await resp.json(); return res.data || res; }
        return null;
    }, [apiFetch]);

    const fetchSuppliersByRFQ = useCallback(async (rfqId: string) => {
        const resp = await apiFetch(`/request-for-quotations/${rfqId}/suppliers`);
        if (resp.ok) { const res = await resp.json(); const d = res.data || res; return Array.isArray(d) ? d : []; }
        return [];
    }, [apiFetch]);

    const analyzeQuotationWithAI = useCallback(async (quotationId: string) => {
        const resp = await apiFetch(`/quotations/${quotationId}/analyze`, { method: 'POST' });
        if (resp.ok) { const res = await resp.json(); return res.data || res; }
        return null;
    }, [apiFetch]);

    const fetchMySupplierRFQs = useCallback(async () => {
        const resp = await apiFetch('/request-for-quotations/my-supplier');
        if (resp.ok) { const res = await resp.json(); const d = res.data || res; return Array.isArray(d) ? d : []; }
        return [];
    }, [apiFetch]);

    const fetchContractById = useCallback(async (id: string) => {
        const resp = await apiFetch(`/contracts/${id}`);
        if (resp.ok) { const res = await resp.json(); return res.data || res; }
        return null;
    }, [apiFetch]);

    const updateContract = useCallback(async (id: string, d: Partial<Contract>) => {
        const resp = await apiFetch(`/contracts/${id}`, { method: 'PATCH', body: JSON.stringify(d) });
        if (resp.ok) { notify("Cập nhật hợp đồng thành công", "success"); await refreshData(); return true; }
        notify("Cập nhật hợp đồng thất bại", "error"); return false;
    }, [apiFetch, refreshData, notify]);

    const removeContract = useCallback(async (id: string) => {
        const resp = await apiFetch(`/contracts/${id}`, { method: 'DELETE' });
        if (resp.ok) { notify("Đã xóa hợp đồng", "success"); await refreshData(); return true; }
        notify("Xóa hợp đồng thất bại", "error"); return false;
    }, [apiFetch, refreshData, notify]);

    const submitContractForApproval = useCallback(async (id: string) => {
        const resp = await apiFetch(`/contracts/${id}/submit`, { method: 'POST' });
        if (resp.ok) { notify("Đã gửi hợp đồng phê duyệt", "success"); await refreshData(); return true; }
        notify("Gửi hợp đồng phê duyệt thất bại", "error"); return false;
    }, [apiFetch, refreshData, notify]);

    const createContract = useCallback(async (d: Partial<Contract>) => {
        const resp = await apiFetch('/contracts', { method: 'POST', body: JSON.stringify(d) });
        if (resp.ok) { notify("Tạo hợp đồng thành công!", "success"); await refreshData(); return true; }
        notify("Tạo hợp đồng thất bại", "error"); return false;
    }, [apiFetch, refreshData, notify]);

    const signContract = useCallback(async (id: string, isBuyer: boolean) => {
        const resp = await apiFetch(`/contracts/${id}/sign`, { method: 'POST', body: JSON.stringify({ isBuyer }) });
        if (resp.ok) { notify("Đã ký hợp đồng", "success"); await refreshData(); return true; }
        notify("Ký hợp đồng thất bại", "error"); return false;
    }, [apiFetch, refreshData, notify]);

    const createDispute = useCallback(async (d: Partial<Dispute>) => {
        const resp = await apiFetch('/disputes', { method: 'POST', body: JSON.stringify(d) });
        if (resp.ok) { notify("Tạo tranh chấp thành công!", "success"); await refreshData(); return true; }
        notify("Tạo tranh chấp thất bại", "error"); return false;
    }, [apiFetch, refreshData, notify]);

    const updateGrnItemQc = useCallback(async (id: string, itemId: string, status: string, notes?: string) => {
        const resp = await apiFetch(`/grn/${id}/items/${itemId}/qc`, { method: 'PATCH', body: JSON.stringify({ status, notes }) });
        if (resp.ok) { notify("Cập nhật QC thành công", "success"); await refreshData(); return true; }
        notify("Cập nhật QC thất bại", "error"); return false;
    }, [apiFetch, refreshData, notify]);

    const contextValue = useMemo<ProcurementContextType>(() => ({
        ...state,
        login,
        logout,
        refreshData,
        apiFetch,
        addPR,
        approvePR,
        submitPR,
        createRFQ,
        createRFQConsolidated,
        actionApproval,
        addDept,
        updateDept,
        removeDept,
        addUser,
        updateUser,
        removeUser,
        addBudgetPeriod,
        updateBudgetPeriod,
        removeBudgetPeriod,
        addBudgetAllocation,
        updateBudgetAllocation,
        removeBudgetAllocation,
        addBudgetAllocationBundle,
        submitAllocation,
        approveAllocation,
        rejectAllocation,
        distributeAnnualBudget,
        createGRN,
        ackPO,
        shipPO,
        createInvoice,
        payInvoice,
        matchInvoice,
        addCostCenter,
        updateCostCenter,
        removeCostCenter,
        fetchCostCenter,
        fetchMyDeptCostCenters,
        addOrganization,
        updateOrganization,
        removeOrganization,
        notify,
        register,
        logoutApi,
        refreshToken,
        validateToken,
        fetchUserProfile,
        fetchUserById,
        createDelegation,
        fetchMyDelegations,
        toggleDelegation,
        fetchOrganizationById,
        fetchMyOrganization,
        fetchDepartmentById,
        fetchBudgetPeriodsByType,
        fetchMyDeptBudgets,
        fetchBudgetAllocationById,
        fetchBudgetOverrideById,
        reconcileQuarter,
        fetchQuarterlyAllocation,
        approveOverride,
        rejectOverride,
        removeNotification,
        addQuoteRequest,
        updateQuoteRequest,
        submitQuoteRequest,
        convertQuoteToPR,
        sendQuoteRequestToSupplier,
        createPRFromQuoteRequest,
        startSimulation,
        nextSimulationStep,
        stopSimulation,
        confirmCatalogPrice,
        createQuote,
        fetchQuotationsByRfq,
        fetchQuotationById,
        submitQuotation,
        reviewQuotation,
        acceptQuotation,
        rejectQuotation,
        updateQuotationAiScore,
        createQAThread,
        fetchQAThreadsByRfq,
        fetchQAThreadById,
        answerQAThread,
        fetchQAThreadsBySupplier,
        inviteSuppliersToRFQ,
        removeSupplierFromRFQ,
        searchAndAddSuppliers,
        createCounterOffer,
        fetchCounterOffersByQuotation,
        fetchCounterOfferById,
        respondCounterOffer,
        deleteRFQ,
        updateRFQStatus,
        fetchRFQById,
        fetchSuppliersByRFQ,
        analyzeQuotationWithAI,
        fetchMySupplierRFQs,
        fetchContractById,
        updateContract,
        removeContract,
        submitContractForApproval,
        terminateContract,
        updateContractMilestone,
        fetchContractsBySupplier,
        fetchGRNById,
        updateGRNStatus,
        confirmGRN,
        fetchInvoiceById,
        updateInvoice,
        removeInvoice,
        fetchInvoices,
        runMatching,
        createPayment,
        completePayment,
        fetchPayments,
        fetchPaymentById,
        fetchSupplierReviews,
        fetchBuyerRatings,
        evaluateSupplierKPI,
        fetchSupplierKPIReport,
        fetchAuditLogsByEntity,
        fetchAuditLogById,
        createAuditLog,
        updateGrnItemQc,
        createContract,
        signContract,
        createDispute,
        createReview,
        consolidatePRs,
        syncRAG,
        ingestRAGEntity,
        clearRAGEntity,
        clearRAG,
        fetchSpendOverview,
        fetchSpendBySupplier,
        fetchSpendByCategory,
        fetchBuyerDashboard,
        addCategory,
        updateCategory,
        removeCategory,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        addProduct: addProduct as any,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        updateProduct: updateProduct as any,
        removeProduct,
        fetchPOById,
        confirmPO,
        submitPO,
        rejectPO,
        createPOFromPR,
        processPOAutomation,
        awardQuotation,
        fetchPrDetail: async (id: string): Promise<PR | null> => {
            const resp = await apiFetch(`/procurement-requests/${id}`);
            if (resp.ok) { const res = await resp.json(); return res.data || res; }
            return null;
        },
    }), [
        state, login, logout, refreshData, apiFetch,
        addPR, approvePR, submitPR, createRFQ, createRFQConsolidated, actionApproval,
        addDept, updateDept, removeDept, addUser, updateUser, removeUser,
        addBudgetPeriod, updateBudgetPeriod, removeBudgetPeriod,
        addBudgetAllocation, updateBudgetAllocation, removeBudgetAllocation, addBudgetAllocationBundle,
        submitAllocation, approveAllocation, rejectAllocation, distributeAnnualBudget,
        createGRN, ackPO, shipPO, createInvoice, payInvoice, matchInvoice,
        addCostCenter, updateCostCenter, removeCostCenter, fetchCostCenter, fetchMyDeptCostCenters,
        addOrganization, updateOrganization, removeOrganization,
        notify, register, logoutApi, refreshToken, validateToken,
        fetchUserProfile, fetchUserById, createDelegation, fetchMyDelegations, toggleDelegation,
        fetchOrganizationById, fetchMyOrganization, fetchDepartmentById,
        fetchBudgetPeriodsByType, fetchMyDeptBudgets, fetchBudgetAllocationById, fetchBudgetOverrideById,
        reconcileQuarter, fetchQuarterlyAllocation, approveOverride, rejectOverride, removeNotification,
        addQuoteRequest, updateQuoteRequest, submitQuoteRequest, convertQuoteToPR,
        sendQuoteRequestToSupplier, createPRFromQuoteRequest,
        startSimulation, nextSimulationStep, stopSimulation, confirmCatalogPrice,
        createQuote, fetchQuotationsByRfq, fetchQuotationById,
        submitQuotation, reviewQuotation, acceptQuotation, rejectQuotation, updateQuotationAiScore,
        createQAThread, fetchQAThreadsByRfq, fetchQAThreadById, answerQAThread, fetchQAThreadsBySupplier,
        inviteSuppliersToRFQ, removeSupplierFromRFQ, searchAndAddSuppliers,
        createCounterOffer, fetchCounterOffersByQuotation, fetchCounterOfferById, respondCounterOffer,
        deleteRFQ, updateRFQStatus, fetchRFQById, fetchSuppliersByRFQ, analyzeQuotationWithAI, fetchMySupplierRFQs,
        fetchContractById, updateContract, removeContract, submitContractForApproval, terminateContract,
        updateContractMilestone, fetchContractsBySupplier,
        fetchGRNById, updateGRNStatus, confirmGRN,
        fetchInvoiceById, updateInvoice, removeInvoice, fetchInvoices, runMatching,
        createPayment, completePayment, fetchPayments, fetchPaymentById,
        fetchSupplierReviews, fetchBuyerRatings, evaluateSupplierKPI, fetchSupplierKPIReport,
        fetchAuditLogsByEntity, fetchAuditLogById, createAuditLog,
        updateGrnItemQc, createContract, signContract, createDispute, createReview,
        consolidatePRs, syncRAG, ingestRAGEntity, clearRAGEntity, clearRAG,
        fetchSpendOverview, fetchSpendBySupplier, fetchSpendByCategory, fetchBuyerDashboard,
        addCategory, updateCategory, removeCategory, addProduct, updateProduct, removeProduct,
        fetchPOById, confirmPO, submitPO, rejectPO, createPOFromPR, processPOAutomation, awardQuotation, apiFetch,
    ]);

    return (
        <ProcurementContext.Provider value={contextValue}>
            {children}
        </ProcurementContext.Provider>
    );
}

export const useProcurement = () => {
    const context = useContext(ProcurementContext);
    if (!context) throw new Error("useProcurement must be used within a ProcurementProvider");
    return context;
};

