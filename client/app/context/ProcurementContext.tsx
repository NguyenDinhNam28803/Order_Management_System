"use client";

import React, { createContext, useContext, useState, useCallback, ReactNode, useMemo, useRef, useEffect } from "react";
import Cookies from 'js-cookie';
import {
    Organization, CostCenter, Department, CurrencyCode, CompanyType, KycStatus, UserRole, 
    PrStatus, RfqStatus, QuotationStatus, PoStatus, GrnStatus, InvoiceStatus, ApprovalStatus, DocumentType,
    ApiResponse, LoginPayload, LoginResponse, RegisterPayload, CreatePrDto, UpdatePrDto, CreateRfqDto, ConsolidateRfqDto, 
    CreateGrnDto, CreateInvoiceDto, CreateQuoteDto, CreateOrganizationPayload, UpdateOrganizationPayload, 
    CreateCostCenterPayload, UpdateCostCenterPayload, CreateDepartmentPayload, UpdateDepartmentPayload, 
    Product, ProductCategory, CreateProductDtoShort, UpdateProductDtoShort, CreateCategoryDto, UpdateCategoryDto
} from "../types/api-types";

export type { Organization, CostCenter, Department, Product, ProductCategory };

export enum QuoteRequestStatus {
    DRAFT = "DRAFT", SUBMITTED = "SUBMITTED", PROCESSING = "PROCESSING", QUOTED = "QUOTED", COMPLETED = "COMPLETED"
}

export enum PrType {
    CATALOG = "CATALOG", NON_CATALOG = "NON_CATALOG"
}

export interface QuoteRequestItem {
    id: string; productName: string; description: string; qty: number; unit: string; 
    unitPrice?: number; supplierName?: string; supplierId?: string;
}

export interface QuoteRequest {
    id: string; qrNumber: string; title: string; description: string; 
    status: QuoteRequestStatus; createdAt: string; items: QuoteRequestItem[]; supplierIds?: string[];
    requiredDate?: string;
}

export {
    CurrencyCode, CompanyType, KycStatus, UserRole, PrStatus, RfqStatus, QuotationStatus, 
    PoStatus, GrnStatus, InvoiceStatus, ApprovalStatus, DocumentType
};

export interface Notification {
    id: number; message: string; type: 'success' | 'error' | 'info' | 'warning'; role?: string;
}

export interface User {
    id: string;
    email: string;
    name?: string;
    fullName?: string;
    role: UserRole | string;
    department?: string | { id: string; name: string };
    deptId?: string;
    orgId?: string;
    jobTitle?: string;
    employeeCode?: string;
    isActive?: boolean;
    avatarUrl?: string;
    icon?: string;
}

export interface PRItem {
    id: string; productName: string; qty: number; unit: string; estimatedPrice: number; 
    description?: string; lineItem?: number; productDesc?: string; sku?: string; productId?: string;
}

export interface PR {
    id: string; prNumber?: string; title: string; description?: string; justification?: string; requiredDate?: string;
    status: PrStatus | string; priority: number; currency?: CurrencyCode; createdAt: string; 
    requester: { id: string; fullName?: string; name?: string; role?: string; email?: string; };
    department?: { name: string } | string; deptId?: string; costCenterId?: string; 
    totalEstimate?: number; items?: PRItem[];
    type: PrType;
    preferredSupplierId?: string;
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

export interface BudgetPeriod {
    id: string; orgId: string; fiscalYear: number; periodType: string; periodNumber: number; startDate: string; endDate: string; isActive: boolean;
}

export interface BudgetAllocation {
    id: string; budgetPeriodId: string; costCenterId: string; orgId: string; deptId?: string; 
    allocatedAmount: number; committedAmount: number; spentAmount: number; currency: string;
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
    budgetAllocations: BudgetAllocation[]; organizations: Organization[]; products: Product[]; 
    productCategories: ProductCategory[]; quoteRequests: QuoteRequest[]; loadingMyPrs: boolean; 
    simulation: SimulationState;
}

export interface ProcurementContextType extends ProcurementState {
    login: (email: string, password?: string) => Promise<boolean>;
    logout: () => Promise<void>;
    refreshData: () => Promise<void>;
    apiFetch: (url: string, options?: RequestInit) => Promise<Response>;
    addPR: (data: CreatePrDto) => Promise<PR | null>;
    submitPR: (id: string) => Promise<boolean>;
    updatePR: (id: string, data: UpdatePrDto) => Promise<boolean>;
    fetchPrDetail: (id: string) => Promise<PR | null>;
    approvePR: (id: string, comment?: string) => Promise<boolean>;
    createPOFromPR: (prId: string, vId?: string) => Promise<boolean>;
    createRFQ: (data: CreateRfqDto) => Promise<RFQ | null>;
    awardQuotation: (rfqId: string, sId: string) => Promise<boolean>;
    createRFQConsolidated: (data: ConsolidateRfqDto) => Promise<boolean>;
    actionApproval: (wId: string, a: 'APPROVE' | 'REJECT', c?: string) => Promise<boolean>;
    addDept: (d: any) => Promise<boolean>;
    updateDept: (i: string, d: any) => Promise<boolean>;
    removeDept: (i: string) => Promise<boolean>;
    addUser: (d: any) => Promise<boolean>;
    updateUser: (i: string, d: any) => Promise<boolean>;
    removeUser: (i: string) => Promise<boolean>;
    addBudgetPeriod: (d: any) => Promise<boolean>;
    updateBudgetPeriod: (i: string, d: any) => Promise<boolean>;
    removeBudgetPeriod: (i: string) => Promise<boolean>;
    addBudgetAllocation: (d: any) => Promise<boolean>;
    updateBudgetAllocation: (i: string, d: any) => Promise<boolean>;
    removeBudgetAllocation: (i: string) => Promise<boolean>;
    addBudgetAllocationBundle: (cc: string, a: any[]) => Promise<boolean>;
    reconcileQuarter: (cc: string, q: number) => Promise<boolean>;
    fetchCostCenter: (i: string) => Promise<CostCenter | null>;
    fetchQuarterlyBudget: (cc: string, q: number) => Promise<BudgetStats | null>;
    addCostCenter: (d: any) => Promise<boolean>;
    updateCostCenter: (i: string, d: any) => Promise<boolean>;
    removeCostCenter: (i: string) => Promise<boolean>;
    addOrganization: (d: any) => Promise<boolean>;
    updateOrganization: (i: string, d: any) => Promise<boolean>;
    removeOrganization: (i: string) => Promise<boolean>;
    addProduct: (d: any) => Promise<boolean>;
    updateProduct: (i: string, d: any) => Promise<boolean>;
    removeProduct: (i: string) => Promise<boolean>;
    addCategory: (d: any) => Promise<boolean>;
    updateCategory: (i: string, d: any) => Promise<boolean>;
    removeCategory: (i: string) => Promise<boolean>;
    removeNotification: (i: number) => void;
    notify: (m: string, t?: 'success' | 'error' | 'info' | 'warning', r?: string) => void;
    register: (d: RegisterPayload) => Promise<void>;
    createQuote: (d: CreateQuoteDto) => Promise<boolean>;
    createPO: (d: any) => Promise<boolean>;
    createGRN: (d: CreateGrnDto) => Promise<boolean>;
    ackPO: (i: string) => Promise<boolean>;
    shipPO: (i: string, t?: string) => Promise<boolean>;
    createInvoice: (d: CreateInvoiceDto) => Promise<boolean>;
    payInvoice: (i: string) => Promise<boolean>;
    matchInvoice: (i: string, s?: string) => Promise<boolean>;
    addQuoteRequest: (d: Partial<QuoteRequest>) => Promise<QuoteRequest | null>;
    updateQuoteRequest: (i: string, d: Partial<QuoteRequest>) => Promise<boolean>;
    submitQuoteRequest: (i: string) => Promise<boolean>;
    convertQuoteToPR: (i: string) => Promise<boolean>;
    sendQuoteRequestToSupplier: (i: string, sIds: string[]) => Promise<boolean>;
    createPRFromQuoteRequest: (qrId: string) => Promise<boolean>;
    startSimulation: (w: "CATALOG" | "NON_CATALOG") => void;
    nextSimulationStep: () => void;
    stopSimulation: () => void;
    confirmCatalogPrice: (d: { prId: string, supplierId: string, price: number, stock: number, leadTime: number, note?: string }) => Promise<boolean>;
}

const ProcurementContext = createContext<ProcurementContextType | undefined>(undefined);

export function ProcurementProvider({ children }: { children: ReactNode }) {
    const [state, setState] = useState<ProcurementState>({
        currentUser: null, prs: [
            { 
            id: "PR-2026-003", 
            prNumber: "PR-2026-003", 
            title: "Máy tính Dell XPS 15", 
            description: "Mua sắm máy tính cho nhân viên mới phòng IT", 
            status: PrStatus.APPROVED, 
            type: PrType.CATALOG,
            totalEstimate: 25000000, 
            priority: 1, 
            requester: { id: "u-1", fullName: "Nguyễn Văn A" }, 
            deptId: "dept-it",
            department: "Phòng IT",
            preferredSupplierId: "6c7f4a14-9238-419c-ba0f-fa8da8eb0253",
            createdAt: "2026-04-03T09:15:00Z", 
            items: [{ id: "item-3", productName: "Dell XPS 15 OLED", qty: 1, estimatedPrice: 25000000, unit: "Cái" }]
        },
            { 
                id: "PR-2026-004", prNumber: "PR-2026-004", title: "Màn hình Dell 27 inch", status: PrStatus.PENDING_APPROVAL, priority: 2, 
                createdAt: new Date().toISOString(), type: PrType.NON_CATALOG,
                requester: { id: "u-1", fullName: "Nguyễn Văn A" }, totalEstimate: 12000000, 
                items: [{ id: "i-004", productName: "Màn hình Dell 27 inch", qty: 2, unit: "Cái", estimatedPrice: 6000000 }] 
            }
        ], myPrs: [], pos: [], rfqs: [
            { id: "RFQ-2026-002", prId: "PR-2026-004", rfqNumber: "RFQ-2026-002", vendor: "Saigon Tech", status: RfqStatus.SENT, title: "Lấy báo giá màn hình", createdAt: new Date().toISOString(), type: "RFQ", supplierIds: ["6c7f4a14-9238-419c-ba0f-fa8da8eb0253", "SUP-002"] }
        ], grns: [], invoices: [],
        budgets: { allocated: 10000000000, committed: 2500000000, spent: 4500000000 },
        users: [
            { id: "u-1", email: "requester@abc.com.vn", fullName: "Nguyễn Văn A", role: "REQUESTER", deptId: "DEPT-IT", orgId: "ORG-ABC" },
            { id: "u-2", email: "manager@abc.com.vn", fullName: "Trần Thị B", role: "MANAGER", deptId: "DEPT-IT", orgId: "ORG-ABC" },
            { id: "u-3", email: "procurement@abc.com.vn", fullName: "Lê Văn C", role: "PROCUREMENT", deptId: "DEPT-PUR", orgId: "ORG-ABC" },
            { id: "u-4", email: "supplier@abc.com.vn", fullName: "NCC ABC Tech", role: "SUPPLIER", orgId: "6c7f4a14-9238-419c-ba0f-fa8da8eb0253" }
        ], 
        departments: [
            { id: "DEPT-IT", name: "Phòng Công nghệ thông tin", orgId: "ORG-ABC" } as unknown as Department,
            { id: "DEPT-PUR", name: "Phòng Thu mua", orgId: "ORG-ABC" } as unknown as Department
        ], 
        notifications: [], approvals: [], costCenters: [], budgetPeriods: [],
        budgetAllocations: [], 
        organizations: [
            { id: "ORG-ABC", name: "Tập đoàn ABC", companyType: CompanyType.BUYER } as unknown as Organization,
            { id: "6c7f4a14-9238-419c-ba0f-fa8da8eb0253", name: "Công ty Cổ phần Công nghệ ABC", companyType: CompanyType.SUPPLIER } as unknown as Organization,
            { id: "SUP-002", name: "Thế Giới Di Động", companyType: CompanyType.SUPPLIER } as unknown as Organization
        ], 
        products: [], productCategories: [], quoteRequests: [],
        loadingMyPrs: false, simulation: { workflow: null, step: 0, isActive: false }
    });

    const isInitialized = useRef(false);
    useEffect(() => {
        const saved = localStorage.getItem("procurement_mock_state");
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                setState(prev => ({ ...prev, ...parsed, currentUser: prev.currentUser }));
            } catch (e) { console.error("Persistence Load Error", e); }
        }
        isInitialized.current = true;
    }, []);

    useEffect(() => {
        if (isInitialized.current) {
            const tempState = { ...state };
            delete (tempState as any).currentUser;
            localStorage.setItem("procurement_mock_state", JSON.stringify(tempState));
        }
    }, [state]);

    const notify = useCallback((message: string, type: 'success' | 'error' | 'info' | 'warning' = 'success', role?: string) => {
        const id = Date.now();
        setState(prev => ({ ...prev, notifications: [...prev.notifications, { id, message, type, role }] }));
        setTimeout(() => setState(prev => ({ ...prev, notifications: prev.notifications.filter(n => n.id !== id) })), 5000);
    }, []);

    const removeNotification = useCallback((id: number) => setState(prev => ({ ...prev, notifications: prev.notifications.filter(n => n.id !== id) })), []);

    const apiFetch = useCallback(async (url: string, options: RequestInit = {}) => {
        const token = Cookies.get('accessToken');
        const headers: HeadersInit = { 'Content-Type': 'application/json', ...(token ? { 'Authorization': `Bearer ${token}` } : {}), ...options.headers };
        try { return await fetch(`http://localhost:5000${url}`, { ...options, credentials: 'include', headers }); }
        catch (e) { return { ok: false, status: 503, json: async () => ({ message: 'Network error' }) } as Response; }
    }, []);

    const refreshData = useCallback(async () => { 
        setState(prev => ({ ...prev, loadingMyPrs: true })); 
        try {
            // Parallel fetches for speed
            const [usersResp, deptsResp, orgsResp, costCentersResp] = await Promise.all([
                apiFetch('/users'),
                apiFetch('/departments'),
                apiFetch('/organizations'),
                apiFetch(`/cost-centers${state.currentUser?.orgId ? `?orgId=${state.currentUser.orgId}` : ''}`)
            ]);
            
            if (usersResp.ok) {
                const result = await usersResp.json();
                const usersData = result.data || result;
                if (Array.isArray(usersData)) setState(prev => ({ ...prev, users: usersData }));
            }
            
            if (deptsResp.ok) {
                const result = await deptsResp.json();
                const deptsData = result.data || result;
                if (Array.isArray(deptsData)) setState(prev => ({ ...prev, departments: deptsData }));
            }

            if (orgsResp.ok) {
                const result = await orgsResp.json();
                const orgsData = result.data || result;
                if (Array.isArray(orgsData)) setState(prev => ({ ...prev, organizations: orgsData }));
            }

            if (costCentersResp.ok) {
                const result = await costCentersResp.json();
                const ccData = result.data || result;
                if (Array.isArray(ccData)) setState(prev => ({ ...prev, costCenters: ccData }));
            }
        } catch (e) {
            console.error("Refresh Data Error", e);
        } finally {
            setState(prev => ({ ...prev, loadingMyPrs: false }));
        }
    }, [apiFetch]);

    const login = useCallback(async (email: string, password?: string) => {
        // --- 1. Try Real API Login first ---
        try {
            const response = await apiFetch('/auth/login', {
                method: 'POST',
                body: JSON.stringify({ email, password: password || "password" })
            });
            
            if (response.ok) {
                const result = await response.json();
                const authData = result.data || result;
                
                if (authData.accessToken) {
                    Cookies.set('accessToken', authData.accessToken, { expires: 7 });
                    if (authData.user) {
                        setState(prev => ({ ...prev, currentUser: authData.user }));
                        notify(`Đăng nhập thành công (API)`);
                        refreshData();
                        return true;
                    }
                }
            }
        } catch (err) {
            console.warn("API Login Error, falling back to Demo Mode:", err);
        }

        // --- 2. Fallback to Demo Mode (Mock) ---
        const mockUser = state.users.find(u => u.email === email);
        if (mockUser) {
            setState(prev => ({ ...prev, currentUser: mockUser }));
            notify(`Chào mừng ${mockUser.fullName} (Demo Mode)`);
            refreshData();
            return true;
        }
        
        return false;
    }, [apiFetch, notify, refreshData, state.users]);

    const logout = useCallback(async () => { Cookies.remove('accessToken'); setState(prev => ({ ...prev, currentUser: null })); }, []);

    const addPR = useCallback(async (d: CreatePrDto) => {
        const n: PR = {
            id: `pr-${Date.now()}`, prNumber: `PR-2026-${Math.floor(1000 + Math.random() * 9000)}`, title: d.title, status: PrStatus.DRAFT, priority: d.priority || 2, 
            createdAt: new Date().toISOString(), requester: { id: state.currentUser?.id || "u-1", fullName: state.currentUser?.fullName || "A" },
            totalEstimate: d.items.reduce((s, it) => s + (it.qty * (it.estimatedPrice || 0)), 0),
            items: d.items.map((it, i) => ({ id: `it-${Date.now()}-${i}`, productName: it.productDesc || "P", qty: it.qty, unit: it.unit || "C", estimatedPrice: it.estimatedPrice || 0 })),
            type: PrType.NON_CATALOG
        };
        setState(prev => ({ ...prev, prs: [n, ...prev.prs], myPrs: [n, ...prev.myPrs] }));
        notify("Tạo nháp thành công"); return n;
    }, [state.currentUser, notify]);

    const submitPR = useCallback(async (id: string) => {
        setState(prev => ({ 
            ...prev, 
            prs: prev.prs.map(p => p.id === id ? { ...p, status: PrStatus.PENDING_APPROVAL } : p),
            myPrs: prev.myPrs.map(p => p.id === id ? { ...p, status: PrStatus.PENDING_APPROVAL } : p),
            approvals: [{ id: `wf-${Date.now()}`, documentId: id, status: ApprovalStatus.PENDING, documentType: DocumentType.PURCHASE_REQUISITION }, ...prev.approvals]
        }));
        return true;
    }, []);

    const approvePR = useCallback(async (id: string, c?: string) => {
        setState(prev => ({
            ...prev,
            prs: prev.prs.map(p => p.id === id ? { ...p, status: PrStatus.APPROVED } : p),
            myPrs: prev.myPrs.map(p => p.id === id ? { ...p, status: PrStatus.APPROVED } : p),
            approvals: prev.approvals.map(a => a.documentId === id ? { ...a, status: ApprovalStatus.APPROVED, comment: c } : a)
        }));
        return true;
    }, []);

    const stopSimulation = useCallback(() => setState(prev => ({ ...prev, simulation: { workflow: null, step: 0, isActive: false } })), []);
    const startSimulation = useCallback((w: "CATALOG" | "NON_CATALOG") => setState(prev => ({ ...prev, simulation: { workflow: w, step: 1, isActive: true } })), []);

    const nextSimulationStep = useCallback(() => {
        const { workflow, step } = state.simulation;
        if (!workflow) return;
        const nextStep = step + 1;
        setState(prev => {
            let ns = { ...prev, simulation: { ...prev.simulation, step: nextStep } };
            if (workflow === "CATALOG") {
                switch(nextStep) {
                    case 2:
                        const pr: PR = { id: "PR-W1-SIM", prNumber: "PR-2026-003", title: "Máy tính Dell XPS 15", status: PrStatus.PENDING_APPROVAL, priority: 1, createdAt: new Date().toISOString(), requester: { id: "u-1", fullName: "Nguyễn Văn A" }, totalEstimate: 45000000, items: [{ id: "i-w1", productName: "Dell XPS", qty: 1, unit: "Cái", estimatedPrice: 45000000 }], type: PrType.CATALOG, preferredSupplierId: "6c7f4a14-9238-419c-ba0f-fa8da8eb0253" };
                        ns.prs = [pr, ...prev.prs]; ns.myPrs = [pr, ...prev.myPrs]; ns.approvals = [{ id: "wf-w1", documentId: "PR-W1-SIM", status: ApprovalStatus.PENDING, documentType: DocumentType.PURCHASE_REQUISITION }, ...prev.approvals];
                        break;
                    case 3:
                        ns.prs = prev.prs.map(p => p.id === "PR-W1-SIM" ? { ...p, status: PrStatus.APPROVED } : p);
                        ns.approvals = prev.approvals.map(a => a.documentId === "PR-W1-SIM" ? { ...a, status: ApprovalStatus.APPROVED } : a);
                        break;
                    case 4:
                        const rfq: RFQ = { id: "RFQ-W1-SIM", prId: "PR-W1-SIM", rfqNumber: "RFQ-2026-W1", vendor: "ABC", status: RfqStatus.SENT, title: "Xác nhận giá", createdAt: new Date().toISOString(), supplierIds: ["6c7f4a14-9238-419c-ba0f-fa8da8eb0253"], type: "PO_CONFIRMATION" };
                        ns.rfqs = [rfq, ...prev.rfqs];
                        break;
                    case 5:
                        ns.rfqs = prev.rfqs.map(r => r.id === "RFQ-W1-SIM" ? { ...r, status: RfqStatus.AWARDED, price: 44500000, stock: 10, leadTime: 3 } : r);
                        break;
                    case 6:
                        const po: PO = { id: "PO-W1-SIM", poNumber: "PO-2026-002", vendor: "ABC", status: PoStatus.ISSUED, total: 44500000, createdAt: new Date().toISOString(), items: [{ id: "pi-w1", description: "Dell XPS", qty: 1, estimatedPrice: 44500000 }] };
                        ns.pos = [po, ...prev.pos];
                        break;
                    default: ns.simulation.isActive = false; break;
                }
            } else {
                switch(nextStep) {
                    case 2:
                        const qr: QuoteRequest = { id: "QR-W2-SIM", qrNumber: "QR-2026-002", title: "Nâng cấp hạ tầng Switch", description: "Xin giá 3 đơn vị", status: QuoteRequestStatus.SUBMITTED, createdAt: new Date().toISOString(), items: [{ id: "it-w2", productName: "Switch Cisco", description: "24 Port", qty: 2, unit: "Cái" }] };
                        ns.quoteRequests = [qr, ...prev.quoteRequests];
                        break;
                    case 6:
                        const pr: PR = { id: "PR-W2-SIM", prNumber: "PR-2026-004", title: "Mua Switch Cisco", status: PrStatus.PENDING_APPROVAL, priority: 2, createdAt: new Date().toISOString(), requester: { id: "u-1", fullName: "A" }, totalEstimate: 50000000, items: [{ id: "i-w2", productName: "Switch Cisco", qty: 2, unit: "Cái", estimatedPrice: 25000000 }], type: PrType.NON_CATALOG };
                        ns.prs = [pr, ...prev.prs]; ns.myPrs = [pr, ...prev.myPrs];
                        break;
                    default: ns.simulation.isActive = false; break;
                }
            }
            return ns;
        });
    }, [state.simulation]);

    const confirmCatalogPrice = useCallback(async (d: { prId: string, supplierId: string, price: number, stock: number, leadTime: number, note?: string }) => {
        const rfq: RFQ = {
            id: `conf-${Date.now()}`,
            prId: d.prId,
            rfqNumber: `CONF-2026-${Math.floor(100+Math.random()*900)}`,
            vendor: state.organizations.find(o => o.id === d.supplierId)?.name || "NCC",
            status: RfqStatus.SENT,
            createdAt: new Date().toISOString(),
            type: "PO_CONFIRMATION",
            price: d.price,
            stock: d.stock,
            leadTime: d.leadTime,
            note: d.note,
            supplierIds: [d.supplierId]
        };
        setState(prev => ({ 
            ...prev, 
            rfqs: [rfq, ...prev.rfqs],
            prs: prev.prs.map(p => p.id === d.prId ? { ...p, status: "PRICE_CONFIRMATION_SENT" } : p)
        }));
        notify("Đã gửi xác nhận giá tới Nhà cung cấp", "success");
        return true;
    }, [state.organizations, notify]);

    const addQuoteRequest = useCallback(async (data: Partial<QuoteRequest>) => {
        const newQR: QuoteRequest = {
            id: `qr-${Date.now()}`, qrNumber: `QR-2026-${Math.floor(100 + Math.random() * 900)}`,
            title: data.title || "Yêu cầu báo giá mới", description: data.description || "",
            status: QuoteRequestStatus.DRAFT, createdAt: new Date().toISOString(),
            requiredDate: data.requiredDate,
            items: (data.items || []).map((it, idx) => ({ ...it, id: it.id || `it-${Date.now()}-${idx}` })) as QuoteRequestItem[]
        };
        setState(prev => ({ ...prev, quoteRequests: [newQR, ...prev.quoteRequests] }));
        notify("Đã tạo yêu cầu báo giá nháp thành công");
        return newQR;
    }, [notify]);

    const updateQuoteRequest = useCallback(async (id: string, data: Partial<QuoteRequest>) => {
        setState(prev => ({ ...prev, quoteRequests: prev.quoteRequests.map(q => q.id === id ? { ...q, ...data } : q) }));
        return true;
    }, []);

    const submitQuoteRequest = useCallback(async (id: string) => {
        setState(prev => ({ ...prev, quoteRequests: prev.quoteRequests.map(q => q.id === id ? { ...q, status: QuoteRequestStatus.SUBMITTED } : q) }));
        return true;
    }, []);

    const convertQuoteToPR = useCallback(async (qrId: string) => {
        const qr = state.quoteRequests.find(q => q.id === qrId);
        if (!qr) return false;
        return !!(await addPR({ title: `PR từ ${qr.qrNumber}`, items: qr.items.map(i => ({ productDesc: i.productName, qty: i.qty, unit: i.unit, estimatedPrice: i.unitPrice || 0 })) }));
    }, [state.quoteRequests, addPR]);

    const sendQuoteRequestToSupplier = useCallback(async (id: string, supplierIds: string[]) => {
        setState(prev => ({ ...prev, quoteRequests: prev.quoteRequests.map(qr => qr.id === id ? { ...qr, status: QuoteRequestStatus.PROCESSING, supplierIds } : qr) }));
        return true;
    }, []);

    const createPRFromQuoteRequest = useCallback(async (qrId: string) => await convertQuoteToPR(qrId), [convertQuoteToPR]);

    const createPO = useCallback(async (data: any) => {
        const newPO: PO = {
            id: `po-${Date.now()}`, poNumber: `PO-2026-${Math.floor(100 + Math.random() * 900)}`, vendor: data.vendor || "NCC",
            status: PoStatus.ISSUED, total: data.total || 0, createdAt: new Date().toISOString(),
            items: (data.items || []).map((it: any, idx: number) => ({ id: `pi-${Date.now()}-${idx}`, description: it.description || "P", qty: it.qty || 1, estimatedPrice: it.estimatedPrice || 0 }))
        };
        setState(prev => ({ ...prev, pos: [newPO, ...prev.pos] }));
        return true;
    }, []);

    const createPOFromPR = useCallback(async (prId: string, vendorId?: string) => {
        const pr = state.prs.find(p => p.id === prId);
        if (!pr) return false;
        const vendor = vendorId ? (state.organizations.find(o => o.id === vendorId)?.name || "NCC") : "NCC";
        const newPO: PO = { id: `po-${Date.now()}`, poNumber: `PO-2026-${Math.floor(1000 + Math.random() * 9000)}`, vendor, status: PoStatus.ISSUED, total: pr.totalEstimate || 0, createdAt: new Date().toISOString(), items: (pr.items || []).map((it, idx) => ({ id: `pi-${Date.now()}-${idx}`, description: it.productName, qty: it.qty, estimatedPrice: it.estimatedPrice })) };
        setState(prev => ({ ...prev, pos: [newPO, ...prev.pos], prs: prev.prs.map(p => p.id === prId ? { ...p, status: "PO_ISSUED" } : p) }));
        return true;
    }, [state.prs, state.organizations]);

    const ackPO = useCallback(async (id: string) => {
        setState(prev => ({ ...prev, pos: prev.pos.map(p => p.id === id ? { ...p, status: "ACKNOWLEDGED" } : p) }));
        return true;
    }, []);

    const shipPO = useCallback(async (id: string) => {
        setState(prev => ({ ...prev, pos: prev.pos.map(p => p.id === id ? { ...p, status: "SHIPPED" } : p) }));
        return true;
    }, []);

    const contextValue: ProcurementContextType = {
        ...state, login, logout, refreshData, apiFetch, addPR, submitPR, approvePR,
        createPOFromPR, createPO, ackPO, shipPO,
        createRFQ: async (d: any) => { return null; }, awardQuotation: async (id: string, s: string) => { return true; }, 
        createRFQConsolidated: async (d: any) => { return true; }, actionApproval: async (id: string, a: any) => { return true; }, 
        addDept: async (d: any) => {
            try {
                const response = await apiFetch('/departments', {
                    method: 'POST',
                    body: JSON.stringify(d)
                });
                if (response.ok) {
                    notify("Đã tạo phòng ban mới thành công");
                    await refreshData();
                    return true;
                }
                const err = await response.json();
                notify(err.message || "Lỗi khi tạo phòng ban", "error");
            } catch (e) {
                notify("Lỗi kết nối máy chủ", "error");
            }
            return false;
        },
        updateDept: async (i: string, d: any) => {
            try {
                const response = await apiFetch(`/departments/${i}`, {
                    method: 'PATCH',
                    body: JSON.stringify(d)
                });
                if (response.ok) {
                    notify("Đã cập nhật thông tin phòng ban");
                    await refreshData();
                    return true;
                }
                const err = await response.json();
                notify(err.message || "Lỗi khi cập nhật", "error");
            } catch (e) {
                notify("Lỗi kết nối máy chủ", "error");
            }
            return false;
        },
        removeDept: async (i: string) => {
            try {
                const response = await apiFetch(`/departments/${i}`, { method: 'DELETE' });
                if (response.ok) {
                    notify("Đã xóa phòng ban thành công");
                    await refreshData();
                    return true;
                }
                const err = await response.json();
                notify(err.message || "Lỗi khi xóa", "error");
            } catch (e) {
                notify("Lỗi kết nối máy chủ", "error");
            }
            return false;
        },
        addUser: async (d: any) => {
            try {
                const response = await apiFetch('/users', {
                    method: 'POST',
                    body: JSON.stringify(d)
                });
                if (response.ok) {
                    notify("Đã tạo người dùng mới thành công");
                    await refreshData();
                    return true;
                }
                const err = await response.json();
                notify(err.message || "Lỗi khi tạo người dùng", "error");
            } catch (e) {
                notify("Lỗi kết nối máy chủ", "error");
            }
            return false;
        },
        updateUser: async (i: string, d: any) => {
            try {
                const response = await apiFetch(`/users/${i}`, {
                    method: 'PATCH',
                    body: JSON.stringify(d)
                });
                if (response.ok) {
                    notify("Đã cập nhật thông tin người dùng");
                    await refreshData();
                    return true;
                }
                const err = await response.json();
                notify(err.message || "Lỗi khi cập nhật", "error");
            } catch (e) {
                notify("Lỗi kết nối máy chủ", "error");
            }
            return false;
        },
        removeUser: async (i: string) => {
            try {
                const response = await apiFetch(`/users/${i}`, { method: 'DELETE' });
                if (response.ok) {
                    notify("Đã xóa người dùng thành công");
                    await refreshData();
                    return true;
                }
                const err = await response.json();
                notify(err.message || "Lỗi khi xóa", "error");
            } catch (e) {
                notify("Lỗi kết nối máy chủ", "error");
            }
            return false;
        },
        addBudgetPeriod: async (d: any) => { return true; }, 
        updateBudgetPeriod: async (i: string, d: any) => { return true; }, removeBudgetPeriod: async (i: string) => { return true; }, 
        addBudgetAllocation: async (d: any) => { return true; }, updateBudgetAllocation: async (i: string, d: any) => { return true; }, 
        removeBudgetAllocation: async (i: string) => { return true; }, addBudgetAllocationBundle: async (cc: string, a: any[]) => { return true; }, 
        reconcileQuarter: async (cc: string, q: number) => { return true; }, 
        fetchCostCenter: async (i: string) => {
            try {
                const response = await apiFetch(`/cost-centers/${i}`);
                if (response.ok) {
                    const res = await response.json();
                    return res.data || res;
                }
            } catch (e) {}
            return null;
        }, 
        fetchQuarterlyBudget: async (cc: string, q: number) => { return null; }, 
        addCostCenter: async (d: any) => {
            try {
                const response = await apiFetch('/cost-centers', {
                    method: 'POST',
                    body: JSON.stringify(d)
                });
                if (response.ok) {
                    notify("Đã tạo trung tâm chi phí thành công");
                    await refreshData();
                    return true;
                }
                const err = await response.json();
                notify(err.message || "Lỗi khi tạo Cost Center", "error");
            } catch (e) {
                notify("Lỗi kết nối máy chủ", "error");
            }
            return false;
        }, 
        updateCostCenter: async (i: string, d: any) => {
            try {
                const response = await apiFetch(`/cost-centers/${i}`, {
                    method: 'PATCH',
                    body: JSON.stringify(d)
                });
                if (response.ok) {
                    notify("Đã cập nhật Cost Center");
                    await refreshData();
                    return true;
                }
                const err = await response.json();
                notify(err.message || "Lỗi khi cập nhật", "error");
            } catch (e) {
                notify("Lỗi kết nối máy chủ", "error");
            }
            return false;
        }, 
        removeCostCenter: async (i: string) => {
            try {
                const response = await apiFetch(`/cost-centers/${i}`, { method: 'DELETE' });
                if (response.ok) {
                    notify("Đã xóa trung tâm chi phí thành công");
                    await refreshData();
                    return true;
                }
                const err = await response.json();
                notify(err.message || "Lỗi khi xóa", "error");
            } catch (e) {
                notify("Lỗi kết nối máy chủ", "error");
            }
            return false;
        }, 
        addOrganization: async (d: any) => { return true; }, updateOrganization: async (i: string, d: any) => { return true; }, 
        removeOrganization: async (i: string) => { return true; }, addProduct: async (d: any) => { return true; }, 
        updateProduct: async (i: string, d: any) => { return true; }, removeProduct: async (i: string) => { return true; }, 
        addCategory: async (d: any) => { return true; }, updateCategory: async (i: string, d: any) => { return true; }, 
        removeCategory: async (i: string) => { return true; }, removeNotification, notify, register: async (d: any) => {}, 
        createQuote: async (d: any) => { return true; }, createGRN: async (d: any) => { return true; },
        createInvoice: async (d: any) => { return true; }, payInvoice: async (i: string) => { return true; },
        matchInvoice: async (i: string) => { return true; }, 
        addQuoteRequest, updateQuoteRequest, submitQuoteRequest, convertQuoteToPR, sendQuoteRequestToSupplier, createPRFromQuoteRequest,
        startSimulation, nextSimulationStep, stopSimulation, confirmCatalogPrice,
        updatePR: async (id: string, d: any) => { return true; }, fetchPrDetail: async (id: string) => { return null; }
    };

    return (<ProcurementContext.Provider value={contextValue}>{children}</ProcurementContext.Provider>);
}

export const useProcurement = () => {
    const c = useContext(ProcurementContext);
    if (!c) throw new Error("Err");
    return c;
};
