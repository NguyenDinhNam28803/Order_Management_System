"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useProcurement } from "../../../context/ProcurementContext";
import { 
    ChevronLeft, FileText, Calendar, DollarSign, User, ShieldCheck, 
    CheckCircle, AlertCircle, PenTool, Download, Printer 
} from "lucide-react";
import { Contract, ContractStatus } from "../../../types/api-types";

export default function ContractDetailPage() {
    const params = useParams();
    const router = useRouter();
    const { contracts, signContract, currentUser, notify } = useProcurement();
    const [contract, setContract] = useState<Contract | null>(null);
    const [isSigning, setIsSigning] = useState(false);

    useEffect(() => {
        if (params.id) {
            const found = contracts.find(c => c.id === params.id);
            if (found) setContract(found);
        }
    }, [params.id, contracts]);

    const handleSign = async () => {
        if (!contract) return;
        setIsSigning(true);
        try {
            const isBuyer = currentUser?.role !== "SUPPLIER";
            const success = await signContract(contract.id, isBuyer);
            if (success) {
                notify("Ký hợp đồng thành công!", "success");
            }
        } catch (error) {
            notify("Lỗi khi ký hợp đồng", "error");
        } finally {
            setIsSigning(false);
        }
    };

    if (!contract) {
        return (
            <div className="p-6 text-center text-gray-500 italic">
                Đang tải thông tin hợp đồng...
            </div>
        );
    }

    const canSign = (currentUser?.role === "CEO" || currentUser?.role === "DIRECTOR") && !contract.buyerSignedAt;
    const isSupplierSignPending = currentUser?.role === "SUPPLIER" && !contract.supplierSignedAt;

    return (
        <div className="p-6 space-y-6 max-w-5xl mx-auto">
            <button 
                onClick={() => router.back()}
                className="flex items-center gap-2 text-gray-500 hover:text-gray-800 transition-colors"
            >
                <ChevronLeft size={20} /> Quay lại danh sách
            </button>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-8 border-b border-gray-50 bg-gray-50/50">
                    <div className="flex justify-between items-start">
                        <div className="space-y-1">
                            <h1 className="text-3xl font-bold text-gray-800">{contract.title}</h1>
                            <p className="text-blue-600 font-medium">Mã hợp đồng: #{contract.contractNumber}</p>
                        </div>
                        <div className="flex gap-3">
                            <button className="p-2 bg-white border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 transition-all shadow-sm">
                                <Printer size={18} />
                            </button>
                            <button className="p-2 bg-white border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 transition-all shadow-sm">
                                <Download size={18} />
                            </button>
                        </div>
                    </div>
                </div>

                <div className="p-8 grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div className="md:col-span-2 space-y-8">
                        <section className="space-y-4">
                            <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                                <FileText size={20} className="text-blue-500" /> Nội dung hợp đồng
                            </h2>
                            <div className="prose max-w-none text-gray-600 leading-relaxed">
                                <p>{contract.description || "Chưa có mô tả chi tiết cho hợp đồng này. Các điều khoản tuân thủ theo quy định chung của công ty và đơn hàng đi kèm."}</p>
                            </div>
                        </section>

                        <section className="space-y-4">
                            <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                                <DollarSign size={20} className="text-green-500" /> Lộ trình thanh toán (Milestones)
                            </h2>
                            <div className="border border-gray-100 rounded-xl overflow-hidden">
                                <table className="w-full text-left text-sm">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-4 py-3 font-semibold">Giai đoạn</th>
                                            <th className="px-4 py-3 font-semibold">Ngày dự kiến</th>
                                            <th className="px-4 py-3 font-semibold text-right">Số tiền</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-50">
                                        {contract.milestones?.map((m, idx) => (
                                            <tr key={m.id}>
                                                <td className="px-4 py-3 font-medium">{m.title}</td>
                                                <td className="px-4 py-3 text-gray-500">{new Date(m.dueDate).toLocaleDateString('vi-VN')}</td>
                                                <td className="px-4 py-3 text-right font-bold text-gray-800">
                                                    {new Intl.NumberFormat('vi-VN').format(m.amount)} {contract.currency}
                                                </td>
                                            </tr>
                                        )) || (
                                            <tr>
                                                <td colSpan={3} className="px-4 py-6 text-center text-gray-400 italic">Thanh toán 100% khi nghiệm thu</td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </section>
                    </div>

                    <div className="space-y-6">
                        <div className="bg-gray-50 p-6 rounded-2xl space-y-4">
                            <h3 className="font-bold text-gray-800">Thông tin chung</h3>
                            <div className="space-y-3 text-sm">
                                <div className="flex justify-between items-center text-gray-600">
                                    <span className="flex items-center gap-2"><User size={16}/> Đối tác:</span>
                                    <span className="font-semibold text-gray-800">{contract.supplier?.name}</span>
                                </div>
                                <div className="flex justify-between items-center text-gray-600">
                                    <span className="flex items-center gap-2"><Calendar size={16}/> Bắt đầu:</span>
                                    <span className="font-semibold text-gray-800">{new Date(contract.startDate).toLocaleDateString('vi-VN')}</span>
                                </div>
                                <div className="flex justify-between items-center text-gray-600">
                                    <span className="flex items-center gap-2"><Calendar size={16}/> Kết thúc:</span>
                                    <span className="font-semibold text-gray-800">{new Date(contract.endDate).toLocaleDateString('vi-VN')}</span>
                                </div>
                                <div className="pt-3 border-t border-gray-200">
                                    <div className="flex justify-between items-center">
                                        <span className="text-gray-600">Tổng giá trị:</span>
                                        <span className="text-lg font-black text-blue-600">
                                            {new Intl.NumberFormat('vi-VN').format(contract.totalValue)} {contract.currency}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white p-6 rounded-2xl border-2 border-dashed border-gray-200 space-y-6">
                            <h3 className="font-bold text-gray-800 flex items-center gap-2">
                                <ShieldCheck size={20} className="text-blue-500" /> Xác thực & Chữ ký
                            </h3>
                            
                            <div className="space-y-4">
                                <div className="flex items-center gap-3">
                                    <div className={`p-1.5 rounded-full ${contract.buyerSignedAt ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'}`}>
                                        <CheckCircle size={16} />
                                    </div>
                                    <div className="text-xs">
                                        <p className="font-bold text-gray-700 uppercase tracking-wider">Bên Mua (Buyer)</p>
                                        <p className={contract.buyerSignedAt ? "text-green-600" : "text-gray-400 italic"}>
                                            {contract.buyerSignedAt ? `Đã ký: ${new Date(contract.buyerSignedAt).toLocaleString('vi-VN')}` : "Chưa ký"}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3">
                                    <div className={`p-1.5 rounded-full ${contract.supplierSignedAt ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'}`}>
                                        <CheckCircle size={16} />
                                    </div>
                                    <div className="text-xs">
                                        <p className="font-bold text-gray-700 uppercase tracking-wider">Bên Bán (Supplier)</p>
                                        <p className={contract.supplierSignedAt ? "text-green-600" : "text-gray-400 italic"}>
                                            {contract.supplierSignedAt ? `Đã ký: ${new Date(contract.supplierSignedAt).toLocaleString('vi-VN')}` : "Chưa ký"}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {(canSign || isSupplierSignPending) && (
                                <button 
                                    onClick={handleSign}
                                    disabled={isSigning}
                                    className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg flex items-center justify-center gap-2 disabled:opacity-50"
                                >
                                    <PenTool size={18} />
                                    {isSigning ? "Đang xử lý chữ ký..." : "Ký xác nhận ngay"}
                                </button>
                            )}

                            {!canSign && !isSupplierSignPending && contract.status === ContractStatus.PENDING_APPROVAL && (
                                <div className="p-4 bg-yellow-50 text-yellow-700 rounded-xl text-xs flex items-start gap-2 border border-yellow-100">
                                    <AlertCircle size={16} className="shrink-0" />
                                    <span>Tài khoản của bạn không có quyền ký hoặc hợp đồng này không ở trạng thái chờ bạn ký.</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
