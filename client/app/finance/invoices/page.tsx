"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useProcurement, Invoice } from "@/app/context/ProcurementContext";
import { FileText, ArrowRight, FileCheck, Clock, AlertCircle, CreditCard } from "lucide-react";
import { formatVND, formatDate } from "@/app/utils/formatUtils";
import { Organization } from "@/app/types/api-types";
import PageHeader from "@/app/components/shared/PageHeader";
import StatusBadge from "@/app/components/shared/StatusBadge";
import { StatCard, StatGrid } from "@/app/components/shared/StatCard";
import TableToolbar from "@/app/components/shared/TableToolbar";
import { DataTable, DataTableColumn } from "@/app/components/shared/DataTable";

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

    const handleViewMatching = (invoiceId: string) => {
        router.push(`/invoices/${invoiceId}`);
    };

    const columns: DataTableColumn<InvoiceWithDetails>[] = [
        {
            label: "Số hóa đơn", key: "invoiceNumber", sortable: true,
            render: (inv) => (
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#2563EB]/10 flex items-center justify-center shrink-0">
                        <FileText size={18} className="text-[#2563EB]" />
                    </div>
                    <p className="font-bold text-slate-900">{inv.invoiceNumber}</p>
                </div>
            ),
        },
        {
            label: "Nhà cung cấp",
            render: (inv) => (
                <div>
                    <span className="font-medium text-slate-900">{inv.supplier?.name || inv.vendor}</span>
                    {inv.supplier?.code && <p className="text-xs text-slate-500">{inv.supplier.code}</p>}
                </div>
            ),
        },
        {
            label: "PO liên quan", hideOnMobile: true,
            render: (inv) => (
                <span className="text-xs font-black text-slate-900 uppercase tracking-tight bg-white px-2 py-1 rounded border border-slate-200">
                    {inv.po?.poNumber || "PO-***"}
                </span>
            ),
        },
        {
            label: "Số tiền", align: "right", key: "totalAmount", sortable: true,
            render: (inv) => (
                <div>
                    <span className="font-black text-slate-900">{formatVND(Number(inv.totalAmount || inv.amount || 0))}</span>
                    <p className="text-xs text-slate-500">{inv.currency}</p>
                </div>
            ),
        },
        {
            label: "Trạng thái", align: "center",
            render: (inv) => (
                <div className="flex flex-col items-center gap-1">
                    <StatusBadge status={inv.status} size="sm" />
                    {inv.exceptionReason && (
                        <span className="text-[10px] text-rose-600 font-bold" title={inv.exceptionReason}>⚠️ Lỗi đối soát</span>
                    )}
                </div>
            ),
        },
        {
            label: "Ngày tạo", align: "center", hideOnMobile: true,
            render: (inv) => <span className="text-sm text-slate-900">{formatDate(inv.invoiceDate ?? inv.createdAt)}</span>,
        },
        {
            label: "Thao tác", align: "right",
            render: (inv) => (
                <button
                    onClick={() => handleViewMatching(inv.id)}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-[#2563EB]/10 hover:bg-[#2563EB]/20 text-[#2563EB] rounded-lg text-xs font-bold transition-colors border border-[#2563EB]/20"
                >
                    <FileCheck size={14} />
                    {inv.status === "SUBMITTED" || inv.status === "PENDING" || inv.status === "MATCHING" ? "Đối soát" : "Xem chi tiết"}
                    <ArrowRight size={14} />
                </button>
            ),
        },
    ];

    const statusOptions = [
        { value: "ALL", label: "Tất cả trạng thái" },
        { value: "SUBMITTED", label: "Chờ đối soát" },
        { value: "MATCHING", label: "Đang đối soát" },
        { value: "MATCHED", label: "Đã đối soát" },
        { value: "APPROVED", label: "Đã duyệt" },
        { value: "AUTO_APPROVED", label: "Tự động duyệt" },
        { value: "PAID", label: "Đã thanh toán" },
        { value: "EXCEPTION_REVIEW", label: "Lỗi đối soát" },
        { value: "REJECTED", label: "Từ chối" },
    ];

    return (
        <div className="animate-in fade-in duration-500">

            <PageHeader
                icon={FileText}
                iconColor="blue"
                title="Quản lý Hóa đơn"
                subtitle="Danh sách hóa đơn chờ đối soát và thanh toán."
            />

            {/* Stats */}
            <StatGrid cols={4} className="mb-6">
                <StatCard icon={FileText} label="Tổng hóa đơn" value={invoices.length} tone="blue" />
                <StatCard icon={Clock} label="Chờ đối soát" value={invoicesWithDetails.filter((i: InvoiceWithDetails) => i.status === "SUBMITTED" || i.status === "PENDING" || i.status === "MATCHING").length} tone="amber" />
                <StatCard icon={AlertCircle} label="Lỗi đối soát" value={invoicesWithDetails.filter((i: InvoiceWithDetails) => i.status === "EXCEPTION_REVIEW").length} tone="rose" />
                <StatCard icon={CreditCard} label="Tổng giá trị" value={formatVND(invoicesWithDetails.reduce((sum, i: InvoiceWithDetails) => sum + Number(i.totalAmount || i.amount || 0), 0))} tone="emerald" />
            </StatGrid>

            {/* Toolbar + Table */}
            <div className="erp-card table-card p-4 space-y-4">
                <TableToolbar
                    search={searchTerm}
                    onSearchChange={setSearchTerm}
                    searchPlaceholder="Tìm theo số hóa đơn, nhà cung cấp, PO..."
                    filters={
                        <select
                            className="h-10 px-3 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-900 focus:outline-none focus:border-blue-500/50 transition-all cursor-pointer"
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                        >
                            {statusOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                        </select>
                    }
                />
                <DataTable
                    columns={columns}
                    data={filteredInvoices}
                    pageSize={12}
                    getRowKey={(inv) => inv.id}
                    emptyMessage="Không có hóa đơn nào"
                    emptyDescription="Hóa đơn sẽ xuất hiện tại đây"
                />
            </div>
        </div>
    );
}

