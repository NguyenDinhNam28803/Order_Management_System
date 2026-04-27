"use client";

import React, { useState, useMemo } from "react";
import { 
  CheckCircle2, 
  XCircle,
  FileText,
  AlertCircle,
  Building,
  DollarSign,
  Calendar,
  LayoutDashboard,
  ShieldCheck,
  Search,
  Check,
  X
} from "lucide-react";
import { useProcurement, BudgetAllocation } from "../../context/ProcurementContext";
import { CostCenter, Department } from "@/app/types/api-types";
import { formatVND } from "../../utils/formatUtils";

export default function FinanceBudgetApprovalPage() {
    const { 
        budgetAllocations, 
        approvals,
        costCenters, 
        departments, 
        budgetPeriods,
        approveAllocation,
        rejectAllocation,
        currentUser
    } = useProcurement();

    const [searchTerm, setSearchTerm] = useState("");
    const [actionType, setActionType] = useState<"APPROVE" | "REJECT" | null>(null);
    const [selectedRequest, setSelectedRequest] = useState<BudgetAllocation | null>(null);
    const [rejectReason, setRejectReason] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Only Finance, Director, CEO should really be using this
    const canApprove = currentUser && ["FINANCE", "DIRECTOR", "CEO"].includes(currentUser.role);

    // Get all SUBMITTED budget allocations
    const submittedBudgets = useMemo(() => {
        return budgetAllocations.filter(alloc => 
            alloc.status === "SUBMITTED" && 
            (alloc.budgetPeriod?.periodNumber || alloc.budgetPeriodId)
        );
    }, [budgetAllocations]);

    // Filter by search term
    const filteredRequests = useMemo(() => {
        if (!searchTerm) return submittedBudgets;
        const lower = searchTerm.toLowerCase();
        return submittedBudgets.filter(req => {
            const cc = costCenters.find(c => c.id === req.costCenterId);
            const dept = departments.find(d => d.id === cc?.deptId);
            return cc?.name.toLowerCase().includes(lower) || 
                   dept?.name.toLowerCase().includes(lower) || 
                   "không có tên danh mục";
        });
    }, [submittedBudgets, costCenters, departments, searchTerm]);

    const handleAction = async () => {
        if (!selectedRequest || !actionType) return;
        
        if (actionType === "REJECT" && !rejectReason.trim()) {
            return;
        }

        setIsSubmitting(true);
        try {
            if (actionType === "APPROVE") {
                await approveAllocation(selectedRequest.id);
            } else {
                await rejectAllocation(selectedRequest.id, rejectReason);
            }
            // Cleanup
            setSelectedRequest(null);
            setActionType(null);
            setRejectReason("");
        } finally {
            setIsSubmitting(false);
        }
    };

    const getPeriodInfo = (periodId: string) => {
        const period = budgetPeriods.find(p => p.id === periodId);
        if (!period) return "Kỳ ngân sách không xác định";
        switch (period.periodType) {
            case "MONTHLY": return `Tháng ${period.periodNumber}/${period.fiscalYear}`;
            case "QUARTERLY": return `Quý ${period.periodNumber}/${period.fiscalYear}`;
            case "ANNUAL": return `Năm ${period.fiscalYear}`;
            default: return `Kỳ ${period.periodNumber}/${period.fiscalYear}`;
        }
    };

    if (!canApprove) {
        return (
            <div className="flex flex-col items-center justify-center p-12 text-[#000000] bg-[#FFFFFF] min-h-screen">
                <AlertCircle size={48} className="mb-4 text-rose-500" />
                <h2 className="text-xl font-bold mb-2 text-[#000000]">Không đủ quyền hạn</h2>
                <p>Chỉ phòng Tài chính và Ban giám đốc mới có thể duyệt ngân sách phân bổ.</p>
            </div>
        );
    }

    return (
        <main className="p-6 md:p-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 min-h-screen bg-[#FFFFFF] text-[#000000]">
            {/* Header */}
            <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2 text-[#B4533A]">
                    <ShieldCheck size={28} className="text-[#B4533A]" />
                    <h1 className="text-2xl md:text-3xl font-black tracking-tight text-[#000000]">
                        Duyệt Ngân Sách
                    </h1>
                </div>
                <p className="text-sm font-medium text-[#000000] max-w-2xl">
                    Xét duyệt yêu cầu phân bổ ngân sách từ các phòng ban. Quyết định duyệt sẽ lập tức mở khóa ngân sách cho việc mua sắm.
                </p>
            </div>

            {/* Dashboard Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-[#FAF8F5] rounded-3xl p-6 border border-[rgba(148,163,184,0.1)] shadow-xl shadow-[#B4533A]/5 flex items-center justify-between">
                    <div>
                        <p className="text-sm font-bold text-[#000000] mb-1">CẦN DUYỆT</p>
                        <h3 className="text-3xl font-black text-black">{submittedBudgets.length}</h3>
                    </div>
                    <div className="w-14 h-14 rounded-2xl bg-amber-500/10 flex items-center justify-center text-black">
                        <AlertCircle size={24} />
                    </div>
                </div>
            </div>

            {/* List Header */}
            <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-[#FAF8F5] p-4 rounded-2xl border border-[rgba(148,163,184,0.1)] shadow-xl shadow-[#B4533A]/5">
                <div className="relative flex-1 max-w-md w-full focus-within:ring-2 ring-[#B4533A]/20 rounded-xl transition-all">
                    <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-[#000000]">
                        <Search size={18} />
                    </div>
                    <input 
                        type="text" 
                        placeholder="Tìm theo phòng ban, trung tâm chi phí, danh mục..." 
                        className="w-full pl-11 pr-4 py-3 bg-[#FFFFFF] border-none rounded-xl text-sm font-medium text-[#000000] placeholder:text-[#000000] focus:ring-0"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {/* List */}
            {filteredRequests.length === 0 ? (
                 <div className="flex flex-col items-center justify-center bg-[#FAF8F5] border border-[rgba(148,163,184,0.1)] rounded-3xl p-16 text-center shadow-xl shadow-[#B4533A]/5">
                    <div className="w-20 h-20 bg-emerald-500/10 text-black rounded-full flex items-center justify-center mb-6">
                        <CheckCircle2 size={40} />
                    </div>
                    <h3 className="text-xl font-black text-[#000000] mb-2">Hoàn tất công việc!</h3>
                    <p className="text-[#000000] font-medium max-w-md">
                        Không còn yêu cầu phân bổ ngân sách nào đang chờ duyệt vào lúc này.
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                    {filteredRequests.map(req => {
                        const cc = costCenters.find(c => c.id === req.costCenterId);
                        const dept = departments.find(d => d.id === cc?.deptId);
                        
                        return (
                            <div key={req.id} className="group bg-[#FAF8F5] rounded-3xl border border-[rgba(148,163,184,0.1)] p-6 shadow-xl shadow-[#B4533A]/5 hover:border-amber-400/20 transition-all duration-300">
                                <div className="flex justify-between items-start mb-6">
                                    <div className="flex gap-4 items-center">
                                        <div className="w-12 h-12 bg-[#B4533A]/10 rounded-2xl flex items-center justify-center text-[#B4533A] border border-[#B4533A]/20">
                                            <FileText size={24} />
                                        </div>
                                        <div>
                                            <h3 className="font-black text-[#000000] text-lg leading-tight">Yêu cầu cấp NS</h3>
                                            <p className="text-xs font-bold text-[#000000] mt-1 uppercase tracking-wider">{req.id || "CHƯA CÓ MÃ"}</p>
                                        </div>
                                    </div>
                                    <span className="px-3 py-1.5 rounded-lg bg-amber-500/10 text-black text-xs font-bold tracking-tight border border-amber-500/20">
                                        CHỜ DUYỆT
                                    </span>
                                </div>
                                
                                <div className="space-y-4 mb-6">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-1.5 text-[#000000] text-xs font-bold">
                                                <Building size={14} /> DEPT
                                            </div>
                                            <p className="font-bold text-[#000000] text-sm truncate">{dept?.name || "N/A"}</p>
                                        </div>
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-1.5 text-[#000000] text-xs font-bold">
                                                <LayoutDashboard size={14} /> COST CENTER
                                            </div>
                                            <p className="font-bold text-[#000000] text-sm truncate">{cc?.name || "N/A"}</p>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4 bg-[#FFFFFF] p-4 rounded-xl border border-[rgba(148,163,184,0.1)]">
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-1.5 text-[#000000] text-xs font-bold">
                                                <Calendar size={14} /> KỲ NGÂN SÁCH
                                            </div>
                                            <p className="font-bold text-[#B4533A] text-sm">{getPeriodInfo(req.budgetPeriodId)}</p>
                                        </div>
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-1.5 text-[#000000] text-xs font-bold">
                                                <DollarSign size={14} /> SỐ TIỀN ĐỀ XUẤT
                                            </div>
                                            <p className="font-black text-black text-lg">{formatVND(req.allocatedAmount)}</p>
                                        </div>
                                    </div>
                                    
                                    <div className="w-full">
                                        <div className="flex items-center gap-1.5 text-[#000000] text-xs font-bold mb-1">
                                            <AlertCircle size={14} /> DANH MỤC / LÝ DO
                                        </div>
                                        <p className="font-medium text-[#000000] text-sm bg-amber-500/10 p-3 rounded-xl border border-amber-500/20">
                                            {req.category ? <span className="font-bold text-black">[{req.category.name}] </span> : ""}
                                            {req.notes || "Không có ghi chú"}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3 pt-6 border-t border-[rgba(148,163,184,0.1)]">
                                    <button
                                        onClick={() => { setSelectedRequest(req); setActionType("APPROVE"); }}
                                        className="flex-1 max-w-40 ml-auto py-2.5 px-4 bg-emerald-500/10 hover:bg-emerald-500 text-black hover:text-[#000000] rounded-xl font-bold text-sm transition-all duration-300 flex items-center justify-center gap-2 group/btn border border-emerald-500/20"
                                    >
                                        <Check size={18} className="group-hover/btn:scale-110 transition-transform" />
                                        DUYỆT
                                    </button>
                                    <button
                                        onClick={() => { setSelectedRequest(req); setActionType("REJECT"); }}
                                        className="py-2.5 px-4 bg-rose-500/10 hover:bg-rose-500 text-black hover:text-[#000000] rounded-xl font-bold text-sm transition-all duration-300 flex items-center justify-center gap-2 group/btn border border-rose-500/20"
                                    >
                                        <X size={18} className="group-hover/btn:scale-110 transition-transform" />
                                        TỪ CHỐI
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Action Modal */}
            {selectedRequest && actionType && (
                <div className="fixed inset-0 z-100 flex items-center justify-center p-4 sm:p-6">
                    <div className="absolute inset-0 bg-[#FFFFFF]/80 backdrop-blur-sm" onClick={() => !isSubmitting && setActionType(null)} />
                    
                    <div className="relative w-full max-w-lg bg-[#FAF8F5] rounded-4xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 border border-[rgba(148,163,184,0.1)]">
                        <div className={`p-8 pb-10 ${actionType === "APPROVE" ? "bg-emerald-500/10" : "bg-rose-500/10"}`}>
                            <div className="w-16 h-16 rounded-2xl bg-[#FAF8F5] shadow-sm flex items-center justify-center mb-6 border border-[rgba(148,163,184,0.1)]">
                                {actionType === "APPROVE" ? (
                                    <CheckCircle2 size={32} className="text-black" />
                                ) : (
                                    <XCircle size={32} className="text-black" />
                                )}
                            </div>
                            
                            <h2 className={`text-2xl font-black tracking-tight mb-2 ${actionType === "APPROVE" ? "text-black" : "text-black"}`}>
                                {actionType === "APPROVE" ? "Xác nhận Duyệt NS?" : "Từ chối phân bổ NS?"}
                            </h2>
                            
                            <p className={`font-medium ${actionType === "APPROVE" ? "text-black/80" : "text-black/80"}`}>
                                Bạn đang thực hiện {actionType === "APPROVE" ? "CẤP" : "TỪ CHỐI"} ngân sách: <br/>
                                <strong className="text-xl inline-block mt-2 text-[#000000]">{formatVND(selectedRequest.allocatedAmount)}</strong>
                            </p>
                        </div>
                        
                        <div className="p-8 pt-6 space-y-6">
                            {actionType === "REJECT" && (
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-[#000000]">Lý do từ chối (Bắt buộc)</label>
                                    <textarea 
                                        className="w-full bg-[#FFFFFF] border border-[rgba(148,163,184,0.1)] focus:border-rose-400/50 focus:ring-0 rounded-2xl p-4 min-h-[100px] text-sm font-medium text-[#000000] placeholder:text-[#000000]"
                                        placeholder="Nhập lý do để Trưởng phòng có thể điều chỉnh lại..."
                                        value={rejectReason}
                                        onChange={e => setRejectReason(e.target.value)}
                                        autoFocus
                                    />
                                </div>
                            )}

                            <div className="flex gap-4">
                                <button 
                                    className="flex-1 py-4 font-bold rounded-2xl text-[#000000] bg-[#FFFFFF] hover:bg-[#FAF8F5] transition-colors"
                                    onClick={() => setActionType(null)}
                                    disabled={isSubmitting}
                                >
                                    Hủy bỏ
                                </button>
                                <button 
                                    onClick={handleAction}
                                    disabled={isSubmitting || (actionType === "REJECT" && !rejectReason.trim())}
                                    className={`flex-2 py-4 font-black rounded-2xl text-[#000000] shadow-lg transition-all ${
                                        actionType === "APPROVE" 
                                            ? "bg-emerald-500 hover:bg-emerald-600 hover:-translate-y-0.5" 
                                            : "bg-rose-500 hover:bg-rose-600 disabled:bg-rose-400 hover:-translate-y-0.5"
                                    }`}
                                >
                                    {isSubmitting ? "ĐANG XỬ LÝ..." : actionType === "APPROVE" ? "XÁC NHẬN DUYỆT" : "XÁC NHẬN TỪ CHỐI"}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </main>
    );
}

