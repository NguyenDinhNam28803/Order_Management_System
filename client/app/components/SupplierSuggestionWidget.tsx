"use client";

import { useEffect, useState } from "react";
import { Sparkles, Star, AlertCircle, Info } from "lucide-react";
import { useProcurement, PRItem } from "../context/ProcurementContext";

interface Suggestion {
  name: string;
  trustScore: number;
  reason: string;
}

export default function SupplierSuggestionWidget({ items }: { items: PRItem[] }) {
  const { apiFetch } = useProcurement();
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (items.length === 0) {
      setSuggestions([]);
      return;
    }

    const fetchSuggestions = async () => {
      setLoading(true);
      const productNames = items.map(i => i.description || i.item_name).join(", ");
      const prompt = `Dựa trên danh sách sản phẩm: ${productNames}. Hãy gợi ý 5 nhà cung cấp uy tín nhất. Trả về JSON theo định dạng: [{"name": "Tên NCC", "trustScore": 95, "reason": "Lý do ngắn gọn"}].`;
      
      try {
        const res = await apiFetch(`/ai/ask?prompt=${encodeURIComponent(prompt)}`);
        const data = await res.json();
        // Giả sử API trả về { answer: { data: [...] } } hoặc tương tự
        if (data.answer?.data) {
          setSuggestions(data.answer.data.slice(0, 5));
        }
      } catch (err) {
        console.error("Lỗi lấy gợi ý:", err);
      } finally {
        setLoading(false);
      }
    };

    const timer = setTimeout(fetchSuggestions, 1000);
    return () => clearTimeout(timer);
  }, [items, apiFetch]);

  if (items.length === 0) return null;

  return (
    <div className="erp-card shadow-sm border border-slate-200 mt-6">
      <h3 className="text-xs font-black uppercase tracking-widest text-erp-navy mb-4 flex items-center gap-2 border-b border-slate-100 pb-4">
        <Sparkles size={16} className="text-amber-500" /> AI Gợi ý Nhà cung cấp
      </h3>
      
      {loading ? (
        <div className="text-[11px] text-slate-400 italic">Đang phân tích dữ liệu...</div>
      ) : (
        <div className="space-y-3">
          {suggestions.length > 0 ? (
            suggestions.map((s, i) => (
              <div key={i} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
                <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center border border-slate-200 font-black text-xs text-erp-navy">
                  {i + 1}
                </div>
                <div className="flex-1">
                  <div className="text-xs font-black text-erp-navy">{s.name}</div>
                  <div className="text-[10px] text-slate-500">{s.reason}</div>
                </div>
                <div className="flex items-center gap-1 text-amber-500 font-black text-xs">
                  <Star size={12} className="fill-amber-500" /> {s.trustScore}
                </div>
              </div>
            ))
          ) : (
            <div className="text-[11px] text-slate-400">Chưa có gợi ý khả dụng.</div>
          )}
        </div>
      )}
    </div>
  );
}
