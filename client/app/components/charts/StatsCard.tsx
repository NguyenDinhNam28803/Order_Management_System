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
  blue: "bg-[#FFFFFF] border-[#B4533A]/30 text-[#B4533A]",
  green: "bg-[#FFFFFF] border-emerald-500/30 text-black",
  amber: "bg-[#FFFFFF] border-amber-500/30 text-black",
  red: "bg-[#FFFFFF] border-rose-500/30 text-black",
  purple: "bg-[#FFFFFF] border-purple-500/30 text-black",
};

const iconBgClasses = {
  blue: "bg-[#B4533A]/10",
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
      className={`${colorClasses[color]} rounded-2xl p-4 border relative overflow-hidden ${className}`}
    >
      <div className="relative z-10">
        <div className="flex items-start justify-between mb-3">
          <div className={`p-2 rounded-lg ${iconBgClasses[color]}`}>
            <Icon size={18} className={colorClasses[color].split(" ").pop()} />
          </div>
          {trend && (
            <div
              className={`flex items-center gap-1 text-xs font-medium ${
                trend.isPositive ? "text-black" : "text-black"
              }`}
            >
              {trend.isPositive ? "↑" : "↓"} {Math.abs(trend.value)}%
            </div>
          )}
        </div>

        <p className="text-[10px] font-black uppercase tracking-widest text-[#000000] mb-1">
          {title}
        </p>
        <h3 className="text-3xl font-black text-[#000000]">{value}</h3>
        {subValue && (
          <p className="text-sm text-[#000000] mt-1">{subValue}</p>
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

