import React from "react";
import Link from "next/link";

export default function PrivacyPage() {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-[#FFFFFF] p-6 text-center">
            <div className="bg-[#F1F5F9] p-12 rounded-xl shadow-xl shadow-[#2563EB]/5 border border-slate-200 max-w-md">
                <h1 className="text-2xl font-black text-slate-900 mb-4 uppercase tracking-tight">Chính sách Bảo mật</h1>
                <p className="text-slate-900 mb-8 font-medium">Chúng tôi đang cập nhật chính sách bảo mật cho phiên bản mới. Nội dung sẽ sớm được hiển thị.</p>
                <Link href="/" className="block w-full py-3 bg-[#2563EB] hover:bg-[#1D4ED8] text-white rounded-xl text-sm font-black uppercase transition-colors shadow-lg shadow-[#2563EB]/20">Về trang chủ</Link>
            </div>
        </div>
    );
}

