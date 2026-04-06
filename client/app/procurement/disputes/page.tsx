"use client";

import React, { useState } from "react";
import { useProcurement } from "../../context/ProcurementContext";
import { 
    AlertTriangle, MessageSquare, Clock, CheckCircle, 
    XCircle, Search, Filter, ArrowUpRight 
} from "lucide-react";
import { DisputeStatus, DocumentType } from "../../types/api-types";

export default function DisputesPage() {
    const { disputes, loadingMyPrs } = useProcurement();
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState<string>("ALL");

    const filteredDisputes = disputes.filter(d => {
        const matchSearch = d.disputeNumber.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          d.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          d.reason.toLowerCase().includes(searchTerm.toLowerCase());
        const matchStatus = statusFilter === "ALL" || d.status === statusFilter;
        return matchSearch && matchStatus;
    });

    const getStatusBadge = (status: DisputeStatus) => {
        switch (status) {
            case DisputeStatus.OPEN:
                return <span className="px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs font-medium flex items-center gap-1 w-fit"><AlertTriangle size={12}/> Đang mở</span>;
            case DisputeStatus.UNDER_INVESTIGATION:
                return <span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs font-medium flex items-center gap-1 w-fit"><Clock size={12}/> Đang xác minh</span>;
            case DisputeStatus.RESOLVED:
                return <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium flex items-center gap-1 w-fit"><CheckCircle size={12}/> Đã giải quyết</span>;
            case DisputeStatus.CLOSED:
                return <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-medium flex items-center gap-1 w-fit"><XCircle size={12}/> Đã đóng</span>;
            default:
                return <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium w-fit">{status}</span>;
        }
    };

    return (
        <div className="p-6 space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Khiếu nại & Tranh chấp</h1>
                    <p className="text-gray-500 text-sm">Xử lý các vấn đề phát sinh về chất lượng hàng hóa, thanh toán hoặc dịch vụ</p>
                </div>
                <button className="flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-all shadow-md">
                    <AlertTriangle size={18} /> Tạo khiếu nại mới
                </button>
            </div>

            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-wrap gap-4 items-center">
                <div className="flex-1 min-w-[300px] relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input 
                        type="text" 
                        placeholder="Tìm theo mã khiếu nại, nội dung..." 
                        className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="flex items-center gap-2">
                    <Filter size={18} className="text-gray-400" />
                    <select 
                        className="border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500"
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                    >
                        <option value="ALL">Tất cả trạng thái</option>
                        <option value={DisputeStatus.OPEN}>Đang mở</option>
                        <option value={DisputeStatus.UNDER_INVESTIGATION}>Đang xác minh</option>
                        <option value={DisputeStatus.RESOLVED}>Đã giải quyết</option>
                        <option value={DisputeStatus.CLOSED}>Đã đóng</option>
                    </select>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-4">
                {filteredDisputes.length > 0 ? filteredDisputes.map((d) => (
                    <div key={d.id} className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 hover:border-red-200 transition-all group relative">
                        <div className="flex justify-between items-start mb-3">
                            <div className="space-y-1">
                                <div className="flex items-center gap-3">
                                    <span className="font-mono font-bold text-red-600">#{d.disputeNumber}</span>
                                    {getStatusBadge(d.status)}
                                    <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold uppercase ${d.priority === 'HIGH' ? 'bg-red-600 text-white' : 'bg-gray-100 text-gray-500'}`}>
                                        {d.priority}
                                    </span>
                                </div>
                                <h3 className="text-lg font-bold text-gray-800">{d.title}</h3>
                            </div>
                            <div className="text-right text-xs text-gray-400">
                                <p>Ngày tạo: {new Date(d.createdAt).toLocaleDateString('vi-VN')}</p>
                                <p>Tài liệu: <span className="font-medium text-gray-600 uppercase">{d.relatedDocumentType}</span></p>
                            </div>
                        </div>
                        
                        <div className="bg-gray-50 p-3 rounded-lg text-sm text-gray-600 mb-4 line-clamp-2 italic">
                            "{d.reason}"
                        </div>

                        <div className="flex justify-between items-center pt-4 border-t border-gray-50">
                            <div className="flex items-center gap-4 text-xs">
                                <div className="flex items-center gap-1.5 text-gray-500">
                                    <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center text-[10px] font-bold text-blue-600">
                                        {d.reportedBy?.fullName?.charAt(0) || "U"}
                                    </div>
                                    <span>Bởi: <b>{d.reportedBy?.fullName || "N/A"}</b></span>
                                </div>
                                {d.assignedTo && (
                                    <div className="flex items-center gap-1.5 text-gray-500">
                                        <div className="w-6 h-6 rounded-full bg-purple-100 flex items-center justify-center text-[10px] font-bold text-purple-600">
                                            {d.assignedTo?.fullName?.charAt(0) || "A"}
                                        </div>
                                        <span>Xử lý: <b>{d.assignedTo?.fullName}</b></span>
                                    </div>
                                )}
                            </div>
                            <button className="flex items-center gap-1.5 text-blue-600 font-bold text-sm hover:underline">
                                Xem chi tiết & Thảo luận <ArrowUpRight size={16} />
                            </button>
                        </div>
                    </div>
                )) : (
                    <div className="bg-white p-12 rounded-xl border border-dashed border-gray-200 text-center space-y-3">
                        <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto text-gray-300">
                            <MessageSquare size={32} />
                        </div>
                        <div className="text-gray-400 italic">
                            {loadingMyPrs ? "Đang tải dữ liệu..." : "Chưa có khiếu nại nào được ghi nhận."}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
