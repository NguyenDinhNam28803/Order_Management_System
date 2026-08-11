"use client";

import React from "react";

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
  /** Format a segment value for the legend (default: vi-VN number). Money charts pass formatVNDCompact. */
  valueFormatter?: (value: number) => string;
  /** Show the formatted value next to each legend row (default true). */
  showValues?: boolean;
  /** Render without the self card wrapper — for embedding inside an existing card. */
  bare?: boolean;
  /** Fill of the donut hole; should match the surrounding surface color. */
  holeColor?: string;
}

export default function DonutChart({
  data,
  title,
  centerLabel,
  centerValue,
  size = 160,
  valueFormatter = (v) => v.toLocaleString("vi-VN"),
  showValues = true,
  bare = false,
  holeColor = "#F1F5F9",
}: DonutChartProps) {
  const rawTotal = data.reduce((sum, d) => sum + d.value, 0);
  // Only non-negative parts drive ring geometry + percentages so a negative
  // segment (e.g. over-budget "Còn lại") can't break the SVG arc maths.
  const posTotal = data.reduce((sum, d) => sum + Math.max(0, d.value), 0);
  const overBy = data.reduce((sum, d) => sum + (d.value < 0 ? -d.value : 0), 0);
  const hasData = data.length > 0 && posTotal > 0;

  let cursor = 0;
  const segments = hasData
    ? data.map((item) => {
        const pos = Math.max(0, item.value);
        const angle = (pos / posTotal) * 360;
        const startAngle = cursor;
        cursor += angle;
        return { ...item, startAngle, angle, pct: (pos / posTotal) * 100 };
      })
    : [];

  const polarToCartesian = (cx: number, cy: number, r: number, angle: number) => {
    const rad = ((angle - 90) * Math.PI) / 180;
    return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
  };

  const createArc = (cx: number, cy: number, r: number, startAngle: number, angle: number) => {
    const endAngle = startAngle + angle;
    const start = polarToCartesian(cx, cy, r, endAngle);
    const end = polarToCartesian(cx, cy, r, startAngle);
    const largeArc = angle > 180 ? 1 : 0;
    return `M ${cx} ${cy} L ${start.x} ${start.y} A ${r} ${r} 0 ${largeArc} 0 ${end.x} ${end.y} Z`;
  };

  const center = size / 2;
  const radius = (size - 20) / 2;
  const resolvedCenterValue = centerValue ?? valueFormatter(rawTotal);

  const ariaLabel =
    (title ? `${title}: ` : "") +
    (hasData
      ? segments.map((s) => `${s.label} ${s.pct.toFixed(0)}%`).join(", ")
      : "Không có dữ liệu");

  const body = (
    <>
      {title && (
        <h3 className="text-sm font-bold text-slate-900 mb-4 uppercase tracking-wider">
          {title}
        </h3>
      )}
      <div className="flex items-center gap-6">
        <div className="relative shrink-0" style={{ width: size, height: size }}>
          <svg width={size} height={size} className="-rotate-90" role="img" aria-label={ariaLabel}>
            {segments.map((seg, idx) => (
              <path
                key={idx}
                d={createArc(center, center, radius, seg.startAngle, seg.angle)}
                fill={seg.color}
                className="hover:opacity-80 transition-opacity"
              >
                <title>{`${seg.label}: ${valueFormatter(seg.value)} (${seg.pct.toFixed(1)}%)`}</title>
              </path>
            ))}
            <circle cx={center} cy={center} r={radius * 0.62} fill={holeColor} />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center px-2 text-center">
            <span className="text-base font-bold text-slate-900 num-display leading-none">
              {resolvedCenterValue}
            </span>
            {centerLabel && (
              <span className="text-[10px] text-slate-500 uppercase tracking-wide mt-1">
                {centerLabel}
              </span>
            )}
          </div>
        </div>

        <div className="flex-1 min-w-0">
          {!hasData ? (
            <div className="text-xs text-slate-500 italic">Không có dữ liệu</div>
          ) : (
            <div className="space-y-1.5">
              {segments.map((seg, idx) => (
                <div key={idx} className="flex items-center justify-between text-xs gap-3">
                  <div className="flex items-center gap-2 min-w-0">
                    <span
                      className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                      style={{ backgroundColor: seg.color }}
                    />
                    <span className="text-slate-700 truncate">{seg.label}</span>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0 num-display">
                    {showValues && (
                      <span
                        className={`font-semibold ${seg.value < 0 ? "text-rose-600" : "text-slate-900"}`}
                      >
                        {valueFormatter(seg.value)}
                      </span>
                    )}
                    <span className="text-slate-400 w-9 text-right">{seg.pct.toFixed(0)}%</span>
                  </div>
                </div>
              ))}

              {/* Total */}
              <div className="flex items-center justify-between text-xs gap-3 pt-1.5 mt-1 border-t border-slate-200">
                <span className="text-slate-500 font-semibold uppercase tracking-wide text-[10px]">
                  Tổng
                </span>
                <span className="text-slate-900 font-bold num-display">{valueFormatter(rawTotal)}</span>
              </div>

              {/* Over-budget warning */}
              {overBy > 0 && (
                <div className="flex items-center gap-1.5 text-[11px] font-semibold text-rose-600 bg-rose-50 border border-rose-200 rounded-md px-2 py-1 mt-1">
                  <span aria-hidden>⚠</span> Vượt {valueFormatter(overBy)}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );

  if (bare) return <div>{body}</div>;
  return <div className="bg-[#F1F5F9] rounded-xl p-6 border border-slate-200">{body}</div>;
}
