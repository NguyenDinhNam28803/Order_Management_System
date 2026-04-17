"use client";

import React from "react";
import Link from "next/link";
import {
    Building2, Lock, CreditCard, ArrowUpRight,
    ArrowDownRight, Activity, Zap, FileText, ShoppingCart, Eye, Plus, Trash2,
    Clock, CheckCircle, Package, AlertCircle, AlertTriangle, History, Bell, Send, Loader2,
    Search, ChevronDown, XCircle, RotateCcw, ArrowRight, ClipboardList, Edit3, Calendar, DollarSign,
    Wallet, FileCheck, PieChart, Truck, MessageSquare
} from "lucide-react";
import { useProcurement, PR, Organization, QuoteRequest, BudgetAllocation, DocumentType } from "./context/ProcurementContext";
import { formatVND, getStatusLabel } from "./utils/formatUtils";
import BudgetHeatmap from "./components/BudgetHeatmap";
import { SimpleBarChart, DonutChart, StatsCard } from "./components/charts";

export default function Dashboard() {
    const { budgets, prs, myPrs, currentUser, loadingMyPrs, approvals, actionApproval, refreshData, notify, fetchPrDetail, budgetAllocations, budgetPeriods, rfqs, pos, quoteRequests, createPRFromQuoteRequest, costCenters, departments, organizations } = useProcurement();
    const availableBudget = (budgets?.allocated || 0) - (budgets?.committed || 0) - (budgets?.spent || 0);
    const currentQuarter = Math.floor(new Date().getMonth() / 3) + 1;

    // Calculate Dynamic Quarterly Remaining Budget for the Department
    const departmentId = currentUser?.deptId || (currentUser?.department as { id: string })?.id;
    const activeQuarterPeriod = (budgetPeriods || []).find(p => p.isActive && p.periodType === "QUARTERLY");
    const deptAllocation = activeQuarterPeriod && departmentId
        ? (budgetAllocations || []).find(a => a.budgetPeriodId === activeQuarterPeriod.id && a.deptId === departmentId)
        : null;
    const quarterlyRemainingBudget = deptAllocation
        ? (deptAllocation.allocatedAmount - deptAllocation.committedAmount - deptAllocation.spentAmount)
        : availableBudget; // Fallback if no specific quarterly allocation exists

    const [selectedPRDetails, setSelectedPRDetails] = React.useState<PR | null>(null);
    const [isSubmitting, setIsSubmitting] = React.useState(false);
    const [confirmModal, setConfirmModal] = React.useState<PR | null>(null);
    const [isSimDropdownOpen, setIsSimDropdownOpen] = React.useState(false);
    const { confirmCatalogPrice } = useProcurement();

    // Fetch budget data on mount for DEPT_APPROVER
    const refreshDataRef = React.useRef(refreshData);
    refreshDataRef.current = refreshData;
    React.useEffect(() => {
        if (currentUser?.role === "DEPT_APPROVER" && !deptAllocation) {
            refreshDataRef.current();
        }
    }, [currentUser?.role, currentUser?.deptId, deptAllocation]);

    const formatDate = (ds?: string) => {
        if (!ds) return "N/A";
        const d = new Date(ds);
        if (isNaN(d.getTime())) return ds;
        return `${String(d.getDate()).padStart(2, '0')}-${String(d.getMonth() + 1).padStart(2, '0')}-${d.getFullYear()}`;
    };

    const isRequester = currentUser?.role === "REQUESTER";
    const isApproverGroup = currentUser?.role === "MANAGER" || currentUser?.role === "DEPT_APPROVER" || currentUser?.role === "DIRECTOR" || currentUser?.role === "CEO" || currentUser?.role === "PLATFORM_ADMIN";
    const isProcurement = currentUser?.role === "PROCUREMENT";
    const isCFO = currentUser?.role === "FINANCE" || currentUser?.role === "DIRECTOR";
    const isSupplier = currentUser?.role === "SUPPLIER";

    const handleQuickApprove = async (workflowId: string) => {
        setIsSubmitting(true);
        try {
            const success = await actionApproval(workflowId, "APPROVE", "Phê duyệt nhanh từ Dashboard");
            if (success) {
                notify("Phê duyệt thành công!", "success");
                setSelectedPRDetails(null);
                await refreshData();
            } else {
                notify("Không thể phê duyệt. Vui lòng thử lại.", "error");
            }
        } catch (err) {
            notify("Lỗi kết nối.", "error");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleConfirmCatalogAction = async (pr: PR) => {
        const success = await confirmCatalogPrice({
            prId: pr.id,
            supplierId: pr.preferredSupplierId || "6c7f4a14-9238-419c-ba0f-fa8da8eb0253",
            price: pr.totalEstimate || 0,
            stock: 10,
            leadTime: 3
        });
        if (success) setConfirmModal(null);
    };

    if (!currentUser) return <div className="p-20 text-center animate-pulse">Đang tải thông tin người dùng...</div>;

    const renderRequesterDashboard = () => {
        const personalPRs = myPrs || [];
        const pendingPRsCount = personalPRs.filter((pr) => pr.status === 'PENDING_APPROVAL' || pr.status === 'SUBMITTED' || pr.status === 'UNDER_REVIEW').length;
        const approvedPRsCount = personalPRs.filter((pr) => pr.status === 'APPROVED' || pr.status === 'PO_CREATED' || pr.status === 'COMPLETED').length;

        const notifications = [
            { id: 1, message: "PR-2026-001 được duyệt – Giám đốc vừa phê duyệt phiếu yêu cầu vật tư của bạn", time: "10M", type: "success" }
        ];

        return (
            <main className="animate-in fade-in duration-500 p-6 min-h-screen bg-[#0F1117] text-[#F8FAFC]">
                {/* HEADER - Minimal Clean Design */}
                <header className="flex items-center justify-between mb-6 pb-4 border-b border-[rgba(148,163,184,0.1)]">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-[#161922] border border-[rgba(148,163,184,0.1)] flex items-center justify-center">
                            <span className="text-lg font-black text-[#3B82F6]">{currentUser?.name?.charAt(0) || currentUser?.fullName?.charAt(0) || 'U'}</span>
                        </div>
                        <div>
                            <h1 className="text-lg font-black text-[#F8FAFC] tracking-tight">Xin chào, {currentUser?.name || currentUser?.fullName}</h1>
                            <p className="text-xs text-[#64748B]">{currentUser?.role} • {typeof currentUser?.department === 'object' ? (currentUser.department as { name: string })?.name : (currentUser?.department || 'Phòng ban')}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                         <Link href="/quote-requests/create" className="px-4 py-2.5 bg-[#161922] border border-[rgba(148,163,184,0.1)] text-[#94A3B8] rounded-xl font-bold text-xs hover:bg-[#1A1D23] hover:text-[#F8FAFC] transition-all">
                             + Báo giá
                         </Link>
                         <div className="relative">
                            <button 
                                onClick={() => setIsSimDropdownOpen(!isSimDropdownOpen)}
                                className="px-4 py-2.5 bg-[#3B82F6] text-white rounded-xl font-bold text-xs hover:bg-[#2563EB] transition-all flex items-center gap-2"
                            >
                                + Tạo PR
                                <ChevronDown size={14} className={`transition-transform ${isSimDropdownOpen ? 'rotate-180' : ''}`} />
                            </button>
                            
                            {isSimDropdownOpen && (
                                <div className="absolute top-full right-0 mt-3 w-72 bg-[#161922] rounded-3xl border border-[rgba(148,163,184,0.1)] shadow-2xl z-50 overflow-hidden animate-in slide-in-from-top-2 duration-200">
                                    <Link href="/pr/create" className="flex items-center gap-4 p-5 hover:bg-[#1A1D23] transition-colors border-b border-[rgba(148,163,184,0.1)] text-left w-full translate-z-0">
                                        <div className="p-3 bg-[#3B82F6]/10 text-[#3B82F6] rounded-xl"><Plus size={18} /></div>
                                        <div>
                                            <div className="text-[10px] font-black uppercase text-[#F8FAFC] mb-1 tracking-widest">Tạo quy trình thủ công</div>
                                            <div className="text-[9px] text-[#64748B] font-bold uppercase leading-tight">Vào PR trực tiếp</div>
                                        </div>
                                    </Link>
                                    <button 
                                        // eslint-disable-next-line react-hooks/rules-of-hooks
                                        onClick={() => { useProcurement().startSimulation("CATALOG"); setIsSimDropdownOpen(false); }}
                                        className="flex items-center gap-4 p-5 hover:bg-[#1A1D23] transition-colors border-b border-[rgba(148,163,184,0.1)] w-full text-left"
                                    >
                                        <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-xl"><Zap size={18} /></div>
                                        <div>
                                             <div className="text-[10px] font-black uppercase text-[#F8FAFC] mb-1 tracking-widest">Giả lập Catalog</div>
                                             <div className="text-[9px] text-[#64748B] font-bold uppercase leading-tight">Demo full-flow từ Catalog</div>
                                        </div>
                                    </button>
                                    <button 
                                        // eslint-disable-next-line react-hooks/rules-of-hooks
                                        onClick={() => { useProcurement().startSimulation("NON_CATALOG"); setIsSimDropdownOpen(false); }}
                                        className="flex items-center gap-4 p-5 hover:bg-[#1A1D23] transition-colors w-full text-left"
                                    >
                                        <div className="p-3 bg-purple-500/10 text-purple-400 rounded-xl"><RotateCcw size={18} /></div>
                                        <div>
                                             <div className="text-[10px] font-black uppercase text-[#F8FAFC] mb-1 tracking-widest">Giả lập Non-Catalog (AI)</div>
                                             <div className="text-[9px] text-[#64748B] font-bold uppercase leading-tight">Demo quote sync Supplier/AI</div>
                                        </div>
                                    </button>
                                </div>
                            )}
                         </div>
                    </div>
                </header>

                {/* HÀNG 1 — Stats Cards with Reports/Spend Style */}
                <div className="bg-[#161922] rounded-[32px] border border-[rgba(148,163,184,0.1)] shadow-2xl p-6 mb-6">
                    <h3 className="text-xs font-black uppercase tracking-widest text-[#64748B] mb-4 flex items-center gap-2">
                        <Activity size={14} className="text-[#3B82F6]" /> Tổng quan hoạt động
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        <StatsCard
                            title="PR Chờ Duyệt"
                            value={pendingPRsCount}
                            subValue={`${formatVND(personalPRs.filter(pr => pr.status === 'PENDING_APPROVAL').reduce((sum, pr) => sum + (Number(pr.totalEstimate) || 0), 0))} đ`}
                            icon={Clock}
                            color="amber"
                            trend={{ value: 12, isPositive: false }}
                        />
                        <StatsCard
                            title="PR Đã Duyệt"
                            value={approvedPRsCount}
                            subValue={`${formatVND(personalPRs.filter(pr => pr.status === 'APPROVED' || pr.status === 'PO_CREATED').reduce((sum, pr) => sum + (Number(pr.totalEstimate) || 0), 0))} đ`}
                            icon={CheckCircle}
                            color="green"
                            trend={{ value: 8, isPositive: true }}
                        />
                        <StatsCard
                            title="Ngân Sách Còn Lại"
                            value={formatVND(availableBudget)}
                            subValue={`Quý ${currentQuarter}/${new Date().getFullYear()}`}
                            icon={DollarSign}
                            color="blue"
                        >
                            <div className="mt-2">
                                <div className="flex justify-between text-[10px] text-text-secondary mb-1">
                                    <span>Đã dùng</span>
                                    <span>{((budgets?.allocated ? (budgets.committed + budgets.spent) / budgets.allocated * 100 : 0)).toFixed(1)}%</span>
                                </div>
                                <div className="h-1.5 bg-bg-primary rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-[#3B82F6] rounded-full"
                                        style={{ width: `${Math.min(budgets?.allocated ? ((budgets.committed + budgets.spent) / budgets.allocated) * 100 : 0, 100)}%` }}
                                    />
                                </div>
                            </div>
                        </StatsCard>
                        <StatsCard
                            title="Giá Trị PR Hoàn Thành"
                            value={`${formatVND(personalPRs.filter(pr => pr.status === 'COMPLETED').reduce((sum, pr) => sum + (Number(pr.totalEstimate) || 0), 0))} đ`}
                            subValue="Tổng dự toán đã hoàn thành"
                            icon={ArrowUpRight}
                            color="purple"
                        />
                    </div>
                </div>

                {/* HÀNG 2 — Charts */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
                    <DonutChart 
                        title="Phân Bổ Trạng Thái PR"
                        data={[
                            { label: 'Chờ duyệt', value: pendingPRsCount, color: '#F59E0B' },
                            { label: 'Đã duyệt', value: approvedPRsCount, color: '#10B981' },
                            { label: 'Từ chối', value: personalPRs.filter(pr => pr.status === 'REJECTED').length, color: '#EF4444' },
                            { label: 'Hoàn thành', value: personalPRs.filter(pr => pr.status === 'COMPLETED').length, color: '#8B5CF6' },
                        ]}
                        centerLabel="Tổng PR"
                        centerValue={personalPRs.length.toString()}
                    />
                    <SimpleBarChart 
                        title="Chi Tiêu Theo Tháng"
                        data={[
                            { label: 'Tháng 1', value: personalPRs.filter(pr => new Date(pr.createdAt).getMonth() === 0).reduce((sum, pr) => sum + (pr.totalEstimate || 0), 0), color: '#3B82F6' },
                            { label: 'Tháng 2', value: personalPRs.filter(pr => new Date(pr.createdAt).getMonth() === 1).reduce((sum, pr) => sum + (pr.totalEstimate || 0), 0), color: '#3B82F6' },
                            { label: 'Tháng 3', value: personalPRs.filter(pr => new Date(pr.createdAt).getMonth() === 2).reduce((sum, pr) => sum + (pr.totalEstimate || 0), 0), color: '#3B82F6' },
                        ]}
                    />
                </div>

                {/* HÀNG 2 — Action Required (Condition-based) */}
                <ActionRequired 
                    items={(quoteRequests || []).filter(q => q.status === 'QUOTED')} 
                    onConvert={async (id) => {
                        const success = await createPRFromQuoteRequest(id);
                        if (success) await refreshData();
                    }} 
                />

                {/* HÀNG 3 — Split Dashboard */}
                <div className="grid grid-cols-1 xl:grid-cols-10 gap-10">
                    {/* GIỮ 60% — Danh sách PR */}
                    <div className="xl:col-span-6 space-y-6">
                        <div className="bg-[#161922] rounded-[40px] border border-[rgba(148,163,184,0.1)] shadow-2xl shadow-[#3B82F6]/5 overflow-hidden">
                             <div className="p-8 border-b border-[rgba(148,163,184,0.1)] flex justify-between items-center bg-[#0F1117]">
                                 <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-[#F8FAFC] flex items-center gap-3 leading-none">
                                     <FileText size={16} className="text-[#3B82F6]" /> Danh sách PR của tôi (gần nhất)
                                 </h3>
                                 <Link href="/pr" className="text-[9px] font-black uppercase text-[#3B82F6] hover:underline bg-[#0F1117] px-3 py-1.5 rounded-lg border border-[rgba(148,163,184,0.1)] shadow-sm transition-all hover:scale-105 active:scale-95">Xem tất cả ›</Link>
                             </div>
                             <div className="overflow-x-auto">
                                 <table className="erp-table text-xs text-left">
                                     <thead>
                                         <tr className="bg-[#0F1117] text-[9px] font-black text-[#64748B] border-b border-[rgba(148,163,184,0.1)] uppercase tracking-widest">
                                             <th className="px-8 py-5">Số PR</th>
                                             <th className="px-8 py-5">Tiêu đề (Lý do)</th>
                                             <th className="px-8 py-5">Ngày tạo</th>
                                             <th className="px-8 py-5 text-right">Tổng ước tính</th>
                                             <th className="px-8 py-5 text-center">Trạng thái</th>
                                             <th className="px-8 py-5 text-right">Thao tác</th>
                                         </tr>
                                     </thead>
                                     <tbody className="divide-y divide-[rgba(148,163,184,0.1)]">
                                         {loadingMyPrs ? (
                                             [1, 2, 3].map(i => (
                                                 <tr key={i} className="animate-pulse px-8">
                                                     <td className="px-8 py-6"><div className="h-4 w-16 bg-[#1A1D23] rounded"></div></td>
                                                     <td className="px-8 py-6"><div className="h-4 w-32 bg-[#1A1D23] rounded"></div></td>
                                                     <td className="px-8 py-6"><div className="h-4 w-20 bg-[#1A1D23] rounded ml-auto"></div></td>
                                                     <td colSpan={2}></td>
                                                 </tr>
                                             ))
                                         ) : (
                                             personalPRs.slice(0, 5).map((pr) => (
                                                 <tr key={pr.id} className="hover:bg-[#0F1117]/50 transition-all group">
                                                     <td className="px-8 py-6 font-black text-[#F8FAFC] text-xs tracking-tighter">{pr.prNumber || pr.id.substring(0, 8)}</td>
                                                     <td className="px-8 py-6 font-semibold text-[#94A3B8] text-[11px] truncate max-w-[180px]" title={pr.title}>{pr.title}</td>
                                                     <td className="px-8 py-6 text-[#64748B] font-bold text-[10px]">{formatDate(pr.createdAt)}</td>
                                                     <td className="px-8 py-6 font-black text-[#F8FAFC] text-right tracking-tight">{formatVND(pr.totalEstimate || 0)}</td>
                                                     <td className="px-8 py-6 text-center">
                                                         <span className={`px-3 py-1.5 rounded-xl text-[9px] font-black uppercase border transition-all ${
                                                             pr.status === "APPROVED" ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : 
                                                             pr.status === "REJECTED" ? "bg-rose-500/10 text-rose-400 border-rose-500/20" :
                                                             pr.status === "DRAFT" ? "bg-[#1A1D23] text-[#64748B] border-[rgba(148,163,184,0.1)]" :
                                                             pr.status.includes("PENDING") || pr.status === "SUBMITTED" ? "bg-amber-500/10 text-amber-400 border-amber-500/20" :
                                                             "bg-[#3B82F6]/10 text-[#3B82F6] border-[#3B82F6]/20"
                                                         }`}>
                                                             {getStatusLabel(pr.status)}
                                                         </span>
                                                     </td>
                                                     <td className="px-8 py-6 text-right">
                                                         <div className="flex justify-end gap-1">
                                                             {pr.status === "DRAFT" && (
                                                                 <Link href={`/pr/edit/${pr.id}`} className="p-1.5 text-[#64748B] hover:text-[#3B82F6] hover:bg-[#3B82F6]/10 rounded-lg border border-transparent hover:border-[#3B82F6]/20 transition-all"><Edit3 size={14} /></Link>
                                                             )}
                                                             <button disabled={loadingMyPrs} onClick={() => fetchPrDetail(pr.id).then(res => res && setSelectedPRDetails(res))} className="p-1.5 text-[#64748B] hover:text-[#F8FAFC] hover:bg-[#1A1D23] rounded-lg border border-transparent hover:border-[rgba(148,163,184,0.2)] transition-all">
                                                                 <Eye size={14} />
                                                             </button>
                                                         </div>
                                                     </td>
                                                 </tr>
                                             ))
                                         )}
                                     </tbody>
                                 </table>
                             </div>
                        </div>
                    </div>

                    {/* GIỮ 40% — QR & NOTI */}
                    <div className="xl:col-span-4 space-y-10">
                        {/* QR Section */}
                        <div className="bg-[#161922] rounded-[40px] border border-[rgba(148,163,184,0.1)] shadow-2xl shadow-[#3B82F6]/5 overflow-hidden">
                             <div className="p-8 border-b border-[rgba(148,163,184,0.1)] flex justify-between items-center">
                                 <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-[#F8FAFC] flex items-center gap-3">
                                     <ClipboardList size={16} className="text-[#3B82F6]" /> Yêu cầu báo giá (QR)
                                 </h3>
                                 <Link href="/quote-requests" className="text-[9px] font-black uppercase text-[#3B82F6] hover:underline">Xem tất cả ›</Link>
                             </div>
                             <div className="p-8 space-y-4">
                                 {quoteRequests.length > 0 ? (
                                     [...quoteRequests].sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 3).map(qr => (
                                         <div key={qr.id} className="flex items-center justify-between p-5 bg-[#0F1117] rounded-3xl border border-[rgba(148,163,184,0.1)] hover:border-[#3B82F6]/20 transition-all group">
                                             <div className="flex flex-col gap-1">
                                                 <div className="flex items-center gap-2">
                                                     <span className="text-[10px] font-black text-[#F8FAFC]">{qr.qrNumber}</span>
                                                     <span className={`px-2 py-0.5 rounded-lg text-[8px] font-black uppercase w-fit ${
                                                         qr.status === 'QUOTED' ? 'bg-emerald-500/10 text-emerald-400' : 
                                                         qr.status === 'SUBMITTED' ? 'bg-[#3B82F6]/10 text-[#3B82F6]' :
                                                         'bg-amber-500/10 text-amber-400'
                                                     }`}>{qr.status}</span>
                                                 </div>
                                                 <span className="text-[9px] font-bold text-[#64748B] truncate max-w-[120px]">{qr.title}</span>
                                             </div>
                                             {qr.status === "QUOTED" ? (
                                                  <button 
                                                    onClick={async () => {
                                                        const success = await createPRFromQuoteRequest(qr.id);
                                                        if (success) await refreshData();
                                                    }} 
                                                    className="px-3 py-1.5 bg-[#3B82F6] text-white rounded-lg text-[9px] font-black uppercase tracking-widest hover:bg-emerald-500 transition-all active:scale-95 shadow-md shadow-[#3B82F6]/10"
                                                  >
                                                    CHUYỂN SANG PR
                                                  </button>
                                             ) : (
                                                  <span className="text-[9px] font-black text-[#64748B] uppercase tracking-widest px-4">Đang xử lý...</span>
                                             )}
                                         </div>
                                     ))
                                 ) : (
                                     <div className="py-10 text-center">
                                         <p className="text-[11px] font-black text-[#64748B] uppercase tracking-widest italic leading-none">Không có yêu cầu báo giá gần đây</p>
                                     </div>
                                 )}
                             </div>
                        </div>

                        {/* Notifications */}
                        <div className="bg-[#161922] rounded-[40px] shadow-2xl shadow-[#3B82F6]/5 p-10 text-white relative overflow-hidden group border border-[rgba(148,163,184,0.1)]">
                             <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-125 transition-transform duration-700">
                                 <Bell size={100} />
                             </div>
                             <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-[#3B82F6] mb-8 leading-none">THÔNG BÁO MỚI NHẤT</h3>
                             <div className="space-y-8 relative">
                                 <div className="absolute left-1.5 top-2 bottom-2 w-0.5 bg-[rgba(148,163,184,0.2)]" />
                                 {notifications.map(n => (
                                     <div key={n.id} className="relative flex items-center gap-6 pl-8 group/item">
                                         <div className="absolute left-0 w-3 h-3 rounded-full bg-[#3B82F6] border-2 border-[#161922] z-10 group-hover/item:scale-150 transition-transform"></div>
                                         <div className="flex-1">
                                             <div className="flex justify-between items-start mb-1 leading-none">
                                                 <p className="text-[11px] font-black text-[#F8FAFC] leading-relaxed pr-6">{n.message}</p>
                                                 <span className="text-[8px] font-black text-[#64748B] truncate">{n.time}</span>
                                             </div>
                                         </div>
                                     </div>
                                 ))}
                             </div>
                        </div>
                    </div>
                </div>
            </main>
        );
    };

    function MetricCard({ title, value, icon, color }: { title: string; value: string | number; icon: React.ReactNode; color: string }) {
        return (
            <div className={`erp-card p-8! border-none shadow-xl shadow-[#3B82F6]/5 relative overflow-hidden group hover:translate-y-[-4px] transition-all duration-300 bg-[#161922]`}>
                <div className={`absolute top-0 right-0 w-24 h-24 -mr-12 -mt-12 rounded-full opacity-5 group-hover:opacity-10 transition-opacity ${color}`}></div>
                <div className="flex justify-between items-center mb-6">
                    <div className={`p-4 rounded-2xl ${color} bg-opacity-10 ${color.replace('bg-', 'text-')}`}>
                        {icon}
                    </div>
                    <div className="text-4xl font-black text-[#F8FAFC] tracking-tighter">{value}</div>
                </div>
                <div className="text-[10px] font-black uppercase tracking-[0.2em] text-[#64748B] leading-none">{title}</div>
            </div>
        );
    }

    function ActionRequired({ items, onConvert }: { items: QuoteRequest[]; onConvert: (id: string) => Promise<void> }) {
        if (items.length === 0) return null;
        return (
            <div className="bg-[#161922] rounded-[40px] p-10 border border-[rgba(148,163,184,0.1)] mb-12 shadow-2xl shadow-[#3B82F6]/5">
                <div className="flex items-center gap-3 mb-8">
                    <div className="h-2 w-2 rounded-full bg-[#3B82F6] animate-pulse"></div>
                    <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-[#F8FAFC] leading-none">CẦN HÀNH ĐỘNG NGAY ({items.length})</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {items.map((qr) => (
                        <ActionItem key={qr.id} qr={qr} onConvert={onConvert} />
                    ))}
                </div>
            </div>
        );
    }

    function ActionItem({ qr, onConvert }: { qr: QuoteRequest; onConvert: (id: string) => Promise<void> }) {
        const [isConverting, setIsConverting] = React.useState(false);

        const handleConvert = async () => {
            setIsConverting(true);
            try {
                await onConvert(qr.id);
            } finally {
                setIsConverting(false);
            }
        };

        return (
            <div className="bg-[#0F1117] p-6 rounded-[32px] border border-[rgba(148,163,184,0.1)] flex items-center justify-between shadow-xl shadow-[#3B82F6]/5 hover:-translate-y-1 transition-all duration-300 group">
                <div className="flex items-center gap-4">
                    <div className="p-4 bg-[#3B82F6]/10 text-[#3B82F6] rounded-[20px] group-hover:rotate-12 transition-transform"><Zap size={24} /></div>
                    <div>
                        <h4 className="text-xs font-black text-[#F8FAFC] uppercase mb-1">{qr.qrNumber} ĐÃ CÓ BÁO GIÁ</h4>
                        <p className="text-[10px] text-[#64748B] font-bold uppercase tracking-tight opacity-70">Nhà cung cấp đã nộp giá. Chuyển sang PR để duyệt mua hàng.</p>
                    </div>
                </div>
                <button 
                    onClick={handleConvert} 
                    disabled={isConverting}
                    className="px-8 py-4 bg-[#3B82F6] hover:bg-emerald-500 text-white text-[10px] font-black uppercase tracking-[0.1em] rounded-2xl shadow-xl shadow-[#3B82F6]/20 transition-all flex items-center gap-2 disabled:opacity-50"
                >
                    {isConverting ? (
                        <Loader2 className="animate-spin" size={14} />
                    ) : (
                        <>
                            Chuyển sang PR <ArrowRight size={14} />
                        </>
                    )}
                </button>
            </div>
        );
    }

    const renderCFODashboard = () => {
        const cfoPendingPRs = (approvals || []).filter(app => app.documentType === DocumentType.PURCHASE_REQUISITION).map((app) => {
            const pr = prs.find((p) => p.id === app.documentId);
            if (!pr) return null;
            return { ...pr, workflowId: app.id };
        }).filter((p): p is (PR & { workflowId: string }) => p !== null && (Number(p.totalEstimate) >= 10000000));

        const pendingBudgets = (approvals || []).filter(app => app.documentType === DocumentType.BUDGET_ALLOCATION).map((app) => {
            const alloc = budgetAllocations.find(a => a.id === app.documentId);
            if (!alloc) return null;
            return { ...alloc, workflowId: app.id };
        }).filter((a): a is (BudgetAllocation & { workflowId: string }) => a !== null);

        const pendingPRCount = cfoPendingPRs.length;
        const pendingPRValue = cfoPendingPRs.reduce((sum: number, pr) => sum + (Number(pr.totalEstimate) || 0), 0);
        const pendingBudgetCount = pendingBudgets.length;
        const pendingBudgetValue = pendingBudgets.reduce((sum: number, b) => sum + (Number(b.allocatedAmount) || 0), 0);

        // Calculate real financial data
        const totalAllocated = (budgetAllocations || []).reduce((sum, b) => sum + (Number(b.allocatedAmount) || 0), 0);
        const totalCommitted = (budgetAllocations || []).reduce((sum, b) => sum + (Number(b.committedAmount) || 0), 0);
        const totalSpent = (budgetAllocations || []).reduce((sum, b) => sum + (Number(b.spentAmount) || 0), 0);
        const totalUsed = totalCommitted + totalSpent;
        const usagePercent = totalAllocated > 0 ? Math.round((totalUsed / totalAllocated) * 100) : 0;

        // Calculate department breakdown for pie chart
        const deptColors = ['#10b981', '#3b82f6', '#f59e0b', '#8b5cf6', '#ef4444'];
        const deptSpending = (departments || []).map((dept, idx) => {
            const deptAllocs = (budgetAllocations || []).filter(b => b.deptId === dept.id);
            const spent = deptAllocs.reduce((sum, b) => sum + (Number(b.spentAmount) || 0) + (Number(b.committedAmount) || 0), 0);
            return { name: dept.name, spent, color: deptColors[idx % deptColors.length] };
        }).filter(d => d.spent > 0).sort((a, b) => b.spent - a.spent).slice(0, 3);

        // Weekly payment forecast - POs issued but not yet invoiced/paid
        const pendingPayments = (pos || []).filter(po => po.status === 'ISSUED' || po.status === 'PARTIALLY_RECEIVED');
        const weeklyForecast = pendingPayments.reduce((sum, po) => sum + (Number(po.total) || 0), 0);

        return (
            <div className="animate-in fade-in duration-700 px-6">
                {/* HEADER - With PR Creation for CFO/Director */}
                <header className="flex items-center justify-between mb-6 pb-4 border-b border-[rgba(148,163,184,0.1)]">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-[#161922] border border-[rgba(148,163,184,0.1)] flex items-center justify-center">
                            <span className="text-lg font-black text-[#3B82F6]">{currentUser?.name?.charAt(0) || currentUser?.fullName?.charAt(0) || 'U'}</span>
                        </div>
                        <div>
                            <h1 className="text-lg font-black text-[#F8FAFC] tracking-tight">Xin chào, {currentUser?.name || currentUser?.fullName}</h1>
                            <p className="text-xs text-[#64748B]">{currentUser?.role} • Tài chính Vĩ mô</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                         <Link href="/quote-requests/create" className="px-4 py-2.5 bg-[#161922] border border-[rgba(148,163,184,0.1)] text-[#94A3B8] rounded-xl font-bold text-xs hover:bg-[#1A1D23] hover:text-[#F8FAFC] transition-all">
                             + Báo giá
                         </Link>
                         <div className="relative">
                            <button 
                                onClick={() => setIsSimDropdownOpen(!isSimDropdownOpen)}
                                className="px-4 py-2.5 bg-[#3B82F6] text-white rounded-xl font-bold text-xs hover:bg-[#2563EB] transition-all flex items-center gap-2"
                            >
                                + Tạo PR
                                <ChevronDown size={14} className={`transition-transform ${isSimDropdownOpen ? 'rotate-180' : ''}`} />
                            </button>
                            
                            {isSimDropdownOpen && (
                                <div className="absolute top-full right-0 mt-3 w-72 bg-[#161922] rounded-3xl border border-[rgba(148,163,184,0.1)] shadow-2xl z-50 overflow-hidden animate-in slide-in-from-top-2 duration-200">
                                    <Link href="/pr/create" className="flex items-center gap-4 p-5 hover:bg-[#1A1D23] transition-colors border-b border-[rgba(148,163,184,0.1)] text-left w-full translate-z-0">
                                        <div className="p-3 bg-[#3B82F6]/10 text-[#3B82F6] rounded-xl"><Plus size={18} /></div>
                                        <div>
                                            <div className="text-[10px] font-black uppercase text-[#F8FAFC] mb-1 tracking-widest">Tạo quy trình thủ công</div>
                                            <div className="text-[9px] text-[#64748B] font-bold uppercase leading-tight">Vào PR trực tiếp</div>
                                        </div>
                                    </Link>
                                    <button 
                                        // eslint-disable-next-line react-hooks/rules-of-hooks
                                        onClick={() => { useProcurement().startSimulation("CATALOG"); setIsSimDropdownOpen(false); }}
                                        className="flex items-center gap-4 p-5 hover:bg-[#1A1D23] transition-colors border-b border-[rgba(148,163,184,0.1)] w-full text-left"
                                    >
                                        <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-xl"><Zap size={18} /></div>
                                        <div>
                                             <div className="text-[10px] font-black uppercase text-[#F8FAFC] mb-1 tracking-widest">Giả lập Catalog</div>
                                             <div className="text-[9px] text-[#64748B] font-bold uppercase leading-tight">Demo full-flow từ Catalog</div>
                                        </div>
                                    </button>
                                    <button 
                                        // eslint-disable-next-line react-hooks/rules-of-hooks
                                        onClick={() => { useProcurement().startSimulation("NON_CATALOG"); setIsSimDropdownOpen(false); }}
                                        className="flex items-center gap-4 p-5 hover:bg-[#1A1D23] transition-colors w-full text-left"
                                    >
                                        <div className="p-3 bg-purple-500/10 text-purple-400 rounded-xl"><RotateCcw size={18} /></div>
                                        <div>
                                            <div className="text-[10px] font-black uppercase text-[#F8FAFC] mb-1 tracking-widest">Giả lập Non-Catalog</div>
                                            <div className="text-[9px] text-[#64748B] font-bold uppercase leading-tight">Demo full-flow từ PR</div>
                                        </div>
                                    </button>
                                </div>
                            )}
                         </div>
                    </div>
                </header>

                {/* CFO Stat Cards - Clean Consistent Style */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                    {/* Total Budget Card */}
                    <div className="bg-[#161922] rounded-2xl p-6 border border-[rgba(148,163,184,0.1)] hover:border-emerald-500/30 transition-all">
                        <div className="flex items-center justify-between mb-4">
                            <span className="text-[10px] font-black uppercase text-[#64748B] tracking-wider">Tổng Ngân Sách</span>
                            <div className="h-10 w-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                                <Wallet size={20} className="text-emerald-400" />
                            </div>
                        </div>
                        <div className="text-2xl font-black text-emerald-400 mb-2">{formatVND(totalAllocated)}</div>
                        <div className="w-full h-1.5 bg-[#0F1117] rounded-full overflow-hidden mb-2">
                            <div className="h-full bg-emerald-500 transition-all duration-1000" style={{ width: `${usagePercent}%` }}></div>
                        </div>
                        <div className="flex justify-between text-[9px] font-black uppercase">
                            <span className="text-[#64748B]">{usagePercent}% đã dùng</span>
                            <span className="text-emerald-400">{formatVND(totalAllocated - totalUsed)} còn</span>
                        </div>
                    </div>

                    {/* Weekly Payment Forecast Card */}
                    <div className="bg-[#161922] rounded-2xl p-6 border border-[rgba(148,163,184,0.1)] hover:border-[#3B82F6]/30 transition-all">
                        <div className="flex items-center justify-between mb-4">
                            <span className="text-[10px] font-black uppercase text-[#64748B] tracking-wider">Dự Kiến Chi Tuần Này</span>
                            <div className="h-10 w-10 rounded-xl bg-[#3B82F6]/10 flex items-center justify-center">
                                <Calendar size={20} className="text-[#3B82F6]" />
                            </div>
                        </div>
                        <div className="text-2xl font-black text-[#F8FAFC] mb-1">{formatVND(weeklyForecast)}</div>
                        <div className="text-sm font-bold text-[#3B82F6]">{pendingPayments.length} PO đang chờ thanh toán</div>
                        <div className="text-[10px] text-[#64748B] mt-3 pt-3 border-t border-[rgba(148,163,184,0.1)]">Dự kiến thanh toán trong 7 ngày tới</div>
                    </div>

                    {/* Pending Approvals Card */}
                    <div className="bg-[#161922] rounded-2xl p-6 border border-[rgba(148,163,184,0.1)] hover:border-amber-500/30 transition-all">
                        <div className="flex items-center justify-between mb-4">
                            <span className="text-[10px] font-black uppercase text-[#64748B] tracking-wider">Chờ CFO Duyệt</span>
                            <div className="h-10 w-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
                                <FileCheck size={20} className="text-amber-400" />
                            </div>
                        </div>
                        <div className="text-2xl font-black text-amber-400 mb-1">{pendingPRCount + pendingBudgetCount}</div>
                        <div className="text-sm font-bold text-[#94A3B8]">{formatVND(pendingPRValue + pendingBudgetValue)} cần phê duyệt</div>
                        <div className="text-[10px] text-[#64748B] mt-3 pt-3 border-t border-[rgba(148,163,184,0.1)]">{pendingPRCount} PR • {pendingBudgetCount} Ngân sách</div>
                    </div>

                    {/* Department Spending Breakdown */}
                    <div className="bg-[#161922] rounded-2xl p-6 border border-[rgba(148,163,184,0.1)] hover:border-purple-500/30 transition-all">
                        <div className="flex items-center justify-between mb-4">
                            <span className="text-[10px] font-black uppercase text-[#64748B] tracking-wider">Top Chi Tiêu</span>
                            <div className="h-10 w-10 rounded-xl bg-purple-500/10 flex items-center justify-center">
                                <PieChart size={20} className="text-purple-400" />
                            </div>
                        </div>
                        <div className="space-y-2">
                            {deptSpending.length > 0 ? deptSpending.map((dept, idx) => (
                                <div key={idx} className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <div className="h-2 w-2 rounded-full" style={{ backgroundColor: dept.color }}></div>
                                        <span className="text-xs font-bold text-[#F8FAFC]">{dept.name}</span>
                                    </div>
                                    <span className="text-xs font-bold text-[#94A3B8]">{formatVND(dept.spent).replace('₫', '')}</span>
                                </div>
                            )) : (
                                <div className="text-xs text-[#64748B] italic">Chưa có dữ liệu chi tiêu</div>
                            )}
                        </div>
                        <div className="text-[10px] text-[#64748B] mt-3 pt-3 border-t border-[rgba(148,163,184,0.1)]">Chi tiêu theo phòng ban</div>
                    </div>
                </div>

                <div className="mb-10">
                    <BudgetHeatmap />
                </div>

                {/* Budget Approvals Section */}
                {pendingBudgets.length > 0 && (
                    <div className="mb-12">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-[#3B82F6] flex items-center gap-2">
                                <Activity size={14} /> Duyệt Định Biên Ngân Sách ({pendingBudgetCount})
                            </h3>
                        </div>
                        <div className="erp-card !p-0 overflow-hidden shadow-2xl shadow-[#3B82F6]/5 border-none bg-[#161922]">
                            <table className="erp-table text-xs">
                                <thead>
                                    <tr className="bg-[#0F1117]">
                                        <th className="px-8">Cost Center / Đơn vị</th>
                                        <th>Chu kỳ</th>
                                        <th className="text-right">Số tiền yêu cầu</th>
                                        <th>Ghi chú</th>
                                        <th className="text-right px-8">Thao tác</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-[rgba(148,163,184,0.1)]">
                                    {pendingBudgets.map((b) => {
                                        const cc = costCenters.find(c => c.id === b.costCenterId);
                                        const dept = departments.find(d => d.id === b.deptId || d.id === cc?.deptId);
                                        return (
                                            <tr key={b.id} className="hover:bg-[#0F1117]/50 group transition-all">
                                                <td className="px-8 flex flex-col py-4">
                                                    <span className="font-black text-[#F8FAFC] uppercase text-[10px]">{cc?.name || "N/A"}</span>
                                                    <span className="text-[9px] font-bold text-[#64748B]">{dept?.name || "Global"} ({cc?.code || "CC"})</span>
                                                </td>
                                                <td className="font-bold text-[#94A3B8]">
                                                    Q{b.budgetPeriod?.periodNumber} / {b.budgetPeriod?.fiscalYear}
                                                </td>
                                                <td className="text-right font-black text-[#3B82F6] text-sm">{formatVND(b.allocatedAmount)} Đ</td>
                                                <td className="text-[#64748B] italic text-[11px] font-medium">{b.notes || "Ngân sách định kỳ"}</td>
                                                <td className="text-right px-8">
                                                    <div className="flex justify-end gap-1">
                                                        <button onClick={() => handleQuickApprove(b.workflowId)} className="py-1.5 px-3 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-lg font-black text-[9px] uppercase tracking-wider hover:bg-emerald-500 hover:text-white transition-all">Duyệt</button>
                                                        <button onClick={() => actionApproval(b.workflowId, 'REJECT', 'Không hợp lệ')} className="p-1.5 border border-rose-500/20 text-rose-400 rounded-lg hover:bg-rose-500 hover:text-white transition-all"><XCircle size={12}/></button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* Approval Queue Section */}
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-[#F8FAFC]">Queue Duyệt Phiếu Mua Sắm (PR)</h3>
                    <div className="flex items-center gap-3">
                        <div className="relative">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#64748B]" size={14} />
                            <input type="text" placeholder="Tìm kiếm chứng từ..." className="pl-10 pr-6 py-2 bg-[#161922] border border-[rgba(148,163,184,0.1)] rounded-xl text-xs font-medium w-64 focus:outline-none focus:ring-2 focus:ring-[#3B82F6]/10 transition-all text-[#F8FAFC] placeholder:text-[#64748B]"/>
                        </div>
                        <button className="flex items-center gap-2 px-3 py-1.5 bg-[#161922] border border-[rgba(148,163,184,0.1)] rounded-lg text-[9px] font-black uppercase tracking-widest text-[#94A3B8] hover:bg-[#1A1D23] transition-all shadow-sm">
                            Lọc <ChevronDown size={14} />
                        </button>
                        <button className="flex items-center gap-2 px-3 py-1.5 bg-[#3B82F6] text-white rounded-lg text-[9px] font-black uppercase tracking-widest hover:bg-[#2563EB] transition-all shadow-md shadow-[#3B82F6]/20">
                            <Zap size={14} /> Xuất
                        </button>
                    </div>
                </div>

                <div className="erp-card !p-0 overflow-hidden shadow-2xl shadow-[#3B82F6]/5 border-none bg-[#161922]">
                    <div className="overflow-x-auto">
                        <table className="erp-table text-xs whitespace-nowrap">
                            <thead>
                                <tr className="bg-[#0F1117]">
                                    <th className="w-10 px-8 text-center"><input type="checkbox" className="rounded-md border-[rgba(148,163,184,0.1)] text-[#3B82F6] bg-[#161922]"/></th>
                                    <th>Mã Chứng Từ</th>
                                    <th>Phân loại</th>
                                    <th>Lý do / Hạng mục</th>
                                    <th className="text-center">Tình Trạng Ngân Sách</th>
                                    <th className="text-right">Giá Trị</th>
                                    <th className="text-right px-8">Thao tác</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {cfoPendingPRs.length > 0 ? cfoPendingPRs.map((pr) => (
                                    <tr key={pr.id} className="hover:bg-[#0F1117]/50 transition-colors group">
                                        <td className="px-8 text-center"><input type="checkbox" className="rounded-md border-[rgba(148,163,184,0.1)] text-[#3B82F6] bg-[#161922]"/></td>
                                        <td className="font-bold text-[#F8FAFC] tracking-tight">{pr.prNumber || pr.id.substring(0, 8)}</td>
                                        <td><span className={`px-2.5 py-1 rounded-lg font-black text-[9px] uppercase ${Number(pr.totalEstimate) > 50000000 ? 'bg-[#3B82F6]/10 text-[#3B82F6]' : 'bg-[#1A1D23] text-[#64748B]'}`}>{Number(pr.totalEstimate) > 50000000 ? 'Capex' : 'Opex'}</span></td>
                                        <td className="font-medium text-[#94A3B8]">{pr.title}</td>
                                        <td className="text-center">
                                            {Number(pr.totalEstimate) > 50000000 ? (
                                                <span className="text-[10px] font-black text-rose-400 uppercase flex items-center justify-center gap-1.5"><AlertTriangle size={11}/> Cảnh báo: 15% quỹ IT</span>
                                            ) : (
                                                <span className="text-[10px] font-black text-emerald-400 uppercase flex items-center justify-center gap-1.5"><CheckCircle size={11}/> An toàn: 2% quỹ IT</span>
                                            )}
                                        </td>
                                        <td className="text-right font-black text-[#F8FAFC] text-sm">{formatVND(pr.totalEstimate)} ₫</td>
                                        <td className="text-right px-8">
                                            <div className="flex justify-end gap-1">
                                                <button onClick={() => setSelectedPRDetails(pr)} className="p-1.5 bg-[#0F1117] border border-[rgba(148,163,184,0.1)] text-[#64748B] hover:text-[#3B82F6] hover:border-[#3B82F6]/20 rounded-lg transition-all"><Eye size={12}/></button>
                                                <button onClick={() => handleQuickApprove(pr.workflowId)} className="p-1.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 hover:bg-emerald-500 hover:text-white rounded-lg transition-all"><CheckCircle size={12}/></button>
                                                <button className="p-1.5 bg-rose-500/10 border border-rose-500/20 text-rose-400 hover:bg-rose-500 hover:text-white rounded-lg transition-all"><XCircle size={12}/></button>
                                            </div>
                                        </td>
                                    </tr>
                                )) : (
                                    <tr>
                                        <td colSpan={7} className="py-20 text-center text-[#64748B] font-black uppercase text-[10px]">
                                            <div className="flex flex-col items-center gap-3">
                                                <div className="p-4 bg-[#1A1D23] rounded-full"><Bell size={24} className="text-[#64748B]" /></div>
                                                Không có phiếu nào chờ duyệt
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        );
    };

    const renderProcurementDashboard = () => {
        const prSourcingQueue = (prs || []).filter(pr => pr.status === "APPROVED");
        const activeRfqs = (rfqs || []).filter(rfq => rfq.status !== "COMPLETED" && rfq.status !== "CANCELLED");
        const poApprovalPending = (pos || []).filter(po => po.status === "PENDING_APPROVAL");
        // Show POs with SHIPPING or SHIPPED status as "đang giao"
        const shippingPos = (pos || []).filter(po => po.status === "SHIPPING" || po.status === "SHIPPED" || po.status === "ISSUED" || po.status === "PARTIALLY_RECEIVED");

        // Pagination for PR table
        // eslint-disable-next-line react-hooks/rules-of-hooks
        const [currentPrPage, setCurrentPrPage] = React.useState(1);
        const prsPerPage = 5;
        const totalPrPages = Math.ceil(prSourcingQueue.length / prsPerPage);
        const paginatedPrs = prSourcingQueue.slice((currentPrPage - 1) * prsPerPage, currentPrPage * prsPerPage);

        return (
            <div className="animate-in fade-in duration-700 px-6">
                <div className="flex justify-between items-end mb-8">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <div className="h-2 w-2 rounded-full bg-blue-500 animate-pulse"></div>
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#64748B]">Hệ thống Quản trị Chuỗi cung ứng</span>
                        </div>
                        <h1 className="text-4xl font-black text-[#F8FAFC] tracking-tight">Trung tâm Quản lý Thu mua</h1>
                    </div>
                </div>

                {/* Procurement Stat Cards - Clean Consistent Style */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                    {/* PR Sourcing Queue Card */}
                    <div className="bg-[#161922] rounded-2xl p-6 border border-[rgba(148,163,184,0.1)] hover:border-[#3B82F6]/30 transition-all">
                        <div className="flex items-center justify-between mb-4">
                            <span className="text-[10px] font-black uppercase text-[#64748B] tracking-wider">PR Chờ Tìm Nguồn</span>
                            <div className="h-10 w-10 rounded-xl bg-[#3B82F6]/10 flex items-center justify-center">
                                <FileText size={20} className="text-[#3B82F6]" />
                            </div>
                        </div>
                        <div className="text-3xl font-black text-[#F8FAFC] mb-1">{prSourcingQueue.length}</div>
                        <div className="text-sm font-bold text-[#94A3B8]">Yêu cầu cần xử lý</div>
                        <div className="text-[10px] text-[#64748B] mt-3 pt-3 border-t border-[rgba(148,163,184,0.1)]">Tạo RFQ để lấy báo giá</div>
                    </div>

                    {/* Active RFQs Card */}
                    <div className="bg-[#161922] rounded-2xl p-6 border border-[rgba(148,163,184,0.1)] hover:border-blue-500/30 transition-all">
                        <div className="flex items-center justify-between mb-4">
                            <span className="text-[10px] font-black uppercase text-[#64748B] tracking-wider">RFQ Đang Xử Lý</span>
                            <div className="h-10 w-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
                                <MessageSquare size={20} className="text-blue-400" />
                            </div>
                        </div>
                        <div className="text-3xl font-black text-blue-400 mb-1">{activeRfqs.length}</div>
                        <div className="text-sm font-bold text-[#94A3B8]">Hồ sơ báo giá</div>
                        <div className="text-[10px] text-[#64748B] mt-3 pt-3 border-t border-[rgba(148,163,184,0.1)]">Chờ phản hồi từ NCC</div>
                    </div>

                    {/* PO Pending Approval Card */}
                    <div className="bg-[#161922] rounded-2xl p-6 border border-[rgba(148,163,184,0.1)] hover:border-amber-500/30 transition-all">
                        <div className="flex items-center justify-between mb-4">
                            <span className="text-[10px] font-black uppercase text-[#64748B] tracking-wider">PO Chờ Duyệt</span>
                            <div className="h-10 w-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
                                <FileCheck size={20} className="text-amber-400" />
                            </div>
                        </div>
                        <div className="text-3xl font-black text-amber-400 mb-1">{poApprovalPending.length}</div>
                        <div className="text-sm font-bold text-[#94A3B8]">Đơn hàng chờ phê duyệt</div>
                        <div className="text-[10px] text-[#64748B] mt-3 pt-3 border-t border-[rgba(148,163,184,0.1)]">Cần duyệt để gửi NCC</div>
                    </div>

                    {/* PO Shipping Card */}
                    <div className="bg-[#161922] rounded-2xl p-6 border border-[rgba(148,163,184,0.1)] hover:border-emerald-500/30 transition-all">
                        <div className="flex items-center justify-between mb-4">
                            <span className="text-[10px] font-black uppercase text-[#64748B] tracking-wider">PO Đang Giao</span>
                            <div className="h-10 w-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                                <Truck size={20} className="text-emerald-400" />
                            </div>
                        </div>
                        <div className="text-3xl font-black text-emerald-400 mb-1">{shippingPos.length}</div>
                        <div className="text-sm font-bold text-[#94A3B8]">Đơn hàng đang vận chuyển</div>
                        <div className="text-[10px] text-[#64748B] mt-3 pt-3 border-t border-[rgba(148,163,184,0.1)]">SHIPPING • SHIPPED • ISSUED</div>
                    </div>
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-2 gap-10">
                    {/* PR Sourcing Queue */}
                    <div className="space-y-6">
                        <div className="flex items-center justify-between">
                            <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-[#F8FAFC]">YÊU CẦU CẦN XỬ LÝ (PR -{">"} RFQ)</h3>
                            <Link href="/sourcing" className="text-[10px] font-black text-[#3B82F6] hover:underline uppercase tracking-widest">Xem tất cả {">"}</Link>
                        </div>
                        <div className="erp-card !p-0 overflow-hidden shadow-2xl shadow-[#3B82F6]/5 border-none bg-[#161922]">
                            <div className="overflow-x-auto">
                                <table className="erp-table text-xs whitespace-nowrap">
                                    <thead>
                                        <tr className="bg-[#0F1117]">
                                            <th>MÃ PR</th>
                                            <th>PHÒNG BAN</th>
                                            <th>DEADLINE</th>
                                            <th className="text-center">MỨC ĐỘ</th>
                                            <th>TRẠNG THÁI RFQ</th>
                                            <th className="text-right px-8">THAO TÁC</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-[rgba(148,163,184,0.1)]">
                                        {paginatedPrs.length > 0 ? paginatedPrs.map((pr) => {
                                            const isSimulation = pr.id?.includes("SIM");
                                            return (
                                                <tr key={pr.id} className={`group hover:bg-[#0F1117]/50 transition-colors border-b border-[rgba(148,163,184,0.1)] ${isSimulation ? 'bg-[#3B82F6]/5 border-[#3B82F6]/20' : ''}`}>
                                                    <td className="py-5 px-4 first:pl-6">
                                                        <div className="flex flex-col">
                                                            <div className="flex items-center gap-2">
                                                                <span className="text-[11px] font-black text-[#F8FAFC] tracking-tight">{pr.prNumber}</span>
                                                                {isSimulation && <span className="bg-[#3B82F6] text-white text-[7px] font-black px-1.5 py-0.5 rounded-full uppercase tracking-widest animate-pulse shadow-sm ring-2 ring-[#3B82F6]/20">GIẢ LẬP</span>}
                                                            </div>
                                                            <span className="text-[9px] font-bold text-[#64748B] uppercase mt-1">{formatDate(pr.createdAt)}</span>
                                                        </div>
                                                    </td>
                                                    <td className="py-5 px-4">
                                                        <div className="flex items-center gap-3">
                                                            <div className="h-8 w-8 rounded-lg bg-[#1A1D23] flex items-center justify-center text-[#64748B] group-hover:scale-110 transition-transform">
                                                                <FileText size={14} />
                                                            </div>
                                                            <div className="flex flex-col">
                                                                <span className="text-[11px] font-black text-[#94A3B8] leading-tight group-hover:text-[#F8FAFC] transition-colors">{pr.title}</span>
                                                                <span className="text-[9px] text-[#64748B] font-bold mt-1 uppercase tracking-tight">{typeof pr.department === 'object' ? pr.department?.name : (pr.department || "Phòng ban")}</span>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="text-[#64748B] font-medium">
                                                        {pr.requiredDate ? (
                                                            formatDate(pr.requiredDate)
                                                        ) : (
                                                            <span className="text-[#64748B]/50 italic">--/--/--</span>
                                                        )}
                                                    </td>
                                                    <td className="text-center">
                                                        <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase ${pr.priority === 1 ? 'bg-rose-500/10 text-rose-400' : 'bg-amber-500/10 text-amber-400'}`}>
                                                            {pr.priority === 1 ? 'CAO' : 'VỪA'}
                                                        </span>
                                                    </td>
                                                    <td><span className="text-[10px] font-bold text-[#64748B] italic">Chờ RFQ</span></td>
                                                    <td className="text-right pl-2 pr-6">
                                                        {pr.type === "CATALOG" ? (
                                                            <button 
                                                                onClick={() => setConfirmModal(pr)}
                                                                className="inline-flex items-center justify-center whitespace-nowrap px-3 py-1.5 bg-blue-600 text-white text-[9px] font-black uppercase tracking-wide rounded-lg hover:bg-blue-700 transition-all shadow-sm"
                                                            >
                                                                Xác nhận giá
                                                            </button>
                                                        ) : (
                                                            <Link 
                                                                href={`/procurement/rfq/create?prId=${pr.id}`} 
                                                                className="inline-flex items-center justify-center whitespace-nowrap px-3 py-1.5 bg-[#3B82F6] text-white text-[9px] font-black uppercase tracking-wide rounded-lg hover:bg-[#2563EB] transition-all shadow-sm"
                                                            >
                                                                Lấy Báo Giá
                                                            </Link>
                                                        )}
                                                    </td>
                                                </tr>
                                            );
                                        }) : (
                                            <tr><td colSpan={6} className="py-12 text-center text-[#64748B] font-black uppercase text-[10px]">Không có PR nào cần xử lý</td></tr>
                                        )}
                                    </tbody>
                                </table>
                                {/* Pagination Navigation */}
                                {totalPrPages > 1 && (
                                    <div className="flex items-center justify-between px-6 py-4 bg-[#0F1117] border-t border-[rgba(148,163,184,0.1)]">
                                        <div className="text-[10px] text-[#64748B]">
                                            Hiển thị <span className="font-bold text-[#F8FAFC]">{paginatedPrs.length}</span> / <span className="font-bold text-[#F8FAFC]">{prSourcingQueue.length}</span> PR
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => setCurrentPrPage(p => Math.max(1, p - 1))}
                                                disabled={currentPrPage === 1}
                                                className="px-3 py-1.5 bg-[#161922] border border-[rgba(148,163,184,0.1)] rounded-lg text-[10px] font-bold text-[#F8FAFC] hover:bg-[#1A1D23] disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center gap-1"
                                            >
                                                <ChevronDown size={12} className="rotate-90" /> Trước
                                            </button>
                                            <div className="flex items-center gap-1">
                                                {Array.from({ length: totalPrPages }, (_, i) => i + 1).map(page => (
                                                    <button
                                                        key={page}
                                                        onClick={() => setCurrentPrPage(page)}
                                                        className={`w-8 h-8 rounded-lg text-[10px] font-bold transition-all ${
                                                            currentPrPage === page
                                                                ? 'bg-[#3B82F6] text-white'
                                                                : 'bg-[#161922] text-[#64748B] hover:text-[#F8FAFC] hover:bg-[#1A1D23]'
                                                        }`}
                                                    >
                                                        {page}
                                                    </button>
                                                ))}
                                            </div>
                                            <button
                                                onClick={() => setCurrentPrPage(p => Math.min(totalPrPages, p + 1))}
                                                disabled={currentPrPage === totalPrPages}
                                                className="px-3 py-1.5 bg-[#161922] border border-[rgba(148,163,184,0.1)] rounded-lg text-[10px] font-bold text-[#F8FAFC] hover:bg-[#1A1D23] disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center gap-1"
                                            >
                                                Sau <ChevronDown size={12} className="-rotate-90" />
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* PO Tracking - Show SHIPPING/SHIPPED POs */}
                    <div className="space-y-6">
                        <div className="flex items-center justify-between">
                            <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-[#F8FAFC]">TÌNH TRẠNG GIAO HÀNG (ĐANG GIAO)</h3>
                            <Link href="/po" className="text-[10px] font-black text-[#3B82F6] hover:underline uppercase tracking-widest">PO Manager {">"}</Link>
                        </div>
                        <div className="erp-card !p-0 overflow-hidden shadow-2xl shadow-[#3B82F6]/5 border-none bg-[#161922]">
                            <div className="overflow-x-auto">
                                <table className="erp-table text-xs whitespace-nowrap">
                                    <thead>
                                        <tr className="bg-[#0F1117]">
                                            <th>MÃ PO</th>
                                            <th>NHÀ CUNG CẤP</th>
                                            <th>TRẠNG THÁI</th>
                                            <th className="w-1/4">TIẾN ĐỘ</th>
                                            <th className="text-right">TỔNG TIỀN</th>
                                            <th className="text-right px-6">THAO TÁC</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-[rgba(148,163,184,0.1)]">
                                        {shippingPos.length > 0 ? shippingPos.slice(0, 5).map((po) => {
                                            // Calculate progress based on status
                                            const getProgress = (status: string) => {
                                                switch(status) {
                                                    case 'SHIPPED': return 75;
                                                    case 'SHIPPING': return 50;
                                                    case 'PARTIALLY_RECEIVED': return 25;
                                                    case 'ISSUED': return 10;
                                                    default: return 0;
                                                }
                                            };
                                            const getStatusDisplay = (status: string) => {
                                                switch(status) {
                                                    case 'SHIPPED': return { label: 'Đã giao hàng', color: 'text-emerald-400', bg: 'bg-emerald-500/20' };
                                                    case 'SHIPPING': return { label: 'Đang vận chuyển', color: 'text-blue-400', bg: 'bg-blue-500/20' };
                                                    case 'PARTIALLY_RECEIVED': return { label: 'Nhận một phần', color: 'text-amber-400', bg: 'bg-amber-500/20' };
                                                    case 'ISSUED': return { label: 'Đã gửi NCC', color: 'text-[#64748B]', bg: 'bg-[#64748B]/20' };
                                                    default: return { label: status, color: 'text-[#64748B]', bg: 'bg-[#64748B]/20' };
                                                }
                                            };
                                            const progress = getProgress(po.status);
                                            const statusDisplay = getStatusDisplay(po.status);
                                            return (
                                                <tr key={po.id} className="hover:bg-[#0F1117]/50 transition-colors group">
                                                    <td className="font-bold text-[#F8FAFC]">{po.poNumber || po.id.substring(0, 8)}</td>
                                                    <td className="font-semibold text-[#94A3B8] truncate max-w-[120px]">{typeof po.vendor === 'string' ? po.vendor : (po.vendor as Organization)?.name || "Vendor"}</td>
                                                    <td>
                                                        <span className={`text-[9px] font-black uppercase px-2 py-1 rounded-full ${statusDisplay.bg} ${statusDisplay.color}`}>
                                                            {statusDisplay.label}
                                                        </span>
                                                    </td>
                                                    <td>
                                                        <div className="flex items-center gap-3">
                                                            <div className="flex-1 h-1.5 bg-[#1A1D23] rounded-full overflow-hidden">
                                                                <div 
                                                                    className={`h-full transition-all duration-1000 ${
                                                                        po.status === 'SHIPPED' ? 'bg-emerald-500' :
                                                                        po.status === 'SHIPPING' ? 'bg-blue-500' :
                                                                        po.status === 'PARTIALLY_RECEIVED' ? 'bg-amber-500' :
                                                                        'bg-[#64748B]'
                                                                    }`} 
                                                                    style={{ width: `${progress}%` }}
                                                                ></div>
                                                            </div>
                                                            <span className="text-[9px] font-black text-[#64748B]">{progress}%</span>
                                                        </div>
                                                    </td>
                                                    <td className="text-right font-black text-[#F8FAFC] text-sm">{formatVND(po.total)} ₫</td>
                                                    <td className="text-right pl-2 pr-6">
                                                        <Link 
                                                            href={`/po/${po.id}`}
                                                            className="inline-flex items-center justify-center whitespace-nowrap px-3 py-1.5 bg-[#3B82F6] text-white text-[9px] font-black uppercase tracking-wide rounded-lg hover:bg-[#2563EB] transition-all"
                                                        >
                                                            Chi tiết
                                                        </Link>
                                                    </td>
                                                </tr>
                                            );
                                        }) : (
                                            <tr><td colSpan={6} className="py-20 text-center text-[#64748B] font-black uppercase text-[10px]">Chưa có đơn hàng đang giao</td></tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    const renderApproverDashboard = () => {
        const myPendingPRs = (approvals || []).map((app) => {
            const pr = prs.find((p) => p.id === app.documentId);
            if (!pr) return null;
            return { ...pr, workflowId: app.id };
        }).filter((p): p is (PR & { workflowId: string }) => p !== null);

        const pendingPRCount = myPendingPRs.length;
        const pendingPRValue = myPendingPRs.reduce((sum: number, pr) => sum + (Number(pr.totalEstimate) || 0), 0);

        return (
            <div className="animate-in fade-in duration-500 px-6">
                {/* HEADER - With PR Creation for Director/CEO */}
                <header className="flex items-center justify-between mb-6 pb-4 border-b border-[rgba(148,163,184,0.1)]">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-[#161922] border border-[rgba(148,163,184,0.1)] flex items-center justify-center">
                            <span className="text-lg font-black text-[#3B82F6]">{currentUser?.name?.charAt(0) || currentUser?.fullName?.charAt(0) || 'U'}</span>
                        </div>
                        <div>
                            <h1 className="text-lg font-black text-[#F8FAFC] tracking-tight">Xin chào, {currentUser?.name || currentUser?.fullName}</h1>
                            <p className="text-xs text-[#64748B]">{currentUser?.role} • {typeof currentUser?.department === 'object' ? (currentUser.department as { name: string })?.name : (currentUser?.department || 'Phòng ban')}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                         <Link href="/quote-requests/create" className="px-4 py-2.5 bg-[#161922] border border-[rgba(148,163,184,0.1)] text-[#94A3B8] rounded-xl font-bold text-xs hover:bg-[#1A1D23] hover:text-[#F8FAFC] transition-all">
                             + Báo giá
                         </Link>
                         <div className="relative">
                            <button 
                                onClick={() => setIsSimDropdownOpen(!isSimDropdownOpen)}
                                className="px-4 py-2.5 bg-[#3B82F6] text-white rounded-xl font-bold text-xs hover:bg-[#2563EB] transition-all flex items-center gap-2"
                            >
                                + Tạo PR
                                <ChevronDown size={14} className={`transition-transform ${isSimDropdownOpen ? 'rotate-180' : ''}`} />
                            </button>
                            
                            {isSimDropdownOpen && (
                                <div className="absolute top-full right-0 mt-3 w-72 bg-[#161922] rounded-3xl border border-[rgba(148,163,184,0.1)] shadow-2xl z-50 overflow-hidden animate-in slide-in-from-top-2 duration-200">
                                    <Link href="/pr/create" className="flex items-center gap-4 p-5 hover:bg-[#1A1D23] transition-colors border-b border-[rgba(148,163,184,0.1)] text-left w-full translate-z-0">
                                        <div className="p-3 bg-[#3B82F6]/10 text-[#3B82F6] rounded-xl"><Plus size={18} /></div>
                                        <div>
                                            <div className="text-[10px] font-black uppercase text-[#F8FAFC] mb-1 tracking-widest">Tạo quy trình thủ công</div>
                                            <div className="text-[9px] text-[#64748B] font-bold uppercase leading-tight">Vào PR trực tiếp</div>
                                        </div>
                                    </Link>
                                    <button 
                                        // eslint-disable-next-line react-hooks/rules-of-hooks
                                        onClick={() => { useProcurement().startSimulation("CATALOG"); setIsSimDropdownOpen(false); }}
                                        className="flex items-center gap-4 p-5 hover:bg-[#1A1D23] transition-colors border-b border-[rgba(148,163,184,0.1)] w-full text-left"
                                    >
                                        <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-xl"><Zap size={18} /></div>
                                        <div>
                                             <div className="text-[10px] font-black uppercase text-[#F8FAFC] mb-1 tracking-widest">Giả lập Catalog</div>
                                             <div className="text-[9px] text-[#64748B] font-bold uppercase leading-tight">Demo full-flow từ Catalog</div>
                                        </div>
                                    </button>
                                    <button 
                                        // eslint-disable-next-line react-hooks/rules-of-hooks
                                        onClick={() => { useProcurement().startSimulation("NON_CATALOG"); setIsSimDropdownOpen(false); }}
                                        className="flex items-center gap-4 p-5 hover:bg-[#1A1D23] transition-colors w-full text-left"
                                    >
                                        <div className="p-3 bg-purple-500/10 text-purple-400 rounded-xl"><RotateCcw size={18} /></div>
                                        <div>
                                            <div className="text-[10px] font-black uppercase text-[#F8FAFC] mb-1 tracking-widest">Giả lập Non-Catalog</div>
                                            <div className="text-[9px] text-[#64748B] font-bold uppercase leading-tight">Demo full-flow từ PR</div>
                                        </div>
                                    </button>
                                </div>
                            )}
                         </div>
                    </div>
                </header>

                {/* Summary Cards - Clean Style */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    {/* Pending PRs Card */}
                    <div className="bg-[#161922] rounded-2xl p-6 border border-[rgba(148,163,184,0.1)] hover:border-[#3B82F6]/30 transition-all">
                        <div className="flex items-center justify-between mb-4">
                            <span className="text-[10px] font-black uppercase text-[#64748B] tracking-wider">PR Chờ Duyệt</span>
                            <div className="h-10 w-10 rounded-xl bg-[#3B82F6]/10 flex items-center justify-center">
                                <FileText size={20} className="text-[#3B82F6]" />
                            </div>
                        </div>
                        <div className="text-3xl font-black text-[#F8FAFC] mb-1">{pendingPRCount}</div>
                        <div className="text-sm font-bold text-[#3B82F6]">{formatVND(pendingPRValue)}</div>
                        <div className="text-[10px] text-[#64748B] mt-3 pt-3 border-t border-[rgba(148,163,184,0.1)]">Tổng giá trị chờ phê duyệt</div>
                    </div>

                    {/* Pending POs Card */}
                    <div className="bg-[#161922] rounded-2xl p-6 border border-[rgba(148,163,184,0.1)] hover:border-amber-500/30 transition-all">
                        <div className="flex items-center justify-between mb-4">
                            <span className="text-[10px] font-black uppercase text-[#64748B] tracking-wider">Cảnh Báo Tồn Đọng</span>
                            <div className="h-10 w-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
                                <AlertTriangle size={20} className="text-amber-400" />
                            </div>
                        </div>
                        <div className="text-3xl font-black text-amber-400 mb-1">{pendingPRCount}</div>
                        <div className="text-sm font-bold text-[#94A3B8]">{pendingPRCount > 0 ? 'Cần xử lý ngay' : 'Không có tồn đọng'}</div>
                        <div className="text-[10px] text-[#64748B] mt-3 pt-3 border-t border-[rgba(148,163,184,0.1)]">Phiếu đang chờ bạn duyệt</div>
                    </div>

                    {/* Quick Action Card */}
                    <div className="bg-[#161922] rounded-2xl p-6 border border-[rgba(148,163,184,0.1)] hover:border-emerald-500/30 transition-all">
                        <div className="flex items-center justify-between mb-4">
                            <span className="text-[10px] font-black uppercase text-[#64748B] tracking-wider">Tạo PR Mới</span>
                            <div className="h-10 w-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                                <Plus size={20} className="text-emerald-400" />
                            </div>
                        </div>
                        <div className="text-lg font-black text-[#F8FAFC] mb-2">Tạo yêu cầu mua hàng</div>
                        <button 
                            onClick={() => setIsSimDropdownOpen(!isSimDropdownOpen)}
                            className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all"
                        >
                            + Tạo PR Ngay
                        </button>
                        <div className="text-[10px] text-[#64748B] mt-3 pt-3 border-t border-[rgba(148,163,184,0.1)]">Bắt đầu quy trình mua hàng mới</div>
                    </div>
                </div>

                {/* Enhanced Budget Section for Department Head */}
                {currentUser?.role === "DEPT_APPROVER" && (
                    <div className="mb-8 space-y-6">
                        {/* Budget Overview Header */}
                        <div className="flex items-center justify-between">
                            <h3 className="text-sm font-black text-[#F8FAFC] uppercase tracking-widest flex items-center gap-2">
                                <DollarSign size={18} className="text-emerald-400" />
                                Tổng quan Ngân sách Phòng ban
                            </h3>
                            <div className="flex items-center gap-3">
                                <span className="text-xs text-[#64748B]">
                                    Kỳ ngân sách: <span className="text-[#F8FAFC] font-bold">{activeQuarterPeriod ? `Q${activeQuarterPeriod.periodNumber} ${activeQuarterPeriod.fiscalYear}` : 'Chưa thiết lập'}</span>
                                </span>
                                <Link href="/manager/spend-tracking" className="text-xs font-bold text-[#3B82F6] hover:text-[#60A5FA] flex items-center gap-1 bg-[#3B82F6]/10 px-3 py-1.5 rounded-lg border border-[#3B82F6]/20 transition-all">
                                    Chi tiết chi tiêu <ArrowUpRight size={14} />
                                </Link>
                            </div>
                        </div>

                        {/* Budget Stats Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            {/* Total Allocated */}
                            <div className="bg-[#161922] rounded-2xl p-5 border border-[rgba(148,163,184,0.1)] hover:border-[#3B82F6]/30 transition-all">
                                <div className="flex items-center justify-between mb-3">
                                    <span className="text-[10px] font-black uppercase text-[#64748B] tracking-wider">Tổng ngân sách</span>
                                    <div className="h-8 w-8 rounded-lg bg-[#3B82F6]/10 flex items-center justify-center">
                                        <DollarSign size={16} className="text-[#3B82F6]" />
                                    </div>
                                </div>
                                <div className="text-xl font-black text-[#F8FAFC]">
                                    {deptAllocation ? formatVND(deptAllocation.allocatedAmount) : '---'}
                                </div>
                                <div className="text-[10px] text-[#64748B] mt-1">Được phân bổ cho kỳ này</div>
                            </div>

                            {/* Committed Amount */}
                            <div className="bg-bg-secondary rounded-2xl p-5 border border-[rgba(148,163,184,0.1)] hover:border-amber-500/30 transition-all">
                                <div className="flex items-center justify-between mb-3">
                                    <span className="text-[10px] font-black uppercase text-[#64748B] tracking-wider">Cam kết chi</span>
                                    <div className="h-8 w-8 rounded-lg bg-amber-500/10 flex items-center justify-center">
                                        <ShoppingCart size={16} className="text-amber-400" />
                                    </div>
                                </div>
                                <div className="text-xl font-black text-amber-400">
                                    {deptAllocation ? formatVND(deptAllocation.committedAmount) : '---'}
                                </div>
                                <div className="text-[10px] text-[#64748B] mt-1">PO đã tạo / Đang chờ</div>
                            </div>

                            {/* Spent Amount */}
                            <div className="bg-bg-secondary rounded-2xl p-5 border border-[rgba(148,163,184,0.1)] hover:border-purple-500/30 transition-all">
                                <div className="flex items-center justify-between mb-3">
                                    <span className="text-[10px] font-black uppercase text-[#64748B] tracking-wider">Đã chi thực tế</span>
                                    <div className="h-8 w-8 rounded-lg bg-purple-500/10 flex items-center justify-center">
                                        <CreditCard size={16} className="text-purple-400" />
                                    </div>
                                </div>
                                <div className="text-xl font-black text-purple-400">
                                    {deptAllocation ? formatVND(deptAllocation.spentAmount) : '---'}
                                </div>
                                <div className="text-[10px] text-[#64748B] mt-1">Thanh toán đã thực hiện</div>
                            </div>

                            {/* Remaining Budget */}
                            <div className="bg-[#161922] rounded-2xl p-5 border border-[rgba(148,163,184,0.1)] hover:border-emerald-500/30 transition-all">
                                <div className="flex items-center justify-between mb-3">
                                    <span className="text-[10px] font-black uppercase text-[#64748B] tracking-wider">Còn lại</span>
                                    <div className="h-8 w-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                                        <CheckCircle size={16} className="text-emerald-400" />
                                    </div>
                                </div>
                                <div className="text-xl font-black text-emerald-400">
                                    {deptAllocation ? formatVND(deptAllocation.allocatedAmount - deptAllocation.committedAmount - deptAllocation.spentAmount) : '---'}
                                </div>
                                <div className="text-[10px] text-[#64748B] mt-1">Có thể sử dụng</div>
                            </div>
                        </div>

                        {/* Budget Utilization Progress & Alerts */}
                        {deptAllocation && (
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                {/* Main Progress Bar */}
                                <div className="lg:col-span-2 bg-[#161922] rounded-2xl p-6 border border-[rgba(148,163,184,0.1)]">
                                    <div className="flex items-center justify-between mb-4">
                                        <h4 className="text-xs font-black text-[#F8FAFC] uppercase tracking-wider">Tỷ lệ sử dụng ngân sách</h4>
                                        <span className={`text-sm font-black ${
                                            ((deptAllocation.committedAmount + deptAllocation.spentAmount) / deptAllocation.allocatedAmount) > 0.9 ? 'text-red-400' :
                                            ((deptAllocation.committedAmount + deptAllocation.spentAmount) / deptAllocation.allocatedAmount) > 0.75 ? 'text-amber-400' : 'text-emerald-400'
                                        }`}>
                                            {Math.round(((deptAllocation.committedAmount + deptAllocation.spentAmount) / deptAllocation.allocatedAmount) * 100)}%
                                        </span>
                                    </div>
                                    
                                    {/* Stacked Progress Bar */}
                                    <div className="relative h-4 bg-[#0F1117] rounded-full overflow-hidden mb-4">
                                        {/* Spent portion */}
                                        <div 
                                            className="absolute left-0 top-0 h-full bg-purple-500 transition-all duration-1000"
                                            style={{ width: `${Math.min(100, (deptAllocation.spentAmount / deptAllocation.allocatedAmount) * 100)}%` }}
                                        />
                                        {/* Committed portion */}
                                        <div 
                                            className="absolute top-0 h-full bg-amber-500 transition-all duration-1000"
                                            style={{ 
                                                left: `${Math.min(100, (deptAllocation.spentAmount / deptAllocation.allocatedAmount) * 100)}%`,
                                                width: `${Math.min(100 - (deptAllocation.spentAmount / deptAllocation.allocatedAmount) * 100, (deptAllocation.committedAmount / deptAllocation.allocatedAmount) * 100)}%` 
                                            }}
                                        />
                                    </div>
                                    
                                    {/* Legend */}
                                    <div className="flex items-center gap-6 text-[10px]">
                                        <div className="flex items-center gap-2">
                                            <div className="w-3 h-3 rounded bg-purple-500" />
                                            <span className="text-[#94A3B8]">Đã chi ({Math.round((deptAllocation.spentAmount / deptAllocation.allocatedAmount) * 100)}%)</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <div className="w-3 h-3 rounded bg-amber-500" />
                                            <span className="text-[#94A3B8]">Cam kết ({Math.round((deptAllocation.committedAmount / deptAllocation.allocatedAmount) * 100)}%)</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <div className="w-3 h-3 rounded bg-[#0F1117] border border-[rgba(148,163,184,0.3)]" />
                                            <span className="text-[#94A3B8]">Còn lại ({Math.round(((deptAllocation.allocatedAmount - deptAllocation.committedAmount - deptAllocation.spentAmount) / deptAllocation.allocatedAmount) * 100)}%)</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Budget Alerts */}
                                <div className="bg-[#161922] rounded-2xl p-6 border border-[rgba(148,163,184,0.1)]">
                                    <h4 className="text-xs font-black text-[#F8FAFC] uppercase tracking-wider mb-4 flex items-center gap-2">
                                        <AlertTriangle size={14} className="text-amber-400" />
                                        Cảnh báo ngân sách
                                    </h4>
                                    <div className="space-y-3">
                                        {((deptAllocation.committedAmount + deptAllocation.spentAmount) / deptAllocation.allocatedAmount) > 0.9 ? (
                                            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl">
                                                <div className="flex items-start gap-2">
                                                    <AlertTriangle size={16} className="text-red-400 shrink-0 mt-0.5" />
                                                    <div>
                                                        <p className="text-xs font-bold text-red-400">Ngân sách sắp hết!</p>
                                                        <p className="text-[10px] text-red-400/70 mt-1">Đã sử dụng {Math.round(((deptAllocation.committedAmount + deptAllocation.spentAmount) / deptAllocation.allocatedAmount) * 100)}% ngân sách kỳ này.</p>
                                                    </div>
                                                </div>
                                            </div>
                                        ) : ((deptAllocation.committedAmount + deptAllocation.spentAmount) / deptAllocation.allocatedAmount) > 0.75 ? (
                                            <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl">
                                                <div className="flex items-start gap-2">
                                                    <AlertCircle size={16} className="text-amber-400 shrink-0 mt-0.5" />
                                                    <div>
                                                        <p className="text-xs font-bold text-amber-400">Cảnh báo sử dụng</p>
                                                        <p className="text-[10px] text-amber-400/70 mt-1">Đã sử dụng {Math.round(((deptAllocation.committedAmount + deptAllocation.spentAmount) / deptAllocation.allocatedAmount) * 100)}% ngân sách.</p>
                                                    </div>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
                                                <div className="flex items-start gap-2">
                                                    <CheckCircle size={16} className="text-emerald-400 shrink-0 mt-0.5" />
                                                    <div>
                                                        <p className="text-xs font-bold text-emerald-400">Ngân sách ổn định</p>
                                                        <p className="text-[10px] text-emerald-400/70 mt-1">Còn {Math.round(100 - ((deptAllocation.committedAmount + deptAllocation.spentAmount) / deptAllocation.allocatedAmount) * 100)}% ngân sách chưa sử dụng.</p>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                        
                                        {/* Pending PRs Impact */}
                                        {pendingPRValue > 0 && (
                                            <div className="p-3 bg-[#3B82F6]/10 border border-[#3B82F6]/20 rounded-xl">
                                                <div className="flex items-start gap-2">
                                                    <FileText size={16} className="text-[#3B82F6] shrink-0 mt-0.5" />
                                                    <div>
                                                        <p className="text-xs font-bold text-[#3B82F6]">PR đang chờ duyệt</p>
                                                        <p className="text-[10px] text-[#3B82F6]/70 mt-1">
                                                            {myPendingPRs.length} PR ({formatVND(pendingPRValue)}) đang chờ phê duyệt sẽ ảnh hưởng đến ngân sách còn lại.
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Cost Center Budget Breakdown */}
                        {deptAllocation && costCenters && costCenters.length > 0 && (
                            <div className="bg-[#161922] rounded-2xl p-6 border border-[rgba(148,163,184,0.1)]">
                                <h4 className="text-xs font-black text-[#F8FAFC] uppercase tracking-wider mb-4">Phân bổ theo Cost Center</h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {costCenters
                                        .filter(cc => cc.deptId === departmentId)
                                        .map(cc => {
                                            const ccAllocations = (budgetAllocations || []).filter(a => a.costCenterId === cc.id && a.budgetPeriodId === activeQuarterPeriod?.id);
                                            const ccTotal = ccAllocations.reduce((sum, a) => sum + a.allocatedAmount, 0);
                                            const ccUsed = ccAllocations.reduce((sum, a) => sum + a.committedAmount + a.spentAmount, 0);
                                            
                                            return (
                                                <div key={cc.id} className="p-4 bg-[#0F1117] rounded-xl border border-[rgba(148,163,184,0.1)]">
                                                    <div className="flex items-center justify-between mb-2">
                                                        <span className="text-xs font-bold text-[#F8FAFC]">{cc.code}</span>
                                                        <span className="text-[10px] text-[#64748B]">{cc.name}</span>
                                                    </div>
                                                    <div className="text-sm font-black text-[#3B82F6] mb-2">{formatVND(ccTotal)}</div>
                                                    <div className="h-1.5 bg-[#161922] rounded-full overflow-hidden">
                                                        <div 
                                                            className={`h-full rounded-full ${ccUsed / ccTotal > 0.9 ? 'bg-red-500' : ccUsed / ccTotal > 0.7 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                                                            style={{ width: `${Math.min(100, (ccUsed / ccTotal) * 100) || 0}%` }}
                                                        />
                                                    </div>
                                                    <div className="flex justify-between mt-2 text-[10px] text-[#64748B]">
                                                        <span>Đã dùng: {formatVND(ccUsed)}</span>
                                                        <span>{ccTotal > 0 ? Math.round((ccUsed / ccTotal) * 100) : 0}%</span>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Search & Filter Toolbar */}
                <div className="flex flex-wrap items-center justify-between gap-4 mb-6 bg-[#161922] p-4 rounded-3xl border border-[rgba(148,163,184,0.1)] shadow-sm">
                    <div className="flex items-center gap-4">
                        <h3 className="text-[10px] font-black uppercase tracking-widest text-[#F8FAFC] flex items-center gap-2 px-4 border-r border-[rgba(148,163,184,0.1)]">
                            <FileText size={16} className="text-[#3B82F6]" /> Queue Cần Duyệt Mới Nhất
                        </h3>
                        <button 
                            disabled={pendingPRCount === 0} 
                            className={`px-5 py-2 ${pendingPRCount === 0 ? 'bg-[#1A1D23] text-[#64748B] cursor-not-allowed' : 'bg-[#3B82F6] text-white hover:bg-[#2563EB] transition-all shadow-md'} text-[10px] font-black uppercase tracking-widest rounded-xl`}
                        >
                            Duyệt hàng loạt ({pendingPRCount})
                        </button>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="relative group">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#64748B] group-focus-within:text-[#3B82F6] transition-colors" size={16} />
                            <input
                                type="text"
                                placeholder="Tìm kiếm mã PR, người tạo..."
                                className="pl-11 pr-6 py-2.5 bg-[#0F1117] border border-[rgba(148,163,184,0.1)] rounded-2xl text-xs font-bold w-64 focus:outline-none focus:ring-2 focus:ring-[#3B82F6]/20 focus:bg-[#0F1117] transition-all text-[#F8FAFC] placeholder:text-[#64748B]"
                            />
                        </div>
                        <button className="flex items-center gap-2 px-4 py-2.5 bg-[#161922] border border-[rgba(148,163,184,0.1)] rounded-2xl text-[9px] font-black uppercase tracking-widest text-[#94A3B8] hover:bg-[#1A1D23] transition-all shadow-sm">
                            Lọc theo Cấp độ <ChevronDown size={14} />
                        </button>
                        <button className="flex items-center gap-2 px-4 py-2.5 bg-[#161922] border border-[rgba(148,163,184,0.1)] rounded-2xl text-[9px] font-black uppercase tracking-widest text-[#94A3B8] hover:bg-[#1A1D23] transition-all shadow-sm">
                            Lọc theo Phân loại <ChevronDown size={14} />
                        </button>
                        <button className="flex items-center gap-2 px-4 py-2.5 bg-[#161922] border border-[rgba(148,163,184,0.1)] rounded-2xl text-[9px] font-black uppercase tracking-widest text-[#94A3B8] hover:bg-[#1A1D23] transition-all shadow-sm">
                            Khoảng giá <ChevronDown size={14} />
                        </button>
                        <Link href="/approvals" className="ml-2 text-[9px] font-black uppercase text-[#3B82F6] hover:underline bg-[#3B82F6]/10 px-4 py-2.5 rounded-2xl border border-[#3B82F6]/20 transition-all">
                            Tới màn hình duyệt &gt;
                        </Link>
                    </div>
                </div>

                <div className="erp-card !p-0 overflow-hidden shadow-xl shadow-[#3B82F6]/5 bg-[#161922]">
                    <div className="overflow-x-auto">
                        <table className="erp-table text-xs whitespace-nowrap">
                            <thead>
                                <tr>
                                    <th className="w-10 px-8 text-center bg-[#0F1117]">
                                        <input type="checkbox" className="rounded-md border-[rgba(148,163,184,0.1)] text-[#3B82F6] bg-[#161922]" />
                                    </th>
                                    <th className="bg-[#0F1117]">Số phiếu</th>
                                    <th className="bg-[#0F1117]">Ngày tạo</th>
                                    <th className="text-center bg-[#0F1117]">Cấp độ</th>
                                    <th className="bg-[#0F1117]">Người tạo</th>
                                    <th className="text-center bg-[#0F1117]">Phân loại</th>
                                    <th className="w-[20%] bg-[#0F1117]">Tiêu đề</th>
                                    <th className="text-right bg-[#0F1117]">Tổng giá trị</th>
                                    <th className="text-right px-8 bg-[#0F1117]">Thao tác</th>
                                </tr>
                            </thead>
                            <tbody>
                                {myPendingPRs.length > 0 ? myPendingPRs.map((pr) => {
                                    const priorityInfo = pr.priority === 1
                                        ? { label: 'CAO', color: 'bg-red-500' }
                                        : (pr.priority === 2 ? { label: 'VỪA', color: 'bg-amber-500' } : { label: 'THẤP', color: 'bg-[#64748B]' });

                                    const requesterName = pr.requester?.fullName || pr.requester?.name || "N/A";

                                    return (
                                        <tr key={pr.id} className="hover:bg-[#0F1117]/50 transition-colors group">
                                            <td className="px-8 text-center">
                                                <input type="checkbox" className="rounded-md border-[rgba(148,163,184,0.1)] text-[#3B82F6] bg-[#161922]" />
                                            </td>
                                            <td className="font-bold text-[#F8FAFC]">{pr.prNumber || pr.id.substring(0, 8)}</td>
                                            <td className="text-[#64748B] font-medium">{formatDate(pr.createdAt)}</td>
                                            <td className="text-center">
                                                <span className={`px-2.5 py-1 ${priorityInfo.color} text-white rounded-lg font-black text-[9px] uppercase shadow-sm`}>
                                                    {priorityInfo.label}
                                                </span>
                                            </td>
                                            <td>
                                                <div className="flex items-center gap-2">
                                                    <div className="w-7 h-7 rounded-full bg-[#1A1D23] flex items-center justify-center overflow-hidden border border-[rgba(148,163,184,0.1)]">
                                                        <img src={`https://ui-avatars.com/api/?name=${encodeURIComponent(requesterName)}&background=random`} alt="avatar" />
                                                    </div>
                                                    <span className="font-bold text-[#94A3B8] truncate max-w-[120px]">{requesterName}</span>
                                                </div>
                                            </td>
                                            <td className="text-center">
                                                <span className="px-2.5 py-1 bg-[#0F1117] border border-[rgba(148,163,184,0.1)] text-[#64748B] rounded-lg font-bold text-[9px] uppercase">
                                                    {pr.type || "Opex"}
                                                </span>
                                            </td>
                                            <td className="max-w-[200px] truncate font-medium text-[#94A3B8]">{pr.title}</td>
                                            <td className="text-right font-black text-[#3B82F6] text-sm">{formatVND(pr.totalEstimate || 0)} ₫</td>
                                            <td className="text-right px-8">
                                                <div className="flex justify-end gap-1.5">
                                                    <button onClick={() => setSelectedPRDetails(pr)} className="p-2 bg-[#0F1117] border border-[rgba(148,163,184,0.1)] text-[#64748B] hover:text-[#3B82F6] hover:border-[#3B82F6]/20 rounded-xl transition-all shadow-sm" title="Xem chi tiết">
                                                        <Eye size={14} />
                                                    </button>
                                                    <button onClick={() => handleQuickApprove(pr.workflowId)} disabled={isSubmitting} className="p-2 bg-[#0F1117] border border-[rgba(148,163,184,0.1)] text-emerald-400 hover:bg-emerald-500 hover:text-white rounded-xl transition-all shadow-sm disabled:opacity-50" title="Duyệt nhanh">
                                                        <CheckCircle size={14} />
                                                    </button>
                                                    <button className="p-2 bg-[#0F1117] border border-[rgba(148,163,184,0.1)] text-rose-400 hover:bg-rose-500 hover:text-white rounded-xl transition-all shadow-sm" title="Từ chối nhanh">
                                                        <XCircle size={14} />
                                                    </button>
                                                    <button className="p-2 bg-[#0F1117] border border-[rgba(148,163,184,0.1)] text-amber-400 hover:bg-amber-500 hover:text-white rounded-xl transition-all shadow-sm" title="Yêu cầu chỉnh sửa">
                                                        <RotateCcw size={14} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                }) : (
                                    <tr>
                                        <td colSpan={9} className="py-20 text-center text-[#64748B] font-black uppercase tracking-widest text-[10px]">
                                            <div className="flex flex-col items-center gap-3">
                                                <div className="p-4 bg-[#1A1D23] rounded-full"><Bell size={24} className="text-[#64748B]" /></div>
                                                Hiện tại không có phiếu nào cần bạn phê duyệt
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        );
    };

    const renderSupplierDashboard = () => {
        const myPendingRFQs = (rfqs || []).filter(r => r.status === "SENT");
        const myActivePOs = (pos || []).filter(po => po.status === "ISSUED" || po.status === "PARTIALLY_RECEIVED");
        const myOrg = (organizations || []).find(o => o.id === currentUser?.orgId);
        
        return (
            <div className="animate-in fade-in duration-700 px-6">
                <div className="flex justify-between items-end mb-10">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <div className="h-2 w-2 rounded-full bg-orange-500 animate-pulse"></div>
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#64748B]">Hệ thống Quản trị Nhà cung cấp</span>
                        </div>
                        <h1 className="text-4xl font-black text-[#F8FAFC] tracking-tight">Bảng điều khiển B2B</h1>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="text-right">
                            <p className="text-[10px] font-black text-[#F8FAFC] mb-0.5">{myOrg?.name || "Đối tác ProcurePro"}</p>
                            <p className="text-[8px] font-bold text-emerald-400 uppercase tracking-tighter">Xác thực: Gold Partner</p>
                        </div>
                        <div className="w-10 h-10 rounded-2xl bg-[#161922] border border-[rgba(148,163,184,0.1)] flex items-center justify-center shadow-sm">
                            <Building2 size={20} className="text-[#3B82F6]" />
                        </div>
                    </div>
                </div>

                {/* Supplier Metrics */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
                    <MetricCard title="Hồ sơ Báo giá mới" value={myPendingRFQs.length} icon={<ClipboardList size={20} />} color="bg-blue-500" />
                    <MetricCard title="Đơn hàng đang chờ" value={myActivePOs.length} icon={<ShoppingCart size={20} />} color="bg-amber-500" />
                    <MetricCard title="Doanh thu dự tính" value={formatVND(125000000).replace('₫', '')} icon={<DollarSign size={20} />} color="bg-emerald-500" />
                    <MetricCard title="Điểm đánh giá" value="4.9/5" icon={<Zap size={20} />} color="bg-purple-600" />
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-2 gap-10">
                    {/* RFQ List */}
                    <div className="space-y-6">
                        <div className="flex items-center justify-between">
                            <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-[#F8FAFC]">YÊU CẦU BÁO GIÁ ĐẾN (RFQ)</h3>
                            <Link href="/supplier/rfq" className="text-[10px] font-black text-[#3B82F6] hover:underline uppercase tracking-widest">Xem tất cả ›</Link>
                        </div>
                        <div className="erp-card !p-0 overflow-hidden shadow-xl shadow-[#3B82F6]/5 border-none bg-[#161922]">
                            <table className="erp-table text-xs">
                                <thead>
                                    <tr className="bg-[#0F1117]">
                                        <th className="px-8">Mã RFQ</th>
                                        <th>Bên mua</th>
                                        <th className="text-right">Thời hạn</th>
                                        <th className="text-right px-8">Thao tác</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-[rgba(148,163,184,0.1)]">
                                    {myPendingRFQs.length > 0 ? myPendingRFQs.slice(0, 5).map(rfq => (
                                        <tr key={rfq.id} className="hover:bg-[#0F1117]/50 transition-all">
                                            <td className="px-8 font-black text-[#F8FAFC]">{rfq.rfqNumber}</td>
                                            <td className="font-semibold text-[#64748B]">ProcurePro Corp</td>
                                            <td className="text-right text-[#64748B] font-bold">{formatDate(rfq.createdAt)}</td>
                                            <td className="text-right px-8 whitespace-nowrap">
                                                <Link href="/supplier/rfq" className="px-4 py-2 bg-[#3B82F6] text-white text-[9px] font-black uppercase tracking-widest rounded-xl hover:bg-[#2563EB] transition-all">Báo giá</Link>
                                            </td>
                                        </tr>
                                    )) : (
                                        <tr><td colSpan={4} className="py-20 text-center text-[#64748B] font-black uppercase text-[10px]">Không có RFQ mới</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Quick Tips or Announcements */}
                    <div className="space-y-6">
                        <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-[#F8FAFC] flex items-center gap-2">
                             <Bell size={14} className="text-[#3B82F6]" /> THÔNG BÁO TỪ HỆ THỐNG
                        </h3>
                        <div className="bg-[#161922] rounded-[40px] p-10 text-white relative overflow-hidden group shadow-2xl shadow-[#3B82F6]/5 border border-[rgba(148,163,184,0.1)]">
                             <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-125 transition-transform duration-700">
                                 <Zap size={100} />
                             </div>
                             <div className="relative z-10 space-y-6">
                                 <div className="p-6 bg-[#0F1117] rounded-3xl border border-[rgba(148,163,184,0.1)] hover:bg-[#1A1D23] transition-colors cursor-pointer">
                                     <h4 className="text-xs font-black uppercase tracking-widest text-emerald-400 mb-2">Cập nhật Chính sách Thanh toán</h4>
                                     <p className="text-[11px] text-[#94A3B8] leading-relaxed font-medium">Hệ thống ProcurePro sẽ rút ngắn thời hạn thanh toán từ 45 ngày xuống còn 30 ngày cho các đối tác Gold.</p>
                                 </div>
                                 <div className="p-6 bg-[#0F1117] rounded-3xl border border-[rgba(148,163,184,0.1)] hover:bg-[#1A1D23] transition-colors cursor-pointer">
                                     <h4 className="text-xs font-black uppercase tracking-widest text-amber-400 mb-2">Bảo trì Hệ thống B2B</h4>
                                     <p className="text-[11px] text-[#94A3B8] leading-relaxed font-medium">Hệ thống sẽ bảo trì từ 2h00 đến 4h00 sáng Chủ Nhật tới. Vui lòng hoàn tất báo giá trước thời gian này.</p>
                                 </div>
                             </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    const renderAdminDashboard = () => (
        <main className="animate-in fade-in duration-500 p-6 min-h-screen bg-[#0F1117] text-[#F8FAFC]">
            <h1 className="text-3xl font-black text-[#F8FAFC] tracking-tight mb-8">Hệ thống Quản trị Tổng thể</h1>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
                <div className="erp-card p-6! border-l-4 border-[rgba(148,163,184,0.1)] bg-[#161922]">
                    <div className="text-2xl font-black text-[#F8FAFC]">{formatVND(budgets?.allocated || 0)} ₫</div>
                    <div className="mt-2 text-[10px] text-[#64748B] font-bold">Ngân sách đã phân bổ</div>
                </div>
            </div>
            <div className="erp-card !p-0 overflow-hidden shadow-xl shadow-[#3B82F6]/5 border border-[rgba(148,163,184,0.1)] bg-[#161922]">
                <table className="erp-table text-xs">
                    <thead>
                        <tr className="bg-[#0F1117]"><th>Mã PR</th><th>Phòng ban</th><th className="text-right">Giá trị</th><th className="text-right">Thao tác</th></tr>
                    </thead>
                    <tbody className="divide-y divide-[rgba(148,163,184,0.1)]">
                        {(prs || []).slice(0, 5).map(pr => (
                            <tr key={pr.id} className="hover:bg-[#0F1117]/50 transition-colors">
                                <td className="font-bold text-[#F8FAFC]">{pr.prNumber || pr.id.substring(0, 8)}</td>
                                <td className="font-semibold text-[#64748B]">{typeof pr.department === 'object' ? pr.department?.name : (pr.department || "N/A")}</td>
                                <td className="text-right font-black text-[#F8FAFC]">{formatVND(pr.totalEstimate || 0)} ₫</td>
                                <td className="text-right text-[#64748B]"><button onClick={() => setSelectedPRDetails(pr)} className="p-2 hover:bg-[#0F1117] rounded-xl transition-colors"><Eye size={16} /></button></td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </main>
    );

    return (
        <>
            {isRequester && renderRequesterDashboard()}
            {isCFO && renderCFODashboard()}
            {isSupplier && renderSupplierDashboard()}
            {!isCFO && !isSupplier && isProcurement && renderProcurementDashboard()}
            {!isCFO && !isSupplier && isApproverGroup && renderApproverDashboard()}
            {!isRequester && !isCFO && !isProcurement && !isApproverGroup && !isSupplier && renderAdminDashboard()}

            {selectedPRDetails && (
                <div className="fixed inset-0 z-[100] bg-[#0F1117]/80 backdrop-blur-md flex items-center justify-center p-6 animate-in fade-in duration-300">
                    <div className="bg-[#161922] rounded-[2rem] shadow-2xl w-full max-w-5xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-300 border border-[rgba(148,163,184,0.1)]">
                        <div className="flex justify-between items-center p-8 border-b border-[rgba(148,163,184,0.1)] bg-[#0F1117]">
                            <div>
                                <h2 className="text-2xl font-black text-[#F8FAFC] flex items-center gap-3 tracking-tighter">
                                    <FileText size={24} className="text-[#3B82F6]" />
                                    CHI TIẾT PHIẾU: <span className="text-[#3B82F6]">{selectedPRDetails.prNumber || selectedPRDetails.id}</span>
                                </h2>
                                <p className="text-[10px] font-black text-[#64748B] uppercase tracking-widest mt-1">Cập nhật: {new Date(selectedPRDetails.createdAt || "").toLocaleString('vi-VN')}</p>
                            </div>
                            <button onClick={() => setSelectedPRDetails(null)} className="h-12 w-12 bg-[#0F1117] border border-[rgba(148,163,184,0.1)] text-[#64748B] hover:text-rose-400 rounded-2xl flex items-center justify-center transition-all">
                                <Plus className="rotate-45" size={24} />
                            </button>
                        </div>

                        <div className="p-0 overflow-y-auto custom-scrollbar flex flex-col md:flex-row flex-1">
                            <div className="p-8 md:w-2/3 border-r border-[rgba(148,163,184,0.1)] space-y-8">
                                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                                    <div className="p-4 bg-[#0F1117] rounded-2xl border border-[rgba(148,163,184,0.1)] text-center">
                                        <div className="text-[9px] font-black uppercase text-[#64748B] mb-1">Trạng thái</div>
                                        <span className={`status-pill status-${(selectedPRDetails.status || 'draft').toLowerCase()}`}>{getStatusLabel(selectedPRDetails.status)}</span>
                                    </div>
                                    <div className="p-4 bg-amber-500/10 rounded-2xl border border-amber-500/20 text-center">
                                        <div className="text-[9px] font-black uppercase text-amber-400 mb-1">Ngày cần hàng</div>
                                        <div className="text-sm font-black text-[#F8FAFC]">
                                            {formatDate(selectedPRDetails.requiredDate)}
                                        </div>
                                    </div>
                                    <div className="p-4 bg-[#0F1117] rounded-2xl text-center border border-[rgba(148,163,184,0.1)]">
                                        <div className="text-[9px] font-black uppercase text-[#64748B] mb-1">Tổng dự toán</div>
                                        <div className="text-sm font-black text-emerald-400">{formatVND(selectedPRDetails.totalEstimate || 0)} ₫</div>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <h3 className="text-[10px] font-black text-[#64748B] uppercase">Danh sách hàng hóa</h3>
                                    <div className="border border-[rgba(148,163,184,0.1)] rounded-2xl overflow-hidden">
                                        <table className="erp-table text-xs text-left">
                                            <thead className="bg-[#0F1117] border-b border-[rgba(148,163,184,0.1)]">
                                                <tr><th className="p-4 uppercase font-black text-[#64748B]">Sản phẩm</th><th className="p-4 text-center">SL</th><th className="p-4 text-right">Giá</th></tr>
                                            </thead>
                                            <tbody>
                                                {selectedPRDetails.items?.map((item, idx) => (
                                                    <tr key={idx} className="border-b border-[rgba(148,163,184,0.1)]">
                                                        <td className="p-4 font-black text-[#F8FAFC]">{item.productName || item.description}</td>
                                                        <td className="p-4 text-center text-[#94A3B8]">{item.qty} {item.unit}</td>
                                                        <td className="p-4 text-right font-black text-[#F8FAFC]">{formatVND((item.qty || 0) * (item.estimatedPrice || 0))} ₫</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>

                            <div className="p-8 md:w-1/3 bg-[#0F1117] flex flex-col justify-between">
                                <div className="space-y-8">
                                    <h3 className="text-[10px] font-black text-[#64748B] uppercase flex items-center gap-2"><History size={14} /> Quy trình phê duyệt</h3>
                                    <div className="space-y-6">
                                        <div className="flex gap-4">
                                            <div className="w-2 h-2 rounded-full bg-emerald-500 mt-1"></div>
                                            <div>
                                                <div className="text-[10px] font-black uppercase text-[#F8FAFC]">Khởi tạo</div>
                                                <div className="text-[9px] text-[#64748B]">{new Date(selectedPRDetails.createdAt || "").toLocaleString('vi-VN')}</div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="pt-8 space-y-3">
                                    {isApproverGroup && (selectedPRDetails as PR & { workflowId?: string }).workflowId && (
                                        <button
                                            onClick={() => handleQuickApprove((selectedPRDetails as PR & { workflowId: string }).workflowId)}
                                            disabled={isSubmitting}
                                            className="w-full h-14 bg-emerald-500 text-white rounded-2xl font-black uppercase text-[10px] shadow-lg shadow-emerald-500/20 flex flex-col items-center justify-center hover:bg-emerald-600 transition-all"
                                        >
                                            {isSubmitting ? <Loader2 className="animate-spin" /> : <><span>Phê duyệt nhanh</span><span className="text-[8px] opacity-60">Duyệt ngay trên Dashboard</span></>}
                                        </button>
                                    )}
                                    <button onClick={() => setSelectedPRDetails(null)} className="w-full h-12 bg-[#161922] border border-[rgba(148,163,184,0.1)] rounded-2xl text-[10px] font-black uppercase text-[#94A3B8] hover:bg-[#1A1D23] transition-all">Đóng</button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
