"use client";

import { useEffect, useState } from "react";
import { ArrowRight, ShieldCheck, History } from "lucide-react";
import { useProcurement } from "../context/ProcurementContext";
import { Payment } from "../types/api-types";
import { formatVND, formatDate } from "../utils/formatUtils";
import ERPTable, { ERPTableColumn } from "../components/shared/ERPTable";

// Extended Payment with API extra fields
interface PaymentWithDetails extends Payment {
    supplierName?: string;
    paymentDate?: string;
}

export default function PaymentsPage() {
    const [payments, setPayments] = useState<PaymentWithDetails[]>([]);
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
        <main className="animate-in fade-in duration-500 p-6 min-h-screen bg-[#FFFFFF] text-slate-900">
            {error && (
                <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
                    {error}
                </div>
            )}

            <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
                <div className="lg:col-span-2 space-y-8">
                    <div>
                        <h1 className="text-2xl font-black text-slate-900 tracking-tight mb-2">Hóa đơn & Thanh toán</h1>
                        <p className="text-sm text-slate-900">Thanh toán các đơn hàng đã được đối soát hoàn tất.</p>
                    </div>

                    <div className="bg-[#F1F5F9] rounded-xl border border-[rgba(148,163,184,0.1)] shadow-sm overflow-hidden">
                        <div className="p-4 border-b border-slate-100 font-black text-[10px] uppercase tracking-widest text-black">Danh sách chờ thanh toán</div>
                        {loading ? (
                            <div className="p-8 text-center text-black">Đang tải...</div>
                        ) : (() => {
                            const paymentColumns: ERPTableColumn<PaymentWithDetails>[] = [
                                {
                                    label: "Mã giao dịch",
                                    render: (p) => <span className="font-bold">{p.transactionId ?? `#PAY-${p.id.slice(0, 8).toUpperCase()}`}</span>,
                                },
                                {
                                    label: "Nhà cung cấp",
                                    key: "supplierName",
                                    sortable: true,
                                    render: (p) => <span className="font-bold">{p.supplierName || 'N/A'}</span>,
                                },
                                {
                                    label: "Số tiền",
                                    key: "amount",
                                    sortable: true,
                                    render: (p) => <span className="font-black text-brand-primary">{formatVND(p.amount, true)}</span>,
                                },
                                {
                                    label: "Trạng thái",
                                    key: "status",
                                    sortable: true,
                                    render: (p) => {
                                        const sd = getStatusDisplay(p.status);
                                        return <span className={`status-pill ${sd.class}`}>{sd.label}</span>;
                                    },
                                },
                                {
                                    label: "Hành động",
                                    render: (p) => {
                                        const isCompleted = p.status === 'COMPLETED';
                                        return (
                                            <div className="flex items-center gap-2">
                                                <button disabled={isCompleted} className={`${!isCompleted ? 'bg-erp-navy text-white hover:bg-erp-navy/90' : 'text-slate-300 bg-slate-100'} px-4 py-1.5 rounded-lg text-[10px] font-black uppercase flex items-center gap-2 disabled:cursor-not-allowed`}>
                                                    {isCompleted ? 'Đã thanh toán' : 'Thanh toán'} <ArrowRight size={12} />
                                                </button>
                                                {p.status === 'PENDING' && (
                                                    <>
                                                        <button className="text-amber-500 hover:text-amber-700 mx-1" title="Sửa Thanh toán">Edit</button>
                                                        <button className="text-red-500 hover:text-red-700 mx-1" title="Xóa Thanh toán">Delete</button>
                                                    </>
                                                )}
                                            </div>
                                        );
                                    },
                                },
                            ];
                            return (
                                <ERPTable
                                    columns={paymentColumns}
                                    data={payments}
                                    emptyMessage="Không có thanh toán nào"
                                    emptyDescription="Các giao dịch thanh toán sẽ xuất hiện tại đây"
                                />
                            );
                        })()}
                    </div>
                </div>

                <div className="space-y-6">
                    <div className="bg-[#F1F5F9] rounded-xl p-8 text-slate-900 shadow-2xl relative overflow-hidden border border-[rgba(148,163,184,0.1)]">
                        <div className="absolute -top-10 -right-10 h-40 w-40 bg-[#2563EB]/5 rounded-full blur-2xl font-black"></div>
                        <h3 className="text-xs font-black uppercase text-slate-900 mb-8 tracking-widest">Ví tổng thanh toán</h3>
                        <div className="text-4xl font-black mb-1 text-slate-900">{formatVND(totalAmount, true)}</div>
                        <p className="text-[10px] text-black font-bold mb-8 italic">● Hệ thống đã sẵn sàng giải ngân</p>

                        <div className="space-y-4 pt-8 border-t border-[rgba(148,163,184,0.1)]">
                            <div className="flex justify-between items-center text-xs">
                                <span className="text-slate-900">Giao dịch trong hệ thống:</span>
                                <span className="font-bold text-slate-900">{payments.length} đơn</span>
                            </div>
                            <div className="flex justify-between items-center text-xs">
                                <span className="text-slate-900">Tổng chi:</span>
                                <span className="font-bold text-slate-900">{formatVND(totalAmount, true)}</span>
                            </div>
                        </div>
                    </div>

                    <div className="bg-[#F1F5F9] rounded-xl border border-[rgba(148,163,184,0.1)] p-6 shadow-sm">
                        <h4 className="text-[10px] font-black uppercase text-slate-900 mb-4">Lịch sử giao dịch gần đây</h4>
                        <div className="space-y-4">
                            {payments.filter(p => p.status === 'COMPLETED').slice(0, 3).map(payment => (
                                <div key={payment.id} className="flex items-center gap-3">
                                    <div className="h-8 w-8 rounded-full bg-emerald-500/10 text-black flex items-center justify-center border border-emerald-500/20"><ShieldCheck size={16} /></div>
                                    <div className="flex-1">
                                        <div className="text-[10px] font-bold text-slate-900">Thanh toán {payment.id}</div>
                                                                                <div className="text-[9px] text-slate-900">{formatDate(payment.paymentDate ?? payment.createdAt)} - Thành công</div>
                                    </div>
                                    <div className="text-[10px] font-black text-slate-900">-{formatVND(payment.amount, true)}</div>
                                </div>
                            ))}
                        </div>
                        <button className="w-full mt-6 text-[10px] font-black text-slate-900 uppercase tracking-widest flex items-center justify-center gap-2 hover:text-slate-900 transition-colors">
                            <History size={14} /> Xem tất cả lịch sử
                        </button>
                    </div>
                </div>
            </div>
        </main>
    );
}

