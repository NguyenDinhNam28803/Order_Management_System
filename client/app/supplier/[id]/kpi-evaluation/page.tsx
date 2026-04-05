'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { supplierKPIAPI } from '@/app/utils/api-client';

interface KPIMetric {
  metric: string;
  score: number;
  weight: number;
  points: number;
}

export default function SupplierKPIPage() {
  const params = useParams();
  const supplierId = params.id as string;
  const [kpiData, setKPIData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [evaluating, setEvaluating] = useState(false);

  useEffect(() => {
    const fetchKPI = async () => {
      try {
        const report = await supplierKPIAPI.getReport(supplierId);
        setKPIData(report);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load KPI report');
      } finally {
        setLoading(false);
      }
    };

    if (supplierId) fetchKPI();
  }, [supplierId]);

  const handleEvaluate = async () => {
    try {
      setEvaluating(true);
      const result = await supplierKPIAPI.evaluate(supplierId);
      setKPIData(result);
      alert('Supplier evaluation completed');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to evaluate supplier');
    } finally {
      setEvaluating(false);
    }
  };

  if (loading) return <div className="p-8">Loading KPI data...</div>;

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-3xl font-bold mb-6">Supplier Performance Evaluation</h1>

      {error && (
        <div className="mb-4 p-4 bg-red-100 text-red-600 rounded">
          {error}
        </div>
      )}

      {!kpiData ? (
        <div className="text-center py-8">
          <p className="mb-4 text-gray-600">No KPI data available yet</p>
          <button
            onClick={handleEvaluate}
            disabled={evaluating}
            className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {evaluating ? 'Evaluating...' : 'Run Supplier Evaluation'}
          </button>
        </div>
      ) : (
        <>
          <div className="mb-8 p-6 bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg">
            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="text-sm text-gray-600">Supplier</label>
                <p className="text-2xl font-bold">{kpiData.supplier?.name}</p>
              </div>
              <div>
                <label className="text-sm text-gray-600">Evaluation Period</label>
                <p className="text-xl font-semibold">{kpiData.quarter}</p>
              </div>
            </div>
          </div>

          <div className="mb-8 p-8 bg-gradient-to-r from-yellow-50 to-yellow-100 rounded-lg border-2 border-yellow-300">
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-2">OVERALL PERFORMANCE SCORE</p>
              <p className="text-6xl font-bold text-yellow-600">{kpiData.score?.toFixed(1)}%</p>
              <p className="text-2xl font-semibold mt-4">
                Tier: <span className={`px-4 py-1 rounded ${
                  kpiData.tier === 'GOLD' ? 'bg-yellow-400 text-yellow-900' :
                  kpiData.tier === 'SILVER' ? 'bg-gray-300 text-gray-900' :
                  'bg-orange-400 text-orange-900'
                }`}>
                  🏆 {kpiData.tier}
                </span>
              </p>
            </div>
          </div>

          <div className="mb-8">
            <h2 className="text-2xl font-bold mb-4">6 Performance Metrics</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                { metric: 'On-Time Delivery', weight: '25%', data: kpiData.metrics?.onTimeDelivery },
                { metric: 'Quality Score (3-Way Match)', weight: '20%', data: kpiData.metrics?.qualityScore },
                { metric: 'Price Competitiveness', weight: '20%', data: kpiData.metrics?.priceCompetitiveness },
                { metric: 'Invoice Accuracy', weight: '15%', data: kpiData.metrics?.invoiceAccuracy },
                { metric: 'Responsiveness (RFQ)', weight: '10%', data: kpiData.metrics?.responsiveness },
                { metric: 'Order Fulfillment', weight: '10%', data: kpiData.metrics?.orderFulfillment },
              ].map((item, idx) => (
                <div key={idx} className="p-4 border rounded-lg bg-white hover:shadow-lg transition">
                  <div className="flex justify-between mb-2">
                    <h3 className="font-semibold">{item.metric}</h3>
                    <span className="text-sm text-gray-600">Weight: {item.weight}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                    <div
                      className={`h-2 rounded-full ${
                        item.data?.score >= 90 ? 'bg-green-600' :
                        item.data?.score >= 70 ? 'bg-yellow-600' :
                        'bg-red-600'
                      }`}
                      style={{ width: `${item.data?.score || 0}%` }}
                    />
                  </div>
                  <p className="text-lg font-bold">{item.data?.score?.toFixed(1) || 0}%</p>
                  {item.data?.details && (
                    <p className="text-xs text-gray-500 mt-2">
                      {JSON.stringify(item.data.details).substring(0, 50)}...
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-4">
            <button
              onClick={handleEvaluate}
              disabled={evaluating}
              className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
            >
              {evaluating ? 'Re-evaluating...' : 'Re-evaluate Supplier'}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
