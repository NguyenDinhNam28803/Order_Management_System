"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useProcurement, Contract } from "../../context/ProcurementContext";
import { useContractNotifications } from "../../hooks/useWebSocket";
import {
    FileText,
    Eye,
    CheckCircle2,
    XCircle,
    AlertCircle,
    Calendar,
    Building2,
    Bell,
    PenTool,
    Signature,
    RefreshCw,
    Scroll,
    X
} from "lucide-react";
import PageHeader from "../../components/shared/PageHeader";
import { ContractStatus } from "../../types/api-types";
import { convertPrismaDecimal } from "../../utils/formatUtils";
import ContractSignModal from "../../components/ContractSignModal";
import { DataTable, DataTableColumn } from "../../components/shared/DataTable";
import TableToolbar from "../../components/shared/TableToolbar";
import { StatCard, StatGrid } from "../../components/shared/StatCard";
import StatusBadge from "../../components/shared/StatusBadge";

// Notification type
interface ContractNotification {
    id: string;
    contractId: string;
    title: string;
    message: string;
    type: "info" | "warning" | "success" | "error";
    read: boolean;
    createdAt: string;
}

export default function SupplierContractsPage() {
    const { currentUser, contracts, loadingMyPrs, fetchContractsBySupplier, signContract, notify } = useProcurement();
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState<string>("ALL");
    const [supplierContracts, setSupplierContracts] = useState<Contract[]>([]);
    const [selectedContract, setSelectedContract] = useState<Contract | null>(null);
    const [signTarget, setSignTarget] = useState<Contract | null>(null);
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
    const [isNotificationModalOpen, setIsNotificationModalOpen] = useState(false);
    const [notifications, setNotifications] = useState<ContractNotification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);

    const supplierId = currentUser?.orgId || currentUser?.id || "";

    const loadContracts = useCallback(async () => {
        if (supplierId) {
            const data = await fetchContractsBySupplier(supplierId);
            if (data) {
                setSupplierContracts(data);
            }
        }
    }, [supplierId, fetchContractsBySupplier]);

    // Load supplier contracts
    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        loadContracts();
    }, [loadContracts]);


    // WebSocket for real-time notifications
    const handleNotification = useCallback((data: unknown) => {
        const notification = data as ContractNotification;
        setNotifications(prev => [notification, ...prev]);
        setUnreadCount(prev => prev + 1);
        notify(notification.message, notification.type);
    }, [notify]);

    const { status: wsStatus, isConnected } = useContractNotifications(supplierId, handleNotification);

    // Filter contracts
    const filteredContracts = supplierContracts.filter(c => {
        const matchSearch = c.contractNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          c.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          c.supplier?.name?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchStatus = statusFilter === "ALL" || c.status === statusFilter;
        return matchSearch && matchStatus;
    });

    const columns: DataTableColumn<Contract>[] = [
        {
            label: "Số hợp đồng", key: "contractNumber", sortable: true,
            render: (c) => <span className="font-bold text-[#2563EB] num-display">#{c.contractNumber}</span>,
        },
        {
            label: "Tiêu đề / Khách hàng",
            render: (c) => (
                <div>
                    <div className="font-bold text-slate-900">{c.title}</div>
                    <div className="flex items-center gap-1 text-xs text-slate-500 mt-1"><Building2 size={12} />{c.organization?.name || "N/A"}</div>
                </div>
            ),
        },
        {
            label: "Giá trị", align: "right",
            render: (c) => <span className="font-bold text-slate-900 num-display">{new Intl.NumberFormat('vi-VN').format(convertPrismaDecimal(c.totalValue))} {c.currency || 'VND'}</span>,
        },
        {
            label: "Thời hạn", hideOnMobile: true,
            render: (c) => (
                <div className="flex items-center gap-2 text-sm">
                    <Calendar size={14} className="text-slate-400 shrink-0" />
                    <div className="num-display">
                        <div className="text-slate-900">{c.startDate ? new Date(c.startDate).toLocaleDateString('vi-VN') : "—"}</div>
                        <div className="text-slate-500 text-xs">- {c.endDate ? new Date(c.endDate).toLocaleDateString('vi-VN') : "—"}</div>
                    </div>
                </div>
            ),
        },
        { label: "Trạng thái", render: (c) => <StatusBadge status={c.status} size="sm" /> },
        {
            label: "Thao tác", align: "right",
            render: (c) => (
                <div className="flex items-center justify-end gap-2">
                    <button onClick={() => openDetailModal(c)} className="inline-flex items-center justify-center h-9 w-9 rounded-lg bg-white text-slate-900 hover:text-[#2563EB] hover:bg-[#2563EB]/10 border border-slate-200 hover:border-[#2563EB]/30 transition-all" title="Xem chi tiết">
                        <Eye size={16} />
                    </button>
                    {c.status === ContractStatus.PENDING_APPROVAL && (
                        <button onClick={() => openSignModal(c)} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-bold text-xs transition-all" title="Phê duyệt hợp đồng">
                            <PenTool size={14} /> Phê duyệt
                        </button>
                    )}
                </div>
            ),
        },
    ];

    const openSignModal = (contract: Contract) => {
        setSignTarget(contract);
    };

    const openDetailModal = (contract: Contract) => {
        setSelectedContract(contract);
        setIsDetailModalOpen(true);
    };

    const markAllAsRead = () => {
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
        setUnreadCount(0);
    };

    const getNotificationIcon = (type: string) => {
        switch (type) {
            case "success": return <CheckCircle2 size={16} className="text-emerald-600" />;
            case "warning": return <AlertCircle size={16} className="text-amber-600" />;
            case "error": return <XCircle size={16} className="text-rose-600" />;
            default: return <Bell size={16} className="text-[#3B82F6]" />;
        }
    };

    return (
        <main className="animate-in fade-in duration-500 p-6 min-h-screen bg-[#F8FAFC]">
            {/* Header */}
            <div className="mt-4 mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <PageHeader
                    title="Hợp đồng & Điều khoản"
                    subtitle="Xem và ký các hợp đồng thu mua từ khách hàng"
                    icon={Scroll}
                    iconColor="purple"
                />
                <div className="flex items-center gap-3">
                    {/* WebSocket Status */}
                    <div className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-bold border ${
                        isConnected
                            ? "bg-emerald-500/10 text-emerald-700 border-emerald-500/30"
                            : "bg-rose-500/10 text-rose-700 border-rose-500/30"
                    }`}>
                        <div className={`h-2 w-2 rounded-full ${isConnected ? "bg-emerald-400 animate-pulse" : "bg-rose-400"}`} />
                        {isConnected ? "Realtime" : "Offline"}
                    </div>

                    {/* Notification Bell */}
                    <button
                        onClick={() => setIsNotificationModalOpen(true)}
                        className="relative inline-flex items-center justify-center h-10 w-10 rounded-xl bg-[#F1F5F9] text-slate-900 hover:text-[#2563EB] hover:bg-[#2563EB]/10 border border-slate-200 transition-all"
                    >
                        <Bell size={20} />
                        {unreadCount > 0 && (
                            <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-rose-500 text-white text-[0.6875rem] font-black flex items-center justify-center">
                                {unreadCount}
                            </span>
                        )}
                    </button>

                    <button
                        onClick={loadContracts}
                        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#F1F5F9] text-slate-900 hover:text-slate-900 border border-slate-200 font-bold transition-all"
                    >
                        <RefreshCw size={18} />
                    </button>
                </div>
            </div>

            {/* Stats Cards */}
            <StatGrid cols={4} className="mb-6">
                <StatCard label="Tổng hợp đồng" value={supplierContracts.length} icon={FileText} tone="blue" />
                <StatCard label="Đang hiệu lực" value={supplierContracts.filter(c => c.status === "ACTIVE").length} icon={CheckCircle2} tone="emerald" />
                <StatCard label="Chờ duyệt" value={supplierContracts.filter(c => c.status === "PENDING_APPROVAL").length} icon={Signature} tone="indigo" />
                <StatCard label="Sắp hết hạn" value={supplierContracts.filter(c => c.status === "EXPIRED").length} icon={AlertCircle} tone="amber" />
            </StatGrid>

            {/* Toolbar + Table */}
            <div className="erp-card table-card p-4 space-y-4">
                <TableToolbar
                    search={searchTerm}
                    onSearchChange={setSearchTerm}
                    searchPlaceholder="Tìm theo số hợp đồng, tiêu đề, khách hàng..."
                    filters={
                        <select
                            className="h-10 px-3 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-900 focus:outline-none focus:border-blue-500/50 transition-all cursor-pointer"
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                        >
                            <option value="ALL">Tất cả trạng thái</option>
                            <option value="ACTIVE">Đang hiệu lực</option>
                            <option value="DRAFT">Bản nháp</option>
                            <option value="EXPIRED">Đã hết hạn</option>
                            <option value="TERMINATED">Đã chấm dứt</option>
                        </select>
                    }
                />
                <DataTable
                    columns={columns}
                    data={filteredContracts}
                    pageSize={12}
                    loading={loadingMyPrs && filteredContracts.length === 0}
                    getRowKey={(c) => c.id}
                    emptyMessage="Không tìm thấy hợp đồng nào"
                    emptyDescription="Thử điều chỉnh bộ lọc hoặc tìm kiếm với từ khóa khác"
                />
            </div>

            {/* Digital Signing Modal */}
            <ContractSignModal
                contract={signTarget}
                isBuyer={false}
                signerName={currentUser?.fullName || currentUser?.name || currentUser?.email || ""}
                onClose={() => setSignTarget(null)}
                onConfirm={async (id, isBuyer) => {
                    const ok = await signContract(id, isBuyer);
                    if (ok) {
                        loadContracts();
                        const newNotification: ContractNotification = {
                            id: Date.now().toString(),
                            contractId: id,
                            title: "Ký hợp đồng thành công",
                            message: `Bạn đã ký hợp đồng thành công`,
                            type: "success",
                            read: false,
                            createdAt: new Date().toISOString(),
                        };
                        setNotifications(prev => [newNotification, ...prev]);
                    }
                    return ok;
                }}
            />

            {/* Contract Detail Modal */}
            {isDetailModalOpen && selectedContract && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#FFFFFF]/90 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-[#F1F5F9] rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200">
                        {/* Header */}
                        <div className="sticky top-0 flex justify-between items-center p-6 border-b border-slate-200 bg-[#F1F5F9] z-10">
                            <div>
                                <h2 className="text-xl font-black text-slate-900">Chi tiết hợp đồng</h2>
                                <p className="text-[0.8125rem] text-[#64748B] font-medium mt-1">#{selectedContract.contractNumber}</p>
                            </div>
                            <button
                                onClick={() => setIsDetailModalOpen(false)}
                                className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                            >
                                <X size={20} className="text-slate-900" />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="p-6 space-y-6">
                            {/* Status */}
                            <div className="flex items-center justify-between p-4 rounded-xl bg-[#FFFFFF] border border-slate-200">
                                <span className="text-sm font-bold text-slate-900">Trạng thái</span>
                                <StatusBadge status={selectedContract.status} size="sm" />
                            </div>

                            {/* Info Grid */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-4 rounded-xl bg-[#FFFFFF] border border-slate-200">
                                    <span className="text-[0.6875rem] font-black uppercase text-[#64748B] block mb-1">Tiêu đề</span>
                                    <p className="font-bold text-slate-900">{selectedContract.title}</p>
                                </div>
                                <div className="p-4 rounded-xl bg-[#FFFFFF] border border-slate-200">
                                    <span className="text-[0.6875rem] font-black uppercase text-[#64748B] block mb-1">Khách hàng</span>
                                    <p className="font-bold text-slate-900">{selectedContract.organization?.name || "N/A"}</p>
                                </div>
                                <div className="p-4 rounded-xl bg-[#FFFFFF] border border-slate-200">
                                    <span className="text-[0.6875rem] font-black uppercase text-[#64748B] block mb-1">Giá trị</span>
                                    <p className="font-bold text-black">{new Intl.NumberFormat('vi-VN').format(convertPrismaDecimal(selectedContract.totalValue))} {selectedContract.currency}</p>
                                </div>
                                <div className="p-4 rounded-xl bg-[#FFFFFF] border border-slate-200">
                                    <span className="text-[0.6875rem] font-black uppercase text-[#64748B] block mb-1">Ngày tạo</span>
                                    <p className="font-bold text-slate-900">{new Date(selectedContract.createdAt || new Date().toISOString()).toLocaleDateString('vi-VN')}</p>
                                </div>
                            </div>

                            {/* Date Range */}
                            <div className="p-4 rounded-xl bg-[#FFFFFF] border border-slate-200">
                                <span className="text-[0.6875rem] font-black uppercase text-slate-900 block mb-3">Thời hạn hợp đồng</span>
                                <div className="flex items-center gap-4">
                                    <div className="flex-1 p-3 rounded-lg bg-[#F1F5F9] border border-slate-200">
                                        <span className="text-xs text-slate-900 block">Ngày bắt đầu</span>
                                        <span className="font-bold text-slate-900">{new Date(selectedContract.startDate).toLocaleDateString('vi-VN')}</span>
                                    </div>
                                    <div className="text-slate-900">→</div>
                                    <div className="flex-1 p-3 rounded-lg bg-[#F1F5F9] border border-slate-200">
                                        <span className="text-xs text-slate-900 block">Ngày kết thúc</span>
                                        <span className="font-bold text-slate-900">{new Date(selectedContract.endDate).toLocaleDateString('vi-VN')}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Description */}
                            {selectedContract.description && (
                                <div className="p-4 rounded-xl bg-[#FFFFFF] border border-slate-200">
                                    <span className="text-[0.6875rem] font-black uppercase text-slate-900 block mb-2">Mô tả</span>
                                    <p className="text-sm text-slate-900">{selectedContract.description}</p>
                                </div>
                            )}

                            {/* Actions */}
                            <div className="flex gap-3 pt-4 border-t border-slate-200">
                                <button
                                    onClick={() => setIsDetailModalOpen(false)}
                                    className="flex-1 px-4 py-3 rounded-xl bg-[#FFFFFF] text-slate-900 font-bold text-sm hover:text-slate-900 transition-all border border-slate-200"
                                >
                                    Đóng
                                </button>
                                {selectedContract.status === ContractStatus.PENDING_APPROVAL && (
                                    <button
                                        onClick={() => {
                                            setIsDetailModalOpen(false);
                                            setSignTarget(selectedContract);
                                        }}
                                        className="flex-1 px-4 py-3 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-bold text-sm transition-all shadow-lg shadow-[#2563EB]/20 flex items-center justify-center gap-2"
                                    >
                                        <PenTool size={16} />
                                        Ký hợp đồng
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Notifications Modal */}
            {isNotificationModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#FFFFFF]/90 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-[#F1F5F9] rounded-xl w-full max-w-md max-h-[80vh] overflow-hidden shadow-2xl border border-slate-200">
                        {/* Header */}
                        <div className="flex justify-between items-center p-4 border-b border-slate-200 bg-[#FFFFFF]">
                            <div className="flex items-center gap-3">
                                <div className="h-8 w-8 rounded-lg bg-[#2563EB]/10 flex items-center justify-center text-[#3B82F6]">
                                    <Bell size={16} />
                                </div>
                                <div>
                                    <h2 className="font-black text-slate-900">Thông báo</h2>
                                    <p className="text-xs text-slate-900">{unreadCount} chưa đọc</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={markAllAsRead}
                                    className="text-xs font-bold text-slate-900 hover:text-slate-900 transition-colors"
                                >
                                    Đánh dấu đã đọc
                                </button>
                                <button
                                    onClick={() => setIsNotificationModalOpen(false)}
                                    className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                                >
                                    <X size={18} className="text-slate-900" />
                                </button>
                            </div>
                        </div>

                        {/* Notification List */}
                        <div className="overflow-y-auto max-h-[60vh]">
                            {notifications.length > 0 ? (
                                notifications.map((notification) => (
                                    <div
                                        key={notification.id}
                                        className={`p-4 border-b border-slate-200 hover:bg-[#FFFFFF]/50 transition-colors ${!notification.read ? 'bg-[#2563EB]/5' : ''}`}
                                    >
                                        <div className="flex items-start gap-3">
                                            {getNotificationIcon(notification.type)}
                                            <div className="flex-1 min-w-0">
                                                <p className={`text-sm font-bold ${!notification.read ? 'text-slate-900' : 'text-slate-900'}`}>
                                                    {notification.title}
                                                </p>
                                                <p className="text-xs text-slate-900 mt-1">{notification.message}</p>
                                                <p className="text-[0.6875rem] text-slate-900 mt-2">
                                                    {new Date(notification.createdAt).toLocaleString('vi-VN')}
                                                </p>
                                            </div>
                                            {!notification.read && (
                                                <div className="h-2 w-2 rounded-full bg-[#3B82F6] shrink-0 mt-1.5" />
                                            )}
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="p-8 text-center">
                                    <Bell size={40} className="mx-auto text-slate-900 opacity-30 mb-3" />
                                    <p className="text-sm text-slate-900">Chưa có thông báo nào</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </main>
    );
}




