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

    const activeInvoices = invoices.filter((i) => i.status === "PENDING" || i.status === "EXCEPTION");
    const displayedInvoices = activeTab === "ALL" ? activeInvoices : activeInvoices.filter((i) => i.status === "EXCEPTION");


    return (
        <main className="pt-16 px-8 pb-12 animate-in fade-in duration-300 min-h-screen bg-slate-50">
            <DashboardHeader breadcrumbs={["Kế toán", "Bàn làm việc Kế Toán", "3-Way Matching Queue"]} />

            <div className="mt-8 mb-8 pb-4 border-b border-slate-200">
                <h1 className="text-3xl font-black text-erp-navy tracking-tight">Kế Toán Khởi Trả (AP) Dashboard</h1>
                <p className="text-sm text-slate-500 mt-1">Quản lý hóa đơn chứng từ đầu vào & Hệ thống tự động đối soát (3-Way Matching).</p>
            </div>

            {/* KPI Cards (8.1) */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <div className="erp-card bg-blue-50 border-blue-200">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-3 bg-blue-100 text-blue-600 rounded-xl"><FileCheck size={24} /></div>
                    </div>
                    <div className="text-3xl font-black text-blue-950">{activeInvoices.length}<span className="text-sm font-bold text-blue-700/60 uppercase ml-1">Hóa đơn</span></div>
                    <div className="text-xs font-bold text-blue-700/60 uppercase tracking-widest mt-1">Invoice chờ Matching</div>
                </div>

                <div className="erp-card bg-red-50 border-red-200 cursor-pointer hover:shadow-md transition-shadow" onClick={() => setActiveTab("EXCEPTION")}>
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-3 bg-red-100 text-red-600 rounded-xl"><ShieldAlert size={24} /></div>
                        <span className="flex items-center gap-1 text-[10px] font-black uppercase text-red-600 bg-red-200/50 px-2 py-1 rounded animate-pulse">
                            Action Req
                        </span>
                    </div>
                    <div className="text-3xl font-black text-red-950">{activeInvoices.filter((i) => i.status === 'EXCEPTION').length}<span className="text-sm font-bold text-red-700/60 uppercase ml-1">Lỗi</span></div>
                    <div className="text-xs font-bold text-red-700/60 uppercase tracking-widest mt-1">Matching Exception cần xử lý</div>
                </div>

                <div className="erp-card bg-orange-50 border-orange-200">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-3 bg-orange-100 text-orange-600 rounded-xl"><CalendarClock size={24} /></div>
                    </div>
                    <div className="text-3xl font-black text-orange-950">8<span className="text-sm font-bold text-orange-700/60 uppercase ml-1">Lệnh chi</span></div>
                    <div className="text-xs font-bold text-orange-700/60 uppercase tracking-widest mt-1">Thanh toán trong 7 ngày tới</div>
                    <div className="text-[10px] text-orange-600 font-bold mt-2">Dự kiến chi: 450,000,000 ₫</div>
                </div>

                <div className="erp-card bg-emerald-50 border-emerald-200">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-3 bg-emerald-100 text-emerald-600 rounded-xl"><TrendingDown size={24} /></div>
                    </div>
                    <div className="text-2xl font-black text-emerald-950 font-mono">1.2B ₫</div>
                    <div className="text-xs font-bold text-emerald-700/60 uppercase tracking-widest mt-1">Tổng chi tháng này</div>
                </div>
            </div>

            {/* List & Tabs (8.1) */}
            <div className="erp-card !p-0 shadow-sm border border-slate-200 bg-white overflow-hidden">
                <div className="bg-slate-50 border-b border-slate-100 p-4 flex gap-4">
                    <button 
                        className={`text-xs font-black uppercase tracking-widest px-6 py-3 rounded-lg transition-colors ${activeTab === 'ALL' ? 'bg-erp-navy text-white shadow' : 'text-slate-500 hover:bg-slate-200'}`}
                        onClick={() => setActiveTab("ALL")}
                    >
                        Invoice Queue (Tất cả)
                    </button>
                    <button 
                        className={`text-xs font-black uppercase tracking-widest px-6 py-3 rounded-lg transition-colors flex items-center gap-2 ${activeTab === 'EXCEPTION' ? 'bg-red-500 text-white shadow' : 'text-slate-500 hover:bg-slate-200'}`}
                        onClick={() => setActiveTab("EXCEPTION")}
                    >
                        Exception Queue <span className={`${activeTab === "EXCEPTION" ? 'bg-red-700 text-red-100' : 'bg-red-100 text-red-600'} px-2 py-0.5 rounded text-[10px]`}>{activeInvoices.filter((i) => i.status === 'EXCEPTION').length}</span>
                    </button>
                    <div className="ml-auto relative">
                        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input type="text" className="erp-input pl-10 h-full text-xs bg-white" placeholder="Tìm kiếm Số INV / NCC..." />
                    </div>
                </div>

                <table className="erp-table text-xs m-0 !border-none">
                    <thead className="bg-slate-50">
                        <tr>
                            <th>Số Invoice</th>
                            <th>Nhà cung cấp (Vendor)</th>
                            <th>PO Liên kết</th>
                            <th className="text-right">Số tiền VAT</th>
                            <th>Ngày Submit</th>
                            <th className="text-center">Kết quả Matching</th>
                            {activeTab === "EXCEPTION" && <th>Lý do Lệch (Exception)</th>}
                            <th className="text-right">Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {displayedInvoices.map((inv) => (
                            <tr key={inv.id} className="cursor-pointer hover:bg-slate-50 border-b border-slate-100 group" onClick={() => router.push(`/finance/matching?id=${inv.id}`)}>
                                <td className="font-bold text-erp-navy text-sm">{inv.id}</td>
                                <td className="font-bold text-slate-700">{inv.vendor}</td>
                                <td className="font-mono text-slate-500">{inv.poId}</td>
                                <td className="text-right font-mono font-black text-slate-700">{formatVND(inv.amount)} ₫</td>
                                <td className="text-slate-500">{inv.createdAt}</td>
                                <td className="text-center">
                                    {inv.status === "PENDING" ? (
                                        <span className="text-[10px] uppercase font-black tracking-widest text-emerald-600 bg-emerald-50 px-2 py-1 border border-emerald-200 rounded flex items-center justify-center gap-1 w-max mx-auto">
                                            <CheckCircle2 size={12}/> Auto Matched
                                        </span>
                                    ) : (
                                        <span className="text-[10px] uppercase font-black tracking-widest text-red-600 bg-red-50 px-2 py-1 border border-red-200 rounded flex items-center justify-center gap-1 w-max mx-auto">
                                            <ShieldAlert size={12}/> Exception
                                        </span>
                                    )}
                                </td>
                                {activeTab === "EXCEPTION" && (
                                    <td className="text-[11px] font-bold text-red-700 bg-red-50/50 max-w-[200px] truncate" title={"Lệch hệ thống 3-way"}>
                                        {"Lệch hệ thống 3-way"}
                                    </td>
                                )}
                                <td className="text-right">
                                    <button className="text-[10px] font-black uppercase text-erp-blue opacity-50 group-hover:opacity-100 transition-opacity flex items-center justify-end gap-1 w-full">
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
