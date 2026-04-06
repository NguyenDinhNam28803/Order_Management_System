"use client";

import React, { useState } from "react";
import { useProcurement } from "../../context/ProcurementContext";
import { FileText, Eye, CheckCircle, Clock, XCircle, Search, Filter, Plus } from "lucide-react";
import Link from "next/link";
import { ContractStatus, CurrencyCode } from "../../types/api-types";

export default function ContractsPage() {
    const { contracts, loadingMyPrs } = useProcurement();
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState<string>("ALL");

    const filteredContracts = contracts.filter(c => {
        const matchSearch = c.contractNumber.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          c.title.toLowerCase().includes(searchTerm.toLowerCase());
        const matchStatus = statusFilter === "ALL" || c.status === statusFilter;
        return matchSearch && matchStatus;
    });

    const getStatusBadge = (status: ContractStatus) => {
        switch (status) {
            case ContractStatus.ACTIVE:
                return <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium flex items-center gap-1"><CheckCircle size={12}/> Đang hiệu lực</span>;
            case ContractStatus.PENDING_APPROVAL:
                return <span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs font-medium flex items-center gap-1"><Clock size={12}/> Chờ duyệt</span>;
            case ContractStatus.DRAFT:
                return <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-medium flex items-center gap-1"><FileText size={12}/> Bản nháp</span>;
            case ContractStatus.EXPIRED:
                return <span className="px-2 py-1 bg-orange-100 text-orange-700 rounded-full text-xs font-medium flex items-center gap-1"><Clock size={12}/> Hết hạn</span>;
            case ContractStatus.TERMINATED:
                return <span className="px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs font-medium flex items-center gap-1"><XCircle size={12}/> Đã chấm dứt</span>;
            default:
                return <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">{status}</span>;
        }
    };

    return (
        <div className="p-6 space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Quản lý Hợp đồng</h1>
                    <p className="text-gray-500 text-sm">Quản lý và theo dõi các thỏa thuận thu mua với nhà cung cấp</p>
                </div>
                <button className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-all shadow-md">
                    <Plus size={18} /> Tạo hợp đồng mới
                </button>
            </div>

            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-wrap gap-4 items-center">
                <div className="flex-1 min-w-75 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input 
                        type="text" 
                        placeholder="Tìm theo số hợp đồng, tiêu đề..." 
                        className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="flex items-center gap-2">
                    <Filter size={18} className="text-gray-400" />
                    <select 
                        className="border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                    >
                        <option value="ALL">Tất cả trạng thái</option>
                        <option value={ContractStatus.DRAFT}>Bản nháp</option>
                        <option value={ContractStatus.PENDING_APPROVAL}>Chờ duyệt</option>
                        <option value={ContractStatus.ACTIVE}>Đang hiệu lực</option>
                        <option value={ContractStatus.EXPIRED}>Hết hạn</option>
                        <option value={ContractStatus.TERMINATED}>Đã chấm dứt</option>
                    </select>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-gray-50 border-b border-gray-100 text-gray-600 text-sm uppercase">
                        <tr>
                            <th className="px-6 py-4 font-semibold">Số hợp đồng</th>
                            <th className="px-6 py-4 font-semibold">Tiêu đề / Đối tác</th>
                            <th className="px-6 py-4 font-semibold text-center">Giá trị</th>
                            <th className="px-6 py-4 font-semibold">Thời hạn</th>
                            <th className="px-6 py-4 font-semibold">Trạng thái</th>
                            <th className="px-6 py-4 font-semibold text-right">Thao tác</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50 text-gray-700">
                        {filteredContracts.length > 0 ? filteredContracts.map((c) => (
                            <tr key={c.id} className="hover:bg-gray-50 transition-colors group">
                                <td className="px-6 py-4 font-medium text-blue-600">#{c.contractNumber}</td>
                                <td className="px-6 py-4">
                                    <div className="font-semibold text-gray-800">{c.title}</div>
                                    <div className="text-xs text-gray-500">{c.supplier?.name || "N/A"}</div>
                                </td>
                                <td className="px-6 py-4 text-center font-bold text-gray-800">
                                    {new Intl.NumberFormat('vi-VN').format(c.totalValue)} {c.currency}
                                </td>
                                <td className="px-6 py-4 text-sm">
                                    <div className="text-gray-600">{new Date(c.startDate).toLocaleDateString('vi-VN')}</div>
                                    <div className="text-gray-400 text-xs">- {new Date(c.endDate).toLocaleDateString('vi-VN')}</div>
                                </td>
                                <td className="px-6 py-4">{getStatusBadge(c.status)}</td>
                                <td className="px-6 py-4 text-right">
                                    <Link 
                                        href={`/procurement/contracts/${c.id}`}
                                        className="p-2 text-gray-400 hover:text-blue-600 transition-colors inline-block"
                                    >
                                        <Eye size={20} />
                                    </Link>
                                </td>
                            </tr>
                        )) : (
                            <tr>
                                <td colSpan={6} className="px-6 py-10 text-center text-gray-400 italic">
                                    {loadingMyPrs ? "Đang tải dữ liệu..." : "Không tìm thấy hợp đồng nào."}
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
