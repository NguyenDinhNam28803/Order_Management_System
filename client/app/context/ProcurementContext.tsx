"use client";

import React, { createContext, useContext, useState, useCallback, ReactNode, useMemo, useEffect } from "react";
import Cookies from 'js-cookie';
import { 
    Organization, 
    CostCenter, 
    CreateOrganizationPayload, 
    UpdateOrganizationPayload,
    CreateCostCenterPayload,
    UpdateCostCenterPayload 
} from "../types/api-types";

export interface User {
    id: string;
    name?: string;
    email: string;
    role: string;
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

export interface Supplier {
    id: string;
    name: string;
    code: string;
    category: string;
    status: 'ACTIVE' | 'INACTIVE';
    rating: number;
    email: string;
    phone: string;
    website?: string;
}

export interface PRItem {
    id: string;
    productId?: string;
    description?: string;
    item_name?: string;
    item_code?: string;
    qty?: number;
    quantity?: number;
    unit?: string;
    estimatedPrice: number;
}

export interface PR {
    id: string;
    prNumber?: string;
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
    id: string;
    description: string;
    qty: number;
    estimatedPrice: number;
}

export interface PO {
    id: string;
    vendor: string;
    items: POItem[];
    status: string;
    total: number;
    createdAt?: string;
}

export interface RFQ {
    id: string;
    prId: string;
    vendor: string;
    status: string;
    title?: string;
    dueDate?: string;
    createdAt?: string;
    items?: PRItem[];
    attachments?: { name: string, url: string }[];
    messages?: { sender: string, senderRole: string, text: string, timestamp: string }[];
}

export interface GRN {
    id: string;
    poId: string;
    receivedItems: Record<string, number>;
    createdAt: string;
}

export interface Invoice {
    id: string;
    vendor: string;
    poId: string;
    amount: number;
    status: "PENDING" | "EXCEPTION" | "APPROVED";
    createdAt: string;
}

export interface Department {
    id: string;
    name: string;
    code: string;
    costCenterCode?: string;
    orgId?: string;
    headUserId?: string;
    head?: { fullName: string };
    organization?: { name: string };
    _count?: { users: number };
}

// Imported from api-types

// Imported from api-types

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

export interface ProductCategory {
    id: string;
    code: string;
    name: string;
    description?: string;
}

export interface Product {
    id: string;
    name: string;
    sku: string;
    unitPriceRef: number;
    unit: string;
    description?: string;
    categoryId?: string;
    category?: ProductCategory;
    isActive?: boolean;
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

export interface ApprovalWorkflow {
    id: string;
    documentId: string;
    status: string;
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
}

interface ProcurementContextType extends ProcurementState {
    login: (email: string, password?: string) => Promise<boolean>;
    logout: () => Promise<void>;
    refreshData: () => Promise<void>;
    apiFetch: (url: string, options?: RequestInit) => Promise<Response>;
    addPR: (data: Partial<PR>) => Promise<string>;
    approvePR: (id: string) => Promise<boolean>;
    createRFQ: (prId: string, vendor: string) => Promise<boolean>;
    createRFQConsolidated: (data: { title: string, vendor: string, items: PRItem[], prIds: string[], dueDate: string, attachments?: { name: string, url: string }[] }) => Promise<string>;
    actionApproval: (workflowId: string, action: string, memo?: string) => Promise<boolean>;
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
    addBudgetAllocationBundle?: (data: { 
        deptId: string, 
        fiscalYear: number, 
        totalBudget: number, 
        splits: { q1: number, q2: number, q3: number, q4: number, reserve: number } 
    }) => Promise<boolean>;
    addCostCenter: (data: Partial<CostCenter>) => Promise<boolean>;
    updateCostCenter: (id: string, data: Partial<CostCenter>) => Promise<boolean>;
    removeCostCenter: (id: string) => Promise<boolean>;
    addOrganization: (data: Partial<Organization>) => Promise<boolean>;
    updateOrganization: (id: string, data: Partial<Organization>) => Promise<boolean>;
    removeOrganization: (id: string) => Promise<boolean>;
    notify: (message: string, type?: 'success' | 'error' | 'info' | 'warning', role?: string) => void;
    register: (data: Partial<User> & { password?: string }) => Promise<boolean>;
    createQuote: (rfqId: string, quoteData: Partial<Quote>) => Promise<boolean>;
    createGRN: (data: { poId: string, receivedItems: Record<string, number> }) => Promise<boolean>;
    ackPO: (id: string) => Promise<boolean>;
    shipPO: (id: string) => Promise<boolean>;
    createInvoice: (data: { poId: string, vendor: string, amount: number }) => Promise<boolean>;
    payInvoice: (id: string) => Promise<boolean>;
    matchInvoice: (id: string, status?: string) => Promise<boolean>;
}

const ProcurementContext = createContext<ProcurementContextType | undefined>(undefined);

const DEMO_USERS = [
    {
        id: "cad22cfb-eb16-4a5f-a964-664ba63e5f7e",
        email: "admin@innhub.com",
        fullName: "System Admin",
        role: "PLATFORM_ADMIN",
        icon: "AD"
    },
    {
        id: "053b45d6-63f9-4735-a9c8-65304623fb50",
        email: "it.manager@innhub.com",
        fullName: "IT Manager",
        role: "DEPT_APPROVER",
        icon: "MG",
        deptId: "dept-it"
    },
    {
        id: "732d8c3b-9a7c-4e8a-8b2c-1d9e2f3a4b5c",
        email: "proc.officer@innhub.com",
        fullName: "Procurement Officer",
        role: "PROCUREMENT",
        icon: "PO"
    },
    {
        id: "1639d675-5853-455b-9bb9-6f91605f6db0",
        email: "director@innhub.com",
        fullName: "Director",
        role: "DIRECTOR",
        icon: "DR"
    },
    {
        id: "b4c2d3e4-f5a6-4b7c-8d9e-0f1a2b3c4d5e",
        email: "ceo@innhub.com",
        fullName: "Board CEO",
        role: "CEO",
        icon: "CE"
    },
    {
        id: "d4b1a2b3-c4d5-4e6f-8a9b-0c1d2e3f4a5b",
        email: "it.requester@innhub.com",
        fullName: "IT Staff 01",
        role: "REQUESTER",
        icon: "RQ",
        deptId: "dept-it"
    },
    {
        id: "f3a2b1c0-d4e5-4f6a-8b9c-0d1e2f3a4b5c",
        email: "finance.staff@innhub.com",
        fullName: "Finance Manager",
        role: "FINANCE",
        icon: "FN",
        deptId: "dept-fn"
    },
    {
        id: "s1-hanoi-hardware",
        email: "sales@hanoihardware.vn",
        fullName: "Hanoi Hardware",
        role: "SUPPLIER",
        icon: "HW"
    },
    {
        id: "fpt-requester",
        email: "fpt.requester@fpt.com",
        fullName: "FPT Requester",
        role: "REQUESTER",
        icon: "FR"
    },
    {
        id: "fpt-manager",
        email: "fpt.manager@fpt.com",
        fullName: "FPT Manager",
        role: "DEPT_APPROVER",
        icon: "FM"
    },
    {
        id: "fpt-director",
        email: "fpt.director@fpt.com",
        fullName: "FPT Director",
        role: "DIRECTOR",
        icon: "FD"
    },
    {
        id: "fpt-ceo",
        email: "fpt.ceo@fpt.com",
        fullName: "FPT CEO",
        role: "CEO",
        icon: "FC"
    }
];

const INITIAL_STATE: ProcurementState = {
    currentUser: null,
    prs: [
        {
            id: "pr-001",
            prNumber: "PR-2026-0001",
            title: "Mua sắm thiết bị IT tháng 3",
            status: "PENDING_APPROVAL",
            totalEstimate: 125000000,
            createdAt: new Date().toISOString(),
            requester: { id: "user-1", fullName: "Nguyễn Văn A", email: "it.requester@innhub.com", role: "REQUESTER" },
            costCenter: { code: "CC_IT_OPS", name: "IT Operations Cost" },
            department: "IT Operations",
            items: [
                { id: "i1", productId: "p1", item_name: "Laptop Dell Latitude", item_code: "DELL-LAT-5420", quantity: 4, unit: "PCS", estimatedPrice: 25000000 },
                { id: "i2", productId: "p4", item_name: "Bàn phím cơ Keychron K2", item_code: "KEY-K2-V2", quantity: 5, unit: "SET", estimatedPrice: 2000000 },
                { id: "i3", productId: "p2", item_name: "Chuột không dây Logitech", item_code: "LOGI-M331", quantity: 5, unit: "UNIT", estimatedPrice: 350000 }
            ]
        },
        {
            id: "pr-002",
            prNumber: "PR-2026-0002",
            title: "Văn phòng phẩm quý 1",
            status: "APPROVED",
            totalEstimate: 15000000,
            createdAt: new Date(Date.now() - 86400000).toISOString(),
            requester: { id: "user-2", fullName: "Trần Thị B", email: "finance.staff@innhub.com", role: "FINANCE" },
            costCenter: { code: "CC_FN_GEN", name: "General Administration" },
            department: "Finance & Accounting",
            items: [
                { id: "i4", description: "Giấy A4 Double A", qty: 50, unit: "REAMS", estimatedPrice: 85000 },
                { id: "i5", description: "Bút bi Thiên Long", qty: 10, unit: "BOXES", estimatedPrice: 120000 }
            ]
        },
        {
            id: "pr-006",
            prNumber: "PR-2026-0006",
            title: "Mua chuột & Phụ kiện",
            status: "APPROVED",
            totalEstimate: 45000000,
            createdAt: new Date(Date.now() - 3600000).toISOString(),
            requester: { id: "user-1", fullName: "IT Staff 01", email: "it.requester@innhub.com", role: "REQUESTER" },
            costCenter: { code: "CC_IT_OPS", name: "IT Operations Cost" },
            department: "IT Operations",
            items: [
                { id: "i6", productId: "p8", item_name: "Chuột Logitech MX Master 3S - Màu Graphite", item_code: "MX3S-GRA", quantity: 5, unit: "PCS", estimatedPrice: 3500000 },
                { id: "i7", productId: "p9", item_name: "Lót chuột cơ Razer Goliathus Extended Chroma - Black", item_code: "RC21-01", quantity: 10, unit: "UNIT", estimatedPrice: 1200000 },
                { id: "i8", productId: "p10", item_name: "Bộ sạc pin dự phòng Anker PowerCore Essential 20000", item_code: "A1268", quantity: 3, unit: "UNIT", estimatedPrice: 1800000 }
            ],
            attachments: [
                { name: "Technical_Specs_MX3S.pdf", url: "#" },
                { name: "Compliance_Certificate.pdf", url: "#" }
            ]
        }
    ],
    myPrs: [],
    pos: [],
    rfqs: [
        {
            id: "rfq-hanoi-001",
            prId: "pr-006",
            vendor: "Hanoi Hardware",
            status: "SENT",
            title: "Yêu cầu báo giá Phụ kiện Peripheral",
            createdAt: new Date().toISOString(),
            dueDate: new Date(Date.now() + 86400000 * 3).toISOString(),
            items: [] // Will be populated from PR in the component
        }
    ],
    grns: [],
    invoices: [],
    budgets: null,
    users: DEMO_USERS,
    departments: [
        { id: "dept-it", name: "IT Operations", code: "IT_OPS", costCenterCode: "CC_IT_OPS" },
        { id: "dept-fn", name: "Finance & Accounting", code: "FIN_ACC", costCenterCode: "CC_FN_GEN" },
        { id: "dept-hr", name: "Human Resources", code: "HR_DEPT" }
    ],
    notifications: [],
    approvals: [],
    costCenters: [
        { id: "cc-it-1", name: "IT Operations Cost", code: "CC_IT_OPS", budgetAnnual: 1000000000, budgetUsed: 450000000, currency: "VND" as any, deptId: "dept-it", isActive: true, orgId: "org-1", createdAt: new Date().toISOString() },
        { id: "cc-it-2", name: "Digital Innovation", code: "CC_IT_DIG", budgetAnnual: 500000000, budgetUsed: 120000000, currency: "VND" as any, deptId: "dept-it", isActive: true, orgId: "org-1", createdAt: new Date().toISOString() },
        { id: "cc-fn-1", name: "General Administration", code: "CC_FN_GEN", budgetAnnual: 800000000, budgetUsed: 780000000, currency: "VND" as any, deptId: "dept-fn", isActive: true, orgId: "org-1", createdAt: new Date().toISOString() }
    ],
    organizations: [
        { 
            id: "org-1", name: "ProcurePro Global Corp", code: "PP-GLOBAL", address: "123 Business Ave, District 1, HCM", taxCode: "0123456789", 
            companyType: "BUYER" as any, countryCode: "VN", isActive: true, kycStatus: "APPROVED" as any, trustScore: 100, metadata: {}, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() 
        },
        { 
            id: "org-2", name: "Tech Solutions Asia", code: "TS-ASIA", address: "456 Innovation Park, District 7, HCM", taxCode: "9876543210",
            companyType: "BUYER" as any, countryCode: "VN", isActive: true, kycStatus: "APPROVED" as any, trustScore: 100, metadata: {}, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() 
        }
    ],
    budgetPeriods: [],
    budgetAllocations: [],
    quotes: [],
    products: [
        { id: "p1", name: "Laptop Dell Latitude", sku: "DELL-LAT-5420", unitPriceRef: 25000000, unit: "UNIT" },
        { id: "p2", name: "Chuột không dây Logitech", sku: "LOGI-M331", unitPriceRef: 350000, unit: "UNIT" },
        { id: "p3", name: "Màn hình Dell 24 inch", sku: "DELL-U2422H", unitPriceRef: 6500000, unit: "PCS" },
        { id: "p4", name: "Bàn phím cơ Keychron K2", sku: "KEY-K2-V2", unitPriceRef: 1850000, unit: "PCS" },
        { id: "p5", name: "Hệ thống Server Dell PowerEdge", sku: "DELL-PE-R750", unitPriceRef: 185000000, unit: "SET" },
        { id: "p6", name: "Core Switch Cisco Nexus", sku: "CISCO-NX-9300", unitPriceRef: 155000000, unit: "UNIT" },
        { id: "p7", name: "Hệ thống Lưu trữ SAN storage", sku: "HP-MSA-2060", unitPriceRef: 220000000, unit: "SET" },
        { id: "p8", name: "Chuột Logitech MX Master 3S - Màu Graphite", sku: "MX3S-GRA", unitPriceRef: 3500000, unit: "PCS" },
        { id: "p9", name: "Lót chuột cơ Razer Goliathus Extended Chroma - Black", sku: "RC21-01", unitPriceRef: 1200000, unit: "UNIT" },
        { id: "p10", name: "Bộ sạc pin dự phòng Anker PowerCore Essential 20000", sku: "A1268", unitPriceRef: 1800000, unit: "UNIT" },
    ],
    fiscalYears: [2024, 2025, 2026]
};

export function ProcurementProvider({ children }: { children: ReactNode }) {
    const [state, setState] = useState<ProcurementState>(INITIAL_STATE);

    useEffect(() => {
        const savedData = localStorage.getItem('erp_sim_state');
        if (savedData) {
            try {
                const parsed = JSON.parse(savedData);
                // eslint-disable-next-line react-hooks/set-state-in-effect
                setState(prev => ({
                    ...prev,
                    ...parsed,
                    // Force refresh users and products to include new additions
                    users: [
                        ...DEMO_USERS,
                        ...(parsed.users || []).filter((u: User) => !DEMO_USERS.find(du => du.email === u.email))
                    ],
                    products: [
                        ...INITIAL_STATE.products,
                        ...(parsed.products || []).filter((p: Product) => !INITIAL_STATE.products.find(ip => ip.id === p.id))
                    ],
                    currentUser: prev.currentUser
                }));
            } catch (e) { console.error(e); }
        }
    }, []);

    useEffect(() => {
        const { currentUser, myPrs, ...toSave } = state;
        localStorage.setItem('erp_sim_state', JSON.stringify(toSave));
    }, [state]);

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

    const addPR = useCallback((data: Partial<PR>) => {
        const nextId = state.prs.length + 1;
        const total = (data.items || []).reduce((s: number, i: PRItem) => s + (Number(i.qty || i.quantity) * Number(i.estimatedPrice)), 0);
        
        const status = "PENDING_APPROVAL";
        let targetApproverRole = "DEPT_APPROVER";
        const user = state.currentUser;
        
        if (user?.role === "DEPT_APPROVER") {
            if (total < 10000000) {
                targetApproverRole = "DEPT_APPROVER";
            } else {
                targetApproverRole = "DIRECTOR";
            }
        } else if (user?.role === "DIRECTOR") {
            targetApproverRole = "CEO";
        } else if (user?.role === "REQUESTER") {
            targetApproverRole = "DEPT_APPROVER";
        }

        const newPR = { 
            ...data, 
            id: `pr-${nextId}`,
            prNumber: `PR-2026-${String(nextId).padStart(4, '0')}`,
            status: status,
            targetApproverRole: targetApproverRole,
            createdAt: new Date().toISOString(),
            requester: user ? {
                id: user.id,
                fullName: user.fullName,
                name: user.name,
                role: user.role,
                email: user.email
            } : undefined,
            totalEstimate: total
        };

        setState(prev => ({ ...prev, prs: [newPR, ...prev.prs] }));
        return Promise.resolve(newPR.id);
    }, [state.prs, state.currentUser]);

    const createRFQ = useCallback((prId: string, vendor: string) => {
        const pr = state.prs.find(p => p.id === prId);
        const newRFQ: RFQ = {
            id: `rfq-${state.rfqs.length + 1}`,
            prId,
            vendor,
            status: "SENT",
            title: pr?.title ? `RFQ cho ${pr.title}` : "Yêu cầu báo giá mới",
            createdAt: new Date().toISOString(),
            dueDate: new Date(Date.now() + 86400000 * 7).toISOString(),
            items: pr?.items || []
        };
        setState(prev => {
            const updatedPrs = prev.prs.map(p => p.id === prId ? { ...p, status: "IN_SOURCING" } : p);
            return { ...prev, prs: updatedPrs, rfqs: [...prev.rfqs, newRFQ] };
        });
        notify("Có một yêu cầu báo giá mới cần được xử lí!", "info", "SUPPLIER");
        return Promise.resolve(true);
    }, [notify, state.prs, state.rfqs.length]);

    const createRFQConsolidated = useCallback((data: { title: string, vendor: string, items: PRItem[], prIds: string[], dueDate: string, attachments?: { name: string, url: string }[] }) => {
        const newRFQ: RFQ = {
            id: `rfq-${state.rfqs.length + 1}`,
            prId: data.prIds.join(","), // Legacy support
            vendor: data.vendor,
            status: "SENT",
            title: data.title || "Gói báo giá tổng hợp",
            createdAt: new Date().toISOString(),
            dueDate: data.dueDate || new Date(Date.now() + 86400000 * 7).toISOString(),
            items: data.items.map(i => ({
                id: i.id,
                productId: i.productId,
                item_name: i.item_name || i.description,
                item_code: i.item_code,
                quantity: i.quantity || i.qty,
                unit: i.unit,
                estimatedPrice: i.estimatedPrice
            })),
            attachments: data.attachments || [],
            messages: []
        };
        setState(prev => {
            const updatedPrs = prev.prs.map(p => data.prIds.includes(p.id) ? { ...p, status: "IN_SOURCING" } : p);
            return { ...prev, prs: updatedPrs, rfqs: [...prev.rfqs, newRFQ] };
        });
        notify(`Đã gửi RFQ ${newRFQ.id} tới nhà cung cấp ${data.vendor}`, "success");
        notify("Có một yêu cầu báo giá mới cần được xử lí!", "info", "SUPPLIER");
        return Promise.resolve(newRFQ.id);
    }, [notify, state.rfqs.length]);

    const createQuote = useCallback(async (rfqId: string, quoteData: Partial<Quote>) => {
        const newQuote: Quote = {
            id: `q-${state.quotes.length + 1}`,
            rfqId,
            supplierId: quoteData.supplierId || "",
            totalPrice: quoteData.totalPrice || 0,
            currency: quoteData.currency || "VND",
            leadTimeDays: quoteData.leadTimeDays || 7,
            status: "PENDING",
            createdAt: new Date().toISOString()
        };
        setState(prev => ({
            ...prev,
            quotes: [...prev.quotes, newQuote],
            rfqs: prev.rfqs.map(r => r.id === rfqId ? { ...r, status: "QUOTED" } : r)
        }));
        notify(`Nhà cung cấp đã gửi báo giá cho RFQ ${rfqId}!`, "success", "PROCUREMENT");
        notify(`Nhà cung cấp đã gửi báo giá cho RFQ ${rfqId}!`, "success", "PLATFORM_ADMIN");
        return true;
    }, [notify, state.quotes.length]);

    const apiFetch = useCallback(async (url: string, options: RequestInit = {}) => {
        // Special Mocks for this demo build
        if (url === '/procurement-requests' && options.method === 'POST') {
            const data = JSON.parse(options.body as string);
            const prId = await addPR(data);
            return { ok: true, status: 201, json: async () => ({ data: { id: prId } }) } as Response;
        }

        if (url === '/request-for-quotations' && options.method === 'POST') {
            const data = JSON.parse(options.body as string);
            await createRFQ(data.prId, data.vendor);
            return { ok: true, status: 201, json: async () => ({ data: { id: Date.now() } }) } as Response;
        }

        // Real API Calls 
        const token = Cookies.get('accessToken');
        const headers: HeadersInit = {
            'Content-Type': 'application/json',
            ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
            ...options.headers,
        };

        try {
            return await fetch(`http://localhost:5000${url}`, { ...options, credentials: 'include', headers });
        } catch (error) {
            console.error(`API Fetch Error (${url}):`, error);
            // Fallback for demo when backend is offline
            return { ok: true, status: 200, json: async () => ({ data: [] }) } as Response;
        }
    }, [addPR, createRFQ]);

    const refreshData = useCallback(async () => {
        const token = Cookies.get('accessToken');
        if (!token) return;

        // Fetch real data from backend
        const [ccRes, orgRes, deptRes] = await Promise.all([
            apiFetch('/cost-centers'),
            apiFetch('/organizations'),
            apiFetch('/departments')
        ]);

        const costCenters = ccRes.ok ? (await ccRes.json()).data : [];
        const organizations = orgRes.ok ? (await orgRes.json()).data : [];
        const departments = deptRes.ok ? (await deptRes.json()).data : [];

        setState(prev => ({
            ...prev,
            costCenters: Array.isArray(costCenters) ? costCenters : prev.costCenters,
            organizations: Array.isArray(organizations) ? organizations : prev.organizations,
            departments: Array.isArray(departments) ? departments : prev.departments,
            myPrs: prev.prs.filter(p => p.requester?.email === prev.currentUser?.email),
            approvals: prev.prs
                .filter(p => p.status === "PENDING_APPROVAL" && (p.targetApproverRole === prev.currentUser?.role || prev.currentUser?.role === "PLATFORM_ADMIN"))
                .map(p => ({
                    id: `wf-${p.id}`,
                    documentId: p.id,
                    status: "PENDING_APPROVAL"
                })),
        }));
    }, [apiFetch]);

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        refreshData();
    }, [state.currentUser]);

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
            return true;
        }
        notify("Thông tin đăng nhập không chính xác hoặc lỗi hệ thống", "error");
        return false;
    }, [apiFetch, notify]);

    const logout = useCallback(async () => {
        await apiFetch('/auth/logout', { method: 'POST' }).catch(() => {});
        Cookies.remove('accessToken');
        Cookies.remove('refreshToken');
        setState(prev => ({ ...prev, currentUser: null }));
    }, [apiFetch]);

    const approvePR = useCallback((id: string) => {
        setState(prev => ({
            ...prev,
            prs: prev.prs.map(p => p.id === id ? { ...p, status: "APPROVED" } : p)
        }));
        return Promise.resolve(true);
    }, []);

    const actionApproval = useCallback((workflowId: string, action: string, memo?: string) => {
        const prId = workflowId.replace('wf-', '');
        setState(prev => {
            const updatedPrs = prev.prs.map(p => p.id === prId ? { ...p, status: action === 'APPROVE' ? 'APPROVED' : 'REJECTED' } : p);
            return { ...prev, prs: updatedPrs };
        });
        return Promise.resolve(true);
    }, []);

    const addDept = useCallback(async (data: Partial<Department>) => {
        const res = await apiFetch('/departments', {
            method: 'POST',
            body: JSON.stringify({ ...data, orgId: state.currentUser?.orgId })
        });
        if (res.ok) {
            notify("Thêm phòng ban thành công", "success");
            await refreshData();
            return true;
        }
        notify("Lỗi khi thêm phòng ban", "error");
        return false;
    }, [apiFetch, state.currentUser?.orgId, refreshData, notify]);

    const updateDept = useCallback(async (id: string, data: Partial<Department>) => {
        const res = await apiFetch(`/departments/${id}`, {
            method: 'PATCH',
            body: JSON.stringify(data)
        });
        if (res.ok) {
            notify("Cập nhật phòng ban thành công", "success");
            await refreshData();
            return true;
        }
        notify("Lỗi khi cập nhật phòng ban", "error");
        return false;
    }, [apiFetch, refreshData, notify]);

    const removeDept = useCallback(async (id: string) => {
        const res = await apiFetch(`/departments/${id}`, {
            method: 'DELETE'
        });
        if (res.ok) {
            notify("Xóa phòng ban thành công", "success");
            await refreshData();
            return true;
        }
        notify("Lỗi khi xóa phòng ban", "error");
        return false;
    }, [apiFetch, refreshData, notify]);

    const addCostCenter = useCallback(async (data: Partial<CostCenter>) => {
        const res = await apiFetch('/cost-centers', {
            method: 'POST',
            body: JSON.stringify({ ...data, orgId: state.currentUser?.orgId })
        });
        if (res.ok) {
            notify("Thêm trung tâm chi phí thành công", "success");
            await refreshData();
            return true;
        }
        notify("Lỗi khi thêm trung tâm chi phí", "error");
        return false;
    }, [apiFetch, state.currentUser?.orgId, refreshData, notify]);

    const updateCostCenter = useCallback(async (id: string, data: Partial<CostCenter>) => {
        const res = await apiFetch(`/cost-centers/${id}`, {
            method: 'PATCH',
            body: JSON.stringify(data)
        });
        if (res.ok) {
            notify("Cập nhật trung tâm chi phí thành công", "success");
            await refreshData();
            return true;
        }
        notify("Lỗi khi cập nhật trung tâm chi phí", "error");
        return false;
    }, [apiFetch, refreshData, notify]);

    const removeCostCenter = useCallback(async (id: string) => {
        const res = await apiFetch(`/cost-centers/${id}`, {
            method: 'DELETE'
        });
        if (res.ok) {
            notify("Xóa trung tâm chi phí thành công", "success");
            await refreshData();
            return true;
        }
        notify("Lỗi khi xóa trung tâm chi phí", "error");
        return false;
    }, [apiFetch, refreshData, notify]);

    const addOrganization = useCallback(async (data: Partial<Organization>) => {
        const res = await apiFetch('/organizations', {
            method: 'POST',
            body: JSON.stringify(data)
        });
        if (res.ok) {
            notify("Thêm tổ chức thành công", "success");
            await refreshData();
            return true;
        }
        notify("Lỗi khi thêm tổ chức", "error");
        return false;
    }, [apiFetch, refreshData, notify]);

    const updateOrganization = useCallback(async (id: string, data: Partial<Organization>) => {
        const res = await apiFetch(`/organizations/${id}`, {
            method: 'PATCH',
            body: JSON.stringify(data)
        });
        if (res.ok) {
            notify("Cập nhật tổ chức thành công", "success");
            await refreshData();
            return true;
        }
        notify("Lỗi khi cập nhật tổ chức", "error");
        return false;
    }, [apiFetch, refreshData, notify]);

    const removeOrganization = useCallback(async (id: string) => {
        const res = await apiFetch(`/organizations/${id}`, {
            method: 'DELETE'
        });
        if (res.ok) {
            notify("Xóa tổ chức thành công", "success");
            await refreshData();
            return true;
        }
        notify("Lỗi khi xóa tổ chức", "error");
        return false;
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

    const addBudgetPeriod = useCallback((data: Partial<BudgetPeriod>) => {
        setState(prev => {
            const nextId = prev.budgetPeriods.length + 1;
            const newP = { ...data, id: `bp-${nextId}` };
            return { ...prev, budgetPeriods: [...prev.budgetPeriods, newP as BudgetPeriod] };
        });
        return Promise.resolve(true);
    }, []);

    const updateBudgetPeriod = useCallback((id: string, data: Partial<BudgetPeriod>) => {
        setState(prev => ({ ...prev, budgetPeriods: prev.budgetPeriods.map(p => p.id === id ? { ...p, ...data } : p) }));
        return Promise.resolve(true);
    }, []);

    const removeBudgetPeriod = useCallback((id: string) => {
        setState(prev => ({ ...prev, budgetPeriods: prev.budgetPeriods.filter(p => p.id !== id) }));
        return Promise.resolve(true);
    }, []);

    const addBudgetAllocation = useCallback((data: Partial<BudgetAllocation>) => {
        setState(prev => {
            const nextId = prev.budgetAllocations.length + 1;
            const newA = { ...data, id: `ba-${nextId}` };
            return { ...prev, budgetAllocations: [...prev.budgetAllocations, newA as BudgetAllocation] };
        });
        return Promise.resolve(true);
    }, []);

    const updateBudgetAllocation = useCallback((id: string, data: Partial<BudgetAllocation>) => {
        setState(prev => ({ ...prev, budgetAllocations: prev.budgetAllocations.map(a => a.id === id ? { ...a, ...data } : a) }));
        return Promise.resolve(true);
    }, []);

    const removeBudgetAllocation = useCallback((id: string) => {
        setState(prev => ({ ...prev, budgetAllocations: prev.budgetAllocations.filter(a => a.id !== id) }));
        return Promise.resolve(true);
    }, []);

    const addBudgetAllocationBundle = useCallback((data: { 
        deptId: string, 
        fiscalYear: number, 
        totalBudget: number, 
        splits: { q1: number, q2: number, q3: number, q4: number, reserve: number } 
    }) => {
        console.log("addBudgetAllocationBundle called with:", data);
        return Promise.resolve(true);
    }, []);

    const createGRN = useCallback((_data: { poId: string, receivedItems: Record<string, number> }) => Promise.resolve(true), []);
    const ackPO = useCallback((_id: string) => Promise.resolve(true), []);
    const shipPO = useCallback((_id: string) => Promise.resolve(true), []);
    const createInvoice = useCallback((_data: { poId: string, vendor: string, amount: number }) => Promise.resolve(true), []);
    const payInvoice = useCallback((_id: string) => Promise.resolve(true), []);
    const matchInvoice = useCallback((_id: string, _status?: string) => Promise.resolve(true), []);

    const register = useCallback(async (data: Partial<User> & { password?: string }) => {
        try {
            const res = await apiFetch('/auth/register', {
                method: 'POST',
                body: JSON.stringify(data)
            });
            if (res.ok) {
                notify("Đăng ký tài khoản thành công!", "success");
                return true;
            } else {
                const err = await res.json();
                notify(err.message || "Không thể đăng ký tài khoản", "error");
                return false;
            }
        } catch (error) {
            console.error(error);
            notify("Lỗi hệ thống khi đăng ký", "error");
            return false;
        }
    }, [apiFetch, notify]);

    const contextValue = useMemo(() => ({
        ...state,
        login,
        logout,
        refreshData,
        apiFetch,
        addPR,
        approvePR,
        createRFQ,
        createRFQConsolidated,
        actionApproval,
        addDept,
        updateDept,
        removeDept,
        addUser,
        updateUser,
        addBudgetPeriod,
        updateBudgetPeriod,
        removeBudgetPeriod,
        addBudgetAllocation,
        updateBudgetAllocation,
        removeBudgetAllocation,
        addBudgetAllocationBundle,
        createGRN,
        ackPO,
        shipPO,
        createInvoice,
        payInvoice,
        matchInvoice,
        addCostCenter,
        updateCostCenter,
        removeCostCenter,
        addOrganization,
        updateOrganization,
        removeOrganization,
        notify,
        register,
        createQuote
    }), [state, login, register, logout, refreshData, apiFetch, addPR, approvePR, createRFQ, createRFQConsolidated, actionApproval, addDept, updateDept, removeDept, addUser, updateUser, addBudgetPeriod, updateBudgetPeriod, removeBudgetPeriod, addBudgetAllocation, updateBudgetAllocation, removeBudgetAllocation, addBudgetAllocationBundle, createGRN, ackPO, shipPO, createInvoice, payInvoice, matchInvoice, addCostCenter, updateCostCenter, removeCostCenter, addOrganization, updateOrganization, removeOrganization, notify, createQuote]);

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
