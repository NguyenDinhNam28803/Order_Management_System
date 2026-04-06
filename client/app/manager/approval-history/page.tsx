"use client";

import React, { useState } from "react";
import { useProcurement } from "@/app/context/ProcurementContext";
import { Search, Filter, History, ShoppingCart, FolderTree, CheckCircle, XCircle, ChevronLeft, ChevronRight, Clock } from "lucide-react";
import { formatVND } from "../../utils/formatUtils";

export default function ApprovalHistoryPage() {
    const [filter, setFilter] = useState({ type: "ALL", status: "ALL", date: "" });
    const { approvals } = useProcurement();
    return (
        <main className="animate-in fade-in duration-500">
            <header className="mb-10 lg:flex items-end justify-between">
                <div>
                    <h1 className="text-2xl font-black tracking-tight text-erp-navy mb-2 uppercase">LỊCH SỬ PHÊ DUYỆT</h1>
                    <p className="text-slate-500 font-medium">Toàn bộ hồ sơ các quyết định phê duyệt của bạn</p>
                </div>
                
                <div className="flex gap-4 mt-6 lg:mt-0">
                    <div className="flex bg-white rounded-2xl border border-slate-200 p-1 shadow-sm">
                        <button className="px-4 py-2 text-[10px] font-black uppercase tracking-widest text-erp-navy bg-slate-50 rounded-xl transition-all">Hôm nay</button>
                        <button className="px-4 py-2 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-600 transition-all">Tuần này</button>
                        <button className="px-4 py-2 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-600 transition-all">Tháng này</button>
                    </div>
                </div>
            </header>

            {/* Filter Bar */}
            <div className="bg-white rounded-3xl border border-slate-200 p-6 mb-8 shadow-sm flex flex-wrap gap-6 items-end">
                <div className="flex-1 min-w-50">
                    <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Loại chứng từ</label>
                    <div className="relative">
                        <FolderTree size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                        <select className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-3 pl-12 pr-4 text-sm font-bold text-erp-navy outline-none appearance-none cursor-pointer">
                            <option value="ALL">Tất cả chứng từ</option>
                            <option value="PURCHASE_REQUISITION">Yêu cầu mua hàng (PR)</option>
                            <option value="PURCHASE_ORDER">Đơn đặt hàng (PO)</option>
                        </select>
                    </div>
                </div>

                <div className="flex-1 min-w-50">
                    <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Quyết định</label>
                    <div className="relative">
                        <CheckCircle size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                        <select className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-3 pl-12 pr-4 text-sm font-bold text-erp-navy outline-none appearance-none cursor-pointer">
                            <option value="ALL">Tất cả trạng thái</option>
                            <option value="APPROVED">Đã phê duyệt</option>
                            <option value="REJECTED">Đã từ chối</option>
                        </select>
                    </div>
                </div>

                <div className="bg-erp-navy text-white h-12 flex items-center justify-center px-8 rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-lg shadow-erp-navy/20 cursor-pointer hover:bg-erp-navy/90 transition-all active:scale-95">
                    Áp dụng bộ lọc
                </div>
            </div>

            {/* History Table */}
            <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm shadow-slate-100 mb-8">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-slate-50/50 border-b border-slate-100">
                            <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Loại</th>
                            <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Mã chứng từ</th>
                            <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Tiêu đề</th>
                            <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Quyết định</th>
                            <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 text-center">Ngày duyệt</th>
                            <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Ghi chú</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {approvals.map((item) => (
                            <tr key={item.id} className="hover:bg-slate-50/30 transition-colors">
                                <td className="px-6 py-5">
                                    <span className={`px-2 py-1 rounded-md text-[10px] font-black tracking-widest uppercase ${item.documentType === "PURCHASE_REQUISITION" ? 'bg-orange-50 text-orange-600' : 'bg-blue-50 text-blue-600'}`}>
                                        {item.documentType === "PURCHASE_REQUISITION" ? 'Yêu cầu mua hàng' : 'Đơn đặt hàng'}
                                    </span>
                                </td>
                                <td className="px-6 py-5">
                                    <span className="font-bold text-erp-navy">{item.id}</span>
                                </td>
                                <td className="px-6 py-5 font-bold text-slate-600">{item.documentType}</td>
                                <td className="px-6 py-5">
                                    <div className="flex items-center gap-2">
                                        {item.status === 'APPROVED' ? (
                                            <>
                                                <div className="h-5 w-5 rounded-full bg-green-500 text-white flex items-center justify-center">
                                                    <CheckCircle size={12} />
                                                </div>
                                                <span className="text-xs font-black text-green-600 uppercase tracking-tight">Đã duyệt</span>
                                            </>
                                        ) : item.status === "PENDING" ? (
                                            <>
                                                <div className="h-5 w-5 rounded-full bg-yellow-500 text-white flex items-center justify-center">
                                                    <Clock size={12} />
                                                </div>
                                                <span className="text-xs font-black text-yellow-600 uppercase tracking-tight">Đang chờ duyệt</span>
                                            </>
                                        ) : (
                                            <span className="text-xs font-black text-slate-400 uppercase tracking-tight">Đang chờ</span>
                                        )}
                                    </div>
                                </td>
                                <td className="px-6 py-5 text-[11px] font-bold text-slate-400 text-center whitespace-nowrap">
                                    {new Date(item.createdAt!).toLocaleDateString("vi-VN")} {new Date(item.createdAt!).toLocaleTimeString("vi-VN", { hour: '2-digit', minute: '2-digit' })}
                                </td>
                                <td className="px-6 py-5 text-xs text-slate-500 font-medium italic">
                                    {item.status === 'APPROVED' ? 'Hồ sơ đã được phê duyệt thành công' : 'Hồ sơ đã bị từ chối'}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Pagination Placeholder */}
            <div className="flex items-center justify-between px-6">
                <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Trang 1 / 1</span>
                <div className="flex gap-2 text-slate-400">
                    <button className="h-10 w-10 flex items-center justify-center rounded-xl bg-white border border-slate-200">
                        <ChevronLeft size={18} />
                    </button>
                    <button className="h-10 w-10 flex items-center justify-center rounded-xl bg-white border border-slate-200">
                        <ChevronRight size={18} />
                    </button>
                </div>
            </div>
        </main>
    );
}
