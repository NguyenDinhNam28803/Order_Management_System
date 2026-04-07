"use client";

import React, { useState } from "react";
import {
    Bell, Globe, Search, ChevronRight, Home, LogOut, Sparkles
} from "lucide-react";
import { useProcurement, PR } from "../context/ProcurementContext";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";

const RAGChat = dynamic(() => import("./RAGChat"), { ssr: false });

export default function ERPHeader({ breadcrumbs = ["Tài chính", "Khoản phải trả", "Đối soát 3 bên"] }: { breadcrumbs?: string[] }) {
    const { currentUser, logout, prs, apiFetch } = useProcurement();
    const router = useRouter();

    const [isSearchOpen, setIsSearchOpen] = useState(false);

    const pendingCount = prs.filter((pr: PR) => {
        if (!currentUser) return false;
        if (currentUser.role === "REQUESTER") return pr.status === "PENDING";
        if (currentUser.role === "DIRECTOR") return pr.status === "PENDING_DIRECTOR";
        return pr.status === "PENDING";
    }).length;

    return (
        <header className="sticky top-0 z-40 flex h-16 w-full items-center justify-between border-b border-[rgba(148,163,184,0.1)] bg-[#161922]/80 px-8 backdrop-blur-xl">
            {/* Breadcrumbs */}
            <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-[#64748B]">
                <Home size={14} className="text-[#64748B]" />
                {breadcrumbs.map((item, index) => (
                    <React.Fragment key={item}>
                        <ChevronRight size={12} className="text-[#64748B]" />
                        <span className={index === breadcrumbs.length - 1 ? "text-[#F8FAFC] font-bold" : "text-[#64748B]"}>
                            {item}
                        </span>
                    </React.Fragment>
                ))}
            </div>

            {/* Hub Tools */}
            <div className="flex items-center gap-6">
                {/* Smart Search AI Trigger */}
                <div className="relative">
                    <div 
                        onClick={() => setIsSearchOpen(true)}
                        className="group flex items-center gap-3 h-10 w-72 rounded-xl border border-[rgba(148,163,184,0.1)] bg-[#161922] px-4 cursor-pointer hover:border-[rgba(59,130,246,0.3)] hover:bg-[#1A1D23] transition-all shadow-sm"
                    >
                        <Sparkles size={16} className="text-[#3B82F6] group-hover:scale-110 transition-transform" />
                        <span className="text-xs text-[#64748B] font-medium">Hỏi AI về ngân sách & quy trình...</span>
                        <div className="ml-auto bg-[#0F1117] border border-[rgba(148,163,184,0.1)] px-1.5 py-0.5 rounded text-[9px] font-bold text-[#64748B] shadow-xs">⌘K</div>
                    </div>

                    {/* RAG Chat Modal */}
                    {isSearchOpen && (
                        <RAGChat 
                            apiFetch={apiFetch} 
                            onClose={() => setIsSearchOpen(false)} 
                        />
                    )}
                </div>

                <div className="flex items-center gap-1">
                    <button className="flex h-9 w-9 items-center justify-center rounded-xl text-[#64748B] hover:bg-[#1A1D23] hover:text-[#3B82F6] transition-colors">
                        <Globe size={18} />
                    </button>
                    <button className="relative flex h-9 w-9 items-center justify-center rounded-xl text-[#64748B] hover:bg-[#1A1D23] hover:text-[#3B82F6] transition-colors">
                        <Bell size={18} />
                        {pendingCount > 0 && (
                            <span className="absolute top-2 right-2 flex h-4 w-4 items-center justify-center rounded-full bg-rose-600 border-2 border-[#0F1117] text-[9px] font-bold text-white scale-110">
                                {pendingCount}
                            </span>
                        )}
                    </button>
                </div>

                <div className="h-6 w-px bg-[rgba(148,163,184,0.1)]"></div>

                <div className="flex items-center gap-3">
                    <div className="text-right flex flex-col">
                        <span className="text-[11px] font-bold text-[#F8FAFC] leading-tight">{currentUser?.fullName || "User"}</span>
                        <span className="text-[9px] font-bold text-[#3B82F6] tracking-wider uppercase opacity-80">{currentUser?.role || "GUEST"}</span>
                    </div>
                    <div className="h-10 w-10 rounded-2xl bg-[#1A1D23] border border-[rgba(148,163,184,0.1)] flex items-center justify-center text-[#3B82F6] font-bold shadow-sm">
                        {currentUser?.fullName?.charAt(0) || "U"}
                    </div>
                </div>

            </div>
        </header>
    );
}
