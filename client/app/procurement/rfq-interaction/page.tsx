"use client";

import { useSearchParams } from "next/navigation";
import RFQInteraction from "../../components/RFQInteraction";

export default function RFQInteractionPage() {
    const searchParams = useSearchParams();
    const rfqId = searchParams.get("id") || "";

    return (
        <main className="animate-in fade-in duration-500 p-6 min-h-screen bg-[#FFFFFF] text-[#000000]">
            <div className="mt-12 mb-8">
                <h1 className="text-3xl font-black text-brand-primary mb-2 tracking-tight">CÔNG CỤ XỬ LÝ RFQ THÔNG MINH</h1>
                <p className="text-black font-medium">Demo quy trình tự động lọc & so sánh giá cho Bộ phận Thu mua</p>
            </div>

            <div className="bg-white p-12 rounded-[40px] border border-slate-100 shadow-inner">
                <RFQInteraction rfqId={rfqId} />
            </div>

            <div className="mt-12 bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
                <h3 className="text-xs font-black uppercase tracking-widest text-black mb-6">Mô tả quy trình nghiệp vụ</h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                    <div className="space-y-2">
                        <div className="w-8 h-8 bg-[#F3DDD6] text-[#A85032] rounded-lg flex items-center justify-center font-black">1</div>
                        <p className="text-xs font-bold text-brand-primary uppercase">Lọc Top 3</p>
                        <p className="text-[10px] text-black leading-relaxed font-medium">Hệ thống tự động chấm điểm Rating của hàng nghìn NCC và lọc ra 3 đối tác tin cậy nhất cho mặt hàng này.</p>
                    </div>
                    <div className="space-y-2">
                        <div className="w-8 h-8 bg-orange-100 text-orange-600 rounded-lg flex items-center justify-center font-black">2</div>
                        <p className="text-xs font-bold text-brand-primary uppercase">Gửi RFQ Đồng loạt</p>
                        <p className="text-[10px] text-black leading-relaxed font-medium">Chỉ với 1 click, yêu cầu được gửi tới các cổng B2B của nhà cung cấp. Thời gian phản hồi giả định: 2 giây.</p>
                    </div>
                    <div className="space-y-2">
                        <div className="w-8 h-8 bg-emerald-100 text-emerald-600 rounded-lg flex items-center justify-center font-black">3</div>
                        <p className="text-xs font-bold text-brand-primary uppercase">So sánh & Highlight</p>
                        <p className="text-[10px] text-black leading-relaxed font-medium">AI tự động so sánh các mức giá báo về và làm nổi bật (Highlight) phương án tiết kiệm nhất cho doanh nghiệp.</p>
                    </div>
                    <div className="space-y-2">
                        <div className="w-8 h-8 bg-slate-100 text-slate-600 rounded-lg flex items-center justify-center font-black">4</div>
                        <p className="text-xs font-bold text-brand-primary uppercase">Chốt kết quả</p>
                        <p className="text-[10px] text-black leading-relaxed font-medium">PO xác nhận báo giá tốt nhất. Kết quả được đẩy ngược về cho Requester để tiến hành khởi tạo PR.</p>
                    </div>
                </div>
            </div>
        </main>
    );
}

