"use client";

import React from "react";
import {
    LayoutDashboard, ShoppingCart, CheckSquare, Truck,
    FileCheck, ShieldAlert, Users, Settings, LogOut,
    FolderTree, Search, ChevronRight, ClipboardCheck, ShoppingBag, Building, DollarSign
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
        roles: ["REQUESTER", "MANAGER", "DEPT_APPROVER", "DIRECTOR", "PROCUREMENT", "PLATFORM_ADMIN", "CEO", "FINANCE"],
        items: [
            { name: "Bảng điều khiển", icon: LayoutDashboard, path: "/", roles: ["REQUESTER", "MANAGER", "DEPT_APPROVER", "DIRECTOR", "PROCUREMENT", "PLATFORM_ADMIN", "WAREHOUSE", "FINANCE", "CEO", "QA"] },
            { name: "Yêu cầu mua hàng (PR)", icon: FolderTree, path: "/pr", roles: ["REQUESTER", "MANAGER", "DEPT_APPROVER", "DIRECTOR", "PROCUREMENT", "PLATFORM_ADMIN", "FINANCE"] },
            { name: "Yêu cầu báo giá (QR)", icon: ShoppingBag, path: "/quote-requests", roles: ["REQUESTER", "PLATFORM_ADMIN"] },
            { name: "Kiểm soát PR", icon: ClipboardCheck, path: "/procurement/prs", roles: ["PROCUREMENT", "PLATFORM_ADMIN", "FINANCE"] },
        ]
    },
    {
        group: "Quản lý Đơn hàng", 
        roles: ["PROCUREMENT", "PLATFORM_ADMIN", "FINANCE"],
        items: [
            { name: "Đơn đặt hàng (PO)", icon: ShoppingBag, path: "/procurement/pos", roles: ["PROCUREMENT", "PLATFORM_ADMIN"] },
            { name: "Theo dõi giao hàng", icon: Truck, path: "/procurement/delivery", roles: ["PROCUREMENT", "PLATFORM_ADMIN"] },
            { name: "Điều chỉnh PO (Amendments)", icon: ShieldAlert, path: "/procurement/amendments", roles: ["PROCUREMENT", "PLATFORM_ADMIN"] },
        ]
    },
    {
        group: "Nguồn hàng", 
        roles: ["PROCUREMENT", "PLATFORM_ADMIN"],
        items: [
            { name: "Nguồn hàng & Báo giá", icon: Search, path: "/sourcing", roles: ["PROCUREMENT", "PLATFORM_ADMIN"] },
        ]
    },
    {
        group: "Trung tâm Phê duyệt", 
        roles: ["MANAGER", "DEPT_APPROVER", "FINANCE", "DIRECTOR", "CEO", "PLATFORM_ADMIN"],
        items: [
            { name: "Phê duyệt PR", icon: CheckSquare, path: "/approvals", roles: ["MANAGER", "DEPT_APPROVER", "FINANCE", "DIRECTOR", "CEO"] },
            { name: "Phê duyệt PO", icon: ShoppingCart, path: "/manager/po-approvals", roles: ["DEPT_APPROVER", "FINANCE", "DIRECTOR"] },
            { name: "Phê duyệt Thanh toán", icon: FileCheck, path: "/payments", roles: ["FINANCE", "DIRECTOR"] },
            { name: "Lịch sử phê duyệt", icon: ClipboardCheck, path: "/manager/approval-history", roles: ["DEPT_APPROVER", "DIRECTOR", "CEO"] },
        ]
    },
    {
        group: "Quản lý Ngân sách", 
        roles: ["DEPT_APPROVER", "FINANCE", "PLATFORM_ADMIN", "DIRECTOR"],
        items: [
            { name: "Lập ngân sách", icon: Building, path: "/manager/budget-planning", roles: ["DEPT_APPROVER", "PLATFORM_ADMIN"] },
            { name: "Theo dõi chi tiêu", icon: DollarSign, path: "/manager/spend-tracking", roles: ["DEPT_APPROVER", "FINANCE", "PLATFORM_ADMIN"] },
            { name: "Cảnh báo vượt ngân sách", icon: ShieldAlert, path: "/manager/budget-alerts", roles: ["DEPT_APPROVER", "PLATFORM_ADMIN"] },
        ]
    },
    {
        group: "Báo cáo", 
        roles: ["MANAGER", "DEPT_APPROVER", "FINANCE", "DIRECTOR", "PLATFORM_ADMIN", "CEO"],
        items: [
            { name: "Báo cáo Chi phí", icon: ClipboardCheck, path: "/reports/spend", roles: ["FINANCE", "DIRECTOR"] },
            { name: "Báo cáo Công nợ", icon: FolderTree, path: "/reports/ap", roles: ["FINANCE", "DIRECTOR"] },
        ]
    },
    {
        group: "Hệ thống", 
        roles: ["PLATFORM_ADMIN"],
        items: [
            { name: "Quản lý Nhà cung cấp", icon: Truck, path: "/admin/suppliers", roles: ["PLATFORM_ADMIN"] },
            { name: "Danh mục sản phẩm", icon: ShoppingBag, path: "/admin/products", roles: ["PLATFORM_ADMIN"] },
            { name: "Quản lý nhân sự", icon: Users, path: "/users", roles: ["PLATFORM_ADMIN"] },
            { name: "Quản lý Tổ chức", icon: LayoutDashboard, path: "/admin/organizations", roles: ["PLATFORM_ADMIN"] },
            { name: "Quản lý Phòng ban", icon: Building, path: "/admin/departments", roles: ["PLATFORM_ADMIN"] },
            { name: "Quản lý Cost Center", icon: ShieldAlert, path: "/admin/cost-centers", roles: ["PLATFORM_ADMIN"] },
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
    const pathname = usePathname() || "/";
    const { currentUser, logout } = useProcurement();

    // Fix lint: ensure role exists in mapping
    const roleKey = currentUser?.role || "GUEST";
    const roleInfo = roleMapping[roleKey] || { label: "Khách", class: "role-finance" };

    return (
        <aside className="group fixed left-0 top-0 z-50 h-screen w-16 hover:w-64 border-r border-slate-200 bg-white shadow-xl transition-all duration-300 ease-in-out flex flex-col overflow-hidden">
            {/* Logo Section */}
            <div className="flex h-16 items-center px-4 border-b border-slate-100 shrink-0">
                <div className="h-8 w-8 rounded bg-erp-navy flex items-center justify-center shrink-0">
                    <span className="text-white text-xs font-bold">PP</span>
                </div>
                <span className="ml-4 text-sm font-black tracking-tight text-erp-navy opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                    PROCURE<span className="text-erp-blue">PRO</span>
                </span>
            </div>

            {/* Nav */}
            <nav className="mt-4 px-2 space-y-4 flex-1 overflow-y-auto overflow-x-hidden no-scrollbar pb-32">
                {navigation.map((group) => {
                    const userRole = currentUser?.role;
                    const groupVisible = !userRole || group.roles.includes(userRole);
                    if (!groupVisible && userRole !== "PLATFORM_ADMIN") return null;

                    const visibleItems = group.items.filter(item => !userRole || item.roles.includes(userRole));
                    if (visibleItems.length === 0) return null;

                    return (
                        <div key={group.group}>
                            <h3 className="mb-2 px-4 text-[9px] font-black uppercase tracking-widest text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                                {group.group}
                            </h3>
                            <div className="space-y-1.5 ml-1">
                                {visibleItems.map((item) => {
                                    const isActive = pathname === item.path;
                                    return (
                                        <Link
                                            key={item.name}
                                            href={item.path}
                                            className={`sidebar-item ${isActive ? "active" : ""}`}
                                        >
                                            <item.icon size={18} className={`shrink-0 transition-colors ${isActive ? "text-white" : "text-slate-400 group-hover/item:text-erp-navy"}`} />
                                            <span className="ml-4 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap font-bold text-sm tracking-tight">
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
                    <div className="h-10 w-10 rounded-xl bg-erp-navy flex items-center justify-center font-black text-white text-xs shrink-0 shadow-lg shadow-erp-navy/30 border border-white/10">
                        {currentUser?.icon || currentUser?.fullName?.substring(0, 2).toUpperCase() || "GU"}
                    </div>
                    <div className="flex flex-col opacity-0 group-hover:opacity-100 transition-opacity overflow-hidden">
                        <span className="text-xs font-black truncate text-slate-700 leading-none mb-1">{currentUser?.name || currentUser?.fullName || "Jonathan Doe"}</span>
                        <div className="flex">
                            <span className={`role-badge ${roleInfo?.class ?? "bg-slate-400"}`}>
                                {currentUser?.role === "DEPT_APPROVER" ? "MANAGER" : (currentUser?.role === "DIRECTOR" ? "DIRECTOR" : (currentUser?.role || "GUEST"))}
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

