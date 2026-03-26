"use client";

import React, { createContext, useContext, useState, useCallback, ReactNode, useMemo, useEffect } from "react";
import Cookies from 'js-cookie';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const ProcurementContext = createContext<any>(undefined);

interface User {
    id: string;
    name?: string;
    email: string;
    role: string;
    fullName?: string;
    icon?: string;
    avatarUrl?: string;
}

interface PRItem {
    id: string;
    description: string;
    qty: number;
    estimatedPrice: number;
}

interface PR {
    id: string;
    prNumber?: string;
    title?: string;
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
    totalEstimate?: number | string;
    items?: PRItem[];
    creatorRole?: string; // Fallback helper
}

interface POItem {
    id: string;
    description: string;
    qty: number;
    estimatedPrice: number;
}

interface PO {
    id: string;
    vendor: string;
    items: POItem[];
    status: string;
    total: number;
    createdAt?: string;
}

interface RFQ {
    id: string;
    prId: string;
    vendor: string;
    status: string;
}

interface GRN {
    id: string;
    poId: string;
    receivedItems: Record<string, number>;
    createdAt: string;
}

interface Invoice {
    id: string;
    vendor: string;
    poId: string;
    amount: number;
    status: "PENDING" | "EXCEPTION" | "APPROVED";
    createdAt: string;
}

interface ProcurementState {
    currentUser: User | null;
    prs: PR[];
    myPrs: PR[];
    pos: PO[];
    rfqs: RFQ[];
    grns: GRN[];
    invoices: Invoice[];
    budgets: any;
    users: User[];
    organization: any;
    costCenters: any[];
    approvals: any[];
    organizations: any[];
}

const DEMO_USERS = [
    {
        id: "053b45d6-63f9-4735-a9c8-65304623fb50",
        email: "it.manager@innhub.com",
        fullName: "IT Manager",
        role: "DEPT_APPROVER",
        icon: "MG"
    },
    {
        id: "cad22cfb-eb16-4a5f-a964-664ba63e5f7e",
        email: "admin@innhub.com",
        fullName: "System Admin",
        role: "PLATFORM_ADMIN",
        icon: "AD"
    },
    {
        id: "732d8c3b-9a7c-4e8a-8b2c-1d9e2f3a4b5c", // Placeholder/Found in DB
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
        id: "b4c2d3e4-f5a6-4b7c-8d9e-0f1a2b3c4d5e", // Placeholder/Found in DB
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
        icon: "RQ"
    }
];

const INITIAL_STATE: ProcurementState = {
    currentUser: null,
    prs: [],
    myPrs: [],
    pos: [],
    rfqs: [],
    grns: [],
    invoices: [],
    budgets: null,
    users: DEMO_USERS,
    organization: null,
    costCenters: [],
    approvals: [],
    organizations: []
};

export function ProcurementProvider({ children }: { children: ReactNode }) {
    const [state, setState] = useState<ProcurementState>(INITIAL_STATE);

    const apiFetch = useCallback(async (url: string, options: RequestInit = {}) => {
        const token = Cookies.get('accessToken');
        const headers: HeadersInit = {
            'Content-Type': 'application/json',
            ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
            ...options.headers,
        };
        // Using Localhost API URL for better stability in development
        return await fetch(`http://localhost:5000${url}`, { ...options, credentials: 'include', headers });
    }, []);

    const refreshData = useCallback(async () => {
        try {
            const [prData, myPrData, poData, rfqData, ccData, approvalData, orgData, budgetData, invData, grnData, allOrgsData] = await Promise.all([
                apiFetch('/procurement-requests').then(r => r.json()),
                apiFetch('/procurement-requests/my').then(r => r.json()),
                apiFetch('/purchase-orders').then(r => r.json()),
                apiFetch('/request-for-quotations').then(r => r.json()),
                apiFetch('/cost-centers/department').then(r => r.json()),
                apiFetch('/approvals/pending').then(r => r.json()),
                apiFetch('/organizations/my-org').then(r => r.json()),
                apiFetch('/budgets/allocations').then(r => r.json()),
                apiFetch('/invoices').then(r => r.json()),
                apiFetch('/goods-received-notes').then(r => r.json()),
                apiFetch('/organizations').then(r => r.json())
            ]);

            // Helper to normalize PR data and handle missing/unhydrated objects
            const normalizePR = (p: PR) => {
                const deptName = typeof p.department === 'string' ? p.department : 
                               (p.department?.name || (p as any).dept?.name || (p as any).requester?.department?.name || "N/A");
                
                return {
                    ...p,
                    department: typeof p.department === 'object' ? { ...p.department, name: deptName } : deptName,
                    creatorRole: p.creatorRole || p.requester?.role || 'REQUESTER',
                    totalEstimate: Number(p.totalEstimate) || 0
                };
            };

            setState(prev => ({
                ...prev,
                prs: (Array.isArray(prData?.data) ? prData.data : (Array.isArray(prData) ? prData : [])).map(normalizePR),
                myPrs: (Array.isArray(myPrData?.data) ? myPrData.data : (Array.isArray(myPrData) ? myPrData : [])).map(normalizePR),
                pos: Array.isArray(poData?.data) ? poData.data : [],
                rfqs: Array.isArray(rfqData?.data) ? rfqData.data : [],
                grns: Array.isArray(grnData?.data) ? grnData.data : [],
                invoices: Array.isArray(invData?.data) ? invData.data : [],
                budgets: Array.isArray(budgetData?.data) ? budgetData.data : (Array.isArray(budgetData) ? budgetData : []),
                users: DEMO_USERS,
                organization: orgData?.data || null,
                costCenters: Array.isArray(ccData?.data) ? ccData.data : (Array.isArray(ccData) ? ccData : []),
                approvals: Array.isArray(approvalData?.data) ? approvalData.data : [],
                organizations: Array.isArray(allOrgsData?.data) ? allOrgsData.data : (Array.isArray(allOrgsData) ? allOrgsData : [])
            }));

        } catch (err) {
            console.error("Fetch error:", err);
            setState(prev => ({ ...prev, users: DEMO_USERS }));
        }
    }, [apiFetch]);

    useEffect(() => {
        refreshData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

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
                if (data.refreshToken) {
                    Cookies.set('refreshToken', data.refreshToken, { expires: 7, sameSite: 'Strict' });
                }
            }

            setState(prev => ({ ...prev, currentUser: data.user }));
            await refreshData();
            return true;
        }
        return false;
    }, [apiFetch, refreshData]);

    const logout = useCallback(async () => {
        await apiFetch('/auth/logout', { method: 'POST' });
        Cookies.remove('accessToken');
        Cookies.remove('refreshToken');
        setState({
            ...INITIAL_STATE,
            currentUser: null
        });
    }, [apiFetch]);

    const execAction = useCallback(async (fn: () => Promise<Response>) => {
        const res = await fn();
        if (res.ok) await refreshData();
        return res.ok;
    }, [refreshData]);

    // Action creators
    const addPR = useCallback((data: any) => execAction(() => apiFetch('/procurement-requests', { method: 'POST', body: JSON.stringify(data) })), [apiFetch, execAction]);
    const approvePR = useCallback((id: string) => execAction(() => apiFetch(`/procurement-requests/${id}/submit`, { method: 'POST' })), [apiFetch, execAction]);
    const createRFQ = useCallback((data: any) => execAction(() => apiFetch('/request-for-quotations', { method: 'POST', body: JSON.stringify(data) })), [apiFetch, execAction]);
    const createPO = useCallback((data: any) => execAction(() => apiFetch('/purchase-orders', { method: 'POST', body: JSON.stringify(data) })), [apiFetch, execAction]);
    const createGRN = useCallback((data: any) => execAction(() => apiFetch('/goods-received-notes', { method: 'POST', body: JSON.stringify(data) })), [apiFetch, execAction]);
    const createInvoice = useCallback((data: any) => execAction(() => apiFetch('/invoices', { method: 'POST', body: JSON.stringify(data) })), [apiFetch, execAction]);
    const payInvoice = useCallback((invId: string) => execAction(() => apiFetch(`/invoices/${invId}/pay`, { method: 'POST' })), [apiFetch, execAction]);

    const actionApproval = useCallback((workflowId: string, action: 'APPROVE' | 'REJECT', comment?: string) =>
        execAction(() => apiFetch(`/approvals/${workflowId}/action`, {
            method: 'POST',
            body: JSON.stringify({ action, comment })
        })), [apiFetch, execAction]);

    const contextValue = useMemo(() => ({
        ...state,
        login,
        logout,
        refreshData,
        apiFetch,
        addPR,
        approvePR,
        createRFQ,
        createPO,
        createGRN,
        createInvoice,
        payInvoice,
        actionApproval
    }), [state, login, logout, refreshData, apiFetch, addPR, approvePR, createRFQ, createPO, createGRN, createInvoice, payInvoice, actionApproval]);

    return (
        <ProcurementContext.Provider value={contextValue}>
            {children}
        </ProcurementContext.Provider>
    );
}

export const useProcurement = () => useContext(ProcurementContext);
