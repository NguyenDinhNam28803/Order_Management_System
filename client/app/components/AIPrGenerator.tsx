"use client";

import React, { useState } from "react";
import { Sparkles, Loader2, Wand2, X, ArrowRight, CheckCircle2, AlertCircle } from "lucide-react";
import { useProcurement, PR } from "../context/ProcurementContext";
import { CreatePrDto, CreatePrItemDto, CurrencyCode } from "../types/api-types";

// AI Draft item - based on CreatePrItemDto but currency as string (AI returns string)
interface PrDraftItem extends Omit<CreatePrItemDto, 'currency' | 'categoryName'> {
  lineNumber: number;
  currency: string;
  preferredSupplierId?: string;
  preferredSupplierName?: string;
}

// AI Draft response combines CreatePrDto + AI metadata
interface PrDraftResponse extends Omit<CreatePrDto, 'costCenterId' | 'items' | 'currency'> {
  success: boolean;
  currency: string;
  totalEstimate: number;
  items: PrDraftItem[];
  suggestedCostCenterId?: string;
  suggestedCostCenterName?: string;
  confidence: number;
  reasoning: string;
  sources: { table: string; id: string; name: string; similarity: number }[];
  error?: string;
}

interface AIPrGeneratorProps {
  isOpen: boolean;
  onClose: () => void;
  onPrCreated?: (pr: PR) => void;
}

export default function AIPrGenerator({ isOpen, onClose, onPrCreated }: AIPrGeneratorProps) {
  const { apiFetch, costCenters, addPR } = useProcurement();
  const [prompt, setPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [draft, setDraft] = useState<PrDraftResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  if (!isOpen) return null;

  const handleGenerate = async () => {
    if (!prompt.trim()) return;

    setIsGenerating(true);
    setError(null);
    setDraft(null);

    try {
      const res = await apiFetch("/rag/generate-pr-draft", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }

      const response = await res.json();
      
      // API returns { status, message, data: PrDraftResponse }
      const draftData: PrDraftResponse = response.data;
      
      if (!draftData.success) {
        throw new Error(draftData.error || "Không thể tạo PR Draft");
      }

      setDraft(draftData);
    } catch (err: any) {
      setError(err.message || "Lỗi kết nối server");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSubmitPr = async () => {
    if (!draft) return;

    setIsSubmitting(true);
    try {
      // Map AI response to CreatePrDto format
      const prData: CreatePrDto = {
        title: draft.title,
        description: draft.description,
        justification: draft.justification,
        priority: draft.priority,
        requiredDate: draft.requiredDate,  // Server accepts string now
        currency: draft.currency as CurrencyCode,
        costCenterId: draft.suggestedCostCenterId || (costCenters.length > 0 ? costCenters[0].id : undefined),
        items: draft.items.map(item => ({
          productId: item.productId,
          productDesc: item.productDesc,
          sku: item.sku,
          categoryId: item.categoryId,
          qty: item.qty,
          unit: item.unit,
          estimatedPrice: item.estimatedPrice,
          currency: item.currency as CurrencyCode,
          specNote: item.specNote,
        })),
      };

      // DEBUG: Log dữ liệu gửi đi
      console.log('[AIPrGenerator] Sending PR data:', prData);

      const res = await addPR(prData);

      if (!res) {
        throw new Error("Không thể tạo PR");
      }

      // if (!res.ok) {
      //   const err = await res.json();
      //   // DEBUG: Log lỗi chi tiết
      //   console.error('[AIPrGenerator] Server error response:', err);
      //   const errorMsg = err.message || err.error || JSON.stringify(err) || "Không thể tạo PR";
      //   throw new Error(errorMsg);
      // }

      // const createdPr = await res.json();
      setShowSuccess(true);
      
      setTimeout(() => {
        onPrCreated?.(res);
        handleClose();
      }, 1500);
    } catch (err: any) {
      setError(err.message || "Lỗi khi tạo PR");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setPrompt("");
    setDraft(null);
    setError(null);
    setShowSuccess(false);
    onClose();
  };

  const getPriorityLabel = (p: number) => {
    switch (p) {
      case 1: return "Cao";
      case 2: return "Trung bình";
      case 3: return "Thấp";
      default: return "Trung bình";
    }
  };

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: currency || "VND",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="fixed inset-0 z-100 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm" 
        onClick={!isGenerating && !isSubmitting ? handleClose : undefined}
      />

      {/* Modal */}
      <div className="relative w-full max-w-4xl max-h-[90vh] bg-bg-primary rounded-2xl border border-border shadow-2xl overflow-hidden flex flex-col">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-linear-to-r from-[#3B82F6] to-accent-violet flex items-center justify-center">
              <Wand2 size={20} className="text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-text-primary">AI Tạo PR Draft</h2>
              <p className="text-sm text-[#64748B]">Mô tả nhu cầu, AI sẽ tạo PR cho bạn</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            disabled={isGenerating || isSubmitting}
            className="w-8 h-8 rounded-lg hover:bg-[rgba(148,163,184,0.1)] flex items-center justify-center text-[#94A3B8] transition-colors disabled:opacity-50"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6">
          {showSuccess ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mb-4">
                <CheckCircle2 size={32} className="text-green-400" />
              </div>
              <h3 className="text-xl font-semibold text-[#F8FAFC] mb-2">Đã tạo PR thành công!</h3>
              <p className="text-[#64748B]">PR đang chờ duyệt...</p>
            </div>
          ) : (
            <>
              {/* Input Section */}
              {!draft && (
                <div className="space-y-4">
                  <label className="block text-sm font-medium text-[#94A3B8]">
                    Mô tả yêu cầu mua hàng của bạn
                  </label>
                  <textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="Ví dụ: Tôi cần mua 5 laptop Dell XPS 15 cho team dev mới, ngân sách khoảng 75 triệu, cần gấp trong tuần sau..."
                    className="w-full h-32 p-4 bg-[#161922] border border-[rgba(148,163,184,0.1)] rounded-xl text-[#F8FAFC] placeholder-[#475569] focus:outline-none focus:border-[#3B82F6] resize-none"
                    disabled={isGenerating}
                  />
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-[#64748B]">
                      AI sẽ tìm sản phẩm, ước tính giá và đề xuất supplier phù hợp
                    </p>
                    <button
                      onClick={handleGenerate}
                      disabled={!prompt.trim() || isGenerating}
                      className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-[#3B82F6] to-[#8B5CF6] text-white rounded-xl font-medium hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isGenerating ? (
                        <>
                          <Loader2 size={18} className="animate-spin" />
                          Đang tạo...
                        </>
                      ) : (
                        <>
                          <Sparkles size={18} />
                          Tạo PR Draft
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}

              {/* Error */}
              {error && (
                <div className="flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/20 rounded-xl mt-4">
                  <AlertCircle size={20} className="text-red-400" />
                  <p className="text-sm text-red-400">{error}</p>
                </div>
              )}

              {/* Draft Preview */}
              {draft && (
                <div className="space-y-6 mt-4">
                  {/* PR Summary */}
                  <div className="p-4 bg-[#161922] border border-[rgba(148,163,184,0.1)] rounded-xl">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="font-semibold text-[#F8FAFC]">{draft.title}</h3>
                        <p className="text-sm text-[#64748B] mt-1">{draft.description}</p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        (draft.confidence || 0) > 0.8 
                          ? "bg-green-500/20 text-green-400" 
                          : (draft.confidence || 0) > 0.6 
                            ? "bg-yellow-500/20 text-yellow-400" 
                            : "bg-red-500/20 text-red-400"
                      }`}>
                        Độ tin: {Math.round((draft.confidence || 0) * 100)}%
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-4 text-sm">
                      <span className="text-[#94A3B8]">
                        Ưu tiên: <span className="text-[#F8FAFC]">{getPriorityLabel(draft.priority || 1)}</span>
                      </span>
                      <span className="text-[#94A3B8]">
                        Cần trước: <span className="text-[#F8FAFC]">{draft.requiredDate || "Chưa xác định"}</span>
                      </span>
                      {draft.suggestedCostCenterName && (
                        <span className="text-[#94A3B8]">
                          Cost Center: <span className="text-[#F8FAFC]">{draft.suggestedCostCenterName}</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Items Table */}
                  <div>
                    <h4 className="text-sm font-medium text-[#94A3B8] mb-3">Danh sách items ({draft.items?.length})</h4>
                    <div className="overflow-x-auto rounded-xl border border-[rgba(148,163,184,0.1)]">
                      <table className="erp-table text-xs m-0">
                        <thead className="bg-[#161922]">
                          <tr>
                            <th className="px-4 py-3 text-left text-[#94A3B8] font-medium">#</th>
                            <th className="px-4 py-3 text-left text-[#94A3B8] font-medium">Mô tả</th>
                            <th className="px-4 py-3 text-left text-[#94A3B8] font-medium">SL</th>
                            <th className="px-4 py-3 text-left text-[#94A3B8] font-medium">Đơn giá</th>
                            <th className="px-4 py-3 text-left text-[#94A3B8] font-medium">Thành tiền</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[rgba(148,163,184,0.1)]">
                          {draft.items?.map((item) => (
                            <tr key={item.lineNumber} className="hover:bg-[rgba(59,130,246,0.05)]">
                              <td className="px-4 py-3 text-[#64748B]">{item.lineNumber}</td>
                              <td className="px-4 py-3">
                                <div className="flex items-center gap-2">
                                  <span className="text-[#F8FAFC]">{item.productDesc}</span>
                                  {item.productId ? (
                                    <span className="px-1.5 py-0.5 text-[10px] bg-green-500/20 text-green-400 rounded">DB</span>
                                  ) : (
                                    <span className="px-1.5 py-0.5 text-[10px] bg-yellow-500/20 text-yellow-400 rounded">NEW</span>
                                  )}
                                </div>
                                {item.sku && (
                                  <div className="text-xs text-[#64748B]">SKU: {item.sku}</div>
                                )}
                                {item.specNote && (
                                  <div className="text-xs text-[#3B82F6]">{item.specNote}</div>
                                )}
                              </td>
                              <td className="px-4 py-3 text-[#F8FAFC]">{item.qty} {item.unit}</td>
                              <td className="px-4 py-3 text-[#F8FAFC]">{formatCurrency(item.estimatedPrice, item.currency)}</td>
                              <td className="px-4 py-3 text-[#F8FAFC] font-medium">
                                {formatCurrency(item.qty * item.estimatedPrice, item.currency)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot className="bg-[#161922]">
                          <tr>
                            <td colSpan={4} className="px-4 py-3 text-right text-[#94A3B8] font-medium">Tổng ước tính:</td>
                            <td className="px-4 py-3 text-[#3B82F6] font-bold">
                              {formatCurrency(draft.totalEstimate, draft.currency)}
                            </td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  </div>

                  {/* Reasoning */}
                  <div className="p-3 bg-blue-500/5 border border-blue-500/10 rounded-lg">
                    <p className="text-xs text-[#64748B]">
                      <span className="font-medium">Giải thích:</span> {draft.reasoning}
                    </p>
                  </div>

                  {/* Sources */}
                  {draft.sources?.length > 0 && (
                    <div>
                      <h4 className="text-xs font-medium text-[#64748B] mb-2">Dữ liệu tham khảo từ hệ thống:</h4>
                      <div className="flex flex-wrap gap-2">
                        {draft.sources.slice(0, 5).map((s, i) => (
                          <span key={i} className="px-2 py-1 bg-[#161922] rounded text-xs text-[#94A3B8]">
                            {s.table}: {s.name} ({Math.round(s.similarity * 100)}%)
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        {draft && !showSuccess && (
          <div className="flex items-center justify-between p-6 border-t border-[rgba(148,163,184,0.1)] bg-[#161922]/50">
            <button
              onClick={() => setDraft(null)}
              disabled={isSubmitting}
              className="px-4 py-2 text-[#94A3B8] hover:text-[#F8FAFC] transition-colors disabled:opacity-50"
            >
              Tạo lại
            </button>
            <div className="flex items-center gap-3">
              <button
                onClick={handleClose}
                disabled={isSubmitting}
                className="px-6 py-2.5 text-[#94A3B8] hover:text-[#F8FAFC] transition-colors disabled:opacity-50"
              >
                Hủy
              </button>
              <button
                onClick={handleSubmitPr}
                disabled={isSubmitting}
                className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-[#3B82F6] to-[#8B5CF6] text-white rounded-xl font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    Đang tạo PR...
                  </>
                ) : (
                  <>
                    <ArrowRight size={18} />
                    Tạo PR thật
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
