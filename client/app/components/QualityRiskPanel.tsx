"use client";

import React, { useState, useEffect } from "react";
import { AlertCircle, Loader2, FileText, TrendingUp, CheckCircle2 } from "lucide-react";

export const QualityRiskPanel = ({ supplierId }: { supplierId: string }) => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [trend, setTrend] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [warningLetter, setWarningLetter] = useState<string | null>(null);

  useEffect(() => {
    checkTrend();
  }, [supplierId]);

  const checkTrend = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/quality/suppliers/${supplierId}/trend`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      const data = await res.json();
      if (data.detected) setTrend(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (trend) {
      // Tự động phân tích ngay khi load trend
      generateWarning();
    }
  }, [trend]);

  const generateWarning = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/quality/suppliers/${supplierId}/warning-letter`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
        },
        body: JSON.stringify({
          startRate: trend.startRate,
          endRate: trend.endRate,
          days: trend.length
        })
      });
      const data = await res.json();
      setWarningLetter(data.letter);
    } catch (e) {
      console.error("AI Analysis failed:", e);
    } finally {
      setLoading(false);
    }
  };

  if (!trend) return null;

  return (
    <div className={`${trend.isCritical ? 'bg-red-50 border-red-200' : 'bg-amber-50/50 border-amber-200'} border rounded-xl p-5 mb-6`}>
      <div className="flex items-center gap-3 mb-4">
        <div className={`p-2 ${trend.isCritical ? 'bg-red-100 text-red-600' : 'bg-amber-100 text-amber-600'} rounded-lg`}>
          <TrendingUp size={20} />
        </div>
        <div>
          <h3 className={`font-bold ${trend.isCritical ? 'text-red-900' : 'text-amber-900'}`}>
            {trend.isCritical ? 'Cảnh báo: Xu hướng suy giảm nghiêm trọng' : 'Phát hiện xu hướng suy giảm chất lượng'}
          </h3>
          <p className="text-sm opacity-80">
            Tỷ lệ lỗi tăng liên tục trong <b>{trend.length} ngày</b> qua ({(trend.startRate*100).toFixed(1)}% → {(trend.endRate*100).toFixed(1)}%)
          </p>
        </div>
      </div>

      {!warningLetter ? (
        <button 
          onClick={generateWarning}
          disabled={loading}
          className={`flex items-center gap-2 px-4 py-2 ${trend.isCritical ? 'bg-red-600 hover:bg-red-700' : 'bg-amber-600 hover:bg-amber-700'} text-white rounded-lg transition-colors`}
        >
          {loading ? <Loader2 className="animate-spin" /> : <FileText size={16} />}
          {trend.isCritical ? 'Tạo thư cảnh báo khẩn cấp' : 'Tạo thư cảnh báo chính thức'}
        </button>
      ) : (
        <div className="mt-4 p-4 bg-white border border-gray-200 rounded-lg text-sm text-gray-700 whitespace-pre-line">
          {warningLetter}
        </div>
      )}
    </div>
  );
};
