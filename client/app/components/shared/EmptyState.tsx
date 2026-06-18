"use client";

import React from "react";
import { Inbox } from "lucide-react";

interface EmptyStateProps {
  icon?: React.ReactNode;
  title?: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export default function EmptyState({
  icon = <Inbox size={28} className="text-slate-300" />,
  title = "Không có dữ liệu",
  description = "Chưa có mục nào. Dữ liệu sẽ xuất hiện tại đây.",
  action,
  className = "",
}: EmptyStateProps) {
  return (
    <div className={`empty-state ${className}`}>
      <div className="h-14 w-14 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center mb-3 empty-state-icon">
        {icon}
      </div>
      <p className="empty-state-title">{title}</p>
      <p className="empty-state-desc">{description}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
