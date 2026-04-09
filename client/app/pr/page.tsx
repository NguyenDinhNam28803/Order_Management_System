"use client";

import React from "react";
import { useProcurement, PR } from "../context/ProcurementContext";
import ERPTable, { ERPTableColumn } from "../components/shared/ERPTable";
import { Plus, FileText, Send,  Check, X } from "lucide-react";
import Link from "next/link";
import { ApprovalWorkflow } from "../context/ProcurementContext";

export default function PRPage() {
    const { prs, myPrs, currentUser, actionApproval, costCenters, approvals, submitPR } = useProcurement();
    const [activeTab, setActiveTab] = React.useState("Tất cả");

    const formatDate = (ds?: string) => {
        if (!ds) return "N/A";
        const d = new Date(ds);
        if (isNaN(d.getTime())) return ds;
        return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
    };

    const isManager = currentUser?.role === "DEPT_APPROVER";
    const isDirector = currentUser?.role === "DIRECTOR";
    
    let budgetSubtitle = "Yêu cầu tiêu chuẩn";
    if (isManager) budgetSubtitle = "Yêu cầu cấp Quản lý";
    if (isDirector) budgetSubtitle = "Yêu cầu cấp Giám đốc";

    const tabs = ["Tất cả", "Nháp", "Chờ duyệt", "Đã duyệt"];
    if (isManager || isDirector) tabs.push("Phê duyệt");

    const displayData: PR[] = React.useMemo(() => {
        if (!prs || !myPrs) return [];
        
        const userRole = currentUser?.role;
        const isProcOrAdmin = userRole === "PROCUREMENT" || userRole === "PLATFORM_ADMIN";

        if (activeTab === "Phê duyệt") {
            const pendingPrIds = (approvals || []).map((a: ApprovalWorkflow) => a.documentId);
            return prs.filter((p: PR) => pendingPrIds.includes(p.id));
        }
        
        const pool = isProcOrAdmin ? prs : myPrs;
        
        if (activeTab === "Nháp") return pool.filter((p: PR) => p.status === "DRAFT");
        if (activeTab === "Chờ duyệt") return pool.filter((p: PR) => p.status.includes("PENDING"));
        if (activeTab === "Đã duyệt") return pool.filter((p: PR) => p.status === "APPROVED");
        
        return pool;
    }, [prs, myPrs, activeTab, approvals, currentUser?.role]);

    const columns: ERPTableColumn<PR>[] = [
        { 
            label: "Mã PR", 
            key: "id", 
            render: (row: PR) => (
                <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-lg bg-[#3B82F6]/10 text-[#3B82F6] flex items-center justify-center border border-[#3B82F6]/20">
                        <FileText size={16} />
                    </div>
                    <span className="font-bold text-[#F8FAFC] tracking-tight">{row.prNumber || row.id.substring(0,8)}</span>
                </div>
            ) 
        },
        { 
            label: "Bộ phận / Cost Center", 
            key: "department", 
            render: (row: PR) => {
                let deptName = typeof row.department === 'object' ? row.department.name : row.department;
                if (!deptName && costCenters) {
                    const match = costCenters.find((cc) =>
                        cc.deptId === row.deptId || 
                        cc.id === row.costCenterId
                    );
                    if (match) deptName = match.name || match.deptId;
                }
                if (!deptName) deptName = "Phòng CNTT & Hệ thống";

                return (
                    <div className="flex flex-col">
                        <span className="text-sm font-semibold text-[#F8FAFC]">{deptName}</span>
                        <span className="text-[10px] text-[#64748B] font-bold uppercase tracking-wider mt-0.5">
                            {row.costCenterId || "CC_GLOBAL"}
                        </span>
                    </div>
                );
            }
        },
        { 
            label: "Mục đích sử dụng", 
            key: "title",
            render: (row: PR) => (
                <div className="max-w-[280px]">
                    <p className="text-sm font-semibold text-[#F8FAFC] truncate">{row.title}</p>
                    <p className="text-[11px] text-[#64748B] italic font-medium truncate mt-0.5">{row.description || "—"}</p>
                </div>
            )
        },
        { 
            label: "Trạng thái", 
            key: "status", 
            render: (row: PR) => {
                const status = row.status || 'DRAFT';
                let cls = 'px-2 py-0.5 rounded text-[10px] font-bold uppercase border ';
                if (status === 'DRAFT') cls += 'bg-[#161922] text-[#64748B] border-[rgba(148,163,184,0.1)]';
                if (status.includes('PENDING')) cls += 'bg-[#3B82F6]/10 text-[#3B82F6] border-[#3B82F6]/20';
                if (status === 'APPROVED') cls += 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
                if (status === 'REJECTED') cls += 'bg-rose-500/10 text-rose-400 border-rose-500/20';
                
                return (
                    <span className={cls}>
                        {status.replace(/_/g, ' ')}
                    </span>
                );
            }
        },
        { 
            label: "Ngân sách (VND)", 
            key: "totalEstimate", 
            render: (row: PR) => (
                <span className="font-bold text-[#F8FAFC]">
                    {Number(row.totalEstimate || 0).toLocaleString()} ₫
                </span>
            ) 
        },
        { 
            label: "Thao tác", 
            render: (row: PR) => {
                const handleAction = (prId: string, action: 'APPROVE' | 'REJECT') => {
                    const step = (approvals as ApprovalWorkflow[]).find(a => a.documentId === prId);
                    if (step) {
                        actionApproval(step.id, action);
                    }
                };
                
                return (
                    <div className="flex gap-2 justify-end pr-4">
                        <Link 
                            href={`/pr/${row.id}`}
                            className="p-1.5 rounded-lg bg-[#0F1117] text-[#64748B] hover:text-[#3B82F6] hover:bg-[#3B82F6]/10 border border-[rgba(148,163,184,0.1)] transition-all shadow-sm"
                            title="Xem chi tiết PR"
                        >
                            <FileText size={16} />
                        </Link>
                        {activeTab === "Phê duyệt" ? (
                            <div className="flex gap-1.5">
                                <button 
                                    onClick={() => handleAction(row.id, 'APPROVE')}
                                    className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500 hover:text-white border border-emerald-500/20 transition-all"
                                >
                                    <Check size={16} />
                                </button>
                                <button 
                                    onClick={() => handleAction(row.id, 'REJECT')}
                                    className="p-1.5 rounded-lg bg-rose-500/10 text-rose-400 hover:bg-rose-500 hover:text-white border border-rose-500/20 transition-all"
                                >
                                    <X size={16} />
                                </button>
                            </div>
                        ) : (
                            <>
                                {row.status === 'DRAFT' && (
                                    <>
                                        <button 
                                            className="p-1.5 rounded-lg bg-[#0F1117] text-[#64748B] hover:text-amber-500 hover:bg-amber-500/10 border border-[rgba(148,163,184,0.1)] transition-all shadow-sm"
                                            title="Sửa PR"
                                        >
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/></svg>
                                        </button>
                                        <button 
                                            className="p-1.5 rounded-lg bg-[#0F1117] text-[#64748B] hover:text-rose-500 hover:bg-rose-500/10 border border-[rgba(148,163,184,0.1)] transition-all shadow-sm"
                                            title="Xóa PR"
                                        >
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M10 11v6M14 11v6"/></svg>
                                        </button>
                                        <button 
                                            onClick={() => submitPR(row.id)}
                                            className="py-1.5 px-4 text-[11px] whitespace-nowrap bg-[#3B82F6] text-white rounded-lg font-bold uppercase tracking-wider shadow-lg shadow-[#3B82F6]/20 hover:bg-[#2563EB] transition-all flex items-center gap-2"
                                        >
                                            <Send size={14} /> Gửi duyệt
                                        </button>
                                    </>
                                )}
                                {row.status.includes('PENDING') && (
                                    <span className="text-[10px] font-bold text-[#64748B] bg-[#0F1117] px-3 py-1 rounded-lg border border-[rgba(148,163,184,0.1)]">
                                        Đang thẩm định
                                    </span>
                                )}
                            </>
                        )}
                    </div>
                );
            }
        }
    ];

    return (
        <main className="animate-in fade-in duration-500 min-h-screen bg-[#0F1117] text-[#F8FAFC]">
            <header className="mt-8 flex items-center justify-between border-b border-[rgba(148,163,184,0.1)] pb-8 mb-8 px-6">
                <div>
                    <h1 className="text-3xl font-black text-[#F8FAFC] tracking-tight">
                        {currentUser?.role === "PROCUREMENT" ? "Toàn bộ Yêu cầu PR" : "Yêu cầu mua sắm của tôi"}
                    </h1>
                    <p className="text-sm font-medium text-[#64748B] mt-1">Quản lý và theo dõi tiến độ phê duyệt định mức mua sắm tập trung.</p>
                </div>
                {currentUser?.role !== "PROCUREMENT" && currentUser?.role !== "PLATFORM_ADMIN" && (
                    <Link href="/pr/create" className="py-3 px-6 bg-[#3B82F6] text-white rounded-xl font-black uppercase tracking-wider text-xs shadow-lg shadow-[#3B82F6]/20 hover:bg-[#2563EB] transition-all flex flex-col items-center">
                        <div className="flex items-center gap-2">
                            <Plus size={18} />
                            <span className="text-sm font-semibold">Tạo yêu cầu mới</span>
                        </div>
                    </Link>
                )}
            </header>

            <div className="bg-[#161922] rounded-3xl border border-[rgba(148,163,184,0.1)] shadow-xl shadow-[#3B82F6]/5 overflow-hidden mx-6">
                <div className="p-5 bg-[#0F1117] border-b border-[rgba(148,163,184,0.1)] flex items-center justify-between">
                    <div className="flex items-center gap-6">
                        <div className="text-xs font-black text-[#64748B] uppercase tracking-widest px-2">Bộ lọc nhanh</div>
                        <div className="flex gap-2">
                            {tabs.map(filter => (
                                <button 
                                    key={filter} 
                                    onClick={() => setActiveTab(filter)}
                                    className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                                        activeTab === filter 
                                        ? "bg-[#3B82F6] text-white shadow-lg shadow-[#3B82F6]/20" 
                                        : "text-[#64748B] hover:text-[#F8FAFC] hover:bg-[#0F1117]"
                                    }`}
                                >
                                    {filter}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
                
                <ERPTable columns={columns} data={displayData} />
                
                {displayData.length === 0 && (
                    <div className="p-20 text-center flex flex-col items-center justify-center space-y-4">
                        <div className="h-16 w-16 rounded-2xl bg-[#0F1117] flex items-center justify-center text-[#64748B] border border-[rgba(148,163,184,0.1)]">
                            <FileText size={28} />
                        </div>
                        <div>
                            <h3 className="font-bold text-[#F8FAFC]">Thông tin trống</h3>
                            <p className="text-[#64748B] text-sm">Chưa có yêu cầu nào được thiết lập cho mục này.</p>
                        </div>
                    </div>
                )}
            </div>
        </main>
    );
}
