"use client";

import React, { useState, useMemo } from "react";
import { TrendingUp, PieChart, Wallet, ArrowRight, Calendar, Building, Filter, Download } from "lucide-react";
import { useProcurement } from "../../context/ProcurementContext";
import { formatVND } from "../../utils/formatUtils";

export default function SpendTrackingPage() {
    const { budgetAllocations, costCenters, currentUser } = useProcurement();
    const [selectedCC, setSelectedCC] = useState<string>("ALL");

    // Filter allocations for current user's department or all if admin
    const filteredAllocations = useMemo(() => {
        let list = budgetAllocations;
        if (currentUser && !["FINANCE", "DIRECTOR", "CEO", "PLATFORM_ADMIN"].includes(currentUser.role)) {
            list = list.filter(a => a.deptId === currentUser.deptId);
        }
        if (selectedCC !== "ALL") {
            list = list.filter(a => a.costCenterId === selectedCC);
        }
        return list;
    }, [budgetAllocations, currentUser, selectedCC]);

    const stats = useMemo(() => {
        return filteredAllocations.reduce((acc, curr) => ({
            allocated: acc.allocated + Number(curr.allocatedAmount),
            committed: acc.committed + Number(curr.committedAmount),
            spent: acc.spent + Number(curr.spentAmount),
        }), { allocated: 0, committed: 0, spent: 0 });
    }, [filteredAllocations]);

    const totalUsed = stats.spent + stats.committed;
    const remaining = stats.allocated - totalUsed;
    const remainingPct = stats.allocated > 0 ? (remaining / stats.allocated) * 100 : 0;
    const usedPct = stats.allocated > 0 ? (totalUsed / stats.allocated) * 100 : 0;

    const myCostCenters = useMemo(() => {
        if (currentUser && !["FINANCE", "DIRECTOR", "CEO", "PLATFORM_ADMIN"].includes(currentUser.role)) {
            return costCenters.filter(cc => cc.deptId === currentUser.deptId);
        }
        return costCenters;
    }, [costCenters, currentUser]);

    return (
        <main className="animate-in fade-in duration-500 pb-20 p-8">
            <header className="mb-10 lg:flex items-end justify-between">
                <div>
                    <h1 className="text-2xl font-black tracking-tight text-erp-navy mb-2 uppercase tracking-tighter">THEO DÕI CHI TIÊU</h1>
                    <p className="text-slate-500 font-medium">Theo dõi ngân sách theo thời gian thực của phòng ban</p>
                </div>
                
                <div className="flex gap-4 mt-6 lg:mt-0">
                    <div className="flex bg-white rounded-2xl border border-slate-200 p-1 shadow-sm">
                        <select 
                            value={selectedCC}
                            onChange={(e) => setSelectedCC(e.target.value)}
                            className="bg-transparent border-none text-[10px] font-black uppercase tracking-widest text-erp-navy px-4 py-2 outline-none appearance-none cursor-pointer"
                        >
                            <option value="ALL">Tất cả Trung tâm chi phí</option>
                            {myCostCenters.map(cc => (
                                <option key={cc.id} value={cc.id}>{cc.name} ({cc.code})</option>
                            ))}
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
                    <div className="mt-4 flex items-center gap-2 text-green-500 text-[10px] font-black uppercase tracking-widest leading-none">
                        <ArrowRight size={14} /> 100% CỦA KỲ
                    </div>
                </div>

                <div className="bg-white rounded-[2rem] p-8 border border-slate-100 shadow-sm relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 transition-transform"><PieChart size={64} /></div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4">Đã cam kết (Committed)</p>
                    <h3 className="text-2xl font-black text-erp-blue">{formatVND(stats.committed)}</h3>
                    <div className="mt-2 text-erp-blue text-[10px] font-black italic">
                        Chiếm {(stats.allocated > 0 ? (stats.committed / stats.allocated) * 100 : 0).toFixed(1)}% ngân sách
                    </div>
                </div>

                <div className="bg-white rounded-[2rem] p-8 border border-slate-100 shadow-sm relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 transition-transform"><Wallet size={64} /></div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4">Đã chi tiêu (Spent)</p>
                    <h3 className="text-2xl font-black text-slate-900">{formatVND(stats.spent)}</h3>
                    <div className="mt-2 text-slate-400 text-[10px] font-black italic">
                        Thanh toán thực tế
                    </div>
                </div>

                <div className={`rounded-[2rem] p-8 border shadow-sm relative overflow-hidden group ${remainingPct < 10 ? 'bg-red-50 border-red-100' : 'bg-white border-slate-100'}`}>
                    <p className={`text-[10px] font-black uppercase tracking-widest mb-4 ${remainingPct < 10 ? 'text-red-500' : 'text-slate-400'}`}>Còn lại</p>
                    <h3 className={`text-2xl font-black ${remainingPct < 10 ? 'text-red-600' : 'text-green-600'}`}>{formatVND(remaining)}</h3>
                    <div className="mt-4 flex items-center gap-2 text-[10px] font-black">
                        <div className="h-1.5 flex-1 bg-slate-100 rounded-full overflow-hidden">
                            <div className={`h-full rounded-full ${remainingPct < 10 ? 'bg-red-500' : 'bg-green-500'}`} style={{width: `${Math.max(0, remainingPct)}%`}} />
                        </div>
                        <span className={remainingPct < 10 ? 'text-red-500' : 'text-green-500'}>{Math.max(0, Math.round(remainingPct))}%</span>
                    </div>
                </div>
            </div>

            {/* Allocation Table Detail */}
            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
                <div className="px-8 py-6 border-b border-slate-50 flex items-center justify-between">
                    <h4 className="text-xs font-black uppercase tracking-widest text-erp-navy leading-none">Chi tiết phân bổ ngân sách</h4>
                    <button className="flex items-center gap-2 text-slate-400 hover:text-erp-navy transition-colors">
                        <Download size={16} />
                        <span className="text-[10px] font-black uppercase tracking-widest">Xuất báo cáo</span>
                    </button>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50/50">
                                <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Cost Center</th>
                                <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Phân bổ</th>
                                <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Cam kết</th>
                                <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Thực chi</th>
                                <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 text-center">Tiến độ</th>
                                <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Còn lại</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {filteredAllocations.map((alloc) => {
                                const cc = costCenters.find(c => c.id === alloc.costCenterId);
                                const used = Number(alloc.spentAmount) + Number(alloc.committedAmount);
                                const pct = Number(alloc.allocatedAmount) > 0 ? (used / Number(alloc.allocatedAmount)) * 100 : 0;
                                const rem = Number(alloc.allocatedAmount) - used;

                                return (
                                    <tr key={alloc.id} className="hover:bg-slate-50/30 transition-colors">
                                        <td className="px-8 py-5">
                                            <p className="text-sm font-black text-erp-navy leading-none mb-1">{cc?.name || "N/A"}</p>
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{cc?.code || "N/A"}</p>
                                        </td>
                                        <td className="px-8 py-5 font-bold text-slate-700">{formatVND(Number(alloc.allocatedAmount))}</td>
                                        <td className="px-8 py-5 text-right text-erp-blue font-bold">{formatVND(Number(alloc.committedAmount))}</td>
                                        <td className="px-8 py-5 text-right text-slate-900 font-bold">{formatVND(Number(alloc.spentAmount))}</td>
                                        <td className="px-8 py-5 text-center min-w-[150px]">
                                            <div className="flex items-center gap-2">
                                                <div className="h-1.5 flex-1 bg-slate-100 rounded-full overflow-hidden">
                                                    <div className={`h-full rounded-full ${pct > 90 ? 'bg-red-500' : 'bg-erp-navy'}`} style={{width: `${Math.min(pct, 100)}%`}} />
                                                </div>
                                                <span className="text-[10px] font-black text-slate-400">{pct.toFixed(0)}%</span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-5 text-right">
                                            <span className={`font-black ${rem < 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                                                {formatVND(rem)}
                                            </span>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        </main>
    );
}
