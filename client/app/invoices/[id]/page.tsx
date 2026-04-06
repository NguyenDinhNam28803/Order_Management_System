'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useProcurement } from '@/app/context/ProcurementContext';

export default function InvoiceDetailPage() {
  const params = useParams();
  const invoiceId = params.id as string;
  const { fetchInvoiceById, runMatching, payInvoice, notify } = useProcurement();
  const [invoice, setInvoice] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    const fetch = async () => {
      try {
        const data = await fetchInvoiceById(invoiceId);
        setInvoice(data);
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
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to process payment');
      } finally {
        setProcessing(false);
      }
    }
  };

  if (loading) return <div className="p-8">Loading...</div>;
  if (error) return <div className="p-8 text-red-600">Error: {error}</div>;
  if (!invoice) return <div className="p-8">Invoice not found</div>;

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-3xl font-bold mb-6">Invoice: {invoice.invoiceNumber}</h1>

      <div className="grid grid-cols-3 gap-4 mb-8 p-6 bg-gray-50 rounded-lg">
        <div>
          <label className="text-sm text-gray-600">Invoice Number</label>
          <p className="text-lg font-semibold">{invoice.invoiceNumber}</p>
        </div>
        <div>
          <label className="text-sm text-gray-600">Status</label>
          <span className={`px-3 py-1 rounded ${
            invoice.status === 'APPROVED' ? 'bg-green-100 text-green-800' :
            invoice.status === 'RECEIVED' ? 'bg-yellow-100 text-yellow-800' :
            invoice.status === 'EXCEPTION_REVIEW' ? 'bg-red-100 text-red-800' :
            'bg-gray-100'
          }`}>
            {invoice.status}
          </span>
        </div>
        <div>
          <label className="text-sm text-gray-600">Date</label>
          <p className="text-lg">{new Date(invoice.invoiceDate).toLocaleDateString()}</p>
        </div>
        <div>
          <label className="text-sm text-gray-600">Supplier</label>
          <p className="text-lg">{invoice.supplier?.name}</p>
        </div>
        <div>
          <label className="text-sm text-gray-600">PO Reference</label>
          <p className="text-lg">{invoice.po?.poNumber}</p>
        </div>
        <div>
          <label className="text-sm text-gray-600">Total Amount</label>
          <p className="text-lg font-semibold">{invoice.totalAmount?.toLocaleString('vi-VN')} VND</p>
        </div>
      </div>

      {invoice.status === 'EXCEPTION_REVIEW' && (
        <div className="mb-8 p-6 bg-red-50 border border-red-200 rounded-lg">
          <h3 className="text-lg font-bold text-red-800 mb-2">⚠️ Matching Exceptions</h3>
          {invoice.exceptions?.map((exc: any, idx: number) => (
            <div key={idx} className="text-red-700">
              • {exc.message}
            </div>
          ))}
        </div>
      )}

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
              {invoice.items?.map((item: any) => (
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
        {invoice.status === 'RECEIVED' && (
          <>
            <button
              onClick={handleRunMatching}
              disabled={processing}
              className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
            >
              {processing ? 'Running...' : 'Run 3-Way Matching'}
            </button>
          </>
        )}
        {(invoice.status === 'APPROVED' || invoice.status === 'EXCEPTION_REVIEW') && (
          <button
            onClick={handlePay}
            disabled={processing}
            className="bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700 disabled:opacity-50"
          >
            {processing ? 'Processing...' : 'Schedule Payment'}
          </button>
        )}
      </div>
    </div>
  );
}
