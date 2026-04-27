"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useProcurement, RFQ, Quotation, Organization } from "@/app/context/ProcurementContext";
import { Loader2, Star, TrendingDown, Award, CheckCircle2, Building2 } from "lucide-react";

interface RFQInteractionProps {
    rfqId: string;
}

interface SupplierWithQuote {
    id: string;
    name: string;
    rating: number;
    quotePrice: number;
    quotationId: string;
    aiScore?: number;
}

export default function RFQInteraction({ rfqId }: RFQInteractionProps) {
    // API Hooks
    const {
        fetchRFQById,
        fetchQuotationsByRfq,
        fetchSuppliersByRFQ,
        inviteSuppliersToRFQ,
        awardQuotation,
        analyzeQuotationWithAI,
        organizations,
        notify
    } = useProcurement();

    // State Management
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [rfq, setRfq] = useState<RFQ | null>(null);
    const [quotations, setQuotations] = useState<Quotation[]>([]);
    const [suppliers, setSuppliers] = useState<Organization[]>([]);
    const [selectedSuppliers, setSelectedSuppliers] = useState<string[]>([]);
    const [awarding, setAwarding] = useState(false);
    const [analyzing, setAnalyzing] = useState(false);

    // Fetch RFQ Data
    const loadRFQData = useCallback(async () => {
        if (!rfqId) return;
        setLoading(true);
        try {
            const rfqData = await fetchRFQById(rfqId);
            setRfq(rfqData);
            
            // Fetch suppliers for this RFQ
            const suppliersData = await fetchSuppliersByRFQ(rfqId);
            setSuppliers(suppliersData || []);
            
            // Fetch quotations
            const quotesData = await fetchQuotationsByRfq(rfqId);
            setQuotations(quotesData || []);
        } catch (error) {
            console.error("Error loading RFQ data:", error);
            notify("Lỗi khi tải dữ liệu RFQ", "error");
        } finally {
            setLoading(false);
        }
    }, [rfqId, fetchRFQById, fetchSuppliersByRFQ, fetchQuotationsByRfq, notify]);

    useEffect(() => {
        loadRFQData();
    }, [loadRFQData]);

    // Auto-transition Step 2 -> Step 3 when quotations received
    useEffect(() => {
        if (step === 2 && quotations.length > 0) {
            setStep(3);
        }
    }, [step, quotations]);

    // Filter Top 3 Suppliers by Rating (Step 1)
    const top3Suppliers = useMemo(() => {
        return [...suppliers]
            .sort((a, b) => (b.trustScore || 0) - (a.trustScore || 0))
            .slice(0, 3);
    }, [suppliers]);

    // Map quotations to suppliers for display
    const supplierQuotes: SupplierWithQuote[] = useMemo(() => {
        return top3Suppliers.map(supplier => {
            const quotation = quotations.find(q => q.supplierId === supplier.id);
            return {
                id: supplier.id,
                name: supplier.name,
                rating: supplier.trustScore || 0,
                quotePrice: quotation?.totalPrice || 0,
                quotationId: quotation?.id || "",
                aiScore: quotation?.aiScore
            };
        });
    }, [top3Suppliers, quotations]);

    // Find best price supplier (only among those with an actual quote)
    const bestPriceSupplier = useMemo(() => {
        const withPrice = supplierQuotes.filter(s => s.quotePrice > 0);
        if (withPrice.length === 0) return null;
        return withPrice.reduce((min, current) => current.quotePrice < min.quotePrice ? current : min);
    }, [supplierQuotes]);

    // Handle invite suppliers (Step 1 -> Step 2)
    const handleInviteSuppliers = async () => {
        if (selectedSuppliers.length === 0) {
            notify("Vui lòng chọn ít nhất 1 nhà cung cấp", "warning");
            return;
        }
        try {
            await inviteSuppliersToRFQ(rfqId, selectedSuppliers);
            notify("Đã gửi yêu cầu báo giá thành công", "success");
        } catch {
            // continue even if invite call fails
        }
        setStep(2);
        // Poll for quotations every 3 seconds
        const interval = setInterval(async () => {
            const quotes = await fetchQuotationsByRfq(rfqId);
            setQuotations(quotes || []);
            if (quotes && quotes.length > 0) {
                clearInterval(interval);
            }
        }, 3000);
        // Stop polling after 30 seconds
        setTimeout(() => clearInterval(interval), 30000);
    };

    // Handle AI Analysis
    const handleAnalyzeQuotations = async () => {
        setAnalyzing(true);
        try {
            for (const quote of quotations) {
                if (!quote.aiScore) {
                    await analyzeQuotationWithAI(quote.id);
                }
            }
            // Refresh quotations with AI scores
            const updatedQuotes = await fetchQuotationsByRfq(rfqId);
            setQuotations(updatedQuotes || []);
            notify("Phân tích AI hoàn tất", "success");
        } catch (error) {
            notify("Lỗi phân tích AI", "error");
        } finally {
            setAnalyzing(false);
        }
    };

    // Handle award
    const handleAward = async (quotationId: string) => {
        setAwarding(true);
        try {
            const success = await awardQuotation(rfqId, quotationId);
            if (success) {
                notify("Đã chọn nhà cung cấp thành công", "success");
                setStep(4);
            }
        } catch (error) {
            notify("Lỗi khi chọn nhà cung cấp", "error");
        } finally {
            setAwarding(false);
        }
    };

    if (loading) {
        return (
            <div style={{ padding: '40px', textAlign: 'center' }}>
                <Loader2 className="animate-spin" style={{ margin: '0 auto', width: 32, height: 32 }} />
                <p>Đang tải dữ liệu RFQ...</p>
            </div>
        );
    }

    return (
        <div style={{ padding: '20px', maxWidth: '900px', margin: '0 auto', fontFamily: 'sans-serif', border: '1px solid #eee', borderRadius: '12px', background: '#fff' }}>
            
            {/* Header */}
            <div style={{ borderBottom: '2px solid #f0f0f0', paddingBottom: '15px', marginBottom: '20px' }}>
                <h2 style={{ margin: '0 0 10px 0', color: '#1a1a1a' }}>Nghiệp vụ Xử lý Báo giá (RFQ)</h2>
                {rfq && (
                    <div style={{ fontSize: '14px', color: '#666' }}>
                        <strong>RFQ:</strong> ******** | 
                        <strong> Trạng thái:</strong> {rfq.status}
                    </div>
                )}
            </div>

            {/* Step 1: Select Top 3 Suppliers */}
            {step === 1 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <h3 style={{ fontSize: '16px', color: '#333' }}>
                        <Building2 size={18} style={{ display: 'inline', marginRight: '8px' }} />
                        Bước 1: Chọn Top Nhà cung cấp ưu tú (dựa trên Trust Score)
                    </h3>
                    
                    {suppliers.length === 0 ? (
                        <div style={{ padding: '20px', textAlign: 'center', color: '#666' }}>
                            Không có nhà cung cấp nào được gắn với RFQ này.
                        </div>
                    ) : (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '15px' }}>
                            {suppliers
                                .sort((a, b) => (b.trustScore || 0) - (a.trustScore || 0))
                                .map(s => (
                                <div 
                                    key={s.id} 
                                    onClick={() => {
                                        if (selectedSuppliers.includes(s.id)) {
                                            setSelectedSuppliers(prev => prev.filter(id => id !== s.id));
                                        } else if (selectedSuppliers.length < 3) {
                                            setSelectedSuppliers(prev => [...prev, s.id]);
                                        }
                                    }}
                                    style={{ 
                                        border: selectedSuppliers.includes(s.id) ? '2px solid #0056b3' : '1px solid #e0e0e0', 
                                        padding: '15px', 
                                        borderRadius: '8px', 
                                        textAlign: 'center',
                                        backgroundColor: selectedSuppliers.includes(s.id) ? '#f0f7ff' : '#fff',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s'
                                    }}
                                >
                                    <div style={{ fontWeight: 'bold', marginBottom: '8px' }}>{s.name}</div>
                                    <div style={{ color: '#f39c12', fontSize: '14px' }}>
                                        <Star size={14} style={{ display: 'inline' }} /> 
                                        {s.trustScore || 0} / 5.0
                                    </div>
                                    {selectedSuppliers.includes(s.id) && (
                                        <div style={{ marginTop: '8px', color: '#0056b3', fontSize: '12px', fontWeight: 'bold' }}>
                                            <CheckCircle2 size={14} style={{ display: 'inline' }} /> Đã chọn
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                    
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '14px', color: '#666' }}>
                            Đã chọn: {selectedSuppliers.length}/3 nhà cung cấp
                        </span>
                        <button 
                            onClick={handleInviteSuppliers}
                            disabled={selectedSuppliers.length === 0}
                            style={{ 
                                padding: '12px 25px', 
                                background: selectedSuppliers.length > 0 ? '#0056b3' : '#ccc', 
                                border: 'none', 
                                borderRadius: '6px', 
                                cursor: selectedSuppliers.length > 0 ? 'pointer' : 'not-allowed', 
                                fontWeight: 'bold', 
                                color: '#fff'
                            }}
                        >
                            Gửi RFQ cho {selectedSuppliers.length} NCC đã chọn &rarr;
                        </button>
                    </div>
                </div>
            )}

            {/* Step 2: Waiting for quotations */}
            {step === 2 && (
                <div style={{ padding: '50px 0', textAlign: 'center' }}>
                    <div style={{ marginBottom: '20px', fontSize: '18px', fontWeight: 'bold', color: '#0056b3' }}>
                        Đang chờ các nhà cung cấp phản hồi báo giá...
                    </div>
                    <Loader2 className="animate-spin" style={{ margin: '0 auto', width: 40, height: 40, color: '#0056b3' }} />
                    <p style={{ marginTop: '20px', color: '#666' }}>
                        Đã gửi RFQ đến {selectedSuppliers.length} nhà cung cấp.
                        <br />Hệ thống tự động kiểm tra phản hồi mỗi 3 giây.
                    </p>
                </div>
            )}

            {/* Step 3: Compare & Award */}
            {step === 3 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <h3 style={{ fontSize: '16px', color: '#333', margin: 0 }}>
                            <TrendingDown size={18} style={{ display: 'inline', marginRight: '8px' }} />
                            Bước 3: So sánh Báo giá & Chốt nhà cung cấp
                        </h3>
                        <button
                            onClick={handleAnalyzeQuotations}
                            disabled={analyzing || quotations.length === 0}
                            style={{
                                padding: '8px 16px',
                                background: analyzing ? '#ccc' : '#805ad5',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: analyzing ? 'not-allowed' : 'pointer',
                                color: '#fff',
                                fontSize: '12px'
                            }}
                        >
                            {analyzing ? 'Đang phân tích...' : 'Phân tích AI'}
                        </button>
                    </div>

                    {quotations.length === 0 ? (
                        <div style={{ padding: '20px', textAlign: 'center', color: '#666' }}>
                            Chưa nhận được báo giá nào. Vui lòng đợi thêm...
                        </div>
                    ) : (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '15px' }}>
                            {supplierQuotes.filter(s => s.quotePrice > 0).map(s => {
                                const isBestPrice = bestPriceSupplier?.id === s.id;
                                return (
                                    <div 
                                        key={s.id} 
                                        style={{ 
                                            border: isBestPrice ? '2px solid #27ae60' : '1px solid #e0e0e0', 
                                            padding: '15px', 
                                            borderRadius: '8px', 
                                            textAlign: 'center',
                                            backgroundColor: isBestPrice ? '#f0fff4' : '#fff',
                                            position: 'relative'
                                        }}
                                    >
                                        {isBestPrice && (
                                            <div style={{ position: 'absolute', top: '-10px', left: '50%', transform: 'translateX(-50%)', background: '#27ae60', color: '#fff', fontSize: '10px', padding: '2px 10px', borderRadius: '10px', fontWeight: 'bold' }}>
                                                <Award size={10} style={{ display: 'inline' }} /> GIÁ TỐT NHẤT
                                            </div>
                                        )}
                                        <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>{s.name}</div>
                                        <div style={{ color: '#666', fontSize: '12px', marginBottom: '10px' }}>
                                            <Star size={12} style={{ display: 'inline' }} /> {s.rating.toFixed(1)}
                                        </div>
                                        {s.aiScore && (
                                            <div style={{ fontSize: '12px', color: '#805ad5', marginBottom: '8px' }}>
                                                AI Score: {s.aiScore}/100
                                            </div>
                                        )}
                                        <div style={{ fontSize: '20px', fontWeight: '800', color: isBestPrice ? '#27ae60' : '#333' }}>
                                            {s.quotePrice.toLocaleString('vi-VN')} VNĐ
                                        </div>
                                        
                                        {isBestPrice && (
                                            <button 
                                                onClick={() => handleAward(s.quotationId)}
                                                disabled={awarding}
                                                style={{ 
                                                    marginTop: '15px', 
                                                    padding: '10px 20px', 
                                                    background: awarding ? '#ccc' : '#27ae60', 
                                                    color: '#fff', 
                                                    border: 'none', 
                                                    borderRadius: '4px', 
                                                    cursor: awarding ? 'not-allowed' : 'pointer', 
                                                    fontSize: '12px', 
                                                    fontWeight: 'bold'
                                                }}
                                            >
                                                {awarding ? 'Đang xử lý...' : 'Chọn NCC này'}
                                            </button>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            )}

            {/* Step 4: Complete */}
            {step === 4 && (
                <div style={{ padding: '40px', textAlign: 'center', backgroundColor: '#f0fff4', borderRadius: '8px', border: '1px solid #c6f6d5' }}>
                    <div style={{ fontSize: '48px', marginBottom: '15px' }}>✅</div>
                    <h3 style={{ color: '#27ae60', margin: '0 0 10px 0' }}>Hoàn tất quy trình RFQ</h3>
                    <p style={{ color: '#2f553a', fontSize: '14px', margin: '0' }}>
                        Đã chọn nhà cung cấp <strong>{bestPriceSupplier?.name}</strong> với giá {bestPriceSupplier?.quotePrice.toLocaleString('vi-VN')} VNĐ.
                        <br />Kết quả đã được gửi về cho Requester.
                    </p>
                    <button 
                        onClick={() => {
                            setStep(1);
                            setSelectedSuppliers([]);
                            loadRFQData();
                        }}
                        style={{ marginTop: '20px', background: 'transparent', border: '1px solid #27ae60', color: '#27ae60', padding: '8px 20px', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}
                    >
                        Làm RFQ khác
                    </button>
                </div>
            )}
        </div>
    );
}

