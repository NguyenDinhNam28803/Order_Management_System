"use client";

import React, { useState, useEffect } from "react";
import { 
    CheckSquare, XCircle, CheckCircle2, Eye, FileText, AlertTriangle, 
    History, ArrowLeft, MessageSquareWarning, Paperclip, Check, Loader2,
    Inbox, Star, Archive, Search, MoreVertical, Paperclip as AttachmentIcon,
    Calendar, TrendingDown, TrendingUp, AlertCircle
} from "lucide-react";
import { useProcurement, PR } from "../context/ProcurementContext";
import { formatVND } from "../utils/formatUtils";
import { useRouter } from "next/navigation";

interface PendingPR extends PR {
    workflowId: string;
}

export default function ApprovalsPage() {
    const { prs, costCenters, departments, approvals, actionApproval, currentUser, notify, refreshData, budgetAllocations, budgetPeriods } = useProcurement();
    const router = useRouter();

    const now = new Date();
    const currentQuarter = Math.ceil((now.getMonth() + 1) / 3);
    const currentYear = now.getFullYear();

    const pendingPRs = (approvals || []).map((app) => {
        const pr = prs.find((p) => p.id === app.documentId);
        if (!pr) return null;
        return { ...pr, workflowId: app.id };
    }).filter((p): p is PendingPR => p !== null);

    const [selectedPR, setSelectedPR] = useState<PendingPR | null>(null);
    const [searchQuery, setSearchQuery] = useState("");

    // Action State
    const [actionType, setActionType] = useState<"APPROVE" | "REJECT" | "MORE_INFO" | null>(null);
    const [memo, setMemo] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);

    useEffect(() => {
        if (pendingPRs.length > 0 && !selectedPR) {
            setSelectedPR(pendingPRs[0]);
        }
    }, [pendingPRs, selectedPR]);

    const handleAction = async (overrideAction?: "APPROVE" | "REJECT" | "MORE_INFO") => {
        const currentAction = overrideAction || actionType;
        
        if (currentAction === "REJECT" && !memo.trim()) {
            notify("Vui lòng nhập lý do từ chối!", "warning");
            return;
        }

        setIsSubmitting(true);
        try {
            if (!selectedPR) return;
            const success = await actionApproval(
                selectedPR.workflowId, 
                currentAction === "APPROVE" ? "APPROVE" : "REJECT", 
                memo
            );
            
            if (success) {
                setIsSuccess(true);
                notify("Thao tác thành công!", "success");
                await refreshData();
                setTimeout(() => {
                    setSelectedPR(null);
                    setIsSuccess(false);
                    setMemo("");
                    setActionType(null);
                }, 2000);
            } else {
                notify("Không thể thực hiện phê duyệt.", "error");
            }
        } catch (err) {
            console.error(err);
            notify("Lỗi kết nối khi phê duyệt.", "error");
        } finally {
            setIsSubmitting(false);
        }
    };

    const filteredPRs = pendingPRs.filter(pr => 
        pr.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (pr.prNumber || "").toLowerCase().includes(searchQuery.toLowerCase())
    );

    const quarterAlloc = selectedPR && budgetAllocations ? budgetAllocations.find(alloc => {
        const period = budgetPeriods.find(p => p.id === alloc.budgetPeriodId);
        return (alloc.costCenterId === selectedPR.costCenterId) &&
               period?.fiscalYear === currentYear &&
               period?.periodNumber === currentQuarter;
    }) : null;

    const currentBudget = quarterAlloc 
        ? (Number(quarterAlloc.allocatedAmount) - Number(quarterAlloc.committedAmount || 0) - Number(quarterAlloc.spentAmount || 0)) 
        : 0;
    
    const prCostCenter = !quarterAlloc && selectedPR ? costCenters.find(cc => cc.id === selectedPR.costCenterId) : null;
    const finalBudget = quarterAlloc ? currentBudget : (prCostCenter ? (Number(prCostCenter.budgetAnnual) - Number(prCostCenter.budgetUsed)) : 0);
    const projectedRemaining = selectedPR ? (finalBudget - (Number(selectedPR.totalEstimate) || 0)) : 0;

    return (
        <main className="animate-in fade-in duration-500 p-6 min-h-screen bg-[#0F1117] text-[#F8FAFC]">

            <div className="flex flex-1 overflow-hidden">
                {/* Left Sidebar: Inbox List */}
                <div className="w-100 border-r border-border bg-bg-secondary flex flex-col shrink-0">
                    <div className="p-4 border-b border-border bg-bg-secondary/50">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-xl font-bold text-[#F8FAFC] flex items-center gap-2">
                                <Inbox size={20} className="text-indigo-600" /> Hộp thư Approval
                            </h2>
                            <span className="bg-[#3B82F6]/20 text-[#3B82F6] text-[10px] font-bold px-2 py-0.5 rounded-full">
                                {pendingPRs.length} mới
                            </span>
                        </div>
                        <div className="relative">
                            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input 
                                type="text" 
                                placeholder="Tìm kiếm trong hộp thư..."
                                className="w-full bg-[#0F1117] border border-[rgba(148,163,184,0.1)] rounded-lg pl-9 pr-4 py-2 text-xs font-medium text-[#F8FAFC] focus:ring-2 focus:ring-[#3B82F6]/20 outline-none transition-all"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto custom-scrollbar">
                        {filteredPRs.length > 0 ? (
                            filteredPRs.map((pr) => (
                                <div 
                                    key={pr.id}
                                    onClick={() => setSelectedPR(pr)}
                                    className={`p-4 border-b border-[rgba(148,163,184,0.1)] cursor-pointer transition-all hover:bg-[#0F1117]/50 relative group ${
                                        selectedPR?.id === pr.id ? "bg-[#3B82F6]/5 border-l-4 border-l-[#3B82F6] pl-3" : "pl-4"
                                    }`}
                                >
                                    <div className="flex justify-between items-start mb-1">
                                        <span className="text-[10px] font-bold text-[#3B82F6] uppercase tracking-wider">#{pr.prNumber || pr.id.substring(0,8)}</span>
                                        <span className="text-[10px] text-[#64748B] font-medium">12:45 PM</span>
                                    </div>
                                    <h4 className={`text-sm font-bold truncate mb-1 ${selectedPR?.id === pr.id ? "text-[#F8FAFC]" : "text-[#F8FAFC]"}`}>
                                        {pr.title}
                                    </h4>
                                    <p className="text-[11px] text-[#64748B] line-clamp-2 italic mb-2">
                                        &quot;{pr.justification}&quot;
                                    </p>
                                    <div className="flex justify-between items-center">
                                        <div className="flex items-center gap-2">
                                            <div className="h-5 w-5 rounded-full bg-[#161922] flex items-center justify-center text-[10px] font-bold text-[#64748B] border border-[rgba(148,163,184,0.1)]">
                                                {pr.requester?.fullName?.charAt(0) || "R"}
                                            </div>
                                            <span className="text-[10px] font-semibold text-[#94A3B8]">{pr.requester?.fullName || "Requester"}</span>
                                        </div>
                                        <span className="text-[11px] font-bold text-[#F8FAFC] ">{formatVND(pr.totalEstimate)}</span>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="p-8 text-center mt-20">
                                <div className="w-16 h-16 bg-[#161922] rounded-2xl flex items-center justify-center mx-auto mb-4 border border-[rgba(148,163,184,0.1)]">
                                    <Archive size={24} className="text-[#64748B]" />
                                </div>
                                <h3 className="text-sm font-bold text-[#64748B] uppercase tracking-widest">Không có thư mới</h3>
                            </div>
                        )}
                    </div>
                </div>

                {/* Right Area: Email Detail Split */}
                <div className="flex-1 flex flex-col bg-[#161922] overflow-hidden">
                    {selectedPR ? (
                        <>
                            {/* Toolbar */}
                            <div className="h-14 bg-[#161922] border-b border-[rgba(148,163,184,0.1)] px-6 flex items-center justify-between shadow-sm shrink-0">
                                <div className="flex items-center gap-3">
                                    <button className="p-2 hover:bg-[#0F1117] rounded-lg text-[#64748B] transition-colors" title="Hủy bỏ/Lưu trữ">
                                        <Archive size={18} />
                                    </button>
                                    <button className="p-2 hover:bg-[#0F1117] rounded-lg text-[#64748B] transition-colors" title="Đánh dấu sao">
                                        <Star size={18} />
                                    </button>
                                    <div className="w-px h-6 bg-[rgba(148,163,184,0.1)] mx-1"></div>
                                    <button 
                                        onClick={() => handleAction("APPROVE")}
                                        className="flex items-center gap-2 px-4 py-1.5 bg-emerald-600 text-white rounded-lg text-[11px] font-bold uppercase tracking-wider hover:bg-emerald-700 transition-colors shadow-sm"
                                    >
                                        <Check size={14} /> Duyệt ngay
                                    </button>
                                    <button 
                                        onClick={() => setActionType("REJECT")}
                                        className="flex items-center gap-2 px-4 py-1.5 bg-rose-500/10 text-rose-400 border border-rose-500/20 rounded-lg text-[11px] font-bold uppercase tracking-wider hover:bg-rose-500/20 transition-colors"
                                    >
                                        <XCircle size={14} /> Từ chối
                                    </button>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button className="p-2 hover:bg-[#0F1117] rounded-lg text-[#64748B] transition-colors">
                                        <MoreVertical size={18} />
                                    </button>
                                </div>
                            </div>

                            {/* Email Body */}
                            <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                                <div className="max-w-4xl mx-auto space-y-8">
                                    {/* Header Info */}
                                    <div className="flex items-start justify-between">
                                        <div className="flex items-center gap-4">
                                            <div className="h-12 w-12 rounded-2xl bg-[#3B82F6] text-white flex items-center justify-center font-bold text-xl shadow-lg shadow-[#3B82F6]/20">
                                                {selectedPR.requester?.fullName?.charAt(0) || "R"}
                                            </div>
                                            <div>
                                                <h1 className="text-2xl font-bold text-[#F8FAFC] tracking-tight">{selectedPR.title}</h1>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <span className="text-xs font-bold text-[#F8FAFC]">{selectedPR.requester?.fullName || "Requester"}</span>
                                                    <span className="text-xs text-[#64748B]">&lt;{selectedPR.requester?.email || "requester@company.com"}&gt;</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-[10px] font-bold text-[#64748B] uppercase tracking-widest mb-1">Thời gian gửi</div>
                                            <div className="text-sm font-bold text-[#F8FAFC]">{formatDate(selectedPR.createdAt)}</div>
                                        </div>
                                    </div>

                                    {/* Content Card */}
                                    <div className="bg-[#161922] rounded-2xl border border-[rgba(148,163,184,0.1)] shadow-sm overflow-hidden">
                                        <div className="p-6 border-b border-[rgba(148,163,184,0.1)] bg-[#0F1117] flex justify-between items-center">
                                            <div className="flex items-center gap-4">
                                                <div className="flex flex-col">
                                                    <span className="text-[9px] font-bold text-[#64748B] uppercase tracking-widest mb-0.5">Phòng ban</span>
                                                    <span className="text-xs font-bold text-[#F8FAFC] uppercase">
                                                        {typeof selectedPR.department === 'object' ? selectedPR.department.name : "N/A"}
                                                    </span>
                                                </div>
                                                <div className="w-px h-8 bg-[rgba(148,163,184,0.1)]"></div>
                                                <div className="flex flex-col">
                                                    <span className="text-[9px] font-bold text-[#64748B] uppercase tracking-widest mb-0.5">Cost Center</span>
                                                    <span className="text-xs font-bold text-[#3B82F6]">
                                                        {costCenters.find(cc => cc.id === selectedPR.costCenterId)?.code || 'CC_GLOBAL'}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <span className="text-[9px] font-bold text-[#64748B] uppercase tracking-widest mb-0.5 block">Tổng ngân sách đề xuất</span>
                                                <span className="text-xl font-bold text-[#F8FAFC] tracking-tight">{formatVND(selectedPR.totalEstimate)}</span>
                                            </div>
                                        </div>

                                        <div className="p-8">
                                            <h3 className="text-xs font-bold text-[#64748B] uppercase tracking-widest mb-4">Mô tả và Lý do cần thiết</h3>
                                            <div className="bg-[#0F1117] p-6 rounded-xl border border-[rgba(148,163,184,0.1)] italic text-[#94A3B8] text-sm leading-relaxed mb-10">
                                                &quot;{selectedPR.justification}&quot;
                                            </div>

                                            <h3 className="text-xs font-bold text-[#64748B] uppercase tracking-widest mb-4">Chi tiết hàng hóa / dịch vụ</h3>
                                            <div className="overflow-hidden border border-[rgba(148,163,184,0.1)] rounded-xl">
                                                <table className="erp-table text-xs">
                                                    <thead>
                                                        <tr className="bg-[#0F1117] text-[#64748B] font-bold border-b border-[rgba(148,163,184,0.1)] uppercase tracking-tighter">
                                                            <th className="px-5 py-4">Mô tả</th>
                                                            <th className="px-5 py-4 text-center">Số lượng</th>
                                                            <th className="px-5 py-4 text-right">Đơn giá</th>
                                                            <th className="px-5 py-4 text-right">Thành tiền</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-[rgba(148,163,184,0.1)] font-medium">
                                                        {selectedPR.items?.map((item, i) => (
                                                            <tr key={i} className="hover:bg-[#0F1117]/50 transition-colors">
                                                                <td className="px-5 py-4 text-[#F8FAFC] font-bold">{item.description}</td>
                                                                <td className="px-5 py-4 text-center text-[#94A3B8]">{item.qty} {item.unit || "PCS"}</td>
                                                                <td className="px-5 py-4 text-right text-[#64748B]">{formatVND(item.estimatedPrice)}</td>
                                                                <td className="px-5 py-4 text-right text-[#3B82F6] font-bold">{formatVND(item.qty * item.estimatedPrice)}</td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Action Center - Bottom Detail Panel */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        {/* Budget Analytics Heatmap - Mini */}
                                        <div className="bg-[#161922] p-6 rounded-2xl border border-[rgba(148,163,184,0.1)] shadow-sm overflow-hidden relative">
                                            <div className="absolute top-0 left-0 w-1 h-full bg-[#3B82F6]"></div>
                                            <h3 className="text-xs font-bold text-[#64748B] uppercase tracking-widest mb-4 flex items-center gap-2">
                                                <TrendingDown size={14} className="text-[#3B82F6]" /> Phân tích tác động Ngân sách
                                            </h3>
                                            <div className="space-y-4">
                                                <div className="flex justify-between items-center text-xs">
                                                    <span className="font-semibold text-[#64748B]">Khả dụng trước PR:</span>
                                                    <span className="font-bold text-[#F8FAFC]">{formatVND(finalBudget)}</span>
                                                </div>
                                                <div className="flex justify-between items-center text-xs">
                                                    <span className="font-semibold text-[#64748B]">Tiêu thụ sau PR:</span>
                                                    <span className={`font-bold ${projectedRemaining < 0 ? "text-rose-400" : "text-emerald-400"}`}>
                                                        {formatVND(Math.abs(projectedRemaining))}
                                                    </span>
                                                </div>
                                                <div className="h-2 w-full bg-[#0F1117] rounded-full overflow-hidden flex">
                                                    <div className="bg-[#3B82F6]/20 h-full" style={{ width: '40%' }}></div>
                                                    <div className="bg-[#3B82F6] h-full" style={{ width: '15%' }}></div>
                                                </div>
                                                <div className={`p-4 rounded-xl flex items-start gap-3 border ${projectedRemaining < 0 ? "bg-rose-500/10 border-rose-500/20" : "bg-[#3B82F6]/10 border-[#3B82F6]/20"}`}>
                                                    <AlertCircle size={16} className={projectedRemaining < 0 ? "text-rose-400" : "text-[#3B82F6]"} />
                                                    <p className={`text-[10px] font-bold leading-tight ${projectedRemaining < 0 ? "text-rose-400" : "text-[#3B82F6]"}`}>
                                                        {projectedRemaining < 0 
                                                            ? "Cảnh báo: Yêu cầu này vượt quá ngân sách phê duyệt hiện tại. Đề xuất từ chối hoặc yêu cầu điều chuyển ngân sách."
                                                            : "Ngân sách quý hiện tại vẫn trong ngưỡng an toàn. Bạn có thể tự tin phê duyệt yêu cầu này."
                                                        }
                                                    </p>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Workflow & Documents */}
                                        <div className="bg-[#161922] p-6 rounded-2xl border border-[rgba(148,163,184,0.1)] shadow-sm">
                                            <h3 className="text-xs font-bold text-[#64748B] uppercase tracking-widest mb-4 flex items-center gap-2">
                                                <AttachmentIcon size={14} className="text-[#3B82F6]" /> Tài liệu đính kèm
                                            </h3>
                                            <div className="space-y-2">
                                                <div className="group flex items-center justify-between p-3 rounded-xl border border-[rgba(148,163,184,0.1)] hover:border-[#3B82F6]/30 hover:bg-[#0F1117] transition-all cursor-pointer">
                                                    <div className="flex items-center gap-3">
                                                        <div className="h-8 w-8 bg-[#0F1117] text-[#3B82F6] rounded-lg flex items-center justify-center border border-[rgba(148,163,184,0.1)] group-hover:bg-[#3B82F6] group-hover:text-white transition-colors">
                                                            <FileText size={14} />
                                                        </div>
                                                        <span className="text-xs font-bold text-[#F8FAFC]">De_xuat_mua_sam.pdf</span>
                                                    </div>
                                                    <span className="text-[10px] font-bold text-[#64748B]">450KB</span>
                                                </div>
                                                <div className="group flex items-center justify-between p-3 rounded-xl border border-[rgba(148,163,184,0.1)] hover:border-[#3B82F6]/30 hover:bg-[#0F1117] transition-all cursor-pointer">
                                                    <div className="flex items-center gap-3">
                                                        <div className="h-8 w-8 bg-[#0F1117] text-[#3B82F6] rounded-lg flex items-center justify-center border border-[rgba(148,163,184,0.1)] group-hover:bg-[#3B82F6] group-hover:text-white transition-colors">
                                                            <Calendar size={14} />
                                                        </div>
                                                        <span className="text-xs font-bold text-[#F8FAFC]">Lich_su_bao_gia.xlsx</span>
                                                    </div>
                                                    <span className="text-[10px] font-bold text-[#64748B]">1.2MB</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Action Memo Box */}
                                    <div className="bg-[#161922] p-8 rounded-2xl border border-[rgba(148,163,184,0.1)] shadow-lg ring-4 ring-[#3B82F6]/5">
                                        <h3 className="text-xs font-bold text-[#F8FAFC] uppercase tracking-widest mb-4">Nội dung chỉ thị phê duyệt</h3>
                                        <textarea 
                                            value={memo}
                                            onChange={(e) => setMemo(e.target.value)}
                                            placeholder="Ghi chú phản hồi cho người đề xuất... (Bắt buộc nếu từ chối)"
                                            className="w-full h-32 p-6 bg-[#0F1117] border border-[rgba(148,163,184,0.1)] rounded-xl text-sm font-medium outline-none focus:ring-4 focus:ring-[#3B82F6]/10 text-[#F8FAFC] placeholder:text-[#64748B] transition-all resize-none"
                                        />
                                        <div className="flex gap-4 mt-6">
                                            <button 
                                                onClick={() => handleAction("APPROVE")}
                                                disabled={isSubmitting}
                                                className="flex-1 py-4 bg-[#3B82F6] text-white rounded-xl font-bold uppercase tracking-widest text-[11px] shadow-xl shadow-[#3B82F6]/20 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50"
                                            >
                                                {isSubmitting ? <Loader2 className="animate-spin text-white" /> : "Xác nhận Phê duyệt PR"}
                                            </button>
                                            <button 
                                                onClick={() => handleAction("REJECT")}
                                                disabled={isSubmitting}
                                                className="flex-1 py-4 bg-[#161922] border-2 border-rose-500 text-rose-400 rounded-xl font-bold uppercase tracking-widest text-[11px] hover:bg-rose-500/10 transition-all"
                                            >
                                                Yêu cầu làm rõ / Từ chối
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center p-20 text-center">
                            <div className="w-24 h-24 bg-[#161922] rounded-3xl flex items-center justify-center shadow-2xl shadow-[#3B82F6]/5 border border-[rgba(148,163,184,0.1)]">
                                <Inbox size={48} className="text-[#64748B]" />
                            </div>
                            <h2 className="mt-8 text-xl font-bold text-[#64748B] uppercase tracking-widest">Chọn một yêu cầu để kiểm định</h2>
                            <p className="mt-2 text-[#64748B]/70 text-sm italic">Hộp thư phê duyệt tập trung giúp tối ưu hóa thời gian ra quyết định.</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Success Overlay */}
            {isSuccess && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-[#0F1117]/80 backdrop-blur-md animate-in fade-in duration-300">
                    <div className="bg-[#161922] p-10 rounded-[32px] text-center shadow-2xl max-w-sm w-full animate-in zoom-in-95 duration-200 border border-[rgba(148,163,184,0.1)]">
                        <div className="w-20 h-20 bg-emerald-500/10 text-emerald-400 rounded-full flex items-center justify-center mx-auto mb-6 border border-emerald-500/20">
                            <CheckCircle2 size={40} />
                        </div>
                        <h3 className="text-2xl font-bold text-[#F8FAFC] tracking-tight">Thành công!</h3>
                        <p className="text-[#64748B] text-sm mt-2">Hành động của bạn đã được ghi nhận vào hệ thống.</p>
                    </div>
                </div>
            )}
        </main>
    );
}

function formatDate(dateStr?: string) {
    if (!dateStr) return "N/A";
    const date = new Date(dateStr);
    return date.toLocaleDateString('vi-VN', { 
        day: '2-digit', 
        month: '2-digit', 
        year: 'numeric' 
    });
}
