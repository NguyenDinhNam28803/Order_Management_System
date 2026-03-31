import React from "react";
import Link from "next/link";

export default function PrivacyPage() {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 p-6 text-center">
            <div className="bg-white p-12 rounded-3xl shadow-xl border border-slate-100 max-w-md">
                <h1 className="text-2xl font-black text-erp-navy mb-4 uppercase tracking-tight">Chính sách Bảo mật</h1>
                <p className="text-slate-500 mb-8 font-medium">Chúng tôi đang cập nhật chính sách bảo mật cho phiên bản mới. Nội dung sẽ sớm được hiển thị.</p>
                <Link href="/" className="btn-primary block w-full py-3 text-sm font-black uppercase">Về trang chủ</Link>
            </div>
        </div>
    );
}
