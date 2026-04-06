'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useProcurement } from '@/app/context/ProcurementContext';
import { PR, PRItem } from '@/app/types/api-types';

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

  if (loading) return <div className="p-8 text-[#F8FAFC]">Loading...</div>;
  if (error) return <div className="p-8 text-rose-400">Error: {error}</div>;
  if (!pr) return <div className="p-8 text-[#F8FAFC]">PR not found</div>;

  return (
    <div className="container mx-auto p-8 min-h-screen bg-[#0F1117] text-[#F8FAFC]">
      <h1 className="text-3xl font-bold mb-6 text-[#F8FAFC]">PR Details: {pr.prNumber}</h1>

      <div className="grid grid-cols-2 gap-6 mb-8 p-6 bg-[#161922] rounded-lg border border-[rgba(148,163,184,0.1)]">
        <div>
          <label className="text-sm text-[#64748B]">Request Number</label>
          <p className="text-lg font-semibold text-[#F8FAFC]">{pr.prNumber}</p>
        </div>
        <div>
          <label className="text-sm text-[#64748B]">Status</label>
          <p className="text-lg font-semibold text-[#F8FAFC]">{pr.status}</p>
        </div>
        <div>
          <label className="text-sm text-[#64748B]">Department</label>
          <p className="text-lg text-[#94A3B8]">{pr.deptId}</p>
        </div>
        <div>
          <label className="text-sm text-[#64748B]">Requestor</label>
          <p className="text-lg text-[#94A3B8]">{pr.requester?.fullName}</p>
        </div>
        <div>
          <label className="text-sm text-[#64748B]">Created Date</label>
          <p className="text-lg text-[#94A3B8]">{new Date(pr.createdAt).toLocaleDateString()}</p>
        </div>
        <div>
          <label className="text-sm text-[#64748B]">Total Amount</label>
          <p className="text-lg font-semibold text-emerald-400">{pr.totalEstimate?.toLocaleString('vi-VN')} VND</p>
        </div>
      </div>

      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-4 text-[#F8FAFC]">Items</h2>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-[#161922]">
                <th className="border border-[rgba(148,163,184,0.1)] p-3 text-left text-[#64748B]">Product</th>
                <th className="border border-[rgba(148,163,184,0.1)] p-3 text-right text-[#64748B]">Qty</th>
                <th className="border border-[rgba(148,163,184,0.1)] p-3 text-right text-[#64748B]">Unit Price</th>
                <th className="border border-[rgba(148,163,184,0.1)] p-3 text-right text-[#64748B]">Total</th>
              </tr>
            </thead>
            <tbody>
              {pr.items?.map((item: PRItem) => (
                <tr key={item.id} className="border border-[rgba(148,163,184,0.1)]">
                  <td className="border border-[rgba(148,163,184,0.1)] p-3 text-[#F8FAFC]">{item.productName || item.description}</td>
                  <td className="border border-[rgba(148,163,184,0.1)] p-3 text-right text-[#94A3B8]">{item.qty}</td>
                  <td className="border border-[rgba(148,163,184,0.1)] p-3 text-right text-[#94A3B8]">
                    {item.unit?.toLocaleString()} VND
                  </td>
                  <td className="border border-[rgba(148,163,184,0.1)] p-3 text-right text-[#F8FAFC] font-semibold">
                    {(item.qty * item.estimatedPrice)?.toLocaleString('vi-VN')} VND
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {pr.status === 'DRAFT' && (
        <button
          onClick={handleSubmit}
          disabled={submitting}
          className="bg-[#3B82F6] text-white px-6 py-2 rounded hover:bg-[#2563EB] disabled:opacity-50 transition-colors"
        >
          {submitting ? 'Submitting...' : 'Submit For Approval'}
        </button>
      )}
    </div>
  );
}
