"use client";

import React, { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";

interface TooltipProps {
  content: React.ReactNode;
  children: React.ReactElement;
  placement?: "top" | "bottom" | "left" | "right";
  delay?: number;
}

export default function Tooltip({
  content,
  children,
  placement = "top",
  delay = 300,
}: TooltipProps) {
  const [visible, setVisible] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0 });
  const triggerRef = useRef<HTMLElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const show = () => {
    timerRef.current = setTimeout(() => {
      if (!triggerRef.current) return;
      const rect = triggerRef.current.getBoundingClientRect();
      const gap = 6;
      let top = 0;
      let left = 0;
      if (placement === "top") {
        top = rect.top + window.scrollY - gap;
        left = rect.left + window.scrollX + rect.width / 2;
      } else if (placement === "bottom") {
        top = rect.bottom + window.scrollY + gap;
        left = rect.left + window.scrollX + rect.width / 2;
      } else if (placement === "left") {
        top = rect.top + window.scrollY + rect.height / 2;
        left = rect.left + window.scrollX - gap;
      } else {
        top = rect.top + window.scrollY + rect.height / 2;
        left = rect.right + window.scrollX + gap;
      }
      setCoords({ top, left });
      setVisible(true);
    }, delay);
  };

  const hide = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setVisible(false);
  };

  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current); }, []);

  const transformMap: Record<string, string> = {
    top: "translate(-50%, -100%)",
    bottom: "translate(-50%, 0)",
    left: "translate(-100%, -50%)",
    right: "translate(0, -50%)",
  };

  const child = React.cloneElement(children, {
    ref: triggerRef,
    onMouseEnter: show,
    onMouseLeave: hide,
    onFocus: show,
    onBlur: hide,
  });

  const tooltip = visible ? (
    <div
      role="tooltip"
      style={{
        position: "absolute",
        top: coords.top,
        left: coords.left,
        transform: transformMap[placement],
        zIndex: 9999,
      }}
      className="pointer-events-none px-2 py-1 rounded-md bg-slate-900 text-white text-[11px] font-medium shadow-lg whitespace-nowrap max-w-[200px] text-center"
    >
      {content}
    </div>
  ) : null;

  return (
    <>
      {child}
      {typeof document !== "undefined" && tooltip
        ? createPortal(tooltip, document.body)
        : null}
    </>
  );
}
