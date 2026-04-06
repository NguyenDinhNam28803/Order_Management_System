"use client";

import React from "react";
import { useProcurement, PR } from "../context/ProcurementContext";
import ERPTable, { ERPTableColumn } from "../components/shared/ERPTable";
import { Plus, FileText, Send,  Check, X } from "lucide-react";
import Link from "next/link";
import { ApprovalWorkflow } from "../context/ProcurementContext";
import DashboardHeader from "../components/DashboardHeader";

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
                    <div className="h-9 w-9 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-100">
                        <FileText size={16} />
                    </div>
                    <span className="font-bold text-slate-900 tracking-tight">{row.prNumber || row.id.substring(0,8)}</span>
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
                        <span className="text-sm font-semibold text-slate-800">{deptName}</span>
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">
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
                    <p className="text-sm font-semibold text-slate-800 truncate">{row.title}</p>
                    <p className="text-[11px] text-slate-500 italic font-medium truncate mt-0.5">{row.description || "—"}</p>
                </div>
            )
        },
        { 
            label: "Trạng thái", 
            key: "status", 
            render: (row: PR) => {
                const status = row.status || 'DRAFT';
                let cls = 'status-draft';
                if (status.includes('PENDING')) cls = 'status-pending';
                if (status === 'APPROVED') cls = 'status-approved';
                if (status === 'REJECTED') cls = 'status-rejected';
                
                return (
                    <span className={`status-pill ${cls} px-2 py-0.5 text-[10px]`}>
                        {status.replace(/_/g, ' ')}
                    </span>
                );
            }
        },
        { 
            label: "Ngân sách (VND)", 
            key: "totalEstimate", 
            render: (row: PR) => (
                <span className="font-bold text-slate-900 font-mono">
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
                        {activeTab === "Phê duyệt" ? (
                            <div className="flex gap-1.5">
                                <button 
                                    onClick={() => handleAction(row.id, 'APPROVE')}
                                    className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white border border-emerald-100 transition-all"
                                >
                                    <Check size={16} />
                                </button>
                                <button 
                                    onClick={() => handleAction(row.id, 'REJECT')}
                                    className="p-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-600 hover:text-white border border-red-100 transition-all"
                                >
                                    <X size={16} />
                                </button>
                            </div>
                        ) : (
                            <>
                                {row.status === 'DRAFT' && (
                                    <button 
                                        onClick={() => submitPR(row.id)}
                                        className="btn-primary py-1.5 px-4 text-[11px] whitespace-nowrap shadow-md shadow-indigo-100"
                                    >
                                        <Send size={14} /> Gửi duyệt
                                    </button>
                                )}
                                {row.status.includes('PENDING') && (
                                    <span className="text-[10px] font-bold text-slate-400 bg-slate-50 px-3 py-1 rounded-lg border border-slate-200">
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
        <main className="pt-20 px-8 pb-12 bg-slate-50 min-h-screen animate-in fade-in duration-500">
            <DashboardHeader breadcrumbs={["Nghiệp vụ", "Yêu cầu mua sắm"]} />

            <header className="mt-8 flex items-center justify-between border-b border-slate-200 pb-8 mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
                        {currentUser?.role === "PROCUREMENT" ? "Toàn bộ Yêu cầu PR" : "Yêu cầu mua sắm của tôi"}
                    </h1>
                    <p className="text-sm font-medium text-slate-500 mt-1">Quản lý và theo dõi tiến độ phê duyệt định mức mua sắm tập trung.</p>
                </div>
                {currentUser?.role !== "PROCUREMENT" && currentUser?.role !== "PLATFORM_ADMIN" && (
                    <Link href="/pr/create" className="btn-primary py-3 px-6 flex flex-col items-center">
                        <div className="flex items-center gap-2">
                            <Plus size={18} />
                            <span className="text-sm font-semibold">Tạo yêu cầu mới</span>
                        </div>
                    </Link>
                )}
            </header>

            <div className="erp-card !p-0 overflow-hidden bg-white shadow-sm border border-slate-200">
                <div className="p-5 bg-slate-50/50 border-b border-slate-200 flex items-center justify-between">
                    <div className="flex items-center gap-6">
                        <div className="text-xs font-bold text-slate-400 uppercase tracking-widest px-2">Bộ lọc nhanh</div>
                        <div className="flex gap-2">
                            {tabs.map(filter => (
                                <button 
                                    key={filter} 
                                    onClick={() => setActiveTab(filter)}
                                    className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                                        activeTab === filter 
                                        ? "bg-white text-indigo-600 shadow-sm border border-slate-200" 
                                        : "text-slate-500 hover:text-indigo-600"
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
                        <div className="h-16 w-16 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-200 border border-slate-100">
                            <FileText size={28} />
                        </div>
                        <div>
                            <h3 className="font-bold text-slate-900">Thông tin trống</h3>
                            <p className="text-slate-500 text-sm">Chưa có yêu cầu nào được thiết lập cho mục này.</p>
                        </div>
                    </div>
                )}
            </div>
        </main>
    );
}
