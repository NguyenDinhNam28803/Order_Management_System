"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useProcurement, Organization, PO } from "../../../context/ProcurementContext";
import { 
    ArrowLeft, Building2, Star, TrendingUp, Award, 
    Package, CheckCircle, AlertTriangle, FileText,
    Calendar, Phone, Mail, MapPin, RefreshCw, Loader2,
    ChevronRight, BarChart3, ThumbsUp, ShoppingBag,
    Sparkles, Clock, Target, Zap, Shield, MessageSquare,
    HelpCircle, FileCheck, Scale
} from "lucide-react";

// Tooltip Component
const Tooltip = ({ children, content, position = 'top' }: { children: React.ReactNode; content: React.ReactNode; position?: 'top' | 'bottom' | 'left' | 'right' }) => {
    const [show, setShow] = useState(false);
    return (
        <div className="relative inline-block overflow-visible">
            <div onMouseEnter={() => setShow(true)} onMouseLeave={() => setShow(false)} className="relative">
                {children}
            </div>
            {show && (
                <div className={`absolute z-[100] ${
                    position === 'top' ? 'bottom-full left-1/2 -translate-x-1/2 mb-2' :
                    position === 'bottom' ? 'top-full left-1/2 -translate-x-1/2 mt-2' :
                    position === 'left' ? 'right-full top-1/2 -translate-y-1/2 mr-2' :
                    'left-full top-1/2 -translate-y-1/2 ml-2'
                }`}>
                    <div className="bg-[#1A1D23] border border-[rgba(148,163,184,0.2)] rounded-xl p-3 shadow-2xl max-w-xs text-xs text-[#94A3B8] whitespace-normal min-w-[220px]">
                        {content}
                    </div>
                </div>
            )}
        </div>
    );
};

interface KPIMetrics {
    id?: string;
    supplierId?: string;
    buyerOrgId?: string;
    otdScore?: number;
    onTimeDeliveryScore?: number;
    qualityScore?: number;
    manualScore?: number;
    priceScore?: number;
    overallScore?: number;
    tier?: string;
    poCount?: number;
    disputeCount?: number;
    periodYear?: number;
    periodQuarter?: number;
    period?: string;
    notes?: string;
    improvementPlan?: string;
    evaluatedAt?: string;
    calculatedAt?: string;
}

export default function ProcurementSupplierDetailPage() {
    const params = useParams();
    const router = useRouter();
    const supplierId = params.id as string;
    const { organizations, allPos, currentUser, apiFetch, notify, evaluateSupplierKPI, fetchSupplierKPIReport } = useProcurement();
    
    const [supplier, setSupplier] = useState<Organization | null>(null);
    const [supplierPOs, setSupplierPOs] = useState<PO[]>([]);
    const [kpiHistory, setKpiHistory] = useState<KPIMetrics[]>([]);
    const [loading, setLoading] = useState(true);
    const [evaluating, setEvaluating] = useState(false);
    const [activeTab, setActiveTab] = useState<"overview" | "kpi" | "pos">("overview");
    
    // Manual Review Modal
    const [showReviewModal, setShowReviewModal] = useState(false);
    const [selectedPO, setSelectedPO] = useState<PO | null>(null);
    const [reviewScores, setReviewScores] = useState({
        packagingScore: 5,
        labelingScore: 5,
        coaAccuracyScore: 5,
        communicationScore: 5,
        flexibilityScore: 5,
        complianceScore: 5,
    });
    const [reviewComment, setReviewComment] = useState("");
    const [submittingReview, setSubmittingReview] = useState(false);

    // Find supplier and filter POs
    useEffect(() => {
        const found = organizations?.find((o: Organization) => o.id === supplierId);
        if (found) {
            setSupplier(found);
            
            // Get POs with this supplier for current user's org
            const userPOs = (allPos || []).filter(
                (po: PO) => po.supplierId === supplierId && 
                           (po.orgId === currentUser?.orgId || !po.orgId)
            );
            setSupplierPOs(userPOs);
        }
    }, [organizations, allPos, supplierId, currentUser]);

    // Fetch KPI history
    const fetchKPIHistory = async () => {
        // Check if user has orgId
        if (!currentUser?.orgId) {
            console.warn("User has no orgId, cannot fetch KPI history");
            setLoading(false);
            return;
        }
        
        try {
            const kpis = await fetchSupplierKPIReport(supplierId);
            setKpiHistory(kpis || []);
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
        // Check if user has orgId
        if (!currentUser?.orgId) {
            notify("Bạn chưa thuộc tổ chức nào. Vui lòng liên hệ admin để được gán vào tổ chức.", "error");
            return;
        }
        
        setEvaluating(true);
        try {
            const result = await evaluateSupplierKPI(supplierId);
            if (result) {
                notify("Đánh giá KPI thành công! Xem kết quả chi tiết bên dưới.", "success");
                await fetchKPIHistory();
                // Switch to KPI tab to show results
                setActiveTab("kpi");
            } else {
                notify("Đánh giá thất bại", "error");
            }
        } catch (error) {
            notify("Lỗi kết nối server", "error");
        } finally {
            setEvaluating(false);
        }
    };

    // Helper to get score percentage for progress bar
    const getScorePercentage = (score?: number) => Math.min(Math.max(score || 0, 0), 100);
    
    // Submit manual review
    const handleSubmitReview = async () => {
        if (!selectedPO || !latestKPI?.id) {
            notify("Vui lòng chọn PO để đánh giá", "error");
            return;
        }
        
        setSubmittingReview(true);
        try {
            const resp = await apiFetch('/reviews/supplier-review', {
                method: 'POST',
                body: JSON.stringify({
                    kpiScoreId: latestKPI.id,
                    poId: selectedPO.id,
                    ...reviewScores,
                    comment: reviewComment,
                })
            });
            
            if (resp.ok) {
                notify("Đánh giá thành công!", "success");
                setShowReviewModal(false);
                setReviewComment("");
                // Refresh KPI data
                await fetchKPIHistory();
            } else {
                const error = await resp.text();
                notify("Đánh giá thất bại: " + error, "error");
            }
        } catch (error) {
            notify("Lỗi kết nối server", "error");
        } finally {
            setSubmittingReview(false);
        }
    };
    
    // Format evaluation date
    const getEvaluationDate = (kpi?: KPIMetrics) => {
        if (!kpi) return null;
        const date = kpi.calculatedAt || kpi.evaluatedAt;
        if (!date) return null;
        return new Date(date).toLocaleString("vi-VN", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit"
        });
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

    const getStatusColor = (status?: string) => {
        switch (status) {
            case "COMPLETED": return "text-emerald-400 bg-emerald-500/10";
            case "SHIPPED": return "text-blue-400 bg-blue-500/10";
            case "CONFIRMED": return "text-yellow-400 bg-yellow-500/10";
            case "CANCELLED": return "text-rose-400 bg-rose-500/10";
            default: return "text-[#64748B] bg-[#1A1D23]";
        }
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
                        <span className="text-sm font-bold">Quay lại danh sách</span>
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
                                    {latestKPI && (
                                        <span className="flex items-center gap-1 text-xs text-[#64748B]">
                                            <Clock size={12} />
                                            Đánh giá: {getEvaluationDate(latestKPI)}
                                        </span>
                                    )}
                                </div>
                                <p className="text-[#64748B] text-sm">{supplier.code} • {supplier.email}</p>
                            </div>
                        </div>
                        
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => setShowReviewModal(true)}
                                disabled={!latestKPI || supplierPOs.length === 0}
                                className="flex items-center gap-2 bg-[#8B5CF6] hover:bg-[#7C3AED] text-white px-6 py-3 rounded-xl font-bold text-sm transition-all disabled:opacity-50"
                            >
                                <Star size={18} />
                                Đánh giá thủ công
                            </button>
                            
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
            </div>

            {/* Navigation Tabs */}
            <div className="bg-[#161922] border-b border-[rgba(148,163,184,0.1)]">
                <div className="max-w-[1400px] mx-auto px-8">
                    <div className="flex gap-8">
                        {([
                            { id: "overview", label: "Tổng quan", icon: Building2 },
                            { id: "kpi", label: "KPI & Hiệu suất", icon: BarChart3 },
                            { id: "pos", label: `Đơn hàng (${supplierPOs.length})`, icon: ShoppingBag },
                        ] as { id: "overview" | "kpi" | "pos"; label: string; icon: typeof Building2 }[]).map((tab) => (
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
                        {/* KPI Overview Cards with Progress Bars */}
                        <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* OTD Score */}
                            <div className="bg-[#161922] rounded-2xl p-5 border border-[rgba(148,163,184,0.1)]">
                                <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center gap-2">
                                        <div className="p-2 bg-emerald-500/10 rounded-lg">
                                            <TrendingUp size={16} className="text-emerald-400" />
                                        </div>
                                        <Tooltip content={
                                            <div className="space-y-2">
                                                <p className="font-bold text-emerald-400">OTD - On-Time Delivery Score</p>
                                                <p>Tỷ lệ giao hàng đúng hẹn trong kỳ đánh giá</p>
                                                <p className="text-[#64748B]">Công thức: (Số PO đúng hạn / Tổng PO) × 100</p>
                                                <p className="text-[#64748B]">Trọng số: 30% trong điểm tổng</p>
                                            </div>
                                        }>
                                            <span className="text-[#94A3B8] text-xs font-bold uppercase cursor-help hover:text-emerald-400 transition-colors">OTD Score</span>
                                        </Tooltip>
                                    </div>
                                    <span className={`text-2xl font-black ${getScoreColor(latestKPI?.otdScore)}`}>
                                        {typeof latestKPI?.otdScore === 'number' ? latestKPI.otdScore.toFixed(0) : "--"}%
                                    </span>
                                </div>
                                <div className="h-2 bg-[#0F1117] rounded-full overflow-hidden">
                                    <div 
                                        className={`h-full rounded-full transition-all duration-1000 ${
                                            (latestKPI?.otdScore || 0) >= 90 ? "bg-emerald-400" : 
                                            (latestKPI?.otdScore || 0) >= 70 ? "bg-yellow-400" : "bg-rose-400"
                                        }`}
                                        style={{ width: `${getScorePercentage(latestKPI?.otdScore)}%` }}
                                    />
                                </div>
                                <p className="text-[#64748B] text-xs mt-2">Giao hàng đúng hạn (trọng số 30%)</p>
                            </div>
                            
                            {/* Quality Score */}
                            <div className="bg-[#161922] rounded-2xl p-5 border border-[rgba(148,163,184,0.1)]">
                                <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center gap-2">
                                        <div className="p-2 bg-blue-500/10 rounded-lg">
                                            <Package size={16} className="text-[#3B82F6]" />
                                        </div>
                                        <Tooltip content={
                                            <div className="space-y-2">
                                                <p className="font-bold text-blue-400">Quality Score</p>
                                                <p>Đánh giá chất lượng sản phẩm và dịch vụ</p>
                                                <ul className="list-disc pl-4 space-y-0.5 text-[#64748B]">
                                                    <li>Tỷ lệ đồng ý hàng (GRN)</li>
                                                    <li>Độ chính xác COA (Certificate of Analysis)</li>
                                                    <li>Đóng gói, nhãn mác đúng quy cách</li>
                                                    <li>Số lượng khiếu nại chất lượng</li>
                                                </ul>
                                                <p className="text-[#64748B]">Trọng số: 30% trong điểm tổng</p>
                                            </div>
                                        }>
                                            <span className="text-[#94A3B8] text-xs font-bold uppercase cursor-help hover:text-blue-400 transition-colors">Quality Score</span>
                                        </Tooltip>
                                    </div>
                                    <span className={`text-2xl font-black ${getScoreColor(latestKPI?.qualityScore)}`}>
                                        {typeof latestKPI?.qualityScore === 'number' ? latestKPI.qualityScore.toFixed(0) : "--"}%
                                    </span>
                                </div>
                                <div className="h-2 bg-[#0F1117] rounded-full overflow-hidden">
                                    <div 
                                        className={`h-full rounded-full transition-all duration-1000 ${
                                            (latestKPI?.qualityScore || 0) >= 90 ? "bg-emerald-400" : 
                                            (latestKPI?.qualityScore || 0) >= 70 ? "bg-yellow-400" : "bg-rose-400"
                                        }`}
                                        style={{ width: `${getScorePercentage(latestKPI?.qualityScore)}%` }}
                                    />
                                </div>
                                <p className="text-[#64748B] text-xs mt-2">Chất lượng sản phẩm (trọng số 30%)</p>
                            </div>
                            
                            {/* Price Score */}
                            <div className="bg-[#161922] rounded-2xl p-5 border border-[rgba(148,163,184,0.1)]">
                                <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center gap-2">
                                        <div className="p-2 bg-yellow-500/10 rounded-lg">
                                            <Award size={16} className="text-yellow-400" />
                                        </div>
                                        <Tooltip content={
                                            <div className="space-y-2">
                                                <p className="font-bold text-yellow-400">Price Score</p>
                                                <p>Đánh giá cạnh tranh giá và điều khoản thanh toán</p>
                                                <ul className="list-disc pl-4 space-y-0.5 text-[#64748B]">
                                                    <li>Giá RFQ so với đối thủ cạnh tranh</li>
                                                    <li>Chiết khấu theo số lượng</li>
                                                    <li>Điều khoản thanh toán (Net 30/60/90)</li>
                                                    <li>Ổn định giá theo thời gian</li>
                                                </ul>
                                                <p className="text-[#64748B]">Trọng số: 20% trong điểm tổng</p>
                                            </div>
                                        }>
                                            <span className="text-[#94A3B8] text-xs font-bold uppercase cursor-help hover:text-yellow-400 transition-colors">Price Score</span>
                                        </Tooltip>
                                    </div>
                                    <span className={`text-2xl font-black ${getScoreColor(latestKPI?.priceScore)}`}>
                                        {typeof latestKPI?.priceScore === 'number' ? latestKPI.priceScore.toFixed(0) : "--"}%
                                    </span>
                                </div>
                                <div className="h-2 bg-[#0F1117] rounded-full overflow-hidden">
                                    <div 
                                        className={`h-full rounded-full transition-all duration-1000 ${
                                            (latestKPI?.priceScore || 0) >= 90 ? "bg-emerald-400" : 
                                            (latestKPI?.priceScore || 0) >= 70 ? "bg-yellow-400" : "bg-rose-400"
                                        }`}
                                        style={{ width: `${getScorePercentage(latestKPI?.priceScore)}%` }}
                                    />
                                </div>
                                <p className="text-[#64748B] text-xs mt-2">Cạnh tranh giá (trọng số 20%)</p>
                            </div>
                            
                            {/* Manual Score */}
                            <div className="bg-[#161922] rounded-2xl p-5 border border-[rgba(148,163,184,0.1)]">
                                <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center gap-2">
                                        <div className="p-2 bg-purple-500/10 rounded-lg">
                                            <Star size={16} className="text-purple-400" />
                                        </div>
                                        <Tooltip content={
                                            <div className="space-y-2">
                                                <p className="font-bold text-purple-400">Manual Score</p>
                                                <p>Đánh giá chủ quan của người mua (Procurement)</p>
                                                <ul className="list-disc pl-4 space-y-0.5 text-[#64748B]">
                                                    <li>Đóng gói &amp; bao bì (1-5 sao)</li>
                                                    <li>Nhãn mác &amp; chứng từ (1-5 sao)</li>
                                                    <li>Độ chính xác COA (1-5 sao)</li>
                                                    <li>Giao tiếp &amp; phản hồi (1-5 sao)</li>
                                                    <li>Linh hoạt xử lý sự cố (1-5 sao)</li>
                                                    <li>Tuân thủ quy định (1-5 sao)</li>
                                                </ul>
                                                <p className="text-[#64748B]">Trọng số: 20% trong điểm tổng</p>
                                            </div>
                                        }>
                                            <span className="text-[#94A3B8] text-xs font-bold uppercase cursor-help hover:text-purple-400 transition-colors">Manual Score</span>
                                        </Tooltip>
                                    </div>
                                    <span className={`text-2xl font-black ${getScoreColor(latestKPI?.manualScore)}`}>
                                        {typeof latestKPI?.manualScore === 'number' ? latestKPI.manualScore.toFixed(0) : "--"}%
                                    </span>
                                </div>
                                <div className="h-2 bg-[#0F1117] rounded-full overflow-hidden">
                                    <div 
                                        className={`h-full rounded-full transition-all duration-1000 ${
                                            (latestKPI?.manualScore || 0) >= 90 ? "bg-emerald-400" : 
                                            (latestKPI?.manualScore || 0) >= 70 ? "bg-yellow-400" : "bg-rose-400"
                                        }`}
                                        style={{ width: `${getScorePercentage(latestKPI?.manualScore)}%` }}
                                    />
                                </div>
                                <p className="text-[#64748B] text-xs mt-2">Đánh giá thủ công (trọng số 20%)</p>
                            </div>
                        </div>

                        {/* Overall Score Card */}
                        <div className="bg-gradient-to-br from-[#3B82F6]/10 via-[#8B5CF6]/10 to-[#EC4899]/10 rounded-2xl p-8 border border-[#3B82F6]/20 relative">
                            <div className="absolute top-0 right-0 p-4 opacity-10">
                                <Sparkles size={80} className="text-[#3B82F6]" />
                            </div>
                            
                            <div className="relative z-10">
                                <div className="flex items-center gap-2 mb-4">
                                    <Target size={16} className="text-[#3B82F6]" />
                                    <Tooltip content={
                                        <div className="space-y-2">
                                            <p className="font-bold text-[#3B82F6]">Công thức tính Overall Score</p>
                                            <div className="space-y-1">
                                                <div className="flex justify-between gap-4">
                                                    <span className="text-emerald-400">OTD × 30%</span>
                                                    <span className="text-[#64748B]">{(latestKPI?.otdScore || 0).toFixed(1)} × 0.3 = {((latestKPI?.otdScore || 0) * 0.3).toFixed(1)}</span>
                                                </div>
                                                <div className="flex justify-between gap-4">
                                                    <span className="text-blue-400">Quality × 30%</span>
                                                    <span className="text-[#64748B]">{(latestKPI?.qualityScore || 0).toFixed(1)} × 0.3 = {((latestKPI?.qualityScore || 0) * 0.3).toFixed(1)}</span>
                                                </div>
                                                <div className="flex justify-between gap-4">
                                                    <span className="text-yellow-400">Price × 20%</span>
                                                    <span className="text-[#64748B]">{(latestKPI?.priceScore || 0).toFixed(1)} × 0.2 = {((latestKPI?.priceScore || 0) * 0.2).toFixed(1)}</span>
                                                </div>
                                                <div className="flex justify-between gap-4">
                                                    <span className="text-purple-400">Manual × 20%</span>
                                                    <span className="text-[#64748B]">{(latestKPI?.manualScore || 0).toFixed(1)} × 0.2 = {((latestKPI?.manualScore || 0) * 0.2).toFixed(1)}</span>
                                                </div>
                                            </div>
                                            <div className="border-t border-[rgba(148,163,184,0.2)] pt-2 mt-2">
                                                <div className="flex justify-between">
                                                    <span className="font-bold text-[#F8FAFC]">TỔNG</span>
                                                    <span className="font-bold text-[#3B82F6]">
                                                        {((latestKPI?.otdScore || 0) * 0.3 + 
                                                          (latestKPI?.qualityScore || 0) * 0.3 + 
                                                          (latestKPI?.priceScore || 0) * 0.2 + 
                                                          (latestKPI?.manualScore || 0) * 0.2).toFixed(1)}%
                                                    </span>
                                                </div>
                                            </div>
                                            <p className="text-[10px] text-[#64748B] mt-1">
                                                *Làm tròn 1 số thập phân
                                            </p>
                                        </div>
                                    } position="bottom">
                                        <div className="flex items-center gap-1 cursor-help">
                                            <p className="text-[#94A3B8] text-xs font-bold uppercase tracking-wider hover:text-[#3B82F6] transition-colors">Overall Score</p>
                                            <HelpCircle size={14} className="text-[#64748B] hover:text-[#3B82F6]" />
                                        </div>
                                    </Tooltip>
                                </div>
                                
                                <div className="flex items-baseline gap-2 mb-2">
                                    <p className={`text-6xl font-black ${getScoreColor(latestKPI?.overallScore)}`}>
                                        {typeof latestKPI?.overallScore === 'number' ? latestKPI.overallScore.toFixed(1) : "--"}%
                                    </p>
                                    {latestKPI?.tier && (
                                        <Tooltip content={
                                            <div className="space-y-2">
                                                <p className="font-bold text-[#F8FAFC]">Phân loại nhà cung cấp</p>
                                                <div className="space-y-1">
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-emerald-400">🥇 GOLD</span>
                                                        <span className="text-[#64748B]">≥90 điểm - Xuất sắc</span>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-yellow-400">🥈 SILVER</span>
                                                        <span className="text-[#64748B]">70-89 điểm - Tốt</span>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-rose-400">🥉 BRONZE</span>
                                                        <span className="text-[#64748B]">&lt;70 điểm - Cần cải thiện</span>
                                                    </div>
                                                </div>
                                                <p className="text-[10px] text-[#64748B] pt-1 border-t border-[rgba(148,163,184,0.2)]">
                                                    Đánh giá dựa trên Overall Score tính toán
                                                </p>
                                            </div>
                                        } position="right">
                                            <span className={`px-3 py-1 rounded-full text-xs font-black uppercase border cursor-help ${getTierColor(latestKPI?.tier)}`}>
                                                {latestKPI.tier}
                                            </span>
                                        </Tooltip>
                                    )}
                                </div>
                                
                                {/* Overall Progress Bar */}
                                <div className="h-3 bg-[#0F1117] rounded-full overflow-hidden mb-4">
                                    <div 
                                        className={`h-full rounded-full transition-all duration-1000 bg-gradient-to-r from-[#3B82F6] to-[#8B5CF6]`}
                                        style={{ width: `${getScorePercentage(latestKPI?.overallScore)}%` }}
                                    />
                                </div>
                                
                                <p className="text-[#94A3B8] text-sm leading-relaxed">
                                    {latestKPI?.notes || "Chưa có phân tích chi tiết. Vui lòng chạy đánh giá AI."}
                                </p>
                                
                                {getEvaluationDate(latestKPI) && (
                                    <div className="flex items-center gap-2 mt-4 pt-4 border-t border-[rgba(148,163,184,0.1)]">
                                        <Clock size={14} className="text-[#64748B]" />
                                        <span className="text-xs text-[#64748B]">
                                            Đánh giá gần nhất: {getEvaluationDate(latestKPI)}
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* AI Analysis & Improvement Plan */}
                        {latestKPI?.improvementPlan && (
                            <div className="lg:col-span-3 bg-gradient-to-r from-amber-500/5 via-orange-500/5 to-amber-500/5 border border-amber-500/20 rounded-2xl p-6">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="p-2 bg-amber-500/10 rounded-xl">
                                        <Zap size={20} className="text-amber-400" />
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-black text-amber-400 uppercase">Phân tích & Kế hoạch cải thiện (AI)</h3>
                                        <p className="text-xs text-[#64748B]">Gợi ý từ hệ thống AI dựa trên dữ liệu thực tế</p>
                                    </div>
                                </div>
                                <div className="bg-[#0F1117]/50 rounded-xl p-4">
                                    <p className="text-[#CBD5E1] text-sm leading-relaxed whitespace-pre-wrap">{latestKPI.improvementPlan}</p>
                                </div>
                            </div>
                        )}

                        {/* Quick Stats Row */}
                        <div className="lg:col-span-3 grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="bg-[#161922] rounded-xl p-4 border border-[rgba(148,163,184,0.1)] flex items-center gap-3">
                                <div className="p-2 bg-emerald-500/10 rounded-lg">
                                    <ShoppingBag size={16} className="text-emerald-400" />
                                </div>
                                <div>
                                    <p className="text-xl font-black text-[#F8FAFC]">{supplierPOs.length}</p>
                                    <p className="text-xs text-[#64748B]">Tổng PO</p>
                                </div>
                            </div>
                            <div className="bg-[#161922] rounded-xl p-4 border border-[rgba(148,163,184,0.1)] flex items-center gap-3">
                                <div className="p-2 bg-rose-500/10 rounded-lg">
                                    <AlertTriangle size={16} className="text-rose-400" />
                                </div>
                                <div>
                                    <p className={`text-xl font-black ${(latestKPI?.disputeCount || 0) > 0 ? "text-rose-400" : "text-emerald-400"}`}>
                                        {latestKPI?.disputeCount || "0"}
                                    </p>
                                    <p className="text-xs text-[#64748B]">Tranh chấp</p>
                                </div>
                            </div>
                            <div className="bg-[#161922] rounded-xl p-4 border border-[rgba(148,163,184,0.1)] flex items-center gap-3">
                                <div className="p-2 bg-blue-500/10 rounded-lg">
                                    <CheckCircle size={16} className="text-blue-400" />
                                </div>
                                <div>
                                    <p className="text-xl font-black text-[#F8FAFC]">{latestKPI?.poCount || "0"}</p>
                                    <p className="text-xs text-[#64748B]">PO đã đánh giá</p>
                                </div>
                            </div>
                            <div className="bg-[#161922] rounded-xl p-4 border border-[rgba(148,163,184,0.1)] flex items-center gap-3">
                                <div className="p-2 bg-purple-500/10 rounded-lg">
                                    <Shield size={16} className="text-purple-400" />
                                </div>
                                <div>
                                    <p className="text-xl font-black text-[#F8FAFC]">{kpiHistory.length}</p>
                                    <p className="text-xs text-[#64748B]">Số kỳ đánh giá</p>
                                </div>
                            </div>
                        </div>
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

                        {!kpiHistory.length && (
                            <div className="text-center py-12 bg-[#161922] rounded-2xl border border-[rgba(148,163,184,0.1)]">
                                <BarChart3 size={48} className="text-[#64748B] mx-auto mb-4" />
                                <p className="text-[#64748B] font-bold">Chưa có dữ liệu đánh giá</p>
                                <p className="text-[#64748B] text-sm mt-2">Chạy đánh giá AI để tạo báo cáo KPI</p>
                            </div>
                        )}
                    </div>
                )}

                {activeTab === "pos" && (
                    <div className="space-y-6">
                        <div className="flex items-center justify-between">
                            <h2 className="text-xl font-black text-[#F8FAFC] uppercase tracking-tight">
                                Danh sách PO ({supplierPOs.length})
                            </h2>
                            <Tooltip content={
                                <div className="space-y-2 max-w-xs">
                                    <p className="font-bold text-[#3B82F6]">3-Way Matching (So khớp 3 chiều)</p>
                                    <p>Quy trình kiểm tra thanh toán chuẩn:</p>
                                    <div className="space-y-1 text-[#64748B]">
                                        <div className="flex items-start gap-2">
                                            <span className="bg-blue-500/20 text-blue-400 px-1.5 rounded text-[10px] font-bold">1</span>
                                            <span><strong>PO</strong> - Purchase Order (Đơn đặt hàng)</span>
                                        </div>
                                        <div className="flex items-start gap-2">
                                            <span className="bg-emerald-500/20 text-emerald-400 px-1.5 rounded text-[10px] font-bold">2</span>
                                            <span><strong>GRN</strong> - Goods Receipt Note (Phiếu nhận hàng)</span>
                                        </div>
                                        <div className="flex items-start gap-2">
                                            <span className="bg-yellow-500/20 text-yellow-400 px-1.5 rounded text-[10px] font-bold">3</span>
                                            <span><strong>Invoice</strong> - Hóa đơn từ nhà cung cấp</span>
                                        </div>
                                    </div>
                                    <p className="text-[#64748B] border-t border-[rgba(148,163,184,0.2)] pt-2 mt-2">
                                        Chỉ thanh toán khi cả 3 chứng từ khớp nhau về số lượng, giá và điều khoản.
                                    </p>
                                </div>
                            }>
                                <div className="flex items-center gap-2 px-3 py-1.5 bg-[#1A1D23] rounded-lg border border-[rgba(148,163,184,0.1)] cursor-help hover:border-[#3B82F6]/50 transition-colors">
                                    <Scale size={14} className="text-[#3B82F6]" />
                                    <span className="text-xs text-[#94A3B8]">3-Way Matching</span>
                                    <HelpCircle size={12} className="text-[#64748B]" />
                                </div>
                            </Tooltip>
                        </div>
                        
                        <div className="bg-[#161922] rounded-2xl border border-[rgba(148,163,184,0.1)] overflow-hidden">
                            <table className="erp-table text-xs">
                                <thead className="bg-[#0F1117]">
                                    <tr>
                                        <th className="px-6 py-4 text-left text-xs font-black text-[#64748B] uppercase">PO Number</th>
                                        <th className="px-6 py-4 text-left text-xs font-black text-[#64748B] uppercase">Ngày tạo</th>
                                        <th className="px-6 py-4 text-right text-xs font-black text-[#64748B] uppercase">Tổng tiền</th>
                                        <th className="px-6 py-4 text-center text-xs font-black text-[#64748B] uppercase">Trạng thái</th>
                                        <th className="px-6 py-4 text-center text-xs font-black text-[#64748B] uppercase">Items</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {supplierPOs.map((po) => (
                                        <tr key={po.id} className="border-t border-[rgba(148,163,184,0.05)]">
                                            <td className="px-6 py-4 text-sm font-bold text-[#3B82F6]">
                                                {po.poNumber}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-[#94A3B8]">
                                                {po.createdAt ? new Date(po.createdAt).toLocaleDateString("vi-VN") : "--"}
                                            </td>
                                            <td className="px-6 py-4 text-sm font-bold text-[#F8FAFC] text-right">
                                                {(po.total || po.items?.reduce((sum, item) => sum + (item.estimatedPrice || item.qty * (item?.unitPrice || 0)), 0))?.toLocaleString("vi-VN")} ₫
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${getStatusColor(po.status)}`}>
                                                    {po.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-center text-sm text-[#94A3B8]">
                                                {po.items?.length || 0} items
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {supplierPOs.length === 0 && (
                            <div className="text-center py-12 bg-[#161922] rounded-2xl border border-[rgba(148,163,184,0.1)]">
                                <ShoppingBag size={48} className="text-[#64748B] mx-auto mb-4" />
                                <p className="text-[#64748B] font-bold">Chưa có PO nào</p>
                                <p className="text-[#64748B] text-sm mt-2">Bạn chưa tạo PO nào với nhà cung cấp này</p>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Manual Review Modal */}
            {showReviewModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-[#161922] rounded-2xl border border-[rgba(148,163,184,0.1)] max-w-lg w-full max-h-[90vh] overflow-y-auto">
                        <div className="p-6 border-b border-[rgba(148,163,184,0.1)]">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-[#8B5CF6]/10 rounded-xl">
                                        <Star size={20} className="text-[#8B5CF6]" />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-black text-[#F8FAFC]">Đánh giá thủ công</h3>
                                        <p className="text-xs text-[#64748B]">{supplier?.name}</p>
                                    </div>
                                </div>
                                <button 
                                    onClick={() => setShowReviewModal(false)}
                                    className="text-[#64748B] hover:text-[#F8FAFC]"
                                >
                                    ✕
                                </button>
                            </div>
                        </div>

                        <div className="p-6 space-y-6">
                            {/* Select PO */}
                            <div>
                                <label className="text-sm font-bold text-[#94A3B8] mb-2 block">Chọn PO để đánh giá</label>
                                <select
                                    value={selectedPO?.id || ""}
                                    onChange={(e) => {
                                        const po = supplierPOs.find(p => p.id === e.target.value);
                                        setSelectedPO(po || null);
                                    }}
                                    className="w-full bg-[#0F1117] border border-[rgba(148,163,184,0.1)] rounded-xl px-4 py-3 text-[#F8FAFC] text-sm focus:border-[#8B5CF6] outline-none"
                                >
                                    <option value="">-- Chọn PO --</option>
                                    {supplierPOs.map(po => (
                                        <option key={po.id} value={po.id}>
                                            {po.poNumber} - {po.total?.toLocaleString("vi-VN")} ₫
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Score Inputs */}
                            <div className="space-y-4">
                                {[
                                    { key: 'packagingScore', label: 'Đóng gói', icon: Package },
                                    { key: 'labelingScore', label: 'Dán nhãn', icon: FileText },
                                    { key: 'coaAccuracyScore', label: 'COA chính xác', icon: CheckCircle },
                                    { key: 'communicationScore', label: 'Giao tiếp', icon: MessageSquare },
                                    { key: 'flexibilityScore', label: 'Linh hoạt', icon: TrendingUp },
                                    { key: 'complianceScore', label: 'Tuân thủ', icon: Shield },
                                ].map(({ key, label, icon: Icon }) => (
                                    <div key={key} className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <Icon size={16} className="text-[#64748B]" />
                                            <span className="text-sm text-[#94A3B8]">{label}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {[1, 2, 3, 4, 5].map((star) => (
                                                <button
                                                    key={star}
                                                    onClick={() => setReviewScores(prev => ({ ...prev, [key]: star }))}
                                                    className={`transition-colors ${
                                                        reviewScores[key as keyof typeof reviewScores] >= star 
                                                            ? "text-yellow-400" 
                                                            : "text-[#64748B]"
                                                    }`}
                                                >
                                                    <Star size={20} fill={reviewScores[key as keyof typeof reviewScores] >= star ? "currentColor" : "none"} />
                                                </button>
                                            ))}
                                            <span className="text-sm font-bold text-[#F8FAFC] w-6 text-center">
                                                {reviewScores[key as keyof typeof reviewScores]}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Comment */}
                            <div>
                                <label className="text-sm font-bold text-[#94A3B8] mb-2 block">Nhận xét (tùy chọn)</label>
                                <textarea
                                    value={reviewComment}
                                    onChange={(e) => setReviewComment(e.target.value)}
                                    placeholder="Nhập nhận xét của bạn..."
                                    className="w-full bg-[#0F1117] border border-[rgba(148,163,184,0.1)] rounded-xl px-4 py-3 text-[#F8FAFC] text-sm focus:border-[#8B5CF6] outline-none min-h-[100px] resize-none"
                                />
                            </div>
                        </div>

                        <div className="p-6 border-t border-[rgba(148,163,184,0.1)] flex gap-3">
                            <button
                                onClick={() => setShowReviewModal(false)}
                                className="flex-1 px-4 py-3 rounded-xl text-sm font-bold text-[#94A3B8] hover:text-[#F8FAFC] transition-colors"
                            >
                                Hủy
                            </button>
                            <button
                                onClick={handleSubmitReview}
                                disabled={!selectedPO || submittingReview}
                                className="flex-1 px-4 py-3 rounded-xl bg-[#8B5CF6] hover:bg-[#7C3AED] text-white text-sm font-bold transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {submittingReview ? (
                                    <>
                                        <Loader2 size={16} className="animate-spin" />
                                        Đang gửi...
                                    </>
                                ) : (
                                    <>
                                        <CheckCircle size={16} />
                                        Gửi đánh giá
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </main>
    );
}
