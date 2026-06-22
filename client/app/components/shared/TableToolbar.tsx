"use client";

import React from "react";
import { Search } from "lucide-react";
import FilterTabs, { FilterTabItem } from "./FilterTabs";

/**
 * TableToolbar — thanh công cụ phía trên bảng: ô tìm kiếm + filter tabs + actions.
 * Gộp pattern search/filter/actions vốn viết tay lặp trong các trang list.
 */

interface TableToolbarProps<V extends string = string> {
    search?: string;
    onSearchChange?: (value: string) => void;
    searchPlaceholder?: string;
    tabs?: FilterTabItem<V>[];
    tabValue?: V;
    onTabChange?: (value: V) => void;
    /** Nút/element actions bên phải (vd: nút "Tạo mới") */
    actions?: React.ReactNode;
    /** Bộ lọc phụ (select, date range...) đặt cạnh search */
    filters?: React.ReactNode;
    className?: string;
}

export default function TableToolbar<V extends string = string>({
    search,
    onSearchChange,
    searchPlaceholder = "Tìm kiếm...",
    tabs,
    tabValue,
    onTabChange,
    actions,
    filters,
    className = "",
}: TableToolbarProps<V>) {
    return (
        <div className={`flex flex-col gap-3 ${className}`}>
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-3 flex-1 min-w-0">
                    {onSearchChange && (
                        <div className="relative flex-1 min-w-[200px] max-w-sm">
                            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                            <input
                                type="text"
                                value={search ?? ""}
                                onChange={(e) => onSearchChange(e.target.value)}
                                placeholder={searchPlaceholder}
                                className="w-full bg-white border border-slate-200 rounded-lg pl-9 pr-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/10 transition-all"
                            />
                        </div>
                    )}
                    {filters}
                </div>
                {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
            </div>

            {tabs && tabs.length > 0 && tabValue !== undefined && onTabChange && (
                <FilterTabs tabs={tabs} value={tabValue} onChange={onTabChange} />
            )}
        </div>
    );
}
