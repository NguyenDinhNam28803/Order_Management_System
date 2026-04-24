'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useProcurement, Invoice } from '@/app/context/ProcurementContext';
import { Contract } from '@/app/types/api-types';

// Extended Invoice with matching result and API-specific fields
type InvoiceWithMatching = Invoice & {
    invoiceDate?: string;
    totalAmount?: number;
    currency?: string;
    taxRate?: number;
    subtotal?: number;
    taxAmount?: number;
    grnId?: string;
    exceptionReason?: string;
    matchedAt?: string;
    approvedAt?: string;
    paidAt?: string;
    po?: {
        id: string;
        poNumber?: string;
        status?: string;
        currency?: string;
        totalAmount?: number;
        deliveryDate?: string;
    };
    supplier?: {
        id: string;
        name?: string;
        fullName?: string;
        code?: string;
        taxCode?: string;
        supplierTier?: string;
        trustScore?: number;
    };
    matchingResult?: Array<{
        poItemId?: string;
        grnItemId?: string;
        status?: string;
        quantity?: number;
        qtyMatch?: boolean;
        priceMatch?: boolean;
        variance?: number;
    }>;
};

import {
  FileText,
  CheckCircle2,
  AlertCircle,
  Clock,
  XCircle,
  Building2,
  ShoppingCart,
  Calendar,
  ArrowLeft,
  RefreshCw,
  CreditCard,
  FileSignature,
  X
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function InvoiceDetailPage() {
  const params = useParams();
  const invoiceId = params.id as string;
  const { fetchInvoiceById, runMatching, payInvoice, createContract, notify } = useProcurement();
  const router = useRouter();
  const [invoice, setInvoice] = useState<InvoiceWithMatching | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);

  // Contract modal state
  const [showContractModal, setShowContractModal] = useState(false);
  const [contractForm, setContractForm] = useState({
    title: '',
    contractType: 'SUPPLY',
    value: '',
    startDate: '',
    endDate: '',
  });
  const [creatingContract, setCreatingContract] = useState(false);

  const handleCreateContract = async () => {
    if (!contractForm.title.trim()) {
      notify('Vui lòng nhập tiêu đề hợp đồng', 'error');
      return;
    }
    if (!invoice?.supplier?.id) {
      notify('Không tìm thấy thông tin nhà cung cấp', 'error');
      return;
    }
    setCreatingContract(true);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const payload: any = {
      title: contractForm.title.trim(),
      supplierId: invoice.supplier.id,
      contractType: contractForm.contractType || undefined,
      value: contractForm.value ? Number(contractForm.value) : undefined,
      startDate: contractForm.startDate || undefined,
      endDate: contractForm.endDate || undefined,
    };
    const ok = await createContract(payload as Partial<Contract>);
    setCreatingContract(false);
    if (ok) {
      setShowContractModal(false);
      setContractForm({ title: '', contractType: 'SUPPLY', value: '', startDate: '', endDate: '' });
    }
  };

  useEffect(() => {
    const fetch = async () => {
      try {
        const data = await fetchInvoiceById(invoiceId);
        // API returns array, take first item
        const invoiceData = Array.isArray(data) ? data[0] : data;
        setInvoice(invoiceData as InvoiceWithMatching | null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load invoice');
      } finally {
        setLoading(false);
      }
    };

    if (invoiceId) fetch();
  }, [invoiceId, fetchInvoiceById]);

  const handleRunMatching = async () => {
    try {
      setProcessing(true);
      const updated = await runMatching(invoiceId);
      if (updated) {
        setInvoice(updated as InvoiceWithMatching);
        notify('3-Way Matching completed', 'success');
        // Optionally refresh to see latest status
        const data = await fetchInvoiceById(invoiceId);
        const invoiceData = Array.isArray(data) ? data[0] : data;
        setInvoice(invoiceData as InvoiceWithMatching);
      }
      router.push('/finance/invoices');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to run matching');
    } finally {
      setProcessing(false);
    }
  };

  const handlePay = async () => {
    if (window.confirm('Confirm payment for this invoice?')) {
      try {
        setProcessing(true);
        const success = await payInvoice(invoiceId);
        if (success) {
          notify('Payment scheduled successfully', 'success');
          // Fetch updated invoice after payment
          const data = await fetchInvoiceById(invoiceId);
          const invoiceData = Array.isArray(data) ? data[0] : data;
          setInvoice(invoiceData as InvoiceWithMatching);
        }
        router.push('/finance/invoices');
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to process payment');
      } finally {
        setProcessing(false);
      }
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'APPROVED':
      case 'AUTO_APPROVED':
        return <CheckCircle2 size={20} className="text-emerald-400" />;
      case 'EXCEPTION_REVIEW':
      case 'REJECTED':
        return <XCircle size={20} className="text-rose-400" />;
      case 'MATCHING':
      case 'SUBMITTED':
        return <Clock size={20} className="text-amber-400" />;
      case 'PAID':
        return <CreditCard size={20} className="text-blue-400" />;
      default:
        return <FileText size={20} className="text-slate-400" />;
    }
  };

  const getStatusClass = (status: string) => {
    switch (status) {
      case 'APPROVED':
      case 'AUTO_APPROVED':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      case 'EXCEPTION_REVIEW':
      case 'REJECTED':
        return 'bg-rose-500/10 text-rose-400 border-rose-500/20';
      case 'MATCHING':
      case 'SUBMITTED':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      case 'PAID':
        return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
      default:
        return 'bg-slate-500/10 text-slate-400 border-slate-500/20';
    }
  };

  const formatCurrency = (value: string | number | undefined) => {
    const num = typeof value === 'string' ? parseFloat(value) : value;
    return num?.toLocaleString('vi-VN') || '0';
  };

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) return (
    <div className="min-h-screen bg-bg-primary p-8">
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    </div>
  );
  
  if (error) return (
    <div className="min-h-screen bg-bg-primary p-8">
      <div className="bg-rose-500/10 border border-rose-500/20 rounded-xl p-6 text-rose-400">
        <AlertCircle className="inline mr-2" size={20} />
        Lỗi: {error}
      </div>
    </div>
  );
  
  if (!invoice) return (
    <div className="min-h-screen bg-bg-primary p-8">
      <div className="bg-slate-500/10 border border-slate-500/20 rounded-xl p-6 text-slate-400">
        Không tìm thấy hóa đơn
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-bg-primary">      
      <div className="p-6 max-w-7xl mx-auto">
        {/* Breadcrumb & Back */}
        <div className="mb-6">
          <Link 
            href="/finance/invoices" 
            className="inline-flex items-center gap-2 text-text-secondary hover:text-text-primary transition-colors"
          >
            <ArrowLeft size={16} />
            <span className="text-sm font-medium">Quay lại danh sách hóa đơn</span>
          </Link>
        </div>

        {/* Header Card with Key Info */}
        <div className="bg-bg-secondary rounded-2xl border border-border p-6 mb-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            {/* Left: Icon & Title */}
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-blue-500/10 flex items-center justify-center">
                <FileText size={28} className="text-blue-500" />
              </div>
              <div>
                <h1 className="text-3xl font-black text-text-primary tracking-tight">
                  {invoice.invoiceNumber}
                </h1>
                <p className="text-text-secondary text-sm mt-1">
                  ID: *** | Ngày: {formatDate(invoice.invoiceDate)}
                </p>
              </div>
            </div>
            
            {/* Right: Status & Amount */}
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-text-secondary text-sm">Tổng thanh toán</p>
                <p className="text-blue-400 font-black text-2xl">
                  {formatCurrency(invoice.totalAmount)} {invoice.currency}
                </p>
              </div>
              <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-bold ${getStatusClass(invoice.status)}`}>
                {getStatusIcon(invoice.status)}
                {invoice.status}
              </div>
            </div>
          </div>

          {/* Quick Actions Row */}
          <div className="flex flex-wrap gap-3 mt-6 pt-6 border-t border-border">
            {invoice.status === 'SUBMITTED' && (
              <button
                onClick={handleRunMatching}
                disabled={processing}
                className="bg-blue-500 hover:bg-blue-600 text-white px-5 py-2.5 rounded-xl font-bold text-sm transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                <RefreshCw size={16} className={processing ? 'animate-spin' : ''} />
                {processing ? 'Đang xử lý...' : 'Chạy đối soát 3 bên'}
              </button>
            )}
            
            {(invoice.status === 'APPROVED' || invoice.status === 'AUTO_APPROVED') && (
              <button
                onClick={handlePay}
                disabled={processing}
                className="bg-emerald-500 hover:bg-emerald-600 text-white px-5 py-2.5 rounded-xl font-bold text-sm transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                <CreditCard size={16} />
                {processing ? 'Đang xử lý...' : 'Thanh toán ngay'}
              </button>
            )}

            {invoice.po && (
              <Link 
                href={`/purchase-orders/${invoice.po.id}`}
                className="inline-flex items-center gap-2 bg-bg-primary hover:bg-bg-secondary border border-border text-text-primary px-5 py-2.5 rounded-xl font-semibold text-sm transition-colors"
              >
                <ShoppingCart size={16} />
                Xem PO liên kết
              </Link>
            )}

            {invoice.grnId && (
              <Link
                href={`/warehouse/grn/${invoice.grnId}`}
                className="inline-flex items-center gap-2 bg-bg-primary hover:bg-bg-secondary border border-border text-text-primary px-5 py-2.5 rounded-xl font-semibold text-sm transition-colors"
              >
                <CheckCircle2 size={16} />
                Xem GRN
              </Link>
            )}

            {invoice.supplier?.id && (
              <button
                onClick={() => setShowContractModal(true)}
                className="inline-flex items-center gap-2 bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/30 text-purple-400 px-5 py-2.5 rounded-xl font-semibold text-sm transition-colors"
              >
                <FileSignature size={16} />
                Tạo hợp đồng
              </button>
            )}
          </div>
        </div>

        {/* Exception Alert */}
        {invoice.status === 'EXCEPTION_REVIEW' && invoice.exceptionReason && (
          <div className="mb-6 p-5 bg-rose-500/10 border border-rose-500/20 rounded-xl">
            <div className="flex items-start gap-3">
              <AlertCircle size={20} className="text-rose-400 shrink-0 mt-0.5" />
              <div className="flex-1">
                <h3 className="font-bold text-rose-400 mb-1">Lỗi đối soát 3 bên</h3>
                <p className="text-rose-300/80 text-sm">{invoice.exceptionReason}</p>
              </div>
            </div>
          </div>
        )}

        {/* Main Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Left Column - Main Content */}
          <div className="xl:col-span-2 space-y-6">
            {/* Invoice Details Card */}
            <div className="bg-bg-secondary rounded-2xl border border-border p-6">
              <h2 className="text-lg font-black text-text-primary mb-6 flex items-center gap-2">
                <FileText size={18} className="text-blue-500" />
                Chi tiết Hóa đơn
              </h2>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <div className="p-4 bg-bg-primary rounded-xl">
                  <label className="text-xs font-bold text-text-secondary uppercase tracking-wider">Số hóa đơn</label>
                  <p className="text-text-primary font-semibold mt-2">{invoice.invoiceNumber}</p>
                </div>
                <div className="p-4 bg-bg-primary rounded-xl">
                  <label className="text-xs font-bold text-text-secondary uppercase tracking-wider">Ngày hóa đơn</label>
                  <p className="text-text-primary font-semibold mt-2">{formatDate(invoice.invoiceDate)}</p>
                </div>
                <div className="p-4 bg-bg-primary rounded-xl">
                  <label className="text-xs font-bold text-text-secondary uppercase tracking-wider">Tiền tệ</label>
                  <p className="text-text-primary font-semibold mt-2">{invoice.currency}</p>
                </div>
                <div className="p-4 bg-bg-primary rounded-xl">
                  <label className="text-xs font-bold text-text-secondary uppercase tracking-wider">Thuế suất</label>
                  <p className="text-text-primary font-semibold mt-2">{invoice.taxRate}%</p>
                </div>
                
                <div className="p-4 bg-bg-primary rounded-xl md:col-span-2">
                  <label className="text-xs font-bold text-text-secondary uppercase tracking-wider">Tổng tiền trước thuế</label>
                  <p className="text-text-primary font-semibold mt-2">{formatCurrency(invoice.subtotal)} {invoice.currency}</p>
                </div>
                <div className="p-4 bg-bg-primary rounded-xl md:col-span-2">
                  <label className="text-xs font-bold text-text-secondary uppercase tracking-wider">Tiền thuế</label>
                  <p className="text-text-primary font-semibold mt-2">{formatCurrency(invoice.taxAmount)} {invoice.currency}</p>
                </div>
              </div>
            </div>

            {/* Matching Results */}
            {invoice.matchingResult && invoice.matchingResult.length > 0 && (
              <div className="bg-bg-secondary rounded-2xl border border-border p-6">
                <h2 className="text-lg font-black text-text-primary mb-6 flex items-center gap-2">
                  <RefreshCw size={18} className="text-blue-500" />
                  Kết quả Đối soát 3 bên
                </h2>
                
                <div className="overflow-x-auto">
                  <table className="erp-table text-xs">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left py-3 px-4 text-xs font-bold text-text-secondary uppercase">PO Item ID</th>
                        <th className="text-center py-3 px-4 text-xs font-bold text-text-secondary uppercase">Số lượng</th>
                        <th className="text-center py-3 px-4 text-xs font-bold text-text-secondary uppercase">Đơn giá</th>
                        <th className="text-right py-3 px-4 text-xs font-bold text-text-secondary uppercase">Chênh lệch</th>
                      </tr>
                    </thead>
                    <tbody>
                      {invoice.matchingResult.map((result, idx) => (
                        <tr key={idx} className="border-b border-border/50">
                          <td className="py-3 px-4 text-text-primary font-mono text-sm">
                            ***
                          </td>
                          <td className="py-3 px-4 text-center">
                            {result.qtyMatch ? (
                              <CheckCircle2 size={16} className="text-emerald-400 mx-auto" />
                            ) : (
                              <XCircle size={16} className="text-rose-400 mx-auto" />
                            )}
                          </td>
                          <td className="py-3 px-4 text-center">
                            {result.priceMatch ? (
                              <CheckCircle2 size={16} className="text-emerald-400 mx-auto" />
                            ) : (
                              <XCircle size={16} className="text-rose-400 mx-auto" />
                            )}
                          </td>
                          <td className="py-3 px-4 text-right text-text-primary">
                            {result.variance}%
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Timeline */}
            <div className="bg-bg-secondary rounded-2xl border border-border p-6">
              <h2 className="text-lg font-black text-text-primary mb-6 flex items-center gap-2">
                <Calendar size={18} className="text-blue-500" />
                Timeline xử lý
              </h2>
              
              <div className="relative">
                {/* Vertical Line */}
                <div className="absolute left-5 top-0 bottom-0 w-0.5 bg-border"></div>
                
                <div className="space-y-6 relative">
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center relative z-10 ${invoice.createdAt ? 'bg-emerald-500/10' : 'bg-slate-500/10'}`}>
                      <FileText size={16} className={invoice.createdAt ? 'text-emerald-400' : 'text-slate-400'} />
                    </div>
                    <div className="flex-1">
                      <p className="text-text-primary font-semibold">Tạo hóa đơn</p>
                      <p className="text-text-secondary text-sm">{formatDate(invoice.createdAt)}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center relative z-10 ${invoice.matchedAt ? 'bg-amber-500/10' : 'bg-slate-500/10'}`}>
                      <RefreshCw size={16} className={invoice.matchedAt ? 'text-amber-400' : 'text-slate-400'} />
                    </div>
                    <div className="flex-1">
                      <p className="text-text-primary font-semibold">Đối soát 3 bên</p>
                      <p className="text-text-secondary text-sm">{formatDate(invoice.matchedAt) || 'Chưa đối soát'}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center relative z-10 ${invoice.approvedAt ? 'bg-emerald-500/10' : 'bg-slate-500/10'}`}>
                      <CheckCircle2 size={16} className={invoice.approvedAt ? 'text-emerald-400' : 'text-slate-400'} />
                    </div>
                    <div className="flex-1">
                      <p className="text-text-primary font-semibold">Phê duyệt</p>
                      <p className="text-text-secondary text-sm">{formatDate(invoice.approvedAt) || 'Chưa phê duyệt'}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center relative z-10 ${invoice.paidAt ? 'bg-blue-500/10' : 'bg-slate-500/10'}`}>
                      <CreditCard size={16} className={invoice.paidAt ? 'text-blue-400' : 'text-slate-400'} />
                    </div>
                    <div className="flex-1">
                      <p className="text-text-primary font-semibold">Thanh toán</p>
                      <p className="text-text-secondary text-sm">{formatDate(invoice.paidAt) || 'Chưa thanh toán'}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Related Info */}
          <div className="space-y-6">
            {/* PO Card */}
            {invoice.po && (
              <div className="bg-bg-secondary rounded-2xl border border-border p-6">
                <h2 className="text-lg font-black text-text-primary mb-6 flex items-center gap-2">
                  <ShoppingCart size={18} className="text-blue-500" />
                  Thông tin PO
                </h2>
                
                <div className="space-y-4">
                  <div className="p-3 bg-bg-primary rounded-xl">
                    <label className="text-xs font-bold text-text-secondary uppercase tracking-wider">Số PO</label>
                    <p className="text-text-primary font-semibold mt-1">{invoice.po.poNumber}</p>
                  </div>
                  <div className="p-3 bg-bg-primary rounded-xl">
                    <label className="text-xs font-bold text-text-secondary uppercase tracking-wider">Trạng thái PO</label>
                    <p className="text-text-primary font-semibold mt-1">{invoice.po.status}</p>
                  </div>
                  <div className="p-3 bg-bg-primary rounded-xl">
                    <label className="text-xs font-bold text-text-secondary uppercase tracking-wider">Tổng tiền PO</label>
                    <p className="text-text-primary font-semibold mt-1">
                      {formatCurrency(invoice.po.totalAmount)} {invoice.po.currency}
                    </p>
                  </div>
                  <div className="p-3 bg-bg-primary rounded-xl">
                    <label className="text-xs font-bold text-text-secondary uppercase tracking-wider">Ngày giao hàng</label>
                    <p className="text-text-primary font-semibold mt-1">{formatDate(invoice.po.deliveryDate)}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Supplier Card */}
            {invoice.supplier && (
              <div className="bg-bg-secondary rounded-2xl border border-border p-6">
                <h2 className="text-lg font-black text-text-primary mb-6 flex items-center gap-2">
                  <Building2 size={18} className="text-blue-500" />
                  Nhà cung cấp
                </h2>
                
                <div className="space-y-4">
                  <div className="p-3 bg-bg-primary rounded-xl">
                    <label className="text-xs font-bold text-text-secondary uppercase tracking-wider">Tên công ty</label>
                    <p className="text-text-primary font-semibold mt-1">{invoice.supplier.name}</p>
                  </div>
                  <div className="p-3 bg-bg-primary rounded-xl">
                    <label className="text-xs font-bold text-text-secondary uppercase tracking-wider">Mã NCC</label>
                    <p className="text-text-primary font-semibold mt-1">{invoice.supplier.code}</p>
                  </div>
                  <div className="p-3 bg-bg-primary rounded-xl">
                    <label className="text-xs font-bold text-text-secondary uppercase tracking-wider">Mã số thuế</label>
                    <p className="text-text-primary font-semibold mt-1">{invoice.supplier.taxCode}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 bg-bg-primary rounded-xl">
                      <label className="text-xs font-bold text-text-secondary uppercase tracking-wider">Xếp hạng</label>
                      <p className="text-text-primary font-semibold mt-1">{invoice.supplier.supplierTier}</p>
                    </div>
                    <div className="p-3 bg-bg-primary rounded-xl">
                      <label className="text-xs font-bold text-text-secondary uppercase tracking-wider">Trust Score</label>
                      <p className="text-emerald-400 font-semibold mt-1">{invoice.supplier.trustScore}/100</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Status Info */}
            <div className="bg-bg-secondary rounded-2xl border border-border p-6">
              <h2 className="text-lg font-black text-text-primary mb-4">Trạng thái</h2>
              
              <div className="space-y-3">
                {invoice.status === 'EXCEPTION_REVIEW' && (
                  <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl">
                    <p className="text-rose-400 text-sm font-semibold text-center">
                      Cần xử lý lỗi đối soát trước khi thanh toán
                    </p>
                  </div>
                )}

                {invoice.status === 'PAID' && (
                  <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl">
                    <p className="text-blue-400 text-sm font-semibold text-center">
                      Đã thanh toán thành công
                    </p>
                  </div>
                )}

                {(invoice.status === 'APPROVED' || invoice.status === 'AUTO_APPROVED') && (
                  <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
                    <p className="text-emerald-400 text-sm font-semibold text-center">
                      Sẵn sàng thanh toán
                    </p>
                  </div>
                )}

                {invoice.status === 'SUBMITTED' && (
                  <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl">
                    <p className="text-amber-400 text-sm font-semibold text-center">
                      Chờ đối soát 3 bên
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Contract Creation Modal */}
      {showContractModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-bg-secondary border border-border rounded-2xl p-6 w-full max-w-md mx-4 shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-black text-text-primary flex items-center gap-2">
                <FileSignature size={20} className="text-purple-400" />
                Tạo hợp đồng mới
              </h2>
              <button
                onClick={() => setShowContractModal(false)}
                className="p-2 rounded-lg hover:bg-bg-primary text-text-secondary transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {invoice.supplier && (
              <div className="mb-4 p-3 bg-purple-500/10 border border-purple-500/20 rounded-xl text-sm text-purple-300">
                Nhà cung cấp: <span className="font-bold">{invoice.supplier.name}</span>
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-text-secondary uppercase tracking-wider mb-1.5">
                  Tiêu đề hợp đồng <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  value={contractForm.title}
                  onChange={(e) => setContractForm(f => ({ ...f, title: e.target.value }))}
                  placeholder="VD: Hợp đồng cung ứng Q2/2026"
                  className="w-full bg-bg-primary border border-border rounded-xl px-4 py-2.5 text-sm text-text-primary focus:outline-none focus:border-purple-500/50"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-text-secondary uppercase tracking-wider mb-1.5">
                  Loại hợp đồng
                </label>
                <select
                  value={contractForm.contractType}
                  onChange={(e) => setContractForm(f => ({ ...f, contractType: e.target.value }))}
                  className="w-full bg-bg-primary border border-border rounded-xl px-4 py-2.5 text-sm text-text-primary focus:outline-none focus:border-purple-500/50"
                >
                  <option value="SUPPLY">Cung ứng hàng hóa</option>
                  <option value="SERVICE">Dịch vụ</option>
                  <option value="FRAMEWORK">Hợp đồng khung</option>
                  <option value="ONE_TIME">Một lần</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-text-secondary uppercase tracking-wider mb-1.5">
                  Giá trị hợp đồng (VND)
                </label>
                <input
                  type="number"
                  value={contractForm.value}
                  onChange={(e) => setContractForm(f => ({ ...f, value: e.target.value }))}
                  placeholder={String(invoice.totalAmount ?? '')}
                  className="w-full bg-bg-primary border border-border rounded-xl px-4 py-2.5 text-sm text-text-primary focus:outline-none focus:border-purple-500/50"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-text-secondary uppercase tracking-wider mb-1.5">
                    Ngày bắt đầu
                  </label>
                  <input
                    type="date"
                    value={contractForm.startDate}
                    onChange={(e) => setContractForm(f => ({ ...f, startDate: e.target.value }))}
                    className="w-full bg-bg-primary border border-border rounded-xl px-4 py-2.5 text-sm text-text-primary focus:outline-none focus:border-purple-500/50"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-text-secondary uppercase tracking-wider mb-1.5">
                    Ngày kết thúc
                  </label>
                  <input
                    type="date"
                    value={contractForm.endDate}
                    onChange={(e) => setContractForm(f => ({ ...f, endDate: e.target.value }))}
                    className="w-full bg-bg-primary border border-border rounded-xl px-4 py-2.5 text-sm text-text-primary focus:outline-none focus:border-purple-500/50"
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowContractModal(false)}
                className="flex-1 py-2.5 rounded-xl border border-border text-text-secondary hover:text-text-primary hover:bg-bg-primary font-semibold text-sm transition-colors"
              >
                Hủy
              </button>
              <button
                onClick={handleCreateContract}
                disabled={creatingContract}
                className="flex-1 py-2.5 rounded-xl bg-purple-500 hover:bg-purple-600 text-white font-bold text-sm transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {creatingContract ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Đang tạo...
                  </>
                ) : (
                  <>
                    <FileSignature size={16} />
                    Tạo hợp đồng
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
