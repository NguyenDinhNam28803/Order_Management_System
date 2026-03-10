"use client";

import React, { useState } from "react";
import DashboardHeader from "../components/DashboardHeader";
import { Search, ChevronRight, Zap, Target, BarChart4, CheckCircle2, Trophy } from "lucide-react";
import { useProcurement } from "../context/ProcurementContext";
import { useRouter } from "next/navigation";

export default function SourcingPage() {
    const { prs, createPO } = useProcurement();
    const router = useRouter();

    // Take the first approved PR for demo
    const activePR = prs.find(p => p.status === "APPROVED");
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [showResults, setShowResults] = useState(false);
    const [selectedVendor, setSelectedVendor] = useState<string | null>(null);

    const vendors = [
        { id: "v1", name: "Formosa Corp", price: 205000000, quality: 98, delivery: 95, aiScore: 96, reason: "Nhà cung cấp tin cậy, giá ổn định nhất." },
        { id: "v2", name: "Thai Binh Cotton", price: 198000000, quality: 85, delivery: 80, aiScore: 82, reason: "Giá rẻ nhất nhưng rủi ro chất lượng cao." },
        { id: "v3", name: "Global Industrial", price: 215000000, quality: 92, delivery: 99, aiScore: 91, reason: "Phí vận chuyển cao, giao hàng cực nhanh." },
    ];

    const handleStartAnalysis = () => {
        setIsAnalyzing(true);
        setTimeout(() => {
            setIsAnalyzing(false);
            setShowResults(true);
        }, 1500);
    };

    const handleSelectVendor = (vendor: any) => {
        if (!activePR) return;
        createPO(activePR.id, vendor.name, vendor.price);
        setSelectedVendor(vendor.name);
        setTimeout(() => {
            router.push("/po");
        }, 2000);
    };

    if (selectedVendor) {
        return (
            <div className="h-screen flex items-center justify-center bg-slate-50">
                <div className="text-center erp-card !p-12">
                    <div className="h-20 w-20 bg-blue-100 text-erp-blue rounded-full flex items-center justify-center mx-auto mb-6">
                        <CheckCircle2 size={40} />
                    </div>
                    <h2 className="text-2xl font-black text-erp-navy mb-2">Đã chọn nhà cung cấp!</h2>
                    <p className="text-slate-500 mb-8">Hệ thống đang khởi tạo Đơn mua hàng (PO) cho <strong>{selectedVendor}</strong>...</p>
                </div>
            </div>
        );
    }

    return (
        <main className="pt-16 px-8 pb-12">
            <DashboardHeader breadcrumbs={["Menu chính", "Nguồn hàng & Báo giá"]} />

            <div className="mt-8 mb-12 flex justify-between items-end">
                <div>
                    <h1 className="text-3xl font-black text-erp-navy tracking-tight">Tìm nguồn & Báo giá (Sourcing)</h1>
                    <p className="text-sm text-slate-500 mt-1">Sử dụng AI để tối ưu hóa việc chọn lựa nhà cung cấp.</p>
                </div>
                {activePR && (
                    <div className="bg-white border-2 border-dashed border-erp-blue/30 px-6 py-3 rounded-2xl flex items-center gap-4">
                        <div className="text-xs">
                            <span className="block text-[9px] font-black uppercase text-slate-400">Đang xử lý PR</span>
                            <span className="font-black text-erp-navy">{activePR.id} - {activePR.total.toLocaleString()} ₫</span>
                        </div>
                        {!showResults && (
                            <button
                                onClick={handleStartAnalysis}
                                disabled={isAnalyzing}
                                className="bg-erp-blue text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2"
                            >
                                <Zap size={14} className={isAnalyzing ? "animate-spin" : ""} /> {isAnalyzing ? "Đang phân tích..." : "AI So sánh báo giá"}
                            </button>
                        )}
                    </div>
                )}
            </div>

            {!activePR ? (
                <div className="erp-card bg-slate-50 border-dashed py-32 text-center text-slate-400">
                    <Search size={48} className="mx-auto mb-4 opacity-10" />
                    <p className="text-xs font-black uppercase tracking-widest">Không có PR nào đã phê duyệt để khởi tạo RFQ</p>
                    <p className="text-[10px] mt-2 italic font-medium">Hãy tạo và phê duyệt một PR trước tiên.</p>
                </div>
            ) : showResults ? (
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 animate-in fade-in slide-in-from-bottom duration-500">
                    <div className="lg:col-span-3 space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {vendors.sort((a, b) => b.aiScore - a.aiScore).map((v, i) => (
                                <div key={v.id} className={`erp-card relative overflow-hidden flex flex-col ${i === 0 ? 'ring-4 ring-erp-blue/10 border-erp-blue' : ''}`}>
                                    {i === 0 && (
                                        <div className="absolute top-0 right-0 bg-erp-blue text-white px-4 py-1.5 rounded-bl-2xl text-[9px] font-black uppercase flex items-center gap-1">
                                            <Trophy size={10} /> AI Recommendation
                                        </div>
                                    )}
                                    <div className="mb-6">
                                        <div className="h-12 w-12 bg-slate-50 rounded-2xl flex items-center justify-center font-black text-slate-400 mb-4">{v.name.charAt(0)}</div>
                                        <h3 className="text-lg font-black text-erp-navy">{v.name}</h3>
                                        <span className="text-[10px] font-black uppercase text-slate-400 tracking-tighter">Báo giá: <span className="text-erp-navy">{v.price.toLocaleString()} ₫</span></span>
                                    </div>

                                    <div className="space-y-4 mb-8 flex-grow">
                                        <div>
                                            <div className="flex justify-between text-[9px] font-black uppercase text-slate-400 mb-1"><span>Chất lượng</span><span>{v.quality}%</span></div>
                                            <div className="budget-meter"><div className="bg-emerald-400 h-full" style={{ width: `${v.quality}%` }}></div></div>
                                        </div>
                                        <div>
                                            <div className="flex justify-between text-[9px] font-black uppercase text-slate-400 mb-1"><span>Thời gian giao</span><span>{v.delivery}%</span></div>
                                            <div className="budget-meter"><div className="bg-blue-400 h-full" style={{ width: `${v.delivery}%` }}></div></div>
                                        </div>
                                        <div className="pt-4 p-3 bg-indigo-50/50 rounded-xl border border-indigo-50">
                                            <p className="text-[10px] text-indigo-700 leading-relaxed italic font-medium">"{v.reason}"</p>
                                        </div>
                                    </div>

                                    <button
                                        onClick={() => handleSelectVendor(v)}
                                        className={`w-full py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${i === 0 ? 'bg-erp-blue text-white shadow-lg shadow-blue-100' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'}`}
                                    >
                                        Chốt nhà cung cấp
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="space-y-6">
                        <div className="erp-card bg-indigo-600 text-white !border-none">
                            <h3 className="text-sm font-black uppercase tracking-widest text-white/50 mb-6 flex items-center gap-2">
                                <Zap size={18} className="fill-white" /> AI Radar Analysis
                            </h3>
                            <div className="space-y-6">
                                <div className="p-4 bg-white/10 rounded-2xl border border-white/10">
                                    <p className="text-[11px] leading-relaxed font-medium mb-4">"<strong>Formosa Corp</strong> có dữ liệu lịch sử đối soát 3 bên khớp 100%. Đề xuất ưu tiên dù giá cao hơn một chút."</p>
                                    <div className="flex items-center gap-2 text-[10px] font-black uppercase text-emerald-400">
                                        <CheckCircle2 size={14} /> Độ tin cậy: Tuyệt đối
                                    </div>
                                </div>
                                <div className="h-40 bg-white/5 rounded-2xl flex items-center justify-center border border-white/5 relative">
                                    <BarChart4 size={80} className="opacity-10" />
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <div className="text-center font-black text-2xl text-white">96<span className="text-sm opacity-50">.8</span></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="erp-card bg-white border border-slate-100 p-20 text-center animate-in fade-in duration-700">
                    <Target size={48} className="mx-auto mb-6 text-erp-blue/20" />
                    <h2 className="text-xl font-black text-erp-navy mb-2">Đã sẵn sàng phân tích RFQ</h2>
                    <p className="text-slate-500 mb-8">Chúng tôi đã nhận được 3 báo giá từ các nhà cung cấp cho phiếu <strong>{activePR.id}</strong>.</p>
                    <button
                        onClick={handleStartAnalysis}
                        disabled={isAnalyzing}
                        className="btn-primary"
                    >
                        <Zap size={18} className={isAnalyzing ? "animate-spin" : ""} /> {isAnalyzing ? "Đang chấm điểm AI..." : "Bắt đầu AI Analysis"}
                    </button>
                </div>
            )}
        </main>
    );
}
