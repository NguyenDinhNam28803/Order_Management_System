"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { PR, PRItem, useProcurement, Organization, CompanyType, KycStatus } from "../../../context/ProcurementContext";
import { 
    FileText, 
    User, 
    Building2, 
    Calendar, 
    Plus, 
    Trash2, 
    Send, 
    ChevronLeft,
    Search,
    Info,
    CheckCircle2,
    Sparkles,
    Loader2,
    Bot,
    Star,
    TrendingUp,
    Check
} from "lucide-react";

// RAG AI Types
interface Source {
    content: string;
    metadata: {
        table: string;
        id: string;
        name?: string;
    };
    similarity?: number;
}

interface RagResponse {
    status: string;
    message: string;
    data: {
        answer: {
            summary: string;
            data?: Record<string, unknown>[];
            found?: boolean;
        };
        sources: Source[];
    }
}

interface SubItem {
    id: string;
    productName: string;
    qty: number;
    unit: string;
    estimatedPrice: number;
}

interface AiSupplierSuggestion {
    id: string;
    name: string;
    email?: string;
    matchScore: number;
    reasons: string[];
    historicalData?: {
        avgPrice: number;
        deliveryRate: number;
        qualityScore: number;
    };
}

export default function CreateRFQPage() {
    const params = useParams();
    const searchParams = useSearchParams();
    const router = useRouter();
    const { prs, apiFetch, refreshData, currentUser, organizations, createRFQ } = useProcurement();
    
    // Get prId from query or params
    const prId = params.id as string || searchParams.get("prId");
    const targetPR = prs.find((p: PR) => p.id === prId);

    const [selectedVendors, setSelectedVendors] = useState<Organization[]>([]);
    const [vendorSearch, setVendorSearch] = useState("");
    const [deadline, setDeadline] = useState("");
    const [note, setNote] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    
    // AI Suggestion states
    const [aiSuggestions, setAiSuggestions] = useState<AiSupplierSuggestion[]>([]);
    const [isAiLoading, setIsAiLoading] = useState(false);
    const [showAiSuggestions, setShowAiSuggestions] = useState(false);
    const [addedAiVendors, setAddedAiVendors] = useState<Set<string>>(new Set());

    // Auto-trigger AI khi targetPR đã load xong và có items
    useEffect(() => {
        if (targetPR && targetPR.items && targetPR.items.length > 0) {
            fetchAiSuggestions();
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [targetPR?.id]);

    // Filter organizations to exclude current user's org
    const realVendors = React.useMemo(() => 
        (organizations || []).filter((o: Organization) => o.id !== currentUser?.orgId),
    [organizations, currentUser?.orgId]);

    const filteredVendors = realVendors.filter((v: Organization) =>
        v.name.toLowerCase().includes(vendorSearch.toLowerCase()) || 
        (v.email && v.email.toLowerCase().includes(vendorSearch.toLowerCase()))
    );

    const addVendor = (v: Partial<Organization>) => {
        if (!selectedVendors.find(sv => sv.id === v.id)) {
            setSelectedVendors([...selectedVendors, v as Organization]);
        }
        setVendorSearch("");
    };

    const removeVendor = (id: string) => {
        setSelectedVendors(selectedVendors.filter(v => v.id !== id));
    };

    // AI Suggestion function - Connected to RAG (Real Data)
    const fetchAiSuggestions = async () => {
        if (!targetPR || !targetPR.items || targetPR.items.length === 0) {
            return;
        }
        
        setIsAiLoading(true);
        setShowAiSuggestions(true);
        
        try {
            // Get product names for the query
            const productNames = targetPR.items.map((item: PRItem) => 
                item.productName || item.productId || "Sản phẩm"
            ).join(", ");
            
            // Query RAG for supplier suggestions
            const response = await apiFetch('/rag/query', {
                method: 'POST',
                body: JSON.stringify({
                    question: "Gợi ý 3 nhà cung cấp tốt nhất cho sản phẩm: " + productNames + ". Phân tích dựa trên KPI, giá cả lịch sử, tỷ lệ giao hàng đúng hạn và chất lượng.",
                    topK: 5
                })
            });
            
            if (!response.ok) {
                throw new Error('RAG query failed');
            }
            
            const ragResult: RagResponse = await response.json();
            
            // Parse AI response - extract suggestions from RAG data
            let suggestions: AiSupplierSuggestion[] = [];
            
            if (ragResult.data?.sources && ragResult.data.sources.length > 0) {
                // Extract supplier info from RAG sources
                suggestions = ragResult.data.sources
                    .filter((s: Source) => s.metadata.table === 'supplier_kpi_scores' || 
                                 s.metadata.table === 'organizations' ||
                                 s.content.toLowerCase().includes('supplier') ||
                                 s.content.toLowerCase().includes('nhà cung cấp'))
                    .slice(0, 3)
                    .map((source: Source, idx: number) => {
                        // Parse content to extract supplier info
                        const content = source.content;
                        const nameMatch = content.match(/(?:nhà cung cấp|supplier|tổ chức|organization)[^:]*:\s*([^\n.]+)/i) ||
                                         content.match(/^([^\n.]+)/);
                        const name = nameMatch ? nameMatch[1].trim() : `Nhà cung cấp ${idx + 1}`;
                        
                        // Extract metrics if available
                        const kpiMatch = content.match(/KPI[:\s]+(\d+\.?\d*)/i);
                        const deliveryMatch = content.match(/giao hàng[:\s]+(\d+)%/i);
                        const qualityMatch = content.match(/chất lượng[:\s]+(\d+\.?\d*)/i);
                        const priceMatch = content.match(/giá[:\s]+(\d[\d.,]*)/i);
                        
                        const matchScore = Math.round((source.similarity || 0.5) * 100);
                        
                        // Build reasons from content analysis
                        const reasons: string[] = [];
                        if (kpiMatch) reasons.push(`KPI cao: ${kpiMatch[1]}`);
                        if (deliveryMatch) reasons.push(`Giao hàng: ${deliveryMatch[1]}%`);
                        if (qualityMatch) reasons.push(`Chất lượng: ${qualityMatch[1]}/5`);
                        if (reasons.length === 0) reasons.push("Phù hợp với sản phẩm");
                        if (source.similarity && source.similarity > 0.7) reasons.push("Độ tương đồng cao");
                        
                        return {
                            id: source.metadata.id || `rag-supp-${idx}`,
                            name: name.length > 50 ? name.substring(0, 50) + "..." : name,
                            email: `${name.toLowerCase().replace(/[^a-z0-9]/g, '.').substring(0, 20)}@supplier.vn`,
                            matchScore: Math.min(matchScore, 98),
                            reasons: reasons.slice(0, 3),
                            historicalData: {
                                avgPrice: priceMatch ? parseInt(priceMatch[1].replace(/[,.]/g, '')) : 1000000,
                                deliveryRate: deliveryMatch ? parseInt(deliveryMatch[1]) : 95 - (idx * 3),
                                qualityScore: qualityMatch ? parseFloat(qualityMatch[1]) : 4.5 - (idx * 0.15)
                            }
                        };
                    });
            }
            
            // If no supplier-specific sources, create from summary analysis
            if (suggestions.length === 0 && ragResult.data?.answer?.summary) {
                const summary = ragResult.data.answer.summary;
                const supplierMatches = summary.match(/(?:\d+\.\s*|[-•]\s*)([^\n:]+)/g);
                
                if (supplierMatches) {
                    suggestions = supplierMatches.slice(0, 3).map((match: string, idx: number) => {
                        const name = match.replace(/^\d+\.\s*|[-•]\s*/, '').trim();
                        return {
                            id: `ai-supp-${idx}`,
                            name: name,
                            email: `${name.toLowerCase().replace(/[^a-z0-9]/g, '.').substring(0, 20)}@supplier.vn`,
                            matchScore: 95 - (idx * 5),
                            reasons: ["Được AI gợi ý", "Phù hợp với sản phẩm"],
                            historicalData: {
                                avgPrice: 1000000 + (idx * 200000),
                                deliveryRate: 95 - (idx * 2),
                                qualityScore: 4.5 - (idx * 0.2)
                            }
                        };
                    });
                }
            }
            
            setAiSuggestions(suggestions);
            
            // Show message if no suggestions found
            if (suggestions.length === 0) {
                console.warn("RAG AI không tìm thấy nhà cung cấp phù hợp");
            }
        } catch (error) {
            console.error("RAG AI suggestion error:", error);
            setAiSuggestions([]);
        } finally {
            setIsAiLoading(false);
        }
    };

    const addAiVendor = (suggestion: AiSupplierSuggestion) => {
        // Check if already added
        if (selectedVendors.find(v => v.id === suggestion.id)) {
            return;
        }
        
        const vendorOrg: Organization = {
            id: suggestion.id,
            name: suggestion.name,
            email: suggestion.email || "",
            code: "AI-" + suggestion.id.substring(0, 4).toUpperCase(),
            companyType: CompanyType.SUPPLIER,
            countryCode: "VN",
            isActive: true,
            kycStatus: KycStatus.APPROVED,
            trustScore: suggestion.matchScore,
            metadata: {
                aiSuggested: true,
                reasons: suggestion.reasons,
                historicalData: suggestion.historicalData
            },
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        
        setSelectedVendors([...selectedVendors, vendorOrg]);
        setAddedAiVendors(new Set(addedAiVendors).add(suggestion.id));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (selectedVendors.length === 0) {
            alert("Vui lòng chọn ít nhất một nhà cung cấp");
            return;
        }

        setIsSubmitting(true);
        try {
            // Updated to match backend CreateRfqDto
            const payload = {
                prId: prId as string,
                title: "RFQ cho " + (targetPR?.title || 'yêu cầu mua hàng') + "",
                description: note,
                deadline: new Date(deadline).toISOString(),
                supplierIds: selectedVendors.map(v => v.id),
                minSuppliers: selectedVendors.length
            };

            // createRFQ in context already handles:
            // 1. API call to /request-for-quotations
            // 2. notify("Tạo RFQ thành công!", "success")
            // 3. refreshData()
            const result = await createRFQ(payload);

            if (!result) {
                throw new Error("Không thể tạo RFQ. Vui lòng kiểm tra lại kết nối.");
            }

            // Trigger success state immediately
            setIsSuccess(true);
            
            // Redirect after a short delay
            setTimeout(() => {
                router.push("/procurement/prs");
            }, 2500);
        } catch (err) {
            console.error(err);
            const errorMessage = err instanceof Error ? err.message : "Lỗi không xác định";
            alert("Có lỗi xảy ra khi tạo RFQ: " + errorMessage);
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!targetPR) {
        return <div className="p-20 text-center font-black">Không tìm thấy thông tin PR.</div>;
    }

    if (isSuccess) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#0F1117]">
                <div className="bg-[#161922] p-12 rounded-[40px] shadow-2xl text-center max-w-md animate-in zoom-in duration-500 border border-[rgba(148,163,184,0.1)]">
                    <div className="w-24 h-24 bg-emerald-500/10 text-emerald-400 rounded-full flex items-center justify-center mx-auto mb-6 border border-emerald-500/20">
                        <CheckCircle2 size={48} />
                    </div>
                    <h2 className="text-3xl font-black text-[#F8FAFC] mb-2 uppercase">THÀNH CÔNG!</h2>
                    <p className="text-[#94A3B8] font-medium">Yêu cầu báo giá đã được gửi tới {selectedVendors.length} nhà cung cấp.</p>
                </div>
            </div>
        );
    }

    return (
        <main className="animate-in fade-in slide-in-from-bottom-4 duration-700 bg-[#0F1117] min-h-screen text-[#F8FAFC]">
            <div className="p-8">
                <header className="flex items-center justify-between mb-10 max-w-[1600px] mx-auto">
                    <div className="flex items-center gap-6">
                        <button onClick={() => router.back()} className="h-14 w-14 bg-[#161922] rounded-2xl border border-[rgba(148,163,184,0.1)] flex items-center justify-center text-[#64748B] hover:text-[#F8FAFC] hover:border-[#3B82F6]/30 transition-all shadow-xl shadow-black/20 active:scale-95">
                            <ChevronLeft size={24} />
                        </button>
                        <div>
                            <h1 className="text-4xl font-black text-[#F8FAFC] tracking-tighter uppercase">TẠO YÊU CẦU BÁO GIÁ (RFQ)</h1>
                            <nav className="flex items-center gap-2 mt-1">
                                <span className="text-[10px] font-black text-[#64748B] uppercase tracking-widest">Nghiệp vụ Thu mua</span>
                                <span className="h-1 w-1 bg-[#64748B] rounded-full"></span>
                                <span className="text-[10px] font-black text-[#3B82F6] uppercase tracking-widest">Tạo mới RFQ</span>
                            </nav>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="text-right">
                            <div className="text-[10px] font-black text-[#64748B] uppercase tracking-widest">Phiên làm việc</div>
                            <div className="text-sm font-black text-[#F8FAFC] uppercase">{currentUser?.name}</div>
                        </div>
                        <div className="h-12 w-12 rounded-xl bg-[#161922] border border-[rgba(148,163,184,0.1)] flex items-center justify-center text-[#F8FAFC] font-black">
                            {currentUser?.name?.substring(0,2).toUpperCase()}
                        </div>
                    </div>
                </header>

                <div className="max-w-[1600px] mx-auto">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                {/* Left side: PR Info Summary */}
                <div className="lg:col-span-1 space-y-8">
                    <div className="bg-[#161922] rounded-[40px] border border-[rgba(148,163,184,0.1)] shadow-xl shadow-black/20 overflow-hidden">
                        <div className="bg-[#0F1117] p-8 text-[#F8FAFC] border-b border-[rgba(148,163,184,0.1)]">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="h-10 w-10 bg-[#3B82F6]/10 rounded-xl flex items-center justify-center border border-[#3B82F6]/20">
                                    <FileText size={20} className="text-[#3B82F6]" />
                                </div>
                                <span className="text-[10px] font-black uppercase tracking-widest text-[#64748B]">Thông tin PR gốc</span>
                            </div>
                            <h2 className="text-2xl font-black mb-1 text-[#F8FAFC]">Thông tin yêu cầu</h2>
                            <p className="text-[#94A3B8] text-sm font-medium">{targetPR.title}</p>
                        </div>
                        <div className="p-8 space-y-6">
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-[#64748B] font-bold uppercase text-[10px] tracking-widest">Người yêu cầu</span>
                                <span className="text-[#F8FAFC] font-black">{targetPR.requester?.fullName || targetPR.requester?.name || "N/A"}</span>
                            </div>
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-[#64748B] font-bold uppercase text-[10px] tracking-widest">Bộ phận</span>
                                <span className="text-[#F8FAFC] font-black">{typeof targetPR.department === 'string' ? targetPR.department : targetPR.department?.name || "N/A"}</span>
                            </div>
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-[#64748B] font-bold uppercase text-[10px] tracking-widest">Ước tính (VNĐ)</span>
                                <span className="text-[#F8FAFC] font-black ">{(Number(targetPR.totalEstimate) || 0).toLocaleString()} ₫</span>
                            </div>
                            
                            <div className="pt-6 border-t border-[rgba(148,163,184,0.1)]">
                                <h3 className="text-[10px] font-black text-[#64748B] uppercase tracking-widest mb-4">Danh sách sản phẩm</h3>
                                <div className="space-y-3">
                                    {(targetPR.items || []).map((item: PRItem, idx: number) => (
                                        <div key={idx} className="flex justify-between items-start">
                                            <div className="flex flex-col">
                                                <span className="text-[11px] font-black text-[#94A3B8]">{item.productName || item.productDesc || item.description || "Sản phẩm " + (idx+1)}</span>
                                                <span className="text-[10px] text-[#64748B] font-bold">{item.qty} {item.unit}</span>
                                            </div>
                                            <span className="text-[11px] font-black text-[#64748B]">{(Number(item.estimatedPrice) || 0).toLocaleString()}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-amber-500/5 border border-amber-500/20 rounded-[32px] p-8 flex items-start gap-4">
                        <div className="h-10 w-10 bg-amber-500/10 text-amber-400 rounded-xl flex items-center justify-center shrink-0 border border-amber-500/20">
                            <Info size={20} />
                        </div>
                        <div>
                            <h4 className="text-sm font-black text-amber-400 uppercase tracking-tight mb-1">Mẹo chọn nhà cung cấp</h4>
                            <p className="text-amber-400/70 text-xs font-medium leading-relaxed">Chọn ít nhất 3 nhà cung cấp để tăng tính cạnh tranh và tối ưu hóa chi phí cho doanh nghiệp.</p>
                        </div>
                    </div>
                </div>

                {/* Right side: RFQ Formulation Form */}
                <div className="lg:col-span-2">
                    <form onSubmit={handleSubmit} className="bg-[#161922] rounded-[40px] border border-[rgba(148,163,184,0.1)] shadow-2xl p-10 space-y-10">
                        {/* Vendor Section */}
                        <div className="space-y-6">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="h-8 w-8 bg-[#3B82F6]/10 text-[#3B82F6] rounded-lg flex items-center justify-center border border-[#3B82F6]/20">
                                        <Building2 size={16} />
                                    </div>
                                    <h3 className="text-lg font-black text-[#F8FAFC] uppercase tracking-tight">Nhà cung cấp nhận báo giá</h3>
                                </div>
                                <span className="text-[10px] font-black text-[#64748B] uppercase tracking-widest">{selectedVendors.length} Nhà cung cấp hiện có</span>
                            </div>

                            <div className="relative">
                                <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-[#64748B]" size={20} />
                                <input 
                                    type="text" 
                                    placeholder="Tìm kiếm nhà cung cấp từ kho dữ liệu hoặc nhập tên mới..."
                                    className="w-full bg-[#0F1117] border border-[rgba(148,163,184,0.1)] rounded-2xl pl-14 pr-6 py-5 h-16 text-[#F8FAFC] placeholder:text-[#64748B] focus:ring-2 focus:ring-[#3B82F6] transition-all"
                                    value={vendorSearch}
                                    onChange={(e) => setVendorSearch(e.target.value)}
                                />
                                {vendorSearch && (
                                    <div className="absolute top-18 left-0 w-full bg-[#161922] border border-[rgba(148,163,184,0.1)] shadow-2xl rounded-2xl z-20 overflow-hidden animate-in fade-in slide-in-from-top-2">
                                        {filteredVendors.length > 0 ? (
                                            filteredVendors.map((v, i) => (
                                                <button 
                                                    key={i} 
                                                    type="button"
                                                    onClick={() => addVendor(v)}
                                                    className="w-full text-left p-4 hover:bg-[#1A1D23] flex items-center justify-between group"
                                                >
                                                    <div>
                                                        <div className="text-sm font-black text-[#F8FAFC]">{v.name}</div>
                                                        <div className="text-[10px] text-[#64748B] font-bold">{v.email}</div>
                                                    </div>
                                                    <Plus size={16} className="text-[#64748B] group-hover:text-[#3B82F6] transition-all" />
                                                </button>
                                            ))
                                        ) : (
                                            <button 
                                                type="button"
                                                onClick={() => addVendor({
                                                    id: 'new-' + Date.now(),
                                                    name: vendorSearch,
                                                    email: "",
                                                    code: 'NEW',
                                                    companyType: CompanyType.SUPPLIER,
                                                    countryCode: 'VN',
                                                    isActive: true,
                                                    kycStatus: KycStatus.PENDING,
                                                    trustScore: 0,
                                                    metadata: {},
                                                    createdAt: new Date().toISOString(),
                                                    updatedAt: new Date().toISOString()
                                                })}
                                                className="w-full text-left p-4 hover:bg-[#1A1D23] flex items-center gap-3"
                                            >
                                                <Plus size={16} className="text-[#3B82F6]" />
                                                <span className="text-sm font-bold text-[#F8FAFC]">Thêm &quot;<strong>{vendorSearch}</strong>&quot; như nhà cung cấp mới</span>
                                            </button>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* AI status — auto-triggered on page load */}
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2 text-[11px]">
                                    {isAiLoading ? (
                                        <span className="text-violet-400 flex items-center gap-1.5">
                                            <Loader2 size={13} className="animate-spin" />
                                            AI đang phân tích sản phẩm…
                                        </span>
                                    ) : aiSuggestions.length > 0 ? (
                                        <span className="text-emerald-400 flex items-center gap-1.5">
                                            <Sparkles size={13} />
                                            AI đã gợi ý {aiSuggestions.length} nhà cung cấp
                                        </span>
                                    ) : (
                                        <button
                                            type="button"
                                            onClick={fetchAiSuggestions}
                                            className="flex items-center gap-1.5 text-violet-400 hover:text-violet-300 transition-colors font-bold"
                                        >
                                            <Sparkles size={13} /> Chạy lại gợi ý AI
                                        </button>
                                    )}
                                </div>
                                <span className="text-[10px] text-[#64748B] font-medium italic">
                                    Dựa trên {targetPR?.items?.length || 0} sản phẩm trong PR
                                </span>
                            </div>

                            {/* AI Suggestions Display */}
                            {showAiSuggestions && (
                                <div className="bg-gradient-to-br from-violet-500/5 to-indigo-500/5 border border-violet-500/20 rounded-2xl p-6 animate-in fade-in slide-in-from-top-2">
                                    <div className="flex items-center gap-3 mb-5">
                                        <div className="h-10 w-10 bg-violet-500/10 rounded-xl flex items-center justify-center border border-violet-500/20">
                                            <Bot size={20} className="text-violet-400" />
                                        </div>
                                        <div>
                                            <h4 className="text-sm font-black text-[#F8FAFC] uppercase tracking-tight">
                                                RAG AI Gợi ý Nhà cung cấp
                                            </h4>
                                            <p className="text-[10px] text-[#64748B]">
                                                Powered by Vector Search & AI
                                            </p>
                                        </div>
                                    </div>

                                    {isAiLoading ? (
                                        <div className="flex flex-col items-center justify-center py-8 gap-3">
                                            <Loader2 size={32} className="animate-spin text-violet-400" />
                                            <p className="text-xs text-[#64748B] font-medium">
                                                RAG AI đang truy vấn dữ liệu và phân tích nhà cung cấp...
                                            </p>
                                        </div>
                                    ) : (
                                        <div className="space-y-4">
                                            {aiSuggestions.map((suggestion, idx) => (
                                                <div
                                                    key={suggestion.id}
                                                    className={"relative bg-[#0F1117] rounded-xl p-5 border transition-all " + (
                                                        addedAiVendors.has(suggestion.id)
                                                            ? "border-emerald-500/30 bg-emerald-500/5"
                                                            : "border-[rgba(148,163,184,0.1)] hover:border-violet-500/30"
                                                    )}
                                                >
                                                    {/* Rank Badge */}
                                                    <div className="absolute -top-3 -left-2 h-6 w-6 rounded-full bg-gradient-to-br from-violet-500 to-indigo-500 flex items-center justify-center text-white text-xs font-black shadow-lg">
                                                        #{idx + 1}
                                                    </div>

                                                    <div className="flex items-start justify-between gap-4">
                                                        <div className="flex-1">
                                                            <div className="flex items-center gap-3 mb-2">
                                                                <h5 className="text-sm font-black text-[#F8FAFC]">
                                                                    {suggestion.name}
                                                                </h5>
                                                                <div className="flex items-center gap-1 px-2 py-0.5 bg-violet-500/10 rounded-full">
                                                                    <Star size={10} className="text-violet-400" />
                                                                    <span className="text-[10px] font-black text-violet-400">
                                                                        {suggestion.matchScore}% Match
                                                                    </span>
                                                                </div>
                                                            </div>

                                                            {/* Reasons */}
                                                            <div className="flex flex-wrap gap-2 mb-3">
                                                                {suggestion.reasons.map((reason, rIdx) => (
                                                                    <span
                                                                        key={rIdx}
                                                                        className="text-[9px] px-2 py-1 bg-[#161922] text-[#94A3B8] rounded-lg border border-[rgba(148,163,184,0.1)]"
                                                                    >
                                                                        {reason}
                                                                    </span>
                                                                ))}
                                                            </div>

                                                            {/* Historical Data */}
                                                            {suggestion.historicalData && (
                                                                <div className="flex gap-4 text-[10px] text-[#64748B]">
                                                                    <span className="flex items-center gap-1">
                                                                        <TrendingUp size={10} className="text-emerald-400" />
                                                                        Giao hàng: {suggestion.historicalData.deliveryRate}%
                                                                    </span>
                                                                    <span className="flex items-center gap-1">
                                                                        <Star size={10} className="text-amber-400" />
                                                                        Chất lượng: {suggestion.historicalData.qualityScore}/5
                                                                    </span>
                                                                </div>
                                                            )}
                                                        </div>

                                                        {/* Add Button */}
                                                        <button
                                                            type="button"
                                                            onClick={() => addAiVendor(suggestion)}
                                                            disabled={addedAiVendors.has(suggestion.id)}
                                                            className={"shrink-0 px-3 py-1.5 rounded-lg font-black text-xs uppercase tracking-wider transition-all " + (
                                                                addedAiVendors.has(suggestion.id)
                                                                    ? "bg-emerald-500/10 text-emerald-400 cursor-default"
                                                                    : "bg-violet-500 hover:bg-violet-400 text-white shadow-lg shadow-violet-500/20"
                                                            )}
                                                        >
                                                            {addedAiVendors.has(suggestion.id) ? (
                                                                <span className="flex items-center gap-1">
                                                                    <Check size={14} />
                                                                    Đã thêm
                                                                </span>
                                                            ) : (
                                                                <span className="flex items-center gap-1">
                                                                    <Plus size={14} />
                                                                    Thêm
                                                                </span>
                                                            )}
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {selectedVendors.map((v, i) => (
                                    <div key={i} className="bg-[#0F1117] border border-[rgba(148,163,184,0.1)] p-4 rounded-2xl flex items-center justify-between group">
                                        <div className="flex items-center gap-4">
                                            <div className="h-10 w-10 bg-[#161922] rounded-xl shadow-sm flex items-center justify-center text-[#3B82F6] font-black text-[10px] border border-[rgba(148,163,184,0.1)]">
                                                {v.name.substring(0,2).toUpperCase()}
                                            </div>
                                            <div>
                                                <div className="text-xs font-black text-[#F8FAFC] truncate max-w-[150px]">{v.name}</div>
                                                <div className="text-[9px] text-[#64748B] font-bold">{v.email || "Email chưa được cấu hình"}</div>
                                            </div>
                                        </div>
                                        <button 
                                            type="button" 
                                            onClick={() => removeVendor(v.id)}
                                            className="h-8 w-8 rounded-lg text-[#64748B] hover:text-rose-400 hover:bg-rose-500/10 transition-all flex items-center justify-center"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Timing Section */}
                        <div className="space-y-6">
                            <div className="flex items-center gap-3">
                                <div className="h-8 w-8 bg-[#8B5CF6]/10 text-[#8B5CF6] rounded-lg flex items-center justify-center border border-[#8B5CF6]/20">
                                    <Calendar size={16} />
                                </div>
                                <h3 className="text-lg font-black text-[#F8FAFC] uppercase tracking-tight">Thời hạn & Tiến độ</h3>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase text-[#64748B] tracking-widest ml-1">Hạn cuối nộp báo giá</label>
                                    <div className="relative group/date">
                                        <input 
                                            type="text" 
                                            readOnly
                                            placeholder="Chọn ngày..."
                                            className="w-full bg-[#0F1117] border border-[rgba(148,163,184,0.1)] rounded-xl h-14 px-4 text-[#F8FAFC] font-bold group-focus-within/date:ring-2 group-focus-within/date:ring-[#3B82F6] transition-all placeholder:text-[#64748B]"
                                            value={deadline ? (() => {
                                                const [y, m, d] = deadline.split('-');
                                                return d + "-" + m + "-" + y;
                                            })() : ""}
                                        />
                                        <input 
                                            type="date" 
                                            required
                                            className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10"
                                            value={deadline}
                                            onChange={(e) => setDeadline(e.target.value)}
                                            onClick={(e) => (e.currentTarget as HTMLInputElement & { showPicker?: () => void }).showPicker?.()}
                                        />
                                        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-[#64748B]">
                                            <Calendar size={18} />
                                        </div>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase text-[#64748B] tracking-widest ml-1">Độ ưu tiên</label>
                                    <select className="w-full h-14 rounded-xl appearance-none bg-[#0F1117] border border-[rgba(148,163,184,0.1)] text-[#F8FAFC] font-bold px-4 focus:ring-2 focus:ring-[#3B82F6]">
                                        <option>BÌNH THƯỜNG</option>
                                        <option>CAO - CẦN GẤP</option>
                                        <option>KHẨN CẤP - CHIẾN LƯỢC</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        {/* Note Section */}
                        <div className="space-y-6">
                            <div className="flex items-center gap-3">
                                <div className="h-8 w-8 bg-amber-500/10 text-amber-400 rounded-lg flex items-center justify-center border border-amber-500/20">
                                    <FileText size={16} />
                                </div>
                                <h3 className="text-lg font-black text-[#F8FAFC] uppercase tracking-tight">Ghi chú & Yêu cầu kỹ thuật</h3>
                            </div>
                            <textarea 
                                placeholder="Ghi chú thêm cho nhà cung cấp về chất lượng, hình thức thanh toán, thời gian giao hàng mong muốn..."
                                className="w-full min-h-[150px] rounded-3xl bg-[#0F1117] border border-[rgba(148,163,184,0.1)] p-6 text-[#F8FAFC] placeholder:text-[#64748B] focus:ring-2 focus:ring-[#3B82F6] resize-none"
                                value={note}
                                onChange={(e) => setNote(e.target.value)}
                            ></textarea>
                        </div>

                        {/* Submit Actions */}
                        <div className="pt-10 border-t border-[rgba(148,163,184,0.1)] flex flex-col md:flex-row items-center justify-between gap-6">
                            <div className="flex items-center gap-3">
                                <div className="flex -space-x-3">
                                    {selectedVendors.slice(0,3).map((v, i) => (
                                        <div key={i} className="h-10 w-10 rounded-full border-4 border-[#161922] bg-[#0F1117] flex items-center justify-center text-[10px] font-black text-[#F8FAFC]">{v.name.substring(0,1)}</div>
                                    ))}
                                    {selectedVendors.length > 3 && (
                                        <div className="h-10 w-10 rounded-full border-4 border-[#161922] bg-[#3B82F6] text-white flex items-center justify-center text-[10px] font-black">+{selectedVendors.length - 3}</div>
                                    )}
                                </div>
                                <div className="text-xs text-[#64748B] font-medium">Báo giá sẽ được gửi qua Email & Hệ thống Portal.</div>
                            </div>
                            <button 
                                type="submit" 
                                disabled={isSubmitting || selectedVendors.length === 0}
                                className="bg-[#3B82F6] hover:bg-[#2563EB] text-white px-6 py-2.5 rounded-xl font-black text-xs uppercase tracking-widest shadow-lg shadow-[#3B82F6]/20 transition-all active:scale-95 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isSubmitting ? "Đang xử lý..." : "PHÁT HÀNH RFQ"}
                                <Send size={16} />
                            </button>
                        </div>
                    </form>
                </div>
            </div>
                </div>
            </div>
        </main>
    );
}
