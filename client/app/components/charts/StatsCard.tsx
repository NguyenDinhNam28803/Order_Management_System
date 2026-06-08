"use client";

import React from "react";
import { LucideIcon } from "lucide-react";
import { formatVND } from "../../utils/formatUtils";

interface StatsCardProps {
  title: string;
  value: string | number;
  subValue?: string;
  icon: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  color?: "blue" | "green" | "amber" | "red" | "purple";
  className?: string;
  children?: React.ReactNode;
}

const colorClasses = {
  blue:   "bg-[#FFFFFF] border-[#2563EB]/30 text-[#2563EB]",
  green:  "bg-[#FFFFFF] border-emerald-500/30 text-emerald-600",
  amber:  "bg-[#FFFFFF] border-amber-500/30 text-amber-600",
  red:    "bg-[#FFFFFF] border-rose-500/30 text-rose-600",
  purple: "bg-[#FFFFFF] border-purple-500/30 text-purple-600",
};

const iconBgClasses = {
  blue: "bg-[#2563EB]/10",
  green: "bg-emerald-500/10",
  amber: "bg-amber-500/10",
  red: "bg-rose-500/10",
  purple: "bg-purple-500/10",
};

export default function StatsCard({
  title,
  value,
  subValue,
  icon: Icon,
  trend,
  color = "blue",
  className = "",
  children,
}: StatsCardProps) {
  return (
    <div
      className={`${colorClasses[color]} rounded-xl p-3.5 border relative overflow-hidden ${className}`}
    >
      <div className="relative z-10">
        <div className="flex items-start justify-between mb-2">
          <div className={`p-1.5 rounded-lg ${iconBgClasses[color]}`}>
            <Icon size={16} className={colorClasses[color].split(" ").pop()} />
          </div>
          {trend && (
            <div
              className={`flex items-center gap-1 text-[0.6875rem] font-semibold ${
                trend.isPositive ? "text-emerald-600" : "text-rose-600"
              }`}
            >
              {trend.isPositive ? "↑" : "↓"} {Math.abs(trend.value)}%
            </div>
          )}
        </div>
        
        <p className="text-[0.6875rem] font-bold uppercase tracking-widest text-slate-500 mb-0.5">
          {title}
        </p>
        <h3 className="text-2xl font-bold text-slate-900 leading-tight">{value}</h3>
        {subValue && (
          <p className="text-xs text-slate-500 mt-0.5">{subValue}</p>
        )}

        {children && <div className="mt-2 pt-2 border-t border-slate-100">{children}</div>}
      </div>

      {/* Background decoration */}
      <div className="absolute -bottom-3 -right-3 w-16 h-16 opacity-10">
        <Icon size={64} />
      </div>
    </div>
  );
}

