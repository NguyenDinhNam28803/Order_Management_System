"use client";

import React from "react";
import { 
  TrendingUp, DollarSign, Users, Package, CheckCircle, 
  Clock, AlertTriangle, BarChart3, PieChart, Activity,
  Target, Zap, TrendingDown, Calendar, ArrowUpRight
} from "lucide-react";
import { useProcurement } from "../context/ProcurementContext";

// Role-based Dashboard Widgets

interface StatCardProps {
  title: string;
  value: string | number;
  change?: number;
  icon: React.ReactNode;
  trend?: "up" | "down" | "neutral";
  color: "blue" | "emerald" | "violet" | "amber" | "rose";
}

const StatCard = ({ title, value, change, icon, trend = "neutral", color }: StatCardProps) => {
  const colorClasses = {
    blue: "from-blue-500/20 to-blue-600/10 text-blue-400",
    emerald: "from-emerald-500/20 to-emerald-600/10 text-emerald-400",
    violet: "from-violet-500/20 to-violet-600/10 text-violet-400",
    amber: "from-amber-500/20 to-amber-600/10 text-amber-400",
    rose: "from-rose-500/20 to-rose-600/10 text-rose-400"
  };

  return (
    <div className="glass-card p-5 hover:scale-[1.02] transition-transform duration-300">
      <div className="flex items-start justify-between mb-4">
        <div className={`p-3 rounded-xl bg-gradient-to-br ${colorClasses[color]}`}>
          {icon}
        </div>
        {change !== undefined && (
          <div className={`flex items-center gap-1 text-xs font-semibold ${
            trend === "up" ? "text-emerald-400" : trend === "down" ? "text-rose-400" : "text-[#64748B]"
          }`}>
            {trend === "up" ? <ArrowUpRight size={14} /> : trend === "down" ? <TrendingDown size={14} /> : null}
            {change > 0 ? "+" : ""}{change}%
          </div>
        )}
      </div>
      <h3 className="text-[#64748B] text-xs font-semibold uppercase tracking-wider mb-1">{title}</h3>
      <p className="text-2xl font-bold text-[#F8FAFC]">{value}</p>
    </div>
  );
};

// CEO/Director Dashboard
export function CEODashboard() {
  const { pos, prs } = useProcurement();
  
  return (
    <div className="space-y-6 animate-fade-in">
      {/* Strategic Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard 
          title="Tổng Chi tiêu YTD" 
          value="12.5B ₫" 
          change={12.5} 
          trend="up"
          icon={<DollarSign size={20} />}
          color="emerald"
        />
        <StatCard 
          title="Budget Còn lại" 
          value="3.2B ₫" 
          change={-5.2}
          trend="down"
          icon={<PieChart size={20} />}
          color="blue"
        />
        <StatCard 
          title="Chờ Phê duyệt" 
          value="24" 
          change={8}
          trend="up"
          icon={<Clock size={20} />}
          color="amber"
        />
        <StatCard 
          title="Nhà Cung cấp Active" 
          value="156" 
          change={3}
          trend="up"
          icon={<Users size={20} />}
          color="violet"
        />
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard 
          title="PO Value Chờ Duyệt" 
          value="5.8B ₫" 
          icon={<DollarSign size={20} />}
          color="amber"
        />
        <StatCard 
          title="Invoice Chờ Matching" 
          value="18" 
          icon={<CheckCircle size={20} />}
          color="blue"
        />
        <StatCard 
          title="Overdue Alerts" 
          value="7" 
          icon={<AlertTriangle size={20} />}
          color="rose"
        />
        <StatCard 
          title="Thanh toán Đã lên lịch" 
          value="12" 
          icon={<Calendar size={20} />}
          color="emerald"
        />
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard 
          title="PR Chờ Xử lý" 
          value="32" 
          change={-12}
          trend="down"
          icon={<Package size={20} />}
          color="amber"
        />
        <StatCard 
          title="PO Đã Tạo" 
          value="156" 
          change={24}
          trend="up"
          icon={<CheckCircle size={20} />}
          color="emerald"
        />
        <StatCard 
          title="Vendor Active" 
          value="48" 
          icon={<Users size={20} />}
          color="violet"
        />
        <StatCard 
          title="GRN Chờ Nhận" 
          value="8" 
          icon={<Zap size={20} />}
          color="blue"
        />
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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard 
          title="PR Của Tôi" 
          value="8" 
          icon={<Package size={20} />}
          color="blue"
        />
        <StatCard 
          title="Chờ Phê duyệt" 
          value="3" 
          icon={<Clock size={20} />}
          color="amber"
        />
        <StatCard 
          title="Đã Hoàn thành" 
          value="24" 
          icon={<CheckCircle size={20} />}
          color="emerald"
        />
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard 
          title="Đơn Chờ Nhận" 
          value="12" 
          icon={<Package size={20} />}
          color="amber"
        />
        <StatCard 
          title="Đang Kiểm định" 
          value="5" 
          icon={<CheckCircle size={20} />}
          color="blue"
        />
        <StatCard 
          title="Hoàn thành Hôm nay" 
          value="28" 
          icon={<Zap size={20} />}
          color="emerald"
        />
        <StatCard 
          title="Cảnh báo Chất lượng" 
          value="2" 
          icon={<AlertTriangle size={20} />}
          color="rose"
        />
      </div>

      <div className="glass-card p-6">
        <h3 className="section-title">
          <Activity size={16} className="text-[#10B981]" />
          Lịch Giao hàng Hôm nay
        </h3>
        <div className="space-y-3">
          {[
            { time: "09:00", po: "PO-2024-156", supplier: "TechCorp VN", items: "Máy chủ Dell R750", status: "incoming" },
            { time: "11:30", po: "PO-2024-157", supplier: "OfficeMart", items: "Văn phòng phẩm Q1", status: "incoming" },
            { time: "14:00", po: "PO-2024-155", supplier: "Cloud Solutions", items: "Thiết bị mạng", status: "delayed" },
            { time: "16:00", po: "PO-2024-154", supplier: "BuildRight Co.", items: "Vật liệu xây dựng", status: "incoming" },
          ].map((delivery) => (
            <div key={delivery.po} className="flex items-center gap-4 p-3 bg-[#161922] rounded-lg border border-[rgba(148,163,184,0.05)]">
              <div className="text-sm font-mono text-[#64748B] w-16">{delivery.time}</div>
              <div className={`w-2 h-2 rounded-full ${delivery.status === "incoming" ? "bg-emerald-400" : "bg-amber-400"}`} />
              <div className="flex-1">
                <p className="text-sm font-semibold text-[#F8FAFC]">{delivery.po}</p>
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
