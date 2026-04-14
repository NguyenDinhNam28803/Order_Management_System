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
    const [notificationCount, setNotificationCount] = useState(2); // Real-time count

    // Format pathname to breadcrumb
    const getBreadcrumb = () => {
        if (!pathname || pathname === "/") return "Dashboard";
        const parts = pathname.split("/").filter(Boolean);
        return parts.map(p => p.charAt(0).toUpperCase() + p.slice(1).replace(/-/g, " ")).join(" / ");
    };

    return (
        <header className="sticky top-0 z-40 w-full bg-[#161B22]/95 backdrop-blur-xl border-b border-[rgba(240,246,252,0.1)] h-14 flex items-center justify-between px-5">
            <div className="flex items-center gap-3">
                <div className="flex flex-col">
                    <span className="text-[9px] font-black uppercase tracking-widest text-[#484F58]">ProcurePro ERP</span>
                    <h2 className="text-[13px] font-bold text-[#E6EDF3] tracking-tight leading-tight">{getBreadcrumb()}</h2>
                </div>
            </div>

            <div className="flex items-center gap-3">
                {/* Search */}
                <div className="hidden md:flex relative group">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#484F58] group-focus-within:text-[#2563EB] transition-colors" size={14} />
                    <input
                        type="text"
                        placeholder="Tìm kiếm hệ thống..."
                        className="pl-9 pr-4 py-1.5 bg-[#21262D] border border-[rgba(240,246,252,0.1)] rounded-lg text-xs font-medium text-[#E6EDF3] placeholder:text-[#484F58] focus:outline-none focus:border-[#2563EB]/50 focus:ring-1 focus:ring-[#2563EB]/30 w-56 transition-all"
                    />
                </div>

                {/* Notification Inbox */}
                <NotificationInbox />

                {/* System Notifications Bell */}
                <div className="relative">
                    <button
                        onClick={() => setShowNotifications(!showNotifications)}
                        className="relative flex items-center justify-center w-8 h-8 rounded-lg bg-[#21262D] border border-[rgba(240,246,252,0.1)] text-[#8B949E] hover:text-[#E6EDF3] hover:border-[#2563EB]/40 transition-all focus:outline-none"
                    >
                        <Bell size={15} />
                        {notificationCount > 0 && (
                            <span className="absolute -top-0.5 -right-0.5 min-w-4 h-4 px-1 flex items-center justify-center bg-rose-500 text-white text-[9px] font-bold rounded-full border border-[#161B22]">
                                {notificationCount > 9 ? "9+" : notificationCount}
                            </span>
                        )}
                    </button>
                    {showNotifications && (
                        <div className="absolute right-0 mt-2 w-72 bg-[#21262D] border border-[rgba(240,246,252,0.1)] rounded-xl shadow-xl shadow-black/50 overflow-hidden z-50">
                            <div className="p-3 border-b border-[rgba(240,246,252,0.1)]">
                                <h4 className="text-sm font-bold text-[#E6EDF3]">Thông báo hệ thống</h4>
                                <p className="text-[10px] text-[#484F58]">{notificationCount} thông báo mới</p>
                            </div>
                            <div className="max-h-60 overflow-y-auto">
                                {notificationCount === 0 ? (
                                    <div className="text-xs text-[#484F58] text-center p-4">
                                        Không có thông báo mới
                                    </div>
                                ) : (
                                    Array.from({ length: notificationCount }).map((_, i) => (
                                        <div key={i} className="p-3 border-b border-[rgba(240,246,252,0.05)] hover:bg-[rgba(37,99,235,0.06)] transition-colors cursor-pointer">
                                            <p className="text-xs text-[#E6EDF3] font-medium">Thông báo hệ thống #{i + 1}</p>
                                            <p className="text-[10px] text-[#484F58] mt-0.5">Vừa xong</p>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* User Profile */}
                <div className="flex items-center gap-2.5 pl-3 border-l border-[rgba(240,246,252,0.1)] cursor-pointer hover:bg-[rgba(240,246,252,0.04)] px-2.5 py-1.5 rounded-lg transition-all">
                    <div className="h-7 w-7 rounded-md bg-[#2563EB]/15 border border-[#2563EB]/30 flex items-center justify-center text-[#60A5FA] font-black text-[11px]">
                        {currentUser?.fullName?.charAt(0) || <User size={14} />}
                    </div>
                    <div className="hidden md:flex flex-col">
                        <span className="text-[11px] font-bold text-[#E6EDF3] leading-tight">{currentUser?.fullName || "Guest"}</span>
                        <span className="text-[9px] font-semibold uppercase tracking-widest text-[#484F58]">{currentUser?.role?.replace(/_/g, ' ') || "No Role"}</span>
                    </div>
                    <ChevronDown size={12} className="text-[#484F58]" />
                </div>
            </div>
        </header>
    );
}
