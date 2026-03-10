"use client";

import React, { createContext, useContext, useState, ReactNode } from "react";

// --- Types ---

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
    addPR: (pr: Omit<PR, "id" | "status" | "createdAt">) => void;
    approvePR: (id: string) => void;
    createPO: (prId: string, vendor: string, total: number) => void;
    payPO: (poId: string) => void;
}

const ProcurementContext = createContext<ProcurementContextType | undefined>(undefined);

// --- Provider ---

export function ProcurementProvider({ children }: { children: ReactNode }) {
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
        }
    ]);

    const [pos, setPos] = useState<PO[]>([]);

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
        <ProcurementContext.Provider value={{ budget, prs, pos, addPR, approvePR, createPO, payPO }}>
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
