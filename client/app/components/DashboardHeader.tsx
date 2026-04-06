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
        <header className="fixed top-0 right-0 z-[60] flex h-16 w-[calc(100%-16rem)] items-center justify-between border-b border-slate-200 bg-white/80 px-8 backdrop-blur-md">
            {/* Breadcrumbs */}
            <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400">
                <Home size={14} className="text-slate-300" />
                {breadcrumbs.map((item, index) => (
                    <React.Fragment key={item}>
                        <ChevronRight size={12} className="text-slate-300" />
                        <span className={index === breadcrumbs.length - 1 ? "text-indigo-900 font-bold" : "text-slate-400"}>
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
                        className="group flex items-center gap-3 h-10 w-72 rounded-xl border border-slate-200 bg-slate-50/50 px-4 cursor-pointer hover:border-indigo-300 hover:bg-indigo-50/30 transition-all shadow-sm"
                    >
                        <Sparkles size={16} className="text-indigo-500 group-hover:scale-110 transition-transform" />
                        <span className="text-xs text-slate-400 font-medium">Hỏi AI về ngân sách & quy trình...</span>
                        <div className="ml-auto bg-white border border-slate-200 px-1.5 py-0.5 rounded text-[9px] font-bold text-slate-400 shadow-xs">⌘K</div>
                    </div>

                    {/* AI Search Overlay */}
                    {isSearchOpen && (
                        <div className="fixed inset-x-0 top-0 z-[100] h-screen bg-slate-900/40 backdrop-blur-sm p-4 animate-in fade-in duration-300 flex justify-center pt-20">
                            <div className="bg-white w-full max-w-2xl h-fit max-h-[80vh] rounded-3xl shadow-2xl flex flex-col border border-indigo-100 overflow-hidden animate-in slide-in-from-top-4 duration-500">
                                <form onSubmit={handleAIsolve} className="p-5 border-b border-slate-100 flex items-center gap-4 bg-slate-50/50">
                                    <div className="bg-indigo-600 p-2 rounded-xl text-white shadow-lg shadow-indigo-200">
                                        <Bot size={20} />
                                    </div>
                                    <input 
                                        autoFocus
                                        type="text" 
                                        placeholder="Nhập câu hỏi cho AI (VD: Tổng ngân sách IT đã dùng bao nhiêu?)"
                                        className="flex-1 bg-transparent border-none outline-none text-sm font-bold text-slate-900 placeholder:text-slate-400"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                    />
                                    <div className="flex items-center gap-2">
                                        <button 
                                            type="button"
                                            onClick={() => { setIsSearchOpen(false); setSearchQuery(""); setAiResponse(null); }}
                                            className="p-2 text-slate-300 hover:text-slate-500 transition-colors"
                                        >
                                            <X size={20} />
                                        </button>
                                        <button 
                                            type="submit"
                                            disabled={isLoading || !searchQuery.trim()}
                                            className="bg-indigo-600 text-white p-2 rounded-xl hover:bg-slate-900 transition-all disabled:opacity-30 shadow-lg shadow-indigo-100"
                                        >
                                            <Send size={18} />
                                        </button>
                                    </div>
                                </form>

                                <div className="flex-1 overflow-y-auto p-6 min-h-[200px] max-h-[500px] custom-scrollbar bg-white">
                                    {isLoading ? (
                                        <div className="flex flex-col items-center justify-center py-12 gap-4">
                                            <Loader2 size={32} className="animate-spin text-indigo-600" />
                                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest animate-pulse">Đang truy vấn Vector DB...</p>
                                        </div>
                                    ) : aiResponse ? (
                                        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
                                            <div className="flex flex-col gap-2">
                                                <div className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest flex items-center gap-2">
                                                    <Sparkles size={12} /> AI TRẢ LỜI
                                                </div>
                                                <div className="text-sm text-slate-700 leading-relaxed font-medium bg-indigo-50/30 p-5 rounded-2xl border border-indigo-50">
                                                    {aiResponse}
                                                </div>
                                            </div>

                                            {sources.length > 0 && (
                                                <div className="space-y-3">
                                                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Nguồn tham khảo</div>
                                                    <div className="grid grid-cols-1 gap-2">
                                                        {sources.map((s, idx) => (
                                                            <div key={idx} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100 hover:border-indigo-200 transition-colors cursor-pointer group">
                                                                <div className="flex items-center gap-3">
                                                                    <div className="p-1.5 bg-white border border-slate-200 rounded-lg text-slate-400">
                                                                        <FileText size={14} />
                                                                    </div>
                                                                    <span className="text-xs font-bold text-slate-600 truncate max-w-[400px]">{s.metadata?.title || s.content.substring(0, 50) + "..."}</span>
                                                                </div>
                                                                <ExternalLink size={12} className="text-slate-300 group-hover:text-indigo-600" />
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <p className="md:col-span-2 text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 px-2">Gợi ý truy vấn</p>
                                            {[
                                                "Show me total budget for 2026",
                                                "Top 3 suppliers by spending",
                                                "Review status of PR #1234",
                                                "Compare budgets between IT and HR"
                                            ].map((text) => (
                                                <button 
                                                    key={text}
                                                    onClick={() => { setSearchQuery(text); }}
                                                    className="text-left p-4 bg-slate-50 border border-slate-100 rounded-2xl text-[11px] font-bold text-slate-600 hover:border-indigo-300 hover:bg-white hover:text-indigo-600 transition-all shadow-xs"
                                                >
                                                    {text}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                                <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-center">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">AI-Powered Search Engine v2.0 • RAG & Vector Integration</p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                <div className="flex items-center gap-1">
                    <button className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100 hover:text-indigo-600 transition-colors">
                        <Globe size={18} />
                    </button>
                    <button className="relative flex h-9 w-9 items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100 hover:text-indigo-600 transition-colors">
                        <Bell size={18} />
                        {pendingCount > 0 && (
                            <span className="absolute top-2 right-2 flex h-4 w-4 items-center justify-center rounded-full bg-rose-600 border-2 border-white text-[9px] font-bold text-white scale-110">
                                {pendingCount}
                            </span>
                        )}
                    </button>
                </div>

                <div className="h-6 w-px bg-slate-200"></div>

                <div className="flex items-center gap-3">
                    <div className="text-right flex flex-col">
                        <span className="text-[11px] font-bold text-slate-900 leading-tight">{currentUser?.fullName || "User"}</span>
                        <span className="text-[9px] font-bold text-indigo-600 tracking-wider uppercase opacity-80">{currentUser?.role || "GUEST"}</span>
                    </div>
                    <div className="h-10 w-10 rounded-2xl bg-indigo-100 border border-indigo-200 flex items-center justify-center text-indigo-700 font-bold shadow-sm">
                        {currentUser?.fullName?.charAt(0) || "U"}
                    </div>
                </div>

            </div>
        </header>
    );
}
