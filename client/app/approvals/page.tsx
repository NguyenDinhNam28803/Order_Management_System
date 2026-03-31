"use client";

import React, { useState } from "react";
import DashboardHeader from "../components/DashboardHeader";
import { CheckSquare, XCircle, CheckCircle2, Eye, FileText, AlertTriangle, History, ArrowLeft, MessageSquareWarning, Paperclip, Check } from "lucide-react";
import { useProcurement, PR } from "../context/ProcurementContext";
import { formatVND } from "../utils/formatUtils";
import { useRouter } from "next/navigation";

interface PendingPR extends PR {
    workflowId: string;
}

export default function ApprovalsPage() {
    const { prs, approvals, actionApproval, currentUser, notify } = useProcurement();
    const router = useRouter();

    const pendingPRs = (approvals || []).map((app) => {
        const pr = prs.find((p) => p.id === app.documentId);
        if (!pr) return null;
        
        // Filter by policy: 
        // Manager only handles < 10,000,000 VND
        // Director handles all >= 10,000,000 VND
        const prTotal = Number(pr.totalEstimate) || 0;
        if (currentUser?.role === "MANAGER" && prTotal >= 10000000) return null;
        if (currentUser?.role === "DIRECTOR" && prTotal < 10000000) return null;

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
                setTimeout(() => {
                    router.push("/");
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
        <main className="pt-16 px-8 pb-12">
            <DashboardHeader breadcrumbs={["Hệ thống", "Phê duyệt"]} />

            {!selectedPR ? (
                <>
                    <div className="mt-8 mb-8">
                        <h1 className="text-3xl font-black text-erp-navy tracking-tight">Danh sách cần phê duyệt</h1>
                        <p className="text-sm text-slate-500 mt-1">Bạn đang có {pendingPRs.length} yêu cầu cần xử lý theo đúng SLA.</p>
                    </div>

                    <div className="erp-card !p-0 overflow-hidden shadow-xl shadow-erp-navy/5">
                        <table className="erp-table">
                            <thead>
                                <tr className="bg-slate-50 border-b border-slate-100">
                                    <th className="font-black">Loại/Mã</th>
                                    <th className="font-black">Người tạo</th>
                                    <th className="font-black w-1/3">Tiêu đề (Lý do)</th>
                                    <th className="font-black text-right">Tổng giá trị</th>
                                    <th className="font-black text-center">Thời gian chờ</th>
                                    <th className="font-black text-right">Thao tác</th>
                                </tr>
                            </thead>
                            <tbody>
                                {pendingPRs.length > 0 ? pendingPRs.map((pr, idx: number) => (
                                    <tr key={pr.id} className="hover:bg-slate-50/50 group">
                                        <td>
                                            <div className="font-bold text-erp-navy flex items-center gap-2">
                                                <div className="p-1.5 bg-blue-50 text-erp-blue rounded-lg"><FileText size={14} /></div>
                                                {pr.prNumber || pr.id.substring(0,8)}
                                            </div>
                                        </td>
                                        <td>
                                            <div className="text-sm font-bold text-slate-700">{typeof pr.department === 'object' ? pr.department.name : pr.department}</div>
                                            <div className="text-[10px] text-slate-400">ID: {pr.requester?.fullName || pr.requesterId?.substring(0,8)}</div>
                                        </td>
                                        <td className="max-w-[200px]">
                                            <div className="font-bold text-erp-navy truncate" title={pr.title}>{pr.title}</div>
                                            <div className="text-xs text-slate-500 truncate" title={pr.justification}>{pr.justification}</div>
                                        </td>
                                        <td className="font-mono text-right font-black text-erp-blue text-lg">{formatVND(pr.totalEstimate)} ₫</td>
                                        <td className="text-center">
                                            {idx === 0 ? (
                                                <span className="text-[10px] font-black text-red-500 bg-red-50 px-2 py-1 rounded inline-flex items-center gap-1 border border-red-100"><AlertTriangle size={10} /> 26h (Quá SLA)</span>
                                            ) : (
                                                <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-1 rounded">4h</span>
                                            )}
                                        </td>
                                        <td className="text-right">
                                            <button
                                                onClick={() => setSelectedPR(pr)}
                                                className="px-4 py-2 bg-slate-100 text-erp-navy hover:bg-erp-blue hover:text-white rounded-lg text-xs font-black uppercase tracking-widest transition-all shadow-sm group-hover:shadow"
                                            >
                                                Xem xét
                                            </button>
                                        </td>
                                    </tr>
                                )) : (
                                    <tr>
                                        <td colSpan={6} className="py-20 text-center text-slate-400 font-bold uppercase tracking-widest text-sm">
                                            <div className="flex flex-col items-center justify-center">
                                                <CheckSquare size={48} className="opacity-20 mb-4" />
                                                Không có yêu cầu nào chờ duyệt
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </>
            ) : (
                <div className="animate-in fade-in slide-in-from-right-8 duration-300">
                    <div className="mt-8 flex justify-between items-end mb-6 border-b border-slate-200 pb-4">
                        <div className="flex items-center gap-4">
                            <button onClick={() => setSelectedPR(null)} className="p-2 bg-white border border-slate-200 text-slate-500 hover:bg-slate-100 rounded-xl transition-all shadow-sm">
                                <ArrowLeft size={20} />
                            </button>
                            <div>
                                <h1 className="text-3xl font-black text-erp-navy tracking-tight flex items-center gap-2">Phê duyệt: {selectedPR.id}</h1>
                                <p className="text-sm text-slate-500 mt-1">Kiểm tra thông tin chi tiết trước khi ra quyết định.</p>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                        <div className="xl:col-span-2 space-y-8">
                            {/* Card Thông tin tổng hợp */}
                            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                                <div className="bg-slate-50 px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                                    <h3 className="text-xs font-black uppercase tracking-widest text-erp-navy">Thông tin tổng hợp</h3>
                                </div>
                                <div className="p-6 grid grid-cols-2 md:grid-cols-4 gap-6">
                                    <div className="md:col-span-2 flex items-center gap-4 border-b border-slate-100 pb-4 md:border-none md:pb-0">
                                        <div className="w-12 h-12 rounded-full bg-blue-100 text-erp-blue flex items-center justify-center font-black text-xl">
                                            {(typeof selectedPR.department === 'object' ? selectedPR.department.name : (selectedPR.department || "PR")).substring(0,2).toUpperCase()}
                                        </div>
                                        <div>
                                            <div className="text-[10px] uppercase font-black tracking-widest text-slate-400 mb-0.5">Người tạo</div>
                                            <div className="text-sm font-black text-erp-navy">{typeof selectedPR.department === 'object' ? selectedPR.department.name : selectedPR.department}</div>
                                            <div className="text-[10px] text-slate-500">Gửi lúc: {new Date(selectedPR.createdAt).toLocaleString('vi-VN')}</div>
                                        </div>
                                    </div>
                                    <div>
                                        <div className="text-[10px] uppercase font-black tracking-widest text-slate-400 mb-1">Cost Center</div>
                                        <div className="text-sm font-bold text-erp-navy bg-slate-50 inline-block px-2 py-1 rounded border border-slate-100">{typeof selectedPR.costCenter === 'object' ? selectedPR.costCenter.name : (selectedPR.costCenter || 'N/A')}</div>
                                    </div>
                                    <div>
                                        <div className="text-[10px] uppercase font-black tracking-widest text-slate-400 mb-1">Mức độ ưu tiên</div>
                                        <div className={`text-sm font-black uppercase tracking-wider ${selectedPR.priority.toString() === 'High' ? 'text-red-600' : selectedPR.priority.toString() === 'Urgent' ? 'text-amber-500' : 'text-emerald-500'}`}>
                                            {selectedPR.priority.toString() || 'Normal'}
                                        </div>
                                    </div>
                                    <div className="col-span-2 md:col-span-4 bg-slate-50 p-4 rounded-xl border border-slate-100/50 mt-2">
                                        <div className="text-[10px] uppercase font-black tracking-widest text-slate-400 mb-1">Mô tả / Lý do mua hàng</div>
                                        <div className="text-sm font-black text-erp-navy mb-1">{selectedPR.title}</div>
                                        <div className="text-sm font-medium text-slate-700 italic leading-relaxed">&quot;{selectedPR.justification}&quot;</div>
                                    </div>
                                </div>
                            </div>

                            {/* Danh sách hàng */}
                            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                                <div className="bg-slate-50 px-6 py-4 border-b border-slate-100">
                                    <h3 className="text-xs font-black uppercase tracking-widest text-erp-navy">Danh sách mặt hàng chuẩn bị mua</h3>
                                </div>
                                <table className="erp-table !shadow-none !border-none m-0">
                                    <thead>
                                        <tr className="bg-white border-b border-slate-200">
                                            <th className="w-12 text-center text-[10px]">STT</th>
                                            <th className="text-[10px]">Mô tả hàng hóa</th>
                                            <th className="text-[10px] text-center w-20">SL</th>
                                            <th className="text-[10px] text-center w-20">ĐVT</th>
                                            <th className="text-[10px] text-right w-32">Đơn giá</th>
                                            <th className="text-[10px] text-right w-32">Thành tiền</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {selectedPR.items?.map((item, idx: number) => {
                                            const rowTotal = (Number(item.qty) || Number(item.quantity) || 0) * item.estimatedPrice;
                                            const isSuperHigh = rowTotal >= 100000000;
                                            const isHigh = rowTotal >= 30000000 && !isSuperHigh;
                                            
                                            // Theo mockup 4.2:
                                            // Item >= 30tr tô cam
                                            // Item >= 100tr tô đỏ nhạt + badge 'Cần TGĐ duyệt'
                                            return (
                                                <tr key={idx} className={`border-b border-slate-100 ${isSuperHigh ? 'bg-red-50/70 border-l-4 border-red-500' : isHigh ? 'bg-orange-50/50 border-l-4 border-orange-400' : ''}`}>
                                                    <td className="text-center font-bold text-slate-400">{idx + 1}</td>
                                                    <td className="font-bold text-erp-navy">
                                                        {item.description}
                                                        {isSuperHigh && <span className="ml-2 inline-flex items-center gap-1 text-[9px] font-black uppercase text-red-600 bg-red-100 px-1.5 py-0.5 rounded tracking-tighter"><AlertTriangle size={10} /> Cần TGĐ Duyệt</span>}
                                                    </td>
                                                    <td className="text-center font-black text-erp-blue">{item.qty}</td>
                                                    <td className="text-center font-bold text-slate-500">{item.unit || 'Cái'}</td>
                                                    <td className="text-right font-mono text-slate-500">{formatVND(item.estimatedPrice)}</td>
                                                    <td className={`text-right font-mono font-black ${isSuperHigh ? 'text-red-600' : isHigh ? 'text-orange-600' : 'text-erp-navy'}`}>
                                                        {formatVND(rowTotal)}
                                                    </td>
                                                </tr>
                                            )
                                        })}
                                    </tbody>
                                    <tfoot>
                                        <tr className="bg-slate-50">
                                            <td colSpan={5} className="text-right py-4 cursor-default">
                                                <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">Tổng cộng giá trị PR</div>
                                                <div className="text-[9px] uppercase font-bold text-amber-600 flex justify-end gap-1 mt-1">
                                                    Approval Chain: Trưởng phòng → Giám đốc {Number(selectedPR.totalEstimate) >= 100000000 ? '→ Tổng Giám Đốc' : ''}
                                                </div>
                                            </td>
                                            <td className="text-right font-mono font-black text-2xl text-erp-navy py-4 pr-3">
                                                {formatVND(Number(selectedPR.totalEstimate) || 0)} ₫
                                            </td>
                                        </tr>
                                    </tfoot>
                                </table>
                            </div>
                        </div>

                        {/* Cột phải: Lịch sử & Đính kèm */}
                        <div className="space-y-8">
                            {/* Tài liệu đính kèm */}
                            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                                <h3 className="text-xs font-black uppercase tracking-widest text-erp-navy mb-4 flex items-center gap-2">
                                    <Paperclip size={16} /> Tài liệu đính kèm
                                </h3>
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between p-3 border border-slate-100 rounded-lg hover:border-erp-blue/30 transition-colors group cursor-pointer">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 bg-blue-50 text-erp-blue rounded flex items-center justify-center shrink-0">
                                                <FileText size={14} />
                                            </div>
                                            <div>
                                                <div className="text-xs font-bold text-erp-navy group-hover:text-erp-blue transition-colors">Bao_gia_ncc_A.pdf</div>
                                                <div className="text-[10px] text-slate-400">1.2 MB</div>
                                            </div>
                                        </div>
                                        <Eye size={16} className="text-slate-300 group-hover:text-erp-blue" />
                                    </div>
                                    <div className="flex items-center justify-between p-3 border border-slate-100 rounded-lg hover:border-erp-blue/30 transition-colors group cursor-pointer">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 bg-blue-50 text-erp-blue rounded flex items-center justify-center shrink-0">
                                                <FileText size={14} />
                                            </div>
                                            <div>
                                                <div className="text-xs font-bold text-erp-navy group-hover:text-erp-blue transition-colors">De_xuat_mua.docx</div>
                                                <div className="text-[10px] text-slate-400">450 KB</div>
                                            </div>
                                        </div>
                                        <Eye size={16} className="text-slate-300 group-hover:text-erp-blue" />
                                    </div>
                                </div>
                            </div>

                            {/* Lịch sử duyệt */}
                            <div className="bg-slate-50 rounded-xl shadow-sm border border-slate-200 p-6 relative">
                                <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-6 flex items-center gap-2">
                                    <History size={14} /> Lịch sử duyệt trước đó
                                </h3>
                                <div className="space-y-6 relative before:absolute before:inset-0 before:ml-2 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 md:before:left-2 md:-left-2 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-emerald-400 before:via-slate-200 before:to-transparent">
                                    
                                    <div className="relative flex items-center group">
                                        <div className="flex items-center justify-center w-4 h-4 rounded-full bg-emerald-500 border-2 border-white shadow-sm shrink-0 z-10 mr-4"></div>
                                        <div className="bg-white p-3 rounded-xl border border-emerald-100 shadow-sm w-full">
                                            <div className="flex justify-between items-start mb-1">
                                                <div className="text-[10px] font-black uppercase text-emerald-600">Phó Quản đốc</div>
                                                <div className="text-[9px] text-slate-400 font-bold">14/03 09:30 AM</div>
                                            </div>
                                            <div className="text-xs font-bold text-erp-navy mb-1">Tran Van B (Đã duyệt)</div>
                                            <div className="text-[10px] italic text-slate-600 bg-emerald-50/50 p-2 rounded">&quot;Đồng ý đề xuất, cần hàng gấp cho dự án.&quot;</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Khu vực Action (Floating Bottom or Static Bottom) */}
                    <div className="mt-8 bg-white border border-slate-200 rounded-2xl shadow-xl shadow-erp-navy/5 p-6 md:flex gap-8">
                        <div className="flex-1 space-y-3 mb-6 md:mb-0">
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Ghi chú phê duyệt (Tùy chọn cho Approve, Bắt buộc cho Reject)</label>
                            <textarea 
                                className="erp-input w-full h-24 resize-none leading-relaxed text-sm bg-slate-50 focus:bg-white"
                                placeholder="Nhập lý do, ý kiến bảo lưu hoặc ghi chú bổ sung..."
                                value={memo}
                                onChange={e => setMemo(e.target.value)}
                            />
                        </div>
                        
                        <div className="flex-1 flex flex-col justify-end gap-3 md:max-w-xs">
                            {actionType && actionType !== "APPROVE" ? (
                                <div className="animate-in fade-in slide-in-from-right-4">
                                    <div className="mb-3 text-xs font-bold text-slate-600 text-center">
                                        Bạn đang chọn: <span className={actionType === 'REJECT' ? 'text-red-600 font-black' : 'text-amber-600 font-black'}>{actionType === 'REJECT' ? 'TỪ CHỐI' : 'YÊU CẦU BỔ SUNG'}</span>
                                    </div>
                                    <button 
                                        onClick={() => handleAction()} 
                                        disabled={isSubmitting}
                                        className={`w-full py-3.5 rounded-xl font-black uppercase tracking-widest text-xs flex items-center justify-center gap-2 text-white shadow-lg transition-all ${
                                            actionType === 'REJECT' 
                                            ? 'bg-red-600 hover:bg-red-700 shadow-red-600/30' 
                                            : 'bg-amber-500 hover:bg-amber-600 shadow-amber-500/30'
                                        }`}
                                    >
                                        {isSubmitting ? 'Đang xử lý...' : 'Xác nhận Thao tác'}
                                    </button>
                                    <button onClick={() => setActionType(null)} className="w-full mt-2 py-2 text-[10px] font-bold uppercase text-slate-400 hover:text-slate-600 underline">Hủy thay đổi</button>
                                </div>
                            ) : (
                                <>
                                    <button 
                                        onClick={() => handleAction("APPROVE")}
                                        disabled={isSubmitting}
                                        className="w-full py-4 rounded-xl font-black uppercase tracking-widest text-xs flex items-center justify-center gap-2 text-white bg-emerald-500 hover:bg-emerald-600 shadow-lg shadow-emerald-500/30 transition-all"
                                    >
                                        <Check size={18} /> Phê Duyệt Ngay
                                    </button>
                                    <div className="flex gap-3">
                                        <button 
                                            onClick={() => setActionType("MORE_INFO")}
                                            className="flex-1 py-3 rounded-xl font-black uppercase tracking-widest text-[10px] flex items-center justify-center gap-1.5 text-amber-600 bg-amber-50 border border-amber-200 hover:bg-amber-100 transition-all"
                                        >
                                            <MessageSquareWarning size={14} /> Bổ sung
                                        </button>
                                        <button 
                                            onClick={() => setActionType("REJECT")}
                                            className="flex-1 py-3 rounded-xl font-black uppercase tracking-widest text-[10px] flex items-center justify-center gap-1.5 text-red-600 bg-red-50 border border-red-200 hover:bg-red-100 transition-all"
                                        >
                                            <XCircle size={14} /> Từ chối
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </main>
    );
}
