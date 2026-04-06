import React from "react";
import Link from "next/link";

export default function PlaceholderPage() {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-[#0F1117] p-6 text-center">
            <div className="bg-[#161922] p-12 rounded-3xl shadow-xl border border-[rgba(148,163,184,0.1)] max-w-md">
                <h1 className="text-2xl font-black text-[#F8FAFC] mb-4 uppercase tracking-tight">Thông tin đang cập nhật</h1>
                <p className="text-[#94A3B8] mb-8 font-medium">Trang nội dung này đang được đội ngũ phát triển hoàn thiện. Vui lòng quay lại sau.</p>
                <Link href="/" className="bg-[#3B82F6] text-white block w-full py-3 rounded-xl font-bold hover:bg-[#2563EB] transition-all">Quay về Trang chủ</Link>
            </div>
        </div>
    );
}
