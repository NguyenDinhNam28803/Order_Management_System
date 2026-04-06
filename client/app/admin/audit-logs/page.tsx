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
        if (action.includes("CREATE")) return "text-green-600 bg-green-50";
        if (action.includes("UPDATE") || action.includes("PATCH")) return "text-blue-600 bg-blue-50";
        if (action.includes("DELETE")) return "text-red-600 bg-red-50";
        if (action.includes("APPROVE")) return "text-purple-600 bg-purple-50";
        return "text-gray-600 bg-gray-50";
    };

    const entityTypes = Array.from(new Set(auditLogs.map(l => l.entityType)));

    return (
        <div className="p-6 space-y-6">
            <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                    <div className="p-3 bg-blue-600 text-white rounded-xl shadow-lg shadow-blue-100">
                        <Shield size={24} />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-800">Nhật ký Hệ thống (Audit Logs)</h1>
                        <p className="text-gray-500 text-sm">Truy vết mọi hoạt động và thay đổi dữ liệu trên hệ thống</p>
                    </div>
                </div>
                <button 
                    onClick={() => refreshData()}
                    className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-600 transition-all shadow-sm"
                >
                    <RefreshCw size={18} className={loadingMyPrs ? "animate-spin" : ""} /> Làm mới dữ liệu
                </button>
            </div>

            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-wrap gap-4 items-center">
                <div className="flex-1 min-w-75 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input 
                        type="text" 
                        placeholder="Tìm theo hành động, mã đối tượng, người thực hiện..." 
                        className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="flex items-center gap-2 text-sm">
                    <Filter size={18} className="text-gray-400" />
                    <select 
                        className="border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
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

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 border-b border-gray-100 text-gray-600 text-xs uppercase tracking-wider">
                            <tr>
                                <th className="px-6 py-4 font-bold">Thời gian</th>
                                <th className="px-6 py-4 font-bold">Người thực hiện</th>
                                <th className="px-6 py-4 font-bold">Hành động</th>
                                <th className="px-6 py-4 font-bold">Đối tượng</th>
                                <th className="px-6 py-4 font-bold">Mã ID</th>
                                <th className="px-6 py-4 font-bold text-right">Chi tiết</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50 text-sm">
                            {filteredLogs.length > 0 ? filteredLogs.map((log) => (
                                <tr key={log.id} className="hover:bg-gray-50 transition-colors group">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center gap-2 text-gray-500">
                                            <Calendar size={14} />
                                            {new Date(log.createdAt).toLocaleString('vi-VN')}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center gap-2">
                                            <div className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center text-[10px] font-bold text-gray-600 border border-gray-200">
                                                {log.user?.fullName?.charAt(0) || "U"}
                                            </div>
                                            <div>
                                                <p className="font-semibold text-gray-800">{log.user?.fullName || "Hệ thống"}</p>
                                                <p className="text-[10px] text-gray-400 uppercase">{log.user?.role}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${getActionColor(log.action)}`}>
                                            {log.action}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-600">
                                        {log.entityType}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap  text-xs text-gray-400">
                                        {log.entityId}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <button className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all">
                                            <ExternalLink size={16} />
                                        </button>
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center text-gray-400 italic">
                                        <History size={48} className="mx-auto mb-3 opacity-20" />
                                        {loadingMyPrs ? "Đang tải dữ liệu..." : "Không tìm thấy nhật ký nào."}
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
