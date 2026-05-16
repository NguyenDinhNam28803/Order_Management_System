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
    MessageSquare, ArrowRight, Send, Wand2, Calendar, BarChart3
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
            <div className="flex items-start justify-between gap-3 mb-4">
                <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg transition-all ${isSelected ? "bg-[#2563EB] text-white" : "bg-[#F1F5F9] text-slate-500"}`}>
                        <Wallet size={14} />
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
        (d) => !d || new Date(d) > new Date(),
        "Ngày cần hàng phải ở tương lai"
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
            setSubmissionStatus("error");
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
        <div className="p-6 max-w-6xl mx-auto space-y-5 animate-in fade-in duration-500">

            {/* Header */}
            <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => router.push("/pr")}
                        className="p-2.5 bg-[#F1F5F9] rounded-xl border border-[rgba(148,163,184,0.1)] text-slate-700 hover:bg-slate-200 transition-colors"
                    >
                        <ArrowLeft size={18} />
                    </button>
                    <div>
                        <h1 className="page-title">Tạo Phiếu Yêu Cầu Mua Sắm</h1>
                        <p className="page-subtitle">
                            Xin chào,{" "}
                            <span className="text-[#2563EB] font-semibold">{currentUser?.name || currentUser?.fullName}</span>
                            {" "}· Điền đầy đủ thông tin và gửi phê duyệt
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                    <button onClick={() => router.push("/pr")} className="btn-secondary">
                        Hủy bỏ
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={isSubmitting}
                        className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isSubmitting
                            ? <><Loader2 size={14} className="animate-spin" /> Đang gửi...</>
                            : <><Send size={14} /> Gửi Phê Duyệt</>
                        }
                    </button>
                </div>
            </div>

            {/* Inline error banner */}
            {submissionStatus === "error" && errorMessage && (
                <div className="flex items-center gap-3 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm">
                    <XCircle size={15} className="shrink-0" />
                    <span className="flex-1">{errorMessage}</span>
                    <button onClick={() => setSubmissionStatus("idle")} className="shrink-0 opacity-60 hover:opacity-100">
                        <XCircle size={14} />
                    </button>
                </div>
            )}

            {/* Main layout */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">

                {/* Left — form */}
                <div className="xl:col-span-2 space-y-5">

                    {/* AI Assistant — collapsible */}
                    <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-sm p-6">
                        <button
                            type="button"
                            onClick={() => setShowAiSection(v => !v)}
                            className="w-full flex items-center justify-between"
                        >
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#2563EB] to-[#8B5CF6] flex items-center justify-center shrink-0">
                                    <Sparkles size={14} className="text-white" />
                                </div>
                                <div className="text-left">
                                    <p className="text-sm font-bold text-slate-900">AI Procurement Assistant</p>
                                    <p className="text-[10px] text-slate-500">Mô tả nhu cầu để AI tự động tạo bản nháp PR</p>
                                </div>
                                {aiDraft && <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />}
                            </div>
                            <ChevronDown size={15} className={`text-slate-400 transition-transform duration-200 shrink-0 ${showAiSection ? "rotate-180" : ""}`} />
                        </button>

                        {showAiSection && (
                            <div className="mt-5 pt-5 border-t border-[rgba(148,163,184,0.1)] space-y-4">
                                {aiMessages.length > 0 && (
                                    <div className="bg-[#F8FAFC] rounded-xl p-4 space-y-3 max-h-60 overflow-y-auto">
                                        {aiMessages.map((msg, idx) => (
                                            <div key={idx} className={`flex gap-2.5 ${msg.role === "user" ? "flex-row-reverse" : ""}`}>
                                                <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${
                                                    msg.role === "user" ? "bg-[#2563EB]" : "bg-gradient-to-br from-[#2563EB] to-[#8B5CF6]"
                                                }`}>
                                                    {msg.role === "user"
                                                        ? <MessageSquare size={12} className="text-white" />
                                                        : <Bot size={12} className="text-white" />
                                                    }
                                                </div>
                                                <div className={`max-w-[80%] px-3.5 py-2.5 rounded-xl text-xs leading-relaxed ${
                                                    msg.role === "user"
                                                        ? "bg-[#2563EB] text-white"
                                                        : "bg-white text-slate-700 border border-[rgba(148,163,184,0.1)]"
                                                }`}>
                                                    {msg.content}
                                                </div>
                                            </div>
                                        ))}
                                        {isGenerating && (
                                            <div className="flex gap-2.5">
                                                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#2563EB] to-[#8B5CF6] flex items-center justify-center">
                                                    <Bot size={12} className="text-white" />
                                                </div>
                                                <div className="px-3.5 py-2.5 rounded-xl bg-white border border-[rgba(148,163,184,0.1)]">
                                                    <Loader2 size={13} className="animate-spin text-[#2563EB]" />
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {aiDraft && !isGenerating && (
                                    <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200">
                                        <div className="flex items-center justify-between mb-2.5">
                                            <div className="flex items-center gap-2">
                                                <CheckCircle2 size={14} className="text-emerald-600" />
                                                <span className="text-xs font-bold text-slate-900">Bản nháp đã sẵn sàng</span>
                                            </div>
                                            <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded-full ${
                                                aiDraft.confidence === "high"   ? "bg-emerald-100 text-emerald-700" :
                                                aiDraft.confidence === "medium" ? "bg-amber-100 text-amber-700" :
                                                "bg-rose-100 text-rose-700"
                                            }`}>
                                                {aiDraft.confidence === "high" ? "Độ tin cậy cao" : aiDraft.confidence === "medium" ? "Trung bình" : "Thấp"}
                                            </span>
                                        </div>
                                        <p className="text-xs text-slate-700 mb-0.5"><span className="font-semibold">Tiêu đề:</span> {aiDraft.title}</p>
                                        <p className="text-xs text-slate-700 mb-3">
                                            <span className="font-semibold">Tổng giá trị:</span>{" "}
                                            <span className="text-[#2563EB] font-bold">{formatVND(aiDraft.totalEstimate)} ₫</span>
                                            {" "}· {aiDraft.items.length} sản phẩm
                                        </p>
                                        {aiDraft.reasoning && (
                                            <p className="text-[10px] text-slate-500 italic border-l-2 border-[#2563EB] pl-2 mb-3">{aiDraft.reasoning}</p>
                                        )}
                                        <button
                                            onClick={handleFillToManual}
                                            className="w-full flex items-center justify-center gap-2 py-2 rounded-lg bg-[#2563EB] text-white text-xs font-bold hover:bg-[#1D4ED8] transition-colors"
                                        >
                                            <ArrowRight size={13} /> Điền vào form bên dưới
                                        </button>
                                    </div>
                                )}

                                <div className="space-y-2.5">
                                    <textarea
                                        value={aiPrompt}
                                        onChange={e => setAiPrompt(e.target.value)}
                                        onKeyDown={e => { if (e.key === "Enter" && e.metaKey) handleGenerateDraft(); }}
                                        placeholder="VD: Tôi cần mua 10 laptop Dell cho phòng IT, ngân sách khoảng 500 triệu, cần giao trong tuần sau..."
                                        className="erp-input resize-none h-24"
                                    />
                                    <div className="flex gap-2">
                                        <button
                                            onClick={handleGenerateDraft}
                                            disabled={isGenerating || !aiPrompt.trim()}
                                            className="btn-primary flex-1 justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            {isGenerating
                                                ? <><Loader2 size={14} className="animate-spin" /> Đang phân tích...</>
                                                : <><Wand2 size={14} /> Tạo PR bằng AI</>
                                            }
                                        </button>
                                        {aiMessages.length > 0 && (
                                            <button onClick={handleClearAI} className="btn-secondary px-3 shrink-0">
                                                <XCircle size={15} />
                                            </button>
                                        )}
                                    </div>
                                </div>

                                {aiError && (
                                    <div className="flex items-center gap-2 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs">
                                        <XCircle size={13} className="shrink-0" />
                                        <span>{aiError}</span>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Step 1 — General Info */}
                    <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-sm p-6 space-y-5">
                        <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                            <span className="step-badge">1</span>
                            Thông tin chung
                        </h3>

                        <div className="space-y-1.5">
                            <label className="erp-label">Tiêu đề yêu cầu *</label>
                            <input
                                type="text"
                                placeholder="Nhập tên dịch vụ/sản phẩm cần mua sắm..."
                                value={form.title}
                                onChange={e => setForm({ ...form, title: e.target.value })}
                                className="erp-input"
                            />
                            {fieldErrors.title && (
                                <p className="text-[10px] text-rose-600 font-semibold">{fieldErrors.title}</p>
                            )}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="space-y-1.5">
                                <label className="erp-label">Trung tâm chi phí *</label>
                                <div className="relative">
                                    <select
                                        value={form.costCenterId}
                                        onChange={e => setForm({ ...form, costCenterId: e.target.value })}
                                        className="erp-input appearance-none pr-8"
                                    >
                                        <option value="">-- Chọn --</option>
                                        {filteredCostCenters.map((cc: CostCenter) => (
                                            <option key={cc.id} value={cc.id}>{String(cc.code)} - {String(cc.name)}</option>
                                        ))}
                                    </select>
                                    <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                                </div>
                                {fieldErrors.costCenterId && (
                                    <p className="text-[10px] text-rose-600 font-semibold">{fieldErrors.costCenterId}</p>
                                )}
                            </div>

                            <div className="space-y-1.5">
                                <label className="erp-label">Độ ưu tiên</label>
                                <div className="relative">
                                    <select
                                        value={form.priority}
                                        onChange={e => setForm({ ...form, priority: Number(e.target.value) })}
                                        className="erp-input appearance-none pr-8"
                                    >
                                        <option value={1}>Thấp</option>
                                        <option value={2}>Bình thường</option>
                                        <option value={3}>Gấp</option>
                                        <option value={4}>Khẩn cấp (SLA 4H)</option>
                                    </select>
                                    <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label className="erp-label flex items-center gap-1">
                                    <Calendar size={10} /> Ngày cần hàng
                                </label>
                                <input
                                    type="date"
                                    value={form.requiredDate}
                                    onChange={e => setForm({ ...form, requiredDate: e.target.value })}
                                    className="erp-input"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <label className="erp-label">Mô tả</label>
                                <textarea
                                    placeholder="Mô tả chi tiết yêu cầu..."
                                    value={form.description}
                                    onChange={e => setForm({ ...form, description: e.target.value })}
                                    rows={3}
                                    className="erp-input resize-none"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="erp-label">Lý do / Justification</label>
                                <textarea
                                    placeholder="Mục đích, lý do cần thiết..."
                                    value={form.justification}
                                    onChange={e => setForm({ ...form, justification: e.target.value })}
                                    rows={3}
                                    className="erp-input resize-none"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Step 2 — Items */}
                    <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-sm p-6 space-y-4">
                        <div className="flex items-center justify-between">
                            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                                <span className="step-badge">2</span>
                                Danh mục hàng hóa
                            </h3>
                            {form.items.length > 0 && (
                                <span className="text-xs text-slate-500">
                                    {form.items.length} mục ·{" "}
                                    <span className="text-[#2563EB] font-semibold">{formatVND(totalEstimate)} ₫</span>
                                </span>
                            )}
                        </div>

                        <div className="space-y-1.5">
                            <label className="erp-label">Tìm kiếm & Thêm sản phẩm</label>
                            <Select
                                placeholder="Gõ tên sản phẩm, mã SKU..."
                                options={products.map((p: Product) => ({ label: p.name, value: p.id }))}
                                onChange={opt => opt && addItem(opt)}
                                menuPortalTarget={typeof document !== "undefined" ? document.body : null}
                                styles={{
                                    control: base => ({
                                        ...base, borderRadius: "8px",
                                        borderColor: "rgba(148,163,184,0.2)", background: "#FFFFFF",
                                        padding: "2px 4px", boxShadow: "none",
                                        "&:hover": { borderColor: "#2563EB" },
                                    }),
                                    menu: base => ({
                                        ...base, background: "#FFFFFF",
                                        border: "1px solid rgba(148,163,184,0.15)",
                                        borderRadius: "12px", zIndex: 9999,
                                    }),
                                    menuPortal: base => ({ ...base, zIndex: 9999 }),
                                    option: (base, state) => ({
                                        ...base,
                                        background: state.isFocused ? "rgba(37,99,235,0.08)" : "transparent",
                                        color: "#0F172A", fontSize: "13px", fontWeight: "600", padding: "10px 16px",
                                    }),
                                    singleValue: base => ({ ...base, color: "#0F172A" }),
                                    input:       base => ({ ...base, color: "#0F172A" }),
                                    placeholder: base => ({ ...base, color: "#94A3B8" }),
                                }}
                            />
                        </div>

                        <div className="rounded-xl border border-[rgba(148,163,184,0.1)] overflow-hidden">
                            <table className="erp-table text-xs m-0">
                                <thead>
                                    <tr>
                                        <th className="text-left px-4 py-3">Sản phẩm / Mô tả</th>
                                        <th className="text-center px-4 py-3 w-28">Số lượng</th>
                                        <th className="text-right px-4 py-3">Đơn giá</th>
                                        <th className="text-right px-4 py-3">Thành tiền</th>
                                        <th className="w-12 px-2 py-3" />
                                    </tr>
                                </thead>
                                <tbody>
                                    {form.items.length === 0 ? (
                                        <tr>
                                            <td colSpan={5}>
                                                <div className="empty-state py-10">
                                                    <ShoppingCart size={28} className={fieldErrors.items ? "text-rose-400" : "empty-state-icon"} />
                                                    <p className={`empty-state-title ${fieldErrors.items ? 'text-rose-500' : ''}`}>
                                                        {fieldErrors.items ?? 'Chưa có sản phẩm nào'}
                                                    </p>
                                                    <p className="empty-state-desc">Tìm và thêm sản phẩm từ ô tìm kiếm bên trên</p>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : (
                                        form.items.map((item, i) => (
                                            <tr key={i} className="hover:bg-[#F8FAFC] transition-colors">
                                                <td className="px-4 py-3">
                                                    <p className="font-semibold text-slate-900">{item.productDesc}</p>
                                                    {item.sku && <p className="text-[10px] text-slate-400 font-mono mt-0.5">SKU: {item.sku}</p>}
                                                </td>
                                                <td className="px-4 py-3 text-center">
                                                    <input
                                                        type="number" min={1}
                                                        className="w-20 text-center bg-[#F8FAFC] border border-[rgba(148,163,184,0.15)] rounded-lg py-1.5 px-2 text-xs font-bold text-slate-900 focus:outline-none focus:ring-1 focus:ring-[#2563EB]/40"
                                                        value={item.qty}
                                                        onChange={e => {
                                                            const items = [...form.items];
                                                            items[i].qty = parseInt(e.target.value) || 0;
                                                            setForm({ ...form, items });
                                                        }}
                                                    />
                                                </td>
                                                <td className="px-4 py-3 text-right text-slate-600">{formatVND(item.estimatedPrice)} ₫</td>
                                                <td className="px-4 py-3 text-right font-bold text-[#2563EB]">
                                                    {formatVND(item.qty * convertPrismaDecimal(item.estimatedPrice))} ₫
                                                </td>
                                                <td className="px-2 py-3 text-center">
                                                    <button
                                                        onClick={() => setForm({ ...form, items: form.items.filter((_, idx) => idx !== i) })}
                                                        className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all"
                                                    >
                                                        <Trash2 size={14} />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Step 3 — Budget Allocations */}
                    <BudgetAllocationsPanel
                        allocations={budgetAllocations as BudgetAllocation[]}
                        selectedCostCenterId={form.costCenterId}
                        selectedAllocationId={selectedAllocationId}
                        onSelect={setSelectedAllocationId}
                    />
                </div>

                {/* Right sidebar */}
                <div className="xl:col-span-1">
                    <div className="sticky top-6 space-y-4">

                        {/* Budget overview */}
                        <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-sm p-6 space-y-4">
                            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                                <BarChart3 size={15} className="text-[#2563EB]" />
                                Tổng quan Ngân sách
                            </h3>

                            <div className="p-3 rounded-xl bg-[#F8FAFC] border border-[rgba(148,163,184,0.1)]">
                                <p className="text-[10px] text-slate-400 uppercase tracking-wider mb-1">Trung tâm chi phí</p>
                                <p className="text-sm font-bold text-slate-900">
                                    {activeCC ? `${String(activeCC.code)} — ${String(activeCC.name)}` : "Chưa chọn"}
                                </p>
                            </div>

                            <div className="space-y-2.5">
                                <div className="flex justify-between items-center">
                                    <span className="text-xs text-slate-500">Khả dụng (Q{currentQuarter}/{currentYear})</span>
                                    <span className="text-sm font-bold text-slate-900">{formatVND(remainingBudget)} ₫</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-xs text-slate-500">Tổng giá trị PR</span>
                                    <span className="text-sm font-semibold text-slate-600">−{formatVND(totalEstimate)} ₫</span>
                                </div>
                                <div className="border-t border-[rgba(148,163,184,0.1)] pt-2.5">
                                    <div className="flex justify-between items-center">
                                        <span className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Còn lại sau PR</span>
                                        <span className={`text-base font-black ${(remainingBudget - totalEstimate) < 0 ? "text-rose-600" : "text-emerald-600"}`}>
                                            {(remainingBudget - totalEstimate) < 0 ? "−" : ""}
                                            {formatVND(Math.abs(remainingBudget - totalEstimate))} ₫
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {(remainingBudget - totalEstimate) < 0 && (
                                <div className="flex items-start gap-2.5 p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-xs">
                                    <AlertTriangle size={14} className="shrink-0 mt-0.5" />
                                    <p className="leading-relaxed">PR vượt ngân sách khả dụng. Có thể cần phê duyệt thêm từ CFO/CEO.</p>
                                </div>
                            )}
                        </div>

                        {/* Actions */}
                        <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-sm p-6 space-y-3">
                            <button
                                onClick={handleSubmit}
                                disabled={isSubmitting}
                                className="btn-primary w-full justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isSubmitting
                                    ? <><Loader2 size={14} className="animate-spin" /> Đang xử lý...</>
                                    : <><Send size={14} /> Gửi Phê Duyệt</>
                                }
                            </button>
                            <button onClick={() => router.push("/pr")} className="btn-secondary w-full justify-center">
                                <ArrowLeft size={14} /> Hủy bỏ
                            </button>
                            <p className="text-[10px] text-slate-400 text-center leading-relaxed pt-1 border-t border-[rgba(148,163,184,0.08)]">
                                PR sẽ đi qua quy trình phê duyệt đa cấp theo phân quyền.
                            </p>
                        </div>

                        {/* Tips */}
                        <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-sm p-6">
                            <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Lưu ý</h4>
                            <ul className="space-y-2.5">
                                {[
                                    "Đính kèm tài liệu kỹ thuật nếu có spec đặc biệt",
                                    "Giá tham chiếu được cập nhật từ thị trường mới nhất",
                                    "AI có thể gợi ý nhà cung cấp tối ưu theo lịch sử",
                                ].map((tip, i) => (
                                    <li key={i} className="flex gap-2 text-[11px] text-slate-500 leading-relaxed">
                                        <span className="w-1 h-1 rounded-full bg-[#2563EB] mt-1.5 shrink-0" />
                                        {tip}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </div>
            </div>

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
                    </div>
                </div>
            )}
        </div>
    );
}
