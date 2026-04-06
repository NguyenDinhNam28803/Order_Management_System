'use client';

import { useEffect, useState } from 'react';
import { useProcurement } from '@/app/context/ProcurementContext';
import Link from 'next/link';

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { fetchInvoices, notify } = useProcurement();

  useEffect(() => {
    const fetch = async () => {
      try {
        const data = await fetchInvoices();
        setInvoices(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load invoices');
      } finally {
        setLoading(false);
      }
    };

    fetch();
  }, [fetchInvoices]);

  if (loading) return <div className="p-8">Loading invoices...</div>;

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-3xl font-bold mb-6">Invoices</h1>

      {error && <div className="mb-4 p-4 bg-red-100 text-red-600 rounded">{error}</div>}

      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-100">
              <th className="border p-3 text-left">Invoice #</th>
              <th className="border p-3 text-left">PO Number</th>
              <th className="border p-3 text-left">Supplier</th>
              <th className="border p-3 text-right">Amount (VND)</th>
              <th className="border p-3 text-left">Status</th>
              <th className="border p-3 text-center">Action</th>
            </tr>
          </thead>
          <tbody>
            {invoices.map((inv) => (
              <tr key={inv.id} className="border hover:bg-gray-50">
                <td className="border p-3 font-semibold">{inv.invoiceNumber}</td>
                <td className="border p-3">{inv.po?.poNumber}</td>
                <td className="border p-3">{inv.supplier?.name}</td>
                <td className="border p-3 text-right font-semibold">
                  {inv.totalAmount?.toLocaleString('vi-VN')}
                </td>
                <td className="border p-3">
                  <span className={`px-3 py-1 rounded text-sm ${
                    inv.status === 'APPROVED' ? 'bg-green-100 text-green-800' :
                    inv.status === 'RECEIVED' ? 'bg-yellow-100 text-yellow-800' :
                    inv.status === 'EXCEPTION_REVIEW' ? 'bg-red-100 text-red-800' :
                    'bg-gray-100'
                  }`}>
                    {inv.status}
                  </span>
                </td>
                <td className="border p-3 text-center">
                  <Link href={`/invoices/${inv.id}`} className="text-blue-600 hover:underline">
                    View
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {invoices.length === 0 && (
        <div className="text-center py-8 text-gray-500">No invoices found</div>
      )}
    </div>
  );
}
