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
  blue: "from-[#3B82F6]/20 to-[#3B82F6]/5 text-[#3B82F6]",
  green: "from-emerald-500/20 to-emerald-500/5 text-emerald-400",
  amber: "from-amber-500/20 to-amber-500/5 text-amber-400",
  red: "from-rose-500/20 to-rose-500/5 text-rose-400",
  purple: "from-purple-500/20 to-purple-500/5 text-purple-400",
};

const iconBgClasses = {
  blue: "bg-[#3B82F6]/10",
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
      className={`bg-gradient-to-br ${colorClasses[color]} rounded-xl p-4 border border-[rgba(148,163,184,0.1)] relative overflow-hidden ${className}`}
    >
      <div className="relative z-10">
        <div className="flex items-start justify-between mb-3">
          <div className={`p-2 rounded-lg ${iconBgClasses[color]}`}>
            <Icon size={18} className={colorClasses[color].split(" ").pop()} />
          </div>
          {trend && (
            <div
              className={`flex items-center gap-1 text-xs font-medium ${
                trend.isPositive ? "text-emerald-400" : "text-rose-400"
              }`}
            >
              {trend.isPositive ? "↑" : "↓"} {Math.abs(trend.value)}%
            </div>
          )}
        </div>

        <p className="text-[10px] font-black uppercase tracking-widest text-[#64748B] mb-1">
          {title}
        </p>
        <h3 className="text-3xl font-black text-[#F8FAFC]">{value}</h3>
        {subValue && (
          <p className="text-sm text-[#94A3B8] mt-1">{subValue}</p>
        )}

        {children && <div className="mt-3 pt-3 border-t border-[rgba(148,163,184,0.1)]">{children}</div>}
      </div>

      {/* Background decoration */}
      <div className="absolute -bottom-3 -right-3 w-16 h-16 opacity-10">
        <Icon size={64} />
      </div>
    </div>
  );
}
