"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useProcurement, Invoice } from "@/app/context/ProcurementContext";
import { FileText, Search, CheckCircle2, Clock, AlertCircle, ArrowRight, FileCheck, XCircle, CreditCard, Filter } from "lucide-react";
import { formatVND, getStatusLabel } from "@/app/utils/formatUtils";
import { Organization } from "@/app/types/api-types";

// Extended Invoice with UI-specific fields from API
type InvoiceWithDetails = Invoice & {
    supplier?: Organization;
    vendor?: string;
    po?: { poNumber?: string };
    grnId?: string;
    totalAmount?: number;
    amount?: number;
    currency?: string;
    exceptionReason?: string;
    invoiceDate?: string;
}

export default function FinanceInvoicesPage() {
    const { invoices, pos } = useProcurement();
    const router = useRouter();
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState<string>("ALL");

    // Filter invoices
    const invoicesWithDetails = invoices as InvoiceWithDetails[];
    const filteredInvoices = invoicesWithDetails.filter((inv: InvoiceWithDetails) => {
        const matchesSearch = 
            inv.invoiceNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            inv.supplier?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            inv.vendor?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            inv.po?.poNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            inv.poId?.toLowerCase().includes(searchTerm.toLowerCase());
        
        const matchesStatus = statusFilter === "ALL" || inv.status === statusFilter;
        
        return matchesSearch && matchesStatus;
    });

    const getStatusIcon = (status: string) => {
        switch (status) {
            case "APPROVED":
            case "AUTO_APPROVED":
                return <CheckCircle2 size={16} className="text-black" />;
            case "MATCHED":
                return <CheckCircle2 size={16} className="text-[#CB7A62]" />;
            case "SUBMITTED":
            case "PENDING":
            case "MATCHING":
                return <Clock size={16} className="text-black" />;
            case "EXCEPTION_REVIEW":
                return <AlertCircle size={16} className="text-black" />;
            case "REJECTED":
            case "DISPUTED":
                return <XCircle size={16} className="text-black" />;
            case "PAID":
                return <CreditCard size={16} className="text-[#CB7A62]" />;
            default:
                return <FileText size={16} className="text-[#000000]" />;
        }
    };

    const getStatusClass = (status: string) => {
        switch (status) {
            case "APPROVED":
            case "AUTO_APPROVED":
                return "bg-emerald-500/10 text-black border-emerald-500/20";
            case "MATCHED":
                return "bg-[#B4533A]/10 text-[#CB7A62] border-[#B4533A]/20";
            case "SUBMITTED":
            case "PENDING":
            case "MATCHING":
                return "bg-amber-500/10 text-black border-amber-500/20";
            case "EXCEPTION_REVIEW":
                return "bg-orange-500/10 text-black border-orange-500/20";
            case "REJECTED":
            case "DISPUTED":
                return "bg-rose-500/10 text-black border-rose-500/20";
            case "PAID":
                return "bg-[#B4533A]/10 text-[#CB7A62] border-[#B4533A]/20";
            default:
                return "bg-[#FFFFFF] text-[#000000] border-[rgba(148,163,184,0.1)]";
        }
    };

    const handleViewMatching = (invoiceId: string) => {
        router.push(`/invoices/${invoiceId}`);
    };

    return (
        <div className="animate-in fade-in duration-500">

            <div className="mt-8 flex justify-between items-end mb-10 border-b border-[rgba(148,163,184,0.1)] pb-8">
                <div>
                    <h1 className="text-4xl font-black text-[#000000] tracking-tighter uppercase mb-2">
                        Quản lý Hóa đơn
                    </h1>
                    <p className="text-[#000000] font-bold text-sm tracking-tight flex items-center gap-2">
                        <FileText size={14} className="text-[#B4533A]" />
                        Danh sách hóa đơn chờ đối soát và thanh toán
                    </p>
                </div>
            </div>

            {/* Filter Bar */}
            <div className="bg-[#FAF8F5] p-4 rounded-[32px] border border-[rgba(148,163,184,0.1)] shadow-2xl shadow-[#B4533A]/5 mb-8">
                <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex-1 flex gap-3">
                        <div className="h-14 w-14 bg-[#FFFFFF] border border-[rgba(148,163,184,0.1)] rounded-2xl flex items-center justify-center text-[#000000] shadow-sm shrink-0">
                            <Search size={20} className="text-[#B4533A]" />
                        </div>
                        <div className="relative flex-1">
                            <input
                                className="w-full h-14 pl-6 pr-4 bg-[#FFFFFF] border border-[rgba(148,163,184,0.1)] rounded-2xl text-sm font-bold text-[#000000] placeholder:text-[#000000]/40 focus:outline-none focus:border-[#B4533A] focus:ring-4 focus:ring-[#B4533A]/5 transition-all"
                                placeholder="Tìm theo số hóa đơn, nhà cung cấp, PO..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>
                    <div className="flex gap-3">
                        <div className="relative">
                            <Filter size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#B4533A]" />
                            <select
                                className="h-14 pl-12 pr-10 bg-[#FFFFFF] border border-[rgba(148,163,184,0.1)] rounded-2xl text-sm font-bold text-[#000000] focus:outline-none focus:border-[#B4533A] focus:ring-4 focus:ring-[#B4533A]/5 transition-all appearance-none cursor-pointer min-w-[200px]"
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                            >
                                <option value="ALL">Tất cả trạng thái</option>
                                <option value="SUBMITTED">Chờ đối soát</option>
                                <option value="MATCHING">Đang đối soát</option>
                                <option value="MATCHED">Đã đối soát</option>
                                <option value="APPROVED">Đã duyệt</option>
                                <option value="AUTO_APPROVED">Tự động duyệt</option>
                                <option value="PAID">Đã thanh toán</option>
                                <option value="EXCEPTION_REVIEW">Lỗi đối soát</option>
                                <option value="REJECTED">Từ chối</option>
                            </select>
                        </div>
                    </div>
                </div>
            </div>

            {/* Invoices Table */}
            <div className="erp-card p-0! overflow-hidden bg-[#FAF8F5] shadow-sm border border-[rgba(148,163,184,0.1)]">
                <div className="overflow-x-auto">
                    <table className="erp-table">
                        <thead>
                            <tr className="bg-[#FFFFFF]">
                                <th className="px-6 py-4 text-left">Số hóa đơn</th>
                                <th className="px-6 py-4 text-left">Nhà cung cấp</th>
                                <th className="px-6 py-4 text-left">PO liên quan</th>
                                <th className="px-6 py-4 text-right">Số tiền</th>
                                <th className="px-6 py-4 text-center">Trạng thái</th>
                                <th className="px-6 py-4 text-center">Ngày tạo</th>
                                <th className="px-6 py-4 text-right">Thao tác</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[rgba(148,163,184,0.05)]">
                            {filteredInvoices.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="px-6 py-16 text-center text-[#000000]">
                                        <FileText size={48} className="mx-auto mb-4 opacity-20" />
                                        <p className="text-sm font-bold">Không có hóa đơn nào</p>
                                    </td>
                                </tr>
                            ) : (
                                filteredInvoices.map((inv: InvoiceWithDetails) => (
                                    <tr key={inv.id} className="hover:bg-[#FFFFFF]/50 transition-all group">
                                        <td className="px-6 py-5">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-xl bg-[#B4533A]/10 flex items-center justify-center">
                                                    <FileText size={18} className="text-[#B4533A]" />
                                                </div>
                                                <div>
                                                    <p className="font-bold text-[#000000]">{inv.invoiceNumber}</p>
                                                    <p className="text-xs text-[#000000]">ID: ***</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-5">
                                            <span className="font-medium text-[#000000]">{inv.supplier?.name || inv.vendor}</span>
                                            {inv.supplier?.code && (
                                                <p className="text-xs text-[#000000]">{inv.supplier.code}</p>
                                            )}
                                        </td>
                                        <td className="px-6 py-5">
                                            <span className="text-xs font-black text-[#000000] uppercase tracking-tight bg-[#FFFFFF] px-2 py-1 rounded border border-[rgba(148,163,184,0.1)]">
                                                {inv.po?.poNumber || "PO-***"}
                                            </span>
                                            {inv.grnId && (
                                                <p className="text-xs text-black mt-1">GRN: ***</p>
                                            )}
                                        </td>
                                        <td className="px-6 py-5 text-right">
                                            <span className="font-black text-[#000000]">
                                                {formatVND(Number(inv.totalAmount || inv.amount || 0))}
                                            </span>
                                            <p className="text-xs text-[#000000]">{inv.currency}</p>
                                        </td>
                                        <td className="px-6 py-5 text-center">
                                            <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-bold ${getStatusClass(inv.status)}`}>
                                                {getStatusIcon(inv.status)}
                                                {getStatusLabel(inv.status)}
                                            </div>
                                            {inv.exceptionReason && (
                                                <p className="text-xs text-black mt-1 truncate max-w-[150px]" title={inv.exceptionReason}>
                                                    ⚠️ Lỗi đối soát
                                                </p>
                                            )}
                                        </td>
                                        <td className="px-6 py-5 text-center text-sm text-[#000000]">
                                            {new Date(inv.invoiceDate || inv.createdAt).toLocaleDateString("vi-VN")}
                                        </td>
                                        <td className="px-6 py-5 text-right">
                                            <button
                                                onClick={() => handleViewMatching(inv.id)}
                                                className="inline-flex items-center gap-2 px-4 py-2 bg-[#B4533A]/10 hover:bg-[#B4533A]/20 text-[#B4533A] rounded-lg text-xs font-bold transition-colors border border-[#B4533A]/20"
                                            >
                                                <FileCheck size={14} />
                                                {inv.status === "SUBMITTED" || inv.status === "PENDING" || inv.status === "MATCHING" 
                                                    ? "Đối soát" 
                                                    : "Xem chi tiết"}
                                                <ArrowRight size={14} />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Summary Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
                <div className="bg-[#FAF8F5] p-4 rounded-xl border border-[rgba(148,163,184,0.1)]">
                    <p className="text-xs text-[#000000] uppercase tracking-widest mb-1">Tổng hóa đơn</p>
                    <p className="text-2xl font-black text-[#000000]">{invoices.length}</p>
                </div>
                <div className="bg-[#FAF8F5] p-4 rounded-xl border border-[rgba(148,163,184,0.1)]">
                    <p className="text-xs text-[#000000] uppercase tracking-widest mb-1">Chờ đối soát</p>
                    <p className="text-2xl font-black text-black">
                        {invoicesWithDetails.filter((i: InvoiceWithDetails) => i.status === "SUBMITTED" || i.status === "PENDING" || i.status === "MATCHING").length}
                    </p>
                </div>
                <div className="bg-[#FAF8F5] p-4 rounded-xl border border-[rgba(148,163,184,0.1)]">
                    <p className="text-xs text-[#000000] uppercase tracking-widest mb-1">Lỗi đối soát</p>
                    <p className="text-2xl font-black text-black">
                        {invoicesWithDetails.filter((i: InvoiceWithDetails) => i.status === "EXCEPTION_REVIEW").length}
                    </p>
                </div>
                <div className="bg-[#FAF8F5] p-4 rounded-xl border border-[rgba(148,163,184,0.1)]">
                    <p className="text-xs text-[#000000] uppercase tracking-widest mb-1">Tổng giá trị</p>
                    <p className="text-xl font-black text-[#000000]">
                        {formatVND(invoicesWithDetails.reduce((sum, i: InvoiceWithDetails) => sum + Number(i.totalAmount || i.amount || 0), 0))}
                    </p>
                </div>
            </div>
        </div>
    );
}

