"use client";

import React from "react";
import { useProcurement } from "../context/ProcurementContext";
import { usePathname } from "next/navigation";
import { Search, User, ChevronDown, ChevronRight, Sparkles } from "lucide-react";
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


export default function Topbar() {
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
        <header className="sticky top-0 z-40 w-full bg-[#FAF8F5]/96 backdrop-blur-xl border-b border-[rgba(240,246,252,0.08)] h-14 flex items-center justify-between px-5 gap-3">

            {/* ── Left: Breadcrumb ── */}
            <div className="flex items-center gap-1.5 min-w-0">
                <div className="flex flex-col min-w-0">
                    {/* mini breadcrumb path */}
                    <div className="hidden sm:flex items-center gap-1 leading-none mb-0.5">
                        <span className="text-[9px] font-black uppercase tracking-widest text-[#000000]">ProcureSmart</span>
                        {breadcrumbParts.length > 1 && breadcrumbParts.slice(0, -1).map((p, i) => (
                            <React.Fragment key={i}>
                                <ChevronRight size={9} className="text-[#000000]" />
                                <span className="text-[9px] font-semibold text-[#000000] truncate max-w-[60px]">{p.label}</span>
                            </React.Fragment>
                        ))}
                    </div>
                    {/* page title */}
                    <h2 className="text-[13px] font-bold text-[#000000] tracking-tight leading-tight truncate flex items-center gap-1.5">
                        {isAIPage && <Sparkles size={12} className="text-violet-400 shrink-0" />}
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
                        className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold border border-violet-500/30 bg-violet-500/10 text-violet-300 hover:bg-violet-500/20 hover:border-violet-500/50 transition-all duration-150 shrink-0"
                    >
                        <Sparkles size={11} className="shrink-0" />
                        Khám phá NCC
                    </Link>
                )}

                {/* Search with ⌘K hint */}
                <div className="hidden md:flex relative group">
                    <Search
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-[#000000] group-focus-within:text-[#B4533A] transition-colors"
                        size={13}
                    />
                    <input
                        type="text"
                        placeholder="Tìm kiếm..."
                        readOnly
                        className="pl-8 pr-16 py-1.5 bg-[#FFFFFF] border border-[rgba(240,246,252,0.08)] rounded-lg text-[11.5px] font-medium text-[#000000] placeholder:text-[#000000] focus:outline-none focus:border-[#B4533A]/40 focus:ring-1 focus:ring-[#B4533A]/20 w-48 transition-all cursor-pointer hover:border-[rgba(240,246,252,0.15)]"
                    />
                    <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1 pointer-events-none">
                        <span className="kbd">⌘</span>
                        <span className="kbd">K</span>
                    </div>
                </div>

                {/* Notification Inbox */}
                <NotificationInbox />

                {/* User Profile */}
                <div className="flex items-center gap-2 pl-2.5 border-l border-[rgba(240,246,252,0.08)] cursor-pointer hover:bg-[rgba(240,246,252,0.04)] px-2 py-1.5 rounded-lg transition-all group">
                    <div className="h-7 w-7 rounded-md bg-gradient-to-br from-[#B4533A]/30 to-[#6366F1]/40 border border-[#B4533A]/30 flex items-center justify-center text-[#CB7A62] font-black text-[10px] shrink-0 select-none">
                        {currentUser?.fullName?.charAt(0)?.toUpperCase() || <User size={13} />}
                    </div>
                    <div className="hidden md:flex flex-col leading-none">
                        <span className="text-[11px] font-bold text-[#000000] leading-tight">{currentUser?.fullName || "Guest"}</span>
                        <span className="text-[8.5px] font-semibold uppercase tracking-widest text-[#000000] mt-0.5">
                            {currentUser?.role?.replace(/_/g, " ") || "No Role"}
                        </span>
                    </div>
                    <ChevronDown size={11} className="text-[#000000] group-hover:text-[#000000] transition-colors" />
                </div>
            </div>
        </header>
    );
}

