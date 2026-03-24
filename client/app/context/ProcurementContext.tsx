"use client";

<<<<<<< HEAD
import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";

// --- Types ---

export interface User {
    id: string;
    name: string;
    email: string;
    role: "REQUESTER" | "DEPT_APPROVER" | "DIRECTOR" | "CEO" | "PROCUREMENT" | "WAREHOUSE" | "QA" | "FINANCE" | "SUPPLIER" | "PLATFORM_ADMIN" | "SYSTEM";
    department: string;
    status: "ONLINE" | "AWAY" | "OFFLINE";
    icon: string;
}


export type Status = "DRAFT" | "PENDING" | "PENDING_DIRECTOR" | "APPROVED" | "REJECTED" | "SOURCING" | "COMMITTED" | "RECEIVED" | "PAID";
export type POStatus = "PENDING" | "ACKNOWLEDGED" | "SHIPPED" | "RECEIVED" | "INVOICED" | "PAID";
export type RFQStatus = "OPEN" | "QUOTED" | "PO_CREATED";
export type InvoiceStatus = "PENDING" | "EXCEPTION" | "APPROVED" | "PAID";

export interface LineItem {
    id: string;
    description: string;
    qty: number;
    unit: string;
    estimatedPrice: number;
    actualPrice?: number;
}

export interface PR {
    id: string;
    department: string;
    costCenter: string;
    priority: "Normal" | "Urgent" | "Critical";
    reason: string;
    items: LineItem[];
    status: Status;
    total: number;
    createdAt: string;
}

export interface RFQ {
    id: string;
    prId: string;
    vendor: string;
    items: LineItem[];
    status: RFQStatus;
    createdAt: string;
    quotation?: {
        prices: Record<string, number>;
        leadTime: string;
        paymentTerms: string;
        total: number;
    };
}

export interface PO {
    id: string;
    prId: string;
    rfqId?: string;
    vendor: string;
    items: LineItem[];
    status: POStatus;
    total: number;
    createdAt: string;
}

export interface GRN {
    id: string;
    poId: string;
    vendor: string;
    receivedItems: Record<string, number>; 
    status: "CONFIRMED";
    createdAt: string;
}

export interface Invoice {
    id: string;
    poId: string;
    vendor: string;
    amount: number;
    status: InvoiceStatus;
    createdAt: string;
    issue?: string;
}

interface ProcurementContextType {
    budget: {
        allocated: number;
        committed: number;
        spent: number;
    };
    prs: PR[];
    pos: PO[];
    rfqs: RFQ[];
    grns: GRN[];
    invoices: Invoice[];
    currentUser: User | null;
    users: User[];

    // PR Actions
    addPR: (pr: Omit<PR, "id" | "status" | "createdAt">) => void;
    approvePR: (id: string) => void;
    
    // RFQ Actions
    createRFQ: (prId: string, vendor: string) => void;
    submitQuotation: (rfqId: string, quotation: RFQ["quotation"]) => void;

    // PO Actions
    createPO: (prId: string, vendor: string, total: number, rfqId?: string) => void;
    ackPO: (poId: string) => void;
    shipPO: (poId: string) => void;

    // GRN Actions
    createGRN: (poId: string, receivedItems: Record<string, number>) => void;

    // Invoice Actions
    createInvoice: (poId: string, vendor: string, amount: number) => void;
    matchInvoice: (invId: string, status: InvoiceStatus) => void;
    payInvoice: (invId: string) => void;

    login: (email: string, password?: string) => Promise<boolean>;
    register: (name: string, email: string, password?: string) => Promise<boolean>;
    logout: () => void;
}


const ProcurementContext = createContext<ProcurementContextType | undefined>(undefined);

// --- Provider ---

export function ProcurementProvider({ children }: { children: ReactNode }) {
    const [mockUsers, setMockUsers] = useState<User[]>([
        { id: "1", name: "John Requester", email: "john.requester@gts.com", role: "REQUESTER", department: "Sản xuất", status: "ONLINE", icon: "JR" },
        { id: "2", name: "Sarah IT Manager", email: "sarah.approver@gts.com", role: "DEPT_APPROVER", department: "IT Infrastructure", status: "ONLINE", icon: "SA" },
        { id: "3", name: "David Director", email: "david.director@gts.com", role: "DIRECTOR", department: "Ban Giám Đốc", status: "ONLINE", icon: "DD" },
        { id: "4", name: "Mike Procurement", email: "mike.procurement@gts.com", role: "PROCUREMENT", department: "Thu mua", status: "AWAY", icon: "MP" },
        { id: "5", name: "Warehouse Team", email: "warehouse@gts.com", role: "WAREHOUSE", department: "Kho hàng", status: "OFFLINE", icon: "WH" },
        { id: "6", name: "Alice Finance", email: "alice.finance@gts.com", role: "FINANCE", department: "Tài chính", status: "ONLINE", icon: "AF" },
        { id: "7", name: "GTS Admin", email: "admin@gts.com", role: "PLATFORM_ADMIN", department: "IT", status: "ONLINE", icon: "AD" },
        { id: "8", name: "Sales Manager (NCC)", email: "sales@hanoihardware.vn", role: "SUPPLIER", department: "Đối tác B2B", status: "ONLINE", icon: "SM" },
        { id: "9", name: "Board CEO", email: "ceo@gts.com", role: "CEO", department: "Executive Office", status: "ONLINE", icon: "CE" },
        { id: "10", name: "QA Center", email: "qa@gts.com", role: "QA", department: "Quality Assurance", status: "ONLINE", icon: "QA" },
        { id: "11", name: "System Daemon", email: "system@gts.com", role: "SYSTEM", department: "Infrastructure", status: "ONLINE", icon: "SY" },
    ]);

    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [budget, setBudget] = useState({
        allocated: 1000000000,
        committed: 0,
        spent: 0,
    });


    const [prs, setPrs] = useState<PR[]>([
        {
            id: "PR-2026-001",
            department: "Phòng Sản xuất",
            costCenter: "CC-61000",
            priority: "Urgent",
            reason: "Bổ sung vải cho đơn hàng xuất khẩu.",
            items: [{ id: "1", description: "Vải Cotton", qty: 500, unit: "Cuộn", estimatedPrice: 300000 }],
            status: "APPROVED",
            total: 150000000,
            createdAt: "2026-03-01",
        },
        {
            id: "PR-2026-002",
            department: "Phòng Sản xuất",
            costCenter: "CC-61000",
            priority: "Normal",
            reason: "Mua sắm máy móc thiết bị mới cho xưởng 2.",
            items: [
                { id: "1", description: "Máy may công nghiệp Juki", qty: 10, unit: "Cái", estimatedPrice: 15000000 },
                { id: "2", description: "Bàn ủi hơi nước chuyên dụng", qty: 5, unit: "Cái", estimatedPrice: 12000000 }
            ],
            status: "PENDING",
            total: 210000000,
            createdAt: "2026-03-13",
        }
    ]);

    const [pos, setPos] = useState<PO[]>([{
        id: "PO-2026-088",
        prId: "PR-2026-001",
        vendor: "Formosa Corp (NCC)",
        items: [{ id: "1", description: "Vải Cotton", qty: 500, unit: "Cuộn", estimatedPrice: 300000 }],
        status: "SHIPPED",
        total: 150000000,
        createdAt: "2026-03-10"
    }]);


    const [rfqs, setRfqs] = useState<RFQ[]>([]);
    const [grns, setGrns] = useState<GRN[]>([]);
    const [invoices, setInvoices] = useState<Invoice[]>([]);

    const login = async (email: string, password?: string): Promise<boolean> => {
        try {
            const res = await fetch('http://localhost:5000/auth-module/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password: password || "password123" }),
            });
            if (res.ok) {
                const responseData = await res.json();
                const data = responseData.data; // TransformInterceptor wraps data
                
                // Store token
                if (data.accessToken) {
                    localStorage.setItem('accessToken', data.accessToken);
                    localStorage.setItem('refreshToken', data.refreshToken);
                }
                
                if (data.user) {
                    const fullName = data.user.fullName || data.user.email.split('@')[0];
                    setCurrentUser({
                        id: data.user.id,
                        name: fullName,
                        email: data.user.email,
                        role: data.user.role,
                        department: data.user.deptId || "N/A",
                        status: "ONLINE",
                        icon: fullName.substring(0, 2).toUpperCase()
                    });
                }
                return true;
            } else {
                return false;
            }
        } catch (error) {
            console.error("Login Error:", error);
            // Fallback to mock login if backend is unreachable for demo
            const user = mockUsers.find(u => u.email === email);
            if (user) {
                setCurrentUser(user);
                return true;
            }
            return false;
        }
    };


    const register = async (name: string, email: string, password?: string): Promise<boolean> => {
        try {
            // Using a dummy orgId per RegisterDto requirements
            const orgId = "325f187a-c1f6-4a4e-8692-234b6e50334a"; 
            const res = await fetch('http://localhost:5000/auth-module/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    orgId,
                    email, 
                    fullName: name,
                    password: password || "Password@123",
                    role: "REQUESTER" 
                }),
            });
            
            if (res.ok) {
                const responseData = await res.json();
                const data = responseData.data.user;

                const newUser: User = {
                    id: data.id || (mockUsers.length + 1).toString(),
                    name,
                    email,
                    role: data.role || "Requester",
                    department: "Default",
                    status: "ONLINE",
                    icon: name.substring(0, 2).toUpperCase()
                };
                setMockUsers(prev => [...prev, newUser]);
                setCurrentUser(newUser);
                return true;
            } else {
                const err = await res.json();
                console.error("Registration failed:", err);
                // Return descriptive error or false
                return false;
            }
        } catch (error) {
            console.error("Register Error:", error);
            // Fallback to mock register
            const newUser: User = {
                id: (mockUsers.length + 1).toString(),
                name,
                email,
                role: "REQUESTER",
                department: "Default",
                status: "ONLINE",
                icon: name.substring(0, 2).toUpperCase()
            };
            setMockUsers(prev => [...prev, newUser]);
            setCurrentUser(newUser);
            return true;
        }
    };


    const logout = async () => {
        try {
            const token = localStorage.getItem('accessToken');
            if (token) {
                await fetch('http://localhost:5000/auth-module/logout', {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                localStorage.removeItem('accessToken');
                localStorage.removeItem('refreshToken');
            }
        } catch (e) {
            console.error("Logout error", e);
        }
        setCurrentUser(null);
    };


    const addPR = (newPR: Omit<PR, "id" | "status" | "createdAt">) => {
        const id = `PR-2026-${(prs.length + 1).toString().padStart(3, "0")}`;
        const fullPR: PR = {
            ...newPR,
            id,
            status: currentUser?.role === "DEPT_APPROVER" ? "PENDING_DIRECTOR" : "PENDING",
            createdAt: new Date().toISOString().split("T")[0],
        };
        setPrs((prev) => [fullPR, ...prev]);
    };

    const approvePR = (id: string) => {
        setPrs((prev) =>
            prev.map((pr) => {
                if (pr.id === id) {
                    if (currentUser?.role === "DEPT_APPROVER") {
                        return { ...pr, status: "PENDING_DIRECTOR" };
                    }
                    return { ...pr, status: "APPROVED" };
                }
                return pr;
            })
        );
    };

    // --- Actions Flow ---
    
    // 1. Create RFQ
    const createRFQ = (prId: string, vendor: string) => {
        const pr = prs.find(p => p.id === prId);
        if (!pr) return;
        setRfqs(prev => {
            const id = `RFQ-2026-${(prev.length + 1).toString().padStart(3, "0")}`;
            return [{ id, prId, vendor, items: pr.items, status: "OPEN", createdAt: new Date().toISOString().split("T")[0] }, ...prev];
        });
        setPrs(prev => prev.map(p => p.id === prId ? { ...p, status: "SOURCING" } : p));
    }

    // 2. Submit Quotation (Supplier)
    const submitQuotation = (rfqId: string, quotation: RFQ["quotation"]) => {
        setRfqs(prev => prev.map(r => r.id === rfqId ? { ...r, status: "QUOTED", quotation } : r));
    }

    // 3. Create PO (Buyer)
    const createPO = (prId: string, vendor: string, total: number, rfqId?: string) => {
        const pr = prs.find(p => p.id === prId);
        if (!pr) return;

        setPos((prev) => {
            const poId = `PO-2026-${(prev.length + 1).toString().padStart(3, "0")}`;
            const newPO: PO = {
                id: poId,
                prId,
                rfqId,
                vendor,
                items: pr.items,
                status: "PENDING",
                total,
                createdAt: new Date().toISOString().split("T")[0],
            };
            return [newPO, ...prev];
        });
        setPrs((prev) => prev.map(p => p.id === prId ? { ...p, status: "COMMITTED" } : p));
        if (rfqId) {
            setRfqs((prev) => prev.map(r => r.id === rfqId ? { ...r, status: "PO_CREATED" } : r));
        }
        setBudget(prev => ({ ...prev, committed: prev.committed + total }));
    };

    // 4. Supplier PO Actions
    const ackPO = (poId: string) => {
        setPos(prev => prev.map(p => p.id === poId ? { ...p, status: "ACKNOWLEDGED" } : p));
    }
    const shipPO = (poId: string) => {
        setPos(prev => prev.map(p => p.id === poId ? { ...p, status: "SHIPPED" } : p));
    }

    // 5. Create GRN (Warehouse)
    const createGRN = (poId: string, receivedItems: Record<string, number>) => {
        const po = pos.find(p => p.id === poId);
        if(!po) return;
        setGrns(prev => {
            const id = `GRN-${new Date().toISOString().split("T")[0]}-${(prev.length + 1)}`;
            return [{ id, poId, vendor: po.vendor, receivedItems, status: "CONFIRMED", createdAt: new Date().toISOString().split("T")[0] }, ...prev];
        });
        setPos(prev => prev.map(p => p.id === poId ? { ...p, status: "RECEIVED" } : p));
    }

    // 6. Create Invoice (Supplier)
    const createInvoice = (poId: string, vendor: string, amount: number) => {
        setInvoices(prev => {
            const id = `INV-${new Date().toISOString().split("T")[0].replace(/-/g, "").substring(4)}-${prev.length + 1}`;
            return [{ id, poId, vendor, amount, status: "PENDING", createdAt: new Date().toISOString().split("T")[0] }, ...prev];
        });
        setPos(prev => prev.map(p => p.id === poId ? { ...p, status: "INVOICED" } : p));
    }

    // 7. Finance Actions
    const matchInvoice = (invId: string, status: InvoiceStatus) => {
        setInvoices(prev => prev.map(i => i.id === invId ? { ...i, status } : i));
    }

    const payInvoice = (invId: string) => {
        const inv = invoices.find(i => i.id === invId);
        if (!inv) return;

        setInvoices(prev => prev.map(i => i.id === invId ? { ...i, status: "PAID" } : i));
        
        const po = pos.find(p => p.id === inv.poId);
        if (po) {
            setPos(prev => prev.map(p => p.id === po.id ? { ...p, status: "PAID" } : p));
            setPrs(prev => prev.map(p => p.id === po.prId ? { ...p, status: "PAID" } : p));
        }

        setBudget(prev => ({
            ...prev,
            committed: Math.max(0, prev.committed - inv.amount),
            spent: prev.spent + inv.amount
        }));
    };

    return (
        <ProcurementContext.Provider value={{
            budget, prs, pos, rfqs, grns, invoices, currentUser, users: mockUsers,
            addPR, approvePR, createRFQ, submitQuotation, createPO, ackPO, shipPO, createGRN, createInvoice, matchInvoice, payInvoice,
            login, register, logout 
        }}>
            {children}
        </ProcurementContext.Provider>
    );

}

// --- Hook ---

export function useProcurement() {
    const context = useContext(ProcurementContext);
    if (context === undefined) {
        throw new Error("useProcurement must be used within a ProcurementProvider");
    }
    return context;
}
=======
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
>>>>>>> 2a33e5440bf544c21f0e020a6d254b6bc39af67e
