"use client";

import React, { useState } from "react";
import { useAuditLogs } from "../../hooks/useAuditLogs";
import { AuditLogDetailModal } from "../../components/AuditLogDetailModal";
import type { AuditLog } from "../../types/api-types";
import {
    Search, Filter, Calendar, Shield, ExternalLink, RefreshCw
} from "lucide-react";
import PageHeader from "../../components/shared/PageHeader";
import { DataTable, DataTableColumn } from "../../components/shared/DataTable";

export default function AuditLogsPage() {
    const [page, setPage] = useState(1);
    const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
    const { data: result, isLoading, refetch } = useAuditLogs(page);
    
    // Safety check: ensure auditLogs is always an array
    const auditLogs = Array.isArray(result?.data) ? result.data : [];
    
    const [searchTerm, setSearchTerm] = useState("");
    const [entityFilter, setEntityFilter] = useState("ALL");

    // Guard against undefined data during initial load
    if (isLoading && auditLogs.length === 0) {
        return <main className="p-6 text-slate-900">Đang tải dữ liệu...</main>;
    }

    const filteredLogs = auditLogs.filter((log: AuditLog) => {
        const matchSearch = log.action?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          log.entityId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          log.user?.fullName?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchEntity = entityFilter === "ALL" || log.entityType === entityFilter;
        return matchSearch && matchEntity;
    });

    const getActionColor = (action: string) => {
        if (action.includes("CREATE")) return "text-emerald-700 bg-emerald-500/10 border border-emerald-500/20";
        if (action.includes("UPDATE") || action.includes("PATCH")) return "text-[#2563EB] bg-[#2563EB]/10 border border-[#2563EB]/20";
        if (action.includes("DELETE")) return "text-rose-600 bg-rose-500/10 border border-rose-500/20";
        if (action.includes("APPROVE")) return "text-purple-700 bg-purple-500/10 border border-purple-500/20";
        return "text-slate-900 bg-[#F1F5F9] border border-slate-200";
    };

    const entityTypes = Array.from(new Set(auditLogs.map((l: AuditLog) => l.entityType)));

    const columns: DataTableColumn<AuditLog>[] = [
        {
            label: "Thời gian",
            render: (log) => (
                <div className="flex items-center gap-2 text-slate-900 whitespace-nowrap">
                    <Calendar size={14} />
                    {log.createdAt && typeof log.createdAt === 'string' ? new Date(log.createdAt).toLocaleString('vi-VN') : 'N/A'}
                </div>
            ),
        },
        {
            label: "Người thực hiện",
            render: (log) => (
                <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-[#2563EB]/10 flex items-center justify-center text-[10px] font-bold text-[#2563EB] border border-[#2563EB]/20 shrink-0">
                        {log.user?.fullName?.charAt(0) || "U"}
                    </div>
                    <div>
                        <p className="font-bold text-slate-900">{log.user?.fullName || "Hệ thống"}</p>
                        <p className="text-[10px] text-[#64748B] uppercase">{log.user?.role}</p>
                    </div>
                </div>
            ),
        },
        {
            label: "Hành động",
            render: (log) => <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${getActionColor(log.action)}`}>{log.action}</span>,
        },
        { label: "Đối tượng", render: (log) => <span className="font-bold text-slate-900">{log.entityType}</span> },
        { label: "Mã ID", hideOnMobile: true, render: () => <span className="text-xs text-slate-900">***-***-***</span> },
        {
            label: "Chi tiết", align: "right",
            render: (log) => (
                <button onClick={() => setSelectedLog(log)} className="p-1.5 text-slate-900 hover:text-[#2563EB] hover:bg-[#2563EB]/10 rounded-xl transition-all" title="Xem chi tiết">
                    <ExternalLink size={16} />
                </button>
            ),
        },
    ];

    return (
        <main className="animate-in fade-in duration-500 p-6 min-h-screen bg-[#F8FAFC] text-slate-900">
            {selectedLog && <AuditLogDetailModal data={selectedLog.newValue ?? {}} onClose={() => setSelectedLog(null)} />}
            
            <PageHeader
                icon={Shield}
                iconColor="blue"
                title="Nhật ký Hệ thống (Audit Logs)"
                subtitle="Truy vết mọi hoạt động và thay đổi dữ liệu trên hệ thống."
                actions={
                    <button
                        onClick={() => refetch()}
                        className="btn-secondary flex items-center gap-2"
                    >
                        <RefreshCw size={16} className={isLoading ? "animate-spin" : ""} /> Làm mới dữ liệu
                    </button>
                }
            />

            <div className="bg-[#F1F5F9] p-4 rounded-xl shadow-xl shadow-[#2563EB]/5 border border-slate-200 flex flex-wrap gap-4 items-center mb-6">
                <div className="flex-1 min-w-[300px] relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8]" size={18} />
                    <input 
                        type="text" 
                        placeholder="Tìm theo hành động, mã đối tượng, người thực hiện..." 
                        className="w-full pl-10 pr-4 py-2 bg-[#FFFFFF] border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 text-slate-900 placeholder:text-[#94A3B8] text-sm"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="flex items-center gap-2 text-sm">
                    <Filter size={18} className="text-[#94A3B8]" />
                    <select 
                        className="bg-[#FFFFFF] border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 text-slate-900 text-sm"
                        value={entityFilter}
                        onChange={(e) => setEntityFilter(e.target.value)}
                    >
                        <option value="ALL">Tất cả đối tượng</option>
                        {entityTypes.map(type => (
                            <option key={type} value={type}>{type}</option>
                        ))}
                    </select>
                </div>
            </div>

            <div className="erp-card table-card overflow-hidden">
                <div className="p-4">
                    <DataTable
                        columns={columns}
                        data={filteredLogs}
                        getRowKey={(log) => log.id}
                        loading={isLoading && filteredLogs.length === 0}
                        emptyMessage="Không tìm thấy nhật ký nào"
                        emptyDescription="Nhật ký hoạt động sẽ xuất hiện tại đây"
                    />
                </div>
                {result && (
                    <div className="flex items-center justify-between p-4 bg-[#FFFFFF] border-t border-slate-200 text-sm">
                        <p>Trang {result.page} / {Math.max(1, Math.ceil((result.total || 1) / (result.limit || 1)))}</p>
                        <div className="flex gap-2">
                            <button 
                                disabled={page === 1}
                                onClick={() => setPage(p => p - 1)}
                                className="px-3 py-1 bg-[#F1F5F9] border border-slate-200 rounded hover:bg-[#2563EB]/5 disabled:opacity-50"
                            >Trước</button>
                            <button 
                                disabled={result && page >= Math.ceil((result.total || 1) / (result.limit || 1))}
                                onClick={() => setPage(p => p + 1)}
                                className="px-3 py-1 bg-[#F1F5F9] border border-slate-200 rounded hover:bg-[#2563EB]/5 disabled:opacity-50"
                            >Sau</button>
                        </div>
                    </div>
                )}
            </div>
        </main>
    );
}
