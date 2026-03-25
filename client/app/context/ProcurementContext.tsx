"use client";

import React, { createContext, useContext, useState, useCallback, ReactNode } from "react";
import Cookies from 'js-cookie';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const ProcurementContext = createContext<any>(undefined);

interface ProcurementState {
    currentUser: any;
    prs: any[];
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
    const [state, setState] = useState<ProcurementState>({
        currentUser: null,
        prs: [], 
        pos: [], 
        rfqs: [], 
        grns: [], 
        invoices: [], 
        budgets: null,
        users: [],
        organization: null,
        costCenters: [],
        approvals: []
    });

    const apiFetch = async (url: string, options: RequestInit = {}) => {
        const token = Cookies.get('accessToken');
        const headers: HeadersInit = {
            'Content-Type': 'application/json',
            ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
            ...options.headers,
        };
        // Using localhost:5000 as defined in both versions
        return await fetch(`http://localhost:5000${url}`, { ...options, credentials: 'include', headers });
    };

    const DEMO_USERS = [
        { id: "1", name: "GTS Admin", email: "admin@gts.com", role: "PLATFORM_ADMIN", icon: "AD" },
        { id: "2", name: "Requester", email: "john.requester@gts.com", role: "REQUESTER", icon: "RQ" },
        { id: "3", name: "Manager", email: "sarah.approver@gts.com", role: "DEPT_APPROVER", icon: "MN" },
        { id: "4", name: "Director", email: "david.director@gts.com", role: "DIRECTOR", icon: "DR" },
        { id: "5", name: "Mike Procurement", email: "mike.procurement@gts.com", role: "PROCUREMENT", icon: "PR" },
        { id: "6", name: "Alice Finance", email: "alice.finance@gts.com", role: "FINANCE", icon: "FM" },
    ];

    const refreshData = useCallback(async () => {
        try {
            const [pr, po, rfq, grn, inv, budget, usersRes, orgRes, ccRes, approvalsRes] = await Promise.all([
                apiFetch('/procurement-requests'),
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

            const [prData, poData, rfqData, grnData, invData, budgetData, usersData, orgData, ccData, approvalData] = await Promise.all([
                pr.ok ? pr.json() : { data: [] },
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
                prs: prData.data && prData.data.length > 0 ? prData.data : [
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
                pos: poData.data || [],
                rfqs: rfqData.data || [],
                grns: grnData.data || [],
                invoices: invData.data || [],
                budgets: budgetData.data || null,
                users: usersData.data || usersData || DEMO_USERS,
                organization: orgData.data || null,
                costCenters: ccData.data || [],
                approvals: approvalData.data || []
            }));

        } catch (err) {
            console.error("Fetch error:", err);
            setState(prev => ({ ...prev, users: DEMO_USERS }));
        }
    }, [apiFetch, DEMO_USERS]);

    const login = async (email: string, password?: string) => {
        // Correct path likely /auth-module/login based on server files
        const res = await apiFetch('/auth/login', { 
            method: 'POST', 
            body: JSON.stringify({ email, password: password || "password123" }) 
        });
        
        if (res.ok) {
            const responseData = await res.json();
            const data = responseData.data;
            
            if (data.accessToken) {
                Cookies.set('accessToken', data.accessToken, { expires: 7, sameSite: 'Strict' });
                // If there's a refresh token, we might want to store it too, but follow the incoming logic
                if (data.refreshToken) {
                    Cookies.set('refreshToken', data.refreshToken, { expires: 7, sameSite: 'Strict' });
                }
            }
            
            setState(prev => ({ ...prev, currentUser: data.user }));
            await refreshData();
            return true;
        }
        return false;
    };

    const logout = async () => {
        await apiFetch('/auth/logout', { method: 'POST' });
        Cookies.remove('accessToken');
        Cookies.remove('refreshToken');
        setState({ 
            currentUser: null, prs: [], pos: [], rfqs: [], grns: [], invoices: [], budgets: null, users: [], 
            organization: null, costCenters: [], approvals: []
        });
    };

    const execAction = async (fn: () => Promise<Response>) => {
        const res = await fn();
        if (res.ok) await refreshData();
        return res.ok;
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const addPR = (data: any) => execAction(() => apiFetch('/procurement-requests', { method: 'POST', body: JSON.stringify(data) }));
    const approvePR = (id: string) => execAction(() => apiFetch(`/procurement-requests/${id}/submit`, { method: 'POST' }));
    const createRFQ = (prId: string, vendor: string) => execAction(() => apiFetch('/request-for-quotations', { method: 'POST', body: JSON.stringify({ prId, vendor }) }));
    const createPO = (prId: string, vendor: string, total: number, rfqId?: string) => execAction(() => apiFetch('/purchase-orders', { method: 'POST', body: JSON.stringify({ prId, vendor, total, rfqId }) }));
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const createGRN = (poId: string, receivedItems: any) => execAction(() => apiFetch('/goods-received-notes', { method: 'POST', body: JSON.stringify({ poId, receivedItems }) }));
    const createInvoice = (poId: string, vendor: string, amount: number) => execAction(() => apiFetch('/invoices', { method: 'POST', body: JSON.stringify({ poId, vendor, amount }) }));
    const payInvoice = (invId: string) => execAction(() => apiFetch(`/invoices/${invId}/pay`, { method: 'POST' }));

    // Approval Workflow Action
    const actionApproval = (workflowId: string, action: 'APPROVE' | 'REJECT', comment?: string) => 
        execAction(() => apiFetch(`/approvals/${workflowId}/action`, { 
            method: 'POST', 
            body: JSON.stringify({ action, comment }) 
        }));

    return (
        <ProcurementContext.Provider value={{ ...state, login, logout, refreshData, apiFetch, addPR, approvePR, createRFQ, createPO, createGRN, createInvoice, payInvoice, actionApproval }}>
            {children}
        </ProcurementContext.Provider>
    );
}

export const useProcurement = () => useContext(ProcurementContext);
