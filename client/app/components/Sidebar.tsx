"use client";

import React from "react";
import {
    LayoutDashboard, ShoppingCart, CheckSquare, Truck,
    FileCheck, ShieldAlert, Users, Settings, LogOut,
    FolderTree, Search, ChevronRight, ClipboardCheck, ShoppingBag, Building, DollarSign, Layers,
    ShieldCheck, MessageSquare, History, FileText,
    Bell, Command, Star, Zap, Brain, PlusCircle, GitMerge, Sparkles
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useProcurement } from "../context/ProcurementContext";

const roleMapping: Record<string, { label: string; class: string; dot: string }> = {
    "REQUESTER":     { label: "Người yêu cầu", class: "role-requester", dot: "#94A3B8" },
    "DEPT_APPROVER": { label: "Trưởng phòng",  class: "role-approver",  dot: "#FBBF24" },
    "DIRECTOR":      { label: "Giám đốc",       class: "role-director",  dot: "#60A5FA" },
    "CEO":           { label: "CEO / Board",    class: "role-ceo",       dot: "#A78BFA" },
    "PROCUREMENT":   { label: "Thu mua",        class: "role-procurement",dot: "#FBBF24" },
    "WAREHOUSE":     { label: "Kho vận",        class: "role-warehouse", dot: "#F472B6" },
    "QA":            { label: "Kiểm soát CL",   class: "role-warehouse", dot: "#F472B6" },
    "FINANCE":       { label: "Tài chính",      class: "role-finance",   dot: "#34D399" },
    "PLATFORM_ADMIN":{ label: "Quản trị viên",  class: "role-admin",     dot: "#FB7185" },
    "SUPPLIER":      { label: "Nhà cung cấp",   class: "role-supplier",  dot: "#FB923C" },
    "SYSTEM":        { label: "Hệ thống AI",    class: "role-admin",     dot: "#FB7185" },
};

interface NavItem {
    name: string;
    icon: React.ComponentType<{ size?: number; className?: string }>;
    path: string;
    roles: string[];
}

interface NavGroup {
    group: string;
    dot: string;
    roles: string[];
    items: NavItem[];
}

const navigation: NavGroup[] = [
    {
        group: "Menu chính",
        dot: "#3B82F6",
        roles: ["REQUESTER", "MANAGER", "DEPT_APPROVER", "DIRECTOR", "PROCUREMENT", "PLATFORM_ADMIN", "CEO", "FINANCE"],
        items: [
            { name: "Bảng điều khiển",        icon: LayoutDashboard, path: "/",              roles: ["REQUESTER", "MANAGER", "DEPT_APPROVER", "DIRECTOR", "PROCUREMENT", "PLATFORM_ADMIN", "WAREHOUSE", "FINANCE", "CEO", "QA"] },
            { name: "Tạo PR mới",              icon: PlusCircle,      path: "/pr/create",     roles: ["DIRECTOR", "CEO", "PLATFORM_ADMIN"] },
            { name: "Yêu cầu mua hàng (PR)",  icon: FolderTree,      path: "/pr",            roles: ["REQUESTER", "MANAGER", "DEPT_APPROVER", "DIRECTOR", "PROCUREMENT", "PLATFORM_ADMIN", "FINANCE"] },
            { name: "Yêu cầu báo giá (QR)",   icon: ShoppingBag,     path: "/quote-requests",roles: ["REQUESTER", "PLATFORM_ADMIN"] },
            { name: "Kiểm soát PR",            icon: ClipboardCheck,  path: "/procurement/prs",roles: ["PROCUREMENT", "PLATFORM_ADMIN", "FINANCE"] },
        ]
    },
    {
        group: "Quản lý Đơn hàng",
        dot: "#10B981",
        roles: ["PROCUREMENT", "PLATFORM_ADMIN", "FINANCE"],
        items: [
            { name: "Đơn đặt hàng (PO)",            icon: ShoppingBag,  path: "/procurement/pos",         roles: ["PROCUREMENT", "PLATFORM_ADMIN"] },
            { name: "Gộp PO từ nhiều PR",           icon: GitMerge,     path: "/po/consolidate",          roles: ["PROCUREMENT", "PLATFORM_ADMIN"] },
            { name: "Quản lý Báo giá",              icon: FileText,     path: "/procurement/quotations",  roles: ["PROCUREMENT", "PLATFORM_ADMIN"] },
            { name: "Quản lý Hợp đồng",            icon: ShieldCheck,  path: "/procurement/contracts",   roles: ["PROCUREMENT", "PLATFORM_ADMIN"] },
            { name: "Đánh giá Nhà cung cấp",       icon: Star,         path: "/procurement/suppliers",   roles: ["PROCUREMENT", "PLATFORM_ADMIN", "FINANCE"] },
            { name: "Khiếu nại & Tranh chấp",      icon: MessageSquare,path: "/procurement/disputes",    roles: ["PROCUREMENT", "PLATFORM_ADMIN", "FINANCE"] },
            { name: "Theo dõi giao hàng",           icon: Truck,        path: "/procurement/delivery",    roles: ["PROCUREMENT", "PLATFORM_ADMIN"] },
            { name: "Điều chỉnh PO (Amendments)",  icon: ShieldAlert,  path: "/procurement/amendments",  roles: ["PROCUREMENT", "PLATFORM_ADMIN"] },
        ]
    },
    {
        group: "Nguồn hàng",
        dot: "#06B6D4",
        roles: ["PROCUREMENT", "PLATFORM_ADMIN", "DIRECTOR", "CEO"],
        items: [
            { name: "Nguồn hàng & Báo giá",   icon: Search,    path: "/sourcing",                       roles: ["PROCUREMENT", "PLATFORM_ADMIN"] },
            { name: "Khám phá NCC (AI)",        icon: Sparkles,  path: "/procurement/supplier-discovery", roles: ["PROCUREMENT", "PLATFORM_ADMIN", "DIRECTOR", "CEO"] },
        ]
    },
    {
        group: "Trung tâm Phê duyệt",
        dot: "#F59E0B",
        roles: ["MANAGER", "DEPT_APPROVER", "FINANCE", "DIRECTOR", "CEO", "PLATFORM_ADMIN"],
        items: [
            { name: "Phê duyệt PR",          icon: CheckSquare,  path: "/approvals",                roles: ["MANAGER", "DEPT_APPROVER", "FINANCE", "DIRECTOR", "CEO"] },
            { name: "Phê duyệt PO",          icon: ShoppingCart, path: "/manager/po-approvals",     roles: ["DEPT_APPROVER", "FINANCE", "DIRECTOR"] },
            { name: "Quản lý Hóa đơn",       icon: FileText,     path: "/finance/invoices",         roles: ["FINANCE", "DIRECTOR"] },
            { name: "Phê duyệt Thanh toán",  icon: FileCheck,    path: "/payments",                 roles: ["FINANCE", "DIRECTOR"] },
            { name: "Lịch sử phê duyệt",     icon: ClipboardCheck,path: "/manager/approval-history",roles: ["DEPT_APPROVER", "FINANCE", "DIRECTOR", "CEO"] },
        ]
    },
    {
        group: "Quản lý Ngân sách",
        dot: "#8B5CF6",
        roles: ["DEPT_APPROVER", "FINANCE", "PLATFORM_ADMIN", "DIRECTOR"],
        items: [
            { name: "Lập ngân sách",            icon: Building,    path: "/manager/budget-planning",  roles: ["DEPT_APPROVER", "PLATFORM_ADMIN"] },
            { name: "Phân bổ ngân sách",        icon: FolderTree,  path: "/finance/budget-allocation",roles: ["FINANCE", "PLATFORM_ADMIN"] },
            { name: "Duyệt cấp NS",             icon: CheckSquare, path: "/finance/budget-approval",  roles: ["FINANCE", "DIRECTOR", "PLATFORM_ADMIN", "CEO"] },
            { name: "Theo dõi chi tiêu",        icon: DollarSign,  path: "/manager/spend-tracking",   roles: ["DEPT_APPROVER", "FINANCE", "PLATFORM_ADMIN"] },
            { name: "Cảnh báo vượt ngân sách",  icon: ShieldAlert, path: "/manager/budget-alerts",    roles: ["DEPT_APPROVER", "FINANCE", "PLATFORM_ADMIN"] },
        ]
    },
    {
        group: "Báo cáo",
        dot: "#EC4899",
        roles: ["MANAGER", "DEPT_APPROVER", "FINANCE", "DIRECTOR", "PLATFORM_ADMIN", "CEO"],
        items: [
            { name: "Báo cáo Chi phí", icon: ClipboardCheck, path: "/reports/spend", roles: ["FINANCE", "DIRECTOR"] },
            { name: "Báo cáo Công nợ", icon: FolderTree,     path: "/reports/ap",    roles: ["FINANCE", "DIRECTOR"] },
        ]
    },
    {
        group: "Hệ thống",
        dot: "#EF4444",
        roles: ["PLATFORM_ADMIN"],
        items: [
            { name: "Quản lý Nhà cung cấp", icon: Truck,          path: "/admin/suppliers",      roles: ["PLATFORM_ADMIN"] },
            { name: "Quản lý Sản phẩm",     icon: ShoppingBag,    path: "/admin/products",       roles: ["PLATFORM_ADMIN"] },
            { name: "Quản lý Danh mục",     icon: Layers,          path: "/admin/categories",     roles: ["PLATFORM_ADMIN"] },
            { name: "Quản lý nhân sự",      icon: Users,           path: "/users",                roles: ["PLATFORM_ADMIN"] },
            { name: "Quản lý Tổ chức",      icon: LayoutDashboard, path: "/admin/organizations",  roles: ["PLATFORM_ADMIN"] },
            { name: "Quản lý Phòng ban",    icon: Building,        path: "/admin/departments",    roles: ["PLATFORM_ADMIN"] },
            { name: "Quản lý Cost Center",  icon: ShieldAlert,     path: "/admin/cost-centers",   roles: ["PLATFORM_ADMIN"] },
            { name: "Nhật ký hệ thống",     icon: History,         path: "/admin/audit-logs",     roles: ["PLATFORM_ADMIN"] },
            { name: "AI Admin / RAG Sync",  icon: Brain,           path: "/admin/ai-sync",        roles: ["PLATFORM_ADMIN"] },
            { name: "Cài đặt hệ thống",     icon: Settings,        path: "/settings",             roles: ["PLATFORM_ADMIN"] },
        ]
    },
    {
        group: "Nhà cung cấp (B2B)",
        dot: "#F97316",
        roles: ["SUPPLIER"],
        items: [
            { name: "Bảng điều khiển",       icon: LayoutDashboard, path: "/supplier/dashboard",     roles: ["SUPPLIER"] },
            { name: "Quản lý Sản phẩm",      icon: ShoppingBag,     path: "/supplier/products",      roles: ["SUPPLIER"] },
            { name: "Yêu cầu báo giá (RFQ)", icon: FolderTree,      path: "/supplier/rfq",           roles: ["SUPPLIER"] },
            { name: "Đơn đặt hàng (PO)",     icon: ShoppingCart,    path: "/supplier/po",            roles: ["SUPPLIER"] },
            { name: "Hợp đồng & Ký kết",     icon: ShieldCheck,     path: "/procurement/contracts",  roles: ["SUPPLIER"] },
            { name: "Gửi hóa đơn (Invoice)", icon: FileCheck,       path: "/supplier/invoice",       roles: ["SUPPLIER"] },
        ]
    },
    {
        group: "Kho vận (Warehouse)",
        dot: "#EC4899",
        roles: ["WAREHOUSE"],
        items: [
            { name: "Bàn làm việc Kho",   icon: LayoutDashboard, path: "/warehouse/dashboard", roles: ["WAREHOUSE"] },
            { name: "Kiểm định & Tạo GRN", icon: FileCheck,       path: "/warehouse/grn/new",   roles: ["WAREHOUSE"] },
        ]
    },
];

export default function Sidebar() {
    const pathname = usePathname() || "/";
    const { currentUser, logout } = useProcurement();

    const roleKey = currentUser?.role || "GUEST";
    const roleInfo = roleMapping[roleKey] || { label: "Khách", class: "role-finance", dot: "#64748B" };

    const initials = (currentUser?.fullName || currentUser?.name || "GU")
        .split(" ").slice(-2).map((w: string) => w[0]?.toUpperCase() || "").join("").slice(0, 2) || "GU";

    return (
        <aside className="fixed left-0 top-0 z-50 h-screen w-[180px] bg-[#161B22] border-r border-[rgba(240,246,252,0.08)] flex flex-col overflow-hidden">

            {/* ── Logo ── */}
            <div className="flex h-14 items-center gap-2.5 px-3.5 border-b border-[rgba(240,246,252,0.08)] shrink-0">
                <div className="relative h-7 w-7 rounded-lg bg-gradient-to-br from-[#3B82F6] to-[#6366F1] flex items-center justify-center shrink-0 shadow-lg shadow-blue-500/30">
                    <span className="text-white text-[9px] font-black tracking-tight select-none">PS</span>
                    {/* live dot */}
                    <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-400 border border-[#161B22] status-dot-active" />
                </div>
                <div className="flex flex-col min-w-0">
                    <span className="text-[12.5px] font-black tracking-tight text-[#E6EDF3] whitespace-nowrap leading-none">
                        PROCURE<span className="text-[#3B82F6]">SMART</span>
                    </span>
                    <span className="text-[8.5px] font-semibold text-[#30363D] tracking-widest uppercase leading-tight">ERP Platform</span>
                </div>
            </div>

            {/* ── Nav ── */}
            <nav className="mt-2.5 px-2 space-y-2.5 flex-1 overflow-y-auto overflow-x-hidden no-scrollbar pb-36">
                {navigation.map((group) => {
                    const userRole = currentUser?.role;
                    const groupVisible = !userRole || group.roles.includes(userRole);
                    if (!groupVisible && userRole !== "PLATFORM_ADMIN") return null;

                    const visibleItems = group.items.filter(item => !userRole || item.roles.includes(userRole));
                    if (visibleItems.length === 0) return null;

                    return (
                        <div key={group.group}>
                            <div className="nav-group-label mb-1 px-1.5">
                                <span
                                    className="nav-group-dot"
                                    style={{ background: group.dot }}
                                />
                                <span style={{ color: group.dot, opacity: 0.6 }}>{group.group}</span>
                            </div>
                            <div className="space-y-0.5">
                                {visibleItems.map((item) => {
                                    const isActive = pathname === item.path || (item.path !== "/" && pathname.startsWith(`${item.path}/`));
                                    return (
                                        <Link
                                            key={item.name}
                                            href={item.path}
                                            className={`sidebar-item relative ${isActive ? "active" : ""}`}
                                        >
                                            <item.icon
                                                size={14}
                                                className={`shrink-0 transition-colors ${isActive ? "text-[#60A5FA]" : "text-[#484F58]"}`}
                                            />
                                            <span className="whitespace-nowrap font-medium text-[12px] truncate leading-snug">
                                                {item.name}
                                            </span>
                                            {isActive ? (
                                                <ChevronRight size={11} className="ml-auto text-[#3B82F6] shrink-0" />
                                            ) : null}
                                        </Link>
                                    );
                                })}
                            </div>
                        </div>
                    );
                })}
            </nav>

            {/* ── Quick Stats ── */}
            <div className="px-2.5 py-2 border-t border-[rgba(240,246,252,0.08)] bg-[#0D1117]/60">
                <div className="grid grid-cols-3 gap-1 text-center">
                    <div className="p-1.5 bg-[#161B22] rounded-md border border-[rgba(240,246,252,0.05)]">
                        <p className="text-[8px] text-[#484F58] font-semibold uppercase tracking-wide">Chờ</p>
                        <p className="text-[13px] font-black text-amber-400 num-display leading-tight">—</p>
                    </div>
                    <div className="p-1.5 bg-[#161B22] rounded-md border border-[rgba(240,246,252,0.05)]">
                        <p className="text-[8px] text-[#484F58] font-semibold uppercase tracking-wide">Online</p>
                        <p className="text-[13px] font-black text-emerald-400 num-display leading-tight">24</p>
                    </div>
                    <div className="p-1.5 bg-[#161B22] rounded-md border border-[rgba(240,246,252,0.05)]">
                        <p className="text-[8px] text-[#484F58] font-semibold uppercase tracking-wide">AI</p>
                        <p className="text-[13px] font-black text-violet-400 num-display leading-tight flex items-center justify-center gap-0.5">
                            <span className="status-dot status-dot-active" />
                        </p>
                    </div>
                </div>
            </div>

            {/* ── User Footer ── */}
            <div className="border-t border-[rgba(240,246,252,0.08)] bg-[#161B22] p-2 space-y-0.5">
                <Link
                    href="/users/profile"
                    className="flex items-center gap-2 px-2 py-1.5 hover:bg-[rgba(37,99,235,0.1)] rounded-lg transition-all duration-150 group cursor-pointer"
                >
                    <div
                        className="h-7 w-7 rounded-lg flex items-center justify-center font-black text-white text-[10px] shrink-0 shadow-md"
                        style={{ background: `linear-gradient(135deg, ${roleInfo.dot}99 0%, ${roleInfo.dot} 100%)` }}
                    >
                        {initials}
                    </div>
                    <div className="flex flex-col overflow-hidden min-w-0 flex-1">
                        <span className="text-[11px] font-bold truncate text-[#E6EDF3] leading-tight group-hover:text-white transition-colors">
                            {currentUser?.name || currentUser?.fullName || "Guest"}
                        </span>
                        <span className={`role-badge mt-0.5 w-fit ${roleInfo.class}`}>
                            {roleInfo.label}
                        </span>
                    </div>
                    <ChevronRight size={11} className="text-[#484F58] group-hover:text-[#8B949E] transition-colors shrink-0" />
                </Link>
                <button
                    onClick={logout}
                    className="flex w-full items-center gap-2 px-2 py-1.5 text-[11px] font-bold text-[#484F58] hover:text-rose-400 hover:bg-rose-500/8 rounded-lg transition-all duration-150"
                >
                    <LogOut size={13} className="shrink-0" />
                    <span>Đăng xuất</span>
                </button>
            </div>
        </aside>
    );
}
