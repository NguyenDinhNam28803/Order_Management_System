"use client";

import React from "react";
import DashboardHeader from "../../components/DashboardHeader";
import { Package, Truck, AlertTriangle, CheckCircle2, RotateCcw, Info, Box } from "lucide-react";
import { useRouter } from "next/navigation";

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
            <DashboardHeader breadcrumbs={["Kho vận", "Dashboard Kho"]} />

            <div className="mt-8 mb-8 pb-6 border-b border-slate-200">
                <h1 className="text-3xl font-black text-erp-navy tracking-tight">Dashboard Warehouse</h1>
                <p className="text-sm text-slate-500 mt-1">Quản lý lịch giao nhận hàng hóa & Kiểm định chất lượng ngõ vào (Inbound).</p>
            </div>

            {/* KPI Cards (7.1) */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <div className="erp-card bg-emerald-50 border-emerald-200">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-3 bg-emerald-100 text-emerald-600 rounded-xl"><Package size={24} /></div>
                        <span className="text-[10px] font-black uppercase text-emerald-600 bg-emerald-200/50 px-2 py-1 rounded">Today</span>
                    </div>
                    <div className="text-3xl font-black text-emerald-950">12 <span className="text-sm font-bold text-emerald-700/60 uppercase">Chuyến</span></div>
                    <div className="text-xs font-bold text-emerald-700/60 uppercase tracking-widest mt-1">Đã nhận hàng hôm nay</div>
                </div>

                <div className="erp-card bg-orange-50 border-orange-200">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-3 bg-orange-100 text-orange-600 rounded-xl"><Box size={24} /></div>
                        <span className="flex items-center gap-1 text-[10px] font-black uppercase text-orange-600 bg-orange-200/50 px-2 py-1 rounded">
                            <AlertTriangle size={10}/> Chờ xử lý
                        </span>
                    </div>
                    <div className="text-3xl font-black text-orange-950">5 <span className="text-sm font-bold text-orange-700/60 uppercase">Đơn</span></div>
                    <div className="text-xs font-bold text-orange-700/60 uppercase tracking-widest mt-1">Đang chờ kiểm tra QC</div>
                </div>

                <div className="erp-card bg-blue-50 border-blue-200">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-3 bg-blue-100 text-blue-600 rounded-xl"><CheckCircle2 size={24} /></div>
                    </div>
                    <div className="text-3xl font-black text-blue-950">98.5<span className="text-sm font-bold text-blue-700/60">%</span></div>
                    <div className="text-xs font-bold text-blue-700/60 uppercase tracking-widest mt-1">Tỷ lệ Pass QC (Tháng)</div>
                    <div className="text-[10px] text-blue-600/80 mt-2 font-medium">+1.2% So với tháng trước</div>
                </div>

                <div className="erp-card bg-red-50 border-red-200">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-3 bg-red-100 text-red-600 rounded-xl"><RotateCcw size={24} /></div>
                    </div>
                    <div className="text-3xl font-black text-red-950">3</div>
                    <div className="text-xs font-bold text-red-700/60 uppercase tracking-widest mt-1">Lần Return / Reject</div>
                    <div className="text-[10px] text-red-600/80 mt-2 font-medium">Lỗi chủ yếu: Đóng gói hỏng</div>
                </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                {/* Sắp giao hàng (7.1) */}
                <div className="erp-card shadow-sm border border-slate-200 !p-0 overflow-hidden flex flex-col">
                    <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                        <h3 className="text-sm font-black uppercase tracking-widest text-erp-navy flex items-center gap-2">
                            <Truck size={16} /> Lịch Giao Hàng (7 Ngày Tới)
                        </h3>
                    </div>
                    <div className="flex-1 overflow-auto bg-white max-h-[400px]">
                        <table className="erp-table text-xs m-0 !border-none">
                            <thead className="sticky top-0 bg-slate-50 shadow-sm z-10">
                                <tr>
                                    <th>PO</th>
                                    <th>Nhà cung cấp</th>
                                    <th>Sản phẩm / Số lượng</th>
                                    <th className="text-center">Ngày giao</th>
                                    <th className="text-center">Trạng thái</th>
                                </tr>
                            </thead>
                            <tbody>
                                {incomingPOs.map((po, idx) => (
                                    <tr key={idx} className="cursor-pointer hover:bg-slate-50 border-b border-slate-50" onClick={() => router.push(`/warehouse/grn/new?po=${po.id}`)}>
                                        <td className="font-bold text-erp-navy">{po.id}</td>
                                        <td className="font-bold text-slate-600">{po.vendor}</td>
                                        <td>
                                            <div className="truncate w-32 font-medium text-slate-700">{po.items}</div>
                                            <div className="text-[10px] text-slate-400 ">x {po.qty}</div>
                                        </td>
                                        <td className="text-center  text-slate-600">{po.deliveryDate}</td>
                                        <td className="text-center">
                                            {po.status === "PENDING" ? (
                                                <span className="text-[9px] font-black uppercase tracking-widest bg-blue-50 text-blue-600 px-2 py-1 rounded border border-blue-200">Sắp tới</span>
                                            ) : (
                                                <span className="text-[9px] font-black uppercase tracking-widest bg-orange-50 text-orange-600 px-2 py-1 rounded border border-orange-200">Trễ hạn</span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* GRN Cần Xử Lý (Draft) (7.1) */}
                <div className="erp-card shadow-sm border border-slate-200 !p-0 overflow-hidden flex flex-col">
                    <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                        <h3 className="text-sm font-black uppercase tracking-widest text-erp-navy flex items-center gap-2">
                            <Info size={16} /> Phiếu GRN Đang Draft (Cần Xử Lý)
                        </h3>
                    </div>
                    <div className="flex-1 overflow-auto bg-white max-h-[400px]">
                        <table className="erp-table text-xs m-0 !border-none">
                            <thead className="sticky top-0 bg-slate-50 shadow-sm z-10">
                                <tr>
                                    <th>Mã GRN</th>
                                    <th>Liên kết PO</th>
                                    <th>Ngày lập</th>
                                    <th className="text-center">Vấn đề (Draft)</th>
                                    <th className="text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {draftGRNs.map((grn, idx) => (
                                    <tr key={idx} className="border-b border-slate-50 hover:bg-slate-50">
                                        <td className="font-bold text-erp-navy">{grn.id}</td>
                                        <td className="font-bold text-slate-600">
                                            {grn.poId} <br/>
                                            <span className="font-normal text-[10px] text-slate-400">{grn.vendor}</span>
                                        </td>
                                        <td className=" text-slate-500">{grn.date}</td>
                                        <td className="text-center text-[10px] font-bold text-orange-600">{grn.missing}</td>
                                        <td className="text-right">
                                            <button className="text-[10px] font-black uppercase tracking-widest text-erp-blue hover:underline">Tiếp tục QC</button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {draftGRNs.length === 0 && (
                            <div className="p-8 text-center text-slate-400">
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
