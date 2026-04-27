"use client";

import React, { useState } from "react";
import { Check, X, Eye, FileText, ShoppingCart, User, Landmark, History } from "lucide-react";
import { useProcurement } from "../../context/ProcurementContext";
import { formatVND } from "../../utils/formatUtils";

export default function POApprovalsPage() {
    const { notify } = useProcurement();
    const [rejectModal, setRejectModal] = useState<{ isOpen: boolean; poId: string | null }>({ isOpen: false, poId: null });
    const [reason, setReason] = useState("");

    // Mock data based on requirement
    const [pos, setPos] = useState([
        { 
            id: "PO-2026-002", 
            vendor: "ABC Supplier", 
            prId: "PR-2026-004", 
            total: 85000000, 
            budgetUsage: 3, 
            createdAt: "2026-04-03T10:00:00Z", 
            status: "WAITING_MANAGER" 
        }
    ]);

    const handleApprove = (id: string) => {
        setPos(prev => prev.filter(p => p.id !== id));
        notify(`Đã phê duyệt đơn hàng ${id}`, "success");
    };

    const handleReject = () => {
        if (!reason.trim()) {
            notify("Vui lòng nhập lý do từ chối", "error");
            return;
        }
        setPos(prev => prev.filter(p => p.id !== rejectModal.poId));
        notify(`Đã từ chối đơn hàng ${rejectModal.poId}`, "info");
        setRejectModal({ isOpen: false, poId: null });
        setReason("");
    };

    const getBudgetColor = (pct: number) => {
        if (pct < 70) return "text-black bg-emerald-500/10 border border-emerald-500/20";
        if (pct <= 90) return "text-black bg-amber-500/10 border border-amber-500/20";
        return "text-black bg-rose-500/10 border border-rose-500/20";
    };

    return (
        <main className="animate-in fade-in duration-500 p-6 min-h-screen bg-[#FFFFFF] text-[#000000]">
            <header className="mb-8">
                <h1 className="text-2xl font-black tracking-tight text-[#000000] mb-2 uppercase">PHÊ DUYỆT ĐƠN HÀNG (PO)</h1>
                <p className="text-[#000000] font-medium">Danh sách PO đang chờ bạn phê duyệt trước khi phát hành</p>
            </header>

            <div className="bg-[#FAF8F5] rounded-3xl border border-[rgba(148,163,184,0.1)] overflow-hidden shadow-xl shadow-[#B4533A]/5">
                <table className="erp-table text-xs">
                    <thead>
                        <tr className="bg-[#FFFFFF] border-b border-[rgba(148,163,184,0.1)]">
                            <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-[#000000]">Mã PO</th>
                            <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-[#000000]">Nhà cung cấp</th>
                            <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-[#000000]">Liên kết PR</th>
                            <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-[#000000]">Tổng tiền</th>
                            <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-[#000000]">% Ngân sách</th>
                            <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-[#000000]">Ngày tạo</th>
                            <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-[#000000] text-center">Thao tác</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-[rgba(148,163,184,0.1)]">
                        {pos.length > 0 ? (
                            pos.map((po) => (
                                <tr key={po.id} className="hover:bg-[#FFFFFF]/30 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="h-8 w-8 rounded-lg bg-[#B4533A]/10 flex items-center justify-center border border-[#B4533A]/20">
                                                <ShoppingCart size={14} className="text-[#B4533A]" />
                                            </div>
                                            <span className="font-bold text-[#000000]">{po.id}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 font-bold text-[#000000]">{po.vendor}</td>
                                    <td className="px-6 py-4">
                                        <span className="text-xs font-bold text-[#B4533A] underline decoration-[#B4533A]/30 cursor-pointer">{po.prId}</span>
                                    </td>
                                    <td className="px-6 py-4 font-black text-[#000000]">{formatVND(po.total)}</td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2 py-1 rounded-full text-[10px] font-black ${getBudgetColor(po.budgetUsage)}`}>
                                            {po.budgetUsage}% ngân sách
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-xs font-bold text-[#000000]">{new Date(po.createdAt).toLocaleDateString("vi-VN")}</td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center justify-center gap-2">
                                            <button onClick={() => handleApprove(po.id)} className="h-8 w-8 rounded-lg bg-emerald-500 text-[#000000] flex items-center justify-center hover:bg-emerald-600 transition-colors shadow-lg shadow-emerald-500/20">
                                                <Check size={16} />
                                            </button>
                                            <button onClick={() => setRejectModal({ isOpen: true, poId: po.id })} className="h-8 w-8 rounded-lg bg-rose-500 text-[#000000] flex items-center justify-center hover:bg-rose-600 transition-colors shadow-lg shadow-rose-500/20">
                                                <X size={16} />
                                            </button>
                                            <button className="h-8 w-8 rounded-lg bg-[#FFFFFF] text-[#000000] flex items-center justify-center hover:bg-[#FAF8F5] transition-colors border border-[rgba(148,163,184,0.1)]">
                                                <Eye size={16} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={7} className="px-6 py-12 text-center">
                                    <div className="flex flex-col items-center opacity-30">
                                        <History size={48} className="mb-4 text-[#000000]" />
                                        <p className="font-bold text-[#000000] uppercase tracking-widest text-xs">Không có PO nào chờ duyệt</p>
                                    </div>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Reject Modal */}
            {rejectModal.isOpen && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-[#FFFFFF]/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-[#FAF8F5] rounded-3xl w-full max-w-md p-8 shadow-2xl border border-[rgba(148,163,184,0.1)] animate-in zoom-in-95 duration-200">
                        <h2 className="text-xl font-black text-[#000000] mb-2 tracking-tight uppercase">TỪ CHỐI ĐƠN HÀNG</h2>
                        <p className="text-[#000000] text-sm mb-6 font-medium">Lý do từ chối sẽ được gửi đến bộ phận mua sắm</p>
                        
                        <textarea 
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            placeholder="Nhập lý do chi tiết..."
                            className="w-full h-32 bg-[#FFFFFF] border border-[rgba(148,163,184,0.1)] rounded-2xl p-4 text-sm font-medium text-[#000000] placeholder:text-[#000000] focus:ring-2 focus:ring-[#B4533A]/20 outline-none transition-all mb-6"
                        />

                        <div className="flex gap-3">
                            <button 
                                onClick={() => setRejectModal({ isOpen: false, poId: null })}
                                className="flex-1 py-3 font-black text-[#000000] uppercase tracking-widest text-[10px] hover:text-[#000000] transition-colors"
                            >
                                Hủy bỏ
                            </button>
                            <button 
                                onClick={handleReject}
                                className="flex-1 py-3 rounded-2xl bg-rose-500 text-[#000000] font-black uppercase tracking-widest text-[10px] shadow-lg shadow-rose-500/20 hover:bg-rose-600 transition-all active:scale-95"
                            >
                                Xác nhận từ chối
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </main>
    );
}

