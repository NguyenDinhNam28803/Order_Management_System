"use client";

import React from "react";
import { useProcurement } from "../context/ProcurementContext";
import { Zap, ChevronRight, RefreshCw, Play, Circle, PlayCircle, StopCircle } from "lucide-react";

export default function SimulationPanel() {
    const { simulation, startSimulation, nextSimulationStep, stopSimulation } = useProcurement();

    if (!simulation.isActive) {
        return null;
    }

    const { workflow, step } = simulation;
    const isCatalog = workflow === "CATALOG";
    
    // Step labels based on workflow
    const stepsCatalog = [
        "Khởi tạo",
        "Requester tạo PR",
        "Manager duyệt PR",
        "Procurement gửi RFQ",
        "Supplier xác nhận",
        "Procurement tạo PO",
        "Hoàn tất thanh toán"
    ];

    const stepsNonCatalog = [
        "Khởi tạo",
        "Requester xin báo giá",
        "Procurement tạo RFQ",
        "Supplier nộp báo giá",
        "AI phân tích & Awarded",
        "Requester tạo PR",
        "Manager duyệt PR",
        "Tất toán quy trình"
    ];

    const currentSteps = isCatalog ? stepsCatalog : stepsNonCatalog;
    const stepLabel = currentSteps[step - 1] || "Đang xử lý...";

    return (
        <div className="fixed top-24 right-8 z-[100] w-80 animate-in slide-in-from-right duration-500">
            <div className={`overflow-hidden rounded-[32px] border shadow-2xl backdrop-blur-2xl ${isCatalog ? 'bg-erp-blue/10 border-erp-blue/20' : 'bg-purple-600/10 border-purple-600/20'}`}>
                {/* Header */}
                <div className={`p-5 flex items-center justify-between ${isCatalog ? 'bg-erp-blue text-white' : 'bg-purple-600 text-white'}`}>
                    <div className="flex items-center gap-3">
                        <Zap size={18} className="animate-pulse" />
                        <div>
                            <div className="text-[9px] font-black uppercase tracking-[0.2em] opacity-80">Simulation Core</div>
                            <div className="text-xs font-black uppercase tracking-widest">{workflow}</div>
                        </div>
                    </div>
                    <button onClick={stopSimulation} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                        <StopCircle size={18} />
                    </button>
                </div>

                {/* Progress */}
                <div className="p-6 space-y-6 bg-slate-900/40">
                    <div className="flex justify-between items-end">
                        <div className="space-y-1">
                            <div className="text-[10px] font-black uppercase tracking-widest text-slate-500">Bước {step} của {currentSteps.length}</div>
                            <div className="text-sm font-black text-white italic uppercase tracking-tighter">{stepLabel}</div>
                        </div>
                        <div className="text-2xl font-black text-white/10">0{step}</div>
                    </div>

                    {/* Progress Bar */}
                    <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                        <div 
                            className={`h-full transition-all duration-700 ${isCatalog ? 'bg-erp-blue' : 'bg-purple-600'}`} 
                            style={{ width: `${(step / currentSteps.length) * 100}%` }}
                        ></div>
                    </div>

                    {/* Controls */}
                    <button 
                        onClick={nextSimulationStep}
                        className={`w-full flex items-center justify-center gap-3 py-4 rounded-2xl text-white font-black text-[11px] uppercase tracking-[0.2em] shadow-xl hover:scale-105 active:scale-95 transition-all ${isCatalog ? 'bg-erp-blue shadow-erp-blue/20' : 'bg-purple-600 shadow-purple-600/20'}`}
                    >
                        Bước tiếp theo
                        <ChevronRight size={16} />
                    </button>

                    <div className="p-4 bg-white/5 border border-white/5 rounded-2xl">
                        <p className="text-[10px] text-slate-400 font-medium leading-relaxed">
                            <span className="text-white font-bold">INFO:</span> Bạn có thể switch role tài khoản để thấy dữ liệu tương ứng tại mỗi bước.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
