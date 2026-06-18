"use client";

import React from "react";
import type { LucideIcon } from "lucide-react";

type IconColor = "blue" | "green" | "amber" | "purple" | "rose" | "slate";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  icon?: LucideIcon;
  iconColor?: IconColor;
  actions?: React.ReactNode;
}

export default function PageHeader({ title, subtitle, icon: Icon, iconColor = "blue", actions }: PageHeaderProps) {
  return (
    <div className="page-header mb-6">
      <div className="flex items-center gap-3">
        {Icon && (
          <div className={`page-icon icon-${iconColor}`}>
            <Icon size={18} />
          </div>
        )}
        <div>
          <h1 className="page-title">{title}</h1>
          {subtitle && <p className="page-subtitle">{subtitle}</p>}
        </div>
      </div>
      {actions && (
        <div className="flex items-center gap-2 flex-wrap">
          {actions}
        </div>
      )}
    </div>
  );
}
