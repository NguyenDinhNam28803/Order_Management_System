"use client";

import React, { createContext, useContext, useState, useCallback, ReactNode } from "react";
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
}

export function ProcurementProvider({ children }: { children: ReactNode }) {
    // eslint-disable-next-line react-hooks/exhaustive-deps
    const DEMO_USERS = [
        { id: "1", name: "IT Manager", email: "it.manager@innhub.com", role: "DEPT_APPROVER", icon: "IT" },
        { id: "2", name: "System Admin", email: "admin@innhub.com", role: "PLATFORM_ADMIN", icon: "AD" },
        { id: "4", name: "Board CEO", email: "ceo@innhub.com", role: "CEO", icon: "CE" },
        { id: "6", name: "Procurement Officer", email: "proc.officer@innhub.com", role: "PROCUREMENT", icon: "PO" },
        { id: "7", name: "Director", email: "director@innhub.com", role: "DIRECTOR", icon: "DR" },
        { id: "10", name: "John Requester", email: "it.requester@innhub.com", role: "REQUESTER", icon: "IR" },
    ];
    const [state, setState] = useState<ProcurementState>({
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
        approvals: []
    });


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
            const [pr, myPrRes, po, rfq, grn, inv, budget, usersRes, orgRes, ccRes, approvalsRes] = await Promise.all([
                apiFetch('/procurement-requests'),
                apiFetch('/procurement-requests/my'),
                apiFetch('/purchase-orders'),
                apiFetch('/request-for-quotations'),
                apiFetch('/goods-received-notes'),
                apiFetch('/invoices'),
                apiFetch('/cost-centers/department'),
                apiFetch('/users'),
                apiFetch('/organizations/my-org'),
                apiFetch('/cost-centers'),
                apiFetch('/approvals/pending')
            ]);

            const [prData, myPrData, poData, rfqData, grnData, invData, budgetData, usersData, orgData, ccData, approvalData] = await Promise.all([
                pr.ok ? pr.json() : { data: [] },
                myPrRes.ok ? myPrRes.json() : { data: [] },
                po.ok ? po.json() : { data: [] },
                rfq.ok ? rfq.json() : { data: [] },
                grn.ok ? grn.json() : { data: [] },
                inv.ok ? inv.json() : { data: [] },
                budget.ok ? budget.json() : { data: null },
                usersRes.ok ? usersRes.json() : { data: [] },
                orgRes.ok ? orgRes.json() : { data: null },
                ccRes.ok ? ccRes.json() : { data: [] },
                approvalsRes.ok ? approvalsRes.json() : { data: [] }
            ]);

            // Helper to normalize PR data to include creatorRole for legacy logic if needed
            const normalizePR = (p: PR) => ({
                ...p,
                creatorRole: p.creatorRole || p.requester?.role || 'REQUESTER',
                totalEstimate: Number(p.totalEstimate) || 0
            });

            setState(prev => ({
                ...prev,
                prs: (Array.isArray(prData?.data) ? prData.data : (Array.isArray(prData) ? prData : [])).map(normalizePR),
                myPrs: (Array.isArray(myPrData?.data) ? myPrData.data : (Array.isArray(myPrData) ? myPrData : [])).map(normalizePR),
                pos: Array.isArray(poData?.data) ? poData.data : [],
                rfqs: Array.isArray(rfqData?.data) ? rfqData.data : [],
                grns: Array.isArray(grnData?.data) ? grnData.data : [],
                invoices: Array.isArray(invData?.data) ? invData.data : [],
                budgets: budgetData?.data || null,
                users: DEMO_USERS, // Keep demo users for quick login
                organization: orgData?.data || null,
                costCenters: Array.isArray(ccData?.data) ? ccData.data : (Array.isArray(ccData) ? ccData : []),
                approvals: Array.isArray(approvalData?.data) ? approvalData.data : []
            }));

        } catch (err) {
            console.error("Fetch error:", err);
            setState(prev => ({ ...prev, users: DEMO_USERS }));
        }
    }, [DEMO_USERS, apiFetch]);

    React.useEffect(() => {
        refreshData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const login = React.useCallback(async (email: string, password?: string) => {
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

    const logout = React.useCallback(async () => {
        await apiFetch('/auth/logout', { method: 'POST' });
        Cookies.remove('accessToken');
        Cookies.remove('refreshToken');
        setState({
            currentUser: null, prs: [], myPrs: [], pos: [], rfqs: [], grns: [], invoices: [], budgets: null, users: DEMO_USERS,
            organization: null, costCenters: [], approvals: []
        });
    }, [apiFetch, DEMO_USERS]);

    const execAction = React.useCallback(async (fn: () => Promise<Response>) => {
        const res = await fn();
        if (res.ok) await refreshData();
        return res.ok;
    }, [refreshData]);

    // Action creators
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const addPR = React.useCallback((data: any) => execAction(() => apiFetch('/procurement-requests', { method: 'POST', body: JSON.stringify(data) })), [apiFetch, execAction]);
    const approvePR = React.useCallback((id: string) => execAction(() => apiFetch(`/procurement-requests/${id}/submit`, { method: 'POST' })), [apiFetch, execAction]);
    const createRFQ = React.useCallback((prId: string, vendor: string) => execAction(() => apiFetch('/request-for-quotations', { method: 'POST', body: JSON.stringify({ prId, vendor }) })), [apiFetch, execAction]);
    const createPO = React.useCallback((prId: string, vendor: string, total: number, rfqId?: string) => execAction(() => apiFetch('/purchase-orders', { method: 'POST', body: JSON.stringify({ prId, vendor, total, rfqId }) })), [apiFetch, execAction]);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const createGRN = React.useCallback((poId: string, receivedItems: any) => execAction(() => apiFetch('/goods-received-notes', { method: 'POST', body: JSON.stringify({ poId, receivedItems }) })), [apiFetch, execAction]);
    const createInvoice = React.useCallback((poId: string, vendor: string, amount: number) => execAction(() => apiFetch('/invoices', { method: 'POST', body: JSON.stringify({ poId, vendor, amount }) })), [apiFetch, execAction]);
    const payInvoice = React.useCallback((invId: string) => execAction(() => apiFetch(`/invoices/${invId}/pay`, { method: 'POST' })), [apiFetch, execAction]);

    const actionApproval = React.useCallback((workflowId: string, action: 'APPROVE' | 'REJECT', comment?: string) =>
        execAction(() => apiFetch(`/approvals/${workflowId}/action`, {
            method: 'POST',
            body: JSON.stringify({ action, comment })
        })), [apiFetch, execAction]);

    const contextValue = React.useMemo(() => ({
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
