"use client";

import { useState, useMemo, useEffect } from "react";
import { useProcurement, RFQ } from "../../context/ProcurementContext";
import { Quotation, QuotationItem, RfqStatus } from "@/app/types/api-types";
import { ERPTableColumn } from "../../components/shared/ERPTable";
import { formatVND } from "../../utils/formatUtils";
import ERPTable from "../../components/shared/ERPTable";
import { 
    Search, ListFilter, ArrowRight, ArrowLeft,
    FileText, CheckCircle, CheckCircle2, Award, Send, 
    ShieldAlert, AlertCircle, TrendingUp, 
    Star, Clock, DollarSign, Sparkles, Users, Calendar,
    Eye, X, RotateCcw, Building2, Mail, Phone, ShieldCheck,
    ThumbsUp, ThumbsDown, MessageSquare, Bot, Target
} from "lucide-react";

export default function QuotationManagementPage() {
    const { rfqs, currentUser, notify, awardQuotation, fetchQuotationsByRfq, analyzeQuotationWithAI, refreshData, updateRFQStatus, organizations } = useProcurement();
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedRFQ, setSelectedRFQ] = useState<RFQ | null>(null);
    const [quotations, setQuotations] = useState<Quotation[]>([]);
    const [loading, setLoading] = useState(false);
    const [analyzingRFQ, setAnalyzingRFQ] = useState<string | null>(null);
    const [awardModal, setAwardModal] = useState<Quotation | null>(null);
    const [viewQuotation, setViewQuotation] = useState<Quotation | null>(null);

    // Load quotations when RFQ is selected
    useEffect(() => {
        if (selectedRFQ) {
            loadQuotationsForRFQ(selectedRFQ.id);
        }
    }, [selectedRFQ]);

    const loadQuotationsForRFQ = async (rfqId: string) => {
        setLoading(true);
        try {
            const quotes = await fetchQuotationsByRfq(rfqId);
            console.log("📊 Quotations loaded:", quotes);
            if (quotes && Array.isArray(quotes)) {
                quotes.forEach((q, i) => {
                    console.log(`  [${i}] ID: ${q.id}, Status: ${q.status}, Supplier: ${q.supplier?.name || q.supplierId}`);
                });
                // Enrich supplier data from organizations
                const enrichedQuotes = quotes.map(q => {
                    const supplierOrg = organizations?.find((o: any) => o.id === q.supplierId);
                    return {
                        ...q,
                        supplier: supplierOrg || q.supplier || { id: q.supplierId, name: 'Nhà cung cấp #' + q.supplierId.substring(0, 6) }
                    };
                });
                setQuotations(enrichedQuotes as Quotation[]);
            }
        } catch (err) {
            console.error("Error loading quotations:", err);
        } finally {
            setLoading(false);
        }
    };

    const handleViewQuotation = async (quotation: Quotation) => {
        setViewQuotation(quotation);
        // Only analyze if no AI analysis yet
        if (!quotation.aiAnalysis && quotation.status === 'SUBMITTED') {
            try {
                const aiResult = await analyzeQuotationWithAI(quotation.id);
                if (aiResult) {
                    setViewQuotation(prev => prev ? {
                        ...prev,
                        aiAnalysis: aiResult as Quotation['aiAnalysis'],
                        aiScore: (aiResult as any).score ? ((aiResult as any).score * 10) : undefined
                    } : null);
                    // Also update in quotations list
                    setQuotations(prev => prev.map(q => 
                        q.id === quotation.id 
                            ? { ...q, aiAnalysis: aiResult as Quotation['aiAnalysis'], aiScore: (aiResult as any).score ? ((aiResult as any).score * 10) : undefined }
                            : q
                    ));
                }
            } catch (err) {
                console.error(`Error analyzing quote ${quotation.id}:`, err);
            }
        }
    };

    const formatDate = (ds?: string) => {
        if (!ds) return "N/A";
        const d = new Date(ds);
        if (isNaN(d.getTime())) return ds;
        return `${String(d.getDate()).padStart(2, '0')}-${String(d.getMonth() + 1).padStart(2, '0')}-${d.getFullYear()}`;
    };

    // Role check
    if (currentUser?.role !== "PROCUREMENT" && currentUser?.role !== "PLATFORM_ADMIN") {
        return <div className="p-20 text-center font-black text-slate-400">Bạn không có quyền truy cập trang quản lý báo giá.</div>;
    }

    // Filter RFQs
    const filteredRFQs = useMemo(() => {
        return rfqs.filter((rfq: RFQ) => {
            const search = searchTerm.toLowerCase();
            return (
                (rfq.rfqNumber || "").toLowerCase().includes(search) ||
                (rfq.title || "").toLowerCase().includes(search) ||
                (rfq.description || "").toLowerCase().includes(search)
            );
        });
    }, [rfqs, searchTerm]);

    const handleAward = async (quotation: Quotation) => {
        try {
            const success = await awardQuotation(quotation.rfqId, quotation.id);
            if (success) {
                notify(`Đã trao thầu cho nhà cung cấp ${quotation.supplier?.name || quotation.supplierId}!`, "success");
                setAwardModal(null);
                refreshData();
                // Refresh quotations
                if (selectedRFQ) {
                    loadQuotationsForRFQ(selectedRFQ.id);
                }
            } else {
                notify("Có lỗi khi trao thầu. Vui lòng thử lại.", "error");
            }
        } catch (err) {
            console.error("Lỗi khi trao thầu:", err);
            notify("Có lỗi khi trao thầu.", "error");
        }
    };

    // RFQ List Columns
    const rfqColumns: ERPTableColumn<RFQ>[] = [
        {
            label: "Mã RFQ",
            key: "rfqNumber",
            render: (row: RFQ) => (
                <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-[#3B82F6]/10 flex items-center justify-center text-[#3B82F6] border border-[#3B82F6]/20">
                        <FileText size={20} />
                    </div>
                    <div className="flex flex-col">
                        <span className="font-black text-[#F8FAFC] tracking-tight">{row.rfqNumber || row.id.substring(0, 8)}</span>
                        <span className="text-[9px] text-[#64748B] font-bold uppercase">{formatDate(row.createdAt)}</span>
                    </div>
                </div>
            )
        },
        {
            label: "Tiêu đề",
            key: "title",
            render: (row: RFQ) => (
                <div className="flex flex-col max-w-xs">
                    <span className="font-black text-[#94A3B8] truncate">{row.title || "Không có tiêu đề"}</span>
                    <span className="text-[10px] text-[#64748B] truncate">{row.description?.substring(0, 50) || ""}...</span>
                </div>
            )
        },
        {
            label: "Hạn chót",
            key: "deadline",
            render: (row: RFQ) => (
                <div className="flex items-center gap-2">
                    <Calendar size={14} className="text-rose-400" />
                    <span className="text-xs font-black text-rose-400">{formatDate(row.deadline)}</span>
                </div>
            )
        },
        {
            label: "Số báo giá",
            render: (row: RFQ) => (
                <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-lg bg-[#3B82F6]/10 flex items-center justify-center">
                            <Users size={16} className="text-[#3B82F6]" />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-sm font-black text-[#3B82F6]">
                                {row.suppliers?.length || 0} nhà cung cấp
                            </span>
                            <span className="text-[9px] text-[#64748B]">Đã mời tham gia</span>
                        </div>
                    </div>
                </div>
            )
        },
        {
            label: "Trạng thái",
            key: "status",
            render: (row: RFQ) => <RFQStatusPill status={row.status} />
        },
        {
            label: "Thao tác",
            render: (row: RFQ) => (
                <div className="flex items-center gap-2">
                    <button 
                        onClick={() => setSelectedRFQ(row)}
                        className="inline-flex items-center gap-2 bg-[#3B82F6] text-white px-4 py-2 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-[#2563EB] transition-all shadow-lg shadow-[#3B82F6]/20 active:scale-95"
                    >
                        <Eye size={14} /> Xem báo giá
                    </button>
                    {row.status === 'PUBLISHED' && (
                        <button 
                            onClick={async () => {
                                if (confirm('Bạn có chắc muốn đóng RFQ này?')) {
                                    await updateRFQStatus(row.id, RfqStatus.CLOSED);
                                    notify('Đã đóng RFQ', 'success');
                                    refreshData();
                                }
                            }}
                            className="inline-flex items-center gap-2 bg-amber-500/10 text-amber-400 px-3 py-2 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-amber-500/20 transition-all border border-amber-500/20"
                            title="Đóng RFQ"
                        >
                            <X size={14} />
                        </button>
                    )}
                </div>
            )
        }
    ];

    // Quotation Columns for selected RFQ
    const quotationColumns: ERPTableColumn<Quotation>[] = [
        {
            label: "Nhà cung cấp",
            key: "supplier",
            render: (row: Quotation) => (
                <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400 border border-emerald-500/20">
                        <Building2 size={22} />
                    </div>
                    <div className="flex flex-col">
                        <span className="font-black text-[#F8FAFC] text-sm">{row.supplier?.name || "Chưa có tên"}</span>
                        <div className="flex items-center gap-2 text-[10px] text-[#64748B]">
                            <span className="bg-[#0F1117] px-2 py-0.5 rounded border border-[rgba(148,163,184,0.1)]">{row.supplierId.substring(0, 8)}</span>
                            {row.supplier?.email && (
                                <span className="flex items-center gap-1">
                                    <Mail size={10} /> {row.supplier.email}
                                </span>
                            )}
                        </div>
                    </div>
                </div>
            )
        },
        {
            label: "Giá báo",
            key: "totalPrice",
            render: (row: Quotation) => (
                <div className="text-right">
                    <div className=" font-black text-emerald-400 text-sm">{formatVND(row.totalPrice)} ₫</div>
                    <div className="text-[9px] text-[#64748B] font-black uppercase">Total</div>
                </div>
            )
        },
        {
            label: "Lead Time",
            key: "leadTimeDays",
            render: (row: Quotation) => (
                <div className="flex items-center gap-1">
                    <Clock size={14} className="text-[#64748B]" />
                    <span className="text-xs font-bold text-[#94A3B8]">{row.leadTimeDays} ngày</span>
                </div>
            )
        },
        {
            label: "AI Score",
            key: "aiScore",
            render: (row: Quotation) => (
                <div className="flex items-center gap-2">
                    {row.aiScore ? (
                        <>
                            <Sparkles size={14} className={row.aiScore >= 80 ? "text-amber-400" : "text-violet-400"} />
                            <div className="flex flex-col">
                                <span className={`text-xs font-black ${row.aiScore >= 80 ? "text-amber-400" : "text-violet-400"}`}>
                                    {row.aiScore}/100
                                </span>
                                <div className="w-16 bg-[#1A1D23] rounded-full h-1">
                                    <div 
                                        className={`h-1 rounded-full ${row.aiScore >= 80 ? "bg-amber-500" : "bg-violet-500"}`}
                                        style={{ width: `${row.aiScore}%` }}
                                    />
                                </div>
                            </div>
                        </>
                    ) : analyzingRFQ === selectedRFQ?.id ? (
                        <span className="text-[10px] text-violet-400 font-bold animate-pulse">Đang phân tích...</span>
                    ) : (
                        <span className="text-[10px] text-[#64748B] font-bold">Chưa đánh giá</span>
                    )}
                </div>
            )
        },
        {
            label: "Điều kiện",
            render: (row: Quotation) => (
                <div className="flex flex-col text-[10px]">
                    <span className="text-text-secondary">TT: {row.paymentTerms || "không có"}</span>
                    <span className="text-text-secondary">GH: {row.deliveryTerms || "không có"}</span>
                </div>
            )
        },
        {   
            label: "Thao tác",
            render: (row: Quotation) => (
                <div className="flex items-center justify-end gap-2">
                    <button 
                        onClick={() => handleViewQuotation(row)}
                        className="inline-flex items-center gap-2 bg-[#1A1D23] text-[#64748B] px-3 py-2 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-[#0F1117] transition-all border border-[rgba(148,163,184,0.1)]"
                        title="Xem chi tiết"
                    >
                        <Eye size={14} />
                    </button>
                    {row.status === 'SUBMITTED' && (
                        <button 
                            onClick={() => setAwardModal(row)}
                            className="inline-flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-500/20 active:scale-95"
                        >
                            <Award size={14} /> Trao thầu
                        </button>
                    )}
                    {row.status === 'ACCEPTED' && (
                        <span className="inline-flex items-center gap-2 bg-emerald-500/10 text-emerald-400 px-3 py-2 rounded-xl font-black text-[10px] uppercase tracking-widest border border-emerald-500/20">
                            <CheckCircle size={14} /> Đã trao
                        </span>
                    )}
                    {row.status === 'REJECTED' && (
                        <span className="inline-flex items-center gap-2 bg-rose-500/10 text-rose-400 px-3 py-2 rounded-xl font-black text-[10px] uppercase tracking-widest border border-rose-500/20">
                            <AlertCircle size={14} /> Từ chối
                        </span>
                    )}
                </div>
            )
        }
    ];

    // Stats for selected RFQ
    const rfqStats = useMemo(() => {
        if (!quotations.length) return [];
        const sortedByScore = [...quotations].sort((a, b) => (b.aiScore || 0) - (a.aiScore || 0));
        const bestQuote = sortedByScore[0];
        return [
            { label: "Tổng báo giá", value: quotations.length, icon: Users, color: "text-slate-500", bg: "bg-slate-50" },
            { label: "Chưa trao thầu", value: quotations.filter((q: Quotation) => q.status === 'SUBMITTED').length, icon: Send, color: "text-blue-500", bg: "bg-blue-50" },
            { label: "Đã trao thầu", value: quotations.filter((q: Quotation) => q.status === 'ACCEPTED').length, icon: Award, color: "text-emerald-500", bg: "bg-emerald-50" },
            { label: bestQuote?.aiScore ? "Đề xuất AI" : "Giá thấp nhất", value: formatVND(Math.min(...quotations.map(q => q.totalPrice))), icon: Sparkles, color: "text-purple-500", bg: "bg-purple-50" },
        ];
    }, [quotations]);

    return (
        <main className="animate-in fade-in duration-500 p-6 min-h-screen bg-[#0F1117] text-[#F8FAFC]">
            {/* Header */}
            <div className="mt-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
                <div>
                    <h1 className="text-4xl font-black text-[#F8FAFC] tracking-tighter uppercase mb-2">
                        {selectedRFQ ? `BÁO GIÁ CHO RFQ` : "QUẢN LÝ BÁO GIÁ"}
                    </h1>
                    <p className="text-[#64748B] font-bold text-sm tracking-tight flex items-center gap-2 uppercase">
                        <ShieldAlert size={14} className="text-[#3B82F6]" /> 
                        {selectedRFQ ? selectedRFQ.title || "Xem xét và trao thầu" : "Chọn RFQ để xem báo giá"}
                    </p>
                </div>
                <div className="flex gap-4 w-full md:w-auto">
                    {selectedRFQ ? (
                        <button 
                            onClick={() => setSelectedRFQ(null)}
                            className="inline-flex items-center gap-2 bg-[#161922] border border-[rgba(148,163,184,0.1)] text-[#94A3B8] px-6 py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-[#1A1D23] transition-all shadow-sm"
                        >
                            <ArrowLeft size={16} /> Quay lại danh sách RFQ
                        </button>
                    ) : (
                        <div className="relative grow md:w-80">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#64748B]" size={18} />
                            <input 
                                type="text"
                                placeholder="Tìm kiếm RFQ..."
                                className="w-full pl-12 pr-6 py-5 h-14 bg-[#161922] border border-[rgba(148,163,184,0.1)] rounded-2xl text-[#F8FAFC] placeholder:text-[#64748B] focus:ring-2 focus:ring-[#3B82F6] transition-all"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    )}
                    <button className="h-14 w-14 bg-[#161922] border border-[rgba(148,163,184,0.1)] rounded-2xl flex items-center justify-center text-[#64748B] shadow-xl shadow-[#3B82F6]/5 hover:bg-[#1A1D23] transition-all shrink-0">
                        <ListFilter size={20} />
                    </button>
                </div>
            </div>

            {/* Stats - Only show when viewing quotations */}
            {selectedRFQ && rfqStats.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
                    {rfqStats.map((stat) => (
                        <div key={stat.label} className="bg-[#161922] p-6 rounded-[40px] border border-[rgba(148,163,184,0.1)] shadow-2xl shadow-[#3B82F6]/5 flex items-center gap-4 group hover:border-[#3B82F6]/20 transition-all">
                            <div className={`w-14 h-14 rounded-2xl ${stat.bg} ${stat.color} flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform`}>
                                <stat.icon size={24} />
                            </div>
                            <div>
                                <div className="text-[10px] uppercase font-black tracking-widest text-[#64748B] mb-1">{stat.label}</div>
                                <div className="text-2xl font-black text-[#F8FAFC]">{stat.value}</div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Analyzing Indicator */}
            {analyzingRFQ && (
                <div className="bg-[#3B82F6]/10 border border-[#3B82F6]/20 rounded-2xl p-4 mb-6 flex items-center gap-3">
                    <Sparkles size={20} className="text-[#3B82F6] animate-pulse" />
                    <span className="text-sm font-bold text-[#F8FAFC]">AI đang phân tích các báo giá...</span>
                </div>
            )}

            {/* Award Modal */}
            {awardModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0F1117]/80 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-[#161922] rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 border border-[rgba(148,163,184,0.1)]">
                        <div className="bg-emerald-600 px-8 py-6 text-white flex justify-between items-center">
                            <div>
                                <h3 className="text-xl font-black uppercase tracking-tight">Trao thầu</h3>
                                <p className="text-emerald-100 text-xs font-bold uppercase mt-1 tracking-widest">Xác nhận chọn nhà cung cấp</p>
                            </div>
                            <button onClick={() => setAwardModal(null)} className="h-8 w-8 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/30 transition-all font-black text-white">×</button>
                        </div>
                        <div className="p-8 space-y-6">
                            <div className="bg-[#0F1117] rounded-2xl p-6 border border-[rgba(148,163,184,0.1)]">
                                <div className="flex items-center gap-4 mb-4">
                                    <div className="h-12 w-12 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400">
                                        <Award size={24} />
                                    </div>
                                    <div>
                                        <div className="font-black text-[#F8FAFC]">{awardModal.supplier?.name || awardModal.supplierId}</div>
                                        <div className="text-[10px] text-[#64748B] font-bold uppercase">Nhà cung cấp được chọn</div>
                                    </div>
                                </div>
                                
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div>
                                        <span className="text-[10px] font-black uppercase text-[#64748B]">Giá báo:</span>
                                        <div className=" font-black text-emerald-400">{formatVND(awardModal.totalPrice)} ₫</div>
                                    </div>
                                    <div>
                                        <span className="text-[10px] font-black uppercase text-[#64748B]">Lead time:</span>
                                        <div className="font-black text-[#F8FAFC]">{awardModal.leadTimeDays} ngày</div>
                                    </div>
                                    {awardModal.aiScore && (
                                        <div>
                                            <span className="text-[10px] font-black uppercase text-[#64748B]">AI Score:</span>
                                            <div className="font-black text-violet-400">{awardModal.aiScore}/100</div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="text-sm text-[#64748B]">
                                <p className="mb-2">Bạn có chắc chắn muốn trao thầu cho nhà cung cấp này?</p>
                                <p className="text-[10px] text-[#94A3B8]">Sau khi trao thầu, các báo giá khác cho RFQ này sẽ bị đóng.</p>
                            </div>

                            <div className="flex gap-4 pt-4">
                                <button onClick={() => setAwardModal(null)} className="flex-1 px-6 py-4 rounded-2xl bg-[#1A1D23] text-[#64748B] font-black text-xs uppercase tracking-widest hover:bg-[#0F1117] transition-all border border-[rgba(148,163,184,0.1)]">Hủy bỏ</button>
                                <button 
                                    onClick={() => handleAward(awardModal)}
                                    className="flex-1 px-6 py-4 rounded-2xl bg-emerald-600 text-white font-black text-xs uppercase tracking-widest hover:bg-emerald-700 transition-all shadow-xl shadow-emerald-500/20 active:scale-95"
                                >
                                    Xác nhận trao thầu
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* View Quotation Detail Modal - Redesigned */}
            {viewQuotation && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0F1117]/90 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-[#0F1117] rounded-3xl w-full max-w-4xl shadow-2xl shadow-black/50 max-h-[90vh] flex flex-col animate-in zoom-in-95 duration-300 border border-[rgba(148,163,184,0.2)] overflow-hidden">
                        
                        {/* Header */}
                        <div className="bg-gradient-to-r from-[#1A1D23] to-[#161922] px-8 py-5 flex justify-between items-center border-b border-[rgba(148,163,184,0.1)] shrink-0">
                            <div className="flex items-center gap-4">
                                <div className="h-12 w-12 rounded-2xl bg-[#3B82F6]/10 flex items-center justify-center border border-[#3B82F6]/20">
                                    <Building2 size={24} className="text-[#3B82F6]" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-black text-[#F8FAFC] tracking-tight">{viewQuotation.supplier?.name || "Nhà cung cấp"}</h3>
                                    <p className="text-xs text-[#64748B] mt-0.5">{formatVND(viewQuotation.totalPrice)} ₫ • {viewQuotation.leadTimeDays} ngày</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <StatusPill status={viewQuotation.status} />
                                <button onClick={() => setViewQuotation(null)} className="h-10 w-10 rounded-xl bg-[#1A1D23] border border-[rgba(148,163,184,0.2)] flex items-center justify-center hover:bg-[#161922] transition-all">
                                    <X size={18} className="text-[#64748B]" />
                                </button>
                            </div>
                        </div>

                        <div className="flex flex-1 overflow-hidden">
                            {/* Left Panel - AI Analysis */}
                            <div className="flex-1 p-6 overflow-y-auto">
                                {viewQuotation.aiAnalysis ? (
                                    <>
                                        {/* AI Score Card */}
                                        <div className="mb-6 rounded-2xl overflow-hidden border border-[rgba(148,163,184,0.15)]">
                                            <div className={`px-6 py-4 ${
                                                viewQuotation.aiAnalysis.recommendation === 'ACCEPT' ? 'bg-emerald-500/10' :
                                                viewQuotation.aiAnalysis.recommendation === 'REJECT' ? 'bg-rose-500/10' :
                                                'bg-amber-500/10'
                                            }`}>
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-3">
                                                        <div className={`h-14 w-14 rounded-xl flex items-center justify-center border ${
                                                            viewQuotation.aiAnalysis.recommendation === 'ACCEPT' ? 'bg-emerald-500/20 border-emerald-500/30 text-emerald-400' :
                                                            viewQuotation.aiAnalysis.recommendation === 'REJECT' ? 'bg-rose-500/20 border-rose-500/30 text-rose-400' :
                                                            'bg-amber-500/20 border-amber-500/30 text-amber-400'
                                                        }`}>
                                                            <Bot size={28} />
                                                        </div>
                                                        <div>
                                                            <div className="flex items-center gap-2">
                                                                <span className="text-xs font-black text-[#64748B] uppercase tracking-wider">Phân tích AI</span>
                                                                <Sparkles size={12} className="text-violet-400" />
                                                            </div>
                                                            <div className={`text-2xl font-black ${
                                                                viewQuotation.aiAnalysis.score >= 7 ? 'text-emerald-400' :
                                                                viewQuotation.aiAnalysis.score >= 5 ? 'text-amber-400' :
                                                                'text-rose-400'
                                                            }`}>
                                                                {viewQuotation.aiAnalysis.score}<span className="text-base text-[#64748B]">/10</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className={`px-4 py-2 rounded-xl font-black text-sm border ${
                                                        viewQuotation.aiAnalysis.recommendation === 'ACCEPT' 
                                                            ? 'bg-emerald-500 text-white border-emerald-500' :
                                                        viewQuotation.aiAnalysis.recommendation === 'REJECT'
                                                            ? 'bg-rose-500 text-white border-rose-500' :
                                                            'bg-amber-500 text-black border-amber-500'
                                                    }`}>
                                                        {viewQuotation.aiAnalysis.recommendation === 'ACCEPT' && 'CHẤP NHẬN'}
                                                        {viewQuotation.aiAnalysis.recommendation === 'REJECT' && 'TỪ CHỐI'}
                                                        {viewQuotation.aiAnalysis.recommendation === 'NEGOTIATE' && 'ĐÀM PHÁN'}
                                                        {!['ACCEPT', 'REJECT', 'NEGOTIATE'].includes(viewQuotation.aiAnalysis.recommendation) && viewQuotation.aiAnalysis.recommendation}
                                                    </div>
                                                </div>
                                            </div>
                                            
                                            {/* Assessment */}
                                            <div className="p-5 bg-[#161922]">
                                                <div className="flex items-start gap-3">
                                                    <div className="h-8 w-8 rounded-lg bg-[#3B82F6]/10 flex items-center justify-center shrink-0">
                                                        <MessageSquare size={16} className="text-[#3B82F6]" />
                                                    </div>
                                                    <div>
                                                        <div className="text-[10px] font-black uppercase text-[#64748B] tracking-wider mb-1">Đánh giá tổng quan</div>
                                                        <p className="text-sm text-[#94A3B8] leading-relaxed">{viewQuotation.aiAnalysis.assessment}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Pros & Cons */}
                                        <div className="grid grid-cols-2 gap-4">
                                            {/* Pros */}
                                            {viewQuotation.aiAnalysis.pros?.length > 0 && (
                                                <div className="rounded-2xl p-5 bg-emerald-500/5 border border-emerald-500/20">
                                                    <div className="flex items-center gap-2 mb-4">
                                                        <div className="h-8 w-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                                                            <ThumbsUp size={16} className="text-emerald-400" />
                                                        </div>
                                                        <div className="text-xs font-black uppercase text-emerald-400 tracking-wider">Ưu điểm</div>
                                                    </div>
                                                    <ul className="space-y-3">
                                                        {viewQuotation.aiAnalysis.pros.map((pro, idx) => (
                                                            <li key={idx} className="flex items-start gap-2 text-sm text-[#94A3B8]">
                                                                <CheckCircle2 size={16} className="text-emerald-400 shrink-0 mt-0.5" />
                                                                <span className="leading-relaxed">{pro}</span>
                                                            </li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            )}
                                            
                                            {/* Cons */}
                                            {viewQuotation.aiAnalysis.cons?.length > 0 && (
                                                <div className="rounded-2xl p-5 bg-rose-500/5 border border-rose-500/20">
                                                    <div className="flex items-center gap-2 mb-4">
                                                        <div className="h-8 w-8 rounded-lg bg-rose-500/10 flex items-center justify-center">
                                                            <ThumbsDown size={16} className="text-rose-400" />
                                                        </div>
                                                        <div className="text-xs font-black uppercase text-rose-400 tracking-wider">Nhược điểm</div>
                                                    </div>
                                                    <ul className="space-y-3">
                                                        {viewQuotation.aiAnalysis.cons.map((con, idx) => (
                                                            <li key={idx} className="flex items-start gap-2 text-sm text-[#94A3B8]">
                                                                <AlertCircle size={16} className="text-rose-400 shrink-0 mt-0.5" />
                                                                <span className="leading-relaxed">{con}</span>
                                                            </li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            )}
                                        </div>
                                    </>
                                ) : (
                                    /* No AI Analysis */
                                    <div className="h-full flex flex-col items-center justify-center text-center p-8">
                                        <div className="h-20 w-20 rounded-3xl bg-[#3B82F6]/10 flex items-center justify-center mb-4">
                                            <Sparkles size={36} className="text-[#3B82F6]" />
                                        </div>
                                        <h4 className="text-lg font-black text-[#F8FAFC] mb-2">Chưa có phân tích AI</h4>
                                        <p className="text-sm text-[#64748B] max-w-xs">Hệ thống sẽ tự động phân tích báo giá này trong giây lát...</p>
                                    </div>
                                )}
                            </div>

                            {/* Right Panel - Quotation Details */}
                            <div className="w-80 bg-[#161922] border-l border-[rgba(148,163,184,0.1)] p-6 overflow-y-auto">
                                <div className="text-xs font-black uppercase text-[#64748B] tracking-wider mb-4">Chi tiết báo giá</div>
                                
                                <div className="space-y-4">
                                    <div className="p-4 rounded-xl bg-[#0F1117] border border-[rgba(148,163,184,0.1)]">
                                        <div className="text-[10px] text-[#64748B] uppercase mb-1">Tổng giá trị</div>
                                        <div className="text-xl font-black text-emerald-400">{formatVND(viewQuotation.totalPrice)} ₫</div>
                                    </div>
                                    
                                    <div className="p-4 rounded-xl bg-[#0F1117] border border-[rgba(148,163,184,0.1)]">
                                        <div className="text-[10px] text-[#64748B] uppercase mb-1">Lead Time</div>
                                        <div className="text-xl font-black text-[#3B82F6]">{viewQuotation.leadTimeDays} <span className="text-sm text-[#64748B]">ngày</span></div>
                                    </div>
                                    
                                    {/* <div className="p-4 rounded-xl bg-[#0F1117] border border-[rgba(148,163,184,0.1)]">
                                        <div className="text-[10px] text-[#64748B] uppercase mb-1">Thanh toán</div>
                                        <div className="text-sm font-bold text-[#F8FAFC]">{viewQuotation.paymentTerms || "N/A"}</div>
                                    </div>
                                    
                                    <div className="p-4 rounded-xl bg-[#0F1117] border border-[rgba(148,163,184,0.1)]">
                                        <div className="text-[10px] text-[#64748B] uppercase mb-1">Giao hàng</div>
                                        <div className="text-sm font-bold text-[#F8FAFC]">{viewQuotation.deliveryTerms || "N/A"}</div>
                                    </div> */}
                                    
                                    {viewQuotation.validityDays && (
                                        <div className="p-4 rounded-xl bg-[#0F1117] border border-[rgba(148,163,184,0.1)]">
                                            <div className="text-[10px] text-[#64748B] uppercase mb-1">Hiệu lực</div>
                                            <div className="text-sm font-bold text-[#F8FAFC]">{viewQuotation.validityDays} ngày</div>
                                        </div>
                                    )}
                                </div>

                                {viewQuotation.notes && (
                                    <div className="mt-6 p-4 rounded-xl bg-amber-500/10 border border-amber-500/20">
                                        <div className="text-[10px] font-black uppercase text-amber-400 mb-2">Ghi chú từ NCC</div>
                                        <p className="text-sm text-amber-400">{viewQuotation.notes}</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Footer Actions */}
                        <div className="px-6 py-4 bg-[#161922] border-t border-[rgba(148,163,184,0.1)] flex justify-between items-center shrink-0">
                            <button 
                                onClick={() => setViewQuotation(null)} 
                                className="px-6 py-3 rounded-xl bg-[#0F1117] text-[#64748B] font-black text-xs uppercase tracking-wider hover:text-[#F8FAFC] transition-all border border-[rgba(148,163,184,0.2)]"
                            >
                                Đóng
                            </button>
                            {viewQuotation.status === 'SUBMITTED' && (
                                <button 
                                    onClick={() => {
                                        setViewQuotation(null);
                                        setAwardModal(viewQuotation);
                                    }}
                                    className="px-6 py-3 rounded-xl bg-emerald-600 text-white font-black text-xs uppercase tracking-wider hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-500/20 flex items-center gap-2"
                                >
                                    <Award size={16} /> Trao thầu
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Table */}
            <div className="bg-[#161922] rounded-[40px] border border-[rgba(148,163,184,0.1)] shadow-2xl shadow-[#3B82F6]/5 overflow-hidden">
                {selectedRFQ ? (
                    // Show quotations for selected RFQ
                    loading ? (
                        <div className="py-32 text-center">
                            <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-[#1A1D23] text-[#64748B] mb-6 animate-pulse">
                                <TrendingUp size={40} />
                            </div>
                            <h3 className="text-xl font-black text-[#F8FAFC] mb-2 uppercase tracking-tight">Đang tải báo giá...</h3>
                        </div>
                    ) : (
                        <>
                            <ERPTable columns={quotationColumns} data={quotations} />
                            {quotations.length === 0 && (
                                <div className="py-32 text-center">
                                    <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-[#1A1D23] text-[#64748B] mb-6">
                                        <AlertCircle size={40} />
                                    </div>
                                    <h3 className="text-xl font-black text-[#F8FAFC] mb-2 uppercase tracking-tight">Chưa có báo giá nào</h3>
                                    <p className="text-[#64748B] font-medium">RFQ này chưa nhận được báo giá từ nhà cung cấp.</p>
                                </div>
                            )}
                        </>
                    )
                ) : (
                    // Show RFQ list
                    <ERPTable columns={rfqColumns} data={filteredRFQs} />
                )}
            </div>

        </main>
    );
}

function RFQStatusPill({ status }: { status: string }) {
    const config: Record<string, { bg: string, text: string }> = {
        'DRAFT': { bg: 'bg-[#1A1D23]', text: 'text-[#64748B]' },
        'PUBLISHED': { bg: 'bg-[#3B82F6]/10', text: 'text-[#3B82F6]' },
        'CLOSED': { bg: 'bg-amber-500/10', text: 'text-amber-400' },
        'AWARDED': { bg: 'bg-emerald-500/10', text: 'text-emerald-400' },
        'CANCELLED': { bg: 'bg-rose-500/10', text: 'text-rose-400' },
    };

    const style = config[status] || config['DRAFT'];
    const label: Record<string, string> = {
        'DRAFT': 'NHÁP',
        'PUBLISHED': 'ĐANG MỞ',
        'CLOSED': 'ĐÃ ĐÓNG',
        'AWARDED': 'ĐÃ TRAO THẦU',
        'CANCELLED': 'ĐÃ HỦY',
    };
    
    return (
        <span className={`px-3 py-1.5 rounded-lg font-black text-[9px] uppercase tracking-widest ${style.bg} ${style.text} border border-[rgba(148,163,184,0.1)]`}>
            {label[status] || status}
        </span>
    );
}

function StatusPill({ status }: { status: string }) {
    const config: Record<string, { bg: string, text: string }> = {
        'DRAFT': { bg: 'bg-[#1A1D23]', text: 'text-[#64748B]' },
        'SUBMITTED': { bg: 'bg-[#3B82F6]/10', text: 'text-[#3B82F6]' },
        'UNDER_REVIEW': { bg: 'bg-amber-500/10', text: 'text-amber-400' },
        'ACCEPTED': { bg: 'bg-emerald-500/10', text: 'text-emerald-400' },
        'REJECTED': { bg: 'bg-rose-500/10', text: 'text-rose-400' },
        'EXPIRED': { bg: 'bg-[#1A1D23]', text: 'text-[#64748B]' },
    };

    const style = config[status] || config['DRAFT'];
    const label: Record<string, string> = {
        'DRAFT': 'NHÁP',
        'SUBMITTED': 'ĐÃ GỬI',
        'UNDER_REVIEW': 'ĐANG XEM XÉT',
        'ACCEPTED': 'ĐÃ CHẤP NHẬN',
        'REJECTED': 'BỊ TỪ CHỐI',
        'EXPIRED': 'HẾT HẠN',
    };
    
    return (
        <span className={`px-3 py-1.5 rounded-lg font-black text-[9px] uppercase tracking-widest ${style.bg} ${style.text} border border-[rgba(148,163,184,0.1)]`}>
            {label[status] || status}
        </span>
    );
}
