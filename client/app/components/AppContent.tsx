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
            <div className="min-h-screen bg-[#FFFFFF] flex items-center justify-center relative overflow-hidden">
                {/* Background Decoration - Very Subtle */}
                <div className="absolute inset-0 opacity-[0.02]" style={{ backgroundImage: 'radial-gradient(#B4533A 0.5px, transparent 0.5px)', backgroundSize: '24px 24px' }}></div>
                
                <div className="flex flex-col items-center gap-10 relative z-10">
                    {/* Branded Logo - Clean & Static */}
                    <div className="relative">
                        <div className="h-16 w-16 rounded-2xl bg-[#FFFFFF] border-[3px] border-[#B4533A] flex items-center justify-center shadow-xl shadow-[#B4533A]/5 relative overflow-hidden">
                            <span className="text-[#000000] text-lg font-black tracking-tighter select-none">PS</span>
                            {/* Inner Shimmer pulse */}
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#B4533A]/5 to-transparent animate-[shimmer_2s_infinite]" />
                        </div>
                        {/* Subtle Glow */}
                        <div className="absolute -inset-4 bg-[#B4533A]/5 rounded-full blur-xl animate-pulse-slow -z-10"></div>
                    </div>

                    <div className="flex flex-col items-center gap-6">
                        <div className="flex flex-col items-center">
                            <h2 className="text-[#000000] text-base font-black tracking-tight mb-0.5">ProcureSmart</h2>
                            <p className="text-[#B4533A] text-[9px] font-black uppercase tracking-[0.3em] opacity-80">Enterprise ERP System</p>
                        </div>
                        
                        <div className="flex flex-col items-center gap-4">
                            <div className="flex items-center gap-3">
                                <span className="text-[#000000] text-[10px] font-black uppercase tracking-[0.2em] animate-pulse">ĐANG TẢI DỮ LIỆU</span>
                                <div className="flex gap-1">
                                    <div className="w-1 h-1 rounded-full bg-[#B4533A] animate-bounce [animation-delay:-0.3s]"></div>
                                    <div className="w-1 h-1 rounded-full bg-[#B4533A] animate-bounce [animation-delay:-0.15s]"></div>
                                    <div className="w-1 h-1 rounded-full bg-[#B4533A] animate-bounce"></div>
                                </div>
                            </div>
                            
                            {/* LARGE PROMINENT LOADING BAR */}
                            <div className="relative w-72 h-2 bg-[#FAF8F5] rounded-full overflow-hidden border border-[rgba(148,163,184,0.1)] shadow-inner">
                                {/* The animated fill */}
                                <div className="absolute inset-y-0 left-0 bg-[#B4533A] rounded-full animate-[loading-bar_2s_ease-in-out_infinite]" style={{ width: '45%' }}>
                                    {/* Shimmer overlay on the bar itself */}
                                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent animate-[shimmer_1.5s_infinite]"></div>
                                </div>
                            </div>
                            
                            <span className="text-[9px] font-bold text-[#000000]/40 uppercase tracking-widest">Hệ thống đang được khởi tạo, vui lòng đợi...</span>
                        </div>
                    </div>
                </div>

                {/* Footer brand */}
                <div className="absolute bottom-10 left-0 right-0 flex justify-center">
                    <span className="text-[8px] font-bold text-[#000000]/20 uppercase tracking-[0.3em]">REFINED CORPORATE EDITION • 2026</span>
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
                    <div className="w-full p-6 pb-32">
                        {children}
                    </div>
                </main>
            </div>

            {/* Floating AI Assistant */}
            <GlobalAISearch />
        </div>
    );
}

