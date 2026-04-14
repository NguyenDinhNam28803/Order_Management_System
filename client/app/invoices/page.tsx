"use client";

import { useEffect, useState } from "react";
import { useProcurement } from "@/app/context/ProcurementContext";
import Link from "next/link";
import {
  FileText, Eye, Pencil, Trash2, Search, Filter,
  TrendingUp, Clock, CheckCircle2, AlertTriangle, Plus
} from "lucide-react";

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
  const { invoices, fetchInvoices } = useProcurement();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("ALL");
  const [deletingId, setDeletingId] = useState<string | null>(null);

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

  const filtered = (invoices ?? []).filter((inv: any) => {
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
    pending: (invoices ?? []).filter((i: any) => i.status === "PENDING_MATCH" || i.status === "RECEIVED").length,
    paid:    (invoices ?? []).filter((i: any) => i.status === "PAID").length,
    exception:(invoices ?? []).filter((i: any) => i.status === "EXCEPTION_REVIEW").length,
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Bạn có chắc muốn xóa hóa đơn này?")) return;
    setDeletingId(id);
    try {
      // await deleteInvoice?.(id);
    } finally {
      setDeletingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-[#3B82F6] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-black text-[#F8FAFC] tracking-tight">Quản lý Hóa đơn</h1>
          <p className="text-xs text-[#64748B] mt-0.5">Theo dõi và xử lý tất cả hóa đơn nhà cung cấp</p>
        </div>
        <Link
          href="/supplier/invoice"
          className="btn-primary text-xs gap-2"
        >
          <Plus size={14} />
          Tạo hóa đơn
        </Link>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-sm">
          <AlertTriangle size={16} className="shrink-0" />
          {error}
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Tổng hóa đơn",    value: stats.total,     icon: FileText,      color: "text-[#60A5FA]", bg: "bg-[#3B82F6]/10" },
          { label: "Chờ xử lý",       value: stats.pending,   icon: Clock,         color: "text-amber-400",  bg: "bg-amber-500/10" },
          { label: "Đã thanh toán",   value: stats.paid,      icon: CheckCircle2,  color: "text-emerald-400",bg: "bg-emerald-500/10" },
          { label: "Cần xem xét",     value: stats.exception, icon: AlertTriangle, color: "text-rose-400",   bg: "bg-rose-500/10" },
        ].map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="erp-card flex items-center gap-4">
            <div className={`w-10 h-10 rounded-xl ${bg} flex items-center justify-center shrink-0`}>
              <Icon size={18} className={color} />
            </div>
            <div>
              <p className="text-xs text-[#64748B] font-semibold">{label}</p>
              <p className={`text-2xl font-black ${color}`}>{value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="erp-card flex flex-col sm:flex-row items-start sm:items-center gap-3">
        {/* Search */}
        <div className="relative flex-1 w-full sm:max-w-xs">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#64748B]" />
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
          <Filter size={14} className="text-[#64748B] shrink-0" />
          {["ALL", "DRAFT", "RECEIVED", "PENDING_MATCH", "MATCHED", "APPROVED", "PAID", "EXCEPTION_REVIEW"].map((s) => (
            <button
              key={s}
              onClick={() => setFilterStatus(s)}
              className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-colors ${
                filterStatus === s
                  ? "bg-[#3B82F6] text-white"
                  : "bg-[#1E212B] text-[#64748B] hover:text-[#F8FAFC] hover:bg-[#1E212B]/80"
              }`}
            >
              {s === "ALL" ? "Tất cả" : STATUS_MAP[s]?.label ?? s}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="erp-card overflow-hidden p-0">
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
                  <td colSpan={8} className="text-center py-16 text-[#64748B]">
                    <TrendingUp size={32} className="mx-auto mb-3 opacity-30" />
                    <p className="font-semibold">Không tìm thấy hóa đơn nào</p>
                    <p className="text-xs mt-1 opacity-60">Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm</p>
                  </td>
                </tr>
              ) : filtered.map((inv: any) => {
                const st = STATUS_MAP[inv.status] ?? { label: inv.status, cls: "status-draft" };
                return (
                  <tr key={inv.id}>
                    <td>
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-[#3B82F6]/10 flex items-center justify-center shrink-0">
                          <FileText size={12} className="text-[#60A5FA]" />
                        </div>
                        <span className="font-bold text-[#F8FAFC]">{inv.invoiceNumber ?? "—"}</span>
                      </div>
                    </td>
                    <td className="font-mono text-[#94A3B8]">{inv.po?.poNumber ?? "—"}</td>
                    <td className="text-[#F8FAFC]">{inv.supplier?.name ?? inv.supplierName ?? "—"}</td>
                    <td className="text-right font-bold text-[#F8FAFC]">
                      {inv.totalAmount != null
                        ? Number(inv.totalAmount).toLocaleString("vi-VN")
                        : "—"}
                    </td>
                    <td className="text-[#94A3B8] text-xs">
                      {inv.invoiceDate
                        ? new Date(inv.invoiceDate).toLocaleDateString("vi-VN")
                        : "—"}
                    </td>
                    <td className="text-[#94A3B8] text-xs">
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
                          className="p-1.5 rounded-lg hover:bg-[#3B82F6]/10 text-[#64748B] hover:text-[#60A5FA] transition-colors"
                          title="Xem chi tiết"
                        >
                          <Eye size={14} />
                        </Link>
                        {inv.status === "DRAFT" && (
                          <>
                            <Link
                              href={`/invoices/${inv.id}?edit=1`}
                              className="p-1.5 rounded-lg hover:bg-amber-500/10 text-[#64748B] hover:text-amber-400 transition-colors"
                              title="Chỉnh sửa"
                            >
                              <Pencil size={14} />
                            </Link>
                            <button
                              onClick={() => handleDelete(inv.id)}
                              disabled={deletingId === inv.id}
                              className="p-1.5 rounded-lg hover:bg-rose-500/10 text-[#64748B] hover:text-rose-400 transition-colors disabled:opacity-40"
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
            <p className="text-xs text-[#64748B]">
              Hiển thị <span className="text-[#F8FAFC] font-bold">{filtered.length}</span>
              {" "}/ <span className="text-[#F8FAFC] font-bold">{(invoices ?? []).length}</span> hóa đơn
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
