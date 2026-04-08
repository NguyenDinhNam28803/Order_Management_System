"use client";

import React, { useState, useEffect } from "react";
import { Sparkles, MessageSquare, FilePlus, X } from "lucide-react";
import dynamic from "next/dynamic";
import { useProcurement } from "../context/ProcurementContext";

const RAGChat = dynamic(() => import("./RAGChat"), { ssr: false });
const AIPrGenerator = dynamic(() => import("./AIPrGenerator"), { ssr: false });

type AIMode = 'menu' | 'chat' | 'pr-generator';

export default function GlobalAISearch() {
    const { apiFetch } = useProcurement();
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [aiMode, setAiMode] = useState<AIMode>('menu');

    // Keyboard shortcut: Cmd/Ctrl + K
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault();
                setIsSearchOpen(prev => !prev);
                if (!isSearchOpen) setAiMode('chat');
            }
            if (e.key === 'Escape') {
                setIsSearchOpen(false);
                setAiMode('menu');
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isSearchOpen]);

    const handleClose = () => {
        setIsSearchOpen(false);
        setAiMode('menu');
    };

    const handleOpenMenu = () => {
        setIsSearchOpen(true);
        setAiMode('menu');
    };

    return (
        <>
            {/* Floating AI Search Button - Fixed bottom left, just icon */}
            <button
                onClick={handleOpenMenu}
                className="fixed bottom-6 right-4 z-50 w-14 h-14 rounded-full bg-gradient-to-r from-[#3B82F6] to-[#8B5CF6] text-white shadow-2xl shadow-[#3B82F6]/30 hover:shadow-[#3B82F6]/50 hover:scale-110 transition-all duration-300 border border-white/10 flex items-center justify-center"
                title="AI Assistant (Ctrl+K)"
            >
                <Sparkles size={24} className="animate-pulse" />
            </button>

            {/* AI Mode Selection Menu */}
            {isSearchOpen && aiMode === 'menu' && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={handleClose} />
                    <div className="relative bg-[#0F1117] rounded-2xl border border-[rgba(148,163,184,0.1)] shadow-2xl p-6 w-full max-w-md">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-bold text-[#F8FAFC]">Chọn chức năng AI</h2>
                            <button onClick={handleClose} className="text-[#94A3B8] hover:text-[#F8FAFC]">
                                <X size={20} />
                            </button>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <button
                                onClick={() => setAiMode('chat')}
                                className="flex flex-col items-center gap-3 p-6 rounded-xl bg-[#161922] border border-[rgba(148,163,184,0.1)] hover:border-[#3B82F6]/50 hover:bg-[rgba(59,130,246,0.1)] transition-all group"
                            >
                                <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-[#3B82F6] to-[#8B5CF6] flex items-center justify-center group-hover:scale-110 transition-transform">
                                    <MessageSquare size={24} className="text-white" />
                                </div>
                                <div className="text-center">
                                    <div className="font-medium text-[#F8FAFC]">Hỏi đáp AI</div>
                                    <div className="text-xs text-[#64748B] mt-1">Tìm kiếm thông tin</div>
                                </div>
                            </button>
                            <button
                                onClick={() => setAiMode('pr-generator')}
                                className="flex flex-col items-center gap-3 p-6 rounded-xl bg-[#161922] border border-[rgba(148,163,184,0.1)] hover:border-[#3B82F6]/50 hover:bg-[rgba(59,130,246,0.1)] transition-all group"
                            >
                                <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-[#10B981] to-[#3B82F6] flex items-center justify-center group-hover:scale-110 transition-transform">
                                    <FilePlus size={24} className="text-white" />
                                </div>
                                <div className="text-center">
                                    <div className="font-medium text-[#F8FAFC]">Tạo PR</div>
                                    <div className="text-xs text-[#64748B] mt-1">AI tạo PR Draft</div>
                                </div>
                            </button>
                        </div>
                        <p className="text-center text-xs text-[#64748B] mt-4">
                            Phím tắt: Ctrl+K để mở Chat
                        </p>
                    </div>
                </div>
            )}

            {/* RAG Chat Modal */}
            {aiMode === 'chat' && isSearchOpen && (
                <RAGChat
                    apiFetch={apiFetch}
                    onClose={handleClose}
                />
            )}

            {/* AI PR Generator Modal */}
            {aiMode === 'pr-generator' && isSearchOpen && (
                <AIPrGenerator
                    isOpen={true}
                    onClose={handleClose}
                />
            )}
        </>
    );
}
