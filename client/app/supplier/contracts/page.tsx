"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useProcurement, Contract } from "../../context/ProcurementContext";
import { useContractNotifications } from "../../hooks/useWebSocket";
import {
    FileText,
    Eye,
    CheckCircle2,
    Clock,
    XCircle,
    Search,
    Filter,
    ShieldCheck,
    AlertCircle,
    Calendar,
    DollarSign,
    Building2,
    Bell,
    PenTool,
    X,
    CheckCircle,
    Signature,
    RefreshCw
} from "lucide-react";
import { ContractStatus } from "../../types/api-types";
import ContractSignModal from "../../components/ContractSignModal";

const STATUS_CONFIG: Record<string, { label: string; bg: string; text: string; border: string; icon: React.ReactNode }> = {
    ACTIVE: {
        label: "Đang hiệu lực",
        bg: "bg-emerald-500/10",
        text: "text-emerald-400",
        border: "border-emerald-500/30",
        icon: <CheckCircle2 size={12}/>
    },
    PENDING_APPROVAL: {
        label: "Chờ duyệt",
        bg: "bg-blue-500/10",
        text: "text-blue-400",
        border: "border-blue-500/30",
        icon: <Signature size={12}/>
    },
    DRAFT: {
        label: "Bản nháp",
        bg: "bg-slate-500/10",
        text: "text-slate-400",
        border: "border-slate-500/30",
        icon: <FileText size={12}/>
    },
    EXPIRED: {
        label: "Hết hạn",
        bg: "bg-orange-500/10",
        text: "text-orange-400",
        border: "border-orange-500/30",
        icon: <AlertCircle size={12}/>
    },
    TERMINATED: {
        label: "Đã chấm dứt",
        bg: "bg-rose-500/10",
        text: "text-rose-400",
        border: "border-rose-500/30",
        icon: <XCircle size={12}/>
    }
};

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

    // Load supplier contracts
    useEffect(() => {
        if (supplierId) {
            loadContracts();
        }
    }, [supplierId]);

    const loadContracts = async () => {
        const data = await fetchContractsBySupplier(supplierId);
        if (data) {
            setSupplierContracts(data);
        }
    };

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

    const getStatusBadge = (status: ContractStatus) => {
        const config = STATUS_CONFIG[status] || STATUS_CONFIG.DRAFT;
        return (
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold border ${config.bg} ${config.text} ${config.border}`}>
                {config.icon}
                {config.label}
            </span>
        );
    };

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
            case "success": return <CheckCircle2 size={16} className="text-emerald-400" />;
            case "warning": return <AlertCircle size={16} className="text-amber-400" />;
            case "error": return <XCircle size={16} className="text-rose-400" />;
            default: return <Bell size={16} className="text-blue-400" />;
        }
    };

    return (
        <main className="animate-in fade-in duration-500 p-6 min-h-screen bg-[#0F1117]">
            {/* Header */}
            <div className="mt-4 mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-black text-[#F8FAFC] tracking-tight">Quản lý Hợp đồng</h1>
                    <p className="text-sm text-[#94A3B8] mt-1">Xem và ký các hợp đồng thu mua từ khách hàng</p>
                </div>
                <div className="flex items-center gap-3">
                    {/* WebSocket Status */}
                    <div className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-bold border ${
                        isConnected
                            ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                            : "bg-rose-500/10 text-rose-400 border-rose-500/30"
                    }`}>
                        <div className={`h-2 w-2 rounded-full ${isConnected ? "bg-emerald-400 animate-pulse" : "bg-rose-400"}`} />
                        {isConnected ? "Realtime" : "Offline"}
                    </div>

                    {/* Notification Bell */}
                    <button
                        onClick={() => setIsNotificationModalOpen(true)}
                        className="relative inline-flex items-center justify-center h-10 w-10 rounded-xl bg-[#161922] text-[#64748B] hover:text-[#3B82F6] hover:bg-[#3B82F6]/10 border border-[rgba(148,163,184,0.1)] transition-all"
                    >
                        <Bell size={20} />
                        {unreadCount > 0 && (
                            <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-rose-500 text-white text-[10px] font-black flex items-center justify-center">
                                {unreadCount}
                            </span>
                        )}
                    </button>

                    <button
                        onClick={loadContracts}
                        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#161922] text-[#64748B] hover:text-[#F8FAFC] border border-[rgba(148,163,184,0.1)] font-bold transition-all"
                    >
                        <RefreshCw size={18} />
                    </button>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                {[
                    { label: "Tổng hợp đồng", value: supplierContracts.length, icon: FileText, color: "text-blue-400", bg: "bg-blue-500/10" },
                    { label: "Đang hiệu lực", value: supplierContracts.filter(c => c.status === "ACTIVE").length, icon: CheckCircle2, color: "text-emerald-400", bg: "bg-emerald-500/10" },
                    { label: "Chờ duyệt", value: supplierContracts.filter(c => c.status === "PENDING_APPROVAL").length, icon: Signature, color: "text-blue-400", bg: "bg-blue-500/10" },
                    { label: "Sắp hết hạn", value: supplierContracts.filter(c => c.status === "EXPIRED").length, icon: AlertCircle, color: "text-orange-400", bg: "bg-orange-500/10" }
                ].map((stat, idx) => (
                    <div key={idx} className="bg-[#161922] rounded-xl p-4 border border-[rgba(148,163,184,0.1)]">
                        <div className="flex items-center gap-3">
                            <div className={`h-10 w-10 rounded-lg ${stat.bg} flex items-center justify-center`}>
                                <stat.icon className={stat.color} size={20} />
                            </div>
                            <div>
                                <p className="text-[10px] font-black uppercase tracking-wider text-[#64748B]">{stat.label}</p>
                                <p className="text-xl font-black text-[#F8FAFC]">{stat.value}</p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Filters */}
            <div className="bg-[#161922] p-4 rounded-xl border border-[rgba(148,163,184,0.1)] shadow-xl shadow-[#3B82F6]/5 mb-6">
                <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex-1 relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#64748B]" size={18} />
                        <input
                            type="text"
                            placeholder="Tìm theo số hợp đồng, tiêu đề, khách hàng..."
                            className="w-full pl-11 pr-4 py-3 bg-[#0F1117] border border-[rgba(148,163,184,0.1)] rounded-xl text-sm font-bold text-[#F8FAFC] placeholder:text-[#64748B] focus:outline-none focus:border-[#3B82F6]/50 focus:bg-[#161922] transition-all"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div className="flex items-center gap-3">
                        <Filter size={18} className="text-[#64748B]" />
                        <select
                            className="bg-[#0F1117] border border-[rgba(148,163,184,0.1)] rounded-xl px-4 py-3 text-sm font-bold text-[#F8FAFC] focus:outline-none focus:border-[#3B82F6]/50 focus:bg-[#161922] transition-all min-w-[160px]"
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                        >
                            <option value="ALL">Tất cả trạng thái</option>
                            <option value={ContractStatus.PENDING_APPROVAL}>Chờ duyệt</option>
                            <option value={ContractStatus.ACTIVE}>Đang hiệu lực</option>
                            <option value={ContractStatus.EXPIRED}>Hết hạn</option>
                            <option value={ContractStatus.TERMINATED}>Đã chấm dứt</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Table */}
            <div className="bg-[#161922] rounded-2xl border border-[rgba(148,163,184,0.1)] shadow-xl shadow-[#3B82F6]/5 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="erp-table text-xs">
                        <thead className="bg-[#0F1117] border-b border-[rgba(148,163,184,0.1)]">
                            <tr>
                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-[#64748B]">Số hợp đồng</th>
                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-[#64748B]">Tiêu đề / Khách hàng</th>
                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-[#64748B] text-center">Giá trị</th>
                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-[#64748B]">Thời hạn</th>
                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-[#64748B]">Trạng thái</th>
                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-[#64748B] text-right">Thao tác</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[rgba(148,163,184,0.1)]">
                            {filteredContracts.length > 0 ? filteredContracts.map((c) => (
                                <tr key={c.id} className="hover:bg-[rgba(59,130,246,0.05)] transition-colors group">
                                    <td className="px-6 py-4">
                                        <span className="font-bold text-[#3B82F6]">#{c.contractNumber}</span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="font-bold text-[#F8FAFC]">{c.title}</div>
                                        <div className="flex items-center gap-1 text-xs text-[#64748B] mt-1">
                                            <Building2 size={12} />
                                            {c.organization?.name || "N/A"}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <div className="font-bold text-[#F8FAFC]">
                                            {new Intl.NumberFormat('vi-VN').format(c.totalValue || 0)} {c.currency || 'VND'}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2 text-sm text-[#94A3B8]">
                                            <Calendar size={14} className="text-[#64748B]" />
                                            <div>
                                                <div className="text-[#F8FAFC]">{new Date(c.startDate).toLocaleDateString('vi-VN')}</div>
                                                <div className="text-[#64748B] text-xs">- {new Date(c.endDate).toLocaleDateString('vi-VN')}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">{getStatusBadge(c.status)}</td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <button
                                                onClick={() => openDetailModal(c)}
                                                className="inline-flex items-center justify-center h-9 w-9 rounded-lg bg-[#0F1117] text-[#64748B] hover:text-[#3B82F6] hover:bg-[#3B82F6]/10 border border-[rgba(148,163,184,0.1)] hover:border-[#3B82F6]/30 transition-all"
                                                title="Xem chi tiết"
                                            >
                                                <Eye size={18} />
                                            </button>

                                            {c.status === ContractStatus.PENDING_APPROVAL && (
                                                <button
                                                    onClick={() => openSignModal(c)}
                                                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-blue-500 hover:bg-blue-600 text-white font-bold text-xs border border-blue-500/30 transition-all shadow-lg shadow-blue-500/20"
                                                    title="Phê duyệt hợp đồng"
                                                >
                                                    <PenTool size={14} />
                                                    Phê duyệt
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan={6} className="px-6 py-16 text-center">
                                        {loadingMyPrs ? (
                                            <div className="flex items-center justify-center gap-2 text-[#94A3B8]">
                                                <Clock size={18} className="animate-spin" />
                                                <span>Đang tải dữ liệu...</span>
                                            </div>
                                        ) : (
                                            <div className="text-[#64748B]">
                                                <FileText className="mx-auto h-12 w-12 mb-3 opacity-30" />
                                                <p className="font-medium">Không tìm thấy hợp đồng nào</p>
                                                <p className="text-sm mt-1">Thử điều chỉnh bộ lọc hoặc tìm kiếm với từ khóa khác</p>
                                            </div>
                                        )}
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
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
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0F1117]/90 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-[#161922] rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl border border-[rgba(148,163,184,0.1)]">
                        {/* Header */}
                        <div className="sticky top-0 flex justify-between items-center p-6 border-b border-[rgba(148,163,184,0.1)] bg-[#161922] z-10">
                            <div>
                                <h2 className="text-xl font-black text-[#F8FAFC]">Chi tiết hợp đồng</h2>
                                <p className="text-sm text-[#64748B] mt-1">#{selectedContract.contractNumber}</p>
                            </div>
                            <button
                                onClick={() => setIsDetailModalOpen(false)}
                                className="p-2 hover:bg-[#1A1D23] rounded-lg transition-colors"
                            >
                                <X size={20} className="text-[#64748B]" />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="p-6 space-y-6">
                            {/* Status */}
                            <div className="flex items-center justify-between p-4 rounded-xl bg-[#0F1117] border border-[rgba(148,163,184,0.1)]">
                                <span className="text-sm font-bold text-[#94A3B8]">Trạng thái</span>
                                {getStatusBadge(selectedContract.status)}
                            </div>

                            {/* Info Grid */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-4 rounded-xl bg-[#0F1117] border border-[rgba(148,163,184,0.1)]">
                                    <span className="text-[10px] font-black uppercase text-[#64748B] block mb-1">Tiêu đề</span>
                                    <p className="font-bold text-[#F8FAFC]">{selectedContract.title}</p>
                                </div>
                                <div className="p-4 rounded-xl bg-[#0F1117] border border-[rgba(148,163,184,0.1)]">
                                    <span className="text-[10px] font-black uppercase text-[#64748B] block mb-1">Khách hàng</span>
                                    <p className="font-bold text-[#F8FAFC]">{selectedContract.organization?.name || "N/A"}</p>
                                </div>
                                <div className="p-4 rounded-xl bg-[#0F1117] border border-[rgba(148,163,184,0.1)]">
                                    <span className="text-[10px] font-black uppercase text-[#64748B] block mb-1">Giá trị</span>
                                    <p className="font-bold text-emerald-400">{new Intl.NumberFormat('vi-VN').format(selectedContract.totalValue || 0)} {selectedContract.currency}</p>
                                </div>
                                <div className="p-4 rounded-xl bg-[#0F1117] border border-[rgba(148,163,184,0.1)]">
                                    <span className="text-[10px] font-black uppercase text-[#64748B] block mb-1">Ngày tạo</span>
                                    <p className="font-bold text-[#F8FAFC]">{new Date(selectedContract.createdAt || Date.now()).toLocaleDateString('vi-VN')}</p>
                                </div>
                            </div>

                            {/* Date Range */}
                            <div className="p-4 rounded-xl bg-[#0F1117] border border-[rgba(148,163,184,0.1)]">
                                <span className="text-[10px] font-black uppercase text-[#64748B] block mb-3">Thời hạn hợp đồng</span>
                                <div className="flex items-center gap-4">
                                    <div className="flex-1 p-3 rounded-lg bg-[#161922] border border-[rgba(148,163,184,0.1)]">
                                        <span className="text-xs text-[#64748B] block">Ngày bắt đầu</span>
                                        <span className="font-bold text-[#F8FAFC]">{new Date(selectedContract.startDate).toLocaleDateString('vi-VN')}</span>
                                    </div>
                                    <div className="text-[#64748B]">→</div>
                                    <div className="flex-1 p-3 rounded-lg bg-[#161922] border border-[rgba(148,163,184,0.1)]">
                                        <span className="text-xs text-[#64748B] block">Ngày kết thúc</span>
                                        <span className="font-bold text-[#F8FAFC]">{new Date(selectedContract.endDate).toLocaleDateString('vi-VN')}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Description */}
                            {selectedContract.description && (
                                <div className="p-4 rounded-xl bg-[#0F1117] border border-[rgba(148,163,184,0.1)]">
                                    <span className="text-[10px] font-black uppercase text-[#64748B] block mb-2">Mô tả</span>
                                    <p className="text-sm text-[#94A3B8]">{selectedContract.description}</p>
                                </div>
                            )}

                            {/* Actions */}
                            <div className="flex gap-3 pt-4 border-t border-[rgba(148,163,184,0.1)]">
                                <button
                                    onClick={() => setIsDetailModalOpen(false)}
                                    className="flex-1 px-4 py-3 rounded-xl bg-[#0F1117] text-[#64748B] font-bold text-sm hover:text-[#F8FAFC] transition-all border border-[rgba(148,163,184,0.1)]"
                                >
                                    Đóng
                                </button>
                                {selectedContract.status === ContractStatus.PENDING_APPROVAL && (
                                    <button
                                        onClick={() => {
                                            setIsDetailModalOpen(false);
                                            setSignTarget(selectedContract);
                                        }}
                                        className="flex-1 px-4 py-3 rounded-xl bg-blue-500 hover:bg-blue-600 text-white font-bold text-sm transition-all shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2"
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
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0F1117]/90 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-[#161922] rounded-2xl w-full max-w-md max-h-[80vh] overflow-hidden shadow-2xl border border-[rgba(148,163,184,0.1)]">
                        {/* Header */}
                        <div className="flex justify-between items-center p-4 border-b border-[rgba(148,163,184,0.1)] bg-[#0F1117]">
                            <div className="flex items-center gap-3">
                                <div className="h-8 w-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-400">
                                    <Bell size={16} />
                                </div>
                                <div>
                                    <h2 className="font-black text-[#F8FAFC]">Thông báo</h2>
                                    <p className="text-xs text-[#64748B]">{unreadCount} chưa đọc</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={markAllAsRead}
                                    className="text-xs font-bold text-[#64748B] hover:text-[#F8FAFC] transition-colors"
                                >
                                    Đánh dấu đã đọc
                                </button>
                                <button
                                    onClick={() => setIsNotificationModalOpen(false)}
                                    className="p-2 hover:bg-[#1A1D23] rounded-lg transition-colors"
                                >
                                    <X size={18} className="text-[#64748B]" />
                                </button>
                            </div>
                        </div>

                        {/* Notification List */}
                        <div className="overflow-y-auto max-h-[60vh]">
                            {notifications.length > 0 ? (
                                notifications.map((notification) => (
                                    <div
                                        key={notification.id}
                                        className={`p-4 border-b border-[rgba(148,163,184,0.1)] hover:bg-[#0F1117]/50 transition-colors ${!notification.read ? 'bg-[#3B82F6]/5' : ''}`}
                                    >
                                        <div className="flex items-start gap-3">
                                            {getNotificationIcon(notification.type)}
                                            <div className="flex-1 min-w-0">
                                                <p className={`text-sm font-bold ${!notification.read ? 'text-[#F8FAFC]' : 'text-[#94A3B8]'}`}>
                                                    {notification.title}
                                                </p>
                                                <p className="text-xs text-[#64748B] mt-1">{notification.message}</p>
                                                <p className="text-[10px] text-[#64748B] mt-2">
                                                    {new Date(notification.createdAt).toLocaleString('vi-VN')}
                                                </p>
                                            </div>
                                            {!notification.read && (
                                                <div className="h-2 w-2 rounded-full bg-blue-400 shrink-0 mt-1.5" />
                                            )}
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="p-8 text-center">
                                    <Bell size={40} className="mx-auto text-[#64748B] opacity-30 mb-3" />
                                    <p className="text-sm text-[#64748B]">Chưa có thông báo nào</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </main>
    );
}
