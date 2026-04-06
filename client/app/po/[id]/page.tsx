'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useProcurement } from '@/app/context/ProcurementContext';

export default function PODetailPage() {
  const params = useParams();
  const router = useRouter();
  const poId = params.id as string;
  const { fetchPOById, confirmPO, submitPO, notify } = useProcurement();
  const [po, setPO] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetch = async () => {
      try {
        const data = await fetchPOById(poId);
        setPO(data);
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

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-3xl font-bold mb-6">Purchase Order: {po.poNumber}</h1>

      <div className="grid grid-cols-3 gap-4 mb-8 p-6 bg-gray-50 rounded-lg">
        <div>
          <label className="text-sm text-gray-600">PO Number</label>
          <p className="text-lg font-semibold">{po.poNumber}</p>
        </div>
        <div>
          <label className="text-sm text-gray-600">Status</label>
          <p className="text-lg font-semibold">
            <span className={`px-3 py-1 rounded ${
              po.status === 'CONFIRMED' ? 'bg-green-100 text-green-800' :
              po.status === 'DRAFT' ? 'bg-yellow-100 text-yellow-800' :
              'bg-gray-100'
            }`}>
              {po.status}
            </span>
          </p>
        </div>
        <div>
          <label className="text-sm text-gray-600">Date</label>
          <p className="text-lg">{new Date(po.createdAt).toLocaleDateString()}</p>
        </div>
        <div>
          <label className="text-sm text-gray-600">Supplier</label>
          <p className="text-lg">{po.supplier?.name}</p>
        </div>
        <div>
          <label className="text-sm text-gray-600">From PR</label>
          <p className="text-lg cursor-pointer text-blue-600 hover:underline" 
             onClick={() => router.push(`/pr/${po.prId}`)}>
            {po.pr?.prNumber}
          </p>
        </div>
        <div>
          <label className="text-sm text-gray-600">Total Amount</label>
          <p className="text-lg font-semibold">{po.totalAmount?.toLocaleString('vi-VN')} VND</p>
        </div>
      </div>

      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-4">Line Items</h2>
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
              {po.items?.map((item: any) => (
                <tr key={item.id} className="border">
                  <td className="border p-3">{item.product?.name}</td>
                  <td className="border p-3 text-right">{item.quantity}</td>
                  <td className="border p-3 text-right">{item.unitPrice?.toLocaleString('vi-VN')} VND</td>
                  <td className="border p-3 text-right">{item.lineTotal?.toLocaleString('vi-VN')} VND</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex gap-4">
        {po.status === 'DRAFT' && (
          <>
            <button
              onClick={handleConfirm}
              disabled={submitting}
              className="bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700 disabled:opacity-50"
            >
              {submitting ? 'Confirming...' : 'Confirm PO'}
            </button>
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
            >
              {submitting ? 'Submitting...' : 'Submit for Approval'}
            </button>
          </>
        )}
        {po.status === 'CONFIRMED' && (
          <div className="text-green-600 font-semibold">✅ PO Confirmed - Ready for Delivery</div>
        )}
      </div>
    </div>
  );
}
