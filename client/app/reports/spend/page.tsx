"use client";

import { useEffect, useRef, useState } from "react";
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

    const fetchSpendOverviewRef = useRef(fetchSpendOverview);
    const fetchSpendBySupplierRef = useRef(fetchSpendBySupplier);
    const fetchSpendByCategoryRef = useRef(fetchSpendByCategory);
    fetchSpendOverviewRef.current = fetchSpendOverview;
    fetchSpendBySupplierRef.current = fetchSpendBySupplier;
    fetchSpendByCategoryRef.current = fetchSpendByCategory;

    useEffect(() => {
        async function fetchReports() {
            setLoading(true);
            try {
                const [overviewData, supplierData, categoryData] = await Promise.all([
                    fetchSpendOverviewRef.current().catch(() => null),
                    fetchSpendBySupplierRef.current().catch(() => []),
                    fetchSpendByCategoryRef.current().catch(() => []),
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
    }, []);

    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center bg-[#FFFFFF]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#2563EB]"></div>
            </div>
        );
    }

    const supplierChartData = spendBySupplier.slice(0, 5).map(s => ({
        label: s.supplierName,
        value: Number(s.totalAmount),
        color: "#2563EB"
    }));

    const COLORS = ['#2563EB', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];
    const categoryChartData = spendByCategory.slice(0, 6).map((c, idx) => ({
        label: c.categoryName ?? c.category ?? '',
        value: Number(c.totalAmount),
        color: COLORS[idx % COLORS.length]
    }));

    return (
        <main className="animate-in fade-in duration-500 bg-[#FFFFFF] min-h-screen text-slate-900">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10 mt-4 px-6 md:px-8 pt-6">
                <div>
                    <h1 className="text-3xl font-black tracking-tight uppercase">Báo cáo Phân tích Chi phí (Spend Analytics)</h1>
                    <p className="text-sm font-bold text-slate-900 mt-1">DỮ LIỆU ĐƯỢC TỔNG HỢP THEO GIỜ TỪ HỆ THỐNG GIAO DỊCH LÕI</p>
                </div>
                <div className="flex gap-3">
                    <button className="flex items-center gap-2 px-6 py-3 bg-[#F1F5F9] border border-[rgba(148,163,184,0.1)] rounded-2xl text-[11px] font-black uppercase tracking-widest text-slate-900 hover:bg-slate-100 transition-all shadow-sm">
                        <Filter size={14} /> Bộ lọc
                    </button>
                    <button className="flex items-center gap-2 px-6 py-3 bg-[#2563EB] text-white rounded-2xl text-[11px] font-black uppercase tracking-widest hover:bg-[#1D4ED8] transition-all shadow-lg shadow-[#2563EB]/20">
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
                <div className="lg:col-span-1 bg-[#F1F5F9] rounded-xl border border-[rgba(148,163,184,0.1)] overflow-hidden shadow-2xl p-2">
                    <DonutChart 
                        title="Tỉ trọng Chi phí theo Danh mục"
                        data={categoryChartData}
                        centerLabel="Tổng Chi"
                        centerValue={overview?.totalSpent ? formatVND(overview.totalSpent, true) : "0"}
                    />
                </div>

                {/* Spend by Supplier Bar */}
                <div className="lg:col-span-2 bg-[#F1F5F9] rounded-xl border border-[rgba(148,163,184,0.1)] overflow-hidden shadow-2xl p-2">
                    <SimpleBarChart 
                        title="Top Nhà cung cấp (GMV)"
                        data={supplierChartData}
                    />
                </div>
            </div>

            {/* Detailed Table */}
            <div className="bg-[#F1F5F9] rounded-xl border border-[rgba(148,163,184,0.1)] overflow-hidden shadow-2xl mx-6 md:mx-8 mb-12">
                <div className="p-8 border-b border-[rgba(148,163,184,0.1)] bg-[#FFFFFF] flex justify-between items-center">
                    <h3 className="text-base font-black uppercase tracking-tight flex items-center gap-2">
                        <Layers className="text-[#2563EB]" size={18} /> Phân mảnh chi tiết nhà cung cấp
                    </h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="erp-table text-xs">
                        <thead>
                            <tr className="border-b border-[rgba(148,163,184,0.1)]">
                                <th className="px-8 py-5 text-left">Tên nhà cung cấp</th>
                                <th className="text-center">Tần suất Giao dịch (PO)</th>
                                <th className="text-right pr-12">Tổng Tiền Thanh Toán</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[rgba(148,163,184,0.1)]">
                            {spendBySupplier.map((s, idx) => (
                                <tr key={idx} className="hover:bg-[#FFFFFF] transition-colors cursor-pointer group">
                                    <td className="px-8 py-4">
                                        <div className="font-bold text-slate-900">{s.supplierName}</div>
                                        {idx < 3 && <div className="text-[9px] font-bold text-emerald-500 uppercase tracking-widest mt-1">Core Partner</div>}
                                    </td>
                                    <td className="text-center font-bold text-slate-900 group-hover:text-white transition-colors">
                                        {s.orderCount}
                                    </td>
                                    <td className="text-right pr-12 text-[#2563EB] font-black text-sm">
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

