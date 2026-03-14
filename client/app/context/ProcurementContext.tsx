"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";

// --- Types ---

export interface User {
    id: string;
    name: string;
    email: string;
    role: "Requester" | "Approver" | "Director" | "Buyer" | "Receiver" | "Finance" | "Admin" | "Supplier";
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

    login: (email: string) => boolean;
    register: (name: string, email: string) => void;
    logout: () => void;
}


const ProcurementContext = createContext<ProcurementContextType | undefined>(undefined);

// --- Provider ---

export function ProcurementProvider({ children }: { children: ReactNode }) {
    const [mockUsers, setMockUsers] = useState<User[]>([
        { id: "1", name: "Nguyễn Nhân Viên", email: "requester@erp.com", role: "Requester", department: "Sản xuất", status: "ONLINE", icon: "NV" },
        { id: "2", name: "Trần Trưởng Phòng", email: "approver@erp.com", role: "Approver", department: "Kế hoạch", status: "ONLINE", icon: "TP" },
        { id: "3", name: "Lý Giám Đốc", email: "director@erp.com", role: "Director", department: "Ban Giám Đốc", status: "ONLINE", icon: "GĐ" },
        { id: "4", name: "Lê Thu Mua", email: "buyer@erp.com", role: "Buyer", department: "Thu mua", status: "AWAY", icon: "TM" },
        { id: "5", name: "Phạm Kho Vận", email: "receiver@erp.com", role: "Receiver", department: "Kho hàng", status: "OFFLINE", icon: "KV" },
        { id: "6", name: "Hoàng Kế Toán", email: "finance@erp.com", role: "Finance", department: "Tài chính", status: "ONLINE", icon: "KT" },
        { id: "7", name: "Admin Hệ Thống", email: "admin@erp.com", role: "Admin", department: "IT", status: "ONLINE", icon: "AD" },
        { id: "8", name: "Formosa Corp (NCC)", email: "supplier@vendor.com", role: "Supplier", department: "Đối tác B2B", status: "ONLINE", icon: "B2B" },
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

    const [pos, setPos] = useState<PO[]>([]);


    const [rfqs, setRfqs] = useState<RFQ[]>([]);
    const [grns, setGrns] = useState<GRN[]>([]);
    const [invoices, setInvoices] = useState<Invoice[]>([]);

    useEffect(() => {
        // Hydrate initial POs
        if (pos.length === 0) {
            setPos([
                {
                    id: "PO-2026-088",
                    prId: "PR-2026-001",
                    vendor: "Formosa Corp (NCC)",
                    items: [{ id: "1", description: "Vải Cotton", qty: 500, unit: "Cuộn", estimatedPrice: 300000 }],
                    status: "SHIPPED",
                    total: 150000000,
                    createdAt: "2026-03-10"
                }
            ]);
        }
    }, [])

    const login = (email: string) => {
        const user = mockUsers.find(u => u.email === email);
        if (user) {
            setCurrentUser(user);
            return true;
        }
        return false;
    };

    const register = (name: string, email: string) => {
        const newUser: User = {
            id: (mockUsers.length + 1).toString(),
            name,
            email,
            role: "Requester",
            department: "Default",
            status: "ONLINE",
            icon: name.substring(0, 2).toUpperCase()
        };
        setMockUsers(prev => [...prev, newUser]);
        setCurrentUser(newUser);
    };


    const logout = () => {
        setCurrentUser(null);
    };

    const addPR = (newPR: Omit<PR, "id" | "status" | "createdAt">) => {
        const id = `PR-2026-${(prs.length + 1).toString().padStart(3, "0")}`;
        const fullPR: PR = {
            ...newPR,
            id,
            status: currentUser?.role === "Approver" ? "PENDING_DIRECTOR" : "PENDING",
            createdAt: new Date().toISOString().split("T")[0],
        };
        setPrs((prev) => [fullPR, ...prev]);
    };

    const approvePR = (id: string) => {
        setPrs((prev) =>
            prev.map((pr) => {
                if (pr.id === id) {
                    if (currentUser?.role === "Approver") {
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
