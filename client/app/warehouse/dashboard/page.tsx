"use client";

import React from "react";
import { Package, Truck, CheckCircle2, RotateCcw, Info, Box } from "lucide-react";
import { useRouter } from "next/navigation";
import { StatsCard } from "../../components/charts";
import PageHeader from "../../components/shared/PageHeader";

interface PO {
    id: string;
    vendor: string;
    items: string;
    qty: number;
    deliveryDate: string;
    status: "PENDING" | "DELAYED";
}

interface GRNDraft {
    id: string;
    poId: string;
    vendor: string;
    date: string;
    inspector: string;
    missing: string;
}

export default function WarehouseDashboard() {
    const router = useRouter();

    const incomingPOs: PO[] = [
        { id: "PO-2026-088", vendor: "Formosa Corp", items: "Vải Cotton 100%", qty: 500, deliveryDate: "15/03/2026", status: "PENDING" },
        { id: "PO-2026-089", vendor: "Nhựa Tiền Phong", items: "Ống nước PVC", qty: 200, deliveryDate: "16/03/2026", status: "PENDING" },
        { id: "PO-2026-092", vendor: "Tech Corp", items: "Máy chấm công", qty: 5, deliveryDate: "18/03/2026", status: "DELAYED" },
    ];

    const draftGRNs: GRNDraft[] = [
        { id: "GRN-0326-01", poId: "PO-2026-075", vendor: "Mực In Laser", date: "14/03/2026", inspector: "Phạm Kho Vận", missing: "Chờ QC" },
        { id: "GRN-0326-02", poId: "PO-2026-081", vendor: "Giấy Bãi Bằng", date: "14/03/2026", inspector: "Trần Giám Sát", missing: "Thiếu 10 Ram" },
    ];

    return (
        <main className="animate-in fade-in duration-500 p-6 min-h-screen bg-[#F8FAFC] text-slate-900">
            <PageHeader
                title="Dashboard Kho hàng"
                subtitle="Quản lý lịch giao nhận hàng hóa và kiểm định chất lượng ngõ vào."
                icon={Package}
                iconColor="green"
            />

            {/* KPI Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <StatsCard 
                    title="Đã Nhận Hàng Hôm Nay" 
                    value={12} 
                    subValue="12 chuyến"
                    icon={Package}
                    color="green"
                    trend={{ value: 8, isPositive: true }}
                />
                <StatsCard 
                    title="Chờ Kiểm Tra QC" 
                    value={5} 
                    subValue="5 đơn đang chờ"
                    icon={Box}
                    color="amber"
                />
                <StatsCard 
                    title="Tỷ Lệ Pass QC" 
                    value="98.5%" 
                    subValue="+1.2% so với tháng trước"
                    icon={CheckCircle2}
                    color="blue"
                    trend={{ value: 1.2, isPositive: true }}
                />
                <StatsCard 
                    title="Return / Reject" 
                    value={3} 
                    subValue="Lỗi: Đóng gói hỏng"
                    icon={RotateCcw}
                    color="red"
                    trend={{ value: 2, isPositive: false }}
                />
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                {/* Sắp giao hàng (7.1) */}
                <div className="bg-[#F1F5F9] rounded-xl border border-slate-200 shadow-xl shadow-[#2563EB]/5 !p-0 overflow-hidden flex flex-col">
                    <div className="p-6 border-b border-slate-200 flex justify-between items-center bg-[#FFFFFF]">
                        <h3 className="text-sm font-black uppercase tracking-widest text-slate-900 flex items-center gap-2">
                            <Truck size={16} /> Lịch Giao Hàng (7 Ngày Tới)
                        </h3>
                    </div>
                    <div className="flex-1 overflow-auto bg-[#F1F5F9] max-h-[400px]">
                        <table className="erp-table text-xs m-0 !border-none w-full" style={{ tableLayout: 'fixed' }}>
                            <thead className="sticky top-0 shadow-sm z-10">
                                <tr>
                                    <th className="w-[20%]">PO</th>
                                    <th className="w-[25%]">Nhà cung cấp</th>
                                    <th className="w-[25%]">Sản phẩm / SL</th>
                                    <th className="text-center w-[15%]">Ngày giao</th>
                                    <th className="text-center w-[15%]">Trạng thái</th>
                                </tr>
                            </thead>
                            <tbody>
                                {incomingPOs.map((po, idx) => (
                                    <tr key={idx} className="cursor-pointer hover:bg-[#FFFFFF] border-b border-slate-200" onClick={() => router.push(`/warehouse/grn/new?po=${po.id}`)}>
                                        <td className="py-4 px-4">
                                            <div className="font-bold text-slate-900 text-xs truncate">PO-***</div>
                                        </td>
                                        <td className="py-4 px-4">
                                            <div className="font-bold text-slate-900 text-xs truncate">{po.vendor || 'N/A'}</div>
                                        </td>
                                        <td className="py-4 px-4">
                                            <div className="truncate font-medium text-slate-900 text-xs">{po.items}</div>
                                            <div className="text-[10px] text-slate-900">x {po.qty} SP</div>
                                        </td>
                                        <td className="text-center text-slate-900 py-4 px-4 text-xs">{po.deliveryDate}</td>
                                        <td className="text-center py-4 px-4">
                                            {po.status === "PENDING" ? (
                                                <span className="text-[0.6875rem] font-black uppercase tracking-widest bg-[#2563EB]/10 text-[#2563EB] px-2 py-1 rounded border border-[#2563EB]/20">Sắp tới</span>
                                            ) : (
                                                <span className="text-[0.6875rem] font-black uppercase tracking-widest bg-amber-500/10 text-amber-700 px-2 py-1 rounded border border-amber-500/20">Trễ hạn</span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* GRN Cần Xử Lý (Draft) (7.1) */}
                <div className="bg-[#F1F5F9] rounded-xl border border-slate-200 shadow-xl shadow-[#2563EB]/5 !p-0 overflow-hidden flex flex-col">
                    <div className="p-6 border-b border-slate-200 flex justify-between items-center bg-[#FFFFFF]">
                        <h3 className="text-sm font-black uppercase tracking-widest text-slate-900 flex items-center gap-2">
                            <Info size={16} /> Phiếu GRN Đang Draft (Cần Xử Lý)
                        </h3>
                    </div>
                    <div className="flex-1 overflow-auto bg-[#F1F5F9] max-h-[400px]">
                        <table className="erp-table text-xs m-0 !border-none w-full" style={{ tableLayout: 'fixed' }}>
                            <thead className="sticky top-0 shadow-sm z-10">
                                <tr>
                                    <th className="w-[18%]">Mã GRN</th>
                                    <th className="w-[25%]">Liên kết PO</th>
                                    <th className="w-[15%]">Ngày lập</th>
                                    <th className="text-center w-[22%]">Vấn đề (Draft)</th>
                                    <th className="text-right w-[20%]">Thao tác</th>
                                </tr>
                            </thead>
                            <tbody>
                                {draftGRNs.map((grn, idx) => (
                                    <tr key={idx} className="border-b border-slate-200 hover:bg-[#FFFFFF]">
                                        <td className="py-4 px-4">
                                            <div className="font-bold text-slate-900 text-xs truncate">{grn.id.replace('GRN-', '#GRN-')}</div>
                                        </td>
                                        <td className="py-4 px-4">
                                            <div className="font-bold text-slate-900 text-xs truncate">{grn.poId}</div>
                                            <div className="text-[10px] text-slate-900 truncate">{grn.vendor}</div>
                                        </td>
                                        <td className="text-slate-900 py-4 px-4 text-xs">{grn.date}</td>
                                        <td className="text-center py-4 px-4">
                                            <span className="text-[0.6875rem] font-black uppercase tracking-widest bg-amber-500/10 text-amber-700 px-2 py-1 rounded border border-amber-500/20">
                                                {grn.missing}
                                            </span>
                                        </td>
                                        <td className="text-right py-4 px-4">
                                            <button 
                                                onClick={() => router.push(`/warehouse/grn/new?grn=${grn.id}`)}
                                                className="text-[10px] font-black uppercase tracking-widest text-[#2563EB] hover:bg-[#2563EB]/10 px-3 py-2 rounded-lg transition-colors border border-[#2563EB]/20"
                                            >
                                                Tiếp tục QC
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {draftGRNs.length === 0 && (
                            <div className="p-8 text-center text-slate-900">
                                <CheckCircle2 size={32} className="mx-auto mb-2 opacity-50" />
                                <span className="text-xs uppercase tracking-widest font-bold">Không có chứng từ Draft</span>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </main>
    );
}

