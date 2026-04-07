"use client";

import React, { useState, useMemo } from "react";
import { 
    Zap, ShoppingBag, FileText, CheckCircle, XCircle,
    RefreshCw, Search, Layout, Send,
    BarChart3, Bot, ChevronRight, ChevronDown,
    Star, DollarSign, Truck, CreditCard, ShieldCheck,
    User, Building2, BrainCircuit, ArrowRight, ArrowLeft,
    GitBranch, AlertCircle, Clock, Package, Wallet,
    CheckSquare, XSquare, RotateCcw, Eye, FileCheck
} from "lucide-react";

// --- Enhanced Types ---

type WorkflowType = "CATALOG" | "NON_CATALOG";

interface DataChange {
    field: string;
    from: string;
    to: string;
}

interface NextAction {
    condition: string;
    action: string;
    targetStep?: number;
    icon: React.ReactNode;
}

interface StepDetail {
    id: number;
    title: string;
    description: string;
    function: string;
    role: string;
    roleIcon: React.ReactNode;
    icon: React.ReactNode;
    dataState: {
        status: string;
        changes: DataChange[];
    };
    nextSteps: {
        approved: NextAction;
        rejected?: NextAction;
    };
}

const W1_STEPS: StepDetail[] = [
    {
        id: 1,
        title: "Tạo PR",
        description: "Người dùng tạo yêu cầu mua hàng từ Catalog có sẵn",
        function: "Tạo yêu cầu mua hàng (Purchase Request) với thông tin sản phẩm từ Catalog, số lượng cần thiết và lý do mua hàng",
        role: "REQUESTER",
        roleIcon: <User size={14} />,
        icon: <ShoppingBag size={20} />,
        dataState: {
            status: "DRAFT",
            changes: [
                { field: "PR Status", from: "-", to: "DRAFT" },
                { field: "Budget Check", from: "-", to: "Pre-commitment" },
                { field: "Created By", from: "-", to: "Current User" }
            ]
        },
        nextSteps: {
            approved: {
                condition: "Gửi phê duyệt",
                action: "PR chuyển sang trạng thái SUBMITTED, chờ Manager duyệt",
                targetStep: 2,
                icon: <ArrowRight size={14} />
            }
        }
    },
    {
        id: 2,
        title: "Duyệt PR",
        description: "Manager/Trưởng phòng phê duyệt yêu cầu mua hàng",
        function: "Kiểm tra tính hợp lý của yêu cầu, ngân sách còn lại, và phê duyệt hoặc từ chối PR",
        role: "MANAGER",
        roleIcon: <ShieldCheck size={14} />,
        icon: <FileCheck size={20} />,
        dataState: {
            status: "PENDING_APPROVAL",
            changes: [
                { field: "PR Status", from: "DRAFT", to: "SUBMITTED" },
                { field: "Approval Flow", from: "-", to: "Pending Manager" },
                { field: "Budget Committed", from: "0", to: "[PR Amount]" }
            ]
        },
        nextSteps: {
            approved: {
                condition: "Phê duyệt",
                action: "PR được APPROVED, gửi đến NCC xác nhận giá và tồn kho",
                targetStep: 3,
                icon: <CheckCircle size={14} />
            },
            rejected: {
                condition: "Từ chối",
                action: "PR bị REJECTED, trả về Requester để chỉnh sửa hoặc hủy",
                targetStep: 1,
                icon: <RotateCcw size={14} />
            }
        }
    },
    {
        id: 3,
        title: "Xác nhận giá",
        description: "Nhà cung cấp xác nhận tồn kho và giá hiện tại",
        function: "NCC kiểm tra tồn kho, cập nhật giá mới nhất và xác nhận khả năng cung ứng",
        role: "SUPPLIER",
        roleIcon: <Building2 size={14} />,
        icon: <CheckCircle size={20} />,
        dataState: {
            status: "CONFIRMING",
            changes: [
                { field: "PR Status", from: "APPROVED", to: "CONFIRMING" },
                { field: "Supplier Status", from: "-", to: "Checking Stock" },
                { field: "Price Confirmed", from: "Catalog Price", to: "Current Price" }
            ]
        },
        nextSteps: {
            approved: {
                condition: "Xác nhận",
                action: "NCC xác nhận giá và tồn kho, tự động tạo PO gửi đến NCC",
                targetStep: 4,
                icon: <FileText size={14} />
            },
            rejected: {
                condition: "Không đủ hàng",
                action: "Chuyển sang tìm NCC khác hoặc báo hết hàng cho Requester",
                icon: <AlertCircle size={14} />
            }
        }
    },
    {
        id: 4,
        title: "Phát hành PO",
        description: "Hệ thống tự động tạo và gửi đơn hàng (PO) đến NCC",
        function: "Tạo PO chính thức dựa trên PR đã duyệt, gửi đến NCC để xác nhận đơn hàng",
        role: "PROCUREMENT",
        roleIcon: <Package size={14} />,
        icon: <FileText size={20} />,
        dataState: {
            status: "ISSUED",
            changes: [
                { field: "PO Status", from: "-", to: "ISSUED" },
                { field: "PR Status", from: "CONFIRMING", to: "PO_CREATED" },
                { field: "Link PR-PO", from: "-", to: "Linked" },
                { field: "Budget", from: "Committed", to: "Committed (PO Issued)" }
            ]
        },
        nextSteps: {
            approved: {
                condition: "PO Accepted",
                action: "NCC xác nhận PO, chuẩn bị giao hàng và gửi hóa đơn",
                targetStep: 5,
                icon: <Truck size={14} />
            }
        }
    },
    {
        id: 5,
        title: "Thanh toán",
        description: "Giao nhận, kiểm tra chất lượng và quyết toán tài chính",
        function: "Nhận hàng (GRN), kiểm tra chất lượng, 3-way matching (PO-GRN-Invoice), thanh toán",
        role: "FINANCE",
        roleIcon: <Wallet size={14} />,
        icon: <DollarSign size={20} />,
        dataState: {
            status: "PAYMENT_PROCESSING",
            changes: [
                { field: "GRN Status", from: "-", to: "CONFIRMED" },
                { field: "Invoice Status", from: "-", to: "MATCHED" },
                { field: "3-Way Match", from: "-", to: "VERIFIED" },
                { field: "Budget", from: "Committed", to: "Spent" },
                { field: "Payment", from: "Pending", to: "PAID" }
            ]
        },
        nextSteps: {
            approved: {
                condition: "Hoàn tất",
                action: "Quy trình hoàn tất. Lưu trữ hồ sơ và cập nhật báo cáo tài chính.",
                icon: <CheckCircle size={14} />
            }
        }
    }
];
 
const W2_STEPS: StepDetail[] = [
    {
        id: 1,
        title: "Xin báo giá",
        description: "Yêu cầu báo giá cho hàng Non-Catalog (hàng chưa có trong hệ thống)",
        function: "Tạo yêu cầu báo giá (RFQ/Quote Request) cho sản phẩm/dịch vụ chưa có trong Catalog",
        role: "REQUESTER",
        roleIcon: <User size={14} />,
        icon: <Search size={20} />,
        dataState: {
            status: "QR_CREATED",
            changes: [
                { field: "QR Status", from: "-", to: "DRAFT" },
                { field: "Item Type", from: "-", to: "Non-Catalog" },
                { field: "Specification", from: "-", to: "User Input" }
            ]
        },
        nextSteps: {
            approved: {
                condition: "Gửi RFQ",
                action: "Chuyển đến Procurement để tổ chức đấu thầu",
                targetStep: 2,
                icon: <ArrowRight size={14} />
            }
        }
    },
    {
        id: 2,
        title: "Mời thầu",
        description: "Bộ phận thu mua chọn NCC và gửi yêu cầu báo giá (RFQ)",
        function: "Procurement chọn danh sách NCC tiềm năng, gửi RFQ với thông số kỹ thuật và yêu cầu báo giá",
        role: "PROCUREMENT",
        roleIcon: <Package size={14} />,
        icon: <Send size={20} />,
        dataState: {
            status: "RFQ_SENT",
            changes: [
                { field: "RFQ Status", from: "-", to: "SENT" },
                { field: "Suppliers Invited", from: "0", to: "N nhà cung cấp" },
                { field: "Quote Deadline", from: "-", to: "Set" }
            ]
        },
        nextSteps: {
            approved: {
                condition: "Chờ báo giá",
                action: "Chuyển sang giai đoạn NCC phản hồi báo giá",
                targetStep: 3,
                icon: <Clock size={14} />
            }
        }
    },
    {
        id: 3,
        title: "Nhận báo giá",
        description: "Các nhà cung cấp phản hồi báo giá cạnh tranh",
        function: "NCC gửi báo giá chi tiết bao gồm: giá, thời gian giao hàng, điều kiện thanh toán, bảo hành",
        role: "SUPPLIER",
        roleIcon: <Building2 size={14} />,
        icon: <Layout size={20} />,
        dataState: {
            status: "QUOTES_RECEIVED",
            changes: [
                { field: "Quotes Count", from: "0", to: "N quotes" },
                { field: "Price Range", from: "-", to: "[Min - Max]" },
                { field: "RFQ Status", from: "SENT", to: "QUOTES_RECEIVED" }
            ]
        },
        nextSteps: {
            approved: {
                condition: "Đủ số lượng báo giá",
                action: "Chuyển sang AI phân tích và đề xuất",
                targetStep: 4,
                icon: <BrainCircuit size={14} />
            }
        }
    },
    {
        id: 4,
        title: "AI Phân tích",
        description: "AI so sánh các báo giá và đề xuất NCC tối ưu",
        function: "AI đánh giá các tiêu chí: Giá (40%), Chất lượng (30%), Thời gian giao (20%), Uy tín NCC (10%)",
        role: "AI",
        roleIcon: <Bot size={14} />,
        icon: <BrainCircuit size={20} />,
        dataState: {
            status: "AI_ANALYZING",
            changes: [
                { field: "AI Score", from: "-", to: "Calculated" },
                { field: "Rankings", from: "-", to: "#1, #2, #3..." },
                { field: "Recommendation", from: "-", to: "Best Option" }
            ]
        },
        nextSteps: {
            approved: {
                condition: "AI đề xuất",
                action: "Procurement xem xét đề xuất AI và quyết định chọn NCC",
                targetStep: 5,
                icon: <CheckSquare size={14} />
            }
        }
    },
    {
        id: 5,
        title: "Chọn NCC",
        description: "Procurement chốt phương án và chọn nhà cung cấp",
        function: "Dựa trên đề xuất AI và đánh giá thực tế, Procurement chọn NCC phù hợp nhất",
        role: "PROCUREMENT",
        roleIcon: <Package size={14} />,
        icon: <Star size={20} />,
        dataState: {
            status: "SUPPLIER_SELECTED",
            changes: [
                { field: "Selected Supplier", from: "-", to: "Winner" },
                { field: "Final Price", from: "-", to: "Agreed Price" },
                { field: "RFQ Status", from: "QUOTES_RECEIVED", to: "CLOSED" }
            ]
        },
        nextSteps: {
            approved: {
                condition: "Đã chọn NCC",
                action: "Tạo PR chính thức theo giá đã chốt với NCC",
                targetStep: 6,
                icon: <FileText size={14} />
            }
        }
    },
    {
        id: 6,
        title: "Tạo PR",
        description: "Lập PR chính thức theo giá đã chốt với NCC",
        function: "Tạo PR từ kết quả đấu thầu, gắn link RFQ và báo giá đã chọn",
        role: "REQUESTER",
        roleIcon: <User size={14} />,
        icon: <FileText size={20} />,
        dataState: {
            status: "PR_CREATED_FROM_RFQ",
            changes: [
                { field: "PR Status", from: "-", to: "DRAFT" },
                { field: "Source", from: "-", to: "RFQ Result" },
                { field: "Linked RFQ", from: "-", to: "RFQ-ID" }
            ]
        },
        nextSteps: {
            approved: {
                condition: "Gửi duyệt",
                action: "Gửi PR đến Manager để phê duyệt ngân sách",
                targetStep: 7,
                icon: <ArrowRight size={14} />
            }
        }
    },
    {
        id: 7,
        title: "Duyệt PR",
        description: "Manager kiểm tra ngân sách và phê duyệt PR",
        function: "Kiểm tra ngân sách còn lại, so sánh với báo giá đã chốt, phê duyệt hoặc yêu cầu điều chỉnh",
        role: "MANAGER",
        roleIcon: <ShieldCheck size={14} />,
        icon: <ShieldCheck size={20} />,
        dataState: {
            status: "PENDING_APPROVAL",
            changes: [
                { field: "PR Status", from: "SUBMITTED", to: "PENDING" },
                { field: "Budget Check", from: "-", to: "Checking" },
                { field: "Approval Level", from: "-", to: "Manager" }
            ]
        },
        nextSteps: {
            approved: {
                condition: "Phê duyệt",
                action: "PR được APPROVED, chuyển sang tạo PO",
                targetStep: 8,
                icon: <CheckCircle size={14} />
            },
            rejected: {
                condition: "Từ chối",
                action: "PR bị REJECTED, yêu cầu chọn lại NCC hoặc đàm phán lại giá",
                targetStep: 5,
                icon: <RotateCcw size={14} />
            }
        }
    },
    {
        id: 8,
        title: "Phát hành PO",
        description: "Tạo PO liên kết với báo giá thầu đã chọn",
        function: "Tạo PO chính thức với giá từ RFQ, gửi đến NCC đã thắng thầu",
        role: "PROCUREMENT",
        roleIcon: <Package size={14} />,
        icon: <ShoppingBag size={20} />,
        dataState: {
            status: "PO_ISSUED",
            changes: [
                { field: "PO Status", from: "-", to: "ISSUED" },
                { field: "Link RFQ-PO", from: "-", to: "Linked" },
                { field: "Budget Committed", from: "0", to: "[PO Amount]" }
            ]
        },
        nextSteps: {
            approved: {
                condition: "NCC xác nhận",
                action: "NCC xác nhận PO và bắt đầu giao hàng",
                targetStep: 9,
                icon: <Truck size={14} />
            }
        }
    },
    {
        id: 9,
        title: "Giao hàng",
        description: "Nhận hàng và kiểm tra chất lượng (GRN)",
        function: "NCC giao hàng, Warehouse kiểm tra số lượng và chất lượng, tạo GRN",
        role: "WAREHOUSE",
        roleIcon: <Truck size={14} />,
        icon: <Package size={20} />,
        dataState: {
            status: "DELIVERING",
            changes: [
                { field: "GRN Status", from: "-", to: "PENDING" },
                { field: "Delivery Status", from: "-", to: "IN_TRANSIT" },
                { field: "PO Status", from: "ISSUED", to: "ACKNOWLEDGED" }
            ]
        },
        nextSteps: {
            approved: {
                condition: "Nhận hàng OK",
                action: "GRN confirmed, chờ hóa đơn để thanh toán",
                targetStep: 10,
                icon: <CheckCircle size={14} />
            },
            rejected: {
                condition: "Hàng lỗi/thiếu",
                action: "Tạo Dispute, yêu cầu NCC bổ sung hoặc đổi trả",
                icon: <XCircle size={14} />
            }
        }
    },
    {
        id: 10,
        title: "Thanh toán",
        description: "3-way Matching và chuyển tiền",
        function: "So khớp 3 chứng từ (PO-GRN-Invoice), xác nhận thanh toán, chuyển tiền cho NCC",
        role: "FINANCE",
        roleIcon: <Wallet size={14} />,
        icon: <CreditCard size={20} />,
        dataState: {
            status: "PAYMENT_PROCESSING",
            changes: [
                { field: "Invoice Status", from: "-", to: "RECEIVED" },
                { field: "3-Way Match", from: "-", to: "VERIFIED" },
                { field: "Payment Status", from: "-", to: "PAID" },
                { field: "Budget", from: "Committed", to: "Spent" }
            ]
        },
        nextSteps: {
            approved: {
                condition: "Hoàn tất",
                action: "Quy trình hoàn tất. Lưu trữ hồ sơ và cập nhật KPI NCC.",
                icon: <CheckCircle size={14} />
            }
        }
    }
];

function ShoppingCart({ size, className }: { size: number, className?: string }) { return <ShoppingBag size={size} className={className} />; }

const StatusBadge = ({ status, type = "default" }: { status: string, type?: "default" | "success" | "warning" | "danger" | "info" }) => {
    const colors = {
        default: "bg-slate-500/10 text-slate-400 border-slate-500/20",
        success: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
        warning: "bg-amber-500/10 text-amber-400 border-amber-500/20",
        danger: "bg-rose-500/10 text-rose-400 border-rose-500/20",
        info: "bg-[#3B82F6]/10 text-[#3B82F6] border-[#3B82F6]/20"
    };
    
    return (
        <span className={`px-2 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${colors[type]}`}>
            {status}
        </span>
    );
};

const RoleBadge = ({ role, icon }: { role: string, icon: React.ReactNode }) => (
    <div className="flex items-center gap-2 px-3 py-1.5 bg-[#0F1117] rounded-lg border border-[rgba(148,163,184,0.1)]">
        <span className="text-[#3B82F6]">{icon}</span>
        <span className="text-[10px] font-black text-[#F8FAFC] uppercase tracking-wider">{role}</span>
    </div>
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
    const [expandedStep, setExpandedStep] = useState<number | null>(1);
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
        setExpandedStep(1);
        setPr(null);
        setRfq(null);
        setPo(null);
        setGrn(null);
        setInvoice(null);
        setQuotations([]);
        setBudget({ allocated: 500000000, committed: 0, spent: 0 });
    };

    const goToStep = (stepNum: number) => {
        if (stepNum <= currentStep) {
            setExpandedStep(stepNum);
        }
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
            const next = currentStep + 1;
            setCurrentStep(next);
            setExpandedStep(next);
            processStepLogic(next);
        }
    };

    const getStatusColor = (status: string) => {
        if (["APPROVED", "ISSUED", "CONFIRMED", "PAID", "MATCHED"].includes(status)) return "success";
        if (["SUBMITTED", "SENT", "PENDING", "QUOTES_RECEIVED"].includes(status)) return "warning";
        if (status === "DRAFT") return "default";
        if (status === "REJECTED") return "danger";
        return "info";
    };

    return (
        <div className="min-h-screen bg-[#0F1117] text-[#94A3B8] p-6 font-sans">
            <header className="max-w-[1600px] mx-auto flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-gradient-to-br from-[#3B82F6] to-purple-600 rounded-2xl shadow-lg shadow-[#3B82F6]/20">
                        <Zap className="text-white fill-white/20" size={24} />
                    </div>
                    <div>
                        <h1 className="text-2xl font-black text-[#F8FAFC] tracking-tighter uppercase italic">OMS Simulation</h1>
                        <p className="text-xs text-[#64748B] font-bold tracking-widest uppercase">Chi tiết quy trình mua hàng</p>
                    </div>
                </div>

                <div className="flex bg-[#161922] p-1 rounded-2xl border border-[rgba(148,163,184,0.1)]">
                    <button 
                        onClick={() => { setActiveWorkflow("CATALOG"); handleReset(); }}
                        className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeWorkflow === "CATALOG" ? "bg-[#3B82F6] text-white shadow-lg" : "text-[#64748B] hover:text-[#F8FAFC]"}`}
                    >
                        Workflow 1: Catalog
                    </button>
                    <button 
                        onClick={() => { setActiveWorkflow("NON_CATALOG"); handleReset(); }}
                        className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeWorkflow === "NON_CATALOG" ? "bg-purple-600 text-white shadow-lg" : "text-[#64748B] hover:text-[#F8FAFC]"}`}
                    >
                        Workflow 2: Non-Catalog
                    </button>
                </div>

                <button onClick={handleReset} className="p-3 text-[#64748B] hover:text-[#F8FAFC] transition-colors bg-[#161922] rounded-xl border border-[rgba(148,163,184,0.1)]">
                    <RefreshCw size={18} />
                </button>
            </header>

            <main className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8">
                
                <div className="lg:col-span-4 space-y-4">
                    <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-[#64748B] mb-4 px-2">
                        Quy trình {activeWorkflow === "CATALOG" ? "Catalog (5 bước)" : "Non-Catalog (10 bước)"}
                    </h2>
                    
                    <div className="relative space-y-3">
                        {steps.map((step, idx) => {
                            const isActive = currentStep === step.id;
                            const isCompleted = currentStep > step.id;
                            const isExpanded = expandedStep === step.id;
                            
                            return (
                                <div 
                                    key={idx} 
                                    onClick={() => goToStep(step.id)}
                                    className={`cursor-pointer rounded-2xl border transition-all duration-300 ${
                                        isActive ? "bg-[#161922] border-[#3B82F6]/30" : 
                                        isCompleted ? "bg-[#161922]/50 border-[rgba(148,163,184,0.1)]" : 
                                        "bg-[#0F1117] border-[rgba(148,163,184,0.05)] opacity-60"
                                    }`}
                                >
                                    {/* Step Header */}
                                    <div className="p-4 flex items-start gap-3">
                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-all ${
                                            isActive ? "bg-[#3B82F6] text-white shadow-lg shadow-[#3B82F6]/20" : 
                                            isCompleted ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" : 
                                            "bg-[#0F1117] text-[#64748B] border border-[rgba(148,163,184,0.1)]"
                                        }`}>
                                            {isCompleted ? <CheckCircle size={18} /> : step.icon}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className={`text-[10px] font-black uppercase tracking-wider ${isActive ? "text-[#3B82F6]" : "text-[#64748B]"}`}>
                                                    Bước {step.id}
                                                </span>
                                                <RoleBadge role={step.role} icon={step.roleIcon} />
                                            </div>
                                            <h4 className={`text-sm font-black uppercase tracking-wide truncate ${isActive ? "text-[#F8FAFC]" : "text-[#94A3B8]"}`}>
                                                {step.title}
                                            </h4>
                                            <p className="text-[11px] text-[#64748B] leading-tight mt-1 line-clamp-2">
                                                {step.description}
                                            </p>
                                        </div>
                                        <ChevronDown 
                                            size={16} 
                                            className={`text-[#64748B] transition-transform ${isExpanded ? "rotate-180" : ""}`} 
                                        />
                                    </div>
                                    
                                    {/* Expanded Details */}
                                    {isExpanded && (
                                        <div className="px-4 pb-4 pt-2 border-t border-[rgba(148,163,184,0.1)] animate-in slide-in-from-top-2 duration-200">
                                            {/* Function */}
                                            <div className="mb-4">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <Eye size={12} className="text-[#3B82F6]" />
                                                    <span className="text-[10px] font-black uppercase tracking-wider text-[#64748B]">Chức năng chi tiết</span>
                                                </div>
                                                <p className="text-xs text-[#94A3B8] leading-relaxed bg-[#0F1117] p-3 rounded-lg border border-[rgba(148,163,184,0.1)]">
                                                    {step.function}
                                                </p>
                                            </div>
                                            
                                            {/* Data State Changes */}
                                            <div className="mb-4">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <GitBranch size={12} className="text-purple-400" />
                                                    <span className="text-[10px] font-black uppercase tracking-wider text-[#64748B]">Thay đổi dữ liệu</span>
                                                </div>
                                                <div className="space-y-2">
                                                    {step.dataState.changes.map((change, cidx) => (
                                                        <div key={cidx} className="flex items-center gap-2 text-[11px] bg-[#0F1117] p-2 rounded-lg border border-[rgba(148,163,184,0.1)]">
                                                            <span className="text-[#64748B] font-medium">{change.field}:</span>
                                                            <span className="text-[#64748B] line-through">{change.from}</span>
                                                            <ArrowRight size={10} className="text-[#3B82F6]" />
                                                            <span className="text-emerald-400 font-bold">{change.to}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                            
                                            {/* Next Steps Flow */}
                                            <div>
                                                <div className="flex items-center gap-2 mb-2">
                                                    <GitBranch size={12} className="text-amber-400" />
                                                    <span className="text-[10px] font-black uppercase tracking-wider text-[#64748B]">Luồng tiếp theo</span>
                                                </div>
                                                <div className="space-y-2">
                                                    <div className="flex items-start gap-2 p-2 bg-emerald-500/5 border border-emerald-500/20 rounded-lg">
                                                        <CheckCircle size={14} className="text-emerald-400 shrink-0 mt-0.5" />
                                                        <div>
                                                            <span className="text-[10px] font-black uppercase text-emerald-400">Phê duyệt:</span>
                                                            <p className="text-[11px] text-[#94A3B8] mt-0.5">{step.nextSteps.approved.action}</p>
                                                        </div>
                                                    </div>
                                                    {step.nextSteps.rejected && (
                                                        <div className="flex items-start gap-2 p-2 bg-rose-500/5 border border-rose-500/20 rounded-lg">
                                                            <XCircle size={14} className="text-rose-400 shrink-0 mt-0.5" />
                                                            <div>
                                                                <span className="text-[10px] font-black uppercase text-rose-400">Từ chối:</span>
                                                                <p className="text-[11px] text-[#94A3B8] mt-0.5">{step.nextSteps.rejected.action}</p>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>

                <div className="lg:col-span-5">
                    <div className="bg-[#161922] border border-[rgba(148,163,184,0.1)] rounded-[32px] p-8 min-h-[500px] flex flex-col items-center justify-center text-center relative overflow-hidden sticky top-6">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-[#3B82F6]/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
                        <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-600/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2"></div>

                        <div className="relative z-10 w-full animate-in fade-in duration-500">
                            <div className="p-6 bg-[#0F1117] backdrop-blur-3xl rounded-[24px] border border-[rgba(148,163,184,0.1)] shadow-2xl mb-6 inline-block">
                                {currentStepData.icon}
                            </div>
                            
                            <div className="mb-2">
                                <span className="text-[10px] font-black uppercase tracking-widest text-[#64748B]">Bước {currentStepData.id}</span>
                            </div>
                            
                            <h1 className="text-3xl font-black text-[#F8FAFC] tracking-tighter mb-4 uppercase italic">
                                {currentStepData.title}
                            </h1>
                            
                            <p className="text-[#94A3B8] max-w-md mx-auto text-sm leading-relaxed mb-8">
                                {currentStepData.description}
                            </p>

                            {/* Role Badge */}
                            <div className="flex items-center justify-center gap-2 mb-8">
                                <span className="text-[11px] text-[#64748B]">Thực hiện bởi:</span>
                                <RoleBadge role={currentStepData.role} icon={currentStepData.roleIcon} />
                            </div>

                            <button 
                                onClick={nextStep}
                                disabled={currentStep === steps.length}
                                className={`group relative inline-flex items-center gap-3 px-10 py-5 rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] shadow-2xl transition-all duration-300 active:scale-95 ${
                                    currentStep === steps.length 
                                    ? "bg-[#161922] text-[#64748B] cursor-not-allowed border border-[rgba(148,163,184,0.1)]" 
                                    : activeWorkflow === "CATALOG" 
                                    ? "bg-[#3B82F6] text-white shadow-[#3B82F6]/20 hover:shadow-[#3B82F6]/40 hover:scale-105" 
                                    : "bg-purple-600 text-white shadow-purple-600/20 hover:shadow-purple-600/40 hover:scale-105"
                                }`}
                            >
                                {currentStep === steps.length ? "Hoàn tất quy trình" : "Thực hiện bước này"}
                                <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" />
                            </button>
                            
                            {/* AI Quotes for Non-Catalog Step 4 */}
                            {activeWorkflow === "NON_CATALOG" && currentStep === 4 && (
                                <div className="mt-10 grid grid-cols-3 gap-3 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                    {quotations.map(q => (
                                        <div key={q.id} className="p-4 bg-[#0F1117] border border-[rgba(148,163,184,0.1)] rounded-2xl text-left hover:border-[#3B82F6]/30 transition-all">
                                            <div className="flex justify-between items-start mb-2">
                                                <span className="text-[10px] font-black text-[#F8FAFC]">{q.supplier}</span>
                                                <span className="text-emerald-400 text-[10px] font-black">{q.aiScore}%</span>
                                            </div>
                                            <div className="text-xs text-[#3B82F6] font-black">{(q.price/1000000).toFixed(0)}M ₫</div>
                                            <div className="text-[9px] mt-2 text-[#64748B] uppercase tracking-widest font-black flex items-center gap-1">
                                                <Bot size={10} className="text-purple-400" /> {q.aiRec}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="lg:col-span-3 space-y-4">
                    {/* Entities */}
                    <div className="bg-[#161922] border border-[rgba(148,163,184,0.1)] rounded-2xl p-5">
                        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-[#64748B] mb-4 flex items-center gap-2">
                            <BarChart3 size={14} /> Đối tượng dữ liệu
                        </h3>
                        
                        <div className="space-y-3">
                            {pr && (
                                <div className="p-3 bg-[#0F1117] rounded-xl border border-[rgba(148,163,184,0.1)]">
                                    <div className="flex justify-between items-start mb-2">
                                        <div className="flex items-center gap-2">
                                            <div className="p-1.5 bg-[#3B82F6]/10 rounded-lg"><FileText size={12} className="text-[#3B82F6]" /></div>
                                            <span className="text-[11px] font-black text-[#F8FAFC]">{pr.id}</span>
                                        </div>
                                        <StatusBadge status={pr.status} type={getStatusColor(pr.status) as any} />
                                    </div>
                                    <div className="text-[10px] text-[#64748B]">{(pr.total/1000000).toFixed(0)}M ₫</div>
                                </div>
                            )}

                            {rfq && (
                                <div className="p-3 bg-[#0F1117] rounded-xl border border-[rgba(148,163,184,0.1)]">
                                    <div className="flex justify-between items-start mb-2">
                                        <div className="flex items-center gap-2">
                                            <div className="p-1.5 bg-amber-500/10 rounded-lg"><Search size={12} className="text-amber-400" /></div>
                                            <span className="text-[11px] font-black text-[#F8FAFC]">{rfq.id}</span>
                                        </div>
                                        <StatusBadge status={rfq.status} type={getStatusColor(rfq.status) as any} />
                                    </div>
                                    <div className="text-[10px] text-[#64748B] truncate">{rfq.supplier || rfq.title}</div>
                                </div>
                            )}

                            {po && (
                                <div className="p-3 bg-[#0F1117] rounded-xl border border-emerald-500/20">
                                    <div className="flex justify-between items-start mb-2">
                                        <div className="flex items-center gap-2">
                                            <div className="p-1.5 bg-emerald-500/10 rounded-lg"><ShoppingBag size={12} className="text-emerald-400" /></div>
                                            <span className="text-[11px] font-black text-[#F8FAFC]">{po.id}</span>
                                        </div>
                                        <StatusBadge status={po.status} type={getStatusColor(po.status) as any} />
                                    </div>
                                    <div className="text-[10px] text-emerald-400 font-black">{(po.total/1000000).toFixed(0)}M ₫</div>
                                </div>
                            )}

                            {grn && (
                                <div className="p-3 bg-[#0F1117] rounded-xl border border-[rgba(148,163,184,0.1)]">
                                    <div className="flex justify-between items-start mb-2">
                                        <div className="flex items-center gap-2">
                                            <div className="p-1.5 bg-purple-500/10 rounded-lg"><Package size={12} className="text-purple-400" /></div>
                                            <span className="text-[11px] font-black text-[#F8FAFC]">{grn.id}</span>
                                        </div>
                                        <StatusBadge status={grn.status} type="success" />
                                    </div>
                                </div>
                            )}

                            {invoice && (
                                <div className="p-3 bg-[#0F1117] rounded-xl border border-[rgba(148,163,184,0.1)]">
                                    <div className="flex justify-between items-start mb-2">
                                        <div className="flex items-center gap-2">
                                            <div className="p-1.5 bg-rose-500/10 rounded-lg"><CreditCard size={12} className="text-rose-400" /></div>
                                            <span className="text-[11px] font-black text-[#F8FAFC]">{invoice.id}</span>
                                        </div>
                                        <StatusBadge status={invoice.status} type="success" />
                                    </div>
                                    <div className="text-[10px] text-[#64748B]">{(invoice.total/1000000).toFixed(0)}M ₫</div>
                                </div>
                            )}

                            {!pr && !rfq && !po && !grn && !invoice && (
                                <div className="py-8 text-center border border-dashed border-[rgba(148,163,184,0.1)] rounded-xl">
                                    <span className="text-[10px] font-black uppercase tracking-widest text-[#64748B]">Chưa có dữ liệu</span>
                                    <p className="text-[9px] text-[#64748B] mt-1">Thực hiện các bước để tạo dữ liệu</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Budget */}
                    <div className="bg-gradient-to-br from-[#161922] to-[#0F1117] border border-[rgba(148,163,184,0.1)] rounded-2xl p-5">
                        <h3 className="text-[10px] font-black uppercase tracking-widest text-[#64748B] mb-4 flex items-center gap-2">
                            <Wallet size={14} /> Kiểm soát ngân sách
                        </h3>
                        <div className="space-y-4">
                            <div>
                                <div className="flex justify-between text-[10px] font-black uppercase mb-1.5">
                                    <span className="text-amber-400">Committed</span>
                                    <span className="text-[#F8FAFC]">{(budget.committed/1000000).toFixed(1)}M / {(budget.allocated/1000000).toFixed(0)}M</span>
                                </div>
                                <div className="h-1.5 w-full bg-[#0F1117] rounded-full overflow-hidden border border-[rgba(148,163,184,0.1)]">
                                    <div 
                                        className="h-full bg-amber-400 transition-all duration-500" 
                                        style={{ width: `${Math.min((budget.committed / budget.allocated) * 100, 100)}%` }}
                                    ></div>
                                </div>
                            </div>
                            <div>
                                <div className="flex justify-between text-[10px] font-black uppercase mb-1.5">
                                    <span className="text-[#3B82F6]">Spent</span>
                                    <span className="text-[#F8FAFC]">{(budget.spent/1000000).toFixed(1)}M</span>
                                </div>
                                <div className="h-1.5 w-full bg-[#0F1117] rounded-full overflow-hidden border border-[rgba(148,163,184,0.1)]">
                                    <div 
                                        className="h-full bg-[#3B82F6] transition-all duration-500" 
                                        style={{ width: `${Math.min((budget.spent / budget.allocated) * 100, 100)}%` }}
                                    ></div>
                                </div>
                            </div>
                            <div className="pt-3 border-t border-[rgba(148,163,184,0.1)]">
                                <div className="flex justify-between text-[10px]">
                                    <span className="text-[#64748B] uppercase font-bold">Còn lại:</span>
                                    <span className="text-emerald-400 font-black">{((budget.allocated - budget.committed - budget.spent)/1000000).toFixed(1)}M ₫</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            {activeWorkflow === "NON_CATALOG" && currentStep >= 4 && (
                <div className="fixed bottom-12 right-12 w-80 bg-[#161922] border border-[rgba(148,163,184,0.1)] rounded-3xl shadow-2xl p-6 backdrop-blur-xl animate-in fade-in slide-in-from-bottom-8 duration-700">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-purple-600 rounded-xl"><Bot size={18} className="text-white" /></div>
                        <span className="text-[10px] font-black uppercase tracking-widest text-text-primary">AI Analyst</span>
                    </div>
                    <div className="p-4 bg-emerald-500/5 border border-emerald-500/20 rounded-2xl">
                        <p className="text-[11px] text-emerald-400/80 leading-relaxed font-medium">
                            <span className="font-black">ĐỀ XUẤT:</span> HPT Vietnam (Q2) là lựa chọn tối ưu với giá thấp hơn 21% ngân sách.
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
}
