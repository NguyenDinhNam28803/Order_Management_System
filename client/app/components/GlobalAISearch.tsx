"use client";

import React, { useState, useEffect } from "react";
import { Sparkles, MessageSquare, FilePlus, X, Zap, Brain } from "lucide-react";
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
                title="AI Assistant (Ctrl+K)"
                className="ai-ring-btn fixed bottom-6 right-5 z-50 w-13 h-13 rounded-full
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
                    <div className="relative bg-white rounded-xl border border-[#E2E8F0] shadow-xl shadow-black/10 p-5 w-full max-w-sm animate-slide-up">
                        {/* Header */}
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2.5">
                                <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-[#6366F1] to-[#8B5CF6] flex items-center justify-center shadow-md shadow-violet-500/25">
                                    <Brain size={15} className="text-white" />
                                </div>
                                <div>
                                    <h2 className="text-[13px] font-black text-[#0F172A] leading-none">AI Assistant</h2>
                                    <p className="text-[9px] text-[#64748B] font-semibold uppercase tracking-widest mt-0.5">ProcureSmart Intelligence</p>
                                </div>
                            </div>
                            <button
                                onClick={handleClose}
                                className="h-7 w-7 flex items-center justify-center rounded-lg bg-[#F1F5F9] border border-[#E2E8F0] text-[#64748B] hover:text-[#0F172A] hover:bg-[#E2E8F0] transition-all"
                            >
                                <X size={14} />
                            </button>
                        </div>

                        {/* Mode Cards */}
                        <div className="grid grid-cols-2 gap-2.5 mb-4">
                            {/* Chat Mode */}
                            <button
                                onClick={() => setAiMode("chat")}
                                className="flex flex-col items-center gap-2.5 p-4 rounded-xl
                                           bg-[#F8FAFC] border border-[#E2E8F0]
                                           hover:border-[#6366F1]/40 hover:bg-[#F5F3FF]
                                           transition-all group"
                            >
                                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#2563EB] to-[#6366F1] flex items-center justify-center group-hover:scale-105 transition-transform shadow-md shadow-[#2563EB]/20">
                                    <MessageSquare size={18} className="text-white" />
                                </div>
                                <div className="text-center">
                                    <div className="text-[11.5px] font-bold text-[#0F172A] leading-tight">Hỏi đáp AI</div>
                                    <div className="text-[10px] text-[#64748B] mt-0.5">Tìm kiếm dữ liệu ERP</div>
                                </div>
                            </button>

                            {/* PR Generator */}
                            <button
                                onClick={() => setAiMode("pr-generator")}
                                className="flex flex-col items-center gap-2.5 p-4 rounded-xl
                                           bg-[#F8FAFC] border border-[#E2E8F0]
                                           hover:border-[#10B981]/40 hover:bg-[#F0FDF4]
                                           transition-all group"
                            >
                                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#10B981] to-[#2563EB] flex items-center justify-center group-hover:scale-105 transition-transform shadow-md shadow-emerald-500/20">
                                    <FilePlus size={18} className="text-white" />
                                </div>
                                <div className="text-center">
                                    <div className="text-[11.5px] font-bold text-[#0F172A] leading-tight">Tạo PR</div>
                                    <div className="text-[10px] text-[#64748B] mt-0.5">AI soạn PR Draft</div>
                                </div>
                            </button>
                        </div>

                        {/* Footer hint */}
                        <div className="flex items-center justify-center gap-1.5">
                            <span className="kbd">Ctrl</span>
                            <span className="text-[9px] text-[#94A3B8]">+</span>
                            <span className="kbd">K</span>
                            <span className="text-[10px] text-[#94A3B8] ml-1">để mở / đóng nhanh</span>
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

