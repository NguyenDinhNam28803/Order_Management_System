"use client";

import React from "react";
import {
    LayoutDashboard, ShoppingCart, CheckSquare, Truck,
    FileCheck, ShieldAlert, Users, Settings, LogOut,
    FolderTree, Search, ChevronRight, ClipboardCheck, ShoppingBag
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useProcurement } from "../context/ProcurementContext";

const roleMapping: Record<string, { label: string, class: string }> = {
    "REQUESTER": { label: "Người yêu cầu", class: "role-requester" },
    "DEPT_APPROVER": { label: "Trưởng phòng", class: "role-approver" },
    "DIRECTOR": { label: "Giám đốc", class: "role-approver" },
    "CEO": { label: "CEO / Board", class: "role-admin" },
    "PROCUREMENT": { label: "Thu mua", class: "role-procurement" },
    "WAREHOUSE": { label: "Kho vận", class: "role-warehouse" },
    "QA": { label: "Kiểm soát CL", class: "role-warehouse" },
    "FINANCE": { label: "Tài chính", class: "role-finance" },
    "PLATFORM_ADMIN": { label: "Quản trị viên", class: "role-admin" },
    "SUPPLIER": { label: "Nhà cung cấp", class: "role-supplier" },
    "SYSTEM": { label: "Hệ thống AI", class: "role-admin" },
};

const navigation = [
    {
        group: "Menu chính", 
        roles: ["REQUESTER", "DEPT_APPROVER", "DIRECTOR", "PROCUREMENT", "PLATFORM_ADMIN", "CEO"],
        items: [
            { name: "Bảng điều khiển", icon: LayoutDashboard, path: "/", roles: ["REQUESTER", "DEPT_APPROVER", "DIRECTOR", "PROCUREMENT", "PLATFORM_ADMIN", "WAREHOUSE", "FINANCE", "CEO", "QA"] },
            { name: "Yêu cầu mua hàng (PR)", icon: FolderTree, path: "/pr", roles: ["REQUESTER", "DEPT_APPROVER", "DIRECTOR", "PROCUREMENT", "PLATFORM_ADMIN"] },
            { name: "Kiểm soát PR", icon: ClipboardCheck, path: "/procurement/prs", roles: ["PROCUREMENT", "PLATFORM_ADMIN"] },
            { name: "Phê duyệt", icon: CheckSquare, path: "/approvals", roles: ["DEPT_APPROVER", "DIRECTOR", "PLATFORM_ADMIN", "CEO"] },
            { name: "Nguồn hàng & Báo giá", icon: Search, path: "/sourcing", roles: ["PROCUREMENT", "PLATFORM_ADMIN"] },
        ]
    },
    {
        group: "Nghiệp vụ Mua hàng & Kho", 
        roles: ["PROCUREMENT", "WAREHOUSE", "PLATFORM_ADMIN"],
        items: [
            { name: "Đơn mua hàng (PO)", icon: ShoppingCart, path: "/po", roles: ["PROCUREMENT", "PLATFORM_ADMIN"] },
            { name: "Nhập kho (GRN)", icon: Truck, path: "/grn", roles: ["WAREHOUSE", "PLATFORM_ADMIN"] },
        ]
    },
    {
        group: "Kế toán (Finance)", 
        roles: ["FINANCE", "PLATFORM_ADMIN"],
        items: [
            { name: "Bàn làm việc Kế toán", icon: LayoutDashboard, path: "/finance/dashboard", roles: ["FINANCE"] },
            { name: "Xử lý Invoice & Matching", icon: ShieldAlert, path: "/finance/matching", roles: ["FINANCE"] },
            { name: "Lệnh thanh toán", icon: FileCheck, path: "/payments", roles: ["FINANCE"] },
        ]
    },
    {
        group: "Hệ thống", 
        roles: ["PLATFORM_ADMIN"],
        items: [
            { name: "Quản lý người dùng", icon: Users, path: "/users", roles: ["PLATFORM_ADMIN"] },
            { name: "Danh mục sản phẩm", icon: ShoppingBag, path: "/admin/products", roles: ["PLATFORM_ADMIN"] },
            { name: "Cài đặt hệ thống", icon: Settings, path: "/settings", roles: ["PLATFORM_ADMIN"] },
        ]
    },
    {
        group: "Nhà cung cấp (B2B)", 
        roles: ["SUPPLIER"],
        items: [
            { name: "Bàn làm việc B2B", icon: LayoutDashboard, path: "/supplier/dashboard", roles: ["SUPPLIER"] },
            { name: "Yêu cầu báo giá (RFQ)", icon: FolderTree, path: "/supplier/rfq", roles: ["SUPPLIER"] },
            { name: "Đơn đặt hàng (PO)", icon: ShoppingCart, path: "/supplier/po", roles: ["SUPPLIER"] },
            { name: "Gửi hóa đơn (Invoice)", icon: FileCheck, path: "/supplier/invoice", roles: ["SUPPLIER"] },
        ]
    },
    {
        group: "Kho vận (Warehouse)", 
        roles: ["WAREHOUSE"],
        items: [
            { name: "Bàn làm việc Kho", icon: LayoutDashboard, path: "/warehouse/dashboard", roles: ["WAREHOUSE"] },
            { name: "Kiểm định & Tạo GRN", icon: FileCheck, path: "/warehouse/grn/new", roles: ["WAREHOUSE"] },
        ]
    },
];

export default function Sidebar() {
    const pathname = usePathname();
    const { currentUser, logout } = useProcurement();

    const roleInfo = currentUser ? roleMapping[currentUser.role] : { label: "Khách", class: "role-finance" };

    return (
        <aside className="group fixed left-0 top-0 z-50 h-screen w-16 hover:w-64 border-r border-slate-200 bg-white shadow-xl transition-all duration-300 ease-in-out overflow-hidden">
            {/* Logo Section */}
            <div className="flex h-16 items-center px-4 border-b border-slate-100">
                <div className="h-8 w-8 rounded bg-erp-navy flex items-center justify-center shrink-0">
                    <span className="text-white text-xs font-bold">PP</span>
                </div>
                <span className="ml-4 text-sm font-black tracking-tight text-erp-navy opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                    PROCURE<span className="text-erp-blue">PRO</span>
                </span>
            </div>

            {/* Nav */}
            <nav className="mt-4 px-2 space-y-4">
                {navigation.map((group) => {
                    const groupVisible = !currentUser || group.roles.includes(currentUser.role);
                    if (!groupVisible && currentUser?.role !== "PLATFORM_ADMIN") return null;

                    const visibleItems = group.items.filter(item => !currentUser || item.roles.includes(currentUser.role));
                    if (visibleItems.length === 0) return null;

                    return (
                        <div key={group.group}>
                            <h3 className="mb-2 px-4 text-[9px] font-black uppercase tracking-widest text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                                {group.group}
                            </h3>
                            <div className="space-y-1">
                                {visibleItems.map((item) => {
                                    const isActive = pathname === item.path;
                                    return (
                                        <Link
                                            key={item.name}
                                            href={item.path}
                                            className={`flex items-center p-3 rounded-xl transition-all group/item ${
                                                isActive ? "bg-erp-navy text-white shadow-lg shadow-erp-navy/20" : "text-slate-400 hover:bg-slate-50 hover:text-erp-navy"
                                            }`}
                                        >
                                            <item.icon size={20} className="shrink-0" />
                                            <span className="ml-4 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap font-bold text-sm">
                                                {item.name}
                                            </span>
                                            {isActive && <ChevronRight size={14} className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />}
                                        </Link>
                                    );
                                })}
                            </div>
                        </div>
                    );
                })}
            </nav>

            {/* Logout / User Info Footer */}
            <div className="absolute bottom-0 w-full border-t border-slate-100 bg-slate-50 p-3">
                <div className="flex items-center gap-3 mb-2">
                    <div className="h-10 w-10 rounded-xl bg-erp-navy flex items-center justify-center font-black text-white text-xs shrink-0 shadow-lg shadow-erp-navy/20">
                        {currentUser?.icon || currentUser?.fullName?.substring(0, 2).toUpperCase() || "GU"}
                    </div>
                    <div className="flex flex-col opacity-0 group-hover:opacity-100 transition-opacity overflow-hidden">
                        <span className="text-xs font-black truncate text-slate-700">{currentUser?.name || currentUser?.fullName || "Jonathan Doe"}</span>
                        <div className="flex">
                            <span className={`inline-block px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider text-white ${roleInfo?.class ?? "bg-slate-400"}`}>
                                ROLE: {currentUser?.role === "DEPT_APPROVER" ? "MANAGER" : (currentUser?.role === "DIRECTOR" ? "DIRECTOR" : (currentUser?.role || "GUEST"))}
                            </span>
                        </div>
                    </div>
                </div>
                <button 
                    onClick={logout}
                    className="flex w-full items-center gap-3 p-3 text-xs font-black uppercase tracking-widest text-red-500 hover:bg-red-50 rounded-xl transition-colors group/logout"
                >
                    <LogOut size={20} className="shrink-0" />
                    <span className="opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                        Đăng xuất
                    </span>
                </button>
            </div>
        </aside>
    );
}

