"use client";

import React, { useState, useMemo } from "react";
import {
  useProcurement, PR, PRItem,
  ConsolidationSummary, ConsolidatePRsResult,
} from "../../context/ProcurementContext";
import { Organization } from "@/app/types/api-types";
import {
  GitMerge, CheckSquare, Square, ChevronRight, Loader2,
  AlertTriangle, CheckCircle2, Building2, Package, ArrowRight,
  Info, DollarSign, Layers, Calendar, CheckCheck, X
} from "lucide-react";
import { useRouter } from "next/navigation";

type ConsolidationMode = "SKU_MATCH" | "CATEGORY_MATCH";

export default function POConsolidatePage() {
  const router = useRouter();
  const { prs, organizations, consolidatePRs } = useProcurement();

  // Chỉ lấy PR đã APPROVED
  const approvedPRs = useMemo(
    () => (prs ?? []).filter((p: PR) => p.status === "APPROVED"),
    [prs]
  );

  // Form state
  const [selectedPrIds, setSelectedPrIds] = useState<string[]>([]);
  const [supplierId, setSupplierId]       = useState("");
  const [mode, setMode]                   = useState<ConsolidationMode>("SKU_MATCH");
  const [deliveryDate, setDeliveryDate]   = useState(
    new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10)
  );
  const [paymentTerms, setPaymentTerms]   = useState("Net 30");
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [notes, setNotes]                 = useState("");

  // UI state
  const [submitting, setSubmitting] = useState(false);
  const [error, setError]           = useState<string | null>(null);
  const [result, setResult]         = useState<ConsolidatePRsResult | null>(null);

  // Suppliers
  const suppliers = useMemo(
    () => (organizations ?? []).filter((o: Organization) =>
      o.companyType === "SUPPLIER" || o.companyType === "BOTH"
    ),
    [organizations]
  );

  // Preview: simulate merge
  const previewItems = useMemo(() => {
    if (selectedPrIds.length < 2) return [];
    const selected = approvedPRs.filter((p: PR) => selectedPrIds.includes(p.id));
    const allItems = selected.flatMap((pr: PR) =>
      (pr.items ?? []).map((item: PRItem & { prNumber?: string; costCenterId?: string; categoryId?: string }) => ({
        ...item, prNumber: pr.prNumber, costCenterId: pr.costCenterId,
      }))
    );
    const groups = new Map<string, typeof allItems>();
    for (const item of allItems) {
      const key = mode === "SKU_MATCH"
        ? (item.sku ?? `desc::${item.productDesc?.toLowerCase()}`)
        : (item.categoryId ?? `desc::${item.productDesc?.toLowerCase()}`);
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(item);
    }
    return Array.from(groups.entries()).map(([key, items]) => ({
      key,
      description: items[0].productDesc ?? "—",
      sku: items[0].sku,
      unit: items[0].unit ?? "PCS",
      totalQty: items.reduce((s: number, i: PRItem & { prNumber?: string }) => s + Number(i.qty ?? 0), 0),
      unitPrice: Math.min(...items.map((i: PRItem & { prNumber?: string }) => Number(i.estimatedPrice ?? 0))),
      sources: items.map((i: PRItem & { prNumber?: string }) => ({ prNumber: i.prNumber, qty: Number(i.qty ?? 0) })),
    }));
  }, [selectedPrIds, approvedPRs, mode]);

  const previewTotal = previewItems.reduce((s, i) => s + i.totalQty * i.unitPrice, 0);

  const togglePr = (id: string) =>
    setSelectedPrIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );

  const selectAll = () =>
    setSelectedPrIds(approvedPRs.map((p: PR) => p.id));

  const clearAll = () => setSelectedPrIds([]);

  const handleSubmit = async () => {
    if (selectedPrIds.length < 2) { setError("Cần chọn ít nhất 2 PR"); return; }
    if (!supplierId)               { setError("Vui lòng chọn nhà cung cấp"); return; }
    if (!deliveryDate)             { setError("Vui lòng nhập ngày giao hàng"); return; }
    setError(null);
    setSubmitting(true);
    try {
      const res = await consolidatePRs({
        prIds: selectedPrIds,
        supplierId,
        consolidationMode: mode,
        deliveryDate,
        paymentTerms: paymentTerms || undefined,
        deliveryAddress: deliveryAddress || undefined,
        notes: notes || undefined,
      });
      if (res) {
        setResult(res);
      } else {
        setError("Không thể tạo PO gộp — vui lòng kiểm tra lại thông tin");
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Đã xảy ra lỗi khi gộp PO");
    } finally {
      setSubmitting(false);
    }
  };

  // ── Success screen ──────────────────────────────────────────────────────────
  if (result) {
    const s = result.consolidationSummary;
    return (
      <div className="p-6 flex items-center justify-center min-h-[60vh]">
        <div className="erp-card max-w-lg w-full text-center animate-fade-in">
          <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto mb-5">
            <CheckCircle2 size={28} className="text-emerald-400" />
          </div>
          <h2 className="page-title mb-1">PO Gộp tạo thành công</h2>
          <p className="page-subtitle mb-6">
            Mã PO: <span className="text-[#60A5FA] font-bold font-mono">{result.poNumber}</span>
          </p>

          <div className="grid grid-cols-2 gap-3 text-left mb-6">
            {[
              { label: "Số PR nguồn",   value: s.sourcePrCount },
              { label: "Item đã gộp",   value: `${s.savedItems} dòng` },
              { label: "Item PO cuối",  value: s.mergedItemCount },
              { label: "Tổng giá trị",  value: s.totalAmount.toLocaleString("vi-VN") + " ₫" },
            ].map(({ label, value }) => (
              <div key={label} className="p-3 rounded-xl bg-[#0F1117] border border-[rgba(148,163,184,0.08)]">
                <p className="detail-label">{label}</p>
                <p className="text-base font-bold text-[#F1F5F9] mt-0.5">{value}</p>
              </div>
            ))}
          </div>

          <div className="flex flex-wrap gap-1.5 justify-center mb-6">
            {s.sourcePrNumbers.map((n) => (
              <span key={n} className="ref-tag">{n}</span>
            ))}
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => router.push(`/po/${result.id}`)}
              className="btn-primary flex-1 justify-center"
            >
              Xem PO vừa tạo <ArrowRight size={14} />
            </button>
            <button
              onClick={() => { setResult(null); setSelectedPrIds([]); setSupplierId(""); }}
              className="btn-secondary flex-1 justify-center"
            >
              Tạo thêm PO gộp
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-5 animate-fade-in">
      {/* Header */}
      <div className="page-header">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#2563EB]/10 border border-[#2563EB]/20 flex items-center justify-center shrink-0">
            <GitMerge size={18} className="text-[#60A5FA]" />
          </div>
          <div>
            <h1 className="page-title">Gộp PO từ nhiều PR</h1>
            <p className="page-subtitle">
              Chọn ≥ 2 PR đã duyệt → gộp items trùng → tạo 1 PO số lượng lớn, giá tốt hơn
            </p>
          </div>
        </div>
      </div>

      {/* Info banner */}
      <div className="info-banner">
        <Info size={15} className="text-[#60A5FA] shrink-0 mt-0.5" />
        <span>
          <strong className="text-[#F1F5F9]">SKU Match</strong>: gộp items cùng mã SKU — tối ưu cho văn phòng phẩm, linh kiện.&ensp;
          <strong className="text-[#F1F5F9]">Category Match</strong>: gộp cùng danh mục — tối ưu cho nhóm hàng theo ngành.&ensp;
          Giá PO lấy mức thấp nhất trong nhóm để tối đa đòn bẩy đàm phán.
        </span>
      </div>

      {error && (
        <div className="flex items-center gap-3 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/25 text-rose-400 text-sm">
          <AlertTriangle size={15} className="shrink-0" />
          <span className="flex-1">{error}</span>
          <button onClick={() => setError(null)} className="shrink-0 opacity-60 hover:opacity-100">
            <X size={14} />
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-5 gap-5">
        {/* LEFT 3 cols: PR Selection + Config */}
        <div className="xl:col-span-3 space-y-4">

          {/* Step 1 — Chọn PR */}
          <div className="erp-card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-[#F1F5F9] flex items-center gap-2">
                <span className="step-badge">1</span>
                Chọn PR cần gộp
              </h3>
              <div className="flex items-center gap-2">
                <span className="text-xs text-[#64748B]">
                  <span className="text-[#60A5FA] font-bold">{selectedPrIds.length}</span>
                  /{approvedPRs.length} đã chọn
                </span>
                {approvedPRs.length > 0 && (
                  selectedPrIds.length === approvedPRs.length ? (
                    <button
                      onClick={clearAll}
                      className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold text-[#64748B] hover:text-[#F1F5F9] hover:bg-[#1E212B] transition-colors"
                    >
                      <X size={10} /> Bỏ chọn
                    </button>
                  ) : (
                    <button
                      onClick={selectAll}
                      className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold text-[#60A5FA] hover:bg-[#2563EB]/10 transition-colors"
                    >
                      <CheckCheck size={10} /> Chọn tất cả
                    </button>
                  )
                )}
              </div>
            </div>

            {approvedPRs.length === 0 ? (
              <div className="empty-state">
                <GitMerge size={32} className="empty-state-icon" />
                <p className="empty-state-title">Không có PR nào ở trạng thái APPROVED</p>
                <p className="empty-state-desc">Cần duyệt PR trước khi gộp PO</p>
              </div>
            ) : (
              <div className="space-y-1.5 max-h-64 overflow-y-auto pr-1">
                {approvedPRs.map((pr: PR) => {
                  const sel = selectedPrIds.includes(pr.id);
                  return (
                    <button
                      key={pr.id}
                      onClick={() => togglePr(pr.id)}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl border transition-colors text-left ${
                        sel
                          ? "bg-[#2563EB]/10 border-[#2563EB]/30"
                          : "bg-[#0F1117] border-[rgba(148,163,184,0.07)] hover:border-[rgba(148,163,184,0.18)]"
                      }`}
                    >
                      {sel
                        ? <CheckSquare size={15} className="text-[#60A5FA] shrink-0" />
                        : <Square size={15} className="text-[#475569] shrink-0" />}
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-[#F1F5F9] font-mono truncate">{pr.prNumber}</p>
                        <p className="text-[10px] text-[#64748B] truncate mt-0.5">{pr.title ?? pr.description ?? "—"}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-xs font-bold text-[#F1F5F9]">
                          {pr.totalEstimate != null
                            ? Number(pr.totalEstimate).toLocaleString("vi-VN") + " ₫"
                            : "—"}
                        </p>
                        <p className="text-[10px] text-[#64748B]">{(pr.items ?? []).length} items</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Step 2 — Chế độ gộp */}
          <div className="erp-card">
            <h3 className="text-sm font-bold text-[#F1F5F9] flex items-center gap-2 mb-3">
              <span className="step-badge">2</span>
              Chế độ gộp item
            </h3>
            <div className="grid grid-cols-2 gap-3">
              {(["SKU_MATCH", "CATEGORY_MATCH"] as ConsolidationMode[]).map((m) => (
                <button
                  key={m}
                  onClick={() => setMode(m)}
                  className={`p-3.5 rounded-xl border text-left transition-colors ${
                    mode === m
                      ? "bg-[#2563EB]/10 border-[#2563EB]/30"
                      : "bg-[#0F1117] border-[rgba(148,163,184,0.08)] hover:border-[rgba(148,163,184,0.18)]"
                  }`}
                >
                  {m === "SKU_MATCH"
                    ? <Package size={16} className={mode === m ? "text-[#60A5FA]" : "text-[#64748B]"} />
                    : <Layers size={16} className={mode === m ? "text-[#60A5FA]" : "text-[#64748B]"} />}
                  <p className="text-xs font-bold text-[#F1F5F9] mt-2">
                    {m === "SKU_MATCH" ? "SKU Match" : "Category Match"}
                  </p>
                  <p className="text-[10px] text-[#64748B] mt-0.5 leading-relaxed">
                    {m === "SKU_MATCH"
                      ? "Gộp items cùng mã SKU (chính xác)"
                      : "Gộp items cùng danh mục sản phẩm"}
                  </p>
                </button>
              ))}
            </div>
          </div>

          {/* Step 3 — Thông tin PO */}
          <div className="erp-card">
            <h3 className="text-sm font-bold text-[#F1F5F9] flex items-center gap-2 mb-4">
              <span className="step-badge">3</span>
              Thông tin đơn hàng
            </h3>
            <div className="form-grid gap-4">
              {/* Nhà cung cấp */}
              <div className="form-group col-span-2">
                <label className="erp-label flex items-center gap-1">
                  <Building2 size={10} /> Nhà cung cấp *
                </label>
                <select
                  value={supplierId}
                  onChange={(e) => setSupplierId(e.target.value)}
                  className="erp-input"
                >
                  <option value="">— Chọn nhà cung cấp —</option>
                  {suppliers.map((s: Organization) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>

              {/* Ngày giao hàng */}
              <div className="form-group">
                <label className="erp-label flex items-center gap-1">
                  <Calendar size={10} /> Ngày giao hàng *
                </label>
                <input
                  type="date"
                  value={deliveryDate}
                  onChange={(e) => setDeliveryDate(e.target.value)}
                  className="erp-input"
                />
              </div>

              {/* Payment Terms */}
              <div className="form-group">
                <label className="erp-label flex items-center gap-1">
                  <DollarSign size={10} /> Điều khoản thanh toán
                </label>
                <select value={paymentTerms} onChange={(e) => setPaymentTerms(e.target.value)} className="erp-input">
                  <option value="Net 30">Net 30</option>
                  <option value="Net 45">Net 45</option>
                  <option value="Net 60">Net 60</option>
                  <option value="COD">COD (Thanh toán khi nhận)</option>
                  <option value="Prepaid">Trả trước 100%</option>
                </select>
              </div>

              {/* Delivery address */}
              <div className="form-group col-span-2">
                <label className="erp-label">Địa chỉ giao hàng</label>
                <input
                  type="text"
                  placeholder="Nhập địa chỉ giao hàng..."
                  value={deliveryAddress}
                  onChange={(e) => setDeliveryAddress(e.target.value)}
                  className="erp-input"
                />
              </div>

              {/* Notes */}
              <div className="form-group col-span-2">
                <label className="erp-label">Ghi chú nội bộ</label>
                <textarea
                  rows={2}
                  placeholder="Ghi chú cho đơn hàng gộp..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="erp-input resize-none"
                />
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT 2 cols — Preview sticky */}
        <div className="xl:col-span-2">
          <div className="erp-card sticky top-20">
            <h3 className="text-sm font-bold text-[#F1F5F9] flex items-center gap-2 mb-4">
              <GitMerge size={15} className="text-[#60A5FA]" />
              Xem trước kết quả gộp
            </h3>

            {selectedPrIds.length < 2 ? (
              <div className="empty-state py-12">
                <GitMerge size={36} className="empty-state-icon" />
                <p className="empty-state-title">Chọn ít nhất 2 PR</p>
                <p className="empty-state-desc">để xem trước kết quả gộp</p>
              </div>
            ) : (
              <>
                {/* KPI row */}
                <div className="grid grid-cols-3 gap-2 mb-4">
                  {[
                    { label: "PR nguồn", value: selectedPrIds.length,          color: "text-[#60A5FA]" },
                    { label: "Item gộp", value: previewItems.length,           color: "text-violet-400" },
                    { label: "VND",      value: (previewTotal / 1e6).toFixed(1) + "M", color: "text-emerald-400" },
                  ].map(({ label, value, color }) => (
                    <div key={label} className="p-2.5 rounded-xl bg-[#0F1117] border border-[rgba(148,163,184,0.07)] text-center">
                      <p className="detail-label">{label}</p>
                      <p className={`text-sm font-bold ${color} mt-0.5`}>{value}</p>
                    </div>
                  ))}
                </div>

                {/* Items */}
                <div className="space-y-2 max-h-72 overflow-y-auto pr-0.5">
                  {previewItems.map((item, idx) => (
                    <div key={item.key} className="p-3 rounded-xl bg-[#0F1117] border border-[rgba(148,163,184,0.07)]">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-start gap-2 min-w-0">
                          <span className="w-5 h-5 rounded-full bg-[#2563EB]/20 text-[#60A5FA] text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                            {idx + 1}
                          </span>
                          <div className="min-w-0">
                            <p className="text-xs font-semibold text-[#F1F5F9] truncate leading-tight">{item.description}</p>
                            {item.sku && (
                              <p className="text-[10px] text-[#64748B] font-mono mt-0.5">SKU: {item.sku}</p>
                            )}
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-xs font-bold text-emerald-400">
                            {(item.totalQty * item.unitPrice).toLocaleString("vi-VN")} ₫
                          </p>
                          <p className="text-[10px] text-[#64748B]">
                            {item.totalQty} {item.unit} × {item.unitPrice.toLocaleString("vi-VN")}
                          </p>
                        </div>
                      </div>
                      {/* Sources */}
                      <div className="flex flex-wrap gap-1 mt-2">
                        {item.sources.map((src) => (
                          <span key={src.prNumber} className="source-pill">
                            {src.prNumber}: <span className="text-[#F1F5F9]">{src.qty}</span>
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Total */}
                <div className="flex items-center justify-between mt-4 pt-4 border-t border-[rgba(148,163,184,0.1)]">
                  <span className="text-xs font-bold text-[#64748B] uppercase tracking-wider">Tổng cộng</span>
                  <span className="text-base font-bold text-emerald-400">
                    {previewTotal.toLocaleString("vi-VN")} ₫
                  </span>
                </div>

                {/* Submit */}
                <button
                  onClick={handleSubmit}
                  disabled={submitting || selectedPrIds.length < 2 || !supplierId || !deliveryDate}
                  className="btn-primary w-full justify-center mt-4 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {submitting ? (
                    <><Loader2 size={14} className="animate-spin" /> Đang xử lý...</>
                  ) : (
                    <><GitMerge size={14} /> Tạo PO Gộp ({previewItems.length} items) <ChevronRight size={14} /></>
                  )}
                </button>

                {(!supplierId || !deliveryDate) && (
                  <p className="text-[10px] text-[#64748B] text-center mt-2">
                    {!supplierId ? "Chưa chọn nhà cung cấp" : "Chưa nhập ngày giao hàng"}
                  </p>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
