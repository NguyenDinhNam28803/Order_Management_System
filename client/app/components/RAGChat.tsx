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

const formatAnswer = (text: string): React.ReactNode => {
    const parts = text?.split(/(\*\*.*?\*\*)/g);
    return parts?.map((part, idx) => {
        if (part.startsWith('**') && part.endsWith('**')) {
            return <strong key={idx} className="text-[#0F172A]">{part.slice(2, -2)}</strong>;
        }
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

    const userRole = currentUser?.role || "DEFAULT";
    const roleSuggestions = ROLE_SUGGESTIONS[userRole] || ROLE_SUGGESTIONS.DEFAULT;

    const isProcOrAdmin = userRole === "PROCUREMENT" || userRole === "PLATFORM_ADMIN";
    const prPool = isProcOrAdmin ? prs : myPrs;

    const pendingPRCount = React.useMemo(() => {
        if (!prPool) return 0;
        return prPool.filter((p: PR) => p.status === "PENDING" || p.status === "SUBMITTED").length;
    }, [prPool]);

    const overdueInvoiceCount = React.useMemo(() => {
        if (!invoices) return 0;
        return invoices.filter((inv: Invoice) =>
            ["PENDING", "PENDING_APPROVAL", "APPROVED"].includes(inv.status)
        ).length;
    }, [invoices]);

    const budgetRemainingPercent = React.useMemo(() => {
        if (!budgets || budgets.allocated === 0) return 100;
        const remaining = budgets.allocated - budgets.committed - budgets.spent;
        return Math.round((remaining / budgets.allocated) * 100);
    }, [budgets]);

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
                        answer: { summary: "Rất tiếc, AI không thể truy xuất dữ liệu lúc này. Vui lòng thử lại sau." },
                        sources: []
                    }
                });
            }
        } catch {
            setAiResponse({
                status: 'error',
                message: 'Connection error',
                data: {
                    answer: { summary: "Lỗi kết nối tới hệ thống RAG. Vui lòng kiểm tra kết nối mạng." },
                    sources: []
                }
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] bg-[#F8FAFC] flex flex-col animate-in fade-in duration-300">
            {/* ── Header ─────────────────────────────────────────────── */}
            <div className="px-6 py-3.5 flex items-center gap-3 bg-white border-b border-[#E2E8F0] shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
                <div className="w-9 h-9 bg-gradient-to-br from-[#2563EB] to-[#6366F1] rounded-lg flex items-center justify-center shrink-0">
                    <Sparkles size={18} className="text-white" />
                </div>
                <div className="flex-1 min-w-0">
                    <h2 className="text-[13px] font-bold text-[#0F172A] leading-tight">AI Procurement Assistant</h2>
                    <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="text-[10px] px-2 py-0.5 bg-[#EFF6FF] text-[#2563EB] rounded font-semibold border border-[#BFDBFE]">
                            RAG · Vector Search
                        </span>
                        <span className="text-[10px] px-2 py-0.5 bg-[#F0FDF4] text-[#16A34A] rounded font-semibold border border-[#BBF7D0]">
                            {roleDisplayNames[userRole] || userRole}
                        </span>
                    </div>
                </div>
                <button
                    onClick={onClose}
                    className="w-8 h-8 flex items-center justify-center text-[#64748B] hover:text-[#0F172A] hover:bg-[#F1F5F9] rounded-lg transition-all"
                >
                    <X size={16} />
                </button>
            </div>

            {/* ── Chat Area ──────────────────────────────────────────── */}
            <div className="flex-1 overflow-y-auto px-6 py-8 no-scrollbar">
                {isLoading ? (
                    <div className="flex flex-col items-center justify-center h-full gap-5">
                        <div className="relative">
                            <div className="w-14 h-14 border-4 border-[#2563EB]/20 border-t-[#2563EB] rounded-full animate-spin" />
                            <div className="absolute inset-0 flex items-center justify-center">
                                <Sparkles size={18} className="text-[#2563EB] animate-pulse" />
                            </div>
                        </div>
                        <div className="text-center space-y-1">
                            <p className="text-sm font-bold text-[#0F172A] uppercase tracking-widest animate-pulse">
                                Đang truy vấn Vector Database...
                            </p>
                            <p className="text-[11px] text-[#64748B]">Embedding → Similarity Search → LLM Generation</p>
                        </div>
                    </div>
                ) : aiResponse ? (
                    <div className="space-y-5 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-3xl mx-auto">
                        {/* Answer Summary */}
                        <div className="space-y-2">
                            <div className="flex items-center gap-2 text-[#2563EB]">
                                <Sparkles size={13} />
                                <span className="text-[10px] font-black uppercase tracking-widest">Tóm tắt từ AI</span>
                            </div>
                            <div className="bg-white border border-[#E2E8F0] rounded-xl p-5 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
                                <div className="text-sm text-[#0F172A] leading-relaxed font-medium whitespace-pre-wrap">
                                    {formatAnswer(aiResponse?.data?.answer?.summary)}
                                </div>
                            </div>
                        </div>

                        {/* Detailed Data */}
                        {aiResponse?.data?.answer?.data && aiResponse.data.answer.data.length > 0 && (
                            <div className="space-y-2">
                                <div className="flex items-center gap-2 text-[#475569]">
                                    <BarChart3 size={13} />
                                    <span className="text-[10px] font-black uppercase tracking-widest">Chi tiết thông tin</span>
                                </div>
                                <div className="space-y-2">
                                    {(aiResponse.data.answer.data as Array<Record<string, any>>).map((item, idx) => (
                                        <div key={idx} className="bg-white border border-[#E2E8F0] rounded-xl overflow-hidden shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
                                            {!!(item.status || (item.details as any)?.["Đánh giá nhà cung cấp"]) && (
                                                <div className="px-4 py-2.5 bg-[#F8FAFC] border-b border-[#E2E8F0] flex items-center justify-between">
                                                    <span className="text-xs font-bold text-[#0F172A]">
                                                        {(item.details as any)?.["Đánh giá nhà cung cấp"] || `Kết quả ${idx + 1}`}
                                                    </span>
                                                    {!!item.status && (
                                                        <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                                                            item.status === 'PREFERRED' ? 'bg-[#ECFDF5] text-[#065F46] border border-[#A7F3D0]' :
                                                            item.status === 'APPROVED'  ? 'bg-[#EFF6FF] text-[#1E40AF] border border-[#BFDBFE]' :
                                                            'bg-[#FFFBEB] text-[#92400E] border border-[#FDE68A]'
                                                        }`}>
                                                            {item.status as string}
                                                        </span>
                                                    )}
                                                </div>
                                            )}
                                            {item.details && Object.keys(item.details as any).length > 0 && (
                                                <div className="p-4">
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                        {Object.entries(item.details as Record<string, unknown>)
                                                            .filter(([key]) => key !== 'id' && !key.toLowerCase().includes('id') && !key.toLowerCase().includes('org') && !key.toLowerCase().includes('company'))
                                                            .map(([key, value]: [string, unknown]) => {
                                                                if (value === null || value === undefined || value === '') return null;
                                                                const isNumeric = typeof value === 'number';
                                                                const displayValue = isNumeric && value > 1000
                                                                    ? value.toLocaleString('vi-VN')
                                                                    : String(value);
                                                                return (
                                                                    <div key={key} className="flex flex-col gap-0.5">
                                                                        <span className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider">{key}</span>
                                                                        <span className={`text-sm font-semibold ${
                                                                            key.includes('Điểm') || key.includes('score')
                                                                                ? isNumeric && (value as number) >= 90 ? 'text-[#059669]'
                                                                                  : isNumeric && (value as number) >= 70 ? 'text-[#2563EB]'
                                                                                  : 'text-[#DC2626]'
                                                                                : 'text-[#0F172A]'
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
                                            {!!(item.details as any)?.["Ghi chú"] && (
                                                <div className="px-4 py-2.5 bg-[#F8FAFC] border-t border-[#E2E8F0]">
                                                    <p className="text-xs text-[#475569] italic">{(item.details as any)["Ghi chú"]}</p>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Sources */}
                        {aiResponse?.data?.sources?.length > 0 && (
                            <div className="space-y-2">
                                <div className="flex items-center gap-2 text-[#475569]">
                                    <FileText size={13} />
                                    <span className="text-[10px] font-black uppercase tracking-widest">
                                        Nguồn tham khảo ({aiResponse.data.sources.length})
                                    </span>
                                </div>
                                <div className="grid grid-cols-1 gap-1.5">
                                    {aiResponse.data.sources.map((s, idx) => (
                                        <div
                                            key={idx}
                                            className="flex items-start gap-3 p-3 bg-white border border-[#E2E8F0] rounded-lg hover:border-[#BFDBFE] hover:bg-[#EFF6FF] transition-all group"
                                        >
                                            <div className="p-1.5 bg-[#F1F5F9] border border-[#E2E8F0] rounded-md text-[#475569] shrink-0 group-hover:text-[#2563EB] group-hover:border-[#BFDBFE] transition-all">
                                                {TABLE_ICONS[s.metadata.table] || <FileText size={14} />}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className="text-[10px] font-bold text-[#2563EB] uppercase tracking-wide px-2 py-0.5 bg-[#EFF6FF] border border-[#BFDBFE] rounded">
                                                        {TABLE_NAMES[s.metadata.table] || s.metadata.table}
                                                    </span>
                                                    {s.similarity && (
                                                        <span className="text-[10px] text-[#64748B]">
                                                            {(s.similarity * 100).toFixed(0)}% phù hợp
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-[11px] text-[#475569] line-clamp-2">{s.content}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="max-w-3xl mx-auto w-full">
                        {/* Welcome */}
                        <div className="text-center mb-8">
                            <div className="w-14 h-14 bg-gradient-to-br from-[#2563EB] to-[#6366F1] rounded-xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-[#2563EB]/20">
                                <LayoutGrid size={28} className="text-white" />
                            </div>
                            <h3 className="text-lg font-bold text-[#0F172A] mb-1">
                                Xin chào, {roleDisplayNames[userRole] || userRole}{currentUser?.name ? ` ${currentUser.name.split(' ').pop()}` : ''}
                            </h3>
                            <p className="text-sm text-[#475569] max-w-md mx-auto">
                                Hỏi về đơn hàng, ngân sách, nhà cung cấp hoặc trạng thái phê duyệt.
                            </p>
                        </div>

                        {/* Stats Cards */}
                        <div className="grid grid-cols-3 gap-3 mb-7">
                            <div className="bg-white border border-[#E2E8F0] rounded-xl p-4 text-center shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
                                <div className="text-2xl font-black text-[#D97706] mb-0.5 font-mono">{pendingPRCount}</div>
                                <div className="text-[11px] text-[#64748B] font-medium">PR chờ duyệt</div>
                            </div>
                            <div className="bg-white border border-[#E2E8F0] rounded-xl p-4 text-center shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
                                <div className="text-2xl font-black text-[#DC2626] mb-0.5 font-mono">{overdueInvoiceCount}</div>
                                <div className="text-[11px] text-[#64748B] font-medium">Hóa đơn chưa thanh toán</div>
                            </div>
                            <div className="bg-white border border-[#E2E8F0] rounded-xl p-4 text-center shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
                                <div className="text-2xl font-black text-[#059669] mb-0.5 font-mono">{budgetRemainingPercent}%</div>
                                <div className="text-[11px] text-[#64748B] font-medium">Ngân sách còn lại</div>
                            </div>
                        </div>

                        {/* Suggestions */}
                        <div>
                            <p className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider mb-3">Gợi ý câu hỏi</p>
                            <div className="grid grid-cols-2 gap-2">
                                {roleSuggestions.map((item: SuggestionItem) => (
                                    <button
                                        key={item.text}
                                        onClick={() => {
                                            if (item.text.includes("Tạo PR mới với AI") && onSwitchMode) {
                                                onSwitchMode();
                                            } else {
                                                setSearchQuery(item.text);
                                            }
                                        }}
                                        className="flex items-start gap-2.5 p-3.5 bg-white border border-[#E2E8F0] rounded-xl text-sm text-[#0F172A] hover:border-[#BFDBFE] hover:bg-[#EFF6FF] transition-all text-left group"
                                    >
                                        <span className="text-[#2563EB] mt-0.5 shrink-0">{item.icon}</span>
                                        <span className="leading-tight text-[12px] font-medium">{item.text}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* ── Input Area ─────────────────────────────────────────── */}
            <div className="px-6 py-4 bg-white border-t border-[#E2E8F0]">
                <form onSubmit={handleAIsolve} className="max-w-3xl mx-auto">
                    <div className="flex items-center gap-2">
                        <div className="flex-1 relative">
                            <input
                                ref={inputRef}
                                type="text"
                                placeholder="Hỏi về ngân sách, PO, hóa đơn, nhà cung cấp..."
                                className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl px-4 py-3 text-sm text-[#0F172A] placeholder:text-[#94A3B8] focus:outline-none focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/12 transition-all"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                            <div className="hidden sm:flex gap-1">
                                {["Ctrl", "K"].map((key) => (
                                    <kbd key={key} className="px-2 py-1 bg-[#F1F5F9] border border-[#CBD5E1] border-b-2 rounded text-[10px] font-bold text-[#475569]">
                                        {key}
                                    </kbd>
                                ))}
                            </div>
                            <button
                                type="submit"
                                disabled={isLoading || !searchQuery.trim()}
                                className="w-10 h-10 bg-[#2563EB] text-white rounded-xl flex items-center justify-center hover:bg-[#1D4ED8] transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-sm"
                            >
                                {isLoading ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                            </button>
                        </div>
                    </div>
                    <p className="text-[10px] text-[#94A3B8] mt-2 text-center flex items-center justify-center gap-1.5">
                        <span className="w-1.5 h-1.5 bg-[#10B981] rounded-full"></span>
                        Powered by RAG · Vector DB · LLM — dữ liệu thời gian thực
                    </p>
                </form>
            </div>
        </div>
    );
}
