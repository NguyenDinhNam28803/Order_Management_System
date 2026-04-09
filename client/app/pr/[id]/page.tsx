'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useProcurement } from '@/app/context/ProcurementContext';
import { PR, PRItem } from '@/app/types/api-types';
import { ArrowLeft, Clock, FileText, Send, Building2, User, FileDigit, Calendar } from 'lucide-react';
import Link from 'next/link';

export default function PRDetailPage() {
  const params = useParams();
  const router = useRouter();
  const prId = params.id as string;
  const { fetchPrDetail, submitPR, notify } = useProcurement();
  const [pr, setPR] = useState<PR | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetch = async () => {
      try {
        setLoading(true);
        const data = await fetchPrDetail(prId);
        setPR(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load PR');
      } finally {
        setLoading(false);
      }
    };

    if (prId) fetch();
  }, [prId, fetchPrDetail]);

  const handleSubmit = async () => {
    if (!pr) return;
    try {
      setSubmitting(true);
      await submitPR(prId);
      notify('PR submitted for approval', 'success');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit PR');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="p-8 text-[#F8FAFC]">Loading...</div>;
  if (error) return <div className="p-8 text-rose-400">Error: {error}</div>;
  if (!pr) return <div className="p-8 text-[#F8FAFC]">PR not found</div>;

  const getStatusDisplay = (status: string) => {
    switch (status) {
        case 'APPROVED': return { label: 'Đã phê duyệt', class: 'status-approved' };
        case 'DRAFT': return { label: 'Bản nháp', class: 'status-draft' };
        case 'PENDING_APPROVAL': return { label: 'Chờ duyệt', class: 'status-pending' };
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
            <h1 className="text-3xl font-black text-[#F8FAFC] tracking-tight">Chi tiết Yêu cầu (PR)</h1>
            <span className={`status-pill ${getStatusDisplay(pr.status).class}`}>
              {getStatusDisplay(pr.status).label}
            </span>
          </div>
        </div>
        {pr.status === 'DRAFT' && (
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="btn-primary w-full md:w-auto text-xs uppercase tracking-widest shadow-xl shadow-[#3B82F6]/20"
          >
            {submitting ? (
              <><Clock size={16} className="animate-spin" /> Đang gửi...</>
            ) : (
              <><Send size={16} /> Trình phê duyệt</>
            )}
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="lg:col-span-2 erp-card space-y-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-[0.03] pointer-events-none">
            <FileText size={160} />
          </div>
          <h3 className="section-title">Thông tin chung</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-[#64748B]"><FileDigit size={12}/> Mã Yêu Cầu</div>
              <p className="text-sm font-bold text-[#F8FAFC]">{pr.prNumber || pr.id.split('-')[0].toUpperCase()}</p>
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-[#64748B]"><Building2 size={12}/> Bộ Phận</div>
              <p className="text-sm font-bold text-[#94A3B8] uppercase">{pr.deptId || "N/A"}</p>
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-[#64748B]"><User size={12}/> Người Yêu Cầu</div>
              <p className="text-sm font-bold text-[#94A3B8]">{pr.requester?.fullName || "Chưa cập nhật"}</p>
            </div>
            <div className="space-y-1 md:col-span-3">
              <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-[#64748B]">Mục Đích / Tiêu Đề</div>
              <p className="text-base font-bold text-[#F8FAFC]">{pr.title || "Yêu cầu mua sắm vật tư"}</p>
            </div>
          </div>
        </div>

        <div className="erp-card flex flex-col justify-between relative overflow-hidden">
           <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-[#10B981]/5 rounded-full blur-2xl"></div>
           <div>
              <h3 className="section-title">Tổng Giá Trị (Dự kiến)</h3>
              <div className="text-4xl font-black text-emerald-400 mt-2 tracking-tight">
                  {pr.totalEstimate?.toLocaleString('vi-VN')} <span className="text-xl">VND</span>
              </div>
           </div>
           
           <div className="mt-8 space-y-3 pt-4 border-t border-[rgba(148,163,184,0.1)]">
              <div className="flex justify-between items-center text-xs">
                <span className="text-[#64748B] font-bold flex items-center gap-1"><Calendar size={14}/> Ngày tạo:</span>
                <span className="text-[#F8FAFC] font-semibold">{new Date(pr.createdAt).toLocaleDateString('vi-VN')}</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-[#64748B] font-bold flex items-center gap-1"><FileText size={14}/> Số lượng SP:</span>
                <span className="text-[#F8FAFC] font-semibold">{pr.items?.length || 0} mặt hàng</span>
              </div>
           </div>
        </div>
      </div>

      <div className="erp-card p-0 overflow-hidden">
        <div className="p-5 border-b border-[rgba(148,163,184,0.1)]">
          <h3 className="section-title m-0">Danh sách Danh Mục Hàng Hoá</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="erp-table text-xs">
            <thead>
              <tr>
                <th className="w-12 text-center text-[10px] font-black uppercase tracking-widest text-[#64748B]">STT</th>
                <th className="text-[10px] font-black uppercase tracking-widest text-[#64748B]">Sản phẩm / Dịch vụ</th>
                <th className="text-right w-24 text-[10px] font-black uppercase tracking-widest text-[#64748B]">Số lượng</th>
                <th className="text-right w-40 text-[10px] font-black uppercase tracking-widest text-[#64748B]">Đơn giá (Ước tính)</th>
                <th className="text-right w-48 text-[10px] font-black uppercase tracking-widest text-[#64748B]">Thành tiền</th>
              </tr>
            </thead>
            <tbody>
              {pr.items && pr.items.length > 0 ? pr.items.map((item: PRItem, idx) => (
                <tr key={item.id}>
                  <td className="text-center font-bold text-[#64748B]">{idx + 1}</td>
                  <td>
                    <div className="font-bold text-[#F8FAFC]">{item.productName || "Sản phẩm Dịch vụ"}</div>
                    {(item.description && item.description !== item.productName) && (
                      <div className="text-[10px] text-[#94A3B8] mt-1">{item.description}</div>
                    )}
                  </td>
                  <td className="text-right font-bold text-[#3B82F6]">
                    {item.qty} <span className="text-[9px] text-[#64748B] ml-1 uppercase">{item.unit || "Cái"}</span>
                  </td>
                  <td className="text-right font-semibold text-[#94A3B8]">
                    {item.estimatedPrice?.toLocaleString('vi-VN')} ₫
                  </td>
                  <td className="text-right font-black text-emerald-400">
                    {(item.qty * (item.estimatedPrice || 0)).toLocaleString('vi-VN')} ₫
                  </td>
                </tr>
              )) : (
                <tr>
                   <td colSpan={5} className="py-12 text-center text-[#64748B] font-bold text-xs uppercase tracking-widest">
                      Không có mặt hàng nào được tìm thấy
                   </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
