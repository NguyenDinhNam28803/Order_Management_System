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
    DocumentType,
    ApiResponse,
    LoginPayload,
    LoginResponse,
    RegisterPayload,
    CreatePrDto,
    UpdatePrDto,
    CreateRfqDto,
    ConsolidateRfqDto,
    CreateGrnDto,
    CreateInvoiceDto,
    CreateQuoteDto,
    CreateOrganizationPayload,
    UpdateOrganizationPayload,
    CreateCostCenterPayload,
    UpdateCostCenterPayload,
    CreateDepartmentPayload,
    UpdateDepartmentPayload,
    Product,
    ProductCategory,
    CreateProductDtoShort,
    UpdateProductDtoShort,
    CreateCategoryDto,
    UpdateCategoryDto
} from "../types/api-types";

export type {
    Organization,
    CostCenter,
    Department,
    Product,
    ProductCategory
};

export enum QuoteRequestStatus {
    DRAFT = "DRAFT",
    SUBMITTED = "SUBMITTED",
    PROCESSING = "PROCESSING",
    COMPLETED = "COMPLETED"
}


export interface QuoteRequestItem {
    id: string;
    productName: string;
    description: string;
    qty: number;
    unit: string;
    unitPrice?: number;
    supplierName?: string;
}

export interface QuoteRequest {
    id: string;
    qrNumber: string;
    title: string;
    description: string;
    status: QuoteRequestStatus;
    createdAt: string;
    items: QuoteRequestItem[];
}

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
    categories: ProductCategory[];
    approvals: ApprovalWorkflow[];
    fiscalYears: number[];
    token: string | null;
    loadingMyPrs: boolean;
    currentPrDetail: PR | null;
    quoteRequests: QuoteRequest[];
}


interface ProcurementContextType extends ProcurementState {
    login: (email: string, password?: string) => Promise<boolean>;
    logout: () => Promise<void>;
    refreshData: () => Promise<void>;
    apiFetch: (url: string, options?: RequestInit) => Promise<Response>;
    addPR: (data: CreatePrDto) => Promise<PR | null>;
    submitPR: (id: string) => Promise<boolean>;
    updatePR: (id: string, data: UpdatePrDto) => Promise<boolean>;
    fetchPrDetail: (id: string) => Promise<PR | null>;
    approvePR: (id: string) => Promise<boolean>;
    createPOFromPR: (prId: string, supplierId: string) => Promise<boolean>;
    createRFQ: (data: CreateRfqDto) => Promise<boolean>;
    awardQuotation: (rfqId: string, quotationId: string) => Promise<boolean>;
    createRFQConsolidated: (data: ConsolidateRfqDto) => Promise<string>;
    actionApproval: (workflowId: string, action: string, comment?: string) => Promise<boolean>;
    addDept: (data: CreateDepartmentPayload) => Promise<boolean>;
    updateDept: (id: string, data: UpdateDepartmentPayload) => Promise<boolean>;
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
    addCostCenter: (data: CreateCostCenterPayload) => Promise<boolean>;
    updateCostCenter: (id: string, updateData: UpdateCostCenterPayload) => Promise<boolean>;
    removeCostCenter: (id: string) => Promise<boolean>;
    fetchCostCenter: (id: string) => Promise<CostCenter | null>;
    fetchQuarterlyBudget: (costCenterId: string, fiscalYear: number, quarter: number) => Promise<{ data: BudgetAllocation } | null>;
    addOrganization: (data: CreateOrganizationPayload) => Promise<boolean>;
    updateOrganization: (id: string, data: UpdateOrganizationPayload) => Promise<boolean>;
    removeOrganization: (id: string) => Promise<boolean>;
    // Product Management
    addProduct: (data: CreateProductDtoShort) => Promise<boolean>;
    updateProduct: (id: string, data: UpdateProductDtoShort) => Promise<boolean>;
    removeProduct: (id: string) => Promise<boolean>;
    addCategory: (data: CreateCategoryDto) => Promise<boolean>;
    updateCategory: (id: string, data: UpdateCategoryDto) => Promise<boolean>;
    removeCategory: (id: string) => Promise<boolean>;
    removeNotification: (id: number) => void;
    notify: (message: string, type?: 'success' | 'error' | 'info' | 'warning', role?: string) => void;
    register: (data: RegisterPayload) => Promise<boolean>;
    createQuote: (rfqId: string, quoteData: Partial<CreateQuoteDto>) => Promise<boolean>;
    createGRN: (data: CreateGrnDto) => Promise<boolean>;
    ackPO: (id: string) => Promise<boolean>;
    shipPO: (id: string) => Promise<boolean>;
    createInvoice: (data: CreateInvoiceDto) => Promise<boolean>;
    payInvoice: (id: string) => Promise<boolean>;
    matchInvoice: (id: string, status?: string) => Promise<boolean>;
    addQuoteRequest: (data: Partial<QuoteRequest>) => Promise<QuoteRequest | null>;
    updateQuoteRequest: (id: string, data: Partial<QuoteRequest>) => Promise<boolean>;
    submitQuoteRequest: (id: string) => Promise<boolean>;
    convertQuoteToPR: (id: string) => Promise<boolean>;
}


const ProcurementContext = createContext<ProcurementContextType | undefined>(undefined);

const INITIAL_STATE: ProcurementState = {
    currentUser: null,
    prs: [
        {
            id: "pr-1",
            prNumber: "PR-2026-001",
            title: "Dàn máy Server Dell R740 cho chi nhánh Miền Nam",
            status: PrStatus.PENDING_APPROVAL,
            priority: 1,
            createdAt: "2026-04-01T08:30:00Z",
            totalEstimate: 1200000000,
            requester: { id: "u-1", fullName: "Nguyễn Văn A", email: "admin@innhub.com" },
            department: "Phòng IT",
            items: [
                { id: "i-1", productName: "Server Dell R740", qty: 2, unit: "Cái", estimatedPrice: 600000000 }
            ]
        },
        {
            id: "pr-2",
            prNumber: "PR-2026-002",
            title: "Văn phòng phẩm quý 2/2026",
            status: PrStatus.APPROVED,
            priority: 2,
            createdAt: "2026-04-02T10:15:00Z",
            totalEstimate: 15000000,
            requester: { id: "u-1", fullName: "Nguyễn Văn A", email: "admin@innhub.com" },
            department: "Phòng Hành chính",
            items: [
                { id: "i-2", productName: "Giấy A4 Double A", qty: 100, unit: "Ram", estimatedPrice: 85000 },
                { id: "i-3", productName: "Mực in HP 85A", qty: 10, unit: "Hộp", estimatedPrice: 650000 }
            ]
        }
    ],
    myPrs: [],
    pos: [
        {
            id: "po-1",
            poNumber: "PO-2026-001",
            vendor: "Hanoi Hardware Hub",
            status: PoStatus.ISSUED,
            total: 1200000000,
            createdAt: "2026-04-02T14:00:00Z",
            items: [
                { id: "pi-1", description: "Server Dell R740", qty: 2, estimatedPrice: 600000000 }
            ]
        }
    ],
    rfqs: [
        {
            id: "rfq-1",
            prId: "pr-2",
            rfqNumber: "RFQ-2026-001",
            vendor: "Nhiều nhà cung cấp",
            status: RfqStatus.SENT,
            title: "Báo giá văn phòng phẩm Q2",
            dueDate: "2026-04-10T17:00:00Z",
            createdAt: "2026-04-03T09:00:00Z"
        }
    ],
    grns: [],
    invoices: [
        {
            id: "inv-1",
            invoiceNumber: "INV-889922",
            vendor: "Hanoi Hardware Hub",
            poId: "po-1",
            amount: 1200000000,
            status: InvoiceStatus.MATCHING,
            createdAt: "2026-04-03T11:00:00Z"
        }
    ],
    budgets: {
        allocated: 10000000000,
        committed: 2500000000,
        spent: 4500000000
    },
    users: [],
    departments: [
        { id: "dept-1", code: "IT", name: "Phòng IT", orgId: "org-1", isActive: true, createdAt: "", updatedAt: "", budgetAnnual: 1000000000, budgetUsed: 200000000 },
        { id: "dept-2", code: "HR", name: "Phòng Nhân sự", orgId: "org-1", isActive: true, createdAt: "", updatedAt: "", budgetAnnual: 500000000, budgetUsed: 100000000 }
    ],
    notifications: [],
    approvals: [
        { id: "wf-1", documentId: "pr-1", status: ApprovalStatus.PENDING, documentType: DocumentType.PURCHASE_REQUISITION }
    ],
    costCenters: [
        { id: "cc-1", code: "CC-IT-01", name: "Ngân sách hạ tầng IT", orgId: "org-1", budgetAnnual: 5000000000, budgetUsed: 1200000000, currency: CurrencyCode.VND, isActive: true, createdAt: "" }
    ],
    organizations: [
        { id: "org-1", code: "COMP_A", name: "Công ty Cổ phần Alpha", companyType: CompanyType.BUYER, isActive: true, createdAt: "", updatedAt: "", trustScore: 100, kycStatus: KycStatus.APPROVED, metadata: {}, countryCode: "VN" }
    ],
    budgetPeriods: [
        { id: "per-1", orgId: "org-1", fiscalYear: 2026, periodType: "QUARTER", periodNumber: 2, startDate: "2026-04-01", endDate: "2026-06-30", isActive: true }
    ],
    budgetAllocations: [
        { id: "alloc-1", budgetPeriodId: "per-1", costCenterId: "cc-1", orgId: "org-1", deptId: "dept-1", allocatedAmount: 1500000000, committedAmount: 200000000, spentAmount: 100000000, currency: "VND" }
    ],
    quotes: [],
    products: [
        { id: "prod-1", name: "Server Dell PowerEdge R740", sku: "DELL-R740", unitPriceRef: 600000000, unit: "Cái", currency: CurrencyCode.VND, isActive: true, createdAt: "", updatedAt: "", attributes: {} }
    ],
    categories: [
        { id: "cat-1", code: "HW", name: "Hardware", isActive: true, createdAt: "", updatedAt: "" }
    ],
    fiscalYears: [2024, 2025, 2026],
    token: null,
    loadingMyPrs: false,
    currentPrDetail: null,
    quoteRequests: [
        {
            id: "qr-1",
            qrNumber: "QR-2026-001",
            title: "Yêu cầu báo giá thiết bị VPS",
            description: "Cần báo giá cho 5 cụm máy chủ VPS mới",
            status: QuoteRequestStatus.COMPLETED,
            createdAt: "2026-04-01T09:00:00Z",
            items: [
                { id: "qri-1", productName: "VPS Node High Performance", description: "64GB RAM, 16 vCPU", qty: 5, unit: "Cụm", unitPrice: 45000000, supplierName: "Azure VN" }
            ]
        },
        {
            id: "qr-2",
            qrNumber: "QR-2026-002",
            title: "Báo giá văn phòng phẩm tháng 5",
            description: "Dự kiến cho các phòng ban HCM",
            status: QuoteRequestStatus.PROCESSING,
            createdAt: "2026-04-03T14:00:00Z",
            items: [
                { id: "qri-2", productName: "Giấy A4", description: "Bãi Bằng", qty: 200, unit: "Ram" }
            ]
        }
    ]
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

        // API DETACHED: Simulated loading to maintain UI feel
        setState(prev => ({ ...prev, loadingMyPrs: true }));
        setTimeout(() => {
            setState(prev => ({ ...prev, loadingMyPrs: false }));
        }, 500);
        
        console.log("Mock Mode: API requests bypassed in refreshData (except Login)");
    }, []);


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
        // KEEPING LOGIN API AS REQUESTED
        const res = await apiFetch('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ email, password: password || "password123" } as LoginPayload)
        });
        if (res.ok) {
            const responseData: ApiResponse<LoginResponse> = await res.json();
            const data = responseData.data;
            if (data.accessToken) {
                Cookies.set('accessToken', data.accessToken, { expires: 7, sameSite: 'Strict' });
            }
            const loggedUser = data.user as unknown as User;
            setState(prev => ({ ...prev, currentUser: loggedUser }));
            notify(`Đăng nhập thành công, chào mừng ${loggedUser.fullName || loggedUser.name || 'bạn'}`, "success");
            // No full refreshData from API, but we keep the flow
            void refreshData();
            return true;
        } else {
            notify("Đăng nhập thất bại. Tài khoản có thể chưa tồn tại hoặc sai thông tin.", "error");
            return false;
        }
    }, [apiFetch, notify, refreshData]);


    const logout = useCallback(async () => {
        Cookies.remove('accessToken');
        setState(prev => ({ ...prev, currentUser: null }));
    }, []);

    const register = useCallback(async (data: RegisterPayload) => {
        notify("Đăng ký thành công! (Mock)", "success");
        return true;
    }, [notify]);


    const addPR = useCallback(async (data: CreatePrDto) => {
        // API DETACHED: Local State Update
        const id = `mock-pr-${Date.now()}`;
        const totalEstimate = data.items.reduce((sum, item) => sum + (item.qty * item.estimatedPrice), 0);
        
        const newPR: PR = {
            id,
            prNumber: `PR-2026-${Math.floor(Math.random() * 900) + 100}`,
            title: data.title,
            description: data.description,
            justification: data.justification,
            status: PrStatus.DRAFT,
            priority: data.priority || 2,
            createdAt: new Date().toISOString(),
            totalEstimate,
            // @ts-ignore
            items: data.items.map((it, idx) => ({ 
                id: `item-${idx}`, 
                productName: it.productDesc || it.sku, 
                qty: it.qty, 
                unit: it.unit, 
                estimatedPrice: it.estimatedPrice 
            })),
            requester: { id: state.currentUser?.id || "u-1", fullName: state.currentUser?.fullName || "User", email: state.currentUser?.email || "" }
        };

        setState(prev => ({ 
            ...prev, 
            prs: [newPR, ...prev.prs],
            myPrs: [newPR, ...prev.myPrs]
        }));
        
        notify("Đã tạo PR thành công (Mock)", "success");
        return newPR;
    }, [state.currentUser, notify]);



    const submitPR = useCallback(async (id: string) => {
        // API DETACHED: Local State Update
        setState(prev => ({
            ...prev,
            prs: prev.prs.map(p => p.id === id ? { ...p, status: PrStatus.PENDING_APPROVAL } : p)
        }));
        notify("Đã gửi PR phê duyệt (Mock)", "success");
        return true;
    }, [notify]);


    const updatePR = useCallback(async (id: string, data: UpdatePrDto) => {
        setState(prev => ({
            ...prev,
            prs: prev.prs.map(p => p.id === id ? { ...p, ...data } : p)
        }));
        notify("Cập nhật PR thành công (Mock)", "success");
        return true;
    }, [notify]);


    const fetchPrDetail = useCallback(async (id: string) => {
        return state.prs.find(p => p.id === id) || null;
    }, [state.prs]);


    const approvePR = useCallback(async (id: string) => {
        setState(prev => ({
            ...prev,
            prs: prev.prs.map(p => p.id === id ? { ...p, status: PrStatus.APPROVED } : p)
        }));
        notify("Đã duyệt PR (Mock)", "success");
        return true;
    }, [notify]);


    const createPOFromPR = useCallback(async (prId: string, supplierId: string) => {
        const pr = state.prs.find(p => p.id === prId);
        const newPO: PO = {
            id: `po-${Date.now()}`,
            poNumber: `PO-2026-${Math.floor(Math.random() * 900) + 100}`,
            vendor: supplierId,
            status: PoStatus.ISSUED,
            total: pr?.totalEstimate || 0,
            createdAt: new Date().toISOString(),
            items: pr?.items?.map(it => ({ id: it.id!, description: it.productName!, qty: it.qty!, estimatedPrice: it.estimatedPrice })) || []
        };
        setState(prev => ({
            ...prev,
            pos: [newPO, ...prev.pos],
            prs: prev.prs.map(p => p.id === prId ? { ...p, status: PrStatus.PO_CREATED } : p)
        }));
        notify("Đã tạo PO thành công (Mock)", "success");
        return true;
    }, [state.prs, notify]);


    const createRFQ = useCallback(async (data: CreateRfqDto) => {
        const newRFQ: RFQ = {
            id: `rfq-${Date.now()}`,
            prId: data.prId,
            rfqNumber: `RFQ-2026-${Math.floor(Math.random() * 900) + 100}`,
            vendor: "Đang chờ báo giá",
            status: RfqStatus.SENT,
            title: `RFQ cho PR ${data.prId}`,
            createdAt: new Date().toISOString()
        };
        setState(prev => ({
            ...prev,
            rfqs: [newRFQ, ...prev.rfqs],
            prs: prev.prs.map(p => p.id === data.prId ? { ...p, status: PrStatus.IN_SOURCING } : p)
        }));
        notify("Đã tạo RFQ (Mock)", "success");
        return true;
    }, [notify]);


    const awardQuotation = useCallback(async (rfqId: string, quotationId: string) => {
        setState(prev => ({
            ...prev,
            rfqs: prev.rfqs.map(r => r.id === rfqId ? { ...r, status: RfqStatus.AWARDED } : r)
        }));
        notify("Đã trao thầu thành công (Mock)", "success");
        return true;
    }, [notify]);

    const createRFQConsolidated = useCallback(async (data: ConsolidateRfqDto) => {
        const id = `mock-rfq-${Date.now()}`;
        const newRFQ: RFQ = {
            id,
            prId: data.prIds[0],
            rfqNumber: `RFQ-2026-${Math.floor(Math.random() * 900) + 100}`,
            vendor: "Nhiều nhà cung cấp",
            status: RfqStatus.SENT,
            title: data.title,
            createdAt: new Date().toISOString()
        };
        setState(prev => ({
            ...prev,
            rfqs: [newRFQ, ...prev.rfqs],
            prs: prev.prs.map(p => data.prIds.includes(p.id) ? { ...p, status: PrStatus.IN_SOURCING } : p)
        }));
        notify("Đã hợp nhất và tạo RFQ thành công (Mock)", "success");
        return id;
    }, [notify]);


    const actionApproval = useCallback(async (workflowId: string, action: string, comment?: string) => {
        // API DETACHED: Local Local State Update
        const approval = state.approvals.find(a => a.id === workflowId);
        if (!approval) return false;

        const newStatus = action === 'APPROVE' ? PrStatus.APPROVED : PrStatus.REJECTED;

        setState(prev => ({
            ...prev,
            approvals: prev.approvals.filter(a => a.id !== workflowId),
            prs: prev.prs.map(p => p.id === approval.documentId ? { ...p, status: newStatus } : p)
        }));
        notify(`${action === 'APPROVE' ? 'Đã phê duyệt' : 'Đã từ chối'} thành công (Mock)`, "success");
        return true;
    }, [state.approvals, notify]);

    const createGRN = useCallback(async (data: CreateGrnDto) => {
        const newGRN: GRN = {
            id: `grn-${Date.now()}`,
            grnNumber: `GRN-2026-${Math.floor(Math.random() * 900) + 100}`,
            poId: data.poId,
            receivedItems: {},
            createdAt: new Date().toISOString()
        };
        setState(prev => ({
            ...prev,
            grns: [newGRN, ...prev.grns],
            pos: prev.pos.map(p => p.id === data.poId ? { ...p, status: PoStatus.COMPLETED } : p)
        }));
        notify("Đã nhập kho (Mock)", "success");
        return true;
    }, [notify]);


    const createInvoice = useCallback(async (data: CreateInvoiceDto) => {
        const newInv: Invoice = {
            id: `inv-${Date.now()}`,
            invoiceNumber: data.invoiceNumber,
            vendor: "Nhà cung cấp",
            poId: data.poId,
            amount: 0, 
            status: InvoiceStatus.MATCHING,
            createdAt: new Date().toISOString()
        };
        setState(prev => ({
            ...prev,
            invoices: [newInv, ...prev.invoices]
        }));
        notify("Đã tạo hóa đơn (Mock)", "success");
        return true;
    }, [notify]);

    const payInvoice = useCallback(async (id: string) => {
        setState(prev => ({
            ...prev,
            invoices: prev.invoices.map(inv => inv.id === id ? { ...inv, status: InvoiceStatus.PAID } : inv)
        }));
        notify("Đã xác nhận thanh toán (Mock)", "success");
        return true;
    }, [notify]);


    const addDept = useCallback(async (data: CreateDepartmentPayload) => {
        const newDept: Department = {
            ...data,
            id: `mock-dept-${Date.now()}`,
            budgetUsed: 0,
            isActive: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        setState(prev => ({ ...prev, departments: [...prev.departments, newDept] }));
        notify("Đã thêm phòng ban (Mock)", "success");
        return true;
    }, [notify]);

    const updateDept = useCallback(async (id: string, data: UpdateDepartmentPayload) => {
        setState(prev => ({
            ...prev,
            departments: prev.departments.map(d => d.id === id ? { ...d, ...data } : d)
        }));
        notify("Đã cập nhật phòng ban (Mock)", "success");
        return true;
    }, [notify]);

    const removeDept = useCallback(async (id: string) => {
        setState(prev => ({
            ...prev,
            departments: prev.departments.filter(d => d.id !== id)
        }));
        notify("Đã xóa phòng ban (Mock)", "success");
        return true;
    }, [notify]);


    const addUser = useCallback(async (data: Partial<User>) => {
        const newUser: User = {
            id: `mock-u-${Date.now()}`,
            email: data.email || "",
            role: data.role || UserRole.REQUESTER,
            fullName: data.fullName || data.name || "New User",
            isActive: true
        };
        setState(prev => ({ ...prev, users: [...prev.users, newUser] }));
        notify("Đã thêm người dùng (Mock)", "success");
        return true;
    }, [notify]);

    const updateUser = useCallback(async (id: string, data: Partial<User>) => {
        setState(prev => ({
            ...prev,
            users: prev.users.map(u => u.id === id ? { ...u, ...data } : u)
        }));
        notify("Đã cập nhật người dùng (Mock)", "success");
        return true;
    }, [notify]);


    const addBudgetPeriod = useCallback(async (data: Partial<BudgetPeriod>) => {
        const newPeriod: BudgetPeriod = {
            id: `mock-per-${Date.now()}`,
            orgId: data.orgId || "org-1",
            fiscalYear: data.fiscalYear || 2026,
            periodType: data.periodType || "QUARTER",
            periodNumber: data.periodNumber || 1,
            startDate: data.startDate || "",
            endDate: data.endDate || "",
            isActive: true
        };
        setState(prev => ({ ...prev, budgetPeriods: [...prev.budgetPeriods, newPeriod] }));
        notify("Đã tạo kỳ ngân sách (Mock)", "success");
        return true;
    }, [notify]);

    const updateBudgetPeriod = useCallback(async (id: string, data: Partial<BudgetPeriod>) => {
        setState(prev => ({
            ...prev,
            budgetPeriods: prev.budgetPeriods.map(p => p.id === id ? { ...p, ...data } : p)
        }));
        notify("Đã cập nhật kỳ ngân sách (Mock)", "success");
        return true;
    }, [notify]);

    const removeBudgetPeriod = useCallback(async (id: string) => {
        setState(prev => ({
            ...prev,
            budgetPeriods: prev.budgetPeriods.filter(p => p.id !== id)
        }));
        notify("Đã xóa kỳ ngân sách (Mock)", "success");
        return true;
    }, [notify]);

    const addBudgetAllocation = useCallback(async (data: Partial<BudgetAllocation>) => {
        const newAlloc: BudgetAllocation = {
            id: `mock-alloc-${Date.now()}`,
            budgetPeriodId: data.budgetPeriodId || "",
            costCenterId: data.costCenterId || "",
            orgId: data.orgId || "org-1",
            deptId: data.deptId,
            allocatedAmount: data.allocatedAmount || 0,
            committedAmount: 0,
            spentAmount: 0,
            currency: data.currency || "VND"
        };
        setState(prev => ({ ...prev, budgetAllocations: [...prev.budgetAllocations, newAlloc] }));
        notify("Đã phân bổ ngân sách (Mock)", "success");
        return true;
    }, [notify]);

    const updateBudgetAllocation = useCallback(async (id: string, data: Partial<BudgetAllocation>) => {
        setState(prev => ({
            ...prev,
            budgetAllocations: prev.budgetAllocations.map(a => a.id === id ? { ...a, ...data } : a)
        }));
        notify("Đã cập nhật phân bổ (Mock)", "success");
        return true;
    }, [notify]);

    const removeBudgetAllocation = useCallback(async (id: string) => {
        setState(prev => ({
            ...prev,
            budgetAllocations: prev.budgetAllocations.filter(a => a.id !== id)
        }));
        notify("Đã xóa phân bổ (Mock)", "success");
        return true;
    }, [notify]);

    const addBudgetAllocationBundle = useCallback(async (data: { costCenterId: string, fiscalYear: number }) => {
        notify("Đã phân bổ ngân sách năm (Mock)", "success");
        return true;
    }, [notify]);

    const reconcileQuarter = useCallback(async (costCenterId: string, fiscalYear: number, quarter: number) => {
        notify("Đã đối soát quý (Mock)", "success");
        return true;
    }, [notify]);

    const addCostCenter = useCallback(async (data: CreateCostCenterPayload) => {
        const newCC: CostCenter = {
            ...data,
            id: `mock-cc-${Date.now()}`,
            budgetUsed: 0,
            isActive: true,
            createdAt: new Date().toISOString()
        };
        setState(prev => ({ ...prev, costCenters: [...prev.costCenters, newCC] }));
        notify("Đã thêm Cost Center (Mock)", "success");
        return true;
    }, [notify]);

    const updateCostCenter = useCallback(async (id: string, data: UpdateCostCenterPayload) => {
        setState(prev => ({
            ...prev,
            costCenters: prev.costCenters.map(cc => cc.id === id ? { ...cc, ...data } : cc)
        }));
        notify("Đã cập nhật Cost Center (Mock)", "success");
        return true;
    }, [notify]);

    const removeCostCenter = useCallback(async (id: string) => {
        setState(prev => ({
            ...prev,
            costCenters: prev.costCenters.filter(cc => cc.id !== id)
        }));
        notify("Đã xóa Cost Center (Mock)", "success");
        return true;
    }, [notify]);

    const fetchCostCenter = useCallback(async (id: string) => {
        return state.costCenters.find(cc => cc.id === id) || null;
    }, [state.costCenters]);

    const fetchQuarterlyBudget = useCallback(async (costCenterId: string, fiscalYear: number, quarter: number) => {
        const alloc = state.budgetAllocations.find(a => a.costCenterId === costCenterId);
        return alloc ? { data: alloc } : null;
    }, [state.budgetAllocations]);


    const addOrganization = useCallback(async (data: CreateOrganizationPayload) => {
        const newOrg: Organization = {
            ...data,
            id: `mock-org-${Date.now()}`,
            isActive: true,
            kycStatus: KycStatus.APPROVED,
            trustScore: 100,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        setState(prev => ({ ...prev, organizations: [...prev.organizations, newOrg] }));
        notify("Đã thêm tổ chức (Mock)", "success");
        return true;
    }, [notify]);

    const updateOrganization = useCallback(async (id: string, data: UpdateOrganizationPayload) => {
        setState(prev => ({
            ...prev,
            organizations: prev.organizations.map(o => o.id === id ? { ...o, ...data } : o)
        }));
        notify("Đã cập nhật tổ chức (Mock)", "success");
        return true;
    }, [notify]);

    const removeOrganization = useCallback(async (id: string) => {
        setState(prev => ({
            ...prev,
            organizations: prev.organizations.filter(o => o.id !== id)
        }));
        notify("Đã xóa tổ chức (Mock)", "success");
        return true;
    }, [notify]);

    const createQuote = useCallback(async (rfqId: string, quoteData: Partial<CreateQuoteDto>) => {
        const newQuote: Quote = {
            id: `mock-quote-${Date.now()}`,
            rfqId,
            supplierId: quoteData.supplierId || "s-1",
            totalPrice: quoteData.totalPrice || 0,
            leadTimeDays: quoteData.leadTimeDays || 7,
            status: QuotationStatus.SUBMITTED,
            createdAt: new Date().toISOString()
        };
        setState(prev => ({ ...prev, quotes: [...prev.quotes, newQuote] }));
        notify("Đã gửi báo giá (Mock)", "success");
        return true;
    }, [notify]);

    const matchInvoice = useCallback(async (id: string) => {
        setState(prev => ({
            ...prev,
            invoices: prev.invoices.map(inv => inv.id === id ? { ...inv, status: InvoiceStatus.AUTO_APPROVED } : inv)
        }));
        notify("Đã chạy đối soát (Mock)", "info");
        return true;
    }, [notify]);

    const ackPO = useCallback(async (id: string) => {
        setState(prev => ({
            ...prev,
            pos: prev.pos.map(p => p.id === id ? { ...p, status: PoStatus.ACKNOWLEDGED } : p)
        }));
        notify("Đã xác nhận đơn đặt hàng (Mock)", "success");
        return true;
    }, [notify]);

    const shipPO = useCallback(async (id: string) => {
        setState(prev => ({
            ...prev,
            pos: prev.pos.map(p => p.id === id ? { ...p, status: PoStatus.SHIPPED } : p)
        }));
        notify("Đã giao hàng (Mock)", "success");
        return true;
    }, [notify]);

    // Product Management APIs
    const addProduct = useCallback(async (data: CreateProductDtoShort) => {
        const newProd: Product = {
            ...data,
            id: `mock-prod-${Date.now()}`,
            isActive: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        setState(prev => ({ ...prev, products: [...prev.products, newProd] }));
        notify("Đã thêm sản phẩm (Mock)", "success");
        return true;
    }, [notify]);

    const updateProduct = useCallback(async (id: string, data: UpdateProductDtoShort) => {
        setState(prev => ({
            ...prev,
            products: prev.products.map(p => p.id === id ? { ...p, ...data } : p)
        }));
        notify("Đã cập nhật sản phẩm (Mock)", "success");
        return true;
    }, [notify]);

    const removeProduct = useCallback(async (id: string) => {
        setState(prev => ({
            ...prev,
            products: prev.products.filter(p => p.id !== id)
        }));
        notify("Đã xóa sản phẩm (Mock)", "success");
        return true;
    }, [notify]);

    const addCategory = useCallback(async (data: CreateCategoryDto) => {
        const newCat: ProductCategory = {
            ...data,
            id: `mock-cat-${Date.now()}`,
            isActive: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        setState(prev => ({ ...prev, categories: [...prev.categories, newCat] }));
        notify("Đã thêm danh mục (Mock)", "success");
        return true;
    }, [notify]);

    const updateCategory = useCallback(async (id: string, data: UpdateCategoryDto) => {
        setState(prev => ({
            ...prev,
            categories: prev.categories.map(c => c.id === id ? { ...c, ...data } : c)
        }));
        notify("Đã cập nhật danh mục (Mock)", "success");
        return true;
    }, [notify]);

    const removeCategory = useCallback(async (id: string) => {
        setState(prev => ({
            ...prev,
            categories: prev.categories.filter(c => c.id !== id)
        }));
        notify("Đã xóa danh mục (Mock)", "success");
        return true;
    }, [notify]);


    const addQuoteRequest = useCallback(async (data: Partial<QuoteRequest>) => {
        const id = `qr-${Date.now()}`;
        const newQR: QuoteRequest = {
            id,
            qrNumber: `QR-2026-${Math.floor(Math.random() * 900) + 100}`,
            title: data.title || "Yêu cầu báo giá mới",
            description: data.description || "",
            status: QuoteRequestStatus.DRAFT,
            createdAt: new Date().toISOString(),
            items: data.items || []
        };
        setState(prev => ({ ...prev, quoteRequests: [newQR, ...prev.quoteRequests] }));
        notify("Đã tạo yêu cầu báo giá nháp", "success");
        return newQR;
    }, [notify]);

    const updateQuoteRequest = useCallback(async (id: string, data: Partial<QuoteRequest>) => {
        setState(prev => ({
            ...prev,
            quoteRequests: prev.quoteRequests.map(q => q.id === id ? { ...q, ...data } : q)
        }));
        notify("Đã cập nhật yêu cầu báo giá", "success");
        return true;
    }, [notify]);

    const submitQuoteRequest = useCallback(async (id: string) => {
        setState(prev => ({
            ...prev,
            quoteRequests: prev.quoteRequests.map(q => q.id === id ? { ...q, status: QuoteRequestStatus.SUBMITTED } : q)
        }));
        notify("Đã gửi yêu cầu báo giá tới bộ phận Thu mua", "success");
        return true;
    }, [notify]);

    const convertQuoteToPR = useCallback(async (qrId: string) => {
        const qr = state.quoteRequests.find(q => q.id === qrId);
        if (!qr) return false;
        
        const newPRData: CreatePrDto = {
            title: `PR từ Báo giá ${qr.qrNumber}: ${qr.title}`,
            description: qr.description,
            justification: "Đã có báo giá từ Thu mua",
            priority: 2,
            items: qr.items.map(it => ({
                productDesc: it.productName,
                qty: it.qty,
                unit: it.unit,
                estimatedPrice: it.unitPrice || 0,
                sku: it.productName
            }))
        };
        
        const createdPR = await addPR(newPRData);
        if (createdPR) {
            notify("Đã chuyển đổi Báo giá sang PR thành công", "success");
            // Mark QR as converted if needed or just leave as Completed
            return true;
        }
        return false;
    }, [state.quoteRequests, addPR, notify]);

    const contextValue = useMemo(() => ({

        ...state,
        login, logout, refreshData, apiFetch,
        addPR, submitPR, updatePR, fetchPrDetail, approvePR,
        createPOFromPR, createRFQ, awardQuotation, createRFQConsolidated,
        actionApproval, addDept, updateDept, removeDept,
        addUser, updateUser, addBudgetPeriod, updateBudgetPeriod, removeBudgetPeriod,
        addBudgetAllocation, updateBudgetAllocation, removeBudgetAllocation,
        addBudgetAllocationBundle, reconcileQuarter,
        createGRN, ackPO, shipPO, createInvoice, payInvoice, matchInvoice,
        addCostCenter, updateCostCenter, removeCostCenter, fetchCostCenter, fetchQuarterlyBudget,
        addOrganization, updateOrganization, removeOrganization,
        addProduct, updateProduct, removeProduct, addCategory, updateCategory, removeCategory,
        removeNotification, notify, register, createQuote,
        addQuoteRequest, updateQuoteRequest, submitQuoteRequest, convertQuoteToPR
    }), [state, login, logout, refreshData, apiFetch, addPR, submitPR, updatePR, fetchPrDetail, approvePR, createPOFromPR, createRFQ, awardQuotation, createRFQConsolidated, actionApproval, addDept, updateDept, removeDept, addUser, updateUser, addBudgetPeriod, updateBudgetPeriod, removeBudgetPeriod, addBudgetAllocation, updateBudgetAllocation, removeBudgetAllocation, addBudgetAllocationBundle, reconcileQuarter, createGRN, ackPO, shipPO, createInvoice, payInvoice, matchInvoice, addCostCenter, updateCostCenter, removeCostCenter, fetchCostCenter, fetchQuarterlyBudget, addOrganization, updateOrganization, removeOrganization, addProduct, updateProduct, removeProduct, addCategory, updateCategory, removeCategory, removeNotification, notify, register, createQuote, addQuoteRequest, updateQuoteRequest, submitQuoteRequest, convertQuoteToPR]);


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
