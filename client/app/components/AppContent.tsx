"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { useProcurement } from "../context/ProcurementContext";
import Sidebar from "./Sidebar";
import ToastContainer from "./Toast";
import SmartSearch from "./SmartSearch";
import NotificationInbox from "./NotificationInbox";

export default function AppContent({ children }: { children: React.ReactNode }) {
    const { currentUser, isAuthChecking } = useProcurement();
    const pathname = usePathname();
    const router = useRouter();

    const isWhiteListed = pathname === "/login" || pathname === "/register";

    useEffect(() => {
        if (isAuthChecking) return;
        
        if (!currentUser && !isWhiteListed) {
            router.push("/login");
        }
        if (currentUser && isWhiteListed) {
            router.push("/");
        }
    }, [currentUser, isAuthChecking, isWhiteListed, router]);

    // Show loading while checking auth
    if (isAuthChecking) {
        return (
            <div className="min-h-screen bg-[#0F1117] flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="h-8 w-8 border-4 border-[#3B82F6]/20 border-t-[#3B82F6] rounded-full animate-spin"></div>
                    <span className="text-[#64748B] text-xs font-bold uppercase tracking-widest">Đang kiểm tra...</span>
                </div>
            </div>
        );
    }

    if (!currentUser && !isWhiteListed) return null;

    if (isWhiteListed) return (
        <main className="animate-in fade-in duration-500 p-6 min-h-screen bg-[#0F1117] text-[#F8FAFC]">
            {children}
        </main>
    );

    return (
        <div className="flex h-screen overflow-hidden bg-[#0F1117]">
            <ToastContainer />

            {/* Sidebar - Dark Theme */}
            <Sidebar />
            
            {/* Main Content Area */}
            <div className="flex-1 flex flex-col overflow-hidden ml-16 transform-gpu transition-all duration-300">
                {/* Enterprise Header - Dark Glassmorphism */}
                <header className="h-16 bg-[#161922]/80 backdrop-blur-xl border-b border-[rgba(148,163,184,0.1)] flex items-center justify-between px-6 z-10">
                    {/* Breadcrumb / Module Title */}
                    <div className="flex items-center gap-3">
                        <div className="h-2 w-2 rounded-full bg-[#10B981] shadow-[0_0_8px_rgba(16,185,129,0.5)] animate-pulse"></div>
                        <span className="text-[10px] font-black text-[#64748B] uppercase tracking-widest">
                            {pathname === "/" ? "Dashboard" : pathname.split('/').filter(Boolean)[0]?.toUpperCase()}
                        </span>
                        {pathname !== "/" && (
                            <>
                                <span className="text-[#64748B]">/</span>
                                <span className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider">
                                    {pathname.split('/').filter(Boolean).pop()?.toUpperCase()}
                                </span>
                            </>
                        )}
                    </div>

                    {/* Right Actions */}
                    <div className="flex items-center gap-3">
                        {/* Smart Search Trigger */}
                        <SmartSearch />
                        
                        {/* Notification Inbox */}
                        <NotificationInbox />
                        
                        {/* User Profile */}
                        <div className="flex items-center gap-3 pl-4 border-l border-[rgba(148,163,184,0.1)]">
                            <div className="flex flex-col text-right">
                                <span className="text-[11px] font-black text-[#F8FAFC] leading-none mb-0.5 uppercase tracking-tight">
                                    {currentUser?.name || currentUser?.fullName}
                                </span>
                                <span className="text-[9px] font-bold text-[#64748B] uppercase tracking-tighter">
                                    {currentUser?.role}
                                </span>
                            </div>
                            <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-[#3B82F6] to-[#8B5CF6] flex items-center justify-center text-white text-[11px] font-black shadow-lg shadow-[#3B82F6]/20 cursor-pointer hover:scale-105 active:scale-95 transition-all">
                                {currentUser?.fullName?.substring(0, 2).toUpperCase() || "U"}
                            </div>
                        </div>
                    </div>
                </header>

                {/* Main Content Area - Dark */}
                <main className="flex-1 overflow-y-auto p-6 bg-[#0F1117]">
                    <div className="max-w-screen-2xl mx-auto pb-12">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
}
