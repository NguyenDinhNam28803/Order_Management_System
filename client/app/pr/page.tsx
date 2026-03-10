"use client";

import React, { useState } from "react";
import DashboardHeader from "../components/DashboardHeader";
import { Plus, FileText, Send, AlertCircle, CheckCircle2 } from "lucide-react";
import { useProcurement } from "../context/ProcurementContext";
import { useRouter } from "next/navigation";

export default function PRPage() {
    const { addPR, budget } = useProcurement();
    const router = useRouter();
    const [isSubmitted, setIsSubmitted] = useState(false);

    const [formData, setFormData] = useState({
        department: "Phòng Sản xuất",
        costCenter: "CC-61000",
        priority: "Normal" as "Normal" | "Urgent" | "Critical",
        reason: "",
        total: 210000000
    });

    const handleSubmit = () => {
        addPR({
            department: formData.department,
            costCenter: formData.costCenter,
            priority: formData.priority,
            reason: formData.reason,
            total: formData.total,
            items: [
                { id: "1", description: "Vải Cotton 100%", qty: 500, unit: "Cuộn", estimatedPrice: 300000 },
                { id: "2", description: "Mực in lụa", qty: 50, unit: "Thùng", estimatedPrice: 1200000 }
            ]
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
                                <button className="text-xs font-black text-erp-blue flex items-center gap-1 hover:bg-blue-50 px-3 py-1.5 rounded-lg transition-all">
                                    <Plus size={14} /> Thêm mặt hàng
                                </button>
                            </div>
                            <table className="erp-table !shadow-none border border-slate-50 rounded-xl overflow-hidden">
                                <thead>
                                    <tr>
                                        <th>Sản phẩm / Dịch vụ</th>
                                        <th className="text-center">Số lượng</th>
                                        <th className="text-right">Đơn giá (VND)</th>
                                        <th className="text-right">Thành tiền</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr>
                                        <td className="font-bold">Vải Cotton 100% (Trắng)</td>
                                        <td className="text-center">500 Cuộn</td>
                                        <td className="text-right">300,000</td>
                                        <td className="text-right font-black">150,000,000</td>
                                    </tr>
                                    <tr>
                                        <td className="font-bold">Mực in lụa (Thùng 20L)</td>
                                        <td className="text-center">50 Thùng</td>
                                        <td className="text-right">1,200,000</td>
                                        <td className="text-right font-black">60,000,000</td>
                                    </tr>
                                </tbody>
                                <tfoot>
                                    <tr className="bg-slate-50/50">
                                        <td colSpan={3} className="text-right font-black uppercase text-[10px] tracking-widest text-slate-400">Tổng cộng ước tính</td>
                                        <td className="text-right font-black text-lg text-erp-navy">210,000,000 ₫</td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>
                    </div>
                </div>

                <div className="space-y-8">
                    {/* --- Budget Guard --- */}
                    <div className="erp-card bg-erp-navy !border-none text-white shadow-2xl shadow-erp-navy/20">
                        <h4 className="text-[10px] font-black uppercase text-white/40 mb-6 tracking-widest">Kiểm soát Ngân sách</h4>
                        <div className="space-y-4">
                            <div className="flex justify-between text-xs font-bold">
                                <span className="text-white/60">Khả dụng (CC-61000):</span>
                                <span>{(budget.allocated - budget.committed - budget.spent).toLocaleString()} ₫</span>
                            </div>
                            <div className="flex justify-between text-xs font-bold">
                                <span className="text-white/60">Giá trị PR dự kiến:</span>
                                <span className="text-erp-orange">- 210,000,000 ₫</span>
                            </div>
                            <div className="pt-4 border-t border-white/10 flex justify-between items-end">
                                <div className="flex flex-col">
                                    <span className="text-[9px] font-black uppercase text-emerald-400/50">Dự kiến còn lại</span>
                                    <span className="text-lg font-black text-emerald-400 font-mono">{(budget.allocated - budget.committed - budget.spent - 210000000).toLocaleString()} ₫</span>
                                </div>
                                <div className="status-pill !bg-emerald-500/20 !text-emerald-400 !border-none !text-[9px]">An toàn</div>
                            </div>
                        </div>
                        <button
                            onClick={handleSubmit}
                            className="w-full mt-10 bg-white text-erp-navy py-4 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-slate-100 transition-all active:scale-95"
                        >
                            <Send size={16} /> Gửi phê duyệt
                        </button>
                    </div>

                    {/* --- Rules --- */}
                    <div className="erp-card bg-amber-50/50 border-amber-100 !p-6">
                        <div className="flex items-center gap-2 text-amber-700 font-black text-[10px] uppercase tracking-widest mb-4">
                            <AlertCircle size={16} /> Quy định phê duyệt (Policy)
                        </div>
                        <p className="text-[11px] text-amber-800/80 leading-relaxed font-medium">
                            Dựa trên giá trị <span className="font-bold underline">210,000,000 ₫</span> (vượt ngưỡng 50 triệu), quy trình PR sẽ tự động yêu cầu:
                            <br /><br />
                            1. <span className="font-black underline">Quản đốc</span> xác nhận nhu cầu.
                            <br />
                            2. <span className="font-black underline">Trưởng phòng Tài chính</span> xác nhận ngân sách.
                            <br />
                            3. <span className="font-black underline">Ban Giám đốc (CEO)</span> ký duyệt cuối.
                        </p>
                    </div>
                </div>
            </div>
        </main>
    );
}
