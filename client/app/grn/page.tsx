"use client";

import React, { useState } from "react";
import DashboardHeader from "../components/DashboardHeader";
import { Truck, Package, Camera, CheckCircle2, AlertTriangle, Search, ArrowRight, TrendingUp, Clock, Star } from "lucide-react";
import { useProcurement } from "../context/ProcurementContext";
import { useRouter } from "next/navigation";

export default function GRNPage() {
    const { pos } = useProcurement();
    const router = useRouter();

    // Find a committed PO to receive
    const activePO = pos.find(p => p.status === "SHIPPED");
    const [receivedQty, setReceivedQty] = useState(42); // Simulating 42/50 logic for ink
    const [isSaving, setIsSaving] = useState(false);
    const [deliveryStatus, setDeliveryStatus] = useState<"ON_TIME" | "LATE">("ON_TIME");

    // KPI Calculation
    const qtyCrr = 500; // Mock cotton
    const qtyTotal = 500 + 50;
    const receivedTotal = qtyCrr + receivedQty;
    const qtyScore = (receivedTotal / qtyTotal) * 100;
    const timeScore = deliveryStatus === "ON_TIME" ? 100 : 50; 
    const finalKpiScore = Math.round((qtyScore * 0.7) + (timeScore * 0.3)); // 70% Qty, 30% Time

    const handleConfirm = () => {
        setIsSaving(true);
        setTimeout(() => {
            router.push("/matching");
        }, 1500);
    };

    return (
        <main className="pt-16 px-8 pb-12">
            <DashboardHeader breadcrumbs={["Nghiệp vụ", "Nhập kho (GRN)"]} />

            <div className="mt-8 mb-8 flex justify-between items-end">
                <div>
                    <h1 className="text-3xl font-black text-erp-navy tracking-tight">Nhập kho & Kiểm định (GRN)</h1>
                    <p className="text-sm text-slate-500 mt-1">Xác nhận hàng hóa thực nhận và kiểm soát chất lượng đầu vào.</p>
                </div>
            </div>

            {!activePO ? (
                <div className="erp-card bg-slate-50 border-dashed py-32 text-center text-slate-400">
                    <Truck size={48} className="mx-auto mb-4 opacity-10" />
                    <p className="text-xs font-black uppercase tracking-widest">Không có Đơn hàng (PO) nào đang chờ nhập kho</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-in fade-in duration-500">
                    <div className="space-y-6">
                        <div className="erp-card">
                            <div className="flex items-center gap-3 mb-8">
                                <div className="p-3 bg-blue-50 rounded-xl"><Truck size={24} className="text-erp-blue" /></div>
                                <div>
                                    <h3 className="text-sm font-black uppercase text-erp-navy">Xác nhận vận chuyển</h3>
                                    <span className="text-[10px] font-black text-slate-400 uppercase">PO #{activePO.id} | {activePO.vendor}</span>
                                </div>
                            </div>

                            <div className="p-5 bg-blue-50/50 border border-blue-100 rounded-2xl flex justify-between items-center">
                                <div className="space-y-1">
                                    <span className="block text-[9px] font-black uppercase text-blue-400">Trạng thái định vị (GPS)</span>
                                    <span className="text-xs text-blue-800 font-black">Xưởng sản xuất - Cổng số 4</span>
                                </div>
                                <div className="status-pill status-approved">Đã tới cổng</div>
                            </div>
                        </div>

                        <div className="erp-card !p-0 overflow-hidden">
                            <div className="p-6 bg-erp-navy text-white flex justify-between items-center">
                                <h3 className="text-xs font-black uppercase tracking-widest">Kiểm đếm SL thực tế</h3>
                                <Package size={18} className="text-white/40" />
                            </div>
                            <table className="erp-table">
                                <thead>
                                    <tr>
                                        <th>Mặt hàng</th>
                                        <th className="text-center">SL Đặt (PO)</th>
                                        <th className="text-right">SL Thực nhận</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr>
                                        <td className="font-bold">Vải Cotton 100% (Trắng)</td>
                                        <td className="text-center font-bold">500</td>
                                        <td className="text-right"><input type="number" defaultValue={500} className="w-24 erp-input text-right" /></td>
                                    </tr>
                                    <tr>
                                        <td className="font-bold">Mực in lụa (Thùng 20L)</td>
                                        <td className="text-center font-bold">50</td>
                                        <td className="text-right">
                                            <input
                                                type="number"
                                                value={receivedQty}
                                                onChange={e => setReceivedQty(parseInt(e.target.value))}
                                                className={`w-24 erp-input text-right font-black ${receivedQty < 50 ? 'border-erp-red bg-red-50 text-red-600' : ''}`}
                                            />
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                            {receivedQty < 50 && (
                                <div className="p-6 bg-red-50 flex gap-3">
                                    <AlertTriangle size={18} className="text-red-600 shrink-0" />
                                    <p className="text-[10px] text-red-700 font-bold leading-relaxed uppercase tracking-tight">
                                        Phát hiện giao thiếu {50 - receivedQty} thùng! Hệ thống sẽ tự động gắn cờ Dispute tại khâu Đối soát 3 bên và Finance.
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="space-y-8">
                        <div className="erp-card">
                            <h3 className="text-sm font-black uppercase tracking-widest text-erp-navy mb-8 flex items-center gap-2">
                                <CheckCircle2 size={18} className="text-emerald-500" /> Kiểm định chất lượng (QC)
                            </h3>

                            <div className="grid grid-cols-2 gap-4 mb-8">
                                <button className="py-4 border-2 border-slate-100 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-400 hover:border-emerald-500 hover:text-emerald-600 transition-all flex flex-col items-center gap-2">
                                    <CheckCircle2 size={24} /> Pass (Đạt)
                                </button>
                                <button className="py-4 border-2 border-erp-red bg-red-50/50 rounded-2xl text-[10px] font-black uppercase tracking-widest text-erp-red transition-all flex flex-col items-center gap-2 ring-4 ring-red-100">
                                    <AlertTriangle size={24} /> Fail (Lỗi)
                                </button>
                            </div>

                            <div className="space-y-4">
                                <label className="erp-label">Hình ảnh bằng chứng (Lỗi/Thiếu)</label>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="h-40 border-2 border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center text-slate-300 hover:border-erp-blue hover:text-erp-blue cursor-pointer group transition-all">
                                        <Camera size={40} className="group-hover:scale-110 transition-transform" />
                                        <span className="text-[10px] mt-4 font-black uppercase tracking-widest">Chụp ảnh</span>
                                    </div>
                                    <div className="h-40 rounded-2xl overflow-hidden shadow-inner relative group border border-slate-100">
                                        <img src="https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?q=80&w=400&auto=format&fit=crop" className="w-full h-full object-cover grayscale opacity-40 group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-700" />
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-4">
                                            <span className="text-white text-[9px] font-black uppercase">Ảnh 01: Thùng hàng bị móp</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-10 pt-8 border-t border-slate-100">
                                <h3 className="text-sm font-black uppercase tracking-widest text-erp-navy mb-6 flex items-center gap-2">
                                    <TrendingUp size={18} className="text-erp-blue" /> Đánh giá hiệu suất nhà cung cấp (KPI)
                                </h3>

                                <div className="space-y-6">
                                    <div className="grid grid-cols-2 gap-4">
                                        <button 
                                            onClick={() => setDeliveryStatus("ON_TIME")}
                                            className={`py-4 border-2 rounded-2xl flex flex-col items-center gap-2 transition-all ${deliveryStatus === "ON_TIME" ? "border-emerald-500 bg-emerald-50 text-emerald-700 ring-2 ring-emerald-200" : "border-slate-100 bg-white text-slate-400"}`}
                                        >
                                            <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest">
                                                <CheckCircle2 size={16} /> Giao đúng hạn
                                            </div>
                                        </button>
                                        <button 
                                            onClick={() => setDeliveryStatus("LATE")}
                                            className={`py-4 border-2 rounded-2xl flex flex-col items-center gap-2 transition-all ${deliveryStatus === "LATE" ? "border-amber-500 bg-amber-50 text-amber-700 ring-2 ring-amber-200" : "border-slate-100 bg-white text-slate-400"}`}
                                        >
                                            <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest">
                                                <Clock size={16} /> Giao trễ
                                            </div>
                                        </button>
                                    </div>

                                    <div className="p-5 bg-erp-navy rounded-2xl text-white relative overflow-hidden">
                                        <div className="absolute -right-6 -bottom-6 opacity-10">
                                            <Star size={120} fill="currentColor" />
                                        </div>
                                        <div className="relative z-10">
                                            <div className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">
                                                Điểm đánh giá hệ thống
                                            </div>
                                            <div className="flex items-end gap-3">
                                                <span className="text-4xl font-black font-mono leading-none">{finalKpiScore}</span>
                                                <span className="text-xs font-bold text-slate-400 mb-1">/ 100 pt</span>
                                            </div>
                                            
                                            <div className="mt-4 space-y-2">
                                                <div className="flex justify-between items-center text-xs">
                                                    <span className="opacity-70">Khớp số lượng (70%)</span>
                                                    <span className="font-bold">{qtyScore.toFixed(0)} đ</span>
                                                </div>
                                                <div className="w-full h-1.5 bg-white/10 rounded-full">
                                                    <div className="h-full bg-emerald-400 rounded-full transition-all" style={{ width: `${qtyScore}%` }}></div>
                                                </div>
                                                
                                                <div className="flex justify-between items-center text-xs mt-3">
                                                    <span className="opacity-70">Thời gian giao hàng (30%)</span>
                                                    <span className="font-bold">{timeScore} đ</span>
                                                </div>
                                                <div className="w-full h-1.5 bg-white/10 rounded-full">
                                                    <div className={`h-full rounded-full transition-all ${timeScore === 100 ? "bg-emerald-400" : "bg-amber-400"}`} style={{ width: `${timeScore}%` }}></div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <button
                                onClick={handleConfirm}
                                disabled={isSaving}
                                className="w-full mt-10 btn-primary flex items-center justify-center gap-2 shadow-xl shadow-erp-blue/20"
                            >
                                {isSaving ? "Đang lưu và đánh giá..." : "Xác nhận & Cập nhật KPI NCC"} <ArrowRight size={18} />
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </main>
    );
}
