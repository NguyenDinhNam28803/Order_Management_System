"use client";

import React, { useState } from "react";
import { Check, X, Eye, ShoppingCart } from "lucide-react";
import PageHeader from "../../components/shared/PageHeader";
import { useProcurement } from "../../context/ProcurementContext";
import { formatVND } from "../../utils/formatUtils";
import { DataTable, DataTableColumn } from "../../components/shared/DataTable";

type PendingPO = {
    id: string;
    vendor: string;
    prId: string;
    total: number;
    budgetUsage: number;
    createdAt: string;
    status: string;
};

export default function POApprovalsPage() {
    const { notify } = useProcurement();
    const [rejectModal, setRejectModal] = useState<{ isOpen: boolean; poId: string | null }>({ isOpen: false, poId: null });
    const [reason, setReason] = useState("");

    // Mock data based on requirement
    const [pos, setPos] = useState<PendingPO[]>([
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
        if (pct < 70) return "text-emerald-700 bg-emerald-500/10 border border-emerald-500/20";
        if (pct <= 90) return "text-amber-700 bg-amber-500/10 border border-amber-500/20";
        return "text-rose-700 bg-rose-500/10 border border-rose-500/20";
    };

    const columns: DataTableColumn<PendingPO>[] = [
        {
            label: "Mã PO",
            render: (po) => (
                <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-lg bg-[#2563EB]/10 flex items-center justify-center border border-[#2563EB]/20 shrink-0">
                        <ShoppingCart size={14} className="text-[#2563EB]" />
                    </div>
                    <span className="font-bold text-slate-900">{po.id}</span>
                </div>
            ),
        },
        { label: "Nhà cung cấp", render: (po) => <span className="font-bold text-slate-900">{po.vendor || 'N/A'}</span> },
        { label: "Liên kết PR", render: (po) => <span className="text-xs font-bold text-[#2563EB] underline decoration-[#2563EB]/30 cursor-pointer">{po.prId}</span> },
        { label: "Tổng tiền", align: "right", render: (po) => <span className="font-black text-slate-900 num-display">{formatVND(po.total)}</span> },
        {
            label: "% Ngân sách",
            render: (po) => <span className={`px-2 py-1 rounded-full text-[10px] font-black ${getBudgetColor(po.budgetUsage)}`}>{po.budgetUsage}% ngân sách</span>,
        },
        { label: "Ngày tạo", hideOnMobile: true, render: (po) => <span className="text-xs font-bold text-slate-900 num-display">{new Date(po.createdAt).toLocaleDateString("vi-VN")}</span> },
        {
            label: "Thao tác", align: "center",
            render: (po) => (
                <div className="flex items-center justify-center gap-2">
                    <button onClick={() => handleApprove(po.id)} className="h-8 w-8 rounded-lg bg-emerald-500 text-white flex items-center justify-center hover:bg-emerald-600 transition-colors shadow-lg shadow-emerald-500/20" title="Phê duyệt">
                        <Check size={16} />
                    </button>
                    <button onClick={() => setRejectModal({ isOpen: true, poId: po.id })} className="h-8 w-8 rounded-lg bg-rose-500 text-white flex items-center justify-center hover:bg-rose-600 transition-colors shadow-lg shadow-rose-500/20" title="Từ chối">
                        <X size={16} />
                    </button>
                    <button className="h-8 w-8 rounded-lg bg-white text-slate-900 flex items-center justify-center hover:bg-[#F1F5F9] transition-colors border border-slate-200" title="Xem">
                        <Eye size={16} />
                    </button>
                </div>
            ),
        },
    ];

    return (
        <main className="animate-in fade-in duration-500 p-6 min-h-screen bg-[#F8FAFC] text-slate-900">
            <header>
                <PageHeader
                    icon={ShoppingCart}
                    iconColor="blue"
                    title="Phê duyệt đơn hàng (PO)"
                    subtitle="Danh sách PO đang chờ bạn phê duyệt trước khi phát hành."
                />
            </header>

            <div className="erp-card table-card p-4">
                <DataTable
                    columns={columns}
                    data={pos}
                    pageSize={10}
                    getRowKey={(po) => po.id}
                    emptyMessage="Không có PO nào chờ duyệt"
                    emptyDescription="Các đơn hàng chờ phê duyệt sẽ xuất hiện tại đây"
                />
            </div>

            {/* Reject Modal */}
            {rejectModal.isOpen && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-[#FFFFFF]/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-[#F1F5F9] rounded-xl w-full max-w-md p-8 shadow-2xl border border-slate-200 animate-in zoom-in-95 duration-200">
                        <h2 className="text-xl font-black text-slate-900 mb-2 tracking-tight uppercase">TỪ CHỐI ĐƠN HÀNG</h2>
                        <p className="text-slate-900 text-sm mb-6 font-medium">Lý do từ chối sẽ được gửi đến bộ phận mua sắm</p>
                        
                        <textarea 
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            placeholder="Nhập lý do chi tiết..."
                            className="w-full h-32 bg-[#FFFFFF] border border-slate-200 rounded-xl p-4 text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-[#2563EB]/20 outline-none transition-all mb-6"
                        />

                        <div className="flex gap-3">
                            <button 
                                onClick={() => setRejectModal({ isOpen: false, poId: null })}
                                className="flex-1 py-3 font-black text-slate-900 uppercase tracking-widest text-[10px] hover:text-slate-900 transition-colors"
                            >
                                Hủy bỏ
                            </button>
                            <button 
                                onClick={handleReject}
                                className="flex-1 py-3 rounded-2xl bg-rose-500 text-white font-black uppercase tracking-widest text-[10px] shadow-lg shadow-rose-500/20 hover:bg-rose-600 transition-all active:scale-95"
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

