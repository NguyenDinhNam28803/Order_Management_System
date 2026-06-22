"use client";

import React from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

/**
 * Bộ primitive dùng chung cho các trang chi tiết (detail).
 * Thay việc mỗi trang [id] tự dựng layout/InfoRow/Timeline riêng.
 *
 * Gồm: DetailPage (wrapper), DetailHeader, DetailGrid, DetailMain, DetailSide,
 *      Section, InfoRow, InfoGrid, InfoCell, Timeline.
 */

/* ── Wrapper toàn trang ─────────────────────────────────────────── */
export function DetailPage({ children, className = "" }: { children: React.ReactNode; className?: string }) {
    return (
        <div className={`p-6 max-w-7xl mx-auto ${className}`}>{children}</div>
    );
}

/* ── Back link ──────────────────────────────────────────────────── */
export function BackLink({ href, label }: { href: string; label: string }) {
    return (
        <Link
            href={href}
            className="inline-flex items-center gap-2 text-[#64748B] hover:text-slate-900 transition-colors mb-4"
        >
            <ArrowLeft size={16} />
            <span className="text-sm font-medium">{label}</span>
        </Link>
    );
}

/* ── Header card ────────────────────────────────────────────────── */
interface DetailHeaderProps {
    icon?: React.ElementType;
    iconTone?: string; // ví dụ "bg-blue-600/10 text-blue-600"
    title: React.ReactNode;
    subtitle?: React.ReactNode;
    /** Khu vực bên phải: số tiền lớn, status badge... */
    aside?: React.ReactNode;
    /** Hàng nút hành động (hiển thị dưới, ngăn cách bằng border) */
    actions?: React.ReactNode;
    className?: string;
}

export function DetailHeader({
    icon: Icon,
    iconTone = "bg-blue-600/10 text-blue-600",
    title,
    subtitle,
    aside,
    actions,
    className = "",
}: DetailHeaderProps) {
    return (
        <div className={`erp-card p-6 mb-6 ${className}`}>
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <div className="flex items-center gap-4 min-w-0">
                    {Icon && (
                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 ${iconTone}`}>
                            <Icon size={28} />
                        </div>
                    )}
                    <div className="min-w-0">
                        <h1 className="text-2xl font-bold text-slate-900 tracking-tight truncate">{title}</h1>
                        {subtitle && <p className="text-[#64748B] text-sm mt-1">{subtitle}</p>}
                    </div>
                </div>
                {aside && <div className="flex items-center gap-4 shrink-0">{aside}</div>}
            </div>
            {actions && (
                <div className="flex flex-wrap gap-3 mt-6 pt-6 border-t border-slate-200">{actions}</div>
            )}
        </div>
    );
}

/* ── Grid 2 cột: nội dung chính + sidebar ───────────────────────── */
export function DetailGrid({ children, className = "" }: { children: React.ReactNode; className?: string }) {
    return <div className={`grid grid-cols-1 xl:grid-cols-3 gap-6 ${className}`}>{children}</div>;
}
export function DetailMain({ children, className = "" }: { children: React.ReactNode; className?: string }) {
    return <div className={`xl:col-span-2 space-y-6 ${className}`}>{children}</div>;
}
export function DetailSide({ children, className = "" }: { children: React.ReactNode; className?: string }) {
    return <div className={`space-y-6 ${className}`}>{children}</div>;
}

/* ── Section card ───────────────────────────────────────────────── */
interface SectionProps {
    title?: React.ReactNode;
    icon?: React.ElementType;
    actions?: React.ReactNode;
    children: React.ReactNode;
    className?: string;
}
export function Section({ title, icon: Icon, actions, children, className = "" }: SectionProps) {
    return (
        <div className={`erp-card p-6 ${className}`}>
            {(title || actions) && (
                <div className="flex items-center justify-between mb-5">
                    <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                        {Icon && <Icon size={18} className="text-blue-600" />}
                        {title}
                    </h2>
                    {actions}
                </div>
            )}
            {children}
        </div>
    );
}

/* ── InfoRow: cặp nhãn – giá trị nằm ngang ──────────────────────── */
export function InfoRow({ label, value }: { label: React.ReactNode; value: React.ReactNode }) {
    return (
        <div className="flex items-center justify-between py-2.5 border-b border-slate-100 last:border-0 gap-4">
            <span className="text-sm text-[#64748B] shrink-0">{label}</span>
            <span className="text-sm font-semibold text-slate-900 text-right min-w-0 truncate">{value}</span>
        </div>
    );
}

/* ── InfoCell + InfoGrid: ô nhãn trên / giá trị dưới ────────────── */
export function InfoCell({ label, value, className = "" }: { label: React.ReactNode; value: React.ReactNode; className?: string }) {
    return (
        <div className={`p-4 bg-[#F8FAFC] rounded-xl ${className}`}>
            <label className="text-[0.6875rem] font-bold text-[#64748B] uppercase tracking-wider">{label}</label>
            <p className="text-slate-900 font-semibold mt-2 break-words">{value}</p>
        </div>
    );
}
export function InfoGrid({ children, cols = 4, className = "" }: { children: React.ReactNode; cols?: 2 | 3 | 4; className?: string }) {
    const c = cols === 2 ? "grid-cols-1 sm:grid-cols-2" : cols === 3 ? "grid-cols-2 md:grid-cols-3" : "grid-cols-2 md:grid-cols-4";
    return <div className={`grid ${c} gap-4 ${className}`}>{children}</div>;
}

/* ── Timeline ───────────────────────────────────────────────────── */
export interface TimelineStep {
    label: string;
    date?: React.ReactNode;
    done?: boolean;
    icon?: React.ElementType;
    tone?: string; // class nền icon khi done, ví dụ "bg-emerald-500/10 text-emerald-600"
}
export function Timeline({ steps }: { steps: TimelineStep[] }) {
    return (
        <div className="relative">
            <div className="absolute left-5 top-2 bottom-2 w-0.5 bg-slate-200" />
            <div className="space-y-6 relative">
                {steps.map((s, i) => {
                    const Icon = s.icon;
                    const toneCls = s.done ? (s.tone ?? "bg-emerald-500/10 text-emerald-600") : "bg-slate-100 text-slate-400";
                    return (
                        <div key={i} className="flex items-center gap-4">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center relative z-10 shrink-0 ${toneCls}`}>
                                {Icon && <Icon size={16} />}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-slate-900 font-semibold">{s.label}</p>
                                <p className="text-[#64748B] text-sm">{s.date ?? "—"}</p>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
