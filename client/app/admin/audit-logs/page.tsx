"use client";

import React, { useState } from "react";
import { useAuditLogs } from "../../hooks/useAuditLogs";
import { AuditLogDetailModal } from "../../components/AuditLogDetailModal";
import { 
    History, Search, Filter, Calendar, Shield, ExternalLink, RefreshCw 
} from "lucide-react";

export default function AuditLogsPage() {
    const [page, setPage] = useState(1);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [selectedLog, setSelectedLog] = useState<any | null>(null);
    const { data: result, isLoading, refetch } = useAuditLogs(page);
    
    // Safety check: ensure auditLogs is always an array
    const auditLogs = Array.isArray(result?.data) ? result.data : [];
    
    const [searchTerm, setSearchTerm] = useState("");
    const [entityFilter, setEntityFilter] = useState("ALL");

    // Guard against undefined data during initial load
    if (isLoading && auditLogs.length === 0) {
        return <main className="p-6 text-[#0F172A]">Đang tải dữ liệu...</main>;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const filteredLogs = auditLogs.filter((log: any) => {
        const matchSearch = log.action?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          log.entityId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          log.user?.fullName?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchEntity = entityFilter === "ALL" || log.entityType === entityFilter;
        return matchSearch && matchEntity;
    });

    const getActionColor = (action: string) => {
        if (action.includes("CREATE")) return "text-black bg-emerald-500/10 border border-emerald-500/20";
        if (action.includes("UPDATE") || action.includes("PATCH")) return "text-[#2563EB] bg-[#2563EB]/10 border border-[#2563EB]/20";
        if (action.includes("DELETE")) return "text-black bg-rose-500/10 border border-rose-500/20";
        if (action.includes("APPROVE")) return "text-black bg-purple-500/10 border border-purple-500/20";
        return "text-[#0F172A] bg-[#F1F5F9] border border-[#E2E8F0]";
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const entityTypes = Array.from(new Set(auditLogs.map((l: any) => l.entityType)));

    return (
        <main className="animate-in fade-in duration-500 p-6 min-h-screen bg-[#FFFFFF] text-[#0F172A]">
            {selectedLog && <AuditLogDetailModal data={selectedLog.newValue} onClose={() => setSelectedLog(null)} />}
            
            <div className="flex justify-between items-center mb-10">
                <div className="flex items-center gap-3">
                    <div className="p-3 bg-[#2563EB] text-white rounded-xl shadow-lg shadow-[#2563EB]/20">
                        <Shield size={24} />
                    </div>
                    <div>
                        <h1 className="text-2xl font-black text-[#0F172A] tracking-tight">Nhật ký Hệ thống (Audit Logs)</h1>
                        <p className="text-[#64748B] text-sm font-medium">Truy vết mọi hoạt động và thay đổi dữ liệu trên hệ thống</p>
                    </div>
                </div>
                <button 
                    onClick={() => refetch()}
                    className="flex items-center gap-2 px-4 py-2 bg-[#F1F5F9] border border-[#E2E8F0] rounded-xl hover:bg-[#0F172A] text-[#0F172A] hover:text-white transition-all shadow-sm"
                >
                    <RefreshCw size={18} className={isLoading ? "animate-spin" : ""} /> Làm mới dữ liệu
                </button>
            </div>

            <div className="bg-[#F1F5F9] p-4 rounded-xl shadow-xl shadow-[#2563EB]/5 border border-[#E2E8F0] flex flex-wrap gap-4 items-center mb-6">
                <div className="flex-1 min-w-[300px] relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8]" size={18} />
                    <input 
                        type="text" 
                        placeholder="Tìm theo hành động, mã đối tượng, người thực hiện..." 
                        className="w-full pl-10 pr-4 py-2 bg-[#FFFFFF] border border-[#E2E8F0] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 text-[#0F172A] placeholder:text-[#94A3B8] text-sm"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="flex items-center gap-2 text-sm">
                    <Filter size={18} className="text-[#94A3B8]" />
                    <select
                        className="bg-[#FFFFFF] border border-[#E2E8F0] rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 text-[#0F172A] text-sm"
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

            <div className="bg-[#F1F5F9] rounded-xl shadow-xl shadow-[#2563EB]/5 border border-[#E2E8F0] overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="erp-table text-xs">
                        <thead className="bg-[#FFFFFF] border-b border-[#E2E8F0] text-[#64748B] text-xs uppercase tracking-wider">
                            <tr>
                                <th className="px-6 py-4 font-semibold">Thời gian</th>
                                <th className="px-6 py-4 font-semibold">Người thực hiện</th>
                                <th className="px-6 py-4 font-semibold">Hành động</th>
                                <th className="px-6 py-4 font-semibold">Đối tượng</th>
                                <th className="px-6 py-4 font-semibold">Mã ID</th>
                                <th className="px-6 py-4 font-semibold text-right">Chi tiết</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#E2E8F0] text-sm">
                            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                            {filteredLogs.length > 0 ? filteredLogs.map((log: any) => (
                                <tr key={log.id} className="hover:bg-[#FFFFFF]/30 transition-colors group">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center gap-2 text-[#0F172A]">
                                            <Calendar size={14} />
                                            {log.createdAt && typeof log.createdAt === 'string' ? new Date(log.createdAt).toLocaleString('vi-VN') : 'N/A'}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center gap-2">
                                            <div className="w-7 h-7 rounded-full bg-[#2563EB]/10 flex items-center justify-center text-[10px] font-bold text-[#2563EB] border border-[#2563EB]/20">
                                                {log.user?.fullName?.charAt(0) || "U"}
                                            </div>
                                            <div>
                                                <p className="font-bold text-[#0F172A]">{log.user?.fullName || "Hệ thống"}</p>
                                                <p className="text-[10px] text-[#64748B] uppercase">{log.user?.role}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${getActionColor(log.action)}`}>
                                            {log.action}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap font-bold text-[#0F172A]">
                                        {log.entityType}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-xs text-[#64748B]">
                                        ***-***-***
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <button 
                                            onClick={() => setSelectedLog(log)}
                                            className="p-1.5 text-[#64748B] hover:text-[#2563EB] hover:bg-[#2563EB]/10 rounded-xl transition-all"
                                        >
                                            <ExternalLink size={16} />
                                        </button>
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center text-[#64748B]">
                                        <History size={48} className="mx-auto mb-3 opacity-20" />
                                        {isLoading ? "Đang tải dữ liệu..." : "Không tìm thấy nhật ký nào."}
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
                {result && (
                    <div className="flex items-center justify-between p-4 bg-[#FFFFFF] border-t border-[#E2E8F0] text-sm">
                        <p>Trang {result.page} / {Math.max(1, Math.ceil((result.total || 1) / (result.limit || 1)))}</p>
                        <div className="flex gap-2">
                            <button
                                disabled={page === 1}
                                onClick={() => setPage(p => p - 1)}
                                className="px-3 py-1 bg-[#F1F5F9] border border-[#E2E8F0] rounded hover:bg-[#2563EB]/5 disabled:opacity-50"
                            >Trước</button>
                            <button
                                disabled={result && page >= Math.ceil((result.total || 1) / (result.limit || 1))}
                                onClick={() => setPage(p => p + 1)}
                                className="px-3 py-1 bg-[#F1F5F9] border border-[#E2E8F0] rounded hover:bg-[#2563EB]/5 disabled:opacity-50"
                            >Sau</button>
                        </div>
                    </div>
                )}
            </div>
        </main>
    );
}
