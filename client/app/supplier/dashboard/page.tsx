"use client";

import React, { useState } from "react";
import DashboardHeader from "../../components/DashboardHeader";
import { Inbox, Package, FileText, CheckCircle2, TrendingUp, AlertTriangle, ChevronRight, Zap } from "lucide-react";
import { useProcurement } from "../../context/ProcurementContext";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function SupplierDashboard() {
    const { currentUser, rfqs, createQuote, notify } = useProcurement();
    const router = useRouter();

    // Filter RFQs for this supplier (simulation: matches name or show all for demo if not specific)
    const myRfqs = rfqs.filter((r: any) => 
        r.vendor?.toLowerCase().includes(currentUser?.name?.toLowerCase() || "") || 
        r.vendor?.toLowerCase().includes(currentUser?.fullName?.toLowerCase() || "") ||
        currentUser?.role === "PLATFORM_ADMIN" // Admin sees all
    );

    const pos = [
        { id: "PO-2026-001", item: "Vải Cotton 100%", qty: 500, dateReq: "15/04/2026", progress: 60, status: "IN_PRODUCTION" },
        { id: "PO-2026-003", item: "Máy may Juki", qty: 10, dateReq: "20/04/2026", progress: 10, status: "PREPARING" },
    ];

    const handleQuote = (rfqId: string) => {
        createQuote(rfqId, {
            totalPrice: 5000000,
            leadTimeDays: 7,
            currency: "VND"
        });
        notify(`Đã gửi báo giá cho ${rfqId} thành công!`, "success");
    };

    return (
        <main className="pt-16 px-8 pb-12">
            <DashboardHeader breadcrumbs={["Nhà cung cấp", "Bàn làm việc B2B"]} />

            <div className="mt-8 mb-8 pb-6 border-b border-slate-200">
                <h1 className="text-3xl font-black text-erp-navy tracking-tight uppercase">Xin chào, {currentUser?.name || currentUser?.fullName || 'Nhà cung cấp'}!</h1>
                <p className="text-sm text-slate-500 mt-1">Quản lý toàn bộ vòng đời giao dịch B2B từ Báo giá tới Thanh toán.</p>
            </div>

            {/* KPI Cards (6.1) */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <div className="erp-card bg-orange-50 border-orange-200 group">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-3 bg-orange-100 text-orange-600 rounded-xl group-hover:scale-110 transition-transform"><Inbox size={24} /></div>
                        {myRfqs.filter((r: any) => r.status === 'SENT').length > 0 && (
                            <span className="flex items-center gap-1 text-[10px] font-black uppercase text-white bg-red-500 px-2 py-1 rounded shadow-sm shadow-red-500/20">
                                <AlertTriangle size={10}/> Mới
                            </span>
                        )}
                    </div>
                    <div className="text-3xl font-black text-orange-950">{myRfqs.filter((r: any) => r.status === 'SENT').length}</div>
                    <div className="text-xs font-bold text-orange-700/60 uppercase tracking-widest mt-1">RFQ Chờ báo giá</div>
                </div>
                
                <div className="erp-card bg-blue-50 border-blue-200">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-3 bg-blue-100 text-blue-600 rounded-xl"><Package size={24} /></div>
                    </div>
                    <div className="text-3xl font-black text-blue-950">5</div>
                    <div className="text-xs font-bold text-blue-700/60 uppercase tracking-widest mt-1">PO Đang thực hiện</div>
                </div>

                <div className="erp-card bg-purple-50 border-purple-200">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-3 bg-purple-100 text-purple-600 rounded-xl"><FileText size={24} /></div>
                    </div>
                    <div className="text-3xl font-black text-purple-950">3</div>
                    <div className="text-xs font-bold text-purple-700/60 uppercase tracking-widest mt-1">Invoice Chờ thanh toán</div>
                </div>

                <div className="erp-card bg-emerald-50 border-emerald-200">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-3 bg-emerald-100 text-emerald-600 rounded-xl"><TrendingUp size={24} /></div>
                    </div>
                    <div className="text-2xl font-black text-emerald-950 font-mono">1.25B ₫</div>
                    <div className="text-xs font-bold text-emerald-700/60 uppercase tracking-widest mt-1">Số dư đối soát T3</div>
                </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                {/* Danh sách RFQ (6.1) */}
                <div className="erp-card shadow-sm border border-slate-200 !p-0 overflow-hidden flex flex-col">
                    <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                        <h3 className="text-sm font-black uppercase tracking-widest text-erp-navy flex items-center gap-2">
                            <Inbox size={16} /> RFQ Cần Xử Lý
                        </h3>
                        <Link href="/supplier/rfq" className="text-xs font-bold text-erp-blue hover:underline">Xem tất cả</Link>
                    </div>
                    <div className="flex-1 overflow-auto bg-white">
                        <table className="erp-table text-xs m-0 !border-none">
                            <thead className="sticky top-0 bg-slate-50 shadow-sm z-10">
                                <tr className="text-[10px] uppercase tracking-widest font-black text-slate-400">
                                    <th className="px-6">Số RFQ</th>
                                    <th>Cửa hàng / Đơn vị</th>
                                    <th>Trạng thái</th>
                                    <th className="text-right px-6">Hành động</th>
                                </tr>
                            </thead>
                            <tbody>
                                {myRfqs.map((rfq: any) => (
                                    <tr key={rfq.id} className="hover:bg-slate-50 transition-all border-b border-slate-50 group">
                                        <td className="font-black text-erp-navy px-6 py-5">
                                            {rfq.id.toUpperCase()}
                                            {rfq.status === 'SENT' && <span className="ml-2 w-2 h-2 rounded-full bg-erp-blue inline-block animate-pulse"></span>}
                                        </td>
                                        <td className="font-bold text-slate-600">ProcurePro Network</td>
                                        <td className="">
                                            <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-full border ${
                                                rfq.status === "SENT" ? 'bg-orange-50 border-orange-100 text-orange-600' : 'bg-emerald-50 border-emerald-100 text-emerald-600'
                                            }`}>
                                                {rfq.status === "SENT" ? 'Đang chờ' : 'Đã báo giá'}
                                            </span>
                                        </td>
                                        <td className="text-right px-6">
                                            {rfq.status === "SENT" ? (
                                                <button 
                                                    onClick={() => handleQuote(rfq.id)}
                                                    className="px-4 py-2 bg-erp-navy text-white rounded-xl font-black text-[9px] uppercase tracking-[0.1em] hover:scale-105 active:scale-95 transition-all shadow-lg shadow-erp-navy/20"
                                                >
                                                    Gửi báo giá
                                                </button>
                                            ) : (
                                                <div className="text-emerald-500 flex items-center justify-end gap-1 font-black text-[10px] uppercase">
                                                    <CheckCircle2 size={12} /> Hoàn tất
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                                {myRfqs.length === 0 && (
                                    <tr>
                                        <td colSpan={4} className="py-20 text-center text-slate-300 font-black uppercase tracking-widest text-xs opacity-50">
                                            Chưa có yêu cầu báo giá nào
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* PO Active (6.1) */}
                <div className="space-y-8 flex flex-col">
                    <div className="erp-card shadow-sm border border-slate-200 !p-0 overflow-hidden">
                        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                            <h3 className="text-sm font-black uppercase tracking-widest text-erp-navy flex items-center gap-2">
                                <Package size={16} /> PO Đang Chạy
                            </h3>
                            <Link href="/supplier/po" className="text-xs font-bold text-erp-blue hover:underline">Cập nhật tiến độ</Link>
                        </div>
                        <table className="erp-table text-xs m-0 !border-none">
                            <thead>
                                <tr>
                                    <th>Số PO</th>
                                    <th>Hàng hóa / Dịch vụ chính</th>
                                    <th className="text-center">Ngày yêu cầu</th>
                                    <th className="w-1/3">Tiến độ (ETA)</th>
                                </tr>
                            </thead>
                            <tbody>
                                {pos.map((po) => (
                                    <tr key={po.id} className="cursor-pointer hover:bg-slate-50 border-b border-slate-50" onClick={() => router.push(`/supplier/po`)}>
                                        <td className="font-bold text-erp-navy"><FileText size={12} className="inline mr-1 text-slate-400"/> {po.id}</td>
                                        <td>
                                            <div className="font-bold text-slate-700">{po.item}</div>
                                            <div className="text-[10px] text-slate-400 font-mono">x {po.qty} units</div>
                                        </td>
                                        <td className="text-center font-mono text-slate-500">{po.dateReq}</td>
                                        <td>
                                            <div className="flex items-center gap-2 text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">
                                                <span>{po.status}</span>
                                                <span className="ml-auto text-erp-blue">{po.progress}%</span>
                                            </div>
                                            <div className="budget-meter !h-1.5 bg-slate-100">
                                                <div className="bg-erp-blue h-full rounded-r-none transition-all duration-1000" style={{ width: `${po.progress}%` }}></div>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <div className="erp-card shadow-sm border border-slate-200 bg-gradient-to-br from-indigo-900 to-erp-navy text-white flex-1 flex flex-col justify-center items-center relative overflow-hidden p-8">
                        <div className="absolute top-0 right-0 p-4 opacity-10"><Zap size={120} /></div>
                        <h3 className="text-xs font-black uppercase tracking-widest text-white/50 mb-2 z-10">Doanh thu qua Platform (6 Tháng)</h3>
                        <div className="text-5xl font-black font-mono tracking-tighter mb-4 z-10 flex items-end gap-2">
                            4.51 <span className="text-2xl opacity-50 mb-1">Tỷ VNĐ</span>
                        </div>
                        <div className="flex gap-1 h-12 items-end z-10 opacity-50">
                            {[30, 45, 25, 60, 40, 80].map((h, i) => (
                                <div key={i} className="w-4 bg-white rounded-t-sm" style={{height: `${h}%`}}></div>
                            ))}
                        </div>
                        <p className="text-[10px] text-indigo-300 font-bold uppercase tracking-widest mt-6 z-10">Đối tác hạng Bạch Kim</p>
                    </div>
                </div>
            </div>
        </main>
    );
}
