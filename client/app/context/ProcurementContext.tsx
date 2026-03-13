"use client";

import React, { createContext, useContext, useState, ReactNode } from "react";

// --- Types ---

export interface User {
    id: string;
    name: string;
    email: string;
    role: "Requester" | "Approver" | "Buyer" | "Receiver" | "Finance" | "Admin";
    department: string;
    status: "ONLINE" | "AWAY" | "OFFLINE";
    icon: string;
}


export type Status = "DRAFT" | "PENDING" | "APPROVED" | "REJECTED" | "COMMITTED" | "RECEIVED" | "PAID";

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

export interface PO {
    id: string;
    prId: string;
    vendor: string;
    items: LineItem[];
    status: Status;
    total: number;
    createdAt: string;
}

interface ProcurementContextType {
    budget: {
        allocated: number;
        committed: number;
        spent: number;
    };
    prs: PR[];
    pos: PO[];
    currentUser: User | null;
    users: User[];
    addPR: (pr: Omit<PR, "id" | "status" | "createdAt">) => void;
    approvePR: (id: string) => void;
    createPO: (prId: string, vendor: string, total: number) => void;
    payPO: (poId: string) => void;
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
        { id: "3", name: "Lê Thu Mua", email: "buyer@erp.com", role: "Buyer", department: "Thu mua", status: "AWAY", icon: "TM" },
        { id: "4", name: "Phạm Kho Vận", email: "receiver@erp.com", role: "Receiver", department: "Kho hàng", status: "OFFLINE", icon: "KV" },
        { id: "5", name: "Hoàng Kế Toán", email: "finance@erp.com", role: "Finance", department: "Tài chính", status: "ONLINE", icon: "KT" },
        { id: "6", name: "Admin Hệ Thống", email: "admin@erp.com", role: "Admin", department: "IT", status: "ONLINE", icon: "AD" },
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
            status: "PENDING",
            createdAt: new Date().toISOString().split("T")[0],
        };
        setPrs((prev) => [fullPR, ...prev]);
    };

    const approvePR = (id: string) => {
        setPrs((prev) =>
            prev.map((pr) => (pr.id === id ? { ...pr, status: "APPROVED" } : pr))
        );
    };

    const createPO = (prId: string, vendor: string, total: number) => {
        const pr = prs.find(p => p.id === prId);
        if (!pr) return;

        const poId = `PO-2026-${(pos.length + 1).toString().padStart(3, "0")}`;
        const newPO: PO = {
            id: poId,
            prId,
            vendor,
            items: pr.items,
            status: "COMMITTED",
            total,
            createdAt: new Date().toISOString().split("T")[0],
        };

        setPos((prev) => [newPO, ...prev]);
        setPrs((prev) => prev.map(p => p.id === prId ? { ...p, status: "COMMITTED" } : p));
        setBudget(prev => ({ ...prev, committed: prev.committed + total }));
    };

    const payPO = (poId: string) => {
        const po = pos.find(p => p.id === poId);
        if (!po) return;

        setPos(prev => prev.map(p => p.id === poId ? { ...p, status: "PAID" } : p));
        setBudget(prev => ({
            ...prev,
            committed: Math.max(0, prev.committed - po.total),
            spent: prev.spent + po.total
        }));
    };

    return (
        <ProcurementContext.Provider value={{ budget, prs, pos, currentUser, users: mockUsers, addPR, approvePR, createPO, payPO, login, register, logout }}>
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
