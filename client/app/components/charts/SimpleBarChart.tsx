"use client";

import React from "react";
import { formatVND } from "../../utils/formatUtils";

interface BarData {
  label: string;
  value: number;
  color?: string;
}

interface SimpleBarChartProps {
  data: BarData[];
  title?: string;
  maxValue?: number;
  formatValue?: (val: number) => string;
  height?: number;
}

export default function SimpleBarChart({
  data,
  title,
  maxValue,
  formatValue = formatVND,
  height = 200,
}: SimpleBarChartProps) {
  const max = maxValue || Math.max(...data.map((d) => d.value), 1);

  return (
    <div className="bg-[#FAF8F5] rounded-2xl p-6 border border-[rgba(148,163,184,0.1)]">
      {title && (
        <h3 className="text-sm font-bold text-[#000000] mb-4 uppercase tracking-wider">
          {title}
        </h3>
      )}
      <div className="space-y-3" style={{ minHeight: height }}>
        {data.map((item, idx) => {
          const percentage = (item.value / max) * 100;
          return (
            <div key={idx} className="flex items-center gap-3">
              <span className="text-xs text-[#000000] w-24 truncate">
                {item.label}
              </span>
              <div className="flex-1 bg-[#FFFFFF] rounded-full h-6 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    item.color || "bg-[#B4533A]"
                  }`}
                  style={{ width: `${percentage}%` }}
                />
              </div>
              <span className="text-xs font-medium text-[#000000] w-28 text-right">
                {formatValue(item.value)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

