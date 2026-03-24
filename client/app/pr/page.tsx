"use client";

import React from "react";
import { useProcurement } from "../context/ProcurementContext";
import ERPTable from "../components/shared/ERPTable";
import { Plus, FileText, Send, CheckCircle2 } from "lucide-react";
import Link from "next/link";

export default function PRPage() {
    const { prs, approvePR } = useProcurement();

    const columns = [
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        { 
            label: "Mã PR", 
            key: "id", 
            render: (row: any) => (
                <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded bg-slate-100 flex items-center justify-center text-slate-500">
                        <FileText size={16} />
                    </div>
                    <span className="font-black text-erp-navy tracking-tight">{row.prNumber || row.id}</span>
                </div>
            ) 
        },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        { 
            label: "Phòng ban", 
            key: "department", 
            render: (row: any) => (
                <div className="flex flex-col">
                    <span className="text-sm font-bold text-slate-700">{row.department?.name || row.department || "N/A"}</span>
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">Cost Center: {row.costCenter?.code || "Default"}</span>
                </div>
            )
        },
        { 
            label: "Mô tả / Lý do", 
            key: "reason",
            render: (row: any) => (
                <div className="max-w-md truncate text-slate-600 font-medium italic">
                    {row.title || row.reason || "Không có mô tả"}
                </div>
            )
        },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        { 
            label: "Trạng thái", 
            key: "status", 
            render: (row: any) => (
                <span className={`status-pill status-${(row.status || 'draft').toLowerCase()}`}>
                    {row.status}
                </span>
            ) 
        },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        { 
            label: "Tổng ước tính", 
            key: "total", 
            render: (row: any) => (
                <span className="font-black text-erp-navy font-mono">
                    {Number(row.totalEstimate || row.total || 0).toLocaleString()} ₫
                </span>
            ) 
        },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        { 
            label: "Hành động", 
            key: "actions", 
            render: (row: any) => (
                <div className="flex gap-2">
                    {row.status === 'DRAFT' && (
                        <button 
                            onClick={() => approvePR(row.id)} 
                            className="btn-primary !py-1.5 !px-4 !text-[10px]"
                        >
                            <Send size={12} /> Gửi duyệt
                        </button>
                    )}
                    {row.status === 'PENDING' && (
                        <span className="text-[10px] font-black text-amber-500 uppercase tracking-widest bg-amber-50 px-3 py-1.5 rounded-lg border border-amber-100">
                            Đang chờ xử lý
                        </span>
                    )}
                    {row.status === 'APPROVED' && (
                        <div className="flex items-center gap-1 text-emerald-500 font-black text-[10px] uppercase tracking-widest">
                            <CheckCircle2 size={14} /> Đã phê duyệt
                        </div>
                    )}
                </div>
            )
        }
    ];

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <header className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-black text-erp-navy tracking-tight uppercase">Yêu cầu mua sắm (PR)</h1>
                    <p className="text-sm text-slate-400 font-bold mt-1 tracking-tight">HỆ THỐNG QUẢN LÝ VÀ CHUẨN HÓA QUY TRÌNH MUA HÀNG</p>
                </div>
                <Link href="/pr/create" className="btn-primary">
                    <Plus size={20} />
                    Tạo PR mới
                </Link>
            </header>

            <div className="bg-white rounded-3xl border border-slate-100 shadow-xl shadow-erp-navy/5 overflow-hidden">
                <div className="p-6 border-b border-slate-50 bg-slate-50/30 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="text-xs font-black text-slate-500 uppercase tracking-widest border-r border-slate-200 pr-4">Bộ lọc danh sách</div>
                        <div className="flex gap-2">
                            {["Tất cả", "Nháp", "Chờ duyệt", "Đã duyệt"].map(filter => (
                                <button key={filter} className="px-4 py-1.5 bg-white border border-slate-200 rounded-full text-[10px] font-black uppercase text-slate-400 hover:border-erp-blue hover:text-erp-blue transition-colors">
                                    {filter}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
                <ERPTable columns={columns} data={prs} />
                {(!prs || prs.length === 0) && (
                    <div className="p-20 text-center flex flex-col items-center justify-center space-y-4">
                        <div className="h-20 w-20 rounded-3xl bg-slate-50 flex items-center justify-center text-slate-200">
                            <FileText size={40} />
                        </div>
                        <div>
                            <h3 className="text-lg font-black text-erp-navy">Không có dữ liệu PR nào</h3>
                            <p className="text-slate-400 text-sm">Hãy tạo yêu cầu mua hàng đầu tiên để bắt đầu quy trình.</p>
                        </div>
                        <Link href="/pr/create" className="btn-secondary">
                             Tạo ngay
                        </Link>
                    </div>
                )}
            </div>
        </div>
    );
}
