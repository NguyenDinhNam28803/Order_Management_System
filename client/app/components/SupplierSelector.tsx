"use client";

import React, { useMemo, useState, useEffect, useCallback } from "react";
import Select, { components, StylesConfig, OptionProps, SingleValueProps } from "react-select";
import {
  Building2,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Package,
  TrendingUp,
  RotateCcw,
  ChevronDown,
  Search,
  Loader2,
} from "lucide-react";
import { useProcurement, Organization } from "../context/ProcurementContext";

// --- Types ---

type SupplierStatus = "Active" | "Inactive" | "On Watch";

interface Supplier {
  id: string;
  name: string;
  code: string;
  status: SupplierStatus;
  defectRate: number;
  recentShipments: number;
  location: string;
  category: string;
  kycStatus: string;
  supplierTier?: string;
  trustScore: number;
}

interface KpiData {
  qualityScore?: number;
  overallScore?: number;
  otdScore?: number;
  priceScore?: number;
  manualScore?: number;
  tier?: string;
}

// --- Helper Functions ---

const getStatusConfig = (status: SupplierStatus) => {
  switch (status) {
    case "Active":
      return {
        color: "bg-green-100 text-green-700 border-green-200",
        icon: CheckCircle2,
        dotColor: "bg-green-500",
      };
    case "On Watch":
      return {
        color: "bg-red-100 text-red-700 border-red-200",
        icon: AlertTriangle,
        dotColor: "bg-red-500",
      };
    case "Inactive":
      return {
        color: "bg-gray-100 text-gray-600 border-gray-200",
        icon: XCircle,
        dotColor: "bg-gray-400",
      };
  }
};

const getDefectRateColor = (rate: number) => {
  // Handle NaN or invalid values
  if (isNaN(rate) || rate === undefined || rate === null) {
    return "text-gray-500 font-medium";
  }
  if (rate > 7) return "text-red-600 font-bold";
  if (rate > 5) return "text-amber-600 font-medium";
  return "text-green-600 font-medium";
};

// Helper to format defect rate, showing 0% for invalid values
const formatDefectRate = (rate: number): string => {
  if (isNaN(rate) || rate === undefined || rate === null) {
    return "0.0";
  }
  return rate.toFixed(1);
};

// --- React Select Custom Components ---

interface SelectOption {
  value: string;
  label: string;
  supplier: Supplier;
}

const CustomOption = (props: OptionProps<SelectOption>) => {
  const { data } = props;
  const supplier = data.supplier;
  const statusConfig = getStatusConfig(supplier.status);

  return (
    <components.Option {...props}>
      <div className="flex items-center justify-between py-1">
        <div className="flex items-center gap-3">
          <div className={`w-2 h-2 rounded-full ${statusConfig.dotColor}`} />
          <div>
            <div className="font-medium text-gray-900">{supplier.name}</div>
            <div className="text-xs text-gray-500">
              {supplier.code} • {supplier.category} • {supplier.location}
            </div>
          </div>
        </div>
        <div className="text-right">
          <div className={`text-sm ${getDefectRateColor(supplier.defectRate)}`}>
            {formatDefectRate(supplier.defectRate)}%
          </div>
          <div className="text-xs text-gray-400">Defect Rate</div>
        </div>
      </div>
    </components.Option>
  );
};

const CustomSingleValue = (props: SingleValueProps<SelectOption>) => {
  const { data } = props;
  const supplier = data.supplier;

  return (
    <components.SingleValue {...props}>
      <div className="flex items-center gap-2">
        <Building2 size={18} className="text-gray-500" />
        <span className="font-medium">{supplier.name}</span>
        <span className="text-gray-400 text-sm">({supplier.id})</span>
      </div>
    </components.SingleValue>
  );
};

// --- Main Component ---

interface SupplierSelectorProps {
  onViewHistory?: (supplier: Supplier) => void;
}

const SupplierSelector: React.FC<SupplierSelectorProps> = ({ onViewHistory }) => {
  const { organizations, apiFetch, currentUser } = useProcurement();
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [suppliersData, setSuppliersData] = useState<Supplier[]>([]);
  const [loadingSuppliers, setLoadingSuppliers] = useState(true);

  // Map Organization to Supplier with status logic
  const mapOrganizationToSupplier = useCallback((org: Organization): Supplier => {
    // Determine status based on KYC status and trust score
    let status: SupplierStatus = "Active";
    if (!org.isActive || org.kycStatus === "REJECTED") {
      status = "Inactive";
    } else if (org.kycStatus === "UNDER_REVIEW" || org.trustScore < 70) {
      status = "On Watch";
    }

    // Calculate defect rate from trust score (inverse relationship)
    // Trust score 100 -> defect rate 0%, Trust score 0 -> defect rate 10%
    const defectRate = Math.max(0.1, Math.min(10, (100 - org.trustScore) / 10));

    return {
      id: org.id,
      name: org.name,
      code: org.code,
      status,
      defectRate: parseFloat(defectRate.toFixed(1)),
      recentShipments: Math.floor(Math.random() * 50) + 1, // Placeholder - would come from GRN data
      location: org.countryCode === "VN" ? "Việt Nam" : org.countryCode || "N/A",
      category: org.industry || "Chưa phân loại",
      kycStatus: org.kycStatus,
      supplierTier: org.supplierTier,
      trustScore: org.trustScore,
    };
  }, []);

  // Fetch KPI data for a supplier
  const fetchSupplierKPI = useCallback(async (supplierId: string): Promise<KpiData | null> => {
    if (!currentUser?.orgId) return null;
    try {
      const resp = await apiFetch(`/supplier-kpis/report/${supplierId}`, {
        method: "POST",
        body: JSON.stringify({ orgId: currentUser.orgId }),
      });
      if (resp.ok) {
        const result = await resp.json();
        const data = result.data || result;
        if (Array.isArray(data) && data.length > 0) {
          const latest = data[0];
          return {
            qualityScore: latest.qualityScore || latest.kpiScore?.qualityScore,
            overallScore: latest.overallScore || latest.kpiScore?.overallScore,
            otdScore: latest.otdScore || latest.kpiScore?.otdScore,
            priceScore: latest.priceScore || latest.kpiScore?.priceScore,
            manualScore: latest.manualScore || latest.kpiScore?.manualScore,
            tier: latest.tier || latest.kpiScore?.tier,
          };
        }
      }
    } catch (error) {
      console.warn("Failed to fetch KPI for supplier:", supplierId);
    }
    return null;
  }, [apiFetch, currentUser?.orgId]);

  // Load suppliers from organizations
  useEffect(() => {
    const loadSuppliers = async () => {
      setLoadingSuppliers(true);
      
      // Filter suppliers from organizations (companyType === "SUPPLIER" or has supplier data)
      const supplierOrgs = (organizations || []).filter(
        (org: Organization) => 
          org.companyType === "SUPPLIER" || 
          org.companyType === "BOTH" ||
          org.supplierTier ||
          org.kycStatus !== "PENDING"
      );

      // Map to Supplier interface
      let mappedSuppliers = supplierOrgs.map(mapOrganizationToSupplier);

      // If no suppliers found in API, fallback to empty array
      if (mappedSuppliers.length === 0) {
        setSuppliersData([]);
        setLoadingSuppliers(false);
        return;
      }

      // Fetch KPI data for each supplier to get actual defect rate
      const suppliersWithKPI = await Promise.all(
        mappedSuppliers.map(async (supplier) => {
          const kpi = await fetchSupplierKPI(supplier.id);
          if (kpi?.qualityScore !== undefined) {
            // Convert quality score (0-100) to defect rate (0-10%)
            // Quality 100 -> Defect 0%, Quality 0 -> Defect 10%
            const defectRate = Math.max(0.1, Math.min(10, (100 - kpi.qualityScore) / 10));
            return {
              ...supplier,
              defectRate: parseFloat(defectRate.toFixed(1)),
              supplierTier: kpi.tier || supplier.supplierTier,
            };
          }
          return supplier;
        })
      );

      setSuppliersData(suppliersWithKPI);
      setLoadingSuppliers(false);
    };

    loadSuppliers();
  }, [organizations, mapOrganizationToSupplier, fetchSupplierKPI]);

  // Select options for react-select
  const selectOptions = useMemo(
    () =>
      suppliersData.map((supplier) => ({
        value: supplier.id,
        label: supplier.name,
        supplier,
      })),
    [suppliersData]
  );

  // Handle selection change
  const handleChange = (option: SelectOption | null) => {
    if (!option) return;

    setIsLoading(true);
    setTimeout(() => {
      setSelectedSupplier(option.supplier);
      // Gọi onViewHistory để trang cha nhận được sự kiện chọn NCC
      if (onViewHistory) {
        onViewHistory(option.supplier);
      }
      setIsLoading(false);
    }, 300);
  };

  // Reset selection
  const handleReset = () => {
    setSelectedSupplier(null);
  };

  // Custom styles for react-select
  const customStyles: StylesConfig<SelectOption> = {
    control: (base) => ({
      ...base,
      minHeight: "48px",
      borderRadius: "12px",
      borderColor: "#e5e7eb",
      boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
      "&:hover": {
        borderColor: "#d1d5db",
      },
    }),
    option: (base, state) => ({
      ...base,
      backgroundColor: state.isSelected
        ? "#eff6ff"
        : state.isFocused
        ? "#f3f4f6"
        : "white",
      color: state.isSelected ? "#1e40af" : "#1f2937",
      cursor: "pointer",
    }),
    menu: (base) => ({
      ...base,
      borderRadius: "12px",
      boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)",
    }),
  };

  const selectedStatus = selectedSupplier
    ? getStatusConfig(selectedSupplier.status)
    : null;

  return (
    <div className="w-full space-y-6">
      {/* Header Section */}
      <div className="bg-gradient-to-r from-gray-50 to-white rounded-xl border border-gray-200 p-6">
        <div className="flex flex-col lg:flex-row lg:items-center gap-4">
          {/* Label */}
          <div className="flex-shrink-0">
            <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
              <Building2 size={18} className="text-[#B4533A]" />
              Chọn Nhà Cung Cấp
            </label>
            <p className="text-xs text-gray-500 mt-1">
              Chọn để xem chi tiết tỷ lệ lỗi và lịch sử
            </p>
          </div>

          {/* Select Dropdown */}
          <div className="flex-1 max-w-xl">
            {loadingSuppliers ? (
              <div className="flex items-center gap-3 px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl">
                <Loader2 size={20} className="animate-spin text-gray-400" />
                <span className="text-sm text-gray-500">Đang tải danh sách nhà cung cấp...</span>
              </div>
            ) : (
              <Select<SelectOption>
                options={selectOptions}
                components={{
                  Option: CustomOption,
                  SingleValue: CustomSingleValue,
                  DropdownIndicator: (props) => (
                    <components.DropdownIndicator {...props}>
                      <ChevronDown size={20} className="text-gray-400" />
                    </components.DropdownIndicator>
                  ),
                }}
                styles={customStyles}
                placeholder={suppliersData.length === 0 ? "Không có nhà cung cấp" : "Tìm kiếm nhà cung cấp..."}
                isClearable={false}
                isSearchable
                onChange={handleChange}
                isDisabled={suppliersData.length === 0}
                value={
                  selectedSupplier
                    ? selectOptions.find((o) => o.value === selectedSupplier.id) || null
                    : null
                }
                noOptionsMessage={() => "Không tìm thấy nhà cung cấp"}
              />
            )}
          </div>

          {/* Reset Button */}
          {selectedSupplier && (
            <button
              onClick={handleReset}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 hover:text-gray-900 transition-colors"
            >
              <RotateCcw size={16} />
              <span>Đặt lại</span>
            </button>
          )}
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center py-8">
          <div className="flex items-center gap-3 text-gray-500">
            <div className="w-5 h-5 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin" />
            <span className="text-sm">Đang tải thông tin...</span>
          </div>
        </div>
      )}

      {/* Supplier Detail Card */}
      {selectedSupplier && !isLoading && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-lg overflow-hidden animate-in fade-in slide-in-from-top-2 duration-300">
          {/* Card Header */}
          <div className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#B4533A] to-[#CB7A62] flex items-center justify-center text-white font-bold text-lg">
                  {selectedSupplier.name.charAt(0)}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">
                    {selectedSupplier.name}
                  </h3>
                  <p className="text-sm text-gray-500">
                    {selectedSupplier.code} • {selectedSupplier.location}
                  </p>
                </div>
              </div>

              {/* Status Badge */}
              {selectedStatus && (
                <div
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-sm font-medium ${selectedStatus.color}`}
                >
                  <selectedStatus.icon size={16} />
                  <span>{selectedSupplier.status}</span>
                </div>
              )}
            </div>
          </div>

          {/* Card Body - Stats Grid */}
          <div className="p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Defect Rate */}
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
                  <TrendingUp size={16} />
                  <span>Tỷ Lệ Lỗi</span>
                </div>
                <div
                  className={`text-2xl ${getDefectRateColor(
                    selectedSupplier.defectRate
                  )}`}
                >
                  {formatDefectRate(selectedSupplier.defectRate)}%
                </div>
                {!isNaN(selectedSupplier.defectRate) && selectedSupplier.defectRate > 7 && (
                  <div className="flex items-center gap-1 mt-1 text-xs text-red-600">
                    <AlertTriangle size={12} />
                    <span>Vượt ngưỡng cảnh báo</span>
                  </div>
                )}
              </div>

              {/* Recent Shipments */}
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
                  <Package size={16} />
                  <span>Lô Hàng 30 Ngày</span>
                </div>
                <div className="text-2xl font-bold text-gray-900">
                  {selectedSupplier.recentShipments}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {selectedSupplier.recentShipments > 0
                    ? "Hoạt động tích cực"
                    : "Không có lô hàng"}
                </div>
              </div>

              {/* Category */}
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
                  <Building2 size={16} />
                  <span>Danh Mục</span>
                </div>
                <div className="text-lg font-semibold text-gray-900">
                  {selectedSupplier.category}
                </div>
              </div>

              {/* Location */}
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
                  <Search size={16} />
                  <span>Địa Điểm</span>
                </div>
                <div className="text-lg font-semibold text-gray-900">
                  {selectedSupplier.location}
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-3 mt-6 pt-4 border-t border-gray-100">
              {onViewHistory && (
                <button
                  onClick={() => onViewHistory(selectedSupplier)}
                  className="flex items-center gap-2 px-5 py-2.5 bg-[#B4533A] text-white font-medium rounded-lg hover:bg-[#9a4630] transition-colors shadow-md hover:shadow-lg"
                >
                  <TrendingUp size={18} />
                  <span>Xem Lịch Sử Tỷ Lệ Lỗi</span>
                </button>
              )}

              <button
                onClick={() => {}}
                className="flex items-center gap-2 px-4 py-2.5 text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <Package size={18} />
                <span>Xem Lô Hàng Gần Đây</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Empty State */}
      {!selectedSupplier && !isLoading && (
        <div className="text-center py-8 bg-gray-50 rounded-xl border border-dashed border-gray-300">
          <Building2 size={48} className="mx-auto text-gray-300 mb-3" />
          <p className="text-gray-500 font-medium">
            Chưa chọn nhà cung cấp
          </p>
          <p className="text-sm text-gray-400 mt-1">
            Vui lòng chọn một nhà cung cấp từ dropdown để xem chi tiết
          </p>
        </div>
      )}
    </div>
  );
};

export default SupplierSelector;
