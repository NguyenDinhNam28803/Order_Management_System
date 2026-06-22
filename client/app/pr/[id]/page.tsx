'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useProcurement } from '@/app/context/ProcurementContext';
import { PR, PRItem } from '@/app/types/api-types';
import { Clock, FileText, Send, Calendar, ShoppingCart } from 'lucide-react';
import { formatVND, convertPrismaDecimal } from '@/app/utils/formatUtils';
import StatusBadge from '@/app/components/shared/StatusBadge';
import { DataTable, DataTableColumn } from '@/app/components/shared/DataTable';
import {
    DetailPage, BackLink, DetailHeader, DetailGrid, DetailMain, DetailSide,
    Section, InfoCell, InfoGrid, InfoRow,
} from '@/app/components/shared/DetailPrimitives';

export default function PRDetailPage() {
  const params = useParams();
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

  if (loading) return <div className="p-8 text-slate-900">Loading...</div>;
  if (error) return <div className="p-8 text-rose-600">Error: {error}</div>;
  if (!pr) return <div className="p-8 text-slate-900">PR not found</div>;

  const deptName =
    typeof pr.department === 'object' && pr.department?.name ? pr.department.name
    : typeof pr.department === 'string' ? pr.department
    : pr.deptId ? "Phòng ban #" + pr.deptId.substring(0, 8)
    : "N/A";

  const itemColumns: DataTableColumn<PRItem>[] = [
    {
      label: "Sản phẩm / Dịch vụ",
      render: (item) => (
        <div>
          <div className="font-bold text-slate-900">{item.productName || "Sản phẩm Dịch vụ"}</div>
          {item.description && item.description !== item.productName && (
            <div className="text-[10px] text-slate-500 mt-1">{item.description}</div>
          )}
        </div>
      ),
    },
    {
      label: "Số lượng", align: "right",
      render: (item) => <span className="font-bold text-[#2563EB] num-display">{item.qty} <span className="text-[0.6875rem] text-slate-500 ml-1 uppercase">{item.unit || "Cái"}</span></span>,
    },
    {
      label: "Đơn giá (Ước tính)", align: "right",
      render: (item) => <span className="font-semibold text-slate-900 num-display">{formatVND(item.estimatedPrice)} ₫</span>,
    },
    {
      label: "Thành tiền", align: "right",
      render: (item) => <span className="font-black text-slate-900 num-display">{formatVND(item.qty * convertPrismaDecimal(item.estimatedPrice))} ₫</span>,
    },
  ];

  return (
    <DetailPage>
      <BackLink href="/pr" label="Quay lại danh sách" />
      <DetailHeader
        icon={FileText}
        title="Chi tiết Yêu cầu (PR)"
        subtitle={`Mã: ${pr.prNumber || pr.id.split('-')[0].toUpperCase()}`}
        aside={<StatusBadge status={pr.status} />}
        actions={pr.status === 'DRAFT' ? (
          <button onClick={handleSubmit} disabled={submitting} className="btn-primary text-xs uppercase tracking-widest">
            {submitting ? <><Clock size={16} className="animate-spin" /> Đang gửi...</> : <><Send size={16} /> Trình phê duyệt</>}
          </button>
        ) : undefined}
      />

      <DetailGrid>
        <DetailMain>
          <Section title="Thông tin chung" icon={FileText}>
            <InfoGrid cols={3}>
              <InfoCell label="Mã yêu cầu" value={pr.prNumber || pr.id.split('-')[0].toUpperCase()} />
              <InfoCell label="Bộ phận" value={deptName} />
              <InfoCell label="Người yêu cầu" value={pr.requester?.fullName || "Chưa cập nhật"} />
              <InfoCell label="Mục đích / Tiêu đề" value={pr.title || "Yêu cầu mua sắm vật tư"} className="col-span-2 md:col-span-3" />
            </InfoGrid>
          </Section>

          <Section title="Danh mục hàng hóa" icon={ShoppingCart}>
            <DataTable
              columns={itemColumns}
              data={pr.items ?? []}
              getRowKey={(it, i) => it.id ?? i}
              emptyMessage="Không có mặt hàng nào"
              emptyDescription="Danh mục hàng hóa của PR sẽ hiển thị tại đây"
            />
          </Section>
        </DetailMain>

        <DetailSide>
          <Section title="Tổng giá trị (dự kiến)">
            <div className="text-2xl font-bold text-slate-900 num-display">{formatVND(pr.totalEstimate)} <span className="text-base text-[#64748B]">VND</span></div>
            <div className="mt-6 space-y-1 pt-4 border-t border-slate-200">
              <InfoRow label={<span className="flex items-center gap-1"><Calendar size={14} /> Ngày tạo</span>} value={new Date(pr.createdAt).toLocaleDateString('vi-VN')} />
              <InfoRow label="Số lượng SP" value={`${pr.items?.length || 0} mặt hàng`} />
            </div>
          </Section>
        </DetailSide>
      </DetailGrid>
    </DetailPage>
  )
}
