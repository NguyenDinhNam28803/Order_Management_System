"use client";

import React from "react";
import { useProcurement } from "../context/ProcurementContext";
import { usePathname } from "next/navigation";
import { Search, User, ChevronDown, ChevronRight, Sparkles, Menu } from "lucide-react";
import Link from "next/link";
import NotificationInbox from "./NotificationInbox";

const SUPPLIER_DISCOVERY_ROLES = ['PROCUREMENT', 'ADMIN', 'DIRECTOR', 'CEO', 'PLATFORM_ADMIN'];

// Breadcrumb label overrides
const PAGE_LABELS: Record<string, string> = {
    "":              "Bảng điều khiển",
    "pr":            "Yêu cầu mua hàng",
    "create":        "Tạo mới",
    "po":            "Đơn đặt hàng",
    "consolidate":   "Gộp PO",
    "procurement":   "Thu mua",
    "prs":           "Quản lý PR",
    "pos":           "Quản lý PO",
    "quotations":    "Báo giá",
    "rfq":           "RFQ",
    "suppliers":     "Nhà cung cấp",
    "contracts":     "Hợp đồng",
    "delivery":      "Giao hàng",
    "disputes":      "Tranh chấp",
    "amendments":    "Điều chỉnh PO",
    "finance":       "Tài chính",
    "dashboard":     "Bảng điều khiển",
    "budgets":       "Ngân sách",
    "invoices":      "Hóa đơn",
    "matching":      "Đối soát 3 chiều",
    "budget-allocation": "Phân bổ NS",
    "budget-approval":   "Duyệt NS",
    "manager":       "Quản lý",
    "approvals":     "Phê duyệt",
    "spend-tracking":"Theo dõi chi tiêu",
    "budget-alerts": "Cảnh báo NS",
    "budget-planning":"Lập kế hoạch NS",
    "po-approvals":  "Duyệt PO",
    "approval-history":"Lịch sử duyệt",
    "admin":         "Quản trị",
    "ai-sync":       "AI & RAG Sync",
    "audit-logs":    "Nhật ký",
    "organizations": "Tổ chức",
    "departments":   "Phòng ban",
    "cost-centers":  "Cost Center",
    "products":      "Sản phẩm",
    "categories":    "Danh mục",
    "supplier":      "Nhà cung cấp",
    "warehouse":     "Kho vận",
    "grn":           "Kiểm nhận hàng",
    "new":           "Tạo mới",
    "payments":      "Thanh toán",
    "quote-requests":"Yêu cầu báo giá",
    "reports":       "Báo cáo",
    "spend":         "Chi phí",
    "ai-report":     "Báo cáo AI",
    "simulation":    "Mô phỏng",
    "users":         "Người dùng",
    "profile":       "Hồ sơ",
    "settings":      "Cài đặt",
    "sourcing":          "Nguồn hàng",
    "supplier-discovery":"Khám phá NCC (AI)",
    "help":          "Trợ giúp",
};


interface TopbarProps {
    onMenuClick?: () => void;
}

export default function Topbar({ onMenuClick }: TopbarProps) {
    const { currentUser } = useProcurement();
    const pathname = usePathname() ?? "/";

    // Build breadcrumb parts
    const breadcrumbParts = (() => {
        if (pathname === "/") return [{ label: "Bảng điều khiển", isLast: true }];
        const segments = pathname.split("/").filter(Boolean);
        return segments.map((seg, i) => ({
            label: PAGE_LABELS[seg] ?? seg.charAt(0).toUpperCase() + seg.slice(1).replace(/-/g, " "),
            isLast: i === segments.length - 1,
        }));
    })();

    const pageTitle = breadcrumbParts[breadcrumbParts.length - 1]?.label ?? "Dashboard";
    const isAIPage  = pathname.includes("ai") || pathname.includes("rag") || pathname.includes("simulation");

    const initials = (currentUser?.fullName || "G")
        .split(" ").slice(-2).map((w: string) => w[0]?.toUpperCase() ?? "").join("").slice(0, 2) || "GU";

    return (
        <header className="sticky top-0 z-40 w-full bg-white border-b border-[#E2E8F0] shadow-[0_1px_3px_rgba(0,0,0,0.06)] h-14 flex items-center justify-between px-5 gap-3">

            {/* ── Left: hamburger (mobile) + Breadcrumb ── */}
            <div className="flex items-center gap-2 min-w-0">
                {/* Hamburger — mobile only */}
                {onMenuClick && (
                    <button
                        onClick={onMenuClick}
                        className="md:hidden p-1.5 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors shrink-0"
                        aria-label="Mở menu"
                    >
                        <Menu size={16} />
                    </button>
                )}

                <div className="flex flex-col min-w-0">
                    {/* mini breadcrumb path */}
                    <div className="hidden sm:flex items-center gap-1 leading-none mb-0.5">
                        <span className="text-[0.6875rem] font-bold uppercase tracking-widest text-slate-400">ProcureSmart</span>
                        {breadcrumbParts.length > 1 && breadcrumbParts.slice(0, -1).map((p, i) => (
                            <React.Fragment key={i}>
                                <ChevronRight size={9} className="text-slate-300" />
                                <span className="text-[0.6875rem] font-semibold text-slate-500 truncate max-w-[60px]">{p.label}</span>
                            </React.Fragment>
                        ))}
                    </div>
                    {/* page title */}
                    <h2 className="text-[13px] font-bold text-slate-900 tracking-tight leading-tight truncate flex items-center gap-1.5">
                        {isAIPage && <Sparkles size={12} className="text-violet-500 shrink-0" />}
                        {pageTitle}
                    </h2>
                </div>
            </div>

            {/* ── Right: Actions ── */}
            <div className="flex items-center gap-2 shrink-0">

                {/* Quick: Khám phá NCC — chỉ hiện với role được phép */}
                {SUPPLIER_DISCOVERY_ROLES.includes(currentUser?.role ?? '') && pathname !== '/procurement/supplier-discovery' && (
                    <Link
                        href="/procurement/supplier-discovery"
                        className="hidden sm:flex btn-ai text-[11px] shrink-0"
                    >
                        <Sparkles size={11} className="shrink-0" />
                        Khám phá NCC
                    </Link>
                )}

                {/* Search with ⌘K hint */}
                <div className="hidden md:flex relative group">
                    <Search
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#2563EB] transition-colors"
                        size={13}
                    />
                    <input
                        type="text"
                        placeholder="Tìm kiếm..."
                        readOnly
                        className="pl-8 pr-16 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-[11.5px] font-medium text-slate-700 placeholder:text-slate-400 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 w-48 transition-all cursor-pointer hover:border-slate-300"
                    />
                    <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1 pointer-events-none">
                        <span className="kbd">⌘</span>
                        <span className="kbd">K</span>
                    </div>
                </div>

                {/* Notification Inbox */}
                <NotificationInbox />

                {/* User Profile */}
                <div className="flex items-center gap-2 pl-2.5 border-l border-slate-200 cursor-pointer hover:bg-slate-50 px-2 py-1.5 rounded-lg transition-all group">
                    <div className="h-7 w-7 rounded-md bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white font-black text-[10px] shrink-0 select-none">
                        {currentUser?.fullName?.charAt(0)?.toUpperCase() || <User size={13} />}
                    </div>
                    <div className="hidden md:flex flex-col leading-none">
                        <span className="text-[11px] font-semibold text-slate-800 leading-tight">{currentUser?.fullName || "Guest"}</span>
                        <span className="text-[8.5px] font-semibold uppercase tracking-widest text-slate-400 mt-0.5">
                            {currentUser?.role?.replace(/_/g, " ") || "No Role"}
                        </span>
                    </div>
                    <ChevronDown size={11} className="text-slate-400 group-hover:text-slate-600 transition-colors" />
                </div>
            </div>
        </header>
    );
}

