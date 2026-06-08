"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useProcurement } from "../context/ProcurementContext";
import Sidebar from "./Sidebar";
import ToastContainer from "./Toast";
import GlobalAISearch from "./GlobalAISearch";
import Topbar from "./Topbar";

export default function AppContent({ children }: { children: React.ReactNode }) {
    const { currentUser, isAuthChecking } = useProcurement();
    const pathname = usePathname();
    const router   = useRouter();
    const [sidebarOpen, setSidebarOpen] = useState(false);

    const isAuthPage = pathname === "/login" || pathname === "/register";

    const isExternalPage =
        pathname.startsWith("/rfq/quote") ||
        pathname.startsWith("/po/confirm") ||
        pathname.startsWith("/grn/update") ||
        pathname.startsWith("/invoice/submit");

    const isWhiteListed = isAuthPage || isExternalPage;

    useEffect(() => {
        if (isAuthChecking) return;
        if (!currentUser && !isWhiteListed) router.push("/login");
        if (currentUser  && isAuthPage)     router.push("/");
    }, [currentUser, isAuthChecking, isWhiteListed, isAuthPage, router]);

    // Close sidebar on route change (mobile UX)
    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setSidebarOpen(false);
    }, [pathname]);

    if (isAuthChecking && !isExternalPage) {
        return (
            <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center relative overflow-hidden">
                <div className="absolute inset-0 opacity-[0.025]" style={{ backgroundImage: 'radial-gradient(#2563EB 0.5px, transparent 0.5px)', backgroundSize: '28px 28px' }}></div>

                <div className="flex flex-col items-center gap-10 relative z-10">
                    <div className="relative">
                        <div className="h-16 w-16 rounded-xl bg-white border-[3px] border-[#2563EB] flex items-center justify-center shadow-xl shadow-[#2563EB]/10 relative overflow-hidden">
                            <span className="text-[#0F172A] text-lg font-black tracking-tighter select-none">PS</span>
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#2563EB]/8 to-transparent animate-[shimmer_2s_infinite]" />
                        </div>
                        <div className="absolute -inset-4 bg-[#2563EB]/8 rounded-full blur-xl animate-pulse-slow -z-10"></div>
                    </div>

                    <div className="flex flex-col items-center gap-6">
                        <div className="flex flex-col items-center">
                            <h2 className="text-[#0F172A] text-base font-black tracking-tight mb-0.5">ProcureSmart</h2>
                            <p className="text-[#2563EB] text-[0.6875rem] font-black uppercase tracking-[0.3em] opacity-80">Enterprise ERP System</p>
                        </div>

                        <div className="flex flex-col items-center gap-4">
                            <div className="flex items-center gap-3">
                                <span className="text-[#475569] text-[10px] font-bold uppercase tracking-[0.2em] animate-pulse">ĐANG TẢI DỮ LIỆU</span>
                                <div className="flex gap-1">
                                    <div className="w-1 h-1 rounded-full bg-[#2563EB] animate-bounce [animation-delay:-0.3s]"></div>
                                    <div className="w-1 h-1 rounded-full bg-[#2563EB] animate-bounce [animation-delay:-0.15s]"></div>
                                    <div className="w-1 h-1 rounded-full bg-[#2563EB] animate-bounce"></div>
                                </div>
                            </div>

                            <div className="relative w-72 h-2 bg-[#E2E8F0] rounded-full overflow-hidden">
                                <div className="absolute inset-y-0 left-0 bg-[#2563EB] rounded-full animate-[loading-bar_2s_ease-in-out_infinite]" style={{ width: '45%' }}>
                                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-[shimmer_1.5s_infinite]"></div>
                                </div>
                            </div>

                            <span className="text-[0.6875rem] font-semibold text-[#94A3B8] uppercase tracking-widest">Hệ thống đang được khởi tạo, vui lòng đợi...</span>
                        </div>
                    </div>
                </div>

                <div className="absolute bottom-10 left-0 right-0 flex justify-center">
                    <span className="text-[8px] font-bold text-[#94A3B8]/60 uppercase tracking-[0.3em]">ENTERPRISE BLUE STEEL • 2026</span>
                </div>
            </div>
        );
    }

    if (!currentUser && !isWhiteListed) return null;

    if (isWhiteListed) return (
        <main className="animate-in fade-in duration-500 min-h-screen bg-[#F8FAFC] text-[#0F172A]">
            {children}
        </main>
    );

    return (
        <div className="flex h-screen overflow-hidden bg-[#F8FAFC]">
            <ToastContainer />
            <Sidebar
                isOpen={sidebarOpen}
                onClose={() => setSidebarOpen(false)}
            />

            {/* Main content — offset by sidebar width on md+ */}
            <div className="flex-1 flex flex-col h-screen overflow-hidden md:ml-[180px]">
                <Topbar onMenuClick={() => setSidebarOpen(prev => !prev)} />
                <main className="flex-1 overflow-y-auto bg-[#F8FAFC] relative">
                    <div className="w-full p-4 md:p-6 pb-32">
                        {children}
                    </div>
                </main>
            </div>

            <GlobalAISearch />
        </div>
    );
}
