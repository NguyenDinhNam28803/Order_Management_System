import React from "react";
import Link from "next/link";

export default function PrivacyPage() {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-[#FFFFFF] p-6 text-center">
            <div className="bg-[#FAF8F5] p-12 rounded-3xl shadow-xl shadow-[#B4533A]/5 border border-[rgba(148,163,184,0.1)] max-w-md">
                <h1 className="text-2xl font-black text-[#000000] mb-4 uppercase tracking-tight">Chính sách Bảo mật</h1>
                <p className="text-[#000000] mb-8 font-medium">Chúng tôi đang cập nhật chính sách bảo mật cho phiên bản mới. Nội dung sẽ sớm được hiển thị.</p>
                <Link href="/" className="block w-full py-3 bg-[#B4533A] hover:bg-[#A85032] text-[#000000] rounded-xl text-sm font-black uppercase transition-colors shadow-lg shadow-[#B4533A]/20">Về trang chủ</Link>
            </div>
        </div>
    );
}

