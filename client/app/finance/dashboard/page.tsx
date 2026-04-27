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
        <main className="animate-in fade-in duration-500 p-6 min-h-screen bg-[#FFFFFF] text-[#000000]">

            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
                <div>
                    <h1 className="text-4xl font-black text-[#000000] tracking-tighter uppercase mb-2">AP COMMAND CENTER</h1>
                    <p className="text-sm font-bold text-[#000000]">Hệ thống quản trị khoản phải trả & Đối soát 3 bên tự động tích hợp AI.</p>
                </div>
                <div className="flex gap-3">
                    <button className="flex items-center gap-2 px-4 py-2 bg-[#FAF8F5] border border-[rgba(148,163,184,0.1)] rounded-xl text-xs font-bold text-[#000000] hover:bg-[#1A1D23] transition-all shadow-sm">
                        <Download size={14} /> Export Report
                    </button>
                    <button className="flex items-center gap-2 px-4 py-2 bg-[#B4533A] text-[#000000] rounded-xl text-xs font-bold hover:bg-[#A85032] transition-all shadow-lg shadow-[#B4533A]/20">
                        <Activity size={14} /> System Health
                    </button>
                </div>
            </div>

            {/* KPI Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
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
                        <div className="flex justify-between text-[10px] text-[#000000] mb-1">
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
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
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
                        { label: 'Đã matching', value: invoices.filter(i => i.status === 'MATCHED').reduce((sum, i) => sum + (Number(i.amount) || 0), 0), color: '#B4533A' },
                        { label: 'Đã thanh toán', value: totalSpentThisMonth, color: '#10B981' },
                    ]}
                />
            </div>

            {/* Analytics Section: Heatmap */}
            <div className="mb-6">
                <BudgetHeatmap />
            </div>

            {/* Invoices Interface */}
            <div className="bg-[#FAF8F5] rounded-[40px] overflow-hidden border border-[rgba(148,163,184,0.1)] shadow-xl shadow-[#B4533A]/5">
                <div className="p-6 border-b border-[rgba(148,163,184,0.1)] flex flex-col md:flex-row md:items-center justify-between gap-6 bg-[#FAF8F5]">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-[#FFFFFF] text-[#B4533A] rounded-xl border border-[rgba(148,163,184,0.1)]">
                            <BarChart3 size={18} />
                        </div>
                        <h3 className="text-base font-bold text-[#000000] tracking-tight">Invoice Processing Queue</h3>
                    </div>
                    
                    <div className="flex items-center gap-4">
                        <div className="bg-[#FFFFFF] p-1 rounded-xl flex gap-1 border border-[rgba(148,163,184,0.1)]">
                            <button 
                                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${activeTab === 'ALL' ? 'bg-[#B4533A] text-[#000000] shadow-lg shadow-[#B4533A]/20' : 'text-[#000000] hover:text-[#000000]'}`}
                                onClick={() => setActiveTab("ALL")}
                            >
                                Tất cả
                            </button>
                            <button 
                                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${activeTab === 'EXCEPTION' ? 'bg-rose-500 text-[#000000] shadow-lg shadow-rose-500/20' : 'text-[#000000] hover:text-[#000000]'}`}
                                onClick={() => setActiveTab("EXCEPTION")}
                            >
                                Exception <span className="bg-rose-500/20 text-black px-1.5 py-0.5 rounded-md text-[9px] border border-rose-500/20">{activeInvoices.filter((i) => i.status === 'EXCEPTION').length}</span>
                            </button>
                        </div>
                        <div className="h-8 w-px bg-[rgba(148,163,184,0.1)]"></div>
                        <div className="relative">
                            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#000000]" />
                            <input 
                                type="text" 
                                className="w-64 bg-[#FFFFFF] border border-[rgba(148,163,184,0.1)] rounded-xl pl-9 pr-4 py-2 text-xs font-medium text-[#000000] placeholder:text-[#000000] focus:ring-4 focus:ring-[#B4533A]/10 transition-all outline-none" 
                                placeholder="Search by INV / Supplier..." 
                            />
                        </div>
                        <button className="p-2.5 bg-[#FFFFFF] border border-[rgba(148,163,184,0.1)] rounded-xl text-[#000000] hover:bg-[#FAF8F5] transition-all shadow-sm">
                            <Filter size={16} />
                        </button>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="erp-table text-xs">
                        <thead className="bg-[#FFFFFF] text-[10px] font-black uppercase tracking-widest text-[#000000]">
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
                                <tr key={inv.id} className="cursor-pointer group hover:bg-[#FFFFFF]/50 transition-colors" onClick={() => router.push(`/finance/matching?id=${inv.id}`)}>
                                    <td className="px-6 py-5">
                                        <div className="flex items-center gap-3">
                                            <div className="h-8 w-8 rounded-lg bg-[#B4533A]/10 text-[#B4533A] flex items-center justify-center font-bold text-[10px] group-hover:bg-[#B4533A] group-hover:text-[#000000] transition-colors duration-300 border border-[#B4533A]/20">
                                                ID
                                            </div>
                                            <span className="font-bold text-[#000000] tracking-tight">INV-***</span>
                                        </div>
                                    </td>
                                    <td>
                                        <div className="text-sm font-bold text-[#000000]">{inv.vendor}</div>
                                        <div className="text-[10px] text-[#000000] font-medium uppercase tracking-tighter">Verified Partner</div>
                                    </td>
                                    <td className=" text-[#B4533A] text-[11px] font-bold">PO-***</td>
                                    <td className="text-right font-bold text-[#000000] text-sm">{formatVND(inv.amount)} ₫</td>
                                    <td className="text-[#000000] text-[11px] font-semibold">{inv.createdAt}</td>
                                    <td className="text-center">
                                        {inv.status === "PENDING" ? (
                                            <div className="flex justify-center">
                                                <span className="px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest bg-emerald-500/10 text-black border border-emerald-500/20 flex items-center gap-1.5">
                                                    <CheckCircle2 size={10}/> Auto Matched
                                                </span>
                                            </div>
                                        ) : (
                                            <div className="flex justify-center">
                                                <span className="px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest bg-rose-500/10 text-black border border-rose-500/20 flex items-center gap-1.5 animate-pulse">
                                                    <ShieldAlert size={10}/> Exception
                                                </span>
                                            </div>
                                        )}
                                    </td>
                                    <td className="text-right pr-6">
                                        <div className="flex items-center justify-end gap-2">
                                            <button className="h-8 w-8 rounded-lg border border-[rgba(148,163,184,0.1)] text-[#000000] hover:text-[#B4533A] hover:border-[#B4533A]/30 flex items-center justify-center transition-all bg-[#FFFFFF] shadow-sm">
                                                <MoreHorizontal size={14} />
                                            </button>
                                            <button className="flex items-center gap-1 px-3 py-1.5 bg-[#B4533A]/10 text-[#B4533A] rounded-lg text-[11px] font-bold hover:bg-[#B4533A] hover:text-[#000000] transition-all shadow-sm border border-[#B4533A]/20">
                                                Audit <ArrowRight size={12}/>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div className="p-4 bg-[#FFFFFF] border-t border-[rgba(148,163,184,0.1)] flex items-center justify-between">
                    <p className="text-[10px] font-bold text-[#000000] uppercase tracking-widest">Showing {displayedInvoices.length} of {activeInvoices.length} invoices in queue</p>
                    <div className="flex gap-1">
                         {[1, 2, 3].map(i => (
                             <button key={i} className={`h-8 w-8 rounded-lg text-[11px] font-bold border transition-all ${i === 1 ? 'bg-[#B4533A] border-[#B4533A] text-[#000000] shadow-sm' : 'border-transparent text-[#000000] hover:text-[#000000]'}`}>{i}</button>
                         ))}
                    </div>
                </div>
            </div>
        </main>
    )
}

function MetricCard({ icon, label, value, unit, color, onClick, subValue }: any) {
    const colorStyles: any = {
        indigo: "bg-[#B4533A]/10 text-[#B4533A] border-[#B4533A]/20",
        rose: "bg-rose-500/10 text-black border-rose-500/20",
        amber: "bg-amber-500/10 text-black border-amber-500/20",
        emerald: "bg-emerald-500/10 text-black border-emerald-500/20",
    };

    return (
        <div 
            onClick={onClick}
            className={`bg-[#FAF8F5] border border-[rgba(148,163,184,0.1)] rounded-3xl p-6 relative overflow-hidden group transition-all duration-300 hover:shadow-xl hover:-translate-y-1 hover:border-[#B4533A]/30 ${onClick ? 'cursor-pointer' : ''}`}
        >
            <div className="flex justify-between items-start mb-6">
                <div className={`p-3 rounded-[18px] shadow-sm transition-transform group-hover:scale-110 duration-500 border ${colorStyles[color]}`}>
                    {icon}
                </div>
                <div className="text-[10px] font-black text-[#000000] uppercase tracking-widest leading-none mt-1 group-hover:text-[#B4533A] transition-colors">KPI Meter</div>
            </div>
            <div className="space-y-1">
                <div className="text-3xl font-bold text-[#000000] tracking-tight tabular-nums flex items-end gap-1.5">
                    {value}
                    <span className="text-xs font-bold text-[#000000] uppercase tracking-widest mb-1.5">{unit}</span>
                </div>
                <h4 className="text-[11px] font-bold text-[#000000] uppercase tracking-wider">{label}</h4>
            </div>
            {subValue && (
                <div className="mt-4 pt-4 border-t border-[rgba(148,163,184,0.1)] flex items-center justify-between">
                    <span className="text-[10px] font-bold text-[#000000] uppercase tracking-widest">Detail Forecast</span>
                    <span className={`text-[11px] font-black tabular-nums ${color === 'amber' ? 'text-black' : color === 'rose' ? 'text-black' : color === 'emerald' ? 'text-black' : 'text-[#B4533A]'}`}>{subValue}</span>
                </div>
            )}
            {/* Visual element decor */}
            <div className={`absolute -right-4 -bottom-4 w-24 h-24 rounded-full opacity-[0.05] group-hover:scale-150 transition-transform duration-700 ${colorStyles[color]}`}></div>
        </div>
    );
}

