"use client";

import { Plus } from "lucide-react";

export interface ERPTableColumn<T> {
    label: string;
    key?: keyof T;
    render?: (item: T) => React.ReactNode;
}

interface ERPTableProps<T> {
    columns: ERPTableColumn<T>[];
    data: T[];
    density?: "normal" | "compact";
    onRowClick?: (item: T) => void;
    emptyMessage?: string;
}

export default function ERPTable<T>({
    columns,
    data,
    density = "normal",
    onRowClick,
    emptyMessage = "Không có dữ liệu",
}: ERPTableProps<T>) {
    return (
        <div className="overflow-x-auto w-full rounded-xl overflow-hidden">
            <table className={`erp-table border-none rounded-none ${density === "compact" ? "compact" : ""}`}>
                <thead>
                    <tr>
                        {columns.map((col, i) => (
                            <th key={i}>{col.label}</th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {data.length === 0 ? (
                        <tr>
                            <td colSpan={columns.length} className="text-center py-16 bg-white">
                                <div className="flex flex-col items-center gap-3 text-slate-400">
                                    <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center">
                                        <Plus className="rotate-45 text-slate-400" size={20} />
                                    </div>
                                    <div>
                                        <p className="text-sm font-semibold text-slate-500">{emptyMessage}</p>
                                        <p className="text-xs text-slate-400 mt-0.5">Dữ liệu sẽ xuất hiện tại đây</p>
                                    </div>
                                </div>
                            </td>
                        </tr>
                    ) : (
                        data.map((row, i) => (
                            <tr
                                key={i}
                                className={`group ${onRowClick ? "cursor-pointer" : ""}`}
                                onClick={() => onRowClick?.(row)}
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
