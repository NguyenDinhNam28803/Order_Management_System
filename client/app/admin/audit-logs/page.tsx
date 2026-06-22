"use client";

import React, { useState } from "react";
import { useAuditLogs } from "../../hooks/useAuditLogs";
import { AuditLogDetailModal } from "../../components/AuditLogDetailModal";
import type { AuditLog } from "../../types/api-types";
import {
    Calendar, Shield, ExternalLink, RefreshCw, PlusCircle, PencilLine, Trash2, Database,
} from "lucide-react";
import PageHeader from "../../components/shared/PageHeader";
import { DataTable, DataTableColumn } from "../../components/shared/DataTable";
import TableToolbar from "../../components/shared/TableToolbar";
import { StatCard, StatGrid } from "../../components/shared/StatCard";
import Pagination from "../../components/shared/Pagination";
import { formatDateTime } from "../../utils/formatUtils";

export default function AuditLogsPage() {
    const [page, setPage] = useState(1);
    const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
    const { data: result, isLoading, refetch } = useAuditLogs(page);

    const auditLogs = Array.isArray(result?.data) ? result.data : [];

    const [searchTerm, setSearchTerm] = useState("");
    const [entityFilter, setEntityFilter] = useState("ALL");

    const filteredLogs = auditLogs.filter((log: AuditLog) => {
        const matchSearch = log.action?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            log.entityId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            log.user?.fullName?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchEntity = entityFilter === "ALL" || log.entityType === entityFilter;
        return matchSearch && matchEntity;
    });

    const entityTypes = Array.from(new Set(auditLogs.map((l: AuditLog) => l.entityType)));
    const totalRecords = result?.total ?? auditLogs.length;
    const pageSize = result?.limit ?? 20;
    const totalPages = Math.max(1, Math.ceil(totalRecords / pageSize));

    // Thống kê hành động trên trang hiện tại
    const pageCounts = filteredLogs.reduce(
        (acc, l) => {
            const a = l.action ?? "";
            if (a.includes("CREATE")) acc.create++;
            else if (a.includes("UPDATE") || a.includes("PATCH")) acc.update++;
            else if (a.includes("DELETE")) acc.delete++;
            return acc;
        },
        { create: 0, update: 0, delete: 0 },
    );

    const getActionTone = (action: string) => {
        if (action.includes("CREATE")) return "text-emerald-700 bg-emerald-500/10 border border-emerald-500/20";
        if (action.includes("UPDATE") || action.includes("PATCH")) return "text-[#2563EB] bg-[#2563EB]/10 border border-[#2563EB]/20";
        if (action.includes("DELETE")) return "text-rose-600 bg-rose-500/10 border border-rose-500/20";
        if (action.includes("APPROVE")) return "text-purple-700 bg-purple-500/10 border border-purple-500/20";
        return "text-slate-700 bg-slate-500/10 border border-slate-200";
    };

    const columns: DataTableColumn<AuditLog>[] = [
        {
            label: "Thời gian",
            render: (log) => (
                <div className="flex items-center gap-2 text-slate-900 whitespace-nowrap num-display text-xs">
                    <Calendar size={14} className="text-slate-400 shrink-0" />
                    {typeof log.createdAt === "string" ? formatDateTime(log.createdAt) : "—"}
                </div>
            ),
        },
        {
            label: "Người thực hiện",
            render: (log) => (
                <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-[#2563EB]/10 flex items-center justify-center text-[11px] font-bold text-[#2563EB] border border-[#2563EB]/20 shrink-0 uppercase">
                        {log.user?.fullName?.charAt(0) || "S"}
                    </div>
                    <div className="min-w-0">
                        <p className="font-bold text-slate-900 truncate">{log.user?.fullName || "Hệ thống"}</p>
                        <p className="text-[10px] text-[#64748B] uppercase tracking-wide">{log.user?.role || "SYSTEM"}</p>
                    </div>
                </div>
            ),
        },
        {
            label: "Hành động",
            render: (log) => <span className={`inline-block px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wide ${getActionTone(log.action)}`}>{log.action}</span>,
        },
        {
            label: "Đối tượng", hideOnMobile: true,
            render: (log) => (
                <span className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-700">
                    <Database size={12} className="text-slate-400" />
                    {log.entityType}
                </span>
            ),
        },
        {
            label: "Mã đối tượng", hideOnMobile: true,
            render: (log) => (
                <span className="text-[11px] text-slate-500 num-display" title={log.entityId ?? ""}>
                    {log.entityId ? `#${log.entityId.slice(0, 8)}` : "—"}
                </span>
            ),
        },
        {
            label: "Chi tiết", align: "right",
            render: (log) => (
                <button onClick={() => setSelectedLog(log)} className="p-2 text-slate-500 hover:text-[#2563EB] hover:bg-[#2563EB]/10 rounded-lg transition-all" title="Xem chi tiết thay đổi">
                    <ExternalLink size={15} />
                </button>
            ),
        },
    ];

    const entitySelect = (
        <select
            className="h-10 px-3 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-900 focus:outline-none focus:border-blue-500/50 transition-all cursor-pointer"
            value={entityFilter}
            onChange={(e) => setEntityFilter(e.target.value)}
        >
            <option value="ALL">Tất cả đối tượng</option>
            {entityTypes.map((type) => (
                <option key={type} value={type}>{type}</option>
            ))}
        </select>
    );

    return (
        <main className="animate-in fade-in duration-500 p-6 space-y-6 min-h-screen bg-[#F8FAFC] text-slate-900">
            {selectedLog && <AuditLogDetailModal data={selectedLog.newValue ?? {}} onClose={() => setSelectedLog(null)} />}

            <PageHeader
                icon={Shield}
                iconColor="blue"
                title="Nhật ký Hệ thống (Audit Logs)"
                subtitle="Truy vết mọi hoạt động và thay đổi dữ liệu trên hệ thống."
                actions={
                    <button onClick={() => refetch()} className="btn-secondary flex items-center gap-2">
                        <RefreshCw size={16} className={isLoading ? "animate-spin" : ""} /> Làm mới
                    </button>
                }
            />

            {/* Overview stats */}
            <StatGrid cols={4}>
                <StatCard icon={Database} label="Tổng bản ghi" value={totalRecords.toLocaleString("vi-VN")} sub={`${totalPages} trang`} tone="blue" />
                <StatCard icon={PlusCircle} label="Tạo mới" value={pageCounts.create} sub="trang hiện tại" tone="emerald" />
                <StatCard icon={PencilLine} label="Cập nhật" value={pageCounts.update} sub="trang hiện tại" tone="indigo" />
                <StatCard icon={Trash2} label="Xóa" value={pageCounts.delete} sub="trang hiện tại" tone="rose" />
            </StatGrid>

            {/* Toolbar + Table */}
            <div className="erp-card table-card p-4 space-y-4">
                <TableToolbar
                    search={searchTerm}
                    onSearchChange={setSearchTerm}
                    searchPlaceholder="Tìm theo hành động, mã đối tượng, người thực hiện..."
                    filters={entitySelect}
                />
                <DataTable
                    columns={columns}
                    data={filteredLogs}
                    getRowKey={(log) => log.id}
                    loading={isLoading && filteredLogs.length === 0}
                    emptyMessage="Không tìm thấy nhật ký nào"
                    emptyDescription="Nhật ký hoạt động sẽ xuất hiện tại đây"
                />
                {totalPages > 1 && (
                    <Pagination
                        page={result?.page ?? page}
                        totalPages={totalPages}
                        onPageChange={setPage}
                        totalItems={totalRecords}
                        pageSize={pageSize}
                    />
                )}
            </div>
        </main>
    );
}
