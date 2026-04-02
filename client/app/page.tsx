"use client";

import React from "react";
import Link from "next/link";
import {
    Building2, Lock, CreditCard, ArrowUpRight,
    ArrowDownRight, Activity, Zap, FileText, ShoppingCart, Eye, Plus, Trash2,
    Clock, CheckCircle, Package, AlertCircle, AlertTriangle, History, Bell, Send, Loader2,
    Search, ChevronDown, XCircle, RotateCcw
} from "lucide-react";
import { useProcurement, PR } from "./context/ProcurementContext";
import { formatVND } from "./utils/formatUtils";

export default function Dashboard() {
    const { budgets, prs, myPrs, currentUser, loadingMyPrs, approvals, actionApproval, refreshData, notify, fetchPrDetail, budgetAllocations, budgetPeriods, rfqs, pos } = useProcurement();
    const availableBudget = (budgets?.allocated || 0) - (budgets?.committed || 0) - (budgets?.spent || 0);

    // Calculate Dynamic Quarterly Remaining Budget for the Department
    const departmentId = currentUser?.deptId || (currentUser?.department as any)?.id;
    const activeQuarterPeriod = (budgetPeriods || []).find(p => p.isActive && p.periodType === "QUARTER");
    const deptAllocation = activeQuarterPeriod && departmentId
        ? (budgetAllocations || []).find(a => a.budgetPeriodId === activeQuarterPeriod.id && a.deptId === departmentId)
        : null;
    const quarterlyRemainingBudget = deptAllocation
        ? (deptAllocation.allocatedAmount - deptAllocation.committedAmount - deptAllocation.spentAmount)
        : availableBudget; // Fallback if no specific quarterly allocation exists

    const [selectedPRDetails, setSelectedPRDetails] = React.useState<PR | null>(null);
    const [isSubmitting, setIsSubmitting] = React.useState(false);

    const isRequester = currentUser?.role === "REQUESTER";
    const isApproverGroup = currentUser?.role === "MANAGER" || currentUser?.role === "DEPT_APPROVER" || currentUser?.role === "DIRECTOR" || currentUser?.role === "CEO" || currentUser?.role === "PLATFORM_ADMIN";
    const isProcurement = currentUser?.role === "PROCUREMENT";
    const isCFO = currentUser?.role === "FINANCE" || currentUser?.role === "DIRECTOR";

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

    if (!currentUser) return <div className="p-20 text-center animate-pulse">Đang tải thông tin người dùng...</div>;

    const renderRequesterDashboard = () => {
        const personalPRs = myPrs || [];
        const pendingPRsCount = personalPRs.filter((pr) => pr.status.includes("PENDING")).length;
        const approvedPRsCount = personalPRs.filter((pr) => pr.status === "APPROVED").length;

        return (
            <main className="animate-in fade-in duration-500">
                <div className="flex justify-between items-end mb-8">
                    <div>
                        <h1 className="text-3xl font-black text-erp-navy tracking-tight">Khu vực làm việc cá nhân</h1>
                        <p className="text-sm text-slate-500 mt-1">Xin chào, {currentUser.name || currentUser.fullName} - Hệ thống AI Procurement đã sẵn sàng.</p>
                    </div>
                    <div className="flex gap-3">
                        <Link href="/pr/create" className="btn-primary flex items-center gap-2">
                            <Plus size={16} /> Tạo PR mới
                        </Link>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
                    <div className="erp-card p-6! border-l-4 border-amber-500">
                        <div className="flex justify-between items-start mb-4">
                            <div className="p-3 bg-amber-50 rounded-xl"><Clock size={20} className="text-amber-500" /></div>
                            <span className="text-[10px] font-black uppercase text-amber-500 bg-amber-50 px-2 py-1 rounded">Chờ xử lý</span>
                        </div>
                        <div className="text-3xl font-black text-erp-navy font-mono">{pendingPRsCount}</div>
                        <div className="mt-2 text-[10px] text-slate-400 font-bold">PR đang chờ duyệt</div>
                    </div>

                    <div className="erp-card p-6! border-l-4 border-emerald-500">
                        <div className="flex justify-between items-start mb-4">
                            <div className="p-3 bg-emerald-50 rounded-xl"><CheckCircle size={20} className="text-emerald-500" /></div>
                            <span className="text-[10px] font-black uppercase text-emerald-500 bg-emerald-50 px-2 py-1 rounded">Đã duyệt</span>
                        </div>
                        <div className="text-3xl font-black text-erp-navy font-mono">{approvedPRsCount}</div>
                        <div className="mt-2 text-[10px] text-slate-400 font-bold">PR đã duyệt tháng này</div>
                    </div>

                    <div className="erp-card !p-6 border-l-4 border-erp-blue">
                        <div className="flex justify-between items-start mb-4">
                            <div className="p-3 bg-blue-50 rounded-xl"><ShoppingCart size={20} className="text-erp-blue" /></div>
                            <span className="text-[10px] font-black uppercase text-erp-blue bg-blue-50 px-2 py-1 rounded">Thực thi</span>
                        </div>
                        <div className="text-3xl font-black text-erp-navy font-mono">1</div>
                        <div className="mt-2 text-[10px] text-slate-400 font-bold">PO đang thực hiện</div>
                    </div>

                    <div className="erp-card !p-6 border-l-4 border-purple-500">
                        <div className="flex justify-between items-start mb-4">
                            <div className="p-3 bg-purple-50 rounded-xl"><Package size={20} className="text-purple-500" /></div>
                            <span className="text-[10px] font-black uppercase text-purple-500 bg-purple-50 px-2 py-1 rounded">Giao hàng</span>
                        </div>
                        <div className="text-3xl font-black text-erp-navy font-mono">2</div>
                        <div className="mt-2 text-[10px] text-slate-400 font-bold">Hàng sắp về (trong 7 ngày)</div>
                    </div>
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                    <div className="xl:col-span-2 space-y-8">
                        <div className="erp-card bg-amber-50/50 border-amber-100 shadow-sm">
                            <h3 className="text-[10px] font-black uppercase tracking-widest text-amber-800 mb-4 flex items-center gap-2">
                                <AlertTriangle size={14} className="text-amber-500" /> Cần hành động ngay
                            </h3>
                            <div className="space-y-3">
                                <div className="bg-white p-4 rounded-xl border border-amber-200 flex items-center justify-between shadow-sm hover:shadow-md transition-shadow">
                                    <div className="flex items-center gap-3">
                                        <div className="h-10 w-10 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center shrink-0">
                                            <Zap size={18} />
                                        </div>
                                        <div>
                                            <div className="text-xs font-black text-erp-navy mb-1">Xác nhận AI Report cho PR-2026-002</div>
                                            <div className="text-[10px] text-slate-500 font-bold">Hệ thống đã đề xuất 3 Nhà cung cấp cho lô máy may công nghiệp.</div>
                                        </div>
                                    </div>
                                    <Link href="/ai-report" className="px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-white text-[10px] font-black uppercase tracking-widest rounded-xl shadow-lg shadow-amber-500/20 transition-all">
                                        Xem AI Report
                                    </Link>
                                </div>
                            </div>
                        </div>

                        <div className="erp-card p-0! overflow-hidden shadow-xl shadow-erp-navy/5">
                            <div className="p-6 border-b border-slate-50 flex justify-between items-center bg-slate-50/20">
                                <h3 className="text-[10px] font-black uppercase tracking-widest text-erp-navy flex items-center gap-2">
                                    <FileText size={16} className="text-erp-blue" /> Danh sách PR của tôi (Gần nhất)
                                </h3>
                                <Link href="/pr" className="text-[9px] font-black uppercase text-erp-blue hover:underline bg-white px-3 py-1.5 rounded-lg border border-slate-100 shadow-sm">Xem tất cả</Link>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="erp-table text-xs">
                                    <thead>
                                        <tr>
                                            <th>Số PR</th>
                                            <th>Tiêu đề (Lý do)</th>
                                            <th>Ngày tạo</th>
                                            <th className="text-right">Tổng ước tính</th>
                                            <th className="text-center">Trạng thái</th>
                                            <th className="text-right">Thao tác</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {loadingMyPrs ? (
                                            [1, 2, 3].map(i => (
                                                <tr key={i} className="animate-pulse">
                                                    <td className="py-4"><div className="h-4 w-20 bg-slate-100 rounded"></div></td>
                                                    <td className="py-4"><div className="h-4 w-40 bg-slate-100 rounded"></div></td>
                                                    <td className="py-4"><div className="h-4 w-24 bg-slate-100 rounded"></div></td>
                                                    <td className="py-4"><div className="h-4 w-24 bg-slate-100 rounded ml-auto"></div></td>
                                                    <td className="py-4"><div className="h-6 w-16 bg-slate-100 rounded-full mx-auto"></div></td>
                                                    <td className="py-4"><div className="h-8 w-16 bg-slate-100 rounded-lg ml-auto"></div></td>
                                                </tr>
                                            ))
                                        ) : (
                                            personalPRs.length > 0 ? personalPRs.slice(0, 5).map((pr) => (
                                                <tr key={pr.id} className="group hover:bg-erp-blue/[0.02] transition-colors relative">
                                                    <td className="font-bold text-erp-navy group-hover:text-erp-blue transition-colors">{pr.prNumber || pr.id.substring(0, 8)}</td>
                                                    <td className="max-w-50 truncate font-semibold text-slate-600" title={pr.title}>{pr.title}</td>
                                                    <td className="text-slate-400 font-medium">{new Date(pr.createdAt).toLocaleDateString('vi-VN')}</td>
                                                    <td className="font-mono text-right font-black text-erp-navy tracking-tight">{formatVND(pr.totalEstimate || pr.total)} ₫</td>
                                                    <td className="text-center">
                                                        <span className={`status-pill status-${(pr.status || 'DRAFT').toLowerCase()}`}>
                                                            {pr.status}
                                                        </span>
                                                    </td>
                                                    <td className="text-right">
                                                        <div className="flex justify-end gap-2">
                                                            {pr.status === "DRAFT" && (
                                                                <Link href={`/pr/edit/${pr.id}`} className="px-3 py-2 bg-erp-blue/10 hover:bg-erp-blue hover:text-white text-erp-blue text-[9px] font-black uppercase tracking-widest rounded-xl transition-all shadow-sm">
                                                                    Sửa
                                                                </Link>
                                                            )}
                                                            <button onClick={() => fetchPrDetail(pr.id).then(res => res && setSelectedPRDetails(res))} className="px-3 py-2 bg-slate-100 hover:bg-erp-navy hover:text-white text-slate-600 text-[9px] font-black uppercase tracking-widest rounded-xl transition-all shadow-sm">
                                                                {loadingMyPrs && selectedPRDetails?.id === pr.id ? '...' : 'Chi tiết'}
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            )) : (
                                                <tr>
                                                    <td colSpan={6} className="py-24 text-center text-slate-400 font-black uppercase">Chưa có yêu cầu nào</td>
                                                </tr>
                                            )
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-6">
                        <div className="erp-card shadow-xl shadow-erp-navy/5">
                            <h3 className="text-[10px] font-black uppercase tracking-widest text-erp-navy mb-6 flex items-center gap-2">
                                <Bell size={16} className="text-erp-blue" /> Thông báo mới nhất
                            </h3>
                            <div className="space-y-6 relative before:absolute before:inset-0 before:ml-2 before:h-full before:w-0.5 before:bg-slate-100">
                                <div className="relative flex gap-4">
                                    <div className="flex items-center justify-center w-5 h-5 rounded-full bg-emerald-500 border-2 border-white shadow-lg shrink-0 z-10 -ml-0.5"></div>
                                    <div className="flex-1 -mt-1">
                                        <div className="flex justify-between mb-1">
                                            <span className="text-[10px] font-black text-erp-navy">PR-2026-001 được duyệt</span>
                                            <span className="text-[8px] font-bold text-slate-400 uppercase">10m</span>
                                        </div>
                                        <p className="text-[10px] text-slate-500 leading-relaxed font-medium">Giám đốc vừa phê duyệt phiếu yêu cầu vật tư của bạn.</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        );
    };

    const renderCFODashboard = () => {
        const cfoPendingPRs = (approvals || []).map((app) => {
            const pr = prs.find((p) => p.id === app.documentId);
            if (!pr) return null;
            return { ...pr, workflowId: app.id };
        }).filter((p): p is (PR & { workflowId: string }) => p !== null && (Number(p.totalEstimate) >= 10000000));

        const pendingPRCount = cfoPendingPRs.length;
        const pendingPRValue = cfoPendingPRs.reduce((sum: number, pr) => sum + (Number(pr.totalEstimate) || 0), 0);
        const totalAllocated = budgets?.allocated || 10000000000;
        const totalUsed = budgets?.spent || 4500000000;
        const usagePercent = Math.round((totalUsed / totalAllocated) * 100);

        return (
            <main className="animate-in fade-in duration-700 bg-slate-50/30 -m-8 p-8 min-h-screen">
                <div className="flex justify-between items-end mb-10">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></div>
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Hệ thống Quản trị Tổng thể</span>
                        </div>
                        <h1 className="text-4xl font-black text-erp-navy tracking-tight">Tài chính Vĩ mô</h1>
                    </div>
                </div>

                {/* Financial Summary Widgets */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
                    <div className="erp-card !p-8 bg-white shadow-sm border-none flex flex-col justify-between group hover:shadow-xl transition-all duration-500">
                        <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-6">Tổng Ngân Sách Công Ty</div>
                        <div>
                            <div className="text-3xl font-black text-emerald-600 font-mono mb-4">{formatVND(totalAllocated)} ₫</div>
                            <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden mb-2">
                                <div className="h-full bg-emerald-500 transition-all duration-1000" style={{ width: `${usagePercent}%` }}></div>
                            </div>
                            <div className="flex justify-between text-[9px] font-black uppercase">
                                <span className="text-slate-400">{usagePercent}% đã dùng</span>
                                <span className="text-emerald-600">{formatVND(totalAllocated - totalUsed)} ₫ còn lại</span>
                            </div>
                        </div>
                    </div>

                    <div className="erp-card !p-8 bg-white shadow-sm border-none flex flex-col justify-between group hover:shadow-xl transition-all duration-500">
                        <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-6">Dự kiến chi tiền (Tuần này)</div>
                        <div>
                            <div className="text-3xl font-black text-erp-navy font-mono mb-1">450,000,000 ₫</div>
                            <div className="text-[10px] text-slate-400 font-bold uppercase tracking-tight mt-2 flex items-center gap-2">
                                <Activity size={12} className="text-erp-blue" /> Cho các hóa đơn đã duyệt
                            </div>
                        </div>
                    </div>

                    <div className="erp-card !p-8 bg-white shadow-sm border-none flex flex-col justify-between group hover:shadow-xl transition-all duration-500">
                        <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-6">Giá trị chờ CFO Duyệt</div>
                        <div>
                            <div className="flex items-baseline gap-2 mb-1">
                                <div className="text-4xl font-black text-amber-500 font-mono">{pendingPRCount}</div>
                                <div className="text-[10px] font-black text-slate-300 uppercase">Phiếu</div>
                            </div>
                            <div className="text-xl font-black text-amber-600 font-mono">{formatVND(pendingPRValue)} ₫</div>
                        </div>
                    </div>

                    <div className="erp-card !p-8 bg-white shadow-sm border-none flex flex-col justify-between group hover:shadow-xl transition-all duration-500">
                        <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-6">Biểu đồ tiêu hao ngân sách</div>
                        <div className="flex items-center gap-6">
                            <div className="relative h-16 w-16 shrink-0">
                                <svg className="h-16 w-16 -rotate-90">
                                    <circle cx="32" cy="32" r="28" fill="transparent" stroke="#f1f5f9" strokeWidth="8"/>
                                    <circle cx="32" cy="32" r="28" fill="transparent" stroke="#10b981" strokeWidth="8" strokeDasharray="175" strokeDashoffset="40"/>
                                    <circle cx="32" cy="32" r="28" fill="transparent" stroke="#3b82f6" strokeWidth="8" strokeDasharray="175" strokeDashoffset="120"/>
                                </svg>
                                <div className="absolute inset-0 flex items-center justify-center text-[10px] font-black text-erp-navy">OPEX</div>
                            </div>
                            <div className="space-y-1">
                                <div className="flex items-center gap-2"><div className="h-1.5 w-1.5 rounded-full bg-emerald-500"></div><span className="text-[9px] font-black text-slate-500 uppercase">IT (65%)</span></div>
                                <div className="flex items-center gap-2"><div className="h-1.5 w-1.5 rounded-full bg-blue-500"></div><span className="text-[9px] font-black text-slate-500 uppercase">HR (20%)</span></div>
                                <div className="flex items-center gap-2"><div className="h-1.5 w-1.5 rounded-full bg-slate-300"></div><span className="text-[9px] font-black text-slate-500 uppercase">Marketing (15%)</span></div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Approval Queue Section */}
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-erp-navy">Queue Cần Duyệt Mới Nhất</h3>
                    <div className="flex items-center gap-3">
                        <div className="relative">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={14} />
                            <input type="text" placeholder="Tìm kiếm chứng từ..." className="pl-10 pr-6 py-2 bg-white border border-slate-100 rounded-xl text-xs font-medium w-64 focus:outline-none focus:ring-2 focus:ring-erp-blue/10 transition-all"/>
                        </div>
                        <button className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-100 rounded-xl text-[9px] font-black uppercase tracking-widest text-slate-500 hover:bg-slate-50 transition-all shadow-sm">
                            Lọc theo Phòng ban <ChevronDown size={14} />
                        </button>
                        <button className="flex items-center gap-2 px-4 py-2 bg-erp-navy text-white rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-erp-blue transition-all shadow-lg shadow-erp-navy/20">
                            <Zap size={14} /> Xuất Báo cáo
                        </button>
                    </div>
                </div>

                <div className="erp-card !p-0 overflow-hidden shadow-2xl shadow-erp-navy/5 border-none">
                    <div className="overflow-x-auto">
                        <table className="erp-table text-xs whitespace-nowrap">
                            <thead>
                                <tr className="bg-slate-50/50">
                                    <th className="w-10 px-8 text-center"><input type="checkbox" className="rounded-md border-slate-200 text-erp-blue"/></th>
                                    <th>Mã Chứng Từ</th>
                                    <th>Phân loại</th>
                                    <th>Lý do / Hạng mục</th>
                                    <th className="text-center">Tình Trạng Ngân Sách</th>
                                    <th className="text-right">Giá Trị</th>
                                    <th className="text-right px-8">Thao tác</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {cfoPendingPRs.length > 0 ? cfoPendingPRs.map((pr) => (
                                    <tr key={pr.id} className="hover:bg-slate-50/80 transition-colors group">
                                        <td className="px-8 text-center"><input type="checkbox" className="rounded-md border-slate-200 text-erp-blue"/></td>
                                        <td className="font-bold text-erp-navy tracking-tight">{pr.prNumber || pr.id.substring(0, 8)}</td>
                                        <td><span className={`px-2.5 py-1 rounded-lg font-black text-[9px] uppercase ${Number(pr.totalEstimate) > 50000000 ? 'bg-blue-50 text-blue-600' : 'bg-slate-100 text-slate-500'}`}>{Number(pr.totalEstimate) > 50000000 ? 'Capex' : 'Opex'}</span></td>
                                        <td className="font-medium text-slate-600">{pr.title}</td>
                                        <td className="text-center">
                                            {Number(pr.totalEstimate) > 50000000 ? (
                                                <span className="text-[10px] font-black text-rose-500 uppercase flex items-center justify-center gap-1.5"><AlertTriangle size={11}/> Cảnh báo: 15% quỹ IT</span>
                                            ) : (
                                                <span className="text-[10px] font-black text-emerald-500 uppercase flex items-center justify-center gap-1.5"><CheckCircle size={11}/> An toàn: 2% quỹ IT</span>
                                            )}
                                        </td>
                                        <td className="font-mono text-right font-black text-erp-navy text-sm">{formatVND(pr.totalEstimate)} ₫</td>
                                        <td className="text-right px-8">
                                            <div className="flex justify-end gap-1.5">
                                                <button onClick={() => setSelectedPRDetails(pr)} className="p-2.5 bg-white border border-slate-200 text-slate-400 hover:text-erp-blue hover:border-erp-blue/20 rounded-xl transition-all shadow-sm"><Eye size={14}/></button>
                                                <button onClick={() => handleQuickApprove(pr.workflowId)} className="p-2.5 bg-white border border-slate-200 text-emerald-500 hover:bg-emerald-500 hover:text-white rounded-xl transition-all shadow-sm"><CheckCircle size={14}/></button>
                                                <button className="p-2.5 bg-white border border-slate-200 text-rose-500 hover:bg-rose-500 hover:text-white rounded-xl transition-all shadow-sm"><XCircle size={14}/></button>
                                                <button className="p-2.5 bg-white border border-slate-200 text-amber-500 hover:bg-amber-500 hover:text-white rounded-xl transition-all shadow-sm"><RotateCcw size={14}/></button>
                                            </div>
                                        </td>
                                    </tr>
                                )) : (
                                    <tr><td colSpan={7} className="py-20 text-center text-slate-300 font-black uppercase tracking-widest text-[10px]">Queue trống - Mọi chứng từ đã được xử lý</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </main>
        );
    };

    const renderProcurementDashboard = () => {
        const prSourcingQueue = (prs || []).filter(pr => pr.status === "APPROVED");
        const activeRfqs = (rfqs || []).filter(rfq => rfq.status !== "COMPLETED" && rfq.status !== "CANCELLED");
        const poApprovalPending = (pos || []).filter(po => po.status === "PENDING_APPROVAL");
        const openPos = (pos || []).filter(po => po.status === "ISSUED" || po.status === "PARTIALLY_RECEIVED");

        return (
            <main className="animate-in fade-in duration-700 bg-slate-50/30 -m-8 p-8 min-h-screen">
                <div className="flex justify-between items-end mb-10">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <div className="h-2 w-2 rounded-full bg-blue-500 animate-pulse"></div>
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Hệ thống Quản trị Chuỗi cung ứng</span>
                        </div>
                        <h1 className="text-4xl font-black text-erp-navy tracking-tight">Trung tâm Quản lý Thu mua</h1>
                    </div>
                </div>

                {/* API Driven Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
                    <div className="erp-card !p-8 bg-white shadow-sm border-none flex flex-col justify-between group hover:shadow-xl transition-all duration-500">
                        <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-6">PR CHỜ TÌM NGUỒN</div>
                        <div className="flex items-baseline gap-2">
                            <div className="text-5xl font-black text-erp-navy font-mono tracking-tighter">{prSourcingQueue.length}</div>
                            <div className="text-[11px] font-black text-slate-300 uppercase">Yêu cầu</div>
                        </div>
                    </div>

                    <div className="erp-card !p-8 bg-white shadow-sm border-none flex flex-col justify-between border-l-4 border-blue-500 group hover:shadow-xl transition-all duration-500">
                        <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-6 text-blue-500">BÁO GIÁ (RFQ) ĐANG XỬ LÝ</div>
                        <div className="flex items-baseline gap-2">
                            <div className="text-5xl font-black text-blue-500 font-mono tracking-tighter">{activeRfqs.length}</div>
                            <div className="text-[11px] font-black text-blue-200 uppercase">Hồ sơ</div>
                        </div>
                    </div>

                    <div className="erp-card !p-8 bg-white shadow-sm border-none flex flex-col justify-between border-l-4 border-amber-500 group hover:shadow-xl transition-all duration-500">
                        <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-6 text-amber-500">PO CHỜ SẾP DUYỆT</div>
                        <div className="flex items-baseline gap-2">
                            <div className="text-5xl font-black text-amber-500 font-mono tracking-tighter">{poApprovalPending.length}</div>
                            <div className="text-[11px] font-black text-amber-200 uppercase">Đơn hàng</div>
                        </div>
                    </div>

                    <div className="erp-card !p-8 bg-white shadow-sm border-none flex flex-col justify-between border-l-4 border-emerald-500 group hover:shadow-xl transition-all duration-500">
                        <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-6 text-emerald-500">PO ĐANG GIAO HÀNG</div>
                        <div className="flex items-baseline gap-2">
                            <div className="text-5xl font-black text-emerald-500 font-mono tracking-tighter">{openPos.length}</div>
                            <div className="text-[11px] font-black text-emerald-200 uppercase">Active</div>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-2 gap-10">
                    {/* PR Sourcing Queue */}
                    <div className="space-y-6">
                        <div className="flex items-center justify-between">
                            <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-erp-navy">YÊU CẦU CẦN XỬ LÝ (PR -{">"} RFQ)</h3>
                            <Link href="/sourcing" className="text-[10px] font-black text-erp-blue hover:underline uppercase tracking-widest">Xem tất cả {">"}</Link>
                        </div>
                        <div className="erp-card !p-0 overflow-hidden shadow-2xl shadow-erp-navy/5 border-none bg-white">
                            <div className="overflow-x-auto">
                                <table className="erp-table text-xs whitespace-nowrap">
                                    <thead>
                                        <tr className="bg-slate-50/50">
                                            <th>MÃ PR</th>
                                            <th>PHÒNG BAN</th>
                                            <th>DEADLINE</th>
                                            <th className="text-center">MỨC ĐỘ</th>
                                            <th>TRẠNG THÁI RFQ</th>
                                            <th className="text-right px-8">THAO TÁC</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50">
                                        {prSourcingQueue.length > 0 ? prSourcingQueue.slice(0, 5).map((pr) => (
                                            <tr key={pr.id} className="hover:bg-slate-50 transition-colors group">
                                                <td className="font-bold text-erp-navy">{pr.prNumber || pr.id.substring(0, 8)}</td>
                                                <td className="font-semibold text-slate-500">{typeof pr.department === 'string' ? pr.department : (pr.department as any)?.name || "N/A"}</td>
                                                <td className="text-slate-400 font-medium">{pr.requiredDate ? new Date(pr.requiredDate).toLocaleDateString('vi-VN') : 'N/A'}</td>
                                                <td className="text-center">
                                                    <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase ${pr.priority === 1 ? 'bg-rose-50 text-rose-500' : 'bg-amber-50 text-amber-500'}`}>
                                                        {pr.priority === 1 ? 'CAO' : 'VỪA'}
                                                    </span>
                                                </td>
                                                <td><span className="text-[10px] font-bold text-slate-500 italic">Chờ RFQ</span></td>
                                                <td className="text-right pl-2 pr-6">
                                                    <Link href={`/procurement/rfq/create?prId=${pr.id}`} className="inline-flex items-center justify-center whitespace-nowrap min-w-[100px] px-4 py-2 bg-erp-navy text-white text-[10px] font-black uppercase tracking-wide rounded-xl hover:bg-erp-blue transition-all shadow-md shadow-erp-navy/10">Lấy Báo Giá</Link>
                                                </td>
                                            </tr>
                                        )) : (
                                            <tr><td colSpan={6} className="py-20 text-center text-slate-300 font-black uppercase text-[10px]">Mọi yêu cầu đã được xử lý nguồn hàng</td></tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>

                    {/* PO Tracking */}
                    <div className="space-y-6">
                        <div className="flex items-center justify-between">
                            <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-erp-navy">TÌNH TRẠNG GIAO HÀNG (OPEN POs)</h3>
                            <Link href="/po" className="text-[10px] font-black text-erp-blue hover:underline uppercase tracking-widest">PO Manager {">"}</Link>
                        </div>
                        <div className="erp-card !p-0 overflow-hidden shadow-2xl shadow-erp-navy/5 border-none bg-white">
                            <div className="overflow-x-auto">
                                <table className="erp-table text-xs whitespace-nowrap">
                                    <thead>
                                        <tr className="bg-slate-50/50">
                                            <th>MÃ PO</th>
                                            <th>NHÀ CUNG CẤP</th>
                                            <th className="w-1/3">TIẾN ĐỘ</th>
                                            <th className="text-right">TỔNG TIỀN</th>
                                            <th className="text-right px-6">THAO TÁC</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50">
                                        {openPos.length > 0 ? openPos.slice(0, 5).map((po) => {
                                            const progress = po.status === "PARTIALLY_RECEIVED" ? 50 : 0;
                                            return (
                                                <tr key={po.id} className="hover:bg-slate-50 transition-colors group">
                                                    <td className="font-bold text-erp-navy">{po.poNumber || po.id.substring(0, 8)}</td>
                                                    <td className="font-semibold text-slate-600 truncate max-w-[120px]">{typeof po.vendor === 'string' ? po.vendor : (po.vendor as any)?.name || "Vendor"}</td>
                                                    <td>
                                                        <div className="flex items-center gap-3">
                                                            <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                                                <div className={`h-full transition-all duration-1000 bg-blue-500`} style={{ width: `${progress}%` }}></div>
                                                            </div>
                                                            <span className="text-[9px] font-black text-slate-400">{progress}%</span>
                                                        </div>
                                                    </td>
                                                    <td className="font-mono text-right font-black text-erp-navy text-sm">{formatVND(po.total)} ₫</td>
                                                    <td className="text-right pl-2 pr-6">
                                                        <button className="inline-flex items-center justify-center whitespace-nowrap min-w-[100px] px-4 py-2 border border-amber-200 text-amber-600 text-[10px] font-black uppercase tracking-wide rounded-xl hover:bg-amber-50 transition-all">Đốc thúc</button>
                                                    </td>
                                                </tr>
                                            );
                                        }) : (
                                            <tr><td colSpan={5} className="py-20 text-center text-slate-300 font-black uppercase text-[10px]">Chưa có đơn hàng đang giao</td></tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        );
    };

    const renderApproverDashboard = () => {
        const myPendingPRs = (approvals || []).map((app) => {
            const pr = prs.find((p) => p.id === app.documentId);
            if (!pr) return null;
            const prTotal = Number(pr.totalEstimate) || 0;
            const isManager = currentUser?.role === "MANAGER" || currentUser?.role === "DEPT_APPROVER";
            const isDirector = currentUser?.role === "DIRECTOR";
            
            if (isManager && prTotal >= 10000000) return null;
            if (isDirector && prTotal < 10000000) return null;
            return { ...pr, workflowId: app.id };
        }).filter((p): p is (PR & { workflowId: string }) => p !== null);

        const pendingPRCount = myPendingPRs.length;
        const pendingPRValue = myPendingPRs.reduce((sum: number, pr) => sum + (Number(pr.totalEstimate) || 0), 0);

        return (
            <main className="animate-in fade-in duration-500">
                <div className="flex justify-between items-end mb-8">
                    <div>
                        <h1 className="text-3xl font-black text-erp-navy tracking-tight">Khu vực Quản lý Phê duyệt</h1>
                        <p className="text-sm text-slate-500 mt-1">Xin chào, {currentUser?.name || currentUser?.fullName} - Bạn có {pendingPRCount} yêu cầu chờ xử lý.</p>
                    </div>
                </div>

                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                    <div className="erp-card !p-8 border-l-4 border-slate-200 bg-white shadow-sm flex flex-col justify-between relative overflow-hidden">
                        <div className="flex justify-between items-start mb-6">
                            <div className="text-5xl font-black text-erp-navy font-mono mb-1">{pendingPRCount}</div>
                            <AlertTriangle size={24} className="text-red-500" />
                        </div>
                        <div>
                            <div className="text-sm font-black text-erp-blue font-mono mb-2">{formatVND(pendingPRValue)} ₫</div>
                            <div className="text-[10px] text-slate-400 font-black uppercase tracking-widest pt-3 border-t border-slate-100">Tổng giá trị chờ duyệt</div>
                        </div>
                    </div>

                    <div className="erp-card !p-8 border-l-4 border-emerald-500 bg-white shadow-sm flex flex-col justify-between">
                        <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4">Ngân sách {currentUser?.department?.name || 'Phòng ban'} còn lại</div>
                        <div>
                            <div className="text-3xl font-black text-emerald-500 font-mono mb-2">{formatVND(quarterlyRemainingBudget)} ₫</div>
                            <div className="text-[10px] text-slate-400 font-black uppercase tracking-widest pt-3 border-t border-slate-100">Trong {activeQuarterPeriod ? `Q${activeQuarterPeriod.periodNumber} / ${activeQuarterPeriod.fiscalYear}` : 'Tháng / Quý'}</div>
                        </div>
                    </div>

                    <div className="erp-card !p-8 border-l-4 border-amber-500 bg-white shadow-sm flex flex-col justify-between">
                        <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4">Cảnh báo tồn đọng</div>
                        <div>
                            <div className="text-4xl font-black text-amber-500 font-mono mb-2">{pendingPRCount}</div>
                            <div className="text-[10px] text-slate-400 font-black uppercase tracking-widest pt-3 border-t border-slate-100">{pendingPRCount} phiếu đang chờ bạn</div>
                        </div>
                    </div>
                </div>

                {/* Search & Filter Toolbar */}
                <div className="flex flex-wrap items-center justify-between gap-4 mb-6 bg-white p-4 rounded-3xl border border-slate-100 shadow-sm">
                    <div className="flex items-center gap-4">
                        <h3 className="text-[10px] font-black uppercase tracking-widest text-erp-navy flex items-center gap-2 px-4 border-r border-slate-100">
                            <FileText size={16} className="text-erp-blue" /> Queue Cần Duyệt Mới Nhất
                        </h3>
                        <button 
                            disabled={pendingPRCount === 0} 
                            className={`px-5 py-2 ${pendingPRCount === 0 ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : 'bg-erp-blue text-white hover:bg-erp-navy transition-all shadow-md'} text-[10px] font-black uppercase tracking-widest rounded-xl`}
                        >
                            Duyệt hàng loạt ({pendingPRCount})
                        </button>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="relative group">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-erp-blue transition-colors" size={16} />
                            <input
                                type="text"
                                placeholder="Tìm kiếm mã PR, người tạo..."
                                className="pl-11 pr-6 py-2.5 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-bold w-64 focus:outline-none focus:ring-2 focus:ring-erp-blue/20 focus:bg-white transition-all"
                            />
                        </div>
                        <button className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-100 rounded-2xl text-[9px] font-black uppercase tracking-widest text-slate-600 hover:bg-slate-50 transition-all shadow-sm">
                            Lọc theo Cấp độ <ChevronDown size={14} />
                        </button>
                        <button className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-100 rounded-2xl text-[9px] font-black uppercase tracking-widest text-slate-600 hover:bg-slate-50 transition-all shadow-sm">
                            Lọc theo Phân loại <ChevronDown size={14} />
                        </button>
                        <button className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-100 rounded-2xl text-[9px] font-black uppercase tracking-widest text-slate-600 hover:bg-slate-50 transition-all shadow-sm">
                            Khoảng giá <ChevronDown size={14} />
                        </button>
                        <Link href="/approvals" className="ml-2 text-[9px] font-black uppercase text-erp-blue hover:underline bg-blue-50/50 px-4 py-2.5 rounded-2xl border border-blue-100/50 transition-all">
                            Tới màn hình duyệt &gt;
                        </Link>
                    </div>
                </div>

                <div className="erp-card !p-0 overflow-hidden shadow-xl shadow-erp-navy/5">
                    <div className="overflow-x-auto">
                        <table className="erp-table text-xs whitespace-nowrap">
                            <thead>
                                <tr>
                                    <th className="w-10 px-8 text-center bg-slate-50/50">
                                        <input type="checkbox" className="rounded-md border-slate-300 text-erp-blue focus:ring-erp-blue" />
                                    </th>
                                    <th>Số phiếu</th>
                                    <th>Ngày tạo</th>
                                    <th className="text-center">Cấp độ</th>
                                    <th>Người tạo</th>
                                    <th className="text-center">Phân loại</th>
                                    <th className="w-[20%]">Tiêu đề</th>
                                    <th className="text-right">Tổng giá trị</th>
                                    <th className="text-right px-8">Thao tác</th>
                                </tr>
                            </thead>
                            <tbody>
                                {myPendingPRs.length > 0 ? myPendingPRs.map((pr) => {
                                    const priorityInfo = pr.priority === 1
                                        ? { label: 'CAO', color: 'bg-red-500' }
                                        : (pr.priority === 2 ? { label: 'VỪA', color: 'bg-amber-500' } : { label: 'THẤP', color: 'bg-slate-400' });

                                    const requesterName = pr.requester?.fullName || pr.requester?.name || "N/A";

                                    return (
                                        <tr key={pr.id} className="hover:bg-slate-50 transition-colors group">
                                            <td className="px-8 text-center">
                                                <input type="checkbox" className="rounded-md border-slate-300 text-erp-blue focus:ring-erp-blue" />
                                            </td>
                                            <td className="font-bold text-erp-navy">{pr.prNumber || pr.id.substring(0, 8)}</td>
                                            <td className="text-slate-500 font-medium">{new Date(pr.createdAt).toLocaleDateString('vi-VN')}</td>
                                            <td className="text-center">
                                                <span className={`px-2.5 py-1 ${priorityInfo.color} text-white rounded-lg font-black text-[9px] uppercase shadow-sm`}>
                                                    {priorityInfo.label}
                                                </span>
                                            </td>
                                            <td>
                                                <div className="flex items-center gap-2">
                                                    <div className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center overflow-hidden border border-slate-200">
                                                        <img src={`https://ui-avatars.com/api/?name=${encodeURIComponent(requesterName)}&background=random`} alt="avatar" />
                                                    </div>
                                                    <span className="font-bold text-slate-600 truncate max-w-[120px]">{requesterName}</span>
                                                </div>
                                            </td>
                                            <td className="text-center">
                                                <span className="px-2.5 py-1 bg-white border border-slate-200 text-slate-500 rounded-lg font-bold text-[9px] uppercase">
                                                    {(pr as any).type || "Opex"}
                                                </span>
                                            </td>
                                            <td className="max-w-[200px] truncate font-medium text-slate-600">{pr.title}</td>
                                            <td className="font-mono text-right font-black text-erp-blue text-sm">{formatVND(pr.totalEstimate || pr.total)} ₫</td>
                                            <td className="text-right px-8">
                                                <div className="flex justify-end gap-1.5">
                                                    <button onClick={() => setSelectedPRDetails(pr)} className="p-2 bg-white border border-slate-100 text-slate-400 hover:text-erp-blue hover:border-erp-blue/20 rounded-xl transition-all shadow-sm" title="Xem chi tiết">
                                                        <Eye size={14} />
                                                    </button>
                                                    <button onClick={() => handleQuickApprove(pr.workflowId)} disabled={isSubmitting} className="p-2 bg-white border border-slate-100 text-emerald-500 hover:bg-emerald-500 hover:text-white rounded-xl transition-all shadow-sm disabled:opacity-50" title="Duyệt nhanh">
                                                        <CheckCircle size={14} />
                                                    </button>
                                                    <button className="p-2 bg-white border border-slate-100 text-rose-500 hover:bg-rose-500 hover:text-white rounded-xl transition-all shadow-sm" title="Từ chối nhanh">
                                                        <XCircle size={14} />
                                                    </button>
                                                    <button className="p-2 bg-white border border-slate-100 text-amber-500 hover:bg-amber-500 hover:text-white rounded-xl transition-all shadow-sm" title="Yêu cầu chỉnh sửa">
                                                        <RotateCcw size={14} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                }) : (
                                    <tr>
                                        <td colSpan={9} className="py-20 text-center text-slate-400 font-black uppercase tracking-widest text-[10px]">
                                            <div className="flex flex-col items-center gap-3">
                                                <div className="p-4 bg-slate-50 rounded-full"><Bell size={24} className="text-slate-200" /></div>
                                                Hiện tại không có phiếu nào cần bạn phê duyệt
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
    };

    const renderAdminDashboard = () => (
        <main className="animate-in fade-in duration-500">
            <h1 className="text-3xl font-black text-erp-navy tracking-tight mb-8">Hệ thống Quản trị Tổng thể</h1>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
                <div className="erp-card p-6! border-l-4 border-slate-200">
                    <div className="text-2xl font-black text-erp-navy font-mono">{formatVND(budgets?.allocated || 0)} ₫</div>
                    <div className="mt-2 text-[10px] text-slate-400 font-bold">Ngân sách đã phân bổ</div>
                </div>
            </div>
            <div className="erp-card !p-0 overflow-hidden shadow-xl shadow-erp-navy/5 border border-slate-100">
                <table className="erp-table text-xs">
                    <thead>
                        <tr><th>Mã PR</th><th>Phòng ban</th><th className="text-right">Giá trị</th><th className="text-right">Thao tác</th></tr>
                    </thead>
                    <tbody>
                        {(prs || []).slice(0, 5).map(pr => (
                            <tr key={pr.id}>
                                <td className="font-bold text-erp-navy">{pr.prNumber || pr.id.substring(0, 8)}</td>
                                <td className="font-bold text-slate-500">{typeof pr.department === 'object' ? pr.department?.name : (pr.department || "Dept")}</td>
                                <td className="font-mono text-right font-black text-erp-navy">{formatVND(pr.totalEstimate || 0)} ₫</td>
                                <td className="text-right text-slate-400"><button onClick={() => setSelectedPRDetails(pr)} className="p-2 hover:bg-slate-100 rounded-xl"><Eye size={16} /></button></td>
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
            {!isCFO && isProcurement && renderProcurementDashboard()}
            {!isCFO && isApproverGroup && renderApproverDashboard()}
            {!isRequester && !isCFO && !isProcurement && !isApproverGroup && renderAdminDashboard()}

            {selectedPRDetails && (
                <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-6 animate-in fade-in duration-300">
                    <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-5xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-300 border border-slate-200">
                        <div className="flex justify-between items-center p-8 border-b border-slate-100 bg-slate-50/50">
                            <div>
                                <h2 className="text-2xl font-black text-erp-navy flex items-center gap-3 tracking-tighter">
                                    <FileText size={24} className="text-erp-blue" />
                                    CHI TIẾT PHIẾU: <span className="text-erp-blue">{selectedPRDetails.prNumber || selectedPRDetails.id}</span>
                                </h2>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Cập nhật: {new Date(selectedPRDetails.createdAt || "").toLocaleString('vi-VN')}</p>
                            </div>
                            <button onClick={() => setSelectedPRDetails(null)} className="h-12 w-12 bg-white border border-slate-200 text-slate-400 hover:text-red-500 rounded-2xl flex items-center justify-center transition-all">
                                <Plus className="rotate-45" size={24} />
                            </button>
                        </div>

                        <div className="p-0 overflow-y-auto custom-scrollbar flex flex-col md:flex-row flex-1">
                            <div className="p-8 md:w-2/3 border-r border-slate-100 space-y-8">
                                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 text-center">
                                        <div className="text-[9px] font-black uppercase text-slate-400 mb-1">Trạng thái</div>
                                        <span className={`status-pill status-${(selectedPRDetails.status || 'draft').toLowerCase()}`}>{selectedPRDetails.status}</span>
                                    </div>
                                    <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100 text-center">
                                        <div className="text-[9px] font-black uppercase text-amber-600 mb-1">Ngày cần hàng</div>
                                        <div className="text-sm font-black text-erp-navy font-mono">
                                            {selectedPRDetails.requiredDate ? new Date(selectedPRDetails.requiredDate).toLocaleDateString('vi-VN') : 'N/A'}
                                        </div>
                                    </div>
                                    <div className="p-4 bg-erp-navy rounded-2xl text-center">
                                        <div className="text-[9px] font-black uppercase text-white/40 mb-1">Tổng dự toán</div>
                                        <div className="text-sm font-black text-emerald-400 font-mono">{formatVND(selectedPRDetails.totalEstimate || selectedPRDetails.total || 0)} ₫</div>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <h3 className="text-[10px] font-black text-slate-400 uppercase">Danh sách hàng hóa</h3>
                                    <div className="border border-slate-100 rounded-2xl overflow-hidden">
                                        <table className="w-full text-left text-xs">
                                            <thead className="bg-slate-50 border-b border-slate-100">
                                                <tr><th className="p-4 uppercase font-black text-slate-400">Sản phẩm</th><th className="p-4 text-center">SL</th><th className="p-4 text-right">Giá</th></tr>
                                            </thead>
                                            <tbody>
                                                {selectedPRDetails.items?.map((item, idx) => (
                                                    <tr key={idx} className="border-b border-slate-50">
                                                        <td className="p-4 font-black">{item.productName || item.description}</td>
                                                        <td className="p-4 text-center">{item.qty} {item.unit}</td>
                                                        <td className="p-4 text-right font-mono font-black">{formatVND((item.qty || 0) * (item.estimatedPrice || 0))} ₫</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>

                            <div className="p-8 md:w-1/3 bg-slate-50 flex flex-col justify-between">
                                <div className="space-y-8">
                                    <h3 className="text-[10px] font-black text-slate-400 uppercase flex items-center gap-2"><History size={14} /> Quy trình phê duyệt</h3>
                                    <div className="space-y-6">
                                        <div className="flex gap-4">
                                            <div className="w-2 h-2 rounded-full bg-emerald-500 mt-1"></div>
                                            <div>
                                                <div className="text-[10px] font-black uppercase">Khởi tạo</div>
                                                <div className="text-[9px] text-slate-400">{new Date(selectedPRDetails.createdAt || "").toLocaleString('vi-VN')}</div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="pt-8 space-y-3">
                                    {isApproverGroup && (selectedPRDetails as any).workflowId && (
                                        <button
                                            onClick={() => handleQuickApprove((selectedPRDetails as any).workflowId)}
                                            disabled={isSubmitting}
                                            className="w-full h-14 bg-emerald-500 text-white rounded-2xl font-black uppercase text-[10px] shadow-lg shadow-emerald-500/20 flex flex-col items-center justify-center hover:bg-emerald-600 transition-all"
                                        >
                                            {isSubmitting ? <Loader2 className="animate-spin" /> : <><span>Phê duyệt nhanh</span><span className="text-[8px] opacity-60">Duyệt ngay trên Dashboard</span></>}
                                        </button>
                                    )}
                                    <button onClick={() => setSelectedPRDetails(null)} className="w-full h-12 bg-white border border-slate-200 rounded-2xl text-[10px] font-black uppercase text-slate-600 hover:bg-slate-100 transition-all">Đóng</button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
