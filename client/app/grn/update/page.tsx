"use client";

import React, { useEffect, useState, useCallback } from "react";
import {
  CheckCircle, AlertCircle, Truck, FileText, Building2,
  Mail, CalendarDays, MapPin, Hash, Loader2, ChevronRight, Send
} from "lucide-react";

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000";

interface TrackingInfo {
  trackingNumber: string | null;
  carrier: string | null;
  shippedAt: string | null;
  estimatedArrival: string | null;
}

interface PoSummary {
  poNumber: string;
  deliveryDate: string;
  supplierName: string | null;
  contactPerson: string | null;
  contactEmail: string | null;
  paymentTerms: string | null;
  deliveryAddress: string | null;
}

interface GrnInfo {
  id: string;
  grnNumber: string;
  po: PoSummary;
  tracking: TrackingInfo | null;
}

interface TokenInfo {
  id: string;
  token: string;
  referenceId: string;
  targetEmail: string;
  expiresAt: string;
}

type PageState = "loading" | "error" | "form" | "updated";

const fmtDate = (s: string) =>
  new Date(s).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });

const toInputDate = (d: string | null) => {
  if (!d) return "";
  return new Date(d).toISOString().split("T")[0];
};

export default function GrnUpdatePage() {
  const [token, setToken] = useState("");
  const [pageState, setPageState] = useState<PageState>("loading");
  const [errorMsg, setErrorMsg] = useState("");
  const [grn, setGrn] = useState<GrnInfo | null>(null);
  const [tokenInfo, setTokenInfo] = useState<TokenInfo | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Form fields
  const [trackingNumber, setTrackingNumber] = useState("");
  const [carrier, setCarrier] = useState("");
  const [shippedAt, setShippedAt] = useState("");
  const [estimatedArrival, setEstimatedArrival] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setToken(params.get("token") ?? "");
  }, []);

  const loadGrn = useCallback(async (t: string) => {
    try {
      const res = await fetch(`${API}/external-token/grn-public/${t}`);
      const json = await res.json().catch(() => ({}));

      if (!res.ok) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        throw new Error((json as any).message ?? "Token không hợp lệ hoặc đã hết hạn");
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const payload = (json as any).data ?? json;
      const grnData: GrnInfo = payload.grn;
      const tokenData: TokenInfo = payload.token;

      if (!grnData) throw new Error("Không tìm thấy thông tin đơn hàng");

      setGrn(grnData);
      setTokenInfo(tokenData);

      // Pre-fill từ tracking cũ nếu có
      if (grnData.tracking) {
        setTrackingNumber(grnData.tracking.trackingNumber ?? "");
        setCarrier(grnData.tracking.carrier ?? "");
        setShippedAt(toInputDate(grnData.tracking.shippedAt));
        setEstimatedArrival(toInputDate(grnData.tracking.estimatedArrival));
      }

      setPageState("form");
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (e: any) {
      setErrorMsg(e.message ?? "Có lỗi xảy ra");
      setPageState("error");
    }
  }, []);

  useEffect(() => {
    if (token) loadGrn(token);
  }, [token, loadGrn]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!grn) return;

    if (!trackingNumber.trim() || !carrier.trim()) {
      alert("Vui lòng nhập số vận đơn và đơn vị vận chuyển.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`${API}/external-token/grn-public/${token}/update`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          trackingNumber: trackingNumber.trim(),
          carrier: carrier.trim(),
          shippedAt: shippedAt || null,
          estimatedArrival: estimatedArrival || null,
          notes: notes.trim() || null,
        }),
      });

      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        throw new Error((json as any).message ?? "Cập nhật thất bại");
      }

      setPageState("updated");
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (e: any) {
      alert(`Lỗi: ${e.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  // ── Loading ───────────────────────────────────────────────────────────────
  if (pageState === "loading") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-sky-50 to-blue-100 flex items-center justify-center text-gray-900">
        <div className="text-center">
          <Loader2 className="w-10 h-10 text-sky-600 animate-spin mx-auto mb-3" />
          <p className="text-gray-600 font-medium">Đang tải thông tin vận chuyển...</p>
        </div>
      </div>
    );
  }

  // ── Error ─────────────────────────────────────────────────────────────────
  if (pageState === "error") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-rose-100 flex items-center justify-center p-4 text-gray-900">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-800 mb-2">Link không hợp lệ</h2>
          <p className="text-gray-600 text-sm leading-relaxed">{errorMsg}</p>
          <div className="mt-6 p-3 bg-red-50 rounded-lg text-xs text-red-700">
            Link có thể đã hết hạn hoặc không đúng. Vui lòng liên hệ người mua để nhận link mới.
          </div>
        </div>
      </div>
    );
  }

  // ── Updated ───────────────────────────────────────────────────────────────
  if (pageState === "updated") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-sky-50 to-emerald-100 flex items-center justify-center p-4 text-gray-900">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <CheckCircle className="w-16 h-16 text-emerald-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-800 mb-2">Cập nhật thành công!</h2>
          <p className="text-gray-600 text-sm leading-relaxed mb-4">
            Thông tin vận chuyển cho đơn hàng <strong>{grn?.po.poNumber}</strong> đã được ghi nhận.
            Bộ phận kho sẽ chuẩn bị tiếp nhận hàng.
          </p>
          <div className="bg-sky-50 rounded-xl p-4 text-left text-sm space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-500">Số vận đơn</span>
              <span className="font-bold text-gray-800">{trackingNumber}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Đơn vị vận chuyển</span>
              <span className="font-medium text-gray-700">{carrier}</span>
            </div>
            {estimatedArrival && (
              <div className="flex justify-between">
                <span className="text-gray-500">Dự kiến đến</span>
                <span className="font-medium text-gray-700">{fmtDate(estimatedArrival)}</span>
              </div>
            )}
          </div>
          <p className="text-xs text-gray-400 mt-6">
            Bạn có thể cập nhật lại nếu thông tin thay đổi bằng cùng link này.
          </p>
        </div>
      </div>
    );
  }

  if (!grn) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 to-blue-100 py-10 px-4 text-gray-900">
      <div className="max-w-2xl mx-auto space-y-5">

        {/* Header */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          <div className="bg-gradient-to-r from-sky-700 to-blue-700 px-6 py-5">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-sky-200 text-xs font-semibold tracking-widest uppercase">Cập nhật vận chuyển</span>
              <ChevronRight className="w-3 h-3 text-sky-300" />
              <span className="text-sky-200 text-xs font-semibold">{grn.po.poNumber}</span>
            </div>
            <h1 className="text-white text-xl font-bold">Thông tin giao hàng</h1>
          </div>

          <div className="px-6 py-4 grid grid-cols-2 md:grid-cols-3 gap-4 text-sm border-b border-gray-100">
            <div>
              <p className="text-gray-400 text-xs mb-0.5">Mã đơn hàng</p>
              <p className="font-semibold text-gray-800">{grn.po.poNumber}</p>
            </div>
            <div>
              <p className="text-gray-400 text-xs mb-0.5">Giao hàng trước</p>
              <div className="flex items-center gap-1">
                <CalendarDays className="w-3.5 h-3.5 text-gray-400" />
                <p className="font-semibold text-gray-800">{fmtDate(grn.po.deliveryDate)}</p>
              </div>
            </div>
            <div>
              <p className="text-gray-400 text-xs mb-0.5">Nhà cung cấp</p>
              <p className="font-medium text-gray-700">{grn.po.supplierName ?? "—"}</p>
            </div>
          </div>

          {grn.po.deliveryAddress && (
            <div className="px-6 py-3 flex items-start gap-2 text-sm text-gray-600 border-b border-gray-100">
              <MapPin className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
              <span>{grn.po.deliveryAddress}</span>
            </div>
          )}

          {(grn.po.contactPerson || grn.po.contactEmail) && (
            <div className="px-6 py-3 flex items-center gap-4 text-xs text-gray-500">
              <span className="font-medium text-gray-600">Liên hệ:</span>
              {grn.po.contactPerson && (
                <span className="flex items-center gap-1">
                  <Building2 className="w-3.5 h-3.5" />{grn.po.contactPerson}
                </span>
              )}
              {grn.po.contactEmail && (
                <span className="flex items-center gap-1">
                  <Mail className="w-3.5 h-3.5" />{grn.po.contactEmail}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Progress steps */}
        <div className="bg-white rounded-2xl shadow-lg px-6 py-5">
          <div className="flex items-center gap-0">
            {[
              { label: "Đặt hàng", done: true },
              { label: "Xác nhận PO", done: true },
              { label: "Đang giao hàng", done: false, active: true },
              { label: "Nhận hàng", done: false },
            ].map((step, i, arr) => (
              <React.Fragment key={step.label}>
                <div className="flex flex-col items-center flex-shrink-0">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 ${
                    step.done ? "bg-emerald-500 border-emerald-500 text-white"
                    : step.active ? "bg-sky-600 border-sky-600 text-white"
                    : "bg-white border-gray-200 text-gray-400"
                  }`}>
                    {step.done ? "✓" : i + 1}
                  </div>
                  <span className={`text-[10px] mt-1 font-semibold text-center w-16 leading-tight ${
                    step.active ? "text-sky-700" : step.done ? "text-emerald-600" : "text-gray-400"
                  }`}>{step.label}</span>
                </div>
                {i < arr.length - 1 && (
                  <div className={`flex-1 h-0.5 mx-1 mb-4 ${step.done ? "bg-emerald-400" : "bg-gray-200"}`} />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Shipment form */}
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
            <Truck className="w-4 h-4 text-sky-600" />
            <h2 className="font-semibold text-gray-800">Thông tin vận đơn</h2>
          </div>
          <div className="px-6 py-5 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Số vận đơn <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  required
                  placeholder="VD: 1234567890"
                  value={trackingNumber}
                  onChange={(e) => setTrackingNumber(e.target.value)}
                  className="w-full pl-9 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 bg-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Đơn vị vận chuyển <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Truck className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  required
                  placeholder="VD: Giao Hàng Nhanh, GHTK, DHL..."
                  value={carrier}
                  onChange={(e) => setCarrier(e.target.value)}
                  className="w-full pl-9 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 bg-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Ngày xuất hàng</label>
              <input
                type="date"
                value={shippedAt}
                onChange={(e) => setShippedAt(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 bg-white focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Ngày giao dự kiến</label>
              <input
                type="date"
                value={estimatedArrival}
                onChange={(e) => setEstimatedArrival(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 bg-white focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-medium text-gray-600 mb-1">Ghi chú vận chuyển</label>
              <textarea
                rows={2}
                placeholder="Thông tin bổ sung về lô hàng, điều kiện đặc biệt..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 bg-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-sky-500 resize-none"
              />
            </div>
          </div>
          <div className="px-6 pb-6">
            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-700 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3.5 rounded-xl shadow-lg flex items-center justify-center gap-2 transition-all"
            >
              {submitting ? (
                <><Loader2 className="w-4 h-4 animate-spin" />Đang cập nhật...</>
              ) : (
                <><Send className="w-4 h-4" />Gửi thông tin vận chuyển</>
              )}
            </button>
          </div>
          <div className="flex items-center gap-2 px-6 pb-5 text-xs text-gray-400">
            <FileText className="w-3.5 h-3.5 shrink-0" />
            <span>
              Link hết hạn lúc {tokenInfo ? fmtDate(tokenInfo.expiresAt) : "—"}.
              Bạn có thể cập nhật lại nhiều lần nếu thông tin thay đổi.
            </span>
          </div>
        </form>
      </div>
    </div>
  );
}
