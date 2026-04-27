import React from "react";
import Link from "next/link";

export default function PlaceholderPage() {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-bg-primary p-6 text-center">
            <div className="bg-bg-secondary p-12 rounded-3xl shadow-xl border border-border max-w-md">
                <h1 className="text-2xl font-black text-text-primary mb-4 uppercase tracking-tight">Thông tin đang cập nhật</h1>
                <p className="text-text-secondary mb-8 font-medium">Trang nội dung này đang được đội ngũ phát triển hoàn thiện. Vui lòng quay lại sau.</p>
                <Link href="/" className="bg-[#B4533A] text-[#000000] block w-full py-3 rounded-xl font-bold hover:bg-[#A85032] transition-all">Quay về Trang chủ</Link>
            </div>
        </div>
    );
}

