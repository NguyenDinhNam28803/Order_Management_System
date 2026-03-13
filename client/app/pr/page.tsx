"use client";

import React, { useState } from "react";
import DashboardHeader from "../components/DashboardHeader";
import { Plus, FileText, Send, AlertCircle, CheckCircle2 } from "lucide-react";
import { useProcurement } from "../context/ProcurementContext";
import { useRouter } from "next/navigation";

export default function PRPage() {
    const { addPR, budget, currentUser } = useProcurement();
    const router = useRouter();
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [error, setError] = useState("");


    const [items, setItems] = useState<any[]>([
        { id: "1", description: "Vải Cotton 100% (Trắng)", qty: 500, unit: "Cuộn", estimatedPrice: 300000 },
        { id: "2", description: "Mực in lụa (Thùng 20L)", qty: 50, unit: "Thùng", estimatedPrice: 1200000 }
    ]);

    const calculateTotal = () => items.reduce((sum, item) => sum + (item.qty * item.estimatedPrice), 0);
    const total = calculateTotal();

    const [formData, setFormData] = useState({
        department: "Phòng Sản xuất",
        costCenter: "CC-61000",
        priority: "Normal" as "Normal" | "Urgent" | "Critical",
        reason: "",
    });

    const addItem = () => {
        const newItem = {
            id: Math.random().toString(36).substr(2, 9),
            description: "",
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
        const LIMIT = 10000000; // 10,000,000 VND
        
        if (currentUser?.role === "Requester" && total >= LIMIT) {
            setError(`Tài khoản nhân viên chỉ được gửi yêu cầu dưới 10.000.000 ₫. Vui lòng liên hệ Trưởng phòng để xử lý các yêu cầu lớn hơn.`);
            return;
        }

        addPR({
            department: formData.department,
            costCenter: formData.costCenter,
            priority: formData.priority,
            reason: formData.reason,
            total: total,
            items: items
        });
        setIsSubmitted(true);
        setTimeout(() => {
            router.push("/");
        }, 2000);
    };

    if (isSubmitted) {
        return (
            <div className="h-screen flex items-center justify-center bg-slate-50">
                <div className="text-center erp-card !p-12 animate-in fade-in zoom-in duration-500">
                    <div className="h-20 w-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6">
                        <CheckCircle2 size={40} />
                    </div>
                    <h2 className="text-2xl font-black text-erp-navy mb-2">Gửi phê duyệt thành công!</h2>
                    <p className="text-slate-500 mb-8">Phiếu PR đang được chuyển tới cấp quản lý. Đang quay lại trang chủ...</p>
                </div>
            </div>
        );
    }

    return (
        <main className="pt-16 px-8 pb-12">
            <DashboardHeader breadcrumbs={["Menu chính", "Yêu cầu mua hàng (PR)"]} />

            <div className="mt-8 flex justify-between items-end mb-8">
                <div>
                    <h1 className="text-3xl font-black text-erp-navy tracking-tight">Yêu cầu Mua sắm (PR)</h1>
                    <p className="text-sm text-slate-500 mt-1">Khởi tạo phiếu yêu cầu vật tư cho dự án mới.</p>
                </div>
                <div className="ai-badge">
                    <AlertCircle size={14} /> AI: Đề xuất Cost Center tự động
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-6">
                    <div className="erp-card">
                        <h3 className="text-sm font-black uppercase tracking-widest text-erp-navy mb-8 flex items-center gap-2">
                            <FileText size={16} /> Chi tiết phiếu yêu cầu
                        </h3>

                        <div className="grid grid-cols-2 gap-8">
                            <div className="space-y-6">
                                <div>
                                    <label className="erp-label">Bộ phận yêu cầu</label>
                                    <select
                                        className="erp-input"
                                        value={formData.department}
                                        onChange={e => setFormData({ ...formData, department: e.target.value })}
                                    >
                                        <option>Phòng Sản xuất</option>
                                        <option>Phòng Kỹ thuật</option>
                                        <option>Phòng Hành chính</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="erp-label">Mã ngân sách (Cost Center)</label>
                                    <input type="text" className="erp-input cursor-not-allowed" value={formData.costCenter} readOnly />
                                </div>
                            </div>
                            <div className="space-y-6">
                                <div>
                                    <label className="erp-label">Mức độ ưu tiên</label>
                                    <select
                                        className="erp-input font-bold"
                                        value={formData.priority}
                                        onChange={e => setFormData({ ...formData, priority: e.target.value as any })}
                                    >
                                        <option value="Normal">Bình thường</option>
                                        <option value="Urgent" className="text-erp-orange">Khẩn cấp (Urgent)</option>
                                        <option value="Critical" className="text-erp-red">Cực kỳ khẩn cấp (Critical)</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="erp-label">Ngày cần hàng dự kiến</label>
                                    <input type="date" className="erp-input" defaultValue="2026-03-25" />
                                </div>
                            </div>
                            <div className="col-span-2">
                                <label className="erp-label">Lý do & Mục đích mua sắm</label>
                                <textarea
                                    className="erp-input h-32 resize-none"
                                    placeholder="Mô tả chi tiết lý tự tại sao cần mua những mặt hàng này..."
                                    value={formData.reason}
                                    onChange={e => setFormData({ ...formData, reason: e.target.value })}
                                ></textarea>
                            </div>
                        </div>

                        <div className="mt-12 pt-8 border-t border-slate-50">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-sm font-black uppercase tracking-widest text-erp-navy">Danh mục vật tư</h3>
                                <button 
                                    onClick={addItem}
                                    className="text-xs font-black text-erp-blue flex items-center gap-1 hover:bg-blue-50 px-3 py-1.5 rounded-lg transition-all"
                                >
                                    <Plus size={14} /> Thêm mặt hàng
                                </button>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="erp-table !shadow-none border border-slate-50 rounded-xl overflow-hidden min-w-[800px]">
                                    <thead>
                                        <tr>
                                            <th className="w-[40%]">Sản phẩm / Dịch vụ</th>
                                            <th className="w-[15%] text-center">Số lượng</th>
                                            <th className="w-[10%] text-center">Đơn vị</th>
                                            <th className="w-[15%] text-right">Đơn giá (VND)</th>
                                            <th className="w-[15%] text-right">Thành tiền</th>
                                            <th className="w-[5%]"></th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {items.map((item) => (
                                            <tr key={item.id} className="group">
                                                <td>
                                                    <input 
                                                        type="text" 
                                                        className="w-full bg-transparent border-none outline-none font-bold text-erp-navy placeholder:text-slate-300"
                                                        placeholder="Nhập tên mặt hàng..."
                                                        value={item.description}
                                                        onChange={(e) => updateItem(item.id, "description", e.target.value)}
                                                    />
                                                </td>
                                                <td className="text-center">
                                                    <input 
                                                        type="number" 
                                                        className="w-16 bg-transparent border-none outline-none text-center font-bold text-erp-blue"
                                                        value={item.qty}
                                                        onChange={(e) => updateItem(item.id, "qty", parseInt(e.target.value) || 0)}
                                                    />
                                                </td>
                                                <td className="text-center">
                                                    <input 
                                                        type="text" 
                                                        className="w-12 bg-transparent border-none outline-none text-center text-slate-500 text-xs font-bold"
                                                        value={item.unit}
                                                        onChange={(e) => updateItem(item.id, "unit", e.target.value)}
                                                    />
                                                </td>
                                                <td className="text-right">
                                                    <input 
                                                        type="number" 
                                                        className="w-24 bg-transparent border-none outline-none text-right font-mono font-bold"
                                                        value={item.estimatedPrice}
                                                        onChange={(e) => updateItem(item.id, "estimatedPrice", parseInt(e.target.value) || 0)}
                                                    />
                                                </td>
                                                <td className="text-right font-black">
                                                    {(item.qty * item.estimatedPrice).toLocaleString()}
                                                </td>
                                                <td className="text-right">
                                                    <button 
                                                        onClick={() => removeItem(item.id)}
                                                        className="text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all p-1"
                                                    >
                                                        <Plus size={16} className="rotate-45" />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                    <tfoot>
                                        <tr className="bg-slate-50/50">
                                            <td colSpan={4} className="text-right font-black uppercase text-[10px] tracking-widest text-slate-400">Tổng cộng ước tính</td>
                                            <td className="text-right font-black text-lg text-erp-navy">{total.toLocaleString()} ₫</td>
                                            <td></td>
                                        </tr>
                                    </tfoot>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="space-y-8">
                    {/* --- Budget Guard --- */}
                    <div className="erp-card bg-white border-2 border-slate-100 shadow-2xl shadow-slate-200/50 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-erp-blue/5 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-700"></div>
                        <h4 className="text-[10px] font-black uppercase text-slate-400 mb-6 tracking-widest relative z-10">Kiểm soát Ngân sách</h4>
                        {error && (
                            <div className="bg-red-50 border border-red-100 p-3 rounded-xl mb-6 animate-in fade-in slide-in-from-top-2">
                                <p className="text-[10px] text-red-600 font-bold leading-tight">{error}</p>
                            </div>
                        )}
                        <div className="space-y-4 relative z-10">
                            <div className="flex justify-between text-xs font-bold text-slate-600">
                                <span>Khả dụng (CC-61000):</span>
                                <span className="font-mono text-erp-navy">{(budget.allocated - budget.committed - budget.spent).toLocaleString()} ₫</span>
                            </div>
                            <div className="flex justify-between text-xs font-bold text-slate-600">
                                <span>Giá trị PR dự kiến:</span>
                                <span className="font-mono text-erp-orange">- {total.toLocaleString()} ₫</span>
                            </div>
                            <div className="pt-6 border-t border-slate-100 flex justify-between items-end">
                                <div className="flex flex-col">
                                    <span className="text-[9px] font-black uppercase text-slate-400 mb-1">Dự kiến còn lại</span>
                                    <span className="text-2xl font-black text-erp-navy font-mono">{(budget.allocated - budget.committed - budget.spent - total).toLocaleString()} ₫</span>
                                </div>
                                <div className={`status-pill ${budget.allocated - budget.committed - budget.spent - total < 0 ? 'status-rejected' : 'status-approved !bg-emerald-50 !text-emerald-600 !border-emerald-200'}`}>
                                    {budget.allocated - budget.committed - budget.spent - total < 0 ? 'Vượt hạn mức' : 'An toàn'}
                                </div>
                            </div>
                        </div>
                        <button
                            onClick={handleSubmit}
                            disabled={currentUser?.role === "Requester" && total >= 10000000}
                            className={`w-full mt-10 btn-primary transition-all ${currentUser?.role === "Requester" && total >= 10000000 ? 'opacity-50 cursor-not-allowed bg-slate-400 shadow-none' : ''}`}
                        >
                            <Send size={16} /> Gửi phê duyệt
                        </button>

                    </div>

                    {/* --- Rules --- */}
                    <div className="erp-card bg-amber-50/50 border-amber-100 !p-6">
                        <div className="flex items-center gap-2 text-amber-700 font-black text-[10px] uppercase tracking-widest mb-4">
                            <AlertCircle size={16} /> Quy định phê duyệt (Policy)
                        </div>
                        <div className="space-y-4">
                            <div className="p-3 bg-white/50 border border-amber-200 rounded-xl text-[11px] text-amber-900 leading-relaxed">
                                <span className="font-black text-erp-navy underline decoration-erp-blue/30 italic">Hạn mức tài khoản:</span>
                                <ul className="mt-2 space-y-1 list-disc list-inside font-bold">
                                    <li>Nhân viên: <span className="text-erp-blue">Dưới 10.000.000 ₫</span></li>
                                    <li>Trưởng phòng: <span className="text-erp-blue">Từ 10.000.000 ₫ trở lên</span></li>
                                </ul>
                            </div>
                            <p className="text-[11px] text-amber-800/80 leading-relaxed font-medium">
                                Dựa trên giá trị <span className="font-bold underline">{total.toLocaleString()} ₫</span>, quy trình PR sẽ được kiểm soát bởi:
                                <br /><br />
                                1. <span className="font-black underline italic">Hệ thống</span> kiểm tra hạn mức vai trò.
                                <br />
                                2. <span className="font-black underline">Tài chính</span> đối soát ngân sách khả dụng.
                                <br />
                                3. <span className="font-black underline">Ban Giám đốc</span> phê duyệt cuối (nếu trên 50tr).
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
}

