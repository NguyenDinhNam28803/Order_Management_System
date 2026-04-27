"use client";

import React, { useState, useMemo } from "react";
import { 
    Plus, Search, Filter, ArrowRight, ClipboardList, 
    Clock, BadgeCheck, FileText, ChevronRight, MoreVertical, Calendar 
} from "lucide-react";
import { useProcurement, QuoteRequestStatus, QuoteRequest } from "../context/ProcurementContext";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function QuoteRequestPage() {
    const { quoteRequests, convertQuoteToPR, notify } = useProcurement();
    const router = useRouter();
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState<QuoteRequestStatus | "ALL">("ALL");
    const [selectedQR, setSelectedQR] = useState<QuoteRequest | null>(null);

    const formatDate = (ds?: string) => {
        if (!ds) return "N/A";
        const d = new Date(ds);
        if (isNaN(d.getTime())) return ds;
        return `${String(d.getDate()).padStart(2, '0')}-${String(d.getMonth() + 1).padStart(2, '0')}-${d.getFullYear()}`;
    };

    // Filter logic
    const filteredQRs = useMemo(() => {
        return quoteRequests.filter(qr => {
            const matchesSearch = qr.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                                qr.qrNumber.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesStatus = statusFilter === "ALL" || qr.status === statusFilter;
            return matchesSearch && matchesStatus;
        });
    }, [quoteRequests, searchQuery, statusFilter]);

    const handleConvertToPR = async (qr: QuoteRequest) => {
        const success = await convertQuoteToPR(qr.id);
        if (success) {
            router.push("/pr");
        }
    };

    const getStatusInfo = (status: QuoteRequestStatus) => {
        switch (status) {
            case QuoteRequestStatus.DRAFT:
                return { label: "Nháp", color: "bg-[#1A1D23] text-[#000000] border border-[rgba(148,163,184,0.1)]", icon: FileText };
            case QuoteRequestStatus.SUBMITTED:
                return { label: "Đã gửi Thu mua", color: "bg-[#B4533A]/10 text-[#B4533A] border border-[#B4533A]/20", icon: ClipboardList };
            case QuoteRequestStatus.PROCESSING:
                return { label: "Đang hỏi giá NCC", color: "bg-amber-500/10 text-black border border-amber-500/20", icon: Clock };
            case QuoteRequestStatus.COMPLETED:
                return { label: "Đã có báo giá", color: "bg-emerald-500/10 text-black border border-emerald-500/20", icon: BadgeCheck };
            default:
                return { label: status, color: "bg-[#1A1D23] text-[#000000] border border-[rgba(148,163,184,0.1)]", icon: FileText };
        }
    };

    return (
        <main className="animate-in fade-in duration-500 min-h-screen bg-[#FFFFFF] text-[#000000]">
            <div className="px-6 py-6 space-y-6">
            <header className="flex justify-between items-center bg-[#FAF8F5] p-6 rounded-2xl shadow-sm border border-[rgba(148,163,184,0.1)]">
                <div>
                    <h1 className="text-2xl font-black text-[#B4533A] tracking-tight">Yêu cầu báo giá</h1>
                    <p className="text-sm text-[#000000] font-medium">Quản lý và theo dõi các báo giá từ bộ phận Thu mua</p>
                </div>
                <Link 
                    href="/quote-requests/create"
                    className="flex items-center gap-2 bg-[#B4533A] text-[#000000] px-5 py-2.5 rounded-xl font-bold hover:bg-[#A85032] transition-all shadow-lg active:scale-95"
                >
                    <Plus size={20} />
                    Tạo yêu cầu báo giá mới
                </Link>
            </header>

            {/* Filter Bar */}
            <div className="flex flex-wrap items-center gap-4 bg-[#FAF8F5] p-4 rounded-xl shadow-sm border border-[rgba(148,163,184,0.1)] justify-between">
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#000000]" size={18} />
                        <input 
                            type="text"
                            placeholder="Tìm kiếm báo giá..."
                            className="bg-[#FFFFFF] border border-[rgba(148,163,184,0.1)] rounded-lg pl-10 pr-4 py-2 text-sm w-64 focus:ring-4 focus:ring-[#B4533A]/10 transition-all outline-none placeholder:text-[#000000] text-[#000000]"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <button 
                        onClick={() => setStatusFilter("ALL")}
                        className={`px-4 py-1.5 rounded-lg text-xs font-black transition-all ${statusFilter === 'ALL' ? 'bg-[#B4533A] text-[#000000]' : 'bg-[#FFFFFF] text-[#000000] hover:bg-[#1A1D23]'}`}
                    >
                        Tất cả
                    </button>
                    {Object.values(QuoteRequestStatus).map(status => {
                        const { label } = getStatusInfo(status);
                        return (
                            <button 
                                key={status}
                                onClick={() => setStatusFilter(status)}
                                className={`px-4 py-1.5 rounded-lg text-xs font-black transition-all ${statusFilter === status ? 'bg-[#B4533A] text-[#000000]' : 'bg-[#FFFFFF] text-[#000000] hover:bg-[#1A1D23]'}`}
                            >
                                {label}
                            </button>
                        );
                    })}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main List */}
                <div className="lg:col-span-2 space-y-4">
                    {filteredQRs.length === 0 ? (
                        <div className="bg-[#FAF8F5] p-12 rounded-2xl border border-dashed border-[rgba(148,163,184,0.2)] text-center space-y-3">
                            <div className="bg-[#FFFFFF] w-16 h-16 rounded-full flex items-center justify-center mx-auto text-[#000000]">
                                <Search size={32} />
                            </div>
                            <h3 className="text-[#000000] font-bold italic">Không tìm thấy báo giá nào</h3>
                        </div>
                    ) : (
                        filteredQRs.map(qr => {
                            const { label, color, icon: Icon } = getStatusInfo(qr.status);
                            return (
                                <div 
                                    key={qr.id}
                                    onClick={() => setSelectedQR(qr)}
                                    className={`group bg-[#FAF8F5] p-5 rounded-2xl border transition-all cursor-pointer hover:shadow-md ${selectedQR?.id === qr.id ? 'border-[#B4533A] ring-2 ring-[#B4533A]/10' : 'border-[rgba(148,163,184,0.1)]'}`}
                                >
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="flex items-center gap-4">
                                            <div className={`p-3 rounded-xl ${color}`}>
                                                <Icon size={24} />
                                            </div>
                                            <div>
                                                <h3 className="font-black text-[#000000] group-hover:text-[#B4533A] transition-colors">{qr.title}</h3>
                                                <div className="flex flex-wrap items-center gap-2 mt-1">
                                                    <span className="text-[10px] font-black tracking-widest text-[#000000] uppercase">{qr.qrNumber}</span>
                                                    <span className="w-1 h-1 rounded-full bg-[#000000]"></span>
                                                    <span className="text-[11px] font-bold text-[#000000]">Tạo: {new Date(qr.createdAt).toLocaleDateString('vi-VN')}</span>
                                                    {qr.requiredDate && (
                                                        <>
                                                            <span className="w-1 h-1 rounded-full bg-[#000000]"></span>
                                                            <span className="text-[11px] font-black text-black uppercase tracking-tighter bg-rose-500/10 px-2 py-0.5 rounded-md">
                                                                Cần: {formatDate(qr.requiredDate)}
                                                            </span>
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                        <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter ${color} shadow-sm`}>
                                            {label}
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between text-xs font-medium pt-3 border-t border-[rgba(148,163,184,0.1)]">
                                        <div className="text-[#000000]">
                                            Mặt hàng: <span className="text-[#000000] font-bold">{qr.items.length}</span>
                                        </div>
                                        <div className="text-[#B4533A] font-bold flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                                            Xem chi tiết <ChevronRight size={14} />
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>

                {/* Detail Panel */}
                <div className="lg:col-span-1">
                    {selectedQR ? (
                        <div className="bg-[#FAF8F5] p-6 rounded-2xl shadow-xl border border-[rgba(148,163,184,0.1)] sticky top-6 space-y-6">
                            <div className="flex justify-between items-start">
                                <div>
                                    <h2 className="text-lg font-black text-[#000000] leading-tight">{selectedQR.title}</h2>
                                    <p className="text-xs text-[#000000] mt-1 uppercase tracking-widest">{selectedQR.qrNumber}</p>
                                    {selectedQR.requiredDate && (
                                        <div className="flex items-center gap-2 mt-2 py-1.5 px-3 bg-rose-500/10 text-black rounded-lg w-fit border border-rose-500/20 animate-in fade-in slide-in-from-top-1">
                                            <Calendar size={12} className="shrink-0" />
                                            <span className="text-[10px] font-black uppercase tracking-widest leading-none">Cần hàng trước: {formatDate(selectedQR.requiredDate)}</span>
                                        </div>
                                    )}
                                </div>
                                <button className="p-2 text-[#000000] hover:bg-[#1A1D23] rounded-lg">
                                    <MoreVertical size={20} />
                                </button>
                            </div>

                            <div className="space-y-4">
                                <h3 className="text-xs font-black text-[#000000] uppercase tracking-widest">Danh sách mặt hàng</h3>
                                <div className="space-y-3">
                                    {selectedQR.items.map((item, idx) => (
                                        <div key={idx} className="p-4 bg-[#FFFFFF] rounded-xl border border-[rgba(148,163,184,0.1)]">
                                            <div className="flex justify-between items-start mb-2">
                                                <span className="font-bold text-sm text-[#000000]">{item.productName}</span>
                                                <span className="text-xs font-black text-[#000000] underline underline-offset-4 decoration-[#B4533A]/30">{item.qty} {item.unit}</span>
                                            </div>
                                            
                                            <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-[rgba(148,163,184,0.1)]">
                                                <div className="flex flex-col">
                                                    <span className="text-[9px] uppercase font-black text-[#000000]">Nhà cung cấp</span>
                                                    <span className={`text-xs font-bold ${item.supplierName ? 'text-[#000000]' : 'italic text-[#000000]'}`}>
                                                        {item.supplierName || "Đang lấy giá..."}
                                                    </span>
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-[9px] uppercase font-black text-[#000000]">Đơn giá báo</span>
                                                    <span className={`text-xs font-bold ${item.unitPrice ? 'text-[#B4533A]' : 'italic text-[#000000]'}`}>
                                                        {item.unitPrice ? `${item.unitPrice.toLocaleString('vi-VN')} VNĐ` : "Chờ cập nhật"}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="pt-6 border-t border-[rgba(148,163,184,0.1)] space-y-3">
                                {selectedQR.status === QuoteRequestStatus.COMPLETED ? (
                                    <>
                                        <div className="bg-emerald-500/10 p-4 rounded-xl border border-emerald-500/20 flex items-center gap-3 mb-4">
                                            <BadgeCheck className="text-black" size={20} />
                                            <span className="text-xs font-bold text-black">Giá đã được cập nhật khuyên tạo PR ngay!</span>
                                        </div>
                                        <button 
                                            onClick={() => handleConvertToPR(selectedQR)}
                                            className="w-full flex items-center justify-center gap-3 bg-emerald-500 hover:bg-emerald-600 text-[#000000] py-3.5 rounded-xl font-black shadow-lg shadow-emerald-500/20 active:scale-95 transition-all"
                                        >
                                            <ArrowRight size={20} />
                                            Tạo PR từ báo giá này
                                        </button>
                                    </>
                                ) : (
                                    <div className="bg-[#FFFFFF] p-4 rounded-xl text-center space-y-2">
                                        <Clock className="mx-auto text-[#000000]" size={24} />
                                        <p className="text-xs font-medium text-[#000000] leading-relaxed italic">
                                            {selectedQR.status === QuoteRequestStatus.PROCESSING 
                                                ? "Bộ phận Thu mua đang tổng hợp báo giá từ các nhà cung cấp. Vui lòng quay lại sau." 
                                                : "Gửi yêu cầu tới bộ phận Thu mua để lấy báo giá."}
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center p-12 bg-[#FAF8F5]/50 rounded-2xl border border-dashed border-[rgba(148,163,184,0.2)]">
                            <ClipboardList className="text-[#000000] mb-4" size={48} />
                            <p className="text-[#000000] text-sm font-bold italic text-center max-w-[240px] leading-relaxed">Chọn một yêu cầu để xem chi tiết báo giá và thực hiện hành động</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
        </main>
    );
}

