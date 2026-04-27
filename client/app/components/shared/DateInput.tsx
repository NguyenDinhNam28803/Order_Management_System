"use client";

import React from "react";
import { Calendar } from "lucide-react";

interface DateInputProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
}

export default function DateInput({ 
  value, 
  onChange, 
  className = "", 
  placeholder = "DD/MM/YYYY", 
  required = false,
  disabled = false
}: DateInputProps) {
  
  // Convert state (YYYY-MM-DD) to display (DD/MM/YYYY)
  const displayValue = React.useMemo(() => {
    if (!value) return "";
    const cleanDate = value.split("T")[0];
    const parts = cleanDate.split("-");
    if (parts.length !== 3) return value;
    const [year, month, day] = parts;
    return `${day}/${month}/${year}`;
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let input = e.target.value;
    
    // Simple auto-formatting (optional but nice: adds / as they type)
    if (input.length === 2 && !input.includes("/")) input += "/";
    if (input.length === 5 && input.split("/").length === 2) input += "/";
    if (input.length > 10) input = input.substring(0, 10);

    // If it's a full valid DD/MM/YYYY, convert to YYYY-MM-DD for the state
    if (input.length === 10) {
      const parts = input.split("/");
      if (parts.length === 3) {
        const [d, m, y] = parts;
        // Basic validation: ensure they are numbers
        if (!isNaN(Number(d)) && !isNaN(Number(m)) && !isNaN(Number(y))) {
          onChange(`${y}-${m}-${d}`);
          return;
        }
      }
    }
    
    // For partial typing, we still need to store it or handle it.
    // However, the parent state usually expects a valid date.
    // If it's invalid, we can just pass the raw string if the parent handles it,
    // but usually it's better to only update the parent when valid, 
    // or keep a local state for the input.
  };

  // To allow typing freely, we need local state
  const [inputValue, setInputValue] = React.useState(displayValue);

  React.useEffect(() => {
    setInputValue(displayValue);
  }, [displayValue]);

  const onLocalChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.replace(/[^0-9/]/g, ""); // only numbers and /
    
    // Auto-slash logic
    if (val.length === 2 && !inputValue.endsWith("/")) val += "/";
    if (val.length === 5 && !inputValue.endsWith("/")) val += "/";
    if (val.length > 10) val = val.substring(0, 10);
    
    setInputValue(val);

    if (val.length === 10) {
      const [d, m, y] = val.split("/");
      if (d && m && y && y.length === 4) {
        onChange(`${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`);
      }
    }
  };

  return (
    <div className={`relative w-full group ${disabled ? "opacity-50 pointer-events-none" : ""}`}>
      <input
        type="text"
        value={inputValue}
        onChange={onLocalChange}
        placeholder={placeholder}
        required={required}
        disabled={disabled}
        maxLength={10}
        className="w-full px-[0.875rem] py-[0.625rem] bg-[#FFFFFF] border border-[rgba(148,163,184,0.12)] rounded-[0.75rem] text-[#000000] text-[0.875rem] font-bold outline-none transition-all focus:border-[#B4533A]"
      />
      <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[#000000] pointer-events-none text-[9px] font-black uppercase tracking-widest opacity-30">
        DD/MM/YYYY
      </div>
    </div>
  );
}
