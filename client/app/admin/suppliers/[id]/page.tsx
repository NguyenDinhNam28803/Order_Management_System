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
            case "GOLD": return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
            case "SILVER": return "bg-slate-400/20 text-slate-400 border-slate-400/30";
            case "BRONZE": return "bg-orange-500/20 text-orange-400 border-orange-500/30";
            default: return "bg-[#1A1D23] text-[#64748B] border-[rgba(148,163,184,0.1)]";
        }
    };

    const getScoreColor = (score?: number) => {
        if (!score) return "text-[#64748B]";
        if (score >= 90) return "text-emerald-400";
        if (score >= 70) return "text-yellow-400";
        return "text-rose-400";
    };

    const latestKPI = kpiHistory[0];

    if (loading) {
        return (
            <div className="min-h-screen bg-[#0F1117] flex items-center justify-center">
                <Loader2 size={32} className="animate-spin text-[#3B82F6]" />
            </div>
        );
    }

    if (!supplier) {
        return (
            <div className="min-h-screen bg-[#0F1117] flex items-center justify-center text-[#F8FAFC]">
                <div className="text-center">
                    <AlertTriangle size={48} className="mx-auto mb-4 text-rose-400" />
                    <p className="text-xl font-bold">Không tìm thấy nhà cung cấp</p>
                </div>
            </div>
        );
    }

    return (
        <main className="min-h-screen bg-[#0F1117] text-[#F8FAFC]">
            {/* Header */}
            <div className="bg-[#161922] border-b border-[rgba(148,163,184,0.1)]">
                <div className="max-w-[1400px] mx-auto px-8 py-6">
                    <button 
                        onClick={() => router.back()}
                        className="flex items-center gap-2 text-[#64748B] hover:text-[#F8FAFC] mb-4 transition-colors"
                    >
                        <ArrowLeft size={18} />
                        <span className="text-sm font-bold">Quay lại</span>
                    </button>
                    
                    <div className="flex items-start justify-between">
                        <div className="flex items-center gap-4">
                            <div className="h-16 w-16 bg-[#3B82F6]/10 rounded-2xl flex items-center justify-center border border-[#3B82F6]/20">
                                <Building2 size={32} className="text-[#3B82F6]" />
                            </div>
                            <div>
                                <div className="flex items-center gap-3 mb-1">
                                    <h1 className="text-2xl font-black text-[#F8FAFC]">{supplier.name}</h1>
                                    <span className={`px-3 py-1 rounded-full text-xs font-black uppercase border ${getTierColor(latestKPI?.tier)}`}>
                                        {latestKPI?.tier || "Chưa đánh giá"}
                                    </span>
                                </div>
                                <p className="text-[#64748B] text-sm">{supplier.code} • {supplier.email}</p>
                            </div>
                        </div>
                        
                        <button
                            onClick={handleEvaluate}
                            disabled={evaluating}
                            className="flex items-center gap-2 bg-[#3B82F6] hover:bg-[#2563EB] text-white px-6 py-3 rounded-xl font-bold text-sm transition-all disabled:opacity-50"
                        >
                            {evaluating ? (
                                <Loader2 size={18} className="animate-spin" />
                            ) : (
                                <RefreshCw size={18} />
                            )}
                            {evaluating ? "Đang đánh giá..." : "Chạy đánh giá AI"}
                        </button>
                    </div>
                </div>
            </div>

            {/* Navigation Tabs */}
            <div className="bg-[#161922] border-b border-[rgba(148,163,184,0.1)]">
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
                                        ? "text-[#3B82F6] border-[#3B82F6]"
                                        : "text-[#64748B] border-transparent hover:text-[#F8FAFC]"
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
                            <div className="bg-[#161922] rounded-2xl p-6 border border-[rgba(148,163,184,0.1)]">
                                <div className="flex items-center gap-2 mb-2">
                                    <TrendingUp size={16} className="text-emerald-400" />
                                    <span className="text-[#64748B] text-xs font-bold uppercase">OTD Score</span>
                                </div>
                                <p className={`text-3xl font-black ${getScoreColor(latestKPI?.otdScore)}`}>
                                    {latestKPI?.otdScore?.toFixed(1) || "--"}%
                                </p>
                                <p className="text-[#64748B] text-xs mt-1">Giao hàng đúng hạn</p>
                            </div>
                            
                            <div className="bg-[#161922] rounded-2xl p-6 border border-[rgba(148,163,184,0.1)]">
                                <div className="flex items-center gap-2 mb-2">
                                    <Package size={16} className="text-[#3B82F6]" />
                                    <span className="text-[#64748B] text-xs font-bold uppercase">Quality Score</span>
                                </div>
                                <p className={`text-3xl font-black ${getScoreColor(latestKPI?.qualityScore)}`}>
                                    {latestKPI?.qualityScore?.toFixed(1) || "--"}%
                                </p>
                                <p className="text-[#64748B] text-xs mt-1">Chất lượng sản phẩm</p>
                            </div>
                            
                            <div className="bg-[#161922] rounded-2xl p-6 border border-[rgba(148,163,184,0.1)]">
                                <div className="flex items-center gap-2 mb-2">
                                    <Award size={16} className="text-yellow-400" />
                                    <span className="text-[#64748B] text-xs font-bold uppercase">Price Score</span>
                                </div>
                                <p className={`text-3xl font-black ${getScoreColor(latestKPI?.priceScore)}`}>
                                    {latestKPI?.priceScore?.toFixed(1) || "--"}%
                                </p>
                                <p className="text-[#64748B] text-xs mt-1">Cạnh tranh giá</p>
                            </div>
                            
                            <div className="bg-[#161922] rounded-2xl p-6 border border-[rgba(148,163,184,0.1)]">
                                <div className="flex items-center gap-2 mb-2">
                                    <Star size={16} className="text-purple-400" />
                                    <span className="text-[#64748B] text-xs font-bold uppercase">Manual Score</span>
                                </div>
                                <p className={`text-3xl font-black ${getScoreColor(latestKPI?.manualScore)}`}>
                                    {latestKPI?.manualScore?.toFixed(1) || "--"}%
                                </p>
                                <p className="text-[#64748B] text-xs mt-1">Đánh giá thủ công</p>
                            </div>
                            
                            <div className="bg-[#161922] rounded-2xl p-6 border border-[rgba(148,163,184,0.1)]">
                                <div className="flex items-center gap-2 mb-2">
                                    <CheckCircle size={16} className="text-emerald-400" />
                                    <span className="text-[#64748B] text-xs font-bold uppercase">Tổng PO</span>
                                </div>
                                <p className="text-3xl font-black text-[#F8FAFC]">
                                    {latestKPI?.poCount || "0"}
                                </p>
                                <p className="text-[#64748B] text-xs mt-1">6 tháng gần nhất</p>
                            </div>
                            
                            <div className="bg-[#161922] rounded-2xl p-6 border border-[rgba(148,163,184,0.1)]">
                                <div className="flex items-center gap-2 mb-2">
                                    <AlertTriangle size={16} className="text-rose-400" />
                                    <span className="text-[#64748B] text-xs font-bold uppercase">Tranh chấp</span>
                                </div>
                                <p className={`text-3xl font-black ${latestKPI?.disputeCount > 0 ? "text-rose-400" : "text-emerald-400"}`}>
                                    {latestKPI?.disputeCount || "0"}
                                </p>
                                <p className="text-[#64748B] text-xs mt-1">Số vụ khiếu nại</p>
                            </div>
                        </div>

                        {/* Overall Score */}
                        <div className="bg-gradient-to-br from-[#3B82F6]/10 to-[#8B5CF6]/10 rounded-2xl p-8 border border-[#3B82F6]/20">
                            <p className="text-[#64748B] text-xs font-bold uppercase tracking-wider mb-4">Overall Score</p>
                            <p className={`text-6xl font-black mb-4 ${getScoreColor(latestKPI?.overallScore)}`}>
                                {latestKPI?.overallScore?.toFixed(1) || "--"}%
                            </p>
                            <p className="text-[#94A3B8] text-sm leading-relaxed">
                                {latestKPI?.notes || "Chưa có phân tích chi tiết. Vui lòng chạy đánh giá AI."}
                            </p>
                        </div>

                        {/* Improvement Plan */}
                        {latestKPI?.improvementPlan && (
                            <div className="lg:col-span-3 bg-amber-500/5 border border-amber-500/20 rounded-2xl p-6">
                                <div className="flex items-center gap-2 mb-3">
                                    <TrendingUp size={18} className="text-amber-400" />
                                    <h3 className="text-sm font-black text-amber-400 uppercase">Kế hoạch cải thiện (AI)</h3>
                                </div>
                                <p className="text-[#94A3B8] text-sm leading-relaxed">{latestKPI.improvementPlan}</p>
                            </div>
                        )}
                    </div>
                )}

                {activeTab === "kpi" && (
                    <div className="space-y-6">
                        <h2 className="text-xl font-black text-[#F8FAFC] uppercase tracking-tight">Lịch sử đánh giá KPI</h2>
                        
                        <div className="bg-[#161922] rounded-2xl border border-[rgba(148,163,184,0.1)] overflow-hidden">
                            <table className="erp-table text-xs">
                                <thead className="bg-[#0F1117]">
                                    <tr>
                                        <th className="px-6 py-4 text-left text-xs font-black text-[#64748B] uppercase">Kỳ</th>
                                        <th className="px-6 py-4 text-center text-xs font-black text-[#64748B] uppercase">Tier</th>
                                        <th className="px-6 py-4 text-center text-xs font-black text-[#64748B] uppercase">Overall</th>
                                        <th className="px-6 py-4 text-center text-xs font-black text-[#64748B] uppercase">OTD</th>
                                        <th className="px-6 py-4 text-center text-xs font-black text-[#64748B] uppercase">Quality</th>
                                        <th className="px-6 py-4 text-center text-xs font-black text-[#64748B] uppercase">Price</th>
                                        <th className="px-6 py-4 text-center text-xs font-black text-[#64748B] uppercase">Manual</th>
                                        <th className="px-6 py-4 text-center text-xs font-black text-[#64748B] uppercase">POs</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {kpiHistory.map((kpi, idx) => (
                                        <tr key={idx} className="border-t border-[rgba(148,163,184,0.05)]">
                                            <td className="px-6 py-4 text-sm font-bold text-[#F8FAFC]">
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
                                            <td className="px-6 py-4 text-center text-sm text-[#94A3B8]">{kpi.otdScore?.toFixed(1)}%</td>
                                            <td className="px-6 py-4 text-center text-sm text-[#94A3B8]">{kpi.qualityScore?.toFixed(1)}%</td>
                                            <td className="px-6 py-4 text-center text-sm text-[#94A3B8]">{kpi.priceScore?.toFixed(1)}%</td>
                                            <td className="px-6 py-4 text-center text-sm text-[#94A3B8]">{kpi.manualScore?.toFixed(1)}%</td>
                                            <td className="px-6 py-4 text-center text-sm text-[#94A3B8]">{kpi.poCount}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {activeTab === "ratings" && (
                    <div className="space-y-6">
                        <h2 className="text-xl font-black text-[#F8FAFC] uppercase tracking-tight">Tiêu chí đánh giá chi tiết</h2>
                        
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
                                <div key={idx} className="bg-[#161922] rounded-2xl p-6 border border-[rgba(148,163,184,0.1)]">
                                    <div className="flex items-start justify-between mb-4">
                                        <div>
                                            <h3 className="font-black text-[#F8FAFC] text-sm">{criteria.name}</h3>
                                            <p className="text-[#64748B] text-xs mt-1">{criteria.desc}</p>
                                        </div>
                                        <span className="px-2 py-1 bg-[#3B82F6]/10 text-[#3B82F6] rounded-lg text-xs font-bold">
                                            {criteria.weight}
                                        </span>
                                    </div>
                                    
                                    <div className="flex items-center gap-4">
                                        <div className="flex-1">
                                            <div className="w-full bg-[#0F1117] rounded-full h-3 mb-2">
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
                        <div className="bg-[#161922] rounded-2xl p-6 border border-[rgba(148,163,184,0.1)]">
                            <h3 className="text-sm font-black text-[#F8FAFC] uppercase mb-4">Chi tiết Buyer Ratings (Manual Score)</h3>
                            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                                {[
                                    { name: "Payment Timeliness", icon: Calendar },
                                    { name: "Spec Clarity", icon: FileText },
                                    { name: "Communication", icon: Phone },
                                    { name: "Process Compliance", icon: CheckCircle },
                                    { name: "Dispute Fairness", icon: ThumbsUp },
                                ].map((item, idx) => (
                                    <div key={idx} className="bg-[#0F1117] rounded-xl p-4 text-center">
                                        <item.icon size={20} className="text-[#3B82F6] mx-auto mb-2" />
                                        <p className="text-[#94A3B8] text-xs">{item.name}</p>
                                        <p className="text-[#F8FAFC] font-bold text-sm mt-1">1-5 điểm</p>
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
