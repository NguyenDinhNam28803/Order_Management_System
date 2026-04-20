"use client";

import React, { useState, useMemo, useRef, useEffect } from "react";
import {
  useProcurement, PR, PRItem,
  ConsolidationSummary, ConsolidatePRsResult,
} from "../../context/ProcurementContext";
import { Organization } from "@/app/types/api-types";
import {
  GitMerge, CheckSquare, Square, ChevronRight, Loader2,
  AlertTriangle, CheckCircle2, Building2, Package, ArrowRight,
  Info, DollarSign, Layers, Calendar, CheckCheck, X,
  Search, Sparkles, Star, TrendingUp, Truck, BadgeCheck
} from "lucide-react";
import { useRouter } from "next/navigation";

interface AiSupplierSuggestion {
  id: string;
  name: string;
  email?: string;
  matchScore: number;
  reasons: string[];
  historicalData?: { avgPrice: number; deliveryRate: number; qualityScore: number };
}

type ConsolidationMode = "SKU_MATCH" | "CATEGORY_MATCH";

export default function POConsolidatePage() {
  const router = useRouter();
  const { prs, myPrs, organizations, apiFetch, consolidatePRs } = useProcurement();

  // Lấy PR đã APPROVED hoặc IN_SOURCING (backend accept cả 2)
  // Fallback sang myPrs nếu prs rỗng (do role không có quyền xem all PRs)
  const prPool = useMemo(() => {
    const all = (prs ?? []);
    return all.length > 0 ? all : (myPrs ?? []);
  }, [prs, myPrs]);

  const approvedPRs = useMemo(
    () => prPool.filter((p: PR) => p.status === "APPROVED" || p.status === "IN_SOURCING"),
    [prPool]
  );

  // Form state
  const [selectedPrIds, setSelectedPrIds] = useState<string[]>([]);
  const [supplierId, setSupplierId]       = useState("");
  const [selectedSupplier, setSelectedSupplier] = useState<Organization | AiSupplierSuggestion | null>(null);
  const [mode, setMode]                   = useState<ConsolidationMode>("SKU_MATCH");
  const [deliveryDate, setDeliveryDate]   = useState(
    new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10)
  );
  const [paymentTerms, setPaymentTerms]   = useState("Net 30");
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [notes, setNotes]                 = useState("");

  // Supplier search state
  const [supplierSearch, setSupplierSearch] = useState("");
  const [showDropdown, setShowDropdown]     = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  // AI suggestion state
  const [aiSuggestions, setAiSuggestions]   = useState<AiSupplierSuggestion[]>([]);
  const [isAiLoading, setIsAiLoading]       = useState(false);
  const [showAiPanel, setShowAiPanel]       = useState(false);

  // UI state
  const [submitting, setSubmitting] = useState(false);
  const [error, setError]           = useState<string | null>(null);
  const [result, setResult]         = useState<ConsolidatePRsResult | null>(null);

  // Suppliers from org list
  const suppliers = useMemo(
    () => (organizations ?? []).filter((o: Organization) =>
      o.companyType === "SUPPLIER" || o.companyType === "BOTH"
    ),
    [organizations]
  );

  const filteredSuppliers = useMemo(() =>
    suppliers.filter((s: Organization) =>
      s.name.toLowerCase().includes(supplierSearch.toLowerCase()) ||
      (s.email ?? "").toLowerCase().includes(supplierSearch.toLowerCase())
    ).slice(0, 8),
    [suppliers, supplierSearch]
  );

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Auto-trigger AI mỗi khi chọn >= 2 PR
  useEffect(() => {
    if (selectedPrIds.length < 2) {
      setShowAiPanel(false);
      setAiSuggestions([]);
      return;
    }
    const timer = setTimeout(() => {
      fetchAiSuggestions();
    }, 400); // debounce 400ms tránh gọi liên tục khi tick nhanh
    return () => clearTimeout(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedPrIds]);

  const pickSupplier = (org: Organization) => {
    setSupplierId(org.id);
    setSelectedSupplier(org);
    setSupplierSearch("");
    setShowDropdown(false);
  };

  const pickAiSupplier = (s: AiSupplierSuggestion) => {
    // Try to match with real org first
    const matched = suppliers.find((o: Organization) =>
      o.id === s.id || o.name.toLowerCase() === s.name.toLowerCase()
    );
    if (matched) {
      setSupplierId(matched.id);
      setSelectedSupplier(matched);
    } else {
      setSupplierId(s.id);
      setSelectedSupplier(s);
    }
    setShowAiPanel(false);
  };

  // AI RAG suggestion — dùng items từ các PR đã chọn
  const fetchAiSuggestions = async () => {
    const selectedPRs = approvedPRs.filter((p: PR) => selectedPrIds.includes(p.id));
    const allItems = selectedPRs.flatMap((p: PR) => p.items ?? []);
    if (allItems.length === 0) return;

    const productNames = [...new Set(
      allItems.map((i: PRItem) => i.productName || i.productId || i.productDesc || "").filter(Boolean)
    )].join(", ");

    setIsAiLoading(true);
    setShowAiPanel(true);
    setAiSuggestions([]);

    try {
      const resp = await apiFetch("/rag/query", {
        method: "POST",
        body: JSON.stringify({
          question: `Gợi ý 3 nhà cung cấp tốt nhất cho PO gộp gồm các sản phẩm: ${productNames}. Phân tích KPI, giá lịch sử, tỷ lệ giao hàng đúng hạn.`,
          topK: 5,
        }),
      });

      if (!resp.ok) throw new Error("RAG failed");

      const raw = await resp.json();
      const ragResult = raw.data || raw;
      let suggestions: AiSupplierSuggestion[] = [];

      if (ragResult?.sources?.length > 0) {
        suggestions = ragResult.sources
          .filter((s: { metadata: { table?: string }; content: string }) =>
            s.metadata?.table === "supplier_kpi_scores" ||
            s.metadata?.table === "organizations" ||
            s.content.toLowerCase().includes("nhà cung cấp") ||
            s.content.toLowerCase().includes("supplier")
          )
          .slice(0, 3)
          .map((src: { content: string; metadata: { id?: string }; similarity?: number }, idx: number) => {
            const content = src.content;
            const nameMatch = content.match(/(?:nhà cung cấp|supplier|tổ chức)[^:]*:\s*([^\n.]+)/i) || content.match(/^([^\n.]+)/);
            const name = nameMatch ? nameMatch[1].trim() : `Nhà cung cấp ${idx + 1}`;
            const deliveryMatch = content.match(/giao hàng[:\s]+(\d+)%/i);
            const qualityMatch  = content.match(/chất lượng[:\s]+(\d+\.?\d*)/i);
            const priceMatch    = content.match(/giá[:\s]+(\d[\d.,]*)/i);
            const reasons: string[] = [];
            if (deliveryMatch) reasons.push(`Giao hàng: ${deliveryMatch[1]}%`);
            if (qualityMatch)  reasons.push(`Chất lượng: ${qualityMatch[1]}/5`);
            if (reasons.length === 0) reasons.push("Phù hợp sản phẩm gộp");
            if ((src.similarity ?? 0) > 0.7) reasons.push("Độ tương đồng cao");
            return {
              id: src.metadata?.id || `ai-${idx}`,
              name: name.length > 50 ? name.slice(0, 50) + "…" : name,
              matchScore: Math.min(Math.round((src.similarity ?? 0.5) * 100), 98),
              reasons,
              historicalData: {
                avgPrice: priceMatch ? parseInt(priceMatch[1].replace(/[,.]/g, "")) : 1_000_000 + idx * 200_000,
                deliveryRate: deliveryMatch ? parseInt(deliveryMatch[1]) : 95 - idx * 3,
                qualityScore: qualityMatch ? parseFloat(qualityMatch[1]) : 4.5 - idx * 0.15,
              },
            };
          });
      }

      // Fallback từ summary text
      if (suggestions.length === 0 && ragResult?.answer?.summary) {
        const matches = (ragResult.answer.summary as string).match(/(?:\d+\.\s*|[-•]\s*)([^\n:]+)/g);
        if (matches) {
          suggestions = matches.slice(0, 3).map((m: string, idx: number) => ({
            id: `ai-${idx}`,
            name: m.replace(/^\d+\.\s*|[-•]\s*/, "").trim(),
            matchScore: 90 - idx * 5,
            reasons: ["Được AI gợi ý", "Phù hợp sản phẩm gộp"],
            historicalData: { avgPrice: 1_000_000 + idx * 300_000, deliveryRate: 94 - idx * 2, qualityScore: 4.4 - idx * 0.2 },
          }));
        }
      }

      setAiSuggestions(suggestions);
    } catch {
      setAiSuggestions([]);
    } finally {
      setIsAiLoading(false);
    }
  };

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
      setResult(res);
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
            {s.sourcePrNumbers.map((n, idx) => (
              <span key={idx} className="ref-tag">********</span>
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
        <div className="flex items-start gap-3 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/25 text-rose-400 text-sm">
          <AlertTriangle size={15} className="shrink-0 mt-0.5" />
          <div className="flex-1">
            <span>{error}</span>
            {error.includes('hợp đồng') && (
              <a
                href="/contracts/create"
                className="block mt-1.5 text-[11px] font-black text-rose-300 underline underline-offset-2 hover:text-white transition-colors"
              >
                → Tạo hợp đồng khung ngay
              </a>
            )}
          </div>
          <button onClick={() => setError(null)} className="shrink-0 opacity-60 hover:opacity-100 mt-0.5">
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
                <p className="empty-state-title">Không có PR nào sẵn sàng để gộp</p>
                <p className="empty-state-desc">Cần có PR ở trạng thái APPROVED hoặc IN_SOURCING</p>
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
                        <p className="text-xs font-bold text-[#F1F5F9] font-mono truncate">********</p>
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

            {/* Flow note */}
            <div className="flex items-start gap-3 p-3.5 rounded-xl bg-amber-500/8 border border-amber-500/20 mb-5 text-xs">
              <Info size={14} className="text-amber-400 shrink-0 mt-0.5" />
              <span className="text-amber-300/80 leading-relaxed">
                <strong className="text-amber-300">Lưu ý quy trình:</strong> Tính năng này tạo PO trực tiếp (bypass RFQ) — phù hợp khi đã có khung hợp đồng hoặc nhà cung cấp ưu tiên. Nếu chưa có báo giá, nên tạo RFQ trước để đảm bảo tính cạnh tranh.
              </span>
            </div>

            <div className="form-grid gap-4">
              {/* Nhà cung cấp — Search + AI */}
              <div className="form-group col-span-2 space-y-3">
                <label className="erp-label flex items-center gap-1">
                  <Building2 size={10} /> Nhà cung cấp *
                </label>

                {/* Selected display */}
                {selectedSupplier ? (
                  <div className="flex items-center justify-between p-3 rounded-xl bg-[#2563EB]/10 border border-[#2563EB]/30">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-[#2563EB]/20 flex items-center justify-center text-[#60A5FA]">
                        <Building2 size={14} />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-[#F1F5F9]">{selectedSupplier.name}</p>
                        {"email" in selectedSupplier && selectedSupplier.email && (
                          <p className="text-[10px] text-[#64748B]">{selectedSupplier.email}</p>
                        )}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => { setSupplierId(""); setSelectedSupplier(null); }}
                      className="p-1.5 rounded-lg text-[#64748B] hover:text-rose-400 hover:bg-rose-500/10 transition-all"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ) : (
                  <div ref={searchRef} className="relative">
                    <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#64748B]" />
                    <input
                      type="text"
                      placeholder="Tìm kiếm nhà cung cấp..."
                      value={supplierSearch}
                      onChange={(e) => { setSupplierSearch(e.target.value); setShowDropdown(true); }}
                      onFocus={() => setShowDropdown(true)}
                      className="erp-input pl-9"
                    />
                    {showDropdown && supplierSearch && (
                      <div className="absolute top-full mt-1 left-0 right-0 z-30 bg-[#1E212B] border border-[rgba(148,163,184,0.12)] rounded-xl shadow-2xl overflow-hidden max-h-52 overflow-y-auto">
                        {filteredSuppliers.length > 0 ? filteredSuppliers.map((s: Organization) => (
                          <button
                            key={s.id}
                            type="button"
                            onClick={() => pickSupplier(s)}
                            className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-[#2563EB]/10 text-left transition-colors"
                          >
                            <div className="w-7 h-7 rounded-lg bg-[#0F1117] flex items-center justify-center text-[#60A5FA] shrink-0">
                              <Building2 size={12} />
                            </div>
                            <div>
                              <p className="text-xs font-bold text-[#F1F5F9]">{s.name}</p>
                              {s.email && <p className="text-[10px] text-[#64748B]">{s.email}</p>}
                            </div>
                          </button>
                        )) : (
                          <p className="px-4 py-3 text-xs text-[#64748B] italic">Không tìm thấy nhà cung cấp</p>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* AI status — auto-trigger, no manual button needed */}
                <div className="flex items-center gap-2 text-[10px]">
                  {selectedPrIds.length < 2 ? (
                    <span className="text-[#64748B] italic flex items-center gap-1.5">
                      <Sparkles size={11} className="text-[#475569]" />
                      Chọn ≥ 2 PR để AI tự động gợi ý nhà cung cấp
                    </span>
                  ) : isAiLoading ? (
                    <span className="text-violet-400 flex items-center gap-1.5">
                      <Loader2 size={11} className="animate-spin" />
                      AI đang phân tích {selectedPrIds.length} PR…
                    </span>
                  ) : aiSuggestions.length > 0 ? (
                    <span className="text-emerald-400 flex items-center gap-1.5">
                      <Sparkles size={11} />
                      AI đã gợi ý {aiSuggestions.length} nhà cung cấp (tự động từ {selectedPrIds.length} PR)
                    </span>
                  ) : (
                    <span className="text-[#64748B] italic flex items-center gap-1.5">
                      <Sparkles size={11} />
                      AI không tìm thấy gợi ý — tìm thủ công bên trên
                    </span>
                  )}
                </div>

                {/* AI Panel */}
                {showAiPanel && (
                  <div className="rounded-xl border border-violet-500/25 bg-violet-500/5 overflow-hidden">
                    <div className="flex items-center justify-between px-4 py-2.5 border-b border-violet-500/20">
                      <span className="text-[10px] font-black uppercase tracking-widest text-violet-400 flex items-center gap-1.5">
                        <Sparkles size={11} /> Gợi ý từ AI (RAG)
                      </span>
                      <button type="button" onClick={() => setShowAiPanel(false)} className="text-[#64748B] hover:text-[#F1F5F9]">
                        <X size={13} />
                      </button>
                    </div>

                    {isAiLoading ? (
                      <div className="p-6 flex items-center justify-center gap-3 text-[#64748B]">
                        <Loader2 size={16} className="animate-spin text-violet-400" />
                        <span className="text-xs font-medium">Đang truy vấn dữ liệu lịch sử…</span>
                      </div>
                    ) : aiSuggestions.length === 0 ? (
                      <p className="p-4 text-xs text-[#64748B] italic text-center">
                        AI không tìm thấy gợi ý phù hợp — thử chọn thêm PR hoặc tìm thủ công.
                      </p>
                    ) : (
                      <div className="divide-y divide-violet-500/10">
                        {aiSuggestions.map((s, idx) => (
                          <div key={s.id} className="p-4 flex items-start gap-4">
                            {/* Rank */}
                            <div className="w-6 h-6 rounded-full bg-violet-500/20 text-violet-400 text-[10px] font-black flex items-center justify-center shrink-0 mt-0.5">
                              {idx + 1}
                            </div>

                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1.5">
                                <p className="text-sm font-bold text-[#F1F5F9] truncate">{s.name}</p>
                                <span className="shrink-0 text-[10px] font-black text-violet-400 bg-violet-500/10 px-2 py-0.5 rounded-full border border-violet-500/20">
                                  {s.matchScore}% match
                                </span>
                              </div>

                              {/* KPI mini row */}
                              {s.historicalData && (
                                <div className="flex items-center gap-3 mb-2">
                                  <span className="flex items-center gap-1 text-[10px] text-emerald-400">
                                    <Truck size={10} /> {s.historicalData.deliveryRate}%
                                  </span>
                                  <span className="flex items-center gap-1 text-[10px] text-amber-400">
                                    <Star size={10} /> {s.historicalData.qualityScore.toFixed(1)}/5
                                  </span>
                                  <span className="flex items-center gap-1 text-[10px] text-blue-400">
                                    <TrendingUp size={10} /> {s.historicalData.avgPrice.toLocaleString("vi-VN")} ₫/unit
                                  </span>
                                </div>
                              )}

                              <div className="flex flex-wrap gap-1">
                                {s.reasons.map((r, i) => (
                                  <span key={i} className="text-[9px] text-[#64748B] bg-[#0F1117] px-2 py-0.5 rounded-full border border-[rgba(148,163,184,0.08)]">
                                    {r}
                                  </span>
                                ))}
                              </div>
                            </div>

                            <button
                              type="button"
                              onClick={() => pickAiSupplier(s)}
                              disabled={!!selectedSupplier}
                              className="flex items-center gap-1 px-3 py-1.5 bg-violet-600 hover:bg-violet-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-[10px] font-black uppercase rounded-lg transition-all shrink-0"
                            >
                              <BadgeCheck size={12} /> Chọn
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
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
                        {item.sources.map((src, sIdx) => (
                          <span key={sIdx} className="source-pill">
                            ********: <span className="text-[#F1F5F9]">{src.qty}</span>
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
