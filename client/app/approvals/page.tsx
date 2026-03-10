"use client";

import React, { useState } from "react";
import DashboardHeader from "../components/DashboardHeader";
import { CheckSquare, XCircle, CheckCircle2, Eye, UserCheck, ShieldCheck } from "lucide-react";
import { useProcurement } from "../context/ProcurementContext";

export default function ApprovalsPage() {
    const { prs, approvePR } = useProcurement();
    const pendingPRs = prs.filter(pr => pr.status === "PENDING");

    const [selectedPR, setSelectedPR] = useState<any>(null);

    return (
        <main className="pt-16 px-8 pb-12">
            <DashboardHeader breadcrumbs={["Hệ thống", "Phê duyệt"]} />

            <div className="mt-8 mb-8">
                <h1 className="text-3xl font-black text-erp-navy tracking-tight">Danh sách chờ phê duyệt</h1>
                <p className="text-sm text-slate-500 mt-1">Bạn đang có {pendingPRs.length} yêu cầu cần xử lý.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-6">
                    <div className="erp-card !p-0 overflow-hidden">
                        <table className="erp-table">
                            <thead>
                                <tr>
                                    <th>Mã PR</th>
                                    <th>Bộ phận</th>
                                    <th>Giá trị</th>
                                    <th>Độ ưu tiên</th>
                                    <th className="text-right">Thao tác</th>
                                </tr>
                            </thead>
                            <tbody>
                                {pendingPRs.length > 0 ? pendingPRs.map(pr => (
                                    <tr key={pr.id} className={selectedPR?.id === pr.id ? 'bg-blue-50/50' : ''}>
                                        <td className="font-bold text-erp-navy">{pr.id}</td>
                                        <td>{pr.department}</td>
                                        <td className="font-mono">{pr.total.toLocaleString()} ₫</td>
                                        <td>
                                            <span className={`status-pill ${pr.priority === 'Critical' ? 'status-rejected' :
                                                    pr.priority === 'Urgent' ? 'status-pending' : 'status-draft'
                                                }`}>
                                                {pr.priority}
                                            </span>
                                        </td>
                                        <td className="text-right">
                                            <button
                                                onClick={() => setSelectedPR(pr)}
                                                className="p-2 text-erp-blue hover:bg-blue-100 rounded-lg transition-all"
                                            >
                                                <Eye size={18} />
                                            </button>
                                        </td>
                                    </tr>
                                )) : (
                                    <tr>
                                        <td colSpan={5} className="py-20 text-center text-slate-400 font-bold uppercase tracking-widest">
                                            Không có yêu cầu nào chờ duyệt
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className="space-y-6">
                    {selectedPR ? (
                        <div className="erp-card animate-in slide-in-from-right duration-300">
                            <h3 className="text-sm font-black uppercase tracking-widest text-erp-navy mb-6 flex items-center gap-2">
                                <ShieldCheck size={18} /> Chi tiết phê duyệt
                            </h3>
                            <div className="space-y-4 mb-8">
                                <div className="flex justify-between text-xs">
                                    <span className="text-slate-400 font-bold">Người yêu cầu:</span>
                                    <span className="font-black text-erp-navy">Jonathan Doe</span>
                                </div>
                                <div className="flex justify-between text-xs">
                                    <span className="text-slate-400 font-bold">Ngày tạo:</span>
                                    <span className="font-black text-erp-navy">{selectedPR.createdAt}</span>
                                </div>
                                <div className="pt-4 border-t border-slate-50">
                                    <p className="text-xs text-slate-600 italic">"{selectedPR.reason || 'Không có ghi chú'}"</p>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <button
                                    onClick={() => {
                                        approvePR(selectedPR.id);
                                        setSelectedPR(null);
                                    }}
                                    className="w-full btn-primary bg-emerald-500 shadow-emerald-100 flex items-center justify-center gap-2"
                                >
                                    <CheckCircle2 size={18} /> Phê duyệt ngay
                                </button>
                                <button className="w-full btn-secondary text-red-600 border-red-50 hover:bg-red-50 flex items-center justify-center gap-2">
                                    <XCircle size={18} /> Từ chối
                                </button>
                            </div>

                            <div className="mt-8 h-px bg-slate-50"></div>
                            <div className="mt-6">
                                <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-4">Lịch sử phê duyệt</h4>
                                <div className="space-y-4">
                                    <div className="flex gap-3">
                                        <div className="w-1 bg-emerald-400 rounded-full"></div>
                                        <div>
                                            <div className="text-[10px] font-black text-erp-navy uppercase">Quản đốc xưởng (Auto)</div>
                                            <div className="text-[9px] text-emerald-600 font-bold">ĐÃ XÁC NHẬN NHU CẦU</div>
                                        </div>
                                    </div>
                                    <div className="flex gap-3">
                                        <div className="w-1 bg-slate-200 rounded-full"></div>
                                        <div>
                                            <div className="text-[10px] font-black text-slate-400 uppercase">Tài chính ( Jonathan Doe )</div>
                                            <div className="text-[9px] text-amber-600 font-bold animate-pulse">ĐANG CHỜ BẠN...</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="erp-card bg-slate-50/50 border-dashed border-2 flex flex-col items-center justify-center py-20 text-slate-400">
                            <CheckSquare size={40} className="mb-4 opacity-20" />
                            <p className="text-xs font-bold uppercase tracking-widest">Chọn một PR để xem chi tiết</p>
                        </div>
                    )}
                </div>
            </div>
        </main>
    );
}
