"use client";

import { useMemo, useState } from "react";
import { ChevronsUpDown, ChevronUp, ChevronDown, Inbox, Search } from "lucide-react";
import Pagination from "./Pagination";
import { TableSkeleton } from "./TableSkeleton";

export interface ERPTableColumn<T> {
    label: string;
    key?: keyof T;
    sortable?: boolean;
    render?: (item: T) => React.ReactNode;
    /** Căn lề nội dung cột */
    align?: "left" | "center" | "right";
    /** Ẩn cột ở màn hình nhỏ (md trở xuống) để responsive */
    hideOnMobile?: boolean;
}

type SortDir = "asc" | "desc" | null;

interface ERPTableProps<T> {
    columns: ERPTableColumn<T>[];
    data: T[];
    density?: "normal" | "compact";
    onRowClick?: (item: T) => void;
    emptyMessage?: string;
    emptyDescription?: string;
    /** Hiển thị skeleton khi đang tải */
    loading?: boolean;
    /** Bật phân trang client-side với số dòng mỗi trang */
    pageSize?: number;
    /** Bật ô tìm kiếm tích hợp (lọc trên dữ liệu đã tải) */
    searchable?: boolean;
    searchPlaceholder?: string;
    /** Giới hạn các cột được tìm kiếm; mặc định mọi cột có `key` */
    searchKeys?: (keyof T)[];
    /** Sticky header khi cuộn dọc (mặc định true) */
    stickyHeader?: boolean;
    /** Hàm sinh key ổn định cho mỗi dòng (mặc định dùng index) */
    getRowKey?: (item: T, index: number) => string | number;
}

const ALIGN_CLS: Record<string, string> = {
    left: "text-left",
    center: "text-center",
    right: "text-right",
};

export default function ERPTable<T extends object>({
    columns,
    data,
    density = "normal",
    onRowClick,
    emptyMessage = "Không có dữ liệu",
    emptyDescription = "Dữ liệu sẽ xuất hiện tại đây",
    loading = false,
    pageSize,
    searchable = false,
    searchPlaceholder = "Tìm kiếm trong bảng...",
    searchKeys,
    stickyHeader = true,
    getRowKey,
}: ERPTableProps<T>) {
    const [sortKey, setSortKey] = useState<keyof T | null>(null);
    const [sortDir, setSortDir] = useState<SortDir>(null);
    const [query, setQuery] = useState("");
    const [page, setPage] = useState(1);

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

    // Lọc theo từ khóa tìm kiếm
    const filteredData = useMemo(() => {
        if (!searchable || !query.trim()) return data;
        const q = query.toLowerCase();
        const keys = searchKeys ?? columns.filter(c => c.key).map(c => c.key as keyof T);
        return data.filter(row =>
            keys.some(k => {
                const v = row[k];
                return v != null && typeof v !== "object" && String(v).toLowerCase().includes(q);
            })
        );
    }, [data, query, searchable, searchKeys, columns]);

    // Sắp xếp
    const sortedData = useMemo(() => {
        if (!sortKey || !sortDir) return filteredData;
        return [...filteredData].sort((a, b) => {
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
    }, [filteredData, sortKey, sortDir]);

    // Phân trang
    const totalItems = sortedData.length;
    const totalPages = pageSize ? Math.max(1, Math.ceil(totalItems / pageSize)) : 1;

    // Reset về trang 1 khi lọc/sort/dữ liệu đổi — điều chỉnh state ngay trong render
    // (pattern React khuyến nghị, tránh setState trong useEffect gây cascading renders).
    const filterSig = `${query}|${String(sortKey)}|${sortDir}|${totalItems}`;
    const [prevSig, setPrevSig] = useState(filterSig);
    let pageToUse = page;
    if (filterSig !== prevSig) {
        setPrevSig(filterSig);
        setPage(1);
        pageToUse = 1;
    }
    const currentPage = Math.min(pageToUse, totalPages);

    const pagedData = useMemo(() => {
        if (!pageSize) return sortedData;
        const start = (currentPage - 1) * pageSize;
        return sortedData.slice(start, start + pageSize);
    }, [sortedData, pageSize, currentPage]);

    const SortIcon = ({ col }: { col: ERPTableColumn<T> }) => {
        if (!col.sortable || !col.key) return null;
        if (sortKey !== col.key || sortDir === null) return <ChevronsUpDown size={11} className="text-slate-400 ml-1 shrink-0" />;
        if (sortDir === "asc") return <ChevronUp size={11} className="text-blue-500 ml-1 shrink-0" />;
        return <ChevronDown size={11} className="text-blue-500 ml-1 shrink-0" />;
    };

    return (
        <div className="w-full">
            {searchable && (
                <div className="mb-3 relative max-w-sm">
                    <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                    <input
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder={searchPlaceholder}
                        className="w-full bg-white border border-slate-200 rounded-lg pl-9 pr-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/10 transition-all"
                    />
                </div>
            )}

            {loading ? (
                <TableSkeleton rows={pageSize ? Math.min(pageSize, 8) : 6} cols={columns.length || 5} />
            ) : (
                <div className="overflow-x-auto w-full rounded-xl overflow-hidden" role="region" aria-label="Data table">
                    <table
                        className={`erp-table border-none rounded-none ${density === "compact" ? "compact" : ""} ${stickyHeader ? "sticky-header" : ""}`}
                        aria-rowcount={totalItems}
                    >
                        <thead>
                            <tr>
                                {columns.map((col, i) => (
                                    <th
                                        key={i}
                                        onClick={() => handleSort(col)}
                                        className={`${col.sortable ? "cursor-pointer select-none hover:bg-slate-100 transition-colors" : ""} ${col.align ? ALIGN_CLS[col.align] : ""} ${col.hideOnMobile ? "hidden md:table-cell" : ""}`}
                                        aria-sort={
                                            col.sortable && col.key && sortKey === col.key
                                                ? (sortDir === "asc" ? "ascending" : sortDir === "desc" ? "descending" : "none")
                                                : undefined
                                        }
                                    >
                                        <span className={`inline-flex items-center ${col.align === "right" ? "justify-end" : col.align === "center" ? "justify-center" : ""}`}>
                                            {col.label}
                                            <SortIcon col={col} />
                                        </span>
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {pagedData.length === 0 ? (
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
                                pagedData.map((row, i) => (
                                    <tr
                                        key={getRowKey ? getRowKey(row, i) : i}
                                        className={`group ${onRowClick ? "cursor-pointer" : ""}`}
                                        onClick={() => onRowClick?.(row)}
                                        tabIndex={onRowClick ? 0 : undefined}
                                        onKeyDown={onRowClick ? (e) => { if (e.key === "Enter" || e.key === " ") onRowClick(row); } : undefined}
                                        role={onRowClick ? "button" : undefined}
                                        aria-label={onRowClick ? `Xem chi tiết hàng ${i + 1}` : undefined}
                                    >
                                        {columns.map((col, j) => (
                                            <td
                                                key={j}
                                                className={`${col.align ? ALIGN_CLS[col.align] : ""} ${col.hideOnMobile ? "hidden md:table-cell" : ""}`}
                                            >
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
            )}

            {!loading && pageSize && totalPages > 1 && (
                <div className="mt-3">
                    <Pagination
                        page={currentPage}
                        totalPages={totalPages}
                        onPageChange={setPage}
                        totalItems={totalItems}
                        pageSize={pageSize}
                    />
                </div>
            )}
        </div>
    );
}
