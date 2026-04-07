"use client";

import React, { useState } from "react";
import DashboardHeader from "../../components/DashboardHeader";
import { FileCheck, ShieldAlert, CheckCircle2, AlertTriangle, ArrowLeft, Send, Calendar, CreditCard } from "lucide-react";
import { useSearchParams, useRouter } from "next/navigation";

import { useProcurement, PO, POItem, GRN, Invoice } from "../../context/ProcurementContext";
import { formatVND } from "../../utils/formatUtils";

interface MatchItem {
    id: string;
    desc: string;
    po: { qty: number, price: number };
    grn: { qty: number };
    inv: { qty: number, price: number };
    matched: boolean;
    diffPct: number;
}

export default function FinanceMatching() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const invId = searchParams.get("id");
    
    const { invoices, pos, grns, payInvoice, matchInvoice } = useProcurement();

    const invoice = invoices.find((i: Invoice) => i.id === invId);
    const po = pos.find((p: PO) => p.id === invoice?.poId);
    const grn = grns.find((g: GRN) => g.poId === po?.id);

    // Mock Dynamic Data: Let's assume exception if invoice total doesn't match PO total
    const isException = false;

    const items: MatchItem[] = po?.items.map((item: POItem) => {
        const grnQty = grn?.receivedItems[item.id] || 0;
        return {
            id: item.id,
            desc: item.description,
            po: { qty: item.qty, price: item.estimatedPrice || 0 },
            grn: { qty: grnQty },
            inv: { qty: grnQty, price: item.estimatedPrice || 0 }, 
            matched: item.qty === grnQty,
            diffPct: item.qty === 0 ? 0 : ((grnQty - item.qty) / item.qty) * 100
        };
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
        if (invId) matchInvoice(invId);
        alert("Đã gửi thông báo Reject/Debit Note tới Portal Nhà Cung Cấp!");
        router.push("/finance/dashboard");
    };

    const handleApprove = () => {
        if (invId) payInvoice(invId);
        alert("Thanh toán đã được xếp lịch. Lệnh chuyển UNC đã hoàn tất!");
        router.push("/finance/dashboard");
    };

    return (
        <main className="pt-16 px-8 pb-12 animate-in fade-in duration-300 min-h-screen bg-[#0F1117] text-[#F8FAFC]">
            <DashboardHeader breadcrumbs={["Kế toán", "Bàn làm việc Kế Toán", "3-Way Matching Queue", "Invoice Detail"]} />
            
            <div className="mt-8 mb-6 flex flex-col md:flex-row justify-between items-start md:items-end border-b border-[rgba(148,163,184,0.1)] pb-4">
                <div className="flex items-center gap-4">
                    <button onClick={() => router.back()} className="w-10 h-10 bg-[#161922] border border-[rgba(148,163,184,0.1)] rounded-full flex justify-center items-center text-[#64748B] hover:text-[#F8FAFC] hover:border-[#3B82F6]/30 shadow-sm transition-all"><ArrowLeft size={16}/></button>
                    <div>
                        <div className="flex items-center gap-2 mb-1 text-[10px] font-black uppercase text-[#64748B] tracking-widest">
                            Nhà CC: {invoice?.vendor || "N/A"} <span className="text-[#3B82F6] bg-[#3B82F6]/10 px-2 rounded ml-2 border border-[#3B82F6]/20">Payment: Net 30</span>
                        </div>
                        <h1 className="text-3xl font-black text-[#F8FAFC] tracking-tight flex items-center gap-4">
                            Hóa Đơn {invId}
                            {isException ? (
                                <span className="text-[12px] uppercase font-black tracking-widest text-rose-400 bg-rose-500/10 px-4 py-1.5 border border-rose-500/20 rounded-full shadow-sm flex items-center gap-1">
                                    <ShieldAlert size={14}/> EXCEPTION DETECTED
                                </span>
                            ) : (
                                <span className="text-[12px] uppercase font-black tracking-widest text-emerald-400 bg-emerald-500/10 px-4 py-1.5 border border-emerald-500/20 rounded-full shadow-sm flex items-center gap-1">
                                    <CheckCircle2 size={14}/> AUTO_MATCHED PASSED
                                </span>
                            )}
                        </h1>
                    </div>
                </div>
            </div>

            {/* 3-Way Panel Section */}
            <div className="space-y-6">
                <div className="bg-[#161922] rounded-2xl border border-[rgba(148,163,184,0.1)] shadow-xl shadow-[#3B82F6]/5 !p-0 overflow-hidden">
                    <div className="p-4 bg-[#0F1117] border-b border-[rgba(148,163,184,0.1)] flex justify-between items-center text-[#F8FAFC]">
                        <h3 className="text-sm font-black uppercase tracking-widest flex items-center gap-2">
                            <FileCheck size={16}/> 3-Way Matching Panel (Bảng Đối Soát 3 Cột)
                        </h3>
                    </div>
                    
                    <div className="bg-[#161922]">
                        <table className="erp-table text-xs m-0 w-full table-fixed">
                            <thead>
                                <tr className="bg-[#0F1117]">
                                    <th className="w-[20%] font-black uppercase tracking-widest text-[9px] text-[#64748B]">Hàng Hóa/Thông Số</th>
                                    <th className="w-[25%] bg-[#3B82F6]/10 border-r border-l border-[#3B82F6]/20 text-center"><span className="text-[12px] font-black text-[#3B82F6]">1. PO (Lệnh Đặt Hàng)</span></th>
                                    <th className="w-[25%] bg-amber-500/10 border-r border-amber-500/20 text-center"><span className="text-[12px] font-black text-amber-400">2. GRN (Kho Thực Nhận)</span></th>
                                    <th className="w-[30%] bg-purple-500/10 border-purple-500/20 text-center"><span className="text-[12px] font-black text-purple-400">3. INVOICE (NCC Đòi Tiền)</span></th>
                                </tr>
                            </thead>
                            <tbody>
                                {items.map((item: MatchItem) => (
                                    <tr key={item.id} className={`border-b ${item.matched ? 'border-[rgba(148,163,184,0.1)] hover:bg-[#0F1117]' : 'bg-rose-500/5'}`}>
                                        <td className="font-bold text-[#F8FAFC] p-4 border-r border-[rgba(148,163,184,0.1)]">{item.desc}</td>
                                        <td className="p-4 text-center border-r border-[rgba(148,163,184,0.1)] bg-[#3B82F6]/5">
                                            <div className="flex flex-col gap-1 items-center">
                                                <span className="font-black text-[#94A3B8] bg-[#0F1117] px-2 py-0.5 rounded text-[10px] border border-[rgba(148,163,184,0.1)]">SL: {item.po.qty}</span>
                                                <span className="text-[9px] text-[#64748B]">@ {formatVND(item.po.price)}</span>
                                            </div>
                                        </td>
                                        <td className="p-4 text-center border-r border-[rgba(148,163,184,0.1)] bg-amber-500/5">
                                            <div className="flex flex-col gap-1 items-center justify-center">
                                                <span className={`font-black px-2 py-0.5 rounded text-[10px] ${item.matched ? 'text-[#94A3B8] bg-[#0F1117] border border-[rgba(148,163,184,0.1)]' : 'text-rose-400 bg-rose-500/10 border border-rose-500/20'}`}>
                                                    SL: {item.grn.qty}
                                                </span>
                                                {!item.matched && <span className="text-[9px] font-bold text-rose-400 mt-1">Thiếu {item.po.qty - item.grn.qty}</span>}
                                            </div>
                                        </td>
                                        <td className={`p-4 relative bg-purple-500/5 ${!item.matched ? 'bg-rose-500/5 border-y border-r-2 border-rose-500/30' : ''}`}>
                                            <div className="flex items-center justify-between">
                                                <div className="flex flex-col gap-1">
                                                    <span className={`font-black px-2 py-0.5 rounded text-[10px] ${!item.matched ? 'text-rose-400 bg-rose-500/10 border border-rose-500/20' : 'text-[#94A3B8] bg-[#0F1117] border border-[rgba(148,163,184,0.1)]'}`}>
                                                        SL: {item.inv.qty}
                                                    </span>
                                                    <span className="text-[9px] text-[#64748B]">@ {formatVND(item.inv.price)}</span>
                                                </div>
                                                <div className="text-right font-black text-[#F8FAFC] text-sm">
                                                    {formatVND(item.inv.qty * item.inv.price)} ₫
                                                </div>
                                            </div>
                                            {!item.matched && (
                                                <div className="absolute top-1 right-1 text-[9px] font-black bg-rose-500 text-white px-1.5 py-0.5 rounded shadow-sm flex items-center gap-1">
                                                    <AlertTriangle size={8}/> +Lệch {item.diffPct.toFixed(1)}% (Invoice &gt; GRN)
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    
                    <div className="p-6 bg-[#0F1117] border-t border-[rgba(148,163,184,0.1)] flex justify-end gap-12">
                        <div className="text-right space-y-2">
                            <p className="text-[10px] font-black uppercase text-[#64748B] tracking-widest">Tổng trước thuế</p>
                            <p className="text-xl font-black text-[#94A3B8]">{subTotal.toLocaleString()} <span className="text-[10px]">VNĐ</span></p>
                        </div>
                        <div className="text-right space-y-2">
                            <p className="text-[10px] font-black uppercase text-[#64748B] tracking-widest">Thuế GTGT (10%)</p>
                            <p className="text-xl font-black text-[#94A3B8]">{vat.toLocaleString()} <span className="text-[10px]">VNĐ</span></p>
                        </div>
                        <div className="text-right space-y-2">
                            <p className="text-[10px] font-black uppercase text-[#3B82F6] tracking-widest border-b border-[#3B82F6]/30 pb-1 mb-1 inline-block">Tổng Yêu Cầu T/T (Invoice)</p>
                            <p className="text-3xl font-black text-[#F8FAFC]">{(subTotal + vat).toLocaleString()} <span className="text-xs">VNĐ</span></p>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-8">
                    {/* Resolution (8.2) */}
                    {isException ? (
                        <div className="bg-[#161922] rounded-2xl border border-rose-500/20 shadow-xl shadow-rose-500/5">
                            <h3 className="text-sm font-black uppercase tracking-widest text-rose-400 mb-6 flex items-center gap-2 border-b border-rose-500/20 pb-2">
                                <AlertTriangle size={16}/> Exception Resolution (Xử lý Lệch)
                            </h3>
                            <div className="space-y-4">
                                <div>
                                    <label className="text-[10px] font-black uppercase text-rose-400 tracking-widest mb-2 block">Action Áp Dụng (Point to NCC)</label>
                                    <select className="w-full bg-[#0F1117] border border-[rgba(148,163,184,0.1)] rounded-lg px-4 py-3 font-bold text-xs text-[#F8FAFC] focus:outline-none focus:border-rose-500/30" value={action} onChange={e=>setAction(e.target.value)}>
                                        <option value="">-- Chọn hướng xử lý --</option>
                                        <option value="DebitNote">Request Credit Note (-5,000,000đ)</option>
                                        <option value="Accept">Accept Difference (Tolerance: Finance QĐ)</option>
                                        <option value="Reject">Reject Invoice (Báo NCC xuất lại)</option>
                                    </select>
                                </div>
                                <div className="mt-4">
                                    <label className="text-[10px] font-black uppercase text-rose-400 tracking-widest mb-2 block">Feedback gửi NCC & Manager (Ghi chú)</label>
                                    <textarea className="w-full bg-[#0F1117] border border-[rgba(148,163,184,0.1)] rounded-lg px-4 py-3 text-xs text-[#F8FAFC] placeholder:text-[#64748B] min-h-25 focus:outline-none focus:border-rose-500/30" placeholder="Lý do Reject / Credit Note..." value={note} onChange={e=>setNote(e.target.value)}></textarea>
                                </div>
                            </div>
                            <div className="mt-6 flex justify-end gap-4">
                                <button className="bg-rose-500 hover:bg-rose-600 text-white px-8 py-4 rounded-xl font-black uppercase tracking-widest text-[10px] shadow-lg shadow-rose-500/20 transition-all flex items-center gap-2" onClick={handleRejectFeedback}>
                                    <Send size={16}/> Gửi Cảnh Cáo
                                </button>
                                {action === "Accept" && (
                                    <button className="bg-indigo-500 hover:bg-indigo-600 text-white px-8 py-4 rounded-xl font-black uppercase tracking-widest text-[10px] shadow-lg shadow-indigo-500/20 transition-all flex items-center gap-2" onClick={() => setApprovalState("REVIEW")}>
                                        <CheckCircle2 size={16}/> Override Tolerance (Chấp Nhận Lệch)
                                    </button>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="bg-[#161922] rounded-2xl border border-emerald-500/20 shadow-xl shadow-emerald-500/5 flex flex-col items-center justify-center text-emerald-400 text-center py-12">
                            <CheckCircle2 size={48} className="mx-auto mb-4 opacity-50" />
                            <h3 className="text-xl font-black uppercase tracking-widest mb-2">Hoàn Toàn Khớp (Matched)</h3>
                            <p className="text-xs font-bold opacity-70">Có thể duyệt ngày thanh toán cho hóa đơn này.</p>
                        </div>
                    )}

                    {/* Lên Lịch / Duyệt Thanh toán (8.2) */}
                    <div className={`bg-[#161922] rounded-2xl border border-[rgba(148,163,184,0.1)] shadow-xl shadow-[#3B82F6]/5 ${(!isException || action === "Accept") ? '' : 'opacity-50 pointer-events-none grayscale'}`}>
                         <h3 className="text-sm font-black uppercase tracking-widest text-[#F8FAFC] mb-6 flex items-center gap-2 border-b border-[rgba(148,163,184,0.1)] pb-2">
                             <CreditCard size={16}/> Lên Lịch & Phê Duyệt Thanh Toán (AP)
                         </h3>
                         <div className="space-y-4 text-xs font-bold text-[#94A3B8]">
                             <div>
                                 <label className="text-[10px] font-black uppercase text-[#64748B] tracking-widest mb-2 block items-center gap-1"><Calendar size={12}/> Ngày T/T Dự kiến (PO Term: Net 30)</label>
                                 <div className="relative">
                                     <input 
                                         type="text" 
                                         readOnly
                                         className="w-full bg-[#0F1117] border border-[rgba(148,163,184,0.1)] rounded-lg px-4 py-3 font-black text-emerald-400 focus:outline-none focus:border-emerald-500/30 h-10" 
                                         value={payDate ? (() => {
                                             const [y, m, d] = payDate.split('-');
                                             return `${d}-${m}-${y}`;
                                         })() : ""} 
                                     />
                                     <input 
                                         type="date" 
                                         className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                                         value={payDate} 
                                         onChange={e=>setPayDate(e.target.value)} 
                                     />
                                 </div>
                             </div>
                             <div>
                                 <label className="text-[10px] font-black uppercase text-[#64748B] tracking-widest mb-2 block items-center gap-1"><CreditCard size={12}/> Phương thức Bank</label>
                                 <select className="w-full bg-[#0F1117] border border-[rgba(148,163,184,0.1)] rounded-lg px-4 py-3 text-xs text-[#F8FAFC] focus:outline-none focus:border-[#3B82F6]/30" value={payMethod} onChange={e=>setPayMethod(e.target.value)}>
                                     <option value="Bank Transfer (VND)">Bank Transfer (Techcombank VND)</option>
                                     <option value="LC">Thư Tín Dụng (L/C)</option>
                                     <option value="Cash">Tiền Mặt</option>
                                 </select>
                             </div>
                             
                             <div className="pt-6 mt-4 border-t border-[rgba(148,163,184,0.1)]">
                                 <button onClick={handleApprove} className="w-full bg-[#3B82F6] hover:bg-[#2563EB] text-white px-8 py-4 rounded-xl font-black uppercase tracking-widest text-sm shadow-lg shadow-[#3B82F6]/20 transition-all flex justify-center items-center gap-2">
                                     Phê Duyệt Lệnh Thanh Toán
                                 </button>
                                 <p className="text-[9px] text-center font-bold text-[#64748B] mt-3 px-8">Hành động này sẽ Schedule chứng từ vào hàng chờ chạy Bank. Require Manager OTP Approval.</p>
                             </div>
                         </div>
                    </div>
                </div>

            </div>
        </main>
    );
}
