"use client";

import React from "react";
import { formatVND } from "../../utils/formatUtils";

interface DonutSegment {
  label: string;
  value: number;
  color: string;
}

interface DonutChartProps {
  data: DonutSegment[];
  title?: string;
  centerLabel?: string;
  centerValue?: string;
  size?: number;
}

export default function DonutChart({
  data,
  title,
  centerLabel,
  centerValue,
  size = 160,
}: DonutChartProps) {
  const total = data.reduce((sum, d) => sum + d.value, 0);
  let currentAngle = 0;

  // Handle empty data or zero total
  const hasData = data.length > 0 && total > 0;
  const segments = hasData
    ? data.map((item) => {
        const angle = (item.value / total) * 360;
        const startAngle = currentAngle;
        currentAngle += angle;
        return { ...item, startAngle, angle };
      })
    : [];

  const polarToCartesian = (cx: number, cy: number, radius: number, angle: number) => {
    const rad = ((angle - 90) * Math.PI) / 180;
    return {
      x: cx + radius * Math.cos(rad),
      y: cy + radius * Math.sin(rad),
    };
  };

  const createArc = (cx: number, cy: number, radius: number, startAngle: number, angle: number) => {
    const endAngle = startAngle + angle;
    const start = polarToCartesian(cx, cy, radius, endAngle);
    const end = polarToCartesian(cx, cy, radius, startAngle);
    const largeArc = angle > 180 ? 1 : 0;
    return `M ${cx} ${cy} L ${start.x} ${start.y} A ${radius} ${radius} 0 ${largeArc} 0 ${end.x} ${end.y} Z`;
  };

  const center = size / 2;
  const radius = (size - 20) / 2;

  return (
    <div className="bg-[#161922] rounded-2xl p-6 border border-[rgba(148,163,184,0.1)]">
      {title && (
        <h3 className="text-sm font-bold text-[#F8FAFC] mb-4 uppercase tracking-wider">
          {title}
        </h3>
      )}
      <div className="flex items-center gap-6">
        <div className="relative" style={{ width: size, height: size }}>
          <svg width={size} height={size} className="-rotate-90">
            {segments.map((seg, idx) => (
              <path
                key={idx}
                d={createArc(center, center, radius, seg.startAngle, seg.angle)}
                fill={seg.color}
                className="hover:opacity-80 transition-opacity"
              />
            ))}
            <circle cx={center} cy={center} r={radius * 0.6} fill="#161922" />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            {centerValue && (
              <span className="text-lg font-bold text-[#F8FAFC]">{centerValue}</span>
            )}
            {centerLabel && (
              <span className="text-[10px] text-[#94A3B8] uppercase">{centerLabel}</span>
            )}
          </div>
        </div>
        <div className="flex-1 space-y-2 min-w-0">
          {!hasData ? (
            <div className="text-xs text-[#64748B] italic">Không có dữ liệu</div>
          ) : (
            segments.map((seg, idx) => (
              <div key={idx} className="flex items-center justify-between text-xs gap-4">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: seg.color }} />
                  <span className="text-[#94A3B8] truncate">{seg.label}</span>
                </div>
                <span className="text-[#F8FAFC] font-medium flex-shrink-0">
                  {total > 0 ? ((seg.value / total) * 100).toFixed(1) : 0}%
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
