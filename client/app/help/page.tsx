import React from "react";
import Link from "next/link";

export default function HelpPage() {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 p-6 text-center">
            <div className="bg-white p-12 rounded-3xl shadow-xl border border-slate-100 max-w-md">
                <div className="h-16 w-16 bg-[#F9EFEC] text-erp-blue rounded-3xl mx-auto flex items-center justify-center mb-6">
                   <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                </div>
                <h1 className="text-2xl font-black text-erp-navy mb-4 uppercase tracking-tight">Trung tâm Hỗ trợ</h1>
                <p className="text-black mb-8 font-medium">Bạn cần trợ giúp xử lý PR/PO? Vui lòng gửi email cho đội ngũ hỗ trợ kỹ thuật hoặc quay lại trang chủ.</p>
                <Link href="/" className="btn-primary block w-full py-3 text-sm font-black uppercase">Về bảng điều khiển</Link>
            </div>
        </div>
    );
}

