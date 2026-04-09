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

            {/* Sidebar - Fixed on left */}
            <Sidebar />

            {/* Main Content Area - Responsive width */}
            <div className="flex-1 flex flex-col h-screen overflow-hidden ml-16 transform-gpu transition-all duration-300">
                <Topbar />
                <main className="flex-1 overflow-y-auto bg-[#0F1117] relative">
                    <div className="w-full p-6 pb-32">
                        {children}
                    </div>
                </main>
            </div>

            {/* Global AI Search - Available on all pages */}
            <GlobalAISearch />
        </div>
    );
}
