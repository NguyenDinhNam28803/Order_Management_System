"use client";

import React from "react";
import { getStatusLabel } from "../../utils/formatUtils";

/**
 * StatusBadge — badge trạng thái dùng chung cho toàn hệ thống.
 *
 * Thay thế ~48 bản `STATUS_CONFIG` định nghĩa lặp trong từng trang.
 * - Nhãn: lấy từ getStatusLabel() (formatUtils.statusMap) — tiếng Việt nhất quán.
 * - Màu: tra theo "tone" trong STATUS_TONE; mặc định "slate" nếu chưa khai báo.
 */

export type Tone =
    | "slate" | "blue" | "indigo" | "emerald"
    | "amber" | "rose" | "purple" | "teal"
    | "violet" | "orange";

const TONE_STYLES: Record<Tone, { badge: string; dot: string }> = {
    slate:   { badge: "bg-slate-500/10 text-slate-600 border-slate-500/20",   dot: "bg-slate-400" },
    blue:    { badge: "bg-blue-600/10 text-blue-700 border-blue-600/20",      dot: "bg-blue-600" },
    indigo:  { badge: "bg-indigo-500/10 text-indigo-700 border-indigo-500/20", dot: "bg-indigo-500" },
    emerald: { badge: "bg-emerald-500/10 text-emerald-700 border-emerald-500/20", dot: "bg-emerald-500" },
    amber:   { badge: "bg-amber-500/10 text-amber-700 border-amber-500/20",   dot: "bg-amber-500" },
    rose:    { badge: "bg-rose-500/10 text-rose-700 border-rose-500/20",      dot: "bg-rose-500" },
    purple:  { badge: "bg-purple-500/10 text-purple-700 border-purple-500/20", dot: "bg-purple-500" },
    teal:    { badge: "bg-teal-500/10 text-teal-700 border-teal-500/20",      dot: "bg-teal-500" },
    violet:  { badge: "bg-violet-500/10 text-violet-700 border-violet-500/20", dot: "bg-violet-500" },
    orange:  { badge: "bg-orange-500/10 text-orange-700 border-orange-500/20", dot: "bg-orange-500" },
};

/** Bản đồ trạng thái → tone màu. Khóa viết HOA (giá trị enum backend). */
const STATUS_TONE: Record<string, Tone> = {
    // Nháp / chưa xử lý
    DRAFT: "slate", UNPAID: "slate", INACTIVE: "slate", LOCKED: "slate",
    NEW: "blue", OLD: "slate", NONE: "slate", UNLOCKED: "slate",

    // Đang xử lý / chờ
    PENDING: "amber", PENDING_APPROVAL: "amber", SUBMITTED: "amber", SCHEDULED: "amber",
    UNDER_REVIEW: "amber", PROCESSING: "amber", QUOTING: "amber",
    MATCHING: "amber", IN_SOURCING: "amber", IN_TRANSIT: "amber",
    SHIPPED: "amber", PARTIAL: "amber", PARTIAL_PAID: "amber",
    QUOTED: "blue", EXCEPTION_REVIEW: "rose",
    PENDING_SIGNATURE: "amber", SUSPENDED: "purple", IN_PROGRESS: "blue",
    MATCHED: "blue", DISPUTED: "rose",

    // Thành công / hoàn tất
    APPROVED: "emerald", AUTO_APPROVED: "emerald", ACTIVE: "emerald",
    COMPLETED: "emerald", PAID: "teal", ACCEPTED: "emerald", RESOLVED: "emerald",
    RECEIVED: "emerald", ACKNOWLEDGED: "emerald", CONFIRMED: "emerald",
    AWARDED: "emerald", SIGNED: "emerald", RENEWED: "emerald", REALLOCATED: "emerald",
    DEPT_APPROVED: "emerald", FINANCE_APPROVED: "emerald",
    DIRECTOR_APPROVED: "emerald", CEO_APPROVED: "emerald",

    // Phát hành / mở
    ISSUED: "blue", ORDERED: "blue", OPEN: "blue", PUBLISHED: "blue", PO_CREATED: "indigo",
    INVOICED: "indigo",

    // Lỗi / kết thúc tiêu cực
    REJECTED: "rose", CANCELLED: "rose", DECLINED: "rose",
    TERMINATED: "rose", EXPIRED: "rose", OVERDUE: "rose", ESCALATED: "rose",
    CLOSED: "slate", EXPIRING: "orange",

    // Mức độ ưu tiên / rủi ro
    CRITICAL: "rose", URGENT: "rose", HIGH: "orange", MEDIUM: "amber", LOW: "slate",
};

export function getStatusTone(status?: string | null): Tone {
    if (!status) return "slate";
    return STATUS_TONE[status] ?? "slate";
}

interface StatusBadgeProps {
    status?: string | null;
    /** Ghi đè nhãn hiển thị (mặc định dùng getStatusLabel) */
    label?: string;
    /** Ép tone màu (mặc định suy ra từ status) */
    tone?: Tone;
    size?: "sm" | "md";
    withDot?: boolean;
    className?: string;
}

export default function StatusBadge({
    status,
    label,
    tone,
    size = "md",
    withDot = true,
    className = "",
}: StatusBadgeProps) {
    const t = tone ?? getStatusTone(status);
    const styles = TONE_STYLES[t];
    const text = label ?? getStatusLabel(status ?? undefined);
    const sizeCls = size === "sm"
        ? "px-2 py-0.5 text-[10px] gap-1"
        : "px-3 py-1 text-[11px] gap-1.5";

    return (
        <span
            className={`inline-flex items-center rounded-lg border font-bold uppercase tracking-wider whitespace-nowrap ${sizeCls} ${styles.badge} ${className}`}
        >
            {withDot && <span className={`w-1.5 h-1.5 rounded-full ${styles.dot}`} />}
            {text}
        </span>
    );
}
