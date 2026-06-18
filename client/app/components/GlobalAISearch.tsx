"use client";

import React, { useState, useEffect } from "react";
import { Sparkles, MessageSquare, FilePlus, X, Brain } from "lucide-react";
import dynamic from "next/dynamic";
import { useProcurement } from "../context/ProcurementContext";

const RAGChat       = dynamic(() => import("./RAGChat"),       { ssr: false });
const AIPrGenerator = dynamic(() => import("./AIPrGenerator"), { ssr: false });

type AIMode = "menu" | "chat" | "pr-generator";

export default function GlobalAISearch() {
    const { apiFetch } = useProcurement();
    const [isOpen, setIsOpen]   = useState(false);
    const [aiMode, setAiMode]   = useState<AIMode>("menu");
    const [hovered, setHovered] = useState(false);

    // Keyboard: ⌘/Ctrl + K
    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === "k") {
                e.preventDefault();
                setIsOpen(v => {
                    if (!v) setAiMode("chat");
                    return !v;
                });
            }
            if (e.key === "Escape") { setIsOpen(false); setAiMode("menu"); }
        };
        window.addEventListener("keydown", handler);
        return () => window.removeEventListener("keydown", handler);
    }, []);

    const handleClose = () => { setIsOpen(false); setAiMode("menu"); };
    const handleOpen  = () => { setIsOpen(true);  setAiMode("menu"); };

    return (
        <>
            {/* ── Floating AI Button ── */}
            <button
                onClick={handleOpen}
                onMouseEnter={() => setHovered(true)}
                onMouseLeave={() => setHovered(false)}
                title="Trợ lý AI (Ctrl+K)"
                className="ai-ring-btn fixed bottom-6 right-5 z-50 rounded-full
                           bg-gradient-to-br from-[#6366F1] via-[#8B5CF6] to-[#A855F7]
                           text-white shadow-2xl shadow-violet-500/40
                           hover:shadow-violet-500/60 hover:scale-110
                           active:scale-95
                           transition-all duration-300
                           border border-white/10
                           flex items-center justify-center
                           glow-ai"
                style={{ width: 52, height: 52 }}
            >
                <Sparkles size={22} className={hovered ? "animate-spin" : "animate-pulse"} />
            </button>

            {/* ── Mode Selection Menu ── */}
            {isOpen && aiMode === "menu" && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    {/* Backdrop */}
                    <div
                        className="absolute inset-0 bg-white/65 backdrop-blur-sm"
                        onClick={handleClose}
                    />

                    {/* Modal */}
                    <div className="relative bg-white rounded-xl border border-slate-200 shadow-2xl shadow-black/10 p-6 w-full max-w-sm animate-slide-up">
                        {/* Header */}
                        <div className="flex items-center justify-between mb-5">
                            <div className="flex items-center gap-2.5">
                                <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-[#6366F1] to-[#8B5CF6] flex items-center justify-center shadow-lg shadow-violet-500/30">
                                    <Brain size={16} className="text-white" />
                                </div>
                                <div>
                                    <h2 className="text-[13px] font-black text-slate-900 leading-none">Trợ lý AI</h2>
                                    <p className="text-[0.6875rem] text-slate-500 font-semibold uppercase tracking-widest mt-0.5">ProcureSmart Intelligence</p>
                                </div>
                            </div>
                            <button
                                onClick={handleClose}
                                className="h-7 w-7 flex items-center justify-center rounded-lg bg-slate-100 border border-slate-200 text-slate-500 hover:text-slate-900 hover:bg-slate-200 transition-all"
                            >
                                <X size={14} />
                            </button>
                        </div>

                        {/* Mode Cards */}
                        <div className="grid grid-cols-2 gap-3 mb-4">
                            {/* Chat Mode */}
                            <button
                                onClick={() => setAiMode("chat")}
                                className="flex flex-col items-center gap-3 p-5 rounded-xl
                                           bg-slate-50 border border-slate-200
                                           hover:border-[#2563EB]/50 hover:bg-[#2563EB]/5
                                           transition-all group text-left"
                            >
                                <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-[#2563EB] to-[#6366F1] flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg shadow-[#2563EB]/25">
                                    <MessageSquare size={20} className="text-white" />
                                </div>
                                <div className="text-center">
                                    <div className="text-[12px] font-bold text-slate-900 leading-tight">Hỏi đáp AI</div>
                                    <div className="text-[10px] text-slate-500 mt-0.5 leading-snug">Tìm kiếm dữ liệu ERP</div>
                                </div>
                            </button>

                            {/* PR Generator */}
                            <button
                                onClick={() => setAiMode("pr-generator")}
                                className="flex flex-col items-center gap-3 p-5 rounded-xl
                                           bg-slate-50 border border-slate-200
                                           hover:border-[#10B981]/50 hover:bg-[#10B981]/5
                                           transition-all group text-left"
                            >
                                <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-[#10B981] to-[#2563EB] flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg shadow-emerald-500/25">
                                    <FilePlus size={20} className="text-white" />
                                </div>
                                <div className="text-center">
                                    <div className="text-[12px] font-bold text-slate-900 leading-tight">Tạo PR</div>
                                    <div className="text-[10px] text-slate-500 mt-0.5 leading-snug">AI soạn PR Draft</div>
                                </div>
                            </button>
                        </div>

                        {/* Footer hint */}
                        <div className="flex items-center justify-center gap-1.5">
                            <span className="kbd">Ctrl</span>
                            <span className="text-[0.6875rem] text-slate-500">+</span>
                            <span className="kbd">K</span>
                            <span className="text-[10px] text-slate-500 ml-1">để mở / đóng nhanh</span>
                        </div>
                    </div>
                </div>
            )}

            {/* ── RAG Chat Modal ── */}
            {aiMode === "chat" && isOpen && (
                <RAGChat
                    apiFetch={apiFetch}
                    onClose={handleClose}
                    onSwitchMode={() => setAiMode("pr-generator")}
                />
            )}

            {/* ── AI PR Generator Modal ── */}
            {aiMode === "pr-generator" && isOpen && (
                <AIPrGenerator
                    isOpen={true}
                    onClose={handleClose}
                />
            )}
        </>
    );
}
