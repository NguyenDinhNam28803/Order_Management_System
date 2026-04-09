"use client";

import React, { useState } from "react";
import { 
    FileCheck, ShieldAlert, CalendarClock, TrendingDown, Search, 
    CheckCircle2, ArrowRight, BarChart3, PieChart, Activity,
    Filter, Download, MoreHorizontal
} from "lucide-react";
import { useRouter } from "next/navigation";

import { useProcurement } from "../../context/ProcurementContext";
import { formatVND } from "../../utils/formatUtils";
import BudgetHeatmap from "../../components/BudgetHeatmap";
import { SimpleBarChart, DonutChart, StatsCard } from "../../components/charts";

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
        <main className="animate-in fade-in duration-500 p-6 min-h-screen bg-[#0F1117] text-[#F8FAFC]">

            {/* Header Section */}
            <div className="mt-8 flex flex-col md:flex-row md:items-end justify-between gap-6 pb-8 border-b border-[rgba(148,163,184,0.1)]">
                <div>
                    <h1 className="text-3xl font-bold text-[#F8FAFC] tracking-tight flex items-center gap-3">
                        AP Command Center
                        <span className="bg-[#3B82F6]/10 text-[#3B82F6] text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest border border-[#3B82F6]/20">Live</span>
                    </h1>
                    <p className="text-sm font-medium text-[#64748B] mt-1">Hệ thống quản trị khoản phải trả & Đối soát 3 bên tự động tích hợp AI.</p>
                </div>
                <div className="flex gap-3">
                    <button className="flex items-center gap-2 px-4 py-2 bg-[#161922] border border-[rgba(148,163,184,0.1)] rounded-xl text-xs font-bold text-[#94A3B8] hover:bg-[#1A1D23] transition-all shadow-sm">
                        <Download size={14} /> Export Report
                    </button>
                    <button className="flex items-center gap-2 px-4 py-2 bg-[#3B82F6] text-white rounded-xl text-xs font-bold hover:bg-[#2563EB] transition-all shadow-lg shadow-[#3B82F6]/20">
                        <Activity size={14} /> System Health
                    </button>
                </div>
            </div>

            {/* KPI Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 my-8">
                <StatsCard 
                    title="Hóa Đơn Chờ Matching" 
                    value={activeInvoices.length} 
                    subValue={`${(activeInvoices.filter(i => i.status === 'EXCEPTION').length)} exceptions`}
                    icon={FileCheck}
                    color="blue"
                    trend={{ value: 5, isPositive: false }}
                />
                <StatsCard 
                    title="Exception Cần Xử Lý" 
                    value={activeInvoices.filter((i) => i.status === 'EXCEPTION').length} 
                    subValue="Cần xử lý ngay"
                    icon={ShieldAlert}
                    color="red"
                    trend={{ value: 12, isPositive: true }}
                />
                <StatsCard 
                    title="Lệnh Chi Chờ Giải Ngân" 
                    value={invoices.filter(i => i.status === "APPROVED").length} 
                    subValue={formatVND(pendingPaymentAmount)}
                    icon={CalendarClock}
                    color="amber"
                >
                    <div className="mt-2">
                        <div className="flex justify-between text-[10px] text-[#94A3B8] mb-1">
                            <span>Trung bình/xử lý</span>
                            <span>{formatVND(pendingPaymentAmount / Math.max(invoices.filter(i => i.status === "APPROVED").length, 1))}</span>
                        </div>
                    </div>
                </StatsCard>
                <StatsCard 
                    title="Tổng Quyết Toán Tháng" 
                    value={formatVND(totalSpentThisMonth)} 
                    subValue="Tháng này"
                    icon={TrendingDown}
                    color="green"
                    trend={{ value: 8, isPositive: true }}
                />
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                <DonutChart 
                    title="Phân Bổ Trạng Thái Hóa Đơn"
                    data={[
                        { label: 'Pending', value: invoices.filter(i => i.status === 'PENDING').length, color: '#F59E0B' },
                        { label: 'Matched', value: invoices.filter(i => i.status === 'MATCHED').length, color: '#10B981' },
                        { label: 'Exception', value: invoices.filter(i => i.status === 'EXCEPTION').length, color: '#EF4444' },
                        { label: 'Paid', value: invoices.filter(i => i.status === 'PAID').length, color: '#8B5CF6' },
                    ]}
                    centerLabel="Tổng HĐ"
                    centerValue={invoices.length.toString()}
                />
                <SimpleBarChart 
                    title="Thanh Toán Theo Trạng Thái"
                    data={[
                        { label: 'Chờ matching', value: invoices.filter(i => i.status === 'PENDING').reduce((sum, i) => sum + (Number(i.amount) || 0), 0), color: '#F59E0B' },
                        { label: 'Đã matching', value: invoices.filter(i => i.status === 'MATCHED').reduce((sum, i) => sum + (Number(i.amount) || 0), 0), color: '#3B82F6' },
                        { label: 'Đã thanh toán', value: totalSpentThisMonth, color: '#10B981' },
                    ]}
                />
            </div>

            {/* Analytics Section: Heatmap */}
            <div className="mb-8">
                <BudgetHeatmap />
            </div>

            {/* Invoices Interface */}
            <div className="bg-[#161922] rounded-3xl overflow-hidden border border-[rgba(148,163,184,0.1)] shadow-xl shadow-[#3B82F6]/5">
                <div className="p-6 border-b border-[rgba(148,163,184,0.1)] flex flex-col md:flex-row md:items-center justify-between gap-6 bg-[#161922]">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-[#0F1117] text-[#3B82F6] rounded-xl border border-[rgba(148,163,184,0.1)]">
                            <BarChart3 size={18} />
                        </div>
                        <h3 className="text-base font-bold text-[#F8FAFC] tracking-tight">Invoice Processing Queue</h3>
                    </div>
                    
                    <div className="flex items-center gap-4">
                        <div className="bg-[#0F1117] p-1 rounded-xl flex gap-1 border border-[rgba(148,163,184,0.1)]">
                            <button 
                                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${activeTab === 'ALL' ? 'bg-[#3B82F6] text-white shadow-lg shadow-[#3B82F6]/20' : 'text-[#64748B] hover:text-[#F8FAFC]'}`}
                                onClick={() => setActiveTab("ALL")}
                            >
                                Tất cả
                            </button>
                            <button 
                                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${activeTab === 'EXCEPTION' ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/20' : 'text-[#64748B] hover:text-[#F8FAFC]'}`}
                                onClick={() => setActiveTab("EXCEPTION")}
                            >
                                Exception <span className="bg-rose-500/20 text-rose-400 px-1.5 py-0.5 rounded-md text-[9px] border border-rose-500/20">{activeInvoices.filter((i) => i.status === 'EXCEPTION').length}</span>
                            </button>
                        </div>
                        <div className="h-8 w-px bg-[rgba(148,163,184,0.1)]"></div>
                        <div className="relative">
                            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#64748B]" />
                            <input 
                                type="text" 
                                className="w-64 bg-[#0F1117] border border-[rgba(148,163,184,0.1)] rounded-xl pl-9 pr-4 py-2 text-xs font-medium text-[#F8FAFC] placeholder:text-[#64748B] focus:ring-4 focus:ring-[#3B82F6]/10 transition-all outline-none" 
                                placeholder="Search by INV / Supplier..." 
                            />
                        </div>
                        <button className="p-2.5 bg-[#0F1117] border border-[rgba(148,163,184,0.1)] rounded-xl text-[#64748B] hover:bg-[#161922] transition-all shadow-sm">
                            <Filter size={16} />
                        </button>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-[#0F1117] text-[10px] font-black uppercase tracking-widest text-[#64748B]">
                            <tr className="border-b border-[rgba(148,163,184,0.1)]">
                                <th className="px-6 py-4 text-left">Mã định danh INV</th>
                                <th className="text-left">Đối tác cung ứng</th>
                                <th className="text-left">Tham chiếu PO</th>
                                <th className="text-right">Giá trị VAT</th>
                                <th className="text-left">Ngày tiếp nhận</th>
                                <th className="text-center">Tình trạng Matching</th>
                                <th className="text-right pr-6"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[rgba(148,163,184,0.1)] font-medium">
                            {displayedInvoices.map((inv) => (
                                <tr key={inv.id} className="cursor-pointer group hover:bg-[#0F1117]/50 transition-colors" onClick={() => router.push(`/finance/matching?id=${inv.id}`)}>
                                    <td className="px-6 py-5">
                                        <div className="flex items-center gap-3">
                                            <div className="h-8 w-8 rounded-lg bg-[#3B82F6]/10 text-[#3B82F6] flex items-center justify-center font-bold text-[10px] group-hover:bg-[#3B82F6] group-hover:text-white transition-colors duration-300 border border-[#3B82F6]/20">
                                                ID
                                            </div>
                                            <span className="font-bold text-[#F8FAFC] tracking-tight">{inv.id}</span>
                                        </div>
                                    </td>
                                    <td>
                                        <div className="text-sm font-bold text-[#F8FAFC]">{inv.vendor}</div>
                                        <div className="text-[10px] text-[#64748B] font-medium uppercase tracking-tighter">Verified Partner</div>
                                    </td>
                                    <td className=" text-[#3B82F6] text-[11px] font-bold">#{inv.poId}</td>
                                    <td className="text-right font-bold text-[#F8FAFC] text-sm">{formatVND(inv.amount)} ₫</td>
                                    <td className="text-[#64748B] text-[11px] font-semibold">{inv.createdAt}</td>
                                    <td className="text-center">
                                        {inv.status === "PENDING" ? (
                                            <div className="flex justify-center">
                                                <span className="px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1.5">
                                                    <CheckCircle2 size={10}/> Auto Matched
                                                </span>
                                            </div>
                                        ) : (
                                            <div className="flex justify-center">
                                                <span className="px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest bg-rose-500/10 text-rose-400 border border-rose-500/20 flex items-center gap-1.5 animate-pulse">
                                                    <ShieldAlert size={10}/> Exception
                                                </span>
                                            </div>
                                        )}
                                    </td>
                                    <td className="text-right pr-6">
                                        <div className="flex items-center justify-end gap-2">
                                            <button className="h-8 w-8 rounded-lg border border-[rgba(148,163,184,0.1)] text-[#64748B] hover:text-[#3B82F6] hover:border-[#3B82F6]/30 flex items-center justify-center transition-all bg-[#0F1117] shadow-sm">
                                                <MoreHorizontal size={14} />
                                            </button>
                                            <button className="flex items-center gap-1 px-3 py-1.5 bg-[#3B82F6]/10 text-[#3B82F6] rounded-lg text-[11px] font-bold hover:bg-[#3B82F6] hover:text-white transition-all shadow-sm border border-[#3B82F6]/20">
                                                Audit <ArrowRight size={12}/>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div className="p-4 bg-[#0F1117] border-t border-[rgba(148,163,184,0.1)] flex items-center justify-between">
                    <p className="text-[10px] font-bold text-[#64748B] uppercase tracking-widest">Showing {displayedInvoices.length} of {activeInvoices.length} invoices in queue</p>
                    <div className="flex gap-1">
                         {[1, 2, 3].map(i => (
                             <button key={i} className={`h-8 w-8 rounded-lg text-[11px] font-bold border transition-all ${i === 1 ? 'bg-[#3B82F6] border-[#3B82F6] text-white shadow-sm' : 'border-transparent text-[#64748B] hover:text-[#F8FAFC]'}`}>{i}</button>
                         ))}
                    </div>
                </div>
            </div>
        </main>
    )
}

function MetricCard({ icon, label, value, unit, color, onClick, subValue }: any) {
    const colorStyles: any = {
        indigo: "bg-[#3B82F6]/10 text-[#3B82F6] border-[#3B82F6]/20",
        rose: "bg-rose-500/10 text-rose-400 border-rose-500/20",
        amber: "bg-amber-500/10 text-amber-400 border-amber-500/20",
        emerald: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    };

    return (
        <div 
            onClick={onClick}
            className={`bg-[#161922] border border-[rgba(148,163,184,0.1)] rounded-3xl p-6 relative overflow-hidden group transition-all duration-300 hover:shadow-xl hover:-translate-y-1 hover:border-[#3B82F6]/30 ${onClick ? 'cursor-pointer' : ''}`}
        >
            <div className="flex justify-between items-start mb-6">
                <div className={`p-3 rounded-[18px] shadow-sm transition-transform group-hover:scale-110 duration-500 border ${colorStyles[color]}`}>
                    {icon}
                </div>
                <div className="text-[10px] font-black text-[#64748B] uppercase tracking-widest leading-none mt-1 group-hover:text-[#3B82F6] transition-colors">KPI Meter</div>
            </div>
            <div className="space-y-1">
                <div className="text-3xl font-bold text-[#F8FAFC] tracking-tight tabular-nums flex items-end gap-1.5">
                    {value}
                    <span className="text-xs font-bold text-[#64748B] uppercase tracking-widest mb-1.5">{unit}</span>
                </div>
                <h4 className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider">{label}</h4>
            </div>
            {subValue && (
                <div className="mt-4 pt-4 border-t border-[rgba(148,163,184,0.1)] flex items-center justify-between">
                    <span className="text-[10px] font-bold text-[#64748B] uppercase tracking-widest">Detail Forecast</span>
                    <span className={`text-[11px] font-black tabular-nums ${color === 'amber' ? 'text-amber-400' : color === 'rose' ? 'text-rose-400' : color === 'emerald' ? 'text-emerald-400' : 'text-[#3B82F6]'}`}>{subValue}</span>
                </div>
            )}
            {/* Visual element decor */}
            <div className={`absolute -right-4 -bottom-4 w-24 h-24 rounded-full opacity-[0.05] group-hover:scale-150 transition-transform duration-700 ${colorStyles[color]}`}></div>
        </div>
    );
}
