"use client";

import React from "react";
import {
    Bell, Globe, Search, ChevronRight, Home, LogOut
} from "lucide-react";
import { useProcurement } from "../context/ProcurementContext";

export default function ERPHeader({ breadcrumbs = ["Tài chính", "Khoản phải trả", "Đối soát 3 bên"] }) {
    const { currentUser, logout, prs } = useProcurement();

    const pendingCount = prs.filter((pr: any) => {
        if (!currentUser) return false;
        if (currentUser.role === "REQUESTER") return pr.status === "PENDING";
        if (currentUser.role === "DIRECTOR") return pr.status === "PENDING_DIRECTOR";
        return pr.status === "PENDING";
    }).length;

    return (
        <header className="fixed top-0 right-0 z-30 flex h-16 w-[calc(100%-16rem)] items-center justify-between border-b border-slate-200 bg-white/80 px-8 backdrop-blur-md">
            {/* Breadcrumbs */}
            <div className="flex items-center gap-2 text-xs font-medium">
                <Home size={14} className="text-slate-400" />
                {breadcrumbs.map((item, index) => (
                    <React.Fragment key={item}>
                        <ChevronRight size={14} className="text-slate-300" />
                        <span className={index === breadcrumbs.length - 1 ? "text-erp-navy font-bold" : "text-slate-500"}>
                            {item}
                        </span>
                    </React.Fragment>
                ))}
            </div>

            {/* Tools & Profile */}
            <div className="flex items-center gap-6">
                <div className="relative hidden lg:block">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Tìm kiếm giao dịch..."
                        className="h-9 w-64 rounded-lg border border-slate-200 bg-slate-50 pl-10 pr-4 text-xs font-medium outline-none focus:border-erp-blue focus:bg-white transition-all"
                    />
                </div>

                <div className="flex items-center gap-1">
                    <button className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-erp-navy transition-colors">
                        <Globe size={18} />
                    </button>
                    <button className="relative flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-erp-navy transition-colors">
                        <Bell size={18} />
                        {pendingCount > 0 && (
                            <span className="absolute top-2 right-2 flex h-4 w-4 items-center justify-center rounded-full bg-red-600 border-2 border-white text-[9px] font-bold text-white">
                                {pendingCount}
                            </span>
                        )}
                    </button>
                </div>

                <div className="h-6 w-px bg-slate-200"></div>

            </div>
        </header>
    );
}
