"use client";

import React, { useState, useMemo } from "react";
import { useProcurement } from "../../context/ProcurementContext";
import {
    FileText, Eye, CheckCircle2, Clock, Search, Plus, AlertCircle,
    Calendar, Building2, PenTool, Trash2, Pencil, Send, X,
    ShieldCheck, TrendingUp, RotateCcw, ChevronRight, Ban,
} from "lucide-react";
import Link from "next/link";
import { ContractStatus, CurrencyCode, Contract } from "../../types/api-types";
import { Organization } from "../../context/ProcurementContext";
import ContractSignModal from "../../components/ContractSignModal";
import DateInput from "../../components/shared/DateInput";

// ── Status config ─────────────────────────────────────────────────────────────
const STATUS_CFG: Record<string, { label: string; bg: string; text: string; border: string; dot: string }> = {
    ACTIVE: { label: "Đang hiệu lực", bg: "bg-emerald-500/10", text: "text-black", border: "border-emerald-500/25", dot: "bg-emerald-400" },
    PENDING_APPROVAL: { label: "Chờ duyệt", bg: "bg-amber-500/10", text: "text-black", border: "border-amber-500/25", dot: "bg-amber-400" },
    DRAFT: { label: "Bản nháp", bg: "bg-slate-500/10", text: "text-black", border: "border-slate-500/25", dot: "bg-slate-400" },
    EXPIRED: { label: "Hết hạn", bg: "bg-orange-500/10", text: "text-black", border: "border-orange-500/25", dot: "bg-orange-400" },
    TERMINATED: { label: "Đã chấm dứt", bg: "bg-rose-500/10", text: "text-black", border: "border-rose-500/25", dot: "bg-rose-400" },
};

function StatusBadge({ status }: { status: string }) {
    const c = STATUS_CFG[status] || STATUS_CFG.DRAFT;
    return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider border ${c.bg} ${c.text} ${c.border}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${c.dot}`} />
            {c.label}
        </span>
    );
}

// ── Empty form ────────────────────────────────────────────────────────────────
const EMPTY: Partial<Contract> = {
    title: "", supplierId: "", totalValue: 0, currency: CurrencyCode.VND,
    startDate: "", endDate: "", description: "", notes: "",
};

// ── Main page ─────────────────────────────────────────────────────────────────
export default function ContractsPage() {
    const {
        contracts, organizations,
        createContract, updateContract, removeContract,
        submitContractForApproval, terminateContract, signContract,
        currentUser,
    } = useProcurement();

    const [search, setSearch] = useState("");
    const [statusFilter, setStatus] = useState("ALL");
    const [modal, setModal] = useState<"create" | "edit" | "delete" | "approve" | "terminate" | null>(null);
    const [editing, setEditing] = useState<Contract | null>(null);
    const [deleteId, setDeleteId] = useState<string | null>(null);
    const [approveTarget, setApprove] = useState<Contract | null>(null);
    const [terminateTarget, setTerminate] = useState<Contract | null>(null);
    const [terminateReason, setTerminateReason] = useState("");
    const [signTarget, setSignTarget] = useState<Contract | null>(null);
    const [saving, setSaving] = useState(false);
    const [form, setForm] = useState<Partial<Contract>>({ ...EMPTY });


    // ── Derived ──────────────────────────────────────────────────────────────
    const suppliers = useMemo(
        () => (organizations || []).filter((o: Organization) => o.companyType === "SUPPLIER"),
        [organizations]
    );

    const filtered = useMemo(() => contracts.filter(c => {
        const matchSearch =
            c.contractNumber?.toLowerCase().includes(search.toLowerCase()) ||
            c.title?.toLowerCase().includes(search.toLowerCase()) ||
            c.supplier?.name?.toLowerCase().includes(search.toLowerCase());
        const matchStatus = statusFilter === "ALL" || c.status === statusFilter;
        return matchSearch && matchStatus;
    }), [contracts, search, statusFilter]);

    const stats = useMemo(() => ({
        total: contracts.length,
        active: contracts.filter(c => c.status === "ACTIVE").length,
        pending: contracts.filter(c => c.status === "PENDING_APPROVAL").length,
        expired: contracts.filter(c => c.status === "EXPIRED").length,
        totalValue: contracts
            .filter(c => c.status === "ACTIVE")
            .reduce((s, c) => s + Number(c.totalValue || 0), 0),
    }), [contracts]);

    // ── Helpers ───────────────────────────────────────────────────────────────
    const closeModal = () => { setModal(null); setEditing(null); setDeleteId(null); setApprove(null); setTerminate(null); setTerminateReason(""); };

    const openCreate = () => { setForm({ ...EMPTY }); setEditing(null); setModal("create"); };
    const openEdit = (c: Contract) => {
        setForm({
            title: c.title, supplierId: c.supplierId, totalValue: c.totalValue,
            currency: c.currency, startDate: c.startDate?.slice(0, 10),
            endDate: c.endDate?.slice(0, 10), description: c.description, notes: c.notes,
        });
        setEditing(c);
        setModal("edit");
    };
    const openDelete = (id: string) => { setDeleteId(id); setModal("delete"); };
    const openApprove = (c: Contract) => { setApprove(c); setModal("approve"); };

    const handleSave = async () => {
        setSaving(true);
        try {
            if (modal === "create") await createContract(form);
            else if (modal === "edit" && editing) await updateContract(editing.id, form);
            closeModal();
        } finally { setSaving(false); }
    };

    const handleDelete = async () => {
        if (!deleteId) return;
        setSaving(true);
        try { await removeContract(deleteId); closeModal(); }
        finally { setSaving(false); }
    };

    const handleApprove = async () => {
        if (!approveTarget) return;
        setSaving(true);
        try { await submitContractForApproval(approveTarget.id); closeModal(); }
        finally { setSaving(false); }
    };

    const handleTerminate = async () => {
        if (!terminateTarget || !terminateReason.trim()) return;
        setSaving(true);
        try { await terminateContract(terminateTarget.id, terminateReason.trim()); closeModal(); }
        finally { setSaving(false); }
    };

    const setField = (k: keyof Contract, v: unknown) => setForm(f => ({ ...f, [k]: v }));

    const formValid = !!(form.title && form.supplierId && form.startDate && form.endDate);

    // ── Render ────────────────────────────────────────────────────────────────
    return (
        <main className="animate-in fade-in duration-500 p-6 min-h-screen bg-[#FFFFFF] text-[#000000]">

            {/* ── Header ── */}
            <div className="mt-4 mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <div className="flex items-center gap-3 mb-1">
                        <div className="w-8 h-8 rounded-lg bg-[#B4533A]/10 border border-[#B4533A]/20 flex items-center justify-center">
                            <FileText size={16} className="text-[#B4533A]" />
                        </div>
                        <h1 className="text-2xl font-black tracking-tight">Quản lý Hợp đồng</h1>
                    </div>
                    <p className="text-sm text-[#000000] font-medium ml-11">
                        Quản lý và theo dõi các thỏa thuận thu mua với nhà cung cấp
                    </p>
                </div>
                <button
                    onClick={openCreate}
                    className="flex items-center gap-2 bg-[#B4533A] hover:bg-[#A85032] text-[#000000] px-5 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider shadow-lg shadow-[#B4533A]/20 transition-all"
                >
                    <Plus size={16} /> Tạo hợp đồng mới
                </button>
            </div>

            {/* ── Stats ── */}
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
                {[
                    { label: "Tổng hợp đồng", value: stats.total, icon: FileText, color: "bg-[#B4533A]/10 text-[#B4533A]" },
                    { label: "Đang hiệu lực", value: stats.active, icon: CheckCircle2, color: "bg-emerald-500/10 text-black" },
                    { label: "Chờ duyệt", value: stats.pending, icon: Clock, color: "bg-amber-500/10 text-black" },
                    { label: "Hết hạn", value: stats.expired, icon: AlertCircle, color: "bg-orange-500/10 text-black" },
                    { label: "Tổng giá trị HĐ", value: `${(stats.totalValue / 1e6).toFixed(1)}M ₫`, icon: TrendingUp, color: "bg-purple-500/10 text-black" },
                ].map(({ label, value, icon: Icon, color }) => (
                    <div key={label} className="bg-[#FAF8F5] rounded-xl p-4 border border-[rgba(148,163,184,0.08)] flex items-center gap-3">
                        <div className={`h-10 w-10 rounded-xl flex items-center justify-center flex-shrink-0 ${color}`}>
                            <Icon size={18} />
                        </div>
                        <div className="min-w-0">
                            <p className="text-[10px] font-black uppercase tracking-widest text-[#000000] truncate">{label}</p>
                            <p className="text-lg font-black text-[#000000] truncate">{value}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* ── Toolbar ── */}
            <div className="bg-[#FAF8F5] rounded-xl border border-[rgba(148,163,184,0.08)] p-4 mb-6 flex flex-col md:flex-row gap-3">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#000000]" size={16} />
                    <input
                        type="text"
                        placeholder="Tìm số hợp đồng, tiêu đề, nhà cung cấp..."
                        className="w-full pl-10 pr-4 py-2.5 bg-[#FFFFFF] border border-[rgba(148,163,184,0.1)] rounded-xl text-sm font-medium text-[#000000] placeholder:text-[#000000] focus:outline-none focus:border-[#B4533A]/50 transition-all"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                    />
                </div>
                <div className="flex gap-1 bg-[#FFFFFF] border border-[rgba(148,163,184,0.08)] rounded-xl p-1">
                    {[
                        { k: "ALL", l: "Tất cả" },
                        { k: "DRAFT", l: "Nháp" },
                        { k: "PENDING_APPROVAL", l: "Chờ duyệt" },
                        { k: "ACTIVE", l: "Hiệu lực" },
                        { k: "EXPIRED", l: "Hết hạn" },
                    ].map(({ k, l }) => (
                        <button
                            key={k}
                            onClick={() => setStatus(k)}
                            className={`px-3 py-1.5 rounded-lg text-[11px] font-black uppercase tracking-wider whitespace-nowrap transition-all ${statusFilter === k
                                ? "bg-[#B4533A] text-[#000000] shadow"
                                : "text-[#000000] hover:text-[#000000]"
                                }`}
                        >
                            {l}
                        </button>
                    ))}
                </div>
            </div>

            {/* ── Table ── */}
            <div className="bg-[#FAF8F5] rounded-2xl border border-[rgba(148,163,184,0.08)] overflow-hidden">
                {filtered.length === 0 ? (
                    <div className="py-24 flex flex-col items-center gap-4 text-[#000000]">
                        <FileText size={40} className="opacity-20" />
                        <div className="text-center">
                            <p className="font-bold text-[#000000] text-sm">Không có hợp đồng nào</p>
                            <p className="text-xs mt-1">
                                {search || statusFilter !== "ALL"
                                    ? "Thử điều chỉnh bộ lọc hoặc từ khóa tìm kiếm"
                                    : "Nhấn 'Tạo hợp đồng mới' để bắt đầu"}
                            </p>
                        </div>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-[rgba(148,163,184,0.08)] bg-[#FFFFFF]">
                                    {["Số hợp đồng", "Tiêu đề / Đối tác", "Giá trị", "Thời hạn", "Trạng thái", ""].map((h, i) => (
                                        <th key={i} className={`px-5 py-4 text-[10px] font-black uppercase tracking-widest text-[#000000] ${i >= 5 ? "text-right" : "text-left"}`}>
                                            {h}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[rgba(148,163,184,0.05)]">
                                {filtered.map(c => {
                                    const isActive = c.status === "ACTIVE";
                                    const isDraft = c.status === "DRAFT";
                                    const isPending = c.status === "PENDING_APPROVAL";
                                    const canSign = isPending && currentUser?.role !== "SUPPLIER"
                                        ? !c.buyerSignedAt
                                        : isPending && currentUser?.role === "SUPPLIER"
                                            ? !c.supplierSignedAt
                                            : false;

                                    return (
                                        <tr key={c.id} className="group hover:bg-[#FFFFFF]/60 transition-colors">
                                            {/* Số HĐ */}
                                            <td className="px-5 py-4">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-8 h-8 rounded-lg bg-[#B4533A]/10 border border-[#B4533A]/20 flex items-center justify-center flex-shrink-0">
                                                        <FileText size={14} className="text-[#B4533A]" />
                                                    </div>
                                                    <span className="font-black text-[#B4533A] font-mono text-xs">
                                                        #{c.contractNumber}
                                                    </span>
                                                </div>
                                            </td>

                                            {/* Tiêu đề */}
                                            <td className="px-5 py-4 max-w-[220px]">
                                                <p className="font-bold text-[#000000] truncate">{c.title}</p>
                                                <div className="flex items-center gap-1 text-[11px] text-[#000000] mt-0.5">
                                                    <Building2 size={11} />
                                                    <span className="truncate">{c.supplier?.name || "—"}</span>
                                                </div>
                                            </td>

                                            {/* Giá trị */}
                                            <td className="px-5 py-4">
                                                <p className="font-black text-[#000000] tabular-nums">
                                                    {Number(c.totalValue || 0).toLocaleString("vi-VN")}
                                                </p>
                                                <p className="text-[10px] text-[#000000]">{c.currency}</p>
                                            </td>

                                            {/* Thời hạn */}
                                            <td className="px-5 py-4">
                                                {c.startDate ? (
                                                    <div className="flex items-center gap-2 text-[11px]">
                                                        <Calendar size={12} className="text-[#000000] flex-shrink-0" />
                                                        <div>
                                                            <p className="text-[#000000] font-bold">
                                                                {new Date(c.startDate).toLocaleDateString("vi-VN")}
                                                            </p>
                                                            <p className="text-[#000000] flex items-center gap-1">
                                                                <ChevronRight size={10} />
                                                                {c.endDate ? new Date(c.endDate).toLocaleDateString("vi-VN") : "—"}
                                                            </p>
                                                        </div>
                                                    </div>
                                                ) : <span className="text-[#000000] italic text-xs">Chưa xác định</span>}
                                            </td>

                                            {/* Trạng thái */}
                                            <td className="px-5 py-4">
                                                <StatusBadge status={c.status} />
                                                {isActive && c.endDate && (() => {
                                                    const days = Math.ceil((new Date(c.endDate).getTime() - Date.now()) / 86400000);
                                                    return days <= 30 && days > 0 ? (
                                                        <p className="text-[10px] text-black font-bold mt-1">⚠ Còn {days} ngày</p>
                                                    ) : null;
                                                })()}
                                            </td>

                                            {/* Actions */}
                                            <td className="px-5 py-4">
                                                <div className="flex items-center justify-end gap-1">
                                                    {/* View */}
                                                    <Link
                                                        href={`/procurement/contracts/${c.id}`}
                                                        className="p-2 rounded-lg text-[#000000] hover:text-[#B4533A] hover:bg-[#B4533A]/10 transition-all"
                                                        title="Xem chi tiết"
                                                    >
                                                        <Eye size={15} />
                                                    </Link>

                                                    {/* Ký hợp đồng */}
                                                    {canSign && (
                                                        <button
                                                            onClick={() => setSignTarget(c)}
                                                            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[10px] font-black text-black bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 transition-all"
                                                            title="Ký hợp đồng"
                                                        >
                                                            <PenTool size={12} /> Ký
                                                        </button>
                                                    )}

                                                    {/* Gửi duyệt (DRAFT only) */}
                                                    {isDraft && (
                                                        <button
                                                            onClick={() => openApprove(c)}
                                                            className="p-2 rounded-lg text-[#000000] hover:text-black hover:bg-amber-500/10 transition-all"
                                                            title="Gửi phê duyệt"
                                                        >
                                                            <Send size={15} />
                                                        </button>
                                                    )}

                                                    {/* Edit (DRAFT only) */}
                                                    {isDraft && (
                                                        <button
                                                            onClick={() => openEdit(c)}
                                                            className="p-2 rounded-lg text-[#000000] hover:text-black hover:bg-amber-500/10 transition-all"
                                                            title="Chỉnh sửa"
                                                        >
                                                            <Pencil size={15} />
                                                        </button>
                                                    )}

                                                    {/* Delete (DRAFT only) */}
                                                    {isDraft && (
                                                        <button
                                                            onClick={() => openDelete(c.id)}
                                                            className="p-2 rounded-lg text-[#000000] hover:text-black hover:bg-rose-500/10 transition-all"
                                                            title="Xóa hợp đồng"
                                                        >
                                                            <Trash2 size={15} />
                                                        </button>
                                                    )}

                                                    {/* Chấm dứt (ACTIVE only) */}
                                                    {isActive && (
                                                        <button
                                                            onClick={() => { setTerminate(c); setModal("terminate"); }}
                                                            className="p-2 rounded-lg text-[#000000] hover:text-black hover:bg-rose-500/10 transition-all"
                                                            title="Chấm dứt hợp đồng"
                                                        >
                                                            <Ban size={15} />
                                                        </button>
                                                    )}

                                                    {/* Gia hạn (EXPIRED) */}
                                                    {c.status === "EXPIRED" && (
                                                        <button
                                                            onClick={() => openEdit(c)}
                                                            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[10px] font-black text-black bg-orange-500/10 hover:bg-orange-500/20 border border-orange-500/20 transition-all"
                                                            title="Gia hạn hợp đồng"
                                                        >
                                                            <RotateCcw size={12} /> Gia hạn
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
                {filtered.length > 0 && (
                    <div className="px-5 py-3 border-t border-[rgba(148,163,184,0.08)] flex justify-between items-center">
                        <p className="text-[11px] text-[#000000]">
                            Hiển thị <span className="text-[#000000] font-bold">{filtered.length}</span> / {contracts.length} hợp đồng
                        </p>
                    </div>
                )}
            </div>

            {/* ── Modals ── */}

            {/* Create / Edit Modal */}
            {(modal === "create" || modal === "edit") && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 pointer-events-none">
                    <div className="absolute inset-0 bg-[#FFFFFF]/60 backdrop-blur-md pointer-events-auto" onClick={closeModal} />
                    <div className="relative w-full max-w-2xl bg-[#FAF8F5] rounded-[2rem] border border-[rgba(148,163,184,0.1)] shadow-[0_20px_50px_rgba(0,0,0,0.1)] max-h-[90vh] flex flex-col pointer-events-auto animate-in zoom-in-95 duration-200">
                        {/* Header */}
                        <div className="px-8 py-6 border-b border-[rgba(148,163,184,0.08)] bg-[#FFFFFF] rounded-t-[2rem] flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="w-11 h-11 rounded-2xl bg-[#B4533A]/10 border border-[#B4533A]/20 flex items-center justify-center text-[#B4533A]">
                                    <FileText size={20} />
                                </div>
                                <div>
                                    <h2 className="text-lg font-black text-[#000000] tracking-tight">
                                        {modal === "create" ? "Tạo hợp đồng mới" : "Chỉnh sửa hợp đồng"}
                                    </h2>
                                    <p className="text-xs font-bold text-[#000000] opacity-60 uppercase tracking-widest">
                                        {modal === "edit" ? `#${editing?.contractNumber}` : "Điền đầy đủ thông tin hợp đồng"}
                                    </p>
                                </div>
                            </div>
                            <button onClick={closeModal} className="w-10 h-10 flex items-center justify-center text-[#000000] hover:bg-[rgba(148,163,184,0.08)] rounded-xl transition-all">
                                <X size={20} />
                            </button>
                        </div>

                        {/* Body */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-5">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <FormField label="Tiêu đề hợp đồng *" colSpan={2}>
                                    <input
                                        type="text"
                                        placeholder="VD: Hợp đồng cung cấp văn phòng phẩm Q2-2026"
                                        className="modal-input"
                                        value={form.title || ""}
                                        onChange={e => setField("title", e.target.value)}
                                    />
                                </FormField>

                                <FormField label="Nhà cung cấp *">
                                    <select className="modal-input" value={form.supplierId || ""} onChange={e => setField("supplierId", e.target.value)}>
                                        <option value="">— Chọn nhà cung cấp —</option>
                                        {suppliers.map((o: Organization) => (
                                            <option key={o.id} value={o.id}>{o.name}</option>
                                        ))}
                                    </select>
                                </FormField>

                                <FormField label="Giá trị hợp đồng (₫)">
                                    <input
                                        type="text"
                                        placeholder="0"
                                        className="modal-input font-bold"
                                        value={form.totalValue ? Number(form.totalValue).toLocaleString('en-US') : ""}
                                        onChange={e => {
                                            const raw = e.target.value.replace(/,/g, "");
                                            if (!isNaN(Number(raw)) || raw === "") {
                                                setField("totalValue", raw === "" ? 0 : Number(raw));
                                            }
                                        }}
                                    />
                                </FormField>

                                <FormField label="Ngày bắt đầu *">
                                    <DateInput
                                        value={(form.startDate as string) || ""}
                                        onChange={val => setField("startDate", val)}
                                        className="modal-input"
                                        required
                                    />
                                </FormField>

                                <FormField label="Ngày kết thúc *">
                                    <DateInput
                                        value={(form.endDate as string) || ""}
                                        onChange={val => setField("endDate", val)}
                                        className="modal-input"
                                        required
                                    />
                                </FormField>

                                <FormField label="Mô tả" colSpan={2}>
                                    <textarea
                                        rows={3}
                                        placeholder="Mô tả ngắn về hợp đồng..."
                                        className="modal-input resize-none"
                                        value={form.description || ""}
                                        onChange={e => setField("description", e.target.value)}
                                    />
                                </FormField>

                                <FormField label="Điều khoản" colSpan={2}>
                                    <textarea
                                        rows={3}
                                        placeholder="Các điều khoản và điều kiện của hợp đồng..."
                                        className="modal-input resize-none"
                                        value={(form as Record<string, unknown>).terms as string || ""}
                                        onChange={e => setField("terms" as keyof Contract, e.target.value)}
                                    />
                                </FormField>

                                <FormField label="Ghi chú" colSpan={2}>
                                    <textarea
                                        rows={2}
                                        placeholder="Ghi chú thêm..."
                                        className="modal-input resize-none"
                                        value={form.notes || ""}
                                        onChange={e => setField("notes", e.target.value)}
                                    />
                                </FormField>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="px-8 py-6 border-t border-[rgba(148,163,184,0.08)] bg-[#FFFFFF] rounded-b-[2rem] flex justify-end gap-3">
                            <button onClick={closeModal} className="px-5 py-2 rounded-xl bg-[#FAF8F5] border border-[rgba(148,163,184,0.1)] text-[#000000] font-bold text-sm hover:bg-[#1A1D23] transition-all">
                                Hủy
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={saving || !formValid}
                                className="px-5 py-2 rounded-xl bg-[#B4533A] hover:bg-[#A85032] text-[#000000] font-black text-sm shadow-lg shadow-[#B4533A]/20 transition-all disabled:opacity-50"
                            >
                                {saving ? "Đang lưu..." : modal === "create" ? "Tạo hợp đồng" : "Lưu thay đổi"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Confirm */}
            {modal === "delete" && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 pointer-events-none">
                    <div className="absolute inset-0 bg-[#FFFFFF]/60 backdrop-blur-md pointer-events-auto" onClick={closeModal} />
                    <div className="relative w-full max-w-md bg-[#FAF8F5] rounded-[2rem] border border-rose-500/20 shadow-[0_20px_50px_rgba(0,0,0,0.1)] p-8 pointer-events-auto animate-in zoom-in-95 duration-200">
                        <div className="flex items-start gap-4 mb-6">
                            <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-black flex-shrink-0">
                                <Trash2 size={18} />
                            </div>
                            <div>
                                <h3 className="font-black text-[#000000] mb-1">Xóa hợp đồng</h3>
                                <p className="text-sm text-[#000000]">
                                    Hành động này không thể hoàn tác. Hợp đồng và tất cả dữ liệu liên quan sẽ bị xóa vĩnh viễn.
                                </p>
                            </div>
                        </div>
                        <div className="flex gap-3 justify-end">
                            <button onClick={closeModal} className="px-5 py-2 rounded-xl bg-[#FFFFFF] border border-[rgba(148,163,184,0.1)] text-[#000000] font-bold text-sm hover:bg-[#1A1D23] transition-all">
                                Hủy
                            </button>
                            <button
                                onClick={handleDelete}
                                disabled={saving}
                                className="px-5 py-2 rounded-xl bg-rose-500 hover:bg-rose-600 text-[#000000] font-black text-sm transition-all disabled:opacity-50"
                            >
                                {saving ? "Đang xóa..." : "Xác nhận xóa"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Submit for Approval */}
            {modal === "approve" && approveTarget && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 pointer-events-none">
                    <div className="absolute inset-0 bg-[#FFFFFF]/60 backdrop-blur-md pointer-events-auto" onClick={closeModal} />
                    <div className="relative w-full max-w-md bg-[#FAF8F5] rounded-[2rem] border border-amber-500/20 shadow-[0_20px_50px_rgba(0,0,0,0.1)] p-8 pointer-events-auto animate-in zoom-in-95 duration-200">
                        <div className="flex items-start gap-4 mb-5">
                            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-black flex-shrink-0">
                                <ShieldCheck size={18} />
                            </div>
                            <div>
                                <h3 className="font-black text-[#000000] mb-0.5">Gửi phê duyệt</h3>
                                <p className="text-xs text-[#000000] font-mono">#{approveTarget.contractNumber}</p>
                            </div>
                        </div>

                        <div className="bg-[#FFFFFF] rounded-xl p-4 border border-[rgba(148,163,184,0.08)] mb-5 space-y-2">
                            <p className="text-[10px] font-black uppercase tracking-widest text-[#000000]">Thông tin hợp đồng</p>
                            <p className="text-sm font-bold text-[#000000]">{approveTarget.title}</p>
                            <p className="text-xs text-[#000000]">
                                Giá trị: <span className="text-[#000000] font-bold">{Number(approveTarget.totalValue || 0).toLocaleString("vi-VN")} {approveTarget.currency}</span>
                            </p>
                        </div>

                        <p className="text-xs text-[#000000] bg-amber-500/5 border border-amber-500/15 rounded-xl p-3 mb-5">
                            Hệ thống sẽ tự động chọn người duyệt theo <span className="text-black font-bold">quy tắc phê duyệt</span> của tổ chức. Hợp đồng sẽ chuyển sang trạng thái <span className="text-black font-bold">Chờ ký</span>.
                        </p>

                        <div className="flex gap-3 justify-end">
                            <button onClick={closeModal} className="px-5 py-2 rounded-xl bg-[#FFFFFF] border border-[rgba(148,163,184,0.1)] text-[#000000] font-bold text-sm hover:bg-[#1A1D23] transition-all">
                                Hủy
                            </button>
                            <button
                                onClick={handleApprove}
                                disabled={saving}
                                className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-[#000000] font-black text-sm transition-all disabled:opacity-50 flex items-center gap-2"
                            >
                                <Send size={14} />
                                {saving ? "Đang gửi..." : "Xác nhận gửi duyệt"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Terminate Modal */}
            {modal === "terminate" && terminateTarget && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 pointer-events-none">
                    <div className="absolute inset-0 bg-[#FFFFFF]/60 backdrop-blur-md pointer-events-auto" onClick={closeModal} />
                    <div className="relative w-full max-w-md bg-[#FAF8F5] rounded-[2rem] border border-rose-500/20 shadow-[0_20px_50px_rgba(0,0,0,0.1)] p-8 pointer-events-auto animate-in zoom-in-95 duration-200">
                        <div className="flex items-start gap-4 mb-5">
                            <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-black flex-shrink-0">
                                <Ban size={18} />
                            </div>
                            <div>
                                <h3 className="font-black text-[#000000] mb-0.5">Chấm dứt hợp đồng</h3>
                                <p className="text-xs text-[#000000] font-mono">#{terminateTarget.contractNumber}</p>
                            </div>
                        </div>

                        <div className="mb-5">
                            <label className="block text-[10px] font-black uppercase tracking-widest text-[#000000] mb-2">
                                Lý do chấm dứt *
                            </label>
                            <textarea
                                rows={3}
                                placeholder="Nhập lý do chấm dứt hợp đồng..."
                                className="modal-input w-full resize-none"
                                value={terminateReason}
                                onChange={e => setTerminateReason(e.target.value)}
                            />
                        </div>

                        <p className="text-xs text-[#000000] bg-[#FFFFFF] rounded-xl p-3 border border-[rgba(148,163,184,0.08)] mb-5">
                            Hành động này sẽ chuyển hợp đồng sang trạng thái <span className="text-black font-bold">Đã chấm dứt</span>. Lý do sẽ được ghi vào ghi chú hợp đồng.
                        </p>

                        <div className="flex gap-3 justify-end">
                            <button onClick={closeModal} className="px-5 py-2 rounded-xl bg-[#FFFFFF] border border-[rgba(148,163,184,0.1)] text-[#000000] font-bold text-sm hover:bg-[#1A1D23] transition-all">
                                Hủy
                            </button>
                            <button
                                onClick={handleTerminate}
                                disabled={saving || !terminateReason.trim()}
                                className="px-5 py-2 rounded-xl bg-rose-500 hover:bg-rose-600 text-[#000000] font-black text-sm transition-all disabled:opacity-50 flex items-center gap-2"
                            >
                                <Ban size={14} />
                                {saving ? "Đang xử lý..." : "Xác nhận chấm dứt"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Digital Signing Modal */}
            <ContractSignModal
                contract={signTarget}
                isBuyer={currentUser?.role !== "SUPPLIER"}
                signerName={currentUser?.fullName || currentUser?.name || currentUser?.email || ""}
                onClose={() => setSignTarget(null)}
                onConfirm={signContract}
            />

            <style jsx>{`
                .modal-input {
                    width: 100%;
                    padding: 0.625rem 0.875rem;
                    background: #FFFFFF;
                    border: 1px solid rgba(148,163,184,0.12);
                    border-radius: 0.75rem;
                    color: #000000;
                    font-size: 0.875rem;
                    font-weight: 500;
                    outline: none;
                    transition: border-color 0.15s;
                }
                .modal-input:focus { border-color: rgba(59,130,246,0.5); }
                .modal-input::placeholder { color: #000000; }
            `}</style>
        </main>
    );
}

// ── FormField helper ──────────────────────────────────────────────────────────
function FormField({ label, children, colSpan = 1 }: { label: string; children: React.ReactNode; colSpan?: number }) {
    return (
        <div className={colSpan === 2 ? "sm:col-span-2" : ""}>
            <label className="block text-[10px] font-black uppercase tracking-widest text-[#000000] mb-2">{label}</label>
            {children}
        </div>
    );
}