"use client";

import React, { useState, useMemo, useEffect } from "react";
import { useProcurement, RFQ as ContextRFQ, Organization as ContextOrg, QuoteRequestStatus } from "../../context/ProcurementContext";
import { 
  Inbox, 
  FileText, 
  Send, 
  CheckCircle, 
  XCircle, 
  ChevronRight, 
  LayoutDashboard, 
  History, 
  AlertCircle,
  Building2,
  DollarSign,
  Package,
  Calendar,
  ArrowLeft
} from "lucide-react";

// --- Types ---
interface RFQItem {
  id: string;
  name: string;
  quantity: number;
  unitPrice?: number;
  note?: string;
}

interface RFQ {
  rfqId: string;
  projectName: string;
  status: "Pending" | "Quoted" | "Rejected";
  createdAt: string;
  items: RFQItem[];
  totalAmount?: number;
}

// --- Mock Data ---
const currentSupplier = {
  id: '6c7f4a14-9238-419c-ba0f-fa8da8eb0253',
  name: 'Công ty Cổ phần Công nghệ ABC'
};

const initialRFQs: RFQ[] = [
  {
    rfqId: 'RFQ-2024-001',
    projectName: 'Nâng cấp hệ thống Server Q2',
    status: 'Pending',
    createdAt: '2024-04-01',
    items: [
      { id: 'ITM-01', name: 'Server Dell PowerEdge R750', quantity: 2 },
      { id: 'ITM-02', name: 'Ổ cứng SSD 1.92TB SAS', quantity: 8 },
    ]
  },
  {
    rfqId: 'RFQ-2024-002',
    projectName: 'Trang bị Laptop cho Team Dev',
    status: 'Pending',
    createdAt: '2024-04-02',
    items: [
      { id: 'ITM-03', name: 'MacBook Pro M3 14 inch', quantity: 5 },
      { id: 'ITM-04', name: 'Màn hình Dell UltraSharp 27 inch', quantity: 5 },
    ]
  },
  {
    rfqId: 'RFQ-2024-003',
    projectName: 'Vật tư mạng VP Hà Nội',
    status: 'Quoted',
    createdAt: '2024-03-25',
    totalAmount: 45000000,
    items: [
      { id: 'ITM-05', name: 'Switch Cisco 24 Port', quantity: 2, unitPrice: 15000000, note: "Hàng có sẵn" },
      { id: 'ITM-06', name: 'Cáp mạng Cat6 AMP', quantity: 5, unitPrice: 3000000, note: "Hàng nhập khẩu" },
    ]
  }
];

export default function SupplierDashboard() {
  const { rfqs: contextRfqs, quoteRequests: contextQRs, currentUser, organizations, updateQuoteRequest, fetchMySupplierRFQs } = useProcurement();
  
  // State for real API RFQs
  const [apiRfqs, setApiRfqs] = useState<RFQ[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Fetch real RFQs from API
  useEffect(() => {
    const loadRFQs = async () => {
      if (!currentUser?.orgId) return;
      setLoading(true);
      try {
        const rfqs = await fetchMySupplierRFQs();
        // Map API response to dashboard RFQ format
        const mappedRfqs = rfqs.map((r: any) => ({
          rfqId: r.rfqNumber || r.id.substring(0, 8),
          projectName: r.title || `Yêu cầu báo giá #${r.rfqNumber || r.id.substring(0, 8)}`,
          status: r.status === "SENT" ? "Pending" : (r.status === "QUOTATION_RECEIVED" ? "Quoted" : "Pending"),
          createdAt: r.createdAt ? new Date(r.createdAt).toLocaleDateString() : "Vừa xong",
          items: r.items?.map((item: any) => ({
            id: item.id || "ITM-" + Math.random().toString(36).substring(7),
            name: item.productName || item.productDesc || "Sản phẩm",
            quantity: item.qty || 1
          })) || []
        } as RFQ));
        setApiRfqs(mappedRfqs);
      } catch (error) {
        console.error("Error fetching RFQs:", error);
      } finally {
        setLoading(false);
      }
    };
    loadRFQs();
  }, [fetchMySupplierRFQs, currentUser?.orgId]); 
  // plus merge with context RFQs that belong to this supplier
  const [localRfqs, setLocalRfqs] = useState<RFQ[]>(initialRFQs);
  const [activeTab, setActiveTab] = useState<"Pending" | "Quoted" | "Rejected" | "CatalogConfirmation">("Pending");
  const [selectedRfq, setSelectedRfq] = useState<RFQ | null>(null);
  const [notification, setNotification] = useState<{ message: string, type: 'success' | 'error' | 'info' } | null>(null);

  // DEBUG LOG
  useEffect(() => {
    console.log("--- Supplier Dashboard State ---");
    console.log("Current User:", currentUser?.email, "Role:", currentUser?.role, "OrgId:", currentUser?.orgId);
    console.log("Total QRs in context:", contextQRs?.length);
    if (contextQRs && contextQRs.length > 0) {
        console.log("Sample QR SupplierIds:", contextQRs[0].supplierIds);
    }
  }, [currentUser, contextQRs]);

  // Derive final RFQ list from context
  const mergedRFQs = useMemo(() => {
    // 1. Get RFQs from context
    const relevantContextRfqs = (contextRfqs || []).filter((r: ContextRFQ) => 
      r.supplierIds?.includes(currentUser?.orgId || "6c7f4a14-9238-419c-ba0f-fa8da8eb0253")
    ).map((cr: ContextRFQ) => {
      const buyerOrgName = organizations?.find((o: ContextOrg) => o.id === (cr as any).orgId)?.name || "Phòng Hành chính";
      
      const isCatalog = cr.type === 'PO_CONFIRMATION';
      
      return {
        rfqId: cr.rfqNumber,
        projectName: cr.title || (isCatalog ? "Xác nhận giá Catalog" : `Yêu cầu báo giá từ ${buyerOrgName}`),
        status: isCatalog ? "CatalogConfirmation" : (cr.status === "SENT" ? "Pending" : (cr.status === "QUOTATION_RECEIVED" ? "Quoted" : "Pending")),
        createdAt: cr.createdAt ? new Date(cr.createdAt).toLocaleDateString() : "Vừa xong",
        type: cr.type,
        items: cr.items?.map((item) => ({
          id: item.id || "ITM-" + Math.random().toString(36).substring(7),
          name: item.productName || item.productDesc || "Sản phẩm",
          quantity: item.qty || 1
        })) || []
      } as RFQ;
    });

    // 2. Get QuoteRequests from context
    const relevantContextQRs = (contextQRs || []).filter((qr) => 
      qr.supplierIds?.includes(currentUser?.orgId || "6c7f4a14-9238-419c-ba0f-fa8da8eb0253")
    ).map((qr) => {
      return {
        rfqId: qr.qrNumber,
        projectName: qr.title || "Yêu cầu báo giá nhanh",
        status: qr.status === "PROCESSING" ? "Pending" : (qr.status === "COMPLETED" ? "Quoted" : "Pending"),
        createdAt: qr.createdAt ? new Date(qr.createdAt).toLocaleDateString() : "Vừa xong",
        items: qr.items?.map((item) => ({
          id: item.id || "ITM-" + Math.random().toString(36).substring(7),
          name: item.productName || "Sản phẩm",
          quantity: item.qty || 1
        })) || []
      } as RFQ;
    });

    const combined = [...apiRfqs, ...relevantContextQRs, ...relevantContextRfqs, ...localRfqs];
    const unique = combined.filter((v, i, a) => a.findIndex(t => t.rfqId === v.rfqId) === i);
    
    return unique;
  }, [apiRfqs, contextRfqs, contextQRs, localRfqs, currentUser?.orgId, organizations]);

  const [rfqs, setRfqs] = useState<RFQ[]>([]);
  
  // Keep local state in sync for testing logic (quoting, rejecting)
  // in a real app this would call context/API
  useEffect(() => {
    setRfqs(mergedRFQs);
  }, [mergedRFQs]);

  // Quote Form State
  const [quotationData, setQuotationData] = useState<Record<string, { unitPrice: string, note: string }>>({});

  // --- Helpers ---
  const notify = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const currentRFQs = useMemo(() => {
    return rfqs.filter(r => r.status === activeTab);
  }, [rfqs, activeTab]);

  const handleStartQuoting = (rfq: RFQ) => {
    setSelectedRfq(rfq);
    // Initialize form data
    const initialData: Record<string, { unitPrice: string, note: string }> = {};
    rfq.items.forEach(item => {
      initialData[item.id] = { unitPrice: "", note: "" };
    });
    setQuotationData(initialData);
  };

  const handlePriceChange = (itemId: string, value: string) => {
    setQuotationData(prev => ({
      ...prev,
      [itemId]: { ...prev[itemId], unitPrice: value }
    }));
  };

  const handleNoteChange = (itemId: string, value: string) => {
    setQuotationData(prev => ({
      ...prev,
      [itemId]: { ...prev[itemId], note: value }
    }));
  };

  // Calculate Total using useMemo
  const totalValue = useMemo(() => {
    if (!selectedRfq) return 0;
    return selectedRfq.items.reduce((sum, item) => {
      const price = parseFloat(quotationData[item.id]?.unitPrice || "0");
      return sum + (price * item.quantity);
    }, 0);
  }, [selectedRfq, quotationData]);

  const handleSubmitQuotation = () => {
    if (!selectedRfq) return;

    // Validation: unitPrice > 0
    const isValid = selectedRfq.items.every(item => {
      const price = parseFloat(quotationData[item.id]?.unitPrice || "0");
      return price > 0;
    });

    if (!isValid) {
      notify("Vui lòng nhập đơn giá hợp lệ (> 0) cho tất cả các mặt hàng.", "error");
      return;
    }

    // Update local state (for mock RFQs)
    const updatedRfqs = rfqs.map(r => {
      if (r.rfqId === selectedRfq.rfqId) {
        return {
          ...r,
          status: "Quoted" as const,
          totalAmount: totalValue,
          items: r.items.map(item => ({
            ...item,
            unitPrice: parseFloat(quotationData[item.id].unitPrice),
            note: quotationData[item.id].note
          }))
        };
      }
      return r;
    });

    // Update Context (for real QuoteRequests)
    if (selectedRfq.rfqId.startsWith("QR-")) {
      const contextQR = contextQRs.find(q => q.qrNumber === selectedRfq.rfqId);
      if (contextQR) {
        updateQuoteRequest(contextQR.id, {
          status: QuoteRequestStatus.QUOTED,
          items: contextQR.items.map(it => ({
            ...it,
            unitPrice: parseFloat(quotationData[it.id]?.unitPrice || "0"),
            supplierName: currentUser?.fullName || "Công ty CP Công nghệ ABC",
            supplierId: currentUser?.orgId || "6c7f4a14-9238-419c-ba0f-fa8da8eb0253"
          }))
        });
      }
    }

    setRfqs(updatedRfqs);
    setSelectedRfq(null);
    notify(`Đã gửi báo giá thành công cho ${selectedRfq.rfqId}!`, "success");
    setActiveTab("Quoted");
  };

  const handleRejectRFQ = () => {
    if (!selectedRfq) return;
    
    const updatedRfqs = rfqs.map(r => {
      if (r.rfqId === selectedRfq.rfqId) {
        return { ...r, status: "Rejected" as const };
      }
      return r;
    });

    setRfqs(updatedRfqs);
    setSelectedRfq(null);
    notify(`Đã từ chối báo giá đơn ${selectedRfq.rfqId}.`, "info");
    setActiveTab("Pending");
  };

  // --- Components ---

  const renderSidebar = () => (
    <div className="w-64 bg-[#161922] min-h-screen p-6 text-white flex flex-col gap-8 hidden lg:flex sticky top-0 border-r border-[rgba(148,163,184,0.1)]">
      <div className="flex items-center gap-3 px-2">
        <div className="bg-[#3B82F6]/10 p-2 rounded-xl border border-[#3B82F6]/20">
          <Building2 size={24} className="text-[#3B82F6]" />
        </div>
        <div>
          <h2 className="text-sm font-black uppercase tracking-widest leading-none text-[#F8FAFC]">ProcurePro</h2>
          <span className="text-[10px] font-bold text-[#64748B] uppercase tracking-tighter">Supplier Portal</span>
        </div>
      </div>

      <nav className="flex flex-col gap-2">
        <button 
          onClick={() => { setSelectedRfq(null); setActiveTab("Pending"); }}
          className={`flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${!selectedRfq && activeTab === "Pending" ? 'bg-[#3B82F6] text-white shadow-lg shadow-[#3B82F6]/20' : 'text-[#94A3B8] hover:bg-[#1A1D23] hover:text-[#F8FAFC]'}`}
        >
          <LayoutDashboard size={20} />
          <span>Dashboard</span>
        </button>
        <button 
          onClick={() => { setSelectedRfq(null); setActiveTab("Quoted"); }}
          className={`flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${!selectedRfq && activeTab === "Quoted" ? 'bg-[#3B82F6] text-white shadow-lg shadow-[#3B82F6]/20' : 'text-[#94A3B8] hover:bg-[#1A1D23] hover:text-[#F8FAFC]'}`}
        >
          <History size={20} />
          <span>Lịch sử báo giá</span>
        </button>
      </nav>

      <div className="mt-auto">
        <div className="bg-[#0F1117] rounded-2xl p-4 border border-[rgba(148,163,184,0.1)]">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-full bg-[#3B82F6] flex items-center justify-center font-black text-xs text-white">
              ABC
            </div>
            <div className="overflow-hidden">
              <p className="text-[10px] font-black truncate text-[#F8FAFC]">{currentSupplier.name}</p>
              <p className="text-[8px] font-bold text-[#64748B] uppercase">ID: {currentSupplier.id}</p>
            </div>
          </div>
          <div className="px-3 py-1.5 bg-[#3B82F6]/10 text-[#3B82F6] rounded-lg text-[10px] font-black uppercase tracking-wider text-center border border-[#3B82F6]/20">Nhà cung cấp</div>
        </div>
      </div>
    </div>
  );

  const renderRFQList = () => (
    <div className="animate-in fade-in duration-500">
      <header className="mb-8 lg:flex items-end justify-between">
        <div>
          <h1 className="text-4xl font-black tracking-tight text-[#F8FAFC] mb-2 uppercase">YÊU CẦU BÁO GIÁ (RFQs)</h1>
          <p className="text-[#64748B] font-medium">Quản lý và phản hồi các yêu cầu báo giá từ đối tác.</p>
        </div>
        <div className="flex gap-3 mt-4 lg:mt-0">
          <div className="flex bg-[#161922] p-1.5 rounded-xl border border-[rgba(148,163,184,0.1)]">
          <button 
            onClick={() => setActiveTab("Pending")}
            className={`px-4 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'Pending' ? 'bg-[#3B82F6] text-white shadow-lg shadow-[#3B82F6]/20' : 'text-[#94A3B8] hover:text-[#F8FAFC]'}`}
          >
            Chưa xử lý
          </button>
          <button 
            onClick={() => setActiveTab("CatalogConfirmation")}
            className={`px-4 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'CatalogConfirmation' ? 'bg-[#3B82F6] text-white shadow-lg shadow-[#3B82F6]/20' : 'text-[#94A3B8] hover:text-[#F8FAFC]'}`}
          >
            Xác nhận giá Catalog
          </button>
          <button 
            onClick={() => setActiveTab("Quoted")}
            className={`px-4 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'Quoted' ? 'bg-[#3B82F6] text-white shadow-lg shadow-[#3B82F6]/20' : 'text-[#94A3B8] hover:text-[#F8FAFC]'}`}
          >
            Đã báo giá
          </button>
          </div>
        </div>
      </header>

      <div className="bg-[#161922] rounded-2xl overflow-hidden shadow-xl shadow-[#3B82F6]/5 border border-[rgba(148,163,184,0.1)]">
        <table className="erp-table text-xs text-left">
          <thead className="bg-[#0F1117] border-b border-[rgba(148,163,184,0.1)]">
            <tr className="text-[10px] font-black uppercase tracking-widest text-[#64748B]">
              <th className="w-32 py-4 px-6">Mã RFQ</th>
              <th className="py-4 px-6">Dự án / Tên yêu cầu</th>
              <th className="py-4 px-6">Thời gian nhận</th>
              <th className="py-4 px-6">Trạng thái</th>
              <th className="text-right py-4 px-6">Hành động</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[rgba(148,163,184,0.1)]">
            {loading ? (
              <tr>
                <td colSpan={5} className="py-20 text-center">
                  <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-[#3B82F6] border-t-transparent rounded-full animate-spin"></div>
                    <p className="font-black uppercase tracking-[0.2em] text-xs text-[#64748B]">Đang tải danh sách RFQ...</p>
                  </div>
                </td>
              </tr>
            ) : currentRFQs.length > 0 ? currentRFQs.map(rfq => {
              const isSimulation = rfq.rfqId.includes("SIM");
              const isApiData = !isSimulation && !rfq.rfqId.startsWith("RFQ-2024");
              return (
                <tr key={rfq.rfqId} className={`group hover:bg-[#0F1117]/50 transition-colors ${isSimulation ? 'bg-[#3B82F6]/5' : ''}`}>
                  <td className="font-black text-[#F8FAFC] py-4 px-6">
                    <div className="flex items-center gap-2">
                       {rfq.rfqId}
                       {isSimulation && <span className="bg-[#3B82F6] text-white text-[7px] font-black px-1.5 py-0.5 rounded-full uppercase tracking-widest animate-pulse">GIẢ LẬP</span>}
                       {isApiData && <span className="bg-emerald-500 text-white text-[7px] font-black px-1.5 py-0.5 rounded-full uppercase tracking-widest">API</span>}
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <div className="font-bold text-[#F8FAFC]">{rfq.projectName}</div>
                    <div className="text-[10px] text-[#64748B] font-medium uppercase mt-1">
                      {rfq.items.length} hạng mục • {rfq.items.slice(0, 2).map(i => i.name).join(", ")}{rfq.items.length > 2 ? "..." : ""}
                    </div>
                  </td>
                  <td className="text-[#64748B] text-xs py-4 px-6">{rfq.createdAt}</td>
                  <td className="py-4 px-6">
                    <span className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest ${rfq.status === 'Pending' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'}`}>
                      {rfq.status === 'Pending' ? 'Chờ báo giá' : 'Đã báo giá'}
                    </span>
                  </td>
                  <td className="text-right py-4 px-6">
                    {rfq.status === 'Pending' ? (
                      <button 
                        onClick={() => handleStartQuoting(rfq)}
                        className={`text-[10px] font-black uppercase tracking-widest inline-flex items-center gap-1 hover:gap-2 transition-all p-2 rounded-lg border ${isSimulation ? 'bg-[#3B82F6] text-white border-[#3B82F6] shadow-lg' : 'bg-[#3B82F6]/10 text-[#3B82F6] border-[#3B82F6]/20 hover:bg-[#3B82F6]/20'}`}
                      >
                        Báo giá ngay <ChevronRight size={14} />
                      </button>
                    ) : (
                      <div className="text-right pr-4">
                        <div className="text-xs font-black text-[#F8FAFC]">{(rfq.totalAmount || 0).toLocaleString()} ₫</div>
                        <div className="text-[9px] font-bold text-emerald-400 uppercase tracking-tighter">Thành công</div>
                      </div>
                    )}
                  </td>
                </tr>
              );
            }) : (
              <tr>
                <td colSpan={5} className="py-20 text-center">
                  <div className="flex flex-col items-center gap-3 opacity-30">
                    <Inbox size={48} className="text-[#64748B]" />
                    <p className="font-black uppercase tracking-[0.2em] text-xs text-[#64748B]">Không có yêu cầu nào</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderQuotationForm = () => {
    if (!selectedRfq) return null;

    return (
      <div className="animate-in slide-in-from-right-8 duration-500">
        <button 
          onClick={() => setSelectedRfq(null)}
          className="flex items-center gap-2 text-slate-400 hover:text-erp-navy font-black uppercase tracking-widest text-[10px] transition-colors mb-6 group"
        >
          <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" /> 
          Trở lại danh sách
        </button>

        <div className="flex items-start justify-between mb-8">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="status-pill status-pending">Đang soạn thảo báo giá</span>
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2 flex items-center gap-1">
                <Calendar size={12} /> Hạn nộp: 15/04/2024
              </span>
            </div>
            <h1 className="text-3xl font-black text-erp-navy tracking-tight">{selectedRfq.rfqId}: {selectedRfq.projectName}</h1>
          </div>
          
          <div className="text-right">
            <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Tổng giá trị dự tính</div>
            <div className="text-4xl font-black text-erp-blue tracking-tighter">
              {totalValue.toLocaleString()} <span className="text-lg">₫</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          {/* Main Form */}
          <div className="xl:col-span-2 space-y-6">
            <div className="erp-card shadow-sm border border-slate-200">
              <h3 className="section-title"><Package size={16} /> Danh sách mặt hàng cần báo giá</h3>
              
              <div className="overflow-x-auto">
                <table className="erp-table">
                  <thead>
                    <tr className="bg-slate-50/50">
                      <th className="py-4">Mô tả sản phẩm</th>
                      <th className="text-center w-24">Số lượng</th>
                      <th className="w-48">Đơn giá (VNĐ)</th>
                      <th>Ghi chú / Đề xuất thêm</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedRfq.items.map(item => (
                      <tr key={item.id}>
                        <td className="py-6">
                          <div className="font-black text-slate-700">{item.name}</div>
                          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Mã: {item.id}</div>
                        </td>
                        <td className="text-center font-black text-erp-navy text-base border-x border-slate-50">
                          {item.quantity}
                        </td>
                        <td className="p-4 bg-blue-50/20">
                          <div className="relative">
                            <input 
                              type="number" 
                              className="erp-input w-full pr-8 !py-2.5  text-erp-blue font-black focus:border-erp-blue bg-white border-slate-200"
                              placeholder="0"
                              value={quotationData[item.id]?.unitPrice || ""}
                              onChange={(e) => handlePriceChange(item.id, e.target.value)}
                            />
                            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-300">₫</div>
                          </div>
                        </td>
                        <td className="p-4">
                          <input 
                            type="text" 
                            className="erp-input w-full !py-2.5 text-[11px] bg-slate-50 hover:bg-white focus:bg-white border-transparent focus:border-slate-200"
                            placeholder="Thời gian giao, bảo hành..."
                            value={quotationData[item.id]?.note || ""}
                            onChange={(e) => handleNoteChange(item.id, e.target.value)}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="bg-slate-50 font-black">
                      <td colSpan={2} className="text-right py-6 uppercase tracking-widest text-slate-400 text-[10px]">Thành tiền (Draft):</td>
                      <td className="text-left py-6 pl-4 text-erp-blue text-xl font-black ">
                        {totalValue.toLocaleString()} ₫
                      </td>
                      <td></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            <div className="flex gap-4">
              <button 
                onClick={handleRejectRFQ}
                className="btn-secondary !text-rose-600 !border-rose-100 hover:!bg-rose-50 flex-1"
              >
                <XCircle size={20} /> Từ chối báo giá
              </button>
              <button 
                onClick={handleSubmitQuotation}
                className="btn-primary !bg-emerald-600 hover:!bg-emerald-700 flex-[2] group"
              >
                <Send size={20} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                Gửi Báo Giá Ngay
              </button>
            </div>
          </div>

          {/* Sidebar Info */}
          <div className="space-y-6">
            <div className="erp-card bg-slate-50 border-slate-200">
              <h3 className="section-title"><AlertCircle size={14} /> Điểm cần lưu ý</h3>
              <ul className="space-y-4">
                <li className="flex gap-3">
                  <div className="p-2 bg-white rounded-lg shadow-sm h-fit"><CheckCircle size={14} className="text-emerald-500" /></div>
                  <p className="text-xs font-medium text-slate-600 leading-relaxed">
                    Hệ thống sẽ tự động gửi RFQ này đến 3 nhà cung cấp khác để so sánh.
                  </p>
                </li>
                <li className="flex gap-3">
                  <div className="p-2 bg-white rounded-lg shadow-sm h-fit"><CheckCircle size={14} className="text-emerald-500" /></div>
                  <p className="text-xs font-medium text-slate-600 leading-relaxed">
                    Bạn có thể cập nhật báo giá này cho đến trước thời điểm đóng thầu.
                  </p>
                </li>
              </ul>
            </div>

            <div className="erp-card !p-6 bg-erp-navy text-white border-none shadow-xl shadow-erp-navy/20 relative overflow-hidden group">
              <div className="absolute -right-10 -bottom-10 opacity-5 group-hover:scale-110 transition-transform duration-700"><FileText size={160} /></div>
              <div className="relative z-10">
                <h4 className="text-xs font-black uppercase tracking-widest text-erp-blue mb-2">Quy tắc Ứng xử</h4>
                <p className="text-[11px] text-white/70 leading-relaxed">
                  Bằng việc gửi báo giá, bạn cam kết tính trung thực của thông tin và tuân thủ các quy định về chống tham nhũng của đối tác.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex bg-[#0F1117] min-h-screen font-sans">
      {renderSidebar()}
      
      <div className="flex-1 min-w-0">
        <header className="h-16 bg-[#0F1117]/80 backdrop-blur-md border-b border-[rgba(148,163,184,0.1)] flex items-center justify-between px-8 sticky top-0 z-30">
          <div className="flex items-center gap-4">
            <span className="lg:hidden font-black text-[#F8FAFC]">ProcurePro</span>
            <div className="h-4 w-px bg-[rgba(148,163,184,0.1)] hidden lg:block" />
            <div className="text-[10px] font-black uppercase tracking-widest text-[#64748B]">
               Supplier Dashboard <ChevronRight size={10} className="inline mx-1" /> {selectedRfq ? 'RFQ Detail' : 'Overview'}
            </div>
          </div>
          
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-3">
              <div className="text-right hidden sm:block">
                <p className="text-[10px] font-black text-[#F8FAFC] leading-none mb-0.5">{currentSupplier.name}</p>
                <p className="text-[8px] font-bold text-emerald-400 uppercase tracking-tighter">Trạng thái: Online</p>
              </div>
              <div className="w-8 h-8 rounded-full bg-[#161922] border border-[rgba(148,163,184,0.1)] flex items-center justify-center">
                <Building2 size={16} className="text-[#64748B]" />
              </div>
            </div>
          </div>
        </header>

        <main className="p-8 max-w-7xl mx-auto">
          {selectedRfq ? renderQuotationForm() : renderRFQList()}
        </main>
      </div>

      {/* Notifications */}
      {notification && (
        <div className={`fixed bottom-8 right-8 z-[100] animate-in slide-in-from-bottom-5 p-4 rounded-2xl shadow-2xl border flex items-center gap-3 min-w-[320px] ${
          notification.type === 'success' ? 'bg-emerald-900 border-emerald-800 text-white' : 
          notification.type === 'error' ? 'bg-rose-900 border-rose-800 text-white' : 
          'bg-erp-navy border-slate-800 text-white'
        }`}>
          {notification.type === 'success' ? <CheckCircle className="text-emerald-400" /> : <AlertCircle className="text-rose-400" />}
          <div>
            <div className="text-xs font-black uppercase tracking-widest">{notification.type === 'success' ? 'Thành công' : 'Thông báo'}</div>
            <div className="text-[11px] opacity-80 font-medium">{notification.message}</div>
          </div>
        </div>
      )}
    </div>
  );
}
