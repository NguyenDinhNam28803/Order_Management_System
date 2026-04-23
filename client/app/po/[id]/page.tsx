'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useProcurement, PO, POItem } from '@/app/context/ProcurementContext';
import { ArrowLeft, CheckCircle2, Clock, FileText, Send, Building2, User, FileDigit, Calendar } from 'lucide-react';

// Extended PO with API-specific fields
type ExtendedPOItem = POItem & {
    product?: { name?: string };
    quantity?: number;
    unitPrice?: number;
    lineTotal?: number;
};

type POWithDetails = PO & {
    supplier?: { name?: string };
    prId?: string;
    pr?: { prNumber?: string };
    totalAmount?: number;
    items?: ExtendedPOItem[];
};

export default function PODetailPage() {
  const params = useParams();
  const router = useRouter();
  const poId = params.id as string;
  const { fetchPOById, confirmPO, submitPO, notify } = useProcurement();
  const [po, setPO] = useState<POWithDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetch = async () => {
      try {
        const data = await fetchPOById(poId);
        setPO(data as POWithDetails);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load PO');
      } finally {
        setLoading(false);
      }
    };

    if (poId) fetch();
  }, [poId, fetchPOById]);

  const handleConfirm = async () => {
    try {
      setSubmitting(true);
      const updated = await confirmPO(poId);
      setPO(updated);
      notify('PO confirmed successfully', 'success');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to confirm PO');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmit = async () => {
    try {
      setSubmitting(true);
      const updated = await submitPO(poId);
      setPO(updated);
      notify('PO submitted to approver', 'success');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit PO');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="p-8">Loading...</div>;
  if (error) return <div className="p-8 text-red-600">Error: {error}</div>;
  if (!po) return <div className="p-8">PO not found</div>;

  const getStatusDisplay = (status: string) => {
    switch (status) {
        case 'CONFIRMED': return { label: 'Đã xác nhận', class: 'status-approved' };
        case 'DRAFT': return { label: 'Bản nháp', class: 'status-draft' };
        default: return { label: status, class: 'status-info' };
    }
  };

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header with Breadcrumbs */}
      <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <button 
            onClick={() => router.back()} 
            className="flex items-center gap-2 text-xs font-bold text-[#64748B] hover:text-[#3B82F6] transition-colors mb-4 uppercase tracking-widest"
          >
            <ArrowLeft size={14} /> Quay lại danh sách
          </button>
          <div className="flex items-center gap-4">
            <h1 className="text-3xl font-black text-[#F8FAFC] tracking-tight">Chi tiết Đơn hàng (PO)</h1>
            <span className={`status-pill ${getStatusDisplay(po.status).class}`}>
              {getStatusDisplay(po.status).label}
            </span>
          </div>
        </div>
        <div className="flex gap-4">
          {po.status === 'DRAFT' && (
            <>
              <button
                onClick={handleConfirm}
                disabled={submitting}
                className="btn-success w-full md:w-auto text-xs uppercase tracking-widest"
              >
                {submitting ? <Clock size={16} className="animate-spin" /> : <CheckCircle2 size={16} />} 
                Xác nhận PO
              </button>
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="btn-primary w-full md:w-auto text-xs uppercase tracking-widest shadow-xl shadow-[#3B82F6]/20"
              >
                {submitting ? <Clock size={16} className="animate-spin" /> : <Send size={16} />}
                Gửi phê duyệt
              </button>
            </>
          )}
          {po.status === 'CONFIRMED' && (
            <div className="text-emerald-400 font-bold bg-[#10B981]/10 px-4 py-2 rounded-xl border border-[#10B981]/30 flex items-center gap-2 text-sm">
              <CheckCircle2 size={16} /> PO Đã xác nhận - Sẵn sàng giao hàng
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="lg:col-span-2 erp-card space-y-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-[0.03] pointer-events-none">
            <FileText size={160} />
          </div>
          <h3 className="section-title">Thông tin Đơn hàng</h3>
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-[#64748B]"><FileDigit size={12}/> Mã PO</div>
              <p className="text-sm font-bold text-[#F8FAFC]">{po.poNumber || po.id.split('-').pop()}</p>
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-[#64748B]"><Building2 size={12}/> Nhà Cung Cấp</div>
              <p className="text-sm font-bold text-[#94A3B8]">{po.supplier?.name || "N/A"}</p>
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-[#64748B]">PR Tham Chiếu</div>
              <p className="text-sm font-bold text-[#3B82F6] cursor-pointer hover:underline" onClick={() => router.push(`/pr/${po.prId}`)}>
                {po.pr?.prNumber || (po.prId ? `PR-${po.prId.substring(0, 8)}...` : 'N/A')}
              </p>
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-[#64748B]"><Calendar size={12}/> Ngày Tạo</div>
              <p className="text-sm font-bold text-[#94A3B8]">{po.createdAt ? new Date(po.createdAt).toLocaleDateString('vi-VN') : 'N/A'}</p>
            </div>
          </div>
        </div>

        <div className="erp-card flex flex-col justify-between relative overflow-hidden">
           <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-[#3B82F6]/5 rounded-full blur-2xl"></div>
           <div>
              <h3 className="section-title">Tổng Mua Tiêu Chuẩn</h3>
              <div className="text-4xl font-black text-[#F8FAFC] mt-2 tracking-tight">
                  {po.totalAmount?.toLocaleString('vi-VN')} <span className="text-xl text-[#3B82F6]">VND</span>
              </div>
           </div>
        </div>
      </div>

      <div className="erp-card p-0 overflow-hidden">
        <div className="p-5 border-b border-[rgba(148,163,184,0.1)]">
          <h3 className="section-title m-0">Chi tiết sản phẩm</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="erp-table text-xs">
            <thead>
              <tr>
                <th className="w-12 text-center text-[10px] font-black uppercase tracking-widest text-[#64748B]">STT</th>
                <th className="text-[10px] font-black uppercase tracking-widest text-[#64748B]">Sản phẩm / Dịch vụ</th>
                <th className="text-right w-24 text-[10px] font-black uppercase tracking-widest text-[#64748B]">Số lượng</th>
                <th className="text-right w-40 text-[10px] font-black uppercase tracking-widest text-[#64748B]">Đơn giá</th>
                <th className="text-right w-48 text-[10px] font-black uppercase tracking-widest text-[#64748B]">Tổng cộng</th>
              </tr>
            </thead>
            <tbody>
              {po.items && po.items.length > 0 ? po.items.map((item: ExtendedPOItem, idx: number) => (
                <tr key={item.id}>
                  <td className="text-center font-bold text-[#64748B]">{idx + 1}</td>
                  <td className="font-bold text-[#F8FAFC]">{item.product?.name || "N/A"}</td>
                  <td className="text-right font-bold text-[#3B82F6]">{item.quantity}</td>
                  <td className="text-right font-semibold text-[#94A3B8]">
                    {item.unitPrice?.toLocaleString('vi-VN')} ₫
                  </td>
                  <td className="text-right font-black text-emerald-400">
                    {item.lineTotal?.toLocaleString('vi-VN')} ₫
                  </td>
                </tr>
              )) : (
                <tr>
                   <td colSpan={5} className="py-12 text-center text-[#64748B] font-bold text-xs uppercase tracking-widest">
                      Không có mặt hàng nào
                   </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
