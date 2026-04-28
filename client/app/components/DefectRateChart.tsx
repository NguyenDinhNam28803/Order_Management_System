"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceArea,
  ReferenceDot,
} from "recharts";
import { ScanLine, AlertTriangle, X, Loader2 } from "lucide-react";

// Constants for data generation
const TOTAL_DAYS = 365;
const HIDDEN_ISSUE_START = 105;
const HIDDEN_ISSUE_END = 119;
const HIDDEN_ISSUE_START_RATE = 1.2;
const HIDDEN_ISSUE_END_RATE = 4.5;

// Interface for chart data point
interface DataPoint {
  day: number;
  dayLabel: string;
  defectRate: number;
  isHiddenIssue: boolean;
}

/**
 * Generate mock defect rate data for 365 days
 * - Most days: random value between 1% and 10%
 * - Days 105-119: linear increase from 1.2% to 4.5% (hidden issue pattern)
 */
const generateMockData = (): DataPoint[] => {
  const data: DataPoint[] = [];

  for (let day = 1; day <= TOTAL_DAYS; day++) {
    let defectRate: number;
    const isHiddenIssue = day >= HIDDEN_ISSUE_START && day <= HIDDEN_ISSUE_END;

    if (isHiddenIssue) {
      // Linear interpolation for hidden issue days
      const progress = (day - HIDDEN_ISSUE_START) / (HIDDEN_ISSUE_END - HIDDEN_ISSUE_START);
      defectRate = HIDDEN_ISSUE_START_RATE + progress * (HIDDEN_ISSUE_END_RATE - HIDDEN_ISSUE_START_RATE);
    } else {
      // Random value between 1% and 10% for normal days
      defectRate = Math.random() * 9 + 1; // 1 to 10
    }

    data.push({
      day,
      dayLabel: `Day ${day}`,
      defectRate: parseFloat(defectRate.toFixed(2)),
      isHiddenIssue,
    });
  }

  return data;
};

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
      <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
        <p className="font-semibold text-gray-800">{label}</p>
        <p className="text-blue-600">
          <span className="font-medium">Defect Rate: </span>
          {data.defectRate.toFixed(2)}%
        </p>
        {data.isHiddenIssue && (
          <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
            <AlertTriangle size={14} />
            Hidden Issue Zone
          </p>
        )}
      </div>
    );
  }
  return null;
};

/**
 * DefectRateChart Component
 * Interactive line chart displaying 365 days of defect rate data
 * with hidden issue detection feature
 */
const DefectRateChart: React.FC<{ supplierId: string | null }> = ({ supplierId }) => {
  const [data, setData] = useState<DataPoint[]>([]);
  const [loading, setLoading] = useState(false);
  const [isScanning, setIsScanning] = useState(false);

  useEffect(() => {
    if (supplierId) {
      setLoading(true);
      fetch(`${process.env.NEXT_PUBLIC_API_URL}/quality/suppliers/${supplierId}/history`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token') || ''}` }
      })
      .then(res => res.json())
      .then(data => {
        setData(data);
        setLoading(false);
      })
      .catch(err => {
        console.error("Lỗi tải dữ liệu:", err);
        setLoading(false);
      });
    }
  }, [supplierId]);

  // Toggle scan mode
  const handleScanToggle = () => {
    setIsScanning((prev) => !prev);
  };

  if (!supplierId) {
    return (
      <div className="w-full h-[400px] bg-[#FAF8F5] rounded-xl border border-[rgba(148,163,184,0.1)] flex flex-col items-center justify-center text-[#6b7280]">
        <AlertTriangle size={48} className="mb-4 opacity-20" />
        <p className="font-bold text-lg">Chưa chọn nhà cung cấp</p>
        <p className="text-sm">Vui lòng chọn nhà cung cấp từ danh sách ở trên để xem dữ liệu lỗi trực quan.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="w-full h-[400px] flex items-center justify-center">
        <Loader2 className="animate-spin text-[#B4533A]" size={32} />
      </div>
    );
  }

  return (
    <div className="w-full bg-white rounded-xl shadow-lg p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-800">Defect Rate History</h2>
          <p className="text-sm text-gray-500 mt-1">Phân tích dữ liệu thực tế</p>
        </div>
        <button
          onClick={handleScanToggle}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
            isScanning ? "bg-red-100 text-red-700" : "bg-blue-600 text-white"
          }`}
        >
          {isScanning ? <X size={18} /> : <ScanLine size={18} />}
          <span>{isScanning ? "Clear Scan" : "Scan for Hidden Issues"}</span>
        </button>
      </div>

      <div className="w-full h-[400px] sm:h-[500px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="dayLabel" />
            <YAxis tickFormatter={(v) => `${v}%`} />
            <Tooltip />
            <Line type="monotone" dataKey="defectRate" stroke="#3b82f6" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default DefectRateChart;
