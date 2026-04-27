"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Plus, Search, RefreshCw, UserCheck, CheckCircle2, XCircle,
  Clock, AlertCircle, Loader2, ChevronRight, Building2, Filter,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

const API_BASE = process.env.NEXT_PUBLIC_API_URL;
// process.env.NEXT_PUBLIC_API_URL ||

function getToken(): string {
  if (typeof document === "undefined") return "";
  const match = document.cookie.match(/(?:^|;\s*)token=([^;]*)/);
  return match ? decodeURIComponent(match[1]) : "";
}

async function apiFetch(path: string, options: RequestInit = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${getToken()}`,
      ...(options.headers ?? {}),
    },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    throw new Error((err as any).message || "Request failed");
  }
  return res.json();
}

// ─── Types ────────────────────────────────────────────────────────────────────
interface VettingRequest {
  id: string;
  status: string;
  overallScore?: number;
  priceVsMarket?: number;
  notes?: string;
  createdAt: string;
  supplier: { id: string; name: string; email?: string; kycStatus: string; supplierTier?: string };
  requestedBy: { id: string; fullName?: string; email: string };
  assignedTo?: { id: string; fullName?: string; email: string };
  checks: { checkType: string; checkStatus: string }[];
}

// ─── Status badge ─────────────────────────────────────────────────────────────
const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  DRAFT:            { label: "Nháp",             color: "text-black bg-slate-500/10 border-slate-500/20",     icon: <Clock size={10} /> },
  IN_REVIEW:        { label: "Đang kiểm tra",    color: "text-[#CB7A62] bg-[#B4533A]/10 border-[#B4533A]/20",       icon: <AlertCircle size={10} /> },
  PENDING_APPROVAL: { label: "Chờ phê duyệt",    color: "text-black bg-amber-500/10 border-amber-500/20",    icon: <Clock size={10} /> },
  APPROVED:         { label: "Đã duyệt",         color: "text-black bg-emerald-500/10 border-emerald-500/20", icon: <CheckCircle2 size={10} /> },
  REJECTED:         { label: "Từ chối",          color: "text-red-400 bg-red-500/10 border-red-500/20",          icon: <XCircle size={10} /> },
  CANCELLED:        { label: "Đã huỷ",           color: "text-black bg-slate-500/10 border-slate-500/20",    icon: <XCircle size={10} /> },
};

function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status] ?? { label: status, color: "text-black bg-slate-500/10 border-slate-500/20", icon: null };
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${cfg.color}`}>
      {cfg.icon}{cfg.label}
    </span>
  );
}

function progressCount(checks: { checkStatus: string }[]) {
  if (!checks?.length) return { passed: 0, total: 0 };
  const passed = checks.filter((c) => c.checkStatus === "PASSED").length;
  return { passed, total: checks.length };
}

// ─── Create Modal ─────────────────────────────────────────────────────────────
function CreateModal({
  onClose, onCreated,
}: { onClose: () => void; onCreated: () => void }) {
  const [supplierId, setSupplierId] = useState("");
  const [priceVsMarket, setPriceVsMarket] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!supplierId.trim()) { setError("Vui lòng nhập Supplier ID"); return; }
    setLoading(true); setError("");
    try {
      await apiFetch("/supplier-vetting", {
        method: "POST",
        body: JSON.stringify({
          supplierId: supplierId.trim(),
          priceVsMarket: priceVsMarket ? parseFloat(priceVsMarket) : undefined,
          notes: notes || undefined,
        }),
      });
      onCreated();
      onClose();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/60 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl border border-[rgba(240,246,252,0.1)] bg-[#FAF8F5] p-6 shadow-2xl">
        <h2 className="mb-4 text-lg font-bold text-[#000000]">Tạo yêu cầu xét duyệt NCC</h2>
        {error && (
          <div className="mb-4 rounded-lg bg-red-500/10 border border-red-500/20 px-3 py-2 text-sm text-red-400">{error}</div>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-xs text-[#000000]">Supplier ID (UUID) *</label>
            <input
              value={supplierId}
              onChange={(e) => setSupplierId(e.target.value)}
              placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
              className="w-full rounded-lg border border-[rgba(240,246,252,0.08)] bg-[#FFFFFF] px-3 py-2 text-sm text-[#000000] placeholder:text-[#000000] focus:border-[#B4533A]/50 focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-[#000000]">Giá so thị trường (%)</label>
            <input
              type="number"
              step="0.1"
              value={priceVsMarket}
              onChange={(e) => setPriceVsMarket(e.target.value)}
              placeholder="-15.5 nghĩa là rẻ hơn 15.5%"
              className="w-full rounded-lg border border-[rgba(240,246,252,0.08)] bg-[#FFFFFF] px-3 py-2 text-sm text-[#000000] placeholder:text-[#000000] focus:border-[#B4533A]/50 focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-[#000000]">Ghi chú</label>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full rounded-lg border border-[rgba(240,246,252,0.08)] bg-[#FFFFFF] px-3 py-2 text-sm text-[#000000] placeholder:text-[#000000] focus:border-[#B4533A]/50 focus:outline-none resize-none"
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="rounded-lg px-4 py-2 text-sm text-[#000000] hover:text-[#000000]">Huỷ</button>
            <button type="submit" disabled={loading} className="flex items-center gap-2 rounded-lg bg-[#A85032] px-4 py-2 text-sm font-semibold text-[#000000] hover:bg-[#B4533A] disabled:opacity-50">
              {loading && <Loader2 size={14} className="animate-spin" />}Tạo
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function SupplierVettingListPage() {
  const router = useRouter();
  const [vettings, setVettings] = useState<VettingRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("ALL");
  const [showCreate, setShowCreate] = useState(false);

  const load = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const data = await apiFetch("/supplier-vetting");
      setVettings(Array.isArray(data) ? data : []);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const filtered = vettings.filter((v) => {
    const matchStatus = filterStatus === "ALL" || v.status === filterStatus;
    const q = search.toLowerCase();
    const matchSearch = !q || v.supplier.name.toLowerCase().includes(q) || v.supplier.email?.toLowerCase().includes(q);
    return matchStatus && matchSearch;
  });

  return (
    <div className="min-h-screen bg-[#FFFFFF] px-6 py-8">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-[#000000]">
            <UserCheck size={24} className="text-[#CB7A62]" />Xét duyệt Nhà cung cấp
          </h1>
          <p className="mt-1 text-sm text-[#000000]">Quy trình thẩm định pháp lý, chất lượng và giá cả trước khi chính thức hợp tác</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => void load()} className="rounded-lg border border-[rgba(240,246,252,0.08)] bg-[#FAF8F5] px-3 py-2 text-sm text-[#000000] hover:text-[#000000]">
            <RefreshCw size={14} />
          </button>
          <button onClick={() => setShowCreate(true)} className="flex items-center gap-2 rounded-lg bg-[#A85032] px-4 py-2 text-sm font-semibold text-[#000000] hover:bg-[#B4533A]">
            <Plus size={14} />Tạo yêu cầu
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-6 flex flex-wrap items-center gap-4">
        <div className="flex-1 min-w-[300px] flex gap-3">
          <div className="h-14 w-14 bg-[#FAF8F5] border border-[rgba(148,163,184,0.1)] rounded-2xl flex items-center justify-center text-[#000000] shadow-sm shrink-0">
            <Search size={20} className="text-[#B4533A]" />
          </div>
          <div className="relative flex-1">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm nhà cung cấp..."
              className="w-full h-14 pl-6 pr-4 bg-[#FAF8F5] border border-[rgba(148,163,184,0.1)] rounded-2xl text-sm font-bold text-[#000000] placeholder:text-[#000000]/40 focus:outline-none focus:border-[#B4533A] focus:ring-4 focus:ring-[#B4533A]/5 transition-all"
            />
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Filter size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#B4533A]" />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="h-14 pl-12 pr-10 bg-[#FAF8F5] border border-[rgba(148,163,184,0.1)] rounded-2xl text-sm font-bold text-[#000000] focus:outline-none focus:border-[#B4533A] focus:ring-4 focus:ring-[#B4533A]/5 transition-all appearance-none cursor-pointer min-w-[200px]"
            >
              <option value="ALL">Tất cả trạng thái</option>
              {Object.keys(STATUS_CONFIG).map((s) => (
                <option key={s} value={s}>{STATUS_CONFIG[s].label}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-20"><Loader2 size={28} className="animate-spin text-[#CB7A62]" /></div>
      ) : error ? (
        <div className="rounded-xl border border-red-500/20 bg-red-500/5 px-4 py-6 text-center text-sm text-red-400">{error}</div>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border border-[rgba(240,246,252,0.08)] bg-[#FAF8F5] py-16 text-center">
          <UserCheck size={36} className="mx-auto mb-3 text-[#000000]" />
          <p className="text-sm text-[#000000]">Chưa có yêu cầu xét duyệt nào</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((v) => {
            const { passed, total } = progressCount(v.checks);
            return (
              <Link key={v.id} href={`/procurement/supplier-vetting/${v.id}`}>
                <div className="group flex items-center gap-4 rounded-xl border border-[rgba(240,246,252,0.08)] bg-[#FAF8F5] p-4 hover:border-[#B4533A]/30 hover:bg-[#1C2128] transition-all cursor-pointer">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#B4533A]/10">
                    <Building2 size={18} className="text-[#CB7A62]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-[#000000] truncate">{v.supplier.name}</span>
                      <StatusBadge status={v.status} />
                    </div>
                    <div className="mt-0.5 flex items-center gap-3 text-xs text-[#000000]">
                      <span>{v.requestedBy.fullName ?? v.requestedBy.email}</span>
                      <span>·</span>
                      <span>{new Date(v.createdAt).toLocaleDateString("vi-VN")}</span>
                      {v.priceVsMarket != null && (
                        <>
                          <span>·</span>
                          <span className={v.priceVsMarket < 0 ? "text-black" : "text-black"}>
                            Giá {v.priceVsMarket > 0 ? "+" : ""}{v.priceVsMarket}% thị trường
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="text-right text-xs text-[#000000] shrink-0">
                    <div className="font-semibold text-[#000000]">{passed}/{total} checks</div>
                    {v.overallScore != null && <div className="mt-0.5">Score: {v.overallScore}</div>}
                  </div>
                  <ChevronRight size={16} className="text-[#000000] group-hover:text-[#CB7A62] shrink-0 transition-colors" />
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {showCreate && <CreateModal onClose={() => setShowCreate(false)} onCreated={() => void load()} />}
    </div>
  );
}

