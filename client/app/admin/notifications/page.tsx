"use client";

import { useState } from "react";
import { 
  EmailEventType, 
  RFQMagicLinkData,
  PRApprovalLinkData,
  POConfirmLinkData,
  GrnMilestoneUpdateData,
  InvoiceSubmitLinkData,
  PaymentConfirmedData
} from "../../types/notification-types";
import NotificationTemplatePreview from "../../components/NotificationTemplatePreview";
import { Mail, Plus, RefreshCw } from "lucide-react";
import { useProcurement } from "../../context/ProcurementContext";

// Sample data for each template type
const sampleRFQData: RFQMagicLinkData = {
  rfqCode: "RFQ-2024-001",
  rfqTitle: "Cung cấp laptop Dell Latitude 7430",
  supplierName: "Công ty Phương Nam Tech",
  rfqLink: "https://procuresmart.vn/external/rfq/abc123",
  deadline: "2024-12-31",
  contactPerson: "Nguyễn Văn A",
  contactEmail: "sales@phuongnam-tech.vn",
  paymentTerms: "Net 30",
  items: [
    { name: "Laptop Dell Latitude 7430", qty: 10, unit: "chiếc" },
    { name: "Docking Station Dell WD22TB4", qty: 10, unit: "chiếc" },
  ],
};

const samplePRApprovalData: PRApprovalLinkData = {
  prCode: "PR-2024-0052",
  prTitle: "Mua sắm thiết bị IT cho phòng Dev",
  approverName: "Trần Thị B",
  requesterName: "Nguyễn Văn C",
  totalAmount: 150000000,
  remainingBudget: 350000000,
  justification: "Nhu cầu mở rộng team phát triển phần mềm",
  slaDeadline: "2024-12-20T17:00:00",
  approveLink: "https://procuresmart.vn/external/approve/xyz789",
  rejectLink: "https://procuresmart.vn/external/reject/xyz789",
  detailLink: "https://procuresmart.vn/pr/PR-2024-0052",
};

const samplePOConfirmData: POConfirmLinkData = {
  poCode: "PO-2024-0089",
  supplierName: "Công ty Thiên Long",
  confirmLink: "https://procuresmart.vn/external/po/confirm/def456",
  poPdfUrl: "https://procuresmart.vn/po/PO-2024-0089/pdf",
  orderDate: "2024-12-15",
  deliveryDate: "2024-12-25",
  deliveryAddress: "123 Nguyễn Văn A, Quận 1, TP.HCM",
  paymentTerms: "Net 30",
  contactName: "Lê Thị D",
  contactEmail: "order@thienlong.vn",
  totalAmount: 25000000,
  items: [
    { name: "Bút bi Thiên Long 0.5mm", qty: 1000, unit: "cây", price: 3500 },
    { name: "Sổ tay A5 200 trang", qty: 200, unit: "cuốn", price: 45000 },
  ],
};

const sampleGRNData: GrnMilestoneUpdateData = {
  poCode: "PO-2024-0075",
  supplierName: "Công ty Việt Tiến",
  updateLink: "https://procuresmart.vn/external/grn/update/ghi789",
  completedSteps: ["Xác nhận đơn hàng", "Chuẩn bị hàng"],
  currentStep: "Đang giao hàng",
  pendingSteps: ["Giao hàng tại kho", "Kiểm tra chất lượng", "Nhập kho"],
};

const sampleInvoiceData: InvoiceSubmitLinkData = {
  poCode: "PO-2024-0066",
  grnCode: "GRN-2024-0123",
  submitLink: "https://procuresmart.vn/external/invoice/submit/jkl012",
  poAmount: 50000000,
  grnPercent: 100,
  grnAmount: 50000000,
  supplierName: "Công ty Hoàng Gia",
};

const samplePaymentData: PaymentConfirmedData = {
  paymentCode: "PAY-2024-0045",
  poCode: "PO-2024-0055",
  amount: 45000000,
  vatAmount: 4500000,
  totalWithVat: 49500000,
  bankRef: "BANK-REF-20241215-001",
  paidAt: "2024-12-15T10:30:00",
};

const templateCategories = [
  {
    title: "Magic Link Templates",
    description: "Email templates with magic links for external users",
    templates: [
      { 
        type: "RFQ_MAGIC_LINK" as EmailEventType, 
        name: "RFQ Magic Link",
        data: sampleRFQData,
        recipient: "sales@phuongnam-tech.vn"
      },
      { 
        type: "PR_APPROVAL_LINK" as EmailEventType, 
        name: "PR Approval Link",
        data: samplePRApprovalData,
        recipient: "itmanageprocuresmart@gmail.com"
      },
      { 
        type: "PO_CONFIRM_LINK" as EmailEventType, 
        name: "PO Confirm Link",
        data: samplePOConfirmData,
        recipient: "order@thienlong.vn"
      },
      { 
        type: "GRN_MILESTONE_UPDATE" as EmailEventType, 
        name: "GRN Milestone Update",
        data: sampleGRNData,
        recipient: "logistics@viettien.com.vn"
      },
      { 
        type: "INVOICE_SUBMIT_LINK" as EmailEventType, 
        name: "Invoice Submit Link",
        data: sampleInvoiceData,
        recipient: "accounting@hoanggia-vpp.vn"
      },
      { 
        type: "PAYMENT_CONFIRMED" as EmailEventType, 
        name: "Payment Confirmed",
        data: samplePaymentData,
        recipient: "finance@supplier.com"
      },
    ]
  }
];

export default function NotificationAdminPage() {
  const { refreshData } = useProcurement();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refreshData();
    setTimeout(() => setIsRefreshing(false), 500);
  };

  return (
    <div className="animate-in fade-in duration-500 space-y-8">
      {/* Header */}
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-black text-[#F8FAFC] tracking-tight uppercase">
            EMAIL TEMPLATES
          </h1>
          <p className="text-sm text-[#64748B] mt-1 font-medium italic">
            Quản lý và xem trước các mẫu email thông báo
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="group relative px-6 py-3 bg-[#161922] text-[#94A3B8] font-bold rounded-[20px] 
              border border-[rgba(148,163,184,0.1)] hover:text-[#F8FAFC] hover:border-[#3B82F6]/50 
              transition-all duration-300 flex items-center gap-2 disabled:opacity-50"
          >
            <RefreshCw size={18} className={isRefreshing ? "animate-spin" : "group-hover:rotate-180 transition-transform duration-500"} />
            <span>LÀM MỚI</span>
          </button>
          <button className="group relative px-6 py-3 bg-gradient-to-r from-[#3B82F6] to-[#60A5FA] text-[#F8FAFC] font-bold rounded-[20px] 
            shadow-lg shadow-[#3B82F6]/20 hover:shadow-[#3B82F6]/40 hover:scale-105 transition-all duration-300 
            flex items-center gap-2">
            <Plus size={18} className="group-hover:rotate-90 transition-transform duration-300" />
            <span>THÊM TEMPLATE</span>
          </button>
        </div>
      </div>

      {/* Template Categories */}
      <div className="space-y-6">
        {templateCategories.map((category, idx) => (
          <div key={category.title} className="bg-[#161922] rounded-4xl border border-[rgba(148,163,184,0.1)] shadow-xl shadow-[#3B82F6]/5 overflow-hidden animate-in slide-in-from-bottom-4 duration-500 fill-mode-backwards" style={{ animationDelay: `${idx * 100}ms` }}>
            <div className="p-8 bg-[#0F1117] border-b border-[rgba(148,163,184,0.1)]">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-[#F8FAFC] flex items-center gap-3">
                    <span className="w-2 h-8 bg-gradient-to-b from-[#3B82F6] to-[#60A5FA] rounded-full"></span>
                    {category.title}
                  </h2>
                  <p className="text-sm text-[#64748B] mt-2 ml-5">{category.description}</p>
                </div>
                <span className="px-4 py-2 bg-[#3B82F6]/10 text-[#60A5FA] text-sm font-bold rounded-xl border border-[#3B82F6]/20">
                  {category.templates.length} templates
                </span>
              </div>
            </div>
            
            <div className="divide-y divide-[rgba(148,163,184,0.1)]">
              {category.templates.map((template) => (
                <div key={template.type} className="p-6">
                  <NotificationTemplatePreview
                    eventType={template.type}
                    data={template.data}
                    recipientEmail={template.recipient}
                    onSend={() => console.log("Send", template.type)}
                  />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="bg-gradient-to-br from-[#3B82F6]/10 to-[#60A5FA]/5 rounded-4xl p-8 border border-[#3B82F6]/20">
        <h3 className="text-lg font-bold text-[#F8FAFC] mb-6 flex items-center gap-2">
          <Mail className="w-5 h-5 text-[#3B82F6]" />
          Hướng dẫn sử dụng
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm text-[#94A3B8]">
          <div className="flex items-start gap-4 p-4 bg-[#0F1117] rounded-2xl border border-[rgba(148,163,184,0.1)]">
            <div className="w-10 h-10 bg-[#3B82F6]/20 rounded-xl flex items-center justify-center shrink-0">
              <Mail className="w-5 h-5 text-[#60A5FA]" />
            </div>
            <div>
              <p className="font-bold text-[#F8FAFC] mb-1">Gửi email từ hệ thống</p>
              <p className="text-[#64748B]">Sử dụng API <code className="text-[#60A5FA] bg-[#3B82F6]/10 px-2 py-0.5 rounded">/notifications/send</code> để gửi email với template tương ứng</p>
            </div>
          </div>
          <div className="flex items-start gap-4 p-4 bg-[#0F1117] rounded-2xl border border-[rgba(148,163,184,0.1)]">
            <div className="w-10 h-10 bg-[#3B82F6]/20 rounded-xl flex items-center justify-center shrink-0">
              <RefreshCw className="w-5 h-5 text-[#60A5FA]" />
            </div>
            <div>
              <p className="font-bold text-[#F8FAFC] mb-1">Xem trước template</p>
              <p className="text-[#64748B]">Click &quot;Xem trước từ server&quot; để tải HTML render từ backend</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
