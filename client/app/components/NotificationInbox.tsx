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

// ── Utility to strip HTML tags ─────────────────────────────────────────────
function stripHtml(html: string) {
  if (!html) return "";
  // First remove the head/style tags and their content if they exist
  const doc = html.replace(/<head[\s\S]*?<\/head>/gi, "")
                  .replace(/<style[\s\S]*?<\/style>/gi, "");
  // Then strip all remaining tags
  return doc.replace(/<[^>]*>?/gm, " ").replace(/\s+/g, " ").trim();
}

// ── Per-event icon mapping ─────────────────────────────────────────────────
function getEventIcon(eventType?: EmailEventType) {
  switch (eventType) {
    case 'USER_LOGIN':
    case 'USER_REGISTERED':
    case 'NEW_USER_ACCOUNT':
      return <User size={14} className="text-[#CB7A62]" />;

    case 'RFQ_INVITATION':
    case 'RFQ_MAGIC_LINK':
      return <Send size={14} className="text-teal-400" />;

    case 'QUOTATION_RECEIVED':
      return <FileText size={14} className="text-[#CB7A62]" />;

    case 'PO_APPROVAL_REQUEST':
      return <FileCheck size={14} className="text-black" />;

    case 'PO_APPROVED':
    case 'PO_CONFIRM_LINK':
      return <BadgeCheck size={14} className="text-black" />;

    case 'PR_APPROVED':
      return <CheckCircle size={14} className="text-black" />;

    case 'PR_REJECTED':
      return <XCircle size={14} className="text-black" />;

    case 'PR_APPROVAL_LINK':
      return <FileText size={14} className="text-violet-400" />;

    case 'GRN_CONFIRMED':
    case 'GRN_MILESTONE_UPDATE':
      return <Package size={14} className="text-teal-400" />;

    case 'INVOICE_RECEIVED':
    case 'INVOICE_SUBMIT_LINK':
      return <Receipt size={14} className="text-[#CB7A62]" />;

    case 'PAYMENT_CONFIRMED':
      return <BadgeCheck size={14} className="text-black" />;

    case 'CONTRACT_EXPIRY_WARNING':
    case 'BUDGET_LIMIT_WARNING':
      return <ShieldAlert size={14} className="text-black" />;

    default:
      return <AlertCircle size={14} className="text-black" />;
  }
}

function getIconContainerClass(eventType?: EmailEventType, isPending?: boolean): string {
  if (!isPending) return "bg-[#FFFFFF] border-[rgba(240,246,252,0.05)]";
  if (!eventType) return "bg-[#B4533A]/10 border-[#B4533A]/20";

  const cfg = EVENT_DISPLAY_CONFIG[eventType];
  if (!cfg) return "bg-gray-100 border-gray-200";
  
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
      content: stripHtml(n.body),
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
            ? "bg-[#B4533A] border-[#B4533A] text-[#000000] shadow-lg shadow-[#B4533A]/20"
            : "bg-[#FFFFFF] border-[rgba(240,246,252,0.08)] text-[#000000] hover:text-[#000000] hover:border-[rgba(240,246,252,0.18)]"
        }`}
      >
        <Bell size={14} className={unreadCount > 0 ? "animate-pulse" : ""} />
        {unreadCount > 0 && (
          <span className="absolute -top-1.5 -right-1.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-rose-500 px-1 text-[9px] font-black text-white ring-2 ring-white">
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-3 w-[420px] bg-[#FAF8F5] border border-[rgba(240,246,252,0.1)] rounded-2xl shadow-2xl shadow-black/80 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-300">
          {/* Header */}
          <div className="p-4 bg-[#111827] border-b border-white/5 shadow-xl relative overflow-hidden">
            {/* Background decoration */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-[#B4533A]/10 blur-[50px] -mr-10 -mt-10" />
            
            <div className="flex items-center justify-between mb-4 relative z-10">
              <div>
                <h3 className="text-sm font-bold tracking-tight flex items-center gap-2" style={{ color: '#FFFFFF' }}>
                  <Inbox size={16} className="text-[#B4533A]" /> Inbox Hệ thống
                </h3>
                <p className="text-[10px] font-medium mt-0.5" style={{ color: '#D1D5DB' }}>
                  Bạn có {unreadCount} thông báo chưa xử lý
                </p>
              </div>
              <div className="flex bg-white/5 p-1 rounded-xl border border-white/10 backdrop-blur-sm">
                {(['PENDING', 'ALL', 'APPROVED'] as const).map((f) => (
                    <button
                      key={f}
                      onClick={() => setFilter(f)}
                      className={`px-3 py-1.5 rounded-lg text-[9px] font-bold transition-all duration-200 ${
                        filter === f
                          ? "bg-[#B4533A] text-white shadow-lg shadow-[#B4533A]/20"
                          : "text-gray-400 hover:text-white hover:bg-white/5"
                      }`}
                    >
                      {f === 'PENDING' ? 'MỚI' : f === 'ALL' ? 'TẤT CẢ' : 'ĐÃ XEM'}
                    </button>
                ))}
              </div>
            </div>

            <div className="relative z-10">
              <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm kiếm thông báo..."
                className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-4 py-2 text-[10px] text-white placeholder:text-gray-500 outline-none focus:border-[#B4533A]/50 focus:ring-1 focus:ring-[#B4533A]/50 transition-all backdrop-blur-sm"
              />
            </div>
          </div>

          {/* Notification List */}
          <div className="max-h-[480px] overflow-y-auto custom-scrollbar bg-[#FFFFFF]/30">
            {isLoading ? (
              <div className="p-16 text-center">
                <div className="w-8 h-8 border-2 border-[#B4533A] border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
                <p className="text-[11px] text-[#000000] font-medium tracking-widest uppercase">Đang đồng bộ dữ liệu...</p>
              </div>
            ) : mergedItems.length > 0 ? (
              mergedItems.map((item) => <NotificationItem key={item.id} item={item} />)
            ) : (
              <div className="py-20 px-10 text-center">
                <div className="w-16 h-16 bg-[#FFFFFF] rounded-3xl flex items-center justify-center mx-auto mb-6 border border-[rgba(240,246,252,0.05)] shadow-xl">
                  <Archive size={24} className="text-[#000000]" />
                </div>
                <h4 className="text-[12px] font-black text-[#000000] uppercase tracking-widest">Hộp thư sạch sẽ</h4>
                <p className="text-[10px] text-[#000000] mt-2 font-medium">Tuyệt vời! Bạn không bỏ lỡ thông báo nào.</p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-3 border-t border-[rgba(240,246,252,0.05)] bg-[#FAF8F5]/50 flex justify-center">
            <button className="text-[10px] font-bold text-[#B4533A] hover:text-[#CB7A62] flex items-center gap-1.5 transition-all group">
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
    : isPending ? 'text-[#B4533A]' : 'text-[#000000]';

  return (
    <div className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-all relative group overflow-hidden ${!isPending ? 'opacity-60 grayscale-[0.5]' : ''}`}>
      {isPending && (
        <div
          className="absolute left-0 top-0 bottom-0 w-[3px]"
          style={{ 
            backgroundColor: cfg?.accentHex ?? '#B4533A', 
            boxShadow: `2px 0 10px ${cfg?.accentHex ?? '#B4533A'}44` 
          }}
        />
      )}

      <div className="flex items-start gap-4">
        <div className={`mt-1 h-10 w-10 rounded-xl flex items-center justify-center border shrink-0 transition-all duration-300 group-hover:shadow-md ${getIconContainerClass(eventType, isPending)}`}>
          {getEventIcon(eventType)}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-start gap-2 mb-1">
            <span className={`text-[9px] font-bold uppercase tracking-wider ${typeLabelColorClass}`}>
              {getTypeLabel()}
            </span>
            <span className="text-[9px] text-gray-500 font-medium whitespace-nowrap bg-gray-100 px-2 py-0.5 rounded-full border border-gray-200">
              {new Date(item.deadline).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>

          <h4 className={`text-[13px] font-bold truncate mb-1 leading-tight text-gray-900`}>
            {item.title}
          </h4>

          <p className="text-[11px] text-gray-600 font-medium line-clamp-2 mb-3 leading-relaxed">
            {item.content}
          </p>

          <div className="flex items-center justify-between">
            <div className="flex items-baseline gap-2">
              {item.amount && (
                <span className="text-[12px] font-bold text-[#B4533A] tracking-tight">{item.amount}</span>
              )}
              <span className="text-[9px] text-gray-500 font-semibold uppercase truncate max-w-[120px]">
                {item.requester}
              </span>
            </div>

            <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-all translate-x-2 group-hover:translate-x-0">
              {item.isNotification ? (
                <button className="h-7 px-4 rounded-lg bg-white text-gray-700 border border-gray-200 text-[10px] font-bold uppercase tracking-wider hover:bg-gray-50 hover:border-gray-300 transition-all shadow-sm">
                  Chi tiết
                </button>
              ) : (
                <button className="h-7 px-4 rounded-lg bg-[#111827] text-white text-[10px] font-bold uppercase tracking-wider hover:bg-black transition-all shadow-md">
                  Xử lý
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

