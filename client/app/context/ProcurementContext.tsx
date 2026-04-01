"use client";

import React, { createContext, useContext, useState, useCallback, ReactNode, useMemo, useEffect, useRef } from "react";
import Cookies from 'js-cookie';
import {
    Organization,
    CostCenter,
    Department,
    CurrencyCode,
    CompanyType,
    KycStatus,
    UserRole,
    PrStatus,
    RfqStatus,
    QuotationStatus,
    PoStatus,
    GrnStatus,
    InvoiceStatus,
    ApprovalStatus,
    DocumentType
} from "../types/api-types";

export type {
    Organization,
    CostCenter,
    Department
};
export {
    CurrencyCode,
    CompanyType,
    KycStatus,
    UserRole,
    PrStatus,
    RfqStatus,
    QuotationStatus,
    PoStatus,
    GrnStatus,
    InvoiceStatus,
    ApprovalStatus,
    DocumentType
};

export interface User {
    id: string;
    name?: string;
    email: string;
    role: UserRole | string;
    fullName?: string;
    icon?: string;
    avatarUrl?: string;
    deptId?: string;
    orgId?: string;
    jobTitle?: string;
    employeeCode?: string;
    isActive?: boolean;
    department?: { id: string; name: string };
}

export interface PRItem {
    id?: string;
    productId?: string;
    productName?: string;
    description?: string;
    item_name?: string;
    item_code?: string;
    qty?: number;
    quantity?: number;
    unit?: string;
    estimatedPrice: number;
    price?: number;
    sku?: string;
    product?: { name: string };
}

export interface PR {
    id: string;
    prNumber?: string;
    title?: string;
    reason?: string;
    description?: string;
    justification?: string;
    requiredDate?: string;
    status: PrStatus | string;
    priority: number;
    createdAt: string;
    requesterId?: string;
    updatedAt?: string;
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
    costCenterCode?: string;
    costCenter?: { code: string; name?: string };
    procurementId?: string;
    totalEstimate?: number;
    total?: number;
    items?: PRItem[];
    attachments?: { name: string, url: string }[];
    creatorRole?: string;
    targetApproverRole?: string;
}

export interface POItem {
    id: string;
    description: string;
    qty: number;
    estimatedPrice: number;
}

export interface PO {
    id: string;
    poNumber: string;
    vendor: string;
    items: POItem[];
    status: PoStatus | string;
    total: number;
    createdAt?: string;
}

export interface RFQ {
    id: string;
    prId: string;
    rfqNumber: string;
    vendor: string;
    status: RfqStatus | string;
    title?: string;
    dueDate?: string;
    createdAt?: string;
    items?: PRItem[];
    attachments?: { name: string, url: string }[];
    messages?: { sender: string, senderRole: string, text: string, timestamp: string }[];
}

export interface GRN {
    id: string;
    grnNumber: string;
    poId: string;
    receivedItems: Record<string, number>;
    createdAt: string;
}

export interface Invoice {
    id: string;
    invoiceNumber: string;
    vendor: string;
    poId: string;
    amount: number;
    status: InvoiceStatus | string;
    createdAt: string;
}

export interface BudgetStats {
    allocated: number;
    committed: number;
    spent: number;
}

export interface BudgetPeriod {
    id: string;
    orgId: string;
    fiscalYear: number;
    periodType: string;
    periodNumber: number;
    startDate: string;
    endDate: string;
    isActive: boolean;
}

export interface BudgetAllocation {
    id: string;
    budgetPeriodId: string;
    costCenterId: string;
    orgId: string;
    deptId?: string;
    allocatedAmount: number;
    committedAmount: number;
    spentAmount: number;
    currency: string;
    notes?: string;
}

export interface Product {
    id: string;
    name: string;
    sku: string;
    unitPriceRef: number;
    unit: string;
    description?: string;
    categoryId?: string;
    category?: { id: string; name: string };
    isActive?: boolean;
}

export interface Quote {
    id: string;
    rfqId: string;
    supplierId: string;
    totalPrice: number;
    leadTimeDays: number;
    status: QuotationStatus | string;
    createdAt: string;
}

export interface ApprovalWorkflow {
    id: string;
    documentType?: DocumentType | string;
    documentId: string;
    status: ApprovalStatus | string;
}

export interface Notification {
    id: number;
    message: string;
    type: string;
    role?: string;
}

export interface ProcurementState {
    currentUser: User | null;
    prs: PR[];
    myPrs: PR[];
    pos: PO[];
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
    notifications: Notification[];
    quotes: Quote[];
    products: Product[];
    approvals: ApprovalWorkflow[];
    fiscalYears: number[];
    token: string | null;
    loadingMyPrs: boolean;
    currentPrDetail: PR | null;
}

interface ProcurementContextType extends ProcurementState {
    login: (email: string, password?: string) => Promise<boolean>;
    logout: () => Promise<void>;
    refreshData: () => Promise<void>;
    apiFetch: (url: string, options?: RequestInit) => Promise<Response>;
    addPR: (data: Partial<PR>) => Promise<string>;
    updatePR: (id: string, data: Partial<PR>) => Promise<boolean>;
    fetchPrDetail: (id: string) => Promise<PR | null>;
    approvePR: (id: string) => Promise<boolean>;
    createPOFromPR: (prId: string, supplierId: string) => Promise<boolean>;
    createRFQ: (prId: string, vendor: string) => Promise<boolean>;
    awardQuotation: (rfqId: string, quotationId: string) => Promise<boolean>;
    createRFQConsolidated: (data: Record<string, unknown>) => Promise<string>;
    actionApproval: (workflowId: string, action: string, comment?: string) => Promise<boolean>;
    addDept: (data: Partial<Department>) => Promise<boolean>;
    updateDept: (id: string, data: Partial<Department>) => Promise<boolean>;
    removeDept: (id: string) => Promise<boolean>;
    addUser: (data: Partial<User>) => Promise<boolean>;
    updateUser: (id: string, data: Partial<User>) => Promise<boolean>;
    addBudgetPeriod: (data: Partial<BudgetPeriod>) => Promise<boolean>;
    updateBudgetPeriod: (id: string, data: Partial<BudgetPeriod>) => Promise<boolean>;
    removeBudgetPeriod: (id: string) => Promise<boolean>;
    addBudgetAllocation: (data: Partial<BudgetAllocation>) => Promise<boolean>;
    updateBudgetAllocation: (id: string, data: Partial<BudgetAllocation>) => Promise<boolean>;
    removeBudgetAllocation: (id: string) => Promise<boolean>;
    addBudgetAllocationBundle: (data: { costCenterId: string, fiscalYear: number }) => Promise<boolean>;
    reconcileQuarter: (costCenterId: string, fiscalYear: number, quarter: number) => Promise<boolean>;
    addCostCenter: (data: Partial<CostCenter>) => Promise<boolean>;
    updateCostCenter: (id: string, data: Partial<CostCenter>) => Promise<boolean>;
    removeCostCenter: (id: string) => Promise<boolean>;
    fetchCostCenter: (id: string) => Promise<CostCenter | null>;
    fetchQuarterlyBudget: (costCenterId: string, fiscalYear: number, quarter: number) => Promise<{ data: BudgetAllocation } | null>;
    addOrganization: (data: Partial<Organization>) => Promise<boolean>;
    updateOrganization: (id: string, data: Partial<Organization>) => Promise<boolean>;
    removeOrganization: (id: string) => Promise<boolean>;
    removeNotification: (id: number) => void;
    notify: (message: string, type?: 'success' | 'error' | 'info' | 'warning', role?: string) => void;
    register: (data: Record<string, unknown>) => Promise<boolean>;
    createQuote: (rfqId: string, quoteData: Partial<Quote>) => Promise<boolean>;
    createGRN: (data: Record<string, unknown>) => Promise<boolean>;
    ackPO: (id: string) => Promise<boolean>;
    shipPO: (id: string) => Promise<boolean>;
    createInvoice: (data: Record<string, unknown>) => Promise<boolean>;
    payInvoice: (id: string) => Promise<boolean>;
    matchInvoice: (id: string, status?: string) => Promise<boolean>;
}

const ProcurementContext = createContext<ProcurementContextType | undefined>(undefined);

const INITIAL_STATE: ProcurementState = {
    currentUser: null,
    prs: [],
    myPrs: [],
    pos: [],
    rfqs: [],
    grns: [],
    invoices: [],
    budgets: null,
    users: [],
    departments: [],
    notifications: [],
    approvals: [],
    costCenters: [],
    organizations: [],
    budgetPeriods: [],
    budgetAllocations: [],
    quotes: [],
    products: [],
    fiscalYears: [2024, 2025, 2026],
    token: null,
    loadingMyPrs: false,
    currentPrDetail: null
};

export function ProcurementProvider({ children }: { children: ReactNode }) {
    const [state, setState] = useState<ProcurementState>(INITIAL_STATE);
    const initialLoadDone = useRef(false);

    const notify = useCallback((message: string, type: 'success' | 'error' | 'info' | 'warning' = 'success', role?: string) => {
        const id = Date.now();
        setState(prev => ({
            ...prev,
            notifications: [...prev.notifications, { id, message, type, role }]
        }));
        setTimeout(() => {
            setState(prev => ({
                ...prev,
                notifications: prev.notifications.filter(n => n.id !== id)
            }));
        }, 5000);
    }, []);

    const removeNotification = useCallback((id: number) => {
        setState(prev => ({
            ...prev,
            notifications: prev.notifications.filter(n => n.id !== id)
        }));
    }, []);

    const apiFetch = useCallback(async (url: string, options: RequestInit = {}) => {
        const token = Cookies.get('accessToken');
        const headers: HeadersInit = {
            'Content-Type': 'application/json',
            ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
            ...options.headers,
        };

        try {
            const res = await fetch(`http://localhost:5000${url}`, { ...options, credentials: 'include', headers });
            return res;
        } catch (error) {
            console.error(`API Fetch Network Error (${url}):`, error);
            return { ok: false, status: 503, json: async () => ({ message: 'Network error' }) } as Response;
        }
    }, []);

    const refreshData = useCallback(async () => {
        const token = Cookies.get('accessToken');
        if (!token) return;

        try {
            setState(prev => ({ ...prev, loadingMyPrs: true }));
            const [ccRes, orgRes, deptRes, allPrRes, myPrRes, pendingApprRes, usersRes, budgetAllocRes, posRes, rfqsRes, invoicesRes] = await Promise.all([
                apiFetch('/cost-centers'),
                apiFetch('/organizations'),
                apiFetch('/departments'),
                apiFetch('/procurement-requests'),
                apiFetch('/procurement-requests/my'),
                apiFetch('/approvals/pending'),
                apiFetch('/users'),
                apiFetch('/budgets/allocations'),
                apiFetch('/purchase-orders'),
                apiFetch('/request-for-quotations'),
                apiFetch('/invoices')
            ]);
 
            const costCenters = ccRes.ok ? (await ccRes.json()).data : [];
            const organizations = orgRes.ok ? (await orgRes.json()).data : [];
            const departments = deptRes.ok ? (await deptRes.json()).data : [];
            const allPrs = allPrRes.ok ? (await allPrRes.json()).data : [];
            const myPrs = myPrRes.ok ? (await myPrRes.json()).data : [];
            const pendingApprovals = pendingApprRes.ok ? (await pendingApprRes.json()).data : [];
            const fetchedUsers = usersRes.ok ? (await usersRes.json()).data : [];
            const fetchedBudgetAllocations = budgetAllocRes.ok ? (await budgetAllocRes.json()).data : [];
            const fetchedPos = posRes.ok ? (await posRes.json()).data : [];
            const fetchedRfqs = rfqsRes.ok ? (await rfqsRes.json()).data : [];
            const fetchedInvoices = invoicesRes.ok ? (await invoicesRes.json()).data : [];
 
            setState(prev => ({
                ...prev,
                costCenters: Array.isArray(costCenters) ? costCenters : prev.costCenters,
                organizations: Array.isArray(organizations) ? organizations : prev.organizations,
                departments: Array.isArray(departments) ? departments : prev.departments,
                prs: Array.isArray(allPrs) ? allPrs : prev.prs,
                myPrs: Array.isArray(myPrs) ? myPrs : prev.myPrs,
                approvals: Array.isArray(pendingApprovals) ? pendingApprovals : prev.approvals,
                users: Array.isArray(fetchedUsers) ? fetchedUsers : prev.users,
                budgetAllocations: Array.isArray(fetchedBudgetAllocations) ? fetchedBudgetAllocations : prev.budgetAllocations,
                pos: Array.isArray(fetchedPos) ? fetchedPos : prev.pos,
                rfqs: Array.isArray(fetchedRfqs) ? fetchedRfqs : prev.rfqs,
                invoices: Array.isArray(fetchedInvoices) ? fetchedInvoices : prev.invoices,
                loadingMyPrs: false
            }));
        } catch (error) {
            console.error("Error refreshing data:", error);
            setState(prev => ({ ...prev, loadingMyPrs: false }));
        }
    }, [apiFetch]);

    useEffect(() => {
        const token = Cookies.get('accessToken');
        if (token && state.currentUser === null && !initialLoadDone.current) {
            initialLoadDone.current = true;
            // Trì hoãn thực thi để tránh cảnh báo cascading render của React
            const timer = setTimeout(() => {
                void refreshData();
            }, 0);
            return () => clearTimeout(timer);
        }
    }, [refreshData, state.currentUser]);

    const login = useCallback(async (email: string, password?: string) => {
        const res = await apiFetch('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ email, password: password || "password123" })
        });
        if (res.ok) {
            const responseData = await res.json();
            const data = responseData.data;
            if (data.accessToken) {
                Cookies.set('accessToken', data.accessToken, { expires: 7, sameSite: 'Strict' });
            }
            setState(prev => ({ ...prev, currentUser: data.user }));
            void refreshData();
            return true;
        } else {
            notify("Đăng nhập thất bại", "error");
            return false;
        }
    }, [apiFetch, notify, refreshData]);

    const logout = useCallback(async () => {
        Cookies.remove('accessToken');
        setState(prev => ({ ...prev, currentUser: null }));
    }, []);

    const register = useCallback(async (data: Record<string, unknown>) => {
        const res = await apiFetch('/auth/register', { method: 'POST', body: JSON.stringify(data) });
        if (res.ok) { notify("Đăng ký thành công!", "success"); return true; }
        return false;
    }, [apiFetch, notify]);

    const addPR = useCallback(async (data: Partial<PR>) => {
        const res = await apiFetch('/procurement-requests', { method: 'POST', body: JSON.stringify(data) });
        if (res.ok) { notify("Đã tạo PR", "success"); refreshData(); return "success"; }
        return "";
    }, [apiFetch, refreshData, notify]);

    const updatePR = useCallback(async (id: string, data: Partial<PR>) => {
        const res = await apiFetch(`/procurement-requests/${id}`, { method: 'PATCH', body: JSON.stringify(data) });
        if (res.ok) { notify("Cập nhật PR thành công", "success"); refreshData(); return true; }
        return false;
    }, [apiFetch, refreshData, notify]);

    const fetchPrDetail = useCallback(async (id: string) => {
        const res = await apiFetch(`/procurement-requests/${id}`);
        if (res.ok) return (await res.json()).data;
        return null;
    }, [apiFetch]);

    const approvePR = useCallback(async (id: string) => {
        const res = await apiFetch(`/procurement-requests/${id}/approve`, { method: 'POST' });
        if (res.ok) { notify("Đã duyệt PR", "success"); refreshData(); return true; }
        return false;
    }, [apiFetch, refreshData, notify]);

    const createPOFromPR = useCallback(async (prId: string, supplierId: string) => {
        const res = await apiFetch('/purchase-orders/create-from-pr', {
            method: 'POST',
            body: JSON.stringify({ prId, supplierId })
        });
        if (res.ok) { notify("Đã tạo PO thành công", "success"); refreshData(); return true; }
        return false;
    }, [apiFetch, refreshData, notify]);

    const createRFQ = useCallback(async (prId: string, vendor: string) => {
        const res = await apiFetch('/request-for-quotations', {
            method: 'POST',
            body: JSON.stringify({ prId, vendor })
        });
        if (res.ok) { notify("Đã tạo RFQ", "success"); refreshData(); return true; }
        return false;
    }, [apiFetch, refreshData, notify]);

    const awardQuotation = useCallback(async (rfqId: string, quotationId: string) => {
        const res = await apiFetch(`/request-for-quotations/${rfqId}/award/${quotationId}`, {
            method: 'POST'
        });
        if (res.ok) { notify("Đã trao thầu thành công. PO đang được tạo.", "success"); refreshData(); return true; }
        return false;
    }, [apiFetch, refreshData, notify]);

    const createRFQConsolidated = useCallback(async (data: Record<string, unknown>) => {
        const res = await apiFetch('/request-for-quotations/consolidate', { method: 'POST', body: JSON.stringify(data) });
        if (res.ok) { refreshData(); return (await res.json()).data.id; }
        return "";
    }, [apiFetch, refreshData]);

    const actionApproval = useCallback(async (workflowId: string, action: string, comment?: string) => {
        const res = await apiFetch(`/approvals/${workflowId}/action`, {
            method: 'POST',
            body: JSON.stringify({ action, comment })
        });
        if (res.ok) { notify("Thành công", "success"); refreshData(); return true; }
        return false;
    }, [apiFetch, refreshData, notify]);

    const createGRN = useCallback(async (data: Record<string, unknown>) => {
        const res = await apiFetch('/grn', { method: 'POST', body: JSON.stringify(data) });
        if (res.ok) { notify("Đã nhập kho", "success"); refreshData(); return true; }
        return false;
    }, [apiFetch, refreshData, notify]);

    const createInvoice = useCallback(async (data: Record<string, unknown>) => {
        const res = await apiFetch('/invoices', { method: 'POST', body: JSON.stringify(data) });
        if (res.ok) { notify("Đã tạo hóa đơn", "success"); refreshData(); return true; }
        return false;
    }, [apiFetch, refreshData, notify]);

    const payInvoice = useCallback(async (id: string) => {
        const pRes = await apiFetch(`/payments`);
        if (!pRes.ok) return false;
        
        const paymentsData = await pRes.json();
        const payments = Array.isArray(paymentsData.data) ? paymentsData.data : [];
        const payment = payments.find((p: { invoiceId: string; status: string; id: string }) => p.invoiceId === id && p.status === 'PENDING');
        
        if (payment) {
            const res = await apiFetch(`/payments/${payment.id}/complete`, { method: 'POST' });
            if (res.ok) { notify("Đã xác nhận thanh toán", "success"); refreshData(); return true; }
        } else {
            const resCreate = await apiFetch('/payments', { method: 'POST', body: JSON.stringify({ invoiceId: id, method: 'BANK_TRANSFER' }) });
            if (resCreate.ok) {
                const createData = await resCreate.json();
                const newPay = createData.data;
                const resComp = await apiFetch(`/payments/${newPay.id}/complete`, { method: 'POST' });
                if (resComp.ok) { notify("Đã tạo và xác nhận thanh toán", "success"); refreshData(); return true; }
            }
        }
        return false;
    }, [apiFetch, refreshData, notify]);

    const addDept = useCallback(async (data: Partial<Department>) => {
        const res = await apiFetch('/departments', { method: 'POST', body: JSON.stringify(data) });
        if (res.ok) { refreshData(); return true; }
        return false;
    }, [apiFetch, refreshData]);

    const updateDept = useCallback(async (id: string, data: Partial<Department>) => {
        const res = await apiFetch(`/departments/${id}`, { method: 'PATCH', body: JSON.stringify(data) });
        if (res.ok) { refreshData(); return true; }
        return false;
    }, [apiFetch, refreshData]);

    const removeDept = useCallback(async (id: string) => {
        const res = await apiFetch(`/departments/${id}`, { method: 'DELETE' });
        if (res.ok) { refreshData(); return true; }
        return false;
    }, [apiFetch, refreshData]);

    const addUser = useCallback(async (data: Partial<User>) => {
        const res = await apiFetch('/users', { method: 'POST', body: JSON.stringify(data) });
        if (res.ok) { refreshData(); return true; }
        return false;
    }, [apiFetch, refreshData]);

    const updateUser = useCallback(async (id: string, data: Partial<User>) => {
        const res = await apiFetch(`/users/${id}`, { method: 'PATCH', body: JSON.stringify(data) });
        if (res.ok) { refreshData(); return true; }
        return false;
    }, [apiFetch, refreshData]);

    const addBudgetPeriod = useCallback(async (data: Partial<BudgetPeriod>) => {
        const res = await apiFetch('/budgets/periods', { method: 'POST', body: JSON.stringify(data) });
        if (res.ok) { refreshData(); return true; }
        return false;
    }, [apiFetch, refreshData]);

    const updateBudgetPeriod = useCallback(async (id: string, data: Partial<BudgetPeriod>) => {
        const res = await apiFetch(`/budgets/periods/${id}`, { method: 'PATCH', body: JSON.stringify(data) });
        if (res.ok) { refreshData(); return true; }
        return false;
    }, [apiFetch, refreshData]);

    const removeBudgetPeriod = useCallback(async (id: string) => {
        const res = await apiFetch(`/budgets/periods/${id}`, { method: 'DELETE' });
        if (res.ok) { refreshData(); return true; }
        return false;
    }, [apiFetch, refreshData]);

    const addBudgetAllocation = useCallback(async (data: Partial<BudgetAllocation>) => {
        const res = await apiFetch('/budgets/allocations', { method: 'POST', body: JSON.stringify(data) });
        if (res.ok) { refreshData(); return true; }
        return false;
    }, [apiFetch, refreshData]);

    const updateBudgetAllocation = useCallback(async (id: string, data: Partial<BudgetAllocation>) => {
        const res = await apiFetch(`/budgets/allocations/${id}`, { method: 'PATCH', body: JSON.stringify(data) });
        if (res.ok) { refreshData(); return true; }
        return false;
    }, [apiFetch, refreshData]);

    const removeBudgetAllocation = useCallback(async (id: string) => {
        const res = await apiFetch(`/budgets/allocations/${id}`, { method: 'DELETE' });
        if (res.ok) { refreshData(); return true; }
        return false;
    }, [apiFetch, refreshData]);

    const addBudgetAllocationBundle = useCallback(async (data: { costCenterId: string, fiscalYear: number }) => {
        const res = await apiFetch(`/budgets/distribute-annual/${data.costCenterId}/${data.fiscalYear}`, { method: 'POST' });
        if (res.ok) { refreshData(); return true; }
        return false;
    }, [apiFetch, refreshData]);

    const reconcileQuarter = useCallback(async (costCenterId: string, fiscalYear: number, quarter: number) => {
        const res = await apiFetch(`/budgets/reconcile-quarter/${costCenterId}/${fiscalYear}/${quarter}`, { method: 'POST' });
        if (res.ok) { refreshData(); return true; }
        return false;
    }, [apiFetch, refreshData]);

    const addCostCenter = useCallback(async (data: Partial<CostCenter>) => {
        const res = await apiFetch('/cost-centers', { method: 'POST', body: JSON.stringify(data) });
        if (res.ok) { refreshData(); return true; }
        return false;
    }, [apiFetch, refreshData]);

    const updateCostCenter = useCallback(async (id: string, data: Partial<CostCenter>) => {
        const res = await apiFetch(`/cost-centers/${id}`, { method: 'PATCH', body: JSON.stringify(data) });
        if (res.ok) { refreshData(); return true; }
        return false;
    }, [apiFetch, refreshData]);

    const removeCostCenter = useCallback(async (id: string) => {
        const res = await apiFetch(`/cost-centers/${id}`, { method: 'DELETE' });
        if (res.ok) { refreshData(); return true; }
        return false;
    }, [apiFetch, refreshData]);

    const fetchCostCenter = useCallback(async (id: string) => {
        const res = await apiFetch(`/cost-centers/${id}`);
        if (res.ok) return (await res.json()).data;
        return null;
    }, [apiFetch]);

    const fetchQuarterlyBudget = useCallback(async (costCenterId: string, fiscalYear: number, quarter: number) => {
        const res = await apiFetch(`/budgets/allocations/quarterly/${costCenterId}/${fiscalYear}/${quarter}`);
        if (res.ok) return await res.json();
        return null;
    }, [apiFetch]);

    const addOrganization = useCallback(async (data: Partial<Organization>) => {
        const res = await apiFetch('/organizations', { method: 'POST', body: JSON.stringify(data) });
        if (res.ok) { refreshData(); return true; }
        return false;
    }, [apiFetch, refreshData]);

    const updateOrganization = useCallback(async (id: string, data: Partial<Organization>) => {
        const res = await apiFetch(`/organizations/${id}`, { method: 'PATCH', body: JSON.stringify(data) });
        if (res.ok) { refreshData(); return true; }
        return false;
    }, [apiFetch, refreshData]);

    const removeOrganization = useCallback(async (id: string) => {
        const res = await apiFetch(`/organizations/${id}`, { method: 'DELETE' });
        if (res.ok) { refreshData(); return true; }
        return false;
    }, [apiFetch, refreshData]);

    const createQuote = useCallback(async (rfqId: string, quoteData: Partial<Quote>) => {
        const res = await apiFetch('/quotes', { method: 'POST', body: JSON.stringify({ rfqId, ...quoteData }) });
        if (res.ok) { refreshData(); return true; }
        return false;
    }, [apiFetch, refreshData]);

    const matchInvoice = useCallback(async (id: string) => {
        const res = await apiFetch(`/invoices/${id}/run-matching`, { method: 'POST' });
        if (res.ok) { notify("Đã chạy đối soát lại", "info"); refreshData(); return true; }
        return false;
    }, [apiFetch, refreshData, notify]);

    const ackPO = useCallback(async (id: string) => {
        const res = await apiFetch(`/purchase-orders/${id}/confirm`, { method: 'POST' });
        if (res.ok) { notify("Đã xác nhận đơn hàng", "success"); refreshData(); return true; }
        return false;
    }, [apiFetch, refreshData, notify]);

    const shipPO = useCallback(async (id: string) => {
        const res = await apiFetch(`/purchase-orders/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status: 'SHIPPED' }) });
        if (res.ok) { notify("Đang giao hàng", "success"); refreshData(); return true; }
        return false;
    }, [apiFetch, refreshData, notify]);

    const contextValue = useMemo(() => ({
        ...state,
        login, logout, refreshData, apiFetch,
        addPR, updatePR, fetchPrDetail, approvePR,
        createPOFromPR, createRFQ, awardQuotation, createRFQConsolidated,
        actionApproval, addDept, updateDept, removeDept,
        addUser, updateUser, addBudgetPeriod, updateBudgetPeriod, removeBudgetPeriod,
        addBudgetAllocation, updateBudgetAllocation, removeBudgetAllocation,
        addBudgetAllocationBundle, reconcileQuarter,
        createGRN, ackPO, shipPO, createInvoice, payInvoice, matchInvoice,
        addCostCenter, updateCostCenter, removeCostCenter, fetchCostCenter, fetchQuarterlyBudget,
        addOrganization, updateOrganization, removeOrganization,
        removeNotification, notify, register, createQuote
    }), [state, login, logout, refreshData, apiFetch, addPR, updatePR, fetchPrDetail, approvePR, createPOFromPR, createRFQ, awardQuotation, createRFQConsolidated, actionApproval, addDept, updateDept, removeDept, addUser, updateUser, addBudgetPeriod, updateBudgetPeriod, removeBudgetPeriod, addBudgetAllocation, updateBudgetAllocation, removeBudgetAllocation, addBudgetAllocationBundle, reconcileQuarter, createGRN, ackPO, shipPO, createInvoice, payInvoice, matchInvoice, addCostCenter, updateCostCenter, removeCostCenter, fetchCostCenter, fetchQuarterlyBudget, addOrganization, updateOrganization, removeOrganization, removeNotification, notify, register, createQuote]);

    return (
        <ProcurementContext.Provider value={contextValue}>
            {children}
        </ProcurementContext.Provider>
    );
}

export const useProcurement = () => {
    const context = useContext(ProcurementContext);
    if (context === undefined) {
        throw new Error("useProcurement must be used within a ProcurementProvider");
    }
    return context;
};
