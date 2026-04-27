"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useProcurement, Organization } from "../../../context/ProcurementContext";
import { 
    ArrowLeft, Building2, Star, TrendingUp, Award, 
    Package, CheckCircle, AlertTriangle, FileText,
    Calendar, Phone, Mail, MapPin, RefreshCw, Loader2,
    ChevronRight, BarChart3, ThumbsUp, ThumbsDown
} from "lucide-react";

interface KPIMetrics {
    otdScore: number;
    qualityScore: number;
    manualScore: number;
    priceScore: number;
    overallScore: number;
    tier: string;
    poCount: number;
    disputeCount: number;
    periodYear: number;
    periodQuarter: number;
    notes?: string;
    improvementPlan?: string;
}

interface BuyerRatingDetail {
    paymentTimelinessScore: number;
    specClarityScore: number;
    communicationScore: number;
    processComplianceScore: number;
    disputeFairnessScore: number;
    comment?: string;
    ratedBy?: string;
    ratedAt?: string;
}

export default function AdminSupplierDetailPage() {
    const params = useParams();
    const router = useRouter();
    const supplierId = params.id as string;
    const { organizations, apiFetch, notify } = useProcurement();
    
    const [supplier, setSupplier] = useState<Organization | null>(null);
    const [kpiHistory, setKpiHistory] = useState<KPIMetrics[]>([]);
    const [loading, setLoading] = useState(true);
    const [evaluating, setEvaluating] = useState(false);
    const [activeTab, setActiveTab] = useState<"overview" | "kpi" | "ratings">("overview");

    // Find supplier from organizations
    useEffect(() => {
        const found = organizations?.find((o: Organization) => o.id === supplierId);
        if (found) {
            setSupplier(found);
        }
    }, [organizations, supplierId]);

    // Fetch KPI history
    const fetchKPIHistory = async () => {
        try {
            const resp = await apiFetch(`/supplier-kpis/report/${supplierId}`);
            if (resp.ok) {
                const data = await resp.json();
                const kpis = data.data || data || [];
                setKpiHistory(kpis);
            }
        } catch (error) {
            console.error("Failed to fetch KPI history:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (supplierId) fetchKPIHistory();
    }, [supplierId]);

    // Run AI evaluation
    const handleEvaluate = async () => {
        setEvaluating(true);
        try {
            const resp = await apiFetch(`/supplier-kpis/evaluate/${supplierId}`, {
                method: "POST"
            });
            if (resp.ok) {
                const result = await resp.json();
                notify("Đánh giá KPI thành công", "success");
                await fetchKPIHistory();
            } else {
                notify("Đánh giá thất bại", "error");
            }
        } catch (error) {
            notify("Lỗi kết nối server", "error");
        } finally {
            setEvaluating(false);
        }
    };

    const getTierColor = (tier?: string) => {
        switch (tier) {
            case 'APPROVED': return 'text-emerald-600 bg-emerald-50';
            case 'UNDER_REVIEW': return 'text-blue-600 bg-blue-50';
            case 'DISQUALIFIED': return 'text-red-600 bg-red-50';
            default: return 'text-amber-600 bg-amber-50';
        }
    };

    const handleAction = async (action: 'submit' | 'approve' | 'reject', reason?: string) => {
            setLoading(true);
            try {
                const resp = await apiFetch(`/organizations/${supplierId}/${action}`, {
                    method: 'POST',
                    body: action === 'reject' ? JSON.stringify({ reason }) : undefined,
                   headers: action === 'reject' ? { 'Content-Type': 'application/json' } : {}
           });
                if (resp.ok) {
                    notify(`Thực hiện ${action} thành công`, "success");
                    window.location.reload();
                } else {
                    notify(`Thực hiện ${action} thất bại`, "error");
                }
            } catch (error) {
                notify("Lỗi kết nối", "error");
            } finally {
                setLoading(false);
            }
       };

    const getRankStyle = (tier?: string) => {
        switch (tier) {
            case "GOLD": return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
            case "SILVER": return "bg-slate-400/20 text-black border-slate-400/30";
            case "BRONZE": return "bg-orange-500/20 text-black border-orange-500/30";
            default: return "bg-[#1A1D23] text-[#000000] border-[rgba(148,163,184,0.1)]";
        }
    };

    const getScoreColor = (score?: number) => {
        if (!score) return "text-[#000000]";
        if (score >= 90) return "text-black";
        if (score >= 70) return "text-yellow-400";
        return "text-black";
    };

    const latestKPI = kpiHistory[0];

    if (loading) {
        return (
            <div className="min-h-screen bg-[#FFFFFF] flex items-center justify-center">
                <Loader2 size={32} className="animate-spin text-[#B4533A]" />
            </div>
        );
    }

    if (!supplier) {
        return (
            <div className="min-h-screen bg-[#FFFFFF] flex items-center justify-center text-[#000000]">
                <div className="text-center">
                    <AlertTriangle size={48} className="mx-auto mb-4 text-black" />
                    <p className="text-xl font-bold">Không tìm thấy nhà cung cấp</p>
                </div>
            </div>
        );
    }

    return (
        <main className="min-h-screen bg-[#FFFFFF] text-[#000000]">
            {/* Header */}
            <div className="bg-[#FAF8F5] border-b border-[rgba(148,163,184,0.1)]">
                <div className="max-w-[1400px] mx-auto px-8 py-6">
                    <button 
                        onClick={() => router.back()}
                        className="flex items-center gap-2 text-[#000000] hover:text-[#000000] mb-4 transition-colors"
                    >
                        <ArrowLeft size={18} />
                        <span className="text-sm font-bold">Quay lại</span>
                    </button>
                    
                    <div className="flex items-start justify-between">
                        <div className="flex items-center gap-4">
                            <div className="h-16 w-16 bg-[#B4533A]/10 rounded-2xl flex items-center justify-center border border-[#B4533A]/20">
                                <Building2 size={32} className="text-[#B4533A]" />
                            </div>
                            <div>
                                <div className="flex items-center gap-3 mb-1">
                                    <h1 className="text-2xl font-black text-[#000000]">{supplier.name}</h1>
                                    <span className={`px-3 py-1 rounded-full text-xs font-black uppercase border ${getTierColor(latestKPI?.tier)}`}>
                                        {latestKPI?.tier || "Chưa đánh giá"}
                                    </span>
                                </div>
                                <p className="text-[#000000] text-sm">{supplier.code} • {supplier.email}</p>
                            </div>
                        </div>
                        
                        <div className="flex items-center gap-3">
                            <button
                                onClick={handleEvaluate}
                                disabled={evaluating}
                                className="flex items-center gap-2 bg-[#B4533A] hover:bg-[#A85032] text-[#FFFFFF] px-6 py-3 rounded-xl font-bold text-sm transition-all disabled:opacity-50"
                            >
                                {evaluating ? <Loader2 size={18} className="animate-spin" /> : <RefreshCw size={18} />}
                                {evaluating ? "Đang đánh giá..." : "Chạy đánh giá AI"}
                            </button>

                            {/* Action Buttons */}
                            {supplier.supplierTier === 'PENDING' && (
                                <button onClick={() => handleAction('submit')} className="bg-blue-600 text-white px-4 py-3 rounded-xl font-bold text-sm">Gửi xét duyệt</button>
                            )}
                            {supplier.supplierTier === 'UNDER_REVIEW' && (
                                <>
                                    <button onClick={() => handleAction('approve')} className="bg-emerald-600 text-white px-4 py-3 rounded-xl font-bold text-sm">Duyệt</button>
                                    <button onClick={() => handleAction('reject')} className="bg-red-600 text-white px-4 py-3 rounded-xl font-bold text-sm">Từ chối</button>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Navigation Tabs */}
            <div className="bg-[#FAF8F5] border-b border-[rgba(148,163,184,0.1)]">
                <div className="max-w-[1400px] mx-auto px-8">
                    <div className="flex gap-8">
                        {([
                            { id: "overview", label: "Tổng quan", icon: Building2 },
                            { id: "kpi", label: "KPI & Hiệu suất", icon: BarChart3 },
                            { id: "ratings", label: "Đánh giá chi tiết", icon: Star },
                        ] as const).map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex items-center gap-2 py-4 text-sm font-bold uppercase tracking-wider border-b-2 transition-all ${
                                    activeTab === tab.id
                                        ? "text-[#B4533A] border-[#B4533A]"
                                        : "text-[#000000] border-transparent hover:text-[#000000]"
                                }`}
                            >
                                <tab.icon size={16} />
                                {tab.label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="max-w-[1400px] mx-auto px-8 py-8">
                {activeTab === "overview" && (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* KPI Overview Cards */}
                        <div className="lg:col-span-2 grid grid-cols-2 md:grid-cols-3 gap-4">
                            <div className="bg-[#FAF8F5] rounded-2xl p-6 border border-[rgba(148,163,184,0.1)]">
                                <div className="flex items-center gap-2 mb-2">
                                    <TrendingUp size={16} className="text-black" />
                                    <span className="text-[#000000] text-xs font-bold uppercase">OTD Score</span>
                                </div>
                                <p className={`text-3xl font-black ${getScoreColor(latestKPI?.otdScore)}`}>
                                    {latestKPI?.otdScore?.toFixed(1) || "--"}%
                                </p>
                                <p className="text-[#000000] text-xs mt-1">Giao hàng đúng hạn</p>
                            </div>
                            
                            <div className="bg-[#FAF8F5] rounded-2xl p-6 border border-[rgba(148,163,184,0.1)]">
                                <div className="flex items-center gap-2 mb-2">
                                    <Package size={16} className="text-[#B4533A]" />
                                    <span className="text-[#000000] text-xs font-bold uppercase">Quality Score</span>
                                </div>
                                <p className={`text-3xl font-black ${getScoreColor(latestKPI?.qualityScore)}`}>
                                    {latestKPI?.qualityScore?.toFixed(1) || "--"}%
                                </p>
                                <p className="text-[#000000] text-xs mt-1">Chất lượng sản phẩm</p>
                            </div>
                            
                            <div className="bg-[#FAF8F5] rounded-2xl p-6 border border-[rgba(148,163,184,0.1)]">
                                <div className="flex items-center gap-2 mb-2">
                                    <Award size={16} className="text-yellow-400" />
                                    <span className="text-[#000000] text-xs font-bold uppercase">Price Score</span>
                                </div>
                                <p className={`text-3xl font-black ${getScoreColor(latestKPI?.priceScore)}`}>
                                    {latestKPI?.priceScore?.toFixed(1) || "--"}%
                                </p>
                                <p className="text-[#000000] text-xs mt-1">Cạnh tranh giá</p>
                            </div>
                            
                            <div className="bg-[#FAF8F5] rounded-2xl p-6 border border-[rgba(148,163,184,0.1)]">
                                <div className="flex items-center gap-2 mb-2">
                                    <Star size={16} className="text-black" />
                                    <span className="text-[#000000] text-xs font-bold uppercase">Manual Score</span>
                                </div>
                                <p className={`text-3xl font-black ${getScoreColor(latestKPI?.manualScore)}`}>
                                    {latestKPI?.manualScore?.toFixed(1) || "--"}%
                                </p>
                                <p className="text-[#000000] text-xs mt-1">Đánh giá thủ công</p>
                            </div>
                            
                            <div className="bg-[#FAF8F5] rounded-2xl p-6 border border-[rgba(148,163,184,0.1)]">
                                <div className="flex items-center gap-2 mb-2">
                                    <CheckCircle size={16} className="text-black" />
                                    <span className="text-[#000000] text-xs font-bold uppercase">Tổng PO</span>
                                </div>
                                <p className="text-3xl font-black text-[#000000]">
                                    {latestKPI?.poCount || "0"}
                                </p>
                                <p className="text-[#000000] text-xs mt-1">6 tháng gần nhất</p>
                            </div>
                            
                            <div className="bg-[#FAF8F5] rounded-2xl p-6 border border-[rgba(148,163,184,0.1)]">
                                <div className="flex items-center gap-2 mb-2">
                                    <AlertTriangle size={16} className="text-black" />
                                    <span className="text-[#000000] text-xs font-bold uppercase">Tranh chấp</span>
                                </div>
                                <p className={`text-3xl font-black ${latestKPI?.disputeCount > 0 ? "text-black" : "text-black"}`}>
                                    {latestKPI?.disputeCount || "0"}
                                </p>
                                <p className="text-[#000000] text-xs mt-1">Số vụ khiếu nại</p>
                            </div>
                        </div>

                        {/* Overall Score */}
                        <div className="bg-gradient-to-br from-[#B4533A]/10 to-[#8B5CF6]/10 rounded-2xl p-8 border border-[#B4533A]/20">
                            <p className="text-[#000000] text-xs font-bold uppercase tracking-wider mb-4">Overall Score</p>
                            <p className={`text-6xl font-black mb-4 ${getScoreColor(latestKPI?.overallScore)}`}>
                                {latestKPI?.overallScore?.toFixed(1) || "--"}%
                            </p>
                            <p className="text-[#000000] text-sm leading-relaxed">
                                {latestKPI?.notes || "Chưa có phân tích chi tiết. Vui lòng chạy đánh giá AI."}
                            </p>
                        </div>

                        {/* Improvement Plan */}
                        {latestKPI?.improvementPlan && (
                            <div className="lg:col-span-3 bg-amber-500/5 border border-amber-500/20 rounded-2xl p-6">
                                <div className="flex items-center gap-2 mb-3">
                                    <TrendingUp size={18} className="text-black" />
                                    <h3 className="text-sm font-black text-black uppercase">Kế hoạch cải thiện (AI)</h3>
                                </div>
                                <p className="text-[#000000] text-sm leading-relaxed">{latestKPI.improvementPlan}</p>
                            </div>
                        )}
                    </div>
                )}

                {activeTab === "kpi" && (
                    <div className="space-y-6">
                        <h2 className="text-xl font-black text-[#000000] uppercase tracking-tight">Lịch sử đánh giá KPI</h2>
                        
                        <div className="bg-[#FAF8F5] rounded-2xl border border-[rgba(148,163,184,0.1)] overflow-hidden">
                            <table className="erp-table text-xs">
                                <thead className="bg-[#FFFFFF]">
                                    <tr>
                                        <th className="px-6 py-4 text-left text-xs font-black text-[#000000] uppercase">Kỳ</th>
                                        <th className="px-6 py-4 text-center text-xs font-black text-[#000000] uppercase">Tier</th>
                                        <th className="px-6 py-4 text-center text-xs font-black text-[#000000] uppercase">Overall</th>
                                        <th className="px-6 py-4 text-center text-xs font-black text-[#000000] uppercase">OTD</th>
                                        <th className="px-6 py-4 text-center text-xs font-black text-[#000000] uppercase">Quality</th>
                                        <th className="px-6 py-4 text-center text-xs font-black text-[#000000] uppercase">Price</th>
                                        <th className="px-6 py-4 text-center text-xs font-black text-[#000000] uppercase">Manual</th>
                                        <th className="px-6 py-4 text-center text-xs font-black text-[#000000] uppercase">POs</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {kpiHistory.map((kpi, idx) => (
                                        <tr key={idx} className="border-t border-[rgba(148,163,184,0.05)]">
                                            <td className="px-6 py-4 text-sm font-bold text-[#000000]">
                                                Q{kpi.periodQuarter} {kpi.periodYear}
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <span className={`px-3 py-1 rounded-full text-xs font-black uppercase border ${getTierColor(kpi.tier)}`}>
                                                    {kpi.tier}
                                                </span>
                                            </td>
                                            <td className={`px-6 py-4 text-center font-black ${getScoreColor(kpi.overallScore)}`}>
                                                {kpi.overallScore?.toFixed(1)}%
                                            </td>
                                            <td className="px-6 py-4 text-center text-sm text-[#000000]">{kpi.otdScore?.toFixed(1)}%</td>
                                            <td className="px-6 py-4 text-center text-sm text-[#000000]">{kpi.qualityScore?.toFixed(1)}%</td>
                                            <td className="px-6 py-4 text-center text-sm text-[#000000]">{kpi.priceScore?.toFixed(1)}%</td>
                                            <td className="px-6 py-4 text-center text-sm text-[#000000]">{kpi.manualScore?.toFixed(1)}%</td>
                                            <td className="px-6 py-4 text-center text-sm text-[#000000]">{kpi.poCount}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {activeTab === "ratings" && (
                    <div className="space-y-6">
                        <h2 className="text-xl font-black text-[#000000] uppercase tracking-tight">Tiêu chí đánh giá chi tiết</h2>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Rating Criteria */}
                            {[
                                { 
                                    name: "On-Time Delivery (OTD)", 
                                    score: latestKPI?.otdScore, 
                                    weight: "25%",
                                    desc: "Tỷ lệ giao hàng đúng hạn so với ngày yêu cầu trong PO" 
                                },
                                { 
                                    name: "Quality Score", 
                                    score: latestKPI?.qualityScore, 
                                    weight: "20%",
                                    desc: "Tỷ lệ sản phẩm đạt chuẩn (accepted/total received)" 
                                },
                                { 
                                    name: "Price Competitiveness", 
                                    score: latestKPI?.priceScore, 
                                    weight: "20%",
                                    desc: "Đánh giá AI về mức giá cạnh tranh so với thị trường" 
                                },
                                { 
                                    name: "Manual/Buyer Ratings", 
                                    score: latestKPI?.manualScore, 
                                    weight: "15%",
                                    desc: "Trung bình điểm đánh giá từ Procurement team" 
                                },
                                { 
                                    name: "Invoice Accuracy", 
                                    score: 100 - (latestKPI?.disputeCount * 5 || 0), 
                                    weight: "15%",
                                    desc: "Độ chính xác hóa đơn trong 3-way matching" 
                                },
                                { 
                                    name: "Responsiveness (RFQ)", 
                                    score: 85, 
                                    weight: "5%",
                                    desc: "Tốc độ phản hồi và tham gia báo giá" 
                                },
                            ].map((criteria, idx) => (
                                <div key={idx} className="bg-[#FAF8F5] rounded-2xl p-6 border border-[rgba(148,163,184,0.1)]">
                                    <div className="flex items-start justify-between mb-4">
                                        <div>
                                            <h3 className="font-black text-[#000000] text-sm">{criteria.name}</h3>
                                            <p className="text-[#000000] text-xs mt-1">{criteria.desc}</p>
                                        </div>
                                        <span className="px-2 py-1 bg-[#B4533A]/10 text-[#B4533A] rounded-lg text-xs font-bold">
                                            {criteria.weight}
                                        </span>
                                    </div>
                                    
                                    <div className="flex items-center gap-4">
                                        <div className="flex-1">
                                            <div className="w-full bg-[#FFFFFF] rounded-full h-3 mb-2">
                                                <div 
                                                    className={`h-3 rounded-full ${
                                                        (criteria.score || 0) >= 90 ? 'bg-emerald-400' :
                                                        (criteria.score || 0) >= 70 ? 'bg-yellow-400' :
                                                        'bg-rose-400'
                                                    }`}
                                                    style={{ width: `${Math.min(criteria.score || 0, 100)}%` }}
                                                />
                                            </div>
                                        </div>
                                        <span className={`text-xl font-black ${getScoreColor(criteria.score)}`}>
                                            {criteria.score?.toFixed(0) || "--"}%
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Buyer Rating Sub-criteria */}
                        <div className="bg-[#FAF8F5] rounded-2xl p-6 border border-[rgba(148,163,184,0.1)]">
                            <h3 className="text-sm font-black text-[#000000] uppercase mb-4">Chi tiết Buyer Ratings (Manual Score)</h3>
                            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                                {[
                                    { name: "Payment Timeliness", icon: Calendar },
                                    { name: "Spec Clarity", icon: FileText },
                                    { name: "Communication", icon: Phone },
                                    { name: "Process Compliance", icon: CheckCircle },
                                    { name: "Dispute Fairness", icon: ThumbsUp },
                                ].map((item, idx) => (
                                    <div key={idx} className="bg-[#FFFFFF] rounded-xl p-4 text-center">
                                        <item.icon size={20} className="text-[#B4533A] mx-auto mb-2" />
                                        <p className="text-[#000000] text-xs">{item.name}</p>
                                        <p className="text-[#000000] font-bold text-sm mt-1">1-5 điểm</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </main>
    );
}
