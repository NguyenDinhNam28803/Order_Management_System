"use client";

import React, { useState, useEffect } from "react";
import { Sparkles } from "lucide-react";
import dynamic from "next/dynamic";
import { useProcurement } from "../context/ProcurementContext";

const RAGChat = dynamic(() => import("./RAGChat"), { ssr: false });

export default function GlobalAISearch() {
    const { apiFetch } = useProcurement();
    const [isSearchOpen, setIsSearchOpen] = useState(false);

    // Keyboard shortcut: Cmd/Ctrl + K
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault();
                setIsSearchOpen(prev => !prev);
            }
            if (e.key === 'Escape') {
                setIsSearchOpen(false);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    return (
        <>
            {/* Floating AI Search Button - Fixed bottom left, just icon */}
            <button
                onClick={() => setIsSearchOpen(true)}
                className="fixed bottom-6 right-4 z-50 w-12 h-12 rounded-full bg-linear-to-r from-[#3B82F6] to-[#8B5CF6] text-white shadow-2xl shadow-[#3B82F6]/30 hover:shadow-[#3B82F6]/50 hover:scale-110 transition-all duration-300 border border-white/10 flex items-center justify-center"
                title="Hỏi AI (Ctrl+K)"
            >
                <Sparkles size={24} className="animate-pulse" />
            </button>

            {/* RAG Chat Modal */}
            {isSearchOpen && (
                <RAGChat
                    apiFetch={apiFetch}
                    onClose={() => setIsSearchOpen(false)}
                />
            )}
        </>
    );
}
