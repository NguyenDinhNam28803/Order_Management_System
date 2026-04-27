"use client";

import React, { useState } from "react";
import { useProcurement } from "@/app/context/ProcurementContext";
import { Search, Filter, History, ShoppingCart, FolderTree, CheckCircle, XCircle, ChevronLeft, ChevronRight, Clock } from "lucide-react";
import { formatVND } from "../../utils/formatUtils";

export default function ApprovalHistoryPage() {
    const [filter, setFilter] = useState({ type: "ALL", status: "ALL", date: "" });
    const { approvals } = useProcurement();
    return (
        <main className="animate-in fade-in duration-500 p-6 min-h-screen bg-[#FFFFFF] text-[#000000]">
            <header className="mb-10 lg:flex items-end justify-between">
                <div>
                    <h1 className="text-2xl font-black tracking-tight text-[#000000] mb-2 uppercase">LỊCH SỬ PHÊ DUYỆT</h1>
                    <p className="text-[#000000] font-medium">Toàn bộ hồ sơ các quyết định phê duyệt của bạn</p>
                </div>
                
                <div className="flex gap-4 mt-6 lg:mt-0">
                    <div className="flex bg-[#FAF8F5] rounded-2xl border border-[rgba(148,163,184,0.1)] p-1 shadow-sm">
                        <button className="px-4 py-2 text-[10px] font-black uppercase tracking-widest text-[#000000] bg-[#B4533A] rounded-xl transition-all shadow-sm">Hôm nay</button>
                        <button className="px-4 py-2 text-[10px] font-black uppercase tracking-widest text-[#000000] hover:text-[#000000] transition-all">Tuần này</button>
                        <button className="px-4 py-2 text-[10px] font-black uppercase tracking-widest text-[#000000] hover:text-[#000000] transition-all">Tháng này</button>
                    </div>
                </div>
            </header>

            {/* Filter Bar */}
            <div className="bg-[#FAF8F5] p-6 rounded-[32px] border border-[rgba(148,163,184,0.1)] mb-8 shadow-2xl shadow-[#B4533A]/5 flex flex-wrap gap-6 items-end">
                <div className="flex-1 min-w-[200px]">
                    <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-[#B4533A] mb-3 leading-none">Loại chứng từ</label>
                    <div className="relative">
                        <FolderTree size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#B4533A]" />
                        <select className="w-full h-14 bg-[#FFFFFF] border border-[rgba(148,163,184,0.1)] rounded-2xl pl-12 pr-10 text-sm font-bold text-[#000000] focus:outline-none focus:border-[#B4533A] focus:ring-4 focus:ring-[#B4533A]/5 transition-all appearance-none cursor-pointer">
                            <option value="ALL">Tất cả chứng từ</option>
                            <option value="PURCHASE_REQUISITION">Yêu cầu mua hàng (PR)</option>
                            <option value="PURCHASE_ORDER">Đơn đặt hàng (PO)</option>
                        </select>
                    </div>
                </div>

                <div className="flex-1 min-w-[200px]">
                    <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-[#B4533A] mb-3 leading-none">Quyết định</label>
                    <div className="relative">
                        <CheckCircle size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#B4533A]" />
                        <select className="w-full h-14 bg-[#FFFFFF] border border-[rgba(148,163,184,0.1)] rounded-2xl pl-12 pr-10 text-sm font-bold text-[#000000] focus:outline-none focus:border-[#B4533A] focus:ring-4 focus:ring-[#B4533A]/5 transition-all appearance-none cursor-pointer">
                            <option value="ALL">Tất cả trạng thái</option>
                            <option value="APPROVED">Đã phê duyệt</option>
                            <option value="REJECTED">Đã từ chối</option>
                        </select>
                    </div>
                </div>

                <button className="bg-[#B4533A] text-black h-14 flex items-center justify-center px-10 rounded-2xl font-black uppercase tracking-widest text-[11px] shadow-xl shadow-[#B4533A]/20 cursor-pointer hover:bg-[#A85032] transition-all active:scale-95 border-none">
                    Áp dụng bộ lọc
                </button>
            </div>

            {/* History Table */}
            <div className="bg-[#FAF8F5] rounded-3xl border border-[rgba(148,163,184,0.1)] overflow-hidden shadow-xl shadow-[#B4533A]/5 mb-8">
                <table className="erp-table text-xs">
                    <thead>
                        <tr className="bg-[#FFFFFF] border-b border-[rgba(148,163,184,0.1)]">
                            <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-[#000000]">Loại</th>
                            <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-[#000000]">Mã chứng từ</th>
                            <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-[#000000]">Tiêu đề</th>
                            <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-[#000000]">Quyết định</th>
                            <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-[#000000] text-center">Ngày duyệt</th>
                            <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-[#000000]">Ghi chú</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-[rgba(148,163,184,0.1)]">
                        {approvals.map((item) => (
                            <tr key={item.id} className="hover:bg-[#FFFFFF]/30 transition-colors">
                                <td className="px-6 py-5">
                                    <span className={`px-2 py-1 rounded-md text-[10px] font-black tracking-widest uppercase border ${item.documentType === "PURCHASE_REQUISITION" ? 'bg-amber-500/10 text-black border-amber-500/20' : 'bg-[#B4533A]/10 text-[#B4533A] border-[#B4533A]/20'}`}>
                                        {item.documentType === "PURCHASE_REQUISITION" ? 'Yêu cầu mua hàng' : 'Đơn đặt hàng'}
                                    </span>
                                </td>
                                <td className="px-6 py-5">
                                    <span className="font-bold text-[#000000]">{item.id}</span>
                                </td>
                                <td className="px-6 py-5 font-bold text-[#000000]">{item.documentType}</td>
                                <td className="px-6 py-5">
                                    <div className="flex items-center gap-2">
                                        {item.status === 'APPROVED' ? (
                                            <>
                                                <div className="h-5 w-5 rounded-full bg-emerald-500 text-[#000000] flex items-center justify-center">
                                                    <CheckCircle size={12} />
                                                </div>
                                                <span className="text-xs font-black text-black uppercase tracking-tight">Đã duyệt</span>
                                            </>
                                        ) : item.status === "PENDING" ? (
                                            <>
                                                <div className="h-5 w-5 rounded-full bg-amber-500 text-[#000000] flex items-center justify-center">
                                                    <Clock size={12} />
                                                </div>
                                                <span className="text-xs font-black text-black uppercase tracking-tight">Đang chờ duyệt</span>
                                            </>
                                        ) : (
                                            <span className="text-xs font-black text-[#000000] uppercase tracking-tight">Đang chờ</span>
                                        )}
                                    </div>
                                </td>
                                <td className="px-6 py-5 text-[11px] font-bold text-[#000000] text-center whitespace-nowrap">
                                    {new Date(item.createdAt!).toLocaleDateString("vi-VN")} {new Date(item.createdAt!).toLocaleTimeString("vi-VN", { hour: '2-digit', minute: '2-digit' })}
                                </td>
                                <td className="px-6 py-5 text-xs text-[#000000] font-medium italic">
                                    {item.status === 'APPROVED' ? 'Hồ sơ đã được phê duyệt thành công' : 'Hồ sơ đã bị từ chối'}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Pagination Placeholder */}
            <div className="flex items-center justify-between px-6">
                <span className="text-xs font-black text-[#000000] uppercase tracking-widest">Trang 1 / 1</span>
                <div className="flex gap-2 text-[#000000]">
                    <button className="h-10 w-10 flex items-center justify-center rounded-xl bg-[#FAF8F5] border border-[rgba(148,163,184,0.1)] hover:bg-[#FFFFFF] transition-colors">
                        <ChevronLeft size={18} />
                    </button>
                    <button className="h-10 w-10 flex items-center justify-center rounded-xl bg-[#FAF8F5] border border-[rgba(148,163,184,0.1)] hover:bg-[#FFFFFF] transition-colors">
                        <ChevronRight size={18} />
                    </button>
                </div>
            </div>
        </main>
    );
}

