'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useProcurement, PO, POItem } from '@/app/context/ProcurementContext';
import { CheckCircle2, Clock, FileText, Send, ShoppingCart } from 'lucide-react';
import { formatVND } from '@/app/utils/formatUtils';
import StatusBadge from '@/app/components/shared/StatusBadge';
import { DataTable, DataTableColumn } from '@/app/components/shared/DataTable';
import {
    DetailPage, BackLink, DetailHeader, DetailGrid, DetailMain, DetailSide,
    Section, InfoCell, InfoGrid,
} from '@/app/components/shared/DetailPrimitives';

type ExtendedPOItem = POItem;

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
      setPO(updated as POWithDetails);
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
      setPO(updated as POWithDetails);
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

  const itemColumns: DataTableColumn<ExtendedPOItem>[] = [
    { label: "Sản phẩm / Dịch vụ", render: (item) => <span className="font-bold text-slate-900">{item.description || "N/A"}</span> },
    { label: "Số lượng", align: "right", render: (item) => <span className="font-bold text-[#2563EB] num-display">{item.qty}</span> },
    { label: "Đơn giá", align: "right", render: (item) => <span className="font-semibold text-slate-900 num-display">{formatVND(item.unitPrice)} ₫</span> },
    { label: "Tổng cộng", align: "right", render: (item) => <span className="font-black text-slate-900 num-display">{formatVND(item.total)} ₫</span> },
  ];

  return (
    <DetailPage>
      <BackLink href="/procurement/pos" label="Quay lại danh sách" />
      <DetailHeader
        icon={FileText}
        title="Chi tiết Đơn hàng (PO)"
        subtitle={`Mã: ${po.poNumber || po.id.split('-').pop()}`}
        aside={<StatusBadge status={po.status} />}
        actions={
          po.status === 'DRAFT' ? (
            <>
              <button onClick={handleConfirm} disabled={submitting} className="btn-success text-xs uppercase tracking-widest">
                {submitting ? <Clock size={16} className="animate-spin" /> : <CheckCircle2 size={16} />} Xác nhận PO
              </button>
              <button onClick={handleSubmit} disabled={submitting} className="btn-primary text-xs uppercase tracking-widest">
                {submitting ? <Clock size={16} className="animate-spin" /> : <Send size={16} />} Gửi phê duyệt
              </button>
            </>
          ) : po.status === 'CONFIRMED' ? (
            <div className="text-emerald-700 font-bold bg-[#10B981]/10 px-4 py-2 rounded-xl border border-[#10B981]/30 flex items-center gap-2 text-sm">
              <CheckCircle2 size={16} /> PO đã xác nhận — sẵn sàng giao hàng
            </div>
          ) : undefined
        }
      />

      <DetailGrid>
        <DetailMain>
          <Section title="Thông tin đơn hàng" icon={FileText}>
            <InfoGrid cols={2}>
              <InfoCell label="Mã PO" value={po.poNumber || po.id.split('-').pop()} />
              <InfoCell label="Nhà cung cấp" value={po.supplier?.name || "N/A"} />
              <InfoCell
                label="PR tham chiếu"
                value={
                  <span className="text-[#2563EB] cursor-pointer hover:underline" onClick={() => po.prId && router.push(`/pr/${po.prId}`)}>
                    {po.pr?.prNumber || (po.prId ? `PR-${po.prId.substring(0, 8)}...` : 'N/A')}
                  </span>
                }
              />
              <InfoCell label="Ngày tạo" value={po.createdAt ? new Date(po.createdAt).toLocaleDateString('vi-VN') : 'N/A'} />
            </InfoGrid>
          </Section>

          <Section title="Chi tiết sản phẩm" icon={ShoppingCart}>
            <DataTable
              columns={itemColumns}
              data={po.items ?? []}
              getRowKey={(it, i) => it.id ?? i}
              emptyMessage="Không có mặt hàng nào"
              emptyDescription="Chi tiết sản phẩm của PO sẽ hiển thị tại đây"
            />
          </Section>
        </DetailMain>

        <DetailSide>
          <Section title="Tổng mua tiêu chuẩn">
            <div className="text-2xl font-bold text-slate-900 num-display">{formatVND(po.totalAmount)} <span className="text-base text-[#2563EB]">VND</span></div>
          </Section>
        </DetailSide>
      </DetailGrid>
    </DetailPage>
  );
}
