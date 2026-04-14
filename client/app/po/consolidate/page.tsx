"use client";

import React, { useState, useMemo } from "react";
import { useProcurement, PR } from "../../context/ProcurementContext";
import {
  GitMerge, CheckSquare, Square, ChevronRight, Loader2,
  AlertTriangle, CheckCircle2, Building2, Package, ArrowRight,
  Info, DollarSign, Layers, Calendar
} from "lucide-react";
import { useRouter } from "next/navigation";
import { poConsolidateAPI, ConsolidationSummary } from "../../utils/api-client";

type ConsolidationMode = "SKU_MATCH" | "CATEGORY_MATCH";

export default function POConsolidatePage() {
  const router = useRouter();
  const { prs, organizations } = useProcurement();

  // ── Chỉ lấy PR đã APPROVED ────────────────────────────────────────────────
  const approvedPRs = useMemo(
    () => (prs ?? []).filter((p: PR) => p.status === "APPROVED"),
    [prs]
  );

  // ── Form state ─────────────────────────────────────────────────────────────
  const [selectedPrIds, setSelectedPrIds] = useState<string[]>([]);
  const [supplierId, setSupplierId]       = useState("");
  const [mode, setMode]                   = useState<ConsolidationMode>("SKU_MATCH");
  const [deliveryDate, setDeliveryDate]   = useState(
    new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10)
  );
  const [paymentTerms, setPaymentTerms]   = useState("Net 30");
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [notes, setNotes]                 = useState("");

  // ── UI state ───────────────────────────────────────────────────────────────
  const [submitting, setSubmitting] = useState(false);
  const [error, setError]           = useState<string | null>(null);
  const [result, setResult]         = useState<{ poNumber: string; id: string; consolidationSummary: ConsolidationSummary } | null>(null);

  // ── Supplier list from organizations ──────────────────────────────────────
  const suppliers = useMemo(
    () => (organizations ?? []).filter((o: any) =>
      o.companyType === "SUPPLIER" || o.companyType === "BOTH"
    ),
    [organizations]
  );

  // ── Preview: simulate merge to show user what will happen ─────────────────
  const previewItems = useMemo(() => {
    if (selectedPrIds.length < 2) return [];
    const selectedPRs = approvedPRs.filter((p: PR) => selectedPrIds.includes(p.id));
    const allItems = selectedPRs.flatMap((pr: PR) =>
      (pr.items ?? []).map((item: any) => ({ ...item, prNumber: pr.prNumber, costCenterId: pr.costCenterId }))
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
      totalQty: items.reduce((s: number, i: any) => s + Number(i.qty ?? 0), 0),
      unitPrice: Math.min(...items.map((i: any) => Number(i.estimatedPrice ?? 0))),
      sources: items.map((i: any) => ({ prNumber: i.prNumber, qty: Number(i.qty ?? 0) })),
    }));
  }, [selectedPrIds, approvedPRs, mode]);

  const previewTotal = previewItems.reduce((s, i) => s + i.totalQty * i.unitPrice, 0);

  const togglePr = (id: string) =>
    setSelectedPrIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );

  const handleSubmit = async () => {
    if (selectedPrIds.length < 2) { setError("Cần chọn ít nhất 2 PR"); return; }
    if (!supplierId)               { setError("Vui lòng chọn nhà cung cấp"); return; }
    if (!deliveryDate)             { setError("Vui lòng nhập ngày giao hàng"); return; }
    setError(null);
    setSubmitting(true);
    try {
      const res = await poConsolidateAPI.consolidate({
        prIds: selectedPrIds,
        supplierId,
        consolidationMode: mode,
        deliveryDate,
        paymentTerms: paymentTerms || undefined,
        deliveryAddress: deliveryAddress || undefined,
        notes: notes || undefined,
      });
      setResult(res);
    } catch (err: any) {
      setError(err?.message ?? "Đã xảy ra lỗi khi gộp PO");
    } finally {
      setSubmitting(false);
    }
  };

  // ── Success screen ─────────────────────────────────────────────────────────
  if (result) {
    const s = result.consolidationSummary;
    return (
      <div className="p-6 flex items-center justify-center min-h-[60vh]">
        <div className="erp-card max-w-lg w-full text-center animate-fade-in">
          <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 size={32} className="text-emerald-400" />
          </div>
          <h2 className="text-lg font-black text-[#F8FAFC] mb-1">PO Gộp tạo thành công!</h2>
          <p className="text-sm text-[#64748B] mb-6">
            Mã PO: <span className="text-[#60A5FA] font-bold">{result.poNumber}</span>
          </p>

          <div className="grid grid-cols-2 gap-3 text-left mb-6">
            {[
              { label: "Số PR nguồn",     value: s.sourcePrCount },
              { label: "Item gộp lại",    value: `${s.savedItems} item` },
              { label: "Item PO cuối",    value: s.mergedItemCount },
              { label: "Tổng giá trị",    value: s.totalAmount.toLocaleString("vi-VN") + " đ" },
            ].map(({ label, value }) => (
              <div key={label} className="p-3 rounded-xl bg-[#0F1117]">
                <p className="text-[10px] text-[#64748B] font-bold uppercase tracking-wider">{label}</p>
                <p className="text-base font-black text-[#F8FAFC] mt-0.5">{value}</p>
              </div>
            ))}
          </div>

          <p className="text-xs text-[#64748B] mb-6">
            PR nguồn: {s.sourcePrNumbers.join(", ")}
          </p>

          <div className="flex gap-3">
            <button
              onClick={() => router.push(`/po/${result.id}`)}
              className="btn-primary flex-1 justify-center"
            >
              Xem PO vừa tạo <ArrowRight size={14} />
            </button>
            <button
              onClick={() => { setResult(null); setSelectedPrIds([]); }}
              className="btn-secondary flex-1 justify-center"
            >
              Gộp thêm PO khác
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-[#3B82F6]/10 flex items-center justify-center">
          <GitMerge size={20} className="text-[#60A5FA]" />
        </div>
        <div>
          <h1 className="text-xl font-black text-[#F8FAFC]">Gộp PO từ nhiều PR</h1>
          <p className="text-xs text-[#64748B] mt-0.5">
            Chọn ≥2 PR đã duyệt → gộp items giống nhau → tạo 1 PO duy nhất với số lượng lớn hơn
          </p>
        </div>
      </div>

      {/* Info Banner */}
      <div className="flex items-start gap-3 p-4 rounded-xl bg-[#3B82F6]/10 border border-[#3B82F6]/20">
        <Info size={16} className="text-[#60A5FA] shrink-0 mt-0.5" />
        <div className="text-xs text-[#94A3B8] leading-relaxed">
          <strong className="text-[#F8FAFC]">SKU_MATCH</strong>: gộp các item cùng mã SKU —
          dùng khi sản phẩm được định danh chính xác (văn phòng phẩm, linh kiện điện tử...).{" "}
          <strong className="text-[#F8FAFC]">CATEGORY_MATCH</strong>: gộp cùng danh mục —
          dùng cho nhóm hàng hóa cùng loại (vật tư cơ khí, thiết bị điện...).
          Giá PO = giá thấp nhất trong nhóm để tối ưu đàm phán.
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-sm">
          <AlertTriangle size={16} className="shrink-0" />
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* LEFT: PR Selection + Config */}
        <div className="space-y-5">
          {/* Step 1: Chọn PR */}
          <div className="erp-card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-black text-[#F8FAFC] flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-[#3B82F6] text-white text-xs flex items-center justify-center font-black">1</span>
                Chọn PR cần gộp
              </h3>
              <span className="text-xs text-[#64748B]">
                Đã chọn <span className="text-[#60A5FA] font-bold">{selectedPrIds.length}</span> PR
              </span>
            </div>

            {approvedPRs.length === 0 ? (
              <p className="text-sm text-[#64748B] text-center py-8">
                Không có PR nào ở trạng thái APPROVED
              </p>
            ) : (
              <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                {approvedPRs.map((pr: PR) => {
                  const selected = selectedPrIds.includes(pr.id);
                  return (
                    <button
                      key={pr.id}
                      onClick={() => togglePr(pr.id)}
                      className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-all text-left ${
                        selected
                          ? "bg-[#3B82F6]/15 border-[#3B82F6]/40"
                          : "bg-[#0F1117] border-[rgba(148,163,184,0.08)] hover:border-[rgba(148,163,184,0.2)]"
                      }`}
                    >
                      {selected
                        ? <CheckSquare size={16} className="text-[#60A5FA] shrink-0" />
                        : <Square size={16} className="text-[#64748B] shrink-0" />}
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-[#F8FAFC] truncate">{pr.prNumber}</p>
                        <p className="text-[10px] text-[#64748B] truncate">{pr.title ?? pr.description ?? "—"}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-xs font-bold text-[#F8FAFC]">
                          {pr.totalEstimate != null
                            ? Number(pr.totalEstimate).toLocaleString("vi-VN") + " đ"
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

          {/* Step 2: Chế độ gộp */}
          <div className="erp-card">
            <h3 className="text-sm font-black text-[#F8FAFC] flex items-center gap-2 mb-4">
              <span className="w-6 h-6 rounded-full bg-[#3B82F6] text-white text-xs flex items-center justify-center font-black">2</span>
              Chế độ gộp
            </h3>
            <div className="grid grid-cols-2 gap-3">
              {(["SKU_MATCH", "CATEGORY_MATCH"] as ConsolidationMode[]).map((m) => (
                <button
                  key={m}
                  onClick={() => setMode(m)}
                  className={`p-4 rounded-xl border text-left transition-all ${
                    mode === m
                      ? "bg-[#3B82F6]/15 border-[#3B82F6]/40"
                      : "bg-[#0F1117] border-[rgba(148,163,184,0.08)] hover:border-[rgba(148,163,184,0.2)]"
                  }`}
                >
                  {m === "SKU_MATCH"
                    ? <Package size={18} className={mode === m ? "text-[#60A5FA]" : "text-[#64748B]"} />
                    : <Layers size={18} className={mode === m ? "text-[#60A5FA]" : "text-[#64748B]"} />}
                  <p className="text-xs font-bold text-[#F8FAFC] mt-2">{m === "SKU_MATCH" ? "SKU Match" : "Category Match"}</p>
                  <p className="text-[10px] text-[#64748B] mt-0.5 leading-relaxed">
                    {m === "SKU_MATCH" ? "Gộp theo mã SKU giống nhau" : "Gộp theo danh mục sản phẩm"}
                  </p>
                </button>
              ))}
            </div>
          </div>

          {/* Step 3: Cấu hình PO */}
          <div className="erp-card">
            <h3 className="text-sm font-black text-[#F8FAFC] flex items-center gap-2 mb-4">
              <span className="w-6 h-6 rounded-full bg-[#3B82F6] text-white text-xs flex items-center justify-center font-black">3</span>
              Thông tin PO
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
                  {suppliers.map((s: any) => (
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
                  <DollarSign size={10} /> Điều khoản TT
                </label>
                <select value={paymentTerms} onChange={(e) => setPaymentTerms(e.target.value)} className="erp-input">
                  <option value="Net 30">Net 30</option>
                  <option value="Net 45">Net 45</option>
                  <option value="Net 60">Net 60</option>
                  <option value="COD">COD</option>
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
                <label className="erp-label">Ghi chú</label>
                <textarea
                  rows={2}
                  placeholder="Ghi chú thêm cho đơn hàng gộp..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="erp-input resize-none"
                />
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT: Preview */}
        <div className="space-y-5">
          <div className="erp-card sticky top-20">
            <h3 className="text-sm font-black text-[#F8FAFC] flex items-center gap-2 mb-4">
              <GitMerge size={16} className="text-[#60A5FA]" />
              Xem trước kết quả gộp
            </h3>

            {selectedPrIds.length < 2 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <GitMerge size={32} className="text-[#64748B] opacity-40 mb-3" />
                <p className="text-sm text-[#64748B] font-semibold">Chọn ít nhất 2 PR</p>
                <p className="text-xs text-[#64748B] opacity-60 mt-1">để xem trước kết quả gộp</p>
              </div>
            ) : (
              <>
                {/* Summary cards */}
                <div className="grid grid-cols-3 gap-2 mb-4">
                  {[
                    { label: "PR nguồn",   value: selectedPrIds.length, color: "text-[#60A5FA]" },
                    { label: "Item gộp",   value: previewItems.length,  color: "text-violet-400" },
                    { label: "Tổng (đ)",   value: previewTotal.toLocaleString("vi-VN"), color: "text-emerald-400" },
                  ].map(({ label, value, color }) => (
                    <div key={label} className="p-3 rounded-xl bg-[#0F1117] text-center">
                      <p className="text-[9px] text-[#64748B] font-bold uppercase">{label}</p>
                      <p className={`text-sm font-black ${color} mt-0.5`}>{value}</p>
                    </div>
                  ))}
                </div>

                {/* Merged items list */}
                <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                  {previewItems.map((item, idx) => (
                    <div key={item.key} className="p-3 rounded-xl bg-[#0F1117] border border-[rgba(148,163,184,0.08)]">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-start gap-2 min-w-0">
                          <span className="w-5 h-5 rounded-full bg-[#3B82F6]/20 text-[#60A5FA] text-[10px] font-black flex items-center justify-center shrink-0 mt-0.5">
                            {idx + 1}
                          </span>
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-[#F8FAFC] truncate">{item.description}</p>
                            {item.sku && (
                              <p className="text-[10px] text-[#64748B] font-mono">SKU: {item.sku}</p>
                            )}
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-xs font-bold text-emerald-400">
                            {(item.totalQty * item.unitPrice).toLocaleString("vi-VN")} đ
                          </p>
                          <p className="text-[10px] text-[#64748B]">
                            {item.totalQty} {item.unit} × {item.unitPrice.toLocaleString("vi-VN")}
                          </p>
                        </div>
                      </div>
                      {/* Sources */}
                      <div className="flex flex-wrap gap-1 mt-2">
                        {item.sources.map((src) => (
                          <span key={src.prNumber}
                            className="px-1.5 py-0.5 rounded bg-[#1E212B] text-[9px] text-[#94A3B8] font-mono">
                            {src.prNumber}: {src.qty}
                          </span>
                        ))}
                        <span className="text-[9px] text-[#64748B] ml-1 self-center">→ gộp lại</span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Submit */}
                <button
                  onClick={handleSubmit}
                  disabled={submitting || selectedPrIds.length < 2 || !supplierId}
                  className="btn-primary w-full justify-center mt-5 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {submitting ? (
                    <><Loader2 size={14} className="animate-spin" /> Đang xử lý...</>
                  ) : (
                    <><GitMerge size={14} /> Tạo PO Gộp ({previewItems.length} items) <ChevronRight size={14} /></>
                  )}
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
