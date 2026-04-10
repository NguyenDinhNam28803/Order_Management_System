"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useProcurement, RFQ, PO, Contract } from "../context/ProcurementContext";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  LayoutDashboard,
  Inbox,
  FileText,
  ShoppingCart,
  DollarSign,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Clock,
  ArrowRight,
  Star,
  Package,
  Send,
  MessageSquare,
  Sparkles,
  TrendingDown,
  ChevronRight,
  Bell,
  Calendar,
  Award,
  BarChart3,
  RefreshCcw,
  Signature,
  Target,
  ShieldCheck
} from "lucide-react";
import { formatVND } from "../utils/formatUtils";

// Tooltip Component
const Tooltip = ({ children, content, position = 'top' }: { children: React.ReactNode; content: React.ReactNode; position?: 'top' | 'bottom' | 'left' | 'right' }) => {
  const [show, setShow] = useState(false);
  return (
    <div className="relative inline-block overflow-visible">
      <div onMouseEnter={() => setShow(true)} onMouseLeave={() => setShow(false)} className="relative">
        {children}
      </div>
      {show && (
        <div className={`absolute z-[100] ${
          position === 'top' ? 'bottom-full left-1/2 -translate-x-1/2 mb-2' :
          position === 'bottom' ? 'top-full left-1/2 -translate-x-1/2 mt-2' :
          position === 'left' ? 'right-full top-1/2 -translate-y-1/2 mr-2' :
          'left-full top-1/2 -translate-y-1/2 ml-2'
        }`}>
          <div className="bg-[#1A1D23] border border-[rgba(148,163,184,0.2)] rounded-xl p-3 shadow-2xl max-w-xs text-xs text-[#94A3B8] whitespace-normal min-w-[220px]">
            {content}
          </div>
        </div>
      )}
    </div>
  );
};

// Helper functions for KPI display
const getScorePercentage = (score?: number) => Math.min(Math.max(score || 0, 0), 100);

const getScoreColor = (score?: number) => {
  if (!score) return "text-[#64748B]";
  if (score >= 90) return "text-emerald-400";
  if (score >= 70) return "text-yellow-400";
  return "text-rose-400";
};

const getTierColor = (tier?: string) => {
  switch (tier) {
    case "GOLD": return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
    case "SILVER": return "bg-slate-400/20 text-slate-400 border-slate-400/30";
    case "BRONZE": return "bg-orange-500/20 text-orange-400 border-orange-500/30";
    default: return "bg-[#1A1D23] text-[#64748B] border-[rgba(148,163,184,0.1)]";
  }
};

// Types
interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ElementType;
  color: string;
  trend?: number;
  onClick?: () => void;
}

interface ActivityItem {
  id: string;
  type: "rfq" | "po" | "invoice" | "contract" | "message";
  title: string;
  description: string;
  date: string;
  status: string;
  priority?: "high" | "medium" | "low";
}

// Components
const StatCard = ({ title, value, subtitle, icon: Icon, color, trend, onClick }: StatCardProps) => (
  <div 
    onClick={onClick}
    className={`bg-[#161922] rounded-2xl p-5 border border-[rgba(148,163,184,0.1)] hover:border-[${color}]/30 transition-all group ${onClick ? 'cursor-pointer' : ''}`}
  >
    <div className="flex items-start justify-between mb-3">
      <div className={`h-10 w-10 rounded-xl ${color.replace("text", "bg")}/10 flex items-center justify-center border border-${color.replace("[", "").replace("]", "")}/20`}>
        <Icon size={20} className={color} />
      </div>
      {trend !== undefined && (
        <div className={`flex items-center gap-1 text-xs font-bold ${trend >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
          {trend >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
          {Math.abs(trend)}%
        </div>
      )}
    </div>
    <div className="text-2xl font-black text-[#F8FAFC] mb-1">{value}</div>
    <div className="text-xs font-bold text-[#64748B] uppercase tracking-wider">{title}</div>
    {subtitle && <div className="text-[10px] text-[#64748B] mt-1">{subtitle}</div>}
  </div>
);

const QuickAction = ({ icon: Icon, label, href, color }: { icon: any, label: string, href: string, color: string }) => (
  <Link 
    href={href}
    className="flex flex-col items-center gap-2 p-4 rounded-xl bg-[#0F1117] border border-[rgba(148,163,184,0.1)] hover:border-[#3B82F6]/30 hover:bg-[#161922] transition-all group"
  >
    <div className={`h-12 w-12 rounded-xl ${color} flex items-center justify-center group-hover:scale-110 transition-transform`}>
      <Icon size={24} className="text-white" />
    </div>
    <span className="text-xs font-bold text-[#94A3B8] text-center">{label}</span>
  </Link>
);

// KPI Types
interface KPIMetric {
  metric: string;
  score: number;
  weight: number;
  points: number;
}

interface KPIData {
  supplier?: { id: string; name: string };
  overallScore: number;
  otdScore?: number;
  qualityScore?: number;
  priceScore?: number;
  manualScore?: number;
  metrics?: KPIMetric[];
  evaluations?: any[];
}

export default function SupplierPortalPage() {
  const router = useRouter();
  const { 
    currentUser, 
    rfqs, 
    pos, 
    allPos,
    contracts,
    fetchMySupplierRFQs,
    fetchSupplierKPIReport,
    evaluateSupplierKPI,
    notify 
  } = useProcurement();

  const [loading, setLoading] = useState(true);
  const [myRFQs, setMyRFQs] = useState<RFQ[]>([]);
  const [myPOs, setMyPOs] = useState<PO[]>([]);
  const [myContracts, setMyContracts] = useState<Contract[]>([]);
  const [notifications, setNotifications] = useState<ActivityItem[]>([]);
  const [kpiData, setKPIData] = useState<KPIData | null>(null);
  const [kpiLoading, setKPILoading] = useState(false);

  const supplierId = currentUser?.orgId || "";
  const supplierName = currentUser?.organization?.name || "Nhà cung cấp";

  // Fetch data on mount
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        // Fetch RFQs
        const rfqList = await fetchMySupplierRFQs();
        setMyRFQs(rfqList || []);

        // Filter POs for this supplier
        const supplierPOs = allPos.filter((p: PO) => p.supplierId === supplierId);
        setMyPOs(supplierPOs);

        // Filter contracts for this supplier
        const supplierContracts = contracts.filter((c: Contract) => c.supplierId === supplierId);
        setMyContracts(supplierContracts);

        // Generate mock notifications/activities
        const mockActivities: ActivityItem[] = [
          {
            id: "1",
            type: "rfq",
            title: "Yêu cầu báo giá mới",
            description: "RFQ-2024-015 - Nâng cấp hệ thống server",
            date: "2 giờ trước",
            status: "PENDING",
            priority: "high"
          },
          {
            id: "2",
            type: "po",
            title: "Đơn hàng được xác nhận",
            description: "PO-2024-042 - Đã được phê duyệt",
            date: "5 giờ trước",
            status: "CONFIRMED"
          },
          {
            id: "3",
            type: "invoice",
            title: "Thanh toán đã xử lý",
            description: "INV-2024-128 - 45,000,000 VNĐ",
            date: "1 ngày trước",
            status: "PAID"
          },
          {
            id: "4",
            type: "message",
            title: "Tin nhắn từ InnHub",
            description: "Vui lòng cập nhật chứng chỉ ISO...",
            date: "2 ngày trước",
            status: "UNREAD",
            priority: "medium"
          }
        ];
        setNotifications(mockActivities);

      } catch (error) {
        console.error("Error loading supplier data:", error);
        notify("Có lỗi khi tải dữ liệu", "error");
      } finally {
        setLoading(false);
      }
    };

    if (supplierId) {
      loadData();
    }
  }, [supplierId, fetchMySupplierRFQs, allPos, contracts, notify]);

  // Fetch KPI data
  useEffect(() => {
    const loadKPI = async () => {
      if (!supplierId) return;
      setKPILoading(true);
      try {
        const report = await fetchSupplierKPIReport(supplierId);
        if (report && report.length > 0) {
          // Use the latest evaluation
          const latest = report[report.length - 1];
          setKPIData(latest);
        }
      } catch (error) {
        console.error("Error fetching KPI:", error);
      } finally {
        setKPILoading(false);
      }
    };

    loadKPI();
  }, [supplierId, fetchSupplierKPIReport]);

  // Handle evaluate KPI
  const handleEvaluateKPI = async () => {
    if (!supplierId) return;
    setKPILoading(true);
    try {
      const result = await evaluateSupplierKPI(supplierId);
      if (result) {
        setKPIData(result);
        notify("Đánh giá nhà cung cấp hoàn tất", "success");
      }
    } catch (error) {
      console.error("Error evaluating KPI:", error);
      notify("Lỗi khi đánh giá", "error");
    } finally {
      setKPILoading(false);
    }
  };

  // Stats calculation
  const stats = useMemo(() => {
    const pendingRFQs = myRFQs.filter(r => r.status === "SENT" || r.status === "OPEN").length;
    const activePOs = myPOs.filter(p => !["CANCELLED", "COMPLETED", "REJECTED"].includes(p.status)).length;
    const totalValue = myPOs.reduce((sum, p) => sum + (p.total || 0), 0);
    const pendingInvoices = myPOs.filter(p => p.status === "SHIPPED" || p.status === "DELIVERED").length;
    const activeContracts = myContracts.filter(c => c.status === "ACTIVE").length;

    // Performance score from KPI data or default
    const performanceScore = kpiData?.overallScore || 0;

    return {
      pendingRFQs,
      activePOs,
      totalValue,
      pendingInvoices,
      performanceScore,
      activeContracts
    };
  }, [myRFQs, myPOs, myContracts, kpiData]);

  // Recent items
  const recentRFQs = useMemo(() => {
    return myRFQs
      .filter(r => r.status === "SENT" || r.status === "OPEN")
      .slice(0, 3);
  }, [myRFQs]);

  const recentPOs = useMemo(() => {
    return myPOs
      .filter(p => !["CANCELLED", "REJECTED"].includes(p.status))
      .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime())
      .slice(0, 3);
  }, [myPOs]);

  // Activity icon mapping
  const getActivityIcon = (type: string) => {
    switch (type) {
      case "rfq": return Inbox;
      case "po": return ShoppingCart;
      case "invoice": return DollarSign;
      case "contract": return FileText;
      case "message": return MessageSquare;
      default: return Bell;
    }
  };

  const getActivityColor = (type: string) => {
    switch (type) {
      case "rfq": return "text-[#3B82F6]";
      case "po": return "text-emerald-400";
      case "invoice": return "text-amber-400";
      case "contract": return "text-violet-400";
      case "message": return "text-rose-400";
      default: return "text-[#64748B]";
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-[#0F1117] p-6">
        <div className="flex flex-col items-center justify-center min-h-[400px]">
          <div className="w-12 h-12 border-4 border-[#3B82F6] border-t-transparent rounded-full animate-spin mb-4"></div>
          <div className="text-[#64748B] font-bold uppercase tracking-widest">Đang tải cổng thông tin...</div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#0F1117] p-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-[#3B82F6] to-[#8B5CF6] flex items-center justify-center">
            <LayoutDashboard size={24} className="text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-[#F8FAFC] tracking-tight">
              Cổng thông tin Nhà cung cấp
            </h1>
            <p className="text-sm text-[#64748B]">
              Xin chào, <span className="text-[#3B82F6] font-bold">{supplierName}</span>
            </p>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        <StatCard
          title="RFQ Chờ báo giá"
          value={stats.pendingRFQs}
          subtitle="Yêu cầu mới từ khách hàng"
          icon={Inbox}
          color="text-[#3B82F6]"
          trend={12}
          onClick={() => router.push("/supplier/rfq")}
        />
        <StatCard
          title="Đơn hàng đang xử lý"
          value={stats.activePOs}
          subtitle="PO đang được thực hiện"
          icon={ShoppingCart}
          color="text-emerald-400"
          trend={5}
          onClick={() => router.push("/supplier/po")}
        />
        <StatCard
          title="Tổng giá trị PO"
          value={formatVND(stats.totalValue)}
          subtitle="Giá trị đơn hàng"
          icon={DollarSign}
          color="text-amber-400"
          onClick={() => router.push("/supplier/po")}
        />
        <StatCard
          title="Chờ thanh toán"
          value={stats.pendingInvoices}
          subtitle="Hóa đơn đã gửi"
          icon={FileText}
          color="text-violet-400"
          trend={5}
          onClick={() => router.push("/supplier/invoice")}
        />
        <StatCard
          title="Hợp đồng hiệu lực"
          value={stats.activeContracts}
          subtitle="Hợp đồng đang active"
          icon={Signature}
          color="text-cyan-400"
          onClick={() => router.push("/supplier/contracts")}
        />
        <StatCard
          title="Điểm hiệu suất"
          value={`${stats.performanceScore}/100`}
          subtitle="Đánh giá nhà cung cấp"
          icon={Star}
          color="text-rose-400"
          trend={3}
          onClick={() => router.push(`/supplier/${supplierId}/kpi-evaluation`)}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Quick Actions & Recent RFQs */}
        <div className="lg:col-span-2 space-y-6">
          {/* Quick Actions */}
          <div className="bg-[#161922] rounded-2xl p-6 border border-[rgba(148,163,184,0.1)]">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles size={18} className="text-[#3B82F6]" />
              <h2 className="text-sm font-black text-[#F8FAFC] uppercase tracking-widest">Thao tác nhanh</h2>
            </div>
            <div className="grid grid-cols-5 gap-3">
              <QuickAction
                icon={Send}
                label="Gửi báo giá"
                href="/supplier/rfq"
                color="bg-[#3B82F6]"
              />
              <QuickAction
                icon={Package}
                label="Xác nhận PO"
                href="/supplier/po"
                color="bg-emerald-500"
              />
              <QuickAction
                icon={FileText}
                label="Gửi hóa đơn"
                href="/supplier/invoice"
                color="bg-amber-500"
              />
              <QuickAction
                icon={Signature}
                label="Hợp đồng"
                href="/supplier/contracts"
                color="bg-cyan-500"
              />
              <QuickAction
                icon={RefreshCcw}
                label="Cập nhật SP"
                href="/supplier/products"
                color="bg-violet-500"
              />
            </div>
          </div>

          {/* Recent RFQs */}
          <div className="bg-[#161922] rounded-2xl p-6 border border-[rgba(148,163,184,0.1)]">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Inbox size={18} className="text-[#3B82F6]" />
                <h2 className="text-sm font-black text-[#F8FAFC] uppercase tracking-widest">RFQ cần xử lý</h2>
              </div>
              <Link href="/supplier/rfq" className="text-xs font-bold text-[#3B82F6] hover:text-[#60A5FA] flex items-center gap-1">
                Xem tất cả <ArrowRight size={14} />
              </Link>
            </div>
            
            {recentRFQs.length === 0 ? (
              <div className="text-center py-8 bg-[#0F1117] rounded-xl">
                <Inbox size={40} className="text-[#64748B] mx-auto mb-3" />
                <p className="text-[#64748B] text-sm">Không có RFQ nào đang chờ</p>
              </div>
            ) : (
              <div className="space-y-3">
                {recentRFQs.map((rfq) => (
                  <div 
                    key={rfq.id}
                    onClick={() => router.push("/supplier/rfq")}
                    className="flex items-center gap-4 p-4 bg-[#0F1117] rounded-xl border border-[rgba(148,163,184,0.1)] hover:border-[#3B82F6]/30 transition-all cursor-pointer group"
                  >
                    <div className="h-10 w-10 rounded-lg bg-[#3B82F6]/10 flex items-center justify-center shrink-0">
                      <FileText size={18} className="text-[#3B82F6]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-[#F8FAFC] truncate">{rfq.rfqNumber || rfq.id?.substring(0, 8)}</span>
                        <span className="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 text-[10px] font-bold">
                          Chờ báo giá
                        </span>
                      </div>
                      <p className="text-xs text-[#64748B] mt-0.5 truncate">{rfq.title || "Yêu cầu báo giá"}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-xs text-[#64748B]">{rfq.items?.length || 0} sản phẩm</div>
                      <div className="text-[10px] text-[#64748B]">{rfq.createdAt ? new Date(rfq.createdAt).toLocaleDateString() : "N/A"}</div>
                    </div>
                    <ChevronRight size={16} className="text-[#64748B] group-hover:text-[#3B82F6] transition-colors" />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recent Purchase Orders */}
          <div className="bg-[#161922] rounded-2xl p-6 border border-[rgba(148,163,184,0.1)]">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <ShoppingCart size={18} className="text-emerald-400" />
                <h2 className="text-sm font-black text-[#F8FAFC] uppercase tracking-widest">Đơn hàng gần đây</h2>
              </div>
              <Link href="/supplier/po" className="text-xs font-bold text-emerald-400 hover:text-emerald-300 flex items-center gap-1">
                Xem tất cả <ArrowRight size={14} />
              </Link>
            </div>
            
            {recentPOs.length === 0 ? (
              <div className="text-center py-8 bg-[#0F1117] rounded-xl">
                <ShoppingCart size={40} className="text-[#64748B] mx-auto mb-3" />
                <p className="text-[#64748B] text-sm">Chưa có đơn hàng nào</p>
              </div>
            ) : (
              <div className="space-y-3">
                {recentPOs.map((po) => (
                  <div 
                    key={po.id}
                    onClick={() => router.push("/supplier/po")}
                    className="flex items-center gap-4 p-4 bg-[#0F1117] rounded-xl border border-[rgba(148,163,184,0.1)] hover:border-emerald-500/30 transition-all cursor-pointer group"
                  >
                    <div className="h-10 w-10 rounded-lg bg-emerald-500/10 flex items-center justify-center shrink-0">
                      <Package size={18} className="text-emerald-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-[#F8FAFC] truncate">{po.poNumber || po.id?.substring(0, 8)}</span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          po.status === "ACKNOWLEDGED" ? "bg-emerald-500/10 text-emerald-400" :
                          po.status === "PENDING" ? "bg-amber-500/10 text-amber-400" :
                          po.status === "SHIPPED" ? "bg-[#3B82F6]/10 text-[#3B82F6]" :
                          "bg-[#64748B]/10 text-[#64748B]"
                        }`}>
                          {po.status}
                        </span>
                      </div>
                      <p className="text-xs text-[#64748B] mt-0.5">{po.vendor || "Khách hàng"}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="font-bold text-emerald-400">{formatVND(po.total || 0)}</div>
                      <div className="text-[10px] text-[#64748B]">{po.items?.length || 0} sản phẩm</div>
                    </div>
                    <ChevronRight size={16} className="text-[#64748B] group-hover:text-emerald-400 transition-colors" />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column - Activity & Performance */}
        <div className="space-y-6">
          {/* Performance Card */}
          <div className="bg-[#161922] rounded-2xl p-6 border border-[rgba(148,163,184,0.1)]">
            <div className="flex items-center gap-2 mb-4">
              <Award size={18} className="text-rose-400" />
              <h2 className="text-sm font-black text-[#F8FAFC] uppercase tracking-widest">Hiệu suất</h2>
            </div>
            
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center h-24 w-24 rounded-full bg-gradient-to-br from-rose-500/20 to-rose-600/10 border-4 border-rose-500/30 mb-3">
                <span className="text-3xl font-black text-rose-400">
                  {kpiLoading ? "..." : stats.performanceScore}
                </span>
              </div>
              <p className="text-sm text-[#64748B]">Điểm đánh giá nhà cung cấp</p>
            </div>

            {/* Detailed KPI Metrics Grid */}
            {kpiData ? (
              <div className="grid grid-cols-1 gap-3 mb-4">
                {/* OTD Score */}
                <div className="bg-[#0F1117] rounded-xl p-4 border border-[rgba(148,163,184,0.1)]">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 bg-emerald-500/10 rounded-lg">
                        <TrendingUp size={14} className="text-emerald-400" />
                      </div>
                      <Tooltip content={
                        <div className="space-y-1">
                          <p className="font-bold text-emerald-400">OTD - On-Time Delivery</p>
                          <p>Tỷ lệ giao hàng đúng hẹn</p>
                          <p className="text-[#64748B]">Trọng số: 30%</p>
                        </div>
                      }>
                        <span className="text-[#94A3B8] text-xs font-bold uppercase cursor-help hover:text-emerald-400 transition-colors">OTD Score</span>
                      </Tooltip>
                    </div>
                    <span className={`text-lg font-black ${getScoreColor(kpiData.otdScore)}`}>
                      {typeof kpiData.otdScore === 'number' ? kpiData.otdScore.toFixed(0) : "--"}%
                    </span>
                  </div>
                  <div className="h-2 bg-[#161922] rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-1000 ${
                        (kpiData.otdScore || 0) >= 90 ? "bg-emerald-400" :
                        (kpiData.otdScore || 0) >= 70 ? "bg-yellow-400" : "bg-rose-400"
                      }`}
                      style={{ width: `${getScorePercentage(kpiData.otdScore)}%` }}
                    />
                  </div>
                  <p className="text-[#64748B] text-[10px] mt-1">Giao hàng đúng hạn (30%)</p>
                </div>

                {/* Quality Score */}
                <div className="bg-[#0F1117] rounded-xl p-4 border border-[rgba(148,163,184,0.1)]">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 bg-blue-500/10 rounded-lg">
                        <CheckCircle size={14} className="text-[#3B82F6]" />
                      </div>
                      <Tooltip content={
                        <div className="space-y-1">
                          <p className="font-bold text-blue-400">Quality Score</p>
                          <p>Đánh giá chất lượng sản phẩm</p>
                          <p className="text-[#64748B]">Trọng số: 30%</p>
                        </div>
                      }>
                        <span className="text-[#94A3B8] text-xs font-bold uppercase cursor-help hover:text-blue-400 transition-colors">Quality</span>
                      </Tooltip>
                    </div>
                    <span className={`text-lg font-black ${getScoreColor(kpiData.qualityScore)}`}>
                      {typeof kpiData.qualityScore === 'number' ? kpiData.qualityScore.toFixed(0) : "--"}%
                    </span>
                  </div>
                  <div className="h-2 bg-[#161922] rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-1000 ${
                        (kpiData.qualityScore || 0) >= 90 ? "bg-emerald-400" :
                        (kpiData.qualityScore || 0) >= 70 ? "bg-yellow-400" : "bg-rose-400"
                      }`}
                      style={{ width: `${getScorePercentage(kpiData.qualityScore)}%` }}
                    />
                  </div>
                  <p className="text-[#64748B] text-[10px] mt-1">Chất lượng sản phẩm (30%)</p>
                </div>

                {/* Price Score */}
                <div className="bg-[#0F1117] rounded-xl p-4 border border-[rgba(148,163,184,0.1)]">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 bg-yellow-500/10 rounded-lg">
                        <Award size={14} className="text-yellow-400" />
                      </div>
                      <Tooltip content={
                        <div className="space-y-1">
                          <p className="font-bold text-yellow-400">Price Score</p>
                          <p>Đánh giá cạnh tranh giá</p>
                          <p className="text-[#64748B]">Trọng số: 20%</p>
                        </div>
                      }>
                        <span className="text-[#94A3B8] text-xs font-bold uppercase cursor-help hover:text-yellow-400 transition-colors">Price</span>
                      </Tooltip>
                    </div>
                    <span className={`text-lg font-black ${getScoreColor(kpiData.priceScore)}`}>
                      {typeof kpiData.priceScore === 'number' ? kpiData.priceScore.toFixed(0) : "--"}%
                    </span>
                  </div>
                  <div className="h-2 bg-[#161922] rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-1000 ${
                        (kpiData.priceScore || 0) >= 90 ? "bg-emerald-400" :
                        (kpiData.priceScore || 0) >= 70 ? "bg-yellow-400" : "bg-rose-400"
                      }`}
                      style={{ width: `${getScorePercentage(kpiData.priceScore)}%` }}
                    />
                  </div>
                  <p className="text-[#64748B] text-[10px] mt-1">Cạnh tranh giá (20%)</p>
                </div>

                {/* Manual Score */}
                <div className="bg-[#0F1117] rounded-xl p-4 border border-[rgba(148,163,184,0.1)]">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 bg-purple-500/10 rounded-lg">
                        <Star size={14} className="text-purple-400" />
                      </div>
                      <Tooltip content={
                        <div className="space-y-1">
                          <p className="font-bold text-purple-400">Manual Score</p>
                          <p>Đánh giá chủ quan từ Procurement</p>
                          <p className="text-[#64748B]">Trọng số: 20%</p>
                        </div>
                      }>
                        <span className="text-[#94A3B8] text-xs font-bold uppercase cursor-help hover:text-purple-400 transition-colors">Manual</span>
                      </Tooltip>
                    </div>
                    <span className={`text-lg font-black ${getScoreColor(kpiData.manualScore)}`}>
                      {typeof kpiData.manualScore === 'number' ? kpiData.manualScore.toFixed(0) : "--"}%
                    </span>
                  </div>
                  <div className="h-2 bg-[#161922] rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-1000 ${
                        (kpiData.manualScore || 0) >= 90 ? "bg-emerald-400" :
                        (kpiData.manualScore || 0) >= 70 ? "bg-yellow-400" : "bg-rose-400"
                      }`}
                      style={{ width: `${getScorePercentage(kpiData.manualScore)}%` }}
                    />
                  </div>
                  <p className="text-[#64748B] text-[10px] mt-1">Đánh giá thủ công (20%)</p>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3 mb-4">
                {['OTD Score', 'Quality Score', 'Price Score', 'Manual Score'].map((label, idx) => (
                  <div key={idx} className="bg-[#0F1117] rounded-xl p-4 border border-[rgba(148,163,184,0.1)]">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[#64748B] text-xs font-bold uppercase">{label}</span>
                      <span className="text-lg font-black text-[#64748B]">--%</span>
                    </div>
                    <div className="h-2 bg-[#161922] rounded-full overflow-hidden">
                      <div className="h-full bg-[#64748B]/30 rounded-full" style={{ width: '0%' }} />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* KPI Action Buttons - Matching Procurement Style */}
            <div className="flex flex-col gap-2">
              <button
                onClick={handleEvaluateKPI}
                disabled={kpiLoading || !supplierId}
                className="flex items-center justify-center gap-2 px-4 py-2.5 bg-[#3B82F6] hover:bg-[#2563EB] text-white rounded-xl font-bold text-xs uppercase tracking-wider transition-all disabled:opacity-50"
              >
                {kpiLoading ? (
                  <>
                    <RefreshCcw size={16} className="animate-spin" />
                    Đang đánh giá...
                  </>
                ) : (
                  <>
                    <BarChart3 size={16} />
                    Chạy đánh giá AI
                  </>
                )}
              </button>

              <Link
                href={`/supplier/${supplierId}/kpi-evaluation`}
                className="flex items-center justify-center gap-2 px-4 py-2.5 bg-[#161922] border border-[rgba(148,163,184,0.1)] text-[#94A3B8] rounded-xl font-bold text-xs uppercase tracking-wider hover:bg-[#1A1D23] transition-all"
              >
                <Target size={16} />
                Xem chi tiết đánh giá
              </Link>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-[#161922] rounded-2xl p-6 border border-[rgba(148,163,184,0.1)]">
            <div className="flex items-center gap-2 mb-4">
              <Clock size={18} className="text-[#64748B]" />
              <h2 className="text-sm font-black text-[#F8FAFC] uppercase tracking-widest">Hoạt động gần đây</h2>
            </div>
            
            <div className="space-y-4">
              {notifications.map((activity) => {
                const Icon = getActivityIcon(activity.type);
                const colorClass = getActivityColor(activity.type);
                return (
                  <div key={activity.id} className="flex gap-3">
                    <div className={`h-8 w-8 rounded-lg ${colorClass.replace("text", "bg")}/10 flex items-center justify-center shrink-0 mt-0.5`}>
                      <Icon size={14} className={colorClass} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-[#F8FAFC] text-sm">{activity.title}</span>
                        {activity.priority === "high" && (
                          <span className="w-2 h-2 rounded-full bg-rose-400"></span>
                        )}
                      </div>
                      <p className="text-xs text-[#64748B] mt-0.5">{activity.description}</p>
                      <p className="text-[10px] text-[#64748B] mt-1">{activity.date}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Quick Links */}
          <div className="bg-[#161922] rounded-2xl p-6 border border-[rgba(148,163,184,0.1)]">
            <div className="flex items-center gap-2 mb-4">
              <Target size={18} className="text-[#64748B]" />
              <h2 className="text-sm font-black text-[#F8FAFC] uppercase tracking-widest">Liên kết nhanh</h2>
            </div>
            <div className="space-y-2">
              <Link href="/procurement/contracts" className="flex items-center gap-3 p-3 rounded-xl bg-[#0F1117] hover:bg-[#1A1D23] transition-all group">
                <ShieldCheck size={16} className="text-[#64748B] group-hover:text-[#3B82F6]" />
                <span className="text-sm text-[#94A3B8] group-hover:text-[#F8FAFC]">Hợp đồng & Ký kết</span>
              </Link>
              <Link href="/help" className="flex items-center gap-3 p-3 rounded-xl bg-[#0F1117] hover:bg-[#1A1D23] transition-all group">
                <AlertCircle size={16} className="text-[#64748B] group-hover:text-[#3B82F6]" />
                <span className="text-sm text-[#94A3B8] group-hover:text-[#F8FAFC]">Trung tâm trợ giúp</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
