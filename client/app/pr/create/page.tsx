"use client";

import { useState, useEffect, useRef } from "react";
import { z } from "zod";
import { useRouter } from "next/navigation";
import Select from "react-select";
import { useProcurement, Product, CostCenter, CurrencyCode, BudgetAllocation } from "../../context/ProcurementContext";
import { Trash2, Save, FileText, ShoppingBag, AlertCircle, Info, Plus, Sparkles, Loader2, CheckCircle2, XCircle, ArrowLeft, Send, Bot, PenTool, Wand2, ArrowRight, MessageSquare, Wallet, Zap, Activity, ChevronDown, ShoppingCart, AlertTriangle, Calendar } from "lucide-react";
import { CreatePrDto } from "../../types/api-types";
import { convertPrismaDecimal, formatVND } from "../../utils/formatUtils";
import SupplierSuggestionWidget from "../../components/SupplierSuggestionWidget";


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
        <div className="animate-in fade-in duration-700 space-y-12">
            {/* PAGE HEADER SECTION */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 border-b border-slate-200 pb-10">
                <div>
                   <h1 className="text-4xl font-black text-slate-900 tracking-tighter uppercase mb-2">Tạo Phiếu Yêu Cầu (PR)</h1>
                   <p className="text-sm font-bold text-slate-900 tracking-tight uppercase">
                      Xin chào, <span className="text-[#2563EB]">{currentUser?.name || currentUser?.fullName}</span> – Hệ thống AI Procurement đang hỗ trợ bạn lập kế hoạch.
                   </p>
                </div>
                <div className="flex gap-4">
                    <button className="px-5 py-2 bg-[#F1F5F9] border border-slate-200 text-slate-900 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-100 transition-all" onClick={() => router.push("/pr")}>Hủy bỏ</button>
                    <button 
                        className="px-6 py-2.5 bg-[#2563EB] text-white rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-[#2563EB]/20 hover:scale-105 active:scale-95 transition-all flex items-center gap-2" 
                        onClick={handleSubmit} 
                        disabled={isSubmitting}
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

            {/* TABS — AI Mode vs Manual Mode */}
            <div className="flex gap-2 mb-6">
                <button
                    onClick={() => setActiveTab('ai')}
                    className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all ${
                        activeTab === 'ai'
                            ? 'bg-[#2563EB] text-white shadow-lg shadow-[#2563EB]/30'
                            : 'bg-[#F1F5F9] text-white border border-slate-200 hover:text-white'
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
                            : 'bg-[#F1F5F9] text-white border border-slate-200 hover:text-white'
                    }`}
                >
                    <PenTool size={16} />
                    <span>Tạo thủ công</span>
                    {form.items.length > 0 && (
                        <span className="ml-2 px-2 py-0.5 bg-[#2563EB]/20 text-[#2563EB] rounded-full text-[0.6875rem]">
                            {form.items.length}
                        </span>
                    )}
                </button>
            </div>

            {/* AI MODE TAB */}
            {activeTab === 'ai' && (
                <div className="animate-in fade-in duration-500 space-y-8">
                    {/* AI Chat Interface */}
                    <div className="bg-[#F1F5F9] rounded-xl border border-slate-200 shadow-2xl shadow-[#2563EB]/5 overflow-hidden">
                        <div className="p-8 border-b border-slate-200 bg-[#FFFFFF]/50">
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
                                                    : 'bg-[#F1F5F9] text-white border border-slate-200'
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
                                            <div className="p-4 rounded-2xl bg-[#F1F5F9] border border-slate-200">
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
                                    className="w-full h-32 bg-[#FFFFFF] border border-slate-200 rounded-2xl p-5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 resize-none placeholder:text-slate-400/50"
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
                                            className="px-4 py-3 bg-[#F1F5F9] border border-slate-200 text-slate-900 rounded-xl font-bold text-[10px] uppercase tracking-widest hover:text-slate-900 transition-all"
                                        >
                                            <XCircle size={16} />
                                        </button>
                                    )}
                                </div>
                            </div>
                            
                            {/* AI Draft Preview */}
                            {aiDraft && (
                                <div className="border border-blue-500/30 rounded-2xl p-6 bg-[#2563EB]/5 space-y-4">
                                    <div className="flex items-center gap-2">
                                        <CheckCircle2 className="text-emerald-600" size={20} />
                                        <span className="text-sm font-black text-slate-900">Bản nháp đã sẵn sàng</span>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4 text-sm">
                                        <div className="space-y-1">
                                            <span className="text-[0.6875rem] font-black text-slate-900 uppercase">Tiêu đề</span>
                                            <p className="text-slate-900 font-bold truncate">{aiDraft.title}</p>
                                        </div>
                                        <div className="space-y-1">
                                            <span className="text-[0.6875rem] font-black text-slate-900 uppercase">Số sản phẩm</span>
                                            <p className="text-slate-900 font-bold">{aiDraft.items.length} items</p>
                                        </div>
                                        <div className="space-y-1">
                                            <span className="text-[0.6875rem] font-black text-slate-900 uppercase">Tổng giá trị</span>
                                            <p className="text-slate-900 font-black">{formatVND(aiDraft.totalEstimate)}</p>
                                        </div>
                                        <div className="space-y-1">
                                            <span className="text-[0.6875rem] font-black text-slate-900 uppercase">Độ tin cậy</span>
                                            <span className={`px-2 py-1 rounded-full text-[0.6875rem] font-black uppercase ${
                                                aiDraft.confidence === 'high' ? 'bg-emerald-500/20 text-emerald-700' :
                                                aiDraft.confidence === 'medium' ? 'bg-amber-500/20 text-amber-700' :
                                                'bg-rose-500/20 text-rose-700'
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
                                        className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-emerald-500/20 text-emerald-700 border border-emerald-500/30 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-emerald-500/30 transition-all"
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
                            <div key={idx} className="bg-[#FFFFFF] rounded-2xl p-5 border border-slate-200">
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
                    <div className="bg-[#F1F5F9] rounded-xl border border-slate-200 shadow-2xl shadow-[#2563EB]/5 overflow-hidden">
                        <div className="p-8 border-b border-slate-200 bg-[#FFFFFF]/50">
                             <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-900 flex items-center gap-3">
                                 <Activity size={16} className="text-[#2563EB]" /> Thông tin chung
                             </h3>
                        </div>
                        <div className="p-10 space-y-8">
                            <div className="space-y-3">
                                <label className="text-[10px] font-black text-slate-900 uppercase tracking-widest ml-1">Tiêu đề yêu cầu</label>
                                <input 
                                    className="w-full bg-[#FFFFFF] border border-slate-200 rounded-2xl px-6 py-4 text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 transition-all placeholder:text-slate-400/50" 
                                    placeholder="Nhập tên dịch vụ/sản phẩm cần mua sắm..."
                                    value={form.title} 
                                    onChange={e => setForm({ ...form, title: e.target.value })} 
                                />
                                {fieldErrors.title && <span className="text-[0.6875rem] font-black text-rose-500 uppercase tracking-widest ml-1">{fieldErrors.title}</span>}
                            </div>
                            <button onClick={() => setShowAiSection(!showAiSection)} className="flex w-full items-center justify-end mt-2 p-2 rounded-lg hover:bg-slate-50 transition-all">
                                <ChevronDown size={15} className={`text-slate-400 transition-transform duration-200 shrink-0 ${showAiSection ? "rotate-180" : ""}`} />
                            </button>

                        {showAiSection && (
                            <div className="mt-5 pt-5 border-t border-slate-200 space-y-4">
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
                                                        : "bg-white text-slate-700 border border-slate-200"
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
                                                <div className="px-3.5 py-2.5 rounded-xl bg-white border border-slate-200">
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
                                            <span className={`text-[0.6875rem] font-bold uppercase px-2 py-0.5 rounded-full ${
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
                                            <Save size={16} />
                                            Chuyển sang Tạo thủ công &amp; Gửi PR
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
                        )}
                        </div>
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

                    {/* FORM SECTION 3 — DANH MỤC HÀNG HÓA */}
                    <div className="bg-[#F1F5F9] rounded-xl border border-slate-200 shadow-2xl shadow-[#2563EB]/5 overflow-hidden">
                        <div className="p-8 border-b border-slate-200 bg-[#FFFFFF]/50 flex justify-between items-center">
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
                            
                            <div className="overflow-hidden rounded-xl border border-slate-200 bg-[#FFFFFF]">
                                <table className="erp-table text-xs m-0">
                                    <thead>
                                        <tr className="border-b border-slate-200 tracking-[0.1em]">
                                            <th className="px-8 py-5">Sản phẩm / Mô tả</th>
                                            <th className="px-8 py-5 text-center">Số lượng</th>
                                            <th className="px-8 py-5 text-right">Đơn giá tham chiếu</th>
                                            <th className="px-8 py-5 text-right">Thành tiền</th>
                                            <th className="px-8 py-5 w-20 text-center"></th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
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
                                                            className="w-20 text-center bg-[#F1F5F9] border border-slate-200 rounded-xl py-2 px-3 text-xs font-black text-slate-900 focus:outline-none focus:ring-1 focus:ring-[#2563EB]/50" 
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
                                    
                                    <div className="h-px bg-slate-100" />
                                    
                                    <div className={`p-8 rounded-xl border-2 transition-all duration-500 ${remainingBudget - totalEstimate < 0 ? "bg-rose-500/10 border-rose-500/20 shadow-rose-500/5" : "bg-emerald-500/10 border-emerald-500/20 shadow-emerald-500/5"}`}>
                                        <div className="flex items-center gap-3 mb-2 opacity-70">
                                            <div className={`h-2 w-2 rounded-full ${remainingBudget - totalEstimate < 0 ? "bg-rose-500" : "bg-emerald-500"}`}></div>
                                            <span className={`text-[10px] font-black uppercase tracking-[0.2em] ${remainingBudget - totalEstimate < 0 ? "text-rose-700" : "text-emerald-700"}`}>CÒN LẠI SAU PR</span>
                                        </div>
                                        <div className={`text-4xl font-black tracking-tighter ${remainingBudget - totalEstimate < 0 ? "text-rose-700" : "text-emerald-700"}`}>
                                            {formatVND(Math.abs(remainingBudget - totalEstimate))} <span className="text-lg opacity-50">₫</span>
                                        </div>
                                    </div>
                                    
                                    {remainingBudget - totalEstimate < 0 && (
                                        <div className="flex gap-4 p-6 bg-amber-500/10 rounded-xl border border-amber-500/20 text-amber-700 animate-pulse">
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
                                className="w-full mt-6 py-4 bg-[#FFFFFF] text-slate-900 font-black text-[10px] uppercase tracking-widest rounded-2xl border border-slate-200 hover:bg-slate-100 transition-all"
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
