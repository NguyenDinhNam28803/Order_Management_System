"use client";

import { useState, useMemo } from "react";
import DOMPurify from "dompurify";
import { 
  EmailEventType, 
  TemplateData,
  RFQMagicLinkData,
  PRApprovalLinkData,
  POConfirmLinkData,
  GrnMilestoneUpdateData,
  InvoiceSubmitLinkData,
  PaymentConfirmedData
} from "../types/notification-types";
import { previewTemplate, getTemplateConfig, renderTemplate } from "../services/notificationService";
import { 
  Mail, 
  Eye, 
  Send, 
  MessageSquare, 
  FileCheck, 
  ShoppingCart, 
  Truck, 
  Receipt, 
  CreditCard,
  X,
  ChevronDown,
  ChevronUp,
  Loader2
} from "lucide-react";

interface NotificationTemplatePreviewProps {
  eventType: EmailEventType;
  data: TemplateData;
  recipientEmail?: string;
  onSend?: () => void;
  className?: string;
}

const iconMap: Record<string, React.ComponentType<{ size?: number; className?: string }>> = {
  MessageSquare,
  FileCheck,
  ShoppingCart,
  Truck,
  Receipt,
  CreditCard,
  Mail,
};

export default function NotificationTemplatePreview({
  eventType,
  data,
  recipientEmail,
  onSend,
  className = "",
}: NotificationTemplatePreviewProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [serverPreview, setServerPreview] = useState<{ subject: string; html: string } | null>(null);
  const [showServerPreview, setShowServerPreview] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const config = getTemplateConfig(eventType);
  const clientPreview = previewTemplate(eventType, data);
  const Icon = iconMap[config.icon] || Mail;

  const loadServerPreview = async () => {
    if (serverPreview) {
      setShowServerPreview(!showServerPreview);
      return;
    }

    setIsLoading(true);
    setError(null);
    
    try {
      const result = await renderTemplate(eventType, data);
      setServerPreview(result);
      setShowServerPreview(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load preview');
    } finally {
      setIsLoading(false);
    }
  };

  const rawPreview = showServerPreview && serverPreview ? serverPreview : clientPreview;
  const displayPreview = useMemo(() => ({
    ...rawPreview,
    html: typeof window !== "undefined"
      ? DOMPurify.sanitize(rawPreview.html, { USE_PROFILES: { html: true } })
      : rawPreview.html,
  }), [rawPreview]);

  return (
    <div className={`bg-[#161922] rounded-xl border border-[rgba(148,163,184,0.1)] overflow-hidden ${className}`}>
      {/* Header */}
      <div 
        className="px-4 py-3 flex items-center justify-between cursor-pointer hover:bg-[#0F1117] transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-3">
          <div 
            className="w-10 h-10 rounded-lg flex items-center justify-center"
            style={{ backgroundColor: `${config.color}20`, color: config.color }}
          >
            <Icon size={20} />
          </div>
          <div>
            <h3 className="font-medium text-[#F8FAFC]">{config.name}</h3>
            <p className="text-sm text-[#64748B]">{config.description}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {recipientEmail && (
            <span className="text-sm text-[#64748B] mr-2">
              Gửi đến: {recipientEmail}
            </span>
          )}
          {isExpanded ? <ChevronUp size={20} className="text-[#64748B]" /> : <ChevronDown size={20} className="text-[#64748B]" />}
        </div>
      </div>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="border-t border-[rgba(148,163,184,0.1)] bg-[#0F1117]">
          {/* Action Bar */}
          <div className="px-4 py-3 bg-[#161922] border-b border-[rgba(148,163,184,0.1)] flex items-center gap-2">
            <button
              onClick={(e) => { e.stopPropagation(); loadServerPreview(); }}
              disabled={isLoading}
              className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-[#94A3B8] bg-[#0F1117] border border-[rgba(148,163,184,0.2)] rounded-lg hover:bg-[#3B82F6]/10 hover:text-[#F8FAFC] hover:border-[#3B82F6]/50 disabled:opacity-50 transition-all"
            >
              {isLoading ? <Loader2 size={14} className="animate-spin" /> : <Eye size={14} />}
              {showServerPreview ? 'Ẩn xem trước' : 'Xem trước từ server'}
            </button>
            
            {onSend && (
              <button
                onClick={(e) => { e.stopPropagation(); onSend(); }}
                className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-[#F8FAFC] bg-gradient-to-r from-[#3B82F6] to-[#60A5FA] rounded-lg hover:shadow-lg hover:shadow-[#3B82F6]/30 transition-all"
              >
                <Send size={14} />
                Gửi email
              </button>
            )}

            {showServerPreview && (
              <span className="text-xs text-[#4ADE80] ml-auto">
                ✓ Đã tải từ server
              </span>
            )}
          </div>

          {error && (
            <div className="px-4 py-2 bg-red-500/10 border-b border-red-500/20 text-red-400 text-sm">
              {error}
            </div>
          )}

          {/* Email Preview */}
          <div className="p-4 bg-[#0A0A0A]">
            <div className="bg-[#1A1A1A] rounded-lg border border-[rgba(148,163,184,0.1)] overflow-hidden">
              {/* Email Subject */}
              <div className="px-4 py-3 border-b border-[rgba(148,163,184,0.1)] bg-[#161922]">
                <span className="text-sm text-[#64748B]">Subject: </span>
                <span className="text-sm font-medium text-[#F8FAFC]">{displayPreview.subject}</span>
              </div>
              
              {/* Email Body */}
              <div 
                className="p-4 max-h-96 overflow-y-auto bg-[#0F1117]"
                dangerouslySetInnerHTML={{ __html: displayPreview.html }}
              />
            </div>
          </div>

          {/* Data Preview */}
          <div className="px-4 py-3 border-t border-[rgba(148,163,184,0.1)]">
            <h4 className="text-sm font-medium text-[#94A3B8] mb-2">Dữ liệu template:</h4>
            <pre className="text-xs text-[#60A5FA] bg-[#0F1117] p-3 rounded-lg overflow-x-auto border border-[rgba(148,163,184,0.1)]">
              {JSON.stringify(data, null, 2)}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}

// Pre-configured templates for common use cases
export function RFQMagicLinkPreview(props: Omit<NotificationTemplatePreviewProps, 'eventType' | 'data'> & { data: RFQMagicLinkData }) {
  return <NotificationTemplatePreview {...props} eventType="RFQ_MAGIC_LINK" data={props.data} />;
}

export function PRApprovalLinkPreview(props: Omit<NotificationTemplatePreviewProps, 'eventType' | 'data'> & { data: PRApprovalLinkData }) {
  return <NotificationTemplatePreview {...props} eventType="PR_APPROVAL_LINK" data={props.data} />;
}

export function POConfirmLinkPreview(props: Omit<NotificationTemplatePreviewProps, 'eventType' | 'data'> & { data: POConfirmLinkData }) {
  return <NotificationTemplatePreview {...props} eventType="PO_CONFIRM_LINK" data={props.data} />;
}

export function GrnMilestoneUpdatePreview(props: Omit<NotificationTemplatePreviewProps, 'eventType' | 'data'> & { data: GrnMilestoneUpdateData }) {
  return <NotificationTemplatePreview {...props} eventType="GRN_MILESTONE_UPDATE" data={props.data} />;
}

export function InvoiceSubmitLinkPreview(props: Omit<NotificationTemplatePreviewProps, 'eventType' | 'data'> & { data: InvoiceSubmitLinkData }) {
  return <NotificationTemplatePreview {...props} eventType="INVOICE_SUBMIT_LINK" data={props.data} />;
}

export function PaymentConfirmedPreview(props: Omit<NotificationTemplatePreviewProps, 'eventType' | 'data'> & { data: PaymentConfirmedData }) {
  return <NotificationTemplatePreview {...props} eventType="PAYMENT_CONFIRMED" data={props.data} />;
}
