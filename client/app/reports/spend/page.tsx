"use client";

import { useEffect, useState } from "react";
import {
    BarChart3, CreditCard, Filter, Download, DollarSign, Users, Layers
} from "lucide-react";
import { useProcurement, SpendOverview, SpendBySupplier, SpendByCategory } from "../../context/ProcurementContext";
import { formatVND } from "../../utils/formatUtils";
import { SimpleBarChart, DonutChart, StatsCard } from "../../components/charts";

export default function SpendReportPage() {
    const { fetchSpendOverview, fetchSpendBySupplier, fetchSpendByCategory } = useProcurement();
    const [loading, setLoading] = useState(true);
    const [overview, setOverview] = useState<SpendOverview | null>(null);
    const [spendBySupplier, setSpendBySupplier] = useState<SpendBySupplier[]>([]);
    const [spendByCategory, setSpendByCategory] = useState<SpendByCategory[]>([]);

    useEffect(() => {
        async function fetchReports() {
            setLoading(true);
            try {
                const [overviewData, supplierData, categoryData] = await Promise.all([
                    fetchSpendOverview().catch(() => null),
                    fetchSpendBySupplier().catch(() => []),
                    fetchSpendByCategory().catch(() => []),
                ]);
                if (overviewData) setOverview(overviewData);
                setSpendBySupplier(supplierData ?? []);
                setSpendByCategory(categoryData ?? []);
            } catch (error) {
                console.error("Failed to load reports", error);
            } finally {
                setLoading(false);
            }
        }
        fetchReports();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center bg-[#0F1117]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#3B82F6]"></div>
            </div>
        );
    }

    const supplierChartData = spendBySupplier.slice(0, 5).map(s => ({
        label: s.supplierName,
        value: Number(s.totalAmount),
        color: "#3B82F6"
    }));

    const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];
    const categoryChartData = spendByCategory.slice(0, 6).map((c, idx) => ({
        label: c.categoryName,
        value: Number(c.totalAmount),
        color: COLORS[idx % COLORS.length]
    }));

    return (
        <main className="animate-in fade-in duration-500 bg-[#0F1117] min-h-screen text-[#F8FAFC]">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10 mt-4 px-6 md:px-8 pt-6">
                <div>
                    <h1 className="text-3xl font-black tracking-tight uppercase">Báo cáo Phân tích Chi phí (Spend Analytics)</h1>
                    <p className="text-sm font-bold text-[#64748B] mt-1">DỮ LIỆU ĐƯỢC TỔNG HỢP THEO GIỜ TỪ HỆ THỐNG GIAO DỊCH LÕI</p>
                </div>
                <div className="flex gap-3">
                    <button className="flex items-center gap-2 px-6 py-3 bg-[#161922] border border-[rgba(148,163,184,0.1)] rounded-2xl text-[11px] font-black uppercase tracking-widest text-[#94A3B8] hover:bg-[#1A1D23] transition-all shadow-sm">
                        <Filter size={14} /> Bộ lọc
                    </button>
                    <button className="flex items-center gap-2 px-6 py-3 bg-[#3B82F6] text-white rounded-2xl text-[11px] font-black uppercase tracking-widest hover:bg-[#2563EB] transition-all shadow-lg shadow-[#3B82F6]/20">
                        <Download size={14} /> Xuất PDF
                    </button>
                </div>
            </div>

            {/* Top KPI row */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8 px-6 md:px-8">
                <StatsCard 
                    title="Tổng Chi Phí Thực Tế (PO)" 
                    value={overview?.totalSpent ? formatVND(overview.totalSpent) : "0 ₫"} 
                    subValue="Lũy kế"
                    icon={DollarSign}
                    color="green"
                    trend={{ value: 12.5, isPositive: true }}
                />
                <StatsCard 
                    title="Khối lượng Đơn hàng (PO)" 
                    value={overview?.poCount?.toString() || "0"} 
                    subValue={`Từ ${overview?.prCount || 0} yêu cầu (PR)`}
                    icon={BarChart3}
                    color="blue"
                />
                <StatsCard 
                    title="Tổng Lượng Hóa đơn" 
                    value={overview?.invoiceCount?.toString() || "0"} 
                    subValue="Hóa đơn chờ/hoàn tất"
                    icon={CreditCard}
                    color="purple"
                />
                <StatsCard 
                    title="Mạng lưới NCC" 
                    value={overview?.supplierCount?.toString() || "0"} 
                    subValue="NCC Đang hoạt động"
                    icon={Users}
                    color="amber"
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8 px-6 md:px-8">
                {/* Spend by Category Donut */}
                <div className="lg:col-span-1 bg-[#161922] rounded-[32px] border border-[rgba(148,163,184,0.1)] overflow-hidden shadow-2xl p-2">
                    <DonutChart 
                        title="Tỉ trọng Chi phí theo Danh mục"
                        data={categoryChartData}
                        centerLabel="Tổng Chi"
                        centerValue={overview?.totalSpent ? formatVND(overview.totalSpent, true) : "0"}
                    />
                </div>

                {/* Spend by Supplier Bar */}
                <div className="lg:col-span-2 bg-[#161922] rounded-[32px] border border-[rgba(148,163,184,0.1)] overflow-hidden shadow-2xl p-2">
                    <SimpleBarChart 
                        title="Top Nhà cung cấp (GMV)"
                        data={supplierChartData}
                    />
                </div>
            </div>

            {/* Detailed Table */}
            <div className="bg-[#161922] rounded-[32px] border border-[rgba(148,163,184,0.1)] overflow-hidden shadow-2xl mx-6 md:mx-8 mb-12">
                <div className="p-8 border-b border-[rgba(148,163,184,0.1)] bg-[#0F1117] flex justify-between items-center">
                    <h3 className="text-base font-black uppercase tracking-tight flex items-center gap-2">
                        <Layers className="text-[#3B82F6]" size={18} /> Phân mảnh chi tiết nhà cung cấp
                    </h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                        <thead className="bg-[#161922]">
                            <tr className="border-b border-[rgba(148,163,184,0.1)]">
                                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-[#64748B] text-left">Tên nhà cung cấp</th>
                                <th className="text-[10px] font-black uppercase tracking-widest text-[#64748B] text-center">Tần suất Giao dịch (PO)</th>
                                <th className="text-[10px] font-black uppercase tracking-widest text-[#64748B] text-right pr-12">Tổng Tiền Thanh Toán</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[rgba(148,163,184,0.1)]">
                            {spendBySupplier.map((s, idx) => (
                                <tr key={idx} className="hover:bg-[#0F1117] transition-colors cursor-pointer group">
                                    <td className="px-8 py-4">
                                        <div className="font-bold text-[#F8FAFC]">{s.supplierName}</div>
                                        {idx < 3 && <div className="text-[9px] font-bold text-emerald-500 uppercase tracking-widest mt-1">Core Partner</div>}
                                    </td>
                                    <td className="text-center font-bold text-[#94A3B8] group-hover:text-[#F8FAFC] transition-colors">
                                        {s.poCount}
                                    </td>
                                    <td className="text-right pr-12 text-[#3B82F6] font-black text-sm">
                                        {formatVND(Number(s.totalAmount))}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </main>
    );
}
