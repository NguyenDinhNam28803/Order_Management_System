"use client";

import React from "react";

/**
 * StatCard + StatGrid — thẻ chỉ số dùng chung.
 * Thay thế các định nghĩa `StatCard` nội bộ lặp trong nhiều trang list.
 */

export type StatTone = "blue" | "emerald" | "amber" | "rose" | "purple" | "teal" | "indigo" | "slate";

const TONE_CLS: Record<StatTone, string> = {
    blue:    "bg-blue-600/10 text-blue-600",
    emerald: "bg-emerald-500/10 text-emerald-600",
    amber:   "bg-amber-500/10 text-amber-600",
    rose:    "bg-rose-500/10 text-rose-600",
    purple:  "bg-purple-500/10 text-purple-600",
    teal:    "bg-teal-500/10 text-teal-600",
    indigo:  "bg-indigo-500/10 text-indigo-600",
    slate:   "bg-slate-500/10 text-slate-600",
};

interface StatCardProps {
    icon?: React.ElementType;
    label: string;
    value: React.ReactNode;
    sub?: React.ReactNode;
    tone?: StatTone;
    onClick?: () => void;
    className?: string;
}

export function StatCard({
    icon: Icon,
    label,
    value,
    sub,
    tone = "blue",
    onClick,
    className = "",
}: StatCardProps) {
    return (
        <div
            className={`erp-card p-5 flex items-center gap-4 ${onClick ? "cursor-pointer hover:border-slate-300 transition-colors" : ""} ${className}`}
            onClick={onClick}
            role={onClick ? "button" : undefined}
            tabIndex={onClick ? 0 : undefined}
        >
            {Icon && (
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${TONE_CLS[tone]}`}>
                    <Icon size={20} />
                </div>
            )}
            <div className="min-w-0">
                <p className="text-[0.6875rem] font-bold uppercase tracking-widest text-[#64748B] mb-0.5">{label}</p>
                <p className="text-xl font-bold text-slate-900 truncate num-display">{value}</p>
                {sub && <p className="text-[0.6875rem] text-[#64748B] font-medium mt-0.5 truncate">{sub}</p>}
            </div>
        </div>
    );
}

interface StatGridProps {
    children: React.ReactNode;
    /** Số cột tối đa trên desktop (md+). Mặc định 4. */
    cols?: 2 | 3 | 4 | 5;
    className?: string;
}

const COLS_CLS: Record<number, string> = {
    2: "grid-cols-1 sm:grid-cols-2",
    3: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
    4: "grid-cols-2 lg:grid-cols-4",
    5: "grid-cols-2 lg:grid-cols-5",
};

export function StatGrid({ children, cols = 4, className = "" }: StatGridProps) {
    return (
        <div className={`grid gap-4 ${COLS_CLS[cols]} ${className}`}>
            {children}
        </div>
    );
}

export default StatCard;
