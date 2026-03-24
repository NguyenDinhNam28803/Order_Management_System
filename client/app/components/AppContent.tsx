"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { useProcurement } from "../context/ProcurementContext";
import Sidebar from "./Sidebar";

export default function AppContent({ children }: { children: React.ReactNode }) {
    const { currentUser } = useProcurement();
    const pathname = usePathname();
    const router = useRouter();

    const isWhiteListed = pathname === "/login" || pathname === "/register";

    useEffect(() => {
        if (!currentUser && !isWhiteListed) {
            router.push("/login");
        }
    }, [currentUser, isWhiteListed, router]);

    if (!currentUser && !isWhiteListed) return null;

    if (isWhiteListed) return <main className="min-h-screen bg-slate-50">{children}</main>;

    return (
        <div className="flex h-screen overflow-hidden bg-slate-50">
            {/* Sidebar Cố định */}
            <Sidebar />
            
            {/* Vùng nội dung chính */}
            <div className="flex-1 flex flex-col overflow-hidden ml-16 transition-all duration-300">
                {/* Header Doanh nghiệp */}
                <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8 z-10">
                    <div className="text-sm font-bold text-slate-400 uppercase tracking-widest">
                        {pathname === "/" ? "Bảng điều khiển" : pathname.replace("/", "").toUpperCase()}
                    </div>
                    <div className="flex items-center gap-4">
                        <span className="text-xs font-bold text-slate-600">{currentUser?.name}</span>
                        <div className="h-8 w-8 rounded-full bg-erp-navy flex items-center justify-center text-white text-[10px] font-black">
                            {currentUser?.icon}
                        </div>
                    </div>
                </header>

                {/* Main Content Area */}
                <main className="flex-1 overflow-y-auto p-8">
                    <div className="max-w-7xl mx-auto">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
}
