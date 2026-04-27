"use client";

import React, { useState, useCallback, useMemo } from "react";
import { 
    Plus, Trash2, Save, Send, ArrowLeft, 
    Package, Hash, Layers, FileText, Calendar 
} from "lucide-react";
import { useProcurement, QuoteRequestItem } from "../../context/ProcurementContext";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function CreateQuoteRequestPage() {
    const { addQuoteRequest, submitQuoteRequest, notify } = useProcurement();
    const router = useRouter();
    
    // Equivalent of reactive state
    const [formData, setFormData] = useState({
        title: "",
        description: "",
        requiredDate: "",
    });
    
    // Equivalent of array manipulation logic
    const [items, setItems] = useState<Partial<QuoteRequestItem>[]>([
        { id: "new-1", productName: "", qty: 1, unit: "Cái" }
    ]);

    const addItem = useCallback(() => {
        setItems(prev => [...prev, { id: `new-${Date.now()}`, productName: "", qty: 1, unit: "Cái" }]);
    }, []);

    const removeItem = useCallback((idx: number) => {
        if (items.length <= 1) return;
        setItems(prev => prev.filter((_, i) => i !== idx));
    }, [items]);

    const updateItem = useCallback((idx: number, field: keyof QuoteRequestItem, value: string | number) => {
        setItems(prev => prev.map((it, i) => i === idx ? { ...it, [field]: value } : it));
    }, []);

    const isValid = useMemo(() => {
        return formData.title && items.every(it => it.productName && it.qty && it.qty > 0);
    }, [formData, items]);

    const handleAction = async (isSubmit: boolean) => {
        if (!isValid) {
            notify("Vui lòng điền đầy đủ tiêu đề và thông tin mặt hàng", "warning");
            return;
        }

        const qr = await addQuoteRequest({
            title: formData.title,
            description: formData.description,
            requiredDate: formData.requiredDate,
            items: items.map(it => ({ ...it, description: "" }))
        });

        if (qr && isSubmit) {
            await submitQuoteRequest(qr.id);
        }

        router.push("/quote-requests");
    };

    return (
        <div className="p-6 max-w-5xl mx-auto space-y-6">
            <header className="flex items-center gap-4">
                <Link href="/quote-requests" className="p-2.5 bg-[#FAF8F5] rounded-xl shadow-sm border border-[rgba(148,163,184,0.1)] hover:bg-[#1A1D23] transition-colors text-[#000000]">
                    <ArrowLeft size={20} />
                </Link>
                <div>
                    <h1 className="text-2xl font-black text-[#000000] tracking-tight">Tạo yêu cầu báo giá mới</h1>
                    <p className="text-sm text-[#000000] font-bold italic">Gửi danh sách yêu cầu tới Thu mua để cập nhật báo giá nhanh nhất</p>
                </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Form Main */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-[#FAF8F5] p-8 rounded-2xl shadow-xl border border-[rgba(148,163,184,0.1)] space-y-8">
                        <div className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="group space-y-2">
                                    <label className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-[#000000] group-focus-within:text-[#B4533A] transition-colors">
                                        <FileText size={14} /> Tiêu đề yêu cầu
                                    </label>
                                    <input 
                                        type="text"
                                        placeholder="Ví dụ: Báo giá linh kiện..."
                                        className="w-full bg-[#FFFFFF] border border-[rgba(148,163,184,0.1)] rounded-xl px-6 py-4 text-sm font-bold text-[#000000] placeholder:text-[#000000] focus:ring-2 focus:ring-[#B4533A] transition-all"
                                        value={formData.title}
                                        onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                                    />
                                </div>
                                <div className="group space-y-2">
                                    <label className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-[#000000] group-focus-within:text-[#B4533A] transition-colors">
                                        <Calendar size={14} /> Ngày cần hàng
                                    </label>
                                    <div className="relative">
                                        <div className="relative group/date">
                                            <input 
                                                type="text"
                                                readOnly
                                                placeholder="Chọn ngày..."
                                                className="w-full bg-[#FFFFFF] border border-[rgba(148,163,184,0.1)] rounded-xl px-6 py-4 text-sm font-bold text-[#000000] placeholder:text-[#000000] group-focus-within/date:ring-2 group-focus-within/date:ring-[#B4533A] transition-all"
                                                value={formData.requiredDate ? (() => {
                                                    const [y, m, d] = formData.requiredDate.split('-');
                                                    return `${d}-${m}-${y}`;
                                                })() : ""}
                                            />
                                            <input 
                                                type="date"
                                                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10"
                                                value={formData.requiredDate}
                                                onChange={(e) => setFormData(prev => ({ ...prev, requiredDate: e.target.value }))}
                                                onClick={(e) => (e.currentTarget as HTMLInputElement & { showPicker?: () => void }).showPicker?.()}
                                            />
                                        </div>
                                        <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none text-[#000000]">
                                            <Calendar size={16} />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="group space-y-2">
                                <label className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-[#000000] group-focus-within:text-[#B4533A] transition-colors">
                                    <FileText size={14} /> Ghi chú/Chi tiết
                                </label>
                                <textarea 
                                    placeholder="Nêu rõ mục đích và các yêu cầu kỹ thuật đặc biệt nếu có..."
                                    className="w-full bg-[#FFFFFF] border border-[rgba(148,163,184,0.1)] rounded-xl px-6 py-4 text-sm font-medium h-32 resize-none placeholder:italic placeholder:font-normal text-[#000000] placeholder:text-[#000000] focus:ring-2 focus:ring-[#B4533A] transition-all"
                                    value={formData.description}
                                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                                />
                            </div>
                        </div>

                        {/* Item List Management */}
                        <div className="space-y-6 pt-6 border-t border-[rgba(148,163,184,0.1)]">
                            <div className="flex justify-between items-center">
                                <h3 className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-[#000000]">
                                    <Package size={16} className="text-[#B4533A]" /> <span className="text-[#000000]">Danh mục mặt hàng cần báo giá</span>
                                </h3>
                                <button 
                                    onClick={addItem}
                                    className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest bg-[#B4533A]/10 text-[#B4533A] px-3 py-1.5 rounded-lg hover:bg-[#B4533A] hover:text-[#000000] transition-all shadow-sm"
                                >
                                    <Plus size={14} /> Thêm dòng
                                </button>
                            </div>

                            <div className="space-y-4">
                                {items.map((item, idx) => (
                                    <div key={idx} className="group relative grid grid-cols-12 gap-x-4 p-5 bg-[#FFFFFF] rounded-2xl border border-[rgba(148,163,184,0.1)] hover:border-[#B4533A]/20 shadow-sm transition-all animate-in fade-in slide-in-from-top-2">
                                        <div className="col-span-12 lg:col-span-6 space-y-1.5">
                                            <label className="text-[10px] font-black uppercase tracking-tighter text-[#000000] ml-1">Tên mặt hàng/Mục đích</label>
                                            <input 
                                                type="text"
                                                placeholder="Nhập tên mặt hàng..."
                                                className="w-full bg-[#FAF8F5] border border-[rgba(148,163,184,0.1)] rounded-lg px-4 py-2 text-xs font-bold text-[#000000] placeholder:text-[#000000] focus:ring-2 focus:ring-[#B4533A]"
                                                value={item.productName}
                                                onChange={(e) => updateItem(idx, "productName", e.target.value)}
                                            />
                                        </div>
                                        <div className="col-span-6 lg:col-span-3 space-y-1.5 text-center px-2">
                                            <label className="text-[10px] font-black uppercase tracking-tighter text-[#000000] flex items-center gap-1 justify-center"><Hash size={10} /> Số lượng</label>
                                            <input 
                                                type="number"
                                                className="w-full bg-[#FAF8F5] border border-[rgba(148,163,184,0.1)] rounded-lg px-4 py-2 text-xs font-bold text-center text-[#000000] focus:ring-2 focus:ring-[#B4533A]"
                                                value={item.qty}
                                                onChange={(e) => updateItem(idx, "qty", parseInt(e.target.value))}
                                            />
                                        </div>
                                        <div className="col-span-6 lg:col-span-2 space-y-1.5 text-center">
                                            <label className="text-[10px] font-black uppercase tracking-tighter text-[#000000] flex items-center gap-1 justify-center"><Layers size={10} /> Đơn vị</label>
                                            <input 
                                                type="text"
                                                className="w-full bg-[#FAF8F5] border border-[rgba(148,163,184,0.1)] rounded-lg px-4 py-2 text-xs font-bold text-center text-[#000000] placeholder:text-[#000000] focus:ring-2 focus:ring-[#B4533A] uppercase"
                                                placeholder="Cái/Bộ..."
                                                value={item.unit}
                                                onChange={(e) => updateItem(idx, "unit", e.target.value)}
                                            />
                                        </div>
                                        <div className="col-span-12 lg:col-span-1 flex items-end justify-center pb-1">
                                            <button 
                                                onClick={() => removeItem(idx)}
                                                className="p-2 text-black hover:text-rose-300 hover:bg-rose-500/10 rounded-lg transition-all"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Info Panel & Actions */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="bg-[#FAF8F5] p-8 rounded-2xl shadow-2xl text-[#000000] space-y-6 border border-[rgba(148,163,184,0.1)]">
                        <div className="border-b border-[rgba(148,163,184,0.1)] pb-4">
                            <h3 className="text-sm font-black uppercase tracking-widest text-[#000000] mb-2 italic underline underline-offset-4 decoration-[#B4533A]">Xác nhận gửi</h3>
                            <p className="text-[11px] text-[#000000] leading-relaxed font-medium">Bản tin báo giá sẽ được chuyển tới bộ phận Thu mua để tiến hành RFQ tới các nhà cung cấp.</p>
                        </div>
                        
                        <div className="space-y-4 pt-2">
                            <button 
                                onClick={() => handleAction(true)}
                                disabled={!isValid}
                                className={`w-full flex items-center justify-center gap-3 bg-[#B4533A] text-[#000000] font-black py-4 rounded-xl shadow-xl transition-all active:scale-95 ${!isValid ? 'opacity-50 cursor-not-allowed' : 'hover:bg-[#A85032]'}`}
                            >
                                <Send size={20} />
                                Gửi đi ngay
                            </button>
                            <button 
                                onClick={() => handleAction(false)}
                                disabled={!isValid}
                                className={`w-full flex items-center justify-center gap-3 bg-[#1A1D23] text-[#000000] font-black py-4 rounded-xl hover:bg-[#FFFFFF] transition-all active:scale-95 border border-[rgba(148,163,184,0.1)] ${!isValid ? 'opacity-30 cursor-not-allowed' : ''}`}
                            >
                                <Save size={20} />
                                Lưu bản nháp
                            </button>
                        </div>
                    </div>

                    <div className="bg-[#FAF8F5] p-6 rounded-2xl border border-dashed border-[rgba(148,163,184,0.1)]">
                        <h4 className="text-[10px] font-black uppercase tracking-widest text-[#000000] mb-4">Mẹo nhỏ</h4>
                        <ul className="space-y-4">
                            {[
                                "Ghi chú rõ yêu cầu kỹ thuật sẽ giúp bạn nhận báo giá chính xác hơn.",
                                "Bạn có thể đính kèm tài liệu chi tiết sau khi lưu bản nháp.",
                                "Thời gian phản hồi trung bình cho báo giá máy chủ là 2-3 ngày làm việc."
                            ].map((tip, i) => (
                                <li key={i} className="flex gap-3 text-xs font-medium text-[#000000] leading-relaxed italic">
                                    <div className="w-1.5 h-1.5 rounded-full bg-[#B4533A] mt-1.5 shrink-0" />
                                    {tip}
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
}

