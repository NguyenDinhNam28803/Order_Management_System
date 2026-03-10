"use client";

import React from "react";
import DashboardHeader from "./components/DashboardHeader";
import {
  Building2, Lock, CreditCard, ArrowUpRight,
  ArrowDownRight, Activity, Zap, FileText, ShoppingCart, UserCheck
} from "lucide-react";
import { useProcurement } from "./context/ProcurementContext";

export default function Dashboard() {
  const { budget, prs, pos } = useProcurement();
  const availableBudget = budget.allocated - budget.committed - budget.spent;

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
                  <th>Giá trị</th>
                  <th>Trạng thái</th>
                </tr>
              </thead>
              <tbody>
                {prs.slice(0, 5).map(pr => (
                  <tr key={pr.id}>
                    <td className="font-bold text-erp-navy">{pr.id}</td>
                    <td>{pr.department}</td>
                    <td className="font-mono">{pr.total.toLocaleString()} ₫</td>
                    <td>
                      <span className={`status-pill ${pr.status === 'APPROVED' ? 'status-approved' :
                        pr.status === 'PENDING' ? 'status-pending' :
                          pr.status === 'REJECTED' ? 'status-rejected' : 'status-draft'
                        }`}>
                        {pr.status}
                      </span>
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
    </main>
  );
}
