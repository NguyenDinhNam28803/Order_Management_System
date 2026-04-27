"use client";

import { Plus } from "lucide-react";

export interface ERPTableColumn<T> {
    label: string;
    key?: keyof T;
    render?: (item: T) => React.ReactNode;
}

export default function ERPTable<T>({ columns, data }: { columns: ERPTableColumn<T>[], data: T[] }) {
    return (
        <div className="overflow-x-auto w-full scrollbar-thin scrollbar-thumb-[#000000]/30 rounded-xl overflow-hidden">
            <table className="erp-table border-none rounded-none">
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
                            <td colSpan={columns.length} className="text-center py-20 bg-[#FAF8F5]">
                                <div className="flex flex-col items-center gap-3 opacity-30">
                                    <div className="w-12 h-12 rounded-full bg-[#FFFFFF] flex items-center justify-center">
                                        <Plus className="rotate-45" size={24} />
                                    </div>
                                    <span className="text-[10px] font-bold uppercase tracking-widest text-black">Dữ liệu trống</span>
                                </div>
                            </td>
                        </tr>
                    ) : (
                        data.map((row, i) => (
                            <tr key={i} className="group cursor-pointer">
                                {columns.map((col, j) => (
                                    <td key={j}>
                                        <div className="text-sm transition-colors">
                                            {col.render 
                                                ? col.render(row) 
                                                : (col.key 
                                                    ? (typeof row[col.key] === 'object' && row[col.key] !== null 
                                                        ? JSON.stringify(row[col.key]) 
                                                        : (row[col.key] as React.ReactNode)) 
                                                    : null)}
                                        </div>
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

