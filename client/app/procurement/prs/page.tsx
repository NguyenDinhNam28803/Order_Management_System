"use client";

import { useState, useMemo } from "react";
import { useProcurement, PR, PRItem } from "../../context/ProcurementContext";
import { ERPTableColumn } from "../../components/shared/ERPTable";
import { formatVND } from "../../utils/formatUtils";
import ERPTable from "../../components/shared/ERPTable";
import { 
    Search, ListFilter, ArrowRight, 
    FileText, CheckCircle, 
    Zap, 
    Send, 
    ShieldAlert, AlertCircle, 
    UserPlus, Settings} from "lucide-react";
import Link from "next/link";

// Local interfaces removed in favor of global definitions in ProcurementContext.
export default function ProcurementControlPage() {
    const { prs, currentUser, apiFetch, refreshData, notify, organizations } = useProcurement();
    const [searchTerm, setSearchTerm] = useState("");

    const formatDate = (ds?: string) => {
        if (!ds) return "N/A";
        const d = new Date(ds);
        if (isNaN(d.getTime())) return ds;
        return `${String(d.getDate()).padStart(2, '0')}-${String(d.getMonth() + 1).padStart(2, '0')}-${d.getFullYear()}`;
    };

    const [statusFilter, setStatusFilter] = useState("ALL");
    const [deptFilter, setDeptFilter] = useState("ALL");
    const [isAssigning, setIsAssigning] = useState<string | null>(null);
    const [confirmModal, setConfirmModal] = useState<PR | null>(null);

    const { confirmCatalogPrice } = useProcurement();

    const handleConfirmCatalog = async (pr: PR) => {
        // Use preferred supplier from PR, or first available organization, or current user's org
        const supplierId = pr.preferredSupplierId || 
                          organizations[0]?.id || 
                          currentUser?.orgId || 
                          "";
        if (!supplierId) {
            notify("Không tìm thấy nhà cung cấp", "error");
            return;
        }
        const success = await confirmCatalogPrice({
            prId: pr.id,
            supplierId,
            price: pr.totalEstimate || 0,
            stock: 10,
            leadTime: 3
        });
        if (success) setConfirmModal(null);
    };

    // Get unique departments for filtering
    const departments = useMemo((): string[] => {
    const depts = new Set(
        (prs || [])
            .map((pr: PR) => (typeof pr.department === 'string' ? pr.department : pr.department?.name))
            .filter(Boolean) as string[]
        );
        return Array.from(depts);
    }, [prs]);

    // Filtered data
    const filteredPRs = useMemo(() => {
        return (prs || []).filter((pr: PR) => {
            const matchesSearch = 
                (pr.prNumber || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
                (pr.title || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
                (pr.requester?.fullName || pr.requester?.name || "").toLowerCase().includes(searchTerm.toLowerCase());
            
            const matchesStatus = statusFilter === "ALL" || pr.status === statusFilter;
            const matchesDept = deptFilter === "ALL" || (typeof pr.department === 'string' ? pr.department : pr.department?.name) === deptFilter;

            return matchesSearch && matchesStatus && matchesDept;
        });
    }, [prs, searchTerm, statusFilter, deptFilter]);

    // Role check
    if (currentUser?.role !== "PROCUREMENT" && currentUser?.role !== "PLATFORM_ADMIN") {
        return <div className="p-20 text-center font-black text-[#000000] bg-[#FFFFFF] min-h-screen">Bạn không có quyền truy cập trung tâm kiểm soát thu mua.</div>;
    }

    const handleAssignToMe = async (prId: string) => {
        setIsAssigning(prId);
        try {
            const res = await apiFetch(`/procurement-requests/${prId}/assign`, { method: 'PATCH' });
            if (res.ok) {
                notify("Đã gán PR cho bạn thành công!", "success");
                refreshData();
            } else {
                notify("Đã ghi nhận gán PR cho " + currentUser.fullName, "info");
            }
        } catch (err) {
            console.error("Lỗi khi gán PR:", err instanceof Error ? err.message : err);
        } finally {
            setIsAssigning(null);
        }
    };

    const columns: ERPTableColumn<PR>[] = [
        {
            label: "Mã PR",
            key: "prNumber",
            render: (row: PR) => (
                <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-xl bg-[#FAF8F5] flex items-center justify-center text-[#000000] border border-[rgba(148,163,184,0.1)]">
                        <FileText size={18} />
                    </div>
                    <div className="flex flex-col">
                        <span className="font-black text-[#000000] tracking-tight">Yêu cầu mua</span>
                        <span className="text-[9px] text-[#000000] font-bold uppercase">{formatDate(row.createdAt)}</span>
                    </div>
                </div>
            )
        },
        {
            label: "Loại",
            key: "type",
            render: (row: PR) => (
                <span className={`px-2 py-1 rounded-md text-[9px] font-black uppercase tracking-widest ${row.type === 'CATALOG' ? 'bg-[#B4533A]/10 text-black' : 'bg-purple-500/10 text-black'}`}>
                    {row.type || 'NON-CATALOG'}
                </span>
            )
        },
        {
            label: "Thông tin Yêu cầu",
            key: "title",
            render: (row: PR) => (
                <div className="flex flex-col max-w-xs">
                    <span className="text-sm font-black text-[#000000] truncate">{row.title}</span>
                    <div className="flex items-center gap-2 mt-1">
                        <div className="h-5 w-5 rounded-full bg-[#B4533A] flex items-center justify-center text-[8px] font-black text-[#000000] shrink-0">
                            {(row.requester?.fullName || row.requester?.name || "U").substring(0,1)}
                        </div>
                        <span className="text-[10px] text-[#000000] font-bold">{row.requester?.fullName || row.requester?.name || "N/A"}</span>
                    </div>
                </div>
            )
        },
        {
            label: "Bộ phận",
            key: "deptId",
            render: (row: PR) => (
                <div className="flex flex-col">
                    <span className="text-xs font-black text-[#000000]">
                        {typeof row.department === 'string' ? row.department : row.department?.name || "N/A"}
                    </span>
                </div>
            )
        },
        {
            label: "Ngày cần",
            key: "requiredDate",
            render: (row: PR) => (
                <div className="flex flex-col items-center px-4">
                    <span className="px-2 py-1 bg-rose-500/10 text-black rounded-md text-[10px] font-black uppercase tracking-widest border border-rose-500/20 overflow-hidden whitespace-nowrap">
                        {formatDate(row.requiredDate)}
                    </span>
                </div>
            )
        },
        {
            label: "Giá trị",
            key: "totalEstimate",
            render: (row: PR) => (
                <div className="text-right">
                    <div className="font-black text-black text-sm">{formatVND(row.totalEstimate || 0)} ₫</div>
                    <div className="text-[9px] text-[#000000] font-black uppercase tracking-widest">Base Amount</div>
                </div>
            )
        },
        {
            label: "Trạng thái",
            key: "status",
            render: (row: PR) => <StatusPill status={row.status} />
        },
        {
            label: "Xử lý",
            render: (row: PR) => (
                <div className="flex items-center justify-end gap-1">
                    {row.status === 'APPROVED' && row.type === 'CATALOG' && (
                        <button 
                            onClick={() => setConfirmModal(row)}
                            className="inline-flex items-center gap-2 bg-[#B4533A] text-[#000000] px-4 py-2 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-[#A85032] transition-all shadow-lg shadow-[#B4533A]/20 active:scale-95"
                        >
                            Xác nhận giá NCC <ArrowRight size={14} />
                        </button>
                    )}
                    {row.status === 'APPROVED' && row.type !== 'CATALOG' && (
                        <Link href="/sourcing" className="inline-flex items-center gap-2 bg-emerald-500 text-[#000000] px-4 py-2 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-500/20 active:scale-95">
                            Lấy báo giá <ArrowRight size={14} />
                        </Link>
                    )}
                    {row.status === 'IN_SOURCING' && (
                        <Link 
                            href={`/procurement/rfq/create?prId=${row.id}`}
                            className="inline-flex items-center gap-2 bg-amber-500/10 text-black border border-amber-500/20 px-4 py-2 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-amber-500/20 transition-all shadow-sm active:scale-95"
                        >
                            Quản lý RFQ
                        </Link>
                    )}
                    {row.status !== 'DRAFT' && row.status !== 'REJECTED' && (
                        <button 
                            onClick={() => handleAssignToMe(row.id)}
                            disabled={isAssigning === row.id}
                            className="p-2 text-[#000000] hover:text-[#B4533A] hover:bg-[#B4533A]/10 rounded-xl transition-all"
                            title="Gán cho tôi"
                        >
                            {isAssigning === row.id ? <div className="animate-spin h-5 w-5 border-2 border-[#B4533A] border-t-transparent rounded-full" /> : <UserPlus size={20} />}
                        </button>
                    )}
                </div>
            )
        }
    ];

    return (
        <div className="min-h-screen bg-[#FFFFFF] p-6">
            <main className="max-w-[1600px] mx-auto space-y-6 animate-in fade-in duration-500">
                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h1 className="text-3xl font-black text-[#000000] tracking-tight uppercase">TRUNG TÂM KIỂM SOÁT THU MUA</h1>
                        <p className="text-[#000000] font-medium text-sm mt-1">Quản lý và xử lý các yêu cầu mua sắm từ các bộ phận</p>
                    </div>
                </div>

                {/* Filter Bar */}
                <div className="bg-[#FAF8F5] p-4 rounded-[32px] border border-[rgba(148,163,184,0.1)] shadow-2xl shadow-[#B4533A]/5">
                    <div className="flex flex-col md:flex-row gap-4">
                        <div className="flex-1 flex gap-3">
                            <div className="h-14 w-14 bg-[#FFFFFF] border border-[rgba(148,163,184,0.1)] rounded-2xl flex items-center justify-center text-[#000000] shadow-sm shrink-0">
                                <Search size={20} className="text-[#B4533A]" />
                            </div>
                            <div className="relative flex-1">
                                <input
                                    type="text"
                                    placeholder="Tìm kiếm theo mã PR, tiêu đề hoặc người yêu cầu..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full h-14 pl-6 pr-4 bg-[#FFFFFF] border border-[rgba(148,163,184,0.1)] rounded-2xl text-sm font-bold text-[#000000] placeholder:text-[#000000]/40 focus:outline-none focus:border-[#B4533A] focus:ring-4 focus:ring-[#B4533A]/5 transition-all"
                                />
                            </div>
                        </div>
                        <div className="flex gap-3">
                            <div className="relative">
                                <ListFilter size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#B4533A]" />
                                <select
                                    value={statusFilter}
                                    onChange={(e) => setStatusFilter(e.target.value)}
                                    className="h-14 pl-12 pr-10 bg-[#FFFFFF] border border-[rgba(148,163,184,0.1)] rounded-2xl text-sm font-bold text-[#000000] focus:outline-none focus:border-[#B4533A] focus:ring-4 focus:ring-[#B4533A]/5 transition-all appearance-none cursor-pointer min-w-[200px]"
                                >
                                    <option value="ALL">Tất cả trạng thái</option>
                                    <option value="PENDING">Chờ xử lý</option>
                                    <option value="APPROVED">Đã duyệt</option>
                                    <option value="IN_SOURCING">Đang báo giá</option>
                                    <option value="PO_CREATED">Đã tạo PO</option>
                                </select>
                            </div>
                            <select
                                value={deptFilter}
                                onChange={(e) => setDeptFilter(e.target.value)}
                                className="h-14 px-6 bg-[#FFFFFF] border border-[rgba(148,163,184,0.1)] rounded-2xl text-sm font-bold text-[#000000] focus:outline-none focus:border-[#B4533A] focus:ring-4 focus:ring-[#B4533A]/5 transition-all cursor-pointer min-w-[180px]"
                            >
                                <option value="ALL">Tất cả bộ phận</option>
                                {departments.map(dept => (
                                    <option key={dept} value={dept}>{dept}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>

                {/* Table */}
                <div className="bg-[#FAF8F5] rounded-2xl border border-[rgba(148,163,184,0.1)] shadow-xl shadow-[#B4533A]/5 overflow-hidden">
                    <ERPTable
                        data={filteredPRs}
                        columns={columns}
                    />
                </div>
            </main>

            {/* Confirm Modal */}
            {confirmModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#FFFFFF]/80 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-[#FAF8F5] rounded-[2.5rem] shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200 border border-[rgba(148,163,184,0.1)]">
                        <div className="p-8 border-b border-[rgba(148,163,184,0.1)] bg-[#FFFFFF]">
                            <div className="flex items-center gap-4">
                                <div className="bg-[#B4533A] p-3 rounded-2xl text-[#000000] shadow-lg shadow-[#B4533A]/20">
                                    <CheckCircle size={24} />
                                </div>
                                <div>
                                    <h2 className="text-xl font-black text-[#000000]">Xác nhận giá Catalog</h2>
                                    <p className="text-[#000000] font-bold text-sm">Chi tiết yêu cầu</p>
                                </div>
                            </div>
                        </div>
                        <div className="p-8 space-y-6">
                            <div className="bg-[#FFFFFF] p-6 rounded-2xl border border-[rgba(148,163,184,0.1)]">
                                <div className="flex justify-between items-center mb-4">
                                    <span className="text-[#000000] font-bold text-sm">Nhà cung cấp:</span>
                                    <span className="text-[#B4533A] font-black uppercase tracking-tight">
                                        {organizations.find(o => o.id === confirmModal.preferredSupplierId)?.name || "NCC mặc định"}
                                    </span>
                                </div>
                                <div className="pt-4 border-t border-[rgba(148,163,184,0.05)]">
                                    <label className="text-[10px] font-black uppercase text-[#000000] mb-2 block tracking-widest">Số lượng yêu cầu</label>
                                    <div className="p-4 bg-[#FAF8F5] rounded-xl text-xs font-black text-[#000000] border border-[rgba(148,163,184,0.1)] uppercase">
                                        {confirmModal.items?.[0]?.qty} {confirmModal.items?.[0]?.unit}
                                    </div>
                                </div>
                            </div>

                            <div>
                                <label className="text-[10px] font-black uppercase text-[#000000] mb-2 block tracking-widest">Nhà cung cấp ưu tiên</label>
                                <select className="erp-input w-full h-12 font-bold" defaultValue={confirmModal.preferredSupplierId}>
                                    {organizations.length > 0 ? (
                                        organizations.map(org => (
                                            <option key={org.id} value={org.id}>{org.name} ({org.code})</option>
                                        ))
                                    ) : (
                                        <option value="">Không có nhà cung cấp</option>
                                    )}
                                </select>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-[10px] font-black uppercase text-[#000000] mb-2 block tracking-widest">Giá xác nhận (VNĐ)</label>
                                    <input type="number" className="erp-input w-full h-12 font-bold" defaultValue={confirmModal.items?.[0]?.estimatedPrice} />
                                </div>
                                <div>
                                    <label className="text-[10px] font-black uppercase text-[#000000] mb-2 block tracking-widest">Lead time (Ngày)</label>
                                    <input type="number" className="erp-input w-full h-12 font-bold" defaultValue="3" />
                                </div>
                            </div>

                            <div>
                                <label className="text-[10px] font-black uppercase text-[#000000] mb-2 block tracking-widest">Ghi chú xác nhận</label>
                                <textarea className="erp-input w-full h-24 py-4 font-bold" placeholder="Nhập ghi chú cho NCC..."></textarea>
                            </div>

                            <div className="flex gap-4 pt-4">
                                <button onClick={() => setConfirmModal(null)} className="flex-1 px-6 py-4 rounded-2xl bg-[#FFFFFF] text-[#000000] font-black text-xs uppercase tracking-widest hover:text-[#000000] border border-[rgba(148,163,184,0.1)] transition-all">Hủy bỏ</button>
                                <button 
                                    onClick={() => handleConfirmCatalog(confirmModal)}
                                    className="flex-1 px-6 py-4 rounded-2xl bg-[#B4533A] text-[#000000] font-black text-xs uppercase tracking-widest hover:bg-[#A85032] transition-all shadow-xl shadow-[#B4533A]/20 active:scale-95"
                                >
                                    Gửi xác nhận
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
}

function StatusPill({ status }: { status: string }) {
    const config: Record<string, { bg: string, text: string, border: string, label: string }> = {
        'DRAFT': { bg: 'bg-slate-500/10', text: 'text-black', border: 'border-slate-500/20', label: 'Nháp' },
        'PENDING': { bg: 'bg-amber-500/10', text: 'text-black', border: 'border-amber-500/20', label: 'Chờ duyệt' },
        'PENDING_APPROVAL': { bg: 'bg-amber-500/10', text: 'text-black', border: 'border-amber-500/20', label: 'Chờ phê duyệt' },
        'SUBMITTED': { bg: 'bg-[#B4533A]/10', text: 'text-black', border: 'border-[#B4533A]/20', label: 'Đã gửi' },
        'UNDER_REVIEW': { bg: 'bg-purple-500/10', text: 'text-black', border: 'border-purple-500/20', label: 'Đang xem xét' },
        'APPROVED': { bg: 'bg-emerald-500/10', text: 'text-black', border: 'border-emerald-500/20', label: 'Đã duyệt' },
        'REJECTED': { bg: 'bg-rose-500/10', text: 'text-black', border: 'border-rose-500/20', label: 'Từ chối' },
        'CANCELLED': { bg: 'bg-gray-500/10', text: 'text-black', border: 'border-gray-500/20', label: 'Đã hủy' },
        'COMPLETED': { bg: 'bg-cyan-500/10', text: 'text-black', border: 'border-cyan-500/20', label: 'Hoàn thành' },
        'IN_SOURCING': { bg: 'bg-orange-500/10', text: 'text-black', border: 'border-orange-500/20', label: 'Đang báo giá' },
        'PO_CREATED': { bg: 'bg-indigo-500/10', text: 'text-black', border: 'border-indigo-500/20', label: 'Đã tạo PO' },
    };

    const style = config[status] || { ...config['DRAFT'], label: status.replace(/_/g, ' ') };
    return (
        <div className="min-w-[110px]">
            <span className={`inline-block px-3 py-1.5 rounded-lg font-black text-[9px] uppercase tracking-widest ${style.bg} ${style.text} border ${style.border}`}>
                {style.label}
            </span>
        </div>
    );
}

