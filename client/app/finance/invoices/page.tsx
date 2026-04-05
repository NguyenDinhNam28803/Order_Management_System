"use client";

import React, { useState, useMemo } from "react";
import {
    CreditCard, Search, Filter, ArrowRight,
    CheckCircle, Clock, AlertCircle, FileText,
    ChevronRight, DollarSign, Zap, Download
} from "lucide-react";
import { useProcurement, InvoiceStatus, Invoice } from "../../context/ProcurementContext";
import DashboardHeader from "../../components/DashboardHeader";
import { formatVND } from "../../utils/formatUtils";

export default function FinanceInvoicesPage() {
    const { invoices, payInvoice, matchInvoice, notify, refreshData, currentUser } = useProcurement();
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState<InvoiceStatus | "ALL">("ALL");
    const [isProcessing, setIsProcessing] = useState<string | null>(null);

    const filteredInvoices = useMemo(() => {
        return (invoices || []).filter(inv => {
            const matchesSearch = inv.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                inv.vendor.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesStatus = statusFilter === "ALL" || inv.status === statusFilter;
            return matchesSearch && matchesStatus;
        });
    }, [invoices, searchQuery, statusFilter]);

    const handlePay = async (id: string) => {
        setIsProcessing(id);
        try {
            const success = await payInvoice(id);
            if (success) {
                notify("Thanh toán thành công", "success");
                await refreshData();
            }
        } finally {
            setIsProcessing(null);
        }
    };

    const handleMatch = async (id: string) => {
        setIsProcessing(id);
        try {
            const success = await matchInvoice(id);
            if (success) {
                notify("Đối soát hoàn tất", "success");
                await refreshData();
            }
        } finally {
            setIsProcessing(null);
        }
    };

    const getStatusStyle = (status: string) => {
        switch (status) {
            case 'PAID': return "bg-emerald-100 text-emerald-600";
            case 'SUBMITTED': return "bg-blue-100 text-blue-600";
            case 'MATCHING': return "bg-purple-100 text-purple-600";
            case 'REJECTED': return "bg-rose-100 text-rose-600";
            default: return "bg-slate-100 text-slate-600";
        }
    };

    if (currentUser?.role !== "FINANCE" && currentUser?.role !== "PLATFORM_ADMIN") {
        return <div className="p-20 text-center font-black text-slate-400 uppercase tracking-widest">Truy cập bị từ chối - Chỉ dành cho bộ phận Tài chính</div>;
    }

    return (
        <main className="p-8 animate-in fade-in duration-700">
            <DashboardHeader breadcrumbs={["Tài chính", "Quản lý Hóa đơn"]} />

            <div className="mt-8 flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-10">
                <div>
                    <h1 className="text-4xl font-black text-erp-navy tracking-tighter uppercase">QUẢN LÝ HÓA ĐƠN & THANH TOÁN</h1>
                    <p className="text-slate-400 font-bold text-sm mt-1 uppercase tracking-tight">Thực hiện đối soát 3 bên và lệnh chi tiền cho nhà cung cấp</p>
                </div>
                <div className="flex gap-4">
                    <button className="flex items-center gap-2 px-6 py-3 bg-white border border-slate-200 rounded-xl font-black text-[10px] uppercase tracking-widest text-slate-500 hover:bg-slate-50 transition-all shadow-sm">
                        <Download size={14} /> Xuất dữ liệu kế toán
                    </button>
                    <button className="flex items-center gap-2 px-6 py-3 bg-erp-navy text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-erp-blue transition-all shadow-lg shadow-erp-navy/20">
                        <Zap size={14} /> Báo cáo tổng chi
                    </button>
                </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                <div className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-xl shadow-erp-navy/5">
                    <div className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-4">Tổng nợ chưa thanh toán</div>
                    <div className="text-3xl font-black text-erp-navy font-mono">
                        {formatVND(filteredInvoices.filter(i => i.status !== 'PAID').reduce((sum, i) => sum + Number(i.amount), 0))}
                    </div>
                </div>
                <div className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-xl shadow-erp-navy/5">
                    <div className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-4">Hóa đơn chờ đối soát</div>
                    <div className="text-3xl font-black text-purple-600 font-mono">
                        {filteredInvoices.filter(i => i.status === 'SUBMITTED' || i.status === 'MATCHING').length}
                    </div>
                </div>
                <div className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-xl shadow-erp-navy/5">
                    <div className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-4">Đã chi trong tháng</div>
                    <div className="text-3xl font-black text-emerald-600 font-mono">
                        {formatVND(filteredInvoices.filter(i => i.status === 'PAID').reduce((sum, i) => sum + Number(i.amount), 0))}
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm mb-8 flex flex-wrap items-center gap-6">
                <div className="relative grow max-w-md">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input
                        type="text"
                        placeholder="Tìm theo số hóa đơn, nhà cung cấp..."
                        className="erp-input w-full pl-12 h-12 rounded-2xl!"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                <div className="flex items-center gap-2">
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Trạng thái:</label>
                    <select
                        className="bg-slate-50 border-none text-xs font-bold text-erp-navy px-4 py-2 rounded-xl focus:ring-2 focus:ring-erp-blue/20"
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value as any)}
                    >
                        <option value="ALL">TẤT CẢ</option>
                        {Object.values(InvoiceStatus).map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                </div>
            </div>

            {/* Invoice Table */}
            <div className="bg-white rounded-[40px] border border-slate-100 shadow-2xl shadow-erp-navy/5 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="erp-table text-xs">
                        <thead>
                            <tr className="bg-slate-50/50">
                                <th>Số Hóa Đơn</th>
                                <th>Nhà Cung Cấp</th>
                                <th>Mã PO</th>
                                <th className="text-right">Giá Trị</th>
                                <th className="text-center">Trạng Thái</th>
                                <th className="text-right px-10">Thao Tác</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {filteredInvoices.map((inv) => (
                                <tr key={inv.id} className="hover:bg-slate-50 transition-colors group">
                                    <td className="font-black text-erp-navy">{inv.invoiceNumber}</td>
                                    <td className="font-bold text-slate-600">{inv.vendor}</td>
                                    <td className="font-mono text-slate-400">{inv.poId.substring(0,8).toUpperCase()}</td>
                                    <td className="font-mono font-black text-right text-erp-blue">{formatVND(inv.amount)}</td>
                                    <td className="text-center">
                                        <span className={`px-3 py-1 rounded-lg font-black text-[9px] uppercase tracking-widest ${getStatusStyle(inv.status)}`}>
                                            {inv.status}
                                        </span>
                                    </td>
                                    <td className="text-right px-10">
                                        <div className="flex justify-end gap-2">
                                            {(inv.status === 'SUBMITTED' || inv.status === 'MATCHING') && (
                                                <button
                                                    onClick={() => handleMatch(inv.id)}
                                                    disabled={isProcessing === inv.id}
                                                    className="flex items-center gap-2 px-4 py-2 bg-purple-50 text-purple-600 rounded-xl font-black text-[9px] uppercase tracking-widest hover:bg-purple-600 hover:text-white transition-all shadow-sm"
                                                >
                                                    {isProcessing === inv.id ? "Đang xử lý..." : "Đối soát 3-Way"}
                                                </button>
                                            )}
                                            {(inv.status === 'AUTO_APPROVED' || inv.status === 'PAYMENT_APPROVED') && (
                                                <button
                                                    onClick={() => handlePay(inv.id)}
                                                    disabled={isProcessing === inv.id}
                                                    className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-600 rounded-xl font-black text-[9px] uppercase tracking-widest hover:bg-emerald-600 hover:text-white transition-all shadow-sm"
                                                >
                                                    {isProcessing === inv.id ? "Đang chi..." : "Lệnh chi tiền"}
                                                </button>
                                            )}
                                            <button className="p-2.5 text-slate-300 hover:text-erp-navy hover:bg-slate-100 rounded-xl transition-all">
                                                <ChevronRight size={16} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {filteredInvoices.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="py-32 text-center">
                                        <div className="flex flex-col items-center gap-4">
                                            <div className="p-4 bg-slate-50 rounded-full"><FileText size={32} className="text-slate-200" /></div>
                                            <p className="text-slate-400 font-black uppercase tracking-widest text-[10px]">Không tìm thấy hóa đơn nào</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </main>
    );
}
