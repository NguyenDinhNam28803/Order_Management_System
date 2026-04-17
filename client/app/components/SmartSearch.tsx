"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Search, FileText, ShoppingCart, DollarSign,
  Clock, User, Building, X, Sparkles, ArrowRight,
  Command, TrendingUp, Loader2, AlertCircle,
} from "lucide-react";
import { useProcurement, PR, PO } from "../context/ProcurementContext";
import { getStatusLabel } from "../utils/formatUtils";
import { useRouter } from "next/navigation";

interface SearchResult {
  id: string;
  type: "PR" | "PO" | "INVOICE" | "VENDOR" | "PRODUCT" | "AI";
  title: string;
  subtitle: string;
  metadata: string;
  status?: string;
  href?: string;
}

interface RagSource {
  table: string;
  id?: string;
  similarity?: number;
  metadata?: Record<string, unknown>;
}

const SUGGESTIONS = [
  { icon: <TrendingUp size={14} />, text: "Budget phòng IT còn bao nhiêu?", type: "ai" },
  { icon: <FileText   size={14} />, text: "PR đang chờ duyệt của tôi",       type: "ai" },
  { icon: <ShoppingCart size={14}/>, text: "PO chờ xác nhận từ nhà cung cấp", type: "ai" },
  { icon: <DollarSign size={14} />, text: "Hóa đơn quá hạn thanh toán",      type: "ai" },
];

// Detect if the query looks like a natural-language question
function isNaturalLanguage(q: string) {
  const nlKeywords = [
    "bao nhiêu", "còn", "budget", "ngân sách", "tổng", "danh sách",
    "mấy", "có", "chờ", "quá hạn", "nhà cung cấp", "sắp", "đã",
    "giá", "hợp đồng", "báo cáo", "thống kê",
  ];
  return nlKeywords.some((k) => q.toLowerCase().includes(k)) || q.includes("?");
}

export default function SmartSearch() {
  const [isOpen,         setIsOpen]         = useState(false);
  const [query,          setQuery]          = useState("");
  const [results,        setResults]        = useState<SearchResult[]>([]);
  const [aiAnswer,       setAiAnswer]       = useState<string>("");
  const [aiSources,      setAiSources]      = useState<RagSource[]>([]);
  const [selectedIndex,  setSelectedIndex]  = useState(0);
  const [isAiMode,       setIsAiMode]       = useState(false);
  const [isLoading,      setIsLoading]      = useState(false);
  const [error,          setError]          = useState<string>("");

  const { apiFetch, prs, pos } = useProcurement();
  const router   = useRouter();
  const debounce = useRef<NodeJS.Timeout | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // ── Keyboard shortcuts ──────────────────────────────────────────────────
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setIsOpen((v) => !v);
      }
      if (e.key === "Escape") setIsOpen(false);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  useEffect(() => {
    if (isOpen) setTimeout(() => inputRef.current?.focus(), 50);
  }, [isOpen]);

  // ── Local entity search across prs / pos ────────────────────────────────
  const localSearch = useCallback((q: string): SearchResult[] => {
    const lower = q.toLowerCase();
    const hits: SearchResult[] = [];

    (prs ?? []).slice(0, 50).forEach((pr: PR) => {
      if (
        pr.prNumber?.toLowerCase().includes(lower) ||
        pr.title?.toLowerCase().includes(lower)
      ) {
        hits.push({
          id: pr.id,
          type: "PR",
          title: pr.title || pr.prNumber || "—",
          subtitle: `Người yêu cầu: ${pr.requester?.fullName ?? "—"}`,
          metadata: `${pr.prNumber} • ${(pr as PR & { dept?: { name?: string } }).dept?.name ?? ""}`,
          status: pr.status,
          href: `/pr/${pr.id}`,
        });
      }
    });

    (pos ?? []).slice(0, 50).forEach((po: PO) => {
      if (
        po.poNumber?.toLowerCase().includes(lower) ||
        (po as PO & { supplierName?: string }).supplierName?.toLowerCase().includes(lower)
      ) {
        hits.push({
          id: po.id,
          type: "PO",
          title: `Đơn hàng ${po.poNumber}`,
          subtitle: `Nhà cung cấp: ${(po as PO & { supplier?: { fullName?: string }; supplierName?: string; totalAmount?: number }).supplier?.fullName ?? (po as PO & { supplierName?: string }).supplierName ?? "—"}`,
          metadata: `${po.poNumber} • ${Number((po as PO & { totalAmount?: number }).totalAmount ?? 0).toLocaleString("vi-VN")} ₫`,
          status: po.status,
          href: `/po/${po.id}`,
        });
      }
    });

    return hits.slice(0, 6);
  }, [prs, pos]);

  // ── RAG query for natural-language questions ────────────────────────────
  const ragSearch = useCallback(async (question: string) => {
    setIsLoading(true);
    setError("");
    setAiAnswer("");
    setAiSources([]);
    try {
      const resp = await apiFetch("/rag/query", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ question, topK: 5 }),
      });

      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const json = await resp.json();

      // Support both response shapes from server
      const answerObj = json?.data?.answer ?? json?.answer;
      const sources   = json?.data?.sources ?? json?.sources ?? [];

      const summary = answerObj?.summary ?? answerObj ?? "Không có câu trả lời";
      setAiAnswer(typeof summary === "string" ? summary : JSON.stringify(summary));
      setAiSources(sources);

      // Also surface any structured data rows as result cards
      const rows = (Array.isArray(answerObj?.data) ? answerObj.data : []) as Record<string, unknown>[];
      setResults(
        rows.slice(0, 5).map((row, i) => ({
          id:       (row.id as string) ?? `rag-${i}`,
          type:     "AI" as const,
          title:    (row.title as string) ?? (row.name as string) ?? (row.prNumber as string) ?? (row.poNumber as string) ?? `Kết quả ${i + 1}`,
          subtitle: String(row.description ?? row.status ?? ""),
          metadata: row.totalAmount
            ? `${Number(row.totalAmount).toLocaleString("vi-VN")} ₫`
            : (sources[i]?.table as string) ?? "",
          status: row.status as string,
        }))
      );
    } catch (err) {
      setError("Không thể kết nối AI. Kiểm tra lại server.");
    } finally {
      setIsLoading(false);
    }
  }, [apiFetch]);

  // ── Debounced search dispatcher ─────────────────────────────────────────
  useEffect(() => {
    if (debounce.current) clearTimeout(debounce.current);
    setAiAnswer("");
    setAiSources([]);
    setError("");

    if (!query.trim()) {
      setResults([]);
      setIsAiMode(false);
      return;
    }

    const nlMode = isNaturalLanguage(query);
    setIsAiMode(nlMode);

    if (nlMode) {
      debounce.current = setTimeout(() => void ragSearch(query), 600);
    } else {
      setResults(localSearch(query));
    }

    return () => { if (debounce.current) clearTimeout(debounce.current); };
  }, [query, ragSearch, localSearch]);

  const handleSelect = (result: SearchResult) => {
    if (result.href) router.push(result.href);
    setIsOpen(false);
    setQuery("");
  };

  const getIcon = (type: string) => {
    switch (type) {
      case "PR":      return <FileText     size={16} className="text-blue-400"    />;
      case "PO":      return <ShoppingCart size={16} className="text-emerald-400" />;
      case "INVOICE": return <DollarSign   size={16} className="text-amber-400"   />;
      case "VENDOR":  return <Building     size={16} className="text-violet-400"  />;
      case "AI":      return <Sparkles     size={16} className="text-violet-400"  />;
      default:        return <FileText     size={16} className="text-gray-400"    />;
    }
  };

  // ── Closed state: compact button ────────────────────────────────────────
  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 px-4 py-2 bg-[#161922] border border-[rgba(148,163,184,0.1)] rounded-xl text-[#64748B] hover:text-[#94A3B8] hover:border-[rgba(59,130,246,0.3)] transition-all text-sm"
      >
        <Search size={16} />
        <span className="hidden md:inline">Tìm kiếm...</span>
        <kbd className="hidden md:inline-flex items-center gap-1 px-2 py-0.5 bg-[#0F1117] rounded text-xs font-mono border border-[rgba(148,163,184,0.1)]">
          <Command size={12} /> K
        </kbd>
      </button>
    );
  }

  // ── Open state: modal ────────────────────────────────────────────────────
  return (
    <div className="fixed inset-0 z-[60] flex items-start justify-center pt-[15vh] p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={() => setIsOpen(false)}
      />

      {/* Modal */}
      <div className="relative w-full max-w-2xl bg-[#161922] border border-[rgba(148,163,184,0.1)] rounded-2xl shadow-2xl overflow-hidden animate-fade-in">

        {/* Input row */}
        <div className="flex items-center gap-3 p-4 border-b border-[rgba(148,163,184,0.1)]">
          {isLoading ? (
            <Loader2 size={20} className="text-violet-400 animate-spin shrink-0" />
          ) : isAiMode ? (
            <div className="p-1.5 bg-gradient-to-br from-[#8B5CF6] to-[#3B82F6] rounded-lg shrink-0">
              <Sparkles size={16} className="text-white" />
            </div>
          ) : (
            <Search size={20} className="text-[#64748B] shrink-0" />
          )}
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Tìm PR, PO, hóa đơn… hoặc hỏi tự nhiên bằng tiếng Việt"
            className="flex-1 bg-transparent text-[#F8FAFC] placeholder-[#64748B] text-[15px] outline-none"
          />
          {query && (
            <button onClick={() => setQuery("")} className="p-1 hover:bg-[rgba(148,163,184,0.1)] rounded shrink-0">
              <X size={16} className="text-[#64748B]" />
            </button>
          )}
          <kbd className="px-2 py-1 bg-[#0F1117] rounded text-xs text-[#64748B] border border-[rgba(148,163,184,0.1)] shrink-0">ESC</kbd>
        </div>

        {/* AI mode banner */}
        {isAiMode && (
          <div className="px-4 py-2 bg-gradient-to-r from-[rgba(139,92,246,0.1)] to-[rgba(59,130,246,0.1)] border-b border-[rgba(148,163,184,0.08)]">
            <p className="text-[11px] text-[#8B5CF6] flex items-center gap-2">
              <Sparkles size={11} />
              {isLoading ? "AI đang phân tích dữ liệu…" : "Kết quả từ AI Assistant · RAG Search"}
            </p>
          </div>
        )}

        {/* Body */}
        <div className="max-h-[52vh] overflow-y-auto">

          {/* Error state */}
          {error && (
            <div className="flex items-center gap-2 p-4 text-rose-400 text-sm">
              <AlertCircle size={16} />
              {error}
            </div>
          )}

          {/* AI answer bubble */}
          {aiAnswer && !isLoading && (
            <div className="mx-4 mt-3 mb-1 p-3 bg-[rgba(139,92,246,0.08)] border border-[rgba(139,92,246,0.2)] rounded-xl">
              <p className="text-[12px] font-semibold text-[#8B5CF6] mb-1 flex items-center gap-1">
                <Sparkles size={11} /> AI trả lời
              </p>
              <p className="text-[13px] text-[#E2E8F0] leading-relaxed whitespace-pre-wrap">{aiAnswer}</p>
              {aiSources.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {aiSources.slice(0, 4).map((s, i) => (
                    <span key={i} className="text-[10px] px-1.5 py-0.5 bg-[rgba(139,92,246,0.15)] text-[#8B5CF6] rounded-md">
                      {s.table ?? "source"}{s.similarity ? ` ${(s.similarity * 100).toFixed(0)}%` : ""}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Result cards */}
          {results.length > 0 && (
            <div className="py-2">
              <div className="px-4 py-1.5 text-[10px] font-bold text-[#64748B] uppercase tracking-widest">
                {isAiMode ? "Dữ liệu liên quan" : `Kết quả (${results.length})`}
              </div>
              {results.map((result, idx) => (
                <button
                  key={result.id}
                  onClick={() => handleSelect(result)}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`w-full flex items-start gap-3 px-4 py-2.5 transition-all text-left ${
                    selectedIndex === idx
                      ? "bg-[rgba(59,130,246,0.12)]"
                      : "hover:bg-[rgba(148,163,184,0.04)]"
                  }`}
                >
                  <div className="p-1.5 bg-[#0F1117] rounded-lg border border-[rgba(148,163,184,0.08)] shrink-0">
                    {getIcon(result.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[13px] font-semibold text-[#F8FAFC] truncate">{result.title}</span>
                      {result.status && (
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full shrink-0 ${
                          result.status === "PENDING_APPROVAL" ? "bg-amber-500/20 text-amber-400" :
                          result.status === "APPROVED"         ? "bg-emerald-500/20 text-emerald-400" :
                          "bg-blue-500/20 text-blue-400"
                        }`}>
                          {getStatusLabel(result.status)}
                        </span>
                      )}
                    </div>
                    <p className="text-[12px] text-[#94A3B8] truncate">{result.subtitle}</p>
                    <p className="text-[10px] text-[#64748B] mt-0.5">{result.metadata}</p>
                  </div>
                  <ArrowRight size={14} className="text-[#64748B] shrink-0 mt-1" />
                </button>
              ))}
            </div>
          )}

          {/* Empty: show suggestions */}
          {!query && !isLoading && (
            <div className="py-2">
              <div className="px-4 py-1.5 text-[10px] font-bold text-[#64748B] uppercase tracking-widest">Gợi ý AI</div>
              {SUGGESTIONS.map((s, i) => (
                <button
                  key={i}
                  onClick={() => setQuery(s.text)}
                  className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-[rgba(148,163,184,0.04)] transition-all text-left"
                >
                  <div className="p-1.5 rounded-lg bg-gradient-to-br from-[#8B5CF6] to-[#3B82F6] text-white shrink-0">
                    {s.icon}
                  </div>
                  <span className="text-[13px] text-[#F8FAFC]">{s.text}</span>
                  <span className="ml-auto text-[10px] text-[#8B5CF6] font-bold shrink-0">AI</span>
                </button>
              ))}
            </div>
          )}

          {/* No results */}
          {query && !isLoading && !error && !aiAnswer && results.length === 0 && (
            <div className="p-8 text-center">
              <Search size={28} className="mx-auto mb-3 text-[#64748B] opacity-40" />
              <p className="text-[13px] text-[#94A3B8]">Không tìm thấy kết quả cho &quot;{query}&quot;</p>
              <p className="text-[11px] text-[#64748B] mt-1">Thử đặt câu hỏi tự nhiên để AI tìm giúp bạn</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-4 py-2.5 bg-[#0F1117] border-t border-[rgba(148,163,184,0.08)] text-[11px] text-[#64748B]">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-[#161922] rounded border border-[rgba(148,163,184,0.1)]">↑↓</kbd> Chọn
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-[#161922] rounded border border-[rgba(148,163,184,0.1)]">↵</kbd> Mở
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <span>Powered by</span>
            <span className="text-[#8B5CF6] font-bold">RAG · FPT AI</span>
          </div>
        </div>
      </div>
    </div>
  );
}
