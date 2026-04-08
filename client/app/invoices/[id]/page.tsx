'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useProcurement } from '@/app/context/ProcurementContext';
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
  CreditCard
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function InvoiceDetailPage() {
  const params = useParams();
  const invoiceId = params.id as string;
  const { fetchInvoiceById, runMatching, payInvoice, notify } = useProcurement();
  const router = useRouter();
  const [invoice, setInvoice] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    const fetch = async () => {
      try {
        const data = await fetchInvoiceById(invoiceId);
        // API returns array, take first item
        setInvoice(Array.isArray(data) ? data[0] : data);
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
      setInvoice(updated);
      notify('3-Way Matching completed', 'success');
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
        const updated = await payInvoice(invoiceId);
        setInvoice(updated);
        notify('Payment scheduled successfully', 'success');
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

  const formatCurrency = (value: string | number) => {
    const num = typeof value === 'string' ? parseFloat(value) : value;
    return num?.toLocaleString('vi-VN') || '0';
  };

  const formatDate = (dateString: string | null) => {
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
    <div className="min-h-screen bg-[#0F1117] p-8">
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#3B82F6]"></div>
      </div>
    </div>
  );
  
  if (error) return (
    <div className="min-h-screen bg-[#0F1117] p-8">
      <div className="bg-rose-500/10 border border-rose-500/20 rounded-xl p-6 text-rose-400">
        <AlertCircle className="inline mr-2" size={20} />
        Lỗi: {error}
      </div>
    </div>
  );
  
  if (!invoice) return (
    <div className="min-h-screen bg-[#0F1117] p-8">
      <div className="bg-slate-500/10 border border-slate-500/20 rounded-xl p-6 text-slate-400">
        Không tìm thấy hóa đơn
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-bg-primary">      
      <div className="p-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link 
            href="/finance/invoices" 
            className="inline-flex items-center gap-2 text-[#64748B] hover:text-[#F8FAFC] transition-colors mb-4"
          >
            <ArrowLeft size={16} />
            <span className="text-sm font-medium">Quay lại danh sách</span>
          </Link>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-[#3B82F6]/10 flex items-center justify-center">
                <FileText size={28} className="text-[#3B82F6]" />
              </div>
              <div>
                <h1 className="text-3xl font-black text-[#F8FAFC] tracking-tight">
                  Hóa đơn {invoice.invoiceNumber}
                </h1>
                <p className="text-[#64748B] text-sm mt-1">
                  ID: {invoice.id}
                </p>
              </div>
            </div>
            
            <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-bold ${getStatusClass(invoice.status)}`}>
              {getStatusIcon(invoice.status)}
              {invoice.status}
            </div>
          </div>
        </div>

        {/* Exception Alert */}
        {invoice.status === 'EXCEPTION_REVIEW' && invoice.exceptionReason && (
          <div className="mb-6 p-5 bg-rose-500/10 border border-rose-500/20 rounded-xl">
            <div className="flex items-start gap-3">
              <AlertCircle size={20} className="text-rose-400 shrink-0 mt-0.5" />
              <div>
                <h3 className="font-bold text-rose-400 mb-1">Lỗi đối soát 3 bên</h3>
                <p className="text-rose-300/80 text-sm">{invoice.exceptionReason}</p>
              </div>
            </div>
          </div>
        )}

        {/* Main Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Left Column - Invoice Details */}
          <div className="xl:col-span-2 space-y-6">
            {/* Invoice Info Card */}
            <div className="bg-[#161922] rounded-2xl border border-[rgba(148,163,184,0.1)] p-6">
              <h2 className="text-lg font-black text-[#F8FAFC] mb-6 flex items-center gap-2">
                <FileText size={18} className="text-[#3B82F6]" />
                Thông tin Hóa đơn
              </h2>
              
              <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                <div>
                  <label className="text-xs font-bold text-[#64748B] uppercase tracking-wider">Số hóa đơn</label>
                  <p className="text-[#F8FAFC] font-semibold mt-1">{invoice.invoiceNumber}</p>
                </div>
                <div>
                  <label className="text-xs font-bold text-[#64748B] uppercase tracking-wider">Ngày hóa đơn</label>
                  <p className="text-[#F8FAFC] font-semibold mt-1">{formatDate(invoice.invoiceDate)}</p>
                </div>
                <div>
                  <label className="text-xs font-bold text-[#64748B] uppercase tracking-wider">Tiền tệ</label>
                  <p className="text-[#F8FAFC] font-semibold mt-1">{invoice.currency}</p>
                </div>
                <div>
                  <label className="text-xs font-bold text-[#64748B] uppercase tracking-wider">Tổng tiền trước thuế</label>
                  <p className="text-[#F8FAFC] font-semibold mt-1">{formatCurrency(invoice.subtotal)} {invoice.currency}</p>
                </div>
                <div>
                  <label className="text-xs font-bold text-[#64748B] uppercase tracking-wider">Thuế suất</label>
                  <p className="text-[#F8FAFC] font-semibold mt-1">{invoice.taxRate}%</p>
                </div>
                <div>
                  <label className="text-xs font-bold text-[#64748B] uppercase tracking-wider">Tiền thuế</label>
                  <p className="text-[#F8FAFC] font-semibold mt-1">{formatCurrency(invoice.taxAmount)} {invoice.currency}</p>
                </div>
                <div>
                  <label className="text-xs font-bold text-[#64748B] uppercase tracking-wider">Tổng thanh toán</label>
                  <p className="text-[#3B82F6] font-black text-xl mt-1">{formatCurrency(invoice.totalAmount)} {invoice.currency}</p>
                </div>
                <div>
                  <label className="text-xs font-bold text-[#64748B] uppercase tracking-wider">GRN liên kết</label>
                  <p className="text-[#F8FAFC] font-semibold mt-1">
                    {invoice.grnId ? (
                      <Link href={`/warehouse/grn/${invoice.grnId}`} className="text-[#3B82F6] hover:underline">
                        {invoice.grnId.slice(0, 8)}...
                      </Link>
                    ) : (
                      <span className="text-rose-400">Chưa liên kết</span>
                    )}
                  </p>
                </div>
              </div>
            </div>

            {/* Matching Results */}
            {invoice.matchingResult && invoice.matchingResult.length > 0 && (
              <div className="bg-[#161922] rounded-2xl border border-[rgba(148,163,184,0.1)] p-6">
                <h2 className="text-lg font-black text-[#F8FAFC] mb-6 flex items-center gap-2">
                  <RefreshCw size={18} className="text-[#3B82F6]" />
                  Kết quả Đối soát 3 bên
                </h2>
                
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-[rgba(148,163,184,0.1)]">
                        <th className="text-left py-3 px-4 text-xs font-bold text-[#64748B] uppercase">PO Item ID</th>
                        <th className="text-center py-3 px-4 text-xs font-bold text-[#64748B] uppercase">Số lượng</th>
                        <th className="text-center py-3 px-4 text-xs font-bold text-[#64748B] uppercase">Đơn giá</th>
                        <th className="text-right py-3 px-4 text-xs font-bold text-[#64748B] uppercase">Chênh lệch</th>
                      </tr>
                    </thead>
                    <tbody>
                      {invoice.matchingResult.map((result: any, idx: number) => (
                        <tr key={idx} className="border-b border-[rgba(148,163,184,0.05)]">
                          <td className="py-3 px-4 text-text-primary font-mono text-sm">
                            {result.poItemId?.slice(0, 8)}...
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
                          <td className="py-3 px-4 text-right text-[#F8FAFC]">
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
            <div className="bg-[#161922] rounded-2xl border border-[rgba(148,163,184,0.1)] p-6">
              <h2 className="text-lg font-black text-[#F8FAFC] mb-6 flex items-center gap-2">
                <Calendar size={18} className="text-[#3B82F6]" />
                Timeline
              </h2>
              
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${invoice.createdAt ? 'bg-emerald-500/10' : 'bg-slate-500/10'}`}>
                    <FileText size={16} className={invoice.createdAt ? 'text-emerald-400' : 'text-slate-400'} />
                  </div>
                  <div>
                    <p className="text-[#F8FAFC] font-semibold">Tạo hóa đơn</p>
                    <p className="text-[#64748B] text-sm">{formatDate(invoice.createdAt)}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${invoice.matchedAt ? 'bg-amber-500/10' : 'bg-slate-500/10'}`}>
                    <RefreshCw size={16} className={invoice.matchedAt ? 'text-amber-400' : 'text-slate-400'} />
                  </div>
                  <div>
                    <p className="text-[#F8FAFC] font-semibold">Đối soát 3 bên</p>
                    <p className="text-[#64748B] text-sm">{formatDate(invoice.matchedAt)}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${invoice.approvedAt ? 'bg-emerald-500/10' : 'bg-slate-500/10'}`}>
                    <CheckCircle2 size={16} className={invoice.approvedAt ? 'text-emerald-400' : 'text-slate-400'} />
                  </div>
                  <div>
                    <p className="text-[#F8FAFC] font-semibold">Phê duyệt</p>
                    <p className="text-[#64748B] text-sm">{formatDate(invoice.approvedAt) || 'Chưa phê duyệt'}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${invoice.paidAt ? 'bg-blue-500/10' : 'bg-slate-500/10'}`}>
                    <CreditCard size={16} className={invoice.paidAt ? 'text-blue-400' : 'text-slate-400'} />
                  </div>
                  <div>
                    <p className="text-[#F8FAFC] font-semibold">Thanh toán</p>
                    <p className="text-[#64748B] text-sm">{formatDate(invoice.paidAt) || 'Chưa thanh toán'}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - PO & Supplier */}
          <div className="space-y-6">
            {/* PO Card */}
            {invoice.po && (
              <div className="bg-[#161922] rounded-2xl border border-[rgba(148,163,184,0.1)] p-6">
                <h2 className="text-lg font-black text-[#F8FAFC] mb-6 flex items-center gap-2">
                  <ShoppingCart size={18} className="text-[#3B82F6]" />
                  Thông tin PO
                </h2>
                
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-bold text-[#64748B] uppercase tracking-wider">Số PO</label>
                    <p className="text-[#F8FAFC] font-semibold mt-1">{invoice.po.poNumber}</p>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-[#64748B] uppercase tracking-wider">Trạng thái PO</label>
                    <p className="text-[#F8FAFC] font-semibold mt-1">{invoice.po.status}</p>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-[#64748B] uppercase tracking-wider">Tổng tiền PO</label>
                    <p className="text-[#F8FAFC] font-semibold mt-1">
                      {formatCurrency(invoice.po.totalAmount)} {invoice.po.currency}
                    </p>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-[#64748B] uppercase tracking-wider">Ngày giao hàng</label>
                    <p className="text-[#F8FAFC] font-semibold mt-1">{formatDate(invoice.po.deliveryDate)}</p>
                  </div>
                  <Link 
                    href={`/purchase-orders/${invoice.po.id}`}
                    className="inline-flex items-center gap-2 text-[#3B82F6] hover:text-[#60A5FA] text-sm font-semibold mt-2"
                  >
                    Xem chi tiết PO →
                  </Link>
                </div>
              </div>
            )}

            {/* Supplier Card */}
            {invoice.supplier && (
              <div className="bg-[#161922] rounded-2xl border border-[rgba(148,163,184,0.1)] p-6">
                <h2 className="text-lg font-black text-[#F8FAFC] mb-6 flex items-center gap-2">
                  <Building2 size={18} className="text-[#3B82F6]" />
                  Nhà cung cấp
                </h2>
                
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-bold text-[#64748B] uppercase tracking-wider">Tên công ty</label>
                    <p className="text-[#F8FAFC] font-semibold mt-1">{invoice.supplier.name}</p>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-[#64748B] uppercase tracking-wider">Mã NCC</label>
                    <p className="text-[#F8FAFC] font-semibold mt-1">{invoice.supplier.code}</p>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-[#64748B] uppercase tracking-wider">Mã số thuế</label>
                    <p className="text-[#F8FAFC] font-semibold mt-1">{invoice.supplier.taxCode}</p>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-[#64748B] uppercase tracking-wider">Xếp hạng</label>
                    <p className="text-[#F8FAFC] font-semibold mt-1">{invoice.supplier.supplierTier}</p>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-[#64748B] uppercase tracking-wider">Trust Score</label>
                    <p className="text-emerald-400 font-semibold mt-1">{invoice.supplier.trustScore}/100</p>
                  </div>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="bg-[#161922] rounded-2xl border border-[rgba(148,163,184,0.1)] p-6">
              <h2 className="text-lg font-black text-[#F8FAFC] mb-4">Thao tác</h2>
              
              <div className="space-y-3">
                {invoice.status === 'SUBMITTED' && (
                  <button
                    onClick={handleRunMatching}
                    disabled={processing}
                    className="w-full bg-[#3B82F6] hover:bg-[#2563EB] text-white px-4 py-3 rounded-xl font-bold text-sm transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    <RefreshCw size={16} className={processing ? 'animate-spin' : ''} />
                    {processing ? 'Đang xử lý...' : 'Chạy đối soát 3 bên'}
                  </button>
                )}
                
                {(invoice.status === 'APPROVED' || invoice.status === 'AUTO_APPROVED') && (
                  <button
                    onClick={handlePay}
                    disabled={processing}
                    className="w-full bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-3 rounded-xl font-bold text-sm transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    <CreditCard size={16} />
                    {processing ? 'Đang xử lý...' : 'Thanh toán'}
                  </button>
                )}
                
                {invoice.status === 'EXCEPTION_REVIEW' && (
                  <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl">
                    <p className="text-rose-400 text-sm font-semibold text-center">
                      Cần xử lý lỗi đối soát trước khi thanh toán
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
