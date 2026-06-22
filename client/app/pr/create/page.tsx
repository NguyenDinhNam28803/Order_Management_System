"use client";

import { useState, useEffect } from "react";
import { z } from "zod";
import { useRouter } from "next/navigation";
import Select from "react-select";
import { useProcurement, Product, CostCenter, CurrencyCode, BudgetAllocation } from "../../context/ProcurementContext";
import { Trash2, FileText, Sparkles, Loader2, CheckCircle2, XCircle, ArrowLeft, Send, Bot, PenTool, Wand2, ArrowRight, MessageSquare, Wallet, Zap, ChevronDown, ShoppingCart, AlertTriangle, Calendar } from "lucide-react";
import { CreatePrDto } from "../../types/api-types";
import { convertPrismaDecimal, formatVND } from "../../utils/formatUtils";
import PageHeader from "../../components/shared/PageHeader";


interface PrDraftResponse {
    success: boolean;
    title: string;
    description?: string;
    justification?: string;
    priority?: number;
    currency?: string;
    suggestedCostCenterId?: string;
    totalEstimate: number;
    confidence: 'high' | 'medium' | 'low';
    reasoning?: string;
    error?: string;
    validationErrors?: string[];
    items: Array<{
        productDesc: string;
        qty: number;
        estimatedPrice: number;
        unit: string;
        currency?: string;
        categoryId?: string;
        specNote?: string;
        preferredSupplierId?: string;
    }>;
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

    const [activeTab, setActiveTab]          = useState<'ai' | 'manual'>('manual');
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
        setActiveTab('manual');
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
            const prId = await addPR(payload as unknown as import("../../context/ProcurementContext").PR);
            if (prId) {
                await submitPR(prId);
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
        <main className="p-6 space-y-6 animate-in fade-in duration-500">
            {/* PAGE HEADER */}
            <PageHeader
                icon={FileText}
                iconColor="blue"
                title="Tạo Phiếu Yêu Cầu (PR)"
                subtitle={`Xin chào ${currentUser?.name || currentUser?.fullName || ""} — Trợ lý AI Procurement hỗ trợ bạn lập kế hoạch mua sắm.`}
                actions={
                    <>
                        <button className="btn-secondary" onClick={() => router.push("/pr")}>
                            <ArrowLeft size={16} /> Hủy bỏ
                        </button>
                        <button className="btn-primary" onClick={handleSubmit} disabled={isSubmitting}>
                            <Send size={16} /> Gửi phê duyệt
                        </button>
                    </>
                }
            />

            {/* MODE TABS */}
            <div className="filter-tabs">
                <button
                    onClick={() => setActiveTab('ai')}
                    className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all ${
                        activeTab === 'ai'
                            ? 'bg-[#2563EB] text-white shadow-lg shadow-[#2563EB]/30'
                            : 'bg-[#F1F5F9] text-slate-600 border border-[rgba(148,163,184,0.1)] hover:text-slate-800'
                    }`}
                >
                    <Bot size={14} />
                    Tạo bằng AI Chat
                    {aiDraft && (
                        <span className="ml-1 w-2 h-2 rounded-full bg-emerald-400 animate-pulse inline-block" />
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
                    <PenTool size={14} />
                    Tạo thủ công
                    {form.items.length > 0 && (
                        <span className="ml-1 px-1.5 py-0.5 bg-[#2563EB]/10 text-[#2563EB] rounded-full text-[11px]">
                            {form.items.length}
                        </span>
                    )}
                </button>
            </div>

            {/* AI MODE TAB */}
            {activeTab === 'ai' && (
                <div className="animate-in fade-in duration-500 space-y-6">
                    <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-sm overflow-hidden">
                        <div className="p-6 border-b border-slate-200">
                            <div className="flex items-center gap-3">
                                <div className="bg-gradient-to-br from-[#2563EB] to-[#8B5CF6] p-2 rounded-lg text-white shadow-sm">
                                    <Sparkles size={16} />
                                </div>
                                <div>
                                    <h3 className="text-sm font-semibold text-[#0F172A]">AI Procurement Assistant</h3>
                                    <p className="text-xs text-[#64748B]">Mô tả nhu cầu mua sắm, AI sẽ tạo PR giúp bạn</p>
                                </div>
                            </div>
                        </div>

                        <div className="p-6 space-y-5">
                            {aiMessages.length > 0 && (
                                <div className="bg-[#F8FAFC] rounded-xl p-4 space-y-3 max-h-[300px] overflow-y-auto">
                                    {aiMessages.map((msg, idx) => (
                                        <div key={idx} className={`flex gap-2.5 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                                            <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${
                                                msg.role === 'user' ? 'bg-[#2563EB]' : 'bg-gradient-to-br from-[#2563EB] to-[#8B5CF6]'
                                            }`}>
                                                {msg.role === 'user'
                                                    ? <MessageSquare size={12} className="text-white" />
                                                    : <Bot size={12} className="text-white" />
                                                }
                                            </div>
                                            <div className={`max-w-[80%] p-3 rounded-xl text-xs leading-relaxed ${
                                                msg.role === 'user'
                                                    ? 'bg-[#2563EB] text-white'
                                                    : 'bg-white text-slate-700 border border-slate-200'
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
                                            <div className="p-3 rounded-xl bg-white border border-slate-200">
                                                <Loader2 className="animate-spin text-[#2563EB]" size={16} />
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            <div className="space-y-3">
                                <label className="erp-label">Mô tả yêu cầu mua sắm</label>
                                <textarea
                                    value={aiPrompt}
                                    onChange={(e) => setAiPrompt(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' && e.metaKey) handleGenerateDraft();
                                    }}
                                    placeholder="VD: Tôi cần mua 10 laptop Dell cho phòng IT, ngân sách khoảng 500 triệu, giao hàng trong tuần sau..."
                                    className="erp-input resize-none h-28"
                                />
                                <div className="flex gap-2">
                                    <button
                                        onClick={handleGenerateDraft}
                                        disabled={isGenerating || !aiPrompt.trim()}
                                        className="btn-primary flex-1 justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {isGenerating ? (
                                            <><Loader2 className="animate-spin" size={14} /> Đang tạo...</>
                                        ) : (
                                            <><Wand2 size={14} /> Tạo PR bằng AI</>
                                        )}
                                    </button>
                                    {aiMessages.length > 0 && (
                                        <button
                                            onClick={handleClearAI}
                                            className="btn-secondary px-3"
                                        >
                                            <XCircle size={16} />
                                        </button>
                                    )}
                                </div>
                            </div>

                            {aiDraft && (
                                <div className="border border-emerald-200 rounded-xl p-5 bg-emerald-50 space-y-4">
                                    <div className="flex items-center gap-2">
                                        <CheckCircle2 className="text-emerald-600" size={16} />
                                        <span className="text-sm font-semibold text-slate-900">Bản nháp đã sẵn sàng</span>
                                    </div>
                                    <div className="grid grid-cols-2 gap-3 text-sm">
                                        <div className="space-y-1">
                                            <span className="text-[11px] font-semibold text-[#64748B] uppercase">Tiêu đề</span>
                                            <p className="text-slate-900 font-semibold truncate">{aiDraft.title}</p>
                                        </div>
                                        <div className="space-y-1">
                                            <span className="text-[11px] font-semibold text-[#64748B] uppercase">Số sản phẩm</span>
                                            <p className="text-slate-900 font-semibold">{aiDraft.items.length} items</p>
                                        </div>
                                        <div className="space-y-1">
                                            <span className="text-[11px] font-semibold text-[#64748B] uppercase">Tổng giá trị</span>
                                            <p className="text-[#2563EB] font-bold">{formatVND(aiDraft.totalEstimate)} ₫</p>
                                        </div>
                                        <div className="space-y-1">
                                            <span className="text-[11px] font-semibold text-[#64748B] uppercase">Độ tin cậy</span>
                                            <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold uppercase ${
                                                aiDraft.confidence === 'high' ? 'bg-emerald-100 text-emerald-700' :
                                                aiDraft.confidence === 'medium' ? 'bg-amber-100 text-amber-700' :
                                                'bg-rose-100 text-rose-700'
                                            }`}>
                                                {aiDraft.confidence || 'medium'}
                                            </span>
                                        </div>
                                    </div>
                                    {aiDraft.reasoning && (
                                        <p className="text-xs text-[#64748B] italic border-l-2 border-[#2563EB] pl-3">
                                            {aiDraft.reasoning}
                                        </p>
                                    )}
                                    <button
                                        onClick={handleFillToManual}
                                        className="btn-primary w-full justify-center"
                                    >
                                        <ArrowRight size={14} />
                                        Chuyển sang Tạo thủ công để chỉnh sửa &amp; Gửi PR
                                    </button>
                                </div>
                            )}

                            {aiError && (
                                <div className="flex items-center gap-2 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs">
                                    <XCircle size={13} className="shrink-0" />
                                    <span>{aiError}</span>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {[
                            { icon: <MessageSquare size={14} />, title: "Mô tả chi tiết", desc: "Số lượng, mục đích, thời gian cần" },
                            { icon: <Wallet size={14} />, title: "Ngân sách rõ ràng", desc: "Đề cập khoảng giá mong muốn" },
                            { icon: <Zap size={14} />, title: "Tiêu chí đặc biệt", desc: "Thương hiệu, specs kỹ thuật" }
                        ].map((tip, idx) => (
                            <div key={idx} className="bg-white rounded-xl p-4 border border-[#E2E8F0] shadow-sm">
                                <div className="text-[#2563EB] mb-2">{tip.icon}</div>
                                <h4 className="text-xs font-semibold text-[#0F172A] mb-1">{tip.title}</h4>
                                <p className="text-[11px] text-[#64748B]">{tip.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* MANUAL MODE TAB */}
            {activeTab === 'manual' && (
                <div className="animate-in fade-in duration-500 grid grid-cols-1 xl:grid-cols-10 gap-6">
                    {/* LEFT CONTENT — 6 cols */}
                    <div className="xl:col-span-6 space-y-6">

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
                                {fieldErrors.title && <span className="text-[9px] font-black text-rose-500 uppercase tracking-widest ml-1">{fieldErrors.title}</span>}
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="space-y-3">
                                    <label className="erp-label">Trung tâm chi phí</label>
                                    <div className="relative">
                                        <select
                                            value={form.costCenterId}
                                            onChange={e => setForm({ ...form, costCenterId: e.target.value })}
                                            className="erp-input appearance-none"
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
                                    <label className="erp-label">Độ ưu tiên</label>
                                    <div className="relative">
                                        <select
                                            value={form.priority}
                                            onChange={e => setForm({ ...form, priority: Number(e.target.value) })}
                                            className="erp-input appearance-none"
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

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-3">
                                    <label className="erp-label">Mô tả</label>
                                    <textarea
                                        placeholder="Mô tả chi tiết yêu cầu..."
                                        value={form.description}
                                        onChange={e => setForm({ ...form, description: e.target.value })}
                                        rows={3}
                                        className="erp-input resize-none"
                                    />
                                </div>
                                <div className="space-y-3">
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
                    </div>

                    {/* Step 2 — Danh mục hàng hóa */}
                    <div className="erp-card overflow-hidden">
                        <div className="p-6 border-b border-slate-200 flex justify-between items-center">
                             <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                                 <span className="step-badge">2</span>
                                 Danh mục hàng hóa đề xuất
                             </h3>
                        </div>
                        <div className="p-6">
                            <div className="mb-8 space-y-3">
                                <label className="text-[10px] font-black text-slate-900 uppercase tracking-widest ml-1">Tìm kiếm & Thêm sản phẩm</label>
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

                            <div className="rounded-xl border border-slate-200 overflow-hidden">
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
                                                            className="w-20 text-center bg-[#F8FAFC] border border-slate-200 rounded-lg py-1.5 px-2 text-xs font-bold text-slate-900 focus:outline-none focus:ring-1 focus:ring-[#2563EB]/40"
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
                        {budgetAllocations && budgetAllocations.length > 0 && (
                            <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-sm p-6">
                                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 mb-4">
                                    <span className="step-badge">3</span>
                                    Phân bổ ngân sách
                                </h3>
                                <div className="space-y-2">
                                    {(budgetAllocations as BudgetAllocation[]).filter(a => a.costCenterId === form.costCenterId).map((a) => (
                                        <div
                                            key={a.id}
                                            onClick={() => setSelectedAllocationId(a.id)}
                                            className={`p-3 rounded-lg border cursor-pointer transition-all ${selectedAllocationId === a.id ? 'border-[#2563EB] bg-blue-50' : 'border-slate-200 hover:border-[#2563EB]/40'}`}
                                        >
                                            <span className="text-xs font-semibold text-slate-700">{formatVND(convertPrismaDecimal(a.allocatedAmount))} ₫ (Đã chi: {formatVND(convertPrismaDecimal(a.spentAmount))} ₫)</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* RIGHT SIDEBAR — 4 cols */}
                    <div className="xl:col-span-4">
                        <div className="sticky top-6 space-y-4">

                            {/* Budget Summary */}
                            <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-sm p-6">
                                <h4 className="text-[10px] font-bold text-[#64748B] uppercase tracking-widest mb-4">Ngân sách</h4>
                                <div className="space-y-2.5">
                                    <div className="flex justify-between items-center">
                                        <span className="text-xs text-slate-500">Khả dụng (Q{currentQuarter}/{currentYear})</span>
                                        <span className="text-sm font-bold text-slate-900">{formatVND(remainingBudget)} ₫</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-xs text-slate-500">Tổng giá trị PR</span>
                                        <span className="text-sm font-semibold text-slate-600">−{formatVND(totalEstimate)} ₫</span>
                                    </div>
                                    <div className="border-t border-slate-200 pt-2.5">
                                        <div className="flex justify-between items-center">
                                            <span className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Còn lại sau PR</span>
                                            <span className={`text-base font-bold ${(remainingBudget - totalEstimate) < 0 ? "text-rose-600" : "text-emerald-600"}`}>
                                                {(remainingBudget - totalEstimate) < 0 ? "−" : ""}
                                                {formatVND(Math.abs(remainingBudget - totalEstimate))} ₫
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {(remainingBudget - totalEstimate) < 0 && (
                                    <div className="flex items-start gap-2.5 mt-4 p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-xs">
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
                                <p className="text-[10px] text-slate-400 text-center leading-relaxed pt-1 border-t border-slate-200">
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
                                className="btn-secondary w-full justify-center mt-4"
                            >
                                Quay lại chỉnh sửa
                            </button>
                        )}
                    </div>
                </div>
            )}
        </main>
    );
}
