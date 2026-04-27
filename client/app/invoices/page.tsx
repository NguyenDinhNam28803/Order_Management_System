"use client";

import { useEffect, useState } from "react";
import { useProcurement, Invoice } from "@/app/context/ProcurementContext";
import { Organization } from "@/app/types/api-types";
import Link from "next/link";

type InvoiceWithDetails = Invoice & {
    supplier?: Organization;
    supplierName?: string;
    po?: { poNumber?: string };
    totalAmount?: number;
    amount?: number;
    invoiceDate?: string;
    dueDate?: string;
};
import {
  FileText, Eye, Pencil, Trash2, Search, Filter,
  TrendingUp, Clock, CheckCircle2, AlertTriangle, Plus, Sparkles, Loader2, X
} from "lucide-react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
function getToken() {
  if (typeof document === "undefined") return "";
  const m = document.cookie.match(/(?:^|;\s*)token=([^;]*)/);
  return m ? decodeURIComponent(m[1]) : "";
}

function AiInvoiceModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [rawText, setRawText] = useState("");
  const [supplierId, setSupplierId] = useState("");
  const [orgId, setOrgId] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ invoiceNumber?: string; totalAmount?: number; aiConfidence?: number; message?: string } | null>(null);
  const [err, setErr] = useState("");

  const submit = async () => {
    if (!rawText.trim() || !supplierId.trim() || !orgId.trim()) { setErr("Vui lòng điền đủ các trường."); return; }
    setLoading(true); setErr(""); setResult(null);
    try {
      const res = await fetch(`${API_BASE}/invoices/from-text`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify({ rawText, supplierId, orgId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Lỗi không xác định");
      setResult(data);
      onCreated();
    } catch (e: any) { setErr(e.message); }
    finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg rounded-2xl border border-[rgba(240,246,252,0.1)] bg-[#FAF8F5] p-6 shadow-2xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-base font-bold text-[#000000]"><Sparkles size={16} className="text-black" />Nhập hoá đơn bằng AI</h2>
          <button onClick={onClose}><X size={16} className="text-[#000000] hover:text-[#000000]" /></button>
        </div>
        <p className="mb-4 text-xs text-[#000000]">Dán nội dung hoá đơn từ email, Zalo, hoặc ghi chú qua điện thoại. AI sẽ tự trích xuất số liệu và tạo hoá đơn DRAFT để bạn kiểm tra lại.</p>
        {err && <div className="mb-3 rounded-lg bg-red-500/10 border border-red-500/20 px-3 py-2 text-xs text-red-400">{err}</div>}
        {result ? (
          <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4 text-sm text-black space-y-1">
            <p className="font-bold">✓ Hoá đơn đã tạo: {result.invoiceNumber}</p>
            <p>Tổng tiền: {result.totalAmount?.toLocaleString("vi-VN")} VND</p>
            <p className="text-xs text-[#000000]">Độ tin cậy AI: {((result.aiConfidence ?? 0) * 100).toFixed(0)}% · {result.message}</p>
            <button onClick={onClose} className="mt-2 text-xs text-[#CB7A62] hover:underline">Đóng</button>
          </div>
        ) : (
          <div className="space-y-3">
            <div>
              <label className="mb-1 block text-xs text-[#000000]">Nội dung hoá đơn *</label>
              <textarea rows={6} value={rawText} onChange={e => setRawText(e.target.value)} placeholder={"Ví dụ:\nHoá đơn số: HD-2026-055\nNgày: 24/04/2026\nPO: PO-2026-012\nThành tiền: 15,000,000 VND\nThuế 10%: 1,500,000 VND\nTổng cộng: 16,500,000 VND"} className="w-full rounded-lg border border-[rgba(240,246,252,0.08)] bg-[#FFFFFF] px-3 py-2 text-xs text-[#000000] placeholder:text-[#000000] focus:outline-none focus:border-purple-500/50 resize-none" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-xs text-[#000000]">Supplier ID *</label>
                <input value={supplierId} onChange={e => setSupplierId(e.target.value)} placeholder="UUID nhà cung cấp" className="w-full rounded-lg border border-[rgba(240,246,252,0.08)] bg-[#FFFFFF] px-3 py-2 text-xs text-[#000000] placeholder:text-[#000000] focus:outline-none focus:border-purple-500/50" />
              </div>
              <div>
                <label className="mb-1 block text-xs text-[#000000]">Org ID *</label>
                <input value={orgId} onChange={e => setOrgId(e.target.value)} placeholder="UUID tổ chức" className="w-full rounded-lg border border-[rgba(240,246,252,0.08)] bg-[#FFFFFF] px-3 py-2 text-xs text-[#000000] placeholder:text-[#000000] focus:outline-none focus:border-purple-500/50" />
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-1">
              <button onClick={onClose} className="px-4 py-2 text-xs text-[#000000] hover:text-[#000000]">Huỷ</button>
              <button disabled={loading} onClick={submit} className="flex items-center gap-2 rounded-lg bg-purple-600 px-4 py-2 text-xs font-semibold text-[#000000] hover:bg-purple-500 disabled:opacity-50">
                {loading ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}Phân tích & Tạo
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Map server InvoiceStatus → display
const STATUS_MAP: Record<string, { label: string; cls: string }> = {
  DRAFT:            { label: "Nháp",          cls: "status-draft" },
  RECEIVED:         { label: "Đã nhận",       cls: "status-info" },
  PENDING_MATCH:    { label: "Chờ đối soát",  cls: "status-pending" },
  MATCHED:          { label: "Đã khớp",       cls: "status-approved" },
  EXCEPTION_REVIEW: { label: "Ngoại lệ",      cls: "status-rejected" },
  APPROVED:         { label: "Đã duyệt",      cls: "status-approved" },
  PAID:             { label: "Đã thanh toán", cls: "status-approved" },
  CANCELLED:        { label: "Đã hủy",        cls: "status-draft" },
};

export default function InvoicesPage() {
  //deleteInvoice
  const { invoices, fetchInvoices, removeInvoice } = useProcurement();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("ALL");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [showAiModal, setShowAiModal] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        await fetchInvoices();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Không tải được hóa đơn");
      } finally {
        setLoading(false);
      }
    };
    load();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = (invoices as InvoiceWithDetails[] ?? []).filter((inv: InvoiceWithDetails) => {
    const matchSearch =
      !search ||
      inv.invoiceNumber?.toLowerCase().includes(search.toLowerCase()) ||
      inv.po?.poNumber?.toLowerCase().includes(search.toLowerCase()) ||
      inv.supplier?.name?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === "ALL" || inv.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const stats = {
    total:   (invoices ?? []).length,
    pending: (invoices as InvoiceWithDetails[] ?? []).filter((i: InvoiceWithDetails) => i.status === "PENDING_MATCH" || i.status === "RECEIVED").length,
    paid:    (invoices as InvoiceWithDetails[] ?? []).filter((i: InvoiceWithDetails) => i.status === "PAID").length,
    exception:(invoices as InvoiceWithDetails[] ?? []).filter((i: InvoiceWithDetails) => i.status === "EXCEPTION_REVIEW").length,
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Bạn có chắc muốn xóa hóa đơn này?")) return;
    setDeletingId(id);
    try {
      await removeInvoice(id);
      await fetchInvoices();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không xóa được hóa đơn");
    } finally {
      setDeletingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-[#B4533A] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      {showAiModal && (
        <AiInvoiceModal
          onClose={() => setShowAiModal(false)}
          onCreated={async () => { await fetchInvoices(); setShowAiModal(false); }}
        />
      )}
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-black text-[#000000] tracking-tight">Quản lý Hóa đơn</h1>
          <p className="text-xs text-[#000000] mt-0.5">Theo dõi và xử lý tất cả hóa đơn nhà cung cấp</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowAiModal(true)}
            className="flex items-center gap-2 rounded-xl border border-purple-500/30 bg-purple-600/10 px-3 py-2 text-xs font-semibold text-black hover:bg-purple-600/20 transition-colors"
          >
            <Sparkles size={14} />
            Nhập từ AI
          </button>
          <Link
            href="/supplier/invoice"
            className="btn-primary text-xs gap-2"
          >
            <Plus size={14} />
            Tạo hóa đơn
          </Link>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-black text-sm">
          <AlertTriangle size={16} className="shrink-0" />
          {error}
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Tổng hóa đơn",    value: stats.total,     icon: FileText,      color: "text-[#CB7A62]", bg: "bg-[#B4533A]/10" },
          { label: "Chờ xử lý",       value: stats.pending,   icon: Clock,         color: "text-black",  bg: "bg-amber-500/10" },
          { label: "Đã thanh toán",   value: stats.paid,      icon: CheckCircle2,  color: "text-black",bg: "bg-emerald-500/10" },
          { label: "Cần xem xét",     value: stats.exception, icon: AlertTriangle, color: "text-black",   bg: "bg-rose-500/10" },
        ].map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="erp-card flex items-center gap-4">
            <div className={`w-10 h-10 rounded-xl ${bg} flex items-center justify-center shrink-0`}>
              <Icon size={18} className={color} />
            </div>
            <div>
              <p className="text-xs text-[#000000] font-semibold">{label}</p>
              <p className={`text-2xl font-black ${color}`}>{value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="erp-card flex flex-col sm:flex-row items-start sm:items-center gap-3">
        {/* Search */}
        <div className="relative flex-1 w-full sm:max-w-xs">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#000000]" />
          <input
            type="text"
            placeholder="Tìm số hóa đơn, PO, nhà cung cấp..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="erp-input pl-9 text-xs w-full"
          />
        </div>

        {/* Status Filter */}
        <div className="flex items-center gap-2 flex-wrap">
          <Filter size={14} className="text-[#000000] shrink-0" />
          {["ALL", "DRAFT", "RECEIVED", "PENDING_MATCH", "MATCHED", "APPROVED", "PAID", "EXCEPTION_REVIEW"].map((s) => (
            <button
              key={s}
              onClick={() => setFilterStatus(s)}
              className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-colors ${
                filterStatus === s
                  ? "bg-[#B4533A] text-[#000000]"
                  : "bg-[#FAF8F5] text-[#000000] hover:text-[#000000] hover:bg-[#FAF8F5]/80"
              }`}
            >
              {s === "ALL" ? "Tất cả" : STATUS_MAP[s]?.label ?? s}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="erp-card table-card">
        <div className="overflow-x-auto">
          <table className="erp-table">
            <thead>
              <tr>
                <th>Số hóa đơn</th>
                <th>Mã PO</th>
                <th>Nhà cung cấp</th>
                <th className="text-right">Số tiền (VND)</th>
                <th>Ngày hóa đơn</th>
                <th>Hạn TT</th>
                <th>Trạng thái</th>
                <th className="text-center">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-16 text-[#000000]">
                    <TrendingUp size={32} className="mx-auto mb-3 opacity-30" />
                    <p className="font-semibold">Không tìm thấy hóa đơn nào</p>
                    <p className="text-xs mt-1 opacity-60">Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm</p>
                  </td>
                </tr>
              ) : filtered.map((inv: InvoiceWithDetails) => {
                const st = STATUS_MAP[inv.status] ?? { label: inv.status, cls: "status-draft" };
                return (
                  <tr key={inv.id}>
                    <td>
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-[#B4533A]/10 flex items-center justify-center shrink-0">
                          <FileText size={12} className="text-[#CB7A62]" />
                        </div>
                        <span className="font-bold text-[#000000]">{inv.invoiceNumber ?? "—"}</span>
                      </div>
                    </td>
                    <td className="font-mono text-[#000000]">{inv.po?.poNumber ?? "—"}</td>
                    <td className="text-[#000000]">{inv.supplier?.name ?? inv.supplierName ?? "—"}</td>
                    <td className="text-right font-bold text-[#000000]">
                      {inv.totalAmount != null
                        ? Number(inv.totalAmount).toLocaleString("vi-VN")
                        : "—"}
                    </td>
                    <td className="text-[#000000] text-xs">
                      {inv.invoiceDate
                        ? new Date(inv.invoiceDate).toLocaleDateString("vi-VN")
                        : "—"}
                    </td>
                    <td className="text-[#000000] text-xs">
                      {inv.dueDate
                        ? new Date(inv.dueDate).toLocaleDateString("vi-VN")
                        : "—"}
                    </td>
                    <td>
                      <span className={`status-pill ${st.cls}`}>{st.label}</span>
                    </td>
                    <td>
                      <div className="flex items-center justify-center gap-1">
                        <Link
                          href={`/invoices/${inv.id}`}
                          className="p-1.5 rounded-lg hover:bg-[#B4533A]/10 text-[#000000] hover:text-[#CB7A62] transition-colors"
                          title="Xem chi tiết"
                        >
                          <Eye size={14} />
                        </Link>
                        {inv.status === "DRAFT" && (
                          <>
                            <Link
                              href={`/invoices/${inv.id}?edit=1`}
                              className="p-1.5 rounded-lg hover:bg-amber-500/10 text-[#000000] hover:text-black transition-colors"
                              title="Chỉnh sửa"
                            >
                              <Pencil size={14} />
                            </Link>
                            <button
                              onClick={() => handleDelete(inv.id)}
                              disabled={deletingId === inv.id}
                              className="p-1.5 rounded-lg hover:bg-rose-500/10 text-[#000000] hover:text-black transition-colors disabled:opacity-40"
                              title="Xóa"
                            >
                              {deletingId === inv.id
                                ? <div className="w-3.5 h-3.5 border border-rose-400 border-t-transparent rounded-full animate-spin" />
                                : <Trash2 size={14} />}
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {filtered.length > 0 && (
          <div className="px-4 py-3 border-t border-[rgba(148,163,184,0.1)] flex items-center justify-between">
            <p className="text-xs text-[#000000]">
              Hiển thị <span className="text-[#000000] font-bold">{filtered.length}</span>
              {" "}/ <span className="text-[#000000] font-bold">{(invoices ?? []).length}</span> hóa đơn
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

