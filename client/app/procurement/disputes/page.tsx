"use client";

import React, { useState } from "react";
import { useProcurement } from "../../context/ProcurementContext";
import { 
    AlertTriangle, MessageSquare, Clock, CheckCircle, 
    XCircle, Search, Filter, ArrowUpRight 
} from "lucide-react";
import { DisputeStatus, DocumentType } from "../../types/api-types";

export default function DisputesPage() {
    const { disputes, loadingMyPrs } = useProcurement();
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState<string>("ALL");

    const filteredDisputes = disputes.filter(d => {
        const matchSearch = d.disputeNumber.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          d.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          d.reason.toLowerCase().includes(searchTerm.toLowerCase());
        const matchStatus = statusFilter === "ALL" || d.status === statusFilter;
        return matchSearch && matchStatus;
    });

    const getStatusBadge = (status: DisputeStatus) => {
        switch (status) {
            case DisputeStatus.OPEN:
                return <span className="px-2 py-1 bg-rose-500/10 text-rose-400 border border-rose-500/20 rounded-full text-xs font-bold flex items-center gap-1 w-fit"><AlertTriangle size={12}/> Đang mở</span>;
            case DisputeStatus.UNDER_INVESTIGATION:
                return <span className="px-2 py-1 bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-full text-xs font-bold flex items-center gap-1 w-fit"><Clock size={12}/> Đang xác minh</span>;
            case DisputeStatus.RESOLVED:
                return <span className="px-2 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full text-xs font-bold flex items-center gap-1 w-fit"><CheckCircle size={12}/> Đã giải quyết</span>;
            case DisputeStatus.CLOSED:
                return <span className="px-2 py-1 bg-[#161922] text-[#64748B] border border-[rgba(148,163,184,0.1)] rounded-full text-xs font-bold flex items-center gap-1 w-fit"><XCircle size={12}/> Đã đóng</span>;
            default:
                return <span className="px-2 py-1 bg-[#3B82F6]/10 text-[#3B82F6] border border-[#3B82F6]/20 rounded-full text-xs font-bold w-fit">{status}</span>;
        }
    };

    return (
        <main className="animate-in fade-in duration-500 p-6 min-h-screen bg-[#0F1117] text-[#F8FAFC]">
            <div className="flex justify-between items-center mb-10">
                <div>
                    <h1 className="text-2xl font-black tracking-tight text-[#F8FAFC]">Khiếu nại & Tranh chấp</h1>
                    <p className="text-[#64748B] text-sm">Xử lý các vấn đề phát sinh về chất lượng hàng hóa, thanh toán hoặc dịch vụ</p>
                </div>
                <button className="flex items-center gap-2 bg-rose-500 text-white px-4 py-2 rounded-xl hover:bg-rose-600 transition-all shadow-lg shadow-rose-500/20 font-black uppercase tracking-wider text-[11px]">
                    <AlertTriangle size={18} /> Tạo khiếu nại mới
                </button>
            </div>

            <div className="bg-[#161922] p-4 rounded-2xl shadow-xl shadow-[#3B82F6]/5 border border-[rgba(148,163,184,0.1)] flex flex-wrap gap-4 items-center mb-8">
                <div className="flex-1 min-w-[300px] relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#64748B]" size={18} />
                    <input 
                        type="text" 
                        placeholder="Tìm theo mã khiếu nại, nội dung..." 
                        className="w-full pl-10 pr-4 py-2 bg-[#0F1117] border border-[rgba(148,163,184,0.1)] rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500/30 text-[#F8FAFC] placeholder:text-[#64748B] text-sm"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="flex items-center gap-2">
                    <Filter size={18} className="text-[#64748B]" />
                    <select 
                        className="bg-[#0F1117] border border-[rgba(148,163,184,0.1)] rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-rose-500/30 text-[#F8FAFC] text-sm"
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                    >
                        <option value="ALL">Tất cả trạng thái</option>
                        <option value={DisputeStatus.OPEN}>Đang mở</option>
                        <option value={DisputeStatus.UNDER_INVESTIGATION}>Đang xác minh</option>
                        <option value={DisputeStatus.RESOLVED}>Đã giải quyết</option>
                        <option value={DisputeStatus.CLOSED}>Đã đóng</option>
                    </select>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-4">
                {filteredDisputes.length > 0 ? filteredDisputes.map((d) => (
                    <div key={d.id} className="bg-[#161922] p-5 rounded-2xl shadow-xl shadow-[#3B82F6]/5 border border-[rgba(148,163,184,0.1)] hover:border-rose-500/20 transition-all group relative">
                        <div className="flex justify-between items-start mb-3">
                            <div className="space-y-1">
                                <div className="flex items-center gap-3">
                                    <span className="font-black text-rose-400">#{d.disputeNumber}</span>
                                    {getStatusBadge(d.status)}
                                    <span className={`text-[10px] px-1.5 py-0.5 rounded font-black uppercase ${d.priority === 'HIGH' ? 'bg-rose-500 text-white' : 'bg-[#0F1117] text-[#64748B] border border-[rgba(148,163,184,0.1)]'}`}>
                                        {d.priority}
                                    </span>
                                </div>
                                <h3 className="text-lg font-black text-[#F8FAFC]">{d.title}</h3>
                            </div>
                            <div className="text-right text-xs text-[#64748B]">
                                <p>Ngày tạo: {new Date(d.createdAt).toLocaleDateString('vi-VN')}</p>
                                <p>Tài liệu: <span className="font-bold text-[#94A3B8] uppercase">{d.relatedDocumentType}</span></p>
                            </div>
                        </div>
                        
                        <div className="bg-[#0F1117] p-3 rounded-xl text-sm text-[#94A3B8] mb-4 line-clamp-2 italic border border-[rgba(148,163,184,0.1)]">
                            &quot;{d.reason}&quot;
                        </div>

                        <div className="flex justify-between items-center pt-4 border-t border-[rgba(148,163,184,0.1)]">
                            <div className="flex items-center gap-4 text-xs">
                                <div className="flex items-center gap-1.5 text-[#64748B]">
                                    <div className="w-6 h-6 rounded-full bg-[#3B82F6]/10 flex items-center justify-center text-[10px] font-bold text-[#3B82F6] border border-[#3B82F6]/20">
                                        {d.reportedBy?.fullName?.charAt(0) || "U"}
                                    </div>
                                    <span>Bởi: <b className="text-[#F8FAFC]">{d.reportedBy?.fullName || "N/A"}</b></span>
                                </div>
                                {d.assignedTo && (
                                    <div className="flex items-center gap-1.5 text-[#64748B]">
                                        <div className="w-6 h-6 rounded-full bg-purple-500/10 flex items-center justify-center text-[10px] font-bold text-purple-400 border border-purple-500/20">
                                            {d.assignedTo?.fullName?.charAt(0) || "A"}
                                        </div>
                                        <span>Xử lý: <b className="text-[#F8FAFC]">{d.assignedTo?.fullName}</b></span>
                                    </div>
                                )}
                            </div>
                            <div className="flex items-center gap-4">
                                <button className="flex items-center gap-1.5 text-[#3B82F6] font-bold text-xs hover:underline">
                                    Xem chi tiết & Thảo luận <ArrowUpRight size={14} />
                                </button>
                                {d.status === DisputeStatus.OPEN && (
                                    <>
                                        <button className="text-amber-500 hover:text-amber-400 font-bold text-xs" title="Sửa">Sửa</button>
                                        <button className="text-rose-500 hover:text-rose-400 font-bold text-xs" title="Xóa">Xóa</button>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                )) : (
                    <div className="bg-[#161922] p-12 rounded-2xl border border-dashed border-[rgba(148,163,184,0.1)] text-center space-y-3">
                        <div className="w-16 h-16 bg-[#0F1117] rounded-full flex items-center justify-center mx-auto text-[#64748B] border border-[rgba(148,163,184,0.1)]">
                            <MessageSquare size={32} />
                        </div>
                        <div className="text-[#64748B] italic">
                            {loadingMyPrs ? "Đang tải dữ liệu..." : "Chưa có khiếu nại nào được ghi nhận."}
                        </div>
                    </div>
                )}
            </div>
        </main>
    );
}
