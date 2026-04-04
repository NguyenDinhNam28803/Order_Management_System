"use client";

import React, { useState } from "react";
import { Search, Filter, History, ShoppingCart, FolderTree, CheckCircle, XCircle, ChevronLeft, ChevronRight } from "lucide-react";
import { formatVND } from "../../utils/formatUtils";

export default function ApprovalHistoryPage() {
    const [filter, setFilter] = useState({ type: "ALL", status: "ALL", date: "" });

    const historyData = [
        { id: "PR-2026-4704", type: "PR", title: "Máy tính xách tay Dell XPS", status: "APPROVED", date: "2026-04-04T09:15:00Z", note: "Phê duyệt thay thế thiết bị cũ" },
        { id: "PR-2026-1549", type: "PR", title: "Nâng cấp hạ tầng Switch", status: "APPROVED", date: "2026-04-04T10:30:00Z", note: "Đã rà soát báo giá" },
        { id: "PR-2026-1700", type: "PR", title: "Máy in màu Canon", status: "APPROVED", date: "2026-04-04T14:45:00Z", note: "Cần thiết cho bộ phận Thiết kế" },
        { id: "PO-2026-001", type: "PO", title: "Đơn hàng linh kiện ABC", status: "REJECTED", date: "2026-04-04T11:20:00Z", note: "Báo giá cao hơn thị trường 15%" }
    ];

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
                <div className="flex-1 min-w-[200px]">
                    <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Loại chứng từ</label>
                    <div className="relative">
                        <FolderTree size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                        <select className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-3 pl-12 pr-4 text-sm font-bold text-erp-navy outline-none appearance-none cursor-pointer">
                            <option value="ALL">Tất cả chứng từ</option>
                            <option value="PR">Yêu cầu mua hàng (PR)</option>
                            <option value="PO">Đơn đặt hàng (PO)</option>
                        </select>
                    </div>
                </div>

                <div className="flex-1 min-w-[200px]">
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
                        {historyData.map((item) => (
                            <tr key={item.id} className="hover:bg-slate-50/30 transition-colors">
                                <td className="px-6 py-5">
                                    <span className={`px-2 py-1 rounded-md text-[10px] font-black tracking-widest uppercase ${item.type === 'PR' ? 'bg-orange-50 text-orange-600' : 'bg-blue-50 text-blue-600'}`}>
                                        {item.type}
                                    </span>
                                </td>
                                <td className="px-6 py-5">
                                    <span className="font-bold text-erp-navy">{item.id}</span>
                                </td>
                                <td className="px-6 py-5 font-bold text-slate-600">{item.title}</td>
                                <td className="px-6 py-5">
                                    <div className="flex items-center gap-2">
                                        {item.status === 'APPROVED' ? (
                                            <>
                                                <div className="h-5 w-5 rounded-full bg-green-500 text-white flex items-center justify-center">
                                                    <CheckCircle size={12} />
                                                </div>
                                                <span className="text-xs font-black text-green-600 uppercase tracking-tight">Đã duyệt</span>
                                            </>
                                        ) : (
                                            <>
                                                <div className="h-5 w-5 rounded-full bg-red-500 text-white flex items-center justify-center">
                                                    <XCircle size={12} />
                                                </div>
                                                <span className="text-xs font-black text-red-600 uppercase tracking-tight">Từ chối</span>
                                            </>
                                        )}
                                    </div>
                                </td>
                                <td className="px-6 py-5 text-[11px] font-bold text-slate-400 text-center whitespace-nowrap">
                                    {new Date(item.date).toLocaleDateString("vi-VN")} {new Date(item.date).toLocaleTimeString("vi-VN", { hour: '2-digit', minute: '2-digit' })}
                                </td>
                                <td className="px-6 py-5 text-xs text-slate-500 font-medium italic">
                                    {item.note}
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
