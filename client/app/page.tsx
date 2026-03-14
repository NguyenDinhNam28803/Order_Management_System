"use client";

import React from "react";
import DashboardHeader from "./components/DashboardHeader";
import Link from "next/link";
import {
  Building2, Lock, CreditCard, ArrowUpRight,
  ArrowDownRight, Activity, Zap, FileText, ShoppingCart, UserCheck, Eye, Plus, Edit, Trash2,
  Clock, CheckCircle, Package, AlertCircle, AlertTriangle, ChevronRight, History, Bell
} from "lucide-react";
import { useProcurement } from "./context/ProcurementContext";

export default function Dashboard() {
  const { budget, prs, pos, currentUser } = useProcurement();
  const availableBudget = budget.allocated - budget.committed - budget.spent;
  const [selectedPRDetails, setSelectedPRDetails] = React.useState<any>(null);

  const isRequester = currentUser?.role === "Requester";
  const isApproverGroup = currentUser?.role === "Approver" || currentUser?.role === "Director";

  // --- REQUESTER DASHBOARD ---
  if (isRequester) {
      const myPRs = prs; // In real app, filter by creator/department
      const pendingPRs = myPRs.filter(pr => pr.status === "PENDING" || pr.status === "PENDING_DIRECTOR").length;
      const approvedPRs = myPRs.filter(pr => pr.status === "APPROVED").length;

      return (
        <main className="pt-16 px-8 pb-12">
          <DashboardHeader breadcrumbs={["Tổng quan", "Dashboard Requester"]} />

          <div className="mt-8 flex justify-between items-end mb-8">
            <div>
              <h1 className="text-3xl font-black text-erp-navy tracking-tight">Khu vực làm việc cá nhân</h1>
              <p className="text-sm text-slate-500 mt-1">Xin chào, {currentUser.name} - Hệ thống AI Procurement đã sẵn sàng.</p>
            </div>
            <div className="flex gap-3">
              <Link href="/pr" className="btn-primary flex items-center gap-2">
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
                <div className="erp-card bg-amber-50/50 border-amber-100">
                    <h3 className="text-sm font-black uppercase tracking-widest text-amber-800 mb-4 flex items-center gap-2">
                        <AlertTriangle size={16} className="text-amber-500" /> Cần hành động ngay
                    </h3>
                    <div className="space-y-3">
                        <div className="bg-white p-4 rounded-xl border border-amber-200 flex items-center justify-between shadow-sm">
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center shrink-0">
                                    <Zap size={18} />
                                </div>
                                <div>
                                    <div className="text-xs font-black text-erp-navy mb-1">Xác nhận AI Report cho PR-2026-002</div>
                                    <div className="text-[10px] text-slate-500 font-bold">Hệ thống đã đề xuất 3 Nhà cung cấp cho lô máy may công nghiệp.</div>
                                </div>
                            </div>
                            <Link href="/ai-report" className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white text-xs font-black uppercase tracking-widest rounded-lg shadow-md transition-all">
                                Xem AI Report
                            </Link>
                        </div>
                        <div className="bg-white p-4 rounded-xl border border-blue-200 flex items-center justify-between shadow-sm">
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-full bg-blue-100 text-erp-blue flex items-center justify-center shrink-0">
                                    <FileText size={18} />
                                </div>
                                <div>
                                    <div className="text-xs font-black text-erp-navy mb-1">Bổ sung thông tin cho PR-2026-005</div>
                                    <div className="text-[10px] text-slate-500 font-bold">Trưởng phòng yêu cầu bổ sung báo giá dự kiến. (Status: REQUEST_INFO)</div>
                                </div>
                            </div>
                            <button className="px-4 py-2 bg-erp-blue hover:bg-blue-700 text-white text-xs font-black uppercase tracking-widest rounded-lg shadow-md transition-all">
                                Cập nhật
                            </button>
                        </div>
                    </div>
                </div>

                {/* PR của tôi */}
                <div className="erp-card !p-0 overflow-hidden">
                    <div className="p-6 border-b border-slate-50 flex justify-between items-center">
                        <h3 className="text-sm font-black uppercase tracking-widest text-erp-navy flex items-center gap-2">
                            <FileText size={16} className="text-erp-blue" /> Danh sách PR của tôi (Gần nhất)
                        </h3>
                        <button className="text-[10px] font-black uppercase text-erp-blue hover:underline">Xem tất cả</button>
                    </div>
                    <table className="erp-table">
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
                            {myPRs.slice(0, 5).map(pr => (
                                <tr key={pr.id}>
                                    <td className="font-bold text-erp-navy">{pr.id}</td>
                                    <td className="max-w-[150px] truncate" title={pr.reason}>{pr.reason}</td>
                                    <td>{pr.createdAt}</td>
                                    <td className="font-mono text-right font-black">{pr.total.toLocaleString()} ₫</td>
                                    <td className="text-center">
                                        <span className={`status-pill ${pr.status === 'APPROVED' ? 'status-approved' :
                                        (pr.status === 'PENDING' || pr.status === 'PENDING_DIRECTOR') ? 'status-pending' :
                                            pr.status === 'REJECTED' ? 'status-rejected' : 'status-draft'
                                        }`}>
                                        {pr.status === 'PENDING_DIRECTOR' ? 'PENDING' : pr.status}
                                        </span>
                                    </td>
                                    <td className="text-right">
                                        <button onClick={() => setSelectedPRDetails(pr)} className="px-3 py-1 bg-slate-100 hover:bg-erp-blue hover:text-white text-slate-600 text-[10px] font-black uppercase tracking-widest rounded transition-all">
                                            Xem chi tiết
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className="space-y-6">
                {/* Thông báo Feed */}
                <div className="erp-card">
                    <h3 className="text-sm font-black uppercase tracking-widest text-erp-navy mb-6 flex items-center gap-2">
                        <Bell size={16} className="text-erp-blue" /> Thông báo mới nhất
                    </h3>
                    <div className="space-y-6 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-200 before:to-transparent">
                        <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                            <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-white bg-emerald-100 text-emerald-600 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2">
                                <CheckCircle size={16} />
                            </div>
                            <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 rounded-xl border border-slate-100 bg-white shadow-sm">
                                <div className="flex items-center justify-between space-x-2 mb-1">
                                    <div className="font-bold text-erp-navy text-xs">PR-2026-001 đã được duyệt</div>
                                    <time className="text-[9px] font-black uppercase text-slate-400">10 phút trước</time>
                                </div>
                                <div className="text-[10px] text-slate-500 font-medium">Giám đốc vừa phê duyệt phiếu yêu cầu vật tư của bạn. Hệ thống đang chuyển sang bộ phận Thu mua.</div>
                            </div>
                        </div>

                        <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                            <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-white bg-blue-100 text-erp-blue shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2">
                                <FileText size={16} />
                            </div>
                            <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 rounded-xl border border-slate-100 bg-white shadow-sm">
                                <div className="flex items-center justify-between space-x-2 mb-1">
                                    <div className="font-bold text-erp-navy text-xs">Trưởng phòng đã xem PR-2026-002</div>
                                    <time className="text-[9px] font-black uppercase text-slate-400">1 giờ trước</time>
                                </div>
                            </div>
                        </div>

                        <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                            <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-white bg-amber-100 text-amber-600 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2">
                                <Zap size={16} />
                            </div>
                            <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 rounded-xl border border-slate-100 bg-white shadow-sm">
                                <div className="flex items-center justify-between space-x-2 mb-1">
                                    <div className="font-bold text-erp-navy text-xs">AI Report sẵn sàng</div>
                                    <time className="text-[9px] font-black uppercase text-slate-400">Hôm qua</time>
                                </div>
                                <div className="text-[10px] text-slate-500 font-medium">Báo cáo phân tích NCC cho PR-2026-002 đã hoàn thành. Vui lòng xác nhận.</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
          </div>

          {/* Chi tiết PR Modal */}
          {selectedPRDetails && (
            <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
                <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in duration-200">
                    <div className="flex justify-between items-center p-6 border-b border-slate-100 bg-slate-50/50">
                        <h2 className="text-lg font-black text-erp-navy flex items-center gap-2 tracking-tight">
                            <FileText size={20} className="text-erp-blue" />
                            Chi tiết PR: {selectedPRDetails.id}
                        </h2>
                        <button onClick={() => setSelectedPRDetails(null)} className="text-slate-400 hover:bg-slate-200 hover:text-slate-700 p-2 rounded-full transition-all">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                        </button>
                    </div>
                    
                    <div className="p-0 overflow-y-auto custom-scrollbar flex flex-col md:flex-row">
                        {/* Main Info */}
                        <div className="p-6 md:w-2/3 border-r border-slate-100">
                            {/* Status Timeline */}
                            <div className="mb-8">
                                <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Tiến trình phê duyệt</div>
                                <div className="flex items-center justify-between relative">
                                    <div className="absolute left-0 top-1/2 w-full h-1 bg-slate-100 -translate-y-1/2 z-0"></div>
                                    <div className="absolute left-0 top-1/2 w-[100%] h-1 bg-emerald-400 -translate-y-1/2 z-0 transition-all"></div>
                                    
                                    <div className="relative z-10 flex flex-col items-center gap-2">
                                        <div className="w-8 h-8 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-lg ring-4 ring-white"><CheckCircle size={14} /></div>
                                        <div className="text-center">
                                            <div className="text-[10px] font-black text-erp-navy uppercase">Submitted</div>
                                            <div className="text-[9px] font-bold text-slate-400">{selectedPRDetails.createdAt}</div>
                                        </div>
                                    </div>
                                    <div className="relative z-10 flex flex-col items-center gap-2">
                                        <div className="w-8 h-8 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-lg ring-4 ring-white"><UserCheck size={14} /></div>
                                        <div className="text-center">
                                            <div className="text-[10px] font-black text-erp-navy uppercase">Trưởng phòng</div>
                                            <div className="text-[9px] font-bold text-slate-400">Đã duyệt</div>
                                        </div>
                                    </div>
                                    <div className="relative z-10 flex flex-col items-center gap-2">
                                        <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-500 flex items-center justify-center shadow-lg ring-4 ring-white border-2 border-emerald-500"><AlertCircle size={14} /></div>
                                        <div className="text-center">
                                            <div className="text-[10px] font-black text-erp-navy uppercase">Giám đốc</div>
                                            <div className="text-[9px] font-bold text-amber-500">{selectedPRDetails.status === 'PENDING_DIRECTOR' ? 'Đang chờ duyệt' : (selectedPRDetails.status === 'APPROVED' ? 'Đã duyệt' : 'N/A')}</div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Tham số chung */}
                            <div className="p-5 bg-slate-50 border border-slate-100 rounded-xl mb-6 grid grid-cols-2 lg:grid-cols-4 gap-4">
                                <div>
                                    <div className="text-[9px] font-black uppercase text-slate-400 mb-1">Ngày cần</div>
                                    <div className="text-xs font-bold text-erp-navy">25/03/2026</div>
                                </div>
                                <div>
                                    <div className="text-[9px] font-black uppercase text-slate-400 mb-1">Cost Center</div>
                                    <div className="text-xs font-bold text-erp-navy">{selectedPRDetails.costCenter}</div>
                                </div>
                                <div>
                                    <div className="text-[9px] font-black uppercase text-slate-400 mb-1">Độ ưu tiên</div>
                                    <div className={`text-xs font-bold ${selectedPRDetails.priority === 'Critical' ? 'text-red-600' : selectedPRDetails.priority === 'Urgent' ? 'text-amber-500' : 'text-emerald-500'}`}>{selectedPRDetails.priority}</div>
                                </div>
                                <div>
                                    <div className="text-[9px] font-black uppercase text-slate-400 mb-1">Tổng tiền</div>
                                    <div className="text-xs font-black font-mono text-erp-blue">{selectedPRDetails.total.toLocaleString()} ₫</div>
                                </div>
                                <div className="col-span-full">
                                    <div className="text-[9px] font-black uppercase text-slate-400 mb-1">Lý do</div>
                                    <div className="text-xs font-medium text-slate-600 italic bg-white p-3 rounded border border-slate-200">"{selectedPRDetails.reason}"</div>
                                </div>
                            </div>

                            {/* Danh sách hàng */}
                            <div>
                                <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Danh sách hàng hóa</div>
                                <table className="erp-table !shadow-none !border border-slate-200">
                                    <thead>
                                        <tr className="bg-slate-50/80">
                                            <th className="w-10 text-center">STT</th>
                                            <th>Mô tả</th>
                                            <th className="text-center w-16">SL</th>
                                            <th className="text-right w-32">ĐG Ước tính</th>
                                            <th className="text-right w-32">Thành tiền</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {selectedPRDetails.items?.map((item: any, idx: number) => {
                                            const lineTotal = item.qty * item.estimatedPrice;
                                            const isHighValue = lineTotal >= 30000000;
                                            return (
                                                <tr key={item.id || idx} className={`${isHighValue ? 'bg-orange-50/50' : 'hover:bg-slate-50/50'} transition-colors relative group`} title={isHighValue ? "Mặt hàng này yêu cầu duyệt cấp Giám đốc" : ""}>
                                                    <td className="text-center font-bold text-slate-400">{idx + 1}</td>
                                                    <td className="font-bold text-erp-navy">
                                                        {item.description}
                                                        {isHighValue && <AlertTriangle size={12} className="inline ml-2 text-orange-500 mb-0.5" />}
                                                    </td>
                                                    <td className="text-center font-black text-erp-blue">{item.qty}</td>
                                                    <td className="text-right font-mono text-slate-500">{item.estimatedPrice.toLocaleString()}</td>
                                                    <td className={`text-right font-mono font-black ${isHighValue ? 'text-orange-600' : 'text-erp-navy'}`}>
                                                        {lineTotal.toLocaleString()} ₫
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Right Sidebar - Lịch sử Action */}
                        <div className="p-6 md:w-1/3 bg-slate-50 relative">
                            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                                <History size={14} /> Lịch sử hoạt động
                            </h3>
                            <div className="space-y-6 relative before:absolute before:inset-0 before:ml-2 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 md:before:left-2 md:-left-2 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-emerald-400 before:via-emerald-400/20 before:to-transparent">
                                
                                <div className="relative flex items-center group">
                                    <div className="flex items-center justify-center w-4 h-4 rounded-full bg-emerald-500 border-2 border-white shadow shrink-0 z-10 mr-4"></div>
                                    <div className="bg-white p-3 rounded-xl border border-emerald-100 shadow-sm w-full">
                                        <div className="text-[9px] font-black uppercase text-emerald-600 mb-1">Duyệt cấp 1</div>
                                        <div className="text-xs font-bold text-erp-navy mb-1">Trưởng phòng đã phê duyệt</div>
                                        <div className="text-[9px] text-slate-400">14/03/2026 10:15 AM</div>
                                        <div className="mt-2 text-[10px] italic text-slate-500 bg-slate-50 p-2 rounded">"Đồng ý bổ sung thiết bị mảng A."</div>
                                    </div>
                                </div>

                                <div className="relative flex items-center group">
                                    <div className="flex items-center justify-center w-4 h-4 rounded-full bg-slate-300 border-2 border-white shadow shrink-0 z-10 mr-4"></div>
                                    <div className="bg-transparent p-1 w-full">
                                        <div className="text-[9px] font-black uppercase text-slate-400 mb-1">Tạo PR</div>
                                        <div className="text-xs font-bold text-erp-navy mb-1">Gửi phiếu yêu cầu hệ thống</div>
                                        <div className="text-[9px] text-slate-400">14/03/2026 09:30 AM</div>
                                    </div>
                                </div>
                            </div>

                            <div className="absolute bottom-6 left-6 right-6 pt-6 border-t border-slate-200">
                                <button className="w-full btn-secondary flex items-center justify-center gap-2 text-xs uppercase tracking-widest">
                                    <Edit size={14} /> Chỉnh sửa
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

  // --- APPROVER DASHBOARD ---
  if (isApproverGroup) {
      const myPendingPRs = prs.filter(pr => {
          if (currentUser.role === "Approver") return pr.status === "PENDING";
          if (currentUser.role === "Director") return pr.status === "PENDING_DIRECTOR";
          return false;
      });
      const pendingPRCount = myPendingPRs.length;
      const pendingPRValue = myPendingPRs.reduce((sum, pr) => sum + pr.total, 0);

      const approvedToday = 12; // Static mock
      const rejectedThisMonth = 2; // Static mock
      const lateSLA = 1; // Static mock

      return (
          <main className="pt-16 px-8 pb-12">
              <DashboardHeader breadcrumbs={["Tổng quan", "Dashboard Approver"]} />

              <div className="mt-8 flex justify-between items-end mb-8">
                  <div>
                      <h1 className="text-3xl font-black text-erp-navy tracking-tight">Khu vực Quản lý Phê duyệt</h1>
                      <p className="text-sm text-slate-500 mt-1">Xin chào, {currentUser.name} - Bạn đang có {pendingPRCount} yêu cầu đang chờ xử lý.</p>
                  </div>
                  <div className="flex gap-3">
                      <Link href="/approvals" className="btn-primary bg-erp-navy flex items-center gap-2">
                          <CheckCircle size={16} /> Bảng xét duyệt chi tiết
                      </Link>
                  </div>
              </div>

              {/* KPI Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
                  <div className="erp-card !p-6 border-l-4 border-erp-blue bg-blue-50/50">
                      <div className="flex justify-between items-start mb-4">
                          <div className="p-3 bg-white rounded-xl shadow-sm"><Clock size={20} className="text-erp-blue" /></div>
                          <span className="text-[10px] font-black uppercase text-erp-blue bg-white shadow-sm border border-blue-100 px-2 py-1 rounded">Chờ tôi duyệt</span>
                      </div>
                      <div className="text-3xl font-black text-erp-navy font-mono mb-1">{pendingPRCount}</div>
                      <div className="text-xs font-black text-erp-blue font-mono">{pendingPRValue.toLocaleString()} ₫</div>
                      <div className="mt-3 text-[10px] text-slate-500 font-bold uppercase tracking-widest pt-3 border-t border-blue-100/50">Tổng số lượng & giá trị</div>
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
                      <div className="mt-2 text-[10px] text-slate-400 font-bold">Số phiếu bị từ chối trong tháng này</div>
                  </div>

                  <div className="erp-card !p-6 border-l-4 border-red-500 bg-red-50/50">
                      <div className="flex justify-between items-start mb-4">
                          <div className="p-3 bg-white rounded-xl shadow-sm"><AlertTriangle size={20} className="text-red-500" /></div>
                          <span className="text-[10px] font-black uppercase text-red-600 bg-red-100 px-2 py-1 rounded animate-pulse">Cần ưu tiên</span>
                      </div>
                      <div className="text-3xl font-black text-red-600 font-mono">{lateSLA}</div>
                      <div className="mt-2 text-[10px] text-red-500 font-bold">Phiếu chờ duyệt bị trễ SLA ({`>`} 24h)</div>
                  </div>
              </div>

              <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                  {/* Queue cần duyệt */}
                  <div className="xl:col-span-2 space-y-8">
                      <div className="erp-card !p-0 overflow-hidden shadow-xl shadow-erp-navy/5">
                          <div className="p-6 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
                              <h3 className="text-sm font-black uppercase tracking-widest text-erp-navy flex items-center gap-2">
                                  <FileText size={16} className="text-erp-blue" /> Queue Cần Duyệt Mới Nhất
                              </h3>
                              <Link href="/approvals" className="text-[10px] font-black uppercase text-erp-blue hover:underline bg-white px-3 py-1.5 rounded-lg shadow-sm border border-slate-200">
                                  Tới màn hình duyệt →
                              </Link>
                          </div>
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
                                  {myPendingPRs.length > 0 ? myPendingPRs.map((pr, idx) => {
                                      const isLate = idx === 0; // Mock: PR đầu tiên bị tính là trễ
                                      return (
                                          <tr key={pr.id} className="hover:bg-slate-50/50 group border-b border-slate-100">
                                              <td className="font-bold text-erp-navy">{pr.id}</td>
                                              <td className="font-bold text-slate-500">{pr.department} <span className="block text-[9px] font-normal italic text-slate-400">Jonathan D.</span></td>
                                              <td className="max-w-[150px] truncate" title={pr.reason}>{pr.reason}</td>
                                              <td className="font-mono text-right font-black text-erp-blue">{pr.total.toLocaleString()} ₫</td>
                                              <td className="text-center">
                                                  {isLate ? (
                                                      <span className="text-[10px] font-black text-red-500 bg-red-50 px-2 py-1 rounded inline-flex items-center gap-1"><AlertTriangle size={10} /> 26h (Quá SLA)</span>
                                                  ) : (
                                                      <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-1 rounded">4h</span>
                                                  )}
                                              </td>
                                              <td className="text-center">
                                                  <Link href="/approvals" className="p-2 inline-flex bg-emerald-50 text-emerald-600 hover:bg-emerald-500 hover:text-white rounded-lg transition-all" title="Đi tới duyệt ngay">
                                                      <CheckCircle size={16} />
                                                  </Link>
                                              </td>
                                          </tr>
                                      )
                                  }) : (
                                      <tr>
                                          <td colSpan={6} className="py-12 text-center text-slate-400 font-bold uppercase tracking-widest text-xs">
                                              Không có phiếu nào chờ duyệt
                                          </td>
                                      </tr>
                                  )}
                              </tbody>
                          </table>
                      </div>
                      
                      {/* Thống kê (Statistics) */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="erp-card !p-6 shadow-sm border border-slate-200">
                                <h3 className="text-xs font-black uppercase tracking-widest text-slate-500 mb-6">Số PR duyệt theo tuần</h3>
                                <div className="h-40 flex items-end justify-between gap-2">
                                    {/* Mock simple bar chart */}
                                    <div className="flex flex-col items-center flex-1 group">
                                        <div className="w-full bg-blue-100 rounded-t-sm h-[40%] group-hover:bg-erp-blue transition-colors"></div>
                                        <div className="text-[9px] font-bold text-slate-400 mt-2 uppercase">Tuần 1</div>
                                    </div>
                                    <div className="flex flex-col items-center flex-1 group">
                                        <div className="w-full bg-blue-100 rounded-t-sm h-[60%] group-hover:bg-erp-blue transition-colors"></div>
                                        <div className="text-[9px] font-bold text-slate-400 mt-2 uppercase">Tuần 2</div>
                                    </div>
                                    <div className="flex flex-col items-center flex-1 group">
                                        <div className="w-full bg-blue-500 rounded-t-sm h-[80%] shadow-[0_0_10px_rgba(59,130,246,0.3)]"></div>
                                        <div className="text-[9px] font-black text-erp-navy mt-2 uppercase">Tuần 3</div>
                                    </div>
                                    <div className="flex flex-col items-center flex-1">
                                        <div className="w-full bg-slate-50 rounded-t-sm h-[10%]"></div>
                                        <div className="text-[9px] font-bold text-slate-300 mt-2 uppercase">Tuần 4</div>
                                    </div>
                                </div>
                            </div>
                            <div className="erp-card !p-6 shadow-sm border border-slate-200">
                                <h3 className="text-xs font-black uppercase tracking-widest text-slate-500 mb-6">Tổng GT phê duyệt tháng</h3>
                                <div className="flex flex-col items-center justify-center h-40">
                                    <div className="relative w-32 h-32 rounded-full border-[12px] border-erp-blue flex items-center justify-center shadow-inner">
                                        <div className="absolute inset-0 border-[12px] border-emerald-400/80 rounded-full" style={{ clipPath: 'polygon(50% 50%, 100% 0, 100% 100%, 0 100%, 0 50%)' }}></div>
                                        <div className="text-center z-10 bg-white w-20 h-20 rounded-full flex flex-col items-center justify-center shadow-sm">
                                            <div className="text-[10px] font-black text-slate-400 uppercase">Tháng 3</div>
                                            <div className="text-lg font-black font-mono text-erp-navy">1.2B</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                      </div>
                  </div>

                  <div className="space-y-6">
                      {/* Approval History Tab */}
                      <div className="erp-card shadow-sm border border-slate-200">
                          <h3 className="text-sm font-black uppercase tracking-widest text-erp-navy mb-6 flex items-center gap-2">
                              <History size={16} className="text-erp-blue" /> Lịch sử hoạt động
                          </h3>
                          <div className="flex gap-2 mb-6 p-1 bg-slate-100 rounded-lg">
                              <button className="flex-1 text-[10px] font-black uppercase tracking-widest text-white bg-erp-navy py-2 rounded shadow-sm">Đã duyệt (30)</button>
                              <button className="flex-1 text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-slate-800 py-2 rounded">Từ chối (2)</button>
                          </div>
                          
                          <div className="space-y-4">
                              <div className="flex flex-col gap-1 p-3 border border-slate-100 rounded-xl hover:bg-slate-50 transition-colors">
                                  <div className="flex justify-between items-start">
                                      <div className="text-xs font-black text-erp-navy">PR-2026-004</div>
                                      <span className="text-[9px] font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded uppercase">Đã duyệt</span>
                                  </div>
                                  <div className="text-[10px] font-bold text-slate-500 truncate">Vật tư dự phòng Q2</div>
                                  <div className="flex justify-between items-center mt-2 pt-2 border-t border-slate-50">
                                      <div className="text-[9px] font-mono text-slate-400 font-bold">450,000,000 ₫</div>
                                      <div className="text-[9px] font-bold text-slate-400">14/03 10:30 AM</div>
                                  </div>
                              </div>

                              <div className="flex flex-col gap-1 p-3 border border-slate-100 rounded-xl hover:bg-slate-50 transition-colors">
                                  <div className="flex justify-between items-start">
                                      <div className="text-xs font-black text-erp-navy">PR-2026-001</div>
                                      <span className="text-[9px] font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded uppercase">Đã duyệt</span>
                                  </div>
                                  <div className="text-[10px] font-bold text-slate-500 truncate">Sắm thay thế dụng cụ y tế</div>
                                  <div className="flex justify-between items-center mt-2 pt-2 border-t border-slate-50">
                                      <div className="text-[9px] font-mono text-slate-400 font-bold">12,000,000 ₫</div>
                                      <div className="text-[9px] font-bold text-slate-400">13/03 04:15 PM</div>
                                  </div>
                              </div>
                              
                              <div className="flex flex-col gap-1 p-3 border border-slate-100 rounded-xl hover:bg-slate-50 transition-colors opacity-70">
                                  <div className="flex justify-between items-start">
                                      <div className="text-xs font-black text-erp-navy">PO-2026-020</div>
                                      <span className="text-[9px] font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded uppercase">Đã duyệt</span>
                                  </div>
                                  <div className="text-[10px] font-bold text-slate-500 truncate">Hợp đồng Cty Nhật An</div>
                                  <div className="flex justify-between items-center mt-2 pt-2 border-t border-slate-50">
                                      <div className="text-[9px] font-mono text-slate-400 font-bold">88,000,000 ₫</div>
                                      <div className="text-[9px] font-bold text-slate-400">12/03 09:00 AM</div>
                                  </div>
                              </div>
                          </div>
                      </div>
                  </div>
              </div>
          </main>
      )
  }

  // --- STANDARD DASHBOARD ---
  return (
    <main className="pt-16 px-8 pb-12">
      <DashboardHeader breadcrumbs={["Hệ thống", "Bảng điều khiển"]} />

      <div className="mt-8 flex justify-between items-end mb-8">
        <div>
          <h1 className="text-3xl font-black text-erp-navy tracking-tight">Tổng quan Hệ thống</h1>
          <p className="text-sm text-slate-500 mt-1">Chào mừng quay trở lại, Jonathan Doe.</p>
        </div>
        <div className="flex gap-3">
          <div className="bg-white px-4 py-2 rounded-xl border border-slate-100 shadow-sm flex items-center gap-2">
            <Activity size={16} className="text-emerald-500" />
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Hệ thống: Ổn định</span>
          </div>
        </div>
      </div>

      {/* --- Budget Widgets --- */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
        <div className="erp-card !p-6">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-slate-50 rounded-xl"><Building2 size={20} className="text-slate-400" /></div>
            <span className="text-[10px] font-black uppercase text-slate-400 bg-slate-50 px-2 py-1 rounded">Allocated</span>
          </div>
          <div className="text-2xl font-black text-erp-navy font-mono">
            {budget.allocated.toLocaleString()} ₫
          </div>
          <div className="mt-2 text-[10px] text-slate-400 font-bold flex items-center gap-1">
            <ArrowUpRight size={12} className="text-emerald-500" /> +0% so với tháng trước
          </div>
        </div>

        <div className="erp-card !p-6 border-l-4 border-erp-blue">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-blue-50 rounded-xl"><Lock size={20} className="text-erp-blue" /></div>
            <span className="text-[10px] font-black uppercase text-erp-blue bg-blue-50 px-2 py-1 rounded">Committed</span>
          </div>
          <div className="text-2xl font-black text-erp-blue font-mono">
            {budget.committed.toLocaleString()} ₫
          </div>
          <div className="mt-2 text-[10px] text-slate-400 font-bold flex items-center gap-1">
            Đang khóa cho các PO
          </div>
        </div>

        <div className="erp-card !p-6 border-l-4 border-erp-navy">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-slate-100 rounded-xl"><CreditCard size={20} className="text-erp-navy" /></div>
            <span className="text-[10px] font-black uppercase text-erp-navy bg-slate-100 px-2 py-1 rounded">Spent</span>
          </div>
          <div className="text-2xl font-black text-erp-navy font-mono">
            {budget.spent.toLocaleString()} ₫
          </div>
          <div className="mt-2 text-[10px] text-slate-400 font-bold flex items-center gap-1">
            <ArrowDownRight size={12} className="text-erp-navy" /> Đã giải ngân thực tế
          </div>
        </div>

        <div className="erp-card !p-6 bg-erp-navy !border-none shadow-2xl shadow-erp-navy/20 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-150 transition-transform duration-700">
            <Zap size={120} className="text-white fill-white" />
          </div>
          <div className="relative z-10 flex flex-col h-full justify-between">
            <div>
              <div className="text-[10px] font-black uppercase text-white/40 tracking-widest mb-1">Available to Spend</div>
              <div className="text-3xl font-black text-emerald-400 font-mono">
                {availableBudget.toLocaleString()} ₫
              </div>
            </div>
            <div className="mt-6">
              <div className="budget-meter !h-2.5">
                <div className="meter-spent" style={{ width: `${(budget.spent / budget.allocated) * 100}%` }}></div>
                <div className="meter-committed" style={{ width: `${(budget.committed / budget.allocated) * 100}%` }}></div>
                <div className="meter-available" style={{ width: `${(availableBudget / budget.allocated) * 100}%` }}></div>
              </div>
              <div className="flex justify-between mt-2 text-[9px] font-black uppercase text-white/30 tracking-tighter">
                <span>Usage: {(((budget.spent + budget.committed) / budget.allocated) * 100).toFixed(1)}%</span>
                <span>Safety Margin: 20%</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* --- Recent PRs --- */}
        <div className="lg:col-span-2 space-y-6">
          <div className="erp-card !p-0 overflow-hidden">
            <div className="p-6 border-b border-slate-50 flex justify-between items-center">
              <h3 className="text-sm font-black uppercase tracking-widest text-erp-navy flex items-center gap-2">
                <FileText size={16} /> Phiếu yêu cầu (PR) gần đây
              </h3>
              <button className="text-[10px] font-black uppercase text-erp-blue hover:underline">Xem tất cả</button>
            </div>
            <table className="erp-table">
              <thead>
                <tr>
                  <th>Mã PR</th>
                  <th>Phòng ban</th>
                  <th className="text-center">Số lượng</th>
                  <th className="text-right">Giá trị</th>
                  <th className="text-center">Trạng thái</th>
                  <th className="text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {prs.slice(0, 5).map(pr => (
                  <tr key={pr.id}>
                    <td className="font-bold text-erp-navy">{pr.id}</td>
                    <td>{pr.department}</td>
                    <td className="text-center text-erp-blue font-black bg-blue-50/30 rounded-lg">
                      {pr.items?.length || 0}
                    </td>
                    <td className="font-mono text-right font-black">{pr.total.toLocaleString()} ₫</td>
                    <td className="text-center">
                      <span className={`status-pill ${pr.status === 'APPROVED' ? 'status-approved' :
                        (pr.status === 'PENDING' || pr.status === 'PENDING_DIRECTOR') ? 'status-pending' :
                          pr.status === 'REJECTED' ? 'status-rejected' : 'status-draft'
                        }`}>
                        {pr.status === 'PENDING_DIRECTOR' ? 'PENDING' : pr.status}
                      </span>
                    </td>
                    <td className="text-right">
                        <div className="flex justify-end gap-1">
                            <button onClick={() => setSelectedPRDetails(pr)} className="p-1.5 text-slate-400 hover:text-erp-blue hover:bg-blue-50 rounded-lg transition-all" title="Xem chi tiết">
                                <Eye size={16} />
                            </button>
                            <button className="p-1.5 text-slate-400 hover:text-emerald-500 hover:bg-emerald-50 rounded-lg transition-all" title="Thêm mặt hàng">
                                <Plus size={16} />
                            </button>
                            <button className="p-1.5 text-slate-400 hover:text-amber-500 hover:bg-amber-50 rounded-lg transition-all" title="Sửa">
                                <Edit size={16} />
                            </button>
                            <button className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all" title="Xóa">
                                <Trash2 size={16} />
                            </button>
                        </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* --- Activity Feed --- */}
        <div className="space-y-6">
          <div className="erp-card">
            <h3 className="text-sm font-black uppercase tracking-widest text-erp-navy mb-6 flex items-center gap-2">
              <Activity size={16} /> Hoạt động hệ thống
            </h3>
            <div className="space-y-6">
              <div className="flex gap-4">
                <div className="h-8 w-8 rounded-full bg-blue-50 flex items-center justify-center shrink-0">
                  <ShoppingCart size={14} className="text-erp-blue" />
                </div>
                <div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    <span className="font-black text-erp-navy">Jonathan Doe</span> đã tạo đơn hàng <span className="font-bold">PO-2026-042</span>
                  </p>
                  <span className="text-[10px] text-slate-400 font-bold uppercase">2 phút trước</span>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="h-8 w-8 rounded-full bg-emerald-50 flex items-center justify-center shrink-0">
                  <UserCheck size={14} className="text-emerald-500" />
                </div>
                <div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    <span className="font-black text-erp-navy">Manager A</span> đã phê duyệt phiếu <span className="font-bold">PR-2026-001</span>
                  </p>
                  <span className="text-[10px] text-slate-400 font-bold uppercase">15 phút trước</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* --- PR Details Modal --- */}
      {selectedPRDetails && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in duration-200">
                <div className="flex justify-between items-center p-6 border-b border-slate-100 bg-slate-50/50">
                    <h2 className="text-lg font-black text-erp-navy flex items-center gap-2 tracking-tight">
                        <FileText size={20} className="text-erp-blue" />
                        Chi tiết đơn hàng {selectedPRDetails.id}
                    </h2>
                    <button onClick={() => setSelectedPRDetails(null)} className="text-slate-400 hover:bg-slate-200 hover:text-slate-700 p-2 rounded-full transition-all">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                    </button>
                </div>
                
                <div className="p-6 overflow-y-auto custom-scrollbar">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                        <div className="flex items-center gap-4">
                            <span className="font-bold text-slate-500 text-sm whitespace-nowrap w-24">ID Phiếu đặt:</span>
                            <div className="erp-input flex-1 bg-slate-50 border-slate-200 font-bold text-erp-navy flex items-center h-10">
                                {selectedPRDetails.id}
                            </div>
                        </div>
                        <div className="flex items-center gap-4">
                            <span className="font-bold text-slate-500 text-sm whitespace-nowrap w-16 text-right md:text-left">Ngày:</span>
                            <div className="erp-input flex-1 bg-slate-50 border-slate-200 font-bold text-erp-navy flex items-center h-10">
                                {selectedPRDetails.createdAt}
                            </div>
                        </div>
                    </div>
                    
                    <div className="bg-white p-6 rounded-2xl border-2 border-slate-100 mb-8 shadow-sm">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                            <div className="flex items-center gap-4 md:col-span-2">
                                <span className="font-bold text-slate-500 text-sm whitespace-nowrap w-24 text-right">Tên vật tư:</span>
                                <input className="erp-input flex-1 border-slate-300 focus:border-erp-blue transition-colors" placeholder="Nhập tên vật tư..." />
                            </div>
                            <div className="flex items-center gap-4">
                                <span className="font-bold text-slate-500 text-sm whitespace-nowrap w-10 text-right">SL:</span>
                                <input type="number" className="erp-input flex-1 text-center font-black text-erp-blue border-slate-300 focus:border-erp-blue" placeholder="0" />
                            </div>
                            <div className="flex items-center gap-4 md:col-span-2">
                                <span className="font-bold text-slate-500 text-sm whitespace-nowrap w-24 text-right">ĐG:</span>
                                <div className="relative flex-1 group">
                                    <input type="number" className="erp-input w-full font-mono font-bold border-slate-300 focus:border-erp-blue pr-20" placeholder="0" />
                                    <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1 text-[10px] font-black text-erp-blue bg-blue-50 px-2 py-1 rounded border border-blue-100 opacity-60 group-hover:opacity-100 transition-all cursor-help" title="Giá đề xuất tự động từ AI">
                                        <Zap size={10} className="fill-erp-blue" />
                                        <span>AI</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="flex justify-between items-center pt-6 border-t border-slate-100 mt-2">
                            <div className="flex gap-3">
                                <button className="px-5 py-2.5 rounded-xl text-xs uppercase tracking-wider font-black bg-white border-2 border-erp-blue text-erp-blue hover:bg-erp-blue hover:text-white transition-all flex items-center gap-1 shadow-sm">
                                    <Plus size={16} /> Thêm
                                </button>
                                <button className="px-5 py-2.5 rounded-xl text-xs uppercase tracking-wider font-black bg-white border-2 border-amber-500 text-amber-600 hover:bg-amber-50 transition-all flex items-center gap-1 shadow-sm">
                                    <Edit size={16} /> Sửa
                                </button>
                                <button className="px-5 py-2.5 rounded-xl text-xs uppercase tracking-wider font-black bg-white border-2 border-red-500 text-red-600 hover:bg-red-50 transition-all flex items-center gap-1 shadow-sm">
                                    <Trash2 size={16} /> Xóa
                                </button>
                            </div>
                            <button className="btn-primary shadow-xl shadow-erp-navy/20 uppercase tracking-widest text-xs">
                                Cập nhật
                            </button>
                        </div>
                    </div>

                    <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                        <table className="erp-table !shadow-none !border-none !rounded-none m-0">
                            <thead>
                                <tr className="bg-slate-50/80">
                                    <th className="w-16 text-center">STT</th>
                                    <th>Tên vật tư</th>
                                    <th className="text-center w-24">SL</th>
                                    <th className="text-right w-40">ĐG</th>
                                    <th className="text-right w-48">TT</th>
                                </tr>
                            </thead>
                            <tbody>
                                {selectedPRDetails.items?.map((item: any, idx: number) => (
                                    <tr key={item.id || idx} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="text-center font-bold text-slate-400">{idx + 1}</td>
                                        <td className="font-bold text-erp-navy">{item.description}</td>
                                        <td className="text-center bg-slate-50/50 font-black text-erp-blue">{item.qty}</td>
                                        <td className="text-right font-mono text-slate-500">{item.estimatedPrice.toLocaleString()}</td>
                                        <td className="text-right font-mono font-black text-erp-navy">{(item.qty * item.estimatedPrice).toLocaleString()} ₫</td>
                                    </tr>
                                ))}
                                {(!selectedPRDetails.items || selectedPRDetails.items.length === 0) && (
                                    <tr>
                                        <td colSpan={5} className="py-8 text-center text-slate-400 font-bold uppercase tracking-widest text-xs">
                                            Chưa có vật tư nào
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
      )}
    </main>
  );
}
