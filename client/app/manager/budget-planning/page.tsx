"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Plus, Send, Save, X, Calculator, Building, PieChart, Layers, DollarSign, Calendar, Loader2 } from "lucide-react";
import { useProcurement, BudgetAllocationStatus, BudgetPeriod } from "../../context/ProcurementContext";
import { formatVND, parseMoney } from "../../utils/formatUtils";
import { CurrencyCode, CreateBudgetAllocationPayload } from "@/app/types/api-types";

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

            const payload: CreateBudgetAllocationPayload & { categoryId?: string } = {
                budgetPeriodId: formData.budgetPeriodId,
                costCenterId: formData.costCenterId,
                categoryId: formData.categoryId,
                currency: formData.currency as CurrencyCode,
                notes: formData.notes,
                allocatedAmount: amount,
                deptId: currentUser?.deptId,
                orgId: currentUser?.orgId || "",
                status: "DRAFT" as BudgetAllocationStatus,
            };
            if (!payload.categoryId) delete payload.categoryId;
            if (!payload.notes) delete payload.notes;
            if (!payload.deptId) delete payload.deptId;

            const result = await addBudgetAllocation(payload);

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
        <main className="animate-in fade-in duration-500 p-6 min-h-screen bg-[#FFFFFF] text-[#000000]">
            <header className="mt-8 flex justify-between items-end mb-10 border-b border-[rgba(148,163,184,0.1)] pb-8">
                <div>
                    <h1 className="text-3xl font-black text-[#000000] tracking-tight uppercase">LẬP NGÂN SÁCH PHÒNG BAN</h1>
                    <p className="text-sm text-[#000000] mt-1 font-medium italic">CẤU HÌNH PHÂN BỔ NGÂN SÁCH CHI TIẾT</p>
                </div>

                <button
                    onClick={() => setShowModal(true)}
                    className="flex items-center gap-2 bg-[#B4533A] text-[#000000] px-8 py-3.5 rounded-[20px] font-black uppercase tracking-widest text-[11px] shadow-xl shadow-[#B4533A]/20 hover:scale-[1.02] transition-transform active:scale-95"
                >
                    <Plus size={18} /> Thêm Phân Bổ
                </button>
            </header>

            {/* Stats Summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                <div className="bg-[#FAF8F5] p-6 rounded-3xl border border-[rgba(148,163,184,0.1)] shadow-xl shadow-[#B4533A]/5">
                    <p className="text-[10px] font-black uppercase text-[#000000] mb-2">Tổng yêu cầu</p>
                    <p className="text-2xl font-black text-[#000000]">{myAllocations.length} Bản ghi</p>
                </div>
                <div className="bg-[#FAF8F5] p-6 rounded-3xl border border-[rgba(148,163,184,0.1)] shadow-xl shadow-[#B4533A]/5">
                    <p className="text-[10px] font-black uppercase text-[#000000] mb-2">Tổng tiền dự kiến</p>
                    <p className="text-2xl font-black text-black">
                        {formatVND(myAllocations.reduce((s, a) => s + Number(a.allocatedAmount), 0))}
                    </p>
                </div>
                <div className="bg-[#FAF8F5] p-6 rounded-3xl border border-[rgba(148,163,184,0.1)] shadow-xl shadow-[#B4533A]/5">
                    <p className="text-[10px] font-black uppercase text-[#000000] mb-2">Trạng thái phê duyệt</p>
                    <div className="flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full bg-[#B4533A] animate-pulse" />
                        <p className="font-bold text-[#000000] text-sm">Cần xử lý: {myAllocations.filter(a => a.status === 'SUBMITTED').length}</p>
                    </div>
                </div>
            </div>

            {/* Allocation List */}
            <div className="bg-[#FAF8F5] rounded-3xl border border-[rgba(148,163,184,0.1)] overflow-hidden shadow-xl shadow-[#B4533A]/5">
                <table className="erp-table text-xs">
                    <thead>
                        <tr className="bg-[#FFFFFF] border-b border-[rgba(148,163,184,0.1)]">
                            <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-[#000000]">Chu kỳ ngân sách</th>
                            <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-[#000000]">Cost Center</th>
                            <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-[#000000]">Số tiền</th>
                            <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-[#000000] text-center">Trạng thái</th>
                            <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-[#000000] text-center">Ngày tạo</th>
                            <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-[#000000] text-center">Thao tác</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-[rgba(148,163,184,0.1)]">
                        {myAllocations.length > 0 ? myAllocations.map((alloc) => {
                            const period = budgetPeriods.find(p => p.id === alloc.budgetPeriodId);
                            const cc = costCenters.find(c => c.id === alloc.costCenterId);
                            return (
                                <tr key={alloc.id} className="hover:bg-[#FFFFFF]/30 transition-colors cursor-pointer group">
                                    <td className="px-6 py-5">
                                        <div className="flex items-center gap-2">
                                            <Calendar size={14} className="text-[#000000]" />
                                            <span className="font-bold text-[#000000]">
                                                {period ? `${period.periodType} - ${period.fiscalYear}` : "N/A"}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-5">
                                        <div className="flex flex-col">
                                            <span className="font-bold text-[#000000] text-sm">{cc?.name || "N/A"}</span>
                                            <span className="text-[10px] font-black text-[#000000] uppercase">{cc?.code || "N/A"}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-5 font-black text-[#B4533A] text-lg">{formatVND(Number(alloc.allocatedAmount))}</td>
                                    <td className="px-6 py-5 text-center">
                                        <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border transition-all ${
                                            alloc.status === 'APPROVED' ? 'bg-emerald-500/10 text-black border-emerald-500/20' :
                                            alloc.status === 'SUBMITTED' ? 'bg-[#B4533A]/10 text-[#B4533A] border-[#B4533A]/20' :
                                            'bg-[#FAF8F5] text-[#000000] border-[rgba(148,163,184,0.1)]'
                                        }`}>
                                            {alloc.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-5 text-[11px] font-bold text-[#000000] text-center">
                                        {alloc.createdAt ? new Date(alloc.createdAt).toLocaleDateString("vi-VN") : "--"}
                                    </td>
                                    <td className="px-6 py-5 text-center">
                                        <div className="flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            {alloc.status === 'DRAFT' && (
                                                <button 
                                                    onClick={(e) => { e.stopPropagation(); submitAllocation(alloc.id); }}
                                                    className="p-3 bg-[#B4533A] text-[#000000] rounded-xl hover:bg-[#A85032] hover:scale-105 active:scale-95 transition-all text-[10px] font-black uppercase tracking-widest shadow-lg shadow-[#B4533A]/20"
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
                                <td colSpan={6} className="py-20 text-center">
                                    <div className="flex flex-col items-center gap-2 opacity-40">
                                        <PieChart size={48} className="text-[#000000]" />
                                        <p className="font-black text-sm uppercase tracking-widest text-[#000000]">Chưa có bản ghi phân bổ nào</p>
                                    </div>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Create Modal */}
            {showModal && (
                <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-[#FFFFFF]/80 backdrop-blur-md animate-in fade-in duration-300 overflow-y-auto pt-20 pb-20">
                    <div className="bg-[#FAF8F5] rounded-[2.5rem] w-full max-w-3xl p-8 shadow-2xl border border-[rgba(148,163,184,0.1)] relative animate-in zoom-in-95 duration-200">
                        <button onClick={() => setShowModal(false)} className="absolute top-8 right-8 text-[#000000] hover:text-[#000000] transition-colors">
                            <X size={24} />
                        </button>

                        <div className="mb-10">
                            <div className="h-16 w-16 bg-[#B4533A]/10 rounded-[1.5rem] flex items-center justify-center mb-5 border border-[#B4533A]/20 shadow-lg shadow-[#B4533A]/10">
                                <Calculator size={32} className="text-[#B4533A]" />
                            </div>
                            <h2 className="text-3xl font-black text-[#000000] tracking-tight uppercase leading-none mb-2">TẠO NGÂN SÁCH MỚI</h2>
                            <p className="text-[#000000] font-bold uppercase tracking-widest text-[10px]">
                                Phòng ban: {currentUser?.department && typeof currentUser.department !== "string" ? currentUser.department.name : currentUser?.deptId}
                            </p>
                        </div>

                        <form onSubmit={(e) => handleSubmit(e, "SUBMIT")} className="space-y-6">
                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-[#000000] ml-4">Chu kỳ ngân sách</label>
                                    <div className="relative group">
                                        <Calendar size={18} className="absolute left-6 top-1/2 -translate-y-1/2 text-[#000000] group-hover:text-[#B4533A] transition-colors" />
                                        <select
                                            value={formData.budgetPeriodId}
                                            onChange={(e) => setFormData({...formData, budgetPeriodId: e.target.value})}
                                            className="w-full bg-[#FFFFFF] border border-[rgba(148,163,184,0.1)] rounded-[1.5rem] py-4 pl-14 pr-6 text-sm font-bold text-[#000000] outline-none transition-all focus:border-[#B4533A]/30 focus:bg-[#FAF8F5] appearance-none"
                                        >
                                            <option value="">Chọn chu kỳ...</option>
                                            {budgetPeriods.map(p => (
                                                <option key={p.id} value={p.id}>{p.periodType} - FY{p.fiscalYear} (P{p.periodNumber})</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-[#000000] ml-4">Trung tâm chi phí (CC)</label>
                                    <div className="relative group">
                                        <Layers size={18} className="absolute left-6 top-1/2 -translate-y-1/2 text-[#000000] group-hover:text-[#B4533A] transition-colors" />
                                        <select
                                            value={formData.costCenterId}
                                            onChange={(e) => setFormData({...formData, costCenterId: e.target.value})}
                                            className="w-full bg-[#FFFFFF] border border-[rgba(148,163,184,0.1)] rounded-[1.5rem] py-4 pl-14 pr-6 text-sm font-bold text-[#000000] outline-none transition-all focus:border-[#B4533A]/30 focus:bg-[#FAF8F5] appearance-none"
                                        >
                                            <option value="">Chọn Cost Center...</option>
                                            {filteredCostCenters.map(cc => (
                                                <option key={cc.id} value={cc.id}>{cc.name} ({cc.code})</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-[#000000] ml-4">Số tiền phân bổ (VNĐ)</label>
                                    <div className="relative group">
                                        <DollarSign size={18} className="absolute left-6 top-1/2 -translate-y-1/2 text-[#000000] group-hover:text-[#B4533A] transition-colors" />
                                        <input
                                            type="text"
                                            value={formData.allocatedAmount}
                                            onChange={(e) => setFormData({...formData, allocatedAmount: e.target.value.replace(/\D/g, "")})}
                                            onBlur={(e) => setFormData({...formData, allocatedAmount: formatVND(parseMoney(e.target.value)).replace(" ₫", "").trim()})}
                                            className="w-full bg-[#FFFFFF] border border-[rgba(148,163,184,0.1)] rounded-[1.5rem] py-4 pl-14 pr-6 text-2xl font-black text-[#000000] outline-none transition-all focus:border-[#B4533A]/30 focus:bg-[#FAF8F5]"
                                            placeholder="0"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-[#000000] ml-4">Hạng mục ngân sách (Category)</label>
                                    <div className="relative group">
                                        <PieChart size={18} className="absolute left-6 top-1/2 -translate-y-1/2 text-[#000000] group-hover:text-[#B4533A] transition-colors" />
                                        <select
                                            value={formData.categoryId}
                                            onChange={(e) => setFormData({...formData, categoryId: e.target.value})}
                                            className="w-full bg-[#FFFFFF] border border-[rgba(148,163,184,0.1)] rounded-[1.5rem] py-4 pl-14 pr-6 text-sm font-bold text-[#000000] outline-none transition-all focus:border-[#B4533A]/30 focus:bg-[#FAF8F5] appearance-none"
                                        >
                                            <option value="">Ngân sách chung</option>
                                            {categories.map(c => (
                                                <option key={c.id} value={c.id}>{c.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-[#000000] ml-4">Mục đích sử dụng / Ghi chú</label>
                                <textarea
                                    value={formData.notes}
                                    onChange={(e) => setFormData({...formData, notes: e.target.value})}
                                    placeholder="Giải trình chi tiết về nhu cầu ngân sách này..."
                                    className="w-full h-28 bg-[#FFFFFF] border border-[rgba(148,163,184,0.1)] rounded-[1.5rem] p-6 text-sm font-bold text-[#000000] outline-none transition-all focus:border-[#B4533A]/30 focus:bg-[#FAF8F5] resize-none placeholder:text-[#000000]"
                                />
                            </div>

                            <div className="flex gap-4 pt-4">
                                <button
                                    type="button"
                                    onClick={(e) => handleSubmit(e, "DRAFT")}
                                    className="flex-1 py-4 rounded-[20px] border border-[rgba(148,163,184,0.1)] text-[#000000] font-black uppercase tracking-widest text-[11px] hover:bg-[#FAF8F5] transition-all flex items-center justify-center gap-3 active:scale-95"
                                >
                                    <Save size={18} />
                                    Lưu bản nháp
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="flex-[2] py-4 rounded-[20px] bg-[#B4533A] text-[#000000] font-black uppercase tracking-widest text-xs shadow-xl shadow-[#B4533A]/20 hover:scale-[1.02] transition-transform flex items-center justify-center gap-3 active:scale-95 disabled:opacity-50"
                                >
                                    {isSubmitting ? (
                                        <Loader2 size={20} className="animate-spin" />
                                    ) : (
                                        <>
                                            <Send size={18} />
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


