"use client";

import React from "react";
import {
    LayoutDashboard, ShoppingCart, CheckSquare, Truck,
    FileCheck, ShieldAlert, Users, Settings, LogOut,
    FolderTree, Search, Bell, ChevronRight, Globe
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useProcurement } from "../context/ProcurementContext";

const roleMapping: Record<string, { label: string, class: string }> = {
    "Requester": { label: "Người yêu cầu", class: "role-requester" },
    "Approver": { label: "Trưởng phòng", class: "role-approver" },
    "Director": { label: "Giám đốc", class: "role-approver" },
    "Buyer": { label: "Thu mua", class: "role-procurement" },
    "Receiver": { label: "Kho vận", class: "role-warehouse" },
    "Finance": { label: "Tài chính", class: "role-finance" },
    "Admin": { label: "Quản trị viên", class: "role-admin" },
    "Supplier": { label: "Nhà cung cấp", class: "role-supplier" },
};

const navigation = [
    {
        group: "Menu chính", 
        roles: ["Requester", "Approver", "Director", "Buyer", "Admin"],
        items: [
            { name: "Bảng điều khiển", icon: LayoutDashboard, path: "/", roles: ["Requester", "Approver", "Director", "Buyer", "Admin", "Receiver", "Finance"] },
            { name: "Yêu cầu mua hàng (PR)", icon: FolderTree, path: "/pr", roles: ["Requester", "Approver", "Director", "Buyer", "Admin"] },
            { name: "Phê duyệt", icon: CheckSquare, path: "/approvals", roles: ["Approver", "Director", "Admin"] },
            { name: "Nguồn hàng & Báo giá", icon: Search, path: "/sourcing", roles: ["Buyer", "Admin"] },
        ]
    },
    {
        group: "Nghiệp vụ Mua hàng & Kho", 
        roles: ["Buyer", "Receiver", "Admin"],
        items: [
            { name: "Đơn mua hàng (PO)", icon: ShoppingCart, path: "/po", roles: ["Buyer", "Admin"] },
            { name: "Nhập kho (GRN)", icon: Truck, path: "/grn", roles: ["Receiver", "Admin"] },
        ]
    },
    {
        group: "Kế toán (Finance)", 
        roles: ["Finance"],
        items: [
            { name: "Bàn làm việc Kế toán", icon: LayoutDashboard, path: "/finance/dashboard", roles: ["Finance"] },
            { name: "Xử lý Invoice & Matching", icon: ShieldAlert, path: "/finance/matching", roles: ["Finance"] },
            { name: "Lệnh thanh toán", icon: FileCheck, path: "/payments", roles: ["Finance"] },
        ]
    },
    {
        group: "Hệ thống", 
        roles: ["Admin"],
        items: [
            { name: "Quản lý người dùng", icon: Users, path: "/users", roles: ["Admin"] },
            { name: "Cài đặt hệ thống", icon: Settings, path: "/settings", roles: ["Admin"] },
        ]
    },
    {
        group: "Nhà cung cấp (B2B)", 
        roles: ["Supplier"],
        items: [
            { name: "Bàn làm việc B2B", icon: LayoutDashboard, path: "/supplier/dashboard", roles: ["Supplier"] },
            { name: "Yêu cầu báo giá (RFQ)", icon: FolderTree, path: "/supplier/rfq", roles: ["Supplier"] },
            { name: "Đơn đặt hàng (PO)", icon: ShoppingCart, path: "/supplier/po", roles: ["Supplier"] },
            { name: "Gửi hóa đơn (Invoice)", icon: FileCheck, path: "/supplier/invoice", roles: ["Supplier"] },
        ]
    },
    {
        group: "Kho vận (Warehouse)", 
        roles: ["Receiver"],
        items: [
            { name: "Bàn làm việc Kho", icon: LayoutDashboard, path: "/warehouse/dashboard", roles: ["Receiver"] },
            { name: "Kiểm định & Tạo GRN", icon: FileCheck, path: "/warehouse/grn/new", roles: ["Receiver"] },
        ]
    },
];

export default function Sidebar() {
    const pathname = usePathname();
    const { currentUser, logout } = useProcurement();

    const roleInfo = currentUser ? roleMapping[currentUser.role] : { label: "Khách", class: "role-finance" };

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
                {navigation.map((group) => {
                    const groupVisible = !currentUser || group.roles.includes(currentUser.role);
                    if (!groupVisible && currentUser?.role !== "Admin") return null;

                    const visibleItems = group.items.filter(item => !currentUser || item.roles.includes(currentUser.role));
                    if (visibleItems.length === 0) return null;

                    return (
                        <div key={group.group}>
                            <h3 className="mb-2 px-4 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                                {group.group}
                            </h3>
                            <div className="space-y-1">
                                {visibleItems.map((item) => {
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
                    );
                })}
            </nav>

            {/* Logout / User Info Footer */}
            <div className="absolute bottom-0 w-full border-t border-slate-100 bg-slate-50 p-4">
                <div className="flex items-center gap-3 mb-4">
                    <div className="h-8 w-8 rounded bg-erp-navy flex items-center justify-center font-bold text-white text-[10px] uppercase">
                        {currentUser?.icon || "GU"}
                    </div>
                    <div className="flex flex-col">
                        <span className="text-xs font-bold truncate max-w-[120px]">{currentUser?.name || "Jonathan Doe"}</span>
                        <span className={`role-badge ${roleInfo.class}`}>
                            {roleInfo.label}
                        </span>
                    </div>
                </div>
                <button 
                    onClick={logout}
                    className="flex w-full items-center gap-2 px-2 py-2 text-xs font-bold text-red-600 hover:bg-red-50 rounded transition-colors"
                >
                    <LogOut size={16} />
                    Đăng xuất
                </button>
            </div>
        </aside>
    );
}

