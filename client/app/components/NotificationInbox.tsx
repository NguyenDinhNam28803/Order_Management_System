"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  CheckCircle, XCircle, Clock, AlertCircle, ChevronRight,
  Inbox, Archive, AlertTriangle, User,
  FileText, Search, Bell, Package, Receipt, ShieldAlert,
  Send, BadgeCheck, FileCheck
} from "lucide-react";
import { useProcurement } from "../context/ProcurementContext";
import Cookies from 'js-cookie';
import { getStatusLabel, formatVND } from "../utils/formatUtils";
import { EmailEventType, EVENT_DISPLAY_CONFIG } from "../types/notification-types";
import { useSocketIO, NotificationPayload as SocketNotification } from "../hooks/useSocketIO";

// ── Per-event icon mapping ─────────────────────────────────────────────────
function getEventIcon(eventType?: EmailEventType) {
  switch (eventType) {
    case 'USER_LOGIN':
    case 'USER_REGISTERED':
    case 'NEW_USER_ACCOUNT':
      return <User size={14} className="text-blue-400" />;

    case 'RFQ_INVITATION':
    case 'RFQ_MAGIC_LINK':
      return <Send size={14} className="text-teal-400" />;

    case 'QUOTATION_RECEIVED':
      return <FileText size={14} className="text-blue-400" />;

    case 'PO_APPROVAL_REQUEST':
      return <FileCheck size={14} className="text-amber-400" />;

    case 'PO_APPROVED':
    case 'PO_CONFIRM_LINK':
      return <BadgeCheck size={14} className="text-emerald-400" />;

    case 'PR_APPROVED':
      return <CheckCircle size={14} className="text-emerald-400" />;

    case 'PR_REJECTED':
      return <XCircle size={14} className="text-rose-400" />;

    case 'PR_APPROVAL_LINK':
      return <FileText size={14} className="text-violet-400" />;

    case 'GRN_CONFIRMED':
    case 'GRN_MILESTONE_UPDATE':
      return <Package size={14} className="text-teal-400" />;

    case 'INVOICE_RECEIVED':
    case 'INVOICE_SUBMIT_LINK':
      return <Receipt size={14} className="text-blue-400" />;

    case 'PAYMENT_CONFIRMED':
      return <BadgeCheck size={14} className="text-emerald-400" />;

    case 'CONTRACT_EXPIRY_WARNING':
    case 'BUDGET_LIMIT_WARNING':
      return <ShieldAlert size={14} className="text-amber-400" />;

    default:
      return <AlertCircle size={14} className="text-slate-400" />;
  }
}

function getIconContainerClass(eventType?: EmailEventType, isPending?: boolean): string {
  if (!isPending) return "bg-[#21262D] border-[rgba(240,246,252,0.05)]";
  if (!eventType) return "bg-[#3B82F6]/10 border-[#3B82F6]/20";

  const cfg = EVENT_DISPLAY_CONFIG[eventType];
  return `${cfg.bgClass} ${cfg.borderClass}`;
}

export default function NotificationInbox() {
  const { currentUser, apiFetch, refreshData, prs, myPrs, approvals } = useProcurement();
  const [isOpen, setIsOpen] = useState(false);
  const [filter, setFilter] = useState<'PENDING' | 'ALL' | 'APPROVED'>('PENDING');
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [notifications, setNotifications] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Lấy JWT token từ cookie để authenticate socket
  const token = Cookies.get('token') ?? null;

  // Realtime: khi server push notification:new → prepend vào list ngay
  const handleRealtimeNotification = useCallback((data: SocketNotification) => {
    setNotifications(prev => {
      // Tránh trùng nếu đã có (vd: fetch thủ công chạy song song)
      if (prev.some(n => n.id === data.id)) return prev;
      return [{ ...data, status: 'QUEUED' }, ...prev];
    });
  }, []);

  useSocketIO({
    token,
    onNotification: handleRealtimeNotification,
  });

  const fetchNotifications = useCallback(async () => {
    if (!currentUser?.id) return;
    setIsLoading(true);
    try {
      const response = await apiFetch(`/notifications/recipient/${currentUser.id}`);
      if (response.ok) {
        const res = await response.json();
        const data = res.data || res;
        setNotifications(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error("Failed to fetch notifications:", err);
    } finally {
      setIsLoading(false);
    }
  }, [currentUser?.id, apiFetch]);

  useEffect(() => {
    if (currentUser?.id) {
      fetchNotifications();
      refreshData();
    }
  }, [currentUser?.id, fetchNotifications, refreshData]);

  useEffect(() => {
    if (isOpen) {
      fetchNotifications();
      refreshData();
    }
  }, [isOpen, fetchNotifications, refreshData]);

  const mergedItems = useMemo(() => {
    // ── Email notifications from DB ──────────────────────────────────────
    const mappedNotifs = notifications.map(n => ({
      id: n.id,
      eventType: n.eventType as EmailEventType | undefined,
      type: n.referenceType || 'SYSTEM',
      title: n.subject || 'Thông báo hệ thống',
      content: n.body,
      requester: 'Hệ thống',
      amount: null as string | null,
      status: (n.status === 'READ' || n.status === 'DELIVERED') ? 'APPROVED' : 'PENDING',
      deadline: n.createdAt,
      referenceId: n.referenceId,
      isNotification: true,
    }));

    // ── Pending approvals ────────────────────────────────────────────────
    const mappedApprovals = (approvals || []).map(app => {
      const pr = prs.find(p => p.id === app.documentId);
      return {
        id: app.id,
        eventType: undefined as EmailEventType | undefined,
        type: app.documentType,
        title: pr?.title || `Phê duyệt ${app.documentType}`,
        content: `Yêu cầu phê duyệt cho ${app.documentType} #${app.documentId.substring(0, 8)}`,
        requester: pr?.requester?.fullName || 'Hệ thống',
        amount: pr?.totalEstimate ? formatVND(pr.totalEstimate, true) : 'N/A',
        status: 'PENDING',
        deadline: app.createdAt,
        referenceId: app.documentId,
        isNotification: false,
      };
    });

    // ── My PR status updates ─────────────────────────────────────────────
    const mappedMyPrs = (myPrs || [])
      .filter(pr => pr.status !== 'DRAFT')
      .map(pr => ({
        id: pr.id,
        eventType: (pr.status === 'APPROVED' ? 'PR_APPROVED' : pr.status === 'REJECTED' ? 'PR_REJECTED' : undefined) as EmailEventType | undefined,
        type: 'PURCHASE_REQUISITION',
        title: pr.title || `PR #${pr.prNumber}`,
        content: `Trạng thái: ${getStatusLabel(pr.status)}`,
        requester: 'Của tôi',
        amount: formatVND(pr.totalEstimate, true),
        status: pr.status === 'APPROVED' ? 'APPROVED' : 'PENDING',
        deadline: pr.createdAt,
        referenceId: pr.id,
        isNotification: false,
        isStatusUpdate: true,
      }));

    const combined = [...mappedNotifs, ...mappedApprovals, ...mappedMyPrs];

    const filtered = combined.filter(i => {
      const matchesSearch =
        i.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        i.requester.toLowerCase().includes(searchQuery.toLowerCase()) ||
        i.content.toLowerCase().includes(searchQuery.toLowerCase());

      if (filter === 'PENDING') return matchesSearch && i.status === 'PENDING';
      if (filter === 'APPROVED') return matchesSearch && (i.status === 'APPROVED' || i.status === 'READ');
      return matchesSearch;
    });

    return filtered.sort((a, b) => new Date(b.deadline).getTime() - new Date(a.deadline).getTime());
  }, [notifications, approvals, prs, myPrs, filter, searchQuery]);

  const unreadCount = mergedItems.filter(i => i.status === 'PENDING').length;

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`relative flex items-center justify-center w-8 h-8 rounded-lg border transition-all duration-300 ${
          isOpen
            ? "bg-[#3B82F6] border-[#3B82F6] text-white shadow-lg shadow-[#3B82F6]/20"
            : "bg-[#21262D] border-[rgba(240,246,252,0.08)] text-[#8B949E] hover:text-[#E6EDF3] hover:border-[rgba(240,246,252,0.18)]"
        }`}
      >
        <Bell size={14} className={unreadCount > 0 ? "animate-pulse" : ""} />
        {unreadCount > 0 && (
          <span className="absolute -top-1.5 -right-1.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-rose-500 px-1 text-[9px] font-black text-white ring-2 ring-[#0D1117]">
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-3 w-[420px] bg-[#161B22] border border-[rgba(240,246,252,0.1)] rounded-2xl shadow-2xl shadow-black/80 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-300">
          {/* Header */}
          <div className="p-4 bg-gradient-to-r from-[#1F2937] to-[#111827] border-b border-[rgba(240,246,252,0.05)]">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-[#E6EDF3] tracking-tight flex items-center gap-2">
                  <Inbox size={16} className="text-[#3B82F6]" /> Inbox Hệ thống
                </h3>
                <p className="text-[10px] text-[#8B949E] font-medium mt-0.5">
                  Bạn có {unreadCount} thông báo chưa xử lý
                </p>
              </div>
              <div className="flex bg-[#0D1117] p-1 rounded-lg border border-[rgba(240,246,252,0.05)]">
                {(['PENDING', 'ALL', 'APPROVED'] as const).map((f) => (
                  <button
                    key={f}
                    onClick={() => setFilter(f)}
                    className={`px-3 py-1 rounded-md text-[9px] font-bold transition-all ${
                      filter === f
                        ? "bg-[#3B82F6] text-white shadow-sm"
                        : "text-[#8B949E] hover:text-[#E6EDF3]"
                    }`}
                  >
                    {f === 'PENDING' ? 'MỚI' : f === 'ALL' ? 'TẤT CẢ' : 'ĐÃ XEM'}
                  </button>
                ))}
              </div>
            </div>

            <div className="relative">
              <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#484F58]" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm kiếm thông báo..."
                className="w-full bg-[#0D1117] border border-[rgba(240,246,252,0.05)] rounded-lg pl-9 pr-4 py-1.5 text-[10px] text-[#E6EDF3] placeholder:text-[#484F58] outline-none focus:border-[#3B82F6]/30 transition-all"
              />
            </div>
          </div>

          {/* Notification List */}
          <div className="max-h-[480px] overflow-y-auto custom-scrollbar bg-[#0D1117]/30">
            {isLoading ? (
              <div className="p-16 text-center">
                <div className="w-8 h-8 border-2 border-[#3B82F6] border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
                <p className="text-[11px] text-[#484F58] font-medium tracking-widest uppercase">Đang đồng bộ dữ liệu...</p>
              </div>
            ) : mergedItems.length > 0 ? (
              mergedItems.map((item) => <NotificationItem key={item.id} item={item} />)
            ) : (
              <div className="py-20 px-10 text-center">
                <div className="w-16 h-16 bg-[#21262D] rounded-3xl flex items-center justify-center mx-auto mb-6 border border-[rgba(240,246,252,0.05)] shadow-xl">
                  <Archive size={24} className="text-[#30363D]" />
                </div>
                <h4 className="text-[12px] font-black text-[#484F58] uppercase tracking-widest">Hộp thư sạch sẽ</h4>
                <p className="text-[10px] text-[#30363D] mt-2 font-medium">Tuyệt vời! Bạn không bỏ lỡ thông báo nào.</p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-3 border-t border-[rgba(240,246,252,0.05)] bg-[#161B22]/50 flex justify-center">
            <button className="text-[10px] font-bold text-[#3B82F6] hover:text-[#60A5FA] flex items-center gap-1.5 transition-all group">
              Xem tất cả thông báo hệ thống <ChevronRight size={12} className="group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Notification Item ──────────────────────────────────────────────────────
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const NotificationItem = ({ item }: { item: any }) => {
  const isPending = item.status === 'PENDING';
  const eventType = item.eventType as EmailEventType | undefined;
  const cfg = eventType ? EVENT_DISPLAY_CONFIG[eventType] : null;

  const accentStyle = isPending && cfg
    ? { borderLeftColor: cfg.accentHex, boxShadow: `0 0 12px ${cfg.accentHex}33` }
    : {};

  const getTypeLabel = () => {
    if (cfg) return cfg.label;
    if (item.isStatusUpdate) return 'Trạng thái PR';
    if (!item.isNotification) return item.type.replace(/_/g, ' ');
    return 'Thông báo';
  };

  const typeLabelColorClass = cfg
    ? cfg.colorClass
    : isPending ? 'text-[#3B82F6]' : 'text-[#8B949E]';

  return (
    <div className={`p-4 border-b border-[rgba(240,246,252,0.03)] cursor-pointer hover:bg-[#21262D]/60 transition-all relative group overflow-hidden ${!isPending ? 'opacity-50' : ''}`}>
      {isPending && (
        <div
          className="absolute left-0 top-0 bottom-0 w-[3px]"
          style={{ backgroundColor: cfg?.accentHex ?? '#3B82F6', boxShadow: `0 0 10px ${cfg?.accentHex ?? '#3B82F6'}66`, ...accentStyle }}
        />
      )}

      <div className="flex items-start gap-4">
        <div className={`mt-1 h-9 w-9 rounded-2xl flex items-center justify-center border shrink-0 transition-all duration-300 group-hover:rotate-12 group-hover:scale-110 ${getIconContainerClass(eventType, isPending)}`}>
          {getEventIcon(eventType)}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-start gap-2 mb-1.5">
            <span className={`text-[9.5px] font-black uppercase tracking-[0.1em] truncate ${typeLabelColorClass}`}>
              {getTypeLabel()}
            </span>
            <span className="text-[9px] text-[#484F58] font-bold whitespace-nowrap bg-[#0D1117] px-1.5 py-0.5 rounded border border-[rgba(240,246,252,0.03)]">
              {new Date(item.deadline).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>

          <h4 className={`text-[12px] font-bold truncate mb-1 leading-tight ${isPending ? "text-[#E6EDF3]" : "text-[#8B949E]"}`}>
            {item.title}
          </h4>

          <p className="text-[10.5px] text-[#8B949E] font-medium line-clamp-2 mb-2 leading-relaxed opacity-80">
            {item.content}
          </p>

          <div className="flex items-center justify-between mt-auto">
            <div className="flex items-baseline gap-2">
              {item.amount && (
                <span className="text-[12px] font-black text-[#E6EDF3] tracking-tight">{item.amount}</span>
              )}
              <span className="text-[9px] text-[#484F58] font-bold uppercase truncate max-w-[120px]">
                {item.requester}
              </span>
            </div>

            <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-all translate-x-2 group-hover:translate-x-0">
              {item.isNotification ? (
                <button className="h-6 px-3 rounded-lg bg-[#21262D] text-[#E6EDF3] border border-[rgba(240,246,252,0.1)] text-[9px] font-black uppercase tracking-widest hover:border-[#3B82F6]/50 transition-all">
                  XEM
                </button>
              ) : (
                <button className="h-6 px-3 rounded-lg bg-[#3B82F6] text-white text-[9px] font-black uppercase tracking-widest hover:bg-[#2563EB] transition-all shadow-lg shadow-[#3B82F6]/20">
                  XỬ LÝ
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
