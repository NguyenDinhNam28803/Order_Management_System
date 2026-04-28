"use client";

import React, { useState, useEffect, useMemo } from "react";
import { 
  Building, 
  DollarSign, 
  Plus, 
  Filter, 
  Search,
  TrendingUp, 
  History, 
  CheckCircle2, 
  AlertCircle,
  Clock,
  LayoutGrid,
  ChevronRight,
  PieChart,
  Calendar,
  X,
  Zap,
  Loader2
} from "lucide-react";
import { useProcurement } from "../../context/ProcurementContext";
import { formatVND } from "../../utils/formatUtils";

export default function BudgetAllocationPage() {
  const { 
    costCenters, 
    budgetAllocations, 
    budgetPeriods, 
    distributeAnnualBudget, 
    refreshData 
  } = useProcurement();

  const [selectedQuarter, setSelectedQuarter] = useState(1);
  const [selectedYear, setSelectedYear] = useState(2026);
  const [showDistributeModal, setShowDistributeModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  // Filter allocations based on selected quarter and year
  const activeAllocations = useMemo(() => {
    return budgetAllocations.filter(alloc => {
      const period = budgetPeriods.find(p => p.id === alloc.budgetPeriodId);
      return period?.periodNumber === selectedQuarter && 
             period?.fiscalYear === selectedYear &&
             period?.periodType === "QUARTERLY";
    }).map(alloc => {
      const cc = costCenters.find(c => c.id === alloc.costCenterId);

      return {
        ...alloc,
        deptName: cc?.name || "N/A",
        costCenterCode: cc?.code || "N/A",
        quota: Number(alloc.allocatedAmount) || 0,
        spent: Number(alloc.spentAmount) || 0,
        committed: Number(alloc.committedAmount) || 0,
      };
    }).filter(item => 
      item.deptName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.costCenterCode.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [budgetAllocations, budgetPeriods, costCenters, selectedQuarter, selectedYear, searchTerm]);

  const totalQuota = activeAllocations.reduce((sum, item) => sum + item.quota, 0);
  const totalSpent = activeAllocations.reduce((sum, item) => sum + item.spent, 0);
  const totalCommitted = activeAllocations.reduce((sum, item) => sum + item.committed, 0);
  const utilization = totalQuota > 0 ? (totalSpent + totalCommitted) / totalQuota : 0;

  const handleDistribute = async (ccId: string) => {
    setLoading(true);
    await distributeAnnualBudget(ccId, selectedYear);
    setShowDistributeModal(false);
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#FFFFFF] p-8 text-[#000000]">
      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-black text-[#000000] tracking-tight flex items-center gap-3">
            <Building className="text-[#B4533A]" size={32} />
            Phân bổ ngân sách theo Quý
          </h1>
          <p className="text-[#000000] font-medium mt-1">
            Quản lý và cấp phát ngân sách định kỳ cho các trung tâm chi phí
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="flex bg-[#FAF8F5] p-1 rounded-xl shadow-sm border border-[rgba(148,163,184,0.1)]">
            {[1, 2, 3, 4].map((q) => (
              <button
                key={q}
                onClick={() => setSelectedQuarter(q)}
                className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                  selectedQuarter === q 
                    ? "bg-[#B4533A] text-[#000000] shadow-md shadow-[#B4533A]/20" 
                    : "text-[#000000] hover:bg-[#1A1D23]"
                }`}
              >
                Quý {q}
              </button>
            ))}
          </div>
          
          <button 
            onClick={() => setShowDistributeModal(true)}
            className="flex items-center gap-2 bg-[#B4533A] hover:bg-[#A85032] text-[#000000] px-5 py-2.5 rounded-xl font-bold shadow-lg shadow-[#B4533A]/20 transition-all active:scale-95"
          >
            <Zap size={18} />
            Phân bổ 20/80
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-[#FAF8F5] p-6 rounded-3xl shadow-sm border border-[rgba(148,163,184,0.1)] relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform text-[#B4533A]">
            <CalculatorIcon size={80} />
          </div>
          <p className="text-xs font-black uppercase tracking-widest text-[#000000] mb-2">Tổng hạn mức Quý {selectedQuarter}</p>
          <p className="text-2xl font-black text-[#000000]">{totalQuota.toLocaleString()} VND</p>
          <div className="flex items-center gap-2 mt-2 text-black text-xs font-bold">
            <TrendingUp size={14} />
            <span>Năm tài chính {selectedYear}</span>
          </div>
        </div>

        <div className="bg-[#FAF8F5] p-6 rounded-3xl shadow-sm border border-[rgba(148,163,184,0.1)] relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform text-[#B4533A]">
            <DollarSign size={80} />
          </div>
          <p className="text-xs font-black uppercase tracking-widest text-[#000000] mb-2">Đã chi tiêu thực tế</p>
          <p className="text-2xl font-black text-[#000000]">{totalSpent.toLocaleString()} VND</p>
          <div className="w-full bg-[#FFFFFF] h-1.5 rounded-full mt-4">
            <div 
              className="bg-[#B4533A] h-full rounded-full transition-all duration-1000" 
              style={{ width: `${totalQuota > 0 ? (totalSpent / totalQuota) * 100 : 0}%` }}
            />
          </div>
        </div>

        <div className="bg-[#FAF8F5] p-6 rounded-3xl shadow-sm border border-[rgba(148,163,184,0.1)] relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform text-black">
            <Clock size={80} />
          </div>
          <p className="text-xs font-black uppercase tracking-widest text-[#000000] mb-2">Cam kết chi (Committed)</p>
          <p className="text-2xl font-black text-[#000000]">{totalCommitted.toLocaleString()} VND</p>
          <p className="text-black text-xs font-bold mt-2 italic">*Từ PO/PR đang xử lý</p>
        </div>

        <div className="bg-[#FAF8F5] p-6 rounded-3xl shadow-xl shadow-[#B4533A]/5 relative overflow-hidden group text-[#000000] border border-[rgba(148,163,184,0.1)]">
          <div className="absolute top-0 right-0 p-4 opacity-10 text-[#B4533A]">
            <PieChart size={80} />
          </div>
          <p className="text-xs font-black uppercase tracking-widest text-[#000000] mb-2">Hiệu suất sử dụng</p>
          <p className="text-3xl font-black text-[#000000]">{(utilization * 100).toFixed(1)}%</p>
          <p className="text-[#000000] text-xs font-medium mt-2">Ngân sách còn lại: {(totalQuota - totalSpent - totalCommitted).toLocaleString()} VND</p>
        </div>
      </div>

      {/* Main Table Section */}
      <div className="bg-[#FAF8F5] rounded-[2rem] shadow-xl shadow-[#B4533A]/5 border border-[rgba(148,163,184,0.1)] overflow-hidden">
        <div className="p-6 border-b border-[rgba(148,163,184,0.1)] flex items-center justify-between bg-[#FFFFFF]">
          <div className="flex items-center gap-4">
            <div className="bg-[#FAF8F5] p-2 rounded-xl shadow-sm border border-[rgba(148,163,184,0.1)]">
              <LayoutGrid size={20} className="text-[#B4533A]" />
            </div>
            <h2 className="font-black text-[#000000] tracking-tight">Dữ liệu phân bổ ngân sách {selectedYear}</h2>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#000000]" size={16} />
              <input 
                type="text" 
                placeholder="Tìm phòng ban..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 bg-[#FAF8F5] border border-[rgba(148,163,184,0.1)] rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#B4533A]/20 text-[#000000] placeholder:text-[#000000]"
              />
            </div>
            <button className="p-2 bg-[#FAF8F5] border border-[rgba(148,163,184,0.1)] rounded-xl text-[#000000] hover:bg-[#1A1D23] transition-colors">
              <Filter size={18} />
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="erp-table text-xs">
            <thead>
              <tr className="bg-[#FFFFFF]">
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-[#000000]">Trung tâm chi phí (CC)</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-[#000000]">Hạn mức Quý</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-[#000000] text-center">Tiến độ sử dụng</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-[#000000]">Còn lại</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-[#000000] text-right">Trạng thái</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[rgba(148,163,184,0.1)]">
              {activeAllocations.length > 0 ? activeAllocations.map((item) => {
                const used = item.spent + item.committed;
                const percent = item.quota > 0 ? (used / item.quota) * 100 : 0;
                const remaining = item.quota - used;

                return (
                  <tr key={item.id} className="group hover:bg-[#FFFFFF]/50 transition-colors cursor-pointer">
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-[#B4533A] flex items-center justify-center text-white transition-all">
                          <Building size={20} />
                        </div>
                        <div>
                          <p className="font-bold text-[#000000] leading-none mb-1">{item.deptName}</p>
                          <p className="text-xs font-bold text-[#000000] tracking-wider uppercase">{item.costCenterCode}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <p className="font-black text-[#000000]">{item.quota.toLocaleString()}</p>
                      <p className="text-[10px] font-bold text-[#000000] uppercase">{item.currency} / Q{selectedQuarter}</p>
                    </td>
                    <td className="px-6 py-5 min-w-[200px]">
                      <div className="flex items-center gap-3">
                        <div className="flex-1 bg-[#1A1D23] h-2 rounded-full overflow-hidden">
                          <div 
                            className="h-full rounded-full transition-all duration-1000 bg-[#B4533A]"
                            style={{ width: `${percent}%` }}
                          />
                        </div>
                        <span className="text-xs font-black text-[#B4533A] whitespace-nowrap">
                          {percent.toFixed(0)}%
                        </span>
                      </div>
                      <div className="flex justify-between mt-1.5 px-0.5">
                        <span className="text-[9px] font-black text-[#000000] uppercase">Đã dùng: {used.toLocaleString()}</span>
                        <span className="text-[9px] font-black text-[#000000] uppercase">Cam kết: {item.committed.toLocaleString()}</span>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <p className={`font-black ${remaining < 0 ? 'text-red-500' : 'text-[#B4533A]'}`}>{remaining.toLocaleString()}</p>
                      <p className="text-[10px] font-extrabold text-black uppercase">Khả dụng</p>
                    </td>
                    <td className="px-6 py-5 text-right">
                      <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border ${
                        item.status === "APPROVED" 
                          ? "bg-emerald-500/10 text-black border-emerald-500/20" 
                          : "bg-amber-500/10 text-black border-amber-500/20"
                      }`}>
                        <CheckCircle2 size={12} />
                        <span className="text-[10px] font-black uppercase tracking-wider">{item.status}</span>
                      </div>
                    </td>
                  </tr>
                );
              }) : (
                <tr>
                  <td colSpan={5} className="py-20 text-center">
                    <div className="flex flex-col items-center gap-2 opacity-30">
                      <LayoutGrid size={48} className="text-[#000000]" />
                      <p className="font-bold text-[#000000]">Chưa có dữ liệu phân bổ cho Quý {selectedQuarter}</p>
                      <p className="text-xs text-[#000000]">Sử dụng tính năng &quot;Phân bổ 20/80&quot; để khởi tạo ngân sách năm</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination/Footer */}
        <div className="p-4 bg-[#FFFFFF] border-t border-[rgba(148,163,184,0.1)] flex items-center justify-between">
          <p className="text-xs font-bold text-[#000000] uppercase tracking-widest">Hiển thị {activeAllocations.length} phòng ban</p>
          <div className="flex items-center gap-1">
            <button className="px-3 py-1 rounded-lg border border-[rgba(148,163,184,0.1)] bg-[#FAF8F5] text-xs font-black hover:bg-[#1A1D23] transition-colors uppercase text-[#000000]">Trước</button>
            <button className="px-3 py-1 rounded-lg bg-[#B4533A] text-[#000000] text-xs font-black shadow-md shadow-[#B4533A]/20 uppercase">1</button>
            <button className="px-3 py-1 rounded-lg border border-[rgba(148,163,184,0.1)] bg-[#FAF8F5] text-xs font-black hover:bg-[#1A1D23] transition-colors uppercase text-[#000000]">Sau</button>
          </div>
        </div>
      </div>

      {/* Warning Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
        <div className="bg-amber-500/10 border border-amber-500/20 p-6 rounded-[2rem] flex items-start gap-4">
          <div className="p-3 bg-amber-500 rounded-2xl text-[#000000] shadow-lg shadow-amber-500/20">
            <AlertCircle size={24} />
          </div>
          <div>
            <h3 className="font-black text-black text-lg leading-tight mb-1">Cảnh báo Ngân sách (Quý {selectedQuarter})</h3>
            <p className="text-black/70 text-sm font-medium">Theo dõi các trung tâm chi phí có hiệu suất sử dụng vượt ngưỡng 90%. Vui lòng xem xét các yêu cầu bổ sung ngân sách.</p>
            <button className="mt-3 text-xs font-black uppercase tracking-widest text-black flex items-center gap-1 hover:underline">
              Xem chi tiết <ChevronRight size={14} />
            </button>
          </div>
        </div>
        
        <div className="bg-[#FAF8F5] p-8 rounded-[2rem] flex items-center justify-between group overflow-hidden relative border border-[rgba(148,163,184,0.1)]">
          <div className="absolute -right-10 -bottom-10 h-40 w-40 bg-[#B4533A] opacity-5 rounded-full group-hover:scale-150 transition-transform duration-700" />
          <div className="relative z-10 text-[#000000]">
            <h3 className="font-black text-xl mb-1">Quyết toán tài chính?</h3>
            <p className="text-[#000000] text-sm font-medium max-w-xs">Tự động kết chuyển số dư thừa vào quỹ dự phòng khi kết thúc chu kỳ quý.</p>
          </div>
          <button className="relative z-10 bg-[#B4533A] text-[#000000] px-6 py-3 rounded-2xl font-black text-sm shadow-xl shadow-[#B4533A]/20 hover:scale-105 transition-transform active:scale-95 uppercase tracking-wider">
            Thực hiện quyết toán
          </button>
        </div>
      </div>

      {/* Distribution Modal */}
      {showDistributeModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-[#FFFFFF]/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[#FAF8F5] rounded-[2.5rem] shadow-2xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-200 border border-[rgba(148,163,184,0.1)]">
            <div className="p-8 border-b border-[rgba(148,163,184,0.1)] flex items-center justify-between bg-[#FFFFFF]">
              <div className="flex items-center gap-4">
                <div className="bg-[#B4533A] p-3 rounded-2xl text-[#000000] shadow-lg shadow-[#B4533A]/20">
                  <Zap size={24} />
                </div>
                <div>
                  <h2 className="text-2xl font-black text-[#000000]">Phân bổ ngân sách năm {selectedYear}</h2>
                  <p className="text-[#000000] font-bold text-sm uppercase tracking-wider">Quy tắc 20% Dự phòng / 80% Quý (20% mỗi quý)</p>
                </div>
              </div>
              <button onClick={() => setShowDistributeModal(false)} className="p-2 hover:bg-[#1A1D23] rounded-full transition-colors text-[#000000]">
                <X size={24} />
              </button>
            </div>
            
            <div className="p-8 max-h-[60vh] overflow-y-auto">
              <div className="space-y-4">
                <p className="text-sm font-bold text-[#000000] mb-4 px-2 italic">⚠️ Chọn Trung tâm chi phí (Cost Center) để thực hiện tính toán và phân bổ tự động cho cả năm {selectedYear}:</p>
                {costCenters.map(cc => (
                  <div key={cc.id} className="flex items-center justify-between p-5 bg-[#FFFFFF] hover:bg-[#1A1D23] border border-[rgba(148,163,184,0.1)] rounded-3xl transition-all group">
                    <div>
                      <p className="font-black text-[#000000] group-hover:text-white transition-colors">{cc.name}</p>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-[10px] font-black uppercase text-[#000000] group-hover:text-white/70 tracking-widest transition-colors">{cc.code}</span>
                        <span className="h-1 w-1 rounded-full bg-[#000000] group-hover:bg-white transition-colors" />
                        <span className="text-xs font-bold text-[#B4533A] group-hover:text-[#CB7A62] transition-colors">Hạn mức năm: {Number(cc.budgetAnnual).toLocaleString()} {cc.currency}</span>
                      </div>
                    </div>
                    <button 
                      disabled={loading}
                      onClick={() => handleDistribute(cc.id)}
                      className="px-6 py-2.5 bg-[#FAF8F5] border-2 border-[rgba(148,163,184,0.1)] hover:border-[#B4533A] hover:bg-[#B4533A] hover:text-[#000000] rounded-2xl font-black text-sm transition-all shadow-sm active:scale-95 disabled:opacity-50 disabled:pointer-events-none text-[#000000]"
                    >
                      {loading ? <Loader2 size={18} className="animate-spin" /> : "PHÂN BỔ NGAY"}
                    </button>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="p-8 bg-[#FFFFFF] flex items-center justify-end gap-3 border-t border-[rgba(148,163,184,0.1)]">
              <button 
                onClick={() => setShowDistributeModal(false)}
                className="px-8 py-3 text-sm font-black text-[#000000] hover:text-[#000000] transition-colors uppercase tracking-widest"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function CalculatorIcon({ size = 24 }: { size?: number }) {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    >
      <rect x="4" y="2" width="16" height="20" rx="2" />
      <line x1="8" y1="6" x2="16" y2="6" />
      <line x1="16" y1="14" x2="16" y2="18" />
      <path d="M16 10h.01" />
      <path d="M12 10h.01" />
      <path d="M8 10h.01" />
      <path d="M12 14h.01" />
      <path d="M8 14h.01" />
      <path d="M12 18h.01" />
      <path d="M8 18h.01" />
    </svg>
  );
}

