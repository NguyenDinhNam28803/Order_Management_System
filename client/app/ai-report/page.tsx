"use client";

import React, { useState } from "react";
import DashboardHeader from "../components/DashboardHeader";
import { Zap, AlertTriangle, CheckCircle2, Shield, Info, ArrowRight, ArrowLeft, Send, FileText } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function AIReportPage() {
    const router = useRouter();
    const [selection, setSelection] = useState("AI");
    const [overrideReason, setOverrideReason] = useState("");
    const [isConfirmed, setIsConfirmed] = useState(false);

    const handleConfirm = () => {
        setIsConfirmed(true);
        setTimeout(() => {
            router.push("/");
        }, 2000);
    };

    if (isConfirmed) {
        return (
            <div className="h-screen flex items-center justify-center bg-slate-50">
                <div className="text-center erp-card !p-12 animate-in fade-in zoom-in duration-500">
                    <div className="h-20 w-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6">
                        <CheckCircle2 size={40} />
                    </div>
                    <h2 className="text-2xl font-black text-erp-navy mb-2">Đã xác nhận Nhà cung cấp!</h2>
                    <p className="text-slate-500 mb-8">Phiếu PR sẽ được chuyển sang trạng thái chờ phê duyệt chính thức. Đang quay lại trang chủ...</p>
                </div>
            </div>
        );
    }

    return (
        <main className="pt-16 px-8 pb-12">
            <DashboardHeader breadcrumbs={["Yêu cầu mua sắm", "Phân tích AI", "PR-2026-002"]} />

            <div className="mt-8 flex justify-between items-end mb-8">
                <div>
                    <h1 className="text-3xl font-black text-erp-navy tracking-tight flex items-center gap-3">
                        <Zap className="text-amber-500" size={28} />
                        Báo cáo Khuyến nghị từ AI
                    </h1>
                    <p className="text-sm text-slate-500 mt-1">Hệ thống đã phân tích 3 nhà cung cấp cho hạng mục &quot;Máy may công nghiệp&quot;.</p>
                </div>
                <Link href="/" className="btn-secondary !py-2 text-xs flex items-center gap-2">
                    <ArrowLeft size={16} /> Quay lại
                </Link>
            </div>

            {/* Banner Thông báo */}
            <div className="bg-gradient-to-r from-amber-500 to-orange-500 p-4 rounded-xl shadow-lg shadow-amber-500/20 flex items-center justify-between mb-8 animate-in slide-in-from-top-4">
                <div className="flex items-center gap-3">
                    <div className="bg-white/20 p-2 rounded-lg text-white">
                        <Info size={24} />
                    </div>
                    <div>
                        <div className="text-white font-black uppercase tracking-widest text-[10px] mb-0.5">Yêu cầu xác nhận</div>
                        <div className="text-white font-bold text-sm">AI đã phân tích xong 3 báo giá &mdash; Vui lòng xem xét và xác nhận lựa chọn trước ngày 16/03/2026.</div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                {/* Cột trái (Chiếm 2/3) */}
                <div className="xl:col-span-2 space-y-8">
                    {/* AI Pick - Đề xuất chính */}
                    <div className="relative border-2 border-emerald-500 rounded-2xl p-8 bg-emerald-50/30 overflow-hidden shadow-lg shadow-emerald-500/10">
                        <div className="absolute top-0 right-0 p-8 opacity-5">
                            <Shield size={140} className="text-emerald-500" />
                        </div>
                        <div className="relative z-10 flex flex-col md:flex-row items-start justify-between gap-6">
                            <div>
                                <div className="text-[10px] font-black uppercase text-emerald-600 tracking-widest flex items-center gap-1 mb-2 bg-emerald-100 w-max px-2 py-1 rounded">
                                    <Zap size={12} className="fill-emerald-600" /> Đề xuất tối ưu (AI Pick)
                                </div>
                                <h2 className="text-3xl font-black text-erp-navy mb-1 tracking-tight">Công ty Cơ Khí Nhật Bản (Juki VN)</h2>
                                <div className="flex items-center gap-4 text-emerald-600 text-sm font-bold border-t border-emerald-100 pt-4 mt-4">
                                    <div className="flex items-center gap-1"><CheckCircle2 size={16} /> Giá cạnh tranh</div>
                                    <div className="flex items-center gap-1"><CheckCircle2 size={16} /> Lead Time ngắn (5 ngày)</div>
                                    <div className="flex items-center gap-1"><CheckCircle2 size={16} /> KPI lịch sử cao</div>
                                </div>
                            </div>
                            <div className="flex flex-col items-center justify-center p-6 bg-white border-2 border-emerald-100 rounded-2xl shadow-sm min-w-[140px]">
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Điểm tổng hợp</span>
                                <div className="text-5xl font-black text-emerald-500  tracking-tighter">94<span className="text-2xl text-emerald-300">/100</span></div>
                            </div>
                        </div>
                    </div>

                    {/* Bảng so sánh */}
                    <div className="erp-card !p-0 overflow-hidden">
                        <div className="p-6 border-b border-slate-50 flex items-center gap-2">
                            <h3 className="text-sm font-black uppercase tracking-widest text-erp-navy flex items-center gap-2">
                                <FileText size={16} className="text-erp-blue" /> So sánh chi tiết các nhà cung cấp
                            </h3>
                        </div>
                        <table className="erp-table text-xs">
                            <thead>
                                <tr>
                                    <th>Tên NCC</th>
                                    <th className="text-right">Giá dự kiến (VND)</th>
                                    <th className="text-center">Lead Time</th>
                                    <th className="text-center">Lịch sử KPI</th>
                                    <th className="text-center">Điểm AI</th>
                                    <th className="w-[30%]">Đánh giá AI</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr className="bg-emerald-50/50 relative border-l-4 border-emerald-500">
                                    <td className="font-bold text-erp-navy">
                                        Cơ Khí Nhật Bản (Juki VN)
                                        <span className="block text-[9px] font-black text-emerald-500 uppercase tracking-widest mt-1">Đề xuất</span>
                                    </td>
                                    <td className="text-right  font-black text-erp-blue">210,000,000</td>
                                    <td className="text-center font-bold text-slate-600">5 ngày</td>
                                    <td className="text-center font-black text-emerald-500">92/100</td>
                                    <td className="text-center font-black text-emerald-500 text-lg">94</td>
                                    <td className="text-slate-600 font-medium italic">Tối ưu chi phí và thời gian giao hàng. Lịch sử giao dịch uy tín.</td>
                                </tr>
                                <tr>
                                    <td className="font-bold text-erp-navy">Đại lý Việt Phát</td>
                                    <td className="text-right  font-bold text-slate-500">205,000,000</td>
                                    <td className="text-center font-bold text-slate-600">12 ngày</td>
                                    <td className="text-center font-black text-amber-500">75/100</td>
                                    <td className="text-center font-black text-slate-500 text-lg">82</td>
                                    <td className="text-slate-600 font-medium italic text-[11px]">Giá rẻ nhất nhưng Lead time dài, khả năng trễ tiến độ dự án.</td>
                                </tr>
                                <tr>
                                    <td className="font-bold text-erp-navy">Công ty TNHH Hoàng Gia</td>
                                    <td className="text-right  font-bold text-slate-500">225,000,000</td>
                                    <td className="text-center font-bold text-slate-600">3 ngày</td>
                                    <td className="text-center font-black text-emerald-500">88/100</td>
                                    <td className="text-center font-black text-slate-500 text-lg">80</td>
                                    <td className="text-slate-600 font-medium italic text-[11px]">Giao hàng hỏa tốc nhưng giá quá cao so với ngân sách.</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Cột phải (Chiếm 1/3) */}
                <div className="space-y-8">
                    {/* Phân tích rủi ro */}
                    <div className="erp-card bg-white shadow-xl shadow-erp-navy/5">
                        <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-6 flex items-center gap-2">
                            Cảnh báo Rủi ro & Lưu ý
                        </h3>
                        <div className="space-y-4">
                            <div className="flex items-start gap-3 p-3 bg-amber-50 rounded-lg border border-amber-100">
                                <div className="mt-0.5"><AlertTriangle size={14} className="text-amber-500" /></div>
                                <div>
                                    <div className="text-[10px] font-black uppercase text-amber-600">Lưu ý NCC Việt Phát</div>
                                    <div className="text-xs text-slate-600 font-medium mt-1">Việt Phát có giá thấp hơn thị trường 5% nhưng có tiền sử giao trễ hạng mục máy móc cơ khí. Không khuyến nghị nếu dự án đang gấp.</div>
                                </div>
                            </div>
                            <div className="flex items-start gap-3 p-3 bg-emerald-50 rounded-lg border border-emerald-100">
                                <div className="mt-0.5"><CheckCircle2 size={14} className="text-emerald-500" /></div>
                                <div>
                                    <div className="text-[10px] font-black uppercase text-emerald-600">An toàn nguồn vốn</div>
                                    <div className="text-xs text-slate-600 font-medium mt-1">Cả 3 NCC đều vượt qua bộ đệm rủi ro tín dụng của hệ thống phân tích doanh nghiệp.</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Khu Vực Khẳng Định (Confirm) */}
                    <div className="erp-card bg-slate-50 border-2 border-slate-200">
                        <h3 className="text-xs font-black uppercase tracking-widest text-erp-navy mb-6">Xác nhận đơn vị cung cấp</h3>
                        
                        <div className="space-y-4 mb-6">
                            <label className={`flex items-start gap-3 p-4 border-2 rounded-xl cursor-pointer transition-all ${selection === 'AI' ? 'border-emerald-500 bg-emerald-100/50' : 'border-slate-200 bg-white hover:border-slate-300'}`}>
                                <input type="radio" name="nccSelection" className="mt-1" checked={selection === 'AI'} onChange={() => setSelection('AI')} />
                                <div>
                                    <div className="text-xs font-black text-erp-navy">Đồng ý với Đề xuất AI</div>
                                    <div className="text-[10px] text-slate-500 font-bold mt-0.5">Chọn Cơ Khí Nhật Bản (Juki VN). Quy trình sẽ tiếp tục tự động sang bước duyệt.</div>
                                </div>
                            </label>

                            <label className={`flex items-start gap-3 p-4 border-2 rounded-xl cursor-pointer transition-all ${selection === 'Other' ? 'border-amber-500 bg-amber-50/50' : 'border-slate-200 bg-white hover:border-slate-300'}`}>
                                <input type="radio" name="nccSelection" className="mt-1" checked={selection === 'Other'} onChange={() => setSelection('Other')} />
                                <div className="w-full">
                                    <div className="text-xs font-black text-erp-navy">Chọn Nhà cung cấp khác</div>
                                    <div className="text-[10px] text-slate-500 font-bold mt-0.5 mb-3">Bạn sẽ cần giải trình bắt buộc cho quyết định này.</div>
                                    
                                    {selection === 'Other' && (
                                        <div className="animate-in fade-in slide-in-from-top-2">
                                            <select className="erp-input w-full bg-white mb-2 font-bold text-xs" defaultValue="">
                                                <option value="" disabled>-- Chọn NCC từ danh sách --</option>
                                                <option value="VP">Đại lý Việt Phát (Giá cực rẻ)</option>
                                                <option value="HG">Công ty TNHH Hoàng Gia (Giao SIÊU tốc)</option>
                                            </select>
                                            <textarea 
                                                className="erp-input w-full bg-white text-xs h-20 resize-none" 
                                                placeholder="Lý do ghi đè đề xuất của AI... (Bắt buộc)"
                                                value={overrideReason}
                                                onChange={e => setOverrideReason(e.target.value)}
                                            />
                                        </div>
                                    )}
                                </div>
                            </label>
                        </div>

                        <button 
                            onClick={handleConfirm}
                            disabled={selection === 'Other' && overrideReason.trim().length < 10}
                            className={`w-full py-3 rounded-xl font-black uppercase tracking-widest text-xs flex items-center justify-center gap-2 transition-all ${
                                (selection === 'Other' && overrideReason.trim().length < 10) ? 'bg-slate-300 text-slate-500 cursor-not-allowed shadow-none' : 'bg-erp-navy text-white hover:bg-slate-800 shadow-xl shadow-erp-navy/20'
                            }`}
                        >
                            <Send size={16} /> Xác nhận lựa chọn
                        </button>
                    </div>
                </div>
            </div>
        </main>
    )
}
