"use client";

import { useState } from "react";
import { ChevronsUpDown, ChevronUp, ChevronDown, Inbox } from "lucide-react";

export interface ERPTableColumn<T> {
    label: string;
    key?: keyof T;
    sortable?: boolean;
    render?: (item: T) => React.ReactNode;
}

type SortDir = "asc" | "desc" | null;

interface ERPTableProps<T> {
    columns: ERPTableColumn<T>[];
    data: T[];
    density?: "normal" | "compact";
    onRowClick?: (item: T) => void;
    emptyMessage?: string;
    emptyDescription?: string;
}

export default function ERPTable<T extends object>({
    columns,
    data,
    density = "normal",
    onRowClick,
    emptyMessage = "Không có dữ liệu",
    emptyDescription = "Dữ liệu sẽ xuất hiện tại đây",
}: ERPTableProps<T>) {
    const [sortKey, setSortKey] = useState<keyof T | null>(null);
    const [sortDir, setSortDir] = useState<SortDir>(null);

    const handleSort = (col: ERPTableColumn<T>) => {
        if (!col.sortable || !col.key) return;
        if (sortKey === col.key) {
            setSortDir(prev => prev === "asc" ? "desc" : prev === "desc" ? null : "asc");
            if (sortDir === "desc") setSortKey(null);
        } else {
            setSortKey(col.key);
            setSortDir("asc");
        }
    };

    const sortedData = (() => {
        if (!sortKey || !sortDir) return data;
        return [...data].sort((a, b) => {
            const av = a[sortKey];
            const bv = b[sortKey];
            if (av == null && bv == null) return 0;
            if (av == null) return sortDir === "asc" ? 1 : -1;
            if (bv == null) return sortDir === "asc" ? -1 : 1;
            if (typeof av === "string" && typeof bv === "string") {
                return sortDir === "asc" ? av.localeCompare(bv) : bv.localeCompare(av);
            }
            if (av < bv) return sortDir === "asc" ? -1 : 1;
            if (av > bv) return sortDir === "asc" ? 1 : -1;
            return 0;
        });
    })();

    const SortIcon = ({ col }: { col: ERPTableColumn<T> }) => {
        if (!col.sortable || !col.key) return null;
        if (sortKey !== col.key || sortDir === null) return <ChevronsUpDown size={11} className="text-slate-400 ml-1 shrink-0" />;
        if (sortDir === "asc") return <ChevronUp size={11} className="text-blue-500 ml-1 shrink-0" />;
        return <ChevronDown size={11} className="text-blue-500 ml-1 shrink-0" />;
    };

    return (
        <div className="overflow-x-auto w-full rounded-xl overflow-hidden" role="region" aria-label="Data table">
            <table
                className={`erp-table border-none rounded-none ${density === "compact" ? "compact" : ""}`}
                aria-rowcount={data.length}
            >
                <thead>
                    <tr>
                        {columns.map((col, i) => (
                            <th
                                key={i}
                                onClick={() => handleSort(col)}
                                className={col.sortable ? "cursor-pointer select-none hover:bg-slate-100 transition-colors" : ""}
                                aria-sort={
                                    col.sortable && col.key && sortKey === col.key
                                        ? (sortDir === "asc" ? "ascending" : sortDir === "desc" ? "descending" : "none")
                                        : undefined
                                }
                            >
                                <span className="inline-flex items-center">
                                    {col.label}
                                    <SortIcon col={col} />
                                </span>
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {sortedData.length === 0 ? (
                        <tr>
                            <td colSpan={columns.length} className="bg-white">
                                <div className="empty-state">
                                    <div className="h-14 w-14 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center mb-3 empty-state-icon">
                                        <Inbox size={22} className="text-slate-300" />
                                    </div>
                                    <p className="empty-state-title">{emptyMessage}</p>
                                    <p className="empty-state-desc">{emptyDescription}</p>
                                </div>
                            </td>
                        </tr>
                    ) : (
                        sortedData.map((row, i) => (
                            <tr
                                key={i}
                                className={`group ${onRowClick ? "cursor-pointer" : ""}`}
                                onClick={() => onRowClick?.(row)}
                                tabIndex={onRowClick ? 0 : undefined}
                                onKeyDown={onRowClick ? (e) => { if (e.key === "Enter" || e.key === " ") onRowClick(row); } : undefined}
                                role={onRowClick ? "button" : undefined}
                                aria-label={onRowClick ? `Xem chi tiết hàng ${i + 1}` : undefined}
                            >
                                {columns.map((col, j) => (
                                    <td key={j}>
                                        {col.render
                                            ? col.render(row)
                                            : (col.key
                                                ? (typeof row[col.key] === "object" && row[col.key] !== null
                                                    ? JSON.stringify(row[col.key])
                                                    : (row[col.key] as React.ReactNode))
                                                : null)}
                                    </td>
                                ))}
                            </tr>
                        ))
                    )}
                </tbody>
            </table>
        </div>
    );
}
