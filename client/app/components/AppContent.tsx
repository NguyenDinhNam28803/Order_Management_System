"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { useProcurement } from "../context/ProcurementContext";
import Sidebar from "./Sidebar";
import ToastContainer from "./Toast";
import SmartSearch from "./SmartSearch";
import GlobalAISearch from "./GlobalAISearch";
import Topbar from "./Topbar";

export default function AppContent({ children }: { children: React.ReactNode }) {
    const { currentUser, isAuthChecking } = useProcurement();
    const pathname = usePathname();
    const router   = useRouter();

    const isWhiteListed = pathname === "/login" || pathname === "/register";

    useEffect(() => {
        if (isAuthChecking) return;
        if (!currentUser && !isWhiteListed) router.push("/login");
        if (currentUser  && isWhiteListed)  router.push("/");
    }, [currentUser, isAuthChecking, isWhiteListed, router]);

    // ── Auth checking loading screen ──
    if (isAuthChecking) {
        return (
            <div className="min-h-screen bg-[#0D1117] flex items-center justify-center">
                <div className="flex flex-col items-center gap-5">
                    {/* Branded spinner */}
                    <div className="relative">
                        <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-[#3B82F6] to-[#6366F1] flex items-center justify-center shadow-2xl shadow-blue-500/30">
                            <span className="text-white text-[13px] font-black tracking-tight select-none">PS</span>
                        </div>
                        {/* Ring spinner */}
                        <div className="absolute inset-0 rounded-2xl border-2 border-transparent border-t-[#3B82F6] animate-spin" />
                    </div>
                    <div className="flex flex-col items-center gap-1">
                        <span className="text-[#E6EDF3] text-[13px] font-bold">ProcureSmart ERP</span>
                        <span className="text-[#484F58] text-[9px] font-bold uppercase tracking-[0.18em]">Đang xác thực phiên làm việc…</span>
                    </div>
                    {/* Shimmer bar */}
                    <div className="w-48 h-1 rounded-full bg-[#21262D] overflow-hidden">
                        <div className="h-full w-1/2 skeleton rounded-full" />
                    </div>
                </div>
            </div>
        );
    }

    if (!currentUser && !isWhiteListed) return null;

    // ── Auth pages (login / register) ──
    if (isWhiteListed) return (
        <main className="animate-in fade-in duration-500 min-h-screen bg-[#0D1117] text-[#E6EDF3]">
            {children}
        </main>
    );

    // ── Main app layout ──
    return (
        <div className="flex h-screen overflow-hidden bg-[#0D1117]">
            <ToastContainer />
            <Sidebar />

            <div className="flex-1 flex flex-col h-screen overflow-hidden ml-[180px]">
                <Topbar />
                <main className="flex-1 overflow-y-auto bg-[#0D1117] relative">
                    <div className="w-full p-6 pb-32 animate-fade-in">
                        {children}
                    </div>
                </main>
            </div>

            {/* Floating AI Assistant */}
            <GlobalAISearch />
        </div>
    );
}
