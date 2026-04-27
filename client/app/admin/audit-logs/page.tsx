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
        return <main className="p-6 text-[#000000]">Đang tải dữ liệu...</main>;
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
        if (action.includes("UPDATE") || action.includes("PATCH")) return "text-[#B4533A] bg-[#B4533A]/10 border border-[#B4533A]/20";
        if (action.includes("DELETE")) return "text-black bg-rose-500/10 border border-rose-500/20";
        if (action.includes("APPROVE")) return "text-black bg-purple-500/10 border border-purple-500/20";
        return "text-[#000000] bg-[#FAF8F5] border border-[rgba(148,163,184,0.1)]";
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const entityTypes = Array.from(new Set(auditLogs.map((l: any) => l.entityType)));

    return (
        <main className="animate-in fade-in duration-500 p-6 min-h-screen bg-[#FFFFFF] text-[#000000]">
            {selectedLog && <AuditLogDetailModal data={selectedLog.newValue} onClose={() => setSelectedLog(null)} />}
            
            <div className="flex justify-between items-center mb-10">
                <div className="flex items-center gap-3">
                    <div className="p-3 bg-[#B4533A] text-[#000000] rounded-xl shadow-lg shadow-[#B4533A]/20">
                        <Shield size={24} />
                    </div>
                    <div>
                        <h1 className="text-2xl font-black text-[#000000] tracking-tight">Nhật ký Hệ thống (Audit Logs)</h1>
                        <p className="text-[#000000] text-sm font-medium">Truy vết mọi hoạt động và thay đổi dữ liệu trên hệ thống</p>
                    </div>
                </div>
                <button 
                    onClick={() => refetch()}
                    className="flex items-center gap-2 px-4 py-2 bg-[#FAF8F5] border border-[rgba(148,163,184,0.1)] rounded-xl hover:bg-[#1A1D23] text-[#000000] transition-all shadow-sm"
                >
                    <RefreshCw size={18} className={isLoading ? "animate-spin" : ""} /> Làm mới dữ liệu
                </button>
            </div>

            <div className="bg-[#FAF8F5] p-4 rounded-2xl shadow-xl shadow-[#B4533A]/5 border border-[rgba(148,163,184,0.1)] flex flex-wrap gap-4 items-center mb-6">
                <div className="flex-1 min-w-[300px] relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#000000]" size={18} />
                    <input 
                        type="text" 
                        placeholder="Tìm theo hành động, mã đối tượng, người thực hiện..." 
                        className="w-full pl-10 pr-4 py-2 bg-[#FFFFFF] border border-[rgba(148,163,184,0.1)] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#B4533A]/20 text-[#000000] placeholder:text-[#000000] text-sm"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="flex items-center gap-2 text-sm">
                    <Filter size={18} className="text-[#000000]" />
                    <select 
                        className="bg-[#FFFFFF] border border-[rgba(148,163,184,0.1)] rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#B4533A]/20 text-[#000000] text-sm"
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

            <div className="bg-[#FAF8F5] rounded-2xl shadow-xl shadow-[#B4533A]/5 border border-[rgba(148,163,184,0.1)] overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="erp-table text-xs">
                        <thead className="bg-[#FFFFFF] border-b border-[rgba(148,163,184,0.1)] text-[#000000] text-xs uppercase tracking-wider">
                            <tr>
                                <th className="px-6 py-4 font-black">Thời gian</th>
                                <th className="px-6 py-4 font-black">Người thực hiện</th>
                                <th className="px-6 py-4 font-black">Hành động</th>
                                <th className="px-6 py-4 font-black">Đối tượng</th>
                                <th className="px-6 py-4 font-black">Mã ID</th>
                                <th className="px-6 py-4 font-black text-right">Chi tiết</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[rgba(148,163,184,0.1)] text-sm">
                            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                            {filteredLogs.length > 0 ? filteredLogs.map((log: any) => (
                                <tr key={log.id} className="hover:bg-[#FFFFFF]/30 transition-colors group">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center gap-2 text-[#000000]">
                                            <Calendar size={14} />
                                            {log.createdAt && typeof log.createdAt === 'string' ? new Date(log.createdAt).toLocaleString('vi-VN') : 'N/A'}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center gap-2">
                                            <div className="w-7 h-7 rounded-full bg-[#B4533A]/10 flex items-center justify-center text-[10px] font-bold text-[#B4533A] border border-[#B4533A]/20">
                                                {log.user?.fullName?.charAt(0) || "U"}
                                            </div>
                                            <div>
                                                <p className="font-bold text-[#000000]">{log.user?.fullName || "Hệ thống"}</p>
                                                <p className="text-[10px] text-[#000000] uppercase">{log.user?.role}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${getActionColor(log.action)}`}>
                                            {log.action}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap font-bold text-[#000000]">
                                        {log.entityType}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-xs text-[#000000]">
                                        ***-***-***
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <button 
                                            onClick={() => setSelectedLog(log)}
                                            className="p-1.5 text-[#000000] hover:text-[#B4533A] hover:bg-[#B4533A]/10 rounded-xl transition-all"
                                        >
                                            <ExternalLink size={16} />
                                        </button>
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center text-[#000000]">
                                        <History size={48} className="mx-auto mb-3 opacity-20" />
                                        {isLoading ? "Đang tải dữ liệu..." : "Không tìm thấy nhật ký nào."}
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
                {result && (
                    <div className="flex items-center justify-between p-4 bg-[#FFFFFF] border-t border-[rgba(148,163,184,0.1)] text-sm">
                        <p>Trang {result.page} / {Math.max(1, Math.ceil((result.total || 1) / (result.limit || 1)))}</p>
                        <div className="flex gap-2">
                            <button 
                                disabled={page === 1}
                                onClick={() => setPage(p => p - 1)}
                                className="px-3 py-1 bg-[#FAF8F5] border border-[rgba(148,163,184,0.1)] rounded hover:bg-[#B4533A]/5 disabled:opacity-50"
                            >Trước</button>
                            <button 
                                disabled={result && page >= Math.ceil((result.total || 1) / (result.limit || 1))}
                                onClick={() => setPage(p => p + 1)}
                                className="px-3 py-1 bg-[#FAF8F5] border border-[rgba(148,163,184,0.1)] rounded hover:bg-[#B4533A]/5 disabled:opacity-50"
                            >Sau</button>
                        </div>
                    </div>
                )}
            </div>
        </main>
    );
}
