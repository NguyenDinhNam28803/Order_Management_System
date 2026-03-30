"use client";
// TODO : Sửa lỗi
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { PR, PRItem, useProcurement } from "../../context/ProcurementContext";
import DashboardHeader from "../../components/DashboardHeader";
import { 
    FileText, ShoppingBag, Send, 
    ArrowLeft, Plus, Trash2, 
    Calendar, CheckCircle2, User, 
    Sparkles, Info, Loader2, Search
} from "lucide-react";
import Select from "react-select";

export default function RFQCreatePage() {
    const { prs, apiFetch, refreshData, notify, currentUser, createRFQ, createRFQConsolidated } = useProcurement();
    const router = useRouter();
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [form, setForm] = useState({
        title: "",
        description: "",
        deadline: "",
        vendor: "",
        items: [] as any[]
    });

    // Only approved PRs can be sourced
    const approvedPRs = prs.filter((pr: PR) => pr.status === "APPROVED" || pr.status === "PENDING_QUOTATION");

    // Sample vendors for testing
    const vendors = [
        { value: "Thiên Long Digital", label: "Thiên Long Digital - IT Equipment" },
        { value: "Hòa Phát Furniture", label: "Hòa Phát Furniture - Office" },
        { value: "Sunhouse Group", label: "Sunhouse Group - Appliances" },
        { value: "FPT Information System", label: "FPT Information System - Software/Server" },
        { value: "Thế giới di động", label: "Thế giới di động - Retail/Consumer Electronics" },
        { value: "Hanoi Hardware", label: "Hanoi Hardware - Hardware & Construction" }
    ];

    const addPRItems = (prId: string) => {
        const pr = approvedPRs.find((p: PR) => p.id === prId);
        if (!pr) return;

        // Skip if already added
        if (form.items.some((i: any) => i.prId === prId)) {
            notify("Đã thêm các mặt hàng từ PR này rồi", "info");
            return;
        }

        const newItems = pr.items?.map((item: PRItem) => ({
            ...item,
            prId: pr.id,
            prNumber: pr.prNumber || pr.id.substring(0, 8),
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
            // Simplified API call for demonstration
            const payload = {
                title: form.title || "RFQ Manual Creation",
                description: form.description,
                deadline: form.deadline,
                vendorName: form.vendor,
                itemIds: form.items.map((i: any) => i.id).filter((id: string) => !!id),
                prIds: Array.from(new Set(form.items.map((i: any) => i.prId)))
            };

            const res = await apiFetch("/request-for-quotations", {
                method: "POST",
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                // Consolidated logic: create ONE RFQ with multiple items
                const uniquePrIds: string[] = Array.from(new Set(form.items.map((i: any) => i.prId)));
                
                await createRFQConsolidated({
                    title: form.title,
                    vendor: form.vendor,
                    items: form.items,
                    prIds: uniquePrIds,
                    dueDate: form.deadline
                });
                
                notify("Đã tạo RFQ và gửi yêu cầu báo giá thành công!", "success");
                refreshData();
                setTimeout(() => router.push("/sourcing"), 1500);
            } else {
                notify("Không thể tạo RFQ tự động", "error");
            }
        } catch (err) {
            console.error(err);
            notify("Lỗi hệ thống khi tạo RFQ", "error");
        } finally {
            setIsSubmitting(false);
        }
    };

    const totalEstimate = form.items.reduce((sum: number, item: any) => sum + (item.qty * (item.estimatedPrice || 0)), 0);

    return (
        <main className="pt-16 px-8 pb-12 animate-in fade-in duration-500">
            <DashboardHeader breadcrumbs={["Nghiệp vụ", "Sourcing", "Tạo RFQ thủ công"]} />

            <div className="mt-8 flex justify-between items-end mb-8 border-b border-slate-200 pb-4">
                <div className="flex items-center gap-6">
                    <button 
                        onClick={() => router.back()}
                        className="w-12 h-12 flex items-center justify-center rounded-2xl bg-white border border-slate-200 text-slate-400 hover:text-erp-navy hover:border-erp-navy transition-all shadow-sm"
                    >
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <h1 className="text-3xl font-black text-erp-navy tracking-tight flex items-center gap-3">
                            Khởi tạo Báo giá (RFQ) Thủ công
                        </h1>
                        <p className="text-sm text-slate-500 mt-1">Lựa chọn các mặt hàng từ PR đã duyệt để yêu cầu NCC báo giá.</p>
                    </div>
                </div>
                <div className="flex gap-4">
                    <button onClick={() => router.back()} className="px-6 py-3 font-black text-slate-500 hover:bg-slate-100 rounded-xl text-xs uppercase tracking-widest transition-colors">Hủy bỏ</button>
                    <button 
                        className="btn-primary flex items-center gap-3 shadow-xl shadow-erp-navy/30 py-4 px-8" 
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
                    <div className="erp-card shadow-sm border border-slate-200">
                        <div className="flex justify-between items-center mb-8 border-b border-slate-100 pb-6">
                            <h3 className="text-sm font-black uppercase tracking-widest text-erp-navy flex items-center gap-2">
                                <div className="p-2 bg-amber-50 rounded-xl">
                                    <Send size={18} className="text-amber-600" />
                                </div>
                                Thông tin RFQ & Nhà cung cấp
                            </h3>
                            <div className="px-3 py-1 bg-slate-100 rounded-lg text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                RFQ ID: AUTO-GEN
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="col-span-2 group">
                                <label className="flex items-center gap-2 text-[10px] font-black uppercase text-slate-400 tracking-widest mb-2.5 transition-colors group-focus-within:text-erp-blue">
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
                                <label className="flex items-center gap-2 text-[10px] font-black uppercase text-slate-400 tracking-widest mb-2.5 transition-colors group-focus-within:text-erp-blue">
                                    <User size={12} className="text-slate-300 group-focus-within:text-erp-blue/50" />
                                    Chọn Nhà cung cấp mục tiêu
                                </label>
                                <Select
                                    options={vendors}
                                    onChange={(opt: any) => setForm({...form, vendor: opt?.value})}
                                    placeholder="Chọn nhà cung cấp nhận RFQ..."
                                    className="text-sm"
                                    styles={{
                                        control: (base: any) => ({
                                            ...base,
                                            borderRadius: '1rem',
                                            padding: '8px',
                                            borderColor: '#f1f5f9',
                                            backgroundColor: '#f8fafc'
                                        })
                                    }}
                                />
                            </div>

                            <div className="group">
                                <label className="flex items-center gap-2 text-[10px] font-black uppercase text-slate-400 tracking-widest mb-2.5 transition-colors group-focus-within:text-erp-blue">
                                    <Calendar size={12} className="text-slate-300 group-focus-within:text-erp-blue/50" />
                                    Hạn báo giá (Deadline)
                                </label>
                                <input 
                                    type="date"
                                    className="erp-input font-mono" 
                                    value={form.deadline}
                                    onChange={e => setForm({...form, deadline: e.target.value})}
                                />
                            </div>

                            <div className="col-span-2 group">
                                <label className="flex items-center gap-2 text-[10px] font-black uppercase text-slate-400 tracking-widest mb-2.5 transition-colors group-focus-within:text-erp-blue">
                                    <Info size={12} className="text-slate-300 group-focus-within:text-erp-blue/50" />
                                    Ghi chú bổ sung cho NCC
                                </label>
                                <textarea 
                                    className="erp-input h-24 text-sm" 
                                    value={form.description}
                                    onChange={e => setForm({...form, description: e.target.value})}
                                    placeholder="Yêu cầu cụ thể về kỹ thuật, tiến độ giao hàng hoặc bảo hành..."
                                />
                            </div>
                        </div>
                    </div>

                    <div className="erp-card shadow-sm border border-slate-200">
                        <div className="flex justify-between items-center mb-8 border-b border-slate-100 pb-6">
                            <h3 className="text-sm font-black uppercase tracking-widest text-erp-navy flex items-center gap-2">
                                <div className="p-2 bg-indigo-50 rounded-xl">
                                    <ShoppingBag size={18} className="text-indigo-600" />
                                </div>
                                Danh sách mặt hàng báo giá
                            </h3>
                            <div className="px-3 py-1 bg-slate-100 rounded-lg text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none flex items-center gap-2">
                                <Sparkles size={10} className="text-emerald-500 fill-emerald-500" />
                                AI Optimized
                            </div>
                        </div>

                        <div className="overflow-x-auto -mx-8">
                            <table className="w-full">
                                <thead>
                                    <tr className="bg-slate-50/50">
                                        <th className="px-8 py-5 text-left text-[10px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-100">Sản phẩm</th>
                                        <th className="px-4 py-5 text-left text-[10px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-100">Nguồn gốc</th>
                                        <th className="px-4 py-5 text-center text-[10px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-100 w-24">SL</th>
                                        <th className="px-4 py-5 text-right text-[10px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-100 w-36">Est. Total</th>
                                        <th className="px-8 py-5 text-center text-[10px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-100 w-12"></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {form.items.map((item: any, idx: number) => (
                                        <tr key={idx} className="group hover:bg-erp-blue/5 transition-all">
                                            <td className="px-8 py-5">
                                                <div className="font-black text-erp-navy text-sm leading-tight mb-1">{item.productDesc || item.name}</div>
                                                <div className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">SKU: {item.sku || "N/A"}</div>
                                            </td>
                                            <td className="px-4 py-5">
                                                <div className="text-[10px] font-black text-white bg-erp-blue px-2 py-0.5 rounded-full inline-block uppercase">
                                                    {item.prNumber}
                                                </div>
                                            </td>
                                            <td className="px-4 py-5 text-center font-black text-erp-navy text-sm">{item.qty}</td>
                                            <td className="px-4 py-5 text-right font-black text-erp-blue text-sm">
                                                {(item.qty * (item.estimatedPrice || 0)).toLocaleString()} ₫
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
                                                    <Search size={40} className="text-slate-400" />
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
                    <div className="erp-card shadow-xl border-t-4 border-t-emerald-500">
                        <div className="flex justify-between items-center mb-6 border-b border-slate-100 pb-4">
                            <h3 className="text-xs font-black uppercase tracking-widest text-erp-navy flex items-center gap-2">
                                <CheckCircle2 size={16} className="text-emerald-500" /> PR Sẵn dùng để báo giá
                            </h3>
                            <span className="bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded text-[10px] font-black uppercase">
                                {approvedPRs.length} PRs
                            </span>
                        </div>

                        <div className="space-y-4 overflow-y-auto max-h-[600px] pr-2">
                            {approvedPRs.map((pr: PR) => (
                                <div 
                                    key={pr.id} 
                                    className="p-4 rounded-3xl border border-slate-100 hover:border-emerald-200 hover:bg-emerald-50/20 transition-all group cursor-pointer"
                                    onClick={() => addPRItems(pr.id)}
                                >
                                    <div className="flex justify-between items-start mb-2">
                                        <div className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-100">
                                            {pr.prNumber || pr.id.substring(0,8)}
                                        </div>
                                        <div className="text-[10px] font-black text-slate-400">{pr.createdAt || "No Date"}</div>
                                    </div>
                                    <h4 className="font-black text-erp-navy text-sm mb-1 group-hover:text-emerald-700 transition-colors uppercase tracking-tight">{pr.title}</h4>
                                    <div className="flex justify-between items-end mt-4">
                                        <div className="flex flex-col">
                                            <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Est. Value</span>
                                            <span className="text-xs font-black text-erp-navy">{(pr.totalEstimate || 0).toLocaleString()} ₫</span>
                                        </div>
                                        <div className="w-8 h-8 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-400 group-hover:bg-emerald-500 group-hover:text-white group-hover:border-emerald-500 transition-all shadow-sm">
                                            <Plus size={16} />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="bg-erp-navy rounded-[40px] p-8 text-white relative overflow-hidden shadow-2xl">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16" />
                        <div className="relative z-10">
                            <div className="flex justify-between items-center border-b border-white/10 pb-4 mb-6">
                                <span className="text-[10px] font-black uppercase tracking-widest text-white/50">Tóm tắt RFQ</span>
                                <ShoppingBag size={20} className="text-white/30" />
                            </div>
                            
                            <div className="space-y-4">
                                <div className="flex justify-between text-xs">
                                    <span className="text-white/50 font-medium">Số PR kết hợp</span>
                                    <span className="font-black uppercase tracking-widest">{Array.from(new Set(form.items.map((i: any) => i.prId))).length} PRs</span>
                                </div>
                                <div className="flex justify-between text-xs">
                                    <span className="text-white/50 font-medium">Tổng số dòng hàng</span>
                                    <span className="font-black uppercase tracking-widest">{form.items.length} Lines</span>
                                </div>
                                <div className="pt-6 border-t border-white/10 mt-6 flex flex-col gap-2">
                                    <span className="text-[10px] font-black uppercase tracking-widest text-white/40">Tổng giá trị dự kiến (Est.)</span>
                                    <div className="flex items-baseline gap-2">
                                        <span className="text-4xl font-black">{totalEstimate.toLocaleString()}</span>
                                        <span className="text-xs font-bold text-white/50 tracking-widest uppercase">VND</span>
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
