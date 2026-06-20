"use client";

import React, { useState } from "react";
import {
    Zap, ShoppingBag, FileText, CheckCircle, XCircle,
    RefreshCw, Send, BarChart3, Bot, ChevronRight, ChevronDown,
    Star, DollarSign, Truck, ShieldCheck,
    User, Building2, BrainCircuit, ArrowRight,
    Clock, Package, Wallet,
    RotateCcw, Eye, GitBranch, AlertTriangle, Scale,
    Award, TrendingUp, Search, FileCheck, CreditCard, Layers, 
    ArrowLeft
} from "lucide-react";
import { getStatusLabel } from "../utils/formatUtils";

// --- Types ---

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
    detailedFunction: string;
    role: string;
    roleIcon: React.ReactNode;
    icon: React.ReactNode;
    color: string;
    dataState: {
        status: string;
        changes: DataChange[];
    };
    nextSteps: {
        approved: NextAction;
        rejected?: NextAction;
    };
}

// --- Unified P2P Flow: 10 Steps ---
const P2P_STEPS: StepDetail[] = [
    {
        id: 1,
        title: "Tạo yêu cầu mua hàng (PR)",
        description: "Nhân viên tạo Purchase Requisition với danh sách hàng hóa cần mua",
        detailedFunction: "Requester tạo PR bao gồm: danh sách sản phẩm/dịch vụ cần mua, số lượng, đơn giá ước tính, lý do mua hàng, ngày cần hàng. Hệ thống tự động kiểm tra ngân sách khả dụng theo Category + Cost Center, soft-commit ngân sách nếu đủ.",
        role: "REQUESTER",
        roleIcon: <User size={14} />,
        icon: <FileText size={22} />,
        color: "from-blue-500 to-blue-600",
        dataState: {
            status: "DRAFT",
            changes: [
                { field: "PR Status", from: "—", to: "DRAFT" },
                { field: "Budget Check", from: "—", to: "Pre-commitment" },
                { field: "Created By", from: "—", to: "Nguyễn Văn A (Requester)" },
                { field: "Total Estimate", from: "0", to: "85,000,000 ₫" }
            ]
        },
        nextSteps: {
            approved: {
                condition: "Submit PR",
                action: "PR chuyển sang PENDING_APPROVAL, gửi thông báo đến Manager phê duyệt",
                targetStep: 2,
                icon: <ArrowRight size={14} />
            }
        }
    },
    {
        id: 2,
        title: "Phê duyệt PR",
        description: "Manager / Director / CEO phê duyệt yêu cầu theo ma trận phê duyệt động",
        detailedFunction: "Hệ thống xác định cấp phê duyệt dựa trên giá trị PR: L1 (≤10M: Trưởng phòng), L2 (≤30M: +Director), L3 (≤100M: +CEO). Mỗi cấp nhận notification qua email + in-app. Có thể ủy quyền (Delegation) khi vắng mặt. SLA: 8 giờ/cấp, auto-escalate sau 24 giờ.",
        role: "MANAGER",
        roleIcon: <ShieldCheck size={14} />,
        icon: <ShieldCheck size={22} />,
        color: "from-emerald-500 to-emerald-600",
        dataState: {
            status: "PENDING_APPROVAL",
            changes: [
                { field: "PR Status", from: "DRAFT", to: "PENDING_APPROVAL" },
                { field: "Approval Level", from: "—", to: "L2 (Director)" },
                { field: "Budget Committed", from: "0 ₫", to: "85,000,000 ₫" },
                { field: "SLA Deadline", from: "—", to: "8h kể từ submit" }
            ]
        },
        nextSteps: {
            approved: {
                condition: "Tất cả cấp phê duyệt",
                action: "PR → APPROVED, hệ thống tự động tạo RFQ để mời nhà cung cấp báo giá",
                targetStep: 3,
                icon: <CheckCircle size={14} />
            },
            rejected: {
                condition: "Bất kỳ cấp từ chối",
                action: "PR → REJECTED, giải phóng ngân sách đã commit, thông báo Requester",
                targetStep: 1,
                icon: <RotateCcw size={14} />
            }
        }
    },
    {
        id: 3,
        title: "Tạo RFQ & Mời thầu",
        description: "Procurement tạo Request for Quotation và gửi mời nhà cung cấp báo giá",
        detailedFunction: "AutomationService tự động tạo RFQ từ PR đã duyệt. Procurement chọn danh sách NCC tiềm năng (AI gợi ý dựa trên KPI + category match). Gửi email mời thầu kèm thông số kỹ thuật, số lượng, deadline báo giá. Tối thiểu cần 3 NCC tham gia (trừ Single Source đặc biệt).",
        role: "PROCUREMENT",
        roleIcon: <Package size={14} />,
        icon: <Send size={22} />,
        color: "from-violet-500 to-violet-600",
        dataState: {
            status: "RFQ_SENT",
            changes: [
                { field: "PR Status", from: "APPROVED", to: "IN_SOURCING" },
                { field: "RFQ Status", from: "—", to: "SENT" },
                { field: "Suppliers Invited", from: "0", to: "3 nhà cung cấp" },
                { field: "Quote Deadline", from: "—", to: "7 ngày" }
            ]
        },
        nextSteps: {
            approved: {
                condition: "RFQ đã gửi thành công",
                action: "Chờ NCC phản hồi báo giá trong thời hạn deadline",
                targetStep: 4,
                icon: <Clock size={14} />
            }
        }
    },
    {
        id: 4,
        title: "Nhà cung cấp báo giá",
        description: "Các nhà cung cấp gửi Quotation qua Supplier Portal",
        detailedFunction: "NCC đăng nhập Supplier Portal, xem chi tiết RFQ và gửi báo giá gồm: đơn giá từng item, lead time giao hàng, điều kiện thanh toán, bảo hành. NCC có thể đặt câu hỏi qua Q&A Thread. Hệ thống theo dõi deadline và nhắc nhở NCC chưa phản hồi.",
        role: "SUPPLIER",
        roleIcon: <Building2 size={14} />,
        icon: <Layers size={22} />,
        color: "from-amber-500 to-amber-600",
        dataState: {
            status: "QUOTATION_RECEIVED",
            changes: [
                { field: "RFQ Status", from: "SENT", to: "QUOTATION_RECEIVED" },
                { field: "Quotations", from: "0", to: "3 báo giá" },
                { field: "Price Range", from: "—", to: "78M – 95M ₫" },
                { field: "Lead Time Range", from: "—", to: "7 – 14 ngày" }
            ]
        },
        nextSteps: {
            approved: {
                condition: "Đủ số lượng báo giá (≥3)",
                action: "Chuyển sang AI phân tích và chấm điểm tự động các báo giá",
                targetStep: 5,
                icon: <BrainCircuit size={14} />
            }
        }
    },
    {
        id: 5,
        title: "AI Phân tích & Đề xuất",
        description: "AI Gemini chấm điểm và xếp hạng các báo giá, đề xuất NCC tối ưu",
        detailedFunction: "AI (Google Gemini) phân tích đa chiều: Giá cả (40%) — so sánh với giá thị trường và giá lần mua trước; Lead Time (30%) — thời gian giao hàng cam kết; KPI Nhà cung cấp (30%) — on-time delivery, quality rate, response time. Tạo báo cáo ưu/nhược điểm bằng ngôn ngữ tự nhiên cho từng NCC.",
        role: "AI SYSTEM",
        roleIcon: <Bot size={14} />,
        icon: <BrainCircuit size={22} />,
        color: "from-purple-500 to-purple-600",
        dataState: {
            status: "AI_RECOMMENDED",
            changes: [
                { field: "RFQ Status", from: "QUOTATION_RECEIVED", to: "AI_RECOMMENDED" },
                { field: "AI Score #1", from: "—", to: "HPT: 92/100 ⭐" },
                { field: "AI Score #2", from: "—", to: "CMC: 85/100" },
                { field: "AI Score #3", from: "—", to: "SVTech: 78/100" },
                { field: "Recommendation", from: "—", to: "HPT Vietnam" }
            ]
        },
        nextSteps: {
            approved: {
                condition: "AI đã phân tích xong",
                action: "Procurement xem xét đề xuất AI và quyết định chọn NCC thắng thầu",
                targetStep: 6,
                icon: <Star size={14} />
            }
        }
    },
    {
        id: 6,
        title: "Chọn NCC & Phát hành PO",
        description: "Procurement chọn NCC thắng thầu, tạo PO và gửi đến nhà cung cấp",
        detailedFunction: "Buyer award quotation cho NCC được chọn. Hệ thống tạo Purchase Order (PO) tự động từ báo giá, liên kết PR → RFQ → Quotation → PO. Nếu giá trị PO ≥ 50M VND, tự động tạo Contract draft. PO được phát hành (ISSUED) và gửi đến NCC qua email + portal.",
        role: "PROCUREMENT",
        roleIcon: <Package size={14} />,
        icon: <ShoppingBag size={22} />,
        color: "from-indigo-500 to-indigo-600",
        dataState: {
            status: "PO_ISSUED",
            changes: [
                { field: "RFQ Status", from: "AI_RECOMMENDED", to: "AWARDED" },
                { field: "PO Status", from: "—", to: "ISSUED" },
                { field: "PO Amount", from: "0 ₫", to: "82,500,000 ₫" },
                { field: "Selected Supplier", from: "—", to: "HPT Vietnam" },
                { field: "Contract", from: "—", to: "Auto-created (≥50M)" }
            ]
        },
        nextSteps: {
            approved: {
                condition: "NCC xác nhận PO (ACKNOWLEDGED)",
                action: "NCC chuẩn bị hàng hóa và giao hàng theo cam kết",
                targetStep: 7,
                icon: <Truck size={14} />
            }
        }
    },
    {
        id: 7,
        title: "Giao hàng & Nhận hàng (GRN)",
        description: "Warehouse nhận hàng, kiểm tra chất lượng QC và tạo Goods Receipt Note",
        detailedFunction: "NCC giao hàng đến kho. Warehouse kiểm đếm số lượng thực nhận, kiểm tra chất lượng QC (PASS/PARTIAL_PASS/FAIL), chụp ảnh chứng minh, ghi nhận batch number, expiry date. Tạo GRN (Goods Receipt Note) với chi tiết từng line item. Nếu có hàng lỗi → tạo Return To Vendor (RTV).",
        role: "WAREHOUSE",
        roleIcon: <Truck size={14} />,
        icon: <Package size={22} />,
        color: "from-teal-500 to-teal-600",
        dataState: {
            status: "GRN_CONFIRMED",
            changes: [
                { field: "PO Status", from: "ACKNOWLEDGED", to: "GRN_CREATED" },
                { field: "GRN Status", from: "—", to: "CONFIRMED" },
                { field: "QC Result", from: "—", to: "PASS ✓" },
                { field: "Received Qty", from: "0", to: "100% đủ hàng" },
                { field: "Delivery", from: "Đang giao", to: "Đã nhận" }
            ]
        },
        nextSteps: {
            approved: {
                condition: "GRN confirmed, hàng đạt chuẩn",
                action: "Chuyển sang Finance kiểm tra 3-Way Matching trước khi thanh toán",
                targetStep: 8,
                icon: <Scale size={14} />
            },
            rejected: {
                condition: "Hàng lỗi / thiếu / hỏng",
                action: "Tạo Dispute, yêu cầu NCC bổ sung hoặc đổi trả (RTV)",
                icon: <XCircle size={14} />
            }
        }
    },
    {
        id: 8,
        title: "Kiểm tra 3-Way Matching",
        description: "Finance so khớp 3 chứng từ: PO ↔ GRN ↔ Invoice trước thanh toán",
        detailedFunction: "NCC nộp Invoice (hóa đơn) qua portal. Finance kiểm tra tính khớp lệch giữa 3 chứng từ: (1) PO — đơn giá, số lượng đặt; (2) GRN — số lượng thực nhận; (3) Invoice — số tiền NCC yêu cầu thanh toán. Ngưỡng cho phép: Qty ±2%, Price ±1%. Nếu khớp → AUTO_APPROVED. Nếu sai lệch → EXCEPTION_REVIEW cần Finance xử lý thủ công.",
        role: "FINANCE",
        roleIcon: <FileCheck size={14} />,
        icon: <Scale size={22} />,
        color: "from-cyan-500 to-cyan-600",
        dataState: {
            status: "INVOICE_MATCHED",
            changes: [
                { field: "Invoice Status", from: "SUBMITTED", to: "AUTO_APPROVED" },
                { field: "3-Way Match", from: "—", to: "PASSED ✓" },
                { field: "Qty Variance", from: "—", to: "0.0% (trong ngưỡng)" },
                { field: "Price Variance", from: "—", to: "0.0% (trong ngưỡng)" },
                { field: "Match Result", from: "—", to: "PO = GRN = Invoice ✓" }
            ]
        },
        nextSteps: {
            approved: {
                condition: "3-Way Match thành công",
                action: "Invoice được duyệt, chuyển sang lập lệnh thanh toán cho NCC",
                targetStep: 9,
                icon: <DollarSign size={14} />
            },
            rejected: {
                condition: "Phát hiện sai lệch vượt ngưỡng",
                action: "Invoice → EXCEPTION_REVIEW, Finance xử lý thủ công hoặc tạo Debit/Credit Note",
                icon: <AlertTriangle size={14} />
            }
        }
    },
    {
        id: 9,
        title: "Thanh toán",
        description: "Finance lập lệnh thanh toán, chuyển tiền cho nhà cung cấp",
        detailedFunction: "Tạo Payment Record sau khi Invoice được duyệt. Kế toán xác nhận và lập lệnh chuyển khoản ngân hàng. Hỗ trợ nhiều phương thức: Bank Transfer, Escrow Release, VNPay, LC/TT. Budget chuyển từ Committed → Spent (Hard Commit). Ghi nhận AuditLog đầy đủ cho truy vết.",
        role: "FINANCE",
        roleIcon: <Wallet size={14} />,
        icon: <CreditCard size={22} />,
        color: "from-rose-500 to-rose-600",
        dataState: {
            status: "PAYMENT_COMPLETED",
            changes: [
                { field: "Payment Status", from: "PENDING", to: "COMPLETED" },
                { field: "Amount Paid", from: "0 ₫", to: "82,500,000 ₫" },
                { field: "Budget", from: "Committed", to: "Spent (Hard Commit)" },
                { field: "Bank Transfer", from: "—", to: "Thành công ✓" },
                { field: "PO Status", from: "GRN_CREATED", to: "COMPLETED" }
            ]
        },
        nextSteps: {
            approved: {
                condition: "Thanh toán thành công",
                action: "Trigger tính KPI nhà cung cấp, khép kín chu trình P2P",
                targetStep: 10,
                icon: <TrendingUp size={14} />
            }
        }
    },
    {
        id: 10,
        title: "Đánh giá NCC (KPI)",
        description: "Hệ thống tính toán KPI nhà cung cấp và xếp hạng Tier",
        detailedFunction: "Sau khi Payment COMPLETED, hệ thống tự động tính 6 chỉ số KPI: On-Time Delivery (giao đúng hạn), Quality Score (chất lượng hàng), Price Competitiveness (giá cạnh tranh), Invoice Accuracy (hóa đơn chính xác), Fulfillment Rate (tỷ lệ hoàn thành), Response Time (thời gian phản hồi). Xếp hạng Tier: STRATEGIC (≥90) → PREFERRED (≥80) → APPROVED (≥65) → CONDITIONAL (<65). Warehouse và Procurement cũng có thể đánh giá thủ công bổ sung.",
        role: "SYSTEM",
        roleIcon: <Zap size={14} />,
        icon: <Award size={22} />,
        color: "from-yellow-500 to-yellow-600",
        dataState: {
            status: "KPI_COMPLETED",
            changes: [
                { field: "Overall KPI", from: "—", to: "92/100 ⭐" },
                { field: "On-Time Delivery", from: "—", to: "95%" },
                { field: "Quality Score", from: "—", to: "90%" },
                { field: "Supplier Tier", from: "APPROVED", to: "STRATEGIC ↑" },
                { field: "P2P Cycle", from: "In Progress", to: "COMPLETED ✓" }
            ]
        },
        nextSteps: {
            approved: {
                condition: "Hoàn tất chu trình P2P",
                action: "Toàn bộ hồ sơ được lưu trữ. Dữ liệu KPI tích lũy cho các lần đánh giá tiếp theo.",
                icon: <CheckCircle size={14} />
            }
        }
    }
];

// --- Sub-components ---

const StatusBadge = ({ status, type = "default" }: { status: string; type?: "default" | "success" | "warning" | "danger" | "info" }) => {
    const translatedStatus = getStatusLabel(status);
    const colors = {
        default: "bg-slate-100 text-slate-700 border-slate-200",
        success: "bg-emerald-50 text-emerald-700 border-emerald-200",
        warning: "bg-amber-50 text-amber-700 border-amber-200",
        danger: "bg-rose-50 text-rose-700 border-rose-200",
        info: "bg-blue-50 text-blue-700 border-blue-200"
    };

    return (
        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${colors[type]}`}>
            {translatedStatus}
        </span>
    );
};

const RoleBadge = ({ role, icon }: { role: string; icon: React.ReactNode }) => (
    <div className="flex items-center gap-1.5 px-2.5 py-1 bg-white rounded-lg border border-slate-200 shadow-sm">
        <span className="text-blue-600">{icon}</span>
        <span className="text-[10px] font-bold text-slate-700 uppercase tracking-wider">{role}</span>
    </div>
);

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
    leadTime: string;
}

interface BudgetState {
    allocated: number;
    committed: number;
    spent: number;
}

// --- Main Component ---

export default function SimulationPage() {
    const [currentStep, setCurrentStep] = useState(1);
    const [expandedStep, setExpandedStep] = useState<number | null>(1);
    const [budget, setBudget] = useState<BudgetState>({ allocated: 500000000, committed: 0, spent: 0 });

    const [pr, setPr] = useState<EntityState | null>(null);
    const [rfq, setRfq] = useState<EntityState | null>(null);
    const [po, setPo] = useState<EntityState | null>(null);
    const [grn, setGrn] = useState<EntityState | null>(null);
    const [invoice, setInvoice] = useState<EntityState | null>(null);
    const [payment, setPayment] = useState<EntityState | null>(null);
    const [kpi, setKpi] = useState<EntityState | null>(null);
    const [quotations, setQuotations] = useState<Quotation[]>([]);

    const steps = P2P_STEPS;
    const currentStepData = steps[currentStep - 1];
    const progress = ((currentStep - 1) / (steps.length - 1)) * 100;

    const handleReset = () => {
        setCurrentStep(1);
        setExpandedStep(1);
        setPr(null);
        setRfq(null);
        setPo(null);
        setGrn(null);
        setInvoice(null);
        setPayment(null);
        setKpi(null);
        setQuotations([]);
        setBudget({ allocated: 500000000, committed: 0, spent: 0 });
    };

    const goToStep = (stepNum: number) => {
        if (stepNum <= currentStep) {
            setExpandedStep(stepNum);
        }
    };

    const processStepLogic = (stepNum: number) => {
        switch (stepNum) {
            case 1:
                setPr({ id: "PR-2026-0042", status: "DRAFT", total: 85000000, title: "Thiết bị văn phòng Q3" });
                break;
            case 2:
                setPr(prev => prev ? ({ ...prev, status: "PENDING_APPROVAL" }) : null);
                setBudget(prev => ({ ...prev, committed: prev.committed + 85000000 }));
                break;
            case 3:
                setPr(prev => prev ? ({ ...prev, status: "APPROVED" }) : null);
                setRfq({ id: "RFQ-2026-0018", status: "SENT", total: 0, title: "Thiết bị văn phòng Q3" });
                break;
            case 4:
                setRfq(prev => prev ? ({ ...prev, status: "QUOTATION_RECEIVED" }) : null);
                setQuotations([
                    { id: "Q1", supplier: "HPT Vietnam", price: 82500000, aiScore: 92, aiRec: "Giá tốt, giao nhanh", leadTime: "7 ngày" },
                    { id: "Q2", supplier: "CMC Corp", price: 89000000, aiScore: 85, aiRec: "Uy tín cao", leadTime: "10 ngày" },
                    { id: "Q3", supplier: "SVTech", price: 95000000, aiScore: 78, aiRec: "Bảo hành dài", leadTime: "14 ngày" }
                ]);
                break;
            case 5:
                setRfq(prev => prev ? ({ ...prev, status: "AI_RECOMMENDED" }) : null);
                break;
            case 6:
                setRfq(prev => prev ? ({ ...prev, status: "AWARDED" }) : null);
                setPr(prev => prev ? ({ ...prev, status: "PO_CREATED" }) : null);
                setPo({ id: "PO-2026-0031", status: "ISSUED", total: 82500000, supplier: "HPT Vietnam" });
                break;
            case 7:
                setPo(prev => prev ? ({ ...prev, status: "ACKNOWLEDGED" }) : null);
                setGrn({ id: "GRN-2026-0027", status: "CONFIRMED", total: 82500000 });
                break;
            case 8:
                setPo(prev => prev ? ({ ...prev, status: "GRN_CREATED" }) : null);
                setInvoice({ id: "INV-2026-0019", status: "AUTO_APPROVED", total: 82500000, supplier: "HPT Vietnam" });
                break;
            case 9:
                setPo(prev => prev ? ({ ...prev, status: "COMPLETED" }) : null);
                setPayment({ id: "PAY-2026-0015", status: "COMPLETED", total: 82500000 });
                setBudget(prev => ({
                    ...prev,
                    spent: prev.spent + 82500000,
                    committed: Math.max(0, prev.committed - 85000000)
                }));
                break;
            case 10:
                setKpi({ id: "KPI-Q3-HPT", status: "COMPLETED", total: 92, supplier: "HPT Vietnam" });
                setPr(prev => prev ? ({ ...prev, status: "COMPLETED" }) : null);
                break;
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

    const prevStep = () => {
        if (currentStep > 1) {
            setExpandedStep(currentStep - 1);
        }
    };

    const getStatusColor = (status: string): "default" | "success" | "warning" | "danger" | "info" => {
        if (["APPROVED", "ISSUED", "CONFIRMED", "PAID", "COMPLETED", "AUTO_APPROVED", "AWARDED", "PO_CREATED", "GRN_CREATED", "ACKNOWLEDGED"].includes(status)) return "success";
        if (["SUBMITTED", "SENT", "PENDING", "QUOTATION_RECEIVED", "PENDING_APPROVAL", "IN_SOURCING", "AI_RECOMMENDED"].includes(status)) return "warning";
        if (status === "DRAFT") return "default";
        if (["REJECTED", "FAILED", "CANCELLED"].includes(status)) return "danger";
        return "info";
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30 text-slate-900 font-sans">
            {/* Header */}
            <header className="sticky top-0 z-50 backdrop-blur-xl bg-white/80 border-b border-slate-200/60 shadow-sm">
                <div className="max-w-[1600px] mx-auto px-6 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="p-2.5 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl shadow-lg shadow-blue-600/20">
                                <Zap className="text-white" size={22} />
                            </div>
                            <div>
                                <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
                                    Mô phỏng Quy trình P2P
                                </h1>
                                <p className="text-xs text-slate-500 font-medium mt-0.5">
                                    Procure-to-Pay • 10 bước nghiệp vụ hoàn chỉnh
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            {/* Progress indicator */}
                            <div className="hidden md:flex items-center gap-2 px-4 py-2 bg-slate-50 rounded-xl border border-slate-200">
                                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Tiến độ</span>
                                <span className="text-sm font-extrabold text-blue-600">{currentStep}/{steps.length}</span>
                            </div>

                            <button
                                onClick={handleReset}
                                className="flex items-center gap-2 px-4 py-2.5 text-slate-600 hover:text-slate-900 transition-colors bg-slate-50 hover:bg-slate-100 rounded-xl border border-slate-200"
                            >
                                <RefreshCw size={16} />
                                <span className="text-xs font-bold hidden sm:inline">Reset</span>
                            </button>
                        </div>
                    </div>

                    {/* Progress bar */}
                    <div className="mt-3 relative">
                        <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 rounded-full transition-all duration-700 ease-out"
                                style={{ width: `${progress}%` }}
                            />
                        </div>
                        {/* Step dots */}
                        <div className="absolute top-1/2 -translate-y-1/2 w-full flex justify-between px-0">
                            {steps.map((step, idx) => (
                                <div
                                    key={idx}
                                    className={`w-2.5 h-2.5 rounded-full border-2 transition-all duration-300 ${currentStep > step.id
                                            ? "bg-emerald-500 border-emerald-500 scale-100"
                                            : currentStep === step.id
                                                ? "bg-blue-500 border-blue-500 scale-125 shadow-lg shadow-blue-500/40"
                                                : "bg-white border-slate-300 scale-90"
                                        }`}
                                />
                            ))}
                        </div>
                    </div>
                </div>
            </header>

            {/* Main content */}
            <main className="max-w-[1600px] mx-auto px-6 py-8 grid grid-cols-1 lg:grid-cols-12 gap-8">

                {/* Left: Steps list */}
                <div className="lg:col-span-4 space-y-3">
                    <h2 className="text-[10px] font-extrabold uppercase tracking-[0.25em] text-slate-400 mb-4 px-1">
                        Quy trình Procure-to-Pay (10 bước)
                    </h2>

                    <div className="space-y-2.5">
                        {steps.map((step) => {
                            const isActive = currentStep === step.id;
                            const isCompleted = currentStep > step.id;
                            const isLocked = currentStep < step.id;
                            const isExpanded = expandedStep === step.id;

                            return (
                                <div
                                    key={step.id}
                                    onClick={() => goToStep(step.id)}
                                    className={`cursor-pointer rounded-2xl border transition-all duration-300 ${isActive
                                            ? "bg-white border-blue-200 shadow-lg shadow-blue-500/5 ring-1 ring-blue-500/10"
                                            : isCompleted
                                                ? "bg-white/80 border-emerald-200/60 hover:border-emerald-300"
                                                : "bg-slate-50/50 border-slate-200/60 opacity-50 cursor-default"
                                        }`}
                                >
                                    {/* Step Header */}
                                    <div className="p-3.5 flex items-start gap-3">
                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-all duration-300 ${isActive
                                                ? `bg-gradient-to-br ${step.color} text-white shadow-lg`
                                                : isCompleted
                                                    ? "bg-emerald-50 text-emerald-600 border border-emerald-200"
                                                    : "bg-slate-100 text-slate-400 border border-slate-200"
                                            }`}>
                                            {isCompleted ? <CheckCircle size={18} /> : step.icon}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-0.5">
                                                <span className={`text-[10px] font-extrabold uppercase tracking-wider ${isActive ? "text-blue-600" : isCompleted ? "text-emerald-600" : "text-slate-400"
                                                    }`}>
                                                    Bước {step.id}
                                                </span>
                                                <RoleBadge role={step.role} icon={step.roleIcon} />
                                            </div>
                                            <h4 className="text-[13px] font-bold text-slate-800 leading-tight truncate">
                                                {step.title}
                                            </h4>
                                            <p className="text-[11px] text-slate-500 leading-tight mt-0.5 line-clamp-1">
                                                {step.description}
                                            </p>
                                        </div>
                                        {!isLocked && (
                                            <ChevronDown
                                                size={14}
                                                className={`text-slate-400 transition-transform duration-200 mt-1 ${isExpanded ? "rotate-180" : ""}`}
                                            />
                                        )}
                                    </div>

                                    {/* Expanded Details */}
                                    {isExpanded && !isLocked && (
                                        <div className="px-3.5 pb-3.5 pt-1 border-t border-slate-100 space-y-3 animate-in slide-in-from-top-2 duration-200">
                                            {/* Detailed Function */}
                                            <div>
                                                <div className="flex items-center gap-1.5 mb-1.5">
                                                    <Eye size={11} className="text-blue-500" />
                                                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Chi tiết nghiệp vụ</span>
                                                </div>
                                                <p className="text-[11px] text-slate-600 leading-relaxed bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                                                    {step.detailedFunction}
                                                </p>
                                            </div>

                                            {/* Data Changes */}
                                            <div>
                                                <div className="flex items-center gap-1.5 mb-1.5">
                                                    <GitBranch size={11} className="text-indigo-500" />
                                                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Thay đổi dữ liệu</span>
                                                </div>
                                                <div className="space-y-1">
                                                    {step.dataState.changes.map((change, cidx) => (
                                                        <div key={cidx} className="flex items-center gap-1.5 text-[11px] bg-white p-1.5 rounded-lg border border-slate-100">
                                                            <span className="text-slate-500 font-medium min-w-[80px] truncate">{change.field}</span>
                                                            <span className="text-slate-400 line-through text-[10px]">{change.from}</span>
                                                            <ArrowRight size={9} className="text-blue-400 shrink-0" />
                                                            <span className="text-emerald-700 font-semibold truncate">{change.to}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>

                                            {/* Next Steps */}
                                            <div>
                                                <div className="flex items-center gap-1.5 mb-1.5">
                                                    <GitBranch size={11} className="text-purple-500" />
                                                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Luồng tiếp theo</span>
                                                </div>
                                                <div className="space-y-1.5">
                                                    <div className="flex items-start gap-2 p-2 bg-emerald-50 border border-emerald-100 rounded-lg">
                                                        <CheckCircle size={13} className="text-emerald-600 shrink-0 mt-0.5" />
                                                        <div>
                                                            <span className="text-[10px] font-bold uppercase text-emerald-700">{step.nextSteps.approved.condition}</span>
                                                            <p className="text-[11px] text-slate-600 mt-0.5">{step.nextSteps.approved.action}</p>
                                                        </div>
                                                    </div>
                                                    {step.nextSteps.rejected && (
                                                        <div className="flex items-start gap-2 p-2 bg-rose-50 border border-rose-100 rounded-lg">
                                                            <XCircle size={13} className="text-rose-500 shrink-0 mt-0.5" />
                                                            <div>
                                                                <span className="text-[10px] font-bold uppercase text-rose-600">{step.nextSteps.rejected.condition}</span>
                                                                <p className="text-[11px] text-slate-600 mt-0.5">{step.nextSteps.rejected.action}</p>
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

                {/* Center: Current Step Visual */}
                <div className="lg:col-span-5">
                    <div className="bg-white border border-slate-200/60 rounded-2xl p-8 min-h-[520px] flex flex-col items-center justify-center text-center relative overflow-hidden sticky top-28 shadow-sm">
                        {/* Decorative bg elements */}
                        <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-bl from-blue-500/5 to-transparent rounded-full blur-3xl -translate-y-1/3 translate-x-1/3" />
                        <div className="absolute bottom-0 left-0 w-80 h-80 bg-gradient-to-tr from-purple-500/5 to-transparent rounded-full blur-3xl translate-y-1/3 -translate-x-1/3" />

                        <div className="relative z-10 w-full">
                            {/* Step icon */}
                            <div className={`p-5 bg-gradient-to-br ${currentStepData.color} rounded-2xl shadow-xl mb-6 inline-block`}>
                                <div className="text-white">{currentStepData.icon}</div>
                            </div>

                            {/* Step info */}
                            <div className="mb-2">
                                <span className="text-[11px] font-bold uppercase tracking-widest text-slate-400">
                                    Bước {currentStepData.id} / {steps.length}
                                </span>
                            </div>

                            <h2 className="text-xl font-extrabold text-slate-900 tracking-tight mb-3">
                                {currentStepData.title}
                            </h2>

                            <p className="text-slate-500 max-w-md mx-auto text-sm leading-relaxed mb-6">
                                {currentStepData.description}
                            </p>

                            {/* Role */}
                            <div className="flex items-center justify-center gap-2 mb-8">
                                <span className="text-[11px] text-slate-400">Thực hiện bởi:</span>
                                <RoleBadge role={currentStepData.role} icon={currentStepData.roleIcon} />
                            </div>

                            {/* Action buttons */}
                            <div className="flex items-center justify-center gap-3">
                                {currentStep > 1 && (
                                    <button
                                        onClick={prevStep}
                                        className="flex items-center gap-2 px-5 py-3 rounded-xl text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-all border border-slate-200"
                                    >
                                        <ArrowLeft size={14} />
                                        Xem lại
                                    </button>
                                )}
                                <button
                                    onClick={nextStep}
                                    disabled={currentStep === steps.length}
                                    className={`group relative inline-flex items-center gap-3 px-8 py-4 rounded-2xl font-bold text-[12px] uppercase tracking-wider shadow-xl transition-all duration-300 active:scale-95 ${currentStep === steps.length
                                            ? "bg-emerald-500 text-white cursor-default"
                                            : `bg-gradient-to-r ${currentStepData.color} text-white hover:shadow-2xl hover:scale-[1.02]`
                                        }`}
                                >
                                    {currentStep === steps.length ? (
                                        <>
                                            <CheckCircle size={16} />
                                            Hoàn tất P2P
                                        </>
                                    ) : (
                                        <>
                                            Thực hiện bước này
                                            <ChevronRight size={16} className="group-hover:translate-x-0.5 transition-transform" />
                                        </>
                                    )}
                                </button>
                            </div>

                            {/* AI Quotes Panel at step 5 */}
                            {currentStep === 5 && quotations.length > 0 && (
                                <div className="mt-8 space-y-3 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                    <h3 className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 flex items-center justify-center gap-2">
                                        <Bot size={12} className="text-purple-500" />
                                        Kết quả AI Scoring
                                    </h3>
                                    <div className="grid grid-cols-3 gap-2.5">
                                        {quotations.map((q, qi) => (
                                            <div key={q.id} className={`p-3.5 bg-white border rounded-xl text-left transition-all ${qi === 0 ? "border-purple-200 ring-1 ring-purple-500/10 shadow-md" : "border-slate-200 hover:border-slate-300"
                                                }`}>
                                                <div className="flex justify-between items-start mb-2">
                                                    <div className="flex items-center gap-1.5">
                                                        {qi === 0 && <Star size={10} className="text-yellow-500 fill-yellow-500" />}
                                                        <span className="text-[11px] font-bold text-slate-800">{q.supplier}</span>
                                                    </div>
                                                    <span className={`text-[10px] font-extrabold ${qi === 0 ? "text-purple-600" : "text-slate-500"}`}>{q.aiScore}%</span>
                                                </div>
                                                <div className="text-xs font-extrabold text-blue-600 mb-1">{(q.price / 1000000).toFixed(1)}M ₫</div>
                                                <div className="text-[10px] text-slate-400 mb-1">⏱ {q.leadTime}</div>
                                                <div className="text-[10px] text-slate-500 flex items-center gap-1">
                                                    <Bot size={9} className="text-purple-400" /> {q.aiRec}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Right: Entity tracking + Budget */}
                <div className="lg:col-span-3 space-y-4">
                    {/* Entities */}
                    <div className="bg-white border border-slate-200/60 rounded-2xl p-5 shadow-sm">
                        <h3 className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-slate-400 mb-4 flex items-center gap-2">
                            <BarChart3 size={13} /> Theo dõi chứng từ
                        </h3>

                        <div className="space-y-2.5">
                            {pr && (
                                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                                    <div className="flex justify-between items-start mb-1.5">
                                        <div className="flex items-center gap-2">
                                            <div className="p-1.5 bg-blue-50 rounded-lg"><FileText size={12} className="text-blue-600" /></div>
                                            <span className="text-[11px] font-bold text-slate-800">{pr.id}</span>
                                        </div>
                                        <StatusBadge status={pr.status} type={getStatusColor(pr.status)} />
                                    </div>
                                    <div className="text-[10px] text-slate-500">{pr.title} • {(pr.total / 1000000).toFixed(0)}M ₫</div>
                                </div>
                            )}

                            {rfq && (
                                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                                    <div className="flex justify-between items-start mb-1.5">
                                        <div className="flex items-center gap-2">
                                            <div className="p-1.5 bg-violet-50 rounded-lg"><Search size={12} className="text-violet-600" /></div>
                                            <span className="text-[11px] font-bold text-slate-800">{rfq.id}</span>
                                        </div>
                                        <StatusBadge status={rfq.status} type={getStatusColor(rfq.status)} />
                                    </div>
                                    <div className="text-[10px] text-slate-500">{rfq.title}</div>
                                </div>
                            )}

                            {po && (
                                <div className="p-3 bg-slate-50 rounded-xl border border-emerald-100">
                                    <div className="flex justify-between items-start mb-1.5">
                                        <div className="flex items-center gap-2">
                                            <div className="p-1.5 bg-emerald-50 rounded-lg"><ShoppingBag size={12} className="text-emerald-600" /></div>
                                            <span className="text-[11px] font-bold text-slate-800">{po.id}</span>
                                        </div>
                                        <StatusBadge status={po.status} type={getStatusColor(po.status)} />
                                    </div>
                                    <div className="text-[10px] text-emerald-600 font-bold">{po.supplier} • {(po.total / 1000000).toFixed(0)}M ₫</div>
                                </div>
                            )}

                            {grn && (
                                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                                    <div className="flex justify-between items-start mb-1.5">
                                        <div className="flex items-center gap-2">
                                            <div className="p-1.5 bg-teal-50 rounded-lg"><Package size={12} className="text-teal-600" /></div>
                                            <span className="text-[11px] font-bold text-slate-800">{grn.id}</span>
                                        </div>
                                        <StatusBadge status={grn.status} type="success" />
                                    </div>
                                </div>
                            )}

                            {invoice && (
                                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                                    <div className="flex justify-between items-start mb-1.5">
                                        <div className="flex items-center gap-2">
                                            <div className="p-1.5 bg-cyan-50 rounded-lg"><Scale size={12} className="text-cyan-600" /></div>
                                            <span className="text-[11px] font-bold text-slate-800">{invoice.id}</span>
                                        </div>
                                        <StatusBadge status={invoice.status} type="success" />
                                    </div>
                                    <div className="text-[10px] text-slate-500">{(invoice.total / 1000000).toFixed(0)}M ₫</div>
                                </div>
                            )}

                            {payment && (
                                <div className="p-3 bg-slate-50 rounded-xl border border-emerald-100">
                                    <div className="flex justify-between items-start mb-1.5">
                                        <div className="flex items-center gap-2">
                                            <div className="p-1.5 bg-rose-50 rounded-lg"><CreditCard size={12} className="text-rose-500" /></div>
                                            <span className="text-[11px] font-bold text-slate-800">{payment.id}</span>
                                        </div>
                                        <StatusBadge status={payment.status} type="success" />
                                    </div>
                                    <div className="text-[10px] text-emerald-600 font-bold">{(payment.total / 1000000).toFixed(0)}M ₫ đã thanh toán</div>
                                </div>
                            )}

                            {kpi && (
                                <div className="p-3 bg-gradient-to-r from-yellow-50 to-amber-50 rounded-xl border border-yellow-200">
                                    <div className="flex justify-between items-start mb-1.5">
                                        <div className="flex items-center gap-2">
                                            <div className="p-1.5 bg-yellow-100 rounded-lg"><Award size={12} className="text-yellow-600" /></div>
                                            <span className="text-[11px] font-bold text-slate-800">KPI Score</span>
                                        </div>
                                        <span className="text-[11px] font-extrabold text-yellow-600">{kpi.total}/100 ⭐</span>
                                    </div>
                                    <div className="text-[10px] text-slate-600">{kpi.supplier} • Tier: STRATEGIC</div>
                                </div>
                            )}

                            {!pr && !rfq && !po && !grn && !invoice && !payment && !kpi && (
                                <div className="py-8 text-center border border-dashed border-slate-200 rounded-xl">
                                    <Layers size={20} className="mx-auto text-slate-300 mb-2" />
                                    <span className="text-[11px] font-semibold text-slate-400 block">Chưa có chứng từ</span>
                                    <p className="text-[10px] text-slate-400 mt-1">Bấm &quot;Thực hiện bước này&quot; để bắt đầu</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Budget */}
                    <div className="bg-white border border-slate-200/60 rounded-2xl p-5 shadow-sm">
                        <h3 className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-slate-400 mb-4 flex items-center gap-2">
                            <Wallet size={13} /> Ngân sách
                        </h3>
                        <div className="space-y-4">
                            <div>
                                <div className="flex justify-between text-[10px] font-bold mb-1.5">
                                    <span className="text-amber-600 uppercase tracking-wider">Committed</span>
                                    <span className="text-slate-700">{(budget.committed / 1000000).toFixed(1)}M / {(budget.allocated / 1000000).toFixed(0)}M</span>
                                </div>
                                <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-gradient-to-r from-amber-400 to-amber-500 transition-all duration-700 rounded-full"
                                        style={{ width: `${Math.min((budget.committed / budget.allocated) * 100, 100)}%` }}
                                    />
                                </div>
                            </div>
                            <div>
                                <div className="flex justify-between text-[10px] font-bold mb-1.5">
                                    <span className="text-blue-600 uppercase tracking-wider">Spent</span>
                                    <span className="text-slate-700">{(budget.spent / 1000000).toFixed(1)}M</span>
                                </div>
                                <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-gradient-to-r from-blue-400 to-blue-500 transition-all duration-700 rounded-full"
                                        style={{ width: `${Math.min((budget.spent / budget.allocated) * 100, 100)}%` }}
                                    />
                                </div>
                            </div>
                            <div className="pt-3 border-t border-slate-100">
                                <div className="flex justify-between text-[10px]">
                                    <span className="text-slate-500 uppercase font-bold tracking-wider">Còn lại</span>
                                    <span className="text-slate-800 font-extrabold">{((budget.allocated - budget.committed - budget.spent) / 1000000).toFixed(1)}M ₫</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* AI Floating Panel */}
                    {currentStep >= 5 && currentStep <= 6 && (
                        <div className="bg-gradient-to-br from-purple-50 to-indigo-50 border border-purple-200 rounded-2xl p-5 shadow-sm animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <div className="flex items-center gap-2 mb-3">
                                <div className="p-1.5 bg-purple-600 rounded-lg"><Bot size={14} className="text-white" /></div>
                                <span className="text-[10px] font-extrabold uppercase tracking-widest text-purple-600">AI Analyst</span>
                            </div>
                            <div className="p-3 bg-white/80 border border-purple-100 rounded-xl">
                                <p className="text-[11px] text-slate-700 leading-relaxed">
                                    <span className="font-extrabold text-purple-700">ĐỀ XUẤT:</span> HPT Vietnam (92 điểm) là lựa chọn tối ưu — giá thấp hơn 3% so với ước tính, giao hàng trong 7 ngày, KPI đạt STRATEGIC tier.
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
