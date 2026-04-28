"use client";

import React, { useState } from "react";
import { TrendingUp, ArrowLeft, Info } from "lucide-react";
import { useRouter } from "next/navigation";
import DefectRateChart from "../../components/DefectRateChart";
import SupplierSelector from "../../components/SupplierSelector";
import { QualityRiskPanel } from "../../components/QualityRiskPanel";

/**
 * Warehouse QC Analysis Page
 * Page for WAREHOUSE role to analyze defect rate trends
 * and detect hidden quality control issues
 */
export default function WarehouseQCAnalysis() {
  const router = useRouter();
  const [selectedSupplierId, setSelectedSupplierId] = useState<string | null>(null);

  const handleViewHistory = (supplier: { id: string }) => {
    setSelectedSupplierId(supplier.id);
    // Scroll to chart section
    document.getElementById("defect-chart")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <main className="animate-in fade-in duration-500 p-6 min-h-screen bg-[#FFFFFF] text-[#000000]">
      {/* Header */}
      <header className="mb-8">
        <div className="flex items-center gap-4 mb-4">
          <button
            onClick={() => router.push("/warehouse/dashboard")}
            className="flex items-center gap-2 text-[#6b7280] hover:text-[#000000] transition-colors"
          >
            <ArrowLeft size={20} />
            <span className="text-sm font-medium">Quay lại Dashboard</span>
          </button>
        </div>
        <div className="lg:flex items-end justify-between">
          <div>
            <h1 className="text-4xl font-black tracking-tight text-[#000000] mb-2 uppercase flex items-center gap-3">
              <TrendingUp size={36} className="text-[#B4533A]" />
              Phân Tích Tỷ Lệ Lỗi
            </h1>
            <p className="text-[#000000] font-medium">
              Phát hiện các xu hướng bất thường trong tỷ lệ lỗi sản phẩm nhập kho qua 365 ngày.
            </p>
          </div>
        </div>
      </header>

      {/* Supplier Selector Section */}
      <section className="w-full mb-6">
        <SupplierSelector onViewHistory={handleViewHistory} />
      </section>

      {/* Info Banner */}
      <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-xl flex items-start gap-3">
        <Info className="text-blue-600 mt-0.5 flex-shrink-0" size={20} />
        <div className="text-sm text-blue-800">
          <p className="font-semibold mb-1">Hướng dẫn sử dụng:</p>
          <ul className="list-disc list-inside space-y-1 text-blue-700">
            <li>Chọn nhà cung cấp ở trên để xem thông tin chi tiết và tỷ lệ lỗi</li>
            <li>Biểu đồ hiển thị tỷ lệ lỗi (Defect Rate) trong 365 ngày qua</li>
            <li>Nhấn nút <strong>&quot;Scan for Hidden Issues&quot;</strong> để phát hiện các đoạn tăng liên tục bất thường</li>
            <li>Hover vào điểm bất kỳ để xem chi tiết ngày và tỷ lệ lỗi</li>
          </ul>
        </div>
      </div>

      {/* --- PHẦN TÍCH HỢP MỚI --- */}
      {selectedSupplierId && (
        <QualityRiskPanel supplierId={selectedSupplierId} />
      )}
      {/* ------------------------ */}

      {/* Chart Section */}
      <section id="defect-chart" className="w-full">
        <DefectRateChart supplierId={selectedSupplierId} />
      </section>

      {/* Additional Info Cards */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
        <div className="bg-[#FAF8F5] rounded-2xl border border-[rgba(148,163,184,0.1)] shadow-xl shadow-[#B4533A]/5 p-6">
          <h3 className="text-sm font-black uppercase tracking-widest text-[#000000] mb-3">
            Ngưỡng Cảnh Báo
          </h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-[#6b7280]">Tỷ lệ bình thường:</span>
              <span className="font-medium text-green-600">1% - 5%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#6b7280]">Cần theo dõi:</span>
              <span className="font-medium text-amber-600">5% - 8%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#6b7280]">Nguy hiểm:</span>
              <span className="font-medium text-red-600">&gt; 8%</span>
            </div>
          </div>
        </div>

        <div className="bg-[#FAF8F5] rounded-2xl border border-[rgba(148,163,184,0.1)] shadow-xl shadow-[#B4533A]/5 p-6">
          <h3 className="text-sm font-black uppercase tracking-widest text-[#000000] mb-3">
            Pattern Nguy Hiểm
          </h3>
          <ul className="space-y-2 text-sm text-[#6b7280]">
            <li className="flex items-start gap-2">
              <span className="text-red-500 font-bold">•</span>
              <span>Tăng liên tục 7+ ngày</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-red-500 font-bold">•</span>
              <span>Đột biến tăng &gt; 3% trong 1 ngày</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-red-500 font-bold">•</span>
              <span>Vượt ngưỡng 10% liên tục</span>
            </li>
          </ul>
        </div>

        <div className="bg-[#FAF8F5] rounded-2xl border border-[rgba(148,163,184,0.1)] shadow-xl shadow-[#B4533A]/5 p-6">
          <h3 className="text-sm font-black uppercase tracking-widest text-[#000000] mb-3">
            Hành Động Đề Xuất
          </h3>
          <ul className="space-y-2 text-sm text-[#6b7280]">
            <li className="flex items-start gap-2">
              <span className="text-blue-500 font-bold">1.</span>
              <span>Kiểm tra lại quy trình QC</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-500 font-bold">2.</span>
              <span>Liên hệ nhà cung cấp</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-500 font-bold">3.</span>
              <span>Tăng cường kiểm tra mẫu</span>
            </li>
          </ul>
        </div>
      </section>
    </main>
  );
}
