"use client";

import React from "react";
import {
    LayoutDashboard, ShoppingCart, CheckSquare, Truck,
    FileCheck, Users, Settings, LogOut, FolderTree, Search, ChevronRight
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useProcurement } from "../context/ProcurementContext";

const navigation = [
    { name: "Dashboard", icon: LayoutDashboard, path: "/" },
    { name: "Yêu cầu (PR)", icon: FolderTree, path: "/pr" },
    { name: "Phê duyệt", icon: CheckSquare, path: "/approvals" },
    { name: "Báo giá (RFQ)", icon: Search, path: "/sourcing" },
    { name: "Đơn hàng (PO)", icon: ShoppingCart, path: "/po" },
    { name: "Nhập kho (GRN)", icon: Truck, path: "/grn" },
    { name: "Kế toán", icon: FileCheck, path: "/finance/dashboard" },
    { name: "Người dùng", icon: Users, path: "/users" },
    { name: "Cài đặt", icon: Settings, path: "/settings" },
];

export default function Sidebar() {
    const pathname = usePathname();
    const { logout } = useProcurement();

    return (
        <aside className="group fixed left-0 top-0 z-50 h-screen w-16 hover:w-64 border-r border-slate-200 bg-white shadow-xl transition-all duration-300 ease-in-out overflow-hidden">
            {/* Logo Section */}
            <div className="flex h-16 items-center px-4 border-b border-slate-100">
                <div className="h-8 w-8 rounded bg-erp-navy flex items-center justify-center shrink-0">
                    <span className="text-white text-xs font-bold">PP</span>
                </div>
                <span className="ml-4 text-sm font-black tracking-tight text-erp-navy opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                    PROCUREPRO
                </span>
            </div>

            {/* Nav */}
            <nav className="mt-4 px-2 space-y-1">
                {navigation.map((item) => {
                    const isActive = pathname === item.path;
                    return (
                        <Link
                            key={item.name}
                            href={item.path}
                            className={`flex items-center p-3 rounded-xl transition-all ${
                                isActive ? "bg-erp-navy text-white shadow-lg" : "text-slate-400 hover:bg-slate-50 hover:text-erp-navy"
                            }`}
                        >
                            <item.icon size={20} className="shrink-0" />
                            <span className="ml-4 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap font-bold text-sm">
                                {item.name}
                            </span>
                        </Link>
                    );
                })}
            </nav>

            {/* Logout */}
            <button 
                onClick={logout}
                className="absolute bottom-4 left-0 w-full flex items-center px-5 py-3 text-red-500 hover:text-red-700 transition-colors"
            >
                <LogOut size={20} className="shrink-0" />
                <span className="ml-4 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap font-bold text-sm">
                    Đăng xuất
                </span>
            </button>
        </aside>
    );
}
