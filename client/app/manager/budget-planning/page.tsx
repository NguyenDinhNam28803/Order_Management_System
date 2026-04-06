"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Plus, Send, Save, X, Calculator, Building, PieChart, Layers, DollarSign, Calendar, Loader2 } from "lucide-react";
import { useProcurement, BudgetAllocationStatus, BudgetPeriod } from "../../context/ProcurementContext";
import { formatVND, parseMoney } from "../../utils/formatUtils";

export default function BudgetPlanningPage() {
    const { 
        notify, 
        currentUser, 
        budgetAllocations, 
        budgetPeriods, 
        costCenters, 
        categories,
        addBudgetAllocation, 
        submitAllocation,
        refreshData 
    } = useProcurement();
    
    const [showModal, setShowModal] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Initial state from real context
    const myAllocations = useMemo(() => {
        return budgetAllocations.filter(a => a.deptId === currentUser?.deptId);
    }, [budgetAllocations, currentUser]);

    const [formData, setFormData] = useState({
        budgetPeriodId: "",
        costCenterId: "",
        categoryId: "",
        allocatedAmount: "0",
        currency: "VND",
        notes: ""
    });

    // Filter cost centers based on user department for specific roles
    const filteredCostCenters = useMemo(() => {
        if (!currentUser) return [];
        // Admin and Finance can see all
        if (["PLATFORM_ADMIN", "FINANCE", "DIRECTOR"].includes(currentUser.role)) {
            return costCenters;
        }
        // Departments see only their own
        return costCenters.filter(cc => cc.deptId === currentUser.deptId);
    }, [costCenters, currentUser]);

    // Auto-select current quarter period and first cost center if available
    useEffect(() => {
        if (budgetPeriods.length > 0 && !formData.budgetPeriodId) {
            const currentMonth = new Date().getMonth() + 1;
            const currentQuarter = Math.ceil(currentMonth / 3);
            const currentYear = new Date().getFullYear();
            
            const currentPeriod = budgetPeriods.find(p => 
                p.periodType === 'QUARTERLY' && 
                p.fiscalYear === currentYear && 
                p.periodNumber === currentQuarter
            );
            
            if (currentPeriod) {
                setFormData(prev => ({ ...prev, budgetPeriodId: currentPeriod.id }));
            } else {
                setFormData(prev => ({ ...prev, budgetPeriodId: budgetPeriods[0].id }));
            }
        }
        if (filteredCostCenters.length > 0 && !formData.costCenterId) {
            setFormData(prev => ({ ...prev, costCenterId: filteredCostCenters[0].id }));
        }
    }, [budgetPeriods, filteredCostCenters]);

    const handleSubmit = async (e: React.FormEvent, type: "SUBMIT" | "DRAFT") => {
        e.preventDefault();
        
        if (!formData.budgetPeriodId || !formData.costCenterId) {
            notify("Vui lòng chọn Chu kỳ và Cost Center", "error");
            return;
        }

        setIsSubmitting(true);
        
        try {
            const amount = parseMoney(formData.allocatedAmount);
            if (amount <= 0) {
                notify("Số tiền phải lớn hơn 0", "error");
                setIsSubmitting(false);
                return;
            }

            // --- Bổ sung Logic Kiểm soát ---
            if (formData.categoryId) {
                // Lấy ngân sách tổng (Master Allocation) cho CC & Kỳ hiện tại (không có category)
                const masterAllocation = budgetAllocations.find(a => 
                    a.budgetPeriodId === formData.budgetPeriodId && 
                    a.costCenterId === formData.costCenterId && 
                    !a.category?.id
                );

                if (!masterAllocation) {
                    notify("Cost Center này chưa được cấp ngân sách tổng cho kỳ này từ Finance!", "error");
                    setIsSubmitting(false);
                    return;
                }

                // Tính tổng các khoản đã chia nhỏ (có category)
                const allocatedSum = budgetAllocations
                    .filter(a => 
                        a.budgetPeriodId === formData.budgetPeriodId && 
                        a.costCenterId === formData.costCenterId && 
                        !!a.category?.id
                    )
                    .reduce((sum, a) => sum + Number(a.allocatedAmount), 0);

                const limit = Number(masterAllocation.allocatedAmount);
                const available = limit - allocatedSum;

                if (amount > available) {
                    notify(`Số tiền vượt quá mức quy định! Ngân sách quý còn lại: ${formatVND(available)}`, "error");
                    setIsSubmitting(false);
                    return;
                }
            }

            const payload: any = {
                budgetPeriodId: formData.budgetPeriodId,
                costCenterId: formData.costCenterId,
                categoryId: formData.categoryId,
                currency: formData.currency as any,
                notes: formData.notes,
                allocatedAmount: amount,
                deptId: currentUser?.deptId,
            };
            if (!payload.categoryId) delete payload.categoryId;
            if (!payload.notes) delete payload.notes;
            if (!payload.deptId) delete payload.deptId;

            const result: any = await addBudgetAllocation(payload);

            if (result) {
                if (type === "SUBMIT" && result.id) {
                    await submitAllocation(result.id);
                }
                notify(type === "SUBMIT" ? "Đã gửi phân bổ thành công" : "Đã lưu bản nháp thành công", "success");
                setShowModal(false);
                setFormData({
                    budgetPeriodId: budgetPeriods[0]?.id || "",
                    costCenterId: costCenters[0]?.id || "",
                    categoryId: "",
                    allocatedAmount: "0",
                    currency: "VND",
                    notes: ""
                });
                await refreshData();
            }
        } catch (err) {
            notify("Lỗi khi xử lý yêu cầu", "error");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <main className="animate-in fade-in duration-500 pb-20 p-8">
            <header className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <h1 className="text-2xl font-black tracking-tight text-erp-navy mb-2 uppercase">LẬP NGÂN SÁCH PHÒNG BAN</h1>
                    <p className="text-slate-500 font-medium italic">Phân bổ ngân sách chi tiết và gửi phê duyệt</p>
                </div>
                
                <button 
                    onClick={() => setShowModal(true)}
                    className="flex items-center gap-3 bg-erp-navy text-white px-8 py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-xl shadow-erp-navy/30 hover:scale-[1.02] active:scale-[0.98] transition-all"
                >
                    <Plus size={18} />
                    <span>Tạo phân bổ ngân sách mới</span>
                </button>
            </header>

            {/* Stats Summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
                    <p className="text-[10px] font-black uppercase text-slate-400 mb-2">Tổng yêu cầu</p>
                    <p className="text-2xl font-black text-erp-navy">{myAllocations.length} Bản ghi</p>
                </div>
                <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
                    <p className="text-[10px] font-black uppercase text-slate-400 mb-2">Tổng tiền dự kiến</p>
                    <p className="text-2xl font-black text-emerald-600">
                        {formatVND(myAllocations.reduce((s, a) => s + Number(a.allocatedAmount), 0))}
                    </p>
                </div>
                <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
                    <p className="text-[10px] font-black uppercase text-slate-400 mb-2">Trạng thái phê duyệt</p>
                    <div className="flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full bg-blue-500 animate-pulse" />
                        <p className="font-bold text-slate-600 text-sm">Cần xử lý: {myAllocations.filter(a => a.status === 'SUBMITTED').length}</p>
                    </div>
                </div>
            </div>

            {/* Allocation List */}
            <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-slate-50/50 border-b border-slate-100">
                            <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Chu kỳ ngân sách</th>
                            <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Cost Center</th>
                            <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Số tiền</th>
                            <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 text-center">Trạng thái</th>
                            <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 text-center">Ngày tạo</th>
                            <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 text-center">Thao tác</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {myAllocations.length > 0 ? myAllocations.map((alloc) => {
                            const period = budgetPeriods.find(p => p.id === alloc.budgetPeriodId);
                            const cc = costCenters.find(c => c.id === alloc.costCenterId);
                            return (
                                <tr key={alloc.id} className="hover:bg-slate-50/30 transition-colors cursor-pointer group">
                                    <td className="px-6 py-5">
                                        <div className="flex items-center gap-2">
                                            <Calendar size={14} className="text-slate-400" />
                                            <span className="font-bold text-erp-navy">
                                                {period ? `${period.periodType} - ${period.fiscalYear}` : "N/A"}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-5">
                                        <div className="flex flex-col">
                                            <span className="font-bold text-slate-700 text-sm">{cc?.name || "N/A"}</span>
                                            <span className="text-[10px] font-black text-slate-400 uppercase">{cc?.code || "N/A"}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-5 font-black text-erp-navy text-lg">{formatVND(Number(alloc.allocatedAmount))}</td>
                                    <td className="px-6 py-5 text-center">
                                        <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border transition-all ${
                                            alloc.status === 'APPROVED' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                                            alloc.status === 'SUBMITTED' ? 'bg-blue-50 text-blue-600 border-blue-100' :
                                            'bg-slate-50 text-slate-400 border-slate-100'
                                        }`}>
                                            {alloc.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-5 text-[11px] font-bold text-slate-400 text-center">
                                        {alloc.createdAt ? new Date(alloc.createdAt).toLocaleDateString("vi-VN") : "--"}
                                    </td>
                                    <td className="px-6 py-5 text-center">
                                        <div className="flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            {alloc.status === 'DRAFT' && (
                                                <button 
                                                    onClick={(e) => { e.stopPropagation(); submitAllocation(alloc.id); }}
                                                    className="p-3 bg-erp-navy text-white rounded-xl hover:scale-105 active:scale-95 transition-all text-[10px] font-black uppercase tracking-widest"
                                                >
                                                    GỬI DUYỆT
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            );
                        }) : (
                            <tr>
                                <td colSpan={5} className="py-20 text-center">
                                    <div className="flex flex-col items-center gap-2 opacity-20">
                                        <PieChart size={48} />
                                        <p className="font-black text-sm uppercase tracking-widest">Chưa có bản ghi phân bổ nào</p>
                                    </div>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Create Modal */}
            {showModal && (
                <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-erp-navy/80 backdrop-blur-md animate-in fade-in duration-300 overflow-y-auto pt-20 pb-20">
                    <div className="bg-white rounded-[3rem] w-full max-w-3xl p-12 shadow-2xl relative animate-in zoom-in-95 duration-200">
                        <button onClick={() => setShowModal(false)} className="absolute top-10 right-10 text-slate-300 hover:text-erp-navy transition-colors">
                            <X size={28} />
                        </button>
                        
                        <div className="mb-12">
                            <div className="h-20 w-20 bg-erp-blue/10 rounded-[2rem] flex items-center justify-center mb-6 border-2 border-white shadow-xl shadow-erp-blue/10">
                                <Calculator size={40} className="text-erp-blue" />
                            </div>
                            <h2 className="text-4xl font-black text-erp-navy tracking-tighter uppercase leading-none mb-2">TẠO NGÂN SÁCH MỚI</h2>
                            <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">
                                Phòng ban: {currentUser?.department && typeof currentUser.department !== "string" ? currentUser.department.name : currentUser?.deptId}
                            </p>
                        </div>

                        <form onSubmit={(e) => handleSubmit(e, "SUBMIT")} className="space-y-10">
                            <div className="grid grid-cols-2 gap-10">
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-6">Chu kỳ ngân sách</label>
                                    <div className="relative group">
                                        <Calendar size={20} className="absolute left-8 top-1/2 -translate-y-1/2 text-slate-300 group-hover:text-erp-blue transition-colors" />
                                        <select 
                                            value={formData.budgetPeriodId}
                                            onChange={(e) => setFormData({...formData, budgetPeriodId: e.target.value})}
                                            className="w-full bg-slate-50 border-2 border-slate-50 rounded-[2rem] py-6 pl-20 pr-8 text-sm font-bold text-erp-navy outline-none transition-all focus:border-erp-blue/20 focus:bg-white appearance-none"
                                        >
                                            <option value="">Chọn chu kỳ...</option>
                                            {budgetPeriods.map(p => (
                                                <option key={p.id} value={p.id}>{p.periodType} - FY{p.fiscalYear} (P{p.periodNumber})</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-6">Trung tâm chi phí (CC)</label>
                                    <div className="relative group">
                                        <Layers size={20} className="absolute left-8 top-1/2 -translate-y-1/2 text-slate-300 group-hover:text-erp-blue transition-colors" />
                                        <select 
                                            value={formData.costCenterId}
                                            onChange={(e) => setFormData({...formData, costCenterId: e.target.value})}
                                            className="w-full bg-slate-50 border-2 border-slate-50 rounded-[2rem] py-6 pl-20 pr-8 text-sm font-bold text-erp-navy outline-none transition-all focus:border-erp-blue/20 focus:bg-white appearance-none"
                                        >
                                            <option value="">Chọn Cost Center...</option>
                                            {filteredCostCenters.map(cc => (
                                                <option key={cc.id} value={cc.id}>{cc.name} ({cc.code})</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-10">
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-6">Số tiền phân bổ (VNĐ)</label>
                                    <div className="relative group">
                                        <DollarSign size={20} className="absolute left-8 top-1/2 -translate-y-1/2 text-slate-300 group-hover:text-erp-blue transition-colors" />
                                        <input 
                                            type="text"
                                            value={formData.allocatedAmount}
                                            onChange={(e) => setFormData({...formData, allocatedAmount: e.target.value.replace(/\D/g, "")})}
                                            onBlur={(e) => setFormData({...formData, allocatedAmount: formatVND(parseMoney(e.target.value)).replace(" ₫", "").trim()})}
                                            className="w-full bg-slate-50 border-2 border-slate-50 rounded-[2rem] py-6 pl-20 pr-8 text-3xl font-black text-erp-navy outline-none transition-all focus:border-erp-blue/20 focus:bg-white"
                                            placeholder="0"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-6">Hạng mục ngân sách (Category)</label>
                                    <div className="relative group">
                                        <PieChart size={20} className="absolute left-8 top-1/2 -translate-y-1/2 text-slate-300 group-hover:text-erp-blue transition-colors" />
                                        <select 
                                            value={formData.categoryId}
                                            onChange={(e) => setFormData({...formData, categoryId: e.target.value})}
                                            className="w-full bg-slate-50 border-2 border-slate-50 rounded-[2rem] py-6 pl-20 pr-8 text-sm font-bold text-erp-navy outline-none transition-all focus:border-erp-blue/20 focus:bg-white appearance-none"
                                        >
                                            <option value="">Ngân sách chung</option>
                                            {categories.map(c => (
                                                <option key={c.id} value={c.id}>{c.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-6">Mục đích sử dụng / Ghi chú</label>
                                <textarea 
                                    value={formData.notes}
                                    onChange={(e) => setFormData({...formData, notes: e.target.value})}
                                    placeholder="Giải trình chi tiết về nhu cầu ngân sách này..."
                                    className="w-full h-32 bg-slate-50 border-2 border-slate-50 rounded-[2rem] p-8 text-sm font-bold text-erp-navy outline-none transition-all focus:border-erp-blue/20 focus:bg-white resize-none"
                                />
                            </div>

                            <div className="flex gap-6 pt-6">
                                <button 
                                    type="button"
                                    onClick={(e) => handleSubmit(e, "DRAFT")}
                                    className="flex-1 py-6 rounded-[2rem] border-2 border-slate-100 text-slate-400 font-black uppercase tracking-widest text-[11px] hover:bg-slate-50 transition-all flex items-center justify-center gap-4 active:scale-95"
                                >
                                    <Save size={20} />
                                    Lưu bản nháp
                                </button>
                                <button 
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="flex-[2] py-6 rounded-[2rem] bg-erp-navy text-white font-black uppercase tracking-widest text-xs shadow-2xl shadow-erp-navy/30 hover:-translate-y-1 transition-all flex items-center justify-center gap-4 active:scale-95 disabled:opacity-50"
                                >
                                    {isSubmitting ? (
                                        <Loader2 size={24} className="animate-spin" />
                                    ) : (
                                        <>
                                            <Send size={20} />
                                            Gửi phê duyệt
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

