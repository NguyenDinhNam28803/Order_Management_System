"use client";

import React from "react";
import { useProcurement } from "../context/ProcurementContext";
import ERPTable from "../components/shared/ERPTable";
import { Plus, FileText, Send, CheckCircle2, Check, X } from "lucide-react";
import Link from "next/link";

interface PR {
  id: string;
  prNumber?: string;
  title?: string;
  reason?: string;
  description?: string;
  status: string;
  totalEstimate?: number;
  total?: number;
  department?: { name: string } | string;
  costCenter?: { code: string };
  creatorRole: string;
}

export default function PRPage() {
    const { prs, myPrs, approvePR, currentUser, actionApproval, costCenters, approvals } = useProcurement();
    const [activeTab, setActiveTab] = React.useState("Tất cả");

    const isManager = currentUser?.role === "DEPT_APPROVER";
    const isDirector = currentUser?.role === "DIRECTOR";
    
    let budgetSubtitle = "Yêu cầu < 5,000,000 VNĐ";
    if (isManager) budgetSubtitle = "Yêu cầu 5,000,000 - < 50,000,000 VNĐ";
    if (isDirector) budgetSubtitle = "Yêu cầu 50,000,000 - 200,000,000 VNĐ";

    const tabs = ["Tất cả", "Nháp", "Chờ duyệt", "Đã duyệt"];
    if (isManager || isDirector) tabs.push("PHÊ DUYỆT PR");

    const displayData: PR[] = React.useMemo(() => {
        if (!prs || !myPrs) return [];
        
        if (activeTab === "PHÊ DUYỆT PR") {
            // Show PRs that have a pending approval step assigned to the current user
            const pendingPrIds = (approvals || []).map((a: any) => a.documentId);
            return prs.filter((p: PR) => pendingPrIds.includes(p.id));
        }
        
        // Use myPrs for all other tabs as requested (nối api /my)
        const filtered = myPrs;
        
        if (activeTab === "Nháp") return filtered.filter((p: PR) => p.status === "DRAFT");
        if (activeTab === "Chờ duyệt") return filtered.filter((p: PR) => p.status.includes("PENDING"));
        if (activeTab === "Đã duyệt") return filtered.filter((p: PR) => p.status === "APPROVED");
        
        return filtered;
    }, [prs, myPrs, activeTab, isManager, isDirector, currentUser, approvals]);

    const columns = [
        { 
            label: "Mã PR", 
            key: "id", 
            render: (row: PR) => (
                <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded bg-slate-100 flex items-center justify-center text-slate-500">
                        <FileText size={16} />
                    </div>
                    <span className="font-black text-erp-navy tracking-tight">{row.prNumber || row.id.substring(0,8)}</span>
                </div>
            ) 
        },
        { 
            label: "Phòng ban", 
            key: "department", 
            render: (row: any) => {
                // Try to find the department name from various sources
                let deptName = typeof row.department === 'string' ? row.department : row.department?.name;
                
                // If still missing, cross-reference with costCenters using deptId or costCenterId
                if (!deptName && costCenters) {
                    const match = costCenters.find((cc: any) => 
                        cc.deptId === row.deptId || 
                        cc.id === row.costCenterId || 
                        cc.code === row.costCenterCode
                    );
                    if (match) deptName = match.name || match.departmentName;
                }

                // Final fallback based on common data in the demo
                if (!deptName) deptName = "Information Technology";

                return (
                    <div className="flex flex-col">
                        <span className="text-sm font-bold text-slate-700">{deptName}</span>
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">
                            CC: {row.costCenter?.code || row.costCenterCode || "Default"}
                        </span>
                    </div>
                );
            }
        },
        { 
            label: "Mô tả / Lý do", 
            key: "title",
            render: (row: PR) => (
                <div className="max-w-[300px]">
                    <p className="text-sm font-bold text-slate-700 truncate">{row.title}</p>
                    <p className="text-[10px] text-slate-400 italic font-medium truncate mt-0.5">{row.reason || row.description || "No description provided"}</p>
                </div>
            )
        },
        { 
            label: "Trạng thái", 
            key: "status", 
            render: (row: PR) => {
                const status = row.status || 'DRAFT';
                let variant = 'slate';
                if (status === 'DRAFT') variant = 'slate';
                if (status.includes('PENDING')) variant = 'amber';
                if (status === 'APPROVED') variant = 'emerald';
                if (status === 'REJECTED') variant = 'red';
                if (status === 'IN_SOURCING') variant = 'blue';
                
                return (
                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-${variant}-50 text-${variant}-600 border border-${variant}-100`}>
                        {status.replace(/_/g, ' ')}
                    </span>
                );
            }
        },
        { 
            label: "Tổng ước tính", 
            key: "total", 
            render: (row: PR) => (
                <span className="font-black text-erp-navy font-mono">
                    {Number(row.totalEstimate || row.total || 0).toLocaleString()} ₫
                </span>
            ) 
        },
        { 
            label: "Hành động", 
            key: "actions", 
            render: (row: PR) => {
                const handleAction = (prId: string, action: 'APPROVE' | 'REJECT') => {
                    const step = (approvals as any[]).find(a => a.documentId === prId);
                    if (step) {
                        actionApproval(step.id, action);
                    } else {
                        console.error("No pending approval found for PR", prId);
                    }
                };
                
                return (
                    <div className="flex gap-2">
                        {activeTab === "PHÊ DUYỆT PR" ? (
                            <div className="flex gap-2">
                                <button 
                                    onClick={() => handleAction(row.id, 'APPROVE')}
                                    className="h-8 w-8 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center hover:bg-emerald-500 hover:text-white transition-all shadow-sm"
                                >
                                    <Check size={16} strokeWidth={3} />
                                </button>
                                <button 
                                    onClick={() => handleAction(row.id, 'REJECT')}
                                    className="h-8 w-8 rounded-lg bg-red-100 text-red-600 flex items-center justify-center hover:bg-red-500 hover:text-white transition-all shadow-sm"
                                >
                                    <X size={16} strokeWidth={3} />
                                </button>
                            </div>
                        ) : (
                            <>
                                {row.status === 'DRAFT' && (
                                    <button 
                                        onClick={() => approvePR(row.id)}
                                        className="inline-flex items-center gap-2 bg-erp-navy text-white px-4 py-2 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-800 transition-all shadow-lg shadow-erp-navy/20 active:scale-95 whitespace-nowrap"
                                    >
                                        <Send size={14} /> Gửi duyệt
                                    </button>
                                )}
                                {row.status.includes('PENDING') && (
                                    <span className="inline-flex items-center gap-2 bg-amber-50 text-amber-600 px-4 py-2 rounded-xl font-black text-[10px] uppercase tracking-widest border border-amber-100 shadow-sm whitespace-nowrap">
                                        Đang chờ xử lý
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
        <div className="space-y-8 animate-in fade-in duration-500">
            <header className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-black text-erp-navy tracking-tight uppercase">Yêu cầu mua sắm của tôi (PR)</h1>
                    <p className="text-sm text-slate-400 font-bold mt-1 tracking-tight">HỆ THỐNG QUẢN LÝ VÀ CHUẨN HÓA QUY TRÌNH MUA HÀNG</p>
                </div>
                <Link href="/pr/create" className="btn-primary flex flex-col items-center py-2!">
                    <div className="flex items-center gap-2">
                        <Plus size={20} />
                        <span className="text-sm font-black uppercase">Tạo PR mới</span>
                    </div>
                    <span className="text-[10px] opacity-70 font-bold">{budgetSubtitle}</span>
                </Link>
            </header>

            <div className="bg-white rounded-3xl border border-slate-100 shadow-xl shadow-erp-navy/5 overflow-hidden">
                <div className="p-6 border-b border-slate-50 bg-slate-50/30 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="text-xs font-black text-slate-500 uppercase tracking-widest border-r border-slate-200 pr-4">Bộ lọc danh sách</div>
                        <div className="flex gap-2">
                            {tabs.map(filter => (
                                <button 
                                    key={filter} 
                                    onClick={() => setActiveTab(filter)}
                                    className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase transition-all ${
                                        activeTab === filter 
                                        ? "bg-erp-navy text-white shadow-lg shadow-erp-navy/20" 
                                        : "bg-white border border-slate-200 text-slate-400 hover:border-erp-blue hover:text-erp-blue"
                                    }`}
                                >
                                    {filter}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
                <ERPTable columns={columns} data={displayData} />
                {(!displayData || displayData.length === 0) && (
                    <div className="p-20 text-center flex flex-col items-center justify-center space-y-4">
                        <div className="h-20 w-20 rounded-3xl bg-slate-50 flex items-center justify-center text-slate-200">
                            <FileText size={40} />
                        </div>
                        <div>
                            <h3 className="text-lg font-black text-erp-navy">Không có yêu cầu nào cần xử lý</h3>
                            <p className="text-slate-400 text-sm">Tất cả các yêu cầu đã được xử lý hoặc chưa có dữ liệu mới.</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
