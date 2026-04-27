"use client";

import React, { useState } from "react";

interface AuditLogDetailModalProps {
    data: any;
    onClose: () => void;
}

export const AuditLogDetailModal: React.FC<AuditLogDetailModalProps> = ({ data, onClose }) => {
    const renderContent = () => {
        // Budget Distribution Template
        if (data?.distribution && Array.isArray(data.distribution)) {
            return (
                <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                        <p><strong>Năm tài chính:</strong> {data.fiscalYear}</p>
                        <p><strong>Tổng ngân sách:</strong> {data.totalBudget?.toLocaleString('vi-VN')} VND</p>
                    </div>
                    <table className="w-full text-xs border-collapse">
                        <thead>
                            <tr className="bg-[#FAF8F5]">
                                <th className="p-2 border">Ghi chú</th>
                                <th className="p-2 border">Ngân sách</th>
                            </tr>
                        </thead>
                        <tbody>
                            {data.distribution.map((item: any, i: number) => (
                                <tr key={i}>
                                    <td className="p-2 border">{item.notes}</td>
                                    <td className="p-2 border">{Number(item.allocatedAmount).toLocaleString('vi-VN')}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            );
        }

        // Budget Reservation Template
        if (data?.reservedAmount !== undefined) {
            return (
                <div className="text-sm space-y-2">
                    <p><strong>Số tiền giữ chỗ:</strong> {data.reservedAmount?.toLocaleString('vi-VN')}</p>
                    <p><strong>Đã cam kết:</strong> {data.currentCommitted?.toLocaleString('vi-VN')}</p>
                </div>
            );
        }

        // Fallback
        return <pre className="text-xs">{JSON.stringify(data, null, 2)}</pre>;
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-[#FFFFFF] w-full max-w-2xl rounded-2xl shadow-2xl border border-[rgba(148,163,184,0.1)] overflow-hidden">
                <div className="p-6 border-b border-[rgba(148,163,184,0.1)] flex justify-between items-center">
                    <h2 className="text-xl font-black text-[#000000]">Chi tiết thay đổi</h2>
                    <button onClick={onClose} className="text-[#000000] hover:text-[#B4533A]">Đóng</button>
                </div>
                <div className="p-6 max-h-[60vh] overflow-y-auto">
                    {renderContent()}
                </div>
                <div className="p-6 border-t border-[rgba(148,163,184,0.1)] text-right">
                    <button 
                        onClick={onClose}
                        className="px-6 py-2 bg-[#B4533A] text-white rounded-xl font-bold hover:bg-[#A0452F] transition-all"
                    >
                        Đã hiểu
                    </button>
                </div>
            </div>
        </div>
    );
};
