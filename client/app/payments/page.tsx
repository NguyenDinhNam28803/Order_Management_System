"use client";

import DashboardHeader from "../components/DashboardHeader";
import { ArrowRight, ShieldCheck, History } from "lucide-react";

interface Transaction {
    id: string;
    vendor: string;
    amount: string;
    status: "SUCCESS" | "PENDING";
    date: string;
}

export default function PaymentsPage() {
    const transactions: Transaction[] = [
        { id: "PAY-9921", vendor: "Thai Binh Cotton", amount: "45,000,000 ₫", status: "SUCCESS", date: "Hôm nay 10:30" },
        { id: "PAY-9840", vendor: "Formosa Corp", amount: "205,000,000 ₫", status: "PENDING", date: "Đang chờ duyệt" },
    ];

    return (
        <main className="pt-16 px-8 pb-12">
            <DashboardHeader breadcrumbs={["Tài chính", "Thanh toán"]} />

            <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
                <div className="lg:col-span-2 space-y-8">
                    <div>
                        <h1 className="text-2xl font-black text-erp-navy tracking-tight mb-2">Hóa đơn & Thanh toán</h1>
                        <p className="text-sm text-slate-500">Thanh toán các đơn hàng đã được đối soát hoàn tất.</p>
                    </div>

                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                        <div className="p-4 border-b border-slate-100 font-black text-[10px] uppercase tracking-widest text-slate-400">Danh sách chờ thanh toán</div>
                        <table className="erp-table text-xs">
                            <thead><tr><th>Mã giao dịch</th><th>Nhà cung cấp</th><th>Số tiền</th><th>Trạng thái</th><th>Hành động</th></tr></thead>
                            <tbody>
                                {transactions.map(t => (
                                    <tr key={t.id}>
                                        <td className="font-mono font-bold">{t.id}</td>
                                        <td className="font-bold">{t.vendor}</td>
                                        <td className="font-black text-erp-navy">{t.amount}</td>
                                        <td>
                                            <span className={`status-pill ${t.status === 'SUCCESS' ? 'status-approved' : 'status-pending'}`}>
                                                {t.status === 'SUCCESS' ? 'Đã thanh toán' : 'Chờ giải ngân'}
                                            </span>
                                        </td>
                                        <td>
                                            <button className={`${t.status === 'PENDING' ? 'bg-erp-navy text-white' : 'text-slate-300'} px-4 py-1.5 rounded-lg text-[10px] font-black uppercase flex items-center gap-2`}>
                                                Thanh toán <ArrowRight size={12} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className="space-y-6">
                    <div className="bg-erp-navy rounded-3xl p-8 text-white shadow-2xl relative overflow-hidden">
                        <div className="absolute -top-10 -right-10 h-40 w-40 bg-white/5 rounded-full blur-2xl font-black"></div>
                        <h3 className="text-xs font-black uppercase text-white/40 mb-8 tracking-widest">Ví tổng thanh toán</h3>
                        <div className="text-4xl font-mono font-black mb-1">1.250.000.000 ₫</div>
                        <p className="text-[10px] text-emerald-400 font-bold mb-8 italic">● Hệ thống đã sẵn sàng giải ngân 250tr</p>

                        <div className="space-y-4 pt-8 border-t border-white/10">
                            <div className="flex justify-between items-center text-xs">
                                <span className="text-white/40">Giao dịch trong tháng:</span>
                                <span className="font-bold">12 đơn</span>
                            </div>
                            <div className="flex justify-between items-center text-xs">
                                <span className="text-white/40">Tổng chi:</span>
                                <span className="font-bold">840.000.000 ₫</span>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                        <h4 className="text-[10px] font-black uppercase text-slate-400 mb-4">Lịch sử giao dịch gần đây</h4>
                        <div className="space-y-4">
                            <div className="flex items-center gap-3">
                                <div className="h-8 w-8 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center"><ShieldCheck size={16} /></div>
                                <div className="flex-1">
                                    <div className="text-[10px] font-bold text-erp-navy">Thanh toán PO-2026-0038</div>
                                    <div className="text-[9px] text-slate-400">05/03/2026 - Thành công</div>
                                </div>
                                <div className="text-[10px] font-black text-erp-navy">-45Tr</div>
                            </div>
                        </div>
                        <button className="w-full mt-6 text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center justify-center gap-2 hover:text-erp-navy">
                            <History size={14} /> Xem tất cả lịch sử
                        </button>
                    </div>
                </div>
            </div>
        </main>
    );
}
