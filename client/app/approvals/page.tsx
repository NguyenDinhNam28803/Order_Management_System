"use client";

import React, { useState } from "react";
import DashboardHeader from "../components/DashboardHeader";
import { CheckSquare, XCircle, CheckCircle2, Eye, FileText, AlertTriangle, History, ArrowLeft, MessageSquareWarning, Paperclip, Check, Loader2 } from "lucide-react";
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

    // Action State
    const [actionType, setActionType] = useState<"APPROVE" | "REJECT" | "MORE_INFO" | null>(null);
    const [memo, setMemo] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);

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

    if (isSuccess) {
        return (
            <div className="h-screen flex items-center justify-center bg-slate-50">
                <div className="text-center erp-card !p-12 animate-in fade-in zoom-in duration-500 max-w-lg">
                    <div className="h-20 w-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6">
                        <CheckCircle2 size={40} />
                    </div>
                    <h2 className="text-2xl font-bold text-slate-900 mb-2">Phê duyệt hoàn tất!</h2>
                    <p className="text-slate-500 mb-8">Yêu cầu đã được xử lý thành công. Hệ thống đang chuyển hướng...</p>
                </div>
            </div>
        );
    }

    return (
        <main className="pt-20 px-8 pb-12 bg-slate-50 min-h-screen animate-in fade-in duration-500">
            <DashboardHeader breadcrumbs={["Hệ thống", "Phê duyệt"]} />

            {!selectedPR ? (
                <>
                    <div className="mt-8 mb-8 border-b border-slate-200 pb-6 flex justify-between items-end">
                        <div>
                           <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Hộp thư phê duyệt</h1>
                           <p className="text-sm font-medium text-slate-500 mt-1">Đang có {pendingPRs.length} yêu cầu cần bạn ra quyết định ứng cứu ngân sách.</p>
                        </div>
                    </div>

                    <div className="erp-card !p-0 overflow-hidden shadow-sm border border-slate-200 bg-white">
                        <table className="erp-table border-none border-collapse-none">
                            <thead>
                                <tr>
                                    <th className="px-6">Mã chứng từ</th>
                                    <th>Người đề xuất</th>
                                    <th>Nội dung yêu cầu</th>
                                    <th className="text-right">Giá trị VND</th>
                                    <th className="text-center">SLA</th>
                                    <th className="text-right pr-6"></th>
                                </tr>
                            </thead>
                            <tbody>
                                {pendingPRs.length > 0 ? pendingPRs.map((pr, idx: number) => (
                                    <tr key={pr.id} className="cursor-pointer group hover:bg-slate-50 transition-colors">
                                        <td className="px-6 py-5">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg group-hover:bg-indigo-600 group-hover:text-white transition-colors duration-200">
                                                    <FileText size={16} />
                                                </div>
                                                <span className="font-bold text-slate-900 tracking-tight">{pr.prNumber || pr.id.substring(0,8)}</span>
                                            </div>
                                        </td>
                                        <td className="py-5">
                                            <div className="text-xs font-bold text-slate-700">{typeof pr.department === 'object' ? pr.department.name : pr.department}</div>
                                            <div className="text-[10px] text-slate-400 font-medium mt-0.5">by {pr.requester?.fullName || "Requester"}</div>
                                        </td>
                                        <td className="py-5 max-w-[300px]">
                                            <div className="font-semibold text-slate-900 text-sm truncate" title={pr.title}>{pr.title}</div>
                                            <div className="text-xs text-slate-500 truncate italic" title={pr.justification}>{pr.justification}</div>
                                        </td>
                                        <td className="py-5 text-right font-bold text-slate-900 font-mono">
                                            {formatVND(pr.totalEstimate)}
                                        </td>
                                        <td className="py-5 text-center">
                                            {idx === 0 ? (
                                                <span className="status-pill status-rejected py-0.5 px-2 text-[10px] animate-pulse">Critical SLA</span>
                                            ) : (
                                                <span className="status-pill status-pending py-0.5 px-2 text-[10px]">On Track</span>
                                            )}
                                        </td>
                                        <td className="py-5 text-right pr-6">
                                            <button
                                                onClick={() => setSelectedPR(pr)}
                                                className="btn-secondary py-1.5 px-4 text-xs"
                                            >
                                                Kiểm soát
                                            </button>
                                        </td>
                                    </tr>
                                )) : (
                                    <tr>
                                        <td colSpan={6} className="py-24 text-center">
                                            <div className="flex flex-col items-center justify-center gap-3">
                                                <div className="w-16 h-16 rounded-2xl bg-slate-50 flex items-center justify-center border border-dashed border-slate-200">
                                                    <CheckSquare size={24} className="text-slate-300" />
                                                </div>
                                                <h4 className="text-sm font-semibold text-slate-400 uppercase tracking-widest">Không có yêu cầu chờ duyệt</h4>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </>
            ) : (
                <div className="animate-in fade-in slide-in-from-right-10 duration-500">
                    <div className="mt-8 flex justify-between items-center mb-10 border-b border-slate-200 pb-8">
                        <div className="flex items-center gap-5">
                            <button onClick={() => setSelectedPR(null)} className="btn-secondary h-12 w-12 !p-0">
                                <ArrowLeft size={20} />
                            </button>
                            <div>
                                <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Chi tiết phê duyệt #{selectedPR.prNumber || selectedPR.id.substring(0,8)}</h1>
                                <p className="text-sm font-medium text-slate-500 mt-1">Vui lòng kiểm định thông tin và ngân sách trước khi ký duyệt.</p>
                            </div>
                        </div>
                        <div className="flex gap-3">
                             <div className="status-pill status-pending">Chờ phê duyệt</div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 xl:grid-cols-3 gap-10">
                        <div className="xl:col-span-2 space-y-10">
                            <div className="erp-card bg-white border-slate-200">
                                <h3 className="section-title">Thông tin yêu cầu</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 my-6 p-8 bg-slate-50 rounded-2xl border border-slate-100">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xl border border-indigo-200">
                                            {typeof selectedPR.department === 'object' ? selectedPR.department.name.substring(0,1) : "P"}
                                        </div>
                                        <div>
                                            <div className="text-[10px] uppercase font-bold text-slate-400 mb-0.5 tracking-wider">Đơn vị đề xuất</div>
                                            <div className="text-base font-bold text-slate-800">
                                                {typeof selectedPR.department === 'object' ? selectedPR.department.name : "N/A"}
                                            </div>
                                        </div>
                                    </div>
                                    <div>
                                        <div className="text-[10px] uppercase font-bold text-slate-400 mb-1 tracking-wider">Mã ngân sách (Cost Center)</div>
                                        <div className="bg-white border px-3 py-1.5 rounded-lg text-sm font-bold text-indigo-900 border-slate-200 inline-block uppercase">
                                            {costCenters.find(cc => cc.id === selectedPR.costCenterId)?.name || 'N/A'}
                                        </div>
                                    </div>
                                    <div className="md:col-span-2 space-y-3">
                                        <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Tiêu đề & Mục đích mua sắm</div>
                                        <h4 className="text-xl font-bold text-slate-900">{selectedPR.title}</h4>
                                        <p className="text-sm font-medium text-slate-600 bg-white/60 p-4 rounded-xl italic border border-slate-100/50">
                                           &quot;{selectedPR.justification}&quot;
                                        </p>
                                    </div>
                                </div>

                                <h3 className="section-title mt-8">Danh mục sản phẩm đề xuất</h3>
                                <div className="overflow-hidden rounded-xl border border-slate-100 bg-white shadow-sm mt-4">
                                    <table className="erp-table border-none border-collapse-none">
                                        <thead>
                                            <tr>
                                                <th className="w-14 text-center">#</th>
                                                <th>Mô tả chi tiết</th>
                                                <th className="text-center w-24">SL</th>
                                                <th className="text-right w-40">Đơn giá VND</th>
                                                <th className="text-right w-40 pr-8">Thành tiền</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {selectedPR.items?.map((item, idx: number) => {
                                                const rowTotal = (Number(item.qty) || 0) * item.estimatedPrice;
                                                return (
                                                    <tr key={idx} className="hover:bg-slate-50 transition-colors">
                                                        <td className="text-center text-slate-400 text-xs font-semibold">{idx + 1}</td>
                                                        <td className="py-4">
                                                            <div className="font-bold text-slate-800 text-sm">{item.description}</div>
                                                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest bg-slate-100 px-2 rounded-md mt-1 inline-block">{item.unit || 'PCS'}</span>
                                                        </td>
                                                        <td className="text-center font-bold text-indigo-600">{item.qty}</td>
                                                        <td className="text-right font-medium text-slate-500 font-mono text-sm">{formatVND(item.estimatedPrice)}</td>
                                                        <td className="text-right font-bold text-slate-900 font-mono pr-8 text-sm">
                                                            {formatVND(rowTotal)}
                                                        </td>
                                                    </tr>
                                                )
                                            })}
                                        </tbody>
                                        <tfoot>
                                            <tr className="bg-slate-50/70">
                                                <td colSpan={4} className="text-right py-6 font-semibold text-slate-500 text-xs uppercase tracking-wider">Tổng giá trị yêu cầu</td>
                                                <td className="text-right py-6 pr-8 font-bold text-xl text-slate-900 font-mono">
                                                   {formatVND(Number(selectedPR.totalEstimate) || 0)} 
                                                </td>
                                            </tr>
                                        </tfoot>
                                    </table>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-6">
                            <div className="erp-card">
                                <h3 className="section-title">
                                    <Paperclip size={16} /> Hồ sơ đính kèm
                                </h3>
                                <div className="space-y-3 mt-4">
                                    {[
                                        { name: "De_xuat_mua.docx", size: "450 KB" }
                                    ].map((doc, i) => (
                                        <div key={i} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100 group cursor-pointer hover:bg-white hover:border-indigo-300 transition-all">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 bg-white text-indigo-600 rounded-lg flex items-center justify-center shrink-0 border border-slate-100 group-hover:scale-110 transition-transform">
                                                    <FileText size={18} />
                                                </div>
                                                <div className="min-w-0">
                                                    <div className="text-xs font-bold text-slate-800 truncate">{doc.name}</div>
                                                    <div className="text-[9px] text-slate-400 font-semibold">{doc.size}</div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="erp-card bg-slate-50/50 p-6 relative overflow-hidden">
                                <h3 className="section-title">
                                    <History size={16} /> Lịch sử luân chuyển
                                </h3>
                                <div className="space-y-6 mt-6 relative before:absolute before:left-2.5 before:top-2 before:bottom-0 before:w-0.5 before:bg-indigo-100">
                                    <div className="relative pl-8">
                                        <div className="absolute left-0 top-1 w-5 h-5 rounded-full bg-emerald-500 border-4 border-white shadow-sm" />
                                        <div className="text-[9px] font-bold text-emerald-600 uppercase mb-1 tracking-wider">Phó Quản đốc (Approved)</div>
                                        <div className="text-xs font-bold text-slate-900">Tran Van B</div>
                                        <div className="text-xs font-medium text-slate-500 italic mt-1 bg-white p-2 rounded-lg border border-slate-100">&quot;Đã kiểm tra nhu cầu bộ phận.&quot;</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="mt-8 erp-card p-0 overflow-hidden border-slate-200">
                        <div className="bg-slate-900 p-6 flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-white/10 rounded-2xl">
                                    <CheckSquare size={24} className="text-white" />
                                </div>
                                <h3 className="text-base font-bold text-white tracking-wide">Trung tâm ra quyết định phê duyệt</h3>
                            </div>
                            <div className="text-right">
                                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Giá trị quyết định</div>
                                <div className="text-2xl font-bold text-emerald-400 font-mono tracking-tight">{formatVND(selectedPR.totalEstimate)} ₫</div>
                            </div>
                        </div>

                        <div className="p-8 grid grid-cols-1 lg:grid-cols-3 gap-10">
                            <div className="lg:col-span-2 space-y-4">
                                <label className="text-sm font-bold text-slate-700">Chỉ thị & Hướng dẫn phê duyệt</label>
                                <textarea 
                                    className="erp-input h-32 py-4 px-6 text-sm resize-none border-2 border-slate-100 focus:bg-white"
                                    placeholder="Nội dung phê duyệt, chỉ thị bổ sung hoặc lý do từ chối cụ thể..."
                                    value={memo}
                                    onChange={e => setMemo(e.target.value)}
                                />
                                {actionType === 'REJECT' && !memo.trim() && <p className="erp-error">Cần cung cấp lý do từ chối</p>}
                            </div>
                            
                            <div className="flex flex-col justify-center space-y-4">
                                <div className={`p-5 rounded-2xl border ${projectedRemaining < 0 ? "bg-red-50 border-red-100" : "bg-emerald-50 border-emerald-100 text-emerald-800"}`}>
                                    <div className="flex justify-between items-center mb-2">
                                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Dự báo ngân sách còn</span>
                                    </div>
                                    <div className="text-2xl font-bold font-mono tracking-tight">
                                        {formatVND(projectedRemaining)} ₫
                                    </div>
                                </div>

                                <div className="flex flex-col gap-3">
                                    <button 
                                        onClick={() => handleAction("APPROVE")}
                                        disabled={isSubmitting}
                                        className="btn-primary w-full py-4 bg-emerald-600 hover:bg-emerald-700 shadow-emerald-200"
                                    >
                                        {isSubmitting ? <Loader2 className="animate-spin" /> : <Check size={20} />}
                                        Xác nhận Phê duyệt
                                    </button>
                                    <div className="grid grid-cols-2 gap-3">
                                        <button 
                                            onClick={() => setActionType("REJECT")}
                                            className="btn-secondary py-3 text-red-600 border-red-100 bg-red-50 hover:bg-red-100"
                                        >
                                            <XCircle size={16} /> Từ chối
                                        </button>
                                        <button 
                                            onClick={() => setActionType("MORE_INFO")}
                                            className="btn-secondary py-3 text-amber-600 border-amber-100 bg-amber-50 hover:bg-amber-100"
                                        >
                                            <MessageSquareWarning size={16} /> Làm rõ
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </main>
    );
}
