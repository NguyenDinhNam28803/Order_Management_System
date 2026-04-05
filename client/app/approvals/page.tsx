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

    // Tính quý hiện tại
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
                notify("Không thể thực hiện phê duyệt. Vui lòng kiểm tra lại quyền hạn.", "error");
            }
        } catch (err) {
            console.error(err);
            notify("Lỗi kết nối khi phê duyệt.", "error");
        } finally {
            setIsSubmitting(false);
        }
    };

    // Tìm budget cho quý hiện tại (Current Quarter Budget)
    const quarterAlloc = selectedPR && budgetAllocations ? budgetAllocations.find(alloc => {
        const period = budgetPeriods.find(p => p.id === alloc.budgetPeriodId);
        return (alloc.costCenterId === selectedPR.costCenterId) &&
               period?.fiscalYear === currentYear &&
               period?.periodNumber === currentQuarter;
    }) : null;

    const currentBudget = quarterAlloc 
        ? (Number(quarterAlloc.allocatedAmount) - Number(quarterAlloc.committedAmount || 0) - Number(quarterAlloc.spentAmount || 0)) 
        : 0;
    
    // Nếu không tìm thấy quý, fallback về ngân sách năm cũ
    const prCostCenter = !quarterAlloc && selectedPR ? costCenters.find(cc => cc.id === selectedPR.costCenterId) : null;
    const finalBudget = quarterAlloc ? currentBudget : (prCostCenter ? (Number(prCostCenter.budgetAnnual) - Number(prCostCenter.budgetUsed)) : 0);

    const projectedRemaining = selectedPR ? (finalBudget - (Number(selectedPR.totalEstimate) || 0)) : 0;

    if (isSuccess) {
        return (
            <div className="h-screen flex items-center justify-center bg-slate-50">
                <div className="text-center erp-card !p-12 animate-in fade-in zoom-in duration-500">
                    <div className="h-20 w-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6">
                        <CheckCircle2 size={40} />
                    </div>
                    <h2 className="text-2xl font-black text-erp-navy mb-2">Thao tác thành công!</h2>
                    <p className="text-slate-500 mb-8">Phiếu đã được xử lý và ghi nhận vào hệ thống. Đang quay lại trang chủ...</p>
                </div>
            </div>
        );
    }

    return (
        <main className="pt-16 px-8 pb-12 animate-in fade-in duration-500">
            <DashboardHeader breadcrumbs={["Hệ thống", "Phê duyệt"]} />

            {!selectedPR ? (
                <>
                    <div className="mt-12 mb-8">
                        <h1 className="text-4xl font-black text-erp-navy tracking-tight">Danh sách phê duyệt</h1>
                        <p className="text-sm font-bold text-slate-400 mt-2">Bạn đang có {pendingPRs.length} yêu cầu cần xử lý theo đúng SLA.</p>
                    </div>

                    <div className="erp-card !p-0 overflow-hidden shadow-2xl shadow-erp-navy/5 border-none">
                        <table className="erp-table !border-none">
                            <thead>
                                <tr className="bg-slate-50/50 border-b border-slate-100">
                                    <th className="font-black text-[10px] uppercase tracking-widest px-8">Mã định danh</th>
                                    <th className="font-black text-[10px] uppercase tracking-widest px-4">Người đề xuất</th>
                                    <th className="font-black text-[10px] uppercase tracking-widest px-4 w-1/3">Tiêu đề & Giải trình</th>
                                    <th className="font-black text-[10px] uppercase tracking-widest px-4 text-right">Tổng giá trị (VND)</th>
                                    <th className="font-black text-[10px] uppercase tracking-widest px-4 text-center">Thời gian chờ</th>
                                    <th className="font-black text-[10px] uppercase tracking-widest px-8 text-right">Thao tác</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {pendingPRs.length > 0 ? pendingPRs.map((pr, idx: number) => (
                                    <tr key={pr.id} className="hover:bg-erp-blue/[0.02] group transition-all duration-300">
                                        <td className="px-8 py-6">
                                            <div className="font-black text-erp-navy flex items-center gap-3">
                                                <div className="p-2.5 bg-erp-blue/5 text-erp-blue rounded-xl border border-erp-blue/5"><FileText size={16} /></div>
                                                <span className="tracking-tight text-[15px]">{pr.prNumber || pr.id.substring(0,8)}</span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-6">
                                            <div className="text-[13px] font-black text-slate-700 uppercase tracking-tight mb-1">{typeof pr.department === 'object' ? pr.department.name : pr.department}</div>
                                            <div className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter flex items-center gap-2">
                                                <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                                                Requester: {pr.requester?.fullName || pr.requester?.id?.substring(0,8)}
                                            </div>
                                        </td>
                                        <td className="px-4 py-6 max-w-[200px]">
                                            <div className="font-black text-erp-navy text-[14px] truncate mb-1" title={pr.title}>{pr.title}</div>
                                            <div className="text-[11px] text-slate-500 font-medium truncate italic" title={pr.justification}>{pr.justification}</div>
                                        </td>
                                        <td className="px-4 py-6 text-right">
                                            <div className="font-mono font-black text-erp-blue text-xl tracking-tighter">{formatVND(pr.totalEstimate)}</div>
                                            <div className="text-[9px] font-black text-slate-300 uppercase tracking-widest mt-1">Estimations</div>
                                        </td>
                                        <td className="px-4 py-6 text-center">
                                            {idx === 0 ? (
                                                <div className="inline-flex flex-col items-center gap-1">
                                                    <span className="text-[10px] font-black text-rose-500 bg-rose-50 px-2.5 py-1 rounded-lg border border-rose-100 flex items-center gap-1.5 animate-pulse uppercase tracking-tight">
                                                        <AlertTriangle size={11} /> 26h Wait
                                                    </span>
                                                    <span className="text-[8px] font-bold text-rose-300 uppercase">Critical SLA</span>
                                                </div>
                                            ) : (
                                                <div className="inline-flex flex-col items-center gap-1">
                                                    <span className="text-[10px] font-black text-slate-500 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-100 uppercase tracking-tight">4h Wait</span>
                                                    <span className="text-[8px] font-bold text-slate-300 uppercase">On Track</span>
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-8 py-6 text-right">
                                            <button
                                                onClick={() => setSelectedPR(pr)}
                                                className="px-6 py-3 bg-white text-erp-navy hover:bg-erp-navy hover:text-white border border-slate-200 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-sm hover:shadow-xl hover:scale-105 active:scale-95"
                                            >
                                                Kiểm soát
                                            </button>
                                        </td>
                                    </tr>
                                )) : (
                                    <tr>
                                        <td colSpan={6} className="py-32 text-center">
                                            <div className="flex flex-col items-center justify-center gap-4">
                                                <div className="w-20 h-20 rounded-[32px] bg-slate-50 flex items-center justify-center border-2 border-dashed border-slate-200">
                                                    <CheckSquare size={32} className="text-slate-200" />
                                                </div>
                                                <div>
                                                    <h4 className="text-sm font-black text-slate-400 uppercase tracking-widest">Hệ thống sạch</h4>
                                                    <p className="text-[10px] text-slate-300 font-bold uppercase tracking-tighter mt-1">Không có yêu cầu nào cần bạn xử lý lúc này.</p>
                                                </div>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </>
            ) : (
                <div className="animate-in fade-in slide-in-from-right-12 duration-500">
                    <div className="mt-12 flex justify-between items-end mb-10 pb-6 border-b border-slate-100">
                        <div className="flex items-center gap-6">
                            <button onClick={() => setSelectedPR(null)} className="h-14 w-14 flex items-center justify-center bg-white border border-slate-200 text-slate-400 hover:text-erp-navy hover:border-erp-navy rounded-[20px] transition-all shadow-sm hover:shadow-xl hover:scale-110">
                                <ArrowLeft size={24} />
                            </button>
                            <div>
                                <div className="flex items-center gap-3 mb-1">
                                    <span className="bg-erp-blue text-white text-[9px] font-black uppercase px-2 py-0.5 rounded tracking-[0.2em]">Pending Review</span>
                                    <h1 className="text-4xl font-black text-erp-navy tracking-tight">Chi tiết phê duyệt #{selectedPR.prNumber || selectedPR.id.substring(0,8)}</h1>
                                </div>
                                <p className="text-sm font-bold text-slate-400">Kiểm tra thông tin chi tiết và lịch sử trước khi ra quyết định.</p>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 xl:grid-cols-3 gap-10">
                        <div className="xl:col-span-2 space-y-10">
                            {/* Card Thông tin tổng hợp */}
                            <div className="bg-white rounded-[32px] shadow-2xl shadow-erp-navy/5 border border-slate-100 overflow-hidden">
                                <div className="bg-slate-50/50 px-8 py-5 border-b border-slate-100 flex items-center justify-between">
                                    <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-erp-navy">Thông tin hồ sơ gốc</h3>
                                </div>
                                <div className="p-10 grid grid-cols-2 md:grid-cols-4 gap-10">
                                    <div className="md:col-span-2 flex items-center gap-6">
                                        <div className="w-16 h-16 rounded-[24px] bg-erp-blue/10 text-erp-blue flex items-center justify-center font-black text-2xl shadow-inner border border-erp-blue/5">
                                            {(typeof selectedPR.department === 'object' ? selectedPR.department.name : (selectedPR.department || "PR")).substring(0,2).toUpperCase()}
                                        </div>
                                        <div>
                                            <div className="text-[10px] uppercase font-black tracking-widest text-slate-300 mb-1">Đơn vị đề xuất</div>
                                            <div className="text-lg font-black text-erp-navy">
                                                {typeof selectedPR.department === 'object' ? selectedPR.department.name : 
                                                 departments.find(d => d.id === selectedPR.deptId || d.id === selectedPR.department)?.name || selectedPR.department || "N/A"}
                                            </div>
                                            <div className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter mt-0.5">{new Date(selectedPR.createdAt).toLocaleString('vi-VN')}</div>
                                        </div>
                                    </div>
                                    <div>
                                        <div className="text-[10px] uppercase font-black tracking-widest text-slate-300 mb-2">Cost Center</div>
                                        <div className="text-sm font-black text-erp-navy bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-100 inline-block uppercase">
                                            {costCenters.find(cc => cc.id === selectedPR.costCenterId)?.name || selectedPR.costCenterId || 'N/A'}
                                        </div>
                                    </div>
                                    <div>
                                        <div className="text-[10px] uppercase font-black tracking-widest text-slate-300 mb-2">Độ ưu tiên</div>
                                        <div className={`text-sm font-black uppercase tracking-tight flex items-center gap-2 ${selectedPR.priority.toString() === 'High' ? 'text-rose-500' : selectedPR.priority.toString() === 'Urgent' ? 'text-amber-500' : 'text-emerald-500'}`}>
                                            <div className={`h-2 w-2 rounded-full ${selectedPR.priority.toString() === 'High' ? 'bg-rose-500 animate-pulse' : 'bg-current'}`} />
                                            {selectedPR.priority.toString() || 'Normal'}
                                        </div>
                                    </div>
                                    <div className="col-span-2 md:col-span-4 bg-slate-50/50 p-8 rounded-[24px] border-2 border-dashed border-slate-100 mt-2">
                                        <div className="text-[10px] uppercase font-black tracking-widest text-slate-300 mb-3">Nội dung đề xuất & Mục đích</div>
                                        <div className="text-lg font-black text-erp-navy mb-3 leading-tight tracking-tight">{selectedPR.title}</div>
                                        <div className="text-[15px] font-medium text-slate-600 italic leading-relaxed bg-white/50 p-4 rounded-xl">&quot;{selectedPR.justification}&quot;</div>
                                    </div>
                                </div>
                            </div>

                            {/* Danh sách hàng */}
                            <div className="bg-white rounded-[32px] shadow-2xl shadow-erp-navy/5 border border-slate-100 overflow-hidden">
                                <div className="bg-erp-navy px-8 py-5 flex items-center justify-between">
                                    <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-white/70">Danh mục hàng hóa chuẩn bị mua</h3>
                                    <div className="text-[10px] font-black text-white px-3 py-1 bg-white/10 rounded-full border border-white/10 uppercase tracking-widest">SL: {selectedPR.items?.length || 0}</div>
                                </div>
                                <table className="erp-table !shadow-none !border-none m-0">
                                    <thead>
                                        <tr className="bg-slate-50 border-b border-slate-100">
                                            <th className="w-16 text-center text-[9px] font-black uppercase tracking-widest text-slate-400">STT</th>
                                            <th className="text-[9px] font-black uppercase tracking-widest text-slate-400">Mô tả chi tiết hàng hóa</th>
                                            <th className="text-[9px] font-black uppercase tracking-widest text-slate-400 text-center w-24">Số lượng</th>
                                            <th className="text-[9px] font-black uppercase tracking-widest text-slate-400 text-right w-40">Đơn giá dự kiến</th>
                                            <th className="text-[9px] font-black uppercase tracking-widest text-slate-400 text-right w-40 px-8">Thành tiền</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50">
                                        {selectedPR.items?.map((item, idx: number) => {
                                            const rowTotal = (Number(item.qty) || 0) * item.estimatedPrice;
                                            const isSuperHigh = rowTotal >= 100000000;
                                            const isHigh = rowTotal >= 30000000 && !isSuperHigh;
                                            
                                            return (
                                                <tr key={idx} className={`group transition-colors ${isSuperHigh ? 'bg-rose-50/30' : isHigh ? 'bg-amber-50/20' : 'hover:bg-slate-50/50'}`}>
                                                    <td className="text-center font-black text-slate-300 py-6">{idx + 1}</td>
                                                    <td className="py-6">
                                                        <div className="font-black text-erp-navy text-[14px] leading-tight mb-1">{item.description}</div>
                                                        <div className="flex items-center gap-3">
                                                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter bg-slate-100/50 px-2 py-0.5 rounded-lg border border-slate-100">{item.unit || 'Cái'}</span>
                                                            {isSuperHigh && <span className="inline-flex items-center gap-1.5 text-[9px] font-black uppercase text-rose-600 bg-rose-50 px-2 py-1 rounded-xl tracking-tighter border border-rose-100 animate-pulse"><AlertTriangle size={12} /> Phê duyệt TGĐ</span>}
                                                        </div>
                                                    </td>
                                                    <td className="text-center font-black text-erp-blue text-lg py-6">{item.qty}</td>
                                                    <td className="text-right font-mono font-bold text-slate-400 py-6">{formatVND(item.estimatedPrice)}</td>
                                                    <td className={`text-right font-mono font-black py-6 px-8 text-lg ${isSuperHigh ? 'text-rose-600' : isHigh ? 'text-amber-600' : 'text-erp-navy'}`}>
                                                        {formatVND(rowTotal)}
                                                    </td>
                                                </tr>
                                            )
                                        })}
                                    </tbody>
                                    <tfoot>
                                        <tr className="bg-slate-50/50">
                                            <td colSpan={4} className="text-right py-10 px-6">
                                                <div className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-300 mb-2">Tổng giá trị quyết toán (PR Total)</div>
                                                <div className="text-[10px] font-black text-erp-blue uppercase tracking-tighter flex justify-end items-center gap-2">
                                                    <History size={12} /> 
                                                    Quy trình: Trưởng bộ phận → Giám đốc {Number(selectedPR.totalEstimate) >= 100000000 ? '→ Tổng Giám Đốc' : ''}
                                                </div>
                                            </td>
                                            <td className="text-right py-10 px-8">
                                                <div className="text-3xl font-black text-erp-navy font-mono tracking-tighter">{formatVND(Number(selectedPR.totalEstimate) || 0)}</div>
                                                <div className="text-[10px] font-black text-slate-400 tracking-[0.2em] mt-1">CURRENCY: VND</div>
                                            </td>
                                        </tr>
                                    </tfoot>
                                </table>
                            </div>
                        </div>

                        {/* Cột phải: Lịch sử & Đính kèm */}
                        <div className="space-y-10">
                            {/* Tài liệu đính kèm */}
                            <div className="bg-white rounded-[32px] shadow-2xl shadow-erp-navy/5 border border-slate-100 p-8">
                                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-erp-navy mb-6 flex items-center gap-3">
                                    <Paperclip size={18} className="text-erp-blue" /> Hồ sơ đính kèm
                                </h3>
                                <div className="space-y-4">
                                    {[
                                        { name: "Bao_gia_ncc_A.pdf", size: "1.2 MB" },
                                        { name: "De_xuat_mua.docx", size: "450 KB" }
                                    ].map((doc, i) => (
                                        <div key={i} className="flex items-center justify-between p-4 bg-slate-50/50 border border-slate-100 rounded-2xl hover:border-erp-blue/20 transition-all group cursor-pointer hover:bg-white hover:shadow-xl hover:shadow-erp-blue/5">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 bg-white text-erp-blue rounded-xl flex items-center justify-center shrink-0 shadow-sm border border-slate-100 group-hover:scale-110 transition-transform">
                                                    <FileText size={20} />
                                                </div>
                                                <div>
                                                    <div className="text-[13px] font-black text-erp-navy group-hover:text-erp-blue transition-colors line-clamp-1">{doc.name}</div>
                                                    <div className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">{doc.size}</div>
                                                </div>
                                            </div>
                                            <Eye size={18} className="text-slate-200 group-hover:text-erp-blue" />
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Lịch sử duyệt */}
                            <div className="bg-slate-50/50 rounded-[32px] shadow-2xl shadow-erp-navy/5 border border-slate-100 p-8 relative">
                                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-8 flex items-center gap-2">
                                    <History size={16} /> Workflow Timeline
                                </h3>
                                <div className="space-y-8 relative before:absolute before:inset-0 before:ml-2.5 before:-translate-x-px before:h-full before:w-0.5 before:bg-gradient-to-b before:from-emerald-400 before:via-slate-200 before:to-transparent">
                                    <div className="relative flex items-center group">
                                        <div className="flex items-center justify-center w-5 h-5 rounded-full bg-emerald-500 border-4 border-white shadow-lg shrink-0 z-10 mr-5 group-hover:scale-125 transition-transform"></div>
                                        <div className="bg-white p-5 rounded-2xl border border-emerald-100 shadow-sm w-full group-hover:shadow-md transition-shadow">
                                            <div className="flex justify-between items-start mb-2">
                                                <div className="text-[9px] font-black uppercase text-emerald-600 tracking-widest">Phó Quản đốc</div>
                                                <div className="text-[9px] text-slate-300 font-bold">14/03 09:30 AM</div>
                                            </div>
                                            <div className="text-sm font-black text-erp-navy mb-2">Tran Van B (Đã duyệt)</div>
                                            <div className="text-xs italic text-slate-500 bg-emerald-50/30 p-3 rounded-xl border border-emerald-50">&quot;Đồng ý đề xuất, cần hàng gấp cho dự án.&quot;</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Khu vực Action Command Center */}
                    <div className="mt-12 erp-card shadow-[0_20px_60px_-15px_rgba(0,0,0,0.15)] overflow-hidden p-0 border-none animate-in slide-in-from-bottom-8 duration-700">
                        <div className="bg-erp-navy p-8 flex flex-col md:flex-row items-center justify-between gap-6">
                            <div className="flex items-center gap-5">
                                <div className="p-4 bg-white/10 rounded-[28px] backdrop-blur-xl border border-white/10 shadow-2xl">
                                    <CheckSquare size={28} className="text-white" />
                                </div>
                                <div>
                                    <h3 className="text-base font-black uppercase tracking-[0.3em] text-white">Action Command Center</h3>
                                    <p className="text-[11px] font-bold text-white/50 uppercase tracking-tight mt-1">Ra quyết định thực thi cho PR #{selectedPR.prNumber || selectedPR.id.substring(0,8)}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-4 bg-white/5 p-3 rounded-2xl border border-white/5">
                                <div className="text-right px-6 py-1">
                                    <div className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] mb-1">Decision Value</div>
                                    <div className="text-2xl font-black text-white font-mono tracking-tighter">{formatVND(selectedPR.totalEstimate)} ₫</div>
                                </div>
                            </div>
                        </div>

                        <div className="p-10 md:flex gap-16 bg-white">
                            <div className="flex-1 space-y-6 mb-10 md:mb-0">
                                <div className="flex justify-between items-center px-2">
                                    <label className="text-[11px] font-black uppercase tracking-[0.1em] text-slate-400">Ghi chú & Chỉ thị phê duyệt</label>
                                    {actionType === 'REJECT' && <span className="text-[10px] font-black text-rose-500 uppercase flex items-center gap-1.5 animate-pulse"><AlertTriangle size={12} /> Bắt buộc lý do</span>}
                                </div>
                                <textarea 
                                    className="w-full h-36 p-8 rounded-[32px] bg-slate-50 border-2 border-transparent focus:border-erp-blue/20 focus:bg-white text-[15px] font-medium text-slate-700 outline-none transition-all resize-none shadow-inner"
                                    placeholder="Nội dung phê duyệt, chỉ thị bổ sung hoặc lý do từ chối cụ thể..."
                                    value={memo}
                                    onChange={e => setMemo(e.target.value)}
                                />
                                <div className="flex flex-wrap gap-3 pt-2 px-2">
                                    {["Tài liệu đầy đủ", "Đơn giá tốt", "Cần thêm báo giá", "Vượt ngân sách", "Không khẩn cấp"].map(tag => (
                                        <button 
                                            key={tag}
                                            onClick={() => setMemo(prev => prev ? `${prev}. ${tag}` : tag)}
                                            className="px-4 py-2 rounded-2xl border border-slate-100 text-[10px] font-black text-slate-400 hover:bg-erp-blue hover:text-white hover:border-erp-blue transition-all uppercase tracking-tight shadow-sm"
                                        >
                                            + {tag}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            
                            <div className="w-full md:w-[400px] flex flex-col justify-center">
                                <div className="p-8 rounded-[40px] bg-slate-50/70 border border-slate-100 flex flex-col gap-6 shadow-sm">
                                    {/* Projected Budget Sanity Check */}
                                    {selectedPR && (currentUser?.role === "MANAGER" || currentUser?.role === "DIRECTOR" || currentUser?.role === "CEO" || currentUser?.role === "PLATFORM_ADMIN") && (
                                        <div className={`p-6 rounded-[32px] border-2 border-dashed ${projectedRemaining < 0 ? 'bg-rose-50 border-rose-200 shadow-[0_15px_30px_-10px_rgba(225,29,72,0.1)]' : 'bg-emerald-50/50 border-emerald-100'} transition-all duration-500`}>
                                            <div className="flex justify-between items-center mb-3">
                                                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Ngân sách còn lại dự kiến</span>
                                                {projectedRemaining < 0 && (
                                                    <div className="flex items-center gap-1.5 text-[9px] font-black text-rose-600 bg-white px-2 py-0.5 rounded-full border border-rose-100 animate-pulse">
                                                        <AlertTriangle size={12} /> OVER BUDGET
                                                    </div>
                                                )}
                                            </div>
                                            <div className="flex justify-between items-baseline gap-2">
                                                <div className={`text-2xl font-black font-mono tracking-tighter ${projectedRemaining < 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                                                    {formatVND(projectedRemaining)} ₫
                                                </div>
                                                <div className="text-[9px] font-bold text-slate-400 italic truncate max-w-[120px]">
                                                    {prCostCenter?.name || "Cost Center"}
                                                </div>
                                            </div>
                                            <p className="mt-3 text-[9px] text-slate-400 font-medium leading-relaxed">
                                                Dựa trên ngân sách thực tế tại Cost Center trừ đi giá trị PR hiện tại.
                                            </p>
                                        </div>
                                    )}

                                    {actionType && actionType !== "APPROVE" ? (
                                        <div className="animate-in fade-in slide-in-from-right-8 duration-500">
                                            <div className="mb-6 text-center">
                                                <div className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2">Confirm Decision</div>
                                                <div className={`text-[15px] font-black uppercase tracking-tight py-3 px-6 rounded-2xl inline-block shadow-sm ${actionType === 'REJECT' ? 'bg-rose-50 text-rose-600 border border-rose-100' : 'bg-amber-50 text-amber-600 border border-amber-100'}`}>
                                                    {actionType === 'REJECT' ? 'Từ chối toàn phần' : 'Yêu cầu làm rõ thông tin'}
                                                </div>
                                            </div>
                                            <button 
                                                onClick={() => handleAction()} 
                                                disabled={isSubmitting}
                                                className={`w-full py-5 rounded-[24px] font-black uppercase tracking-widest text-xs flex items-center justify-center gap-3 text-white shadow-2xl transition-all hover:scale-[1.02] active:scale-95 ${
                                                    actionType === 'REJECT' 
                                                    ? 'bg-rose-600 hover:bg-rose-700 shadow-rose-600/40' 
                                                    : 'bg-amber-500 hover:bg-amber-600 shadow-amber-500/40'
                                                }`}
                                            >
                                                {isSubmitting ? (
                                                    <Loader2 className="animate-spin" size={20} />
                                                ) : (
                                                    <CheckSquare size={20} />
                                                )}
                                                Xác nhận Action
                                            </button>
                                            <button onClick={() => setActionType(null)} className="w-full mt-5 py-2 text-[11px] font-black uppercase text-slate-300 hover:text-slate-500 transition-colors tracking-[0.2em]">Hủy & Quay lại</button>
                                        </div>
                                    ) : (
                                        <div className="space-y-5">
                                            <button 
                                                onClick={() => handleAction("APPROVE")}
                                                disabled={isSubmitting}
                                                className="w-full py-6 rounded-[32px] font-black uppercase tracking-widest text-xs flex flex-col items-center justify-center gap-2 text-white bg-emerald-500 hover:bg-emerald-600 shadow-[0_20px_50px_-10px_rgba(16,185,129,0.4)] transition-all hover:scale-[1.02] active:scale-95 group"
                                            >
                                                <div className="flex items-center gap-3">
                                                    <Check size={24} className="group-hover:scale-125 transition-transform" /> 
                                                    <span className="text-base tracking-widest">Phê Duyệt PR</span>
                                                </div>
                                                <span className="text-[9px] opacity-60 tracking-[0.3em] font-bold">DIGITAL SIGNATURE REQUIRED</span>
                                            </button>
                                            <div className="grid grid-cols-2 gap-4 pt-2">
                                                <button 
                                                    onClick={() => setActionType("MORE_INFO")}
                                                    className="py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] flex items-center justify-center gap-2 text-amber-600 bg-white border-2 border-amber-500/10 hover:bg-amber-50 hover:border-amber-500/30 transition-all active:scale-95 shadow-sm"
                                                >
                                                    <MessageSquareWarning size={16} /> Clarify
                                                </button>
                                                <button 
                                                    onClick={() => setActionType("REJECT")}
                                                    className="py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] flex items-center justify-center gap-2 text-rose-600 bg-white border-2 border-rose-500/10 hover:bg-rose-50 hover:border-rose-500/30 transition-all active:scale-95 shadow-sm"
                                                >
                                                    <XCircle size={16} /> Decline
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </main>
    );
}
