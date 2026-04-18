"use client";

import React from "react";
import { 
  TrendingUp, DollarSign, Users, Package, CheckCircle, 
  Clock, AlertTriangle, BarChart3, PieChart, Activity,
  Target, Zap, TrendingDown, Calendar, ArrowUpRight
} from "lucide-react";
import { useProcurement } from "../context/ProcurementContext";
import { StatsCard } from "./charts";

// CEO/Director Dashboard
export function CEODashboard() {
  const { pos, prs } = useProcurement();

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Strategic Overview */}
      <div className="bg-[#161922] rounded-[32px] border border-[rgba(148,163,184,0.1)] shadow-2xl p-6">
        <h3 className="text-xs font-black uppercase tracking-widest text-[#64748B] mb-4 flex items-center gap-2">
          <Activity size={14} className="text-[#3B82F6]" /> Tổng quan chiến lược
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatsCard 
          title="Tổng Chi tiêu YTD" 
          value="12.5B ₫" 
          trend={{ value: 12.5, isPositive: true }}
          icon={DollarSign}
          color="green"
        />
        <StatsCard 
          title="Budget Còn lại" 
          value="3.2B ₫" 
          trend={{ value: 5.2, isPositive: false }}
          icon={PieChart}
          color="blue"
        />
        <StatsCard 
          title="Chờ Phê duyệt" 
          value={24} 
          trend={{ value: 8, isPositive: true }}
          icon={Clock}
          color="amber"
        />
        <StatsCard
          title="Nhà Cung cấp Active"
          value={156}
          trend={{ value: 3, isPositive: true }}
          icon={Users}
          color="purple"
        />
        </div>
      </div>

      {/* Spend Heatmap */}
      <div className="glass-card p-6">
        <h3 className="section-title">
          <BarChart3 size={16} className="text-[#3B82F6]" />
          Spend Heatmap theo Phòng ban
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { dept: "IT", spent: 4500000000, budget: 5000000000, color: "heatmap-high" },
            { dept: "Marketing", spent: 2800000000, budget: 3000000000, color: "heatmap-medium" },
            { dept: "Sales", spent: 1200000000, budget: 2000000000, color: "heatmap-low" },
            { dept: "HR", spent: 800000000, budget: 1000000000, color: "heatmap-low" },
            { dept: "Finance", spent: 600000000, budget: 800000000, color: "heatmap-low" },
            { dept: "Operations", spent: 3200000000, budget: 3500000000, color: "heatmap-medium" },
            { dept: "R&D", spent: 2100000000, budget: 2500000000, color: "heatmap-low" },
            { dept: "Legal", spent: 400000000, budget: 500000000, color: "heatmap-low" },
          ].map((item) => (
            <div key={item.dept} className={`p-4 rounded-xl ${item.color} border border-current border-opacity-20`}>
              <h4 className="font-bold text-sm mb-2">{item.dept}</h4>
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span>Đã chi</span>
                  <span className="font-semibold">{(item.spent / 1e9).toFixed(1)}B</span>
                </div>
                <div className="w-full h-1.5 bg-current bg-opacity-20 rounded-full">
                  <div 
                    className="h-full bg-current rounded-full"
                    style={{ width: `${(item.spent / item.budget) * 100}%` }}
                  />
                </div>
                <div className="flex justify-between text-xs text-opacity-70">
                  <span>Ngân sách</span>
                  <span>{(item.budget / 1e9).toFixed(1)}B</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Approval KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="glass-card p-6">
          <h3 className="section-title">
            <Target size={16} className="text-[#8B5CF6]" />
            Approval Performance
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-[#94A3B8]">Thời gian phê duyệt TB</span>
              <span className="font-bold text-emerald-400">1.8 ngày</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-[#94A3B8]">Tỷ lệ phê duyệt</span>
              <span className="font-bold text-blue-400">94.2%</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-[#94A3B8]">Tỷ lệ từ chối</span>
              <span className="font-bold text-rose-400">5.8%</span>
            </div>
          </div>
        </div>

        <div className="glass-card p-6">
          <h3 className="section-title">
            <Activity size={16} className="text-[#F43F5E]" />
            Cảnh báo Chi tiêu
          </h3>
          <div className="space-y-3">
            <div className="flex items-center gap-3 p-3 bg-rose-500/10 border border-rose-500/20 rounded-lg">
              <AlertTriangle size={16} className="text-rose-400" />
              <div className="flex-1">
                <p className="text-sm font-semibold text-rose-400">IT Department vượt 90% ngân sách</p>
                <p className="text-xs text-[#64748B]">Cần phê duyệt bổ sung ngân sách Q2</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg">
              <Clock size={16} className="text-amber-400" />
              <div className="flex-1">
                <p className="text-sm font-semibold text-amber-400">12 PO chờ phê duyệt &gt; 3 ngày</p>
                <p className="text-xs text-[#64748B]">Có thể ảnh hưởng tiến độ dự án</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Finance Dashboard
export function FinanceDashboard() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="bg-[#161922] rounded-[32px] border border-[rgba(148,163,184,0.1)] shadow-2xl p-6">
        <h3 className="text-xs font-black uppercase tracking-widest text-[#64748B] mb-4 flex items-center gap-2">
          <Activity size={14} className="text-[#3B82F6]" /> Kiểm soát tài chính
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatsCard 
          title="PO Value Chờ Duyệt" 
          value="5.8B ₫" 
          icon={DollarSign}
          color="amber"
        />
        <StatsCard 
          title="Invoice Chờ Matching" 
          value={18} 
          icon={CheckCircle}
          color="blue"
        />
        <StatsCard 
          title="Overdue Alerts" 
          value={7} 
          icon={AlertTriangle}
          color="red"
        />
        <StatsCard
          title="Thanh toán Đã lên lịch"
          value={12}
          icon={Calendar}
          color="green"
        />
        </div>
      </div>

      <div className="glass-card p-6">
        <h3 className="section-title">
          <TrendingUp size={16} className="text-[#10B981]" />
          Dòng tiền & Thanh toán
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-4 bg-[#161922] rounded-xl border border-[rgba(148,163,184,0.1)]">
            <h4 className="text-sm font-semibold text-[#94A3B8] mb-2">Tuần này</h4>
            <p className="text-2xl font-bold text-emerald-400">2.4B ₫</p>
            <p className="text-xs text-[#64748B] mt-1">8 thanh toán</p>
          </div>
          <div className="p-4 bg-[#161922] rounded-xl border border-[rgba(148,163,184,0.1)]">
            <h4 className="text-sm font-semibold text-[#94A3B8] mb-2">Tuần tới</h4>
            <p className="text-2xl font-bold text-blue-400">3.1B ₫</p>
            <p className="text-xs text-[#64748B] mt-1">12 thanh toán</p>
          </div>
          <div className="p-4 bg-[#161922] rounded-xl border border-[rgba(148,163,184,0.1)]">
            <h4 className="text-sm font-semibold text-[#94A3B8] mb-2">Quá hạn</h4>
            <p className="text-2xl font-bold text-rose-400">890M ₫</p>
            <p className="text-xs text-[#64748B] mt-1">Cần xử lý ngay</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// Procurement Dashboard
export function ProcurementDashboard() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="bg-[#161922] rounded-[32px] border border-[rgba(148,163,184,0.1)] shadow-2xl p-6">
        <h3 className="text-xs font-black uppercase tracking-widest text-[#64748B] mb-4 flex items-center gap-2">
          <Activity size={14} className="text-[#3B82F6]" /> Pipeline thu mua
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatsCard
          title="PR Chờ Xử lý" 
          value={32} 
          trend={{ value: 12, isPositive: false }}
          icon={Package}
          color="amber"
        />
        <StatsCard 
          title="PO Đã Tạo" 
          value={156} 
          trend={{ value: 24, isPositive: true }}
          icon={CheckCircle}
          color="green"
        />
        <StatsCard 
          title="Vendor Active" 
          value={48} 
          icon={Users}
          color="purple"
        />
        <StatsCard
          title="GRN Chờ Nhận"
          value={8}
          icon={Zap}
          color="blue"
        />
        </div>
      </div>

      {/* PR → PO Pipeline */}
      <div className="glass-card p-6">
        <h3 className="section-title">
          <Activity size={16} className="text-[#3B82F6]" />
          PR → PO Pipeline
        </h3>
        <div className="flex items-center justify-between">
          {[
            { label: "Draft PR", count: 12, color: "#64748B" },
            { label: "Chờ Duyệt", count: 8, color: "#F59E0B" },
            { label: "Đã Duyệt", count: 15, color: "#3B82F6" },
            { label: "Đã Tạo PO", count: 24, color: "#10B981" },
            { label: "Đã Giao", count: 156, color: "#8B5CF6" },
          ].map((stage, idx, arr) => (
            <React.Fragment key={stage.label}>
              <div className="flex flex-col items-center">
                <div 
                  className="w-12 h-12 rounded-full flex items-center justify-center text-sm font-bold"
                  style={{ backgroundColor: `${stage.color}20`, color: stage.color, border: `2px solid ${stage.color}` }}
                >
                  {stage.count}
                </div>
                <span className="text-xs text-[#64748B] mt-2">{stage.label}</span>
              </div>
              {idx < arr.length - 1 && (
                <div className="flex-1 h-0.5 bg-[rgba(148,163,184,0.2)] mx-4" />
              )}
            </React.Fragment>
          ))}
        </div>
      </div>
    </div>
  );
}

// Department Staff Dashboard
export function StaffDashboard() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="bg-[#161922] rounded-[32px] border border-[rgba(148,163,184,0.1)] shadow-2xl p-6">
        <h3 className="text-xs font-black uppercase tracking-widest text-[#64748B] mb-4 flex items-center gap-2">
          <Activity size={14} className="text-[#3B82F6]" /> Tổng quan công việc
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <StatsCard
          title="PR Của Tôi" 
          value={8} 
          icon={Package}
          color="blue"
        />
        <StatsCard 
          title="Chờ Phê duyệt" 
          value={3} 
          icon={Clock}
          color="amber"
        />
        <StatsCard
          title="Đã Hoàn thành"
          value={24}
          icon={CheckCircle}
          color="green"
        />
        </div>
      </div>

      <div className="glass-card p-6">
        <h3 className="section-title">
          <Zap size={16} className="text-[#8B5CF6]" />
          Tạo Yêu cầu Nhanh
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Văn phòng phẩm", icon: "📎", color: "blue" },
            { label: "Thiết bị IT", icon: "💻", color: "violet" },
            { label: "Dịch vụ", icon: "🔧", color: "amber" },
            { label: "Marketing", icon: "📢", color: "emerald" },
          ].map((item) => (
            <button
              key={item.label}
              className="p-4 bg-[#161922] hover:bg-[rgba(59,130,246,0.1)] border border-[rgba(148,163,184,0.1)] hover:border-[rgba(59,130,246,0.3)] rounded-xl transition-all text-left group"
            >
              <span className="text-2xl mb-2 block">{item.icon}</span>
              <span className="text-sm font-semibold text-[#F8FAFC] group-hover:text-[#3B82F6] transition-colors">
                {item.label}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// Warehouse Dashboard
export function WarehouseDashboard() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="bg-[#161922] rounded-[32px] border border-[rgba(148,163,184,0.1)] shadow-2xl p-6">
        <h3 className="text-xs font-black uppercase tracking-widest text-[#64748B] mb-4 flex items-center gap-2">
          <Activity size={14} className="text-[#3B82F6]" /> Hoạt động kho
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatsCard
          title="Đơn Chờ Nhận" 
          value={12} 
          icon={Package}
          color="amber"
        />
        <StatsCard 
          title="Đang Kiểm định" 
          value={5} 
          icon={CheckCircle}
          color="blue"
        />
        <StatsCard 
          title="Hoàn thành Hôm nay" 
          value={28} 
          icon={Zap}
          color="green"
        />
        <StatsCard
          title="Cảnh báo Chất lượng"
          value={2}
          icon={AlertTriangle}
          color="red"
        />
        </div>
      </div>

      <div className="glass-card p-6">
        <h3 className="section-title">
          <Activity size={16} className="text-[#10B981]" />
          Lịch Giao hàng Hôm nay
        </h3>
        <div className="space-y-3">
          {[
            { time: "09:00", po: "***", supplier: "TechCorp VN", items: "Máy chủ Dell R750", status: "incoming" },
            { time: "11:30", po: "***", supplier: "OfficeMart", items: "Văn phòng phẩm Q1", status: "incoming" },
            { time: "14:00", po: "***", supplier: "Cloud Solutions", items: "Thiết bị mạng", status: "delayed" },
            { time: "16:00", po: "***", supplier: "BuildRight Co.", items: "Vật liệu xây dựng", status: "incoming" },
          ].map((delivery, idx) => (
            <div key={idx} className="flex items-center gap-4 p-3 bg-[#161922] rounded-lg border border-[rgba(148,163,184,0.05)]">
              <div className="text-sm font-mono text-[#64748B] w-16">{delivery.time}</div>
              <div className={`w-2 h-2 rounded-full ${delivery.status === "incoming" ? "bg-emerald-400" : "bg-amber-400"}`} />
              <div className="flex-1">
                <p className="text-sm font-semibold text-[#F8FAFC]">***</p>
                <p className="text-xs text-[#64748B]">{delivery.supplier} • {delivery.items}</p>
              </div>
              <span className={`text-xs font-semibold px-2 py-1 rounded ${
                delivery.status === "incoming" 
                  ? "bg-emerald-500/20 text-emerald-400" 
                  : "bg-amber-500/20 text-amber-400"
              }`}>
                {delivery.status === "incoming" ? "Sắp đến" : "Delay"}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Main Role-Based Dashboard
export default function RoleDashboard() {
  const { currentUser } = useProcurement();
  const role = currentUser?.role || "REQUESTER";

  const renderDashboard = () => {
    switch (role) {
      case "CEO":
      case "DIRECTOR":
        return <CEODashboard />;
      case "FINANCE":
        return <FinanceDashboard />;
      case "PROCUREMENT":
        return <ProcurementDashboard />;
      case "WAREHOUSE":
        return <WarehouseDashboard />;
      case "REQUESTER":
      case "DEPT_APPROVER":
      default:
        return <StaffDashboard />;
    }
  };

  return (
    <div className="w-full">
      <div className="mb-6">
        <h1 className="text-2xl font-bold gradient-text-blue mb-1">
          Dashboard {role === "CEO" || role === "DIRECTOR" ? "Strategic Overview" : 
                    role === "FINANCE" ? "Finance Control" :
                    role === "PROCUREMENT" ? "Procurement Pipeline" :
                    role === "WAREHOUSE" ? "Warehouse Operations" : "My Workspace"}
        </h1>
        <p className="text-sm text-[#64748B]">
          Xin chào {currentUser?.name || "User"}, đây là tổng quan dành cho {role}
        </p>
      </div>
      {renderDashboard()}
    </div>
  );
}
