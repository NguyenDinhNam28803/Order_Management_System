"use client";
import React, { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { PR, PRItem, useProcurement } from "../../context/ProcurementContext";
import { 
    FileText, ShoppingBag, Send, 
    ArrowLeft, Plus, Trash2, 
    Calendar, CheckCircle2, User, 
    Sparkles, Info, Loader2, Search
} from "lucide-react";
import Select from "react-select";

export default function RFQCreatePage() {
    const { prs, organizations, refreshData, notify, createRFQConsolidated } = useProcurement();
    const router = useRouter();
    const [isSubmitting, setIsSubmitting] = useState(false);

    interface RFQItem extends PRItem {
        prId: string;
        prNumber: string;
        selected: boolean;
    }

    const [form, setForm] = useState<{
        title: string;
        description: string;
        deadline: string;
        vendor: string;
        items: RFQItem[];
    }>({
        title: "",
        description: "",
        deadline: "",
        vendor: "",
        items: []
    });

    // Only approved PRs can be sourced
    const approvedPRs = prs.filter((pr: PR) => pr.status === "APPROVED" || pr.status === "PENDING_QUOTATION");

    // Real supplier list from context — filter organizations of type SUPPLIER
    const vendorOptions = useMemo(() =>
        organizations
            .filter(o => o.companyType === "SUPPLIER" && o.isActive)
            .map(o => ({ value: o.id, label: `${o.name}${o.industry ? ` — ${o.industry}` : ""}` })),
        [organizations]
    );

    const addPRItems = (prId: string) => {
        const pr = approvedPRs.find((p: PR) => p.id === prId);
        if (!pr) return;

        // Skip if already added
        if (form.items.some((i) => i.prId === prId)) {
            notify("Đã thêm các mặt hàng từ PR này rồi", "info");
            return;
        }

        const newItems = (pr.items || []).map((item: PRItem) => ({
            ...item,
            prId: pr.id,
            prNumber: pr.prNumber || "PR-***",
            selected: true
        })) || [];

        setForm(prev => ({
            ...prev,
            title: prev.title || `RFQ Báo giá cho ${pr.title}`,
            items: [...prev.items, ...newItems]
        }));
        notify(`Đã thêm ${newItems.length} mặt hàng từ ${pr.prNumber || pr.id.substring(0,8)}`, "success");
    };

    const handleRemoveItem = (idx: number) => {
        const newItems = [...form.items];
        newItems.splice(idx, 1);
        setForm({ ...form, items: newItems });
    };

    const handleSubmit = async () => {
        if (!form.vendor || form.items.length === 0 || !form.deadline) {
            notify("Vui lòng nhập đầy đủ Nhà cung cấp, Hạn báo giá và ít nhất 1 mặt hàng.", "error");
            return;
        }

        setIsSubmitting(true);
        try {
            const uniquePrIds: string[] = Array.from(new Set(form.items.map((i) => i.prId)));

            const success = await createRFQConsolidated({
                title: form.title || "RFQ Manual Creation",
                prIds: uniquePrIds,
                deadline: form.deadline,
                supplierIds: [form.vendor], // form.vendor is now a real Organization UUID
            });

            if (success) {
                refreshData();
                setTimeout(() => router.push("/sourcing"), 1500);
            }
        } catch (err) {
            notify("Lỗi hệ thống khi tạo RFQ", "error");
        } finally {
            setIsSubmitting(false);
        }
    };

    const totalEstimate = form.items.reduce((sum: number, item) => sum + (Number(item.qty || 0) * (item.estimatedPrice || 0)), 0);

    return (
        <main className="animate-in fade-in duration-500 p-6 min-h-screen bg-[#FFFFFF] text-slate-900">
            <div className="mt-8 flex justify-between items-end mb-8 border-b border-slate-200 pb-4">
                <div className="flex items-center gap-6">
                    <button 
                        onClick={() => router.back()}
                        className="w-12 h-12 flex items-center justify-center rounded-xl bg-[#F1F5F9] border border-slate-200 text-slate-900 hover:text-[#2563EB] hover:border-[#2563EB]/30 transition-all shadow-sm"
                    >
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3 uppercase">
                            Khởi tạo Báo giá (RFQ) Thủ công
                        </h1>
                        <p className="text-sm text-slate-900 mt-1 font-bold">Lựa chọn các mặt hàng từ PR đã duyệt để yêu cầu NCC báo giá.</p>
                    </div>
                </div>
                <div className="flex gap-4">
                    <button onClick={() => router.back()} className="px-6 py-3 font-black text-slate-900 hover:text-slate-900 hover:bg-slate-100 rounded-xl text-xs uppercase tracking-widest transition-colors">Hủy bỏ</button>
                    <button 
                        className="flex items-center gap-3 bg-[#2563EB] text-white py-4 px-8 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-[#2563EB]/30 hover:scale-105 active:scale-95 transition-all" 
                        onClick={handleSubmit} 
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? <Loader2 className="animate-spin" size={18} /> : <Send size={18} />}
                        {isSubmitting ? "Đang gửi..." : "Gửi RFQ tới Nhà cung cấp"}
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* RFQ Configuration */}
                <div className="lg:col-span-2 space-y-8">
                    <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-sm p-6 !p-8 border border-slate-200 bg-[#F1F5F9]">
                        <div className="flex justify-between items-center mb-8 border-b border-slate-200 pb-6">
                            <h3 className="text-sm font-black uppercase tracking-widest text-slate-900 flex items-center gap-2">
                                <div className="p-2 bg-amber-500/10 rounded-xl">
                                    <Send size={18} className="text-amber-500" />
                                </div>
                                Thông tin RFQ & Nhà cung cấp
                            </h3>
                            <div className="px-3 py-1 bg-[#FFFFFF] rounded-lg text-[10px] font-black text-slate-900 uppercase tracking-widest border border-slate-200">
                                RFQ ID: AUTO-GEN
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="col-span-2 group">
                                <label className="flex items-center gap-2 text-[10px] font-black uppercase text-black tracking-widest mb-2.5 transition-colors group-focus-within:text-erp-blue">
                                    <FileText size={12} className="text-slate-300 group-focus-within:text-erp-blue/50" />
                                    Tên gói báo giá
                                </label>
                                <input 
                                    className="erp-input transition-all" 
                                    value={form.title}
                                    onChange={e => setForm({...form, title: e.target.value})} 
                                    placeholder="VD: Gói báo giá máy chủ Dell & Thiết bị hạ tầng IT..." 
                                />
                            </div>

                            <div className="group">
                                <label className="flex items-center gap-2 text-[10px] font-black uppercase text-slate-900 tracking-widest mb-2.5 transition-colors group-focus-within:text-[#2563EB]">
                                    <User size={12} className="text-slate-900/50 group-focus-within:text-[#2563EB]/50" />
                                    Chọn Nhà cung cấp mục tiêu
                                </label>
                                <Select
                                    options={vendorOptions}
                                    onChange={(opt) => setForm({...form, vendor: opt?.value || ""})}
                                    placeholder="Chọn nhà cung cấp nhận RFQ..."
                                    className="text-sm font-bold"
                                    styles={{
                                        control: (base) => ({
                                            ...base,
                                            borderRadius: '1rem',
                                            padding: '8px',
                                            borderColor: 'rgba(148,163,184,0.1)',
                                            backgroundColor: '#FFFFFF',
                                            color: '#000000'
                                        }),
                                        menu: (base) => ({
                                            ...base,
                                            backgroundColor: '#F1F5F9',
                                            borderColor: 'rgba(148,163,184,0.1)',
                                            borderRadius: '1rem',
                                            overflow: 'hidden'
                                        }),
                                        option: (base, state) => ({
                                            ...base,
                                            backgroundColor: state.isFocused ? '#0F172A' : 'transparent',
                                            color: state.isFocused ? '#2563EB' : '#000000',
                                            cursor: 'pointer',
                                            fontSize: '12px',
                                            fontWeight: '800',
                                            textTransform: 'uppercase'
                                        }),
                                        singleValue: (base) => ({
                                            ...base,
                                            color: '#000000'
                                        })
                                    }}
                                />
                            </div>

                            <div className="group">
                                <label className="flex items-center gap-2 text-[10px] font-black uppercase text-black tracking-widest mb-2.5 transition-colors group-focus-within:text-erp-blue">
                                    <Calendar size={12} className="text-slate-300 group-focus-within:text-erp-blue/50" />
                                    Hạn báo giá (Deadline)
                                </label>
                                <div className="relative group/date">
                                    <input 
                                        type="text"
                                        readOnly
                                        placeholder="Chọn ngày..."
                                        className="erp-input w-full  font-bold h-12 !rounded-xl group-focus-within/date:ring-2 group-focus-within/date:ring-erp-blue transition-all"
                                        value={form.deadline ? (() => {
                                            const [y, m, d] = form.deadline.split('-');
                                            return `${d}-${m}-${y}`;
                                        })() : ""}
                                    />
                                    <input 
                                        type="date"
                                        className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10"
                                        value={form.deadline}
                                        onChange={e => setForm({...form, deadline: e.target.value})}
                                        onClick={(e) => (e.currentTarget as HTMLInputElement & { showPicker?: () => void }).showPicker?.()}
                                    />
                                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-300">
                                        <Calendar size={16} />
                                    </div>
                                </div>
                            </div>

                            <div className="col-span-2 group">
                                <label className="flex items-center gap-2 text-[10px] font-black uppercase text-slate-900 tracking-widest mb-2.5 transition-colors group-focus-within:text-[#2563EB]">
                                    <Info size={12} className="text-slate-900/50 group-focus-within:text-[#2563EB]/50" />
                                    Ghi chú bổ sung cho NCC
                                </label>
                                <textarea 
                                    className="erp-input h-24 text-sm font-bold" 
                                    value={form.description}
                                    onChange={e => setForm({...form, description: e.target.value})}
                                    placeholder="Yêu cầu cụ thể về kỹ thuật, tiến độ giao hàng hoặc bảo hành..."
                                />
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-sm p-6 !p-8 border border-slate-200 bg-[#F1F5F9]">
                        <div className="flex justify-between items-center mb-8 border-b border-slate-200 pb-6">
                            <h3 className="text-sm font-black uppercase tracking-widest text-slate-900 flex items-center gap-2">
                                <div className="p-2 bg-indigo-500/10 rounded-xl">
                                    <ShoppingBag size={18} className="text-black" />
                                </div>
                                Danh sách mặt hàng báo giá
                            </h3>
                            <div className="px-3 py-1 bg-[#FFFFFF] rounded-lg text-[10px] font-black text-slate-900 uppercase tracking-widest leading-none flex items-center gap-2 border border-slate-200">
                                <Sparkles size={10} className="text-emerald-500 fill-emerald-500" />
                                AI Optimized
                            </div>
                        </div>

                        <div className="overflow-x-auto -mx-8">
                            <table className="erp-table text-xs">
                                <thead>
                                    <tr>
                                        <th className="px-8 py-5 text-left border-b border-slate-200">Sản phẩm</th>
                                        <th className="px-4 py-5 text-left border-b border-slate-200">Nguồn gốc</th>
                                        <th className="px-4 py-5 text-center border-b border-slate-200 w-24">SL</th>
                                        <th className="px-4 py-5 text-right border-b border-slate-200 w-36">Est. Total</th>
                                        <th className="px-8 py-5 text-center border-b border-slate-200 w-12"></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {form.items.map((item, idx: number) => (
                                        <tr key={idx} className="group hover:bg-[#FFFFFF]/50 transition-all">
                                            <td className="px-8 py-5">
                                                <div className="font-black text-slate-900 text-sm leading-tight mb-1 uppercase tracking-tight">{item.description || item.productName}</div>
                                                <div className="text-[10px] text-slate-900 font-bold uppercase tracking-tighter">SKU: {item.sku || "N/A"}</div>
                                            </td>
                                            <td className="px-4 py-5">
                                                <div className="text-[10px] font-black text-white bg-[#2563EB] px-2 py-0.5 rounded-full inline-block uppercase tracking-widest">
                                                    SP
                                                </div>
                                            </td>
                                            <td className="px-4 py-5 text-center font-black text-slate-900 text-sm">{item.qty || 0}</td>
                                            <td className="px-4 py-5 text-right font-black text-[#2563EB] text-sm">
                                                {((Number(item.qty) || 0) * (item.estimatedPrice || 0)).toLocaleString()} ₫
                                            </td>
                                            <td className="px-8 py-5 text-center">
                                                <button 
                                                    onClick={() => handleRemoveItem(idx)}
                                                    className="w-8 h-8 flex items-center justify-center text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                    {form.items.length === 0 && (
                                        <tr>
                                            <td colSpan={5} className="py-20 text-center">
                                                <div className="flex flex-col items-center gap-4 opacity-30">
                                                    <Search size={40} className="text-black" />
                                                    <span className="text-xs font-black uppercase tracking-widest">Chưa có mặt hàng nào được chọn</span>
                                                    <p className="text-[10px] max-w-[200px] leading-relaxed">Chọn PR từ danh sách bên phải để lấy dữ liệu mặt hàng</p>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                {/* Approved PRs List */}
                <div className="space-y-6">
                    <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-sm p-6 !p-8 shadow-xl border-t-4 border-t-emerald-500 bg-[#F1F5F9]">
                        <div className="flex justify-between items-center mb-6 border-b border-slate-200 pb-4">
                            <h3 className="text-xs font-bold uppercase tracking-widest text-[#64748B] flex items-center gap-2">
                                <CheckCircle2 size={16} className="text-emerald-500" /> PR Sẵn dùng để báo giá
                            </h3>
                            <span className="bg-emerald-500/10 text-emerald-700 border border-emerald-500/20 px-2 py-0.5 rounded text-[10px] font-black uppercase">
                                {approvedPRs.length} PRs
                            </span>
                        </div>

                        <div className="space-y-4 overflow-y-auto max-h-[600px] pr-2 custom-scrollbar">
                            {approvedPRs.map((pr: PR) => (
                                <div 
                                    key={pr.id} 
                                    className="p-4 rounded-xl border border-slate-200 hover:border-emerald-500/30 hover:bg-emerald-500/5 transition-all group cursor-pointer bg-[#FFFFFF]/30"
                                    onClick={() => addPRItems(pr.id)}
                                >
                                    <div className="flex justify-between items-start mb-2">
                                        <div className="text-[10px] font-black text-black bg-emerald-500/10 px-2 py-0.5 rounded-lg border border-emerald-500/20 uppercase tracking-widest">
                                            Yêu cầu
                                        </div>
                                        <div className="text-[10px] font-black text-slate-900 uppercase">{pr.createdAt ? new Date(pr.createdAt).toLocaleDateString() : "No Date"}</div>
                                    </div>
                                    <h4 className="font-black text-slate-900 text-sm mb-1 group-hover:text-black transition-colors uppercase tracking-tight">{pr.title}</h4>
                                    <div className="flex justify-between items-end mt-4">
                                        <div className="flex flex-col">
                                            <span className="text-[8px] font-black text-slate-900 uppercase tracking-widest mb-0.5">Est. Value</span>
                                            <span className="text-xs font-black text-[#2563EB]">{(pr.totalEstimate || 0).toLocaleString()} ₫</span>
                                        </div>
                                        <div className="w-8 h-8 rounded-full bg-[#F1F5F9] border border-slate-200 flex items-center justify-center text-white group-hover:bg-emerald-500 group-hover:text-white group-hover:border-emerald-500 transition-all shadow-sm">
                                            <Plus size={16} />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="bg-white border border-[#E2E8F0] rounded-xl p-6 text-slate-900 relative overflow-hidden shadow-sm group hover:border-[#2563EB]/30 transition-all duration-500">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-[#2563EB]/5 rounded-full -mr-32 -mt-32 blur-3xl transition-all group-hover:bg-[#2563EB]/10" />
                        <div className="relative z-10">
                            <div className="flex justify-between items-center border-b border-slate-200 pb-6 mb-8">
                                <div className="flex flex-col gap-1">
                                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-900">Tóm tắt RFQ</span>
                                    <span className="text-xs font-bold text-slate-900">Manual Generation Center</span>
                                </div>
                                <div className="p-3 bg-[#2563EB]/10 rounded-xl text-[#2563EB] border border-[#2563EB]/20">
                                    <ShoppingBag size={20} />
                                </div>
                            </div>
                            
                            <div className="space-y-6">
                                <div className="flex justify-between items-center bg-[#FFFFFF]/50 p-4 rounded-xl border border-slate-200">
                                    <span className="text-slate-900 font-bold text-xs">Số PR kết hợp</span>
                                    <span className="font-black uppercase tracking-widest text-slate-900 bg-[#F1F5F9] px-3 py-1 rounded-lg border border-slate-200">{Array.from(new Set(form.items.map((i) => i.prId))).length} PRs</span>
                                </div>
                                <div className="flex justify-between items-center bg-[#FFFFFF]/50 p-4 rounded-xl border border-slate-200">
                                    <span className="text-slate-900 font-bold text-xs">Tổng số dòng hàng</span>
                                    <span className="font-black uppercase tracking-widest text-slate-900 bg-[#F1F5F9] px-3 py-1 rounded-lg border border-slate-200">{form.items.length} Lines</span>
                                </div>
                                <div className="pt-8 border-t border-slate-200 mt-8">
                                    <div className="flex items-center gap-2 mb-3">
                                        <div className="w-1.5 h-1.5 rounded-full bg-[#2563EB] shadow-lg shadow-[#2563EB]/50 animate-pulse" />
                                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-900">Tổng giá trị dự kiến (Est.)</span>
                                    </div>
                                    <div className="flex items-baseline gap-3">
                                        <span className="text-5xl font-black subpixel-antialiased tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-[#000000] to-[#000000]">{totalEstimate.toLocaleString()}</span>
                                        <span className="text-sm font-black text-[#2563EB] tracking-[0.2em]">VNĐ</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
}

