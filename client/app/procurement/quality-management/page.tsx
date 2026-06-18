"use client";

import React, { useState } from "react";
import {
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Clock,
  History,
  ClipboardList,
} from "lucide-react";
import PageHeader from "../../components/shared/PageHeader";
import { useProcurement } from "../../context/ProcurementContext";
import SupplierSelector from "../../components/SupplierSelector";
import DefectRateChart from "../../components/DefectRateChart";
import { QualityRiskPanel } from "../../components/QualityRiskPanel";

type RcaStatus = "PENDING" | "APPROVED" | "REJECTED";

interface Rca {
  id: string;
  status: RcaStatus;
  description: string;
  rootCause: string;
  createdAt: string;
}

export default function ProcurementQualityHub() {
  const { apiFetch } = useProcurement();
  const [selectedSupplierId, setSelectedSupplierId] = useState<string | null>(null);
  const [rcas, setRcas] = useState<Rca[]>([]);
  const [loadingRca, setLoadingRca] = useState(false);

  const handleSupplierSelect = (supplier: { id: string }) => {
    setSelectedSupplierId(supplier.id);
    loadRcaHistory(supplier.id);
  };

  const loadRcaHistory = async (supplierId: string) => {
    setLoadingRca(true);
    try {
      const res = await apiFetch(`/quality/rca/supplier/${supplierId}`);
      if (res.ok) {
        const data = await res.json();
        setRcas(Array.isArray(data) ? data : []);
      }
    } catch (e) {
      console.error("Failed to load RCA history", e);
    } finally {
      setLoadingRca(false);
    }
  };

  const updateRcaStatus = async (rcaId: string, status: "APPROVED" | "REJECTED") => {
    try {
      const res = await apiFetch(`/quality/rca/${rcaId}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      });
      if (res.ok && selectedSupplierId) {
        loadRcaHistory(selectedSupplierId);
      }
    } catch (e) {
      console.error("Failed to update RCA status", e);
    }
  };

  const kpis = [
    { label: "Tổng RCA", value: rcas.length, icon: ClipboardList, color: "text-[#2563EB]", bg: "bg-[#2563EB]/10" },
    { label: "Chờ duyệt", value: rcas.filter((r) => r.status === "PENDING").length, icon: Clock, color: "text-amber-600", bg: "bg-amber-500/10" },
    { label: "Đã duyệt", value: rcas.filter((r) => r.status === "APPROVED").length, icon: CheckCircle2, color: "text-emerald-600", bg: "bg-emerald-500/10" },
    { label: "Bị từ chối", value: rcas.filter((r) => r.status === "REJECTED").length, icon: XCircle, color: "text-rose-600", bg: "bg-rose-500/10" },
  ];

  return (
    <main className="p-6 space-y-6">
      <PageHeader
        icon={ShieldCheck}
        iconColor="green"
        title="Quản lý Chất lượng"
        subtitle="Trung tâm điều phối giải trình (RCA) và quản trị rủi ro nhà cung cấp"
      />

      {/* Supplier Selection */}
      <section>
        <SupplierSelector onViewHistory={handleSupplierSelect} />
      </section>

      {selectedSupplierId ? (
        <>
          {/* KPI Row */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {kpis.map((kpi) => (
              <div key={kpi.label} className="kpi-card">
                <div className={`kpi-icon ${kpi.bg} ${kpi.color}`}>
                  <kpi.icon size={20} />
                </div>
                <div>
                  <div className="kpi-label">{kpi.label}</div>
                  <div className="kpi-value">{kpi.value}</div>
                </div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            {/* Left Column: Analysis & Warning */}
            <div className="xl:col-span-2 space-y-6">
              <QualityRiskPanel supplierId={selectedSupplierId} />
              <DefectRateChart supplierId={selectedSupplierId} />
            </div>

            {/* Right Column: RCA Management */}
            <div className="xl:col-span-1 space-y-6">
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
                <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
                  <h3 className="font-bold text-slate-900 flex items-center gap-2">
                    <History size={18} className="text-[#2563EB]" />
                    Lịch sử Giải trình (RCA)
                  </h3>
                  <span className="px-2 py-0.5 bg-[#2563EB]/10 text-[#2563EB] text-[0.6875rem] font-bold rounded-full uppercase">
                    {rcas.length} Bản ghi
                  </span>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-4 max-h-[800px]">
                  {loadingRca ? (
                    <div className="flex justify-center py-10"><Clock className="animate-spin text-slate-300" /></div>
                  ) : rcas.length > 0 ? (
                    rcas.map((rca) => (
                      <div key={rca.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50 hover:border-[#2563EB]/30 transition-all">
                        <div className="flex justify-between items-start mb-2">
                          <span className={`px-2 py-1 rounded text-[0.6875rem] font-bold uppercase ${
                            rca.status === "APPROVED" ? "bg-emerald-500/10 text-emerald-700" :
                            rca.status === "REJECTED" ? "bg-rose-500/10 text-rose-700" : "bg-amber-500/10 text-amber-700"
                          }`}>
                            {rca.status}
                          </span>
                          <span className="text-[0.6875rem] text-slate-400">
                            {new Date(rca.createdAt).toLocaleDateString("vi-VN")}
                          </span>
                        </div>
                        <h4 className="text-sm font-bold text-slate-900 mb-1 line-clamp-1">{rca.description}</h4>
                        <p className="text-xs text-slate-600 mb-3 line-clamp-2"><b>Gốc rễ:</b> {rca.rootCause}</p>

                        {rca.status === "PENDING" && (
                          <div className="flex gap-2">
                            <button
                              onClick={() => updateRcaStatus(rca.id, "APPROVED")}
                              className="flex-1 py-1.5 bg-emerald-600 text-white text-xs font-bold rounded-lg hover:bg-emerald-700 transition-colors"
                            >
                              Duyệt
                            </button>
                            <button
                              onClick={() => updateRcaStatus(rca.id, "REJECTED")}
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
              <div className="bg-rose-50 rounded-xl border border-rose-100 p-5">
                <h3 className="text-rose-900 font-bold flex items-center gap-2 mb-2">
                  <AlertTriangle size={18} />
                  Hành động chiến lược
                </h3>
                <p className="text-xs text-rose-700 mb-4">Nếu NCC vi phạm cam kết chất lượng liên tục, bạn có thể thực hiện biện pháp mạnh.</p>
                <button className="w-full py-2.5 bg-rose-600 text-white font-bold rounded-xl hover:bg-rose-700 transition-all shadow-lg shadow-rose-200 uppercase text-xs tracking-wider">
                  Tạm dừng hợp tác (Suspension)
                </button>
              </div>
            </div>
          </div>
        </>
      ) : (
        <div className="bg-white rounded-xl border border-dashed border-slate-300 p-20 text-center">
          <ShieldCheck size={64} className="mx-auto text-slate-200 mb-4" />
          <h2 className="text-xl font-bold text-slate-400">Vui lòng chọn nhà cung cấp để bắt đầu quản trị chất lượng</h2>
          <p className="text-slate-400 text-sm mt-1">Dữ liệu phân tích và lịch sử RCA sẽ hiển thị tại đây.</p>
        </div>
      )}
    </main>
  );
}
