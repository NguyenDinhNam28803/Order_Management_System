"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  CheckCircle2, XCircle, Clock, SkipForward, ChevronLeft,
  Loader2, AlertCircle, FileText, ExternalLink, UserCheck,
  Building2, Send, ThumbsUp, ThumbsDown, X,
} from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

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
    throw new Error((err as any).message || "Request failed");
  }
  return res.json();
}

// ─── Types ────────────────────────────────────────────────────────────────────
interface VettingCheck {
  id: string;
  checkType: string;
  checkStatus: string;
  fileUrl?: string;
  notes?: string;
  verifiedAt?: string;
  verifiedBy?: { fullName?: string; email: string };
}

interface VettingDetail {
  id: string;
  status: string;
  priceVsMarket?: number;
  overallScore?: number;
  rejectedReason?: string;
  notes?: string;
  createdAt: string;
  supplier: {
    id: string; name: string; email?: string; phone?: string;
    address?: string; kycStatus: string; supplierTier?: string;
  };
  requestedBy: { id: string; fullName?: string; email: string };
  assignedTo?: { id: string; fullName?: string; email: string };
  checks: VettingCheck[];
}

// ─── Label maps ───────────────────────────────────────────────────────────────
const CHECK_LABELS: Record<string, string> = {
  BUSINESS_LICENSE: "Giấy phép kinh doanh",
  TAX_CODE: "Mã số thuế",
  CERTIFICATE_OF_ORIGIN: "Chứng nhận xuất xứ (CO)",
  CUSTOMS_DOCS: "Chứng từ hải quan",
  TAX_AUTHORITY_CALL: "Xác minh qua cơ quan thuế",
  FIELD_VISIT: "Khảo sát thực địa",
  PRICE_COMPARISON: "So sánh giá thị trường",
  QUALITY_STANDARD: "Tiêu chuẩn chất lượng",
};

const STATUS_BADGE: Record<string, { label: string; cls: string }> = {
  DRAFT:            { label: "Nháp",          cls: "text-black bg-slate-500/10 border-slate-500/20" },
  IN_REVIEW:        { label: "Đang kiểm tra", cls: "text-[#CB7A62] bg-[#B4533A]/10 border-[#B4533A]/20" },
  PENDING_APPROVAL: { label: "Chờ phê duyệt", cls: "text-black bg-amber-500/10 border-amber-500/20" },
  APPROVED:         { label: "Đã duyệt",      cls: "text-black bg-emerald-500/10 border-emerald-500/20" },
  REJECTED:         { label: "Từ chối",       cls: "text-red-400 bg-red-500/10 border-red-500/20" },
  CANCELLED:        { label: "Đã huỷ",        cls: "text-black bg-slate-500/10 border-slate-500/20" },
};

function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_BADGE[status] ?? { label: status, cls: "text-black" };
  return <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${cfg.cls}`}>{cfg.label}</span>;
}

// ─── Check Row ────────────────────────────────────────────────────────────────
function CheckRow({
  check, editable, onUpdate,
}: { check: VettingCheck; editable: boolean; onUpdate: (checkId: string, data: any) => Promise<void> }) {
  const [open, setOpen] = useState(false);
  const [notes, setNotes] = useState(check.notes ?? "");
  const [fileUrl, setFileUrl] = useState(check.fileUrl ?? "");
  const [saving, setSaving] = useState(false);

  const save = async (status: string) => {
    setSaving(true);
    await onUpdate(check.id, { checkStatus: status, notes, fileUrl: fileUrl || undefined });
    setSaving(false);
    setOpen(false);
  };

  const statusIcon = {
    PASSED:  <CheckCircle2 size={16} className="text-black" />,
    FAILED:  <XCircle size={16} className="text-red-400" />,
    SKIPPED: <SkipForward size={16} className="text-black" />,
    PENDING: <Clock size={16} className="text-black" />,
  }[check.checkStatus] ?? <Clock size={16} className="text-black" />;

  return (
    <div className="rounded-xl border border-[rgba(240,246,252,0.08)] bg-[#FAF8F5] overflow-hidden">
      <div
        className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-[#1C2128] transition-colors"
        onClick={() => editable && setOpen((o) => !o)}
      >
        {statusIcon}
        <span className="flex-1 text-sm font-medium text-[#000000]">
          {CHECK_LABELS[check.checkType] ?? check.checkType}
        </span>
        {check.verifiedBy && (
          <span className="text-xs text-[#000000]">{check.verifiedBy.fullName ?? check.verifiedBy.email}</span>
        )}
        {editable && (
          <span className="text-xs text-[#CB7A62]">{open ? "Thu gọn" : "Cập nhật"}</span>
        )}
      </div>

      {open && (
        <div className="border-t border-[rgba(240,246,252,0.06)] px-4 py-3 space-y-3">
          {check.fileUrl && (
            <div className="text-xs text-[#000000]">
              File hiện tại:{" "}
              <a href={check.fileUrl} target="_blank" rel="noopener noreferrer" className="text-[#CB7A62] hover:underline flex items-center gap-1 inline-flex">
                Xem <ExternalLink size={10} />
              </a>
            </div>
          )}
          <div>
            <label className="mb-1 block text-xs text-[#000000]">URL tài liệu</label>
            <input
              value={fileUrl}
              onChange={(e) => setFileUrl(e.target.value)}
              placeholder="https://..."
              className="w-full rounded-lg border border-[rgba(240,246,252,0.08)] bg-[#FFFFFF] px-3 py-1.5 text-sm text-[#000000] placeholder:text-[#000000] focus:outline-none focus:border-[#B4533A]/50"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-[#000000]">Ghi chú</label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full rounded-lg border border-[rgba(240,246,252,0.08)] bg-[#FFFFFF] px-3 py-1.5 text-sm text-[#000000] placeholder:text-[#000000] focus:outline-none focus:border-[#B4533A]/50 resize-none"
            />
          </div>
          <div className="flex gap-2">
            <button disabled={saving} onClick={() => save("PASSED")} className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-[#000000] hover:bg-emerald-500 disabled:opacity-50">
              {saving ? <Loader2 size={12} className="animate-spin" /> : <CheckCircle2 size={12} />}Passed
            </button>
            <button disabled={saving} onClick={() => save("FAILED")} className="flex items-center gap-1.5 rounded-lg bg-red-600 px-3 py-1.5 text-xs font-semibold text-[#000000] hover:bg-red-500 disabled:opacity-50">
              {saving ? <Loader2 size={12} className="animate-spin" /> : <XCircle size={12} />}Failed
            </button>
            <button disabled={saving} onClick={() => save("SKIPPED")} className="flex items-center gap-1.5 rounded-lg border border-[rgba(240,246,252,0.08)] px-3 py-1.5 text-xs text-[#000000] hover:text-[#000000]">
              <SkipForward size={12} />Skip
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Approve Modal ────────────────────────────────────────────────────────────
function ApproveModal({ onClose, onConfirm }: { onClose: () => void; onConfirm: (tier: string, notes: string) => Promise<void> }) {
  const [tier, setTier] = useState("APPROVED");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/60 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl border border-[rgba(240,246,252,0.1)] bg-[#FAF8F5] p-6 shadow-2xl">
        <h2 className="mb-4 text-lg font-bold text-[#000000]">Phê duyệt nhà cung cấp</h2>
        <div className="mb-4">
          <label className="mb-1 block text-xs text-[#000000]">Xếp hạng (Tier)</label>
          <select value={tier} onChange={(e) => setTier(e.target.value)} className="w-full rounded-lg border border-[rgba(240,246,252,0.08)] bg-[#FFFFFF] px-3 py-2 text-sm text-[#000000] focus:outline-none">
            <option value="APPROVED">APPROVED</option>
            <option value="PREFERRED">PREFERRED</option>
            <option value="CONDITIONAL">CONDITIONAL</option>
          </select>
        </div>
        <div className="mb-4">
          <label className="mb-1 block text-xs text-[#000000]">Ghi chú</label>
          <textarea rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} className="w-full rounded-lg border border-[rgba(240,246,252,0.08)] bg-[#FFFFFF] px-3 py-2 text-sm text-[#000000] focus:outline-none resize-none" />
        </div>
        <div className="flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 text-sm text-[#000000] hover:text-[#000000]">Huỷ</button>
          <button
            disabled={loading}
            onClick={async () => { setLoading(true); await onConfirm(tier, notes); setLoading(false); }}
            className="flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-[#000000] hover:bg-emerald-500 disabled:opacity-50"
          >
            {loading && <Loader2 size={14} className="animate-spin" />}<ThumbsUp size={14} />Phê duyệt
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Reject Modal ─────────────────────────────────────────────────────────────
function RejectModal({ onClose, onConfirm }: { onClose: () => void; onConfirm: (reason: string) => Promise<void> }) {
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/60 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl border border-[rgba(240,246,252,0.1)] bg-[#FAF8F5] p-6 shadow-2xl">
        <h2 className="mb-4 text-lg font-bold text-[#000000]">Từ chối nhà cung cấp</h2>
        <div className="mb-4">
          <label className="mb-1 block text-xs text-[#000000]">Lý do từ chối *</label>
          <textarea rows={4} value={reason} onChange={(e) => setReason(e.target.value)} className="w-full rounded-lg border border-[rgba(240,246,252,0.08)] bg-[#FFFFFF] px-3 py-2 text-sm text-[#000000] focus:outline-none resize-none" />
        </div>
        <div className="flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 text-sm text-[#000000] hover:text-[#000000]">Huỷ</button>
          <button
            disabled={loading || !reason.trim()}
            onClick={async () => { setLoading(true); await onConfirm(reason); setLoading(false); }}
            className="flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-[#000000] hover:bg-red-500 disabled:opacity-50"
          >
            {loading && <Loader2 size={14} className="animate-spin" />}<ThumbsDown size={14} />Từ chối
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function SupplierVettingDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const [vetting, setVetting] = useState<VettingDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionErr, setActionErr] = useState("");
  const [showApprove, setShowApprove] = useState(false);
  const [showReject, setShowReject] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true); setError("");
    try {
      const data = await apiFetch(`/supplier-vetting/${id}`);
      setVetting(data as VettingDetail);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { void load(); }, [load]);

  const updateCheck = async (checkId: string, data: any) => {
    setActionErr("");
    try {
      await apiFetch(`/supplier-vetting/${id}/checks/${checkId}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      });
      await load();
    } catch (err: any) {
      setActionErr(err.message);
    }
  };

  const submit = async () => {
    setSubmitting(true); setActionErr("");
    try {
      await apiFetch(`/supplier-vetting/${id}/submit`, { method: "POST", body: JSON.stringify({}) });
      await load();
    } catch (err: any) {
      setActionErr(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const approve = async (supplierTier: string, notes: string) => {
    setActionErr("");
    try {
      await apiFetch(`/supplier-vetting/${id}/approve`, {
        method: "POST",
        body: JSON.stringify({ supplierTier, notes }),
      });
      setShowApprove(false);
      await load();
    } catch (err: any) {
      setActionErr(err.message);
    }
  };

  const reject = async (rejectedReason: string) => {
    setActionErr("");
    try {
      await apiFetch(`/supplier-vetting/${id}/reject`, {
        method: "POST",
        body: JSON.stringify({ rejectedReason }),
      });
      setShowReject(false);
      await load();
    } catch (err: any) {
      setActionErr(err.message);
    }
  };

  const editable = vetting?.status === "IN_REVIEW";
  const canApprove = vetting?.status === "PENDING_APPROVAL" || vetting?.status === "IN_REVIEW";

  if (loading) {
    return <div className="flex min-h-screen items-center justify-center bg-[#FFFFFF]"><Loader2 size={28} className="animate-spin text-[#CB7A62]" /></div>;
  }

  if (error || !vetting) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-[#FFFFFF]">
        <AlertCircle size={36} className="text-red-400" />
        <p className="text-sm text-red-400">{error || "Không tìm thấy dữ liệu"}</p>
        <Link href="/procurement/supplier-vetting" className="text-sm text-[#CB7A62] hover:underline">← Quay lại</Link>
      </div>
    );
  }

  const passed = vetting.checks.filter((c) => c.checkStatus === "PASSED").length;
  const failed = vetting.checks.filter((c) => c.checkStatus === "FAILED").length;

  return (
    <div className="min-h-screen bg-[#FFFFFF] px-6 py-8">
      {/* Header */}
      <div className="mb-6">
        <Link href="/procurement/supplier-vetting" className="mb-3 flex items-center gap-1 text-xs text-[#000000] hover:text-[#000000]">
          <ChevronLeft size={14} />Danh sách xét duyệt
        </Link>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <UserCheck size={22} className="text-[#CB7A62]" />
              <h1 className="text-xl font-bold text-[#000000]">{vetting.supplier.name}</h1>
              <StatusBadge status={vetting.status} />
            </div>
            <p className="mt-1 text-xs text-[#000000]">
              Tạo bởi {vetting.requestedBy.fullName ?? vetting.requestedBy.email} •{" "}
              {new Date(vetting.createdAt).toLocaleDateString("vi-VN")}
              {vetting.assignedTo && ` • Phụ trách: ${vetting.assignedTo.fullName ?? vetting.assignedTo.email}`}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {editable && (
              <button
                disabled={submitting}
                onClick={submit}
                className="flex items-center gap-2 rounded-lg bg-[#A85032] px-4 py-2 text-sm font-semibold text-[#000000] hover:bg-[#B4533A] disabled:opacity-50"
              >
                {submitting ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                Nộp phê duyệt
              </button>
            )}
            {canApprove && (
              <>
                <button onClick={() => setShowApprove(true)} className="flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-[#000000] hover:bg-emerald-500">
                  <ThumbsUp size={14} />Phê duyệt
                </button>
                <button onClick={() => setShowReject(true)} className="flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-[#000000] hover:bg-red-500">
                  <ThumbsDown size={14} />Từ chối
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {actionErr && (
        <div className="mb-4 rounded-lg border border-red-500/20 bg-red-500/5 px-4 py-2 text-sm text-red-400">{actionErr}</div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left — supplier info + stats */}
        <div className="space-y-4">
          {/* Supplier info */}
          <div className="rounded-xl border border-[rgba(240,246,252,0.08)] bg-[#FAF8F5] p-4">
            <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-[#000000]"><Building2 size={14} />Thông tin NCC</h3>
            <dl className="space-y-2 text-xs">
              {[
                ["Email", vetting.supplier.email],
                ["Điện thoại", vetting.supplier.phone],
                ["Địa chỉ", vetting.supplier.address],
                ["KYC Status", vetting.supplier.kycStatus],
                ["Tier", vetting.supplier.supplierTier],
              ].map(([label, val]) => val ? (
                <div key={label} className="flex justify-between gap-2">
                  <dt className="text-[#000000] shrink-0">{label}</dt>
                  <dd className="text-[#000000] text-right truncate">{val}</dd>
                </div>
              ) : null)}
              {vetting.priceVsMarket != null && (
                <div className="flex justify-between gap-2">
                  <dt className="text-[#000000] shrink-0">Giá vs thị trường</dt>
                  <dd className={`text-right font-semibold ${vetting.priceVsMarket < 0 ? "text-black" : "text-black"}`}>
                    {vetting.priceVsMarket > 0 ? "+" : ""}{vetting.priceVsMarket}%
                  </dd>
                </div>
              )}
            </dl>
          </div>

          {/* Stats */}
          <div className="rounded-xl border border-[rgba(240,246,252,0.08)] bg-[#FAF8F5] p-4">
            <h3 className="mb-3 text-sm font-semibold text-[#000000]">Tiến độ kiểm tra</h3>
            <div className="flex items-end gap-4">
              <div className="text-center">
                <div className="text-2xl font-black text-black">{passed}</div>
                <div className="text-[10px] text-[#000000]">Passed</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-black text-red-400">{failed}</div>
                <div className="text-[10px] text-[#000000]">Failed</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-black text-[#000000]">{vetting.checks.length - passed - failed}</div>
                <div className="text-[10px] text-[#000000]">Pending/Skip</div>
              </div>
            </div>
            {vetting.overallScore != null && (
              <div className="mt-3 flex items-center gap-2">
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-[rgba(240,246,252,0.06)]">
                  <div className="h-full rounded-full bg-[#B4533A] transition-all" style={{ width: `${vetting.overallScore}%` }} />
                </div>
                <span className="text-xs font-bold text-[#CB7A62]">{vetting.overallScore}/100</span>
              </div>
            )}
          </div>

          {/* Rejected reason */}
          {vetting.rejectedReason && (
            <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-4">
              <h3 className="mb-2 text-sm font-semibold text-red-400">Lý do từ chối</h3>
              <p className="text-xs text-[#000000]">{vetting.rejectedReason}</p>
            </div>
          )}

          {/* Notes */}
          {vetting.notes && (
            <div className="rounded-xl border border-[rgba(240,246,252,0.08)] bg-[#FAF8F5] p-4">
              <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold text-[#000000]"><FileText size={14} />Ghi chú</h3>
              <p className="text-xs text-[#000000] whitespace-pre-wrap">{vetting.notes}</p>
            </div>
          )}
        </div>

        {/* Right — checklist */}
        <div className="lg:col-span-2 space-y-3">
          <h2 className="text-sm font-semibold text-[#000000]">Danh sách kiểm tra ({vetting.checks.length} hạng mục)</h2>
          {vetting.checks.map((check) => (
            <CheckRow key={check.id} check={check} editable={editable} onUpdate={updateCheck} />
          ))}
        </div>
      </div>

      {showApprove && <ApproveModal onClose={() => setShowApprove(false)} onConfirm={approve} />}
      {showReject && <RejectModal onClose={() => setShowReject(false)} onConfirm={reject} />}
    </div>
  );
}
