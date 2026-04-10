"use client";

import React, { useState, useEffect, useCallback } from "react";
import { 
  Search, FileText, ShoppingCart, DollarSign, 
  Clock, User, Building, X, Sparkles, ArrowRight,
  Command, TrendingUp
} from "lucide-react";
import { useProcurement } from "../context/ProcurementContext";
import { getStatusLabel } from "../utils/formatUtils";

interface SearchResult {
  id: string;
  type: "PR" | "PO" | "INVOICE" | "VENDOR" | "PRODUCT";
  title: string;
  subtitle: string;
  metadata: string;
  status?: string;
}

const mockSuggestions = [
  { icon: <TrendingUp size={14} />, text: "Budget phòng IT còn bao nhiêu?", type: "ai" },
  { icon: <FileText size={14} />, text: "PR gần đây của tôi", type: "recent" },
  { icon: <ShoppingCart size={14} />, text: "PO chờ duyệt", type: "quick" },
  { icon: <DollarSign size={14} />, text: "Hóa đơn cần thanh toán", type: "quick" },
];

export default function SmartSearch() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isAiMode, setIsAiMode] = useState(false);
  const { pos, prs, notify } = useProcurement();

  // Handle keyboard shortcut (Ctrl+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setIsOpen(true);
      }
      if (e.key === "Escape") {
        setIsOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Search logic
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    // Simulate AI search or regular search
    if (query.toLowerCase().includes("bao nhiêu") || 
        query.toLowerCase().includes("còn") ||
        query.toLowerCase().includes("budget")) {
      setIsAiMode(true);
      // Simulate AI response
      setResults([{
        id: "ai-response",
        type: "PR",
        title: "Budget IT Department - Q1 2024",
        subtitle: "Ngân sách còn lại: 500 triệu ₫ (10%)",
        metadata: "AI Assistant • Vừa xong",
        status: "info"
      }]);
    } else {
      setIsAiMode(false);
      // Regular search simulation
      const mockResults: SearchResult[] = [
        {
          id: "PR-2024-001",
          type: "PR" as const,
          title: "Yêu cầu mua văn phòng phẩm",
          subtitle: "Người yêu cầu: Nguyễn Văn A",
          metadata: "IT Department • 2 ngày trước",
          status: "PENDING"
        },
        {
          id: "PO-2024-089",
          type: "PO" as const,
          title: "Đơn đặt hàng thiết bị máy chủ",
          subtitle: "Nhà cung cấp: TechCorp VN",
          metadata: "2.5B ₫ • Đang giao",
          status: "ACTIVE"
        },
        {
          id: "VENDOR-001",
          type: "VENDOR" as const,
          title: "Công ty TNHH TechCorp VN",
          subtitle: "Nhà cung cấp thiết bị IT",
          metadata: "156 đơn hàng • 4.8★",
        },
      ].filter(r => 
        r.title.toLowerCase().includes(query.toLowerCase()) ||
        r.id.toLowerCase().includes(query.toLowerCase())
      );
      setResults(mockResults);
    }
  }, [query]);

  const handleSelect = (result: SearchResult) => {
    notify(`Đi tới ${result.id}`, "info");
    setIsOpen(false);
    setQuery("");
  };

  const getIcon = (type: string) => {
    switch (type) {
      case "PR": return <FileText size={16} className="text-blue-400" />;
      case "PO": return <ShoppingCart size={16} className="text-emerald-400" />;
      case "INVOICE": return <DollarSign size={16} className="text-amber-400" />;
      case "VENDOR": return <Building size={16} className="text-violet-400" />;
      default: return <FileText size={16} className="text-gray-400" />;
    }
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 px-4 py-2 bg-[#161922] border border-[rgba(148,163,184,0.1)] rounded-xl text-[#64748B] hover:text-[#94A3B8] hover:border-[rgba(59,130,246,0.3)] transition-all text-sm"
      >
        <Search size={16} />
        <span className="hidden md:inline">Tìm kiếm...</span>
        <kbd className="hidden md:inline-flex items-center gap-1 px-2 py-0.5 bg-[#0F1117] rounded text-xs font-mono border border-[rgba(148,163,184,0.1)]">
          <Command size={12} /> K
        </kbd>
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-start justify-center pt-[15vh] p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={() => setIsOpen(false)}
      />
      
      {/* Search Modal */}
      <div className="relative w-full max-w-2xl bg-[#161922] border border-[rgba(148,163,184,0.1)] rounded-2xl shadow-2xl overflow-hidden animate-fade-in">
        {/* Search Input */}
        <div className="flex items-center gap-3 p-4 border-b border-[rgba(148,163,184,0.1)]">
          {isAiMode ? (
            <div className="p-2 bg-gradient-to-br from-[#8B5CF6] to-[#3B82F6] rounded-lg">
              <Sparkles size={18} className="text-white" />
            </div>
          ) : (
            <Search size={20} className="text-[#64748B]" />
          )}
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={isAiMode ? "Đang tìm câu trả lời..." : "Tìm PR, PO, Nhà cung cấp... (gõ tự nhiên bằng tiếng Việt)"}
            className="flex-1 bg-transparent text-[#F8FAFC] placeholder-[#64748B] text-lg outline-none"
            autoFocus
          />
          {query && (
            <button 
              onClick={() => setQuery("")}
              className="p-1 hover:bg-[rgba(148,163,184,0.1)] rounded"
            >
              <X size={18} className="text-[#64748B]" />
            </button>
          )}
          <kbd className="px-2 py-1 bg-[#0F1117] rounded text-xs text-[#64748B] border border-[rgba(148,163,184,0.1)]">
            ESC
          </kbd>
        </div>

        {/* AI Mode Indicator */}
        {isAiMode && (
          <div className="px-4 py-2 bg-gradient-to-r from-[rgba(139,92,246,0.1)] to-[rgba(59,130,246,0.1)] border-b border-[rgba(148,163,184,0.1)]">
            <p className="text-xs text-[#8B5CF6] flex items-center gap-2">
              <Sparkles size={12} />
              AI đang phân tích dữ liệu và tạo câu trả lời...
            </p>
          </div>
        )}

        {/* Results */}
        <div className="max-h-[50vh] overflow-y-auto">
          {results.length > 0 ? (
            <div className="py-2">
              <div className="px-4 py-2 text-xs font-semibold text-[#64748B] uppercase tracking-wider">
                {isAiMode ? "AI Assistant" : `Kết quả tìm kiếm (${results.length})`}
              </div>
              {results.map((result, idx) => (
                <button
                  key={result.id}
                  onClick={() => handleSelect(result)}
                  className={`w-full flex items-start gap-3 p-3 mx-2 rounded-lg transition-all text-left ${
                    selectedIndex === idx 
                      ? "bg-[rgba(59,130,246,0.15)] border border-[rgba(59,130,246,0.3)]" 
                      : "hover:bg-[rgba(148,163,184,0.05)]"
                  }`}
                  onMouseEnter={() => setSelectedIndex(idx)}
                >
                  <div className="p-2 bg-[#161922] rounded-lg border border-[rgba(148,163,184,0.1)]">
                    {getIcon(result.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-[#F8FAFC] truncate">{result.title}</span>
                      {result.status && (
                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                          result.status === "PENDING" ? "bg-amber-500/20 text-amber-400" :
                          result.status === "ACTIVE" ? "bg-emerald-500/20 text-emerald-400" :
                          "bg-blue-500/20 text-blue-400"
                        }`}>
                          {getStatusLabel(result.status)}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-[#94A3B8] truncate">{result.subtitle}</p>
                    <p className="text-xs text-[#64748B] mt-0.5">{result.metadata}</p>
                  </div>
                  <ArrowRight size={16} className="text-[#64748B] opacity-0 group-hover:opacity-100" />
                </button>
              ))}
            </div>
          ) : query ? (
            <div className="p-8 text-center">
              <Search size={32} className="mx-auto mb-3 text-[#64748B] opacity-50" />
              <p className="text-sm text-[#94A3B8]">Không tìm thấy kết quả cho "{query}"</p>
              <p className="text-xs text-[#64748B] mt-1">
                Thử tìm với từ khóa khác hoặc dùng AI Assistant
              </p>
            </div>
          ) : (
            <div className="py-2">
              {/* Recent & Suggestions */}
              <div className="px-4 py-2 text-xs font-semibold text-[#64748B] uppercase tracking-wider">
                Gợi ý tìm kiếm
              </div>
              {mockSuggestions.map((suggestion, idx) => (
                <button
                  key={idx}
                  onClick={() => setQuery(suggestion.text)}
                  className="w-full flex items-center gap-3 p-3 mx-2 rounded-lg hover:bg-[rgba(148,163,184,0.05)] transition-all text-left"
                >
                  <div className={`p-2 rounded-lg ${
                    suggestion.type === "ai" 
                      ? "bg-gradient-to-br from-[#8B5CF6] to-[#3B82F6] text-white" 
                      : "bg-[#161922] text-[#64748B]"
                  }`}>
                    {suggestion.icon}
                  </div>
                  <span className="text-[#F8FAFC]">{suggestion.text}</span>
                  {suggestion.type === "ai" && (
                    <span className="ml-auto text-xs text-[#8B5CF6] font-semibold">AI</span>
                  )}
                </button>
              ))}

              {/* Quick Actions */}
              <div className="px-4 py-2 mt-2 text-xs font-semibold text-[#64748B] uppercase tracking-wider">
                Truy cập nhanh
              </div>
              <div className="grid grid-cols-2 gap-2 px-4 pb-4">
                {[
                  { label: "Tạo PR mới", shortcut: "⌘N", icon: <FileText size={14} /> },
                  { label: "Dashboard", shortcut: "⌘D", icon: <TrendingUp size={14} /> },
                  { label: "Inbox", shortcut: "⌘I", icon: <Clock size={14} /> },
                  { label: "Báo cáo", shortcut: "⌘R", icon: <User size={14} /> },
                ].map((action) => (
                  <button
                    key={action.label}
                    className="flex items-center justify-between p-3 bg-[#161922] rounded-lg hover:bg-[rgba(59,130,246,0.1)] transition-all text-left"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-[#64748B]">{action.icon}</span>
                      <span className="text-sm text-[#F8FAFC]">{action.label}</span>
                    </div>
                    <kbd className="text-xs text-[#64748B] font-mono">{action.shortcut}</kbd>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-4 py-3 bg-[#0F1117] border-t border-[rgba(148,163,184,0.1)] text-xs text-[#64748B]">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-[#0F1117] rounded border border-[rgba(148,163,184,0.1)]">↑↓</kbd>
              Chọn
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-[#0F1117] rounded border border-[rgba(148,163,184,0.1)]">↵</kbd>
              Mở
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span>Powered by</span>
            <span className="text-[#8B5CF6] font-semibold">Qwen AI</span>
          </div>
        </div>
      </div>
    </div>
  );
}
