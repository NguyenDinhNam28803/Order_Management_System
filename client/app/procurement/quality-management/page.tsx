"use client";

import React, { useState, useEffect } from "react";
import { 
  ShieldCheck, 
  TrendingUp, 
  AlertTriangle, 
  FileText, 
  CheckCircle2, 
  XCircle,
  Clock,
  History,
  MessageSquare
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useProcurement } from "../../context/ProcurementContext";
import SupplierSelector from "../../components/SupplierSelector";
import DefectRateChart from "../../components/DefectRateChart";
import { QualityRiskPanel } from "../../components/QualityRiskPanel";

export default function ProcurementQualityHub() {
  const router = useRouter();
  const { apiFetch } = useProcurement();
  const [selectedSupplierId, setSelectedSupplierId] = useState<string | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [rcas, setRcas] = useState<any[]>([]);
  const [loadingRca, setLoadingRca] = useState(false);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleSupplierSelect = (supplier: any) => {
    setSelectedSupplierId(supplier.id);
    loadRcaHistory(supplier.id);
  };

  const loadRcaHistory = async (supplierId: string) => {
    setLoadingRca(true);
    try {
      const res = await apiFetch(`/quality/rca/supplier/${supplierId}`);
      if (res.ok) {
        const data = await res.json();
        setRcas(data);
      }
    } catch (e) {
      console.error("Failed to load RCA history", e);
    } finally {
      setLoadingRca(false);
    }
  };

  const updateRcaStatus = async (rcaId: string, status: 'APPROVED' | 'REJECTED') => {
    try {
      const res = await apiFetch(`/quality/rca/${rcaId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status })
      });
      if (res.ok && selectedSupplierId) {
        loadRcaHistory(selectedSupplierId);
      }
    } catch (e) {
      console.error("Failed to update RCA status", e);
    }
  };

  return (
    <main className="p-6 min-h-screen bg-[#F8FAFC]">
      {/* Header */}
      <header className="mb-8">
        <h1 className="text-3xl font-black text-slate-900 flex items-center gap-3">
          <ShieldCheck size={32} className="text-indigo-600" />
          QUẢN TRỊ CHẤT LƯỢNG NCC
        </h1>
        <p className="text-slate-500 mt-1">Trung tâm điều phối giải trình (RCA) và quản trị rủi ro nhà cung cấp.</p>
      </header>

      {/* Supplier Selection */}
      <section className="mb-8">
        <SupplierSelector onViewHistory={handleSupplierSelect} />
      </section>

      {selectedSupplierId ? (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          
          {/* Left Column: Analysis & Warning */}
          <div className="xl:col-span-2 space-y-8">
            {/* AI Warning Panel */}
            <QualityRiskPanel supplierId={selectedSupplierId} />
            
            {/* Trend Chart */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="p-4 border-b border-slate-100 bg-slate-50/50">
                <h3 className="font-bold text-slate-800 flex items-center gap-2">
                  <TrendingUp size={18} className="text-indigo-500" />
                  Phân tích xu hướng phế phẩm (365 ngày)
                </h3>
              </div>
              <div className="p-2">
                <DefectRateChart supplierId={selectedSupplierId} />
              </div>
            </div>
          </div>

          {/* Right Column: RCA Management */}
          <div className="xl:col-span-1 space-y-6">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 h-full flex flex-col">
              <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <h3 className="font-bold text-slate-800 flex items-center gap-2">
                  <History size={18} className="text-indigo-500" />
                  Lịch sử Giải trình (RCA)
                </h3>
                <span className="px-2 py-0.5 bg-indigo-100 text-indigo-700 text-[10px] font-bold rounded-full uppercase">
                  {rcas.length} Bản ghi
                </span>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-4 max-h-[800px]">
                {loadingRca ? (
                  <div className="flex justify-center py-10"><Clock className="animate-spin text-slate-300" /></div>
                ) : rcas.length > 0 ? (
                  rcas.map((rca) => (
                    <div key={rca.id} className="p-4 rounded-xl border border-slate-100 bg-slate-50 hover:border-indigo-200 transition-all">
                      <div className="flex justify-between items-start mb-2">
                        <span className={`px-2 py-1 rounded text-[10px] font-bold ${
                          rca.status === 'APPROVED' ? 'bg-green-100 text-green-700' : 
                          rca.status === 'REJECTED' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'
                        }`}>
                          {rca.status}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {new Date(rca.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <h4 className="text-sm font-bold text-slate-800 mb-1 line-clamp-1">{rca.description}</h4>
                      <p className="text-xs text-slate-600 mb-3 line-clamp-2"><b>Gốc rễ:</b> {rca.rootCause}</p>
                      
                      {rca.status === 'PENDING' && (
                        <div className="flex gap-2">
                          <button 
                            onClick={() => updateRcaStatus(rca.id, 'APPROVED')}
                            className="flex-1 py-1.5 bg-green-600 text-white text-xs font-bold rounded-lg hover:bg-green-700 transition-colors"
                          >
                            Duyệt
                          </button>
                          <button 
                            onClick={() => updateRcaStatus(rca.id, 'REJECTED')}
                            className="flex-1 py-1.5 bg-slate-200 text-slate-700 text-xs font-bold rounded-lg hover:bg-slate-300 transition-colors"
                          >
                            Từ chối
                          </button>
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="text-center py-10 text-slate-400 italic text-sm">
                    Chưa có lịch sử giải trình cho NCC này.
                  </div>
                )}
              </div>
            </div>

            {/* Strategic Action Card */}
            <div className="bg-red-50 rounded-2xl border border-red-100 p-5">
              <h3 className="text-red-900 font-bold flex items-center gap-2 mb-2">
                <AlertTriangle size={18} />
                Hành động chiến lược
              </h3>
              <p className="text-xs text-red-700 mb-4">Nếu NCC vi phạm cam kết chất lượng liên tục, bạn có thể thực hiện biện pháp mạnh.</p>
              <button className="w-full py-2.5 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 transition-shadow shadow-lg shadow-red-200 uppercase text-xs tracking-wider">
                Tạm dừng hợp tác (Suspension)
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-dashed border-slate-300 p-20 text-center">
          <ShieldCheck size={64} className="mx-auto text-slate-200 mb-4" />
          <h2 className="text-xl font-bold text-slate-400">Vui lòng chọn nhà cung cấp để bắt đầu quản trị chất lượng</h2>
          <p className="text-slate-400 text-sm mt-1">Dữ liệu phân tích và lịch sử RCA sẽ hiển thị tại đây.</p>
        </div>
      )}
    </main>
  );
}
