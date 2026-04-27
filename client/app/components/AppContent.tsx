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

    const isAuthPage = pathname === "/login" || pathname === "/register";

    // Public routes không cần đăng nhập: auth pages + magic-link external pages
    const isExternalPage =
        pathname.startsWith("/rfq/quote") ||
        pathname.startsWith("/po/confirm") ||
        pathname.startsWith("/grn/update") ||
        pathname.startsWith("/invoice/submit");

    const isWhiteListed = isAuthPage || isExternalPage;

    useEffect(() => {
        if (isAuthChecking) return;
        if (!currentUser && !isWhiteListed) router.push("/login");
        if (currentUser  && isAuthPage)     router.push("/");   // chỉ redirect login/register, không redirect external pages
    }, [currentUser, isAuthChecking, isWhiteListed, isAuthPage, router]);

    // ── Auth checking loading screen (skip với external magic-link pages) ──
    if (isAuthChecking && !isExternalPage) {
        return (
            <div className="min-h-screen bg-[#FFFFFF] flex items-center justify-center">
                <div className="flex flex-col items-center gap-5">
                    {/* Branded spinner */}
                    <div className="relative">
                        <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-[#B4533A] to-[#6366F1] flex items-center justify-center shadow-2xl shadow-[#B4533A]/30">
                            <span className="text-[#000000] text-[13px] font-black tracking-tight select-none">PS</span>
                        </div>
                        {/* Ring spinner */}
                        <div className="absolute inset-0 rounded-2xl border-2 border-transparent border-t-[#B4533A] animate-spin" />
                    </div>
                    <div className="flex flex-col items-center gap-1">
                        <span className="text-[#000000] text-[13px] font-bold">ProcureSmart ERP</span>
                        <span className="text-[#000000] text-[9px] font-bold uppercase tracking-[0.18em]">Đang xác thực phiên làm việc…</span>
                    </div>
                    {/* Shimmer bar */}
                    <div className="w-48 h-1 rounded-full bg-[#FFFFFF] overflow-hidden">
                        <div className="h-full w-1/2 skeleton rounded-full" />
                    </div>
                </div>
            </div>
        );
    }

    if (!currentUser && !isWhiteListed) return null;

    // ── Auth pages + external magic-link pages (không sidebar, không topbar) ──
    if (isWhiteListed) return (
        <main className="animate-in fade-in duration-500 min-h-screen bg-[#FFFFFF] text-[#000000]">
            {children}
        </main>
    );

    // ── Main app layout ──
    return (
        <div className="flex h-screen overflow-hidden bg-[#FFFFFF]">
            <ToastContainer />
            <Sidebar />

            <div className="flex-1 flex flex-col h-screen overflow-hidden ml-[180px]">
                <Topbar />
                <main className="flex-1 overflow-y-auto bg-[#FFFFFF] relative">
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

