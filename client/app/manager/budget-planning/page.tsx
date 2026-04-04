"use client";

import React, { useState } from "react";
import { Plus, Send, Save, X, Calculator, Building, PieChart, Layers, DollarSign, Calendar } from "lucide-react";
import { useProcurement } from "../../context/ProcurementContext";
import { formatVND, parseMoney } from "../../utils/formatUtils";

export default function BudgetPlanningPage() {
    const { notify, currentUser } = useProcurement();
    const [showModal, setShowModal] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [allocations, setAllocations] = useState([
        {
            id: "alloc-1",
            periodId: "Q2/2026 - Tháng 4",
            deptName: "Information Technology",
            costCenter: "CAPEX-IT",
            category: "Thiết bị IT",
            amount: 3000000000,
            status: "APPROVED",
            date: "2026-03-25T10:00:00Z"
        }
    ]);

    const [formData, setFormData] = useState({
        budgetPeriodId: "Q2/2026 - Tháng 4",
        deptId: "DEPT-IT",
        costCenterId: "CAPEX-IT",
        categoryId: "IT_HW",
        allocatedAmount: "0",
        currency: "VND",
        notes: ""
    });

    const handleSubmit = async (e: React.FormEvent, status: "SUBMITTED" | "DRAFT") => {
        e.preventDefault();
        setIsSubmitting(true);
        
        // Mocking API delay
        setTimeout(() => {
            const newAlloc = {
                id: `alloc-${Date.now()}`,
                periodId: formData.budgetPeriodId,
                deptName: "Information Technology", // Simplified for mock
                costCenter: formData.costCenterId,
                category: "Linh kiện & Phần mềm", // Simplified for mock
                amount: parseMoney(formData.allocatedAmount),
                status: status,
                date: new Date().toISOString()
            };
            
            setAllocations([newAlloc, ...allocations]);
            setIsSubmitting(false);
            setShowModal(false);
            notify(status === "SUBMITTED" ? "Đã gửi phân bổ ngân sách về phòng Tài chính" : "Đã lưu bản nháp phân bổ", "success");
            
            // Reset form
            setFormData({
                budgetPeriodId: "Q2/2026 - Tháng 4",
                deptId: "DEPT-IT",
                costCenterId: "CAPEX-IT",
                categoryId: "IT_HW",
                allocatedAmount: "0",
                currency: "VND",
                notes: ""
            });
        }, 800);
    };

    return (
        <main className="animate-in fade-in duration-500 pb-20">
            <header className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <h1 className="text-2xl font-black tracking-tight text-erp-navy mb-2 uppercase">LẬP NGÂN SÁCH PHÒNG BAN</h1>
                    <p className="text-slate-500 font-medium italic">Phân bổ ngân sách theo chu kỳ và gửi về Tài chính để phê duyệt</p>
                </div>
                
                <button 
                    onClick={() => setShowModal(true)}
                    className="flex items-center gap-3 bg-erp-navy text-white px-8 py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-xl shadow-erp-navy/30 hover:scale-[1.02] active:scale-[0.98] transition-all"
                >
                    <Plus size={18} />
                    <span>Tạo phân bổ ngân sách mới</span>
                </button>
            </header>

            {/* Allocation List */}
            <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-slate-50/50 border-b border-slate-100">
                            <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Chu kỳ ngân sách</th>
                            <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Phòng ban</th>
                            <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Cost Center</th>
                            <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Hạng mục</th>
                            <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Số tiền</th>
                            <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 text-center">Trạng thái</th>
                            <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 text-center">Ngày gửi</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {allocations.map((alloc) => (
                            <tr key={alloc.id} className="hover:bg-slate-50/30 transition-colors">
                                <td className="px-6 py-5">
                                    <div className="flex items-center gap-2">
                                        <Calendar size={14} className="text-slate-400" />
                                        <span className="font-bold text-erp-navy">{alloc.periodId}</span>
                                    </div>
                                </td>
                                <td className="px-6 py-5 text-sm font-bold text-slate-500">{alloc.deptName}</td>
                                <td className="px-6 py-5">
                                    <span className="bg-slate-100 px-2 py-1 rounded text-[10px] font-black text-slate-600">{alloc.costCenter}</span>
                                </td>
                                <td className="px-6 py-5 text-sm font-bold text-slate-400">{alloc.category}</td>
                                <td className="px-6 py-5 font-black text-erp-navy text-lg">{formatVND(alloc.amount)}</td>
                                <td className="px-6 py-5 text-center">
                                    <span className={`px-2 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter ${
                                        alloc.status === 'APPROVED' ? 'bg-green-50 text-green-600 border border-green-100' :
                                        alloc.status === 'SUBMITTED' ? 'bg-blue-50 text-blue-600 border border-blue-100' :
                                        alloc.status === 'REJECTED' ? 'bg-red-50 text-red-600 border border-red-100' :
                                        'bg-slate-50 text-slate-400 border border-slate-100'
                                    }`}>
                                        {alloc.status}
                                    </span>
                                </td>
                                <td className="px-6 py-5 text-[11px] font-bold text-slate-400 text-center">
                                    {alloc.date ? new Date(alloc.date).toLocaleDateString("vi-VN") : "--"}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Create Modal */}
            {showModal && (
                <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-erp-navy/50 backdrop-blur-sm animate-in fade-in duration-300 overflow-y-auto pt-20 pb-20">
                    <div className="bg-white rounded-[2.5rem] w-full max-w-2xl p-10 shadow-2xl relative animate-in zoom-in-95 duration-200">
                        <button onClick={() => setShowModal(false)} className="absolute top-8 right-8 text-slate-300 hover:text-slate-600 transition-colors">
                            <X size={24} />
                        </button>
                        
                        <div className="mb-10 text-center">
                            <div className="h-16 w-16 bg-erp-blue/10 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-erp-blue/5">
                                <Calculator size={32} className="text-erp-blue" />
                            </div>
                            <h2 className="text-3xl font-black text-erp-navy tracking-tight uppercase">TẠO NGÂN SÁCH PHÒNG BAN</h2>
                            <p className="text-slate-400 font-medium">Hoàn tất các thông tin phân bổ bên dưới</p>
                        </div>

                        <form onSubmit={(e) => handleSubmit(e, "SUBMITTED")} className="space-y-8">
                            <div className="grid grid-cols-2 gap-8">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-4">Chu kỳ ngân sách</label>
                                    <div className="relative group">
                                        <Calendar size={18} className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-hover:text-erp-blue transition-colors" />
                                        <select 
                                            value={formData.budgetPeriodId}
                                            onChange={(e) => setFormData({...formData, budgetPeriodId: e.target.value})}
                                            className="w-full bg-slate-50 border border-slate-100 rounded-3xl py-5 pl-16 pr-6 text-sm font-bold text-erp-navy outline-none transition-all focus:ring-4 focus:ring-erp-blue/10 appearance-none"
                                        >
                                            <option value="Q2/2026 - Tháng 4">Q2/2026 - Tháng 4</option>
                                            <option value="Q2/2026 - Tháng 5">Q2/2026 - Tháng 5</option>
                                            <option value="Q2/2026 - Tháng 6">Q2/2026 - Tháng 6</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-4">Phòng ban (deptId)</label>
                                    <div className="relative group">
                                        <Building size={18} className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-hover:text-erp-blue transition-colors" />
                                        <input 
                                            type="text" 
                                            value="Information Technology" 
                                            readOnly 
                                            className="w-full bg-slate-100 border border-slate-200 rounded-3xl py-5 pl-16 pr-6 text-sm font-bold text-slate-500 outline-none transition-all cursor-not-allowed" 
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-8">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-4">Trung tâm chi phí</label>
                                    <div className="relative group">
                                        <Layers size={18} className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-hover:text-erp-blue transition-colors" />
                                        <select 
                                            value={formData.costCenterId}
                                            onChange={(e) => setFormData({...formData, costCenterId: e.target.value})}
                                            className="w-full bg-slate-50 border border-slate-100 rounded-3xl py-5 pl-16 pr-6 text-sm font-bold text-erp-navy outline-none transition-all focus:ring-4 focus:ring-erp-blue/10 appearance-none"
                                        >
                                            <option value="CAPEX-IT">CAPEX-IT</option>
                                            <option value="OPEX-IT">OPEX-IT</option>
                                            <option value="DEFAULT">DEFAULT</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-4">Hạng mục (categoryId)</label>
                                    <div className="relative group">
                                        <PieChart size={18} className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-hover:text-erp-blue transition-colors" />
                                        <select 
                                            value={formData.categoryId}
                                            onChange={(e) => setFormData({...formData, categoryId: e.target.value})}
                                            className="w-full bg-slate-50 border border-slate-100 rounded-3xl py-5 pl-16 pr-6 text-sm font-bold text-erp-navy outline-none transition-all focus:ring-4 focus:ring-erp-blue/10 appearance-none"
                                        >
                                            <option value="IT_HW">Thiết bị IT</option>
                                            <option value="OFF_ST">Vật tư văn phòng</option>
                                            <option value="SOFT_LIC">Phần mềm & Dịch vụ</option>
                                        </select>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-4">Số tiền phân bổ (VNĐ)</label>
                                <div className="relative group">
                                    <DollarSign size={18} className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-hover:text-erp-blue transition-colors" />
                                    <input 
                                        type="text"
                                        value={formData.allocatedAmount}
                                        onChange={(e) => setFormData({...formData, allocatedAmount: e.target.value.replace(/\D/g, "")})}
                                        onBlur={(e) => setFormData({...formData, allocatedAmount: formatVND(parseMoney(e.target.value)).replace(" ₫", "").trim()})}
                                        className="w-full bg-slate-50 border border-slate-100 rounded-3xl py-5 pl-16 pr-6 text-2xl font-black text-erp-navy outline-none transition-all focus:ring-4 focus:ring-erp-blue/10"
                                    />
                                    <span className="absolute right-6 top-1/2 -translate-y-1/2 font-black text-slate-300 uppercase tracking-widest text-xs">VND</span>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-4">Ghi chú (Tùy chọn)</label>
                                <textarea 
                                    value={formData.notes}
                                    onChange={(e) => setFormData({...formData, notes: e.target.value})}
                                    placeholder="Mô tả mục đích sử dụng ngân sách..."
                                    className="w-full h-24 bg-slate-50 border border-slate-100 rounded-3xl p-6 text-sm font-medium text-erp-navy outline-none transition-all focus:ring-4 focus:ring-erp-blue/10"
                                />
                            </div>

                            <div className="flex gap-4 pt-4">
                                <button 
                                    type="button"
                                    onClick={(e) => handleSubmit(e, "DRAFT")}
                                    className="flex-1 py-5 rounded-3xl border-2 border-slate-100 text-slate-400 font-black uppercase tracking-widest text-[10px] hover:bg-slate-50 transition-all active:scale-95 flex items-center justify-center gap-3"
                                >
                                    <Save size={18} />
                                    Lưu nháp
                                </button>
                                <button 
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="flex-[2] py-5 rounded-3xl bg-erp-navy text-white font-black uppercase tracking-widest text-xs shadow-2xl shadow-erp-navy/30 hover:shadow-erp-navy/40 hover:-translate-y-1 transition-all active:scale-95 flex items-center justify-center gap-3"
                                >
                                    {isSubmitting ? (
                                        <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    ) : (
                                        <>
                                            <Send size={18} />
                                            Gửi về Tài chính
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </main>
    );
}
