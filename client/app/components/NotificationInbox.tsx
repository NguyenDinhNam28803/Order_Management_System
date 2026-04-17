"use client";

import React, { useState, useEffect } from "react";
import { 
  CheckCircle, XCircle, Clock, AlertCircle, ChevronRight, 
  Filter, Inbox, Archive, AlertTriangle, User, DollarSign,
  ShoppingCart, FileText, MoreHorizontal, Search
} from "lucide-react";
import { useProcurement } from "../context/ProcurementContext";
import { getStatusLabel } from "../utils/formatUtils";

interface ApprovalItem {
  id: string;
  type: "PR" | "PO" | "INVOICE" | "PAYMENT";
  title: string;
  requester: string;
  department: string;
  amount: number;
  status: "PENDING" | "URGENT" | "OVERDUE";
  deadline: string;
  submittedAt: string;
  priority: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
}

const mockApprovals: ApprovalItem[] = [
  {
    id: "PR-2024-001",
    type: "PR",
    title: "Yêu cầu mua văn phòng phẩm Q1",
    requester: "Nguyễn Văn A",
    department: "IT Department",
    amount: 50000000,
    status: "PENDING",
    deadline: "2024-03-15",
    submittedAt: "2024-03-10",
    priority: "MEDIUM"
  },
  {
    id: "PO-2024-089",
    type: "PO",
    title: "Đơn đặt hàng thiết bị máy chủ",
    requester: "Trần Thị B",
    department: "Infrastructure",
    amount: 250000000,
    status: "URGENT",
    deadline: "2024-03-12",
    submittedAt: "2024-03-08",
    priority: "HIGH"
  },
  {
    id: "INV-2024-045",
    type: "INVOICE",
    title: "Hóa đơn dịch vụ cloud AWS",
    requester: "Lê Văn C",
    department: "DevOps",
    amount: 125000000,
    status: "OVERDUE",
    deadline: "2024-03-05",
    submittedAt: "2024-03-01",
    priority: "CRITICAL"
  }
];

export default function NotificationInbox() {
  const [isOpen, setIsOpen] = useState(false);
  const [filter, setFilter] = useState<"ALL" | "PENDING" | "APPROVED" | "REJECTED">("PENDING");
  const [approvals, setApprovals] = useState<ApprovalItem[]>(mockApprovals);
  const [selectedItem, setSelectedItem] = useState<ApprovalItem | null>(null);
  const { notify } = useProcurement();

  const pendingCount = approvals.filter(a => a.status === "PENDING" || a.status === "URGENT").length;
  const urgentCount = approvals.filter(a => a.status === "URGENT" || a.status === "OVERDUE").length;

  const handleApprove = (id: string) => {
    notify(`Đã phê duyệt ${id}`, "success");
    setApprovals(prev => prev.filter(a => a.id !== id));
  };

  const handleReject = (id: string) => {
    notify(`Đã từ chối ${id}`, "warning");
    setApprovals(prev => prev.filter(a => a.id !== id));
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "URGENT": return <AlertCircle size={16} className="text-rose-400" />;
      case "OVERDUE": return <AlertTriangle size={16} className="text-amber-400" />;
      default: return <Clock size={16} className="text-blue-400" />;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "PR": return <FileText size={14} className="text-violet-400" />;
      case "PO": return <ShoppingCart size={14} className="text-emerald-400" />;
      case "INVOICE": return <DollarSign size={14} className="text-amber-400" />;
      default: return <FileText size={14} />;
    }
  };

  const filteredApprovals = approvals.filter(a => {
    if (filter === "ALL") return true;
    if (filter === "PENDING") return a.status === "PENDING" || a.status === "URGENT" || a.status === "OVERDUE";
    return true;
  });

  return (
    <>
      {/* Inbox Trigger Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="relative flex items-center justify-center w-9 h-9 rounded-lg bg-[#161922] border border-[rgba(148,163,184,0.1)] text-[#94A3B8] hover:text-[#3B82F6] hover:border-[rgba(59,130,246,0.3)] transition-all duration-200"
      >
        <Inbox size={16} />
      </button>

      {/* Inbox Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-end pt-16 pr-4">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setIsOpen(false)}
          />
          
          {/* Inbox Panel */}
          <div className="relative w-[480px] max-h-[80vh] !bg-[#1a1d26] border border-[rgba(148,163,184,0.25)] rounded-2xl shadow-2xl shadow-black/90 overflow-hidden animate-slide-in z-50">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-[rgba(148,163,184,0.1)]">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-br from-[#3B82F6] to-[#8B5CF6] rounded-lg">
                  <Inbox size={18} className="text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-[#F8FAFC]">Approval Inbox</h3>
                  <p className="text-xs text-[#64748B]">{pendingCount} chờ duyệt • {urgentCount} khẩn cấp</p>
                </div>
              </div>
              <button 
                onClick={() => setIsOpen(false)}
                className="p-2 hover:bg-[rgba(148,163,184,0.1)] rounded-lg transition-colors"
              >
                <XCircle size={20} className="text-[#64748B]" />
              </button>
            </div>

            {/* Filter Tabs */}
            <div className="flex gap-1 p-3 border-b border-[rgba(148,163,184,0.1)]">
              {(["PENDING", "ALL", "APPROVED"] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                    filter === f 
                      ? "bg-[rgba(59,130,246,0.15)] text-[#3B82F6] border border-[rgba(59,130,246,0.3)]" 
                      : "text-[#64748B] hover:text-[#94A3B8] hover:bg-[rgba(148,163,184,0.05)]"
                  }`}
                >
                  {f === "ALL" ? "Tất cả" : getStatusLabel(f)}
                </button>
              ))}
            </div>

            {/* Search */}
            <div className="p-3 border-b border-[rgba(148,163,184,0.1)]">
              <div className="relative">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#64748B]" />
                <input
                  type="text"
                  placeholder="Tìm theo ID, người yêu cầu..."
                  className="glass-input w-full pl-10"
                />
              </div>
            </div>

            {/* Approval List */}
            <div className="max-h-[50vh] overflow-y-auto">
              {filteredApprovals.length === 0 ? (
                <div className="p-8 text-center">
                  <Archive size={48} className="mx-auto mb-3 text-[#64748B] opacity-50" />
                  <p className="text-sm text-[#64748B]">Không có yêu cầu nào</p>
                </div>
              ) : (
                filteredApprovals.map((item) => (
                  <div
                    key={item.id}
                    className="group p-4 border-b border-[rgba(148,163,184,0.05)] hover:bg-[rgba(59,130,246,0.05)] transition-colors cursor-pointer"
                    onClick={() => setSelectedItem(item)}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="status-pill status-info">
                          {getTypeIcon(item.type)} {item.type}
                        </span>
                        <span className="font-mono text-xs text-[#64748B]">{item.id}</span>
                      </div>
                      {getStatusIcon(item.status)}
                    </div>
                    
                    <h4 className="font-semibold text-[#F8FAFC] mb-1">{item.title}</h4>
                    
                    <div className="flex items-center gap-4 text-xs text-[#94A3B8] mb-3">
                      <span className="flex items-center gap-1">
                        <User size={12} /> {item.requester}
                      </span>
                      <span>{item.department}</span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="font-bold text-emerald-400">
                          {item.amount.toLocaleString("vi-VN")} ₫
                        </span>
                        <span className="text-xs text-[#64748B]">
                          Deadline: {new Date(item.deadline).toLocaleDateString("vi-VN")}
                        </span>
                      </div>
                      
                      {/* Quick Actions */}
                      <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleApprove(item.id);
                          }}
                          className="p-1.5 bg-emerald-500/20 text-emerald-400 rounded-lg hover:bg-emerald-500/30 transition-colors"
                          title="Phê duyệt"
                        >
                          <CheckCircle size={16} />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleReject(item.id);
                          }}
                          className="p-1.5 bg-rose-500/20 text-rose-400 rounded-lg hover:bg-rose-500/30 transition-colors"
                          title="Từ chối"
                        >
                          <XCircle size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Footer */}
            <div className="p-3 border-t border-[rgba(148,163,184,0.1)] bg-[rgba(22,25,34,0.5)]">
              <button className="w-full py-2 text-xs font-semibold text-[#64748B] hover:text-[#94A3B8] transition-colors flex items-center justify-center gap-2">
                Xem tất cả <ChevronRight size={14} />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
