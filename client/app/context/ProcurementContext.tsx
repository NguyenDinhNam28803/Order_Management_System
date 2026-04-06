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
    Contract, Dispute, AuditLog, SupplierEvaluation
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

export interface POItem {
    id: string; description: string; qty: number; estimatedPrice: number;
}

export interface PO {
    id: string; poNumber: string; vendor: string; items: POItem[]; status: PoStatus | string; total: number; createdAt?: string;
}

export interface RFQ {
    id: string; prId: string; rfqNumber: string; vendor: string; status: RfqStatus | string; 
    title?: string; createdAt?: string; items?: PRItem[]; supplierIds?: string[];
    type: "RFQ" | "PO_CONFIRMATION";
    price?: number; stock?: number; leadTime?: number; note?: string;
}

export interface GRN {
    id: string; grnNumber: string; poId: string; receivedItems: Record<string, number>; createdAt: string;
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
    currentUser: User | null; prs: PR[]; myPrs: PR[]; pos: PO[]; rfqs: RFQ[]; grns: GRN[]; invoices: Invoice[]; 
    budgets: BudgetStats | null; users: User[]; departments: Department[]; notifications: Notification[]; 
    approvals: ApprovalWorkflow[]; costCenters: CostCenter[]; budgetPeriods: BudgetPeriod[]; 
    budgetAllocations: BudgetAllocation[]; budgetOverrides: BudgetOverride[]; organizations: Organization[]; products: Product[]; 
    categories: ProductCategory[]; quoteRequests: QuoteRequest[]; loadingMyPrs: boolean; 
    simulation: SimulationState;
    contracts: Contract[]; disputes: Dispute[]; auditLogs: AuditLog[]; 
    supplierEvaluations: SupplierEvaluation[];
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
    ackPO: (id: string) => Promise<boolean>;
    shipPO: (id: string) => Promise<boolean>;
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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    addCostCenter: (d: any) => Promise<boolean>;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    updateCostCenter: (id: string, d: any) => Promise<boolean>;
    removeCostCenter: (id: string) => Promise<boolean>;
    addBudgetPeriod: (d: CreateBudgetPeriodPayload) => Promise<boolean>;
    updateBudgetPeriod: (id: string, d: UpdateBudgetPeriodPayload) => Promise<boolean>;
    removeBudgetPeriod: (id: string) => Promise<boolean>;
    addBudgetAllocation: (d: CreateBudgetAllocationPayload) => Promise<BudgetAllocation | null>;
    submitAllocation: (id: string) => Promise<boolean>;
    approveAllocation: (id: string) => Promise<boolean>;
    rejectAllocation: (id: string, reason: string) => Promise<boolean>;
    updateBudgetAllocation: (id: string, d: UpdateBudgetAllocationPayload) => Promise<boolean>;
    removeBudgetAllocation: (id: string) => Promise<boolean>;
    distributeAnnualBudget: (costCenterId: string, fiscalYear: number) => Promise<boolean>;
    reconcileQuarter: (costCenterId: string, fiscalYear: number, quarter: number) => Promise<boolean>;
    fetchCostCenter: (id: string) => Promise<CostCenter | null>;
    fetchQuarterlyAllocation: (cc: string, year: number, quarter: number) => Promise<BudgetAllocation | null>;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    addQuoteRequest: (d: any) => Promise<boolean>;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    updateQuoteRequest: (id: string, d: any) => Promise<boolean>;
    submitQuoteRequest: (id: string) => Promise<boolean>;
    convertQuoteToPR: (qrId: string) => Promise<boolean>;
    sendQuoteRequestToSupplier: (id: string, supplierIds: string[]) => Promise<boolean>;
    createPRFromQuoteRequest: (qrId: string) => Promise<boolean>;
    startSimulation: (wf: "CATALOG" | "NON_CATALOG") => void;
    nextSimulationStep: () => void;
    stopSimulation: () => void;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    confirmCatalogPrice: (d: any) => Promise<boolean>;
    approveOverride: (id: string) => Promise<boolean>;
    rejectOverride: (id: string, reason: string) => Promise<boolean>;
    removeNotification: (id: number) => void;
    notify: (message: string, type?: Notification['type']) => void;
    register: (d: RegisterPayload) => Promise<boolean>;
    createQuote: (d: CreateQuoteDto) => Promise<boolean>;
    createGRN: (d: CreateGrnDto) => Promise<boolean>;
    updateGrnItemQc: (id: string, itemId: string, status: string, notes?: string) => Promise<boolean>;
    createInvoice: (d: CreateInvoiceDto) => Promise<boolean>;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    createContract: (d: any) => Promise<boolean>;
    signContract: (id: string, isBuyer: boolean) => Promise<boolean>;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    createDispute: (d: any) => Promise<boolean>;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    createReview: (d: any) => Promise<boolean>;
}

const ProcurementContext = createContext<ProcurementContextType | undefined>(undefined);

export function ProcurementProvider({ children }: { children: ReactNode }) {
    const [state, setState] = useState<ProcurementState>({
        currentUser: null, prs: [], myPrs: [], pos: [], rfqs: [], grns: [], invoices: [], 
        budgets: null, users: [], departments: [], notifications: [], approvals: [], 
        costCenters: [], budgetPeriods: [], budgetAllocations: [], budgetOverrides: [], organizations: [], 
        products: [], categories: [], quoteRequests: [], loadingMyPrs: false,
        simulation: { workflow: null, step: 0, isActive: false },
        contracts: [], disputes: [], auditLogs: [], supplierEvaluations: []
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
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const headers: any = { 
            'Content-Type': 'application/json',
            ...(options.headers || {})
        };
        if (token) headers['Authorization'] = `Bearer ${token}`;

        const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
        return fetch(`${baseUrl}${url}`, { ...options, headers });
    }, []);

    const refreshData = useCallback(async () => {
        setState(prev => ({ ...prev, loadingMyPrs: true }));
        try {
            const userJson = Cookies.get('user');
            const user = userJson ? JSON.parse(userJson) : null;
            
            const [
                periodsResp, allocsResp, prsResp, myPrsResp, approvalsResp, 
                orgsResp, deptsResp, usersResp, productsResp, categoriesResp, 
                ccResp, posResp, rfqsResp, grnsResp, invoicesResp,
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
                apiFetch('/request-for-quotations'),
                apiFetch('/grn'),
                apiFetch('/invoices'),
                apiFetch('/contracts'),
                apiFetch('/disputes')
            ]);

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
                if (Array.isArray(data)) setState(prev => ({ ...prev, pos: data }));
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
        } catch (e) {}
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
        if (resp.ok) { notify("Tạo PO từ PR thành công!", "success"); await refreshData(); return true; }
        return false;
    }, [apiFetch, refreshData, notify]);

    const ackPO = useCallback(async (id: string) => {
        const resp = await apiFetch(`/purchase-orders/${id}/confirm`, { method: 'POST' });
        if (resp.ok) { notify("Đã xác nhận đơn hàng", "success"); await refreshData(); return true; }
        return false;
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

    const addCostCenter = useCallback(async (d: CreateCostCenterPayload) => {
        const resp = await apiFetch('/cost-centers', { method: 'POST', body: JSON.stringify(d) });
        if (resp.ok) { notify("Đã thêm Cost Center", "success"); await refreshData(); return true; }
        return false;
    }, [apiFetch, refreshData, notify]);

    const updateCostCenter = useCallback(async (id: string, d: UpdateCostCenterPayload) => {
        const resp = await apiFetch(`/cost-centers/${id}`, { method: 'PATCH', body: JSON.stringify(d) });
        if (resp.ok) { notify("Đã cập nhật Cost Center", "success"); await refreshData(); return true; }
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

    useEffect(() => { refreshData(); }, [refreshData]);

    const contextValue: ProcurementContextType = {
        ...state,
        login, logout, refreshData, apiFetch, addPR, submitPR, updatePR, fetchPrDetail, actionApproval,
        addBudgetAllocation, submitAllocation, approveAllocation, rejectAllocation, distributeAnnualBudget, reconcileQuarter,
        approveOverride, rejectOverride, convertQuoteToPR,
        removeNotification, notify,
        createPO, createPOFromPR, ackPO, shipPO,
        createRFQ, createRFQConsolidated: async () => true, awardQuotation,
        addDept, updateDept, removeDept,
        addUser, updateUser, removeUser,
        addOrganization, updateOrganization, removeOrganization,
        addProduct, updateProduct, removeProduct,
        addCategory, updateCategory, removeCategory,
        addCostCenter, updateCostCenter, removeCostCenter, fetchCostCenter,
        addBudgetPeriod: async () => true, updateBudgetPeriod: async () => true, removeBudgetPeriod: async () => true,
        updateBudgetAllocation: async () => true, removeBudgetAllocation: async () => true,
        fetchQuarterlyAllocation,
        addQuoteRequest: async () => true, updateQuoteRequest: async () => true, submitQuoteRequest: async () => true,
        sendQuoteRequestToSupplier: async () => true, createPRFromQuoteRequest: async () => true,
        startSimulation: () => {}, nextSimulationStep: () => {}, stopSimulation: () => {},
        confirmCatalogPrice: async () => true, register: async () => true, createQuote: async () => true,
        createGRN, updateGrnItemQc, createInvoice, payInvoice, matchInvoice,
        approvePR: async () => true,
        createContract, signContract, createDispute, createReview
    };

    return <ProcurementContext.Provider value={contextValue}>{children}</ProcurementContext.Provider>;
}

export const useProcurement = () => {
    const context = useContext(ProcurementContext);
    if (!context) throw new Error("useProcurement must be used within a ProcurementProvider");
    return context;
};
