'use client';

import { useEffect, useState, ReactNode } from 'react';
import { useParams } from 'next/navigation';
import { useProcurement } from '@/app/context/ProcurementContext';
import { Award, BarChart3, RefreshCcw, TrendingUp, AlertCircle, ArrowLeft, Target, Clock, CheckCircle, DollarSign, Package, MessageSquare, FileCheck, Calendar, FileText, Lightbulb, ThumbsUp, ThumbsDown, Zap } from 'lucide-react';
import Link from 'next/link';

interface KPIScore {
  id: string;
  supplierId: string;
  buyerOrgId: string;
  periodYear: number;
  periodQuarter: number;
  otdScore: number;
  qualityScore: number;
  priceScore: number;
  invoiceAccuracy: string;
  fulfillmentRate: string;
  responseTimeScore: string;
  manualScore: number;
  tier: string;
  poCount: number;
  disputeCount: number;
  reviewCompleted: boolean;
  qbrHeldAt: string | null;
  improvementPlan: string;
  notes: string;
  calculatedAt: string;
  createdAt: string;
  updatedAt: string;
}

interface AIInsights {
  overallScore: number;
  otdScore: number;
  qualityScore: number;
  priceScore: number;
  tierRecommendation: string;
  analysis: string;
  improvementPlan: string;
  pros: string[];
  cons: string[];
}

interface KPIResponse {
  kpiScore: KPIScore;
  aiInsights: AIInsights | null | undefined;
}

const metricIcons: Record<string, ReactNode> = {
  'otdScore': <Clock size={18} className="text-[#B4533A]" />,
  'qualityScore': <CheckCircle size={18} className="text-black" />,
  'priceScore': <DollarSign size={18} className="text-black" />,
  'invoiceAccuracy': <FileCheck size={18} className="text-violet-400" />,
  'responseTimeScore': <MessageSquare size={18} className="text-black" />,
  'fulfillmentRate': <Package size={18} className="text-black" />,
};

const metricLabels: Record<string, string> = {
  'otdScore': 'Giao hàng đúng hạn (OTD)',
  'qualityScore': 'Chất lượng sản phẩm/dịch vụ',
  'priceScore': 'Giá cả cạnh tranh',
  'invoiceAccuracy': 'Chính xác hóa đơn',
  'responseTimeScore': 'Thời gian phản hồi',
  'fulfillmentRate': 'Tỷ lệ hoàn thành đơn hàng',
};

const tierLabels: Record<string, string> = {
  'STRATEGIC': 'Chiến lược',
  'PREFERRED': 'Ưu tiên',
  'APPROVED': 'Đã duyệt',
  'CONDITIONAL': 'Có điều kiện',
  'DISQUALIFIED': 'Không đạt',
  'PENDING': 'Chờ duyệt',
  'GOLD': 'Vàng',
  'SILVER': 'Bạc',
  'BRONZE': 'Đồng',
};

const tierColors: Record<string, string> = {
  'STRATEGIC': 'from-purple-500/20 to-purple-600/10 border-purple-500/30 text-black',
  'PREFERRED': 'from-[#B4533A]/20 to-[#A85032]/10 border-[#B4533A]/30 text-[#CB7A62]',
  'APPROVED': 'from-emerald-500/20 to-emerald-600/10 border-emerald-500/30 text-black',
  'CONDITIONAL': 'from-amber-500/20 to-amber-600/10 border-amber-500/30 text-black',
  'DISQUALIFIED': 'from-rose-500/20 to-rose-600/10 border-rose-500/30 text-black',
  'PENDING': 'from-gray-500/20 to-gray-600/10 border-gray-500/30 text-black',
  'GOLD': 'from-yellow-500/20 to-yellow-600/10 border-yellow-500/30 text-yellow-400',
  'SILVER': 'from-gray-400/20 to-gray-500/10 border-gray-400/30 text-gray-300',
  'BRONZE': 'from-orange-500/20 to-orange-600/10 border-orange-500/30 text-black',
};

export default function SupplierKPIPage() {
  const params = useParams();
  const supplierId = params.id as string;
  const { evaluateSupplierKPI, fetchSupplierKPIReport, notify } = useProcurement();
  const [kpiData, setKPIData] = useState<KPIResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [evaluating, setEvaluating] = useState(false);

  useEffect(() => {
    const fetchKPI = async () => {
      try {
        const report = await fetchSupplierKPIReport(supplierId);
        // Handle nested response structure with data.kpiScore and data.aiInsights
        let kpiResponse: KPIResponse | null = null;
        const reportData = report as { data?: { kpiScore?: KPIScore; aiInsights?: AIInsights }; kpiScore?: KPIScore };
        if (reportData?.data?.kpiScore) {
          kpiResponse = {
            kpiScore: reportData.data.kpiScore,
            aiInsights: reportData.data.aiInsights
          };
        } else if (reportData?.kpiScore) {
          kpiResponse = report as unknown as KPIResponse;
        }
        setKPIData(kpiResponse);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load KPI report');
      } finally {
        setLoading(false);
      }
    };

    if (supplierId) fetchKPI();
  }, [supplierId, fetchSupplierKPIReport]);

  const handleEvaluate = async () => {
    try {
      setEvaluating(true);
      const result = await evaluateSupplierKPI(supplierId);
      if (result) {
        // ProcurementContext already transforms data - convert to KPIResponse format
        const resultData = result as Partial<KPIScore> & { aiInsights?: AIInsights | null };
        const kpiResponse: KPIResponse = {
          kpiScore: {
            id: resultData?.id || '',
            supplierId: supplierId,
            buyerOrgId: resultData?.buyerOrgId || '',
            periodYear: resultData?.periodYear || new Date().getFullYear(),
            periodQuarter: resultData?.periodQuarter || 1,
            otdScore: resultData?.otdScore || 0,
            qualityScore: resultData?.qualityScore || 0,
            priceScore: resultData?.priceScore || 0,
            invoiceAccuracy: String(resultData?.invoiceAccuracy || 0),
            fulfillmentRate: String(resultData?.fulfillmentRate || 0),
            responseTimeScore: String(resultData?.responseTimeScore || 0),
            manualScore: resultData?.manualScore || (resultData as { score?: number })?.score || 0,
            tier: resultData?.tier || 'PENDING',
            poCount: resultData?.poCount || 0,
            disputeCount: resultData?.disputeCount || 0,
            reviewCompleted: resultData?.reviewCompleted || false,
            qbrHeldAt: resultData?.qbrHeldAt || null,
            improvementPlan: resultData?.improvementPlan || '',
            notes: resultData?.notes || '',
            calculatedAt: resultData?.calculatedAt || new Date().toISOString(),
            createdAt: resultData?.createdAt || new Date().toISOString(),
            updatedAt: resultData?.updatedAt || new Date().toISOString(),
          },
          aiInsights: resultData?.aiInsights || null
        };
        setKPIData(kpiResponse);
        notify('Đánh giá nhà cung cấp hoàn tất', 'success');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Lỗi khi đánh giá nhà cung cấp');
      notify('Lỗi khi đánh giá', 'error');
    } finally {
      setEvaluating(false);
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-[#FFFFFF] text-[#000000] p-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="flex flex-col items-center gap-4">
              <div className="w-12 h-12 border-4 border-[#B4533A] border-t-transparent rounded-full animate-spin"></div>
              <p className="text-[#000000] font-bold uppercase tracking-widest">Đang tải dữ liệu KPI...</p>
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#FFFFFF] text-[#000000] p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link 
            href={`/supplier`}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#FAF8F5] border border-[rgba(148,163,184,0.1)] text-[#000000] hover:text-[#000000] hover:bg-[#1A1D23] transition-all"
          >
            <ArrowLeft size={18} />
            <span className="text-sm font-semibold">Quay lại Portal</span>
          </Link>
          <div className="flex-1">
            <h1 className="text-2xl font-black text-[#000000] uppercase tracking-tight">Đánh Giá Hiệu Suất Nhà Cung Cấp</h1>
            <p className="text-sm text-[#000000] mt-1">Phân tích chi tiết KPI và xếp hạng nhà cung cấp</p>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-6 p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl text-black flex items-center gap-3">
            <AlertCircle size={20} />
            <span>{error}</span>
          </div>
        )}

        {!kpiData ? (
          <div className="bg-[#FAF8F5] rounded-2xl p-12 border border-[rgba(148,163,184,0.1)] text-center">
            <div className="inline-flex items-center justify-center h-20 w-20 rounded-full bg-[#B4533A]/10 mb-6">
              <BarChart3 size={40} className="text-[#B4533A]" />
            </div>
            <h2 className="text-xl font-bold text-[#000000] mb-3">Chưa có dữ liệu đánh giá</h2>
            <p className="text-[#000000] mb-6 max-w-md mx-auto">Nhà cung cấp này chưa được đánh giá KPI. Hãy chạy đánh giá để phân tích hiệu suất.</p>
            <button
              onClick={handleEvaluate}
              disabled={evaluating}
              className="flex items-center gap-2 mx-auto px-6 py-3 rounded-xl bg-[#B4533A] text-[#000000] font-bold hover:bg-[#A85032] disabled:opacity-50 transition-all"
            >
              {evaluating ? (
                <RefreshCcw size={18} className="animate-spin" />
              ) : (
                <TrendingUp size={18} />
              )}
              {evaluating ? 'Đang đánh giá...' : 'Chạy đánh giá KPI'}
            </button>
          </div>
        ) : (
          <>
            {/* Supplier Info Card */}
            <div className="bg-[#FAF8F5] rounded-2xl p-6 border border-[rgba(148,163,184,0.1)] mb-6">
              <div className="flex items-center gap-4 mb-4">
                <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-[#B4533A] to-[#8B5CF6] flex items-center justify-center">
                  <Award size={24} className="text-[#000000]" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-[#000000]">KPI Đánh Giá Nhà Cung Cấp</h2>
                  <p className="text-sm text-[#000000]">Đánh giá hiệu suất theo quý</p>
                </div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-[rgba(148,163,184,0.1)]">
                <div>
                  <p className="text-xs text-[#000000] uppercase tracking-wider mb-1">Kỳ đánh giá</p>
                  <p className="text-lg font-semibold text-[#000000]">Q{kpiData.kpiScore.periodQuarter}/{kpiData.kpiScore.periodYear}</p>
                </div>
                <div>
                  <p className="text-xs text-[#000000] uppercase tracking-wider mb-1">Ngày tính toán</p>
                  <p className="text-lg font-semibold text-[#000000]">{new Date(kpiData.kpiScore.calculatedAt).toLocaleDateString('vi-VN')}</p>
                </div>
                <div>
                  <p className="text-xs text-[#000000] uppercase tracking-wider mb-1">Số PO</p>
                  <p className="text-lg font-semibold text-[#000000]">{kpiData.kpiScore.poCount}</p>
                </div>
                <div>
                  <p className="text-xs text-[#000000] uppercase tracking-wider mb-1">Số khiếu nại</p>
                  <p className="text-lg font-semibold text-[#000000]">{kpiData.kpiScore.disputeCount}</p>
                </div>
              </div>
            </div>

            {/* Overall Score Card */}
            <div className="bg-[#FAF8F5] rounded-2xl p-8 border border-[rgba(148,163,184,0.1)] mb-6">
              <div className="text-center">
                <div className="inline-flex items-center gap-2 mb-4">
                  <Target size={18} className="text-[#000000]" />
                  <span className="text-sm font-black text-[#000000] uppercase tracking-widest">Điểm Hiệu Suất Tổng Thể</span>
                </div>
                
                <div className={`inline-flex items-center justify-center h-32 w-32 rounded-full bg-gradient-to-br ${tierColors[kpiData.kpiScore.tier as keyof typeof tierColors] || tierColors.PENDING} border-4 mb-4`}>
                  <span className="text-5xl font-black">{kpiData.aiInsights?.overallScore || kpiData.kpiScore.manualScore}</span>
                </div>
                
                <p className="text-sm text-[#000000] mb-4">Trên thang điểm 100</p>
                
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#FFFFFF] border border-[rgba(148,163,184,0.1)]">
                  <span className="text-sm text-[#000000]">Xếp hạng:</span>
                  <span className={`text-sm font-bold ${
                    tierColors[kpiData.kpiScore.tier as keyof typeof tierColors]?.split(' ').pop() || 'text-black'
                  }`}>
                    {tierLabels[kpiData.kpiScore.tier as keyof typeof tierLabels] || kpiData.kpiScore.tier}
                  </span>
                </div>
                
                {kpiData.aiInsights?.tierRecommendation && kpiData.kpiScore.tier !== kpiData.aiInsights?.tierRecommendation && (
                  <p className="text-xs text-[#000000] mt-3">
                    Đề xuất: <span className="text-black font-semibold">{tierLabels[kpiData.aiInsights.tierRecommendation as keyof typeof tierLabels] || kpiData.aiInsights.tierRecommendation}</span>
                  </p>
                )}
              </div>
            </div>

            {/* 6 KPI Metrics Grid */}
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-4">
                <BarChart3 size={18} className="text-[#000000]" />
                <h2 className="text-sm font-black text-[#000000] uppercase tracking-widest">6 Chỉ Số Hiệu Suất Chi Tiết</h2>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[
                  { key: 'otdScore', label: 'Giao hàng đúng hạn (OTD)', value: kpiData.kpiScore.otdScore, aiValue: kpiData.aiInsights?.otdScore },
                  { key: 'qualityScore', label: 'Chất lượng sản phẩm/dịch vụ', value: kpiData.kpiScore.qualityScore, aiValue: kpiData.aiInsights?.qualityScore },
                  { key: 'priceScore', label: 'Giá cả cạnh tranh', value: kpiData.kpiScore.priceScore, aiValue: kpiData.aiInsights?.priceScore },
                  { key: 'invoiceAccuracy', label: 'Chính xác hóa đơn', value: parseFloat(kpiData.kpiScore.invoiceAccuracy) || 0, isString: true },
                  { key: 'responseTimeScore', label: 'Thời gian phản hồi', value: parseFloat(kpiData.kpiScore.responseTimeScore) || 0, isString: true },
                  { key: 'fulfillmentRate', label: 'Tỷ lệ hoàn thành đơn hàng', value: parseFloat(kpiData.kpiScore.fulfillmentRate) || 0, isString: true },
                ].map((item, idx) => (
                  <div key={idx} className="bg-[#FAF8F5] rounded-xl p-4 border border-[rgba(148,163,184,0.1)] hover:border-[#B4533A]/30 transition-all">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        {metricIcons[item.key]}
                        <h3 className="font-semibold text-[#000000] text-sm">{item.label}</h3>
                      </div>
                    </div>
                    
                    <div className="w-full bg-[#FFFFFF] rounded-full h-2 mb-3 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          (item.value || 0) >= 90 ? 'bg-emerald-400' :
                          (item.value || 0) >= 70 ? 'bg-[#B4533A]' :
                          (item.value || 0) >= 50 ? 'bg-amber-400' :
                          'bg-rose-400'
                        }`}
                        style={{ width: `${Math.min(item.value || 0, 100)}%` }}
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-2xl font-bold text-[#000000]">{item.value}%</span>
                      <span className={`text-xs font-semibold px-2 py-1 rounded ${
                        (item.value || 0) >= 90 ? 'bg-emerald-400/10 text-black' :
                        (item.value || 0) >= 70 ? 'bg-[#B4533A]/10 text-[#B4533A]' :
                        (item.value || 0) >= 50 ? 'bg-amber-400/10 text-black' :
                        'bg-rose-400/10 text-black'
                      }`}>
                        {(item.value || 0) >= 90 ? 'Xuất sắc' :
                         (item.value || 0) >= 70 ? 'Tốt' :
                         (item.value || 0) >= 50 ? 'Trung bình' :
                         'Cần cải thiện'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* AI Analysis Section */}
            {kpiData.aiInsights && (
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-4">
                  <Zap size={18} className="text-black" />
                  <h2 className="text-sm font-black text-[#000000] uppercase tracking-widest">Phân Tích AI</h2>
                </div>
                
                <div className="bg-[#FAF8F5] rounded-2xl p-6 border border-[rgba(148,163,184,0.1)]">
                  <p className="text-[#000000] leading-relaxed mb-6">{kpiData.aiInsights.analysis}</p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Pros */}
                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <ThumbsUp size={16} className="text-black" />
                        <h3 className="text-sm font-bold text-[#000000]">Ưu điểm</h3>
                      </div>
                      <ul className="space-y-2">
                        {kpiData.aiInsights.pros?.map((pro, idx) => (
                          <li key={idx} className="flex items-start gap-2 text-sm text-[#000000]">
                            <CheckCircle size={14} className="text-black mt-0.5 flex-shrink-0" />
                            <span>{pro}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    
                    {/* Cons */}
                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <ThumbsDown size={16} className="text-black" />
                        <h3 className="text-sm font-bold text-[#000000]">Điểm cần cải thiện</h3>
                      </div>
                      <ul className="space-y-2">
                        {kpiData.aiInsights.cons?.map((con, idx) => (
                          <li key={idx} className="flex items-start gap-2 text-sm text-[#000000]">
                            <AlertCircle size={14} className="text-black mt-0.5 flex-shrink-0" />
                            <span>{con}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Improvement Plan */}
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-4">
                <Lightbulb size={18} className="text-black" />
                <h2 className="text-sm font-black text-[#000000] uppercase tracking-widest">Kế Hoạch Cải Thiện</h2>
              </div>
              
              <div className="bg-[#FAF8F5] rounded-2xl p-6 border border-[rgba(148,163,184,0.1)]">
                <p className="text-[#000000] leading-relaxed">{kpiData.aiInsights?.improvementPlan || kpiData.kpiScore.improvementPlan}</p>
              </div>
            </div>

            {/* Notes */}
            {kpiData.kpiScore.notes && (
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-4">
                  <FileText size={18} className="text-black" />
                  <h2 className="text-sm font-black text-[#000000] uppercase tracking-widest">Ghi Chú Đánh Giá</h2>
                </div>
                
                <div className="bg-[#FAF8F5] rounded-2xl p-6 border border-[rgba(148,163,184,0.1)]">
                  <p className="text-[#000000] leading-relaxed">{kpiData.kpiScore.notes}</p>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-4">
              <button
                onClick={handleEvaluate}
                disabled={evaluating}
                className="flex items-center gap-2 px-6 py-3 rounded-xl bg-rose-500/10 text-black font-bold hover:bg-rose-500/20 disabled:opacity-50 transition-all border border-rose-500/20"
              >
                {evaluating ? (
                  <RefreshCcw size={18} className="animate-spin" />
                ) : (
                  <RefreshCcw size={18} />
                )}
                {evaluating ? 'Đang đánh giá lại...' : 'Đánh giá lại'}
              </button>
              
              <Link
                href={`/procurement/suppliers/${supplierId}`}
                className="flex items-center gap-2 px-6 py-3 rounded-xl bg-[#FAF8F5] text-[#000000] font-bold hover:bg-[#1A1D23] hover:text-[#000000] transition-all border border-[rgba(148,163,184,0.1)]"
              >
                <Award size={18} />
                Xem hồ sơ NCC
              </Link>
            </div>
          </>
        )}
      </div>
    </main>
  );
}
