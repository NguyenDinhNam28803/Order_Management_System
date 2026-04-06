"use client";

import React, { useState } from "react";
import DashboardHeader from "../../components/DashboardHeader";
import { FileCheck, ShieldAlert, CalendarClock, TrendingDown, Search, CheckCircle2, ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";

import { useProcurement } from "../../context/ProcurementContext";
import { formatVND } from "../../utils/formatUtils";

export default function FinanceDashboard() {
    const router = useRouter();
    const { invoices } = useProcurement();
    const [activeTab, setActiveTab] = useState<"ALL" | "EXCEPTION">("ALL");

    const activeInvoices = invoices.filter((i) => i.status === "PENDING" || i.status === "EXCEPTION" || i.status === "UNMATCHED");
    const displayedInvoices = activeTab === "ALL" ? activeInvoices : activeInvoices.filter((i) => i.status === "EXCEPTION");

    const totalSpentThisMonth = invoices
        .filter(i => i.status === "PAID")
        .reduce((sum, i) => sum + (Number(i.amount) || 0), 0);

    const pendingPaymentAmount = invoices
        .filter(i => i.status === "APPROVED")
        .reduce((sum, i) => sum + (Number(i.amount) || 0), 0);


    return (
        <main className="pt-16 px-8 pb-12 animate-in fade-in duration-500 min-h-screen bg-slate-50">
            <DashboardHeader breadcrumbs={["Kế toán", "Bàn làm việc Kế Toán", "3-Way Matching Queue"]} />

            <div className="mt-8 mb-8 pb-4 border-b border-slate-200">
                <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Kế Toán Khởi Trả (AP) Dashboard</h1>
                <p className="text-sm text-slate-500 mt-1">Quản lý hóa đơn chứng từ đầu vào & Hệ thống tự động đối soát (3-Way Matching).</p>
            </div>

            {/* KPI Cards (8.1) */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <div className="erp-card bg-white border-slate-200">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-lg"><FileCheck size={20} /></div>
                    </div>
                    <div className="text-2xl font-bold text-slate-900">{activeInvoices.length}<span className="text-xs font-semibold text-slate-400 ml-1 tracking-wide uppercase">Hóa đơn</span></div>
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Chờ Matching</div>
                </div>

                <div className="erp-card bg-white border-slate-200 cursor-pointer hover:border-red-200 transition-all" onClick={() => setActiveTab("EXCEPTION")}>
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-2.5 bg-red-50 text-red-600 rounded-lg"><ShieldAlert size={20} /></div>
                        <span className="flex items-center gap-1 text-[9px] font-bold uppercase text-red-600 bg-red-50 px-1.5 py-0.5 rounded border border-red-100">
                            Action Req
                        </span>
                    </div>
                    <div className="text-2xl font-bold text-slate-900">{activeInvoices.filter((i) => i.status === 'EXCEPTION').length}<span className="text-xs font-semibold text-slate-400 ml-1 tracking-wide uppercase">Lỗi</span></div>
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Exception cần xử lý</div>
                </div>

                <div className="erp-card bg-white border-slate-200">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-2.5 bg-amber-50 text-amber-600 rounded-lg"><CalendarClock size={20} /></div>
                    </div>
                    <div className="text-2xl font-bold text-slate-900">{invoices.filter(i => i.status === "APPROVED").length}<span className="text-xs font-semibold text-slate-400 ml-1 tracking-wide uppercase">Lệnh chi</span></div>
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Chờ giải ngân</div>
                    <div className="text-[10px] text-amber-600 font-semibold mt-2">Dự kiến: {formatVND(pendingPaymentAmount)} ₫</div>
                </div>

                <div className="erp-card bg-white border-slate-200">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-lg"><TrendingDown size={20} /></div>
                    </div>
                    <div className="text-xl font-bold text-slate-900">{formatVND(totalSpentThisMonth)} ₫</div>
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Tổng chi tháng này</div>
                </div>
            </div>

            {/* List & Tabs (8.1) */}
            <div className="erp-card p-0 overflow-hidden border-slate-200">
                <div className="bg-slate-50/50 border-b border-slate-200 p-4 flex items-center justify-between gap-4">
                    <div className="flex gap-2">
                        <button 
                            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${activeTab === 'ALL' ? 'bg-white text-indigo-600 shadow-sm border border-slate-200' : 'text-slate-500 hover:text-slate-700'}`}
                            onClick={() => setActiveTab("ALL")}
                        >
                            Tất cả hóa đơn
                        </button>
                        <button 
                            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all flex items-center gap-2 ${activeTab === 'EXCEPTION' ? 'bg-white text-red-600 shadow-sm border border-slate-200' : 'text-slate-500 hover:text-slate-700'}`}
                            onClick={() => setActiveTab("EXCEPTION")}
                        >
                            Cần xử lý <span className="bg-red-100 text-red-600 px-2 py-0.5 rounded-full text-[10px]">{activeInvoices.filter((i) => i.status === 'EXCEPTION').length}</span>
                        </button>
                    </div>
                    <div className="relative w-64">
                        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input type="text" className="erp-input pl-10 py-2 text-sm" placeholder="Tìm kiếm Số INV / NCC..." />
                    </div>
                </div>

                <table className="erp-table border-none rounded-none">
                    <thead>
                        <tr>
                            <th>Số Invoice</th>
                            <th>Nhà cung cấp</th>
                            <th>PO Liên kết</th>
                            <th className="text-right">Số tiền VAT</th>
                            <th>Ngày Submit</th>
                            <th className="text-center">Trạng thái Matching</th>
                            {activeTab === "EXCEPTION" && <th>Lý do Lệch</th>}
                            <th className="text-right">Hành động</th>
                        </tr>
                    </thead>
                    <tbody>
                        {displayedInvoices.map((inv) => (
                            <tr key={inv.id} className="cursor-pointer group" onClick={() => router.push(`/finance/matching?id=${inv.id}`)}>
                                <td className="font-semibold text-slate-900">{inv.id}</td>
                                <td className="font-medium text-slate-700">{inv.vendor}</td>
                                <td className="font-mono text-slate-500 text-xs">{inv.poId}</td>
                                <td className="text-right font-semibold text-slate-900">{formatVND(inv.amount)} ₫</td>
                                <td className="text-slate-500 text-xs">{inv.createdAt}</td>
                                <td className="text-center">
                                    {inv.status === "PENDING" ? (
                                        <span className="status-pill status-approved">
                                            <CheckCircle2 size={12}/> Auto Matched
                                        </span>
                                    ) : (
                                        <span className="status-pill status-rejected">
                                            <ShieldAlert size={12}/> Exception
                                        </span>
                                    )}
                                </td>
                                {activeTab === "EXCEPTION" && (
                                    <td className="text-xs font-medium text-red-600 bg-red-50/30">
                                        Lệch hệ thống 3-way
                                    </td>
                                )}
                                <td className="text-right">
                                    <button className="text-indigo-600 font-semibold text-xs hover:underline flex items-center justify-end gap-1 w-full">
                                        Xử lý <ArrowRight size={14}/>
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>


        </main>
    )
}
