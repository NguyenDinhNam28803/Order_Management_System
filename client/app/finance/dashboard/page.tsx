"use client";

import React, { useState } from "react";
import DashboardHeader from "../../components/DashboardHeader";
import { 
    FileCheck, ShieldAlert, CalendarClock, TrendingDown, Search, 
    CheckCircle2, ArrowRight, BarChart3, PieChart, Activity,
    Filter, Download, MoreHorizontal
} from "lucide-react";
import { useRouter } from "next/navigation";

import { useProcurement } from "../../context/ProcurementContext";
import { formatVND } from "../../utils/formatUtils";
import BudgetHeatmap from "../../components/BudgetHeatmap";

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

            {/* Header Section */}
            <div className="mt-8 flex flex-col md:flex-row md:items-end justify-between gap-6 pb-8 border-b border-slate-200">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-3">
                        AP Command Center
                        <span className="bg-indigo-100 text-indigo-700 text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest">Live</span>
                    </h1>
                    <p className="text-sm font-medium text-slate-500 mt-1">Hệ thống quản trị khoản phải trả & Đối soát 3 bên tự động tích hợp AI.</p>
                </div>
                <div className="flex gap-3">
                    <button className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50 transition-all shadow-sm">
                        <Download size={14} /> Export Report
                    </button>
                    <button className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100">
                        <Activity size={14} /> System Health
                    </button>
                </div>
            </div>

            {/* KPI Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 my-8">
                <MetricCard 
                    icon={<FileCheck size={20} />} 
                    label="Hóa đơn chờ Matching" 
                    value={activeInvoices.length} 
                    unit="Invoices"
                    color="indigo"
                />
                <MetricCard 
                    icon={<ShieldAlert size={20} />} 
                    label="Exception Cần xử lý" 
                    value={activeInvoices.filter((i) => i.status === 'EXCEPTION').length} 
                    unit="Alerts"
                    color="rose"
                    onClick={() => setActiveTab("EXCEPTION")}
                />
                <MetricCard 
                    icon={<CalendarClock size={20} />} 
                    label="Lệnh chi chờ giải ngân" 
                    value={invoices.filter(i => i.status === "APPROVED").length} 
                    unit="Transations"
                    color="amber"
                    subValue={`${formatVND(pendingPaymentAmount)} ₫`}
                />
                <MetricCard 
                    icon={<TrendingDown size={20} />} 
                    label="Tổng quyết toán tháng" 
                    value={formatVND(totalSpentThisMonth)} 
                    unit="VNĐ"
                    color="emerald"
                />
            </div>

            {/* Analytics Section: Heatmap */}
            <div className="mb-8">
                <BudgetHeatmap />
            </div>

            {/* Invoices Interface */}
            <div className="erp-card p-0 overflow-hidden border-slate-200 shadow-sm bg-white">
                <div className="p-6 border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-slate-900 text-white rounded-xl">
                            <BarChart3 size={18} />
                        </div>
                        <h3 className="text-base font-bold text-slate-900 tracking-tight">Invoice Processing Queue</h3>
                    </div>
                    
                    <div className="flex items-center gap-4">
                        <div className="bg-slate-100 p-1 rounded-xl flex gap-1">
                            <button 
                                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${activeTab === 'ALL' ? 'bg-white text-indigo-600 shadow-sm border border-slate-200/50' : 'text-slate-500 hover:text-slate-700'}`}
                                onClick={() => setActiveTab("ALL")}
                            >
                                Tất cả
                            </button>
                            <button 
                                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${activeTab === 'EXCEPTION' ? 'bg-white text-rose-600 shadow-sm border border-slate-200/50' : 'text-slate-500 hover:text-slate-700'}`}
                                onClick={() => setActiveTab("EXCEPTION")}
                            >
                                Exception <span className="bg-rose-100 text-rose-600 px-1.5 py-0.5 rounded-md text-[9px]">{activeInvoices.filter((i) => i.status === 'EXCEPTION').length}</span>
                            </button>
                        </div>
                        <div className="h-8 w-px bg-slate-200"></div>
                        <div className="relative">
                            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input 
                                type="text" 
                                className="w-64 bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 py-2 text-xs font-medium focus:ring-4 focus:ring-indigo-500/10 transition-all outline-none" 
                                placeholder="Search by INV / Supplier..." 
                            />
                        </div>
                        <button className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-500 hover:bg-white transition-all shadow-sm">
                            <Filter size={16} />
                        </button>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="erp-table border-none rounded-none w-full">
                        <thead className="bg-slate-50/50 text-[10px] font-black uppercase tracking-widest text-slate-400">
                            <tr>
                                <th className="px-6 py-4">Mã định danh INV</th>
                                <th>Đối tác cung ứng</th>
                                <th>Tham chiếu PO</th>
                                <th className="text-right">Giá trị VAT</th>
                                <th>Ngày tiếp nhận</th>
                                <th className="text-center">Tình trạng Matching</th>
                                <th className="text-right pr-6"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 font-medium">
                            {displayedInvoices.map((inv) => (
                                <tr key={inv.id} className="cursor-pointer group hover:bg-slate-50/80 transition-colors" onClick={() => router.push(`/finance/matching?id=${inv.id}`)}>
                                    <td className="px-6 py-5">
                                        <div className="flex items-center gap-3">
                                            <div className="h-8 w-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-[10px] group-hover:bg-indigo-600 group-hover:text-white transition-colors duration-300">
                                                ID
                                            </div>
                                            <span className="font-bold text-slate-900 tracking-tight">{inv.id}</span>
                                        </div>
                                    </td>
                                    <td>
                                        <div className="text-sm font-bold text-slate-700">{inv.vendor}</div>
                                        <div className="text-[10px] text-slate-400 font-medium uppercase tracking-tighter">Verified Partner</div>
                                    </td>
                                    <td className=" text-indigo-600 text-[11px] font-bold">#{inv.poId}</td>
                                    <td className="text-right font-bold text-slate-900 text-sm">{formatVND(inv.amount)} ₫</td>
                                    <td className="text-slate-500 text-[11px] font-semibold">{inv.createdAt}</td>
                                    <td className="text-center">
                                        {inv.status === "PENDING" ? (
                                            <div className="flex justify-center">
                                                <span className="status-pill status-approved py-0.5 px-2 text-[10px] flex items-center gap-1.5">
                                                    <CheckCircle2 size={10}/> Auto Matched
                                                </span>
                                            </div>
                                        ) : (
                                            <div className="flex justify-center">
                                                <span className="status-pill status-rejected py-0.5 px-2 text-[10px] flex items-center gap-1.5 animate-pulse">
                                                    <ShieldAlert size={10}/> Exception
                                                </span>
                                            </div>
                                        )}
                                    </td>
                                    <td className="text-right pr-6">
                                        <div className="flex items-center justify-end gap-2">
                                            <button className="h-8 w-8 rounded-lg border border-slate-200 text-slate-400 hover:text-indigo-600 hover:border-indigo-200 flex items-center justify-center transition-all bg-white shadow-sm">
                                                <MoreHorizontal size={14} />
                                            </button>
                                            <button className="flex items-center gap-1 px-3 py-1.5 bg-indigo-50 text-indigo-600 rounded-lg text-[11px] font-bold hover:bg-indigo-600 hover:text-white transition-all shadow-sm">
                                                Audit <ArrowRight size={12}/>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Showing {displayedInvoices.length} of {activeInvoices.length} invoices in queue</p>
                    <div className="flex gap-1">
                         {[1, 2, 3].map(i => (
                             <button key={i} className={`h-8 w-8 rounded-lg text-[11px] font-bold border transition-all ${i === 1 ? 'bg-white border-slate-300 text-slate-900 shadow-sm' : 'border-transparent text-slate-400 hover:text-slate-600'}`}>{i}</button>
                         ))}
                    </div>
                </div>
            </div>
        </main>
    )
}

function MetricCard({ icon, label, value, unit, color, onClick, subValue }: any) {
    const colorStyles: any = {
        indigo: "bg-indigo-50 text-indigo-600 border-indigo-100",
        rose: "bg-rose-50 text-rose-600 border-rose-100",
        amber: "bg-amber-50 text-amber-600 border-amber-100",
        emerald: "bg-emerald-50 text-emerald-600 border-emerald-100",
    };

    return (
        <div 
            onClick={onClick}
            className={`erp-card bg-white border border-slate-200 p-6 relative overflow-hidden group transition-all duration-300 hover:shadow-xl hover:-translate-y-1 hover:border-indigo-300 ${onClick ? 'cursor-pointer' : ''}`}
        >
            <div className="flex justify-between items-start mb-6">
                <div className={`p-3 rounded-[18px] shadow-sm transition-transform group-hover:scale-110 duration-500 ${colorStyles[color]}`}>
                    {icon}
                </div>
                <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mt-1 group-hover:text-indigo-600 transition-colors">KPI Meter</div>
            </div>
            <div className="space-y-1">
                <div className="text-3xl font-bold text-slate-900 tracking-tight tabular-nums flex items-end gap-1.5">
                    {value}
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5">{unit}</span>
                </div>
                <h4 className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">{label}</h4>
            </div>
            {subValue && (
                <div className="mt-4 pt-4 border-t border-slate-50 flex items-center justify-between">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Detail Forecast</span>
                    <span className={`text-[11px] font-black tabular-nums colorStyles[color] ${color === 'amber' ? 'text-amber-600' : ''}`}>{subValue}</span>
                </div>
            )}
            {/* Visual element decor */}
            <div className={`absolute -right-4 -bottom-4 w-24 h-24 rounded-full opacity-[0.03] group-hover:scale-150 transition-transform duration-700 ${colorStyles[color]}`}></div>
        </div>
    );
}
