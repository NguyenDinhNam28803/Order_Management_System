"use client";

import { useProcurement } from "../../context/ProcurementContext";
import { Plus } from "lucide-react";

export interface ERPTableColumn<T> {
    label: string;
    key?: keyof T;
    render?: (item: T) => React.ReactNode;
}

export default function ERPTable<T>({ columns, data }: { columns: ERPTableColumn<T>[], data: T[] }) {
    return (
        <div className="erp-card p-0 overflow-hidden">
            <table className="erp-table">
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
                            <td colSpan={columns.length} className="text-center py-10 text-slate-400 italic">Không có dữ liệu.</td>
                        </tr>
                    ) : (
                        data.map((row, i) => (
                            <tr key={i}>
                                {columns.map((col, j) => (
                                    <td key={j}>
                                        {col.render ? col.render(row) : (col.key ? (row[col.key] as React.ReactNode) : null)}
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
