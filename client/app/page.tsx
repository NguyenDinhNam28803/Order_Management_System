/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React from "react";
import DashboardHeader from "./components/DashboardHeader";
import Link from "next/link";
import {
  Building2, Lock, CreditCard, ArrowUpRight,
  ArrowDownRight, Activity, Zap, FileText, ShoppingCart, UserCheck, Eye, Plus, Edit, Trash2,
  Clock, CheckCircle, Package, AlertCircle, AlertTriangle, ChevronRight, History, Bell, Send
} from "lucide-react";
import { useProcurement } from "./context/ProcurementContext";
import { formatVND } from "./utils/formatUtils";

export default function Dashboard() {
  const { budgets, prs, pos, currentUser } = useProcurement();
  const availableBudget = (budgets?.allocated || 0) - (budgets?.committed || 0) - (budgets?.spent || 0);
  const [selectedPRDetails, setSelectedPRDetails] = React.useState<any>(null);

  const isRequester = currentUser?.role === "REQUESTER";
  const isApproverGroup = currentUser?.role === "DEPT_APPROVER" || currentUser?.role === "DIRECTOR" || currentUser?.role === "CEO";
  const isProcurement = currentUser?.role === "PROCUREMENT";
  const isCEO = currentUser?.role === "CEO";

  // --- REQUESTER DASHBOARD ---
  if (isRequester) {
      const myPRs = prs; // In real app, filter by creator/department
      const pendingPRs = myPRs.filter((pr: any) => pr.status === "PENDING" || pr.status === "PENDING_DIRECTOR").length;
      const approvedPRs = myPRs.filter((pr: any) => pr.status === "APPROVED").length;

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

          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
            <div className="erp-card !p-6 border-l-4 border-amber-500">
              <div className="flex justify-between items-start mb-4">
                <div className="p-3 bg-amber-50 rounded-xl"><Clock size={20} className="text-amber-500" /></div>
                <span className="text-[10px] font-black uppercase text-amber-500 bg-amber-50 px-2 py-1 rounded">Chờ xử lý</span>
              </div>
              <div className="text-3xl font-black text-erp-navy font-mono">{pendingPRs}</div>
              <div className="mt-2 text-[10px] text-slate-400 font-bold">PR đang chờ duyệt</div>
            </div>

            <div className="erp-card !p-6 border-l-4 border-emerald-500">
              <div className="flex justify-between items-start mb-4">
                <div className="p-3 bg-emerald-50 rounded-xl"><CheckCircle size={20} className="text-emerald-500" /></div>
                <span className="text-[10px] font-black uppercase text-emerald-500 bg-emerald-50 px-2 py-1 rounded">Đã duyệt</span>
              </div>
              <div className="text-3xl font-black text-erp-navy font-mono">{approvedPRs}</div>
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
                {/* Hành động cần thiết */}
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

                {/* PR của tôi */}
                <div className="erp-card !p-0 overflow-hidden shadow-xl shadow-erp-navy/5">
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
                                {(myPRs || []).slice(0, 5).map((pr: any) => (
                                    <tr key={pr.id} className="hover:bg-slate-50 transition-colors">
                                        <td className="font-bold text-erp-navy">{pr.prNumber || pr.id.substring(0, 8)}</td>
                                        <td className="max-w-[200px] truncate font-medium text-slate-600" title={pr.title}>{pr.title}</td>
                                        <td className="text-slate-400">{new Date(pr.createdAt).toLocaleDateString('vi-VN')}</td>
                                        <td className="font-mono text-right font-black text-erp-navy">{formatVND(pr.totalEstimate)} ₫</td>
                                        <td className="text-center">
                                            <span className={`status-pill status-${(pr.status || 'DRAFT').toLowerCase()}`}>
                                                {pr.status}
                                            </span>
                                        </td>
                                        <td className="text-right">
                                            <button onClick={() => setSelectedPRDetails(pr)} className="px-3 py-1.5 bg-slate-100 hover:bg-erp-navy hover:text-white text-slate-600 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all shadow-sm">
                                                Chi tiết
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                                {(!myPRs || myPRs.length === 0) && (
                                    <tr>
                                        <td colSpan={6} className="py-20 text-center text-slate-400 font-bold uppercase tracking-widest text-[10px]">Chưa có yêu cầu nào</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            <div className="space-y-6">
                {/* Thông báo Feed */}
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
                        <div className="relative flex gap-4">
                            <div className="flex items-center justify-center w-5 h-5 rounded-full bg-blue-500 border-2 border-white shadow-lg shrink-0 z-10 -ml-0.5"></div>
                            <div className="flex-1 -mt-1">
                                <div className="flex justify-between mb-1">
                                    <span className="text-[10px] font-black text-erp-navy">Trưởng phòng đã xem</span>
                                    <span className="text-[8px] font-bold text-slate-400 uppercase">1h</span>
                                </div>
                                <p className="text-[10px] text-slate-500 leading-relaxed font-medium">PR-2026-002 đã được trưởng bộ phận tiếp nhận.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
          </div>

          {/* Chi tiết PR Modal */}
          {selectedPRDetails && (
            <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-6 animate-in fade-in duration-300">
                <div className="bg-white rounded-[32px] shadow-2xl w-full max-w-5xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-300 border border-slate-200">
                    <div className="flex justify-between items-center p-8 border-b border-slate-100 bg-slate-50/50">
                        <div>
                            <h2 className="text-2xl font-black text-erp-navy flex items-center gap-3 tracking-tighter">
                                <FileText size={24} className="text-erp-blue" />
                                CHI TIẾT PHIẾU: <span className="text-erp-blue">{selectedPRDetails.prNumber || selectedPRDetails.id}</span>
                            </h2>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Cập nhật lúc: {new Date(selectedPRDetails.updatedAt || selectedPRDetails.createdAt).toLocaleString()}</p>
                        </div>
                        <button onClick={() => setSelectedPRDetails(null)} className="h-12 w-12 bg-white border border-slate-200 text-slate-400 hover:text-red-500 hover:border-red-100 rounded-2xl flex items-center justify-center transition-all shadow-sm">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                        </button>
                    </div>
                    
                    <div className="p-0 overflow-y-auto custom-scrollbar flex flex-col md:flex-row flex-1">
                        {/* Main Info */}
                        <div className="p-8 md:w-2/3 border-r border-slate-100 space-y-8">
                            {/* Summary Grid */}
                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                    <div className="text-[9px] font-black uppercase text-slate-400 mb-1">Trạng thái</div>
                                    <span className={`status-pill status-${(selectedPRDetails.status || 'draft').toLowerCase()}`}>
                                        {selectedPRDetails.status}
                                    </span>
                                </div>
                                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                    <div className="text-[9px] font-black uppercase text-slate-400 mb-1">Mức ưu tiên</div>
                                    <div className={`text-xs font-black uppercase ${selectedPRDetails.priority === 1 ? 'text-red-600' : 'text-slate-600'}`}>
                                        {selectedPRDetails.priority === 1 ? 'Khẩn cấp' : 'Bình thường'}
                                    </div>
                                </div>
                                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                    <div className="text-[9px] font-black uppercase text-slate-400 mb-1">Ngày cần</div>
                                    <div className="text-xs font-black text-erp-navy">{selectedPRDetails.requiredDate ? new Date(selectedPRDetails.requiredDate).toLocaleDateString() : 'N/A'}</div>
                                </div>
                                <div className="p-4 bg-erp-navy rounded-2xl border border-erp-navy shadow-lg shadow-erp-navy/20">
                                    <div className="text-[9px] font-black uppercase text-white/40 mb-1">Tổng dự toán</div>
                                    <div className="text-sm font-black text-emerald-400 font-mono">{formatVND(selectedPRDetails.total || selectedPRDetails.totalEstimate || 0)} ₫</div>
                                </div>
                            </div>

                            {/* Reasoning */}
                            <div className="space-y-2">
                                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Lý do & Mô tả nhu cầu</h3>
                                <div className="p-6 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-medium text-slate-600 italic leading-relaxed">
                                   &quot;{selectedPRDetails.justification || selectedPRDetails.reason || "Không có mô tả chi tiết"}&quot;
                                </div>
                            </div>

                            {/* Line Items */}
                            <div className="space-y-4">
                                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex justify-between">
                                    Danh sách hàng hóa & Dịch vụ
                                    <span className="text-erp-blue">{(selectedPRDetails.items?.length || 0)} Items</span>
                                </h3>
                                <div className="border border-slate-100 rounded-2xl overflow-hidden shadow-sm">
                                    <table className="w-full text-left border-collapse">
                                        <thead className="bg-slate-50 border-b border-slate-100">
                                            <tr>
                                                <th className="p-4 text-[9px] font-black uppercase text-slate-400">Sản phẩm</th>
                                                <th className="p-4 text-[9px] font-black uppercase text-slate-400 text-center">SL</th>
                                                <th className="p-4 text-[9px] font-black uppercase text-slate-400 text-right">Thành tiền (Dự tính)</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-50">
                                            {selectedPRDetails.items?.map((item: any, idx: number) => (
                                                <tr key={idx} className="hover:bg-slate-50 transition-colors">
                                                    <td className="p-4">
                                                        <div className="text-xs font-black text-erp-navy">{item.productName || item.description || item.product?.name}</div>
                                                        <div className="text-[9px] text-slate-400 font-bold uppercase tracking-tighter mt-0.5">SKU: {item.sku || "N/A"}</div>
                                                    </td>
                                                    <td className="p-4 text-center text-xs font-black text-erp-blue">{item.qty} {item.unit}</td>
                                                    <td className="p-4 text-right font-mono text-xs font-black text-erp-navy">
                                                        {formatVND((item.qty || 0) * (item.estimatedPrice || item.price || 0))} ₫
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>

                        {/* Status Sidebar */}
                        <div className="p-8 md:w-1/3 bg-slate-50 space-y-8">
                           <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                <History size={14} /> Luồng phê duyệt
                           </h3>
                           <div className="space-y-8 relative">
                                <div className="absolute left-[11px] top-2 h-[calc(100%-16px)] w-0.5 bg-slate-200"></div>
                                
                                <div className="relative flex gap-4">
                                    <div className="w-6 h-6 rounded-full bg-emerald-500 border-4 border-white shadow shadow-emerald-500/20 z-10 shrink-0"></div>
                                    <div className="-mt-1">
                                        <div className="text-[10px] font-black text-erp-navy uppercase">Khởi tạo phiếu</div>
                                        <div className="text-[9px] text-slate-400 font-bold">Bởi: {currentUser?.name}</div>
                                        <div className="text-[8px] text-slate-400 mt-1">{new Date(selectedPRDetails.createdAt).toLocaleString()}</div>
                                    </div>
                                </div>

                                <div className="relative flex gap-4">
                                    <div className={`w-6 h-6 rounded-full border-4 border-white shadow z-10 shrink-0 ${selectedPRDetails.status === 'PENDING' ? 'bg-amber-500 shadow-amber-500/20 animate-pulse' : (selectedPRDetails.status === 'APPROVED' ? 'bg-emerald-500 shadow-emerald-500/20' : 'bg-slate-200')}`}></div>
                                    <div className="-mt-1">
                                        <div className="text-[10px] font-black text-erp-navy uppercase">Trưởng bộ phận phê duyệt</div>
                                        <div className="text-[9px] text-slate-400 font-bold">Chờ xem xét</div>
                                    </div>
                                </div>

                                <div className="relative flex gap-4">
                                    <div className={`w-6 h-6 rounded-full border-4 border-white shadow z-10 shrink-0 ${selectedPRDetails.status === 'APPROVED' ? 'bg-emerald-500 shadow-emerald-500/20' : 'bg-slate-200'}`}></div>
                                    <div className="-mt-1">
                                        <div className="text-[10px] font-black text-erp-navy uppercase">Hoàn tất quy trình</div>
                                    </div>
                                </div>
                           </div>

                           <div className="pt-8 border-t border-slate-200">
                                <button className="w-full h-12 bg-white border border-slate-200 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-600 hover:bg-slate-100 hover:text-erp-navy transition-all shadow-sm">
                                    <Plus size={14} className="inline mr-2" /> In phiếu PR (PDF)
                                </button>
                           </div>
                        </div>
                    </div>
                </div>
            </div>
          )}
        </main>
      );
  }

    // --- PROCUREMENT DASHBOARD ---
    if (isProcurement) {
        const approvedPRs = (prs || []).filter((pr: any) => pr.status === "APPROVED");
        const activeRFQs = (pos || []).filter((po: any) => po.status === "PENDING").length; // Mocking RFQ with PO pending
        
        return (
            <main className="animate-in fade-in duration-500">
                <div className="flex justify-between items-end mb-8">
                    <div>
                        <h1 className="text-3xl font-black text-erp-navy tracking-tight">Trung tâm Quản lý Thu mua</h1>
                        <p className="text-sm text-slate-500 mt-1">Xin chào, {currentUser.name || currentUser.fullName} - Kiểm soát chuỗi cung ứng và nguồn hàng.</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
                    <div className="erp-card !p-6 border-l-4 border-blue-500 shadow-xl shadow-blue-500/5">
                        <div className="flex justify-between items-start mb-4">
                            <div className="p-3 bg-blue-50 rounded-xl"><FileText size={20} className="text-blue-500" /></div>
                            <span className="text-[10px] font-black uppercase text-blue-500 bg-blue-50 px-3 py-1 rounded">Chờ RFQ</span>
                        </div>
                        <div className="text-3xl font-black text-erp-navy font-mono">{approvedPRs.length}</div>
                        <div className="mt-2 text-[10px] text-slate-400 font-bold">PR đã duyệt chờ tìm nguồn</div>
                    </div>

                    <div className="erp-card !p-6 border-l-4 border-amber-500 shadow-xl shadow-amber-500/5">
                        <div className="flex justify-between items-start mb-4">
                            <div className="p-3 bg-amber-50 rounded-xl"><Send size={20} className="text-amber-500" /></div>
                            <span className="text-[10px] font-black uppercase text-amber-500 bg-amber-50 px-3 py-1 rounded">Đang báo giá</span>
                        </div>
                        <div className="text-3xl font-black text-erp-navy font-mono">5</div>
                        <div className="mt-2 text-[10px] text-slate-400 font-bold">RFQ đang đợi phản hồi</div>
                    </div>

                    <div className="erp-card !p-6 border-l-4 border-emerald-500 shadow-xl shadow-emerald-500/5">
                        <div className="flex justify-between items-start mb-4">
                            <div className="p-3 bg-emerald-50 rounded-xl"><ShoppingCart size={20} className="text-emerald-500" /></div>
                            <span className="text-[10px] font-black uppercase text-emerald-500 bg-emerald-50 px-3 py-1 rounded">Chờ đặt PO</span>
                        </div>
                        <div className="text-3xl font-black text-erp-navy font-mono">3</div>
                        <div className="mt-2 text-[10px] text-slate-400 font-bold">Đã chọn NCC, chờ phát hành PO</div>
                    </div>

                    <div className="erp-card !p-6 border-l-4 border-purple-500 shadow-xl shadow-purple-500/5">
                        <div className="flex justify-between items-start mb-4">
                            <div className="p-3 bg-purple-50 rounded-xl"><Activity size={20} className="text-purple-500" /></div>
                            <span className="text-[10px] font-black uppercase text-purple-500 bg-purple-50 px-3 py-1 rounded">Efficiency</span>
                        </div>
                        <div className="text-3xl font-black text-erp-navy font-mono">92%</div>
                        <div className="mt-2 text-[10px] text-slate-400 font-bold">Tỉ lệ hoàn thành mua hàng</div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2">
                        <div className="erp-card bg-white border border-slate-100 shadow-xl shadow-erp-navy/5 overflow-hidden !p-0">
                            <div className="p-6 border-b border-slate-50 flex justify-between items-center bg-slate-50/20">
                                <h3 className="text-xs font-black uppercase tracking-widest text-erp-navy">Xử lý nguồn hàng khẩn cấp</h3>
                                <Link href="/sourcing" className="text-[10px] font-black uppercase text-erp-blue hover:underline">Đi tới Sourcing →</Link>
                            </div>
                            <div className="p-6 space-y-4">
                                {approvedPRs.length > 0 ? approvedPRs.map((pr: any) => (
                                    <div key={pr.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100/50 hover:bg-white hover:shadow-lg transition-all">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center font-black">{pr.prNumber?.substring(3,7) || "PR"}</div>
                                            <div>
                                                <div className="text-xs font-black text-erp-navy">{pr.title}</div>
                                                <div className="text-[10px] text-slate-400 font-bold">Người tạo: {pr.requester?.name || "Member"} | {pr.department?.name || "Dept"}</div>
                                            </div>
                                        </div>
                                        <div className="text-right flex items-center gap-4">
                                            <div>
                                                <div className="text-xs font-black text-erp-blue font-mono">{formatVND(pr.totalEstimate)} ₫</div>
                                                <div className="text-[9px] text-slate-400 uppercase font-bold tracking-widest">Giá trị dự toán</div>
                                            </div>
                                            <Link href="/sourcing" className="bg-erp-navy text-white text-[9px] font-black uppercase px-4 py-2 rounded-xl shadow-lg shadow-erp-navy/20 active:scale-95 transition-all">Sourcing</Link>
                                        </div>
                                    </div>
                                )) : (
                                    <div className="py-12 text-center text-slate-400 font-black uppercase tracking-widest text-[10px]">Chúc mừng! Không có đơn PR nào tồn đọng.</div>
                                )}
                            </div>
                        </div>
                    </div>
                    
                    <div className="space-y-6">
                        <div className="erp-card shadow-xl shadow-erp-navy/5">
                            <h3 className="text-[10px] font-black uppercase tracking-widest text-erp-navy mb-6">Đối tác chiến lược hàng đầu</h3>
                            <div className="space-y-4">
                                {[
                                    { name: "Cisco Systems VN", tag: "Network", rating: 9.8 },
                                    { name: "Dell Global Ltd.", tag: "Hardware", rating: 9.5 },
                                    { name: "FPT Telecom Solution", tag: "Service", rating: 9.2 }
                                ].map(vendor => (
                                    <div key={vendor.name} className="flex items-center justify-between p-3 rounded-2xl hover:bg-slate-50 transition-colors cursor-pointer border border-transparent hover:border-slate-100">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-[10px] font-black text-slate-500 uppercase">{vendor.name.substring(0,1)}</div>
                                            <div>
                                                <div className="text-xs font-black text-erp-navy mb-0.5">{vendor.name}</div>
                                                <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{vendor.tag}</div>
                                            </div>
                                        </div>
                                        <div className="text-emerald-500 font-black text-xs">{vendor.rating}</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        );
    }

  // --- APPROVER DASHBOARD ---
  if (isApproverGroup) {
      const myPendingPRs = (prs || []).filter((pr: any) => {
          if (!currentUser) return false;
          const status = pr.status;
          // Manager (DEPT_APPROVER) sees all Requester PRs and their own PRs
          if (currentUser.role === "DEPT_APPROVER") {
              const creatorRole = pr.creatorRole || pr.requester?.role;
              return creatorRole === "REQUESTER" || pr.requesterId === currentUser.id;
          }
          if (currentUser.role === "DIRECTOR") return status === "PENDING_DIRECTOR" || status === "PENDING_APPROVAL";
          return status === "PENDING_APPROVAL" || status === "PENDING";
      });
      const pendingPRCount = myPendingPRs.length;
      const pendingPRValue = myPendingPRs.reduce((sum: number, pr: any) => sum + (Number(pr.totalEstimate) || 0), 0);

      const approvedToday = 12; // Static mock
      const rejectedThisMonth = 2; // Static mock
      const lateSLA = 1; // Static mock

      return (
          <main className="animate-in fade-in duration-500">
              <div className="flex justify-between items-end mb-8">
                  <div>
                      <h1 className="text-3xl font-black text-erp-navy tracking-tight">Khu vực Quản lý Phê duyệt</h1>
                      <p className="text-sm text-slate-500 mt-1">Xin chào, {currentUser.name || currentUser.fullName} - Bạn đang có {pendingPRCount} yêu cầu đang chờ xử lý.</p>
                  </div>
                  <div className="flex gap-3">
                      <Link href="/approvals" className="btn-primary flex items-center gap-2">
                          <CheckCircle size={16} /> Bảng xét duyệt chi tiết
                      </Link>
                  </div>
              </div>

              {/* KPI Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
                  <div className="erp-card !p-6 border-l-4 border-erp-blue bg-blue-50/50 shadow-sm">
                      <div className="flex justify-between items-start mb-4">
                          <div className="p-3 bg-white rounded-xl shadow-sm"><Clock size={20} className="text-erp-blue" /></div>
                          <span className="text-[10px] font-black uppercase text-erp-blue bg-white shadow-sm border border-blue-100 px-2 py-1 rounded">Chờ tôi duyệt</span>
                      </div>
                      <div className="text-3xl font-black text-erp-navy font-mono mb-1">{pendingPRCount}</div>
                      <div className="text-xs font-black text-erp-blue font-mono">{pendingPRValue.toLocaleString()} ₫</div>
                      <div className="mt-3 text-[10px] text-slate-500 font-bold uppercase tracking-widest pt-3 border-t border-blue-100/50">Tổng giá trị chờ duyệt</div>
                  </div>

                  <div className="erp-card !p-6 border-l-4 border-emerald-500">
                      <div className="flex justify-between items-start mb-4">
                          <div className="p-3 bg-emerald-50 rounded-xl"><CheckCircle size={20} className="text-emerald-500" /></div>
                          <span className="text-[10px] font-black uppercase text-emerald-500 bg-emerald-50 px-2 py-1 rounded">Hoàn thành</span>
                      </div>
                      <div className="text-3xl font-black text-erp-navy font-mono">{approvedToday}</div>
                      <div className="mt-2 text-[10px] text-slate-400 font-bold">Số phiếu đã duyệt hôm nay</div>
                  </div>

                  <div className="erp-card !p-6 border-l-4 border-slate-500">
                      <div className="flex justify-between items-start mb-4">
                          <div className="p-3 bg-slate-100 rounded-xl"><AlertCircle size={20} className="text-slate-500" /></div>
                          <span className="text-[10px] font-black uppercase text-slate-500 bg-slate-100 px-2 py-1 rounded">Từ chối</span>
                      </div>
                      <div className="text-3xl font-black text-erp-navy font-mono">{rejectedThisMonth}</div>
                      <div className="mt-2 text-[10px] text-slate-400 font-bold">Số phiếu bị từ chối</div>
                  </div>

                  <div className="erp-card !p-6 border-l-4 border-red-500 bg-red-50/50">
                      <div className="flex justify-between items-start mb-4">
                          <div className="p-3 bg-white rounded-xl shadow-sm"><AlertTriangle size={20} className="text-red-500" /></div>
                          <span className="text-[10px] font-black uppercase text-red-600 bg-red-100 px-2 py-1 rounded animate-pulse">Cần ưu tiên</span>
                      </div>
                      <div className="text-3xl font-black text-red-600 font-mono">{lateSLA}</div>
                      <div className="mt-2 text-[10px] text-red-500 font-bold">Phiếu chờ duyệt bị trễ SLA</div>
                  </div>
              </div>

              <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                  {/* Queue cần duyệt */}
                  <div className="xl:col-span-2 space-y-8">
                      <div className="erp-card !p-0 overflow-hidden shadow-xl shadow-erp-navy/5">
                          <div className="p-6 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
                              <h3 className="text-[10px] font-black uppercase tracking-widest text-erp-navy flex items-center gap-2">
                                  <FileText size={16} className="text-erp-blue" /> Queue Cần Duyệt Mới Nhất
                              </h3>
                              <Link href="/approvals" className="text-[9px] font-black uppercase text-erp-blue hover:underline bg-white px-3 py-1.5 rounded-lg shadow-sm border border-slate-200">
                                  Tới màn hình duyệt →
                              </Link>
                          </div>
                          <div className="overflow-x-auto">
                            <table className="erp-table text-xs">
                                <thead>
                                    <tr>
                                        <th>Số phiếu</th>
                                        <th>Người tạo</th>
                                        <th className="w-[30%]">Tiêu đề (Lý do)</th>
                                        <th className="text-right">Tổng giá trị</th>
                                        <th className="text-center">Thời gian chờ</th>
                                        <th className="text-center">Duyệt nhanh</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {myPendingPRs.length > 0 ? myPendingPRs.map((pr: any) => {
                                        return (
                                            <tr key={pr.id} className="hover:bg-slate-50 transition-colors">
                                                <td className="font-bold text-erp-navy">{pr.prNumber || pr.id.substring(0,8)}</td>
                                                <td className="font-bold text-slate-500">{pr.department?.name || "N/A"}</td>
                                                <td className="max-w-[150px] truncate font-medium" title={pr.title}>{pr.title}</td>
                                                <td className="font-mono text-right font-black text-erp-blue">{formatVND(pr.totalEstimate)} ₫</td>
                                                <td className="text-center">
                                                    <span className="text-[9px] font-bold text-slate-500 bg-slate-100 px-2 py-1 rounded">4h</span>
                                                </td>
                                                <td className="text-center">
                                                    <Link href="/approvals" className="p-2 inline-flex bg-emerald-50 text-emerald-600 hover:bg-emerald-500 hover:text-white rounded-xl transition-all shadow-sm">
                                                        <CheckCircle size={16} />
                                                    </Link>
                                                </td>
                                            </tr>
                                        )
                                    }) : (
                                        <tr>
                                            <td colSpan={6} className="py-20 text-center text-slate-400 font-bold uppercase tracking-widest text-[10px]">
                                                Không có phiếu nào chờ duyệt
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                          </div>
                      </div>
                  </div>

                  <div className="space-y-6">
                      <div className="erp-card shadow-xl shadow-erp-navy/5">
                          <h3 className="text-[10px] font-black uppercase tracking-widest text-erp-navy mb-6 flex items-center gap-2">
                              <History size={16} className="text-erp-blue" /> Hoạt động gần đây
                          </h3>
                          <div className="space-y-4">
                              <div className="flex flex-col gap-1 p-4 border border-slate-100 rounded-2xl hover:bg-slate-50 transition-colors cursor-pointer">
                                  <div className="flex justify-between items-start">
                                      <div className="text-xs font-black text-erp-navy">PR-2026-004</div>
                                      <span className="text-[8px] font-black text-emerald-600 bg-emerald-50 px-2 py-1 rounded uppercase tracking-widest">Đã duyệt</span>
                                  </div>
                                  <div className="text-[10px] font-bold text-slate-500 truncate mt-1">Vật tư dự phòng Q2</div>
                                  <div className="flex justify-between items-center mt-3 pt-3 border-t border-slate-100">
                                      <div className="text-[9px] font-mono text-slate-400 font-bold">450,000,000 ₫</div>
                                      <div className="text-[8px] font-bold text-slate-400 uppercase">10:30 AM</div>
                                  </div>
                              </div>
                          </div>
                      </div>
                  </div>
              </div>
          </main>
      )
  }

  // --- STANDARD / ADMIN DASHBOARD ---
  return (
    <main className="animate-in fade-in duration-500">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-3xl font-black text-erp-navy tracking-tight">Hệ thống Quản trị Tổng thể</h1>
          <p className="text-sm text-slate-500 mt-1">Chào mừng quay trở lại, {currentUser?.name || currentUser?.fullName}.</p>
        </div>
        <div className="flex gap-3">
          <div className="bg-white px-4 py-2.5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-2">
            <Activity size={16} className="text-emerald-500" />
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Hệ thống: Hoạt động ổn định</span>
          </div>
        </div>
      </div>

      {/* --- Budget Widgets --- */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
        <div className="erp-card !p-6 border-l-4 border-slate-200">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-slate-50 rounded-xl"><Building2 size={20} className="text-slate-400" /></div>
            <span className="text-[10px] font-black uppercase text-slate-400 bg-slate-50 px-3 py-1 rounded">Phân bổ (Allocated)</span>
          </div>
          <div className="text-2xl font-black text-erp-navy font-mono">
            { formatVND(budgets?.allocated || 0) } ₫
          </div>
          <div className="mt-2 text-[10px] text-slate-400 font-bold flex items-center gap-1">
            <ArrowUpRight size={12} className="text-emerald-500" /> Quản lý bởi Phòng Tài Chính
          </div>
        </div>

        <div className="erp-card !p-6 border-l-4 border-erp-blue shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-blue-50 rounded-xl"><Lock size={20} className="text-erp-blue" /></div>
            <span className="text-[10px] font-black uppercase text-erp-blue bg-blue-50 px-3 py-1 rounded">Cam kết (Committed)</span>
          </div>
          <div className="text-2xl font-black text-erp-blue font-mono">
             { formatVND(budgets?.committed || 0) } ₫
          </div>
          <div className="mt-2 text-[10px] text-slate-400 font-bold">Giá trị PR/PO đang xử lý</div>
        </div>

        <div className="erp-card !p-6 border-l-4 border-erp-navy shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-slate-100 rounded-xl"><CreditCard size={20} className="text-erp-navy" /></div>
            <span className="text-[10px] font-black uppercase text-erp-navy bg-slate-100 px-3 py-1 rounded">Đã chi (Spent)</span>
          </div>
          <div className="text-2xl font-black text-erp-navy font-mono">
            { formatVND(budgets?.spent || 0) } ₫
          </div>
          <div className="mt-2 text-[10px] text-slate-400 font-bold flex items-center gap-1">
            <ArrowDownRight size={12} className="text-red-500" /> Thanh toán thực tế
          </div>
        </div>

        <div className="erp-card !p-6 bg-erp-navy !border-none shadow-2xl shadow-erp-navy/30 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-150 transition-transform duration-700">
            <Zap size={120} className="text-white fill-white" />
          </div>
          <div className="relative z-10 flex flex-col h-full justify-between">
            <div>
              <div className="text-[10px] font-black uppercase text-white/40 tracking-widest mb-1">Cơ cấu Ngân sách Khả dụng</div>
              <div className="text-3xl font-black text-emerald-400 font-mono">
                { formatVND(availableBudget) } ₫
              </div>
            </div>
            <div className="mt-6">
              <div className="budget-meter !h-3">
                <div className="meter-spent" style={{ width: `${((budgets?.spent || 0) / (budgets?.allocated || 1)) * 100}%` }}></div>
                <div className="meter-committed" style={{ width: `${((budgets?.committed || 0) / (budgets?.allocated || 1)) * 100}%` }}></div>
                <div className="meter-available" style={{ width: `${(availableBudget / (budgets?.allocated || 1)) * 100}%` }}></div>
              </div>
              <div className="flex justify-between mt-2 text-[9px] font-black uppercase text-white/30 tracking-widest">
                <span>Sử dụng: {((( (budgets?.spent || 0) + (budgets?.committed || 0)) / (budgets?.allocated || 1)) * 100).toFixed(1)}%</span>
                <span>Dự trữ: 20%</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* --- Recent PRs --- */}
        <div className="lg:col-span-2 space-y-6">
          <div className="erp-card !p-0 overflow-hidden shadow-xl shadow-erp-navy/5 border border-slate-100">
            <div className="p-6 border-b border-slate-50 flex justify-between items-center bg-slate-50/30">
              <h3 className="text-[10px] font-black uppercase tracking-widest text-erp-navy flex items-center gap-2">
                <FileText size={16} className="text-erp-blue" /> Hệ thống Phiếu yêu cầu (PR)
              </h3>
              <Link href="/pr" className="text-[9px] font-black uppercase text-erp-blue bg-white px-3 py-1.5 rounded-lg shadow-sm border border-slate-100 hover:shadow-md transition-shadow">Toàn bộ danh sách</Link>
            </div>
            <div className="overflow-x-auto">
                <table className="erp-table text-xs">
                <thead>
                    <tr>
                    <th>Mã PR</th>
                    <th>Phòng ban</th>
                    <th className="text-center">Số hạng mục</th>
                    <th className="text-right">Giá trị dự toán</th>
                    <th className="text-center">Trạng thái</th>
                    <th className="text-right">Thao tác</th>
                    </tr>
                </thead>
                <tbody>
                    {(prs || []).slice(0, 5).map((pr: any) => (
                    <tr key={pr.id} className="hover:bg-slate-50 transition-colors">
                        <td className="font-bold text-erp-navy">{pr.prNumber || pr.id}</td>
                        <td className="font-bold text-slate-500">{pr.department?.name || pr.department}</td>
                        <td className="text-center">
                            <span className="px-3 py-1 bg-blue-50 text-erp-blue rounded-full font-black text-[10px]">
                                {pr.items?.length || 0}
                            </span>
                        </td>
                        <td className="font-mono text-right font-black text-erp-navy">{formatVND(pr.total || pr.totalEstimate || 0)} ₫</td>
                        <td className="text-center">
                            <span className={`status-pill status-${(pr.status || 'draft').toLowerCase()}`}>
                                {pr.status}
                            </span>
                        </td>
                        <td className="text-right">
                            <div className="flex justify-end gap-2">
                                <button onClick={() => setSelectedPRDetails(pr)} className="p-2 text-slate-400 hover:text-erp-navy hover:bg-slate-100 rounded-xl transition-all shadow-sm bg-white border border-slate-100" title="Xem chi tiết">
                                    <Eye size={16} />
                                </button>
                                <button className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all shadow-sm bg-white border border-slate-100" title="Hủy phiếu">
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        </td>
                    </tr>
                    ))}
                    {(!prs || prs.length === 0) && (
                        <tr>
                            <td colSpan={6} className="py-20 text-center text-slate-400 font-bold uppercase tracking-widest text-[10px]">Hệ thống chưa có yêu cầu mua sắm nào</td>
                        </tr>
                    )}
                </tbody>
                </table>
            </div>
          </div>
        </div>

        <div className="space-y-6">
            <div className="erp-card shadow-xl shadow-erp-navy/5 border border-slate-100">
                <h3 className="text-[10px] font-black uppercase tracking-widest text-erp-navy mb-6 flex items-center gap-2">
                    <Activity size={16} className="text-emerald-500" /> Sức khỏe Hệ thống
                </h3>
                <div className="space-y-6">
                    <div>
                        <div className="flex justify-between mb-2">
                            <span className="text-[10px] font-black text-slate-500 uppercase">Database Sync</span>
                            <span className="text-[10px] font-black text-emerald-500">100%</span>
                        </div>
                        <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div className="h-full bg-emerald-500 w-full"></div>
                        </div>
                    </div>
                    <div>
                        <div className="flex justify-between mb-2">
                            <span className="text-[10px] font-black text-slate-500 uppercase">API Latency</span>
                            <span className="text-[10px] font-black text-emerald-500">45ms</span>
                        </div>
                        <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div className="h-full bg-emerald-500 w-[15%]"></div>
                        </div>
                    </div>
                </div>
                <div className="mt-8 pt-6 border-t border-slate-100 text-[10px] font-bold text-slate-400 leading-relaxed italic">
                    Tất cả các module Phê duyệt, Thu mua, Kho và Tài chính đều đang hoạt động ở trạng thái tối ưu.
                </div>
            </div>
        </div>
      </div>
    </main>
  );
}
