"use client";

import React from "react";
import { Package, Truck, AlertTriangle, CheckCircle2, RotateCcw, Info, Box } from "lucide-react";
import { useRouter } from "next/navigation";
import { StatsCard } from "../../components/charts";

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
        <main className="animate-in fade-in duration-500 p-6 min-h-screen bg-[#0F1117] text-[#F8FAFC]">
            <header className="mb-8 lg:flex items-end justify-between">
                <div>
                    <h1 className="text-4xl font-black tracking-tight text-[#F8FAFC] mb-2 uppercase">DASHBOARD WAREHOUSE</h1>
                    <p className="text-[#64748B] font-medium">Quản lý lịch giao nhận hàng hóa & Kiểm định chất lượng ngõ vào (Inbound).</p>
                </div>
            </header>

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
                <div className="bg-[#161922] rounded-2xl border border-[rgba(148,163,184,0.1)] shadow-xl shadow-[#3B82F6]/5 !p-0 overflow-hidden flex flex-col">
                    <div className="p-6 border-b border-[rgba(148,163,184,0.1)] flex justify-between items-center bg-[#0F1117]">
                        <h3 className="text-sm font-black uppercase tracking-widest text-[#F8FAFC] flex items-center gap-2">
                            <Truck size={16} /> Lịch Giao Hàng (7 Ngày Tới)
                        </h3>
                    </div>
                    <div className="flex-1 overflow-auto bg-[#161922] max-h-[400px]">
                        <table className="erp-table text-xs m-0 !border-none w-full" style={{ tableLayout: 'fixed' }}>
                            <thead className="sticky top-0 bg-[#0F1117] shadow-sm z-10">
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
                                    <tr key={idx} className="cursor-pointer hover:bg-[#0F1117] border-b border-[rgba(148,163,184,0.1)]" onClick={() => router.push(`/warehouse/grn/new?po=${po.id}`)}>
                                        <td className="py-4 px-4">
                                            <div className="font-bold text-[#F8FAFC] text-xs truncate">{po.id.replace('PO-', '#PO-')}</div>
                                        </td>
                                        <td className="py-4 px-4">
                                            <div className="font-bold text-[#94A3B8] text-xs truncate">{po.vendor}</div>
                                        </td>
                                        <td className="py-4 px-4">
                                            <div className="truncate font-medium text-[#F8FAFC] text-xs">{po.items}</div>
                                            <div className="text-[10px] text-[#64748B]">x {po.qty} SP</div>
                                        </td>
                                        <td className="text-center text-[#94A3B8] py-4 px-4 text-xs">{po.deliveryDate}</td>
                                        <td className="text-center py-4 px-4">
                                            {po.status === "PENDING" ? (
                                                <span className="text-[9px] font-black uppercase tracking-widest bg-[#3B82F6]/10 text-[#3B82F6] px-2 py-1 rounded border border-[#3B82F6]/20">Sắp tới</span>
                                            ) : (
                                                <span className="text-[9px] font-black uppercase tracking-widest bg-amber-500/10 text-amber-400 px-2 py-1 rounded border border-amber-500/20">Trễ hạn</span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* GRN Cần Xử Lý (Draft) (7.1) */}
                <div className="bg-[#161922] rounded-2xl border border-[rgba(148,163,184,0.1)] shadow-xl shadow-[#3B82F6]/5 !p-0 overflow-hidden flex flex-col">
                    <div className="p-6 border-b border-[rgba(148,163,184,0.1)] flex justify-between items-center bg-[#0F1117]">
                        <h3 className="text-sm font-black uppercase tracking-widest text-[#F8FAFC] flex items-center gap-2">
                            <Info size={16} /> Phiếu GRN Đang Draft (Cần Xử Lý)
                        </h3>
                    </div>
                    <div className="flex-1 overflow-auto bg-[#161922] max-h-[400px]">
                        <table className="erp-table text-xs m-0 !border-none w-full" style={{ tableLayout: 'fixed' }}>
                            <thead className="sticky top-0 bg-[#0F1117] shadow-sm z-10">
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
                                    <tr key={idx} className="border-b border-[rgba(148,163,184,0.1)] hover:bg-[#0F1117]">
                                        <td className="py-4 px-4">
                                            <div className="font-bold text-[#F8FAFC] text-xs truncate">{grn.id.replace('GRN-', '#GRN-')}</div>
                                        </td>
                                        <td className="py-4 px-4">
                                            <div className="font-bold text-[#94A3B8] text-xs truncate">{grn.poId}</div>
                                            <div className="text-[10px] text-[#64748B] truncate">{grn.vendor}</div>
                                        </td>
                                        <td className="text-[#94A3B8] py-4 px-4 text-xs">{grn.date}</td>
                                        <td className="text-center py-4 px-4">
                                            <span className="text-[9px] font-black uppercase tracking-widest bg-amber-500/10 text-amber-400 px-2 py-1 rounded border border-amber-500/20">
                                                {grn.missing}
                                            </span>
                                        </td>
                                        <td className="text-right py-4 px-4">
                                            <button 
                                                onClick={() => router.push(`/warehouse/grn/new?grn=${grn.id}`)}
                                                className="text-[10px] font-black uppercase tracking-widest text-[#3B82F6] hover:bg-[#3B82F6]/10 px-3 py-2 rounded-lg transition-colors border border-[#3B82F6]/20"
                                            >
                                                Tiếp tục QC
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {draftGRNs.length === 0 && (
                            <div className="p-8 text-center text-[#64748B]">
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
