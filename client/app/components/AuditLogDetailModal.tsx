"use client";

import React, { useEffect } from "react";
import { createPortal } from "react-dom";
import { FileSearch, X } from "lucide-react";
import { formatDateTime } from "../utils/formatUtils";

interface DistributionItem {
    notes?: string;
    allocatedAmount?: number;
}

interface AuditLogData {
    distribution?: DistributionItem[];
    fiscalYear?: number;
    totalBudget?: number;
    reservedAmount?: number;
    currentCommitted?: number;
    [key: string]: unknown;
}

interface AuditLogDetailModalProps {
    data: AuditLogData;
    onClose: () => void;
}

// ── Helpers ─────────────────────────────────────────────────────────────────
const humanize = (key: string) =>
    key
        .replace(/_/g, " ")
        .replace(/([a-z\d])([A-Z])/g, "$1 $2")
        .replace(/^./, (c) => c.toUpperCase())
        .trim();

const isIsoDate = (v: string) => /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(v);

/** Trả về string nếu là giá trị "phẳng", hoặc null nếu là object/array cần render khối JSON */
const formatScalar = (v: unknown): string | null => {
    if (v === null || v === undefined || v === "") return "—";
    if (typeof v === "boolean") return v ? "Có" : "Không";
    if (typeof v === "number") return v.toLocaleString("vi-VN");
    if (typeof v === "string") return isIsoDate(v) ? formatDateTime(v) : v;
    return null;
};

function FieldRow({ label, value }: { label: string; value: React.ReactNode }) {
    return (
        <div className="flex items-start justify-between gap-4 py-2.5 border-b border-slate-100 last:border-0">
            <span className="text-xs font-bold uppercase tracking-wider text-[#64748B] shrink-0 pt-0.5">{label}</span>
            <span className="text-sm font-semibold text-slate-900 text-right break-words min-w-0">{value}</span>
        </div>
    );
}

function JsonBlock({ value }: { value: unknown }) {
    return (
        <pre className="text-[11px] leading-relaxed bg-slate-50 border border-slate-200 rounded-lg p-3 overflow-x-auto text-slate-700 num-display">
            {JSON.stringify(value, null, 2)}
        </pre>
    );
}

export const AuditLogDetailModal: React.FC<AuditLogDetailModalProps> = ({ data, onClose }) => {
    useEffect(() => {
        const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
        document.addEventListener("keydown", onKey);
        return () => document.removeEventListener("keydown", onKey);
    }, [onClose]);

    const renderContent = () => {
        // Budget Distribution Template
        if (data?.distribution && Array.isArray(data.distribution)) {
            return (
                <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                        <div className="p-3 bg-[#F8FAFC] rounded-xl">
                            <p className="text-[10px] font-bold uppercase tracking-wider text-[#64748B]">Năm tài chính</p>
                            <p className="text-sm font-bold text-slate-900 mt-1 num-display">{data.fiscalYear ?? "—"}</p>
                        </div>
                        <div className="p-3 bg-[#F8FAFC] rounded-xl">
                            <p className="text-[10px] font-bold uppercase tracking-wider text-[#64748B]">Tổng ngân sách</p>
                            <p className="text-sm font-bold text-slate-900 mt-1 num-display">{data.totalBudget?.toLocaleString("vi-VN")} ₫</p>
                        </div>
                    </div>
                    <div className="overflow-x-auto rounded-xl border border-slate-200">
                        <table className="erp-table text-xs compact border-none rounded-none">
                            <thead>
                                <tr>
                                    <th>Ghi chú</th>
                                    <th className="text-right">Ngân sách</th>
                                </tr>
                            </thead>
                            <tbody>
                                {data.distribution.map((item: DistributionItem, i: number) => (
                                    <tr key={i}>
                                        <td>{item.notes || "—"}</td>
                                        <td className="text-right font-bold num-display">{Number(item.allocatedAmount).toLocaleString("vi-VN")} ₫</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            );
        }

        // Budget Reservation Template
        if (data?.reservedAmount !== undefined) {
            return (
                <div>
                    <FieldRow label="Số tiền giữ chỗ" value={`${data.reservedAmount?.toLocaleString("vi-VN")} ₫`} />
                    <FieldRow label="Đã cam kết" value={`${data.currentCommitted?.toLocaleString("vi-VN")} ₫`} />
                </div>
            );
        }

        // Generic key-value template
        const entries = Object.entries(data ?? {});
        if (entries.length === 0) {
            return (
                <div className="py-10 text-center text-sm text-[#64748B]">
                    Không có dữ liệu chi tiết cho bản ghi này.
                </div>
            );
        }
        return (
            <div className="space-y-3">
                {entries.map(([key, value]) => {
                    const scalar = formatScalar(value);
                    if (scalar !== null) {
                        return <FieldRow key={key} label={humanize(key)} value={scalar} />;
                    }
                    return (
                        <div key={key} className="space-y-1.5">
                            <p className="text-xs font-bold uppercase tracking-wider text-[#64748B]">{humanize(key)}</p>
                            <JsonBlock value={value} />
                        </div>
                    );
                })}
            </div>
        );
    };

    const content = (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4" role="dialog" aria-modal="true">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" onClick={onClose} aria-hidden="true" />
            <div className="relative bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="px-6 py-5 border-b border-slate-200 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-[#2563EB]/10 border border-[#2563EB]/20 flex items-center justify-center text-[#2563EB] shrink-0">
                            <FileSearch size={18} />
                        </div>
                        <div>
                            <h2 className="text-base font-bold text-slate-900">Chi tiết thay đổi</h2>
                            <p className="text-xs text-[#64748B]">Dữ liệu bản ghi nhật ký hệ thống</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors" aria-label="Đóng">
                        <X size={18} />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 max-h-[60vh] overflow-y-auto">{renderContent()}</div>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-slate-200 flex justify-end bg-[#F8FAFC]">
                    <button onClick={onClose} className="btn-primary text-sm">
                        Đã hiểu
                    </button>
                </div>
            </div>
        </div>
    );

    if (typeof document === "undefined") return null;
    return createPortal(content, document.body);
};
