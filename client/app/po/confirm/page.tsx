"use client";

import React, { useEffect, useState, useCallback } from "react";
import {
  CheckCircle, AlertCircle, Clock, FileText, Building2,
  Mail, CalendarDays, Package, ThumbsUp, Loader2, ChevronRight, MapPin
} from "lucide-react";

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000";

interface PoItem {
  id: string;
  description: string;
  qty: number;
  unit: string;
  unitPrice: number;
  total: number;
}

interface PoInfo {
  id: string;
  poNumber: string;
  status: string;
  totalAmount: number;
  currency: string;
  paymentTerms: string | null;
  deliveryAddress: string | null;
  deliveryDate: string;
  issuedAt: string | null;
  notes: string | null;
  supplierName: string | null;
  contactPerson: string | null;
  contactEmail: string | null;
  items: PoItem[];
}

interface TokenInfo {
  id: string;
  token: string;
  referenceId: string;
  targetEmail: string;
  expiresAt: string;
}

type PageState = "loading" | "error" | "form" | "confirmed";

const fmt = (n: number) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(n);

const fmtDate = (s: string) =>
  new Date(s).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });

export default function PoConfirmPage() {
  const [token, setToken] = useState("");
  const [pageState, setPageState] = useState<PageState>("loading");
  const [errorMsg, setErrorMsg] = useState("");
  const [po, setPo] = useState<PoInfo | null>(null);
  const [tokenInfo, setTokenInfo] = useState<TokenInfo | null>(null);
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setToken(params.get("token") ?? "");
  }, []);

  const loadPo = useCallback(async (t: string) => {
    try {
      const res = await fetch(`${API}/external-token/po-public/${t}`);
      const json = await res.json().catch(() => ({}));

      if (!res.ok) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        throw new Error((json as any).message ?? "Token không hợp lệ hoặc đã hết hạn");
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const payload = (json as any).data ?? json;
      const poData: PoInfo = payload.po;
      const tokenData: TokenInfo = payload.token;

      if (!poData) throw new Error("Không tìm thấy thông tin đơn hàng");
      if (!Array.isArray(poData.items)) poData.items = [];

      setPo(poData);
      setTokenInfo(tokenData);
      setPageState("form");
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (e: any) {
      setErrorMsg(e.message ?? "Có lỗi xảy ra");
      setPageState("error");
    }
  }, []);

  useEffect(() => {
    if (token) loadPo(token);
  }, [token, loadPo]);

  const handleConfirm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!po || !tokenInfo) return;

    setSubmitting(true);
    try {
      const res = await fetch(`${API}/external-token/po-public/${token}/confirm`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes: notes || null }),
      });

      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        throw new Error((json as any).message ?? "Xác nhận thất bại");
      }

      setPageState("confirmed");
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (e: any) {
      alert(`Lỗi: ${e.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  // ── Loading ────────────────────────────────────────────────────────────────
  if (pageState === "loading") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-teal-50 to-cyan-100 flex items-center justify-center text-gray-900">
        <div className="text-center">
          <Loader2 className="w-10 h-10 text-teal-600 animate-spin mx-auto mb-3" />
          <p className="text-black font-medium">Đang tải thông tin đơn hàng...</p>
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
          <p className="text-black text-sm leading-relaxed">{errorMsg}</p>
          <div className="mt-6 p-3 bg-red-50 rounded-lg text-xs text-red-700">
            Link có thể đã hết hạn, đã được sử dụng, hoặc không đúng.
            Vui lòng liên hệ người mua để nhận link mới.
          </div>
        </div>
      </div>
    );
  }

  // ── Confirmed ─────────────────────────────────────────────────────────────
  if (pageState === "confirmed") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-teal-50 to-emerald-100 flex items-center justify-center p-4 text-gray-900">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <CheckCircle className="w-16 h-16 text-teal-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-800 mb-2">Xác nhận thành công!</h2>
          <p className="text-black text-sm leading-relaxed mb-4">
            Bạn đã xác nhận nhận đơn hàng <strong>{po?.poNumber}</strong>.
            Bộ phận mua sắm sẽ được thông báo ngay lập tức.
          </p>
          <div className="bg-teal-50 rounded-xl p-4 text-left text-sm space-y-2">
            <div className="flex justify-between">
              <span className="text-black">Mã PO</span>
              <span className="font-bold text-gray-800">{po?.poNumber}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-black">Tổng giá trị</span>
              <span className="font-bold text-teal-700">{fmt(po?.totalAmount ?? 0)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-black">Giao hàng trước</span>
              <span className="font-medium text-gray-700">{po?.deliveryDate ? fmtDate(po.deliveryDate) : "—"}</span>
            </div>
          </div>
          <p className="text-xs text-black mt-6">
            Link này đã vô hiệu. Vui lòng liên hệ người mua nếu cần hỗ trợ.
          </p>
        </div>
      </div>
    );
  }

  if (!po) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 to-cyan-100 py-10 px-4 text-gray-900">
      <div className="max-w-3xl mx-auto space-y-5">

        {/* Header */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          <div className="bg-gradient-to-r from-teal-700 to-cyan-700 px-6 py-5">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-teal-200 text-xs font-semibold tracking-widest uppercase">Đơn mua hàng</span>
              <ChevronRight className="w-3 h-3 text-teal-300" />
              <span className="text-teal-200 text-xs font-semibold">{po.poNumber}</span>
            </div>
            <h1 className="text-[#000000] text-xl font-bold">Xác nhận nhận đơn hàng</h1>
          </div>

          <div className="px-6 py-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm border-b border-gray-100">
            <div>
              <p className="text-black text-xs mb-0.5">Mã PO</p>
              <p className="font-semibold text-gray-800">{po.poNumber}</p>
            </div>
            <div>
              <p className="text-black text-xs mb-0.5">Giao hàng trước</p>
              <div className="flex items-center gap-1">
                <CalendarDays className="w-3.5 h-3.5 text-black" />
                <p className="font-semibold text-gray-800">{fmtDate(po.deliveryDate)}</p>
              </div>
            </div>
            <div>
              <p className="text-black text-xs mb-0.5">Điều kiện TT</p>
              <p className="font-medium text-gray-700">{po.paymentTerms ?? "—"}</p>
            </div>
            <div>
              <p className="text-black text-xs mb-0.5">Gửi đến</p>
              <div className="flex items-center gap-1">
                <Mail className="w-3.5 h-3.5 text-black" />
                <p className="text-gray-700 text-xs truncate">{tokenInfo?.targetEmail}</p>
              </div>
            </div>
          </div>

          {po.deliveryAddress && (
            <div className="px-6 py-3 flex items-start gap-2 text-sm text-black border-b border-gray-100">
              <MapPin className="w-4 h-4 text-black mt-0.5 shrink-0" />
              <span>{po.deliveryAddress}</span>
            </div>
          )}

          {(po.contactPerson || po.contactEmail) && (
            <div className="px-6 py-3 flex items-center gap-4 text-xs text-black">
              <span className="font-medium text-black">Liên hệ:</span>
              {po.contactPerson && (
                <span className="flex items-center gap-1">
                  <Building2 className="w-3.5 h-3.5" />{po.contactPerson}
                </span>
              )}
              {po.contactEmail && (
                <span className="flex items-center gap-1">
                  <Mail className="w-3.5 h-3.5" />{po.contactEmail}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Items table */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
            <Package className="w-4 h-4 text-teal-600" />
            <h2 className="font-semibold text-gray-800">Chi tiết đơn hàng</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-black uppercase tracking-wide">Mặt hàng</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-black uppercase tracking-wide w-24">SL</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-black uppercase tracking-wide w-36">Đơn giá</th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-black uppercase tracking-wide w-36">Thành tiền</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {po.items.map((item, idx) => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <span className="inline-block bg-teal-100 text-teal-700 text-xs font-bold px-2 py-0.5 rounded-full mr-2">#{idx + 1}</span>
                      <span className="font-medium text-gray-800">{item.description}</span>
                    </td>
                    <td className="px-4 py-4 text-center text-gray-700">
                      {item.qty} <span className="text-black text-xs">{item.unit}</span>
                    </td>
                    <td className="px-4 py-4 text-right text-gray-700">{fmt(item.unitPrice)}</td>
                    <td className="px-6 py-4 text-right font-semibold text-teal-700">{fmt(item.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="px-6 py-4 bg-teal-50 border-t border-teal-100 flex justify-between items-center">
            <span className="font-semibold text-teal-800">Tổng giá trị đơn hàng</span>
            <span className="text-xl font-bold text-teal-700">{fmt(po.totalAmount)}</span>
          </div>
        </div>

        {/* Confirm form */}
        <form onSubmit={handleConfirm} className="bg-white rounded-2xl shadow-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
            <FileText className="w-4 h-4 text-teal-600" />
            <h2 className="font-semibold text-gray-800">Xác nhận đơn hàng</h2>
          </div>
          <div className="px-6 py-5 space-y-4">
            <p className="text-sm text-black">
              Bằng cách xác nhận, bạn đồng ý thực hiện đơn hàng <strong>{po.poNumber}</strong> theo các điều khoản đã nêu và giao hàng trước ngày <strong>{fmtDate(po.deliveryDate)}</strong>.
            </p>
            <div>
              <label className="block text-xs font-medium text-black mb-1">Ghi chú (không bắt buộc)</label>
              <textarea
                rows={3}
                placeholder="Ghi chú về tiến độ, điều kiện giao hàng hoặc câu hỏi..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 bg-white placeholder:text-black focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none"
              />
            </div>
          </div>
          <div className="px-6 pb-6">
            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700 disabled:opacity-50 disabled:cursor-not-allowed text-[#000000] font-semibold py-3.5 rounded-xl shadow-lg flex items-center justify-center gap-2 transition-all"
            >
              {submitting ? (
                <><Loader2 className="w-4 h-4 animate-spin" />Đang xác nhận...</>
              ) : (
                <><ThumbsUp className="w-4 h-4" />Xác nhận nhận đơn hàng</>
              )}
            </button>
          </div>
          <div className="flex items-center gap-2 px-6 pb-5 text-xs text-black">
            <Clock className="w-3.5 h-3.5 shrink-0" />
            <span>Link hết hạn lúc {tokenInfo ? fmtDate(tokenInfo.expiresAt) : "—"}. Chỉ dùng được một lần.</span>
          </div>
        </form>
      </div>
    </div>
  );
}

