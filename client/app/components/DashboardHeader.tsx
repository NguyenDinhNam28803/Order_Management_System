"use client";

import React, { useState, useRef, useEffect } from "react";
import {
    Bell, Globe, Search, ChevronRight, Home, LogOut, Sparkles, Send, X, Loader2, Bot, ExternalLink, FileText, BookOpen
} from "lucide-react";
import { useProcurement, PR } from "../context/ProcurementContext";
import { useRouter } from "next/navigation";

export default function ERPHeader({ breadcrumbs = ["Tài chính", "Khoản phải trả", "Đối soát 3 bên"] }: { breadcrumbs?: string[] }) {
    const { currentUser, logout, prs, apiFetch } = useProcurement();
    const router = useRouter();

    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [aiResponse, setAiResponse] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [sources, setSources] = useState<any[]>([]);

    const pendingCount = prs.filter((pr: PR) => {
        if (!currentUser) return false;
        if (currentUser.role === "REQUESTER") return pr.status === "PENDING";
        if (currentUser.role === "DIRECTOR") return pr.status === "PENDING_DIRECTOR";
        return pr.status === "PENDING";
    }).length;

    const handleAIsolve = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!searchQuery.trim()) return;
        
        setIsLoading(true);
        setAiResponse(null);
        try {
            const resp = await apiFetch('/rag/query', {
                method: 'POST',
                body: JSON.stringify({ question: searchQuery, topK: 3 })
            });
            if (resp.ok) {
                const data = await resp.json();
                setAiResponse(data.answer);
                setSources(data.sources || []);
            } else {
                setAiResponse("Rất tiếc, AI không thể truy xuất dữ liệu lúc này. Vui lòng thử lại sau.");
            }
        } catch (err) {
            setAiResponse("Lỗi kết nối tới hệ thống RAG.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <header className="sticky top-0 z-40 flex h-16 w-full items-center justify-between border-b border-[rgba(148,163,184,0.1)] bg-[#161922]/80 px-8 backdrop-blur-xl">
            {/* Breadcrumbs */}
            <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-[#64748B]">
                <Home size={14} className="text-[#64748B]" />
                {breadcrumbs.map((item, index) => (
                    <React.Fragment key={item}>
                        <ChevronRight size={12} className="text-[#64748B]" />
                        <span className={index === breadcrumbs.length - 1 ? "text-[#F8FAFC] font-bold" : "text-[#64748B]"}>
                            {item}
                        </span>
                    </React.Fragment>
                ))}
            </div>

            {/* Hub Tools */}
            <div className="flex items-center gap-6">
                {/* Smart Search AI Trigger */}
                <div className="relative">
                    <div 
                        onClick={() => setIsSearchOpen(true)}
                        className="group flex items-center gap-3 h-10 w-72 rounded-xl border border-[rgba(148,163,184,0.1)] bg-[#161922] px-4 cursor-pointer hover:border-[rgba(59,130,246,0.3)] hover:bg-[#1A1D23] transition-all shadow-sm"
                    >
                        <Sparkles size={16} className="text-[#3B82F6] group-hover:scale-110 transition-transform" />
                        <span className="text-xs text-[#64748B] font-medium">Hỏi AI về ngân sách & quy trình...</span>
                        <div className="ml-auto bg-[#0F1117] border border-[rgba(148,163,184,0.1)] px-1.5 py-0.5 rounded text-[9px] font-bold text-[#64748B] shadow-xs">⌘K</div>
                    </div>

                    {/* AI Search Overlay */}
                    {isSearchOpen && (
                        <div className="fixed inset-x-0 top-0 z-[100] h-screen bg-[#0F1117]/80 backdrop-blur-sm p-4 animate-in fade-in duration-300 flex justify-center pt-20">
                            <div className="bg-[#161922] w-full max-w-2xl h-fit max-h-[80vh] rounded-3xl shadow-2xl flex flex-col border border-[rgba(148,163,184,0.1)] overflow-hidden animate-in slide-in-from-top-4 duration-500">
                                <form onSubmit={handleAIsolve} className="p-5 border-b border-[rgba(148,163,184,0.1)] flex items-center gap-4 bg-[#161922]">
                                    <div className="bg-[#3B82F6] p-2 rounded-xl text-white shadow-lg shadow-[#3B82F6]/20">
                                        <Bot size={20} />
                                    </div>
                                    <input 
                                        autoFocus
                                        type="text" 
                                        placeholder="Nhập câu hỏi cho AI (VD: Tổng ngân sách IT đã dùng bao nhiêu?)"
                                        className="flex-1 bg-transparent border-none outline-none text-sm font-bold text-[#F8FAFC] placeholder:text-[#64748B]"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                    />
                                    <div className="flex items-center gap-2">
                                        <button 
                                            type="button"
                                            onClick={() => { setIsSearchOpen(false); setSearchQuery(""); setAiResponse(null); }}
                                            className="p-2 text-[#64748B] hover:text-[#F8FAFC] transition-colors"
                                        >
                                            <X size={20} />
                                        </button>
                                        <button 
                                            type="submit"
                                            disabled={isLoading || !searchQuery.trim()}
                                            className="bg-[#3B82F6] text-white p-2 rounded-xl hover:bg-[#2563EB] transition-all disabled:opacity-30 shadow-lg shadow-[#3B82F6]/20"
                                        >
                                            <Send size={18} />
                                        </button>
                                    </div>
                                </form>

                                <div className="flex-1 overflow-y-auto p-6 min-h-[200px] max-h-[500px] custom-scrollbar bg-[#0F1117]">
                                    {isLoading ? (
                                        <div className="flex flex-col items-center justify-center py-12 gap-4">
                                            <Loader2 size={32} className="animate-spin text-[#3B82F6]" />
                                            <p className="text-xs font-bold text-[#64748B] uppercase tracking-widest animate-pulse">Đang truy vấn Vector DB...</p>
                                        </div>
                                    ) : aiResponse ? (
                                        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
                                            <div className="flex flex-col gap-2">
                                                <div className="text-[10px] font-bold text-[#3B82F6] uppercase tracking-widest flex items-center gap-2">
                                                    <Sparkles size={12} /> AI TRẢ LỜI
                                                </div>
                                                <div className="text-sm text-[#94A3B8] leading-relaxed font-medium bg-[#161922] p-5 rounded-2xl border border-[rgba(148,163,184,0.1)]">
                                                    {aiResponse}
                                                </div>
                                            </div>

                                            {sources.length > 0 && (
                                                <div className="space-y-3">
                                                    <div className="text-[10px] font-bold text-[#64748B] uppercase tracking-widest">Nguồn tham khảo</div>
                                                    <div className="grid grid-cols-1 gap-2">
                                                        {sources.map((s, idx) => (
                                                            <div key={idx} className="flex items-center justify-between p-3 bg-[#161922] rounded-xl border border-[rgba(148,163,184,0.1)] hover:border-[rgba(59,130,246,0.3)] transition-colors cursor-pointer group">
                                                                <div className="flex items-center gap-3">
                                                                    <div className="p-1.5 bg-[#0F1117] border border-[rgba(148,163,184,0.1)] rounded-lg text-[#64748B]">
                                                                        <FileText size={14} />
                                                                    </div>
                                                                    <span className="text-xs font-bold text-[#94A3B8] truncate max-w-[400px]">{s.metadata?.title || s.content.substring(0, 50) + "..."}</span>
                                                                </div>
                                                                <ExternalLink size={12} className="text-[#64748B] group-hover:text-[#3B82F6]" />
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <p className="md:col-span-2 text-xs font-bold text-[#64748B] uppercase tracking-widest mb-2 px-2">Gợi ý truy vấn</p>
                                            {[
                                                "Show me total budget for 2026",
                                                "Top 3 suppliers by spending",
                                                "Review status of PR #1234",
                                                "Compare budgets between IT and HR"
                                            ].map((text) => (
                                                <button 
                                                    key={text}
                                                    onClick={() => { setSearchQuery(text); }}
                                                    className="text-left p-4 bg-[#161922] border border-[rgba(148,163,184,0.1)] rounded-2xl text-[11px] font-bold text-[#94A3B8] hover:border-[#3B82F6]/30 hover:bg-[#1A1D23] hover:text-[#3B82F6] transition-all shadow-xs"
                                                >
                                                    {text}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                                <div className="p-4 bg-[#161922] border-t border-[rgba(148,163,184,0.1)] flex justify-center">
                                    <p className="text-[10px] font-bold text-[#64748B] uppercase tracking-tighter">AI-Powered Search Engine v2.0 • RAG & Vector Integration</p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                <div className="flex items-center gap-1">
                    <button className="flex h-9 w-9 items-center justify-center rounded-xl text-[#64748B] hover:bg-[#1A1D23] hover:text-[#3B82F6] transition-colors">
                        <Globe size={18} />
                    </button>
                    <button className="relative flex h-9 w-9 items-center justify-center rounded-xl text-[#64748B] hover:bg-[#1A1D23] hover:text-[#3B82F6] transition-colors">
                        <Bell size={18} />
                        {pendingCount > 0 && (
                            <span className="absolute top-2 right-2 flex h-4 w-4 items-center justify-center rounded-full bg-rose-600 border-2 border-[#0F1117] text-[9px] font-bold text-white scale-110">
                                {pendingCount}
                            </span>
                        )}
                    </button>
                </div>

                <div className="h-6 w-px bg-[rgba(148,163,184,0.1)]"></div>

                <div className="flex items-center gap-3">
                    <div className="text-right flex flex-col">
                        <span className="text-[11px] font-bold text-[#F8FAFC] leading-tight">{currentUser?.fullName || "User"}</span>
                        <span className="text-[9px] font-bold text-[#3B82F6] tracking-wider uppercase opacity-80">{currentUser?.role || "GUEST"}</span>
                    </div>
                    <div className="h-10 w-10 rounded-2xl bg-[#1A1D23] border border-[rgba(148,163,184,0.1)] flex items-center justify-center text-[#3B82F6] font-bold shadow-sm">
                        {currentUser?.fullName?.charAt(0) || "U"}
                    </div>
                </div>

            </div>
        </header>
    );
}
