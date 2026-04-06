"use client";

import React, { useState, useMemo } from "react";
import { 
    Zap, ShoppingBag, FileText, CheckCircle, 
    RefreshCw, Search, Layout, Send,
    BarChart3, Bot, ChevronRight,
    Star, DollarSign, Truck, CreditCard, ShieldCheck
} from "lucide-react";

// --- Mock Data Types ---

type WorkflowType = "CATALOG" | "NON_CATALOG";

interface Step {
    id: number;
    title: string;
    description: string;
    role: string;
    icon: React.ReactNode;
}

const W1_STEPS: Step[] = [
    { id: 1, title: "Tạo PR", description: "Requester chọn hàng Catalog và gửi yêu cầu", role: "REQUESTER", icon: <ShoppingCart size={18} /> },
    { id: 2, title: "Duyệt PR", description: "Trưởng phòng phê duyệt đơn hàng", role: "MANAGER", icon: <ShieldCheck size={18} /> },
    { id: 3, title: "Xác nhận giá", description: "NCC xác nhận tồn kho và giá hiện tại", role: "SUPPLIER", icon: <CheckCircle size={18} /> },
    { id: 4, title: "Phát hành PO", description: "Hệ thống tự động tạo và gửi đơn hàng", role: "PROCUREMENT", icon: <FileText size={18} /> },
    { id: 5, title: "Thanh toán", description: "Giao nhận & Quyết toán tài chính", role: "FINANCE", icon: <DollarSign size={18} /> }
];

const W2_STEPS: Step[] = [
    { id: 1, title: "Xin báo giá", description: "Yêu cầu báo giá cho hàng Non-Catalog", role: "REQUESTER", icon: <Search size={18} /> },
    { id: 2, title: "Mời thầu", description: "Thu mua chọn NCC và gửi RFQ", role: "PROCUREMENT", icon: <Send size={18} /> },
    { id: 3, title: "Nhận báo giá", description: "Các NCC phản hồi báo giá cạnh tranh", role: "SUPPLIER", icon: <Layout size={18} /> },
    { id: 4, title: "AI Phân tích", description: "AI so sánh & Đề xuất NCC tối ưu", role: "AI", icon: <Bot size={18} /> },
    { id: 5, title: "Chọn NCC", description: "Chốt phương án và trả kết quả", role: "PROCUREMENT", icon: <Star size={18} /> },
    { id: 6, title: "Tạo PR", description: "Lập PR chính thức theo giá đã chốt", role: "REQUESTER", icon: <FileText size={18} /> },
    { id: 7, title: "Duyệt PR", description: "Kiểm tra ngân sách và phê duyệt", role: "MANAGER", icon: <ShieldCheck size={18} /> },
    { id: 8, title: "Phát hành PO", description: "Tạo PO liên kết với báo giá thầu", role: "PROCUREMENT", icon: <ShoppingCart size={18} /> },
    { id: 9, title: "Giao hàng", description: "Nhận hàng & Kiểm tra chất lượng (GRN)", role: "WAREHOUSE", icon: <Truck size={18} /> },
    { id: 10, title: "Thanh toán", description: "3-way Matching & Chuyển tiền", role: "FINANCE", icon: <CreditCard size={18} /> }
];

function ShoppingCart({ size, className }: { size: number, className?: string }) { return <ShoppingBag size={size} className={className} />; }

const StatusBadge = ({ status }: { status: string }) => (
    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
        status === "APPROVED" || status === "ISSUED" || status === "CONFIRMED" || status === "PAID" || status === "MATCHED"
        ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20"
        : status === "SUBMITTED" || status === "SENT" || status === "PENDING"
        ? "bg-amber-500/10 text-amber-500 border border-amber-500/20"
        : status === "DRAFT"
        ? "bg-slate-500/10 text-slate-400 border border-slate-500/20"
        : "bg-erp-blue/10 text-erp-blue border border-erp-blue/20"
    }`}>
        {status}
    </span>
);

interface BudgetState {
    allocated: number;
    committed: number;
    spent: number;
}

interface EntityState {
    id: string;
    status: string;
    total: number;
    supplier?: string;
    title?: string;
}

interface Quotation {
    id: string;
    supplier: string;
    price: number;
    aiScore: number;
    aiRec: string;
}

export default function SimulationPage() {
    const [activeWorkflow, setActiveWorkflow] = useState<WorkflowType>("CATALOG");
    const [currentStep, setCurrentStep] = useState(1);
    const [budget, setBudget] = useState<BudgetState>({ allocated: 500000000, committed: 0, spent: 0 });
    
    const [pr, setPr] = useState<EntityState | null>(null);
    const [rfq, setRfq] = useState<EntityState | null>(null);
    const [po, setPo] = useState<EntityState | null>(null);
    const [grn, setGrn] = useState<EntityState | null>(null);
    const [invoice, setInvoice] = useState<EntityState | null>(null);
    const [quotations, setQuotations] = useState<Quotation[]>([]);

    const steps = activeWorkflow === "CATALOG" ? W1_STEPS : W2_STEPS;
    const currentStepData = steps[currentStep - 1];

    const handleReset = () => {
        setCurrentStep(1);
        setPr(null);
        setRfq(null);
        setPo(null);
        setGrn(null);
        setInvoice(null);
        setQuotations([]);
        setBudget({ allocated: 500000000, committed: 0, spent: 0 });
    };

    const processStepLogic = (stepNum: number) => {
        if (activeWorkflow === "CATALOG") {
            switch(stepNum) {
                case 1: break;
                case 2:
                    setPr({ id: "PR-C001", status: "SUBMITTED", total: 90000000 });
                    break;
                case 3:
                    setPr(prev => prev ? ({ ...prev, status: "APPROVED" }) : null);
                    setRfq({ id: "RFQ-C001", status: "SENT", total: 0, supplier: "FPT Shop" });
                    break;
                case 4:
                    setRfq(prev => prev ? ({ ...prev, status: "CONFIRMED" }) : null);
                    setBudget(prev => ({ ...prev, committed: prev.committed + 90000000 }));
                    setPo({ id: "PO-C001", status: "ISSUED", total: 90000000 });
                    break;
                case 5:
                    setPo(prev => prev ? ({ ...prev, status: "PAID" }) : null);
                    setBudget(prev => ({ ...prev, spent: prev.spent + 90000000, committed: prev.committed - 90000000 }));
                    break;
            }
        } else {
            switch(stepNum) {
                case 2:
                    setRfq({ id: "QR-NC001", status: "PENDING", total: 0, title: "Hạ tầng mạng" });
                    break;
                case 3:
                    setRfq(prev => prev ? ({ ...prev, status: "SENT" }) : null);
                    break;
                case 4:
                    setQuotations([
                        { id: "Q1", supplier: "CMC", price: 1200000000, aiScore: 85, aiRec: "Hỗ trợ tốt" },
                        { id: "Q2", supplier: "HPT", price: 950000000, aiScore: 92, aiRec: "Giá tốt nhất" },
                        { id: "Q3", supplier: "SVTech", price: 1100000000, aiScore: 78, aiRec: "Giao nhanh" }
                    ]);
                    break;
                case 5:
                    setRfq(prev => prev ? ({ ...prev, status: "AI_RECOMMENDED" }) : null);
                    break;
                case 6:
                    setPr({ id: "PR-NC001", status: "DRAFT", total: 950000000 });
                    break;
                case 7:
                    setPr(prev => prev ? ({ ...prev, status: "SUBMITTED" }) : null);
                    break;
                case 8:
                    setPr(prev => prev ? ({ ...prev, status: "APPROVED" }) : null);
                    setBudget(prev => ({ ...prev, committed: prev.committed + 950000000 }));
                    setPo({ id: "PO-NC001", status: "ISSUED", total: 950000000 });
                    break;
                case 9:
                    setPo(prev => prev ? ({ ...prev, status: "ACKNOWLEDGED" }) : null);
                    setGrn({ id: "GRN-NC001", status: "CONFIRMED", total: 0 });
                    break;
                case 10:
                    setInvoice({ id: "INV-NC001", status: "MATCHED", total: 950000000 });
                    setBudget(prev => ({ ...prev, spent: prev.spent + 950000000, committed: prev.committed - 950000000 }));
                    break;
            }
        }
    };

    const nextStep = () => {
        if (currentStep < steps.length) {
            setCurrentStep(prev => prev + 1);
            processStepLogic(currentStep + 1);
        }
    };

    const StatusBadge = ({ status }: { status: string }) => (
        <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
            status === "APPROVED" || status === "ISSUED" || status === "CONFIRMED" || status === "PAID" || status === "MATCHED"
            ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20"
            : status === "SUBMITTED" || status === "SENT" || status === "PENDING"
            ? "bg-amber-500/10 text-amber-500 border border-amber-500/20"
            : status === "DRAFT"
            ? "bg-slate-500/10 text-slate-400 border border-slate-500/20"
            : "bg-erp-blue/10 text-erp-blue border border-erp-blue/20"
        }`}>
            {status}
        </span>
    );

    return (
        <div className="min-h-screen bg-[#0a0c10] text-slate-300 p-8 font-sans">
            <header className="max-w-7xl mx-auto flex items-center justify-between mb-12">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-gradient-to-br from-erp-blue to-purple-600 rounded-2xl shadow-lg shadow-erp-blue/20">
                        <Zap className="text-white fill-white/20" size={24} />
                    </div>
                    <div>
                        <h1 className="text-2xl font-black text-white tracking-tighter uppercase italic">OMS Simulation</h1>
                        <p className="text-xs text-slate-500 font-bold tracking-widest uppercase">Hybrid Procurement Workflows</p>
                    </div>
                </div>

                <div className="flex bg-[#161b22] p-1 rounded-2xl border border-slate-800/50">
                    <button 
                        onClick={() => { setActiveWorkflow("CATALOG"); handleReset(); }}
                        className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeWorkflow === "CATALOG" ? "bg-erp-blue text-white shadow-lg" : "text-slate-500 hover:text-slate-300"}`}
                    >
                        Workflow 1: Catalog
                    </button>
                    <button 
                        onClick={() => { setActiveWorkflow("NON_CATALOG"); handleReset(); }}
                        className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeWorkflow === "NON_CATALOG" ? "bg-purple-600 text-white shadow-lg" : "text-slate-500 hover:text-slate-300"}`}
                    >
                        Workflow 2: Non-Catalog
                    </button>
                </div>

                <button onClick={handleReset} className="p-3 text-slate-500 hover:text-white transition-colors bg-[#161b22] rounded-xl border border-slate-800">
                    <RefreshCw size={18} />
                </button>
            </header>

            <main className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8">
                
                <div className="lg:col-span-3 space-y-4">
                    <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-600 mb-6 px-4">Quy trình thực tế</h2>
                    <div className="relative">
                        <div className="absolute left-[35px] top-6 bottom-6 w-[2px] bg-slate-800/50"></div>
                        <div className="space-y-6 relative z-10">
                            {steps.map((step, idx) => {
                                const isActive = currentStep === step.id;
                                const isCompleted = currentStep > step.id;
                                return (
                                    <div key={idx} className={`flex items-start gap-4 transition-all duration-500 ${isActive ? "opacity-100 scale-105" : isCompleted ? "opacity-40" : "opacity-20"}`}>
                                        <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 border-2 transition-all duration-500 ${
                                            isActive ? "bg-erp-blue border-erp-blue text-white shadow-xl shadow-erp-blue/20 rotate-0" : 
                                            isCompleted ? "bg-emerald-500 border-emerald-500 text-white" : "bg-[#161b22] border-slate-800 text-slate-600"
                                        }`}>
                                            {isCompleted ? <CheckCircle size={18} /> : step.icon}
                                        </div>
                                        <div>
                                            <h4 className={`text-xs font-black uppercase tracking-widest ${isActive ? "text-white" : "text-slate-400"}`}>{step.title}</h4>
                                            <p className="text-[10px] text-slate-500 leading-tight mt-1 font-medium">{step.description}</p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                <div className="lg:col-span-6">
                    <div className="bg-[#161b22]/50 border border-slate-800/50 rounded-[40px] p-10 min-h-[500px] flex flex-col items-center justify-center text-center relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-erp-blue/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
                        <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-600/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2"></div>

                        <div className="relative z-10 w-full animate-in fade-in duration-700">
                            <div className="p-6 bg-[#0a0c10]/80 backdrop-blur-3xl rounded-[32px] border border-slate-800/50 shadow-2xl mb-8 inline-block">
                                {currentStepData.icon}
                            </div>
                            <h1 className="text-4xl font-black text-white tracking-tighter mb-4 italic uppercase">
                                {currentStepData.title}
                            </h1>
                            <p className="text-slate-400 max-w-md mx-auto text-sm leading-relaxed mb-12">
                                {currentStepData.description}
                            </p>

                            <button 
                                onClick={nextStep}
                                disabled={currentStep === steps.length}
                                className={`group relative inline-flex items-center gap-4 px-12 py-6 rounded-[28px] font-black text-[11px] uppercase tracking-[0.3em] shadow-2xl transition-all duration-500 active:scale-95 ${
                                    currentStep === steps.length 
                                    ? "bg-slate-800 text-slate-500 cursor-not-allowed opacity-50" 
                                    : activeWorkflow === "CATALOG" 
                                    ? "bg-erp-blue text-white shadow-erp-blue/20 hover:scale-105" 
                                    : "bg-purple-600 text-white shadow-purple-600/20 hover:scale-105"
                                }`}
                            >
                                {currentStep === steps.length ? "Quy trình hoàn tất" : "Tiếp nhận & Xử lý"}
                                <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" />
                            </button>
                            
                            {activeWorkflow === "NON_CATALOG" && currentStep === 4 && (
                                <div className="mt-12 grid grid-cols-3 gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                    {quotations.map(q => (
                                        <div key={q.id} className="p-4 bg-[#161b22] border border-slate-800 rounded-2xl text-left">
                                            <div className="flex justify-between items-start mb-2">
                                                <span className="text-[10px] font-black text-white">{q.supplier}</span>
                                                <span className="text-emerald-500 text-[10px] font-black">{q.aiScore}%</span>
                                            </div>
                                            <div className="text-xs  text-erp-blue font-black">{q.price.toLocaleString()} ₫</div>
                                            <div className="text-[8px] mt-2 text-slate-500 uppercase tracking-widest font-black flex items-center gap-1">
                                                <Bot size={10} /> {q.aiRec}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="lg:col-span-3 space-y-6">
                    <div className="erp-card bg-[#161b22]/80 border-slate-800/50 p-6!">
                        <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-600 mb-6 flex items-center justify-between">
                            Hoạt động đối tượng <BarChart3 size={14} />
                        </h3>
                        
                        <div className="space-y-4">
                            {pr && (
                                <div className="p-3 bg-[#0a0c10] rounded-xl border border-slate-800">
                                    <div className="flex justify-between items-start mb-2">
                                        <div className="p-2 bg-erp-blue/10 rounded-lg"><ShoppingCart size={12} className="text-erp-blue" /></div>
                                        <StatusBadge status={pr.status} />
                                    </div>
                                    <div className="text-[11px] font-black text-white">{pr.id}</div>
                                    <div className="text-[9px] text-slate-500 mt-1 ">{pr.total.toLocaleString()} ₫</div>
                                </div>
                            )}

                            {rfq && (
                                <div className="p-3 bg-[#0a0c10] rounded-xl border border-slate-800">
                                    <div className="flex justify-between items-start mb-2">
                                        <div className="p-2 bg-amber-500/10 rounded-lg"><Send size={12} className="text-amber-500" /></div>
                                        <StatusBadge status={rfq.status} />
                                    </div>
                                    <div className="text-[11px] font-black text-white">{rfq.id}</div>
                                    <div className="text-[9px] text-slate-500 mt-1 truncate">{rfq.supplier || rfq.title}</div>
                                </div>
                            )}

                            {po && (
                                <div className="p-3 bg-[#0a0c10] rounded-xl border border-emerald-500/20">
                                    <div className="flex justify-between items-start mb-2">
                                        <div className="p-2 bg-emerald-500/10 rounded-lg"><FileText size={12} className="text-emerald-500" /></div>
                                        <StatusBadge status={po.status} />
                                    </div>
                                    <div className="text-[11px] font-black text-white">{po.id}</div>
                                    <div className="text-[9px] text-emerald-500 mt-1 font-black">{po.total.toLocaleString()} ₫</div>
                                </div>
                            )}

                            {!pr && !rfq && !po && (
                                <div className="py-12 text-center opacity-20">
                                    <span className="text-[9px] font-black uppercase tracking-widest">Đang chờ xử lý...</span>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="erp-card bg-gradient-to-br from-[#1c2128] to-[#161b22] border-slate-800/80 p-6!">
                        <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-6">Kiểm soát tài chính</h3>
                        <div className="space-y-4">
                            <div>
                                <div className="flex justify-between text-[9px] font-black uppercase mb-1">
                                    <span className="text-amber-500">Committed</span>
                                    <span className="text-white">{(budget.committed/1000000).toFixed(1)}M</span>
                                </div>
                                <div className="h-1 w-full bg-slate-800 rounded-full overflow-hidden">
                                    <div className="h-full bg-amber-500" style={{ width: `${(budget.committed / budget.allocated) * 100}%` }}></div>
                                </div>
                            </div>
                            <div>
                                <div className="flex justify-between text-[9px] font-black uppercase mb-1">
                                    <span className="text-erp-blue">Spent</span>
                                    <span className="text-white">{(budget.spent/1000000).toFixed(1)}M</span>
                                </div>
                                <div className="h-1 w-full bg-slate-800 rounded-full overflow-hidden">
                                    <div className="h-full bg-erp-blue" style={{ width: `${(budget.spent / budget.allocated) * 100}%` }}></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            {activeWorkflow === "NON_CATALOG" && currentStep >= 4 && (
                <div className="fixed bottom-12 right-12 w-80 bg-[#161b22] border border-slate-700/50 rounded-3xl shadow-2xl p-6 backdrop-blur-xl animate-in fade-in slide-in-from-bottom-8 duration-700">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-purple-600 rounded-xl"><Bot size={18} className="text-white" /></div>
                        <span className="text-[10px] font-black uppercase tracking-widest text-white">AI Analyst</span>
                    </div>
                    <div className="p-4 bg-emerald-500/5 border border-emerald-500/20 rounded-2xl">
                        <p className="text-[11px] text-emerald-500/80 leading-relaxed font-medium">
                            <span className="font-black">ĐỀ XUẤT:</span> HPT Vietnam (Q2) là lựa chọn tối ưu với giá thấp hơn 21% ngân sách.
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
}
