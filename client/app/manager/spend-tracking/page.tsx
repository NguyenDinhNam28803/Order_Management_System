"use client";

import React, { useState, useMemo } from "react";
import { TrendingUp, PieChart, Wallet, ArrowRight, Building, Download, ChevronDown } from "lucide-react";
import PageHeader from "../../components/shared/PageHeader";
import { useProcurement } from "../../context/ProcurementContext";
import { formatVND } from "../../utils/formatUtils";
import { SimpleBarChart, DonutChart, StatsCard } from "../../components/charts";
import { DataTable, DataTableColumn } from "../../components/shared/DataTable";

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

    type Allocation = (typeof filteredAllocations)[number];
    const allocColumns: DataTableColumn<Allocation>[] = [
        {
            label: "Cost Center", key: "costCenterId", sortable: true,
            render: (alloc) => {
                const cc = costCenters.find(c => c.id === alloc.costCenterId);
                return (
                    <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-lg bg-[#0F172A] flex items-center justify-center text-white shrink-0">
                            <Building size={14} />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-[11px] font-bold text-slate-900 leading-tight">{cc?.name || "N/A"}</span>
                            <span className="text-[0.6875rem] font-bold text-slate-500 uppercase num-display">{cc?.code || "N/A"}</span>
                        </div>
                    </div>
                );
            },
        },
        { label: "Phân bổ", align: "right", render: (alloc) => <span className="font-bold text-slate-900 num-display">{formatVND(Number(alloc.allocatedAmount))}</span> },
        { label: "Cam kết", align: "right", render: (alloc) => <span className="text-[#2563EB] font-bold num-display">{formatVND(Number(alloc.committedAmount))}</span> },
        { label: "Thực chi", align: "right", render: (alloc) => <span className="font-bold text-slate-900 num-display">{formatVND(Number(alloc.spentAmount))}</span> },
        {
            label: "Tiến độ", align: "center",
            render: (alloc) => {
                const used = Number(alloc.spentAmount) + Number(alloc.committedAmount);
                const pct = Number(alloc.allocatedAmount) > 0 ? (used / Number(alloc.allocatedAmount)) * 100 : 0;
                return (
                    <div className="flex items-center gap-2 min-w-[120px]">
                        <div className="h-1.5 flex-1 bg-white rounded-full overflow-hidden">
                            <div className={`h-full rounded-full ${pct > 90 ? 'bg-rose-400' : 'bg-[#2563EB]'}`} style={{ width: `${Math.min(pct, 100)}%` }} />
                        </div>
                        <span className="text-[10px] font-black text-slate-900 num-display">{pct.toFixed(0)}%</span>
                    </div>
                );
            },
        },
        {
            label: "Còn lại", align: "right",
            render: (alloc) => {
                const rem = Number(alloc.allocatedAmount) - (Number(alloc.spentAmount) + Number(alloc.committedAmount));
                return <span className={`font-black num-display ${rem < 0 ? 'text-rose-600' : 'text-slate-900'}`}>{formatVND(rem)}</span>;
            },
        },
    ];

    return (
        <main className="animate-in fade-in duration-500 p-6 min-h-screen bg-[#F8FAFC] text-slate-900">
            <header>
                <PageHeader
                    icon={TrendingUp}
                    iconColor="green"
                    title="Theo dõi chi tiêu"
                    subtitle="Theo dõi ngân sách theo thời gian thực của phòng ban."
                    actions={
                        <div className="relative group">
                            <select
                                value={selectedCC}
                                onChange={(e) => setSelectedCC(e.target.value)}
                                className="bg-[#F1F5F9] border border-slate-200 hover:border-[#2563EB]/50 rounded-lg text-[0.6875rem] font-bold uppercase tracking-widest text-[#64748B] px-4 py-3 pr-10 outline-none appearance-none cursor-pointer transition-all min-w-[200px] focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB]/20"
                            >
                                <option value="ALL" className="bg-[#F1F5F9] text-slate-900">Tất cả Trung tâm chi phí</option>
                                {myCostCenters.map(cc => (
                                    <option key={cc.id} value={cc.id} className="bg-[#F1F5F9] text-slate-900">
                                        {cc.name} ({cc.code})
                                    </option>
                                ))}
                            </select>
                            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-900 group-hover:text-[#2563EB] transition-colors">
                                <ChevronDown size={14} />
                            </div>
                        </div>
                    }
                />
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
                        <div className="flex justify-between text-[10px] text-slate-900 mb-1">
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
                        <div className="flex justify-between text-[10px] text-slate-900 mb-1">
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
                <div className="bg-[#F1F5F9] rounded-xl border border-slate-200 shadow-xl shadow-[#2563EB]/5 overflow-hidden">
                    <div className="px-6 py-5 border-b border-slate-200 bg-[#FFFFFF]">
                        <h4 className="text-xs font-bold uppercase tracking-widest text-[#64748B] leading-none">Phân Bổ Ngân Sách</h4>
                    </div>
                    <div className="p-6">
                        <DonutChart 
                            title=""
                            data={[
                                { label: 'Đã chi', value: stats.spent, color: '#10B981' },
                                { label: 'Cam kết', value: stats.committed - stats.spent, color: '#2563EB' },
                                { label: 'Còn lại', value: remaining, color: remaining < 0 ? '#EF4444' : '#8B5CF6' },
                            ]}
                            centerLabel="Tổng"
                            centerValue={formatVND(stats.allocated)}
                        />
                    </div>
                </div>

                {/* Bar Chart Card with Pagination */}
                <div className="bg-[#F1F5F9] rounded-xl border border-slate-200 shadow-xl shadow-[#2563EB]/5 overflow-hidden">
                    <div className="px-6 py-5 border-b border-slate-200 bg-[#FFFFFF] flex items-center justify-between">
                        <h4 className="text-xs font-bold uppercase tracking-widest text-[#64748B] leading-none">Chi Tiêu Theo Cost Center</h4>
                        {filteredAllocations.length > 5 && (
                            <span className="text-[10px] font-bold text-slate-900">Top 5 / {filteredAllocations.length}</span>
                        )}
                    </div>
                    <div className="p-6">
                        <SimpleBarChart 
                            title=""
                            data={filteredAllocations.slice(0, 5).map(a => ({
                                label: costCenters.find(cc => cc.id === a.costCenterId)?.code || 'Unknown',
                                value: (Number(a.spentAmount) + Number(a.committedAmount)),
                                color: ((Number(a.spentAmount) + Number(a.committedAmount)) / (Number(a.allocatedAmount) || 1)) > 0.8 ? '#EF4444' : '#2563EB'
                            }))}
                        />
                    </div>
                    {filteredAllocations.length > 5 && (
                        <div className="px-6 py-3 bg-[#FFFFFF] border-t border-slate-200">
                            <p className="text-[10px] text-slate-900 text-center">
                                Hiển thị top 5 cost center chi tiêu nhiều nhất • 
                                <span className="text-[#2563EB] font-bold">{filteredAllocations.length - 5} cost center khác</span>
                            </p>
                        </div>
                    )}
                </div>
            </div>

            {/* Allocation Table Detail */}
            <div className="bg-[#F1F5F9] rounded-xl border border-slate-200 shadow-xl shadow-[#2563EB]/5 overflow-hidden">
                <div className="px-8 py-6 border-b border-slate-200 flex items-center justify-between bg-[#FFFFFF]">
                    <h4 className="text-xs font-bold uppercase tracking-widest text-[#64748B] leading-none">Chi tiết phân bổ ngân sách</h4>
                    <button className="flex items-center gap-2 text-slate-900 hover:text-[#2563EB] transition-colors">
                        <Download size={16} />
                        <span className="text-[10px] font-black uppercase tracking-widest">Xuất báo cáo</span>
                    </button>
                </div>
                <div className="p-4">
                    <DataTable
                        columns={allocColumns}
                        data={filteredAllocations}
                        pageSize={8}
                        getRowKey={(alloc) => alloc.id}
                        emptyMessage="Không có dữ liệu phân bổ"
                        emptyDescription="Dữ liệu phân bổ ngân sách sẽ hiển thị tại đây"
                    />
                </div>
            </div>
        </main>
    );
}

