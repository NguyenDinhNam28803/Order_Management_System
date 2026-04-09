"use client";

import React, { useState, useMemo } from "react";
import { TrendingUp, PieChart, Wallet, ArrowRight, Calendar, Building, Filter, Download } from "lucide-react";
import { useProcurement } from "../../context/ProcurementContext";
import { formatVND } from "../../utils/formatUtils";
import { SimpleBarChart, DonutChart, StatsCard } from "../../components/charts";

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
        <main className="animate-in fade-in duration-500 p-6 min-h-screen bg-[#0F1117] text-[#F8FAFC]">
            <header className="mb-10 lg:flex items-end justify-between">
                <div>
                    <h1 className="text-2xl font-black tracking-tight text-[#F8FAFC] mb-2 uppercase">THEO DÕI CHI TIÊU</h1>
                    <p className="text-[#64748B] font-medium">Theo dõi ngân sách theo thời gian thực của phòng ban</p>
                </div>
                
                <div className="flex gap-4 mt-6 lg:mt-0">
                    <div className="flex bg-[#161922] rounded-2xl border border-[rgba(148,163,184,0.1)] p-1 shadow-sm">
                        <select 
                            value={selectedCC}
                            onChange={(e) => setSelectedCC(e.target.value)}
                            className="bg-transparent border-none text-[10px] font-black uppercase tracking-widest text-[#F8FAFC] px-4 py-2 outline-none appearance-none cursor-pointer"
                        >
                            <option value="ALL">Tất cả Trung tâm chi phí</option>
                            {myCostCenters.map(cc => (
                                <option key={cc.id} value={cc.id}>{cc.name} ({cc.code})</option>
                            ))}
                        </select>
                    </div>
                </div>
            </header>

            {/* Stats Cards with Charts */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <StatsCard 
                    title="Ngân Sách Được Duyệt"
                    value={formatVND(stats.allocated)}
                    subValue="100% của kỳ"
                    icon={TrendingUp}
                    color="blue"
                    trend={{ value: 0, isPositive: true }}
                />
                <StatsCard 
                    title="Đã Cam Kết"
                    value={formatVND(stats.committed)}
                    subValue={`${(stats.allocated > 0 ? (stats.committed / stats.allocated) * 100 : 0).toFixed(1)}% ngân sách`}
                    icon={PieChart}
                    color="amber"
                >
                    <div className="mt-2">
                        <div className="flex justify-between text-[10px] text-[#94A3B8] mb-1">
                            <span>Tiến độ</span>
                            <span>{(stats.allocated > 0 ? (stats.committed / stats.allocated) * 100 : 0).toFixed(0)}%</span>
                        </div>
                        <div className="h-1.5 bg-[#0F1117] rounded-full overflow-hidden">
                            <div className="h-full bg-[#F59E0B] rounded-full" style={{ width: `${Math.min((stats.allocated > 0 ? (stats.committed / stats.allocated) * 100 : 0), 100)}%` }} />
                        </div>
                    </div>
                </StatsCard>
                <StatsCard 
                    title="Đã Chi Tiêu"
                    value={formatVND(stats.spent)}
                    subValue="Thanh toán thực tế"
                    icon={Wallet}
                    color="green"
                    trend={{ value: 5, isPositive: false }}
                />
                <StatsCard 
                    title="Còn Lại"
                    value={formatVND(remaining)}
                    subValue={`${Math.max(0, Math.round(remainingPct))}% ngân sách`}
                    icon={ArrowRight}
                    color={remainingPct < 10 ? 'red' : 'purple'}
                >
                    <div className="mt-2">
                        <div className="flex justify-between text-[10px] text-[#94A3B8] mb-1">
                            <span>Còn lại</span>
                            <span className={remainingPct < 10 ? 'text-rose-400' : 'text-emerald-400'}>{Math.max(0, Math.round(remainingPct))}%</span>
                        </div>
                        <div className="h-1.5 bg-[#0F1117] rounded-full overflow-hidden">
                            <div className={`h-full rounded-full ${remainingPct < 10 ? 'bg-rose-400' : 'bg-emerald-400'}`} style={{ width: `${Math.max(0, Math.min(remainingPct, 100))}%` }} />
                        </div>
                    </div>
                </StatsCard>
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                <DonutChart 
                    title="Phân Bổ Ngân Sách"
                    data={[
                        { label: 'Đã chi', value: stats.spent, color: '#10B981' },
                        { label: 'Cam kết', value: stats.committed - stats.spent, color: '#3B82F6' },
                        { label: 'Còn lại', value: remaining, color: remaining < 0 ? '#EF4444' : '#8B5CF6' },
                    ]}
                    centerLabel="Tổng"
                    centerValue={formatVND(stats.allocated)}
                />
                <SimpleBarChart 
                    title="Chi Tiêu Theo Cost Center"
                    data={filteredAllocations.slice(0, 5).map(a => ({
                        label: costCenters.find(cc => cc.id === a.costCenterId)?.code || 'Unknown',
                        value: (Number(a.spentAmount) + Number(a.committedAmount)),
                        color: ((Number(a.spentAmount) + Number(a.committedAmount)) / (Number(a.allocatedAmount) || 1)) > 0.8 ? '#EF4444' : '#3B82F6'
                    }))}
                />
            </div>

            {/* Allocation Table Detail */}
            <div className="bg-[#161922] rounded-3xl border border-[rgba(148,163,184,0.1)] shadow-xl shadow-[#3B82F6]/5 overflow-hidden">
                <div className="px-8 py-6 border-b border-[rgba(148,163,184,0.1)] flex items-center justify-between bg-[#0F1117]">
                    <h4 className="text-xs font-black uppercase tracking-widest text-[#F8FAFC] leading-none">Chi tiết phân bổ ngân sách</h4>
                    <button className="flex items-center gap-2 text-[#64748B] hover:text-[#3B82F6] transition-colors">
                        <Download size={16} />
                        <span className="text-[10px] font-black uppercase tracking-widest">Xuất báo cáo</span>
                    </button>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-[#0F1117]">
                                <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-[#64748B]">Cost Center</th>
                                <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-[#64748B]">Phân bổ</th>
                                <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-[#64748B] text-right">Cam kết</th>
                                <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-[#64748B] text-right">Thực chi</th>
                                <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-[#64748B] text-center">Tiến độ</th>
                                <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-[#64748B] text-right">Còn lại</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[rgba(148,163,184,0.1)]">
                            {filteredAllocations.map((alloc) => {
                                const cc = costCenters.find(c => c.id === alloc.costCenterId);
                                const used = Number(alloc.spentAmount) + Number(alloc.committedAmount);
                                const pct = Number(alloc.allocatedAmount) > 0 ? (used / Number(alloc.allocatedAmount)) * 100 : 0;
                                const rem = Number(alloc.allocatedAmount) - used;

                                return (
                                    <tr key={alloc.id} className="hover:bg-[#0F1117]/30 transition-colors">
                                        <td className="px-8 py-5">
                                            <p className="text-sm font-black text-[#F8FAFC] leading-none mb-1">{cc?.name || "N/A"}</p>
                                            <p className="text-[10px] font-bold text-[#64748B] uppercase tracking-widest">{cc?.code || "N/A"}</p>
                                        </td>
                                        <td className="px-8 py-5 font-bold text-[#F8FAFC]">{formatVND(Number(alloc.allocatedAmount))}</td>
                                        <td className="px-8 py-5 text-right text-[#3B82F6] font-bold">{formatVND(Number(alloc.committedAmount))}</td>
                                        <td className="px-8 py-5 text-right text-[#F8FAFC] font-bold">{formatVND(Number(alloc.spentAmount))}</td>
                                        <td className="px-8 py-5 text-center min-w-[150px]">
                                            <div className="flex items-center gap-2">
                                                <div className="h-1.5 flex-1 bg-[#0F1117] rounded-full overflow-hidden">
                                                    <div className={`h-full rounded-full ${pct > 90 ? 'bg-rose-400' : 'bg-[#3B82F6]'}`} style={{width: `${Math.min(pct, 100)}%`}} />
                                                </div>
                                                <span className="text-[10px] font-black text-[#64748B]">{pct.toFixed(0)}%</span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-5 text-right">
                                            <span className={`font-black ${rem < 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
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
