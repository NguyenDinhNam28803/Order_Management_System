"use client";

import React, { useState, useRef, useEffect } from "react";
import { 
    Sparkles, Send, X, Loader2, Bot, FileText, Lock,
    Database, BarChart3, FileCheck, AlertCircle,
    MessageSquare, Wallet, TrendingUp, Users, Settings, Clock,
    LayoutGrid, Receipt, CreditCard, Package, ShoppingCart,
    Building2, User, Table2
} from "lucide-react";
import { useProcurement, PR, Invoice } from "../context/ProcurementContext";

interface SuggestionItem {
    text: string;
    icon: React.ReactNode;
}

type UserRole = "REQUESTER" | "APPROVER" | "ACCOUNTANT" | "VENDOR" | "ADMIN" | "PROCUREMENT" | "FINANCE" | "DEPT_APPROVER" | "DIRECTOR" | "CEO";

const ROLE_SUGGESTIONS: Record<string, SuggestionItem[]> = {
    REQUESTER: [
        { text: "PR đang chờ phê duyệt của tôi", icon: <FileCheck size={16} /> },
        { text: "Ngân sách Q2 còn lại bao nhiêu?", icon: <Wallet size={16} /> },
        { text: "Hóa đơn quá hạn thanh toán", icon: <AlertCircle size={16} /> },
        { text: "Top nhà cung cấp tháng này", icon: <TrendingUp size={16} /> },
    ],
    APPROVER: [
        { text: "PR đang chờ phê duyệt của tôi", icon: <FileCheck size={16} /> },
        { text: "Ngân sách Q2 còn lại bao nhiêu?", icon: <Wallet size={16} /> },
        { text: "Hóa đơn quá hạn thanh toán", icon: <AlertCircle size={16} /> },
        { text: "Top nhà cung cấp tháng này", icon: <TrendingUp size={16} /> },
    ],
    DEPT_APPROVER: [
        { text: "PR đang chờ phê duyệt của tôi", icon: <FileCheck size={16} /> },
        { text: "Ngân sách Q2 còn lại bao nhiêu?", icon: <Wallet size={16} /> },
        { text: "Hóa đơn quá hạn thanh toán", icon: <AlertCircle size={16} /> },
        { text: "Top nhà cung cấp tháng này", icon: <TrendingUp size={16} /> },
    ],
    DIRECTOR: [
        { text: "PR đang chờ phê duyệt cấp cao", icon: <FileCheck size={16} /> },
        { text: "Ngân sách Q2 còn lại bao nhiêu?", icon: <Wallet size={16} /> },
        { text: "Hóa đơn quá hạn thanh toán", icon: <AlertCircle size={16} /> },
        { text: "Top nhà cung cấp tháng này", icon: <TrendingUp size={16} /> },
    ],
    CEO: [
        { text: "Tổng quan chi phí toàn hệ thống", icon: <Wallet size={16} /> },
        { text: "Ngân sách Q2 còn lại bao nhiêu?", icon: <Wallet size={16} /> },
        { text: "Hóa đơn quá hạn thanh toán", icon: <AlertCircle size={16} /> },
        { text: "Top nhà cung cấp tháng này", icon: <TrendingUp size={16} /> },
    ],
    ACCOUNTANT: [
        { text: "Các hóa đơn chưa ghi nhận", icon: <Receipt size={16} /> },
        { text: "Ngân sách Q2 còn lại bao nhiêu?", icon: <Wallet size={16} /> },
        { text: "Hóa đơn quá hạn thanh toán", icon: <AlertCircle size={16} /> },
        { text: "Top nhà cung cấp tháng này", icon: <TrendingUp size={16} /> },
    ],
    FINANCE: [
        { text: "Các hóa đơn chưa ghi nhận", icon: <Receipt size={16} /> },
        { text: "Ngân sách Q2 còn lại bao nhiêu?", icon: <Wallet size={16} /> },
        { text: "Hóa đơn quá hạn thanh toán", icon: <AlertCircle size={16} /> },
        { text: "Top nhà cung cấp tháng này", icon: <TrendingUp size={16} /> },
    ],
    VENDOR: [
        { text: "Các đơn hàng của tôi", icon: <ShoppingCart size={16} /> },
        { text: "Trạng thái thanh toán", icon: <CreditCard size={16} /> },
        { text: "Lịch sử giao dịch", icon: <Clock size={16} /> },
        { text: "Đánh giá KPI của tôi", icon: <BarChart3 size={16} /> },
    ],
    SUPPLIER: [
        { text: "Các đơn hàng của tôi", icon: <ShoppingCart size={16} /> },
        { text: "Trạng thái thanh toán", icon: <CreditCard size={16} /> },
        { text: "Lịch sử giao dịch", icon: <Clock size={16} /> },
        { text: "Đánh giá KPI của tôi", icon: <BarChart3 size={16} /> },
    ],
    ADMIN: [
        { text: "Tổng số user/vendor", icon: <Users size={16} /> },
        { text: "Ngân sách Q2 còn lại bao nhiêu?", icon: <Wallet size={16} /> },
        { text: "Hóa đơn quá hạn thanh toán", icon: <AlertCircle size={16} /> },
        { text: "Top nhà cung cấp tháng này", icon: <TrendingUp size={16} /> },
    ],
    PROCUREMENT: [
        { text: "RFQ đang chờ báo giá", icon: <MessageSquare size={16} /> },
        { text: "Ngân sách Q2 còn lại bao nhiêu?", icon: <Wallet size={16} /> },
        { text: "Hóa đơn quá hạn thanh toán", icon: <AlertCircle size={16} /> },
        { text: "Top nhà cung cấp tháng này", icon: <TrendingUp size={16} /> },
    ],
    DEFAULT: [
        { text: "PR đang chờ phê duyệt của tôi", icon: <FileCheck size={16} /> },
        { text: "Ngân sách Q2 còn lại bao nhiêu?", icon: <Wallet size={16} /> },
        { text: "Hóa đơn quá hạn thanh toán", icon: <AlertCircle size={16} /> },
        { text: "Top nhà cung cấp tháng này", icon: <TrendingUp size={16} /> },
    ],
};

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

interface RAGChatProps {
    apiFetch: (url: string, options?: RequestInit) => Promise<Response>;
    onClose: () => void;
    onSwitchMode?: () => void;
}

const TABLE_ICONS: Record<string, React.ReactNode> = {
    organizations: <Building2 size={14} />,
    users: <User size={14} />,
    departments: <Building2 size={14} />,
    products: <Package size={14} />,
    purchase_requisitions: <FileText size={14} />,
    pr_items: <FileText size={14} />,
    rfq_requests: <MessageSquare size={14} />,
    rfq_quotations: <Receipt size={14} />,
    purchase_orders: <ShoppingCart size={14} />,
    goods_receipts: <Package size={14} />,
    grn_items: <Package size={14} />,
    supplier_invoices: <Receipt size={14} />,
    invoice_items: <Receipt size={14} />,
    payments: <CreditCard size={14} />,
    contracts: <FileCheck size={14} />,
    supplier_kpi_scores: <BarChart3 size={14} />,
    budget_allocations: <Table2 size={14} />,
    disputes: <AlertCircle size={14} />,
    notifications: <MessageSquare size={14} />,
};

const TABLE_NAMES: Record<string, string> = {
    organizations: "Tổ chức",
    users: "Người dùng",
    departments: "Phòng ban",
    products: "Sản phẩm",
    purchase_requisitions: "Yêu cầu mua",
    pr_items: "Chi tiết PR",
    rfq_requests: "RFQ",
    rfq_quotations: "Báo giá",
    purchase_orders: "Đơn mua hàng",
    goods_receipts: "Nhập kho",
    grn_items: "Chi tiết GRN",
    supplier_invoices: "Hóa đơn",
    invoice_items: "Chi tiết hóa đơn",
    payments: "Thanh toán",
    contracts: "Hợp đồng",
    supplier_kpi_scores: "Đánh giá NCC",
    budget_allocations: "Ngân sách",
    disputes: "Tranh chấp",
    notifications: "Thông báo",
};

// Simple markdown parser for RAG responses
const formatAnswer = (text: string): React.ReactNode => {
    // Handle bold text
    const parts = text?.split(/(\*\*.*?\*\*)/g);
    
    return parts?.map((part, idx) => {
        if (part.startsWith('**') && part.endsWith('**')) {
            return <strong key={idx} className="text-[#000000]">{part.slice(2, -2)}</strong>;
        }
        // Handle line breaks
        if (part.includes('\n')) {
            return part.split('\n').map((line, lineIdx) => (
                <React.Fragment key={`${idx}-${lineIdx}`}>
                    {line}
                    {lineIdx < part.split('\n').length - 1 && <br />}
                </React.Fragment>
            ));
        }
        return part;
    });
};

export default function RAGChat({ apiFetch, onClose, onSwitchMode }: RAGChatProps) {
    const { currentUser, myPrs, prs, approvals, invoices, budgets } = useProcurement();
    const [searchQuery, setSearchQuery] = useState("");
    const [aiResponse, setAiResponse] = useState<RagResponse | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    // Get user role and suggestions
    const userRole = currentUser?.role || "DEFAULT";
    const roleSuggestions = ROLE_SUGGESTIONS[userRole] || ROLE_SUGGESTIONS.DEFAULT;

    // Calculate real stats from data
    const isProcOrAdmin = userRole === "PROCUREMENT" || userRole === "PLATFORM_ADMIN";
    const prPool = isProcOrAdmin ? prs : myPrs;
    
    // Count pending PRs (PRs with PENDING status)
    const pendingPRCount = React.useMemo(() => {
        if (!prPool) return 0;
        return prPool.filter((p: PR) => p.status === "PENDING" || p.status === "SUBMITTED").length;
    }, [prPool]);

    // Count pending/incomplete invoices (using status since dueDate not available)
    const overdueInvoiceCount = React.useMemo(() => {
        if (!invoices) return 0;
        // Count invoices with status PENDING, PENDING_APPROVAL, or APPROVED (not yet paid)
        return invoices.filter((inv: Invoice) => 
            ["PENDING", "PENDING_APPROVAL", "APPROVED"].includes(inv.status)
        ).length;
    }, [invoices]);

    // Calculate budget remaining percentage
    const budgetRemainingPercent = React.useMemo(() => {
        if (!budgets || budgets.allocated === 0) return 100;
        const remaining = budgets.allocated - budgets.committed - budgets.spent;
        return Math.round((remaining / budgets.allocated) * 100);
    }, [budgets]);
    
    // Role display mapping
    const roleDisplayNames: Record<string, string> = {
        REQUESTER: "Người yêu cầu",
        APPROVER: "Người phê duyệt",
        DEPT_APPROVER: "Trưởng phòng",
        DIRECTOR: "Giám đốc",
        CEO: "CEO",
        ACCOUNTANT: "Kế toán",
        FINANCE: "Tài chính",
        VENDOR: "Nhà cung cấp",
        SUPPLIER: "Nhà cung cấp",
        ADMIN: "Quản trị viên",
        PROCUREMENT: "Thu mua",
    };

    useEffect(() => {
        inputRef.current?.focus();
    }, []);

    const handleAIsolve = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!searchQuery.trim()) return;
        
        setIsLoading(true);
        setAiResponse(null);
        
        try {
            const resp = await apiFetch('/rag/query', {
                method: 'POST',
                body: JSON.stringify({ question: searchQuery, topK: 5 })
            });
            
            if (resp.ok) {
                const data: RagResponse = await resp.json();
                setAiResponse(data);
            } else {
                setAiResponse({
                    status: 'error',
                    message: 'Failed to fetch',
                    data: {
                        answer: {
                            summary: "Rất tiếc, AI không thể truy xuất dữ liệu lúc này. Vui lòng thử lại sau.",
                        },
                        sources: []
                    }
                });
            }
        } catch (err) {
            setAiResponse({
                status: 'error',
                message: 'Connection error',
                data: {
                    answer: {
                        summary: "Lỗi kết nối tới hệ thống RAG. Vui lòng kiểm tra kết nối mạng.",
                    },
                    sources: []
                }
            });
        } finally {
            setIsLoading(false);
        }
    };


    return (
        <div className="fixed inset-0 z-[100] bg-[#FFFFFF] flex flex-col animate-in fade-in duration-300" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}>
            {/* Header */}
            <div className="px-6 py-4 flex items-center gap-3 bg-[#FFFFFF]">
                <div className="w-10 h-10 bg-[#1E3A5F] rounded-xl flex items-center justify-center">
                    <Lock size={20} className="text-[#CB7A62]" />
                </div>
                <div className="flex-1">
                    <h2 className="text-base font-semibold text-[#000000]">AI Procurement Assistant</h2>
                    <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[11px] px-2 py-0.5 bg-[#1E3A5F]/50 text-[#CB7A62] rounded-full">
                            RAG • Vector Search
                        </span>
                        <span className="text-[11px] px-2 py-0.5 bg-[#1E3A5F]/50 text-[#CB7A62] rounded-full">
                            20 bảng dữ liệu
                        </span>
                        <span className="text-[11px] px-2 py-0.5 bg-[#065F46]/50 text-[#34D399] rounded-full">
                            {roleDisplayNames[userRole] || userRole}
                        </span>
                    </div>
                </div>
                <button 
                    onClick={onClose}
                    className="w-8 h-8 flex items-center justify-center text-[#000000] hover:text-[#000000] hover:bg-[#1E293B] rounded-lg transition-all"
                >
                    <X size={18} />
                </button>
            </div>

                {/* Chat Area */}
            <div className="flex-1 overflow-y-auto px-6 py-8 bg-[#FFFFFF] custom-scrollbar">
                {isLoading ? (
                    <div className="flex flex-col items-center justify-center h-full gap-5">
                        <div className="relative">
                            <div className="w-16 h-16 border-4 border-[#B4533A]/20 border-t-[#B4533A] rounded-full animate-spin" />
                            <div className="absolute inset-0 flex items-center justify-center">
                                <Sparkles size={20} className="text-[#B4533A] animate-pulse" />
                            </div>
                        </div>
                        <div className="text-center space-y-2">
                            <p className="text-sm font-bold text-[#000000] uppercase tracking-widest animate-pulse">
                                Đang truy vấn Vector Database...
                            </p>
                            <p className="text-[10px] text-[#000000]/70">Embedding → Similarity Search → LLM Generation</p>
                        </div>
                    </div>
                ) : aiResponse ? (
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-3xl mx-auto">
                        {/* Answer Summary Section */}
                        <div className="space-y-3">
                            <div className="flex items-center gap-2 text-[#B4533A]">
                                <Sparkles size={14} />
                                <span className="text-[10px] font-black uppercase tracking-widest">Tóm tắt từ AI</span>
                            </div>
                            <div className="bg-[#FAF8F5] p-6 rounded-2xl border border-[rgba(148,163,184,0.1)] shadow-xl">
                                <div className="text-sm text-[#000000] leading-relaxed font-medium whitespace-pre-wrap">
                                    {formatAnswer(aiResponse?.data?.answer?.summary)}
                                </div>
                            </div>
                        </div>

                            {/* Detailed Data Section - Show meaningful details only */}
                            {aiResponse?.data?.answer?.data && aiResponse.data.answer.data.length > 0 && (
                                <div className="space-y-3">
                                    <div className="flex items-center gap-2 text-black">
                                        <BarChart3 size={14} />
                                        <span className="text-[10px] font-black uppercase tracking-widest">Chi tiết thông tin</span>
                                    </div>
                                    <div className="space-y-3">
                                        {(aiResponse.data.answer.data as Array<Record<string, any>>).map((item, idx) => (
                                            <div key={idx} className="bg-[#FAF8F5] rounded-2xl border border-[rgba(148,163,184,0.1)] overflow-hidden">
                                                {/* Header with status if available */}
                                                {!!(item.status || (item.details as any)?.["Đánh giá nhà cung cấp"]) && (
                                                    <div className="px-4 py-3 bg-[#FFFFFF] border-b border-[rgba(148,163,184,0.1)] flex items-center justify-between">
                                                        <span className="text-xs font-bold text-[#000000]">
                                                            {(item.details as any)?.["Đánh giá nhà cung cấp"] || `Kết quả ${idx + 1}`}
                                                        </span>
                                                        {!!item.status && (
                                                            <span className={`text-[10px] font-bold uppercase px-2 py-1 rounded-full ${
                                                                item.status === 'PREFERRED' ? 'bg-emerald-500/20 text-black' :
                                                                item.status === 'APPROVED' ? 'bg-[#B4533A]/20 text-[#B4533A]' :
                                                                'bg-amber-500/20 text-black'
                                                            }`}>
                                                                {item.status as string}
                                                            </span>
                                                        )}
                                                    </div>
                                                )}
                                                {/* Render details object */}
                                                {item.details && Object.keys(item.details as any).length > 0 && (
                                                    <div className="p-4">
                                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                            {Object.entries(item.details as Record<string, unknown>)
                                                                .filter(([key]) => key !== 'id' && !key.toLowerCase().includes('id') && !key.toLowerCase().includes('org') && !key.toLowerCase().includes('company'))
                                                                .map(([key, value]: [string, unknown]) => {
                                                                    // Skip empty/null values
                                                                    if (value === null || value === undefined || value === '') return null;
                                                                    
                                                                    // Format numeric values
                                                                    const isNumeric = typeof value === 'number';
                                                                    const displayValue = isNumeric && value > 1000 
                                                                        ? value.toLocaleString('vi-VN') 
                                                                        : String(value);
                                                                    
                                                                    return (
                                                                        <div key={key} className="flex flex-col gap-1">
                                                                            <span className="text-[10px] font-bold text-[#000000] uppercase tracking-wider">
                                                                                {key}
                                                                            </span>
                                                                            <span className={`text-sm font-bold ${
                                                                                key.includes('Điểm') || key.includes('tỉ lệ') || key.includes('score') || key.includes('rate')
                                                                                    ? isNumeric && value >= 90 ? 'text-black' :
                                                                                      isNumeric && value >= 70 ? 'text-[#B4533A]' : 'text-black'
                                                                                    : 'text-[#000000]'
                                                                            }`}>
                                                                                {displayValue}
                                                                                {key.includes('Điểm') || key.includes('score') ? '/100' : 
                                                                                 key.includes('tỉ lệ') || key.includes('rate') ? '%' : ''}
                                                                            </span>
                                                                        </div>
                                                                    );
                                                                })}
                                                        </div>
                                                    </div>
                                                )}
                                                {/* Notes/Ghi chú as footer */}
                                                {!!(item.details as any)?.["Ghi chú"] && (
                                                    <div className="px-4 py-3 bg-[#FFFFFF]/50 border-t border-[rgba(148,163,184,0.1)]">
                                                        <p className="text-xs text-[#000000] italic">
                                                            {(item.details as any)["Ghi chú"]}
                                                        </p>
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Sources Section - Hide sensitive IDs */}
                            {aiResponse?.data?.sources?.length > 0 && (
                                <div className="space-y-3">
                                    <div className="flex items-center gap-2 text-[#000000]">
                                        <FileText size={14} />
                                        <span className="text-[10px] font-black uppercase tracking-widest">
                                            Nguồn tham khảo ({aiResponse.data.sources.length})
                                        </span>
                                    </div>
                                    <div className="grid grid-cols-1 gap-2">
                                        {aiResponse.data.sources.map((s, idx) => (
                                            <div 
                                                key={idx} 
                                                className="flex items-start gap-3 p-3 bg-[#FAF8F5] rounded-xl border border-[rgba(148,163,184,0.1)] hover:border-[rgba(59,130,246,0.3)] transition-all group"
                                            >
                                                <div className="p-2 bg-[#FFFFFF] border border-[rgba(148,163,184,0.1)] rounded-lg text-[#000000] shrink-0 group-hover:text-[#B4533A] group-hover:border-[#B4533A]/30 transition-all">
                                                    {TABLE_ICONS[s.metadata.table] || <FileText size={14} />}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <span className="text-[10px] font-bold text-[#B4533A] uppercase tracking-wide px-2 py-0.5 bg-[#B4533A]/10 rounded-full">
                                                            {TABLE_NAMES[s.metadata.table] || s.metadata.table}
                                                        </span>
                                                        {s.similarity && (
                                                            <span className="text-[9px] text-[#000000]">
                                                                Độ tương đồng: {(s.similarity * 100).toFixed(0)}%
                                                            </span>
                                                        )}
                                                    </div>
                                                    <p className="text-[10px] text-[#000000]/70 line-clamp-2">
                                                        {s.content}
                                                    </p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : (
                    <div className="max-w-3xl mx-auto w-full">
                        {/* Center Icon and Welcome */}
                        <div className="text-center mb-8">
                            <div className="w-16 h-16 bg-[#1E3A5F] rounded-2xl flex items-center justify-center mx-auto mb-5">
                                <LayoutGrid size={32} className="text-[#CB7A62]" />
                            </div>
                            <h3 className="text-xl font-semibold text-[#000000] mb-2">
                                Xin chào, {roleDisplayNames[userRole] || userRole} {currentUser?.name?.split(' ').pop() || ''}
                            </h3>
                            <p className="text-sm text-[#000000] max-w-md mx-auto">
                                Hỏi bất cứ điều gì về đơn hàng, ngân sách, nhà cung cấp hoặc trạng thái phê duyệt của bạn.
                            </p>
                        </div>

                        {/* Stats Cards */}
                        <div className="grid grid-cols-3 gap-4 mb-8">
                            <div className="bg-[#FAF8F5] border border-[#1E293B] rounded-2xl p-4 text-center">
                                <div className="text-2xl font-bold text-[#F59E0B] mb-1">{pendingPRCount}</div>
                                <div className="text-xs text-[#000000]">PR chờ duyệt</div>
                            </div>
                            <div className="bg-[#FAF8F5] border border-[#1E293B] rounded-2xl p-4 text-center">
                                <div className="text-2xl font-bold text-[#EF4444] mb-1">{overdueInvoiceCount}</div>
                                <div className="text-xs text-[#000000]">Hóa đơn quá hạn</div>
                            </div>
                            <div className="bg-[#FAF8F5] border border-[#1E293B] rounded-2xl p-4 text-center">
                                <div className="text-2xl font-bold text-[#10B981] mb-1">{budgetRemainingPercent}%</div>
                                <div className="text-xs text-[#000000]">Ngân sách còn lại</div>
                            </div>
                        </div>
                        
                        {/* Suggestions */}
                        <div className="mb-3">
                            <p className="text-xs text-[#000000] uppercase tracking-wider mb-3">GỢI Ý CÂU HỎI</p>
                            <div className="grid grid-cols-2 gap-3">
                                {roleSuggestions.map((item: SuggestionItem, index: number) => (
                                    <button 
                                        key={item.text}
                                        onClick={() => {
                                            if (item.text.includes("Tạo PR mới với AI") && onSwitchMode) {
                                                onSwitchMode();
                                            } else {
                                                setSearchQuery(item.text);
                                            }
                                        }}
                                        className="flex items-start gap-3 p-4 bg-[#FAF8F5] border border-[#1E293B] rounded-xl text-sm text-[#000000] hover:border-[#B4533A]/50 hover:bg-[#1E293B] transition-all text-left group"
                                    >
                                        <span className="text-[#CB7A62] mt-0.5">
                                            {item.icon}
                                        </span>
                                        <span className="leading-tight">{item.text}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Input Area */}
            <div className="px-6 py-4 bg-[#FFFFFF]">
                <form onSubmit={handleAIsolve} className="max-w-3xl mx-auto">
                    <div className="flex items-center gap-3">
                        <div className="flex-1 relative">
                            <input 
                                ref={inputRef}
                                type="text" 
                                placeholder="Hỏi về ngân sách, PO, hóa đơn, nhà cung cấp..."
                                className="w-full bg-[#FAF8F5] border border-[#1E293B] rounded-xl px-4 py-3.5 text-sm text-[#000000] placeholder:text-[#000000] focus:outline-none focus:border-[#B4533A]/50 transition-all"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="flex gap-1">
                                {["Ctrl", "K"].map((key) => (
                                    <kbd key={key} className="px-2 py-1 bg-[#1E293B] border border-[#334155] rounded text-[10px] font-medium text-[#000000]">
                                        {key}
                                    </kbd>
                                ))}
                            </div>
                            <button 
                                type="submit"
                                disabled={isLoading || !searchQuery.trim()}
                                className="w-10 h-10 bg-[#B4533A] text-[#000000] rounded-xl flex items-center justify-center hover:bg-[#A85032] transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                            >
                                {isLoading ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                            </button>
                        </div>
                    </div>
                    <p className="text-[10px] text-[#000000] mt-3 text-center">
                        <span className="inline-flex items-center gap-1">
                            <span className="w-1 h-1 bg-[#10B981] rounded-full"></span>
                            Powered by RAG • Vector DB • LLM — dữ liệu cập nhật theo thời gian thực
                        </span>
                    </p>
                </form>
            </div>
        </div>
    );
}

