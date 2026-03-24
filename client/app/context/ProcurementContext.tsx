"use client";

import React, { createContext, useContext, useState, useCallback, ReactNode } from "react";
import Cookies from 'js-cookie';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const ProcurementContext = createContext<any>(undefined);

export function ProcurementProvider({ children }: { children: ReactNode }) {
    const [state, setState] = useState({
        currentUser: null,
        prs: [], 
        pos: [], 
        rfqs: [], 
        grns: [], 
        invoices: [], 
        budgets: null
    });

    const apiFetch = async (url: string, options: RequestInit = {}) => {
        const token = Cookies.get('accessToken');
        const headers: HeadersInit = {
            'Content-Type': 'application/json',
            ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
            ...options.headers,
        };
        return await fetch(`http://localhost:5000${url}`, { ...options, credentials: 'include', headers });
    };

    const refreshData = useCallback(async () => {
        try {
            const [pr, po, rfq, grn, inv, budget] = await Promise.all([
                apiFetch('/procurement-requests'),
                apiFetch('/purchase-orders'),
                apiFetch('/request-for-quotations'),
                apiFetch('/goods-received-notes'),
                apiFetch('/invoices'),
                apiFetch('/cost-centers/department')
            ]);

            // ✅ Chỉ giữ đoạn này, xóa setState ở trên đi
            const [prData, poData, rfqData, grnData, invData, budgetData] = await Promise.all([
                pr.ok ? pr.json() : { data: [] },
                po.ok ? po.json() : { data: [] },
                rfq.ok ? rfq.json() : { data: [] },
                grn.ok ? grn.json() : { data: [] },
                inv.ok ? inv.json() : { data: [] },
                budget.ok ? budget.json() : { data: null }
            ]);

            setState(prev => ({
                ...prev,
                prs: prData.data || [],
                pos: poData.data || [],
                rfqs: rfqData.data || [],
                grns: grnData.data || [],
                invoices: invData.data || [],
                budgets: budgetData.data || null
            }));

        } catch (err) {
            console.error("Fetch error:", err);
        }
    }, []);

    const login = async (email: string, password?: string) => {
        const res = await apiFetch('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) });
        if (res.ok) {
            const { data } = await res.json();
            Cookies.set('accessToken', data.accessToken, { expires: 7, sameSite: 'Strict' });
            setState(prev => ({ ...prev, currentUser: data.user }));
            await refreshData();
            return true;
        }
        return false;
    };

    const logout = async () => {
        await apiFetch('/auth-module/logout', { method: 'POST' });
        Cookies.remove('accessToken');
        setState({ currentUser: null, prs: [], pos: [], rfqs: [], grns: [], invoices: [], budgets: null });
    };

    const execAction = async (fn: () => Promise<Response>) => {
        const res = await fn();
        if (res.ok) await refreshData();
        return res.ok;
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const addPR = (data: any) => execAction(() => apiFetch('/procurement-requests', { method: 'POST', body: JSON.stringify(data) }));
    const approvePR = (id: string) => execAction(() => apiFetch(`/procurement-requests/${id}/submit`, { method: 'POST' }));
    const createRFQ = (prId: string, vendor: string) => execAction(() => apiFetch('/rfq-module', { method: 'POST', body: JSON.stringify({ prId, vendor }) }));
    const createPO = (prId: string, vendor: string, total: number, rfqId?: string) => execAction(() => apiFetch('/purchase-orders', { method: 'POST', body: JSON.stringify({ prId, vendor, total, rfqId }) }));
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const createGRN = (poId: string, receivedItems: any) => execAction(() => apiFetch('/goods-received-notes', { method: 'POST', body: JSON.stringify({ poId, receivedItems }) }));
    const createInvoice = (poId: string, vendor: string, amount: number) => execAction(() => apiFetch('/invoice-module', { method: 'POST', body: JSON.stringify({ poId, vendor, amount }) }));
    const payInvoice = (invId: string) => execAction(() => apiFetch(`/invoice-module/${invId}/pay`, { method: 'POST' }));

    return (
        <ProcurementContext.Provider value={{ ...state, login, logout, refreshData, addPR, approvePR, createRFQ, createPO, createGRN, createInvoice, payInvoice }}>
            {children}
        </ProcurementContext.Provider>
    );
}

export const useProcurement = () => useContext(ProcurementContext);
