"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useProcurement } from "../../../context/ProcurementContext";
import {
    ChevronLeft, FileText, Calendar, Banknote, User, ShieldCheck,
    CheckCircle2, Clock, PenTool, Send, AlertCircle, Building2,
    ChevronRight, RotateCcw, Ban,
} from "lucide-react";
import { Contract } from "../../../types/api-types";
import ContractSignModal from "../../../components/ContractSignModal";

// ── Status config ─────────────────────────────────────────────────────────────
const STATUS_CFG: Record<string, { label: string; bg: string; text: string; border: string; dot: string }> = {
    ACTIVE:           { label: "Đang hiệu lực", bg: "bg-emerald-500/10", text: "text-emerald-400", border: "border-emerald-500/25", dot: "bg-emerald-400" },
    PENDING_SIGNATURE:{ label: "Chờ ký",         bg: "bg-amber-500/10",   text: "text-amber-400",   border: "border-amber-500/25",   dot: "bg-amber-400"   },
    DRAFT:            { label: "Bản nháp",        bg: "bg-slate-500/10",   text: "text-slate-400",   border: "border-slate-500/25",   dot: "bg-slate-400"   },
    EXPIRED:          { label: "Hết hạn",         bg: "bg-orange-500/10",  text: "text-orange-400",  border: "border-orange-500/25",  dot: "bg-orange-400"  },
    TERMINATED:       { label: "Đã chấm dứt",     bg: "bg-rose-500/10",    text: "text-rose-400",    border: "border-rose-500/25",    dot: "bg-rose-400"    },
    SUSPENDED:        { label: "Tạm dừng",        bg: "bg-purple-500/10",  text: "text-purple-400",  border: "border-purple-500/25",  dot: "bg-purple-400"  },
};

function StatusBadge({ status }: { status: string }) {
    const c = STATUS_CFG[status] || STATUS_CFG.DRAFT;
    return (
        <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-black uppercase tracking-wider border ${c.bg} ${c.text} ${c.border}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${c.dot}`} />
            {c.label}
        </span>
    );
}

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
    return (
        <div className="flex items-center justify-between py-2.5 border-b border-[rgba(148,163,184,0.06)] last:border-0">
            <span className="text-[11px] font-black uppercase tracking-widest text-[#64748B]">{label}</span>
            <span className="text-sm font-bold text-[#F8FAFC] text-right">{value}</span>
        </div>
    );
}

export default function ContractDetailPage() {
    const params   = useParams();
    const router   = useRouter();
    const { contracts, signContract, submitContractForApproval, terminateContract, currentUser } = useProcurement();

    const [contract, setContract]     = useState<Contract | null>(null);
    const [signTarget, setSignTarget] = useState<Contract | null>(null);
    const [saving, setSaving]         = useState(false);
    const [showTerminate, setShowTerminate] = useState(false);
    const [terminateReason, setTerminateReason] = useState("");

    useEffect(() => {
        if (params.id) {
            const found = contracts.find(c => c.id === params.id);
            if (found) setContract(found);
        }
    }, [params.id, contracts]);

    if (!contract) {
        return (
            <div className="p-6 flex items-center justify-center min-h-[50vh]">
                <div className="text-center text-[#64748B]">
                    <FileText size={40} className="mx-auto mb-3 opacity-20" />
                    <p className="font-bold text-[#F8FAFC]">Đang tải hợp đồng...</p>
                </div>
            </div>
        );
    }

    const isActive   = contract.status === "ACTIVE";
    const isDraft    = contract.status === "DRAFT";
    const isPending  = (contract.status as string) === "PENDING_SIGNATURE";
    const isTerminated = contract.status === "TERMINATED";

    const isBuyer    = currentUser?.role !== "SUPPLIER";
    const canSign    = isPending && (isBuyer ? !contract.buyerSignedAt : !contract.supplierSignedAt);
    const canSubmit  = isDraft && isBuyer;
    const canTerminate = (isActive || isPending) && isBuyer;

    const daysLeft = contract.endDate
        ? Math.ceil((new Date(contract.endDate).getTime() - Date.now()) / 86400000)
        : null;

    const handleSubmit = async () => {
        setSaving(true);
        try { await submitContractForApproval(contract.id); }
        finally { setSaving(false); }
    };

    const handleTerminate = async () => {
        if (!terminateReason.trim()) return;
        setSaving(true);
        try {
            await terminateContract(contract.id, terminateReason.trim());
            setShowTerminate(false);
            setTerminateReason("");
        } finally { setSaving(false); }
    };

    return (
        <main className="animate-in fade-in duration-500 p-6 min-h-screen bg-[#0F1117] text-[#F8FAFC]">

            {/* ── Back ── */}
            <button
                onClick={() => router.back()}
                className="flex items-center gap-2 text-[#64748B] hover:text-[#F8FAFC] transition-colors text-sm font-medium mb-6"
            >
                <ChevronLeft size={18} /> Quay lại danh sách
            </button>

            {/* ── Header card ── */}
            <div className="bg-[#161922] rounded-2xl border border-[rgba(148,163,184,0.08)] p-6 mb-6">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                    <div className="flex items-start gap-4">
                        <div className="w-12 h-12 rounded-xl bg-[#3B82F6]/10 border border-[#3B82F6]/20 flex items-center justify-center flex-shrink-0">
                            <FileText size={22} className="text-[#3B82F6]" />
                        </div>
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-[#64748B] mb-1">
                                MÃ HỢP ĐỒNG — <span className="font-mono text-[#3B82F6]">#{contract.contractNumber}</span>
                            </p>
                            <h1 className="text-xl font-black text-[#F8FAFC] leading-snug">{contract.title}</h1>
                            {contract.description && (
                                <p className="text-sm text-[#64748B] mt-1">{contract.description}</p>
                            )}
                        </div>
                    </div>

                    <div className="flex flex-col items-end gap-2 shrink-0">
                        <StatusBadge status={contract.status} />
                        {isActive && daysLeft !== null && daysLeft <= 30 && daysLeft > 0 && (
                            <span className="text-[10px] text-orange-400 font-bold">⚠ Còn {daysLeft} ngày</span>
                        )}
                        {isActive && daysLeft !== null && daysLeft <= 0 && (
                            <span className="text-[10px] text-rose-400 font-bold">⚠ Đã quá hạn</span>
                        )}
                    </div>
                </div>

                {/* Action buttons */}
                <div className="mt-5 pt-5 border-t border-[rgba(148,163,184,0.08)] flex flex-wrap gap-2">
                    {canSubmit && (
                        <button
                            onClick={handleSubmit}
                            disabled={saving}
                            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-black text-xs uppercase tracking-wider transition-all disabled:opacity-50"
                        >
                            <Send size={13} />
                            {saving ? "Đang gửi..." : "Gửi phê duyệt"}
                        </button>
                    )}
                    {canSign && (
                        <button
                            onClick={() => setSignTarget(contract)}
                            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-black text-xs uppercase tracking-wider transition-all"
                        >
                            <PenTool size={13} /> Ký hợp đồng
                        </button>
                    )}
                    {contract.status === "EXPIRED" && isBuyer && (
                        <button
                            onClick={() => router.push(`/procurement/contracts`)}
                            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-orange-500/10 hover:bg-orange-500/20 border border-orange-500/20 text-orange-400 font-black text-xs uppercase tracking-wider transition-all"
                        >
                            <RotateCcw size={13} /> Gia hạn
                        </button>
                    )}
                    {canTerminate && (
                        <button
                            onClick={() => setShowTerminate(true)}
                            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 text-rose-400 font-black text-xs uppercase tracking-wider transition-all"
                        >
                            <Ban size={13} /> Chấm dứt
                        </button>
                    )}
                </div>
            </div>

            {/* ── Body grid ── */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Left col: details + milestones */}
                <div className="lg:col-span-2 space-y-6">

                    {/* General info */}
                    <div className="bg-[#161922] rounded-2xl border border-[rgba(148,163,184,0.08)] p-6">
                        <h2 className="text-xs font-black uppercase tracking-widest text-[#64748B] mb-4 flex items-center gap-2">
                            <Building2 size={13} /> Thông tin chung
                        </h2>
                        <InfoRow label="Nhà cung cấp"    value={contract.supplier?.name || "—"} />
                        <InfoRow label="Loại hợp đồng"   value={String((contract as unknown as Record<string, unknown>).contractType ?? "PURCHASE")} />
                        <InfoRow label="Tiền tệ"         value={contract.currency} />
                        <InfoRow label="Ngày bắt đầu"    value={contract.startDate ? new Date(contract.startDate).toLocaleDateString("vi-VN") : "—"} />
                        <InfoRow label="Ngày kết thúc"   value={contract.endDate ? new Date(contract.endDate).toLocaleDateString("vi-VN") : "—"} />
                        <InfoRow label="Tự động gia hạn" value={(contract as unknown as Record<string, unknown>).autoRenew ? "Có" : "Không" as string} />
                    </div>

                    {/* Milestones */}
                    <div className="bg-[#161922] rounded-2xl border border-[rgba(148,163,184,0.08)] overflow-hidden">
                        <div className="px-6 py-4 border-b border-[rgba(148,163,184,0.08)] flex items-center gap-2">
                            <Banknote size={14} className="text-[#64748B]" />
                            <h2 className="text-xs font-black uppercase tracking-widest text-[#64748B]">Lộ trình thanh toán</h2>
                        </div>
                        {contract.milestones && contract.milestones.length > 0 ? (
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="bg-[#0F1117]">
                                        <th className="px-6 py-3 text-left text-[10px] font-black uppercase tracking-widest text-[#64748B]">Giai đoạn</th>
                                        <th className="px-6 py-3 text-left text-[10px] font-black uppercase tracking-widest text-[#64748B]">Ngày dự kiến</th>
                                        <th className="px-6 py-3 text-left text-[10px] font-black uppercase tracking-widest text-[#64748B]">Trạng thái</th>
                                        <th className="px-6 py-3 text-right text-[10px] font-black uppercase tracking-widest text-[#64748B]">Số tiền</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-[rgba(148,163,184,0.05)]">
                                    {contract.milestones.map(m => (
                                        <tr key={m.id} className="hover:bg-[#0F1117]/40 transition-colors">
                                            <td className="px-6 py-3 font-medium text-[#F8FAFC]">{m.title}</td>
                                            <td className="px-6 py-3 text-[#64748B]">
                                                <div className="flex items-center gap-1">
                                                    <Calendar size={12} />
                                                    {new Date(m.dueDate).toLocaleDateString("vi-VN")}
                                                </div>
                                            </td>
                                            <td className="px-6 py-3">
                                                <span className={`text-[10px] font-black px-2 py-0.5 rounded-md uppercase tracking-wider
                                                    ${m.status === "COMPLETED" ? "bg-emerald-500/10 text-emerald-400" :
                                                      m.status === "IN_PROGRESS" ? "bg-blue-500/10 text-blue-400" :
                                                      "bg-slate-500/10 text-slate-400"}`}>
                                                    {m.status === "COMPLETED" ? "Hoàn thành" : m.status === "IN_PROGRESS" ? "Đang thực hiện" : "Chờ"}
                                                </span>
                                            </td>
                                            <td className="px-6 py-3 text-right font-black text-[#F8FAFC] tabular-nums">
                                                {m.amount ? new Intl.NumberFormat("vi-VN").format(m.amount) : "—"}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        ) : (
                            <div className="px-6 py-8 text-center text-[#64748B] italic text-sm">
                                Thanh toán 100% khi nghiệm thu
                            </div>
                        )}
                    </div>

                    {/* Terms & Notes */}
                    {((contract as unknown as Record<string, unknown>).terms || contract.notes) && (
                        <div className="bg-[#161922] rounded-2xl border border-[rgba(148,163,184,0.08)] p-6 space-y-4">
                            {(contract as unknown as Record<string, unknown>).terms && (
                                <div>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-[#64748B] mb-2">Điều khoản hợp đồng</p>
                                    <p className="text-sm text-[#94A3B8] leading-relaxed whitespace-pre-wrap">{(contract as unknown as Record<string, unknown>).terms as string}</p>
                                </div>
                            )}
                            {contract.notes && (
                                <div>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-[#64748B] mb-2">Ghi chú</p>
                                    <p className="text-sm text-[#94A3B8] leading-relaxed whitespace-pre-wrap">{contract.notes}</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Right col: value + signatures */}
                <div className="space-y-6">

                    {/* Contract value */}
                    <div className="bg-[#161922] rounded-2xl border border-[rgba(148,163,184,0.08)] p-6">
                        <p className="text-[10px] font-black uppercase tracking-widest text-[#64748B] mb-3">Tổng giá trị hợp đồng</p>
                        <p className="text-3xl font-black text-[#3B82F6] tabular-nums">
                            {Number(contract.totalValue || 0).toLocaleString("vi-VN")}
                        </p>
                        <p className="text-sm text-[#64748B] mt-1">{contract.currency}</p>

                        {contract.startDate && contract.endDate && (
                            <div className="mt-4 pt-4 border-t border-[rgba(148,163,184,0.08)] flex items-center gap-2 text-xs text-[#64748B]">
                                <Calendar size={12} />
                                <span>{new Date(contract.startDate).toLocaleDateString("vi-VN")}</span>
                                <ChevronRight size={12} />
                                <span>{new Date(contract.endDate).toLocaleDateString("vi-VN")}</span>
                            </div>
                        )}
                    </div>

                    {/* Signature status */}
                    <div className="bg-[#161922] rounded-2xl border border-[rgba(148,163,184,0.08)] p-6">
                        <div className="flex items-center gap-2 mb-4">
                            <ShieldCheck size={14} className="text-[#64748B]" />
                            <p className="text-[10px] font-black uppercase tracking-widest text-[#64748B]">Trạng thái ký số</p>
                        </div>

                        <div className="space-y-4">
                            {/* Buyer signature */}
                            <div className="flex items-start gap-3">
                                <div className={`mt-0.5 w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${contract.buyerSignedAt ? "bg-emerald-500/10 border border-emerald-500/20" : "bg-[#0F1117] border border-[rgba(148,163,184,0.1)]"}`}>
                                    {contract.buyerSignedAt
                                        ? <CheckCircle2 size={14} className="text-emerald-400" />
                                        : <Clock size={14} className="text-[#64748B]" />}
                                </div>
                                <div>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-[#64748B]">Bên Mua (Buyer)</p>
                                    {contract.buyerSignedAt ? (
                                        <p className="text-xs text-emerald-400 font-medium mt-0.5">
                                            Đã ký: {new Date(contract.buyerSignedAt).toLocaleString("vi-VN")}
                                        </p>
                                    ) : (
                                        <p className="text-xs text-[#64748B] italic mt-0.5">Chưa ký</p>
                                    )}
                                </div>
                            </div>

                            {/* Supplier signature */}
                            <div className="flex items-start gap-3">
                                <div className={`mt-0.5 w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${contract.supplierSignedAt ? "bg-emerald-500/10 border border-emerald-500/20" : "bg-[#0F1117] border border-[rgba(148,163,184,0.1)]"}`}>
                                    {contract.supplierSignedAt
                                        ? <CheckCircle2 size={14} className="text-emerald-400" />
                                        : <Clock size={14} className="text-[#64748B]" />}
                                </div>
                                <div>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-[#64748B]">Bên Bán (Supplier)</p>
                                    {contract.supplierSignedAt ? (
                                        <p className="text-xs text-emerald-400 font-medium mt-0.5">
                                            Đã ký: {new Date(contract.supplierSignedAt).toLocaleString("vi-VN")}
                                        </p>
                                    ) : (
                                        <p className="text-xs text-[#64748B] italic mt-0.5">Chưa ký</p>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Sign button */}
                        {canSign && (
                            <button
                                onClick={() => setSignTarget(contract)}
                                className="mt-5 w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-black text-xs uppercase tracking-wider transition-all shadow-lg shadow-emerald-500/20"
                            >
                                <PenTool size={13} /> Ký xác nhận ngay
                            </button>
                        )}

                        {/* Info when not eligible to sign */}
                        {!canSign && isPending && (
                            <div className="mt-4 flex items-start gap-2 p-3 bg-amber-500/5 border border-amber-500/15 rounded-xl">
                                <AlertCircle size={14} className="text-amber-400 shrink-0 mt-0.5" />
                                <p className="text-xs text-amber-200/70">
                                    {isBuyer && contract.buyerSignedAt
                                        ? "Bạn đã ký. Đang chờ nhà cung cấp ký."
                                        : !isBuyer && contract.supplierSignedAt
                                        ? "Bạn đã ký. Đang chờ bên mua ký."
                                        : "Hợp đồng chưa được duyệt hoặc bạn không có quyền ký."}
                                </p>
                            </div>
                        )}

                        {isDraft && (
                            <div className="mt-4 flex items-start gap-2 p-3 bg-[#0F1117] border border-[rgba(148,163,184,0.08)] rounded-xl">
                                <AlertCircle size={14} className="text-[#64748B] shrink-0 mt-0.5" />
                                <p className="text-xs text-[#64748B]">Gửi hợp đồng để phê duyệt trước khi ký.</p>
                            </div>
                        )}

                        {isTerminated && (
                            <div className="mt-4 flex items-start gap-2 p-3 bg-rose-500/5 border border-rose-500/15 rounded-xl">
                                <Ban size={14} className="text-rose-400 shrink-0 mt-0.5" />
                                <p className="text-xs text-rose-200/70">Hợp đồng đã chấm dứt.</p>
                            </div>
                        )}
                    </div>

                    {/* User info */}
                    <div className="bg-[#161922] rounded-2xl border border-[rgba(148,163,184,0.08)] p-6">
                        <div className="flex items-center gap-2 mb-3">
                            <User size={13} className="text-[#64748B]" />
                            <p className="text-[10px] font-black uppercase tracking-widest text-[#64748B]">Người tạo</p>
                        </div>
                        <p className="text-sm text-[#F8FAFC] font-medium">
                            {currentUser?.fullName || currentUser?.name || currentUser?.email || "—"}
                        </p>
                        <p className="text-xs text-[#64748B] mt-1">
                            {contract.createdAt ? new Date(contract.createdAt).toLocaleDateString("vi-VN") : ""}
                        </p>
                    </div>
                </div>
            </div>

            {/* ── Terminate modal ── */}
            {showTerminate && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-[#0F1117]/80 backdrop-blur-sm" onClick={() => setShowTerminate(false)} />
                    <div className="relative w-full max-w-md bg-[#161922] rounded-2xl border border-rose-500/20 shadow-2xl p-6">
                        <div className="flex items-start gap-4 mb-5">
                            <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 flex-shrink-0">
                                <Ban size={18} />
                            </div>
                            <div>
                                <h3 className="font-black text-[#F8FAFC] mb-0.5">Chấm dứt hợp đồng</h3>
                                <p className="text-xs text-[#64748B] font-mono">#{contract.contractNumber}</p>
                            </div>
                        </div>
                        <div className="mb-5">
                            <label className="block text-[10px] font-black uppercase tracking-widest text-[#64748B] mb-2">Lý do chấm dứt *</label>
                            <textarea
                                rows={3}
                                placeholder="Nhập lý do chấm dứt hợp đồng..."
                                className="w-full px-3.5 py-2.5 bg-[#0F1117] border border-[rgba(148,163,184,0.12)] rounded-xl text-sm text-[#F8FAFC] placeholder:text-[#64748B] outline-none focus:border-[#3B82F6]/50 resize-none transition-all"
                                value={terminateReason}
                                onChange={e => setTerminateReason(e.target.value)}
                            />
                        </div>
                        <div className="flex gap-3 justify-end">
                            <button onClick={() => setShowTerminate(false)} className="px-5 py-2 rounded-xl bg-[#0F1117] border border-[rgba(148,163,184,0.1)] text-[#94A3B8] font-bold text-sm hover:bg-[#1A1D23] transition-all">Hủy</button>
                            <button
                                onClick={handleTerminate}
                                disabled={saving || !terminateReason.trim()}
                                className="px-5 py-2 rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-black text-sm transition-all disabled:opacity-50 flex items-center gap-2"
                            >
                                <Ban size={14} />
                                {saving ? "Đang xử lý..." : "Xác nhận chấm dứt"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Sign modal ── */}
            <ContractSignModal
                contract={signTarget}
                isBuyer={isBuyer}
                signerName={currentUser?.fullName || currentUser?.name || currentUser?.email || ""}
                onClose={() => setSignTarget(null)}
                onConfirm={signContract}
            />
        </main>
    );
}
