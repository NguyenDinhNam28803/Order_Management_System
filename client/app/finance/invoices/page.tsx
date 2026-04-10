"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useProcurement, Invoice } from "@/app/context/ProcurementContext";
import { FileText, Search, CheckCircle2, Clock, AlertCircle, ArrowRight, FileCheck, XCircle, CreditCard } from "lucide-react";
import { formatVND, getStatusLabel } from "@/app/utils/formatUtils";

export default function FinanceInvoicesPage() {
    const { invoices, pos } = useProcurement();
    const router = useRouter();
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState<string>("ALL");

    console.log(invoices);

    // Filter invoices
    const filteredInvoices = invoices.filter((inv: any) => {
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
                return <CheckCircle2 size={16} className="text-emerald-400" />;
            case "MATCHED":
                return <CheckCircle2 size={16} className="text-blue-400" />;
            case "SUBMITTED":
            case "PENDING":
            case "MATCHING":
                return <Clock size={16} className="text-amber-400" />;
            case "EXCEPTION_REVIEW":
                return <AlertCircle size={16} className="text-orange-400" />;
            case "REJECTED":
            case "DISPUTED":
                return <XCircle size={16} className="text-rose-400" />;
            case "PAID":
                return <CreditCard size={16} className="text-blue-400" />;
            default:
                return <FileText size={16} className="text-[#64748B]" />;
        }
    };

    const getStatusClass = (status: string) => {
        switch (status) {
            case "APPROVED":
            case "AUTO_APPROVED":
                return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
            case "MATCHED":
                return "bg-blue-500/10 text-blue-400 border-blue-500/20";
            case "SUBMITTED":
            case "PENDING":
            case "MATCHING":
                return "bg-amber-500/10 text-amber-400 border-amber-500/20";
            case "EXCEPTION_REVIEW":
                return "bg-orange-500/10 text-orange-400 border-orange-500/20";
            case "REJECTED":
            case "DISPUTED":
                return "bg-rose-500/10 text-rose-400 border-rose-500/20";
            case "PAID":
                return "bg-blue-500/10 text-blue-400 border-blue-500/20";
            default:
                return "bg-[#0F1117] text-[#64748B] border-[rgba(148,163,184,0.1)]";
        }
    };

    const handleViewMatching = (invoiceId: string) => {
        router.push(`/invoices/${invoiceId}`);
    };

    return (
        <div className="animate-in fade-in duration-500">

            <div className="mt-8 flex justify-between items-end mb-10 border-b border-[rgba(148,163,184,0.1)] pb-8">
                <div>
                    <h1 className="text-4xl font-black text-[#F8FAFC] tracking-tighter uppercase mb-2">
                        Quản lý Hóa đơn
                    </h1>
                    <p className="text-[#64748B] font-bold text-sm tracking-tight flex items-center gap-2">
                        <FileText size={14} className="text-[#3B82F6]" />
                        Danh sách hóa đơn chờ đối soát và thanh toán
                    </p>
                </div>
            </div>

            {/* Filter Bar */}
            <div className="erp-card p-6 mb-6 bg-[#161922] border border-[rgba(148,163,184,0.1)]">
                <div className="flex flex-col md:flex-row gap-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#64748B]" size={18} />
                        <input
                            className="erp-input pl-12 w-full"
                            placeholder="Tìm theo số hóa đơn, nhà cung cấp, PO..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                        <select
                        className="erp-input w-full md:w-48"
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

            {/* Invoices Table */}
            <div className="erp-card p-0! overflow-hidden bg-[#161922] shadow-sm border border-[rgba(148,163,184,0.1)]">
                <div className="overflow-x-auto">
                    <table className="erp-table">
                        <thead>
                            <tr className="bg-[#0F1117]">
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
                                    <td colSpan={7} className="px-6 py-16 text-center text-[#64748B]">
                                        <FileText size={48} className="mx-auto mb-4 opacity-20" />
                                        <p className="text-sm font-bold">Không có hóa đơn nào</p>
                                    </td>
                                </tr>
                            ) : (
                                filteredInvoices.map((inv: any) => (
                                    <tr key={inv.id} className="hover:bg-[#0F1117]/50 transition-all group">
                                        <td className="px-6 py-5">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-xl bg-[#3B82F6]/10 flex items-center justify-center">
                                                    <FileText size={18} className="text-[#3B82F6]" />
                                                </div>
                                                <div>
                                                    <p className="font-bold text-[#F8FAFC]">{inv.invoiceNumber}</p>
                                                    <p className="text-xs text-[#64748B]">ID: {inv.id.slice(0, 8)}...</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-5">
                                            <span className="font-medium text-[#F8FAFC]">{inv.supplier?.name || inv.vendor}</span>
                                            {inv.supplier?.code && (
                                                <p className="text-xs text-[#64748B]">{inv.supplier.code}</p>
                                            )}
                                        </td>
                                        <td className="px-6 py-5">
                                            <span className="text-xs font-black text-[#64748B] uppercase tracking-tight bg-[#0F1117] px-2 py-1 rounded border border-[rgba(148,163,184,0.1)]">
                                                {inv.po?.poNumber || inv.poId?.slice(0, 8)}...
                                            </span>
                                            {inv.grnId && (
                                                <p className="text-xs text-emerald-400 mt-1">GRN: {inv.grnId.slice(0, 8)}...</p>
                                            )}
                                        </td>
                                        <td className="px-6 py-5 text-right">
                                            <span className="font-black text-[#F8FAFC]">
                                                {formatVND(parseFloat(inv.totalAmount || inv.amount || 0))}
                                            </span>
                                            <p className="text-xs text-[#64748B]">{inv.currency}</p>
                                        </td>
                                        <td className="px-6 py-5 text-center">
                                            <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-bold ${getStatusClass(inv.status)}`}>
                                                {getStatusIcon(inv.status)}
                                                {getStatusLabel(inv.status)}
                                            </div>
                                            {inv.exceptionReason && (
                                                <p className="text-xs text-orange-400 mt-1 truncate max-w-[150px]" title={inv.exceptionReason}>
                                                    ⚠️ Lỗi đối soát
                                                </p>
                                            )}
                                        </td>
                                        <td className="px-6 py-5 text-center text-sm text-[#94A3B8]">
                                            {new Date(inv.invoiceDate || inv.createdAt).toLocaleDateString("vi-VN")}
                                        </td>
                                        <td className="px-6 py-5 text-right">
                                            <button
                                                onClick={() => handleViewMatching(inv.id)}
                                                className="inline-flex items-center gap-2 px-4 py-2 bg-[#3B82F6]/10 hover:bg-[#3B82F6]/20 text-[#3B82F6] rounded-lg text-xs font-bold transition-colors border border-[#3B82F6]/20"
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
                <div className="bg-[#161922] p-4 rounded-xl border border-[rgba(148,163,184,0.1)]">
                    <p className="text-xs text-[#64748B] uppercase tracking-widest mb-1">Tổng hóa đơn</p>
                    <p className="text-2xl font-black text-[#F8FAFC]">{invoices.length}</p>
                </div>
                <div className="bg-[#161922] p-4 rounded-xl border border-[rgba(148,163,184,0.1)]">
                    <p className="text-xs text-[#64748B] uppercase tracking-widest mb-1">Chờ đối soát</p>
                    <p className="text-2xl font-black text-amber-400">
                        {invoices.filter((i: any) => i.status === "SUBMITTED" || i.status === "PENDING" || i.status === "MATCHING").length}
                    </p>
                </div>
                <div className="bg-[#161922] p-4 rounded-xl border border-[rgba(148,163,184,0.1)]">
                    <p className="text-xs text-[#64748B] uppercase tracking-widest mb-1">Lỗi đối soát</p>
                    <p className="text-2xl font-black text-orange-400">
                        {invoices.filter((i: any) => i.status === "EXCEPTION_REVIEW").length}
                    </p>
                </div>
                <div className="bg-[#161922] p-4 rounded-xl border border-[rgba(148,163,184,0.1)]">
                    <p className="text-xs text-[#64748B] uppercase tracking-widest mb-1">Tổng giá trị</p>
                    <p className="text-xl font-black text-[#F8FAFC]">
                        {formatVND(invoices.reduce((sum, i: any) => sum + parseFloat(i.totalAmount || i.amount || 0), 0))}
                    </p>
                </div>
            </div>
        </div>
    );
}
