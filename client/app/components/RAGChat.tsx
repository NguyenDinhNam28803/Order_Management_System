"use client";

import React, { useState, useRef, useEffect } from "react";
import { 
    Sparkles, Send, X, Loader2, Bot, ExternalLink, FileText, 
    Database, Table2, BarChart3, User, Building2, Package, 
    ShoppingCart, Receipt, CreditCard, FileCheck, AlertCircle,
    MessageSquare, Wallet, TrendingUp, Users, Settings, Clock
} from "lucide-react";
import { useProcurement } from "../context/ProcurementContext";

interface SuggestionItem {
    text: string;
    icon: React.ReactNode;
}

type UserRole = "REQUESTER" | "APPROVER" | "ACCOUNTANT" | "VENDOR" | "ADMIN" | "PROCUREMENT" | "FINANCE" | "DEPT_APPROVER" | "DIRECTOR" | "CEO";

const ROLE_SUGGESTIONS: Record<string, SuggestionItem[]> = {
    REQUESTER: [
        { text: "Tổng ngân sách còn được sử dụng", icon: <Wallet size={12} /> },
        { text: "Trạng thái PR của tôi", icon: <FileText size={12} /> },
        { text: "Các hóa đơn chưa thanh toán", icon: <Receipt size={12} /> },
        { text: "KPI chi tiêu năm nay", icon: <TrendingUp size={12} /> },
        { text: "Lịch sử yêu cầu mua hàng", icon: <Clock size={12} /> },
    ],
    APPROVER: [
        { text: "PR đang chờ phê duyệt của tôi", icon: <FileCheck size={12} /> },
        { text: "Tổng giá trị PR cần duyệt", icon: <Wallet size={12} /> },
        { text: "Top 3 nhà cung cấp theo chi phí", icon: <BarChart3 size={12} /> },
        { text: "Các yêu cầu quá hạn", icon: <AlertCircle size={12} /> },
        { text: "Lịch sử phê duyệt gần đây", icon: <Clock size={12} /> },
    ],
    DEPT_APPROVER: [
        { text: "PR đang chờ phê duyệt của tôi", icon: <FileCheck size={12} /> },
        { text: "Tổng giá trị PR cần duyệt", icon: <Wallet size={12} /> },
        { text: "Top 3 nhà cung cấp theo chi phí", icon: <BarChart3 size={12} /> },
        { text: "Các yêu cầu quá hạn", icon: <AlertCircle size={12} /> },
        { text: "Lịch sử phê duyệt gần đây", icon: <Clock size={12} /> },
    ],
    DIRECTOR: [
        { text: "PR đang chờ phê duyệt cấp cao", icon: <FileCheck size={12} /> },
        { text: "Tổng giá trị cần phê duyệt", icon: <Wallet size={12} /> },
        { text: "Báo cáo chi tiêu toàn công ty", icon: <BarChart3 size={12} /> },
        { text: "Top nhà cung cấp chiến lược", icon: <TrendingUp size={12} /> },
        { text: "Các hợp đồng sắp hết hạn", icon: <Clock size={12} /> },
    ],
    CEO: [
        { text: "Tổng quan chi phí toàn hệ thống", icon: <Wallet size={12} /> },
        { text: "Báo cáo chi tiêu theo quý", icon: <BarChart3 size={12} /> },
        { text: "Top nhà cung cấp chiến lược", icon: <TrendingUp size={12} /> },
        { text: "Các hợp đồng lớn sắp hết hạn", icon: <Clock size={12} /> },
        { text: "Tỷ lệ tiết kiệm chi phí", icon: <TrendingUp size={12} /> },
    ],
    ACCOUNTANT: [
        { text: "Các hóa đơn chưa ghi nhận", icon: <Receipt size={12} /> },
        { text: "Khoảng cách giữa PO và Invoice", icon: <FileText size={12} /> },
        { text: "Tổng chi phí phát sinh tháng này", icon: <Wallet size={12} /> },
        { text: "Báo cáo chi tiêu theo phòng ban", icon: <BarChart3 size={12} /> },
        { text: "Các khoản thanh toán sắp đến hạn", icon: <Clock size={12} /> },
    ],
    FINANCE: [
        { text: "Các hóa đơn chưa ghi nhận", icon: <Receipt size={12} /> },
        { text: "Khoảng cách giữa PO và Invoice", icon: <FileText size={12} /> },
        { text: "Tổng chi phí phát sinh tháng này", icon: <Wallet size={12} /> },
        { text: "Báo cáo chi tiêu theo phòng ban", icon: <BarChart3 size={12} /> },
        { text: "Các khoản thanh toán sắp đến hạn", icon: <Clock size={12} /> },
    ],
    VENDOR: [
        { text: "Các đơn hàng của tôi", icon: <ShoppingCart size={12} /> },
        { text: "Trạng thái thanh toán", icon: <CreditCard size={12} /> },
        { text: "Lịch sử giao dịch", icon: <Clock size={12} /> },
        { text: "Tỷ lệ thanh toán đúng hạn", icon: <TrendingUp size={12} /> },
        { text: "Đánh giá KPI của tôi", icon: <BarChart3 size={12} /> },
    ],
    SUPPLIER: [
        { text: "Các đơn hàng của tôi", icon: <ShoppingCart size={12} /> },
        { text: "Trạng thái thanh toán", icon: <CreditCard size={12} /> },
        { text: "Lịch sử giao dịch", icon: <Clock size={12} /> },
        { text: "Tỷ lệ thanh toán đúng hạn", icon: <TrendingUp size={12} /> },
        { text: "Đánh giá KPI của tôi", icon: <BarChart3 size={12} /> },
    ],
    ADMIN: [
        { text: "Tổng số user/vendor", icon: <Users size={12} /> },
        { text: "Chi phí toàn hệ thống", icon: <Wallet size={12} /> },
        { text: "Các PR bất thường", icon: <AlertCircle size={12} /> },
        { text: "Cấu hình hệ thống", icon: <Settings size={12} /> },
        { text: "Báo cáo hiệu suất hệ thống", icon: <BarChart3 size={12} /> },
    ],
    PROCUREMENT: [
        { text: "RFQ đang chờ báo giá", icon: <MessageSquare size={12} /> },
        { text: "Top nhà cung cấp theo KPI", icon: <BarChart3 size={12} /> },
        { text: "Các PO sắp đến hạn giao", icon: <Clock size={12} /> },
        { text: "Tổng giá trị đơn hàng tháng này", icon: <Wallet size={12} /> },
        { text: "Nhà cung cấp tiềm năng mới", icon: <TrendingUp size={12} /> },
    ],
    DEFAULT: [
        { text: "Tổng ngân sách IT năm 2026 còn bao nhiêu?", icon: <Table2 size={12} /> },
        { text: "Top 3 nhà cung cấp có điểm KPI cao nhất", icon: <BarChart3 size={12} /> },
        { text: "Trạng thái PR số PR-2026-0001", icon: <FileText size={12} /> },
        { text: "Các hóa đơn đang chờ thanh toán", icon: <Receipt size={12} /> },
        { text: "Số lượng hàng tồn kho đã nhập tháng này", icon: <Package size={12} /> },
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
            data?: any[];
            found?: boolean;
        };
        sources: Source[];
    }
}

interface RAGChatProps {
    apiFetch: (url: string, options?: RequestInit) => Promise<Response>;
    onClose: () => void;
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
            return <strong key={idx} className="text-[#F8FAFC]">{part.slice(2, -2)}</strong>;
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

export default function RAGChat({ apiFetch, onClose }: RAGChatProps) {
    const { currentUser } = useProcurement();
    const [searchQuery, setSearchQuery] = useState("");
    const [aiResponse, setAiResponse] = useState<RagResponse | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    // Get user role and suggestions
    const userRole = currentUser?.role || "DEFAULT";
    const roleSuggestions = ROLE_SUGGESTIONS[userRole] || ROLE_SUGGESTIONS.DEFAULT;
    
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
        <div className="fixed inset-0 z-[100] bg-[#0F1117]/90 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-300" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}>
            <div className="bg-[#161922] w-full max-w-4xl max-h-[85vh] rounded-3xl shadow-2xl flex flex-col border border-[rgba(148,163,184,0.1)] overflow-hidden animate-in zoom-in-95 duration-300" style={{ margin: 'auto' }}>
                {/* Header */}
                <div className="p-5 border-b border-[rgba(148,163,184,0.1)] flex items-center justify-between bg-[#161922]">
                    <div className="flex items-center gap-3">
                        <div className="bg-gradient-to-br from-[#3B82F6] to-[#8B5CF6] p-2.5 rounded-xl text-white shadow-lg shadow-[#3B82F6]/20">
                            <Bot size={22} />
                        </div>
                        <div>
                            <h2 className="text-sm font-bold text-[#F8FAFC]">AI Procurement Assistant</h2>
                            <div className="flex items-center gap-2">
                                <p className="text-[10px] text-[#64748B] flex items-center gap-1">
                                    <Database size={10} /> RAG • 20 bảng • Vector Search
                                </p>
                                <span className="text-[9px] px-2 py-0.5 bg-[#3B82F6]/20 text-[#3B82F6] rounded-full border border-[#3B82F6]/30 font-medium">
                                    {roleDisplayNames[userRole] || userRole}
                                </span>
                            </div>
                        </div>
                    </div>
                    <button 
                        onClick={onClose}
                        className="p-2 text-[#64748B] hover:text-[#F8FAFC] hover:bg-[#0F1117] rounded-xl transition-all"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Chat Area */}
                <div className="flex-1 overflow-y-auto p-6 bg-[#0F1117] custom-scrollbar">
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center h-full gap-5">
                            <div className="relative">
                                <div className="w-16 h-16 border-4 border-[#3B82F6]/20 border-t-[#3B82F6] rounded-full animate-spin" />
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <Sparkles size={20} className="text-[#3B82F6] animate-pulse" />
                                </div>
                            </div>
                            <div className="text-center space-y-2">
                                <p className="text-sm font-bold text-[#64748B] uppercase tracking-widest animate-pulse">
                                    Đang truy vấn Vector Database...
                                </p>
                                <p className="text-[10px] text-[#64748B]/70">Embedding → Similarity Search → LLM Generation</p>
                            </div>
                        </div>
                    ) : aiResponse ? (
                        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            {/* Answer Section */}
                            <div className="space-y-3">
                                <div className="flex items-center gap-2 text-[#3B82F6]">
                                    <Sparkles size={14} />
                                    <span className="text-[10px] font-black uppercase tracking-widest">Câu trả lời từ AI</span>
                                </div>
                                <div className="bg-[#161922] p-6 rounded-2xl border border-[rgba(148,163,184,0.1)] shadow-xl">
                                    <div className="text-sm text-text-secondary leading-relaxed font-medium whitespace-pre-wrap">
                                        {formatAnswer(aiResponse?.data?.answer?.summary)}
                                    </div>
                                </div>
                            </div>

                            {/* SQL Section removed - not in API response */}

                            {/* Sources Section */}
                            {aiResponse?.data?.sources?.length > 0 && (
                                <div className="space-y-3">
                                    <div className="flex items-center gap-2 text-[#64748B]">
                                        <FileText size={14} />
                                        <span className="text-[10px] font-black uppercase tracking-widest">
                                            Nguồn dữ liệu ({aiResponse.data.sources.length})
                                        </span>
                                    </div>
                                    <div className="grid grid-cols-1 gap-2">
                                        {aiResponse.data.sources.map((s, idx) => (
                                            <div 
                                                key={idx} 
                                                className="flex items-start gap-3 p-3 bg-[#161922] rounded-xl border border-[rgba(148,163,184,0.1)] hover:border-[rgba(59,130,246,0.3)] transition-all cursor-pointer group"
                                            >
                                                <div className="p-2 bg-[#0F1117] border border-[rgba(148,163,184,0.1)] rounded-lg text-[#64748B] shrink-0 group-hover:text-[#3B82F6] group-hover:border-[#3B82F6]/30 transition-all">
                                                    {TABLE_ICONS[s.metadata.table] || <FileText size={14} />}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <span className="text-[10px] font-bold text-[#3B82F6] uppercase tracking-wide px-2 py-0.5 bg-[#3B82F6]/10 rounded-full">
                                                            {TABLE_NAMES[s.metadata.table] || s.metadata.table}
                                                        </span>
                                                        {s.similarity && (
                                                            <span className="text-[9px] text-[#64748B]">
                                                                {(s.similarity * 100).toFixed(1)}% match
                                                            </span>
                                                        )}
                                                    </div>
                                                    <p className="text-xs text-[#94A3B8] truncate group-hover:text-[#F8FAFC] transition-colors">
                                                        {s.metadata.name || s.content.substring(0, 80) + "..."}
                                                    </p>
                                                    <p className="text-[10px] text-[#64748B]/70 mt-1 line-clamp-2">
                                                        {s.content}
                                                    </p>
                                                </div>
                                                <ExternalLink size={12} className="text-[#64748B] group-hover:text-[#3B82F6] shrink-0 mt-1" />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="h-full flex flex-col justify-center">
                            <div className="text-center mb-8">
                                <div className="w-20 h-20 bg-gradient-to-br from-[#3B82F6]/20 to-[#8B5CF6]/20 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-[#3B82F6]/20">
                                    <Bot size={36} className="text-[#3B82F6]" />
                                </div>
                                <h3 className="text-lg font-bold text-[#F8FAFC] mb-2">Hỏi AI về dữ liệu của bạn</h3>
                                <p className="text-xs text-[#64748B] max-w-md mx-auto">
                                    Xin chào {roleDisplayNames[userRole] || userRole}! AI sẽ tìm kiếm qua 20 bảng dữ liệu để trả lời câu hỏi phù hợp với vai trò của bạn.
                                </p>
                            </div>
                            
                            <div className="grid grid-cols-1 gap-3 max-w-lg mx-auto animate-in fade-in slide-in-from-bottom-2 duration-500">
                                {roleSuggestions.map((item: SuggestionItem, index: number) => (
                                    <button 
                                        key={item.text}
                                        onClick={() => setSearchQuery(item.text)}
                                        className="flex items-center gap-3 p-4 bg-[#161922] border border-[rgba(148,163,184,0.1)] rounded-2xl text-sm text-[#94A3B8] hover:border-[#3B82F6]/50 hover:bg-[#1A1D23] hover:text-[#F8FAFC] transition-all text-left group shadow-sm"
                                        style={{ animationDelay: `${index * 100}ms` }}
                                    >
                                        <span className="text-[#64748B] group-hover:text-[#3B82F6] transition-colors">
                                            {item.icon}
                                        </span>
                                        {item.text}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Input Area */}
                <form onSubmit={handleAIsolve} className="p-5 border-t border-[rgba(148,163,184,0.1)] bg-[#161922]">
                    <div className="flex items-center gap-3">
                        <div className="flex-1 relative">
                            <input 
                                ref={inputRef}
                                type="text" 
                                placeholder="Nhập câu hỏi về ngân sách, PO, hóa đơn, nhà cung cấp..."
                                className="w-full bg-[#0F1117] border border-[rgba(148,163,184,0.2)] rounded-xl px-4 py-3.5 text-sm text-[#F8FAFC] placeholder:text-[#64748B]/60 focus:outline-none focus:border-[#3B82F6]/50 focus:ring-2 focus:ring-[#3B82F6]/10 transition-all"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                        <button 
                            type="submit"
                            disabled={isLoading || !searchQuery.trim()}
                            className="bg-gradient-to-r from-[#3B82F6] to-[#8B5CF6] text-white px-6 py-3.5 rounded-xl font-bold text-sm flex items-center gap-2 hover:opacity-90 transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-[#3B82F6]/20"
                        >
                            {isLoading ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                            Gửi
                        </button>
                    </div>
                    <div className="flex items-center justify-between mt-3">
                        <p className="text-[9px] text-[#64748B]/70 flex items-center gap-1">
                            <Sparkles size={9} className="text-[#3B82F6]" />
                            Powered by RAG + Vector DB + LLM
                        </p>
                        <div className="flex gap-1.5">
                            {["Ctrl", "K"].map((key) => (
                                <kbd key={key} className="px-2 py-0.5 bg-[#0F1117] border border-[rgba(148,163,184,0.1)] rounded text-[9px] font-bold text-[#64748B]">
                                    {key}
                                </kbd>
                            ))}
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
}
