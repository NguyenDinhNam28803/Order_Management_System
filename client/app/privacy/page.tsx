import React from "react";
import Link from "next/link";

export default function PrivacyPage() {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-[#0F1117] p-6 text-center">
            <div className="bg-[#161922] p-12 rounded-3xl shadow-xl shadow-[#3B82F6]/5 border border-[rgba(148,163,184,0.1)] max-w-md">
                <h1 className="text-2xl font-black text-[#F8FAFC] mb-4 uppercase tracking-tight">Chính sách Bảo mật</h1>
                <p className="text-[#64748B] mb-8 font-medium">Chúng tôi đang cập nhật chính sách bảo mật cho phiên bản mới. Nội dung sẽ sớm được hiển thị.</p>
                <Link href="/" className="block w-full py-3 bg-[#3B82F6] hover:bg-[#2563EB] text-white rounded-xl text-sm font-black uppercase transition-colors shadow-lg shadow-[#3B82F6]/20">Về trang chủ</Link>
            </div>
        </div>
    );
}
