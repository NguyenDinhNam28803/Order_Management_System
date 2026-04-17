"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useProcurement } from "../context/ProcurementContext";
import { usePathname } from "next/navigation";
import { Bell, Search, User, ChevronDown, ChevronRight, Sparkles } from "lucide-react";
import NotificationInbox from "./NotificationInbox";

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
    "sourcing":      "Nguồn hàng",
    "help":          "Trợ giúp",
};


export default function Topbar() {
    const { currentUser, apiFetch } = useProcurement();
    const pathname = usePathname() ?? "/";
    const [showNotifications, setShowNotifications] = useState(false);
    const [notifications, setNotifications] = useState<any[]>([]);
    const notifRef = useRef<HTMLDivElement>(null);

    const fetchNotifications = useCallback(async () => {
        if (!currentUser?.id) return;
        try {
            const response = await apiFetch(`/notifications/recipient/${currentUser.id}`);
            if (response.ok) {
                const res = await response.json();
                const data = res.data || res;
                setNotifications(Array.isArray(data) ? data : []);
            }
        } catch (err) {
            console.error("Failed to fetch persistent notifications:", err);
        }
    }, [currentUser?.id, apiFetch]);

    useEffect(() => {
        if (currentUser?.id) {
            fetchNotifications();
            // Optional: interval fetch
            const interval = setInterval(fetchNotifications, 60000);
            return () => clearInterval(interval);
        }
    }, [currentUser?.id, fetchNotifications]);

    // Close on outside click
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
                setShowNotifications(false);
            }
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);

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
        <header className="sticky top-0 z-40 w-full bg-[#161B22]/96 backdrop-blur-xl border-b border-[rgba(240,246,252,0.08)] h-14 flex items-center justify-between px-5 gap-3">

            {/* ── Left: Breadcrumb ── */}
            <div className="flex items-center gap-1.5 min-w-0">
                <div className="flex flex-col min-w-0">
                    {/* mini breadcrumb path */}
                    <div className="hidden sm:flex items-center gap-1 leading-none mb-0.5">
                        <span className="text-[9px] font-black uppercase tracking-widest text-[#30363D]">ProcureSmart</span>
                        {breadcrumbParts.length > 1 && breadcrumbParts.slice(0, -1).map((p, i) => (
                            <React.Fragment key={i}>
                                <ChevronRight size={9} className="text-[#30363D]" />
                                <span className="text-[9px] font-semibold text-[#484F58] truncate max-w-[60px]">{p.label}</span>
                            </React.Fragment>
                        ))}
                    </div>
                    {/* page title */}
                    <h2 className="text-[13px] font-bold text-[#E6EDF3] tracking-tight leading-tight truncate flex items-center gap-1.5">
                        {isAIPage && <Sparkles size={12} className="text-violet-400 shrink-0" />}
                        {pageTitle}
                    </h2>
                </div>
            </div>

            {/* ── Right: Actions ── */}
            <div className="flex items-center gap-2 shrink-0">

                {/* Search with ⌘K hint */}
                <div className="hidden md:flex relative group">
                    <Search
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-[#484F58] group-focus-within:text-[#3B82F6] transition-colors"
                        size={13}
                    />
                    <input
                        type="text"
                        placeholder="Tìm kiếm..."
                        readOnly
                        className="pl-8 pr-16 py-1.5 bg-[#21262D] border border-[rgba(240,246,252,0.08)] rounded-lg text-[11.5px] font-medium text-[#E6EDF3] placeholder:text-[#484F58] focus:outline-none focus:border-[#3B82F6]/40 focus:ring-1 focus:ring-[#3B82F6]/20 w-48 transition-all cursor-pointer hover:border-[rgba(240,246,252,0.15)]"
                    />
                    <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1 pointer-events-none">
                        <span className="kbd">⌘</span>
                        <span className="kbd">K</span>
                    </div>
                </div>

                {/* Notification Inbox (from existing component) */}
                <NotificationInbox />

                {/* System Notifications Bell */}
                <div className="relative" ref={notifRef}>
                    <button
                        onClick={() => setShowNotifications(v => !v)}
                        className={`relative flex items-center justify-center w-8 h-8 rounded-lg border transition-all duration-300 ${
                            showNotifications 
                            ? "bg-[#3B82F6]/10 border-[#3B82F6] text-[#3B82F6]" 
                            : "bg-[#21262D] border-[rgba(240,246,252,0.08)] text-[#8B949E] hover:text-[#E6EDF3] hover:border-[rgba(240,246,252,0.18)]"
                        }`}
                    >
                        <Bell size={14} />
                        {notifications.length > 0 && (
                            <span className="absolute top-2 right-2 w-1.5 h-1.5 bg-rose-500 rounded-full ring-2 ring-[#161B22]"></span>
                        )}
                    </button>

                    {showNotifications && (
                        <div className="absolute right-0 mt-3 w-[320px] bg-[#21262D] border border-[rgba(240,246,252,0.1)] rounded-xl shadow-2xl shadow-black/80 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                            <div className="p-3.6 border-b border-[rgba(240,246,252,0.08)] flex items-center justify-between bg-[#161B22]/50">
                                <h4 className="text-[12px] font-bold text-[#E6EDF3] flex items-center gap-2">
                                    <Sparkles size={12} className="text-violet-400" /> Thông báo hệ thống
                                </h4>
                                <button
                                    className="text-[9px] font-bold text-[#484F58] hover:text-[#8B949E] uppercase tracking-widest"
                                    onClick={() => setShowNotifications(false)}
                                >
                                    Đóng
                                </button>
                            </div>
                            
                            <div className="max-h-[300px] overflow-y-auto custom-scrollbar">
                                {notifications.length > 0 ? (
                                    notifications.map((n: any) => (
                                        <div key={n.id} className="p-4 border-b border-[rgba(240,246,252,0.03)] hover:bg-[#2D333B]/50 transition-colors cursor-pointer group">
                                            <div className="flex justify-between items-start mb-1">
                                                <span className="text-[9px] font-black text-[#3B82F6] uppercase tracking-[0.1em]">{n.referenceType || "Hệ thống"}</span>
                                                <span className="text-[8px] text-[#484F58] font-bold">{new Date(n.createdAt).toLocaleDateString('vi-VN')}</span>
                                            </div>
                                            <h5 className="text-[11px] font-bold text-[#E6EDF3] mb-1 group-hover:text-[#3B82F6] transition-colors">{n.subject || "Thông báo mới"}</h5>
                                            <p className="text-[10px] text-[#8B949E] line-clamp-2 leading-relaxed">{n.body}</p>
                                        </div>
                                    ))
                                ) : (
                                    <div className="p-8 text-center text-[#484F58]">
                                        <Bell size={24} className="mx-auto mb-2 opacity-20" />
                                        <p className="text-[11px] font-medium">Không có thông báo mới</p>
                                    </div>
                                )}
                            </div>
                            
                            <div className="p-2 border-t border-[rgba(240,246,252,0.08)] bg-[#161B22]/30">
                                <button className="w-full py-2 text-[10px] font-bold text-[#58A6FF] hover:text-[#79C0FF] transition-all">
                                    Đánh dấu tất cả đã đọc
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* User Profile */}
                <div className="flex items-center gap-2 pl-2.5 border-l border-[rgba(240,246,252,0.08)] cursor-pointer hover:bg-[rgba(240,246,252,0.04)] px-2 py-1.5 rounded-lg transition-all group">
                    <div className="h-7 w-7 rounded-md bg-gradient-to-br from-[#3B82F6]/30 to-[#6366F1]/40 border border-[#3B82F6]/30 flex items-center justify-center text-[#60A5FA] font-black text-[10px] shrink-0 select-none">
                        {currentUser?.fullName?.charAt(0)?.toUpperCase() || <User size={13} />}
                    </div>
                    <div className="hidden md:flex flex-col leading-none">
                        <span className="text-[11px] font-bold text-[#E6EDF3] leading-tight">{currentUser?.fullName || "Guest"}</span>
                        <span className="text-[8.5px] font-semibold uppercase tracking-widest text-[#484F58] mt-0.5">
                            {currentUser?.role?.replace(/_/g, " ") || "No Role"}
                        </span>
                    </div>
                    <ChevronDown size={11} className="text-[#484F58] group-hover:text-[#8B949E] transition-colors" />
                </div>
            </div>
        </header>
    );
}
