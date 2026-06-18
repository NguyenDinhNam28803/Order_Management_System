"use client";

import React, { useEffect, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { TrendingUp, AlertTriangle, Loader2 } from "lucide-react";
import Cookies from "js-cookie";

// Interface for chart data point
interface DataPoint {
  day: number;
  dayLabel: string;
  defectRate: number;
}

/**
 * Custom tooltip component for the chart
 */
interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{ value: number; payload: DataPoint }>;
  label?: string;
}

const CustomTooltip: React.FC<CustomTooltipProps> = ({ active, payload, label }) => {
  if (active && payload && payload.length > 0) {
    const data = payload[0].payload;
    return (
      <div className="bg-white p-3 border border-slate-200 rounded-lg shadow-lg">
        <p className="font-semibold text-slate-800">{label}</p>
        <p className="text-[#2563EB]">
          <span className="font-medium">Tỷ lệ lỗi: </span>
          {data.defectRate.toFixed(2)}%
        </p>
      </div>
    );
  }
  return null;
};

/**
 * DefectRateChart Component
 * Line chart displaying the supplier's defect rate history (365 days).
 */
const DefectRateChart: React.FC<{ supplierId: string | null }> = ({ supplierId }) => {
  const [data, setData] = useState<DataPoint[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (supplierId) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setLoading(true);
      fetch(`${process.env.NEXT_PUBLIC_API_URL}/quality/suppliers/${supplierId}/history`, {
        headers: { Authorization: `Bearer ${Cookies.get("token") ?? ""}` },
      })
        .then((res) => res.json())
        .then((res) => {
          const rawData = Array.isArray(res) ? res : (res.data || []);
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const formattedData = rawData.map((item: any, index: number) => ({
            day: index + 1,
            dayLabel: item.dayLabel || `Ngày ${index + 1}`,
            defectRate: Number(item.defectRate) || 0,
          }));
          setData(formattedData);
          setLoading(false);
        })
        .catch((err) => {
          console.error("Lỗi tải dữ liệu:", err);
          setLoading(false);
        });
    }
  }, [supplierId]);

  if (!supplierId) {
    return (
      <div className="w-full h-[400px] bg-slate-100 rounded-xl border border-slate-200 flex flex-col items-center justify-center text-slate-500">
        <AlertTriangle size={48} className="mb-4 opacity-20" />
        <p className="font-bold text-lg">Chưa chọn nhà cung cấp</p>
        <p className="text-sm">Vui lòng chọn nhà cung cấp ở trên để xem dữ liệu lỗi trực quan.</p>
      </div>
    );
  }

  return (
    <div className="erp-card">
      <div className="flex items-center gap-3 mb-6">
        <div className="h-9 w-9 rounded-lg bg-[#2563EB]/10 text-[#2563EB] flex items-center justify-center shrink-0">
          <TrendingUp size={18} />
        </div>
        <div>
          <h2 className="text-base font-bold text-slate-900">Phân tích xu hướng tỷ lệ lỗi</h2>
          <p className="text-xs text-slate-500">Dữ liệu thực tế 365 ngày</p>
        </div>
      </div>

      {loading ? (
        <div className="w-full h-[400px] flex items-center justify-center">
          <Loader2 className="animate-spin text-[#2563EB]" size={32} />
        </div>
      ) : (
        <div className="w-full h-[400px] min-h-[400px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
              <XAxis dataKey="dayLabel" tick={{ fontSize: 11, fill: "#94A3B8" }} />
              <YAxis tickFormatter={(v) => `${v}%`} tick={{ fontSize: 11, fill: "#94A3B8" }} />
              <Tooltip content={<CustomTooltip />} />
              <Line type="monotone" dataKey="defectRate" stroke="#2563EB" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
};

export default DefectRateChart;
