"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
    Plus, Search, FileText, ShoppingBag,
    ChevronRight, ArrowLeft, Eye, ShieldCheck,
    X, AlertCircle, ShoppingCart, Package,
    TrendingUp, Clock, CheckCircle2, XCircle,
    PlusCircle, MinusCircle, Building2, Banknote,
    Send, Download, MoreVertical, CircleDot
} from "lucide-react";
import { useProcurement, PoStatus, Organization, PR, RFQ, PO, POItem } from "../../context/ProcurementContext";

interface POMockData extends PO {
    vendorId?: string;
    vendorName?: string;
    prId?: string;
    rfqId?: string;
    escrowLocked?: boolean;
}

const STATUS_CONFIG: Record<string, { label: string; bg: string; text: string; border: string; dot: string }> = {
    DRAFT:        { label: "Nháp",        bg: "bg-slate-500/10",   text: "text-black",   border: "border-slate-500/20",   dot: "bg-slate-400" },
    ISSUED:       { label: "Đã phát hành", bg: "bg-[#B4533A]/10",    text: "text-[#CB7A62]",    border: "border-[#B4533A]/20",    dot: "bg-[#CB7A62]" },
    SUBMITTED:    { label: "Đã gửi",       bg: "bg-indigo-500/10",  text: "text-black",  border: "border-indigo-500/20",  dot: "bg-indigo-400" },
    ACKNOWLEDGED: { label: "Đã xác nhận",  bg: "bg-emerald-500/10", text: "text-black", border: "border-emerald-500/20", dot: "bg-emerald-400" },
    COMPLETED:    { label: "Hoàn tất",     bg: "bg-purple-500/10",  text: "text-black",  border: "border-purple-500/20",  dot: "bg-purple-400" },
    CANCELLED:    { label: "Đã hủy",       bg: "bg-rose-500/10",    text: "text-black",    border: "border-rose-500/20",    dot: "bg-rose-400" },
    SHIPPED:      { label: "Đang giao",    bg: "bg-amber-500/10",   text: "text-black",   border: "border-amber-500/20",   dot: "bg-amber-400" },
    PAID:         { label: "Đã thanh toán", bg: "bg-teal-500/10",   text: "text-teal-400",    border: "border-teal-500/20",    dot: "bg-teal-400" },
};

function StatusBadge({ status }: { status: string }) {
    const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.DRAFT;
    return (
        <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider border ${cfg.bg} ${cfg.text} ${cfg.border}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
            {cfg.label}
        </span>
    );
}

function StatCard({ icon: Icon, label, value, sub, color }: {
    icon: React.ElementType; label: string; value: string | number; sub?: string; color: string;
}) {
    return (
        <div className="bg-[#FAF8F5] rounded-2xl border border-[rgba(148,163,184,0.08)] p-5 flex items-center gap-4">
            <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${color}`}>
                <Icon size={20} />
            </div>
            <div className="min-w-0">
                <p className="text-[10px] font-black uppercase tracking-widest text-[#000000] mb-0.5">{label}</p>
                <p className="text-xl font-black text-[#000000] tracking-tight truncate">{value}</p>
                {sub && <p className="text-[10px] text-[#000000] font-medium mt-0.5">{sub}</p>}
            </div>
        </div>
    );
}

export default function POManagementPage() {
    const { organizations, pos } = useProcurement();
    const [view, setView] = useState<"list" | "create">("list");
    const [selectedPO, setSelectedPO] = useState<POMockData | null>(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [activeStatus, setActiveStatus] = useState("ALL");
    const [allPOs, setAllPOs] = useState<POMockData[]>([]);

    useEffect(() => {
        const mapped = (pos || []).map((p: PO) => ({
            ...p,
            vendorId: (p as POMockData).supplierId || "",
            vendorName: (p as POMockData).supplier?.name ||
                organizations?.find((o: Organization) => o.id === (p as POMockData).supplierId)?.name || "N/A",
        } as POMockData));
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setAllPOs(mapped);
    }, [pos, organizations]);

    const statusTabs = useMemo(() => {
        const counts: Record<string, number> = { ALL: allPOs.length };
        allPOs.forEach(po => {
            counts[po.status] = (counts[po.status] || 0) + 1;
        });
        return counts;
    }, [allPOs]);

    const filtered = useMemo(() => allPOs.filter(po => {
        const matchSearch =
            po.poNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (po as POMockData).vendorName?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchStatus = activeStatus === "ALL" || po.status === activeStatus;
        return matchSearch && matchStatus;
    }), [allPOs, searchTerm, activeStatus]);

    const totalValue = allPOs.reduce((s, p) => s + Number((p as POMockData).totalAmount || p.total || 0), 0);
    const pendingCount = allPOs.filter(p => ["DRAFT", "ISSUED", "SUBMITTED"].includes(p.status)).length;
    const doneCount = allPOs.filter(p => ["ACKNOWLEDGED", "COMPLETED", "PAID"].includes(p.status)).length;

    if (view === "create") {
        return (
            <POForm
                onCancel={() => setView("list")}
                prs={[]}
                rfqs={[]}
                organizations={organizations || []}
            />
        );
    }

    return (
        <div className="min-h-screen bg-[#FFFFFF] text-[#000000]">
            <div className="max-w-[1600px] mx-auto px-6 py-8 space-y-6">

                {/* ── Header ── */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <div className="flex items-center gap-3 mb-1">
                            <div className="w-8 h-8 rounded-lg bg-[#B4533A]/10 border border-[#B4533A]/20 flex items-center justify-center">
                                <ShoppingBag size={16} className="text-[#B4533A]" />
                            </div>
                            <h1 className="text-2xl font-black tracking-tight">Quản lý Đơn đặt hàng (PO)</h1>
                        </div>
                        <p className="text-sm text-[#000000] font-medium ml-11">
                            Theo dõi vòng đời đơn hàng từ phát hành đến hoàn tất thanh toán
                        </p>
                    </div>
                    <button
                        onClick={() => setView("create")}
                        className="flex items-center gap-2 bg-[#B4533A] hover:bg-[#A85032] text-[#000000] px-5 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider shadow-lg shadow-[#B4533A]/20 transition-all"
                    >
                        <Plus size={16} /> Tạo PO mới
                    </button>
                </div>

                {/* ── Stats ── */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <StatCard icon={Package}       label="Tổng đơn hàng"  value={allPOs.length}                        color="bg-[#B4533A]/10 text-[#B4533A]" />
                    <StatCard icon={Banknote}       label="Tổng giá trị"   value={`${(totalValue / 1e6).toFixed(1)}M ₫`} sub="tổng ngân sách cam kết" color="bg-emerald-500/10 text-black" />
                    <StatCard icon={Clock}          label="Đang xử lý"     value={pendingCount}                         sub="chờ xác nhận / giao hàng" color="bg-amber-500/10 text-black" />
                    <StatCard icon={TrendingUp}     label="Hoàn tất"       value={doneCount}                            sub="đã xác nhận & thanh toán" color="bg-purple-500/10 text-black" />
                </div>

                {/* ── Toolbar ── */}
                <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
                    <div className="relative flex-1 max-w-sm group">
                        <Search size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#000000] group-focus-within:text-[#B4533A] transition-colors" />
                        <input
                            type="text"
                            placeholder="Tìm mã PO, nhà cung cấp..."
                            className="w-full pl-10 pr-4 py-2.5 bg-[#FAF8F5] border border-[rgba(148,163,184,0.1)] rounded-xl text-sm font-medium text-[#000000] placeholder:text-[#000000] outline-none focus:border-[#B4533A]/40 transition-all"
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                        />
                    </div>

                    {/* Status Tabs */}
                    <div className="flex gap-1 bg-[#FAF8F5] border border-[rgba(148,163,184,0.08)] rounded-xl p-1 overflow-x-auto">
                        {[
                            { key: "ALL", label: "Tất cả" },
                            { key: "DRAFT", label: "Nháp" },
                            { key: "ISSUED", label: "Đã phát hành" },
                            { key: "ACKNOWLEDGED", label: "Đã xác nhận" },
                            { key: "COMPLETED", label: "Hoàn tất" },
                        ].map(tab => (
                            <button
                                key={tab.key}
                                onClick={() => setActiveStatus(tab.key)}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-black uppercase tracking-wider whitespace-nowrap transition-all ${
                                    activeStatus === tab.key
                                        ? "bg-[#B4533A] text-[#000000] shadow-md shadow-[#B4533A]/20"
                                        : "text-[#000000] hover:text-[#000000]"
                                }`}
                            >
                                {tab.label}
                                {statusTabs[tab.key] !== undefined && (
                                    <span className={`text-[9px] px-1.5 py-0.5 rounded-md font-black ${
                                        activeStatus === tab.key ? "bg-white/20" : "bg-[#FFFFFF]"
                                    }`}>
                                        {statusTabs[tab.key]}
                                    </span>
                                )}
                            </button>
                        ))}
                    </div>

                    <button className="flex items-center gap-2 px-4 py-2.5 bg-[#FAF8F5] border border-[rgba(148,163,184,0.1)] rounded-xl text-[11px] font-black uppercase tracking-wider text-[#000000] hover:text-[#000000] transition-all">
                        <Download size={14} /> Xuất
                    </button>
                </div>

                {/* ── Table ── */}
                <div className="bg-[#FAF8F5] rounded-2xl border border-[rgba(148,163,184,0.08)] overflow-hidden">
                    {filtered.length === 0 ? (
                        <div className="py-24 flex flex-col items-center gap-4 text-[#000000]">
                            <div className="w-14 h-14 rounded-2xl bg-[#FFFFFF] border border-[rgba(148,163,184,0.1)] flex items-center justify-center">
                                <ShoppingBag size={24} />
                            </div>
                            <div className="text-center">
                                <p className="font-bold text-[#000000] text-sm">Không có đơn hàng nào</p>
                                <p className="text-xs mt-1">
                                    {searchTerm || activeStatus !== "ALL"
                                        ? "Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm"
                                        : "Nhấn 'Tạo PO mới' để bắt đầu"}
                                </p>
                            </div>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-[rgba(148,163,184,0.08)] bg-[#FFFFFF]">
                                        {["Mã PO", "Nhà cung cấp", "Liên kết PR → RFQ", "Trạng thái", "Tổng tiền", "Escrow", ""].map((h, i) => (
                                            <th key={i} className={`px-5 py-4 text-[10px] font-black uppercase tracking-widest text-[#000000] ${i >= 5 ? "text-right" : "text-left"}`}>
                                                {h}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-[rgba(148,163,184,0.05)]">
                                    {filtered.map(po => (
                                        <tr key={po.id} className="group hover:bg-[#FFFFFF]/60 transition-colors">
                                            {/* Mã PO */}
                                            <td className="px-5 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-9 h-9 rounded-lg bg-[#B4533A]/10 border border-[#B4533A]/20 flex items-center justify-center text-[#B4533A] flex-shrink-0">
                                                        <FileText size={15} />
                                                    </div>
                                                    <div>
                                                        <p className="font-black text-[#000000] text-sm leading-none">Đơn hàng</p>
                                                        {!(po as POMockData).rfqId && (
                                                            <span className="text-[8px] font-black text-black bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20 mt-1 inline-block">
                                                                AUTO
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>

                                            {/* Nhà cung cấp */}
                                            <td className="px-5 py-4">
                                                <p className="font-bold text-[#000000]">{(po as POMockData).supplier?.name || (po as POMockData).vendorName || "N/A"}</p>
                                            </td>

                                            {/* PR → RFQ */}
                                            <td className="px-5 py-4">
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    {(po as POMockData).prId ? (
                                                        <span className="text-[10px] font-black text-[#000000] bg-[#FFFFFF] px-2.5 py-1 rounded-lg border border-[rgba(148,163,184,0.1)]">
                                                            PR-***
                                                        </span>
                                                    ) : (
                                                        <span className="text-[10px] text-[#000000] italic">—</span>
                                                    )}
                                                    {(po as POMockData).rfqId && (
                                                        <>
                                                            <ChevronRight size={12} className="text-[#000000]" />
                                                            <span className="text-[10px] font-black text-[#B4533A] bg-[#B4533A]/10 px-2.5 py-1 rounded-lg border border-[#B4533A]/20">
                                                                RFQ-***
                                                            </span>
                                                        </>
                                                    )}
                                                </div>
                                            </td>

                                            {/* Trạng thái */}
                                            <td className="px-5 py-4">
                                                <StatusBadge status={po.status} />
                                            </td>

                                            {/* Tổng tiền */}
                                            <td className="px-5 py-4">
                                                <span className="font-black text-[#000000] tabular-nums">
                                                    {Number((po as POMockData).totalAmount || po.total || 0).toLocaleString()} ₫
                                                </span>
                                            </td>

                                            {/* Escrow */}
                                            <td className="px-5 py-4">
                                                {(po as POMockData).escrowLocked ? (
                                                    <span className="inline-flex items-center gap-1.5 text-[10px] font-black text-black bg-amber-500/10 px-2.5 py-1 rounded-lg border border-amber-500/20">
                                                        <ShieldCheck size={12} /> Locked
                                                    </span>
                                                ) : (
                                                    <span className="text-[10px] text-[#000000] font-bold">—</span>
                                                )}
                                            </td>

                                            {/* Actions */}
                                            <td className="px-5 py-4">
                                                <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button
                                                        onClick={() => setSelectedPO(po)}
                                                        className="p-2 rounded-lg text-[#000000] hover:text-[#B4533A] hover:bg-[#B4533A]/10 transition-all"
                                                        title="Xem chi tiết"
                                                    >
                                                        <Eye size={15} />
                                                    </button>
                                                    <button
                                                        className="p-2 rounded-lg text-[#000000] hover:text-[#000000] hover:bg-[rgba(148,163,184,0.08)] transition-all"
                                                        title="Thêm"
                                                    >
                                                        <MoreVertical size={15} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {/* Table footer */}
                    {filtered.length > 0 && (
                        <div className="px-5 py-3 border-t border-[rgba(148,163,184,0.08)] flex items-center justify-between">
                            <p className="text-[11px] text-[#000000] font-medium">
                                Hiển thị <span className="text-[#000000] font-bold">{filtered.length}</span> / {allPOs.length} đơn hàng
                            </p>
                            <p className="text-[11px] text-[#000000] font-medium">
                                Tổng giá trị lọc:{" "}
                                <span className="text-[#B4533A] font-black tabular-nums">
                                    {filtered.reduce((s, p) => s + Number((p as POMockData).totalAmount || p.total || 0), 0).toLocaleString()} ₫
                                </span>
                            </p>
                        </div>
                    )}
                </div>
            </div>

            {/* Detail Drawer */}
            {selectedPO && (
                <PODetailDrawer po={selectedPO} onClose={() => setSelectedPO(null)} />
            )}
        </div>
    );
}

// ── Create Form ────────────────────────────────────────────────────────────────
function POForm({ onCancel, prs, rfqs, organizations }: {
    onCancel: () => void;
    prs: PR[]; rfqs: RFQ[]; organizations: Organization[];
}) {
    const [formData, setFormData] = useState({
        prId: "", rfqId: "", vendorId: "", title: "", escrowLocked: false,
        items: [{ id: "new-1", productName: "", qty: 1, unitPrice: 0, total: 0 }]
    });

    const filteredRFQs = rfqs.filter((r: RFQ) => r.prId === formData.prId);

    const handleAddItem = () =>
        setFormData(f => ({ ...f, items: [...f.items, { id: `new-${Date.now()}`, productName: "", qty: 1, unitPrice: 0, total: 0 }] }));

    const handleRemoveItem = (idx: number) =>
        setFormData(f => ({ ...f, items: f.items.filter((_, i) => i !== idx) }));

    const handleUpdateItem = (idx: number, field: string, value: string | number) =>
        setFormData(f => {
            const items = [...f.items];
            const item = { ...items[idx], [field]: value };
            if (field === "qty" || field === "unitPrice") item.total = (Number(item.qty) || 0) * (Number(item.unitPrice) || 0);
            items[idx] = item;
            return { ...f, items };
        });

    const totalAmount = formData.items.reduce((s, i) => s + i.total, 0);

    return (
        <div className="min-h-screen bg-[#FFFFFF] text-[#000000]">
            <div className="max-w-4xl mx-auto px-6 py-8 space-y-6">

                {/* Top bar */}
                <div className="flex items-center justify-between">
                    <button
                        onClick={onCancel}
                        className="flex items-center gap-2 text-[#000000] hover:text-[#000000] font-bold text-sm transition-all"
                    >
                        <ArrowLeft size={16} /> Quay lại
                    </button>
                    <div className="flex gap-3">
                        <button
                            className="px-5 py-2.5 bg-[#FAF8F5] border border-[rgba(148,163,184,0.1)] text-[#000000] rounded-xl font-black text-[10px] uppercase tracking-wider hover:bg-[#1A1D23] transition-all"
                        >
                            Lưu nháp
                        </button>
                        <button
                            className="flex items-center gap-2 px-5 py-2.5 bg-[#B4533A] hover:bg-[#A85032] text-[#000000] rounded-xl font-black text-[10px] uppercase tracking-wider shadow-lg shadow-[#B4533A]/20 transition-all"
                        >
                            <Send size={14} /> Phát hành PO
                        </button>
                    </div>
                </div>

                {/* Form card */}
                <div className="bg-[#FAF8F5] rounded-2xl border border-[rgba(148,163,184,0.08)] overflow-hidden">
                    <div className="px-7 py-5 border-b border-[rgba(148,163,184,0.08)] bg-[#FFFFFF] flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-[#B4533A]/10 border border-[#B4533A]/20 flex items-center justify-center text-[#B4533A]">
                            <ShoppingBag size={17} />
                        </div>
                        <div>
                            <h2 className="font-black text-[#000000] text-base">Tạo đơn đặt hàng mới</h2>
                            <p className="text-[11px] text-[#000000] font-medium">Điền thông tin để phát hành PO</p>
                        </div>
                    </div>

                    <div className="p-7 space-y-8">
                        {/* Basic Info */}
                        <div className="grid sm:grid-cols-2 gap-5">
                            <Field label="Yêu cầu PR liên kết *">
                                <select
                                    className="form-select"
                                    value={formData.prId}
                                    onChange={e => setFormData(f => ({ ...f, prId: e.target.value }))}
                                >
                                    <option value="">— Chọn PR —</option>
                                    {prs.filter(p => p.status === "APPROVED").map(p => (
                                        <option key={p.id} value={p.id}>Yêu cầu – {p.title}</option>
                                    ))}
                                </select>
                            </Field>

                            <Field label="Báo giá / RFQ liên kết">
                                <select
                                    className="form-select disabled:opacity-40"
                                    value={formData.rfqId}
                                    disabled={!formData.prId}
                                    onChange={e => setFormData(f => ({ ...f, rfqId: e.target.value }))}
                                >
                                    <option value="">— Chọn RFQ —</option>
                                    {filteredRFQs.map(r => (
                                        <option key={r.id} value={r.rfqNumber}>{r.rfqNumber}</option>
                                    ))}
                                </select>
                            </Field>

                            <Field label="Nhà cung cấp *">
                                <select
                                    className="form-select"
                                    value={formData.vendorId}
                                    onChange={e => setFormData(f => ({ ...f, vendorId: e.target.value }))}
                                >
                                    <option value="">— Chọn NCC —</option>
                                    {organizations.filter(o => o.companyType === "SUPPLIER").map(o => (
                                        <option key={o.id} value={o.id}>{o.name}</option>
                                    ))}
                                </select>
                            </Field>

                            <Field label="Escrow">
                                <div className="flex items-center gap-4 h-full pt-1">
                                    <button
                                        type="button"
                                        onClick={() => setFormData(f => ({ ...f, escrowLocked: !f.escrowLocked }))}
                                        className={`w-12 h-6 rounded-full p-0.5 transition-all ${formData.escrowLocked ? "bg-amber-500" : "bg-[#1A1D23] border border-[rgba(148,163,184,0.15)]"}`}
                                    >
                                        <div className={`w-5 h-5 bg-white rounded-full shadow transition-transform ${formData.escrowLocked ? "translate-x-6" : "translate-x-0"}`} />
                                    </button>
                                    <div>
                                        <p className="text-xs font-bold text-[#000000]">
                                            {formData.escrowLocked ? "Bật — giữ tiền đến khi nhận hàng" : "Tắt — không dùng escrow"}
                                        </p>
                                    </div>
                                </div>
                            </Field>
                        </div>

                        {/* Items */}
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <h3 className="text-xs font-black uppercase tracking-widest text-[#000000]">Danh sách mặt hàng</h3>
                                <button
                                    onClick={handleAddItem}
                                    className="flex items-center gap-1.5 text-[11px] font-black uppercase text-[#B4533A] hover:bg-[#B4533A]/10 px-3 py-1.5 rounded-lg transition-all"
                                >
                                    <PlusCircle size={14} /> Thêm dòng
                                </button>
                            </div>

                            <div className="rounded-xl border border-[rgba(148,163,184,0.08)] overflow-hidden">
                                <table className="w-full text-xs">
                                    <thead>
                                        <tr className="bg-[#FFFFFF] border-b border-[rgba(148,163,184,0.08)]">
                                            <th className="px-4 py-3 text-left text-[10px] font-black uppercase tracking-widest text-[#000000]">Tên sản phẩm</th>
                                            <th className="px-4 py-3 text-center text-[10px] font-black uppercase tracking-widest text-[#000000] w-24">Số lượng</th>
                                            <th className="px-4 py-3 text-right text-[10px] font-black uppercase tracking-widest text-[#000000] w-36">Đơn giá (₫)</th>
                                            <th className="px-4 py-3 text-right text-[10px] font-black uppercase tracking-widest text-[#000000] w-36">Thành tiền</th>
                                            <th className="w-10" />
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-[rgba(148,163,184,0.05)]">
                                        {formData.items.map((item, idx) => (
                                            <tr key={item.id} className="group/row bg-[#FAF8F5]">
                                                <td className="px-3 py-2">
                                                    <input
                                                        type="text"
                                                        placeholder="Nhập tên sản phẩm..."
                                                        className="form-input w-full"
                                                        value={item.productName}
                                                        onChange={e => handleUpdateItem(idx, "productName", e.target.value)}
                                                    />
                                                </td>
                                                <td className="px-3 py-2">
                                                    <input
                                                        type="number"
                                                        min={1}
                                                        className="form-input w-full text-center"
                                                        value={item.qty}
                                                        onChange={e => handleUpdateItem(idx, "qty", parseInt(e.target.value) || 0)}
                                                    />
                                                </td>
                                                <td className="px-3 py-2">
                                                    <input
                                                        type="number"
                                                        min={0}
                                                        className="form-input w-full text-right"
                                                        value={item.unitPrice}
                                                        onChange={e => handleUpdateItem(idx, "unitPrice", parseInt(e.target.value) || 0)}
                                                    />
                                                </td>
                                                <td className="px-4 py-2 text-right font-black text-[#B4533A] tabular-nums">
                                                    {item.total.toLocaleString()} ₫
                                                </td>
                                                <td className="px-2 py-2">
                                                    <button
                                                        onClick={() => handleRemoveItem(idx)}
                                                        disabled={formData.items.length <= 1}
                                                        className="p-1.5 text-[#000000] hover:text-black hover:bg-rose-500/10 rounded-lg transition-all disabled:opacity-30"
                                                    >
                                                        <MinusCircle size={15} />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Total */}
                        <div className="flex justify-end">
                            <div className="bg-[#FFFFFF] border border-[rgba(148,163,184,0.08)] rounded-xl px-6 py-4 text-right">
                                <p className="text-[10px] font-black uppercase tracking-widest text-[#000000] mb-1">Tổng đơn hàng</p>
                                <p className="text-2xl font-black text-[#000000] tabular-nums">{totalAmount.toLocaleString()} <span className="text-base text-[#000000]">₫</span></p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

// ── Detail Drawer ──────────────────────────────────────────────────────────────
function PODetailDrawer({ po, onClose }: { po: POMockData; onClose: () => void }) {
    const [detail, setDetail] = useState<POMockData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const token = document.cookie.split("; ").find(r => r.startsWith("token="))?.split("=")[1];
        const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
        fetch(`${baseUrl}/purchase-orders/${po.id}`, {
            headers: {
                "Content-Type": "application/json",
                ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
        })
            .then(r => r.ok ? r.json() : null)
            .then(res => {
                if (res) {
                    const d = res.data || res;
                    setDetail({ ...po, ...d });
                }
            })
            .catch(() => {})
            .finally(() => setLoading(false));
    }, [po.id]);

    const data = detail ?? po;
    const items: POItem[] = (data.items as POItem[]) || [];
    const itemTotal = items.reduce((s, i) => s + (Number(i.unitPrice || i.estimatedPrice || 0) * Number(i.qty || 0)), 0);
    const grandTotal = Number(data.totalAmount || data.total || itemTotal || 0);

    return (
        <div className="fixed inset-0 z-50 overflow-hidden">
            <div
                className="absolute inset-0 bg-[#FFFFFF]/70 backdrop-blur-sm animate-in fade-in duration-200"
                onClick={onClose}
            />
            <div className="absolute inset-y-0 right-0 w-full max-w-xl bg-[#FAF8F5] flex flex-col animate-in slide-in-from-right duration-300 border-l border-[rgba(148,163,184,0.08)] shadow-2xl">

                {/* Header */}
                <div className="px-6 py-5 border-b border-[rgba(148,163,184,0.08)] bg-[#FFFFFF] flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-[#B4533A]/10 border border-[#B4533A]/20 flex items-center justify-center text-[#B4533A]">
                            <ShoppingCart size={18} />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h3 className="font-black text-[#000000]">Đơn hàng</h3>
                                <StatusBadge status={data.status} />
                            </div>
                            <p className="text-[10px] text-[#000000] font-medium mt-0.5">
                                {data.createdAt ? new Date(data.createdAt).toLocaleString("vi-VN") : "N/A"}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-xl text-[#000000] hover:text-[#000000] hover:bg-[rgba(148,163,184,0.08)] transition-all"
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto p-6 space-y-5">

                    {/* Supplier */}
                    <section className="bg-[#FFFFFF] rounded-xl border border-[rgba(148,163,184,0.08)] p-5">
                        <p className="text-[10px] font-black uppercase tracking-widest text-[#000000] mb-3 flex items-center gap-2">
                            <Building2 size={12} /> Nhà cung cấp
                        </p>
                        <p className="font-black text-[#000000] text-base">
                            {data.supplier?.name || data.vendorName || "N/A"}
                        </p>
                        <p className="text-xs text-[#000000] font-mono mt-1">
                            ID: ***
                        </p>
                    </section>

                    {/* Links */}
                    <div className="grid grid-cols-2 gap-3">
                        <section className="bg-[#B4533A]/5 border border-[#B4533A]/15 rounded-xl p-4">
                            <p className="text-[9px] font-black text-[#B4533A] uppercase tracking-widest mb-1.5">Yêu cầu PR</p>
                            <p className="font-black text-[#000000] text-sm">{(data as POMockData).prId ? "PR-***" : "—"}</p>
                        </section>
                        <section className="bg-[#8B5CF6]/5 border border-[#8B5CF6]/15 rounded-xl p-4">
                            <p className="text-[9px] font-black text-[#8B5CF6] uppercase tracking-widest mb-1.5">Báo giá RFQ</p>
                            <p className="font-black text-[#000000] text-sm">{(data as POMockData).rfqId ? "RFQ-***" : "—"}</p>
                        </section>
                    </div>

                    {/* Items */}
                    <section>
                        <div className="flex items-center justify-between mb-3">
                            <p className="text-[10px] font-black uppercase tracking-widest text-[#000000] flex items-center gap-2">
                                <Package size={12} /> Danh sách hàng hóa
                            </p>
                            {!loading && items.length > 0 && (
                                <span className="text-[10px] font-black text-[#000000] bg-[#FFFFFF] px-2 py-1 rounded-lg border border-[rgba(148,163,184,0.08)]">
                                    {items.length} mặt hàng
                                </span>
                            )}
                        </div>

                        {loading ? (
                            <div className="bg-[#FFFFFF] rounded-xl border border-[rgba(148,163,184,0.08)] p-8 flex items-center justify-center gap-3 text-[#000000]">
                                <div className="w-4 h-4 border-2 border-[#000000] border-t-[#B4533A] rounded-full animate-spin" />
                                <span className="text-xs font-bold">Đang tải danh sách hàng hóa...</span>
                            </div>
                        ) : items.length > 0 ? (
                            <div className="rounded-xl border border-[rgba(148,163,184,0.08)] overflow-hidden">
                                <table className="w-full text-xs">
                                    <thead className="bg-[#FFFFFF] border-b border-[rgba(148,163,184,0.08)]">
                                        <tr>
                                            <th className="px-4 py-3 text-left text-[10px] font-black uppercase tracking-widest text-[#000000]">Mô tả / Sản phẩm</th>
                                            <th className="px-4 py-3 text-center text-[10px] font-black uppercase tracking-widest text-[#000000] w-14">SL</th>
                                            <th className="px-4 py-3 text-right text-[10px] font-black uppercase tracking-widest text-[#000000] w-28">Đơn giá</th>
                                            <th className="px-4 py-3 text-right text-[10px] font-black uppercase tracking-widest text-[#000000] w-28">Thành tiền</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-[rgba(148,163,184,0.05)]">
                                        {items.map((item: POItem) => {
                                            const unitPrice = Number(item.unitPrice || item.estimatedPrice || 0);
                                            const lineTotal = unitPrice * Number(item.qty || 0);
                                            return (
                                                <tr key={item.id} className="hover:bg-[#FFFFFF]/50 transition-colors">
                                                    <td className="px-4 py-3 font-bold text-[#000000]">
                                                        {item.description || (item as unknown as Record<string, string>).productName || "—"}
                                                    </td>
                                                    <td className="px-4 py-3 text-center font-black text-[#000000]">{item.qty}</td>
                                                    <td className="px-4 py-3 text-right font-bold text-[#000000] tabular-nums">
                                                        {unitPrice.toLocaleString()} ₫
                                                    </td>
                                                    <td className="px-4 py-3 text-right font-black text-[#B4533A] tabular-nums">
                                                        {lineTotal.toLocaleString()} ₫
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                    <tfoot className="border-t border-[rgba(148,163,184,0.08)] bg-[#FFFFFF]">
                                        <tr>
                                            <td colSpan={3} className="px-4 py-3 text-right text-[10px] font-black uppercase tracking-widest text-[#000000]">
                                                Tổng cộng
                                            </td>
                                            <td className="px-4 py-3 text-right font-black text-[#000000] tabular-nums">
                                                {items.reduce((s, i) => s + Number(i.unitPrice || i.estimatedPrice || 0) * Number(i.qty || 0), 0).toLocaleString()} ₫
                                            </td>
                                        </tr>
                                    </tfoot>
                                </table>
                            </div>
                        ) : (
                            <div className="bg-[#FFFFFF] rounded-xl border border-[rgba(148,163,184,0.08)] p-6 text-center">
                                <p className="text-sm text-[#000000]">Không có chi tiết hàng hóa</p>
                                <p className="text-[10px] text-[#000000]/50 mt-1">PO có thể được tạo tự động từ RFQ</p>
                            </div>
                        )}
                    </section>

                    {/* Escrow */}
                    <section className={`rounded-xl border p-4 flex items-center gap-4 ${
                        (data as POMockData).escrowLocked
                            ? "bg-amber-500/5 border-amber-500/20"
                            : "bg-[#FFFFFF] border-[rgba(148,163,184,0.08)]"
                    }`}>
                        <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${
                            (data as POMockData).escrowLocked ? "bg-amber-500/20 text-black" : "bg-[#1A1D23] text-[#000000]"
                        }`}>
                            <ShieldCheck size={17} />
                        </div>
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-[#000000] mb-0.5">Escrow</p>
                            <p className={`text-sm font-bold ${(data as POMockData).escrowLocked ? "text-black" : "text-[#000000]"}`}>
                                {(data as POMockData).escrowLocked ? "Đã khóa — chờ xác nhận nhận hàng" : "Không sử dụng"}
                            </p>
                        </div>
                    </section>
                </div>

                {/* Footer */}
                <div className="px-6 py-5 border-t border-[rgba(148,163,184,0.08)] bg-[#FFFFFF] space-y-4">
                    <div className="flex justify-between items-center">
                        <span className="text-[11px] font-black uppercase tracking-widest text-[#000000]">Tổng thanh toán</span>
                        <span className="text-2xl font-black text-[#B4533A] tabular-nums">
                            {grandTotal.toLocaleString()} ₫
                        </span>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <button className="py-2.5 border border-[rgba(148,163,184,0.1)] text-[#000000] rounded-xl font-black text-[10px] uppercase tracking-wider hover:bg-[#FAF8F5] transition-all">
                            Gửi lại thông báo
                        </button>
                        <button className="py-2.5 bg-[#B4533A] hover:bg-[#A85032] text-[#000000] rounded-xl font-black text-[10px] uppercase tracking-wider shadow-lg shadow-[#B4533A]/10 transition-all flex items-center justify-center gap-2">
                            <Download size={13} /> In đơn hàng
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

// ── Helpers ────────────────────────────────────────────────────────────────────
function Field({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-[#000000]">{label}</label>
            {children}
        </div>
    );
}

