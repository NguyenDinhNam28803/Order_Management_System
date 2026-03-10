"use client";

import React from "react";
import {
    LayoutDashboard, ShoppingCart, CheckSquare, Truck,
    FileCheck, ShieldAlert, Users, Settings, LogOut,
    FolderTree, Search, Bell, ChevronRight, Globe
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const roles = {
    active: "finance",
    list: [
        { id: "requester", name: "Người yêu cầu", color: "role-requester" },
        { id: "approver", name: "Người phê duyệt", color: "role-approver" },
        { id: "procurement", name: "Bộ phận thu mua", color: "role-procurement" },
        { id: "supplier", name: "Nhà cung cấp", color: "role-supplier" },
        { id: "warehouse", name: "Kho hàng", color: "role-warehouse" },
        { id: "finance", name: "Tài chính", color: "role-finance" },
        { id: "admin", name: "Quản trị viên", color: "role-admin" },
    ]
};

const navigation = [
    {
        group: "Menu chính", items: [
            { name: "Bảng điều khiển", icon: LayoutDashboard, path: "/" },
            { name: "Yêu cầu mua hàng (PR)", icon: FolderTree, path: "/pr" },
            { name: "Phê duyệt", icon: CheckSquare, path: "/approvals" },
            { name: "Nguồn hàng & Báo giá", icon: Search, path: "/sourcing" },
        ]
    },
    {
        group: "Nghiệp vụ tài chính", items: [
            { name: "Đơn mua hàng (PO)", icon: ShoppingCart, path: "/po" },
            { name: "Nhập kho (GRN)", icon: Truck, path: "/grn" },
            { name: "Đối soát 3 bên", icon: ShieldAlert, path: "/matching" },
            { name: "Hóa đơn & Thanh toán", icon: FileCheck, path: "/payments" },
        ]
    },
    {
        group: "Hệ thống", items: [
            { name: "Quản lý người dùng", icon: Users, path: "/users" },
            { name: "Cài đặt hệ thống", icon: Settings, path: "/settings" },
        ]
    },
];

export default function Sidebar() {
    const pathname = usePathname();

    return (
        <aside className="fixed left-0 top-0 z-40 h-screen w-64 border-r border-slate-200 bg-white shadow-sm overflow-y-auto">
            {/* Logo Section */}
            <div className="flex h-16 items-center border-b border-slate-100 px-6">
                <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded bg-erp-navy flex items-center justify-center">
                        <span className="text-white text-xs font-bold">PP</span>
                    </div>
                    <span className="text-lg font-black tracking-tight text-erp-navy">
                        PROCURE<span className="text-erp-blue">PRO</span>
                    </span>
                </div>
            </div>

            <nav className="p-4 space-y-6">
                {navigation.map((group) => (
                    <div key={group.group}>
                        <h3 className="mb-2 px-4 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                            {group.group}
                        </h3>
                        <div className="space-y-1">
                            {group.items.map((item) => {
                                const isActive = pathname === item.path;
                                return (
                                    <Link
                                        key={item.name}
                                        href={item.path}
                                        className={`sidebar-item ${isActive ? "active" : ""}`}
                                    >
                                        <item.icon size={18} />
                                        <span>{item.name}</span>
                                        {isActive && <ChevronRight size={14} className="ml-auto" />}
                                    </Link>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </nav>

            {/* Logout / User Info Footer */}
            <div className="absolute bottom-0 w-full border-t border-slate-100 bg-slate-50 p-4">
                <div className="flex items-center gap-3 mb-4">
                    <div className="h-8 w-8 rounded-full bg-slate-300"></div>
                    <div className="flex flex-col">
                        <span className="text-xs font-bold">Jonathan Doe</span>
                        <span className={`role-badge role-finance`}>
                            Tài chính
                        </span>
                    </div>
                </div>
                <button className="flex w-full items-center gap-2 px-2 py-2 text-xs font-bold text-red-600 hover:bg-red-50 rounded transition-colors">
                    <LogOut size={16} />
                    Đăng xuất
                </button>
            </div>
        </aside>
    );
}
