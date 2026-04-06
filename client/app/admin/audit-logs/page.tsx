"use client";

import React, { useState } from "react";
import { useProcurement } from "../../context/ProcurementContext";
import { 
    History, Search, Filter, Calendar, User, 
    Activity, Shield, ExternalLink, RefreshCw 
} from "lucide-react";

export default function AuditLogsPage() {
    const { auditLogs, loadingMyPrs, refreshData } = useProcurement();
    const [searchTerm, setSearchTerm] = useState("");
    const [entityFilter, setEntityFilter] = useState("ALL");

    const filteredLogs = auditLogs.filter(log => {
        const matchSearch = log.action.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          log.entityId.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          log.user?.fullName?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchEntity = entityFilter === "ALL" || log.entityType === entityFilter;
        return matchSearch && matchEntity;
    });

    const getActionColor = (action: string) => {
        if (action.includes("CREATE")) return "text-emerald-400 bg-emerald-500/10 border border-emerald-500/20";
        if (action.includes("UPDATE") || action.includes("PATCH")) return "text-[#3B82F6] bg-[#3B82F6]/10 border border-[#3B82F6]/20";
        if (action.includes("DELETE")) return "text-rose-400 bg-rose-500/10 border border-rose-500/20";
        if (action.includes("APPROVE")) return "text-purple-400 bg-purple-500/10 border border-purple-500/20";
        return "text-[#64748B] bg-[#161922] border border-[rgba(148,163,184,0.1)]";
    };

    const entityTypes = Array.from(new Set(auditLogs.map(l => l.entityType)));

    return (
        <main className="animate-in fade-in duration-500 p-6 min-h-screen bg-[#0F1117] text-[#F8FAFC]">
            <div className="flex justify-between items-center mb-10">
                <div className="flex items-center gap-3">
                    <div className="p-3 bg-[#3B82F6] text-white rounded-xl shadow-lg shadow-[#3B82F6]/20">
                        <Shield size={24} />
                    </div>
                    <div>
                        <h1 className="text-2xl font-black text-[#F8FAFC] tracking-tight">Nhật ký Hệ thống (Audit Logs)</h1>
                        <p className="text-[#64748B] text-sm font-medium">Truy vết mọi hoạt động và thay đổi dữ liệu trên hệ thống</p>
                    </div>
                </div>
                <button 
                    onClick={() => refreshData()}
                    className="flex items-center gap-2 px-4 py-2 bg-[#161922] border border-[rgba(148,163,184,0.1)] rounded-xl hover:bg-[#1A1D23] text-[#94A3B8] transition-all shadow-sm"
                >
                    <RefreshCw size={18} className={loadingMyPrs ? "animate-spin" : ""} /> Làm mới dữ liệu
                </button>
            </div>

            <div className="bg-[#161922] p-4 rounded-2xl shadow-xl shadow-[#3B82F6]/5 border border-[rgba(148,163,184,0.1)] flex flex-wrap gap-4 items-center mb-6">
                <div className="flex-1 min-w-[300px] relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#64748B]" size={18} />
                    <input 
                        type="text" 
                        placeholder="Tìm theo hành động, mã đối tượng, người thực hiện..." 
                        className="w-full pl-10 pr-4 py-2 bg-[#0F1117] border border-[rgba(148,163,184,0.1)] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#3B82F6]/20 text-[#F8FAFC] placeholder:text-[#64748B] text-sm"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="flex items-center gap-2 text-sm">
                    <Filter size={18} className="text-[#64748B]" />
                    <select 
                        className="bg-[#0F1117] border border-[rgba(148,163,184,0.1)] rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#3B82F6]/20 text-[#F8FAFC] text-sm"
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

            <div className="bg-[#161922] rounded-2xl shadow-xl shadow-[#3B82F6]/5 border border-[rgba(148,163,184,0.1)] overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-[#0F1117] border-b border-[rgba(148,163,184,0.1)] text-[#64748B] text-xs uppercase tracking-wider">
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
                            {filteredLogs.length > 0 ? filteredLogs.map((log) => (
                                <tr key={log.id} className="hover:bg-[#0F1117]/30 transition-colors group">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center gap-2 text-[#64748B]">
                                            <Calendar size={14} />
                                            {new Date(log.createdAt).toLocaleString('vi-VN')}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center gap-2">
                                            <div className="w-7 h-7 rounded-full bg-[#3B82F6]/10 flex items-center justify-center text-[10px] font-bold text-[#3B82F6] border border-[#3B82F6]/20">
                                                {log.user?.fullName?.charAt(0) || "U"}
                                            </div>
                                            <div>
                                                <p className="font-bold text-[#F8FAFC]">{log.user?.fullName || "Hệ thống"}</p>
                                                <p className="text-[10px] text-[#64748B] uppercase">{log.user?.role}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${getActionColor(log.action)}`}>
                                            {log.action}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap font-bold text-[#94A3B8]">
                                        {log.entityType}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-xs text-[#64748B]">
                                        {log.entityId}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <button className="p-1.5 text-[#64748B] hover:text-[#3B82F6] hover:bg-[#3B82F6]/10 rounded-lg transition-all">
                                            <ExternalLink size={16} />
                                        </button>
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center text-[#64748B]">
                                        <History size={48} className="mx-auto mb-3 opacity-20" />
                                        {loadingMyPrs ? "Đang tải dữ liệu..." : "Không tìm thấy nhật ký nào."}
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </main>
    );
}
