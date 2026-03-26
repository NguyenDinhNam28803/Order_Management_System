"use client";

import React, { createContext, useContext, useState, useCallback, ReactNode } from "react";
import Cookies from 'js-cookie';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const ProcurementContext = createContext<any>(undefined);

interface ProcurementState {
    currentUser: any;
    prs: any[];
    myPrs: any[];
    pos: any[];
    rfqs: any[];
    grns: any[];
    invoices: any[];
    budgets: any;
    users: any[];
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
        // Using VPS API URL
        return await fetch(`http://157.66.46.59:5000${url}`, { ...options, credentials: 'include', headers });
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
                usersRes.ok ? usersRes.json() : { data: DEMO_USERS },
                orgRes.ok ? orgRes.json() : { data: null },
                ccRes.ok ? ccRes.json() : { data: [] },
                approvalsRes.ok ? approvalsRes.json() : { data: [] }
            ]);

            setState(prev => ({
                ...prev,
                prs: Array.isArray(prData?.data) && prData.data.length > 0 ? prData.data : [
                    // Requester PRs
                    { id: "pr-1", prNumber: "PR-2026-4977", title: "Furniture", totalEstimate: 3500000, status: "PENDING_MANAGER_APPROVAL", department: { name: "Information Technology" }, creatorRole: "REQUESTER", createdAt: new Date().toISOString() },
                    { id: "pr-2", prNumber: "PR-2026-6788", title: "Laptop update", totalEstimate: 4900000, status: "IN_SOURCING", department: { name: "Information Technology" }, creatorRole: "REQUESTER", createdAt: new Date().toISOString() },
                    { id: "pr-3", prNumber: "PR-2026-7066", title: "Bàn làm việc", totalEstimate: 2900000, status: "PENDING_MANAGER_APPROVAL", department: { name: "Information Technology" }, creatorRole: "REQUESTER", createdAt: new Date().toISOString() },
                    { id: "pr-4", prNumber: "PR-2026-8609", title: "Training material", totalEstimate: 1500000, status: "DRAFT", department: { name: "Information Technology" }, creatorRole: "REQUESTER", createdAt: new Date().toISOString() },
                    { id: "pr-5", prNumber: "PR-2026-3133", title: "Office supplies", totalEstimate: 500000, status: "IN_SOURCING", department: { name: "Information Technology" }, creatorRole: "REQUESTER", createdAt: new Date().toISOString() },
                    // Manager PRs
                    { id: "pr-mgr-1", prNumber: "PR-MGR-001", title: "New monitors", totalEstimate: 7500000, status: "APPROVED", department: { name: "Information Technology" }, creatorRole: "DEPT_APPROVER", createdAt: new Date().toISOString() },
                    { id: "pr-mgr-2", prNumber: "PR-MGR-002", title: "IT team training", totalEstimate: 25000000, status: "PENDING_DIRECTOR_APPROVAL", department: { name: "Information Technology" }, creatorRole: "DEPT_APPROVER", createdAt: new Date().toISOString() },
                    { id: "pr-mgr-3", prNumber: "PR-MGR-003", title: "Software licenses", totalEstimate: 9800000, status: "APPROVED", department: { name: "Information Technology" }, creatorRole: "DEPT_APPROVER", createdAt: new Date().toISOString() },
                    { id: "pr-mgr-4", prNumber: "PR-MGR-004", title: "New Projector", totalEstimate: 12000000, status: "DRAFT", department: { name: "Information Technology" }, creatorRole: "DEPT_APPROVER", createdAt: new Date().toISOString() },
                    // Director PRs
                    { id: "pr-dir-1", prNumber: "PR-DIR-001", title: "Office furniture upgrade", totalEstimate: 75000000, status: "PENDING_CEO_APPROVAL", department: { name: "Information Technology" }, creatorRole: "DIRECTOR", createdAt: new Date().toISOString() },
                    { id: "pr-dir-2", prNumber: "PR-DIR-002", title: "Software licenses renewal", totalEstimate: 150000000, status: "PENDING_CEO_APPROVAL", department: { name: "Information Technology" }, creatorRole: "DIRECTOR", createdAt: new Date().toISOString() },
                    { id: "pr-dir-3", prNumber: "PR-DIR-003", title: "Marketing campaign assets", totalEstimate: 195000000, status: "PENDING_CEO_APPROVAL", department: { name: "Information Technology" }, creatorRole: "DIRECTOR", createdAt: new Date().toISOString() },
                    { id: "pr-dir-4", prNumber: "PR-DIR-004", title: "Server Hardware Expansion", totalEstimate: 180000000, status: "DRAFT", department: { name: "Information Technology" }, creatorRole: "DIRECTOR", createdAt: new Date().toISOString() },
                ],
                myPrs: (Array.isArray(myPrData?.data) && myPrData.data.length > 0) ? myPrData.data : (Array.isArray(myPrData) && myPrData.length > 0) ? myPrData : [
                    { id: "my-pr-1", prNumber: "PR-2026-M001", title: "Cấu hình Server VPS mới", totalEstimate: 5000000, status: "APPROVED", department: { name: "Information Technology" }, creatorRole: "DEPT_APPROVER", createdAt: new Date().toISOString() },
                    { id: "my-pr-2", prNumber: "PR-2026-M002", title: "Mua sắm thiết bị ngoại vi IT", totalEstimate: 2500000, status: "PENDING_DIRECTOR_APPROVAL", department: { name: "Information Technology" }, creatorRole: "DEPT_APPROVER", createdAt: new Date().toISOString() },
                    { id: "my-pr-3", prNumber: "PR-2026-M003", title: "Gia hạn bản quyền phần mềm", totalEstimate: 12000000, status: "DRAFT", department: { name: "Information Technology" }, creatorRole: "DEPT_APPROVER", createdAt: new Date().toISOString() },
                ],
                pos: Array.isArray(poData?.data) ? poData.data : [],
                rfqs: Array.isArray(rfqData?.data) ? rfqData.data : [],
                grns: Array.isArray(grnData?.data) ? grnData.data : [],
                invoices: Array.isArray(invData?.data) ? invData.data : [],
                budgets: budgetData?.data || null,
                users: DEMO_USERS,
                organization: orgData?.data || null,
                costCenters: Array.isArray(ccData?.data) ? ccData.data : (Array.isArray(ccData) ? ccData : []),
                approvals: Array.isArray(approvalData?.data) ? approvalData.data : []
            }));

        } catch (err) {
            console.error("Fetch error:", err);
            setState(prev => ({ ...prev, users: DEMO_USERS }));
        }
    }, [apiFetch]);

    React.useEffect(() => {
        refreshData();
    }, [refreshData]);

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
            currentUser: null, prs: [], myPrs: [], pos: [], rfqs: [], grns: [], invoices: [], budgets: null, users: [], 
            organization: null, costCenters: [], approvals: []
        });
    }, [apiFetch]);

    const execAction = React.useCallback(async (fn: () => Promise<Response>) => {
        const res = await fn();
        if (res.ok) await refreshData();
        return res.ok;
    }, [refreshData]);

    // Action creators
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
