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
        if (ratio >= 90) return "bg-rose-500 border-rose-600 shadow-rose-200/50";
        if (ratio >= 70) return "bg-orange-500 border-orange-600 shadow-orange-200/50";
        if (ratio >= 40) return "bg-indigo-500 border-indigo-600 shadow-indigo-200/50";
        return "bg-emerald-500 border-emerald-600 shadow-emerald-200/50";
    };

    const getTagColor = (ratio: number) => {
        if (ratio >= 90) return "bg-rose-100 text-rose-700";
        if (ratio >= 70) return "bg-orange-100 text-orange-700";
        if (ratio >= 40) return "bg-indigo-100 text-indigo-700";
        return "bg-emerald-100 text-emerald-700";
    };

    return (
        <div className="erp-card bg-white border border-slate-200 shadow-sm overflow-hidden group">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/30">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-indigo-600 text-white rounded-xl shadow-lg shadow-indigo-200 group-hover:scale-110 transition-transform">
                        <LayoutGrid size={18} />
                    </div>
                    <div>
                        <h3 className="text-base font-bold text-slate-900 tracking-tight">Budget Consumption Heatmap</h3>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Real-time Department Spending Intensity</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                   <div className="flex -space-x-1">
                        <div className="h-3 w-3 bg-emerald-500 rounded-full border border-white"></div>
                        <div className="h-3 w-3 bg-indigo-500 rounded-full border border-white"></div>
                        <div className="h-3 w-3 bg-orange-500 rounded-full border border-white"></div>
                        <div className="h-3 w-3 bg-rose-500 rounded-full border border-white"></div>
                   </div>
                   <span className="text-[10px] font-bold text-slate-400 uppercase ml-1">Intensity Scale</span>
                </div>
            </div>

            <div className="p-6 grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                {heatmapData.map((item) => (
                    <div 
                        key={item.id}
                        className="relative h-40 rounded-[24px] border-2 border-white/20 p-5 overflow-hidden transition-all duration-500 hover:scale-[1.05] hover:z-10 cursor-help group/item shadow-sm"
                    >
                        {/* Background heatmap fill */}
                        <div className={`absolute inset-0 transition-opacity duration-500 ${getHeatColor(item.ratio)}`} />
                        <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-black/10 opacity-60"></div>
                        
                        {/* Content Overlay */}
                        <div className="relative z-10 flex flex-col h-full justify-between">
                            <div className="flex justify-between items-start">
                                <div className="h-8 w-8 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white border border-white/20">
                                    <ArrowUpRight size={14} />
                                </div>
                                <span className={`text-[10px] font-black px-2 py-0.5 rounded-full backdrop-blur-md border border-white/30 text-white`}>
                                    {item.ratio.toFixed(1)}%
                                </span>
                            </div>
                            
                            <div className="mt-4">
                                <div className="text-[9px] font-black text-white/70 uppercase tracking-widest mb-0.5">{item.code}</div>
                                <div className="text-xs font-bold text-white truncate max-w-full" title={item.name}>{item.name}</div>
                            </div>

                            <div className="mt-auto h-1 w-full bg-black/10 rounded-full overflow-hidden">
                                <div className="h-full bg-white" style={{ width: `${item.ratio}%` }}></div>
                            </div>
                        </div>

                        {/* Tooltip-like popup on hover */}
                        <div className="absolute inset-0 z-20 bg-slate-900/90 backdrop-blur-sm opacity-0 group-hover/item:opacity-100 transition-opacity flex flex-col items-center justify-center p-4 text-center">
                            <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Detailed Analysis</div>
                            <div className="text-xs font-bold text-white mb-3">{formatVND(item.used)} / {formatVND(item.allocated)}</div>
                            <div className={`px-2 py-1 rounded-lg text-[9px] font-black uppercase ${getTagColor(item.ratio)}`}>
                                {item.ratio >= 90 ? "Critical / Over" : item.ratio >= 70 ? "Warning / High" : "Optimal"}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center gap-4 justify-center">
                <div className="flex items-center gap-2">
                    <Info size={12} className="text-indigo-600" />
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mt-0.5">Hover on a cell to see exact consumption and threshold warnings</span>
                </div>
            </div>
        </div>
    );
}
