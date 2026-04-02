"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { useProcurement, Notification } from "../context/ProcurementContext";
import Sidebar from "./Sidebar";
import ToastContainer from "./Toast";

export default function AppContent({ children }: { children: React.ReactNode }) {
    const { currentUser, notifications, removeNotification } = useProcurement();
    const pathname = usePathname();
    const router = useRouter();

    const isWhiteListed = pathname === "/login" || pathname === "/register";

    useEffect(() => {
        if (!currentUser && !isWhiteListed) {
            router.push("/login");
        }
        if (currentUser && isWhiteListed) {
            router.push("/");
        }
    }, [currentUser, isWhiteListed, router]);

    if (!currentUser && !isWhiteListed) return null;

    if (isWhiteListed) return <main className="min-h-screen bg-slate-50">{children}</main>;

    return (
        <div className="flex h-screen overflow-hidden bg-slate-50">
            <ToastContainer />

            {/* Sidebar Cố định */}
            <Sidebar />
            
            {/* Vùng nội dung chính */}
            <div className="flex-1 flex flex-col overflow-hidden ml-16 transform-gpu transition-all duration-300">
                {/* Header Doanh nghiệp */}
                <header className="h-16 bg-white/80 backdrop-blur-lg border-b border-slate-100 flex items-center justify-between px-8 z-10 shadow-[0_2px_15px_-3px_rgba(0,0,0,0.02)]">
                    <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-3">
                        <div className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)] animate-pulse"></div>
                        {pathname === "/" ? "Bảng điều khiển Hệ thống" : `MODULE / ${pathname.split('/').filter(Boolean).pop()?.toUpperCase() || ""}`}
                    </div>
                    <div className="flex items-center gap-6">
                        <div className="relative group/notif cursor-pointer">
                           <div className="h-4 w-4 bg-rose-500 rounded-full absolute -top-1 -right-1 border-2 border-white flex items-center justify-center text-[8px] font-black text-white shadow-sm ring-2 ring-rose-500/10">2</div>
                           <div className="text-slate-400 group-hover/notif:text-erp-navy group-hover/notif:scale-110 transition-all">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"></path><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"></path></svg>
                           </div>
                        </div>
                        <div className="flex items-center gap-4 pl-6 border-l border-slate-100">
                            <div className="flex flex-col text-right">
                                <span className="text-[11px] font-black text-erp-navy leading-none mb-1 uppercase tracking-tight">{currentUser?.name || currentUser?.fullName}</span>
                                <span className="text-[8px] font-bold text-slate-400 uppercase tracking-tighter">Hoạt động</span>
                            </div>
                            <div className="h-9 w-9 rounded-xl bg-erp-navy flex items-center justify-center text-white text-[11px] font-black shadow-lg shadow-erp-navy/30 border border-white/10 cursor-pointer hover:scale-105 active:scale-95 transition-all">
                                {currentUser?.icon || currentUser?.fullName?.substring(0, 2).toUpperCase() || "JD"}
                            </div>
                        </div>
                    </div>
                </header>

                {/* Main Content Area */}
                <main className="flex-1 overflow-y-auto p-8 bg-slate-50/50">
                    <div className="max-w-screen-2xl mx-auto pb-12">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
}
