"use client";

import React from "react";
import {
    LayoutDashboard, ShoppingCart, CheckSquare, Truck,
    FileCheck, ShieldAlert, Users, Settings, LogOut,
    FolderTree, Search, ChevronRight, ClipboardCheck, ShoppingBag, Building, DollarSign, Layers,
    ShieldCheck, MessageSquare, History, FileText,
    Bell, Inbox, Command, Star, UserCircle, Zap, Brain, PlusCircle, GitMerge
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
            { name: "Tạo PR mới", icon: PlusCircle, path: "/pr/create", roles: ["DIRECTOR", "CEO", "PLATFORM_ADMIN"] },
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
            { name: "Gộp PO từ nhiều PR", icon: GitMerge, path: "/po/consolidate", roles: ["PROCUREMENT", "PLATFORM_ADMIN"] },
            { name: "Quản lý Báo giá", icon: FileText, path: "/procurement/quotations", roles: ["PROCUREMENT", "PLATFORM_ADMIN"] },
            { name: "Quản lý Hợp đồng", icon: ShieldCheck, path: "/procurement/contracts", roles: ["PROCUREMENT", "PLATFORM_ADMIN"] },
            { name: "Đánh giá Nhà cung cấp", icon: Star, path: "/procurement/suppliers", roles: ["PROCUREMENT", "PLATFORM_ADMIN", "FINANCE"] },
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
            { name: "Quản lý Hóa đơn", icon: FileText, path: "/finance/invoices", roles: ["FINANCE", "DIRECTOR"] },
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
            { name: "AI Admin / RAG Sync", icon: Brain, path: "/admin/ai-sync", roles: ["PLATFORM_ADMIN"] },
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
        <aside className="fixed left-0 top-0 z-50 h-screen w-[180px] bg-[#161B22] border-r border-[rgba(240,246,252,0.1)] flex flex-col overflow-hidden">
            {/* Logo */}
            <div className="flex h-14 items-center gap-3 px-4 border-b border-[rgba(240,246,252,0.1)] shrink-0">
                <div className="h-7 w-7 rounded-md bg-[#2563EB] flex items-center justify-center shrink-0">
                    <span className="text-white text-[10px] font-black tracking-tight">PS</span>
                </div>
                <span className="text-[13px] font-black tracking-tight text-[#E6EDF3] whitespace-nowrap">
                    PROCURE<span className="text-[#2563EB]">SMART</span>
                </span>
            </div>

            {/* Nav */}
            <nav className="mt-3 px-2 space-y-3 flex-1 overflow-y-auto overflow-x-hidden no-scrollbar pb-36">
                {navigation.map((group) => {
                    const userRole = currentUser?.role;
                    const groupVisible = !userRole || group.roles.includes(userRole);
                    if (!groupVisible && userRole !== "PLATFORM_ADMIN") return null;

                    const visibleItems = group.items.filter(item => !userRole || item.roles.includes(userRole));
                    if (visibleItems.length === 0) return null;

                    return (
                        <div key={group.group}>
                            <h3 className="mb-1 px-2 text-[9px] font-black uppercase tracking-widest text-[#484F58] whitespace-nowrap">
                                {group.group}
                            </h3>
                            <div className="space-y-0.5">
                                {visibleItems.map((item) => {
                                    const isActive = pathname === item.path || pathname.startsWith(`${item.path}/`);
                                    return (
                                        <Link
                                            key={item.name}
                                            href={item.path}
                                            className={`sidebar-item relative ${isActive ? "active" : ""}`}
                                        >
                                            <item.icon size={15} className={`shrink-0 ${isActive ? "text-[#60A5FA]" : "text-[#484F58]"}`} />
                                            <span className="whitespace-nowrap font-medium text-[12.5px] truncate">
                                                {item.name}
                                            </span>
                                            {item.badge && (
                                                <span className="ml-auto min-w-[18px] h-[18px] px-1 bg-rose-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center shrink-0">
                                                    {item.badge > 9 ? "9+" : item.badge}
                                                </span>
                                            )}
                                            {isActive && !item.badge && (
                                                <ChevronRight size={12} className="ml-auto text-[#2563EB] shrink-0" />
                                            )}
                                        </Link>
                                    );
                                })}
                            </div>
                        </div>
                    );
                })}
            </nav>

            {/* Quick Stats */}
            <div className="px-3 py-2 border-t border-[rgba(240,246,252,0.1)] bg-[#0D1117]">
                <div className="grid grid-cols-2 gap-1.5 text-center">
                    <div className="p-1.5 bg-[#161B22] rounded-md">
                        <p className="text-[9px] text-[#484F58] font-medium">Chờ duyệt</p>
                        <p className="text-sm font-black text-amber-400 font-mono">{totalBadgeCount}</p>
                    </div>
                    <div className="p-1.5 bg-[#161B22] rounded-md">
                        <p className="text-[9px] text-[#484F58] font-medium">Online</p>
                        <p className="text-sm font-black text-emerald-400 font-mono">24</p>
                    </div>
                </div>
            </div>

            {/* User Footer */}
            <div className="border-t border-[rgba(240,246,252,0.1)] bg-[#161B22] p-2">
                <Link href="/users/profile" className="flex items-center gap-2 mb-1.5 px-2 py-1.5 hover:bg-[rgba(37,99,235,0.1)] rounded-lg transition-colors cursor-pointer">
                    <div className="h-7 w-7 rounded-lg bg-[#2563EB] flex items-center justify-center font-black text-white text-[10px] shrink-0">
                        {currentUser?.fullName?.substring(0, 2).toUpperCase() || "GU"}
                    </div>
                    <div className="flex flex-col overflow-hidden min-w-0">
                        <span className="text-[11px] font-bold truncate text-[#E6EDF3] leading-tight">
                            {currentUser?.name || currentUser?.fullName || "Guest"}
                        </span>
                        <span className={`role-badge mt-0.5 ${roleInfo?.class ?? "bg-slate-400"}`}>
                            {roleInfo?.label || roleKey}
                        </span>
                    </div>
                </Link>
                <button
                    onClick={logout}
                    className="flex w-full items-center gap-2 px-2 py-1.5 text-[11px] font-bold text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
                >
                    <LogOut size={14} className="shrink-0" />
                    <span>Đăng xuất</span>
                </button>
            </div>
        </aside>
    );
}

