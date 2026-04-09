"use client";

import React, { useState } from "react";
import { useProcurement } from "../context/ProcurementContext";
import { usePathname } from "next/navigation";
import { Bell, Search, Menu, User, ChevronDown } from "lucide-react";
import NotificationInbox from "./NotificationInbox";

export default function Topbar() {
    const { currentUser } = useProcurement();
    const pathname = usePathname();
    const [showNotifications, setShowNotifications] = useState(false);

    // Format pathname to breadcrumb
    const getBreadcrumb = () => {
        if (!pathname || pathname === "/") return "Dashboard";
        const parts = pathname.split("/").filter(Boolean);
        return parts.map(p => p.charAt(0).toUpperCase() + p.slice(1).replace(/-/g, " ")).join(" / ");
    };

    return (
        <header className="sticky top-0 z-40 w-full bg-[#0F1117]/80 backdrop-blur-xl border-b border-[rgba(148,163,184,0.1)] transition-all h-16 flex items-center justify-between px-6">
            <div className="flex items-center gap-4">
                <div className="flex flex-col">
                    <span className="text-[10px] font-black uppercase tracking-widest text-[#64748B]">ProcurePro ERP</span>
                    <h2 className="text-sm font-bold text-[#F8FAFC] tracking-tight">{getBreadcrumb()}</h2>
                </div>
            </div>

            <div className="flex items-center gap-4">
                {/* Search */}
                <div className="hidden md:flex relative group">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#64748B] group-focus-within:text-[#3B82F6] transition-colors" size={16} />
                    <input 
                        type="text" 
                        placeholder="Tìm kiếm hệ thống..." 
                        className="pl-10 pr-4 py-2 bg-[#161922] border border-[rgba(148,163,184,0.1)] rounded-full text-xs font-bold text-[#F8FAFC] placeholder:text-[#64748B] focus:outline-none focus:border-[#3B82F6]/50 focus:ring-1 focus:ring-[#3B82F6]/50 w-64 transition-all"
                    />
                </div>

                {/* Notifications */}
                <div className="relative">
                    <button 
                        onClick={() => setShowNotifications(!showNotifications)}
                        className="relative p-2 rounded-full border border-[rgba(148,163,184,0.1)] bg-[#161922] text-[#64748B] hover:text-[#F8FAFC] hover:border-[#3B82F6]/30 transition-all focus:outline-none"
                    >
                        <Bell size={18} />
                        <span className="absolute top-0 right-0 w-2 h-2 bg-rose-500 rounded-full border border-[#0F1117] animate-pulse"></span>
                    </button>
                    {showNotifications && (
                        <div className="absolute right-0 mt-2 w-80 bg-[#161922] border border-[rgba(148,163,184,0.1)] rounded-2xl shadow-xl shadow-black/50 overflow-hidden z-50">
                            <div className="p-0">
                                <NotificationInbox />
                            </div>
                        </div>
                    )}
                </div>

                {/* User Profile Hook */}
                <div className="flex items-center gap-3 pl-4 border-l border-[rgba(148,163,184,0.1)] cursor-pointer hover:bg-[rgba(148,163,184,0.05)] p-1.5 rounded-xl transition-all">
                    <div className="h-8 w-8 rounded-full bg-[#3B82F6]/10 border border-[#3B82F6]/30 flex items-center justify-center text-[#3B82F6] font-black shadow-inner">
                        {currentUser?.fullName?.charAt(0) || <User size={16} />}
                    </div>
                    <div className="hidden md:flex flex-col">
                        <span className="text-xs font-black text-[#F8FAFC]">{currentUser?.fullName || "Guest"}</span>
                        <span className="text-[9px] font-bold uppercase tracking-widest text-[#64748B]">{currentUser?.role?.replace(/_/g, ' ') || "No Role"}</span>
                    </div>
                    <ChevronDown size={14} className="text-[#64748B]" />
                </div>
            </div>
        </header>
    );
}
