"use client";

import { useProcurement } from "../context/ProcurementContext";
import Sidebar from "./Sidebar";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";

export default function AppContent({ children }: { children: React.ReactNode }) {
    const { currentUser } = useProcurement();
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

    if (!currentUser && !isWhiteListed) {
        return null; // Don't show anything while redirecting
    }

    if (isWhiteListed) {
        return <div className="min-h-screen w-full">{children}</div>;
    }

    return (
        <div className="flex">
            <Sidebar />
            <div className="flex-1 ml-64 min-h-screen">
                {children}
            </div>
        </div>
    );
}
