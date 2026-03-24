"use client";

<<<<<<< HEAD
import React, { useState } from "react";
import DashboardHeader from "../components/DashboardHeader";
import { Plus, FileText, Send, AlertCircle, CheckCircle2, AlertTriangle, ArrowRight, ArrowLeft, Trash2 } from "lucide-react";
import { useProcurement } from "../context/ProcurementContext";
import { useRouter } from "next/navigation";

export default function PRPage() {
    const { addPR, budget, currentUser } = useProcurement();
    const router = useRouter();
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [error, setError] = useState("");
    const [step, setStep] = useState(1);
    const [agreed, setAgreed] = useState(false);

    const [items, setItems] = useState<any[]>([
        { id: "1", description: "Vải Cotton 100% (Trắng)", category: "Nguyên vật liệu", qty: 500, unit: "Cuộn", estimatedPrice: 300000 },
    ]);

    const calculateTotal = () => items.reduce((sum, item) => sum + (item.qty * item.estimatedPrice), 0);
    const total = calculateTotal();

    const [formData, setFormData] = useState({
        title: "",
        department: "Phòng Sản xuất",
        costCenter: "CC-61000",
        priority: "Normal" as "Normal" | "Urgent" | "Critical",
        reason: "",
        deliveryDate: "2026-03-25",
    });

    const addItem = () => {
        const newItem = {
            id: Math.random().toString(36).substr(2, 9),
            description: "",
            category: "Khác",
            qty: 1,
            unit: "Cái",
            estimatedPrice: 0
        };
        setItems([...items, newItem]);
    };

    const removeItem = (id: string) => {
        if (items.length > 1) {
            setItems(items.filter(item => item.id !== id));
        }
    };

    const updateItem = (id: string, field: string, value: any) => {
        setItems(items.map(item => item.id === id ? { ...item, [field]: value } : item));
    };

    const handleSubmit = () => {
        const LIMIT = 10000000;
        
        if (currentUser?.role === "Requester" && total >= LIMIT) {
            setError(`Tài khoản nhân viên chỉ được gửi yêu cầu dưới 10.000.000 ₫.`);
            // Mockup behavior suggests that if it's over limit, it goes to Directors
        }

        // Just use reason as the title if it's there
        addPR({
            department: formData.department,
            costCenter: formData.costCenter,
            priority: formData.priority,
            reason: formData.title || formData.reason,
            total: total,
            items: items
        });
        setIsSubmitted(true);
        setTimeout(() => {
            router.push("/");
        }, 2000);
    };

    const validateStep1 = () => {
        if (!formData.title || !formData.reason) {
            setError("Vui lòng nhập đầy đủ tiêu đề và lý do.");
            return false;
        }
        
        // Require date logic
        setError("");
        return true;
    };

    const validateStep2 = () => {
        if (items.length === 0) {
            setError("Phải có ít nhất 1 mặt hàng.");
            return false;
        }
        for (let item of items) {
            if (!item.description || item.estimatedPrice <= 0 || item.qty <= 0) {
                setError("Vui lòng nhập đầy đủ thông tin mặt hàng hợp lệ.");
                return false;
            }
        }
        setError("");
        return true;
    };

    const handleNext = () => {
        if (step === 1 && !validateStep1()) return;
        if (step === 2 && !validateStep2()) return;
        setStep(prev => Math.min(prev + 1, 3));
    };

    const handlePrev = () => {
        setStep(prev => Math.max(prev - 1, 1));
    };

    if (isSubmitted) {
        return (
            <div className="h-screen flex items-center justify-center bg-slate-50">
                <div className="text-center erp-card !p-12 animate-in fade-in zoom-in duration-500">
                    <div className="h-20 w-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6">
                        <CheckCircle2 size={40} />
                    </div>
                    <h2 className="text-2xl font-black text-erp-navy mb-2">Gửi phê duyệt thành công!</h2>
                    <p className="text-slate-500 mb-8">Phiếu PR đang được xử lý trong quy trình. Đang quay lại trang chủ...</p>
                </div>
            </div>
        );
    }

    return (
        <main className="pt-16 px-8 pb-12">
            <DashboardHeader breadcrumbs={["Sourcing", "Tạo Purchase Requisition"]} />

            <div className="mt-8 flex justify-between items-end mb-8">
                <div>
                    <h1 className="text-3xl font-black text-erp-navy tracking-tight">Tạo phiếu yêu cầu mua sắm</h1>
                    <p className="text-sm text-slate-500 mt-1">Thông tin được gửi sẽ đi qua các cấp phê duyệt tương ứng theo ngân sách.</p>
                </div>
            </div>

            {/* Stepper */}
            <div className="mb-8 p-4 bg-white rounded-xl border border-slate-100 flex items-center justify-between shadow-sm relative">
                <div className="absolute top-1/2 left-0 w-full h-1 bg-slate-100 -translate-y-1/2 z-0"></div>
                
                <div className={`absolute top-1/2 left-0 h-1 bg-erp-blue -translate-y-1/2 z-0 transition-all duration-500`} style={{ width: step === 1 ? '15%' : step === 2 ? '50%' : '85%' }}></div>

                <div className="relative z-10 flex flex-col items-center gap-2 flex-1">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black ${step >= 1 ? 'bg-erp-blue text-white ring-4 ring-blue-50' : 'bg-slate-200 text-slate-500'}`}>1</div>
                    <span className="text-xs font-bold text-erp-navy">Thông tin chung</span>
                </div>
                <div className="relative z-10 flex flex-col items-center gap-2 flex-1">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black transition-all ${step >= 2 ? 'bg-erp-blue text-white ring-4 ring-blue-50' : 'bg-slate-200 text-slate-500'}`}>2</div>
                    <span className="text-xs font-bold text-slate-500">Danh sách hàng</span>
                </div>
                <div className="relative z-10 flex flex-col items-center gap-2 flex-1">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black transition-all ${step >= 3 ? 'bg-erp-blue text-white ring-4 ring-blue-50' : 'bg-slate-200 text-slate-500'}`}>3</div>
                    <span className="text-xs font-bold text-slate-500">Xem lại & Submit</span>
                </div>
            </div>

            {error && (
                <div className="bg-red-50 border border-red-200 p-4 rounded-xl mb-6 flex gap-3 animate-in slide-in-from-top-4">
                    <AlertCircle className="text-red-500" />
                    <p className="text-sm text-red-700 font-bold">{error}</p>
                </div>
            )}

            <div className="bg-white rounded-xl shadow-xl shadow-erp-navy/5 border border-slate-200 overflow-hidden">
                {/* STEP 1 */}
                {step === 1 && (
                    <div className="p-8 animate-in fade-in slide-in-from-right-8 duration-300">
                        <h3 className="text-lg font-black text-erp-navy border-b border-slate-100 pb-4 mb-6">Bước 1: Thông tin chung & Ngân sách</h3>
                        
                        {/* Budget Info */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                            <div className="erp-card bg-slate-50 border-slate-200 !p-4 flex flex-col justify-center">
                                <div className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">Ngân sách Cấp phát</div>
                                <div className="text-lg font-black text-slate-800 font-mono">{budget.allocated.toLocaleString()} ₫</div>
                            </div>
                            <div className="erp-card bg-orange-50 border-orange-200 !p-4 flex flex-col justify-center">
                                <div className="text-[10px] font-black uppercase tracking-widest text-orange-600 mb-1">Đã dùng & Cam kết (PO)</div>
                                <div className="text-lg font-black text-orange-700 font-mono">{(budget.committed + budget.spent).toLocaleString()} ₫</div>
                            </div>
                            <div className="erp-card bg-emerald-50 border-emerald-200 !p-4 flex flex-col justify-center shadow-sm">
                                <div className="text-[10px] font-black uppercase tracking-widest text-emerald-600 mb-1">Ngân sách Khả dụng</div>
                                <div className="text-xl font-black text-emerald-700 font-mono">{Math.max(0, budget.allocated - budget.committed - budget.spent).toLocaleString()} ₫</div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-6">
                            <div className="space-y-6">
                                <div>
                                    <label className="erp-label">Tiêu đề PR <span className="text-red-500">*</span></label>
                                    <input 
                                        type="text" 
                                        className="erp-input w-full" 
                                        placeholder="Vd: Cung cấp vật tư sản xuất tháng 4..."
                                        value={formData.title}
                                        onChange={e => setFormData({...formData, title: e.target.value})}
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="erp-label">Ngày cần hàng</label>
                                        <input 
                                            type="date" 
                                            className="erp-input w-full" 
                                            value={formData.deliveryDate}
                                            onChange={e => setFormData({...formData, deliveryDate: e.target.value})}
                                        />
                                    </div>
                                    <div>
                                        <label className="erp-label">Cost Center</label>
                                        <select className="erp-input w-full bg-slate-50" value={formData.costCenter} disabled>
                                            <option value="CC-61000">CC-61000</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                            <div className="space-y-6">
                                <div>
                                    <label className="erp-label">Độ ưu tiên</label>
                                    <div className="flex gap-4">
                                        <label className={`flex-1 flex flex-col items-center justify-center p-3 border-2 rounded-xl cursor-pointer transition-all ${formData.priority === 'Normal' ? 'border-erp-blue bg-blue-50/50 text-erp-blue' : 'border-slate-100 hover:border-slate-300'}`}>
                                            <input type="radio" name="priority" className="hidden" checked={formData.priority === 'Normal'} onChange={() => setFormData({...formData, priority: 'Normal'})} />
                                            <span className="font-bold text-sm">Thấp / TB</span>
                                        </label>
                                        <label className={`flex-1 flex flex-col items-center justify-center p-3 border-2 rounded-xl cursor-pointer transition-all ${formData.priority === 'Urgent' ? 'border-amber-500 bg-amber-50/50 text-amber-600' : 'border-slate-100 hover:border-slate-300'}`}>
                                            <input type="radio" name="priority" className="hidden" checked={formData.priority === 'Urgent'} onChange={() => setFormData({...formData, priority: 'Urgent'})} />
                                            <span className="font-bold text-sm">Cao</span>
                                        </label>
                                        <label className={`flex-1 flex flex-col items-center justify-center p-3 border-2 rounded-xl cursor-pointer transition-all ${formData.priority === 'Critical' ? 'border-red-500 bg-red-50/50 text-red-600' : 'border-slate-100 hover:border-slate-300'}`}>
                                            <input type="radio" name="priority" className="hidden" checked={formData.priority === 'Critical'} onChange={() => setFormData({...formData, priority: 'Critical'})} />
                                            <span className="font-bold text-sm">Khẩn cấp</span>
                                        </label>
                                    </div>
                                </div>
                                <div>
                                    <label className="erp-label">Lý do mua sắm <span className="text-red-500">*</span></label>
                                    <textarea 
                                        className="erp-input w-full h-24 resize-none leading-relaxed" 
                                        placeholder="Mô tả lý do..."
                                        value={formData.reason}
                                        onChange={e => setFormData({...formData, reason: e.target.value})}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* STEP 2 */}
                {step === 2 && (
                    <div className="p-8 animate-in fade-in slide-in-from-right-8 duration-300">
                        <div className="flex justify-between items-center mb-6 border-b border-slate-100 pb-4">
                            <h3 className="text-lg font-black text-erp-navy">Bước 2: Danh sách hàng hóa</h3>
                            <button onClick={addItem} className="px-4 py-2 bg-erp-navy text-white text-xs font-black uppercase tracking-widest rounded-lg flex items-center gap-2 hover:bg-slate-800 transition-colors shadow-lg shadow-erp-navy/20">
                                <Plus size={16} /> Thêm mặt hàng
                            </button>
                        </div>

                        <div className="overflow-x-auto min-h-[300px]">
                            <table className="erp-table !shadow-none border border-slate-200">
                                <thead>
                                    <tr className="bg-slate-50/80 border-b border-slate-200">
                                        <th className="w-10 text-center font-black">STT</th>
                                        <th className="w-[30%] font-black">Mô tả hàng hóa</th>
                                        <th className="w-[15%] font-black">Danh mục</th>
                                        <th className="w-[10%] text-center font-black">SL</th>
                                        <th className="w-[10%] text-center font-black">ĐVT</th>
                                        <th className="w-[15%] text-right font-black">Đơn giá ước tính</th>
                                        <th className="w-[15%] text-right font-black">Thành tiền</th>
                                        <th className="w-10 text-center">Xóa</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {items.map((item, idx) => {
                                        const lineTotal = item.qty * item.estimatedPrice;
                                        const highValue = lineTotal >= 30000000;
                                        return (
                                            <tr key={item.id} className={`group ${highValue ? 'bg-orange-50/50' : ''} border-b border-slate-100`}>
                                                <td className="text-center font-bold text-slate-400">{idx + 1}</td>
                                                <td>
                                                    <input 
                                                        type="text" 
                                                        className="w-full bg-transparent outline-none font-bold text-erp-navy placeholder:text-slate-300 placeholder:font-normal"
                                                        placeholder="Mô tả hàng..."
                                                        value={item.description}
                                                        onChange={(e) => updateItem(item.id, "description", e.target.value)}
                                                    />
                                                </td>
                                                <td>
                                                    <select 
                                                        className="w-full bg-transparent outline-none text-slate-600 text-sm font-bold appearance-none cursor-pointer"
                                                        value={item.category}
                                                        onChange={(e) => updateItem(item.id, "category", e.target.value)}
                                                    >
                                                        <option>Nguyên vật liệu</option>
                                                        <option>Máy móc</option>
                                                        <option>Văn phòng phẩm</option>
                                                        <option>Dịch vụ</option>
                                                        <option>Khác</option>
                                                    </select>
                                                </td>
                                                <td className="text-center">
                                                    <input 
                                                        type="number" 
                                                        className="w-16 mx-auto bg-transparent outline-none text-center font-black text-erp-blue"
                                                        value={item.qty || ""}
                                                        onChange={(e) => updateItem(item.id, "qty", parseInt(e.target.value) || 0)}
                                                    />
                                                </td>
                                                <td className="text-center">
                                                    <input 
                                                        type="text" 
                                                        className="w-12 mx-auto bg-transparent outline-none text-center text-slate-500 font-bold"
                                                        value={item.unit}
                                                        onChange={(e) => updateItem(item.id, "unit", e.target.value)}
                                                    />
                                                </td>
                                                <td className="text-right">
                                                    <input 
                                                        type="number" 
                                                        className={`w-full bg-transparent outline-none text-right font-mono font-bold ${highValue ? 'text-orange-600' : 'text-slate-600'}`}
                                                        value={item.estimatedPrice || ""}
                                                        onChange={(e) => updateItem(item.id, "estimatedPrice", parseInt(e.target.value) || 0)}
                                                    />
                                                </td>
                                                <td className="text-right flex flex-col items-end pt-3">
                                                    <div className={`font-mono font-black ${highValue ? 'text-orange-600' : 'text-erp-navy'}`}>
                                                        {lineTotal.toLocaleString()}
                                                    </div>
                                                    {highValue && (
                                                        <span className="text-[9px] font-bold text-orange-500 flex items-center gap-1 mt-1 uppercase tracking-tighter bg-orange-100/50 px-1 py-0.5 rounded">
                                                            Sẽ cần Giám đốc phê duyệt
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="text-center">
                                                    <button onClick={() => removeItem(item.id)} className="text-slate-300 hover:text-red-500 transition-colors p-2 hover:bg-red-50 rounded-lg">
                                                        <Trash2 size={16} />
                                                    </button>
                                                </td>
                                            </tr>
                                        )
                                    })}
                                </tbody>
                                <tfoot>
                                    <tr className="bg-slate-50/80 border-t border-slate-200">
                                        <td colSpan={6} className="text-right font-black uppercase tracking-widest text-slate-400 py-4">Tổng cộng ước tính</td>
                                        <td className="text-right py-4 pr-3 flex flex-col items-end relative">
                                            <span className={`font-mono font-black text-xl ${total > Math.max(0, budget.allocated - budget.committed - budget.spent) ? 'text-red-600' : 'text-erp-navy'}`}>
                                                {total.toLocaleString()} ₫
                                            </span>
                                            {total > Math.max(0, budget.allocated - budget.committed - budget.spent) && (
                                                <span className="absolute top-12 right-3 whitespace-nowrap text-[10px] font-bold text-red-500 bg-red-100/80 flex items-center gap-1 border border-red-200 mt-1 uppercase tracking-widest px-2 py-1 rounded shadow-sm z-10 animate-pulse">
                                                    <AlertTriangle size={12} /> Vượt Quá Ngân Sách Khả Dụng!
                                                </span>
                                            )}
                                        </td>
                                        <td></td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>
                    </div>
                )}

                {/* STEP 3 */}
                {step === 3 && (
                    <div className="p-8 animate-in fade-in slide-in-from-right-8 duration-300">
                        <h3 className="text-lg font-black text-erp-navy border-b border-slate-100 pb-4 mb-6">Bước 3: Xem lại & Gửi yêu cầu</h3>
                        
                        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                            <div className="xl:col-span-2 space-y-6">
                                <div className="p-6 bg-slate-50/50 border border-slate-200 rounded-xl space-y-4 shadow-sm">
                                    <h4 className="font-black uppercase tracking-widest text-slate-400 mb-4 text-[10px]">Tóm tắt thông tin chung</h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                                        <div className="flex justify-between items-start border-b border-slate-200 pb-3">
                                            <span className="text-xs font-bold text-slate-500">Tiêu đề:</span>
                                            <span className="text-sm font-black text-erp-navy text-right max-w-[200px]">{formData.title}</span>
                                        </div>
                                        <div className="flex justify-between items-start border-b border-slate-200 pb-3">
                                            <span className="text-xs font-bold text-slate-500">Lý do:</span>
                                            <span className="text-sm font-medium italic text-slate-600 text-right max-w-[250px]">"{formData.reason}"</span>
                                        </div>
                                        <div className="flex justify-between border-b border-slate-200 pb-3">
                                            <span className="text-xs font-bold text-slate-500">Ngày cần:</span>
                                            <span className="text-sm font-bold text-erp-navy">{formData.deliveryDate}</span>
                                        </div>
                                        <div className="flex justify-between border-b border-slate-200 pb-3">
                                            <span className="text-xs font-bold text-slate-500">Cost Center:</span>
                                            <span className="text-sm font-bold text-erp-navy">{formData.costCenter}</span>
                                        </div>
                                    </div>
                                </div>
                                
                                <div>
                                    <h4 className="font-black uppercase tracking-widest text-slate-400 mb-4 text-[10px]">Danh sách hàng ({items.length})</h4>
                                    <div className="max-h-[300px] overflow-y-auto border border-slate-200 rounded-lg custom-scrollbar">
                                        <table className="w-full text-xs text-left cursor-default">
                                            <thead>
                                                <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500">
                                                    <th className="p-3 font-bold uppercase tracking-widest text-[9px]">Mô tả</th>
                                                    <th className="p-3 font-bold text-center uppercase tracking-widest text-[9px] w-20">SL</th>
                                                    <th className="p-3 font-bold text-right uppercase tracking-widest text-[9px] w-32">Thành tiền</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {items.map(item => (
                                                    <tr key={item.id} className="border-b border-slate-100 last:border-none hover:bg-slate-50/50 transition-colors">
                                                        <td className="p-3 font-bold text-erp-navy">{item.description}</td>
                                                        <td className="p-3 text-center text-erp-blue font-black">{item.qty} {item.unit}</td>
                                                        <td className="p-3 text-right font-mono font-black text-slate-600">{(item.qty * item.estimatedPrice).toLocaleString()} ₫</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-6">
                                <div className="erp-card bg-amber-50/50 border-amber-200 !p-6 shadow-sm">
                                    <div className="text-[10px] font-black uppercase tracking-widest text-amber-700 mb-6 flex items-center gap-1">
                                        <AlertTriangle size={14} /> Chuỗi cấp duyệt dự kiến
                                    </div>
                                    <div className="space-y-6">
                                        <div className="flex items-center gap-4">
                                            <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center border border-emerald-200 font-black"><CheckCircle2 size={16} /></div>
                                            <div>
                                                <div className="text-xs font-black text-erp-navy">Trưởng bộ phận</div>
                                                <div className="text-[9px] text-slate-400 mt-0.5">Duyệt cấp cơ sở</div>
                                            </div>
                                        </div>
                                        {(total >= 30000000 || formData.priority === 'Critical') && (
                                            <>
                                                <div className="w-0.5 h-6 bg-amber-200 ml-4 -my-4"></div>
                                                <div className="flex items-center gap-4">
                                                    <div className="w-8 h-8 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center border border-amber-200"><AlertCircle size={16}/></div>
                                                    <div>
                                                        <div className="text-xs font-black text-orange-600">Ban Giám đốc (Director)</div>
                                                        <div className="text-[9px] text-amber-600 font-bold mt-0.5">Yêu cầu vì TM {'>'}= 30tr hoặc Khẩn cấp</div>
                                                    </div>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                    <div className="mt-8 pt-4 border-t border-amber-200/50">
                                        <div className="text-[10px] uppercase font-black text-slate-500 mb-1">Tổng cộng ước tính</div>
                                        <div className="text-3xl font-black text-erp-navy font-mono tracking-tight">{total.toLocaleString()} ₫</div>
                                    </div>
                                </div>

                                <div className="bg-white p-5 border border-slate-200 rounded-xl shadow-sm hover:border-erp-blue/50 transition-colors">
                                    <label className="flex items-start gap-3 cursor-pointer group">
                                        <div className="relative flex items-center justify-center mt-1">
                                            <input type="checkbox" className="peer w-5 h-5 opacity-0 absolute cursor-pointer" checked={agreed} onChange={e => setAgreed(e.target.checked)}/>
                                            <div className="w-5 h-5 rounded border-2 border-slate-300 peer-checked:bg-erp-blue peer-checked:border-erp-blue transition-all flex items-center justify-center shadow-sm">
                                                <CheckCircle2 size={14} className="text-white opacity-0 peer-checked:opacity-100" />
                                            </div>
                                        </div>
                                        <span className="text-xs text-slate-600 font-medium leading-relaxed group-hover:text-slate-900 transition-colors">
                                            Tôi xác nhận các thông tin trên là chính xác (SL, Giá ước tính, Cost center) và hoàn toàn chịu trách nhiệm về nhu cầu xin ngân sách này.
                                        </span>
                                    </label>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
                
                {/* Footer Controls */}
                <div className="bg-slate-50 border-t border-slate-200 p-6 flex justify-between items-center">
                    <button 
                        onClick={handlePrev}
                        className={`px-6 py-2.5 rounded-xl font-black uppercase tracking-widest text-xs flex items-center gap-2 transition-all ${step === 1 ? 'opacity-0 pointer-events-none' : 'text-slate-500 bg-white border border-slate-200 hover:bg-slate-100 hover:text-slate-800 shadow-sm hover:shadow'}`}
                    >
                        <ArrowLeft size={16} /> Quay lại
                    </button>
                    
                    {step < 3 ? (
                        <button 
                            onClick={handleNext}
                            className={`btn-primary !px-8 flex items-center gap-2 transition-all shadow-lg shadow-erp-navy/20`}
                        >
                            Tiếp tục <ArrowRight size={16} />
                        </button>
                    ) : (
                        <button 
                            onClick={handleSubmit}
                            disabled={!agreed}
                            className={`btn-primary !px-8 flex items-center gap-2 transition-all ${!agreed ? 'opacity-50 grayscale cursor-not-allowed shadow-none' : 'shadow-xl shadow-erp-navy/30'}`}
                        >
                            <Send size={16} /> Gửi yêu cầu (Submit PR)
                        </button>
                    )}
                </div>
            </div>
        </main>
=======
import { useProcurement } from "../context/ProcurementContext";
import ERPTable from "../components/shared/ERPTable";
import { Plus } from "lucide-react";
import Link from "next/link";

export default function PRPage() {
    const { prs, approvePR } = useProcurement();

    const columns = [
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        { label: "Mã PR", key: "id", render: (row: any) => <span className="font-bold text-erp-navy">{row.id}</span> },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        { label: "Phòng ban", key: "department", render: (row: any) => row.department?.name || row.department },
        { label: "Lý do", key: "reason" },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        { label: "Trạng thái", key: "status", render: (row: any) => <span className={`status-pill status-${(row.status || 'draft').toLowerCase()}`}>{row.status}</span> },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        { label: "Tổng tiền", key: "total", render: (row: any) => <span className="font-black text-erp-navy">{Number(row.total || 0).toLocaleString()} VND</span> },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        { label: "Hành động", key: "actions", render: (row: any) => row.status === 'PENDING' && (
            <button onClick={() => approvePR(row.id)} className="btn-secondary text-[10px] py-1 px-3">Phê duyệt</button>
        )}
    ];

    return (
        <div className="p-8 space-y-6">
            <header className="flex items-center justify-between">
                <div>
                    <h1 className="text-xl font-black text-erp-navy uppercase tracking-widest">Yêu cầu mua hàng (PR)</h1>
                    <p className="text-xs text-erp-gray font-medium mt-1">Quản lý và theo dõi các yêu cầu mua sắm của phòng ban.</p>
                </div>
                <Link href="/pr/create" className="btn-primary">
                    <Plus size={16} />
                    Tạo PR mới
                </Link>
            </header>
            <ERPTable columns={columns} data={prs} />
        </div>
>>>>>>> 2a33e5440bf544c21f0e020a6d254b6bc39af67e
    );
}
