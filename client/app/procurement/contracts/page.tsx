"use client";

import React, { useState } from "react";
import { useProcurement } from "../../context/ProcurementContext";
import { 
    FileText, 
    Eye, 
    CheckCircle2, 
    Clock, 
    XCircle, 
    Search, 
    Filter, 
    Plus,
    ShieldCheck,
    AlertCircle,
    Calendar,
    DollarSign,
    Building2
} from "lucide-react";
import Link from "next/link";
import { ContractStatus, CurrencyCode } from "../../types/api-types";

const STATUS_CONFIG: Record<string, { label: string; bg: string; text: string; border: string; icon: React.ReactNode }> = {
    ACTIVE: {
        label: "Đang hiệu lực",
        bg: "bg-emerald-500/10",
        text: "text-emerald-400",
        border: "border-emerald-500/30",
        icon: <CheckCircle2 size={12}/>
    },
    PENDING_APPROVAL: {
        label: "Chờ duyệt",
        bg: "bg-amber-500/10",
        text: "text-amber-400",
        border: "border-amber-500/30",
        icon: <Clock size={12}/>
    },
    DRAFT: {
        label: "Bản nháp",
        bg: "bg-slate-500/10",
        text: "text-slate-400",
        border: "border-slate-500/30",
        icon: <FileText size={12}/>
    },
    EXPIRED: {
        label: "Hết hạn",
        bg: "bg-orange-500/10",
        text: "text-orange-400",
        border: "border-orange-500/30",
        icon: <AlertCircle size={12}/>
    },
    TERMINATED: {
        label: "Đã chấm dứt",
        bg: "bg-rose-500/10",
        text: "text-rose-400",
        border: "border-rose-500/30",
        icon: <XCircle size={12}/>
    }
};

export default function ContractsPage() {
    const { contracts, loadingMyPrs } = useProcurement();
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState<string>("ALL");

    const filteredContracts = contracts.filter(c => {
        const matchSearch = c.contractNumber?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          c.title?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchStatus = statusFilter === "ALL" || c.status === statusFilter;
        return matchSearch && matchStatus;
    });

    const getStatusBadge = (status: ContractStatus) => {
        const config = STATUS_CONFIG[status] || STATUS_CONFIG.DRAFT;
        return (
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold border ${config.bg} ${config.text} ${config.border}`}>
                {config.icon}
                {config.label}
            </span>
        );
    };

    return (
        <main className="animate-in fade-in duration-500 p-6 min-h-screen bg-[#0F1117]">
            {/* Header */}
            <div className="mt-4 mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-black text-[#F8FAFC] tracking-tight">Quản lý Hợp đồng</h1>
                    <p className="text-sm text-[#94A3B8] mt-1">Quản lý và theo dõi các thỏa thuận thu mua với nhà cung cấp</p>
                </div>
                <button className="flex items-center gap-2 bg-[#3B82F6] hover:bg-[#2563EB] text-white px-4 py-2.5 rounded-xl font-bold shadow-lg shadow-[#3B82F6]/20 transition-all">
                    <Plus size={18} /> Tạo hợp đồng mới
                </button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                {[
                    { label: "Tổng hợp đồng", value: contracts.length, icon: FileText, color: "text-blue-400", bg: "bg-blue-500/10" },
                    { label: "Đang hiệu lực", value: contracts.filter(c => c.status === "ACTIVE").length, icon: CheckCircle2, color: "text-emerald-400", bg: "bg-emerald-500/10" },
                    { label: "Chờ duyệt", value: contracts.filter(c => c.status === "PENDING_APPROVAL").length, icon: Clock, color: "text-amber-400", bg: "bg-amber-500/10" },
                    { label: "Hết hạn sắp tới", value: contracts.filter(c => c.status === "EXPIRED").length, icon: AlertCircle, color: "text-orange-400", bg: "bg-orange-500/10" }
                ].map((stat, idx) => (
                    <div key={idx} className="bg-[#161922] rounded-xl p-4 border border-[rgba(148,163,184,0.1)]">
                        <div className="flex items-center gap-3">
                            <div className={`h-10 w-10 rounded-lg ${stat.bg} flex items-center justify-center`}>
                                <stat.icon className={stat.color} size={20} />
                            </div>
                            <div>
                                <p className="text-[10px] font-black uppercase tracking-wider text-[#64748B]">{stat.label}</p>
                                <p className="text-xl font-black text-[#F8FAFC]">{stat.value}</p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Filters */}
            <div className="bg-[#161922] p-4 rounded-xl border border-[rgba(148,163,184,0.1)] shadow-xl shadow-[#3B82F6]/5 mb-6">
                <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex-1 relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#64748B]" size={18} />
                        <input 
                            type="text" 
                            placeholder="Tìm theo số hợp đồng, tiêu đề..." 
                            className="w-full pl-11 pr-4 py-3 bg-[#0F1117] border border-[rgba(148,163,184,0.1)] rounded-xl text-sm font-bold text-[#F8FAFC] placeholder:text-[#64748B] focus:outline-none focus:border-[#3B82F6]/50 focus:bg-[#161922] transition-all"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div className="flex items-center gap-3">
                        <Filter size={18} className="text-[#64748B]" />
                        <select 
                            className="bg-[#0F1117] border border-[rgba(148,163,184,0.1)] rounded-xl px-4 py-3 text-sm font-bold text-[#F8FAFC] focus:outline-none focus:border-[#3B82F6]/50 focus:bg-[#161922] transition-all min-w-[160px]"
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                        >
                            <option value="ALL">Tất cả trạng thái</option>
                            <option value={ContractStatus.DRAFT}>Bản nháp</option>
                            <option value={ContractStatus.PENDING_APPROVAL}>Chờ duyệt</option>
                            <option value={ContractStatus.ACTIVE}>Đang hiệu lực</option>
                            <option value={ContractStatus.EXPIRED}>Hết hạn</option>
                            <option value={ContractStatus.TERMINATED}>Đã chấm dứt</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Table */}
            <div className="bg-[#161922] rounded-2xl border border-[rgba(148,163,184,0.1)] shadow-xl shadow-[#3B82F6]/5 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-[#0F1117] border-b border-[rgba(148,163,184,0.1)]">
                            <tr>
                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-[#64748B]">Số hợp đồng</th>
                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-[#64748B]">Tiêu đề / Đối tác</th>
                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-[#64748B] text-center">Giá trị</th>
                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-[#64748B]">Thời hạn</th>
                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-[#64748B]">Trạng thái</th>
                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-[#64748B] text-right">Thao tác</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[rgba(148,163,184,0.1)]">
                            {filteredContracts.length > 0 ? filteredContracts.map((c) => (
                                <tr key={c.id} className="hover:bg-[rgba(59,130,246,0.05)] transition-colors group">
                                    <td className="px-6 py-4">
                                        <span className="font-bold text-[#3B82F6]">#{c.contractNumber}</span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="font-bold text-[#F8FAFC]">{c.title}</div>
                                        <div className="flex items-center gap-1 text-xs text-[#64748B] mt-1">
                                            <Building2 size={12} />
                                            {c.supplier?.name || "N/A"}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <div className="font-bold text-[#F8FAFC]">
                                            {new Intl.NumberFormat('vi-VN').format(c.totalValue || 0)} {c.currency}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2 text-sm text-[#94A3B8]">
                                            <Calendar size={14} className="text-[#64748B]" />
                                            <div>
                                                <div className="text-[#F8FAFC]">{new Date(c.startDate).toLocaleDateString('vi-VN')}</div>
                                                <div className="text-[#64748B] text-xs">- {new Date(c.endDate).toLocaleDateString('vi-VN')}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">{getStatusBadge(c.status)}</td>
                                    <td className="px-6 py-4 text-right">
                                        <Link 
                                            href={`/procurement/contracts/${c.id}`}
                                            className="inline-flex items-center justify-center h-9 w-9 rounded-lg bg-[#0F1117] text-[#64748B] hover:text-[#3B82F6] hover:bg-[#3B82F6]/10 border border-[rgba(148,163,184,0.1)] hover:border-[#3B82F6]/30 transition-all"
                                        >
                                            <Eye size={18} />
                                        </Link>
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan={6} className="px-6 py-16 text-center">
                                        {loadingMyPrs ? (
                                            <div className="flex items-center justify-center gap-2 text-[#94A3B8]">
                                                <Clock size={18} className="animate-spin" />
                                                <span>Đang tải dữ liệu...</span>
                                            </div>
                                        ) : (
                                            <div className="text-[#64748B]">
                                                <FileText className="mx-auto h-12 w-12 mb-3 opacity-30" />
                                                <p className="font-medium">Không tìm thấy hợp đồng nào</p>
                                                <p className="text-sm mt-1">Thử điều chỉnh bộ lọc hoặc tìm kiếm với từ khóa khác</p>
                                            </div>
                                        )}
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
