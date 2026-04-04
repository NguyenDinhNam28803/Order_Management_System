"use client";

import React, { useState } from "react";
import { ShieldAlert, CheckCircle, ArrowRight, DollarSign, List, Calculator, AlertTriangle, AlertCircle, Loader2 } from "lucide-react";
import { useProcurement } from "../../context/ProcurementContext";
import { formatVND } from "../../utils/formatUtils";
import { BudgetOverrideStatus } from "../../types/api-types";

export default function BudgetAlertsPage() {
    const { budgetOverrides, approveOverride, rejectOverride } = useProcurement();
    const [loadingId, setLoadingId] = useState<string | null>(null);

    const getSeverityStyles = (severity: string) => {
        switch(severity) {
            case "CAUTION": return "bg-orange-50 border-orange-100 text-orange-600";
            case "CRITICAL": return "bg-red-50 border-red-100 text-red-600";
            case "EXCEEDED": return "bg-red-600 border-red-700 text-white shadow-lg shadow-red-200 animate-pulse";
            default: return "bg-slate-50 border-slate-100 text-slate-400";
        }
    };

    const getSeverityBadgeStyles = (severity: string) => {
        switch(severity) {
            case "CAUTION": return "bg-orange-100 text-orange-700";
            case "CRITICAL": return "bg-red-100 text-red-700";
            case "EXCEEDED": return "bg-white text-red-600";
            default: return "bg-slate-100 text-slate-500";
        }
    };

    const handleApprove = async (id: string) => {
        setLoadingId(id);
        await approveOverride(id);
        setLoadingId(null);
    };

    const handleReject = async (id: string) => {
        const reason = prompt("Lý do từ chối vượt định mức:");
        if (reason) {
            setLoadingId(id);
            await rejectOverride(id, reason);
            setLoadingId(null);
        }
    };

    // Filter only pending overrides
    const pendingOverrides = budgetOverrides.filter(o => o.status === BudgetOverrideStatus.PENDING);

    return (
        <main className="animate-in fade-in duration-500 pb-20 p-8">
            <header className="mb-10">
                <h1 className="text-2xl font-black tracking-tight text-erp-navy mb-2 uppercase">CẢNH BÁO VƯỢT NGÂN SÁCH</h1>
                <p className="text-slate-500 font-medium italic">Danh sách các yêu cầu có nguy cơ hoặc đã vượt ngưỡng ngân sách được duyệt</p>
            </header>

            {pendingOverrides.length > 0 ? (
                <div className="grid gap-6">
                    {pendingOverrides.map((alert) => {
                        // Estimate severity based on current vs override
                        const severity = alert.overrideAmount > 100000000 ? "EXCEEDED" : "CRITICAL";
                        const pct = 100 + Math.floor((Number(alert.overrideAmount) / 1000000) * 0.1); // Simplified mock pct

                        return (
                            <div key={alert.id} className={`p-8 rounded-[2.5rem] border list-item-card transition-all flex flex-col md:flex-row items-center justify-between gap-8 ${getSeverityStyles(severity)}`}>
                                <div className="flex items-center gap-6">
                                    <div className={`h-16 w-16 rounded-2xl flex items-center justify-center border ${
                                        severity === 'EXCEEDED' ? 'bg-white/20 border-white/30' : 'bg-white border-slate-100'
                                    }`}>
                                        {severity === 'EXCEEDED' ? <ShieldAlert size={32} /> : <AlertTriangle size={32} />}
                                    </div>
                                    <div className="flex-1 min-w-[300px]">
                                        <div className="flex items-center gap-3 mb-1">
                                            <h3 className={`text-xl font-black tracking-tight ${severity === 'EXCEEDED' ? 'text-white' : 'text-erp-navy'}`}>
                                                {alert.pr?.prNumber || "PR-PENDING"}
                                            </h3>
                                            <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest ${
                                                severity === 'EXCEEDED' ? 'bg-white/20' : 'bg-slate-100 text-slate-500 font-bold'
                                            }`}>
                                                OVERRIDE REQUEST
                                            </span>
                                        </div>
                                        <p className={`text-sm font-bold mb-2 ${severity === 'EXCEEDED' ? 'text-white/90' : 'text-slate-600'}`}>
                                            Lý do: {alert.reason}
                                        </p>
                                        <div className={`flex items-center gap-4 text-xs font-bold ${severity === 'EXCEEDED' ? 'text-white/70' : 'text-slate-400'}`}>
                                            <div className="flex items-center gap-1">
                                                <DollarSign size={14} /> Số tiền vượt: {formatVND(Number(alert.overrideAmount))}
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <Calculator size={14} /> Người yêu cầu: {alert.requestedBy?.fullName || "N/A"}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex flex-col items-end gap-2 min-w-[200px]">
                                    <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${getSeverityBadgeStyles(severity)} text-center w-full`}>
                                        {severity} • ~{pct}%
                                    </span>
                                    <div className="w-full h-2 bg-black/10 rounded-full overflow-hidden">
                                        <div className={`h-full rounded-full ${severity === 'EXCEEDED' ? 'bg-white' : 'bg-current'}`} style={{width: `${Math.min(pct, 100)}%`}} />
                                    </div>
                                </div>

                                <div className="flex gap-3">
                                    <button 
                                        onClick={() => handleApprove(alert.id)}
                                        disabled={loadingId === alert.id}
                                        className={`px-6 py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] transform hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 ${
                                            severity === 'EXCEEDED' ? 'bg-white text-red-600' : 'bg-erp-navy text-white'
                                        }`}
                                    >
                                        {loadingId === alert.id ? <Loader2 size={16} className="animate-spin" /> : "PHÊ DUYỆT VƯỢT MỨC"}
                                    </button>
                                    <button 
                                        onClick={() => handleReject(alert.id)}
                                        disabled={loadingId === alert.id}
                                        className={`px-6 py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] transform hover:scale-[1.02] active:scale-[0.98] transition-all border-2 flex items-center justify-center gap-2 ${
                                            severity === 'EXCEEDED' ? 'border-white/40 text-white' : 'border-slate-200 text-slate-400'
                                        }`}
                                    >
                                        TỪ CHỐI
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            ) : (
                <div className="bg-white rounded-[3rem] p-32 border-2 border-dashed border-slate-100 flex flex-col items-center justify-center opacity-40">
                    <div className="h-24 w-24 bg-green-50 rounded-[2rem] flex items-center justify-center mb-10 text-green-500">
                        <CheckCircle size={64} />
                    </div>
                    <h3 className="text-2xl font-black text-erp-navy mb-4 tracking-tight uppercase">Hệ thống an toàn</h3>
                    <p className="font-bold text-slate-400 tracking-widest uppercase text-xs">Không có yêu cầu vượt định mức nào cần xử lý</p>
                </div>
            )}
        </main>
    );
}
