"use client";

import { useState, useEffect, useRef } from "react";
import { z } from "zod";
import { useRouter } from "next/navigation";
import Select from "react-select";
import { formatVND, convertPrismaDecimal } from "../../utils/formatUtils";
import { useProcurement, Product, BudgetAllocation } from "../../context/ProcurementContext";
import { CostCenter, CreatePrDto, CreatePrItemDto, CurrencyCode, BudgetAllocationStatus } from "@/app/types/api-types";
import {
    Trash2, Wallet, TrendingUp, CheckCircle2, Loader2, XCircle,
    ArrowLeft, ChevronDown, ShoppingCart, AlertTriangle, Bot, Sparkles,
    MessageSquare, ArrowRight, Send, Wand2, Calendar, BarChart3,
    PenTool, Zap, Activity
} from "lucide-react";

const AllocationStatusBadge = ({ status }: { status: BudgetAllocationStatus }) => {
    const map: Record<BudgetAllocationStatus, { label: string; cls: string }> = {
        APPROVED:  { label: "Đã phê duyệt", cls: "status-approved" },
        REJECTED:  { label: "Bị từ chối",   cls: "status-rejected" },
        DRAFT:     { label: "Nháp",          cls: "status-draft" },
        SUBMITTED: { label: "Chờ duyệt",     cls: "status-pending" },
    };
    const cfg = map[status] ?? map.DRAFT;
    return <span className={`status-pill ${cfg.cls}`}>{cfg.label}</span>;
};

const BudgetAllocationCard = ({
    allocation,
    isSelected,
    onClick,
}: {
    allocation: BudgetAllocation;
    isSelected: boolean;
    onClick: () => void;
}) => {
    const convertDecimal = (val: unknown): number => {
        if (val && typeof val === "object" && "d" in (val as object)) {
            const digits = (val as { d?: number[] }).d || [];
            return digits.length > 0 ? digits[digits.length - 1] : 0;
        }
        return Number(val) || 0;
    };

    const spent     = convertDecimal(allocation.spentAmount);
    const committed = convertDecimal(allocation.committedAmount);
    const total     = convertDecimal(allocation.allocatedAmount) || 1;
    const usedPct   = Math.min(100, ((spent + committed) / total) * 100);
    const remaining = total - spent - committed;
    const isOver    = remaining < 0;

    return (
        <div
            onClick={onClick}
            className={`cursor-pointer rounded-xl border-2 p-4 transition-all ${
                isSelected
                    ? "border-[#2563EB] bg-[#EFF6FF]"
                    : "border-[rgba(148,163,184,0.12)] bg-white hover:border-[#2563EB]/30 hover:bg-[#F8FAFC]"
            }`}
        >
            <div className="flex items-start justify-between gap-3 mb-6">
                <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-2xl transition-all ${isSelected ? "bg-[#2563EB] text-white shadow-lg shadow-[#2563EB]/30" : "bg-[#F1F5F9] text-white group-hover:text-[#2563EB]"}`}>
                        <Wallet size={16} />
                    </div>
                    <div>
                        <div className="text-[10px] font-semibold text-slate-500 mb-0.5 truncate max-w-[140px]">
                            {String(allocation.notes || "Hạng mục ngân sách")}
                        </div>
                        <div className="text-sm font-bold text-slate-900">
                            {formatVND(total)}{" "}
                            <span className="text-[10px] text-slate-400 ml-0.5">{String(allocation.currency || "VND")}</span>
                        </div>
                    </div>
                </div>
                <AllocationStatusBadge status={allocation.status as BudgetAllocationStatus} />
            </div>

            <div className="grid grid-cols-3 gap-2 mb-3">
                {[
                    { label: "Đã chi",  value: spent,     color: "text-slate-700", bg: "bg-[#F8FAFC]" },
                    { label: "Cam kết", value: committed, color: "text-[#2563EB]", bg: "bg-[#EFF6FF]" },
                    { label: "Còn lại", value: remaining, color: isOver ? "text-rose-600" : "text-emerald-600", bg: isOver ? "bg-rose-50" : "bg-emerald-50" },
                ].map(({ label, value, color, bg }) => (
                    <div key={label} className={`${bg} rounded-lg p-2 text-center`}>
                        <div className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider mb-0.5">{label}</div>
                        <div className={`text-[10px] font-bold ${color}`}>{formatVND(Math.abs(value))}</div>
                    </div>
                ))}
            </div>

            <div className="space-y-1">
                <div className="flex justify-between text-[9px] font-semibold uppercase tracking-wider">
                    <span className="text-slate-400">Mức sử dụng</span>
                    <span className={isOver ? "text-rose-500" : "text-[#2563EB]"}>{usedPct.toFixed(1)}%</span>
                </div>
                <div className="h-1.5 w-full bg-[#F1F5F9] rounded-full overflow-hidden flex">
                    <div className="h-full bg-[#2563EB] transition-all duration-700" style={{ width: `${Math.min(100, (spent / total) * 100)}%` }} />
                    <div className={`${isOver ? "bg-rose-400" : "bg-indigo-300"} h-full transition-all duration-700`} style={{ width: `${Math.min(100 - (spent / total) * 100, (committed / total) * 100)}%` }} />
                </div>
            </div>
        </div>
    );
};

const BudgetAllocationsPanel = ({
    allocations,
    selectedCostCenterId,
    selectedAllocationId,
    onSelect,
}: {
    allocations: BudgetAllocation[];
    selectedCostCenterId: string;
    selectedAllocationId: string | null;
    onSelect: (id: string) => void;
}) => {
    const [expanded, setExpanded] = useState(false);

    const filtered = selectedCostCenterId
        ? allocations.filter(a => a.costCenterId === selectedCostCenterId)
        : allocations;

    const totalAllocated = filtered.reduce((s, a) => s + Number(a.allocatedAmount || 0), 0);
    const totalSpent     = filtered.reduce((s, a) => s + Number(a.spentAmount || 0), 0);
    const totalCommitted = filtered.reduce((s, a) => s + Number(a.committedAmount || 0), 0);
    const totalRemaining = totalAllocated - totalSpent - totalCommitted;

    return (
        <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-sm p-6">
            <button
                type="button"
                onClick={() => setExpanded(v => !v)}
                className="w-full flex items-center justify-between"
            >
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <span className="step-badge">3</span>
                    Phân bổ Ngân sách
                    {filtered.length > 0 && (
                        <span className="text-[10px] font-normal text-slate-400">({filtered.length} khoản)</span>
                    )}
                </h3>
                <ChevronDown size={15} className={`text-slate-400 transition-transform duration-200 ${expanded ? "rotate-180" : ""}`} />
            </button>

            {expanded && (
                <div className="mt-5 pt-5 border-t border-[rgba(148,163,184,0.1)] space-y-4">
                    {filtered.length > 0 && (
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            {[
                                { icon: <Wallet size={12} />,       label: "Tổng cấp phát",  value: totalAllocated,  color: "text-slate-700",  bg: "bg-[#F8FAFC]" },
                                { icon: <TrendingUp size={12} />,   label: "Đã tiêu thụ",   value: totalSpent,      color: "text-slate-700",  bg: "bg-[#F8FAFC]" },
                                { icon: <Sparkles size={12} />,     label: "Đang cam kết",  value: totalCommitted,  color: "text-[#2563EB]",  bg: "bg-[#EFF6FF]" },
                                { icon: <CheckCircle2 size={12} />, label: "Còn khả dụng",  value: totalRemaining,  color: totalRemaining < 0 ? "text-rose-600" : "text-emerald-600", bg: totalRemaining < 0 ? "bg-rose-50" : "bg-emerald-50" },
                            ].map(({ icon, label, value, color, bg }) => (
                                <div key={label} className={`${bg} rounded-xl p-3`}>
                                    <p className="flex items-center gap-1.5 text-[9px] font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                                        {icon} {label}
                                    </p>
                                    <div className={`text-xs font-bold ${color}`}>{formatVND(value)}</div>
                                </div>
                            ))}
                        </div>
                    )}

                    {filtered.length === 0 ? (
                        <div className="empty-state py-8">
                            <Wallet size={24} className="empty-state-icon" />
                            <p className="empty-state-title">Không có phân bổ ngân sách</p>
                            <p className="empty-state-desc">Chọn trung tâm chi phí để xem dữ liệu</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {filtered.map(allocation => (
                                <BudgetAllocationCard
                                    key={allocation.id}
                                    allocation={allocation}
                                    isSelected={selectedAllocationId === allocation.id}
                                    onClick={() => onSelect(allocation.id)}
                                />
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

interface PrDraftItem extends Omit<CreatePrItemDto, "currency" | "categoryName"> {
    lineNumber: number;
    currency: string;
    preferredSupplierId?: string;
}

interface PrDraftResponse extends Omit<CreatePrDto, "costCenterId" | "items" | "currency"> {
    success: boolean;
    currency: string;
    totalEstimate: number;
    items: PrDraftItem[];
    suggestedCostCenterCode?: string;
    suggestedCostCenterId?: string;
    suggestedVendorIds?: string[];
    categoryName?: string;
    confidence?: "high" | "medium" | "low";
    reasoning?: string;
    validationErrors?: string[];
    error?: string;
}

interface PRItem {
    id?: string;
    productId?: string;
    productDesc: string;
    sku?: string;
    categoryId?: string;
    qty: number;
    unit: string;
    estimatedPrice: number;
    basePrice: number;
    supplierName: string;
    aiStatus: boolean;
    aiLabel: string;
    specNote: string;
    currency?: CurrencyCode;
}

interface PRForm {
    title: string;
    description: string;
    justification: string;
    requiredDate: string;
    priority: number;
    currency: CurrencyCode;
    costCenterId: string;
    items: PRItem[];
}

const prFormSchema = z.object({
    title: z.string().min(3, "Tiêu đề phải có ít nhất 3 ký tự").max(200, "Tiêu đề không vượt quá 200 ký tự"),
    costCenterId: z.string().min(1, "Vui lòng chọn trung tâm chi phí"),
    items: z.array(z.object({
        productDesc: z.string().min(1, "Tên sản phẩm không được trống"),
        qty: z.number().min(1, "Số lượng phải lớn hơn 0"),
        estimatedPrice: z.number().min(0, "Đơn giá không được âm"),
    })).min(1, "Phải có ít nhất 1 sản phẩm"),
    requiredDate: z.string().optional().refine(
        (d) => {
            if (!d) return true;
            const [y, m, day] = d.split('-').map(Number);
            const picked = new Date(y, m - 1, day);
            const today = new Date(); today.setHours(0, 0, 0, 0);
            return picked >= today;
        },
        "Ngày cần hàng không được ở quá khứ"
    ),
    priority: z.number().min(1).max(5),
});

type PRFormErrors = Partial<Record<keyof z.infer<typeof prFormSchema> | 'general', string>>;

const isValidUuid = (id: string | undefined): boolean => {
    if (!id) return false;
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id);
};

export default function CreatePRPage() {
    const {
        addPR, submitPR, apiFetch,
        costCenters, currentUser, products,
        budgetAllocations, fetchQuarterlyAllocation,
    } = useProcurement();

    const router = useRouter();

    const [showAiSection, setShowAiSection] = useState(false);
    const [aiPrompt, setAiPrompt]           = useState("");
    const [isGenerating, setIsGenerating]   = useState(false);
    const [aiDraft, setAiDraft]             = useState<PrDraftResponse | null>(null);
    const [aiError, setAiError]             = useState<string | null>(null);
    const [aiMessages, setAiMessages]       = useState<Array<{ role: "user" | "assistant"; content: string }>>([]);

    const [form, setForm] = useState<PRForm>({
        title: "", description: "", justification: "",
        requiredDate: "", priority: 2,
        currency: CurrencyCode.VND, costCenterId: "", items: [],
    });

    const [isSubmitting, setIsSubmitting]         = useState(false);
    const [quarterlyAllocation, setQuarterlyAllocation] = useState<BudgetAllocation | null>(null);
    const [selectedAllocationId, setSelectedAllocationId] = useState<string | null>(null);
    const [submissionStatus, setSubmissionStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
    const [errorMessage, setErrorMessage]         = useState("");
    const [fieldErrors, setFieldErrors]           = useState<PRFormErrors>({});
    const [activeTab, setActiveTab]               = useState<'ai' | 'manual'>('manual');

    const today          = new Date();
    const currentYear    = today.getFullYear();
    const currentQuarter = Math.floor((today.getMonth() + 3) / 3);

    useEffect(() => {
        if (form.costCenterId && isValidUuid(form.costCenterId)) {
            fetchQuarterlyAllocation(form.costCenterId, currentYear, currentQuarter).then(data => {
                setQuarterlyAllocation(data || null);
                if (data?.id) setSelectedAllocationId(data.id);
            });
        }
    }, [form.costCenterId, fetchQuarterlyAllocation, currentYear, currentQuarter]);

    const filteredCostCenters = costCenters.filter((cc: CostCenter) => {
        if (!currentUser) return false;
        if (currentUser.role === "PLATFORM_ADMIN" || currentUser.role === "PROCUREMENT") return true;
        return !currentUser.deptId || !cc.deptId || cc.deptId === currentUser.deptId;
    });

    useEffect(() => {
        if (!form.costCenterId && filteredCostCenters.length > 0) {
            setForm(prev => ({ ...prev, costCenterId: filteredCostCenters[0].id }));
        }
    }, [filteredCostCenters, form.costCenterId]);

    const activeCC       = filteredCostCenters.find((cc: CostCenter) => cc.id === form.costCenterId);
    const totalEstimate  = form.items.reduce((sum, item) => sum + item.qty * convertPrismaDecimal(item.estimatedPrice), 0);
    const remainingBudget = quarterlyAllocation
        ? convertPrismaDecimal(quarterlyAllocation.allocatedAmount)
          - convertPrismaDecimal(quarterlyAllocation.spentAmount)
          - convertPrismaDecimal(quarterlyAllocation.committedAmount)
        : 0;

    const addItem = (option: { value: string; label: string }) => {
        const product = products.find((p: Product) => p.id === option.value);
        if (!product) return;
        const priceRef = convertPrismaDecimal(product.unitPriceRef);
        setForm(prev => ({
            ...prev,
            items: [...prev.items, {
                productId: product.id, productDesc: product.name, sku: product.sku,
                categoryId: product.categoryId, qty: 1, unit: product.unit || "PCS",
                estimatedPrice: priceRef, basePrice: priceRef,
                supplierName: "Thị trường", aiStatus: true, aiLabel: "GIÁ TỐT NHẤT", specNote: "",
            }],
        }));
    };

    const handleGenerateDraft = async () => {
        if (!aiPrompt.trim()) return;
        setIsGenerating(true);
        setAiError(null);
        setAiDraft(null);
        setAiMessages(prev => [...prev, { role: "user", content: aiPrompt }]);
        try {
            const enhancedPrompt = `[User: ${currentUser?.department || "Unknown"} - ${currentUser?.role || "Unknown"}${form.costCenterId ? `, CostCenter: ${form.costCenterId}` : ""}]\n\n${aiPrompt}`;
            const response = await apiFetch("/rag/generate-pr-draft", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ prompt: enhancedPrompt }),
            });
            if (!response.ok) throw new Error("Failed to generate draft");
            const data: PrDraftResponse = await response.json();
            if (data.success && data.items?.length > 0) {
                setAiDraft(data);
                setAiMessages(prev => [...prev, {
                    role: "assistant",
                    content: `Đã tạo bản nháp PR "${data.title}" gồm ${data.items.length} sản phẩm, tổng ${formatVND(convertPrismaDecimal(data.totalEstimate))} ₫.`,
                }]);
            } else {
                const msg = data.error || data.validationErrors?.join(", ") || "Không thể tạo bản nháp";
                setAiError(msg);
                setAiMessages(prev => [...prev, { role: "assistant", content: `Xin lỗi: ${msg}` }]);
            }
        } catch {
            setAiError("Lỗi kết nối AI. Vui lòng thử lại sau.");
            setAiMessages(prev => [...prev, { role: "assistant", content: "Có lỗi khi kết nối đến hệ thống AI." }]);
        } finally {
            setIsGenerating(false);
        }
    };

    const handleFillToManual = () => {
        if (!aiDraft) return;
        const mappedItems: PRItem[] = aiDraft.items.map((item, index) => {
            const matched = products.find((p: Product) =>
                p.name.toLowerCase().includes(item.productDesc.toLowerCase()) ||
                item.productDesc.toLowerCase().includes(p.name.toLowerCase())
            );
            return {
                id: `ai-item-${index}`,
                productId: matched?.id,
                productDesc: item.productDesc,
                sku: matched?.sku || `AI-${index + 1}`,
                categoryId: matched?.categoryId || item.categoryId,
                qty: item.qty || 1,
                unit: item.unit || matched?.unit || "PCS",
                estimatedPrice: convertPrismaDecimal(item.estimatedPrice),
                basePrice: convertPrismaDecimal(item.estimatedPrice),
                supplierName: item.preferredSupplierId ? `Supplier: ${item.preferredSupplierId}` : "Thị trường",
                aiStatus: true, aiLabel: "AI SUGGESTED",
                specNote: item.specNote || "",
                currency: (item.currency as CurrencyCode) || CurrencyCode.VND,
            };
        });
        setForm(prev => ({
            ...prev,
            title: aiDraft.title || prev.title,
            description: aiDraft.description || prev.description,
            justification: aiDraft.justification || prev.justification,
            priority: aiDraft.priority || prev.priority,
            currency: (aiDraft.currency as CurrencyCode) || prev.currency,
            costCenterId: aiDraft.suggestedCostCenterId || prev.costCenterId,
            items: mappedItems,
        }));
        setShowAiSection(false);
    };

    const handleClearAI = () => {
        setAiPrompt(""); setAiDraft(null); setAiError(null); setAiMessages([]);
    };

    const handleSubmit = async () => {
        setFieldErrors({});
        const parsed = prFormSchema.safeParse({
            title: form.title,
            costCenterId: form.costCenterId,
            items: form.items.map(i => ({
                productDesc: i.productDesc,
                qty: Number(i.qty),
                estimatedPrice: Number(convertPrismaDecimal(i.estimatedPrice) ?? 0),
            })),
            requiredDate: form.requiredDate || undefined,
            priority: Number(form.priority),
        });

        if (!parsed.success) {
            const errors: PRFormErrors = {};
            for (const issue of parsed.error.issues) {
                const field = issue.path[0] as keyof PRFormErrors;
                if (!errors[field]) errors[field] = issue.message;
            }
            setFieldErrors(errors);
            setErrorMessage(parsed.error.issues[0]?.message ?? "Dữ liệu không hợp lệ");
            setSubmissionStatus('error');
            return;
        }
        const payload: CreatePrDto = {
            title: form.title.trim(),
            description: form.description,
            justification: form.justification,
            requiredDate: form.requiredDate || undefined,
            priority: Number(form.priority),
            currency: form.currency,
            costCenterId: form.costCenterId,
            items: form.items.map(i => ({
                productDesc: i.productDesc, productId: i.productId,
                qty: Number(i.qty), estimatedPrice: convertPrismaDecimal(i.estimatedPrice),
                unit: i.unit, currency: i.currency || form.currency,
            })),
        };
        setSubmissionStatus("loading");
        setIsSubmitting(true);
        try {
            const createdPR = await addPR(payload);
            if (createdPR?.id) {
                await submitPR(createdPR.id);
                setSubmissionStatus("success");
                setTimeout(() => router.push("/pr"), 2000);
            } else {
                setSubmissionStatus("error");
                setErrorMessage("Không thể tạo PR");
            }
        } catch {
            setSubmissionStatus("error");
            setErrorMessage("Lỗi hệ thống");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="animate-in fade-in duration-700 space-y-12">
            {/* PAGE HEADER SECTION */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 border-b border-[rgba(148,163,184,0.1)] pb-10">
                <div>
                   <h1 className="text-4xl font-black text-slate-900 tracking-tighter uppercase mb-2">Tạo Phiếu Yêu Cầu (PR)</h1>
                   <p className="text-sm font-bold text-slate-900 tracking-tight uppercase">
                      Xin chào, <span className="text-[#2563EB]">{currentUser?.name || currentUser?.fullName}</span> – Hệ thống AI Procurement đang hỗ trợ bạn lập kế hoạch.
                   </p>
                </div>
                <div className="flex gap-4">
                    <button className="px-5 py-2 bg-[#F1F5F9] border border-[rgba(148,163,184,0.1)] text-slate-900 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-100 transition-all" onClick={() => router.push("/pr")}>Hủy bỏ</button>
                    <button
                        className="px-6 py-2.5 bg-[#2563EB] text-white rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-[#2563EB]/20 hover:scale-105 active:scale-95 transition-all flex items-center gap-2"
                        onClick={handleSubmit}
                        disabled={isSubmitting}
                    >
                        <Send size={18} />
                    </button>
                </div>
            </div>

            {/* TABS — AI Mode vs Manual Mode */}
            <div className="flex gap-2 mb-6">
                <button
                    onClick={() => setActiveTab('ai')}
                    className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all ${
                        activeTab === 'ai'
                            ? 'bg-[#2563EB] text-white shadow-lg shadow-[#2563EB]/30'
                            : 'bg-[#F1F5F9] text-slate-600 border border-[rgba(148,163,184,0.1)] hover:text-slate-800'
                    }`}
                >
                    <Bot size={16} />
                    <span>Tạo bằng AI Chat</span>
                    {aiDraft && (
                        <span className="ml-2 w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    )}
                </button>
                <button
                    onClick={() => setActiveTab('manual')}
                    className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all ${
                        activeTab === 'manual'
                            ? 'bg-[#2563EB] text-white shadow-lg shadow-[#2563EB]/30'
                            : 'bg-[#F1F5F9] text-slate-600 border border-[rgba(148,163,184,0.1)] hover:text-slate-800'
                    }`}
                >
                    <PenTool size={16} />
                    <span>Tạo thủ công</span>
                    {form.items.length > 0 && (
                        <span className="ml-2 px-2 py-0.5 bg-[#2563EB]/20 text-[#2563EB] rounded-full text-[9px]">
                            {form.items.length}
                        </span>
                    )}
                </button>
            </div>

            {/* AI MODE TAB */}
            {activeTab === 'ai' && (
                <div className="animate-in fade-in duration-500 space-y-8">
                    {/* AI Chat Interface */}
                    <div className="bg-[#F1F5F9] rounded-[40px] border border-[rgba(148,163,184,0.1)] shadow-2xl shadow-[#2563EB]/5 overflow-hidden">
                        <div className="p-8 border-b border-[rgba(148,163,184,0.1)] bg-[#FFFFFF]/50">
                            <div className="flex items-center gap-3">
                                <div className="bg-gradient-to-br from-[#2563EB] to-[#8B5CF6] p-2.5 rounded-xl text-slate-900 shadow-lg shadow-[#2563EB]/20">
                                    <Sparkles size={18} />
                                </div>
                                <div>
                                    <h3 className="text-sm font-black text-slate-900">AI Procurement Assistant</h3>
                                    <p className="text-[10px] text-slate-900">Mô tả nhu cầu mua sắm, AI sẽ tạo PR giúp bạn</p>
                                </div>
                            </div>
                        </div>
                        
                        <div className="p-8 space-y-6">
                            {/* Chat Messages */}
                            {aiMessages.length > 0 && (
                                <div className="bg-[#FFFFFF] rounded-2xl p-6 space-y-4 max-h-[300px] overflow-y-auto">
                                    {aiMessages.map((msg, idx) => (
                                        <div key={idx} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                                            <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                                                msg.role === 'user' ? 'bg-[#2563EB]' : 'bg-gradient-to-br from-[#2563EB] to-[#8B5CF6]'
                                            }`}>
                                                {msg.role === 'user' ? <MessageSquare size={14} /> : <Bot size={14} />}
                                            </div>
                                            <div className={`max-w-[80%] p-4 rounded-2xl text-sm ${
                                                msg.role === 'user' 
                                                    ? 'bg-[#2563EB] text-white' 
                                                    : 'bg-[#F1F5F9] text-white border border-[rgba(148,163,184,0.1)]'
                                            }`}>
                                                {msg.content}
                                            </div>
                                        </div>
                                    ))}
                                    {isGenerating && (
                                        <div className="flex gap-3">
                                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#2563EB] to-[#8B5CF6] flex items-center justify-center">
                                                <Bot size={14} />
                                            </div>
                                            <div className="p-4 rounded-2xl bg-[#F1F5F9] border border-[rgba(148,163,184,0.1)]">
                                                <Loader2 className="animate-spin text-[#2563EB]" size={20} />
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                            
                            {/* AI Input */}
                            <div className="space-y-4">
                                <label className="text-[10px] font-black text-slate-900 uppercase tracking-widest">
                                    Mô tả yêu cầu mua sắm
                                </label>
                                <textarea
                                    value={aiPrompt}
                                    onChange={(e) => setAiPrompt(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' && e.metaKey) {
                                            handleGenerateDraft();
                                        }
                                    }}
                                    placeholder="VD: Tôi cần mua 10 laptop Dell cho phòng IT, ngân sách khoảng 500 triệu, giao hàng trong tuần sau..."
                                    className="w-full h-32 bg-[#FFFFFF] border border-[rgba(148,163,184,0.15)] rounded-2xl p-5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 resize-none placeholder:text-slate-900/50"
                                />
                                <div className="flex gap-3">
                                    <button
                                        onClick={handleGenerateDraft}
                                        disabled={isGenerating || !aiPrompt.trim()}
                                        className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-[#2563EB] text-white rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-[#2563EB]/20 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {isGenerating ? (
                                            <><Loader2 className="animate-spin" size={16} /> Đang tạo...</>
                                        ) : (
                                            <><Wand2 size={16} /> Tạo PR bằng AI</>
                                        )}
                                    </button>
                                    {aiMessages.length > 0 && (
                                        <button
                                            onClick={handleClearAI}
                                            className="px-4 py-3 bg-[#F1F5F9] border border-[rgba(148,163,184,0.1)] text-slate-900 rounded-xl font-bold text-[10px] uppercase tracking-widest hover:text-slate-900 transition-all"
                                        >
                                            <XCircle size={16} />
                                        </button>
                                    )}
                                </div>
                            </div>
                            
                            {/* AI Draft Preview */}
                            {aiDraft && (
                                <div className="border border-[rgba(59,130,246,0.3)] rounded-2xl p-6 bg-[#2563EB]/5 space-y-4">
                                    <div className="flex items-center gap-2">
                                        <CheckCircle2 className="text-black" size={20} />
                                        <span className="text-sm font-black text-slate-900">Bản nháp đã sẵn sàng</span>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4 text-sm">
                                        <div className="space-y-1">
                                            <span className="text-[9px] font-black text-slate-900 uppercase">Tiêu đề</span>
                                            <p className="text-slate-900 font-bold truncate">{aiDraft.title}</p>
                                        </div>
                                        <div className="space-y-1">
                                            <span className="text-[9px] font-black text-slate-900 uppercase">Số sản phẩm</span>
                                            <p className="text-slate-900 font-bold">{aiDraft.items.length} items</p>
                                        </div>
                                        <div className="space-y-1">
                                            <span className="text-[9px] font-black text-slate-900 uppercase">Tổng giá trị</span>
                                            <p className="text-black font-black">{formatVND(aiDraft.totalEstimate)}</p>
                                        </div>
                                        <div className="space-y-1">
                                            <span className="text-[9px] font-black text-slate-900 uppercase">Độ tin cậy</span>
                                            <span className={`px-2 py-1 rounded-full text-[9px] font-black uppercase ${
                                                aiDraft.confidence === 'high' ? 'bg-emerald-500/20 text-black' :
                                                aiDraft.confidence === 'medium' ? 'bg-amber-500/20 text-black' :
                                                'bg-rose-500/20 text-black'
                                            }`}>
                                                {aiDraft.confidence || 'medium'}
                                            </span>
                                        </div>
                                    </div>
                                    {aiDraft.reasoning && (
                                        <p className="text-xs text-slate-900 italic border-l-2 border-[#2563EB] pl-3">
                                            {aiDraft.reasoning}
                                        </p>
                                    )}
                                    <button
                                        onClick={handleFillToManual}
                                        className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-emerald-500/20 text-black border border-emerald-500/30 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-emerald-500/30 transition-all"
                                    >
                                        <ArrowRight size={16} />
                                        Chuyển sang Tạo thủ công để chỉnh sửa & Gửi PR
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                    
                    {/* Quick Tips */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {[
                            { icon: <MessageSquare size={16} />, title: "Mô tả chi tiết", desc: "Số lượng, mục đích, thời gian cần" },
                            { icon: <Wallet size={16} />, title: "Ngân sách rõ ràng", desc: "Đề cập khoảng giá mong muốn" },
                            { icon: <Zap size={16} />, title: "Tiêu chí đặc biệt", desc: "Thương hiệu, specs kỹ thuật" }
                        ].map((tip, idx) => (
                            <div key={idx} className="bg-[#FFFFFF] rounded-2xl p-5 border border-[rgba(148,163,184,0.1)]">
                                <div className="text-[#2563EB] mb-2">{tip.icon}</div>
                                <h4 className="text-xs font-black text-slate-900 mb-1">{tip.title}</h4>
                                <p className="text-[10px] text-slate-900">{tip.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* MANUAL MODE TAB */}
            {activeTab === 'manual' && (
                <div className="animate-in fade-in duration-500 grid grid-cols-1 xl:grid-cols-10 gap-10">
                {/* LEFT CONTENT — 60% */}
                <div className="xl:col-span-6 space-y-10">
                    
                    {/* FORM SECTION 1 — THÔNG TIN CHUNG */}
                    <div className="bg-[#F1F5F9] rounded-[40px] border border-[rgba(148,163,184,0.1)] shadow-2xl shadow-[#2563EB]/5 overflow-hidden">
                        <div className="p-8 border-b border-[rgba(148,163,184,0.1)] bg-[#FFFFFF]/50">
                             <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-900 flex items-center gap-3">
                                 <Activity size={16} className="text-[#2563EB]" /> Thông tin chung
                             </h3>
                        </div>
                        <div className="p-10 space-y-8">
                            <div className="space-y-3">
                                <label className="text-[10px] font-black text-slate-900 uppercase tracking-widest ml-1">Tiêu đề yêu cầu</label>
                                <input 
                                    className="w-full bg-[#FFFFFF] border border-[rgba(148,163,184,0.15)] rounded-2xl px-6 py-4 text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 transition-all placeholder:text-slate-900/50" 
                                    placeholder="Nhập tên dịch vụ/sản phẩm cần mua sắm..."
                                    value={form.title} 
                                    onChange={e => setForm({ ...form, title: e.target.value })} 
                                />
                                {fieldErrors.title && <span className="text-[9px] font-black text-rose-500 uppercase tracking-widest ml-1">{fieldErrors.title}</span>}
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black text-slate-900 uppercase tracking-widest ml-1">Trung tâm chi phí</label>
                                    <div className="relative">
                                        <select
                                            value={form.costCenterId}
                                            onChange={e => setForm({ ...form, costCenterId: e.target.value })}
                                            className="w-full bg-[#FFFFFF] border border-[rgba(148,163,184,0.15)] rounded-2xl px-6 py-4 text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 appearance-none transition-all"
                                        >
                                            <option value="" className="bg-[#F1F5F9]">-- Chọn trung tâm chi phí --</option>
                                            {filteredCostCenters.map((cc: CostCenter) => (
                                                <option key={cc.id} value={cc.id} className="bg-[#F1F5F9]">{String(cc.code)} - {String(cc.name)}</option>
                                            ))}
                                        </select>
                                        <ChevronDown className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-900 pointer-events-none" size={16} />
                                    </div>
                                    {fieldErrors.costCenterId && <span className="text-[9px] font-black text-rose-500 uppercase tracking-widest ml-1">{fieldErrors.costCenterId}</span>}
                                </div>

                                <div className="space-y-3">
                                    <label className="text-[10px] font-black text-slate-900 uppercase tracking-widest ml-1">Độ ưu tiên</label>
                                    <div className="relative">
                                        <select
                                            value={form.priority}
                                            onChange={e => setForm({ ...form, priority: Number(e.target.value) })}
                                            className="w-full bg-[#FFFFFF] border border-[rgba(148,163,184,0.15)] rounded-2xl px-6 py-4 text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 appearance-none transition-all"
                                        >
                                            <option value={1}>Thấp</option>
                                            <option value={2}>Bình thường</option>
                                            <option value={3}>Gấp</option>
                                            <option value={4}>Khẩn cấp (SLA 4H)</option>
                                        </select>
                                        <ChevronDown className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-900 pointer-events-none" size={16} />
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <label className="text-[10px] font-black text-slate-900 uppercase tracking-widest ml-1 flex items-center gap-1">
                                        <Calendar size={10} /> Ngày cần hàng
                                    </label>
                                    <input
                                        type="date"
                                        value={form.requiredDate}
                                        onChange={e => setForm({ ...form, requiredDate: e.target.value })}
                                        className="w-full bg-[#FFFFFF] border border-[rgba(148,163,184,0.15)] rounded-2xl px-6 py-4 text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 transition-all"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black text-slate-900 uppercase tracking-widest ml-1">Mô tả</label>
                                    <textarea
                                        placeholder="Mô tả chi tiết yêu cầu..."
                                        value={form.description}
                                        onChange={e => setForm({ ...form, description: e.target.value })}
                                        rows={3}
                                        className="w-full bg-[#FFFFFF] border border-[rgba(148,163,184,0.15)] rounded-2xl px-6 py-4 text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 transition-all resize-none placeholder:text-slate-900/50"
                                    />
                                </div>
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black text-slate-900 uppercase tracking-widest ml-1">Lý do / Justification</label>
                                    <textarea
                                        placeholder="Mục đích, lý do cần thiết..."
                                        value={form.justification}
                                        onChange={e => setForm({ ...form, justification: e.target.value })}
                                        rows={3}
                                        className="w-full bg-[#FFFFFF] border border-[rgba(148,163,184,0.15)] rounded-2xl px-6 py-4 text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 transition-all resize-none placeholder:text-slate-900/50"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* FORM SECTION 3 — DANH MỤC HÀNG HÓA */}
                    <div className="bg-[#F1F5F9] rounded-[40px] border border-[rgba(148,163,184,0.1)] shadow-2xl shadow-[#2563EB]/5 overflow-hidden">
                        <div className="p-8 border-b border-[rgba(148,163,184,0.1)] bg-[#FFFFFF]/50 flex justify-between items-center">
                             <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-900 flex items-center gap-3">
                                 <ShoppingCart size={16} className="text-[#2563EB]" /> Danh mục hàng hóa đề xuất
                             </h3>
                        </div>
                        <div className="p-10">
                            <div className="mb-8 space-y-3">
                                <label className="text-[10px] font-black text-slate-900 uppercase tracking-widest ml-1">Tìm kiếm & Thêm sản phẩm</label>
                                <Select
                                    placeholder="Gõ tên sản phẩm, mã SKU..."
                                    options={products.map(p => ({ label: p.name, value: p.id }))}
                                    onChange={(opt) => opt && addItem(opt)}
                                    menuPortalTarget={typeof document !== 'undefined' ? document.body : null}
                                    styles={{
                                        control: (base) => ({
                                            ...base,
                                            borderRadius: '16px',
                                            borderColor: 'rgba(148,163,184,0.15)',
                                            background: '#FFFFFF',
                                            padding: '8px',
                                            boxShadow: 'none',
                                            '&:hover': { borderColor: 'rgba(148,163,184,0.3)' }
                                        }),
                                        menu: (base) => ({
                                            ...base,
                                            background: '#F1F5F9',
                                            border: '1px solid rgba(148,163,184,0.1)',
                                            borderRadius: '16px',
                                            zIndex: 9999
                                        }),
                                        menuPortal: (base) => ({
                                            ...base,
                                            zIndex: 9999
                                        }),
                                        option: (base, state) => ({
                                            ...base,
                                            background: state.isFocused ? 'rgba(59,130,246,0.1)' : 'transparent',
                                            color: '#000000',
                                            fontSize: '12px',
                                            fontWeight: '700',
                                            padding: '12px 20px'
                                        }),
                                        singleValue: (base) => ({
                                            ...base,
                                            color: '#000000'
                                        }),
                                        input: (base) => ({
                                            ...base,
                                            color: '#000000'
                                        }),
                                        placeholder: (base) => ({
                                            ...base,
                                            color: '#000000'
                                        })
                                    }}
                                />
                            </div>
                            
                            <div className="overflow-hidden rounded-3xl border border-[rgba(148,163,184,0.1)] bg-[#FFFFFF]">
                                <table className="erp-table text-xs m-0">
                                    <thead>
                                        <tr className="border-b border-[rgba(148,163,184,0.1)] tracking-[0.1em]">
                                            <th className="px-8 py-5">Sản phẩm / Mô tả</th>
                                            <th className="px-8 py-5 text-center">Số lượng</th>
                                            <th className="px-8 py-5 text-right">Đơn giá tham chiếu</th>
                                            <th className="px-8 py-5 text-right">Thành tiền</th>
                                            <th className="px-8 py-5 w-20 text-center"></th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-[rgba(148,163,184,0.1)]">
                                        {form.items.length === 0 ? (
                                            <tr>
                                                <td colSpan={5} className="py-20 text-center text-[10px] font-black uppercase tracking-widest italic">
                                                    <span className={fieldErrors.items ? 'text-rose-500' : 'text-slate-900'}>
                                                        {fieldErrors.items ?? 'Chưa có sản phẩm nào được chọn'}
                                                    </span>
                                                </td>
                                            </tr>
                                        ) : (
                                            form.items.map((item, i) => (
                                                <tr key={i} className="hover:bg-[#F1F5F9]/50 transition-colors">
                                                    <td className="px-8 py-6 font-black text-slate-900 text-xs transition-colors">{item.productDesc}</td>
                                                    <td className="px-8 py-6 text-center">
                                                        <input 
                                                            type="number" 
                                                            className="w-20 text-center bg-[#F1F5F9] border border-[rgba(148,163,184,0.1)] rounded-xl py-2 px-3 text-xs font-black text-slate-900 focus:outline-none focus:ring-1 focus:ring-[#2563EB]/50" 
                                                            value={item.qty} 
                                                            onChange={e => {
                                                                const items = [...form.items];
                                                                items[i].qty = parseInt(e.target.value) || 0;
                                                                setForm({ ...form, items });
                                                            }} 
                                                        />
                                                    </td>
                                                    <td className="px-8 py-6 text-right font-bold text-slate-900 text-[11px]">{formatVND(item.estimatedPrice)}</td>
                                                    <td className="px-8 py-6 text-right font-black text-[#2563EB] text-sm tracking-tight">{formatVND(item.qty * convertPrismaDecimal(item.estimatedPrice))}</td>
                                                    <td className="px-8 py-6 text-center">
                                                        <button 
                                                            className="p-3 text-slate-900 hover:text-black hover:bg-rose-500/10 rounded-2xl transition-all"
                                                            onClick={() => setForm({ ...form, items: form.items.filter((_, idx) => idx !== i) })}
                                                        >
                                                            <Trash2 size={16} />
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right sidebar */}
                <div className="xl:col-span-1">
                    <div className="sticky top-6 space-y-4">

                                <div className="space-y-6 px-4">
                                    <div className="flex justify-between items-end">
                                        <div className="text-[11px] font-bold text-slate-900 uppercase tracking-tight">Khả dụng (Quý {currentQuarter}):</div>
                                        <div className="text-lg font-black text-slate-900 tracking-tighter">
                                            {formatVND(remainingBudget)} ₫
                                        </div>
                                    </div>
                                    <div className="flex justify-between items-end">
                                        <div className="text-[11px] font-bold text-slate-900 uppercase tracking-tight">Tổng giá trị PR:</div>
                                        <div className="text-lg font-black text-black tracking-tighter">
                                            -{formatVND(totalEstimate)} ₫
                                        </div>
                                    </div>
                                    
                                    <div className="h-px bg-[rgba(148,163,184,0.1)]" />
                                    
                                    <div className={`p-8 rounded-[40px] border-2 transition-all duration-500 ${remainingBudget - totalEstimate < 0 ? "bg-rose-500/10 border-rose-500/20 shadow-rose-500/5" : "bg-emerald-500/10 border-emerald-500/20 shadow-emerald-500/5"}`}>
                                        <div className="flex items-center gap-3 mb-2 opacity-70">
                                            <div className={`h-2 w-2 rounded-full ${remainingBudget - totalEstimate < 0 ? "bg-rose-500" : "bg-emerald-500"}`}></div>
                                            <span className={`text-[10px] font-black uppercase tracking-[0.2em] ${remainingBudget - totalEstimate < 0 ? "text-black" : "text-black"}`}>CÒN LẠI SAU PR</span>
                                        </div>
                                        <div className={`text-4xl font-black tracking-tighter ${remainingBudget - totalEstimate < 0 ? "text-black" : "text-black"}`}>
                                            {formatVND(Math.abs(remainingBudget - totalEstimate))} <span className="text-lg opacity-50">₫</span>
                                        </div>
                                    </div>
                                    
                                    {remainingBudget - totalEstimate < 0 && (
                                        <div className="flex gap-4 p-6 bg-amber-500/10 rounded-3xl border border-amber-500/20 text-black animate-pulse">
                                            <AlertTriangle size={24} className="shrink-0" />
                                            <p className="text-[10px] font-black uppercase leading-tight tracking-tight">Cảnh báo: PR vượt quá ngân sách khả dụng. Việc phê duyệt có thể bị CEO/CFO kiểm soát chặt chẽ hơn.</p>
                                        </div>
                                    )}
                                </div>
                                
                                <button
                                    className="w-full py-3 mt-4 bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-black uppercase tracking-wider rounded-2xl shadow-lg shadow-[#2563EB]/30 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2 group/btn"
                                    onClick={handleSubmit}
                                    disabled={isSubmitting}
                                >
                                    {isSubmitting ? <Loader2 className="animate-spin" size={16} /> : <Zap size={16} className="group-hover:fill-white transition-all" />}
                                    {isSubmitting ? "Đang xử lý..." : "Xác nhận & Gửi"}
                                </button>
                    </div>
                </div>
            </div>
            )}

            {/* Status overlay */}
            {submissionStatus !== "idle" && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-white/80 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-2xl max-w-sm w-full text-center animate-in zoom-in-95 duration-200 p-8">
                        {submissionStatus === "loading" && (
                            <div className="space-y-5">
                                <div className="w-12 h-12 border-4 border-[#2563EB]/20 border-t-[#2563EB] rounded-full animate-spin mx-auto" />
                                <div>
                                    <h3 className="text-base font-bold text-slate-900">Đang khởi tạo yêu cầu...</h3>
                                    <p className="text-xs text-slate-500 mt-1">Vui lòng chờ trong giây lát</p>
                                </div>
                            </div>
                        )}
                        {submissionStatus === "success" && (
                            <div className="space-y-5">
                                <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto">
                                    <CheckCircle2 size={28} className="text-emerald-600" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-slate-900">Tạo PR thành công!</h3>
                                    <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">Đã gửi vào quy trình phê duyệt đa cấp. Đang chuyển hướng...</p>
                                </div>
                            </div>
                        )}
                        {submissionStatus === "error" && (
                            <div className="space-y-5">
                                <div className="w-14 h-14 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center mx-auto">
                                    <XCircle size={28} className="text-rose-500" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-slate-900">Xảy ra lỗi</h3>
                                    <p className="text-xs text-slate-500 mt-1.5">{errorMessage}</p>
                                </div>
                                <button onClick={() => setSubmissionStatus("idle")} className="btn-secondary w-full justify-center">
                                    Quay lại chỉnh sửa
                                </button>
                            </div>
                        )}
                        {submissionStatus !== 'loading' && (
                            <button 
                                onClick={() => setSubmissionStatus('idle')} 
                                className="w-full mt-6 py-4 bg-[#FFFFFF] text-slate-900 font-black text-[10px] uppercase tracking-widest rounded-2xl border border-[rgba(148,163,184,0.1)] hover:bg-slate-100 transition-all"
                            >
                                Quay lại chỉnh sửa
                            </button>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
