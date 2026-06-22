"use client";

import { useState, useMemo, useEffect } from "react";
import { useProcurement, RFQ } from "../../context/ProcurementContext";
import { Quotation, QuotationItem, RfqStatus, Organization } from "@/app/types/api-types";
import { ERPTableColumn } from "../../components/shared/ERPTable";
import { formatVND } from "../../utils/formatUtils";
import ERPTable from "../../components/shared/ERPTable";
import StatusBadge from "../../components/shared/StatusBadge";
import { StatCard, StatGrid } from "../../components/shared/StatCard";
import {
    Search, ListFilter, ArrowRight, ArrowLeft,
    FileText, CheckCircle, CheckCircle2, Award, Send,
    ShieldAlert, AlertCircle, TrendingUp,
    Star, Clock, DollarSign, Sparkles, Users, Calendar,
    Eye, X, RotateCcw, Building2, Mail, Phone, ShieldCheck,
    ThumbsUp, ThumbsDown, MessageSquare, Bot, Target
} from "lucide-react";
import ConfirmDialog from "../../components/shared/ConfirmDialog";

export default function QuotationManagementPage() {
    const { rfqs, currentUser, notify, awardQuotation, fetchQuotationsByRfq, analyzeQuotationWithAI, refreshData, updateRFQStatus, organizations, createCounterOffer, fetchCounterOffersByQuotation, fetchQAThreadsBySupplier, createQAThread } = useProcurement();
    const [searchTerm, setSearchTerm] = useState("");
    const [confirmState, setConfirmState] = useState<{ open: boolean; title: string; message: string; onConfirm: () => void }>({ open: false, title: "", message: "", onConfirm: () => {} });
    const [selectedRFQ, setSelectedRFQ] = useState<RFQ | null>(null);
    const [quotations, setQuotations] = useState<Quotation[]>([]);
    const [loading, setLoading] = useState(false);
    const [analyzingRFQ, setAnalyzingRFQ] = useState<string | null>(null);
    const [awardModal, setAwardModal] = useState<Quotation | null>(null);
    const [viewQuotation, setViewQuotation] = useState<Quotation | null>(null);
    const [activeModalTab, setActiveModalTab] = useState<'AI' | 'QA' | 'NEGOTIATION'>('AI');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [counterOffersList, setCounterOffersList] = useState<any[]>([]);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [qaThreadsList, setQaThreadsList] = useState<any[]>([]);
    const [newMsg, setNewMsg] = useState('');
    const [newPrice, setNewPrice] = useState('');
    const [counterOfferNote, setCounterOfferNote] = useState('');

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
            if (quotes && Array.isArray(quotes)) {
                // Enrich supplier data from organizations
                const enrichedQuotes = quotes.map(q => {
                    const supplierOrg = organizations?.find((o: Organization) => o.id === q.supplierId);
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
        setActiveModalTab('AI');
        try {
            const cos = await fetchCounterOffersByQuotation(quotation.id);
            setCounterOffersList(cos || []);
            const qas = await fetchQAThreadsBySupplier(quotation.rfqId, quotation.supplierId);
            setQaThreadsList(qas || []);
        } catch (e) { }

        // Auto analyze if no AI analysis yet (for any status)
        if (!quotation.aiAnalysis) {
            try {
                const aiResult = await analyzeQuotationWithAI(quotation.id);
                if (aiResult) {
                    const aiData = aiResult as { score?: number; assessment?: string; pros?: string[]; cons?: string[]; recommendation?: string };
                    setViewQuotation(prev => prev ? {
                        ...prev,
                        aiAnalysis: aiData as Quotation['aiAnalysis'],
                        aiScore: aiData.score ? aiData.score * 10 : undefined
                    } : null);
                    // Also update in quotations list
                    setQuotations(prev => prev.map(q =>
                        q.id === quotation.id
                            ? { ...q, aiAnalysis: aiData as Quotation['aiAnalysis'], aiScore: aiData.score ? aiData.score * 10 : undefined }
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

    // Filter RFQs - must be before any conditional returns (Rules of Hooks)
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

    // Stats for selected RFQ - must be before any conditional returns (Rules of Hooks)
    const rfqStats = useMemo(() => {
        if (!quotations.length) return [];
        const sortedByScore = [...quotations].sort((a, b) => (b.aiScore || 0) - (a.aiScore || 0));
        const bestQuote = sortedByScore[0];
        return [
            { label: "Tổng báo giá", value: quotations.length, icon: Users, tone: "slate" as const },
            { label: "Chưa trao thầu", value: quotations.filter((q: Quotation) => q.status === 'SUBMITTED').length, icon: Send, tone: "blue" as const },
            { label: "Đã trao thầu", value: quotations.filter((q: Quotation) => q.status === 'ACCEPTED').length, icon: Award, tone: "emerald" as const },
            { label: bestQuote?.aiScore ? "Đề xuất AI" : "Giá thấp nhất", value: formatVND(Math.min(...quotations.map(q => q.totalPrice))), icon: Sparkles, tone: "purple" as const },
        ];
    }, [quotations]);

    // Role check
    if (currentUser?.role !== "PROCUREMENT" && currentUser?.role !== "PLATFORM_ADMIN") {
        return <div className="p-20 text-center font-bold text-black">Bạn không có quyền truy cập trang quản lý báo giá.</div>;
    }

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
                    <div className="h-10 w-10 rounded-xl bg-blue-600/10 flex items-center justify-center text-blue-600 border border-blue-600/20">
                        <FileText size={20} />
                    </div>
                    <div className="flex flex-col">
                        <span className="font-bold text-slate-900 tracking-tight">********</span>
                        <span className="text-[0.6875rem] text-slate-900 font-bold uppercase">{formatDate(row.createdAt)}</span>
                    </div>
                </div>
            )
        },
        {
            label: "Tiêu đề",
            key: "title",
            render: (row: RFQ) => (
                <div className="flex flex-col max-w-xs">
                    <span className="font-bold text-slate-900 truncate">{row.title || "Không có tiêu đề"}</span>
                    <span className="text-[10px] text-slate-900 truncate">{row.description?.substring(0, 50) || ""}...</span>
                </div>
            )
        },
        {
            label: "Hạn chót",
            key: "deadline",
            render: (row: RFQ) => (
                <div className="flex items-center gap-2">
                    <Calendar size={14} className="text-black" />
                    <span className="text-xs font-bold text-black">{formatDate(row.deadline)}</span>
                </div>
            )
        },
        {
            label: "Số báo giá",
            render: (row: RFQ) => (
                <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-lg bg-blue-600/10 flex items-center justify-center">
                            <Users size={16} className="text-blue-600" />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-sm font-bold text-blue-600">
                                {row.suppliers?.length || 0} nhà cung cấp
                            </span>
                            <span className="text-[0.6875rem] text-slate-900">Đã mời tham gia</span>
                        </div>
                    </div>
                </div>
            )
        },
        {
            label: "Trạng thái",
            key: "status",
            render: (row: RFQ) => <StatusBadge status={row.status} size="sm" />
        },
        {
            label: "Thao tác",
            render: (row: RFQ) => (
                <div className="flex items-center gap-1">
                    <button
                        onClick={() => setSelectedRFQ(row)}
                        className="inline-flex items-center gap-1 bg-blue-600 text-white px-3 py-1.5 rounded-lg font-bold text-[10px] uppercase tracking-wider hover:bg-blue-700 transition-all"
                    >
                        <Eye size={12} /> Xem
                    </button>
                    {row.status === 'PUBLISHED' && (
                        <button
                            onClick={() => setConfirmState({
                                open: true,
                                title: "Đóng RFQ",
                                message: "Bạn có chắc muốn đóng RFQ này?",
                                onConfirm: async () => {
                                    setConfirmState(s => ({ ...s, open: false }));
                                    await updateRFQStatus(row.id, RfqStatus.CLOSED);
                                    notify('Đã đóng RFQ', 'success');
                                    refreshData();
                                }
                            })}
                            className="inline-flex items-center gap-2 bg-amber-500/10 text-slate-700 px-3 py-2 rounded-xl font-bold text-[10px] uppercase tracking-widest hover:bg-amber-500/20 transition-all border border-amber-500/20"
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
                    <div className="h-12 w-12 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-600 border border-emerald-500/20">
                        <Building2 size={22} />
                    </div>
                    <div className="flex flex-col">
                        <span className="font-bold text-slate-900 text-sm">{row.supplier?.name || "Chưa có tên"}</span>
                        <div className="flex items-center gap-2 text-[10px] text-slate-900">
                            <span className="bg-white px-2 py-0.5 rounded border border-slate-200">***</span>
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
                    <div className=" font-bold text-black text-sm">{formatVND(row.totalPrice)} ₫</div>
                    <div className="text-[0.6875rem] text-slate-900 font-bold uppercase">Total</div>
                </div>
            )
        },
        {
            label: "Lead Time",
            key: "leadTimeDays",
            render: (row: Quotation) => (
                <div className="flex items-center gap-1">
                    <Clock size={14} className="text-slate-900" />
                    <span className="text-xs font-bold text-slate-900">{row.leadTimeDays} ngày</span>
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
                            <Sparkles size={14} className={row.aiScore >= 80 ? "text-black" : "text-violet-400"} />
                            <div className="flex flex-col">
                                <span className={`text-xs font-bold ${row.aiScore >= 80 ? "text-black" : "text-violet-400"}`}>
                                    {row.aiScore}/100
                                </span>
                                <div className="w-16 bg-slate-900 rounded-full h-1">
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
                        <span className="text-[10px] text-slate-900 font-bold">Chưa đánh giá</span>
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
                        className="inline-flex items-center gap-2 bg-slate-900 text-slate-100 px-3 py-2 rounded-xl font-bold text-[10px] uppercase tracking-widest hover:bg-white hover:text-black transition-all border border-slate-200"
                        title="Xem chi tiết"
                    >
                        <Eye size={14} />
                    </button>
                    {row.status === 'SUBMITTED' && (
                        <button
                            onClick={() => setAwardModal(row)}
                            className="inline-flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-xl font-bold text-[10px] uppercase tracking-widest hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-500/20 active:scale-95"
                        >
                            <Award size={14} /> Trao thầu
                        </button>
                    )}
                    {row.status === 'ACCEPTED' && (
                        <span className="inline-flex items-center gap-2 bg-emerald-500/10 text-emerald-700 px-3 py-2 rounded-xl font-bold text-[10px] uppercase tracking-widest border border-emerald-500/20">
                            <CheckCircle size={14} /> Đã trao
                        </span>
                    )}
                    {row.status === 'REJECTED' && (
                        <span className="inline-flex items-center gap-2 bg-rose-500/10 text-rose-700 px-3 py-2 rounded-xl font-bold text-[10px] uppercase tracking-widest border border-rose-500/20">
                            <AlertCircle size={14} /> Từ chối
                        </span>
                    )}
                </div>
            )
        }
    ];

    return (
        <main className="p-6 space-y-6 animate-in fade-in duration-500">
            <ConfirmDialog
                open={confirmState.open}
                title={confirmState.title}
                message={confirmState.message}
                onConfirm={confirmState.onConfirm}
                onCancel={() => setConfirmState(s => ({ ...s, open: false }))}
            />
            {/* Header */}
            <div className="page-header">
                <div>
                    <h1 className="page-title">
                        {selectedRFQ ? `BÁO GIÁ CHO RFQ` : "QUẢN LÝ BÁO GIÁ"}
                    </h1>
                    <p className="page-subtitle flex items-center gap-2">
                        <ShieldAlert size={14} className="text-blue-600" />
                        {selectedRFQ ? selectedRFQ.title || "Xem xét và trao thầu" : "Chọn RFQ để xem báo giá"}
                    </p>
                </div>
                <div className="flex gap-4 w-full md:w-auto">
                    {selectedRFQ ? (
                        <button
                            onClick={() => setSelectedRFQ(null)}
                            className="btn-secondary"
                        >
                            <ArrowLeft size={16} /> Quay lại danh sách RFQ
                        </button>
                    ) : (
                        <div className="flex gap-3 grow md:w-80">
                            <div className="h-14 w-14 bg-slate-100 border border-slate-200 rounded-2xl flex items-center justify-center text-slate-900 shadow-sm shrink-0">
                                <Search size={20} className="text-blue-600" />
                            </div>
                            <div className="relative flex-1">
                                <input
                                    type="text"
                                    placeholder="Tìm kiếm RFQ..."
                                    className="w-full h-14 pl-6 pr-4 bg-slate-100 border border-slate-200 rounded-2xl text-slate-900 placeholder:text-slate-400/40 focus:outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-600/5 transition-all"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                        </div>
                    )}
                    <button className="h-14 w-14 bg-slate-100 border border-slate-200 rounded-2xl flex items-center justify-center text-slate-900 shadow-xl shadow-blue-600/5 hover:bg-slate-200 transition-all shrink-0">
                        <ListFilter size={20} className="text-blue-600" />
                    </button>
                </div>
            </div>

            {/* Stats - Only show when viewing quotations */}
            {selectedRFQ && rfqStats.length > 0 && (
                <StatGrid cols={4}>
                    {rfqStats.map((stat) => (
                        <StatCard key={stat.label} label={stat.label} value={stat.value} icon={stat.icon} tone={stat.tone} />
                    ))}
                </StatGrid>
            )}

            {/* Analyzing Indicator */}
            {analyzingRFQ && (
                <div className="bg-blue-600/10 border border-blue-600/20 rounded-2xl p-4 mb-6 flex items-center gap-3">
                    <Sparkles size={20} className="text-blue-600 animate-pulse" />
                    <span className="text-sm font-bold text-slate-900">AI đang phân tích các báo giá...</span>
                </div>
            )}

            {/* Award Modal */}
            {awardModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-white/80 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-slate-100 rounded-xl w-full max-w-lg shadow-xl overflow-hidden animate-in zoom-in-95 duration-300 border border-slate-200">
                        <div className="bg-emerald-600 px-8 py-6 text-white flex justify-between items-center">
                            <div>
                                <h3 className="text-xl font-bold uppercase">Trao thầu</h3>
                                <p className="text-emerald-100 text-xs font-bold uppercase mt-1 tracking-widest">Xác nhận chọn nhà cung cấp</p>
                            </div>
                            <button onClick={() => setAwardModal(null)} className="h-8 w-8 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/30 transition-all font-bold text-slate-900">×</button>
                        </div>
                        <div className="p-8 space-y-6">
                            <div className="bg-white rounded-2xl p-6 border border-slate-200">
                                <div className="flex items-center gap-4 mb-4">
                                    <div className="h-12 w-12 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-600">
                                        <Award size={24} />
                                    </div>
                                    <div>
                                        <div className="font-bold text-slate-900">{awardModal.supplier?.name || awardModal.supplierId}</div>
                                        <div className="text-[10px] text-slate-900 font-bold uppercase">Nhà cung cấp được chọn</div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div>
                                        <span className="text-[10px] font-bold uppercase text-slate-900">Giá báo:</span>
                                        <div className=" font-bold text-black">{formatVND(awardModal.totalPrice)} ₫</div>
                                    </div>
                                    <div>
                                        <span className="text-[10px] font-bold uppercase text-slate-900">Lead time:</span>
                                        <div className="font-bold text-slate-900">{awardModal.leadTimeDays} ngày</div>
                                    </div>
                                    {awardModal.aiScore && (
                                        <div>
                                            <span className="text-[10px] font-bold uppercase text-slate-900">AI Score:</span>
                                            <div className="font-bold text-violet-400">{awardModal.aiScore}/100</div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="text-sm text-slate-900">
                                <p className="mb-2">Bạn có chắc chắn muốn trao thầu cho nhà cung cấp này?</p>
                                <p className="text-[10px] text-slate-900">Sau khi trao thầu, các báo giá khác cho RFQ này sẽ bị đóng.</p>
                            </div>

                            <div className="flex gap-4 pt-4">
                                <button onClick={() => setAwardModal(null)} className="btn-secondary flex-1 justify-center">Hủy bỏ</button>
                                <button
                                    onClick={() => handleAward(awardModal)}
                                    className="flex-1 px-6 py-4 rounded-2xl bg-emerald-600 text-white font-bold text-xs uppercase tracking-widest hover:bg-emerald-700 transition-all shadow-xl shadow-emerald-500/20 active:scale-95"
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
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-white/90 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-white rounded-xl w-full max-w-4xl shadow-xl shadow-black/50 max-h-[90vh] flex flex-col animate-in zoom-in-95 duration-300 border border-slate-200 overflow-y-auto">

                        {/* Header */}
                        <div className="bg-gradient-to-r from-slate-900 to-slate-100 px-8 py-5 flex justify-between items-center border-b border-slate-200 shrink-0">
                            <div className="flex items-center gap-4">
                                <div className="h-12 w-12 rounded-2xl bg-blue-600/10 flex items-center justify-center border border-blue-600/20">
                                    <Building2 size={24} className="text-blue-600" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-slate-900">{viewQuotation.supplier?.name || "Nhà cung cấp"}</h3>
                                    <p className="text-xs text-slate-900 mt-0.5">{formatVND(viewQuotation.totalPrice)} ₫ • {viewQuotation.leadTimeDays} ngày</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <StatusBadge status={viewQuotation.status} size="sm" />
                                <button onClick={() => setViewQuotation(null)} className="h-10 w-10 rounded-xl bg-slate-900 border border-slate-200 flex items-center justify-center hover:bg-slate-100 transition-all">
                                    <X size={18} className="text-slate-900" />
                                </button>
                            </div>
                        </div>

                        <div className="flex flex-1 min-h-0 overflow-hidden">
                            {/* Left Panel */}
                            <div className="flex-1 flex flex-col bg-white min-h-0 overflow-hidden">
                                {/* Horizontal Tabs */}
                                <div className="flex px-6 pt-4 border-b border-slate-200 gap-6 shrink-0 bg-white">
                                    <button onClick={() => setActiveModalTab('AI')} className={`pb-3 text-xs font-bold uppercase tracking-widest border-b-2 transition-all ${activeModalTab === 'AI' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-900 hover:text-slate-900'}`}>Phân tích AI</button>
                                    <button onClick={() => setActiveModalTab('QA')} className={`pb-3 text-xs font-bold uppercase tracking-widest border-b-2 transition-all flex gap-2 items-center ${activeModalTab === 'QA' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-900 hover:text-slate-900'}`}>Trao đổi (Q&A) <span className="bg-blue-600/20 text-blue-600 px-1.5 py-0.5 rounded text-[0.6875rem]">{qaThreadsList?.length || 0}</span></button>
                                    <button onClick={() => setActiveModalTab('NEGOTIATION')} className={`pb-3 text-xs font-bold uppercase tracking-widest border-b-2 transition-all flex gap-2 items-center ${activeModalTab === 'NEGOTIATION' ? 'border-emerald-500 text-black' : 'border-transparent text-slate-900 hover:text-slate-900'}`}>Đàm phán Giá <span className="bg-emerald-500/10 text-emerald-700 px-1.5 py-0.5 rounded text-[0.6875rem]">{counterOffersList?.length || 0}</span></button>
                                </div>
                                <div className="flex-1 overflow-y-auto p-6">
                                    {activeModalTab === 'AI' && (
                                        viewQuotation.aiAnalysis ? (
                                            <>
                                                {/* AI Score Card */}
                                                <div className="mb-6 rounded-2xl overflow-hidden border border-slate-200">
                                                    <div className={`px-6 py-4 ${viewQuotation.aiAnalysis.recommendation === 'ACCEPT' ? 'bg-emerald-500/10' :
                                                            viewQuotation.aiAnalysis.recommendation === 'REJECT' ? 'bg-rose-500/10' :
                                                                'bg-amber-500/10'
                                                        }`}>
                                                        <div className="flex items-center justify-between">
                                                            <div className="flex items-center gap-3">
                                                                <div className={`h-14 w-14 rounded-xl flex items-center justify-center border ${viewQuotation.aiAnalysis.recommendation === 'ACCEPT' ? 'bg-emerald-500/20 border-emerald-500/30 text-emerald-700' :
                                                                        viewQuotation.aiAnalysis.recommendation === 'REJECT' ? 'bg-rose-500/20 border-rose-500/30 text-rose-700' :
                                                                            'bg-amber-500/20 border-amber-500/30 text-amber-700'
                                                                    }`}>
                                                                    <Bot size={28} />
                                                                </div>
                                                                <div>
                                                                    <div className="flex items-center gap-2">
                                                                        <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">Phân tích AI</span>
                                                                        <Sparkles size={12} className="text-violet-400" />
                                                                    </div>
                                                                    <div className={`text-2xl font-bold ${viewQuotation.aiAnalysis.score >= 7 ? 'text-black' :
                                                                            viewQuotation.aiAnalysis.score >= 5 ? 'text-black' :
                                                                                'text-black'
                                                                        }`}>
                                                                        {viewQuotation.aiAnalysis.score}<span className="text-base text-slate-900">/10</span>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <div className={`px-4 py-2 rounded-xl font-bold text-sm border ${viewQuotation.aiAnalysis.recommendation === 'ACCEPT'
                                                                    ? 'bg-emerald-500 text-white border-emerald-500' :
                                                                    viewQuotation.aiAnalysis.recommendation === 'REJECT'
                                                                        ? 'bg-rose-500 text-white border-rose-500' :
                                                                        'bg-amber-500 text-white border-amber-500'
                                                                }`}>
                                                                {viewQuotation.aiAnalysis.recommendation === 'ACCEPT' && 'CHẤP NHẬN'}
                                                                {viewQuotation.aiAnalysis.recommendation === 'REJECT' && 'TỪ CHỐI'}
                                                                {viewQuotation.aiAnalysis.recommendation === 'NEGOTIATE' && 'ĐÀM PHÁN'}
                                                                {!['ACCEPT', 'REJECT', 'NEGOTIATE'].includes(viewQuotation.aiAnalysis.recommendation) && viewQuotation.aiAnalysis.recommendation}
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Assessment */}
                                                    <div className="p-5 bg-slate-100">
                                                        <div className="flex items-start gap-3">
                                                            <div className="h-8 w-8 rounded-lg bg-blue-600/10 flex items-center justify-center shrink-0">
                                                                <MessageSquare size={16} className="text-blue-600" />
                                                            </div>
                                                            <div>
                                                                <div className="text-[10px] font-bold uppercase text-slate-900 tracking-wider mb-1">Đánh giá tổng quan</div>
                                                                <p className="text-sm text-slate-900 leading-relaxed">{viewQuotation.aiAnalysis.assessment}</p>
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
                                                                    <ThumbsUp size={16} className="text-emerald-600" />
                                                                </div>
                                                                <div className="text-xs font-bold uppercase text-[#64748B] tracking-wider">Ưu điểm</div>
                                                            </div>
                                                            <ul className="space-y-3">
                                                                {viewQuotation.aiAnalysis.pros.map((pro, idx) => (
                                                                    <li key={idx} className="flex items-start gap-2 text-sm text-slate-900">
                                                                        <CheckCircle2 size={16} className="text-emerald-600 shrink-0 mt-0.5" />
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
                                                                    <ThumbsDown size={16} className="text-rose-600" />
                                                                </div>
                                                                <div className="text-xs font-bold uppercase text-[#64748B] tracking-wider">Nhược điểm</div>
                                                            </div>
                                                            <ul className="space-y-3">
                                                                {viewQuotation.aiAnalysis.cons.map((con, idx) => (
                                                                    <li key={idx} className="flex items-start gap-2 text-sm text-slate-900">
                                                                        <AlertCircle size={16} className="text-amber-600 shrink-0 mt-0.5" />
                                                                        <span className="leading-relaxed">{con}</span>
                                                                    </li>
                                                                ))}
                                                            </ul>
                                                        </div>
                                                    )}
                                                </div>
                                            </>
                                        ) : (
                                            /* AI Analysis Loading / Not Available */
                                            <div className="h-full flex flex-col items-center justify-center text-center p-8">
                                                <div className="h-20 w-20 rounded-xl bg-blue-600/10 flex items-center justify-center mb-4 animate-pulse">
                                                    <Sparkles size={36} className="text-blue-600" />
                                                </div>
                                                <h4 className="text-lg font-bold text-slate-900 mb-2">Đang phân tích AI...</h4>
                                                <p className="text-sm text-slate-900 max-w-xs">Vui lòng đợi trong giây lát</p>
                                            </div>
                                        ))}

                                    {activeModalTab === 'QA' && (
                                        <div className="flex flex-col h-full">
                                            <div className="flex-1 overflow-y-auto space-y-4 mb-4">
                                                {qaThreadsList.map((qa, idx) => (
                                                    <div key={idx} className="bg-slate-100 p-4 rounded-2xl border border-slate-200">
                                                        <div className="flex gap-2">
                                                            <div className="h-8 w-8 bg-blue-600/10 rounded-xl flex items-center justify-center text-blue-600 shrink-0 font-bold text-xs">Q</div>
                                                            <div className="flex-1">
                                                                <div className="text-[10px] text-slate-900 mb-1">MUA HÀNG HỎI</div>
                                                                <p className="text-sm text-slate-900">{qa.question}</p>
                                                            </div>
                                                        </div>
                                                        {qa.answer && (
                                                            <div className="flex gap-2 mt-4 pt-4 border-t border-slate-200">
                                                                <div className="h-8 w-8 bg-emerald-500/10 rounded-xl flex items-center justify-center text-black shrink-0 font-bold text-xs">A</div>
                                                                <div className="flex-1">
                                                                    <div className="text-[10px] text-slate-900 mb-1">NCC TRẢ LỜI</div>
                                                                    <p className="text-sm text-slate-900">{qa.answer}</p>
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                ))}
                                                {qaThreadsList.length === 0 && <p className="text-center text-slate-900 p-4 text-xs font-bold uppercase">Chưa có câu hỏi nào</p>}
                                            </div>
                                            <div className="mt-auto flex gap-2">
                                                <input value={newMsg} onChange={(e) => setNewMsg(e.target.value)} type="text" placeholder="Nhập câu hỏi cho NCC..." className="flex-1 bg-slate-100 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-900 focus:ring-2 outline-none" />
                                                <button onClick={async () => {
                                                    if (!newMsg) return;
                                                    await createQAThread(viewQuotation.rfqId, { question: newMsg, supplierId: viewQuotation.supplierId });
                                                    setNewMsg('');
                                                    const qas = await fetchQAThreadsBySupplier(viewQuotation.rfqId, viewQuotation.supplierId);
                                                    setQaThreadsList(qas || []);
                                                }} className="bg-blue-600 text-white px-5 rounded-xl font-bold text-xs uppercase hover:bg-blue-700 transition-all">Gửi</button>
                                            </div>
                                        </div>
                                    )}

                                    {activeModalTab === 'NEGOTIATION' && (
                                        <div className="flex flex-col h-full">
                                            <div className="bg-amber-500/10 border border-amber-500/20 p-4 rounded-2xl mb-6">
                                                <div className="flex items-start gap-3 text-black">
                                                    <AlertCircle size={20} className="shrink-0 mt-0.5" />
                                                    <div>
                                                        <h4 className="font-bold text-sm uppercase">Cơ chế Counter-Offer (Trả giá)</h4>
                                                        <p className="text-xs mt-1 text-black/80">Bạn có thể gửi một mức giá kỳ vọng mới. Nếu NCC đồng ý, báo giá sẽ tự động cập nhật về giá thiết lập mới.</p>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex-1 overflow-y-auto space-y-4 mb-4">
                                                {counterOffersList.map((co, idx) => (
                                                    <div key={idx} className="bg-slate-100 p-4 rounded-2xl border border-slate-200">
                                                        <div className="flex justify-between items-center mb-3">
                                                            <div className="text-[10px] uppercase font-bold text-slate-900">BẠN ĐỀ XUẤT</div>
                                                            <StatusBadge status={co.status} size="sm" />
                                                        </div>
                                                        <div className="text-2xl font-bold text-black mb-2">{formatVND(co.proposedPrice)} ₫</div>
                                                        {co.buyerNote && <p className="text-xs text-slate-900 italic">&quot;{co.buyerNote}&quot;</p>}
                                                    </div>
                                                ))}
                                                {counterOffersList.length === 0 && <p className="text-center text-slate-900 p-4 text-xs font-bold uppercase">Chưa có đề xuất đàm phán</p>}
                                            </div>
                                            <div className="mt-auto bg-slate-100 p-4 rounded-2xl border border-slate-200">
                                                <div className="grid grid-cols-2 gap-4 mb-3">
                                                    <div>
                                                        <label className="text-[10px] font-bold uppercase text-slate-900 block mb-1">Mức giá đề xuất</label>
                                                        <input value={newPrice} onChange={(e) => setNewPrice(e.target.value)} type="number" placeholder="Ví dụ: 45000000" className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2 text-sm text-slate-900 font-bold outline-none" />
                                                    </div>
                                                    <div>
                                                        <label className="text-[10px] font-bold uppercase text-slate-900 block mb-1">Ghi chú (Tùy chọn)</label>
                                                        <input value={counterOfferNote} onChange={(e) => setCounterOfferNote(e.target.value)} type="text" placeholder="Lý do..." className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2 text-sm text-slate-900 outline-none" />
                                                    </div>
                                                </div>
                                                <button onClick={async () => {
                                                    if (!newPrice) return;
                                                    await createCounterOffer(viewQuotation.id, { proposedPrice: Number(newPrice), notes: counterOfferNote });
                                                    setNewPrice(''); setCounterOfferNote('');
                                                    const cos = await fetchCounterOffersByQuotation(viewQuotation.id);
                                                    setCounterOffersList(cos || []);
                                                }} className="w-full py-3 bg-emerald-600 text-white rounded-xl font-bold text-xs uppercase hover:bg-emerald-700 transition-all shadow-lg active:scale-95">Gửi Đề xuất Đàm phán</button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Right Panel - Quotation Details */}
                            <div className="w-80 bg-slate-100 border-l border-slate-200 p-6 overflow-y-auto shrink-0">
                                <div className="text-xs font-bold uppercase text-slate-900 tracking-wider mb-4">Chi tiết báo giá</div>

                                <div className="space-y-4">
                                    <div className="p-4 rounded-xl bg-white border border-slate-200">
                                        <div className="text-[10px] text-slate-900 uppercase mb-1">Tổng giá trị</div>
                                        <div className="text-xl font-bold text-black">{formatVND(viewQuotation.totalPrice)} ₫</div>
                                    </div>

                                    <div className="p-4 rounded-xl bg-white border border-slate-200">
                                        <div className="text-[10px] text-slate-900 uppercase mb-1">Lead Time</div>
                                        <div className="text-xl font-bold text-blue-600">{viewQuotation.leadTimeDays} <span className="text-sm text-slate-900">ngày</span></div>
                                    </div>

                                    {viewQuotation.validityDays && (
                                        <div className="p-4 rounded-xl bg-white border border-slate-200">
                                            <div className="text-[10px] text-slate-900 uppercase mb-1">Hiệu lực</div>
                                            <div className="text-sm font-bold text-slate-900">{viewQuotation.validityDays} ngày</div>
                                        </div>
                                    )}
                                </div>

                                {viewQuotation.notes && (
                                    <div className="mt-6 p-4 rounded-xl bg-amber-500/10 border border-amber-500/20">
                                        <div className="text-[10px] font-bold uppercase text-black mb-2">Ghi chú từ NCC</div>
                                        <p className="text-sm text-black">{viewQuotation.notes}</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Footer Actions */}
                        <div className="px-6 py-4 bg-slate-100 border-t border-slate-200 flex justify-between items-center shrink-0">
                            <button
                                onClick={() => setViewQuotation(null)}
                                className="btn-secondary"
                            >
                                Đóng
                            </button>
                            {(viewQuotation.status === 'SUBMITTED' || viewQuotation.status === 'DRAFT') && (
                                <button
                                    onClick={() => {
                                        setViewQuotation(null);
                                        setAwardModal(viewQuotation);
                                    }}
                                    className="px-6 py-3 rounded-xl bg-emerald-600 text-white font-bold text-xs uppercase tracking-wider hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-500/20 flex items-center gap-2"
                                >
                                    <Award size={16} /> Trao thầu
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Table */}
                    <div className="erp-card table-card">
                        {selectedRFQ ? (
                            // Show quotations for selected RFQ
                            loading ? (
                                <div className="py-32 text-center">
                                    <div className="inline-flex items-center justify-center w-20 h-20 rounded-xl bg-slate-900 text-slate-100 mb-6 animate-pulse">
                                        <TrendingUp size={40} />
                                    </div>
                                    <h3 className="text-xl font-bold text-slate-900 mb-2 uppercase">Đang tải báo giá...</h3>
                                </div>
                            ) : (
                                <>
                                    <ERPTable columns={quotationColumns} data={quotations} pageSize={10} getRowKey={(r) => r.id} />
                                    {quotations.length === 0 && (
                                        <div className="py-32 text-center">
                                            <div className="inline-flex items-center justify-center w-20 h-20 rounded-xl bg-slate-900 text-slate-100 mb-6">
                                                <AlertCircle size={40} />
                                            </div>
                                            <h3 className="text-xl font-bold text-slate-900 mb-2 uppercase">Chưa có báo giá nào</h3>
                                            <p className="text-slate-900 font-medium">RFQ này chưa nhận được báo giá từ nhà cung cấp.</p>
                                        </div>
                                    )}
                                </>
                            )
                        ) : (
                            // Show RFQ list
                            <div>
                                {Array.isArray(filteredRFQs) ? (
                                    <ERPTable columns={rfqColumns} data={filteredRFQs} pageSize={10} getRowKey={(r) => r.id} />
                                ) : null}
                                {(!Array.isArray(filteredRFQs) || filteredRFQs.length === 0) && (
                                    <div className="py-32 text-center">
                                        <div className="inline-flex items-center justify-center w-20 h-20 rounded-xl bg-slate-900 text-slate-100 mb-6">
                                            <Search size={40} />
                                        </div>
                                        <h3 className="text-xl font-bold text-slate-900 mb-2 uppercase">Không có RFQ nào</h3>
                                        <p className="text-slate-900 font-medium">Chưa có yêu cầu báo giá nào trong hệ thống.</p>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                
        </main>
    );
}


