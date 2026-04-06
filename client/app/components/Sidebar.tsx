"use client";

import React from "react";
import {
    LayoutDashboard, ShoppingCart, CheckSquare, Truck,
    FileCheck, ShieldAlert, Users, Settings, LogOut,
    FolderTree, Search, ChevronRight, ClipboardCheck, ShoppingBag, Building, DollarSign, Layers,
    ShieldCheck, MessageSquare, History, FileText,
    Bell, Inbox, Command
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useProcurement } from "../context/ProcurementContext";

const roleMapping: Record<string, { label: string; class: string }> = {
    "REQUESTER": { label: "Người yêu cầu", class: "role-requester" },
    "DEPT_APPROVER": { label: "Trưởng phòng", class: "role-approver" },
    "DIRECTOR": { label: "Giám đốc", class: "role-director" },
    "CEO": { label: "CEO / Board", class: "role-ceo" },
    "PROCUREMENT": { label: "Thu mua", class: "role-procurement" },
    "WAREHOUSE": { label: "Kho vận", class: "role-warehouse" },
    "QA": { label: "Kiểm soát CL", class: "role-warehouse" },
    "FINANCE": { label: "Tài chính", class: "role-finance" },
    "PLATFORM_ADMIN": { label: "Quản trị viên", class: "role-admin" },
    "SUPPLIER": { label: "Nhà cung cấp", class: "role-supplier" },
    "SYSTEM": { label: "Hệ thống AI", class: "role-admin" },
};

interface NavItem {
    name: string;
    icon: React.ComponentType<{ size?: number; className?: string }>;
    path: string;
    roles: string[];
    badge?: number;
}

interface NavGroup {
    group: string;
    roles: string[];
    items: NavItem[];
}

const navigation: NavGroup[] = [
    {
        group: "Menu chính", 
        roles: ["REQUESTER", "MANAGER", "DEPT_APPROVER", "DIRECTOR", "PROCUREMENT", "PLATFORM_ADMIN", "CEO", "FINANCE"],
        items: [
            { name: "Bảng điều khiển", icon: LayoutDashboard, path: "/", roles: ["REQUESTER", "MANAGER", "DEPT_APPROVER", "DIRECTOR", "PROCUREMENT", "PLATFORM_ADMIN", "WAREHOUSE", "FINANCE", "CEO", "QA"] },
            { name: "Yêu cầu mua hàng (PR)", icon: FolderTree, path: "/pr", roles: ["REQUESTER", "MANAGER", "DEPT_APPROVER", "DIRECTOR", "PROCUREMENT", "PLATFORM_ADMIN", "FINANCE"], badge: 3 },
            { name: "Yêu cầu báo giá (QR)", icon: ShoppingBag, path: "/quote-requests", roles: ["REQUESTER", "PLATFORM_ADMIN"] },
            { name: "Kiểm soát PR", icon: ClipboardCheck, path: "/procurement/prs", roles: ["PROCUREMENT", "PLATFORM_ADMIN", "FINANCE"] },
        ]
    },
    {
        group: "Quản lý Đơn hàng", 
        roles: ["PROCUREMENT", "PLATFORM_ADMIN", "FINANCE"],
        items: [
            { name: "Đơn đặt hàng (PO)", icon: ShoppingBag, path: "/procurement/pos", roles: ["PROCUREMENT", "PLATFORM_ADMIN"] },
            { name: "Quản lý Báo giá", icon: FileText, path: "/procurement/quotations", roles: ["PROCUREMENT", "PLATFORM_ADMIN"] },
            { name: "Quản lý Hợp đồng", icon: ShieldCheck, path: "/procurement/contracts", roles: ["PROCUREMENT", "PLATFORM_ADMIN"] },
            { name: "Khiếu nại & Tranh chấp", icon: MessageSquare, path: "/procurement/disputes", roles: ["PROCUREMENT", "PLATFORM_ADMIN", "FINANCE"] },
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
            { name: "Lịch sử phê duyệt", icon: ClipboardCheck, path: "/manager/approval-history", roles: ["DEPT_APPROVER", "FINANCE", "DIRECTOR", "CEO"] },
        ]
    },
    {
        group: "Quản lý Ngân sách", 
        roles: ["DEPT_APPROVER", "FINANCE", "PLATFORM_ADMIN", "DIRECTOR"],
        items: [
            { name: "Lập ngân sách", icon: Building, path: "/manager/budget-planning", roles: ["DEPT_APPROVER", "PLATFORM_ADMIN"] },
            { name: "Phân bổ ngân sách", icon: FolderTree, path: "/finance/budget-allocation", roles: ["FINANCE", "PLATFORM_ADMIN"] },
            { name: "Duyệt cấp NS", icon: CheckSquare, path: "/finance/budget-approval", roles: ["FINANCE", "DIRECTOR", "PLATFORM_ADMIN", "CEO"] },
            { name: "Theo dõi chi tiêu", icon: DollarSign, path: "/manager/spend-tracking", roles: ["DEPT_APPROVER", "FINANCE", "PLATFORM_ADMIN"] },
            { name: "Cảnh báo vượt ngân sách", icon: ShieldAlert, path: "/manager/budget-alerts", roles: ["DEPT_APPROVER", "FINANCE", "PLATFORM_ADMIN"] },
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
            { name: "Quản lý Sản phẩm", icon: ShoppingBag, path: "/admin/products", roles: ["PLATFORM_ADMIN"] },
            { name: "Quản lý Danh mục", icon: Layers, path: "/admin/categories", roles: ["PLATFORM_ADMIN"] },
            { name: "Quản lý nhân sự", icon: Users, path: "/users", roles: ["PLATFORM_ADMIN"] },
            { name: "Quản lý Tổ chức", icon: LayoutDashboard, path: "/admin/organizations", roles: ["PLATFORM_ADMIN"] },
            { name: "Quản lý Phòng ban", icon: Building, path: "/admin/departments", roles: ["PLATFORM_ADMIN"] },
            { name: "Quản lý Cost Center", icon: ShieldAlert, path: "/admin/cost-centers", roles: ["PLATFORM_ADMIN"] },
            { name: "Nhật ký hệ thống", icon: History, path: "/admin/audit-logs", roles: ["PLATFORM_ADMIN"] },
            { name: "Cài đặt hệ thống", icon: Settings, path: "/settings", roles: ["PLATFORM_ADMIN"] },
        ]
    },
    {
        group: "Nhà cung cấp (B2B)", 
        roles: ["SUPPLIER"],
        items: [
            { name: "Bảng điều khiển", icon: LayoutDashboard, path: "/supplier/dashboard", roles: ["SUPPLIER"] },
            { name: "Quản lý Sản phẩm", icon: ShoppingBag, path: "/supplier/products", roles: ["SUPPLIER"] },
            { name: "Yêu cầu báo giá (RFQ)", icon: FolderTree, path: "/supplier/rfq", roles: ["SUPPLIER"] },
            { name: "Đơn đặt hàng (PO)", icon: ShoppingCart, path: "/supplier/po", roles: ["SUPPLIER"] },
            { name: "Hợp đồng & Ký kết", icon: ShieldCheck, path: "/procurement/contracts", roles: ["SUPPLIER"] },
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

    const roleKey = currentUser?.role || "GUEST";
    const roleInfo = roleMapping[roleKey] || { label: "Khách", class: "role-finance" };

    // Calculate total badge count
    const totalBadgeCount = navigation
        .flatMap(g => g.items)
        .filter(item => item.roles.includes(roleKey) && item.badge)
        .reduce((acc, item) => acc + (item.badge || 0), 0);

    return (
        <aside className="group fixed left-0 top-0 z-50 h-screen w-16 hover:w-64 bg-gradient-to-b from-[#161922] to-[#0F1117] border-r border-[rgba(148,163,184,0.1)] shadow-2xl transition-all duration-300 ease-in-out flex flex-col overflow-hidden">
            {/* Logo Section */}
            <div className="flex h-16 items-center px-4 border-b border-[rgba(148,163,184,0.1)] shrink-0">
                <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-[#3B82F6] to-[#8B5CF6] flex items-center justify-center shrink-0 shadow-lg shadow-[#3B82F6]/30">
                    <span className="text-white text-xs font-bold">PP</span>
                </div>
                <span className="ml-4 text-sm font-black tracking-tight text-[#F8FAFC] opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                    PROCURE<span className="text-[#3B82F6]">PRO</span>
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
                            <h3 className="mb-2 px-4 text-[9px] font-black uppercase tracking-widest text-[#64748B] opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                                {group.group}
                            </h3>
                            <div className="space-y-1 ml-1">
                                {visibleItems.map((item) => {
                                    const isActive = pathname === item.path || pathname.startsWith(`${item.path}/`);
                                    return (
                                        <Link
                                            key={item.name}
                                            href={item.path}
                                            className={`sidebar-item relative ${isActive ? "active" : ""}`}
                                        >
                                            <item.icon size={18} className={`shrink-0 transition-colors ${isActive ? "text-[#60A5FA]" : "text-[#64748B] group-hover/item:text-[#94A3B8]"}`} />
                                            <span className="ml-4 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap font-semibold text-sm">
                                                {item.name}
                                            </span>
                                            {/* Badge */}
                                            {item.badge && (
                                                <span className={`absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1.5 bg-rose-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center shadow-lg ${!isActive ? "animate-pulse" : ""}`}>
                                                    {item.badge > 9 ? "9+" : item.badge}
                                                </span>
                                            )}
                                            {isActive && <ChevronRight size={14} className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity text-[#60A5FA]" />}
                                        </Link>
                                    );
                                })}
                            </div>
                        </div>
                    );
                })}
            </nav>

            {/* Quick Stats - Only visible on hover */}
            <div className="opacity-0 group-hover:opacity-100 transition-opacity px-4 py-3 border-t border-[rgba(148,163,184,0.1)] bg-[rgba(22,25,34,0.5)]">
                <div className="grid grid-cols-2 gap-2 text-center">
                    <div className="p-2 bg-[#0F1117] rounded-lg">
                        <p className="text-xs text-[#64748B]">Chờ duyệt</p>
                        <p className="text-lg font-bold text-amber-400">{totalBadgeCount}</p>
                    </div>
                    <div className="p-2 bg-[#0F1117] rounded-lg">
                        <p className="text-xs text-[#64748B]">Hoạt động</p>
                        <p className="text-lg font-bold text-emerald-400">24</p>
                    </div>
                </div>
            </div>

            {/* Logout / User Info Footer */}
            <div className="absolute bottom-0 w-full border-t border-[rgba(148,163,184,0.1)] bg-[#161922] p-3">
                <div className="flex items-center gap-3 mb-2">
                    <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-[#3B82F6] to-[#8B5CF6] flex items-center justify-center font-black text-white text-xs shrink-0 shadow-lg shadow-[#3B82F6]/20">
                        {currentUser?.fullName?.substring(0, 2).toUpperCase() || "GU"}
                    </div>
                    <div className="flex flex-col opacity-0 group-hover:opacity-100 transition-opacity overflow-hidden">
                        <span className="text-xs font-bold truncate text-[#F8FAFC] leading-none mb-1">
                            {currentUser?.name || currentUser?.fullName || "Guest"}
                        </span>
                        <div className="flex">
                            <span className={`role-badge ${roleInfo?.class ?? "bg-slate-400"}`}>
                                {roleInfo?.label || roleKey}
                            </span>
                        </div>
                    </div>
                </div>
                <button 
                    onClick={logout}
                    className="flex w-full items-center gap-3 p-3 text-xs font-bold uppercase tracking-wider text-rose-400 hover:bg-rose-500/10 rounded-xl transition-colors group/logout"
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

