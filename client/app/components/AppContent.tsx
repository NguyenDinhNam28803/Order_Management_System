"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { useProcurement, Notification } from "../context/ProcurementContext";
import Sidebar from "./Sidebar";

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
            {/* Toast Notifications */}
            <div className="fixed top-6 right-6 z-[9999] flex flex-col gap-3 pointer-events-none">
                {notifications && (notifications as Notification[])
                    .filter((n: Notification) => !n.role || n.role === currentUser?.role)
                    .map((n: Notification) => (
                    <div 
                        key={n.id}
                        className={`pointer-events-auto min-w-[320px] p-5 rounded-[24px] shadow-2xl border border-white/20 backdrop-blur-xl animate-in slide-in-from-right-8 duration-500 overflow-hidden flex items-center gap-4 cursor-pointer hover:scale-[1.02] transition-transform ${
                            n.type === 'success' ? 'bg-emerald-500/95 text-white shadow-emerald-200/40' :
                            n.type === 'error' ? 'bg-red-500/95 text-white shadow-red-200/40' :
                            n.type === 'warning' ? 'bg-amber-400/95 text-erp-navy shadow-amber-200/40' :
                            'bg-erp-blue/95 text-white shadow-erp-blue/20'
                        }`}
                        onClick={() => removeNotification(n.id)}
                    >
                        <div className="h-10 w-10 rounded-2xl bg-white/20 flex items-center justify-center shrink-0">
                            {n.type === 'success' && <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24"><path d="M5 13l4 4L19 7"></path></svg>}
                            {n.type === 'error' && <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24"><path d="M18 6L6 18M6 6l12 12"></path></svg>}
                            {n.type === 'warning' && <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24"><path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>}
                            {n.type === 'info' && <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24"><path d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>}
                        </div>
                        <div className="flex-1 text-sm font-black uppercase tracking-tight leading-tight">
                            {n.message}
                        </div>
                        <div className="ml-2 h-6 w-6 rounded-full hover:bg-white/10 flex items-center justify-center opacity-50 hover:opacity-100 transition-opacity">
                            <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24"><path d="M18 6L6 18M6 6l12 12"></path></svg>
                        </div>
                    </div>
                ))}
            </div>

            {/* Sidebar Cố định */}
            <Sidebar />
            
            {/* Vùng nội dung chính */}
            <div className="flex-1 flex flex-col overflow-hidden ml-16 transition-all duration-300">
                {/* Header Doanh nghiệp */}
                <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8 z-10 shadow-sm">
                    <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></div>
                        {pathname === "/" ? "Bảng điều khiển Hệ thống" : `MODULE / ${pathname.split('/').pop()?.toUpperCase() || ""}`}
                    </div>
                    <div className="flex items-center gap-6">
                        <div className="relative">
                           <div className="h-4 w-4 bg-red-500 rounded-full absolute -top-1 -right-1 border-2 border-white flex items-center justify-center text-[8px] font-bold text-white">2</div>
                           <div className="text-slate-400 hover:text-erp-navy transition-colors cursor-pointer">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"></path><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"></path></svg>
                           </div>
                        </div>
                        <div className="flex items-center gap-3 pl-6 border-l border-slate-100">
                            <div className="flex flex-col text-right">
                                <span className="text-xs font-black text-slate-700 leading-none">{currentUser?.name || currentUser?.fullName}</span>
                                <span className="text-[8px] font-bold text-slate-400 uppercase tracking-tighter">Hoạt động</span>
                            </div>
                            <div className="h-9 w-9 rounded-xl bg-erp-navy flex items-center justify-center text-white text-[11px] font-black shadow-lg shadow-erp-navy/20 cursor-pointer hover:scale-105 transition-transform">
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
