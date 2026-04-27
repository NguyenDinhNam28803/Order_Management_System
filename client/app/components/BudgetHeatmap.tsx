"use client";

import React from "react";
import { useProcurement } from "../context/ProcurementContext";
import { formatVND } from "../utils/formatUtils";
import { TrendingUp, TrendingDown, LayoutGrid, Info, ArrowUpRight } from "lucide-react";

export default function BudgetHeatmap() {
    const { costCenters, budgetAllocations } = useProcurement();

    const heatmapData = costCenters.map(cc => {
        const allocated = Number(cc.budgetAnnual) || 1;
        const used = Number(cc.budgetUsed) || 0;
        const ratio = (used / allocated) * 100;
        
        return {
            id: cc.id,
            name: cc.name,
            code: cc.code,
            allocated,
            used,
            ratio: Math.min(ratio, 110) // Cap for display
        };
    }).sort((a, b) => b.ratio - a.ratio);

    const getHeatColor = (ratio: number) => {
        if (ratio >= 90) return "bg-rose-500/80 border-rose-500 shadow-rose-500/20";
        if (ratio >= 70) return "bg-orange-500/80 border-orange-500 shadow-orange-500/20";
        if (ratio >= 40) return "bg-[#B4533A]/80 border-[#B4533A] shadow-[#B4533A]/20";
        return "bg-emerald-500/80 border-emerald-500 shadow-emerald-500/20";
    };

    const getTagColor = (ratio: number) => {
        if (ratio >= 90) return "bg-rose-900/40 text-black border border-rose-500/30";
        if (ratio >= 70) return "bg-orange-900/40 text-black border border-orange-500/30";
        if (ratio >= 40) return "bg-[#B4533A]/20 text-[#B4533A] border border-[#B4533A]/30";
        return "bg-emerald-900/40 text-black border border-emerald-500/30";
    };

    return (
        <div className="erp-card bg-[#FAF8F5] border border-[rgba(148,163,184,0.1)] shadow-xl shadow-[#B4533A]/5 overflow-hidden group">
            <div className="p-6 border-b border-[rgba(148,163,184,0.1)] flex items-center justify-between bg-[#1A1D26]">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-[#B4533A] text-[#000000] rounded-2xl shadow-lg shadow-[#B4533A]/20 group-hover:scale-110 transition-transform duration-500">
                        <LayoutGrid size={22} />
                    </div>
                    <div>
                        <h3 className="text-lg font-black text-[#000000] tracking-tight uppercase">Budget Consumption Heatmap</h3>
                        <p className="text-[10px] font-black text-[#000000] uppercase tracking-[0.2em] mt-0.5">Real-time Department Spending Intensity</p>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                   <div className="flex items-center gap-2">
                        <div className="flex -space-x-1.5">
                            <div className="h-4 w-4 bg-emerald-500 rounded-full border-2 border-[#FAF8F5] shadow-sm"></div>
                            <div className="h-4 w-4 bg-[#B4533A] rounded-full border-2 border-[#FAF8F5] shadow-sm"></div>
                            <div className="h-4 w-4 bg-orange-500 rounded-full border-2 border-[#FAF8F5] shadow-sm"></div>
                            <div className="h-4 w-4 bg-rose-500 rounded-full border-2 border-[#FAF8F5] shadow-sm"></div>
                        </div>
                        <span className="text-[10px] font-black text-[#000000] uppercase tracking-widest ml-1">Intensity Scale</span>
                   </div>
                </div>
            </div>

            <div className="p-8 grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
                {heatmapData.map((item) => (
                    <div 
                        key={item.id}
                        className="relative h-44 rounded-[32px] border border-[rgba(255,255,255,0.08)] p-6 overflow-hidden transition-all duration-700 hover:scale-[1.04] hover:z-10 cursor-help group/item shadow-2xl shadow-black/20"
                    >
                        {/* Background heatmap fill with glass effect */}
                        <div className={`absolute inset-0 transition-colors duration-1000 ${getHeatColor(item.ratio)}`} />
                        <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-black/30 opacity-40"></div>
                        
                        {/* Content Overlay */}
                        <div className="relative z-10 flex flex-col h-full justify-between">
                            <div className="flex justify-between items-start">
                                <div className="h-10 w-10 rounded-[16px] bg-white/10 backdrop-blur-xl flex items-center justify-center text-[#000000] border border-white/20 shadow-lg">
                                    <ArrowUpRight size={18} />
                                </div>
                                <span className="text-[11px] font-black px-3 py-1 rounded-full backdrop-blur-xl border border-white/20 text-[#000000] shadow-sm font-mono tracking-tighter">
                                    {item.ratio.toFixed(1)}%
                                </span>
                            </div>
                            
                            <div className="mt-auto">
                                <div className="text-[10px] font-black text-[#000000]/50 uppercase tracking-[0.2em] mb-1.5 leading-none">{item.code}</div>
                                <div className="text-sm font-black text-[#000000] leading-tight break-words drop-shadow-sm" title={item.name}>{item.name}</div>
                                
                                <div className="mt-4 h-1.5 w-full bg-white/20 rounded-full overflow-hidden border border-white/5 backdrop-blur-sm">
                                    <div className="h-full bg-white shadow-[0_0_8px_rgba(255,255,255,0.5)] transition-all duration-1000" style={{ width: `${item.ratio}%` }}></div>
                                </div>
                            </div>
                        </div>

                        {/* Tooltip-like popup on hover */}
                        <div className="absolute inset-0 z-20 bg-slate-900/90 backdrop-blur-sm opacity-0 group-hover/item:opacity-100 transition-opacity flex flex-col items-center justify-center p-4 text-center">
                            <div className="text-[10px] font-black text-black uppercase tracking-widest mb-2">Detailed Analysis</div>
                            <div className="text-xs font-bold text-[#000000] mb-3">{formatVND(item.used)} / {formatVND(item.allocated)}</div>
                            <div className={`px-2 py-1 rounded-lg text-[9px] font-black uppercase ${getTagColor(item.ratio)}`}>
                                {item.ratio >= 90 ? "Critical / Over" : item.ratio >= 70 ? "Warning / High" : "Optimal"}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <div className="p-4 bg-[#FFFFFF] border-t border-[rgba(148,163,184,0.1)] flex items-center gap-4 justify-center">
                <div className="flex items-center gap-2">
                    <Info size={14} className="text-[#B4533A]" />
                    <span className="text-[10px] font-black text-[#000000] uppercase tracking-widest leading-none mt-0.5 whitespace-nowrap">Hover on a cell to see exact consumption and threshold warnings</span>
                </div>
            </div>
        </div>
    );
}

