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
            case "CAUTION": return "bg-amber-500/10 border-amber-500/20 text-black";
            case "CRITICAL": return "bg-rose-500/10 border-rose-500/20 text-black";
            case "EXCEEDED": return "bg-rose-500 border-rose-600 text-[#000000] shadow-lg shadow-rose-500/20 animate-pulse";
            default: return "bg-[#FAF8F5] border-[rgba(148,163,184,0.1)] text-[#000000]";
        }
    };

    const getSeverityBadgeStyles = (severity: string) => {
        switch(severity) {
            case "CAUTION": return "bg-amber-500/20 text-black border border-amber-500/20";
            case "CRITICAL": return "bg-rose-500/20 text-black border border-rose-500/20";
            case "EXCEEDED": return "bg-white text-rose-500 border border-rose-500/20";
            default: return "bg-[#FFFFFF] text-[#000000] border border-[rgba(148,163,184,0.1)]";
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
        <main className="animate-in fade-in duration-500 p-6 min-h-screen bg-[#FFFFFF] text-[#000000]">
            <header className="mb-10">
                <h1 className="text-2xl font-black tracking-tight text-[#000000] mb-2 uppercase">CẢNH BÁO VƯỢT NGÂN SÁCH</h1>
                <p className="text-[#000000] font-medium italic">Danh sách các yêu cầu có nguy cơ hoặc đã vượt ngưỡng ngân sách được duyệt</p>
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
                                        severity === 'EXCEEDED' ? 'bg-white/20 border-white/30' : 'bg-[#FFFFFF] border-[rgba(148,163,184,0.1)]'
                                    }`}>
                                        {severity === 'EXCEEDED' ? <ShieldAlert size={32} /> : <AlertTriangle size={32} />}
                                    </div>
                                    <div className="flex-1 min-w-[300px]">
                                        <div className="flex items-center gap-3 mb-1">
                                            <h3 className={`text-xl font-black tracking-tight ${severity === 'EXCEEDED' ? 'text-[#000000]' : 'text-[#000000]'}`}>
                                                {alert.pr?.prNumber || "PR-PENDING"}
                                            </h3>
                                            <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest ${
                                                severity === 'EXCEEDED' ? 'bg-white/20 text-[#000000]' : 'bg-[#FFFFFF] text-[#000000]'
                                            }`}>
                                                OVERRIDE REQUEST
                                            </span>
                                        </div>
                                        <p className={`text-sm font-bold mb-2 ${severity === 'EXCEEDED' ? 'text-[#000000]/90' : 'text-[#000000]'}`}>
                                            Lý do: {alert.reason}
                                        </p>
                                        <div className={`flex items-center gap-4 text-xs font-bold ${severity === 'EXCEEDED' ? 'text-[#000000]/70' : 'text-[#000000]'}`}>
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
                                    <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                                        <div className={`h-full rounded-full ${severity === 'EXCEEDED' ? 'bg-white' : 'bg-current'}`} style={{width: `${Math.min(pct, 100)}%`}} />
                                    </div>
                                </div>

                                <div className="flex gap-3">
                                    <button 
                                        onClick={() => handleApprove(alert.id)}
                                        disabled={loadingId === alert.id}
                                        className={`px-6 py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] transform hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 ${
                                            severity === 'EXCEEDED' ? 'bg-white text-rose-600' : 'bg-[#B4533A] text-[#000000]'
                                        }`}
                                    >
                                        {loadingId === alert.id ? <Loader2 size={16} className="animate-spin" /> : "PHÊ DUYỆT VƯỢT MỨC"}
                                    </button>
                                    <button 
                                        onClick={() => handleReject(alert.id)}
                                        disabled={loadingId === alert.id}
                                        className={`px-6 py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] transform hover:scale-[1.02] active:scale-[0.98] transition-all border-2 flex items-center justify-center gap-2 ${
                                            severity === 'EXCEEDED' ? 'border-white/40 text-[#000000]' : 'border-[rgba(148,163,184,0.1)] text-[#000000]'
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
                <div className="bg-[#FAF8F5] rounded-[3rem] p-32 border border-dashed border-[rgba(148,163,184,0.1)] flex flex-col items-center justify-center opacity-60">
                    <div className="h-24 w-24 bg-emerald-500/10 rounded-[2rem] flex items-center justify-center mb-10 text-black">
                        <CheckCircle size={64} />
                    </div>
                    <h3 className="text-2xl font-black text-[#000000] mb-4 tracking-tight uppercase">Hệ thống an toàn</h3>
                    <p className="font-bold text-[#000000] tracking-widest uppercase text-xs">Không có yêu cầu vượt định mức nào cần xử lý</p>
                </div>
            )}
        </main>
    );
}

