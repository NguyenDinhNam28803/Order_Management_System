"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useProcurement, Organization, PO } from "../../context/ProcurementContext";
import { 
    Star, 
    TrendingUp, 
    Award, 
    Search, 
    Filter,
    ChevronRight,
    Building2,
    ArrowUpRight,
    BarChart3,
    RefreshCw,
    Loader2,
    Truck,
    Eye,
    HelpCircle,
    FileCheck,
    Scale,
    TrendingDown
} from "lucide-react";

// Tooltip Component
const Tooltip = ({ children, content, position = 'top' }: { children: React.ReactNode; content: React.ReactNode; position?: 'top' | 'bottom' | 'left' | 'right' }) => {
    const [show, setShow] = useState(false);
    return (
        <div className="relative inline-block">
            <div onMouseEnter={() => setShow(true)} onMouseLeave={() => setShow(false)}>
                {children}
            </div>
            {show && (
                <div className={`absolute z-50 ${
                    position === 'top' ? 'bottom-full left-1/2 -translate-x-1/2 mb-2' :
                    position === 'bottom' ? 'top-full left-1/2 -translate-x-1/2 mt-2' :
                    position === 'left' ? 'right-full top-1/2 -translate-y-1/2 mr-2' :
                    'left-full top-1/2 -translate-y-1/2 ml-2'
                }`}>
                    <div className="bg-slate-900 border border-slate-700 rounded-xl p-3 shadow-xl max-w-xs text-xs text-slate-100">
                        {content}
                        <div className={`absolute ${
                            position === 'top' ? 'top-full left-1/2 -translate-x-1/2 border-t-[#0F172A]' :
                            position === 'bottom' ? 'bottom-full left-1/2 -translate-x-1/2 border-b-[#0F172A]' :
                            position === 'left' ? 'left-full top-1/2 -translate-y-1/2 border-l-[#0F172A]' :
                            'right-full top-1/2 -translate-y-1/2 border-r-[#0F172A]'
                        } border-4 border-transparent`} />
                    </div>
                </div>
            )}
        </div>
    );
};

interface SupplierWithKPI extends Organization {
    kpiScore?: number;
    overallScore?: number;
    otdScore?: number;
    qualityScore?: number;
    priceScore?: number;
    manualScore?: number;
    tier?: string;
    lastEvaluated?: string;
    totalPOs?: number;
    onTimeDelivery?: number;
}

export default function ProcurementSuppliersPage() {
    const router = useRouter();
    const { organizations, allPos, currentUser, apiFetch, notify } = useProcurement();
    const [suppliers, setSuppliers] = useState<SupplierWithKPI[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedTier, setSelectedTier] = useState<string>("ALL");
    const [evaluatingId, setEvaluatingId] = useState<string | null>(null);

    // Filter suppliers from user's POs (only suppliers that user has awarded POs to)
    useEffect(() => {
        // Get POs created by current user's org (which this procurement user handles)
        const userPOs = (allPos || []).filter(
            (po: PO) => po.orgId === currentUser?.orgId || !po.orgId // Include POs with no orgId for backward compat
        );
        
        // Extract unique supplierIds from these POs
        const supplierIdsFromPOs = new Set(
            userPOs
                .filter((po: PO) => po.supplierId)
                .map((po: PO) => po.supplierId)
        );
        
        // Filter suppliers to only those from user's POs
        const filteredSupplierOrgs = (organizations || []).filter(
            (org: Organization) => {
                // Must be a supplier type
                const isSupplier = org.companyType === "SUPPLIER" || org.companyType === "BOTH";
                // Must be in the list of suppliers from user's POs
                const isFromUserPOs = supplierIdsFromPOs.has(org.id);
                return isSupplier && isFromUserPOs;
            }
        );
        
        // Add PO count for each supplier
        const suppliersWithPOCount = filteredSupplierOrgs.map((org: Organization) => {
            const poCount = userPOs.filter((po: PO) => po.supplierId === org.id).length;
            return { ...org, totalPOs: poCount } as SupplierWithKPI;
        });
        
        setSuppliers(suppliersWithPOCount);
        setLoading(false);
    }, [organizations, allPos, currentUser]);

    // Fetch KPI data for suppliers
    const fetchKPIData = async (supplierId: string) => {
        try {
            const resp = await apiFetch(`/supplier-kpis/report/${supplierId}`, {
                method: 'POST',
                body: JSON.stringify({ orgId: currentUser?.orgId })
            });
            if (resp.ok) {
                const data = await resp.json();
                return data.data || data;
            }
        } catch (error) {
            console.warn("Failed to fetch KPI for supplier:", supplierId);
        }
        return null;
    };
    
    // Fetch KPI data for all suppliers
    useEffect(() => {
        const loadKPIData = async () => {
            if (suppliers.length === 0 || !currentUser?.orgId) return;
            
            const suppliersWithKPI = await Promise.all(
                suppliers.map(async (supplier) => {
                    const kpiData = await fetchKPIData(supplier.id);
                    if (kpiData && kpiData.length > 0) {
                        const latest = kpiData[0]; // Get most recent KPI
                        return {
                            ...supplier,
                            kpiScore: latest.overallScore || latest.manualScore,
                            overallScore: latest.overallScore,
                            otdScore: latest.otdScore,
                            qualityScore: latest.qualityScore,
                            priceScore: latest.priceScore,
                            manualScore: latest.manualScore,
                            tier: latest.tier,
                            lastEvaluated: latest.calculatedAt || latest.evaluatedAt,
                        };
                    }
                    return supplier;
                })
            );
            setSuppliers(suppliersWithKPI);
        };
        
        loadKPIData();
    }, [suppliers.length, currentUser?.orgId]);

    // Evaluate supplier KPI
    const handleEvaluate = async (supplierId: string) => {
        setEvaluatingId(supplierId);
        try {
            const resp = await apiFetch(`/supplier-kpis/evaluate/${supplierId}`, {
                method: "POST"
            });
            if (resp.ok) {
                const result = await resp.json();
                notify("Đánh giá KPI thành công", "success");
                
                // Update supplier with new KPI data
                const kpiScore = result.data?.kpiScore || result.kpiScore;
                setSuppliers(prev => prev.map(s => {
                    if (s.id === supplierId) {
                        return {
                            ...s,
                            kpiScore: kpiScore?.overallScore || kpiScore?.manualScore,
                            overallScore: kpiScore?.overallScore,
                            otdScore: kpiScore?.otdScore,
                            qualityScore: kpiScore?.qualityScore,
                            priceScore: kpiScore?.priceScore,
                            manualScore: kpiScore?.manualScore,
                            tier: result.data?.tier || result.tier || kpiScore?.tier,
                            lastEvaluated: new Date().toISOString()
                        };
                    }
                    return s;
                }));
            } else {
                notify("Đánh giá thất bại", "error");
            }
        } catch (error) {
            notify("Lỗi kết nối server", "error");
        } finally {
            setEvaluatingId(null);
        }
    };

    // Filter and search
    const filteredSuppliers = suppliers.filter(supplier => {
        const matchesSearch = supplier.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                             supplier.code?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesTier = selectedTier === "ALL" || supplier.tier === selectedTier;
        return matchesSearch && matchesTier;
    });

    // Sort by KPI score (highest first)
    const sortedSuppliers = [...filteredSuppliers].sort((a, b) => 
        (b.kpiScore || 0) - (a.kpiScore || 0)
    );

    const getTierColor = (tier?: string) => {
        switch (tier) {
            case "GOLD": return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
            case "SILVER": return "bg-slate-400/20 text-black border-slate-400/30";
            case "BRONZE": return "bg-orange-500/20 text-black border-orange-500/30";
            default: return "bg-slate-900 text-slate-100 border-slate-700";
        }
    };

    const getScoreColor = (score?: number) => {
        if (!score) return "text-slate-900";
        if (score >= 90) return "text-black";
        if (score >= 70) return "text-yellow-400";
        return "text-black";
    };

    return (
        <main className="p-6 space-y-6">
            <div className="max-w-[1400px] mx-auto space-y-6">
                {/* Header */}
                <div className="page-header">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <div className="h-10 w-10 bg-blue-600/10 rounded-xl flex items-center justify-center border border-blue-600/20">
                                <Truck size={20} className="text-blue-600" />
                            </div>
                            <h1 className="page-title">
                                Đánh giá Nhà cung cấp
                            </h1>
                        </div>
                        <p className="text-slate-900 text-sm">
                            Quản lý và đánh giá hiệu suất nhà cung cấp dựa trên KPI
                        </p>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="bg-slate-100 px-4 py-2 rounded-xl border border-slate-200">
                            <span className="text-slate-900 text-xs font-bold uppercase">Tổng NCC:</span>
                            <span className="text-slate-900 font-bold ml-2">{suppliers.length}</span>
                        </div>
                    </div>
                </div>

                {/* Filters */}
                <div className="bg-slate-100 p-4 rounded-[32px] border border-slate-200 shadow-xl shadow-blue-600/5">
                    <div className="flex flex-col md:flex-row gap-4">
                        <div className="flex-1 flex gap-3">
                            <div className="h-14 w-14 bg-white border border-slate-200 rounded-2xl flex items-center justify-center text-slate-900 shadow-sm shrink-0">
                                <Search size={20} className="text-blue-600" />
                            </div>
                            <div className="relative flex-1">
                                <input
                                    type="text"
                                    placeholder="Tìm kiếm nhà cung cấp..."
                                    className="w-full h-14 pl-6 pr-4 bg-white border border-slate-200 rounded-2xl text-sm font-bold text-slate-900 placeholder:text-slate-900/40 focus:outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-600/5 transition-all"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                        </div>
                        
                        <div className="flex items-center gap-3">
                            <div className="h-14 w-14 bg-white border border-slate-200 rounded-2xl flex items-center justify-center text-slate-900 shadow-sm shrink-0">
                                <Filter size={18} className="text-blue-600" />
                            </div>
                            <div className="flex bg-white p-1 rounded-2xl border border-slate-200 shadow-sm">
                                {["ALL", "GOLD", "SILVER", "BRONZE"].map((tier) => (
                                    <button
                                        key={tier}
                                        onClick={() => setSelectedTier(tier)}
                                        className={`px-6 h-10 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${
                                            selectedTier === tier
                                                ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20"
                                                : "text-slate-500 hover:bg-slate-100"
                                        }`}
                                    >
                                        {tier === "ALL" ? "Tất cả" : tier}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Suppliers Grid */}
                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <Loader2 size={32} className="animate-spin text-blue-600" />
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {sortedSuppliers.map((supplier) => (
                            <div
                                key={supplier.id}
                                className="erp-card p-6 hover:border-blue-600/30 transition-all group"
                            >
                                {/* Header */}
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="h-12 w-12 bg-white rounded-xl flex items-center justify-center text-blue-600 font-bold text-lg border border-slate-200">
                                            {supplier.name.substring(0, 2).toUpperCase()}
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-slate-900 text-sm line-clamp-1">
                                                {supplier.name}
                                            </h3>
                                            <p className="text-slate-900 text-xs font-bold">
                                                {supplier.code || "N/A"}
                                            </p>
                                        </div>
                                    </div>
                                    <div className={`px-3 py-1 rounded-full text-xs font-bold uppercase border ${getTierColor(supplier.tier)}`}>
                                        {supplier.tier || "Chưa đánh giá"}
                                    </div>
                                </div>

                                {/* KPI Score with Formula Tooltip */}
                                <div className="bg-white rounded-xl p-4 mb-4 border border-slate-200">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <div className="flex items-center gap-1 mb-1">
                                                <p className="text-slate-900 text-[10px] font-bold uppercase tracking-wider">
                                                    Overall Score
                                                </p>
                                                <Tooltip content={
                                                    <div className="space-y-2">
                                                        <p className="font-bold text-slate-900">Công thức tính điểm tổng:</p>
                                                        <div className="space-y-1">
                                                            <div className="flex justify-between">
                                                                <span>OTD (30%)</span>
                                                                <span className="text-black">{supplier.otdScore?.toFixed(1) || '--'} × 0.3</span>
                                                            </div>
                                                            <div className="flex justify-between">
                                                                <span>Quality (30%)</span>
                                                                <span className="text-blue-600">{supplier.qualityScore?.toFixed(1) || '--'} × 0.3</span>
                                                            </div>
                                                            <div className="flex justify-between">
                                                                <span>Price (20%)</span>
                                                                <span className="text-yellow-400">{supplier.priceScore?.toFixed(1) || '--'} × 0.2</span>
                                                            </div>
                                                            <div className="flex justify-between">
                                                                <span>Manual (20%)</span>
                                                                <span className="text-black">{supplier.manualScore?.toFixed(1) || '--'} × 0.2</span>
                                                            </div>
                                                        </div>
                                                        <div className="border-t border-slate-200 pt-1 mt-2">
                                                            <p className="font-bold text-slate-900">Phân loại Tier:</p>
                                                            <p>🥇 GOLD: ≥90 điểm</p>
                                                            <p>🥈 SILVER: 70-89 điểm</p>
                                                            <p>🥉 BRONZE: &lt;70 điểm</p>
                                                        </div>
                                                    </div>
                                                }>
                                                    <HelpCircle size={12} className="text-slate-900 hover:text-blue-600 cursor-help" />
                                                </Tooltip>
                                            </div>
                                            <p className={`text-2xl font-bold ${getScoreColor(supplier.overallScore || supplier.kpiScore)}`}>
                                                {typeof supplier.overallScore === 'number' 
                                                    ? supplier.overallScore.toFixed(1) 
                                                    : typeof supplier.kpiScore === 'number' 
                                                        ? supplier.kpiScore.toFixed(1) 
                                                        : "--"}%
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-slate-900 text-[10px] font-bold uppercase tracking-wider mb-1">
                                                Đánh giá lần cuối
                                            </p>
                                            <p className="text-slate-900 text-xs">
                                                {supplier.lastEvaluated 
                                                    ? new Date(supplier.lastEvaluated).toLocaleDateString("vi-VN")
                                                    : "Chưa có"
                                                }
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* KPI Breakdown with Tooltips */}
                                <div className="grid grid-cols-4 gap-2 mb-4">
                                    <Tooltip content={
                                        <div className="space-y-1">
                                            <p className="font-bold text-black">OTD - On-Time Delivery</p>
                                            <p>Tỷ lệ giao hàng đúng hẹn trong kỳ đánh giá</p>
                                            <p className="text-slate-900">Tính: (Số PO đúng hạn / Tổng PO) × 100</p>
                                        </div>
                                    }>
                                        <div className="bg-white rounded-lg p-2 text-center cursor-help hover:bg-slate-100 transition-colors">
                                            <TrendingUp size={14} className="text-black mx-auto mb-1" />
                                            <p className="text-[10px] text-slate-900">OTD</p>
                                            <p className="text-xs font-bold text-slate-900">
                                                {typeof supplier.otdScore === 'number' ? supplier.otdScore.toFixed(0) : "--"}%
                                            </p>
                                        </div>
                                    </Tooltip>
                                    <Tooltip content={
                                        <div className="space-y-1">
                                            <p className="font-bold text-blue-600">Quality Score</p>
                                            <p>Đánh giá chất lượng sản phẩm dựa trên:</p>
                                            <ul className="list-disc pl-4 space-y-0.5">
                                                <li>Tỷ lệ đồng ý hàng (GRN)</li>
                                                <li>COA chính xác</li>
                                                <li>Đóng gói &amp; nhãn mác</li>
                                                <li>Khiếu nại chất lượng</li>
                                            </ul>
                                        </div>
                                    }>
                                        <div className="bg-white rounded-lg p-2 text-center cursor-help hover:bg-slate-100 transition-colors">
                                            <Award size={14} className="text-blue-600 mx-auto mb-1" />
                                            <p className="text-[10px] text-slate-900">Chất lượng</p>
                                            <p className="text-xs font-bold text-slate-900">
                                                {typeof supplier.qualityScore === 'number' ? supplier.qualityScore.toFixed(0) : "--"}%
                                            </p>
                                        </div>
                                    </Tooltip>
                                    <Tooltip content={
                                        <div className="space-y-1">
                                            <p className="font-bold text-yellow-400">Price Score</p>
                                            <p>Đánh giá cạnh tranh giá so với thị trường:</p>
                                            <ul className="list-disc pl-4 space-y-0.5">
                                                <li>Giá RFQ so với đối thủ</li>
                                                <li>Chiết khấu &amp; điều khoản TT</li>
                                                <li>Ổn định giá theo thời gian</li>
                                                <li>Chi phí vận chuyển</li>
                                            </ul>
                                        </div>
                                    }>
                                        <div className="bg-white rounded-lg p-2 text-center cursor-help hover:bg-slate-100 transition-colors">
                                            <Star size={14} className="text-yellow-400 mx-auto mb-1" />
                                            <p className="text-[10px] text-slate-900">Giá</p>
                                            <p className="text-xs font-bold text-slate-900">
                                                {typeof supplier.priceScore === 'number' ? supplier.priceScore.toFixed(0) : "--"}%
                                            </p>
                                        </div>
                                    </Tooltip>
                                    <Tooltip content={
                                        <div className="space-y-1">
                                            <p className="font-bold text-black">Manual Score</p>
                                            <p>Đánh giá thủ công của người mua:</p>
                                            <ul className="list-disc pl-4 space-y-0.5">
                                                <li>Đóng gói &amp; bao bì</li>
                                                <li>Nhãn mác &amp; chứng từ</li>
                                                <li>Độ chính xác COA</li>
                                                <li>Giao tiếp &amp; phản hồi</li>
                                                <li>Linh hoạt xử lý sự cố</li>
                                                <li>Tuân thủ quy định</li>
                                            </ul>
                                        </div>
                                    }>
                                        <div className="bg-white rounded-lg p-2 text-center cursor-help hover:bg-slate-100 transition-colors">
                                            <BarChart3 size={14} className="text-black mx-auto mb-1" />
                                            <p className="text-[10px] text-slate-900">Thủ công</p>
                                            <p className="text-xs font-bold text-slate-900">
                                                {typeof supplier.manualScore === 'number' ? supplier.manualScore.toFixed(0) : "--"}%
                                            </p>
                                        </div>
                                    </Tooltip>
                                </div>
                                
                                {/* PO Count */}
                                <div className="flex items-center justify-between mb-4 text-xs text-slate-900">
                                    <span>Tổng PO: <strong className="text-slate-900">{supplier.totalPOs || 0}</strong></span>
                                    {supplier.lastEvaluated && (
                                        <span>Đánh giá: {new Date(supplier.lastEvaluated).toLocaleDateString("vi-VN")}</span>
                                    )}
                                </div>

                                {/* Actions */}
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => router.push(`/procurement/suppliers/${supplier.id}`)}
                                        className="btn-secondary flex-1 justify-center"
                                    >
                                        <Eye size={14} />
                                        Xem chi tiết
                                    </button>
                                    <button
                                        onClick={() => router.push(`/supplier/${supplier.id}/kpi-evaluation`)}
                                        className="btn-secondary flex-1 justify-center"
                                    >
                                        <BarChart3 size={14} />
                                        KPI
                                    </button>
                                    <button
                                        onClick={() => handleEvaluate(supplier.id)}
                                        disabled={evaluatingId === supplier.id}
                                        className="btn-primary flex-1 justify-center disabled:opacity-50"
                                    >
                                        {evaluatingId === supplier.id ? (
                                            <Loader2 size={14} className="animate-spin" />
                                        ) : (
                                            <RefreshCw size={14} />
                                        )}
                                        {evaluatingId === supplier.id ? "..." : "Đánh giá"}
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {sortedSuppliers.length === 0 && !loading && (
                    <div className="text-center py-20">
                        <Building2 size={48} className="text-slate-900 mx-auto mb-4" />
                        <p className="text-slate-900 text-lg font-bold">Không tìm thấy nhà cung cấp</p>
                        <p className="text-slate-900 text-sm mt-2">
                            {searchTerm ? "Thử tìm kiếm với từ khóa khác" : "Bạn chưa có PO nào với nhà cung cấp. Hãy tạo PO để xem đánh giá."}
                        </p>
                    </div>
                )}
            </div>
        </main>
    );
}

