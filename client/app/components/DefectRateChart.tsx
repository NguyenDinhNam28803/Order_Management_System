"use client";

import React, { useMemo, useState } from "react";
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
import { ScanLine, AlertTriangle, X } from "lucide-react";

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
const DefectRateChart: React.FC = () => {
  const [isScanning, setIsScanning] = useState(false);

  // Generate data once on component mount
  const data = useMemo(() => generateMockData(), []);

  // Filter data points that are part of the hidden issue
  const hiddenIssueData = useMemo(
    () => data.filter((d) => d.isHiddenIssue),
    [data]
  );

  // Toggle scan mode
  const handleScanToggle = () => {
    setIsScanning((prev) => !prev);
  };

  return (
    <div className="w-full bg-white rounded-xl shadow-lg p-6">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-800">
            Defect Rate History
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            365-day trend analysis (Day 1 - Day 365)
          </p>
        </div>

        {/* Scan Button */}
        <button
          onClick={handleScanToggle}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
            isScanning
              ? "bg-red-100 text-red-700 hover:bg-red-200 border border-red-300"
              : "bg-blue-600 text-white hover:bg-blue-700 shadow-md hover:shadow-lg"
          }`}
        >
          {isScanning ? (
            <>
              <X size={18} />
              <span>Clear Scan</span>
            </>
          ) : (
            <>
              <ScanLine size={18} />
              <span>Scan for Hidden Issues</span>
            </>
          )}
        </button>
      </div>

      {/* Alert Badge - Hidden Issue Detected */}
      {isScanning && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg animate-in fade-in slide-in-from-top-2">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-red-100 rounded-full">
              <AlertTriangle className="text-red-600" size={20} />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-red-800">
                Hidden Issue Detected
              </h3>
              <p className="text-sm text-red-700 mt-1">
                <span className="font-medium">Day {HIDDEN_ISSUE_START} - Day {HIDDEN_ISSUE_END}</span>
                {" "}•{" "}
                <span className="font-medium">
                  Defect Rate: {HIDDEN_ISSUE_START_RATE}% → {HIDDEN_ISSUE_END_RATE}%
                </span>
              </p>
              <p className="text-xs text-red-600 mt-2">
                Continuous upward trend detected over 14 days. This pattern may indicate
                a systemic quality control issue.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Chart Container */}
      <div className="w-full h-[400px] sm:h-[500px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={data}
            margin={{
              top: 20,
              right: 30,
              left: 10,
              bottom: 20,
            }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="#e5e7eb"
              vertical={false}
            />

            <XAxis
              dataKey="dayLabel"
              tick={{ fontSize: 12, fill: "#6b7280" }}
              tickLine={false}
              axisLine={{ stroke: "#d1d5db" }}
              interval="preserveStartEnd"
              minTickGap={30}
            />

            <YAxis
              domain={[0, 11]}
              tick={{ fontSize: 12, fill: "#6b7280" }}
              tickLine={false}
              axisLine={{ stroke: "#d1d5db" }}
              tickFormatter={(value) => `${value}%`}
              label={{
                value: "Defect Rate (%)",
                angle: -90,
                position: "insideLeft",
                style: { textAnchor: "middle", fill: "#6b7280", fontSize: 12 },
              }}
            />

            <Tooltip content={<CustomTooltip />} />

            {/* Hidden Issue Highlight Area */}
            {isScanning && (
              <ReferenceArea
                x1={`Day ${HIDDEN_ISSUE_START}`}
                x2={`Day ${HIDDEN_ISSUE_END}`}
                fill="#ef4444"
                fillOpacity={0.15}
                stroke="#ef4444"
                strokeOpacity={0.3}
              />
            )}

            {/* Normal Data Line */}
            <Line
              type="monotone"
              dataKey="defectRate"
              stroke="#3b82f6"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4, stroke: "#3b82f6", strokeWidth: 2, fill: "#fff" }}
              connectNulls
            />

            {/* Hidden Issue Highlight Points */}
            {isScanning &&
              hiddenIssueData.map((point, index) => (
                <ReferenceDot
                  key={`highlight-${point.day}`}
                  x={point.dayLabel}
                  y={point.defectRate}
                  r={4}
                  fill="#ef4444"
                  stroke="#fff"
                  strokeWidth={2}
                />
              ))}

            {/* Start and End Markers for Hidden Issue */}
            {isScanning && (
              <>
                <ReferenceDot
                  x={`Day ${HIDDEN_ISSUE_START}`}
                  y={HIDDEN_ISSUE_START_RATE}
                  r={6}
                  fill="#ef4444"
                  stroke="#fff"
                  strokeWidth={2}
                />
                <ReferenceDot
                  x={`Day ${HIDDEN_ISSUE_END}`}
                  y={HIDDEN_ISSUE_END_RATE}
                  r={6}
                  fill="#ef4444"
                  stroke="#fff"
                  strokeWidth={2}
                />
              </>
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center justify-center gap-6 mt-4 pt-4 border-t border-gray-100">
        <div className="flex items-center gap-2">
          <div className="w-4 h-1 bg-blue-500 rounded"></div>
          <span className="text-sm text-gray-600">Normal Defect Rate</span>
        </div>
        {isScanning && (
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-red-500 rounded-full opacity-80"></div>
            <span className="text-sm text-red-600 font-medium">Hidden Issue Zone</span>
          </div>
        )}
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-blue-500 rounded-full"></div>
          <span className="text-sm text-gray-600">Data Point (hover for details)</span>
        </div>
      </div>
    </div>
  );
};

export default DefectRateChart;
