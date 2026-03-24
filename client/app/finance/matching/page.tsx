"use client";

import React, { useState, useEffect } from "react";
import DashboardHeader from "../../components/DashboardHeader";
import { FileCheck, ShieldAlert, CheckCircle2, AlertTriangle, ArrowLeft, Send, Calendar, CreditCard } from "lucide-react";
import { useSearchParams, useRouter } from "next/navigation";

import { useProcurement } from "../../context/ProcurementContext";

export default function FinanceMatching() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const invId = searchParams.get("id");
    
    const { invoices, pos, grns, payInvoice, matchInvoice } = useProcurement();

    const invoice = invoices.find((i: any) => i.id === invId);
    const po = pos.find((p: any) => p.id === invoice?.poId);
    const grn = grns.find((g: any) => g.poId === po?.id);

    // Mock Dynamic Data: Let's assume exception if invoice total doesn't match PO total
    const isException = false;

    const items = po?.items.map((item: any) => {
        const grnQty = grn?.receivedItems[item.id] || 0;
        return {
            id: item.id,
            desc: item.description,
            po: { qty: item.qty, price: item.estimatedPrice || 0 },
            grn: { qty: grnQty },
            // Since we don't save invoice items line-by-line in context, we assume supplier invoiced what was received.
            inv: { qty: grnQty, price: item.estimatedPrice || 0 }, 
            matched: item.qty === grnQty,
            diffPct: item.qty === 0 ? 0 : ((grnQty - item.qty) / item.qty) * 100
        }
    }) || [];

    const [approvalState, setApprovalState] = useState<"IDLE"|"REVIEW"|"APPROVED">("IDLE");
    const [action, setAction] = useState("");
    const [note, setNote] = useState("");
    const [payDate, setPayDate] = useState("2026-04-15"); // Net 30
    const [payMethod, setPayMethod] = useState("Bank Transfer (VND)");

    const invoiceAmount = invoice?.amount || 0;
    const subTotal = invoiceAmount / 1.1;
    const vat = invoiceAmount - subTotal;

    const handleRejectFeedback = () => {
        if (invId) matchInvoice(invId, "EXCEPTION");
        alert("Đã gửi thông báo Reject/Debit Note tới Portal Nhà Cung Cấp!");
        router.push("/finance/dashboard");
    }

    const handleApprove = () => {
        if (invId) payInvoice(invId);
        alert("Thanh toán đã được xếp lịch. Lệnh chuyển UNC đã hoàn tất!");
        router.push("/finance/dashboard");
    }

    return (
        <main className="pt-16 px-8 pb-12 animate-in fade-in duration-300 min-h-screen bg-slate-50">
            <DashboardHeader breadcrumbs={["Kế toán", "Bàn làm việc Kế Toán", "3-Way Matching Queue", "Invoice Detail"]} />
            
            <div className="mt-8 mb-6 flex flex-col md:flex-row justify-between items-start md:items-end border-b border-slate-200 pb-4">
                <div className="flex items-center gap-4">
                    <button onClick={() => router.back()} className="w-10 h-10 bg-white border border-slate-200 rounded-full flex justify-center items-center text-slate-500 hover:text-erp-blue hover:border-erp-blue shadow-sm transition-all"><ArrowLeft size={16}/></button>
                    <div>
                        <div className="flex items-center gap-2 mb-1 text-[10px] font-black uppercase text-slate-500 tracking-widest">
                            Nhà CC: {invoice?.vendor || "N/A"} <span className="text-blue-500 bg-blue-50 px-2 rounded ml-2 border border-blue-200">Payment: Net 30</span>
                        </div>
                        <h1 className="text-3xl font-black text-erp-navy tracking-tight flex items-center gap-4">
                            Hóa Đơn {invId}
                            {isException ? (
                                <span className="text-[12px] uppercase font-black tracking-widest text-red-600 bg-red-100 px-4 py-1.5 border border-red-300 rounded-full shadow-sm flex items-center gap-1">
                                    <ShieldAlert size={14}/> EXCEPTION DETECTED
                                </span>
                            ) : (
                                <span className="text-[12px] uppercase font-black tracking-widest text-emerald-600 bg-emerald-100 px-4 py-1.5 border border-emerald-300 rounded-full shadow-sm flex items-center gap-1">
                                    <CheckCircle2 size={14}/> AUTO_MATCHED PASSED
                                </span>
                            )}
                        </h1>
                    </div>
                </div>
            </div>

            {/* 3-Way Panel Section */}
            <div className="space-y-6">
                <div className="erp-card shadow-sm border border-slate-200 bg-white !p-0 overflow-hidden">
                    <div className="p-4 bg-slate-800 border-b border-slate-700 flex justify-between items-center text-white">
                        <h3 className="text-sm font-black uppercase tracking-widest flex items-center gap-2">
                            <FileCheck size={16}/> 3-Way Matching Panel (Bảng Đối Soát 3 Cột)
                        </h3>
                    </div>
                    
                    <table className="erp-table text-xs m-0 w-full table-fixed">
                        <thead>
                            <tr className="bg-slate-50">
                                <th className="w-[20%] font-black uppercase tracking-widest text-[9px] text-slate-400">Hàng Hóa/Thông Số</th>
                                <th className="w-[25%] bg-blue-50/50 border-r border-l border-blue-100 text-center"><span className="text-[12px] font-black text-blue-800">1. PO (Lệnh Đặt Hàng)</span></th>
                                <th className="w-[25%] bg-orange-50/50 border-r border-orange-100 text-center"><span className="text-[12px] font-black text-orange-800">2. GRN (Kho Thực Nhận)</span></th>
                                <th className="w-[30%] bg-purple-50/50 border-purple-100 text-center"><span className="text-[12px] font-black text-purple-800">3. INVOICE (NCC Đòi Tiền)</span></th>
                            </tr>
                        </thead>
                        <tbody>
                            {items.map((item: any) => (
                                <tr key={item.id} className={`border-b ${item.matched ? 'border-slate-50 hover:bg-slate-50' : 'bg-red-50/30'}`}>
                                    <td className="font-bold text-slate-700 p-4 border-r border-slate-100">{item.desc}</td>
                                    <td className="p-4 text-center border-r border-slate-100 bg-blue-50/10">
                                        <div className="flex flex-col gap-1 items-center">
                                            <span className="font-mono font-black text-slate-500 bg-slate-100 px-2 py-0.5 rounded text-[10px]">SL: {item.po.qty}</span>
                                            <span className="font-mono text-[9px] text-slate-400">@ {item.po.price.toLocaleString()}</span>
                                        </div>
                                    </td>
                                    <td className="p-4 text-center border-r border-slate-100 bg-orange-50/10">
                                        <div className="flex flex-col gap-1 items-center justify-center">
                                            <span className={`font-mono font-black px-2 py-0.5 rounded text-[10px] ${item.matched ? 'text-slate-500 bg-slate-100' : 'text-red-600 bg-red-100 border border-red-200'}`}>
                                                SL: {item.grn.qty}
                                            </span>
                                            {!item.matched && <span className="text-[9px] font-bold text-red-500 mt-1">Thiếu {item.po.qty - item.grn.qty}</span>}
                                        </div>
                                    </td>
                                    <td className={`p-4 relative bg-purple-50/10 ${!item.matched ? 'bg-red-50/50 border-y border-r-2 border-red-300' : ''}`}>
                                        <div className="flex items-center justify-between">
                                            <div className="flex flex-col gap-1">
                                                <span className={`font-mono font-black px-2 py-0.5 rounded text-[10px] ${!item.matched ? 'text-red-700 bg-red-100' : 'text-slate-500 bg-slate-100'}`}>
                                                    SL: {item.inv.qty}
                                                </span>
                                                <span className="font-mono text-[9px] text-slate-400">@ {item.inv.price.toLocaleString()}</span>
                                            </div>
                                            <div className="text-right font-mono font-black text-erp-navy text-sm">
                                                {(item.inv.qty * item.inv.price).toLocaleString()} ₫
                                            </div>
                                        </div>
                                        {!item.matched && (
                                            <div className="absolute top-1 right-1 text-[9px] font-black bg-red-600 text-white px-1.5 py-0.5 rounded shadow-sm flex items-center gap-1">
                                                <AlertTriangle size={8}/> +Lệch {item.diffPct.toFixed(1)}% (Invoice &gt; GRN)
                                            </div>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    
                    <div className="p-6 bg-slate-50 border-t border-slate-200 flex justify-end gap-12">
                        <div className="text-right space-y-2">
                            <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Tổng trước thuế</p>
                            <p className="font-mono text-xl font-black text-slate-500">{subTotal.toLocaleString()} <span className="text-[10px]">VNĐ</span></p>
                        </div>
                        <div className="text-right space-y-2">
                            <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Thuế GTGT (10%)</p>
                            <p className="font-mono text-xl font-black text-slate-500">{vat.toLocaleString()} <span className="text-[10px]">VNĐ</span></p>
                        </div>
                        <div className="text-right space-y-2">
                            <p className="text-[10px] font-black uppercase text-erp-blue tracking-widest border-b border-erp-blue pb-1 mb-1 inline-block">Tổng Yêu Cầu T/T (Invoice)</p>
                            <p className="font-mono text-3xl font-black text-erp-navy">{(subTotal + vat).toLocaleString()} <span className="text-xs">VNĐ</span></p>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-8">
                    {/* Resolution (8.2) */}
                    {isException ? (
                        <div className="erp-card shadow-sm border border-red-200 bg-red-50/50">
                            <h3 className="text-sm font-black uppercase tracking-widest text-red-900 mb-6 flex items-center gap-2 border-b border-red-100 pb-2">
                                <AlertTriangle size={16}/> Exception Resolution (Xử lý Lệch)
                            </h3>
                            <div className="space-y-4">
                                <div>
                                    <label className="text-[10px] font-black uppercase text-red-700 tracking-widest mb-2 block">Action Áp Dụng (Point to NCC)</label>
                                    <select className="erp-input w-full font-bold text-xs bg-white focus:border-red-500 focus:ring-red-200 text-slate-700" value={action} onChange={e=>setAction(e.target.value)}>
                                        <option value="">-- Chọn hướng xử lý --</option>
                                        <option value="DebitNote">Request Credit Note (-5,000,000đ)</option>
                                        <option value="Accept">Accept Difference (Tolerance: Finance QĐ)</option>
                                        <option value="Reject">Reject Invoice (Báo NCC xuất lại)</option>
                                    </select>
                                </div>
                                <div className="mt-4">
                                    <label className="text-[10px] font-black uppercase text-red-700 tracking-widest mb-2 block">Feedback gửi NCC & Manager (Ghi chú)</label>
                                    <textarea className="erp-input w-full min-h-[100px] text-xs bg-white focus:border-red-500 focus:ring-red-200" placeholder="Lý do Reject / Credit Note..." value={note} onChange={e=>setNote(e.target.value)}></textarea>
                                </div>
                            </div>
                            <div className="mt-6 flex justify-end gap-4">
                                <button className="btn-primary bg-red-600 hover:bg-red-500 shadow-xl shadow-red-600/20 uppercase tracking-widest text-[10px] py-4 px-8 border-none flex items-center gap-2" onClick={handleRejectFeedback}>
                                    <Send size={16}/> Gửi Cảnh Cáo
                                </button>
                                {action === "Accept" && (
                                    <button className="btn-primary bg-indigo-600 hover:bg-indigo-500 shadow-xl shadow-indigo-600/20 uppercase tracking-widest text-[10px] py-4 px-8 border-none flex items-center gap-2" onClick={() => setApprovalState("REVIEW")}>
                                        <CheckCircle2 size={16}/> Override Tolerance (Chấp Nhận Lệch)
                                    </button>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="erp-card shadow-sm border border-emerald-200 bg-emerald-50/50 flex flex-col items-center justify-center text-emerald-800 text-center py-12">
                            <CheckCircle2 size={48} className="mx-auto mb-4 opacity-50" />
                            <h3 className="text-xl font-black uppercase tracking-widest mb-2">Hoàn Toàn Khớp (Matched)</h3>
                            <p className="text-xs font-bold opacity-70">Có thể duyệt ngày thanh toán cho hóa đơn này.</p>
                        </div>
                    )}

                    {/* Lên Lịch / Duyệt Thanh toán (8.2) */}
                    <div className={`erp-card shadow-lg ${(!isException || action === "Accept") ? 'border-erp-blue/20 bg-white' : 'opacity-50 pointer-events-none grayscale'}`}>
                         <h3 className="text-sm font-black uppercase tracking-widest text-erp-navy mb-6 flex items-center gap-2 border-b border-slate-100 pb-2">
                             <CreditCard size={16}/> Lên Lịch & Phê Duyệt Thanh Toán (AP)
                         </h3>
                         <div className="space-y-4 text-xs font-bold text-slate-600">
                             <div>
                                 <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest mb-2 block flex items-center gap-1"><Calendar size={12}/> Ngày T/T Dự kiến (PO Term: Net 30)</label>
                                 <input type="date" className="erp-input w-full font-mono font-black text-emerald-600 bg-slate-50 focus:bg-white focus:border-emerald-500" value={payDate} onChange={e=>setPayDate(e.target.value)} />
                             </div>
                             <div>
                                 <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest mb-2 block flex items-center gap-1"><CreditCard size={12}/> Phương thức Bank</label>
                                 <select className="erp-input w-full font-mono bg-slate-50 text-slate-700 focus:bg-white" value={payMethod} onChange={e=>setPayMethod(e.target.value)}>
                                     <option value="Bank Transfer (VND)">Bank Transfer (Techcombank VND)</option>
                                     <option value="LC">Thư Tín Dụng (L/C)</option>
                                     <option value="Cash">Tiền Mặt</option>
                                 </select>
                             </div>
                             
                             <div className="pt-6 mt-4 border-t border-slate-100">
                                 <button onClick={handleApprove} className="w-full btn-primary bg-erp-navy hover:bg-erp-blue border-none py-4 uppercase tracking-widest text-sm font-black shadow-xl shadow-erp-navy/30 flex justify-center items-center gap-2">
                                     Phê Duyệt Lệnh Thanh Toán
                                 </button>
                                 <p className="text-[9px] text-center font-bold text-slate-400 mt-3 px-8">Hành động này sẽ Schedule chứng từ vào hàng chờ chạy Bank. Require Manager OTP Approval.</p>
                             </div>
                         </div>
                    </div>
                </div>

            </div>
        </main>
    );
}
