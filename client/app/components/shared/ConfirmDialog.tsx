"use client";

import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { AlertTriangle, X } from "lucide-react";

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "danger" | "warning" | "default";
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = "Xác nhận",
  cancelLabel = "Hủy",
  variant = "danger",
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const cancelRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (open) cancelRef.current?.focus();
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [open, onCancel]);

  if (!open) return null;

  const iconBg =
    variant === "danger" ? "bg-red-50 border-red-100" :
    variant === "warning" ? "bg-amber-50 border-amber-100" :
    "bg-blue-50 border-blue-100";

  const iconColor =
    variant === "danger" ? "text-red-500" :
    variant === "warning" ? "text-amber-500" :
    "text-blue-500";

  const confirmCls =
    variant === "danger" ? "btn-danger" :
    variant === "warning" ? "btn-primary" :
    "btn-primary";

  const content = (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-title"
      aria-describedby="confirm-message"
    >
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"
        onClick={onCancel}
        aria-hidden="true"
      />
      <div className="relative bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-sm mx-4 animate-slide-up">
        <div className="p-5">
          <div className="flex items-start gap-3">
            <div className={`h-9 w-9 rounded-lg border flex items-center justify-center shrink-0 ${iconBg}`}>
              <AlertTriangle size={16} className={iconColor} />
            </div>
            <div className="flex-1 min-w-0">
              <h3 id="confirm-title" className="text-sm font-bold text-slate-900 leading-tight">
                {title}
              </h3>
              <p id="confirm-message" className="text-xs text-slate-500 mt-1 leading-relaxed">
                {message}
              </p>
            </div>
            <button
              onClick={onCancel}
              className="shrink-0 p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              aria-label="Đóng"
            >
              <X size={14} />
            </button>
          </div>
        </div>
        <div className="px-5 pb-5 flex gap-2 justify-end border-t border-slate-100 pt-3">
          <button
            ref={cancelRef}
            onClick={onCancel}
            className="btn-secondary text-xs px-3 py-1.5"
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            className={`${confirmCls} text-xs px-3 py-1.5`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(content, document.body);
}
