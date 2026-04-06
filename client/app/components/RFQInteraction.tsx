"use client";

import React, { useState, useEffect, useMemo } from "react";

// 1. Khởi tạo Mock Data
const mockRequest = {
    itemName: "Màn hình Dell UltraSharp 27 inch (U2723QE)",
    quantity: 10,
    unit: "Cái",
    department: "Phòng IT - Chi nhánh HCM"
};

const mockSuppliers = [
    { id: 1, name: "Công ty TNHH Tin học Trần Anh", rating: 4.8, mockPrice: 12500000 },
    { id: 2, name: "Phong Vũ Computer", rating: 4.9, mockPrice: 12800000 },
    { id: 3, name: " GearVN", rating: 4.5, mockPrice: 12200000 },
    { id: 4, name: "Hải Anh Computer", rating: 4.7, mockPrice: 12400000 },
    { id: 5, name: "An Phát PC", rating: 4.2, mockPrice: 12100000 },
    { id: 6, name: "Thế giới Di động (B2B)", rating: 4.6, mockPrice: 13000000 },
];

export default function RFQInteraction() {
    // 2. Quản lý Trạng thái (State Management)
    const [step, setStep] = useState(1);
    
    // Lọc Top 3 NCC có rating cao nhất (Step 1)
    const top3Suppliers = useMemo(() => {
        return [...mockSuppliers]
            .sort((a, b) => b.rating - a.rating)
            .slice(0, 3);
    }, []);

    // Tìm NCC có giá thấp nhất (Step 3)
    const bestPriceSupplierId = useMemo(() => {
        if (step < 3) return null;
        let minPrice = Infinity;
        let minId = null;
        top3Suppliers.forEach(s => {
            if (s.mockPrice < minPrice) {
                minPrice = s.mockPrice;
                minId = s.id;
            }
        });
        return minId;
    }, [step, top3Suppliers]);

    // 3. Logic chuyển bước tự động (Step 2 -> Step 3)
    useEffect(() => {
        if (step === 2) {
            const timer = setTimeout(() => {
                setStep(3);
            }, 2000); // Chờ 2 giây mô phỏng
            return () => clearTimeout(timer);
        }
    }, [step]);

    return (
        <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto', fontFamily: 'sans-serif', border: '1px solid #eee', borderRadius: '12px', background: '#fff' }}>
            
            {/* Header chung */}
            <div style={{ borderBottom: '2px solid #f0f0f0', paddingBottom: '15px', marginBottom: '20px' }}>
                <h2 style={{ margin: '0 0 10px 0', color: '#1a1a1a' }}>Nghiệp vụ Xử lý Báo giá (RFQ)</h2>
                <div style={{ fontSize: '14px', color: '#666' }}>
                    <strong>Mặt hàng:</strong> {mockRequest.itemName} | 
                    <strong> Số lượng:</strong> {mockRequest.quantity} {mockRequest.unit}
                </div>
            </div>

            {/* Bước 1: Xem & Chọn Top 3 NCC */}
            {step === 1 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <h3 style={{ fontSize: '16px', color: '#333' }}>Bước 1: Lọc Top 3 Nhà cung cấp ưu tú nhất (dựa trên Rating)</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '15px' }}>
                        {top3Suppliers.map(s => (
                            <div key={s.id} style={{ border: '1px solid #e0e0e0', padding: '15px', borderRadius: '8px', textAlign: 'center' }}>
                                <div style={{ fontWeight: 'bold', marginBottom: '8px' }}>{s.name}</div>
                                <div style={{ color: '#f39c12', fontSize: '14px' }}>⭐ {s.rating} / 5.0</div>
                            </div>
                        ))}
                    </div>
                    <button 
                        onClick={() => setStep(2)}
                        style={{ padding: '12px 25px', background: '#0056b3', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', alignSelf: 'flex-end', color: '#fff' }}
                    >
                        Gửi yêu cầu báo giá (RFQ) cho Top 3 &rarr;
                    </button>
                </div>
            )}

            {/* Bước 2: Mô phỏng chờ phản hồi */}
            {step === 2 && (
                <div style={{ padding: '50px 0', textAlign: 'center' }}>
                    <div style={{ marginBottom: '20px', fontSize: '18px', fontWeight: 'bold', color: '#0056b3' }}>
                        Đang chờ các nhà cung cấp phản hồi giá...
                    </div>
                    <div className="spinner" style={{ border: '4px solid #f3f3f3', borderTop: '4px solid #0056b3', borderRadius: '50%', width: '30px', height: '30px', animation: 'spin 1s linear infinite', margin: '0 auto' }}></div>
                    <style>{`
                        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
                    `}</style>
                </div>
            )}

            {/* Bước 3: So sánh & Chốt giá tốt nhất */}
            {step === 3 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <h3 style={{ fontSize: '16px', color: '#333' }}>Bước 3: So sánh Báo giá & Chốt mức giá tốt nhất</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '15px' }}>
                        {top3Suppliers.map(s => {
                            const isBestPrice = s.id === bestPriceSupplierId;
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
                                            GIÁ TỐT NHẤT
                                        </div>
                                    )}
                                    <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>{s.name}</div>
                                    <div style={{ color: '#666', fontSize: '12px', marginBottom: '10px' }}>Rating: {s.rating}</div>
                                    <div style={{ fontSize: '18px', fontWeight: '800', color: isBestPrice ? '#27ae60' : '#333' }}>
                                        {s.mockPrice.toLocaleString('vi-VN')} VNĐ
                                    </div>
                                    
                                    {isBestPrice && (
                                        <button 
                                            onClick={() => setStep(4)}
                                            style={{ marginTop: '15px', padding: '8px 15px', background: '#27ae60', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' }}
                                        >
                                            Chốt giá này & Gửi Requester
                                        </button>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Bước 4: Hoàn tất */}
            {step === 4 && (
                <div style={{ padding: '40px', textAlign: 'center', backgroundColor: '#f0fff4', borderRadius: '8px', border: '1px solid #c6f6d5' }}>
                    <div style={{ fontSize: '48px', marginBottom: '15px' }}>✅</div>
                    <h3 style={{ color: '#27ae60', margin: '0 0 10px 0' }}>Hoàn tất quy trình RFQ</h3>
                    <p style={{ color: '#2f553a', fontSize: '14px', margin: '0' }}>
                        Đã chốt giá thành công và trả kết quả về cho Requester để tiến hành tạo PR.
                    </p>
                    <button 
                        onClick={() => setStep(1)}
                        style={{ marginTop: '20px', background: 'transparent', border: '1px solid #27ae60', color: '#27ae60', padding: '5px 15px', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}
                    >
                        Quay lại từ đầu
                    </button>
                </div>
            )}
        </div>
    );
}
