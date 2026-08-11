"use client";

import Link from "next/link";
import { Sparkles, ArrowLeft } from "lucide-react";
import { AI_DISABLED_MESSAGE } from "../config/features";

/**
 * Placeholder shown in place of an AI-only page while the AI feature is paused
 * (see FEATURES.AI_ENABLED in ../config/features). Rendered when a user reaches
 * an AI route directly by URL.
 */
export default function AiDisabledNotice() {
    return (
        <div className="min-h-[60vh] flex items-center justify-center">
            <div className="text-center bg-white rounded-xl border border-[#E2E8F0] shadow-sm p-10 max-w-md animate-in fade-in zoom-in duration-500">
                <div className="h-16 w-16 bg-violet-100 text-violet-500 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Sparkles size={30} />
                </div>
                <h2 className="text-xl font-black text-[#0F172A] mb-2">Tính năng AI đang tạm dừng</h2>
                <p className="text-[0.8125rem] text-[#64748B] mb-8">{AI_DISABLED_MESSAGE}.</p>
                <Link href="/" className="btn-secondary py-2! text-xs inline-flex items-center gap-2">
                    <ArrowLeft size={16} /> Quay lại trang chủ
                </Link>
            </div>
        </div>
    );
}
