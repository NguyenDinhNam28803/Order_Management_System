"use client";

import React, { useState } from "react";
import { TrendingUp, PieChart, Wallet, ArrowRight, Calendar, Building, Filter, Download } from "lucide-react";
import { formatVND } from "../../utils/formatUtils";

export default function SpendTrackingPage() {
    const stats = {
        allocated: 3000000000,
        committed: 1200000000,
        spent: 0,
        remaining: 1800000000
    };

    const remainingPct = (stats.remaining / stats.allocated) * 100;

    const transactions = [
        { id: "PO-2026-002", type: "PO", category: "Thiết bị IT", amount: 85000000, status: "WAITING_MANAGER", date: "2026-04-03" },
        { id: "PO-2026-001", type: "PO", category: "Linh kiện", amount: 150000000, status: "REJECTED", date: "2026-04-01" },
    ];

    return (
        <main className="animate-in fade-in duration-500 pb-20">
            <header className="mb-10 lg:flex items-end justify-between">
                <div>
                    <h1 className="text-2xl font-black tracking-tight text-erp-navy mb-2 uppercase tracking-tighter">THEO DÕI CHI TIÊU</h1>
                    <p className="text-slate-500 font-medium">Theo dõi ngân sách theo thời gian thực của phòng ban</p>
                </div>
                
                <div className="flex gap-4 mt-6 lg:mt-0">
                    <div className="flex bg-white rounded-2xl border border-slate-200 p-1 shadow-sm">
                        <select className="bg-transparent border-none text-[10px] font-black uppercase tracking-widest text-erp-navy px-4 outline-none appearance-none cursor-pointer">
                            <option>Q2/2026 - Tháng 4</option>
                            <option>Q2/2026 - Tháng 5</option>
                        </select>
                    </div>
                    <div className="flex bg-white rounded-2xl border border-slate-200 p-1 shadow-sm">
                        <select className="bg-transparent border-none text-[10px] font-black uppercase tracking-widest text-erp-navy px-4 outline-none appearance-none cursor-pointer">
                            <option>Information Technology</option>
                        </select>
                    </div>
                </div>
            </header>

            {/* Metric Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
                <div className="bg-white rounded-[2rem] p-8 border border-slate-100 shadow-sm relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 transition-transform"><TrendingUp size={64} /></div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4">Ngân sách được duyệt</p>
                    <h3 className="text-2xl font-black text-erp-navy">{formatVND(stats.allocated)}</h3>
                    <div className="mt-4 flex items-center gap-2 text-green-500 text-[10px] font-black">
                        <ArrowRight size={14} /> 100% CỦA KỲ
                    </div>
                </div>

                <div className="bg-white rounded-[2rem] p-8 border border-slate-100 shadow-sm relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 transition-transform"><PieChart size={64} /></div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4">Đã cam kết (Committed)</p>
                    <h3 className="text-2xl font-black text-erp-blue">{formatVND(stats.committed)}</h3>
                    <div className="mt-4 flex items-center gap-2 text-erp-blue text-[10px] font-black italic">
                        Từ 2 đơn đặt hàng (PO)
                    </div>
                </div>

                <div className="bg-white rounded-[2rem] p-8 border border-slate-100 shadow-sm relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 transition-transform"><Wallet size={64} /></div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4">Đã chi tiêu (Spent)</p>
                    <h3 className="text-2xl font-black text-slate-400">{formatVND(stats.spent)}</h3>
                    <div className="mt-4 flex items-center gap-2 text-slate-300 text-[10px] font-black italic">
                        Chưa có giao dịch thực tế
                    </div>
                </div>

                <div className={`rounded-[2rem] p-8 border shadow-sm relative overflow-hidden group ${remainingPct < 10 ? 'bg-red-50 border-red-100' : 'bg-white border-slate-100'}`}>
                    <p className={`text-[10px] font-black uppercase tracking-widest mb-4 ${remainingPct < 10 ? 'text-red-500' : 'text-slate-400'}`}>Còn lại</p>
                    <h3 className={`text-2xl font-black ${remainingPct < 10 ? 'text-red-600' : 'text-green-600'}`}>{formatVND(stats.remaining)}</h3>
                    <div className="mt-4 flex items-center gap-2 text-[10px] font-black">
                        <div className="h-1.5 flex-1 bg-slate-100 rounded-full overflow-hidden">
                            <div className={`h-full rounded-full ${remainingPct < 10 ? 'bg-red-500' : 'bg-green-500'}`} style={{width: `${remainingPct}%`}} />
                        </div>
                        <span className={remainingPct < 10 ? 'text-red-500' : 'text-green-500'}>{Math.round(remainingPct)}%</span>
                    </div>
                </div>
            </div>

            {/* Transaction Detail */}
            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
                <div className="px-8 py-6 border-b border-slate-50 flex items-center justify-between">
                    <h4 className="text-xs font-black uppercase tracking-widest text-erp-navy">Chi tiết giao dịch</h4>
                    <button className="flex items-center gap-2 text-slate-400 hover:text-erp-navy transition-colors">
                        <Download size={16} />
                        <span className="text-[10px] font-black uppercase tracking-widest">Xuất báo cáo</span>
                    </button>
                </div>
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-slate-50/50">
                            <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Mã chứng từ</th>
                            <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Loại</th>
                            <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Hạng mục</th>
                            <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Số tiền</th>
                            <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 text-center">Trạng thái</th>
                            <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 text-center">Ngày</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                        {transactions.map((tx) => (
                            <tr key={tx.id} className="hover:bg-slate-50/30 transition-colors">
                                <td className="px-8 py-5 text-sm font-black text-erp-navy underline decoration-erp-blue/20">{tx.id}</td>
                                <td className="px-8 py-5">
                                    <span className="bg-slate-100 px-2 py-1 rounded text-[10px] font-black text-slate-500">{tx.type}</span>
                                </td>
                                <td className="px-8 py-5 text-xs font-bold text-slate-500">{tx.category}</td>
                                <td className="px-8 py-5 text-right font-black text-erp-navy">{formatVND(tx.amount)}</td>
                                <td className="px-8 py-5 text-center">
                                    <span className={`px-2 py-1 rounded-full text-[10px] font-black ${
                                        tx.status === 'APPROVED' ? 'bg-green-50 text-green-600' :
                                        tx.status === 'REJECTED' ? 'bg-red-50 text-red-600' :
                                        'bg-slate-50 text-slate-400'
                                    }`}>
                                        {tx.status}
                                    </span>
                                </td>
                                <td className="px-8 py-5 text-[11px] font-bold text-slate-300 text-center whitespace-nowrap">
                                    {new Date(tx.date).toLocaleDateString("vi-VN")}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </main>
    );
}
