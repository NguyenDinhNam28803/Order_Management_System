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

  if (loading) return <div className="p-8">Loading...</div>;
  if (error) return <div className="p-8 text-red-600">Error: {error}</div>;
  if (!pr) return <div className="p-8">PR not found</div>;

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-3xl font-bold mb-6">PR Details: {pr.prNumber}</h1>

      <div className="grid grid-cols-2 gap-6 mb-8 p-6 bg-gray-50 rounded-lg">
        <div>
          <label className="text-sm text-gray-600">Request Number</label>
          <p className="text-lg font-semibold">{pr.prNumber}</p>
        </div>
        <div>
          <label className="text-sm text-gray-600">Status</label>
          <p className="text-lg font-semibold">{pr.status}</p>
        </div>
        <div>
          <label className="text-sm text-gray-600">Department</label>
          <p className="text-lg">{pr.deptId}</p>
        </div>
        <div>
          <label className="text-sm text-gray-600">Requestor</label>
          <p className="text-lg">{pr.requester?.fullName}</p>
        </div>
        <div>
          <label className="text-sm text-gray-600">Created Date</label>
          <p className="text-lg">{new Date(pr.createdAt).toLocaleDateString()}</p>
        </div>
        <div>
          <label className="text-sm text-gray-600">Total Amount</label>
          <p className="text-lg font-semibold">{pr.totalEstimate?.toLocaleString('vi-VN')} VND</p>
        </div>
      </div>

      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-4">Items</h2>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-100">
                <th className="border p-3 text-left">Product</th>
                <th className="border p-3 text-right">Qty</th>
                <th className="border p-3 text-right">Unit Price</th>
                <th className="border p-3 text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              {pr.items?.map((item: PRItem) => (
                <tr key={item.id} className="border">
                  <td className="border p-3">{item.productName || item.description}</td>
                  <td className="border p-3 text-right">{item.qty}</td>
                  <td className="border p-3 text-right">
                    {item.unit?.toLocaleString()} VND
                  </td>
                  <td className="border p-3 text-right">
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
          className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {submitting ? 'Submitting...' : 'Submit For Approval'}
        </button>
      )}
    </div>
  );
}
