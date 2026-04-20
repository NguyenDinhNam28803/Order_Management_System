"use client";

import React, { useEffect, useState, useCallback } from "react";
import {
  CheckCircle, AlertCircle, Clock, FileText, Building2,
  Mail, Phone, CalendarDays, Package, Send, Loader2, ChevronRight,
  Bell
} from "lucide-react";
import { ToastProvider, ToastContainer, useToast } from "../../components/Toast";

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000";

// ─── Types ────────────────────────────────────────────────────────────────────
interface RfqItem {
  id: string;
  name: string;
  description: string;
  qty: number;
  unit: string;
  targetPrice: number | null;
}

interface RfqInfo {
  id: string;
  rfqNumber: string;
  title: string;
  description: string | null;
  status: string;
  deadline: string;
  paymentTerms: string | null;
  deliveryTerms: string | null;
  contactPerson: string | null;
  contactEmail: string | null;
  items: RfqItem[];
}

interface TokenInfo {
  id: string;
  token: string;
  referenceId: string;
  targetEmail: string;
  expiresAt: string;
}

interface ItemForm {
  rfqItemId: string;
  unitPrice: string;
  qtyOffered: string;
  notes: string;
}

type PageState = "loading" | "error" | "form" | "submitted";

// ─── Helpers ─────────────────────────────────────────────────────────────────
const fmt = (n: number) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(n);

const fmtDate = (s: string) =>
  new Date(s).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });

const daysLeft = (deadline: string) => {
  const diff = new Date(deadline).getTime() - Date.now();
  return Math.ceil(diff / 86400000);
};

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function RfqQuotePage() {
  return (
    <ToastProvider>
      <RfqQuotePageContent />
      <ToastContainer />
    </ToastProvider>
  );
}

function RfqQuotePageContent() {
  const { notify } = useToast();
  const [token, setToken] = useState<string>("");
  const [pageState, setPageState] = useState<PageState>("loading");
  const [errorMsg, setErrorMsg] = useState("");
  const [rfq, setRfq] = useState<RfqInfo | null>(null);
  const [tokenInfo, setTokenInfo] = useState<TokenInfo | null>(null);

  // Form state
  const [itemForms, setItemForms] = useState<ItemForm[]>([]);
  const [leadTimeDays, setLeadTimeDays] = useState("14");
  const [paymentTerms, setPaymentTerms] = useState("Net 30");
  const [deliveryTerms, setDeliveryTerms] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Read token from URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const t = params.get("token") ?? "";
    setToken(t);
  }, []);

  // Fetch RFQ info from token
  const loadRfq = useCallback(async (t: string) => {
    try {
      const res = await fetch(`${API}/external-token/rfq-public/${t}`);
      const json = await res.json().catch(() => ({}));

      if (!res.ok) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        throw new Error((json as any).message ?? "Token không hợp lệ hoặc đã hết hạn");
      }

      // Backend wraps responses via TransformInterceptor: { status, message, data: { rfq, token } }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const payload = (json as any).data ?? json;
      const rfqData: RfqInfo = payload.rfq;
      const tokenData: TokenInfo = payload.token;

      if (!rfqData) throw new Error("Không tìm thấy thông tin RFQ");
      if (!Array.isArray(rfqData.items)) rfqData.items = [];

      setRfq(rfqData);
      setTokenInfo(tokenData);
      setItemForms(
        rfqData.items.map((item: RfqItem) => ({
          rfqItemId: item.id,
          unitPrice: "",
          qtyOffered: String(item.qty),
          notes: "",
        }))
      );
      if (rfqData.paymentTerms) setPaymentTerms(rfqData.paymentTerms);
      if (rfqData.deliveryTerms) setDeliveryTerms(rfqData.deliveryTerms);
      setPageState("form");
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (e: any) {
      setErrorMsg(e.message ?? "Có lỗi xảy ra");
      setPageState("error");
    }
  }, []);

  useEffect(() => {
    if (token) loadRfq(token);
  }, [token, loadRfq]);

  // Calculate total
  const totalPrice = itemForms.reduce((sum, f) => {
    const price = parseFloat(f.unitPrice) || 0;
    const qty = parseFloat(f.qtyOffered) || 0;
    return sum + price * qty;
  }, 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rfq || !tokenInfo) return;

    const emptyPrice = itemForms.some((f) => !f.unitPrice || parseFloat(f.unitPrice) <= 0);
    if (emptyPrice) {
      alert("Vui lòng nhập đơn giá cho tất cả các mặt hàng.");
      return;
    }

    setSubmitting(true);
    try {
      const body = {
        totalPrice,
        currency: "VND",
        leadTimeDays: parseInt(leadTimeDays) || 14,
        paymentTerms: paymentTerms || null,
        deliveryTerms: deliveryTerms || null,
        notes: notes || null,
        items: itemForms.map((f) => ({
          rfqItemId: f.rfqItemId,
          unitPrice: parseFloat(f.unitPrice),
          qtyOffered: parseFloat(f.qtyOffered) || undefined,
          notes: f.notes || null,
        })),
      };

      const res = await fetch(`${API}/external-token/rfq-public/${token}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        throw new Error((err as any).message ?? "Gửi báo giá thất bại");
      }

      notify("Báo giá của bạn đã được gửi thành công!", "success");
      setPageState("submitted");
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (e: any) {
      alert(`Lỗi: ${e.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  // ── Render states ──────────────────────────────────────────────────────────
  if (pageState === "loading") {
    return (
      <div className="min-h-screen bg-linear-to-br from-blue-50 to-indigo-100 flex items-center justify-center text-gray-900">
        <div className="text-center">
          <Loader2 className="w-10 h-10 text-blue-600 animate-spin mx-auto mb-3" />
          <p className="text-gray-600 font-medium">Đang tải thông tin yêu cầu báo giá...</p>
        </div>
      </div>
    );
  }

  if (pageState === "error") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-rose-100 flex items-center justify-center p-4 text-gray-900">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-800 mb-2">Link không hợp lệ</h2>
          <p className="text-gray-500 text-sm leading-relaxed">{errorMsg}</p>
          <div className="mt-6 p-3 bg-red-50 rounded-lg text-xs text-red-600">
            Link có thể đã hết hạn, đã được sử dụng, hoặc không đúng.
            Vui lòng liên hệ người mua để nhận link mới.
          </div>
        </div>
      </div>
    );
  }

  if (pageState === "submitted") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center p-4 text-gray-900">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-800 mb-2">Gửi báo giá thành công!</h2>
          <p className="text-gray-500 text-sm leading-relaxed mb-4">
            Báo giá của bạn cho <strong>{rfq?.title}</strong> (RFQ-********) đã được ghi nhận.
          </p>
          <div className="bg-green-50 rounded-xl p-4 text-left text-sm space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-500">Tổng giá trị</span>
              <span className="font-bold text-green-700">{fmt(totalPrice)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Thời gian giao hàng</span>
              <span className="font-medium">{leadTimeDays} ngày</span>
            </div>
          </div>
          <p className="text-xs text-gray-400 mt-6">
            Bộ phận mua sắm sẽ xem xét và liên hệ lại trong thời gian sớm nhất.
          </p>
        </div>
      </div>
    );
  }

  if (!rfq) return null;

  const remaining = daysLeft(rfq.deadline);
  const deadlineColor = remaining <= 1 ? "text-red-600" : remaining <= 3 ? "text-orange-500" : "text-gray-600";

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-10 px-4 text-gray-900">
      <div className="max-w-3xl mx-auto space-y-5">

        {/* Header card */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          <div className="bg-gradient-to-r from-blue-700 to-indigo-700 px-6 py-5">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-blue-200 text-xs font-semibold tracking-widest uppercase">Mời báo giá</span>
              <ChevronRight className="w-3 h-3 text-blue-300" />
              <span className="text-blue-200 text-xs font-semibold">RFQ-********</span>
            </div>
            <h1 className="text-white text-xl font-bold leading-snug">{rfq.title}</h1>
          </div>

          <div className="px-6 py-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm border-b border-gray-100">
            <div>
              <p className="text-gray-400 text-xs mb-0.5">Mã RFQ</p>
              <p className="font-semibold text-gray-800">********</p>
            </div>
            <div>
              <p className="text-gray-400 text-xs mb-0.5">Hạn chót</p>
              <div className="flex items-center gap-1">
                <CalendarDays className="w-3.5 h-3.5 text-gray-400" />
                <p className={`font-semibold ${deadlineColor}`}>{fmtDate(rfq.deadline)}</p>
              </div>
              {remaining > 0 && (
                <p className={`text-xs ${deadlineColor}`}>còn {remaining} ngày</p>
              )}
            </div>
            <div>
              <p className="text-gray-400 text-xs mb-0.5">Điều kiện TT</p>
              <p className="font-medium text-gray-700">{rfq.paymentTerms ?? "—"}</p>
            </div>
            <div>
              <p className="text-gray-400 text-xs mb-0.5">Gửi đến</p>
              <div className="flex items-center gap-1">
                <Mail className="w-3.5 h-3.5 text-gray-400" />
                <p className="text-gray-700 text-xs truncate">{tokenInfo?.targetEmail}</p>
              </div>
            </div>
          </div>

          {rfq.description && (
            <div className="px-6 py-3 bg-blue-50 text-sm text-blue-800 border-b border-blue-100">
              {rfq.description}
            </div>
          )}

          {(rfq.contactPerson || rfq.contactEmail) && (
            <div className="px-6 py-3 flex items-center gap-4 text-xs text-gray-500">
              <span className="font-medium text-gray-600">Liên hệ:</span>
              {rfq.contactPerson && (
                <span className="flex items-center gap-1">
                  <Building2 className="w-3.5 h-3.5" />{rfq.contactPerson}
                </span>
              )}
              {rfq.contactEmail && (
                <span className="flex items-center gap-1">
                  <Mail className="w-3.5 h-3.5" />{rfq.contactEmail}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Expiry warning */}
        {remaining <= 3 && remaining > 0 && (
          <div className="flex items-center gap-2 bg-orange-50 border border-orange-200 rounded-xl px-4 py-3 text-sm text-orange-700">
            <Clock className="w-4 h-4 shrink-0" />
            <span>Link hết hạn sau <strong>{remaining} ngày</strong>. Vui lòng hoàn tất báo giá sớm.</span>
          </div>
        )}

        {/* Quotation form */}
        <form onSubmit={handleSubmit} className="space-y-5">

          {/* Items table */}
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
              <Package className="w-4 h-4 text-blue-600" />
              <h2 className="font-semibold text-gray-800">Danh sách hàng hóa cần báo giá</h2>
            </div>
            <div className="divide-y divide-gray-50">
              {rfq.items?.map((item, idx) => (
                <div key={item.id} className="px-6 py-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <span className="inline-block bg-blue-100 text-blue-700 text-xs font-bold px-2 py-0.5 rounded-full mr-2">
                        #{idx + 1}
                      </span>
                      <span className="font-semibold text-gray-800">{item.name}</span>
                      {item.description && item.description !== item.name && (
                        <p className="text-xs text-gray-500 mt-0.5 ml-7">{item.description}</p>
                      )}
                    </div>
                    <div className="text-right shrink-0 ml-4">
                      <p className="text-xs text-gray-400">Số lượng yêu cầu</p>
                      <p className="font-bold text-gray-700">{item.qty} <span className="text-gray-400 font-normal">{item.unit}</span></p>
                      {item.targetPrice && (
                        <p className="text-xs text-blue-600 mt-0.5">Giá tham khảo: {fmt(item.targetPrice)}</p>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        Đơn giá (VNĐ) <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="1000"
                        required
                        placeholder="0"
                        value={itemForms[idx]?.unitPrice ?? ""}
                        onChange={(e) => {
                          const next = [...itemForms];
                          next[idx] = { ...next[idx], unitPrice: e.target.value };
                          setItemForms(next);
                        }}
                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 bg-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Số lượng cung cấp</label>
                      <input
                        type="number"
                        min="0"
                        value={itemForms[idx]?.qtyOffered ?? ""}
                        onChange={(e) => {
                          const next = [...itemForms];
                          next[idx] = { ...next[idx], qtyOffered: e.target.value };
                          setItemForms(next);
                        }}
                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 bg-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div className="md:col-span-1">
                      <label className="block text-xs font-medium text-gray-600 mb-1">Ghi chú</label>
                      <input
                        type="text"
                        placeholder="Thông số, nhãn hiệu..."
                        value={itemForms[idx]?.notes ?? ""}
                        onChange={(e) => {
                          const next = [...itemForms];
                          next[idx] = { ...next[idx], notes: e.target.value };
                          setItemForms(next);
                        }}
                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 bg-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  {/* Line total */}
                  {itemForms[idx]?.unitPrice && (
                    <div className="mt-2 text-right text-sm">
                      <span className="text-gray-400">Thành tiền: </span>
                      <span className="font-semibold text-blue-700">
                        {fmt((parseFloat(itemForms[idx].unitPrice) || 0) * (parseFloat(itemForms[idx].qtyOffered) || 0))}
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Total */}
            <div className="px-6 py-4 bg-blue-50 border-t border-blue-100 flex justify-between items-center">
              <span className="font-semibold text-blue-800">Tổng giá trị báo giá</span>
              <span className="text-xl font-bold text-blue-700">{fmt(totalPrice)}</span>
            </div>
          </div>

          {/* Terms */}
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
              <FileText className="w-4 h-4 text-blue-600" />
              <h2 className="font-semibold text-gray-800">Điều khoản & Thông tin giao hàng</h2>
            </div>
            <div className="px-6 py-5 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Thời gian giao hàng (ngày) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  min="1"
                  required
                  value={leadTimeDays}
                  onChange={(e) => setLeadTimeDays(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 bg-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Điều kiện thanh toán</label>
                <input
                  type="text"
                  placeholder="Net 30, COD, 50% trước..."
                  value={paymentTerms}
                  onChange={(e) => setPaymentTerms(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 bg-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Điều kiện giao hàng</label>
                <input
                  type="text"
                  placeholder="DDP, FOB, CIF..."
                  value={deliveryTerms}
                  onChange={(e) => setDeliveryTerms(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 bg-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Ghi chú chung</label>
                <textarea
                  rows={2}
                  placeholder="Thông tin bổ sung, ưu đãi đặc biệt..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 bg-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>
            </div>
          </div>

          {/* Submit button */}
          <button
            type="submit"
            disabled={submitting || totalPrice === 0}
            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3.5 rounded-xl shadow-lg flex items-center justify-center gap-2 transition-all"
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Đang gửi báo giá...
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                Gửi báo giá — {fmt(totalPrice)}
              </>
            )}
          </button>

          <p className="text-center text-xs text-gray-400 pb-4">
            Bằng cách gửi báo giá, bạn xác nhận thông tin trên là chính xác.<br />
            Link sẽ vô hiệu sau khi gửi thành công.
          </p>
        </form>
      </div>
    </div>
  );
}
