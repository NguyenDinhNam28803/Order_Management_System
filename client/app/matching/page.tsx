"use client";

import React, { useState } from "react";
import { ShieldAlert, CheckCircle2, XCircle, ArrowRight, Lock, FileCheck, Info } from "lucide-react";
import { useProcurement } from "../context/ProcurementContext";
import { useRouter } from "next/navigation";

export default function MatchingPage() {
    const { pos } = useProcurement();
    const router = useRouter();
    
    console.log(pos);
    // Find PO that is COMMITTED (simulating that it's been received but not paid)
    const activePO = pos.find((p) => p.status === "MATCHING");

    const [disputeResolved, setDisputeResolved] = useState(false);

    const handleApproveMatch = () => {
        if (!activePO) return;
        
        router.push("/payments");
    };

    return (
        <main className="animate-in fade-in duration-500 p-6 min-h-screen bg-[#0F1117] text-[#F8FAFC]">
            <div className="mt-8 mb-8 flex justify-between items-end">
                <div>
                    <h1 className="text-3xl font-black text-[#F8FAFC] tracking-tight">Đối soát 3 bên (3-Way Match)</h1>
                    <p className="text-sm text-[#94A3B8] mt-1">Hệ thống tự động đối chiếu dữ liệu giữa PO, Nhập kho và Hóa đơn.</p>
                </div>
            </div>

            {!activePO ? (
                <div className="erp-card bg-slate-50 border-dashed py-32 text-center text-slate-400">
                    <FileCheck size={48} className="mx-auto mb-4 opacity-10" />
                    <p className="text-xs font-black uppercase tracking-widest">Không có đơn hàng nào cần đối soát tại thời điểm này</p>
                </div>
            ) : (
                <div className="space-y-8 animate-in fade-in slide-in-from-top duration-500">
                    {/* --- Alert Banner --- */}
                    {!disputeResolved && (
                        <div className="bg-red-50 border border-red-100 rounded-3xl p-8 flex items-start gap-6 animate-pulse shadow-sm shadow-red-100">
                            <div className="h-14 w-14 bg-red-100 text-red-600 rounded-2xl flex items-center justify-center shrink-0">
                                <ShieldAlert size={30} />
                            </div>
                            <div className="grow">
                                <h4 className="text-sm font-black text-red-800 uppercase tracking-widest mb-1">Cảnh báo: Lệch số lượng mực in!</h4>
                                <p className="text-xs text-red-700 font-medium leading-relaxed">
                                    Hóa đơn Nhà cung cấp (Invoice) yêu cầu: <span className="font-black underline">50 Thùng</span>.
                                    <br />
                                    Thực tế nhập kho (GRN) chỉ ghi nhận: <span className="font-black underline">42 Thùng</span>.
                                    <br /><br />
                                    <span className="bg-red-600 text-white px-2 py-0.5 rounded text-[9px] font-black uppercase">Chặn thanh toán</span>: Hệ thống đã tự động khóa thanh toán cho đơn hàng này.
                                </p>
                            </div>
                            <button
                                onClick={() => setDisputeResolved(true)}
                                className="bg-white text-red-600 border border-red-200 px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-red-600 hover:text-white transition-all shadow-sm"
                            >
                                Giải quyết tranh chấp (Admin)
                            </button>
                        </div>
                    )}

                    <div className="erp-card p-0! overflow-hidden">
                        <div className="p-6 border-b border-slate-50 flex justify-between items-center bg-slate-50/30">
                            <div>
                                <h3 className="text-sm font-black uppercase tracking-widest text-erp-navy">Kết quả đối soát: {activePO.id}</h3>
                                <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase">Vendor: {activePO.vendor}</p>
                            </div>
                            <div className="flex items-center gap-2">
                                <Info size={14} className="text-slate-300" />
                                <span className="text-[10px] font-black uppercase text-slate-400">Dung sai cho phép: 2%</span>
                            </div>
                        </div>
                        <table className="erp-table">
                            <thead>
                                <tr>
                                    <th>Hạng mục</th>
                                    <th className="text-center bg-slate-50/50">SL PO (Đặt)</th>
                                    <th className="text-center bg-blue-50/50">SL GRN (Nhận)</th>
                                    <th className="text-center bg-indigo-50/50">SL Invoice (HD)</th>
                                    <th className="text-right">Kết quả</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td className="p-6 font-bold text-erp-navy">Vải Cotton 100% (Trắng)</td>
                                    <td className="p-6 text-center ">500</td>
                                    <td className="p-6 text-center  font-black text-emerald-600">500</td>
                                    <td className="p-6 text-center  font-black text-emerald-600">500</td>
                                    <td className="p-6 text-right"><span className="status-pill status-approved">Khớp 100%</span></td>
                                </tr>
                                <tr>
                                    <td className="p-6 font-bold text-erp-navy">Mực in lụa (Thùng 20L)</td>
                                    <td className="p-6 text-center ">50</td>
                                    <td className="p-6 text-center  font-black text-red-600 bg-red-50/30">42</td>
                                    <td className="p-6 text-center  font-black text-red-600 bg-red-50/30 animate-pulse">50</td>
                                    <td className="p-6 text-right"><span className="status-pill status-rejected">Bất thường</span></td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    <div className="flex justify-between items-center">
                        <div className="flex gap-4">
                            <div className="erp-card !p-4 border-dashed bg-slate-50/50 flex items-center gap-3">
                                <Lock size={16} className="text-slate-400" />
                                <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Ngân sách đang khóa: <span className="text-erp-navy">{(activePO.total ?? activePO.totalAmount ?? 0).toLocaleString()} ₫</span></span>
                            </div>
                        </div>
                        <div className="flex gap-3">
                            <button className="btn-secondary text-red-600 border-red-50 hover:bg-red-50 flex gap-2 items-center">
                                <XCircle size={18} /> Từ chối bộ chứng từ
                            </button>
                            <button
                                onClick={handleApproveMatch}
                                disabled={!disputeResolved}
                                className={`btn-primary flex gap-2 items-center ${!disputeResolved ? 'opacity-30 cursor-not-allowed grayscale' : ''}`}
                            >
                                <CheckCircle2 size={18} /> Giải ngân thanh toán <ArrowRight size={18} />
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </main>
    );
}
