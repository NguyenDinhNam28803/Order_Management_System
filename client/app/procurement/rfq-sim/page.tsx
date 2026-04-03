"use client";

import React, { useState, useMemo } from "react";

// 1. Khởi tạo Mock Data
const mockProducts = [
    { id: "p1", name: "Máy chủ Dell PowerEdge R650", category: "Hardware" },
    { id: "p2", name: "Bản quyền Windows Server 2022", category: "Software" },
    { id: "p3", name: "Switch Cisco Catalyst 9200L", category: "Networking" },
    { id: "p4", name: "Màn hình Samsung Odyssey G7 27\"", category: "Peripherals" },
];

const mockSuppliers = [
    { id: "s1", name: "TNHH Giải pháp Công nghệ Việt" },
    { id: "s2", name: "Phong Vũ B2B" },
    { id: "s3", name: "GearVN For Business" },
    { id: "s4", name: "Hải Anh Computer" },
    { id: "s5", name: "An Phát Tech Solutions" },
    { id: "s6", name: "Thế giới Di động Pro" },
];

// Định nghĩa kiểu dữ liệu cho RFQ
interface RFQEntry {
    id: string;
    productName: string;
    suggestedSuppliers: string[];
    price?: number;
    status: 'Pending_Supplier' | 'Quoted' | 'Completed';
    createdAt: string;
}

export default function RFQClosedLoopSimulation() {
    // Global State for simulation
    const [rfqList, setRfqList] = useState<RFQEntry[]>([]);
    const [currentRole, setCurrentRole] = useState<'PO' | 'SUPPLIER'>('PO');
    const [selectedProduct, setSelectedProduct] = useState<typeof mockProducts[0] | null>(null);

    // Switch Role Utility
    const toggleRole = () => setCurrentRole(prev => prev === 'PO' ? 'SUPPLIER' : 'PO');

    // --- LOGIC CHO ROLE PO ---

    // 2. PO: Tạo RFQ & AI Suggestion
    const handleCreateRFQ = (product: typeof mockProducts[0]) => {
        setSelectedProduct(product);
    };

    const confirmSendRFQ = () => {
        if (!selectedProduct) return;
        
        // AI Suggestion Logic: Lấy ngẫu nhiên 3 NCC
        const shuffled = [...mockSuppliers].sort(() => 0.5 - Math.random());
        const chosenSuppliers = shuffled.slice(0, 3).map(s => s.name);

        const newRFQ: RFQEntry = {
            id: `RFQ-${Date.now()}`,
            productName: selectedProduct.name,
            suggestedSuppliers: chosenSuppliers,
            status: 'Pending_Supplier',
            createdAt: new Date().toLocaleTimeString()
        };

        setRfqList(prev => [newRFQ, ...prev]);
        setSelectedProduct(null);
        alert(`Đã gửi RFQ cho các nhà cung cấp: ${chosenSuppliers.join(", ")}`);
    };

    // 4. PO: Duyệt & Gửi Requester
    const handleApproveRFQ = (id: string) => {
        setRfqList(prev => prev.map(r => 
            r.id === id ? { ...r, status: 'Completed' } : r
        ));
        alert("Đã duyệt báo giá và chuyển dữ liệu về cho Requester!");
    };

    // --- LOGIC CHO ROLE SUPPLIER ---

    // 3. Supplier: Báo giá
    const [tempPrice, setTempPrice] = useState<Record<string, number>>({});

    const handleSupplierSubmitPrice = (id: string) => {
        const priceValue = tempPrice[id];
        if (!priceValue || priceValue <= 0) {
            alert("Vui lòng nhập đơn giá hợp lệ");
            return;
        }

        setRfqList(prev => prev.map(r => 
            r.id === id ? { ...r, price: priceValue, status: 'Quoted' } : r
        ));
        alert("Đã phản hồi báo giá thành công!");
    };

    return (
        <div style={{ padding: '40px', maxWidth: '1000px', margin: '0 auto', fontFamily: 'system-ui, sans-serif' }}>
            
            {/* Header & Role Switcher */}
            <div style={{ display: 'flex', justifyBetween: 'space-between', alignItems: 'center', marginBottom: '40px', backgroundColor: '#f8fafc', padding: '20px', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
                <div>
                    <h1 style={{ margin: 0, fontSize: '24px', fontWeight: 'bold', color: '#1e293b' }}>Chu trình RFQ Khép kín (Simulation)</h1>
                    <p style={{ margin: '5px 0 0 0', fontSize: '14px', color: '#64748b' }}>Đang quản trị với vai trò: <strong style={{ color: currentRole === 'PO' ? '#2563eb' : '#059669' }}>{currentRole}</strong></p>
                </div>
                <button 
                    onClick={toggleRole}
                    style={{ backgroundColor: '#1e293b', color: 'white', border: 'none', padding: '12px 24px', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer', transition: 'all 0.2s' }}
                >
                    🔄 Switch to {currentRole === 'PO' ? 'SUPPLIER' : 'PO'}
                </button>
            </div>

            {/* --- GIAO DIỆN ROLE PO (TẠO & DUYỆT) --- */}
            {currentRole === 'PO' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '40px' }}>
                    
                    {/* Danh sách Sản phẩm chờ mua */}
                    <section>
                        <h2 style={{ fontSize: '18px', marginBottom: '15px' }}>Step 1: Danh sách sản phẩm chờ khởi tạo RFQ</h2>
                        <table style={{ width: '100%', borderCollapse: 'collapse', backgroundColor: 'white', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}>
                            <thead style={{ backgroundColor: '#f1f5f9' }}>
                                <tr>
                                    <th style={{ padding: '15px', textAlign: 'left', fontSize: '13px', color: '#475569' }}>Tên mặt hàng</th>
                                    <th style={{ padding: '15px', textAlign: 'left', fontSize: '13px', color: '#475569' }}>Phân loại</th>
                                    <th style={{ padding: '15px', textAlign: 'right', fontSize: '13px', color: '#475569' }}>Hành động</th>
                                </tr>
                            </thead>
                            <tbody>
                                {mockProducts.map(p => (
                                    <tr key={p.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                        <td style={{ padding: '15px', fontWeight: 'bold' }}>{p.name}</td>
                                        <td style={{ padding: '15px', color: '#64748b' }}>{p.category}</td>
                                        <td style={{ padding: '15px', textAlign: 'right' }}>
                                            <button 
                                                onClick={() => handleCreateRFQ(p)}
                                                style={{ backgroundColor: '#2563eb', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontWeight: '500' }}
                                            >
                                                Tạo RFQ
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </section>

                    {/* Danh sách RFQ chờ Duyệt (NCC đã báo giá) */}
                    <section>
                        <h2 style={{ fontSize: '18px', marginBottom: '15px', color: '#0f172a' }}>Step 3: Phê duyệt báo giá (Quoted)</h2>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                            {rfqList.filter(r => r.status === 'Quoted').length === 0 ? (
                                <p style={{ textAlign: 'center', padding: '40px', backgroundColor: '#f8fafc', borderRadius: '12px', color: '#94a3b8', fontStyle: 'italic' }}>Chưa có báo giá nào từ NCC cần duyệt.</p>
                            ) : (
                                rfqList.filter(r => r.status === 'Quoted').map(r => (
                                    <div key={r.id} style={{ padding: '20px', backgroundColor: 'white', border: '1px solid #e2e8f0', borderRadius: '16px', display: 'flex', justifyBetween: 'space-between', alignItems: 'center' }}>
                                        <div>
                                            <div style={{ fontSize: '16px', fontWeight: 'bold' }}>{r.productName}</div>
                                            <div style={{ fontSize: '12px', color: '#64748b' }}>Đơn giá phản hồi: <strong style={{ color: '#059669', fontSize: '16px' }}>{r.price?.toLocaleString()} VNĐ</strong></div>
                                        </div>
                                        <button 
                                            onClick={() => handleApproveRFQ(r.id)}
                                            style={{ backgroundColor: '#059669', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer' }}
                                        >
                                            Phê duyệt & Gửi Requester
                                        </button>
                                    </div>
                                ))
                            )}
                        </div>
                    </section>
                </div>
            )}

            {/* --- GIAO DIỆN ROLE SUPPLIER (BÁO GIÁ) --- */}
            {currentRole === 'SUPPLIER' && (
                <section>
                    <h2 style={{ fontSize: '18px', marginBottom: '15px' }}>Step 2: Nhà cung cấp báo giá (Pending Supplier)</h2>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        {rfqList.filter(r => r.status === 'Pending_Supplier').length === 0 ? (
                            <p style={{ textAlign: 'center', padding: '40px', backgroundColor: '#f8fafc', borderRadius: '12px', color: '#94a3b8', fontStyle: 'italic' }}>Không có yêu cầu báo giá nào đang chờ.</p>
                        ) : (
                            rfqList.filter(r => r.status === 'Pending_Supplier').map(r => (
                                <div key={r.id} style={{ padding: '20px', backgroundColor: 'white', border: '1px solid #e2e8f0', borderRadius: '16px', borderLeft: '4px solid #f59e0b' }}>
                                    <div style={{ marginBottom: '15px' }}>
                                        <div style={{ fontSize: '16px', fontWeight: 'bold' }}>{r.productName}</div>
                                        <div style={{ fontSize: '11px', color: '#64748b' }}>Từ: PO Procurement | 3 NCC được phân tích bởi AI: <strong>{r.suggestedSuppliers.join(", ")}</strong></div>
                                    </div>
                                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                                        <input 
                                            type="number" 
                                            placeholder="Nhập đơn giá (VNĐ)" 
                                            style={{ flex: 1, padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                                            onChange={(e) => setTempPrice({ ...tempPrice, [r.id]: Number(e.target.value) })}
                                        />
                                        <button 
                                            onClick={() => handleSupplierSubmitPrice(r.id)}
                                            style={{ backgroundColor: '#f59e0b', color: 'white', border: 'none', padding: '12px 24px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}
                                        >
                                            Xác nhận Báo giá
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </section>
            )}

            {/* --- MODAL PO: AI SUGGESTION --- */}
            {selectedProduct && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyCenter: 'center', zIndex: 100 }}>
                    <div style={{ backgroundColor: 'white', padding: '30px', borderRadius: '24px', maxWidth: '500px', width: '90%' }}>
                        <h3 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '10px' }}>Khởi tạo RFQ nhanh</h3>
                        <p style={{ color: '#64748b', fontSize: '14px', marginBottom: '20px' }}>Sản phẩm: <strong>{selectedProduct.name}</strong></p>
                        
                        <div style={{ backgroundColor: '#f0f9ff', padding: '20px', borderRadius: '16px', border: '1px solid #bae6fd', marginBottom: '25px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                                <span style={{ fontSize: '18px' }}>🤖</span>
                                <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#0369a1', textTransform: 'uppercase', letterSpacing: '0.05em' }}>AI Solution Analysis</span>
                            </div>
                            <p style={{ fontSize: '13px', color: '#0c4a6e', marginBottom: '10px' }}>Dựa trên lịch sử đấu thầu, AI đề xuất 3 nhà cung cấp có tỷ lệ hoàn thành tốt nhất:</p>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                {[1,2,3].map(i => (
                                    <span key={i} style={{ backgroundColor: 'white', padding: '5px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: '600', color: '#0369a1', border: '1px solid #7dd3fc' }}>
                                        NCC Gợi ý #{i}
                                    </span>
                                ))}
                            </div>
                        </div>

                        <div style={{ display: 'flex', gap: '10px' }}>
                            <button 
                                onClick={confirmSendRFQ}
                                style={{ flex: 2, backgroundColor: '#2563eb', color: 'white', border: 'none', padding: '14px', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer' }}
                            >
                                Gửi RFQ đồng loạt
                            </button>
                            <button 
                                onClick={() => setSelectedProduct(null)}
                                style={{ flex: 1, backgroundColor: '#f1f5f9', color: '#475569', border: 'none', padding: '14px', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer' }}
                            >
                                Hủy
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* --- DANH SÁCH HOÀN TẤT --- */}
            <section style={{ marginTop: '60px', opacity: 0.6 }}>
                <h2 style={{ fontSize: '14px', fontWeight: 'black', textTransform: 'uppercase', color: '#94a3b8', letterSpacing: '0.1em' }}>Lịch sử chu kỳ hoàn tất (Completed)</h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '15px' }}>
                    {rfqList.filter(r => r.status === 'Completed').map(r => (
                        <div key={r.id} style={{ padding: '12px 20px', backgroundColor: '#f8fafc', borderRadius: '8px', fontSize: '13px', display: 'flex', justifyBetween: 'space-between' }}>
                            <span>✅ {r.productName} - <strong>{r.price?.toLocaleString()} VNĐ</strong></span>
                            <span style={{ color: '#94a3b8' }}>{r.createdAt}</span>
                        </div>
                    ))}
                </div>
            </section>
        </div>
    );
}
