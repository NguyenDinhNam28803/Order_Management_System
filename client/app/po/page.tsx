"use client";

import React from "react";
import DashboardHeader from "../components/DashboardHeader";
import { ShoppingCart, FileText, Lock, MoreVertical, Search, Filter, ArrowRight } from "lucide-react";
import { useProcurement } from "../context/ProcurementContext";
import { useRouter } from "next/navigation";

export default function POPage() {
    const { pos } = useProcurement();
    const router = useRouter();

    return (
        <main className="pt-16 px-8 pb-12">
            <DashboardHeader breadcrumbs={["Nghiệp vụ tài chính", "Đơn mua hàng (PO)"]} />

            <div className="mt-8 flex justify-between items-end mb-8">
                <div>
                    <h1 className="text-3xl font-black text-erp-navy tracking-tight">Quản lý Đơn mua hàng (PO)</h1>
                    <p className="text-sm text-slate-500 mt-1">Theo dõi các đơn hàng đã phát hành và tình trạng ngân sách.</p>
                </div>
                <div className="flex gap-4">
                    <div className="flex bg-white border border-slate-200 rounded-xl px-4 py-2 items-center gap-3">
                        <Search size={16} className="text-slate-400" />
                        <input type="text" placeholder="Tìm kiếm PO #, Nhà cung cấp..." className="text-xs bg-transparent outline-none font-bold" />
                    </div>
                    <button className="p-2 bg-white border border-slate-200 rounded-xl text-slate-400 hover:text-erp-navy transition-all"><Filter size={20} /></button>
                </div>
            </div>

            <div className="erp-card !p-0 overflow-hidden">
                <table className="erp-table">
                    <thead>
                        <tr>
                            <th>Mã PO</th>
                            <th>Nhà cung cấp</th>
                            <th>Giá trị</th>
                            <th>Ngày phát hành</th>
                            <th>Ngân sách</th>
                            <th>Trạng thái</th>
                            <th className="text-right">Hành động</th>
                        </tr>
                    </thead>
                    <tbody>
                        {pos.length > 0 ? pos.map(po => (
                            <tr key={po.id}>
                                <td className="font-bold text-erp-navy">{po.id}</td>
                                <td className="font-bold">{po.vendor}</td>
                                <td className="font-mono">{po.total.toLocaleString()} ₫</td>
                                <td className="text-slate-500 text-xs">{po.createdAt}</td>
                                <td>
                                    <div className="flex items-center gap-1 text-[10px] font-black text-erp-blue uppercase tracking-tighter">
                                        <Lock size={12} /> Committed
                                    </div>
                                </td>
                                <td>
                                    <span className={`status-pill ${po.status === 'PAID' ? 'status-approved' :
                                            po.status === 'COMMITTED' ? 'status-pending' : 'status-draft'
                                        }`}>
                                        {po.status}
                                    </span>
                                </td>
                                <td className="text-right">
                                    {po.status === "COMMITTED" && (
                                        <button
                                            onClick={() => router.push("/grn")}
                                            className="text-[10px] font-black uppercase text-erp-blue flex items-center gap-1 hover:underline ml-auto"
                                        >
                                            Nhập kho <ArrowRight size={14} />
                                        </button>
                                    )}
                                    {po.status === "PAID" && (
                                        <button className="p-2 text-slate-400 hover:text-erp-navy rounded-lg"><MoreVertical size={18} /></button>
                                    )}
                                </td>
                            </tr>
                        )) : (
                            <tr>
                                <td colSpan={7} className="py-20 text-center text-slate-400 font-bold uppercase tracking-widest italic">
                                    Chưa có đơn mua hàng nào được tạo
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="erp-card !p-6 bg-slate-50 border-dashed">
                    <div className="flex gap-4 items-center">
                        <div className="h-10 w-10 rounded-xl bg-erp-navy text-white flex items-center justify-center"><ShoppingCart size={20} /></div>
                        <div>
                            <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Ghi chú vận hành</h4>
                            <p className="text-[11px] text-slate-600 font-medium">Hệ thống đã tự động khóa ngân sách khi PO được phát hành.</p>
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
}
