"use client";

import React from "react";
import { useProcurement } from "@/app/context/ProcurementContext";
import { History, FolderTree, CheckCircle } from "lucide-react";
import PageHeader from "../../components/shared/PageHeader";
import { formatDateTime } from "../../utils/formatUtils";
import { DataTable, DataTableColumn } from "../../components/shared/DataTable";
import StatusBadge from "../../components/shared/StatusBadge";

export default function ApprovalHistoryPage() {
    const { approvals } = useProcurement();
    type ApprovalRecord = (typeof approvals)[number];

    const columns: DataTableColumn<ApprovalRecord>[] = [
        {
            label: "Loại",
            render: (item) => (
                <span className={`px-2 py-1 rounded-md text-[10px] font-black tracking-widest uppercase border ${item.documentType === "PURCHASE_REQUISITION" ? 'bg-amber-500/10 text-amber-700 border-amber-500/20' : 'bg-[#2563EB]/10 text-[#2563EB] border-[#2563EB]/20'}`}>
                    {item.documentType === "PURCHASE_REQUISITION" ? 'Yêu cầu mua hàng' : 'Đơn đặt hàng'}
                </span>
            ),
        },
        { label: "Mã chứng từ", render: (item) => <span className="font-bold text-slate-900">{item.id}</span> },
        { label: "Tiêu đề", hideOnMobile: true, render: (item) => <span className="font-medium text-slate-900">{item.documentType}</span> },
        { label: "Quyết định", render: (item) => <StatusBadge status={item.status} size="sm" /> },
        { label: "Ngày duyệt", align: "center", hideOnMobile: true, render: (item) => <span className="text-[11px] font-bold text-slate-900 num-display">{formatDateTime(item.createdAt)}</span> },
        { label: "Ghi chú", hideOnMobile: true, render: (item) => <span className="text-xs text-slate-500 italic">{item.status === 'APPROVED' ? 'Hồ sơ đã được phê duyệt thành công' : item.status === 'REJECTED' ? 'Hồ sơ đã bị từ chối' : 'Đang chờ xử lý'}</span> },
    ];
    return (
        <main className="animate-in fade-in duration-500 p-6 min-h-screen bg-[#F8FAFC] text-slate-900">
            <header>
                <PageHeader
                    icon={History}
                    iconColor="purple"
                    title="Lịch sử phê duyệt"
                    subtitle="Toàn bộ hồ sơ các quyết định phê duyệt của bạn."
                    actions={
                        <div className="flex bg-[#F1F5F9] rounded-2xl border border-slate-200 p-1 shadow-sm">
                            <button className="px-4 py-2 text-[10px] font-black uppercase tracking-widest text-white bg-[#2563EB] rounded-xl transition-all shadow-sm">Hôm nay</button>
                            <button className="px-4 py-2 text-[0.6875rem] font-bold uppercase tracking-widest text-[#64748B] hover:text-slate-900 transition-all">Tuần này</button>
                            <button className="px-4 py-2 text-[0.6875rem] font-bold uppercase tracking-widest text-[#64748B] hover:text-slate-900 transition-all">Tháng này</button>
                        </div>
                    }
                />
            </header>

            {/* Filter Bar */}
            <div className="bg-[#F1F5F9] p-6 rounded-xl border border-slate-200 mb-8 shadow-2xl shadow-[#2563EB]/5 flex flex-wrap gap-6 items-end">
                <div className="flex-1 min-w-[200px]">
                    <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-[#2563EB] mb-3 leading-none">Loại chứng từ</label>
                    <div className="relative">
                        <FolderTree size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#2563EB]" />
                        <select className="w-full h-14 bg-[#FFFFFF] border border-slate-200 rounded-xl pl-12 pr-10 text-sm font-bold text-slate-900 focus:outline-none focus:border-[#2563EB] focus:ring-4 focus:ring-[#2563EB]/5 transition-all appearance-none cursor-pointer">
                            <option value="ALL">Tất cả chứng từ</option>
                            <option value="PURCHASE_REQUISITION">Yêu cầu mua hàng (PR)</option>
                            <option value="PURCHASE_ORDER">Đơn đặt hàng (PO)</option>
                        </select>
                    </div>
                </div>

                <div className="flex-1 min-w-[200px]">
                    <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-[#2563EB] mb-3 leading-none">Quyết định</label>
                    <div className="relative">
                        <CheckCircle size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#2563EB]" />
                        <select className="w-full h-14 bg-[#FFFFFF] border border-slate-200 rounded-xl pl-12 pr-10 text-sm font-bold text-slate-900 focus:outline-none focus:border-[#2563EB] focus:ring-4 focus:ring-[#2563EB]/5 transition-all appearance-none cursor-pointer">
                            <option value="ALL">Tất cả trạng thái</option>
                            <option value="APPROVED">Đã phê duyệt</option>
                            <option value="REJECTED">Đã từ chối</option>
                        </select>
                    </div>
                </div>

                <button className="bg-[#2563EB] text-white h-14 flex items-center justify-center px-10 rounded-xl font-black uppercase tracking-widest text-[11px] shadow-xl shadow-[#2563EB]/20 cursor-pointer hover:bg-[#1D4ED8] transition-all active:scale-95 border-none">
                    Áp dụng bộ lọc
                </button>
            </div>

            {/* History Table */}
            <div className="erp-card table-card p-4">
                <DataTable
                    columns={columns}
                    data={approvals ?? []}
                    pageSize={12}
                    getRowKey={(item) => item.id}
                    emptyMessage="Chưa có lịch sử phê duyệt"
                    emptyDescription="Các quyết định phê duyệt sẽ xuất hiện tại đây"
                />
            </div>
        </main>
    );
}

