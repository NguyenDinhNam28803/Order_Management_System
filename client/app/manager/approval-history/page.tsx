"use client";

import React, { useState } from "react";
import { useProcurement } from "@/app/context/ProcurementContext";
import { Search, Filter, History, ShoppingCart, FolderTree, CheckCircle, XCircle, ChevronLeft, ChevronRight, Clock } from "lucide-react";
import { formatVND } from "../../utils/formatUtils";

export default function ApprovalHistoryPage() {
    const [filter, setFilter] = useState({ type: "ALL", status: "ALL", date: "" });
    const { approvals } = useProcurement();
    return (
        <main className="animate-in fade-in duration-500 p-6 min-h-screen bg-[#0F1117] text-[#F8FAFC]">
            <header className="mb-10 lg:flex items-end justify-between">
                <div>
                    <h1 className="text-2xl font-black tracking-tight text-[#F8FAFC] mb-2 uppercase">LỊCH SỬ PHÊ DUYỆT</h1>
                    <p className="text-[#64748B] font-medium">Toàn bộ hồ sơ các quyết định phê duyệt của bạn</p>
                </div>
                
                <div className="flex gap-4 mt-6 lg:mt-0">
                    <div className="flex bg-[#161922] rounded-2xl border border-[rgba(148,163,184,0.1)] p-1 shadow-sm">
                        <button className="px-4 py-2 text-[10px] font-black uppercase tracking-widest text-[#F8FAFC] bg-[#3B82F6] rounded-xl transition-all shadow-sm">Hôm nay</button>
                        <button className="px-4 py-2 text-[10px] font-black uppercase tracking-widest text-[#64748B] hover:text-[#F8FAFC] transition-all">Tuần này</button>
                        <button className="px-4 py-2 text-[10px] font-black uppercase tracking-widest text-[#64748B] hover:text-[#F8FAFC] transition-all">Tháng này</button>
                    </div>
                </div>
            </header>

            {/* Filter Bar */}
            <div className="bg-[#161922] rounded-3xl border border-[rgba(148,163,184,0.1)] p-6 mb-8 shadow-xl shadow-[#3B82F6]/5 flex flex-wrap gap-6 items-end">
                <div className="flex-1 min-w-[200px]">
                    <label className="block text-[10px] font-black uppercase tracking-widest text-[#64748B] mb-2">Loại chứng từ</label>
                    <div className="relative">
                        <FolderTree size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#64748B]" />
                        <select className="w-full bg-[#0F1117] border border-[rgba(148,163,184,0.1)] rounded-2xl py-3 pl-12 pr-4 text-sm font-bold text-[#F8FAFC] outline-none appearance-none cursor-pointer">
                            <option value="ALL">Tất cả chứng từ</option>
                            <option value="PURCHASE_REQUISITION">Yêu cầu mua hàng (PR)</option>
                            <option value="PURCHASE_ORDER">Đơn đặt hàng (PO)</option>
                        </select>
                    </div>
                </div>

                <div className="flex-1 min-w-[200px]">
                    <label className="block text-[10px] font-black uppercase tracking-widest text-[#64748B] mb-2">Quyết định</label>
                    <div className="relative">
                        <CheckCircle size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#64748B]" />
                        <select className="w-full bg-[#0F1117] border border-[rgba(148,163,184,0.1)] rounded-2xl py-3 pl-12 pr-4 text-sm font-bold text-[#F8FAFC] outline-none appearance-none cursor-pointer">
                            <option value="ALL">Tất cả trạng thái</option>
                            <option value="APPROVED">Đã phê duyệt</option>
                            <option value="REJECTED">Đã từ chối</option>
                        </select>
                    </div>
                </div>

                <div className="bg-[#3B82F6] text-white h-12 flex items-center justify-center px-8 rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-lg shadow-[#3B82F6]/20 cursor-pointer hover:bg-[#2563EB] transition-all active:scale-95">
                    Áp dụng bộ lọc
                </div>
            </div>

            {/* History Table */}
            <div className="bg-[#161922] rounded-3xl border border-[rgba(148,163,184,0.1)] overflow-hidden shadow-xl shadow-[#3B82F6]/5 mb-8">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-[#0F1117] border-b border-[rgba(148,163,184,0.1)]">
                            <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-[#64748B]">Loại</th>
                            <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-[#64748B]">Mã chứng từ</th>
                            <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-[#64748B]">Tiêu đề</th>
                            <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-[#64748B]">Quyết định</th>
                            <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-[#64748B] text-center">Ngày duyệt</th>
                            <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-[#64748B]">Ghi chú</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-[rgba(148,163,184,0.1)]">
                        {approvals.map((item) => (
                            <tr key={item.id} className="hover:bg-[#0F1117]/30 transition-colors">
                                <td className="px-6 py-5">
                                    <span className={`px-2 py-1 rounded-md text-[10px] font-black tracking-widest uppercase border ${item.documentType === "PURCHASE_REQUISITION" ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' : 'bg-[#3B82F6]/10 text-[#3B82F6] border-[#3B82F6]/20'}`}>
                                        {item.documentType === "PURCHASE_REQUISITION" ? 'Yêu cầu mua hàng' : 'Đơn đặt hàng'}
                                    </span>
                                </td>
                                <td className="px-6 py-5">
                                    <span className="font-bold text-[#F8FAFC]">{item.id}</span>
                                </td>
                                <td className="px-6 py-5 font-bold text-[#94A3B8]">{item.documentType}</td>
                                <td className="px-6 py-5">
                                    <div className="flex items-center gap-2">
                                        {item.status === 'APPROVED' ? (
                                            <>
                                                <div className="h-5 w-5 rounded-full bg-emerald-500 text-white flex items-center justify-center">
                                                    <CheckCircle size={12} />
                                                </div>
                                                <span className="text-xs font-black text-emerald-400 uppercase tracking-tight">Đã duyệt</span>
                                            </>
                                        ) : item.status === "PENDING" ? (
                                            <>
                                                <div className="h-5 w-5 rounded-full bg-amber-500 text-white flex items-center justify-center">
                                                    <Clock size={12} />
                                                </div>
                                                <span className="text-xs font-black text-amber-400 uppercase tracking-tight">Đang chờ duyệt</span>
                                            </>
                                        ) : (
                                            <span className="text-xs font-black text-[#64748B] uppercase tracking-tight">Đang chờ</span>
                                        )}
                                    </div>
                                </td>
                                <td className="px-6 py-5 text-[11px] font-bold text-[#64748B] text-center whitespace-nowrap">
                                    {new Date(item.createdAt!).toLocaleDateString("vi-VN")} {new Date(item.createdAt!).toLocaleTimeString("vi-VN", { hour: '2-digit', minute: '2-digit' })}
                                </td>
                                <td className="px-6 py-5 text-xs text-[#94A3B8] font-medium italic">
                                    {item.status === 'APPROVED' ? 'Hồ sơ đã được phê duyệt thành công' : 'Hồ sơ đã bị từ chối'}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Pagination Placeholder */}
            <div className="flex items-center justify-between px-6">
                <span className="text-xs font-black text-[#64748B] uppercase tracking-widest">Trang 1 / 1</span>
                <div className="flex gap-2 text-[#64748B]">
                    <button className="h-10 w-10 flex items-center justify-center rounded-xl bg-[#161922] border border-[rgba(148,163,184,0.1)] hover:bg-[#0F1117] transition-colors">
                        <ChevronLeft size={18} />
                    </button>
                    <button className="h-10 w-10 flex items-center justify-center rounded-xl bg-[#161922] border border-[rgba(148,163,184,0.1)] hover:bg-[#0F1117] transition-colors">
                        <ChevronRight size={18} />
                    </button>
                </div>
            </div>
        </main>
    );
}
