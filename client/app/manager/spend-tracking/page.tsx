"use client";

import React, { useState, useMemo } from "react";
import { TrendingUp, PieChart, Wallet, ArrowRight, Calendar, Building, Filter, Download, ChevronDown } from "lucide-react";
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

    // Pagination for allocation table
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 5;
    const totalPages = Math.ceil(filteredAllocations.length / itemsPerPage);
    const paginatedAllocations = filteredAllocations.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    return (
        <main className="animate-in fade-in duration-500 p-6 min-h-screen bg-[#FFFFFF] text-[#000000]">
            <header className="mb-10 lg:flex items-end justify-between">
                <div>
                    <h1 className="text-2xl font-black tracking-tight text-[#000000] mb-2 uppercase">THEO DÕI CHI TIÊU</h1>
                    <p className="text-[#000000] font-medium">Theo dõi ngân sách theo thời gian thực của phòng ban</p>
                </div>
                
                <div className="flex gap-4 mt-6 lg:mt-0">
                    <div className="relative group">
                        <select 
                            value={selectedCC}
                            onChange={(e) => {
                                setSelectedCC(e.target.value);
                                setCurrentPage(1); // Reset pagination when filter changes
                            }}
                            className="bg-[#FAF8F5] border border-[rgba(148,163,184,0.1)] hover:border-[#B4533A]/50 rounded-xl text-[10px] font-black uppercase tracking-widest text-[#000000] px-4 py-3 pr-10 outline-none appearance-none cursor-pointer transition-all min-w-[200px] focus:border-[#B4533A] focus:ring-1 focus:ring-[#B4533A]/20"
                        >
                            <option value="ALL" className="bg-[#FAF8F5] text-[#000000]">Tất cả Trung tâm chi phí</option>
                            {myCostCenters.map(cc => (
                                <option key={cc.id} value={cc.id} className="bg-[#FAF8F5] text-[#000000]">
                                    {cc.name} ({cc.code})
                                </option>
                            ))}
                        </select>
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-[#000000] group-hover:text-[#B4533A] transition-colors">
                            <ChevronDown size={14} />
                        </div>
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
                        <div className="flex justify-between text-[10px] text-[#000000] mb-1">
                            <span>Tiến độ</span>
                            <span>{(stats.allocated > 0 ? (stats.committed / stats.allocated) * 100 : 0).toFixed(0)}%</span>
                        </div>
                        <div className="h-1.5 bg-[#FFFFFF] rounded-full overflow-hidden">
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
                        <div className="flex justify-between text-[10px] text-[#000000] mb-1">
                            <span>Còn lại</span>
                            <span className={remainingPct < 10 ? 'text-black' : 'text-black'}>{Math.max(0, Math.round(remainingPct))}%</span>
                        </div>
                        <div className="h-1.5 bg-[#FFFFFF] rounded-full overflow-hidden">
                            <div className={`h-full rounded-full ${remainingPct < 10 ? 'bg-rose-400' : 'bg-emerald-400'}`} style={{ width: `${Math.max(0, Math.min(remainingPct, 100))}%` }} />
                        </div>
                    </div>
                </StatsCard>
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                {/* Donut Chart Card */}
                <div className="bg-[#FAF8F5] rounded-3xl border border-[rgba(148,163,184,0.1)] shadow-xl shadow-[#B4533A]/5 overflow-hidden">
                    <div className="px-6 py-5 border-b border-[rgba(148,163,184,0.1)] bg-[#FFFFFF]">
                        <h4 className="text-xs font-black uppercase tracking-widest text-[#000000] leading-none">Phân Bổ Ngân Sách</h4>
                    </div>
                    <div className="p-6">
                        <DonutChart 
                            title=""
                            data={[
                                { label: 'Đã chi', value: stats.spent, color: '#10B981' },
                                { label: 'Cam kết', value: stats.committed - stats.spent, color: '#B4533A' },
                                { label: 'Còn lại', value: remaining, color: remaining < 0 ? '#EF4444' : '#8B5CF6' },
                            ]}
                            centerLabel="Tổng"
                            centerValue={formatVND(stats.allocated)}
                        />
                    </div>
                </div>

                {/* Bar Chart Card with Pagination */}
                <div className="bg-[#FAF8F5] rounded-3xl border border-[rgba(148,163,184,0.1)] shadow-xl shadow-[#B4533A]/5 overflow-hidden">
                    <div className="px-6 py-5 border-b border-[rgba(148,163,184,0.1)] bg-[#FFFFFF] flex items-center justify-between">
                        <h4 className="text-xs font-black uppercase tracking-widest text-[#000000] leading-none">Chi Tiêu Theo Cost Center</h4>
                        {filteredAllocations.length > 5 && (
                            <span className="text-[10px] font-bold text-[#000000]">Top 5 / {filteredAllocations.length}</span>
                        )}
                    </div>
                    <div className="p-6">
                        <SimpleBarChart 
                            title=""
                            data={filteredAllocations.slice(0, 5).map(a => ({
                                label: costCenters.find(cc => cc.id === a.costCenterId)?.code || 'Unknown',
                                value: (Number(a.spentAmount) + Number(a.committedAmount)),
                                color: ((Number(a.spentAmount) + Number(a.committedAmount)) / (Number(a.allocatedAmount) || 1)) > 0.8 ? '#EF4444' : '#B4533A'
                            }))}
                        />
                    </div>
                    {filteredAllocations.length > 5 && (
                        <div className="px-6 py-3 bg-[#FFFFFF] border-t border-[rgba(148,163,184,0.1)]">
                            <p className="text-[10px] text-[#000000] text-center">
                                Hiển thị top 5 cost center chi tiêu nhiều nhất • 
                                <span className="text-[#B4533A] font-bold">{filteredAllocations.length - 5} cost center khác</span>
                            </p>
                        </div>
                    )}
                </div>
            </div>

            {/* Allocation Table Detail */}
            <div className="bg-[#FAF8F5] rounded-3xl border border-[rgba(148,163,184,0.1)] shadow-xl shadow-[#B4533A]/5 overflow-hidden">
                <div className="px-8 py-6 border-b border-[rgba(148,163,184,0.1)] flex items-center justify-between bg-[#FFFFFF]">
                    <h4 className="text-xs font-black uppercase tracking-widest text-[#000000] leading-none">Chi tiết phân bổ ngân sách</h4>
                    <button className="flex items-center gap-2 text-[#000000] hover:text-[#B4533A] transition-colors">
                        <Download size={16} />
                        <span className="text-[10px] font-black uppercase tracking-widest">Xuất báo cáo</span>
                    </button>
                </div>
                <div className="overflow-x-auto">
                    <table className="erp-table text-xs whitespace-nowrap">
                        <thead>
                            <tr className="bg-[#FFFFFF]">
                                <th className="py-4 px-6 text-[10px] font-black uppercase tracking-widest text-[#000000]">Cost Center</th>
                                <th className="py-4 px-6 text-[10px] font-black uppercase tracking-widest text-[#000000]">Phân bổ</th>
                                <th className="py-4 px-6 text-[10px] font-black uppercase tracking-widest text-[#000000] text-right">Cam kết</th>
                                <th className="py-4 px-6 text-[10px] font-black uppercase tracking-widest text-[#000000] text-right">Thực chi</th>
                                <th className="py-4 px-6 text-[10px] font-black uppercase tracking-widest text-[#000000] text-center">Tiến độ</th>
                                <th className="py-4 px-6 text-[10px] font-black uppercase tracking-widest text-[#000000] text-right">Còn lại</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[rgba(148,163,184,0.1)]">
                            {paginatedAllocations.length > 0 ? paginatedAllocations.map((alloc) => {
                                const cc = costCenters.find(c => c.id === alloc.costCenterId);
                                const used = Number(alloc.spentAmount) + Number(alloc.committedAmount);
                                const pct = Number(alloc.allocatedAmount) > 0 ? (used / Number(alloc.allocatedAmount)) * 100 : 0;
                                const rem = Number(alloc.allocatedAmount) - used;

                                return (
                                    <tr key={alloc.id} className="hover:bg-[#FFFFFF]/50 transition-colors group">
                                        <td className="py-5 px-6">
                                            <div className="flex items-center gap-3">
                                                <div className="h-8 w-8 rounded-lg bg-[#1A1D23] flex items-center justify-center text-[#000000] group-hover:scale-110 transition-transform">
                                                    <Building size={14} />
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-[11px] font-black text-[#000000] leading-tight">{cc?.name || "N/A"}</span>
                                                    <span className="text-[9px] font-bold text-[#000000] uppercase tracking-tight">{cc?.code || "N/A"}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="py-5 px-6 font-bold text-[#000000]">{formatVND(Number(alloc.allocatedAmount))}</td>
                                        <td className="py-5 px-6 text-right text-[#B4533A] font-bold">{formatVND(Number(alloc.committedAmount))}</td>
                                        <td className="py-5 px-6 text-right font-bold text-[#000000]">{formatVND(Number(alloc.spentAmount))}</td>
                                        <td className="py-5 px-6 text-center min-w-[120px]">
                                            <div className="flex items-center gap-2">
                                                <div className="h-1.5 flex-1 bg-[#FFFFFF] rounded-full overflow-hidden">
                                                    <div className={`h-full rounded-full ${pct > 90 ? 'bg-rose-400' : 'bg-[#B4533A]'}`} style={{width: `${Math.min(pct, 100)}%`}} />
                                                </div>
                                                <span className="text-[10px] font-black text-[#000000]">{pct.toFixed(0)}%</span>
                                            </div>
                                        </td>
                                        <td className="py-5 px-6 text-right">
                                            <span className={`font-black ${rem < 0 ? 'text-black' : 'text-black'}`}>
                                                {formatVND(rem)}
                                            </span>
                                        </td>
                                    </tr>
                                );
                            }) : (
                                <tr><td colSpan={6} className="py-12 text-center text-[#000000] font-black uppercase text-[10px]">Không có dữ liệu phân bổ</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
                {/* Pagination Navigation */}
                {totalPages > 1 && (
                    <div className="flex items-center justify-between px-6 py-4 bg-[#FFFFFF] border-t border-[rgba(148,163,184,0.1)]">
                        <div className="text-[10px] text-[#000000]">
                            Hiển thị <span className="font-bold text-[#000000]">{paginatedAllocations.length}</span> / <span className="font-bold text-[#000000]">{filteredAllocations.length}</span> phân bổ
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                disabled={currentPage === 1}
                                className="px-3 py-1.5 bg-[#FAF8F5] border border-[rgba(148,163,184,0.1)] rounded-lg text-[10px] font-bold text-[#000000] hover:bg-[#1A1D23] disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center gap-1"
                            >
                                <ChevronDown size={12} className="rotate-90" /> Trước
                            </button>
                            <div className="flex items-center gap-1">
                                {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                                    <button
                                        key={page}
                                        onClick={() => setCurrentPage(page)}
                                        className={`w-8 h-8 rounded-lg text-[10px] font-bold transition-all ${
                                            currentPage === page
                                                ? 'bg-[#B4533A] text-[#000000]'
                                                : 'bg-[#FAF8F5] text-[#000000] hover:text-[#000000] hover:bg-[#1A1D23]'
                                        }`}
                                    >
                                        {page}
                                    </button>
                                ))}
                            </div>
                            <button
                                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                disabled={currentPage === totalPages}
                                className="px-3 py-1.5 bg-[#FAF8F5] border border-[rgba(148,163,184,0.1)] rounded-lg text-[10px] font-bold text-[#000000] hover:bg-[#1A1D23] disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center gap-1"
                            >
                                Sau <ChevronDown size={12} className="-rotate-90" />
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </main>
    );
}

