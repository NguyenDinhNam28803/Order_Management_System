"use client";

import React, { useState, useMemo } from "react";
import { useProcurement } from "../../context/ProcurementContext";
import {
    FileText, Eye, CheckCircle2, Clock, Plus, AlertCircle,
    Calendar, Building2, PenTool, Trash2, Pencil, Send, X,
    ShieldCheck, TrendingUp, RotateCcw, ChevronRight, Ban,
} from "lucide-react";
import PageHeader from "../../components/shared/PageHeader";
import Link from "next/link";
import { CurrencyCode, Contract } from "../../types/api-types";
import { Organization } from "../../context/ProcurementContext";
import { convertPrismaDecimal } from "../../utils/formatUtils";
import ContractSignModal from "../../components/ContractSignModal";
import DateInput from "../../components/shared/DateInput";
import { DataTable, DataTableColumn } from "../../components/shared/DataTable";
import { StatCard, StatGrid } from "../../components/shared/StatCard";
import TableToolbar from "../../components/shared/TableToolbar";
import StatusBadge from "../../components/shared/StatusBadge";

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
            .reduce((s, c) => s + convertPrismaDecimal(c.totalValue), 0),
    }), [contracts]);

    // ── Helpers ───────────────────────────────────────────────────────────────
    const closeModal = () => { setModal(null); setEditing(null); setDeleteId(null); setApprove(null); setTerminate(null); setTerminateReason(""); };

    const openCreate = () => { setForm({ ...EMPTY }); setEditing(null); setModal("create"); };
    const openEdit = (c: Contract) => {
        setForm({
            title: c.title, supplierId: c.supplierId, totalValue: convertPrismaDecimal(c.totalValue),
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

    // ── Table config ────────────────────────────────────────────────────────────
    const statusTabs = [
        { value: "ALL", label: "Tất cả" },
        { value: "DRAFT", label: "Nháp" },
        { value: "PENDING_APPROVAL", label: "Chờ duyệt" },
        { value: "ACTIVE", label: "Hiệu lực" },
        { value: "EXPIRED", label: "Hết hạn" },
    ];

    const columns: DataTableColumn<Contract>[] = [
        {
            label: "Số hợp đồng", key: "contractNumber", sortable: true,
            render: (c) => (
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-blue-600/10 border border-blue-600/20 flex items-center justify-center flex-shrink-0">
                        <FileText size={14} className="text-blue-600" />
                    </div>
                    <span className="font-bold text-blue-600 num-display text-xs">#{c.contractNumber}</span>
                </div>
            ),
        },
        {
            label: "Tiêu đề / Đối tác",
            render: (c) => (
                <div className="max-w-[220px]">
                    <p className="font-bold text-slate-900 truncate">{c.title}</p>
                    <div className="flex items-center gap-1 text-[11px] text-slate-500 mt-0.5">
                        <Building2 size={11} />
                        <span className="truncate">{c.supplier?.name || "—"}</span>
                    </div>
                </div>
            ),
        },
        {
            label: "Giá trị", align: "right",
            render: (c) => (
                <div>
                    <p className="font-bold text-slate-900 num-display">{convertPrismaDecimal(c.totalValue).toLocaleString("vi-VN")}</p>
                    <p className="text-[0.6875rem] text-slate-500">{c.currency}</p>
                </div>
            ),
        },
        {
            label: "Thời hạn", hideOnMobile: true,
            render: (c) => c.startDate ? (
                <div className="flex items-center gap-2 text-[11px]">
                    <Calendar size={12} className="text-slate-400 flex-shrink-0" />
                    <div>
                        <p className="text-slate-900 font-bold num-display">{new Date(c.startDate).toLocaleDateString("vi-VN")}</p>
                        <p className="text-slate-500 flex items-center gap-1 num-display"><ChevronRight size={10} />{c.endDate ? new Date(c.endDate).toLocaleDateString("vi-VN") : "—"}</p>
                    </div>
                </div>
            ) : <span className="text-slate-400 italic text-xs">Chưa xác định</span>,
        },
        {
            label: "Trạng thái",
            render: (c) => {
                const isActive = c.status === "ACTIVE";
                return (
                    <div>
                        <StatusBadge status={c.status} size="sm" />
                        {isActive && c.endDate && (() => {
                            const days = Math.ceil((new Date(c.endDate as string).getTime() - Date.now()) / 86400000);
                            return days <= 30 && days > 0 ? (<p className="text-[0.6875rem] text-amber-600 font-bold mt-1">⚠ Còn {days} ngày</p>) : null;
                        })()}
                    </div>
                );
            },
        },
        {
            label: "", align: "right",
            render: (c) => {
                const isActive = c.status === "ACTIVE";
                const isDraft = c.status === "DRAFT";
                const isPending = c.status === "PENDING_APPROVAL";
                const canSign = isPending && currentUser?.role !== "SUPPLIER" ? !c.buyerSignedAt : isPending && currentUser?.role === "SUPPLIER" ? !c.supplierSignedAt : false;
                return (
                    <div className="flex items-center justify-end gap-1">
                        <Link href={`/procurement/contracts/${c.id}`} className="p-2 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-600/10 transition-all" title="Xem chi tiết"><Eye size={15} /></Link>
                        {canSign && (<button onClick={() => setSignTarget(c)} className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[0.6875rem] font-bold text-white bg-emerald-600 hover:bg-emerald-700 transition-all" title="Ký hợp đồng"><PenTool size={12} /> Ký</button>)}
                        {isDraft && (<button onClick={() => openApprove(c)} className="p-2 rounded-lg text-slate-500 hover:text-amber-600 hover:bg-amber-500/10 transition-all" title="Gửi phê duyệt"><Send size={15} /></button>)}
                        {isDraft && (<button onClick={() => openEdit(c)} className="p-2 rounded-lg text-slate-500 hover:text-amber-600 hover:bg-amber-500/10 transition-all" title="Chỉnh sửa"><Pencil size={15} /></button>)}
                        {isDraft && (<button onClick={() => openDelete(c.id)} className="p-2 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-500/10 transition-all" title="Xóa hợp đồng"><Trash2 size={15} /></button>)}
                        {isActive && (<button onClick={() => { setTerminate(c); setModal("terminate"); }} className="p-2 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-500/10 transition-all" title="Chấm dứt hợp đồng"><Ban size={15} /></button>)}
                        {c.status === "EXPIRED" && (<button onClick={() => openEdit(c)} className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[0.6875rem] font-bold text-orange-600 bg-orange-500/10 hover:bg-orange-500/20 border border-orange-500/20 transition-all" title="Gia hạn hợp đồng"><RotateCcw size={12} /> Gia hạn</button>)}
                    </div>
                );
            },
        },
    ];

    // ── Render ────────────────────────────────────────────────────────────────
    return (
        <main className="p-6 space-y-6">

            {/* ── Header ── */}
            <PageHeader
                icon={FileText}
                iconColor="purple"
                title="Quản lý Hợp đồng"
                subtitle="Quản lý và theo dõi các thỏa thuận thu mua với nhà cung cấp"
                actions={
                    <button
                        onClick={openCreate}
                        className="btn-primary text-xs uppercase tracking-wider"
                    >
                        <Plus size={16} /> Tạo hợp đồng mới
                    </button>
                }
            />

            {/* ── Stats ── */}
            <StatGrid cols={5} className="mb-6">
                <StatCard label="Tổng hợp đồng" value={stats.total} icon={FileText} tone="blue" />
                <StatCard label="Đang hiệu lực" value={stats.active} icon={CheckCircle2} tone="emerald" />
                <StatCard label="Chờ duyệt" value={stats.pending} icon={Clock} tone="amber" />
                <StatCard label="Hết hạn" value={stats.expired} icon={AlertCircle} tone="rose" />
                <StatCard label="Tổng giá trị HĐ" value={`${(stats.totalValue / 1e6).toFixed(1)}M ₫`} icon={TrendingUp} tone="purple" />
            </StatGrid>

            {/* ── Toolbar + Table ── */}
            <div className="erp-card table-card p-4 space-y-4">
                <TableToolbar
                    search={search}
                    onSearchChange={setSearch}
                    searchPlaceholder="Tìm số hợp đồng, tiêu đề, nhà cung cấp..."
                    tabs={statusTabs}
                    tabValue={statusFilter}
                    onTabChange={setStatus}
                />
                <DataTable
                    columns={columns}
                    data={filtered}
                    density="compact"
                    pageSize={10}
                    getRowKey={(c) => c.id}
                    emptyMessage="Không có hợp đồng nào"
                    emptyDescription={search || statusFilter !== "ALL" ? "Thử điều chỉnh bộ lọc hoặc từ khóa tìm kiếm" : "Nhấn 'Tạo hợp đồng mới' để bắt đầu"}
                />
            </div>

            {/* ── Modals ── */}

            {/* Create / Edit Modal */}
            {(modal === "create" || modal === "edit") && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 pointer-events-none">
                    <div className="absolute inset-0 bg-white/60 backdrop-blur-md pointer-events-auto" onClick={closeModal} />
                    <div className="relative w-full max-w-2xl bg-slate-100 rounded-[2rem] border border-slate-200 shadow-xl max-h-[90vh] flex flex-col pointer-events-auto animate-in zoom-in-95 duration-200">
                        {/* Header */}
                        <div className="px-8 py-6 border-b border-slate-200 bg-white rounded-t-[2rem] flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="w-11 h-11 rounded-xl bg-blue-600/10 border border-blue-600/20 flex items-center justify-center text-blue-600">
                                    <FileText size={20} />
                                </div>
                                <div>
                                    <h2 className="text-lg font-bold text-slate-900">
                                        {modal === "create" ? "Tạo hợp đồng mới" : "Chỉnh sửa hợp đồng"}
                                    </h2>
                                    <p className="text-xs font-bold text-slate-900 opacity-60 uppercase tracking-widest">
                                        {modal === "edit" ? `#${editing?.contractNumber}` : "Điền đầy đủ thông tin hợp đồng"}
                                    </p>
                                </div>
                            </div>
                            <button onClick={closeModal} className="w-10 h-10 flex items-center justify-center text-slate-900 hover:bg-slate-100 rounded-xl transition-all">
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
                        <div className="px-8 py-6 border-t border-slate-200 bg-white rounded-b-[2rem] flex justify-end gap-3">
                            <button onClick={closeModal} className="btn-secondary text-sm">
                                Hủy
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={saving || !formValid}
                                className="btn-primary text-sm disabled:opacity-50"
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
                    <div className="absolute inset-0 bg-white/60 backdrop-blur-md pointer-events-auto" onClick={closeModal} />
                    <div className="relative w-full max-w-md bg-slate-100 rounded-[2rem] border border-rose-500/20 shadow-xl p-8 pointer-events-auto animate-in zoom-in-95 duration-200">
                        <div className="flex items-start gap-4 mb-6">
                            <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-600 flex-shrink-0">
                                <Trash2 size={18} />
                            </div>
                            <div>
                                <h3 className="font-bold text-slate-900 mb-1">Xóa hợp đồng</h3>
                                <p className="text-sm text-slate-900">
                                    Hành động này không thể hoàn tác. Hợp đồng và tất cả dữ liệu liên quan sẽ bị xóa vĩnh viễn.
                                </p>
                            </div>
                        </div>
                        <div className="flex gap-3 justify-end">
                            <button onClick={closeModal} className="btn-secondary text-sm">
                                Hủy
                            </button>
                            <button
                                onClick={handleDelete}
                                disabled={saving}
                                className="btn-danger text-sm disabled:opacity-50"
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
                    <div className="absolute inset-0 bg-white/60 backdrop-blur-md pointer-events-auto" onClick={closeModal} />
                    <div className="relative w-full max-w-md bg-slate-100 rounded-[2rem] border border-amber-500/20 shadow-xl p-8 pointer-events-auto animate-in zoom-in-95 duration-200">
                        <div className="flex items-start gap-4 mb-5">
                            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-600 flex-shrink-0">
                                <ShieldCheck size={18} />
                            </div>
                            <div>
                                <h3 className="font-bold text-slate-900 mb-0.5">Gửi phê duyệt</h3>
                                <p className="text-xs text-slate-900 font-mono">#{approveTarget.contractNumber}</p>
                            </div>
                        </div>

                        <div className="bg-white rounded-xl p-4 border border-slate-200 mb-5 space-y-2">
                            <p className="text-[0.6875rem] font-bold uppercase tracking-widest text-slate-900">Thông tin hợp đồng</p>
                            <p className="text-sm font-bold text-slate-900">{approveTarget.title}</p>
                            <p className="text-xs text-slate-900">
                                Giá trị: <span className="text-slate-900 font-bold">{convertPrismaDecimal(approveTarget.totalValue).toLocaleString("vi-VN")} {approveTarget.currency}</span>
                            </p>
                        </div>

                        <p className="text-xs text-slate-900 bg-amber-500/5 border border-amber-500/15 rounded-xl p-3 mb-5">
                            Hệ thống sẽ tự động chọn người duyệt theo <span className="text-black font-bold">quy tắc phê duyệt</span> của tổ chức. Hợp đồng sẽ chuyển sang trạng thái <span className="text-black font-bold">Chờ ký</span>.
                        </p>

                        <div className="flex gap-3 justify-end">
                            <button onClick={closeModal} className="btn-secondary text-sm">
                                Hủy
                            </button>
                            <button
                                onClick={handleApprove}
                                disabled={saving}
                                className="btn-warning text-sm disabled:opacity-50"
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
                    <div className="absolute inset-0 bg-white/60 backdrop-blur-md pointer-events-auto" onClick={closeModal} />
                    <div className="relative w-full max-w-md bg-slate-100 rounded-[2rem] border border-rose-500/20 shadow-xl p-8 pointer-events-auto animate-in zoom-in-95 duration-200">
                        <div className="flex items-start gap-4 mb-5">
                            <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-600 flex-shrink-0">
                                <Ban size={18} />
                            </div>
                            <div>
                                <h3 className="font-bold text-slate-900 mb-0.5">Chấm dứt hợp đồng</h3>
                                <p className="text-xs text-slate-900 font-mono">#{terminateTarget.contractNumber}</p>
                            </div>
                        </div>

                        <div className="mb-5">
                            <label className="block text-[0.6875rem] font-bold uppercase tracking-widest text-slate-900 mb-2">
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

                        <p className="text-xs text-slate-900 bg-white rounded-xl p-3 border border-slate-200 mb-5">
                            Hành động này sẽ chuyển hợp đồng sang trạng thái <span className="text-black font-bold">Đã chấm dứt</span>. Lý do sẽ được ghi vào ghi chú hợp đồng.
                        </p>

                        <div className="flex gap-3 justify-end">
                            <button onClick={closeModal} className="btn-secondary text-sm">
                                Hủy
                            </button>
                            <button
                                onClick={handleTerminate}
                                disabled={saving || !terminateReason.trim()}
                                className="btn-danger text-sm disabled:opacity-50"
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
                .modal-input::placeholder { color: #94A3B8; }
            `}</style>
        </main>
    );
}

// ── FormField helper ──────────────────────────────────────────────────────────
function FormField({ label, children, colSpan = 1 }: { label: string; children: React.ReactNode; colSpan?: number }) {
    return (
        <div className={colSpan === 2 ? "sm:col-span-2" : ""}>
            <label className="block text-[0.6875rem] font-bold uppercase tracking-widest text-slate-900 mb-2">{label}</label>
            {children}
        </div>
    );
}

