"use client";

import { useState, useMemo } from "react";
import { useProcurement, PR, PRItem } from "../../context/ProcurementContext";
import { ERPTableColumn } from "../../components/shared/ERPTable";
import { formatVND } from "../../utils/formatUtils";
import DashboardHeader from "../../components/DashboardHeader";
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
    const { prs, currentUser, apiFetch, refreshData, notify } = useProcurement();
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("ALL");
    const [deptFilter, setDeptFilter] = useState("ALL");
    const [isAssigning, setIsAssigning] = useState<string | null>(null);

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
        return <div className="p-20 text-center font-black text-slate-400">Bạn không có quyền truy cập trung tâm kiểm soát thu mua.</div>;
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
                    <div className="h-9 w-9 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 border border-slate-100">
                        <FileText size={18} />
                    </div>
                    <div className="flex flex-col">
                        <span className="font-black text-erp-navy tracking-tight">{row.prNumber || row.id.substring(0,8)}</span>
                        <span className="text-[9px] text-slate-400 font-bold uppercase">{new Date(row.createdAt).toLocaleDateString()}</span>
                    </div>
                </div>
            )
        },
        {
            label: "Thông tin Yêu cầu",
            key: "title",
            render: (row: PR) => (
                <div className="flex flex-col max-w-xs">
                    <span className="text-sm font-black text-slate-700 truncate">{row.title}</span>
                    <div className="flex items-center gap-2 mt-1">
                        <div className="h-5 w-5 rounded-full bg-erp-navy flex items-center justify-center text-[8px] font-black text-white shrink-0">
                            {(row.requester?.fullName || row.requester?.name || "U").substring(0,1)}
                        </div>
                        <span className="text-[10px] text-slate-500 font-bold">{row.requester?.fullName || row.requester?.name || "N/A"}</span>
                    </div>
                </div>
            )
        },
        {
            label: "Bộ phận",
            key: "deptId",
            render: (row: PR) => (
                <div className="flex flex-col">
                    <span className="text-xs font-black text-erp-navy">
                        {typeof row.department === 'string' ? row.department : row.department?.name || "N/A"}
                    </span>
                    <span className="text-[9px] text-slate-400 font-bold">CC: {row.costCenter?.code || "DEFAULT"}</span>
                </div>
            )
        },
        {
            label: "Giá trị",
            key: "totalEstimate",
            render: (row: PR) => (
                <div className="text-right">
                    <div className="font-mono font-black text-erp-blue text-sm">{formatVND(row.totalEstimate || 0)} \u20ab</div>
                    <div className="text-[9px] text-slate-400 font-black uppercase tracking-widest">Base Amount</div>
                </div>
            )
        },
        {
            label: "Trạng thái",
            key: "status",
            render: (row: PR) => <StatusPill status={row.status} />
        },
        {
            label: "Xử lý Thu mua",
            render: (row: PR) => (
                <div className="flex items-center justify-end gap-2">
                    {row.status === 'APPROVED' && (
                        <Link href="/sourcing" className="inline-flex items-center gap-2 bg-emerald-500 text-white px-4 py-2 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-500/20 active:scale-95">
                            Sourcing <ArrowRight size={14} />
                        </Link>
                    )}
                    {row.status === 'IN_SOURCING' && (
                        <Link 
                            href={`/procurement/rfq/create?prId=${row.id}`}
                            className="inline-flex items-center gap-2 bg-amber-50 text-amber-600 border border-amber-200 px-4 py-2 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-amber-100 transition-all shadow-sm active:scale-95"
                        >
                            Quản lý RFQ
                        </Link>
                    )}
                    {!row.procurementId && row.status !== 'DRAFT' && row.status !== 'REJECTED' && (
                        <button 
                            onClick={() => handleAssignToMe(row.id)}
                            disabled={isAssigning === row.id}
                            className="p-2 text-blue-500 hover:bg-blue-50 rounded-xl transition-all border border-transparent hover:border-blue-100" 
                            title="Gán cho tôi"
                        >
                            <UserPlus size={18} />
                        </button>
                    )}
                    <button className="p-2 text-slate-400 hover:text-erp-navy hover:bg-slate-100 rounded-xl transition-all" title="Cấu đặt">
                        <Settings size={18} />
                    </button>
                </div>
            )
        }
    ];

    const stats = [
        { label: "Tổng số PR", value: prs.length, icon: FileText, color: "text-slate-500", bg: "bg-slate-50" },
        { label: "Chờ Tìm Nguồn", value: prs.filter((p: PR) => p.status === 'APPROVED').length, icon: Zap, color: "text-amber-500", bg: "bg-amber-50" },
        { label: "Đang Báo Giá", value: prs.filter((p: PR) => p.status === 'IN_SOURCING').length, icon: Send, color: "text-blue-500", bg: "bg-blue-50" },
        { label: "Hoàn tất PO", value: prs.filter((p: PR) => p.status === 'PO_CREATED').length, icon: CheckCircle, color: "text-emerald-500", bg: "bg-emerald-50" },
    ];

    return (
        <main className="p-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <DashboardHeader breadcrumbs={["Nghiệp vụ Thu mua", "Bàn làm việc Kiểm soát (Control Desk)"]} />

            <div className="mt-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
                <div>
                    <h1 className="text-4xl font-black text-erp-navy tracking-tighter uppercase mb-2">BÀN LÀM VIỆC KIỂM SOÁT THU MUA</h1>
                    <p className="text-slate-400 font-bold text-sm tracking-tight flex items-center gap-2 uppercase">
                        <ShieldAlert size={14} className="text-erp-blue" /> 
                        QUẢN TRỊ VÀ ĐIỀU PHỐI TOÀN BỘ YÊU CẦU MUA SẮM TRONG TỔ CHỨC
                    </p>
                </div>
                <div className="flex gap-4 w-full md:w-auto">
                    <div className="relative grow md:w-80">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input 
                            type="text"
                            placeholder="Tìm kiếm PR, người yêu cầu..."
                            className="erp-input w-full pl-12 h-14 rounded-2xl!"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <button className="h-14 w-14 bg-white border border-slate-100 rounded-2xl flex items-center justify-center text-slate-500 shadow-xl shadow-slate-200/20 hover:bg-slate-50 transition-all shrink-0">
                        <ListFilter size={20} />
                    </button>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
                {stats.map((stat) => (
                    <div key={stat.label} className="bg-white p-6 rounded-4xl border border-slate-100 shadow-xl shadow-slate-200/20 flex items-center gap-4 group hover:border-erp-blue transition-all">
                        <div className={`w-14 h-14 rounded-2xl ${stat.bg} ${stat.color} flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform`}>
                            <stat.icon size={24} />
                        </div>
                        <div>
                            <div className="text-[10px] uppercase font-black tracking-widest text-slate-400 mb-1">{stat.label}</div>
                            <div className="text-2xl font-black text-erp-navy">{stat.value}</div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Filters bar */}
            <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-xl shadow-erp-navy/5 mb-8 flex flex-wrap items-center gap-6">
                 <div className="flex items-center gap-3">
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Trạng thái:</label>
                    <select 
                        className="bg-slate-50 border-none text-xs font-bold text-erp-navy px-4 py-2 rounded-xl focus:ring-2 focus:ring-erp-blue/20"
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                    >
                        <option value="ALL">TẤT CẢ TRẠNG THÁI</option>
                        <option value="DRAFT">NHÁP</option>
                        <option value="PENDING_APPROVAL">CHỜ PHÊ DUYỆT</option>
                        <option value="APPROVED">ĐÃ PHÊ DUYỆT</option>
                        <option value="IN_SOURCING">ĐANG SOURCING</option>
                        <option value="REJECTED">BỊ TỪ CHỐI</option>
                    </select>
                </div>

                <div className="flex items-center gap-3">
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Phòng ban:</label>
                    <select 
                        className="bg-slate-50 border-none text-xs font-bold text-erp-navy px-4 py-2 rounded-xl focus:ring-2 focus:ring-erp-blue/20"
                        value={deptFilter}
                        onChange={(e) => setDeptFilter(e.target.value)}
                    >
                        <option value="ALL">TẤT CẢ PHÒNG BAN</option>
                        {departments.map((d: string) => <option key={d} value={d}>{d.toUpperCase()}</option>)}
                    </select>
                </div>

                <div className="ml-auto flex items-center gap-4">
                    <span className="text-xs text-slate-400 font-bold">Hiển thị <span className="text-erp-navy font-black">{filteredPRs.length}</span> kết quả</span>
                    <button className="text-xs font-black text-erp-blue uppercase tracking-widest border-b-2 border-erp-blue">Xuất báo cáo (Excel)</button>
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-[40px] border border-slate-100 shadow-2xl shadow-erp-navy/5 overflow-hidden">
                <ERPTable columns={columns} data={filteredPRs} />
                {filteredPRs.length === 0 && (
                    <div className="py-32 text-center">
                        <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-slate-50 text-slate-200 mb-6">
                            <AlertCircle size={40} />
                        </div>
                        <h3 className="text-xl font-black text-erp-navy mb-2 uppercase tracking-tight">Không tìm thấy yêu cầu nào</h3>
                        <p className="text-slate-400 font-medium">Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm của bạn.</p>
                    </div>
                )}
            </div>

            {/* Sourcing Suggestion AI Footer */}
            <div className="mt-12 bg-erp-navy rounded-[40px] p-10 text-white relative overflow-hidden group">
                 <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
                    <div className="max-w-xl">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 bg-emerald-400 rounded-xl flex items-center justify-center">
                                <Zap size={20} className="text-white fill-white" />
                            </div>
                            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-emerald-400">AI Optimization</span>
                        </div>
                        <h2 className="text-3xl font-black mb-4">Tối ưu hóa phân bổ PR cho PO</h2>
                        <p className="text-white/60 text-sm font-medium leading-relaxed">Hệ thống AI đề xuất điều phối các PR đang tồn đọng cho các nhân viên thu mua dựa trên chuyên môn và khối lượng công việc hiện tại.</p>
                    </div>
                    <button className="bg-white text-erp-navy px-10 py-5 rounded-3xl font-black text-xs uppercase tracking-widest hover:bg-emerald-400 hover:text-white transition-all shadow-2xl active:scale-95 shrink-0">
                        Chạy phân bổ ngay
                    </button>
                 </div>
                 <div className="absolute top-0 right-0 w-96 h-96 bg-erp-blue/10 rounded-full -translate-y-1/2 translate-x-1/2 group-hover:scale-110 transition-transform duration-1000"></div>
                 <div className="absolute bottom-0 left-0 w-48 h-48 bg-emerald-400/5 rounded-full translate-y-1/2 -translate-x-1/2"></div>
            </div>
        </main>
    );
}

function StatusPill({ status }: { status: string }) {
    const config: Record<string, { bg: string, text: string }> = {
        'DRAFT': { bg: 'bg-slate-100', text: 'text-slate-500' },
        'PENDING_APPROVAL': { bg: 'bg-amber-100', text: 'text-amber-600' },
        'APPROVED': { bg: 'bg-emerald-100', text: 'text-emerald-600' },
        'REJECTED': { bg: 'bg-red-100', text: 'text-red-600' },
        'IN_SOURCING': { bg: 'bg-blue-100', text: 'text-blue-600' },
    };

    const style = config[status] || config['DRAFT'];
    return (
        <span className={`px-3 py-1.5 rounded-lg font-black text-[9px] uppercase tracking-widest ${style.bg} ${style.text}`}>
            {status}
        </span>
    );
}