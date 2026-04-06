"use client";

import { useEffect, useState } from "react";
import DashboardHeader from "../components/DashboardHeader";
import { ArrowRight, ShieldCheck, History } from "lucide-react";
import { useProcurement } from "../context/ProcurementContext";
import { Payment } from "../types/api-types";

export default function PaymentsPage() {
    const [payments, setPayments] = useState<Payment[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [totalAmount, setTotalAmount] = useState(0);
    const { fetchPayments, notify } = useProcurement();

    useEffect(() => {
        const fetch = async () => {
            try {
                setLoading(true);
                const data = await fetchPayments();
                setPayments(data || []);
                const total = (data || []).reduce((sum: number, p: Payment) => sum + (Number(p.amount) || 0), 0);
                setTotalAmount(total);
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Failed to load payments');
                console.error('Error fetching payments:', err);
            } finally {
                setLoading(false);
            }
        };

        fetch();
    }, [fetchPayments]);

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND',
            minimumFractionDigits: 0,
        }).format(amount);
    };

    const getStatusDisplay = (status: string) => {
        switch (status) {
            case 'COMPLETED':
                return { label: 'Đã thanh toán', class: 'status-approved' };
            case 'SCHEDULED':
                return { label: 'Chờ giải ngân', class: 'status-pending' };
            case 'PENDING':
                return { label: 'Chờ duyệt', class: 'status-pending' };
            default:
                return { label: status, class: 'status-default' };
        }
    };

    return (
        <main className="animate-in fade-in duration-500 p-6 min-h-screen bg-[#0F1117] text-[#F8FAFC]">
            <DashboardHeader breadcrumbs={["Kế toán", "Thanh toán"]} />

            {error && (
                <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
                    {error}
                </div>
            )}

            <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
                <div className="lg:col-span-2 space-y-8">
                    <div>
                        <h1 className="text-2xl font-black text-[#F8FAFC] tracking-tight mb-2">Hóa đơn & Thanh toán</h1>
                        <p className="text-sm text-[#94A3B8]">Thanh toán các đơn hàng đã được đối soát hoàn tất.</p>
                    </div>

                    <div className="bg-[#161922] rounded-2xl border border-[rgba(148,163,184,0.1)] shadow-sm overflow-hidden">
                        <div className="p-4 border-b border-slate-100 font-black text-[10px] uppercase tracking-widest text-slate-400">Danh sách chờ thanh toán</div>
                        {loading ? (
                            <div className="p-8 text-center text-slate-400">Đang tải...</div>
                        ) : (
                            <table className="erp-table text-xs">
                                <thead><tr><th>Mã giao dịch</th><th>Nhà cung cấp</th><th>Số tiền</th><th>Trạng thái</th><th>Hành động</th></tr></thead>
                                <tbody>
                                    {payments.length > 0 ? (
                                        payments.map((payment) => {
                                            const statusDisplay = getStatusDisplay(payment.status);
                                            const isCompleted = payment.status === 'COMPLETED';
                                            
                                            return (
                                                <tr key={payment.id}>
                                                    <td className=" font-bold">{payment.id}</td>
                                                    <td className="font-bold">{(payment as any).supplierName || 'N/A'}</td>
                                                    <td className="font-black text-erp-navy">{formatCurrency(payment.amount)}</td>
                                                    <td>
                                                        <span className={`status-pill ${statusDisplay.class}`}>
                                                            {statusDisplay.label}
                                                        </span>
                                                    </td>
                                                    <td>
                                                        <button disabled={isCompleted} className={`${!isCompleted ? 'bg-erp-navy text-white hover:bg-erp-navy/90' : 'text-slate-300 bg-slate-100'} px-4 py-1.5 rounded-lg text-[10px] font-black uppercase flex items-center gap-2 disabled:cursor-not-allowed`}>
                                                            {isCompleted ? 'Đã thanh toán' : 'Thanh toán'} <ArrowRight size={12} />
                                                        </button>
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    ) : (
                                        <tr><td colSpan={5} className="p-8 text-center text-slate-400">Không có thanh toán nào</td></tr>
                                    )}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>

                <div className="space-y-6">
                    <div className="bg-[#161922] rounded-3xl p-8 text-white shadow-2xl relative overflow-hidden border border-[rgba(148,163,184,0.1)]">
                        <div className="absolute -top-10 -right-10 h-40 w-40 bg-[#3B82F6]/5 rounded-full blur-2xl font-black"></div>
                        <h3 className="text-xs font-black uppercase text-[#64748B] mb-8 tracking-widest">Ví tổng thanh toán</h3>
                        <div className="text-4xl font-black mb-1 text-[#F8FAFC]">{formatCurrency(totalAmount)}</div>
                        <p className="text-[10px] text-emerald-400 font-bold mb-8 italic">● Hệ thống đã sẵn sàng giải ngân</p>

                        <div className="space-y-4 pt-8 border-t border-[rgba(148,163,184,0.1)]">
                            <div className="flex justify-between items-center text-xs">
                                <span className="text-[#64748B]">Giao dịch trong hệ thống:</span>
                                <span className="font-bold text-[#F8FAFC]">{payments.length} đơn</span>
                            </div>
                            <div className="flex justify-between items-center text-xs">
                                <span className="text-[#64748B]">Tổng chi:</span>
                                <span className="font-bold text-[#F8FAFC]">{formatCurrency(totalAmount)}</span>
                            </div>
                        </div>
                    </div>

                    <div className="bg-[#161922] rounded-2xl border border-[rgba(148,163,184,0.1)] p-6 shadow-sm">
                        <h4 className="text-[10px] font-black uppercase text-[#64748B] mb-4">Lịch sử giao dịch gần đây</h4>
                        <div className="space-y-4">
                            {payments.filter(p => p.status === 'COMPLETED').slice(0, 3).map(payment => (
                                <div key={payment.id} className="flex items-center gap-3">
                                    <div className="h-8 w-8 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/20"><ShieldCheck size={16} /></div>
                                    <div className="flex-1">
                                        <div className="text-[10px] font-bold text-[#F8FAFC]">Thanh toán {payment.id}</div>
                                        <div className="text-[9px] text-[#64748B]">{new Date((payment as any).paymentDate || payment.createdAt).toLocaleDateString('vi-VN')} - Thành công</div>
                                    </div>
                                    <div className="text-[10px] font-black text-[#F8FAFC]">-{formatCurrency(payment.amount)}</div>
                                </div>
                            ))}
                        </div>
                        <button className="w-full mt-6 text-[10px] font-black text-[#64748B] uppercase tracking-widest flex items-center justify-center gap-2 hover:text-[#F8FAFC] transition-colors">
                            <History size={14} /> Xem tất cả lịch sử
                        </button>
                    </div>
                </div>
            </div>
        </main>
    );
}
