"use client";

import React, { useState } from "react";
import DashboardHeader from "../../components/DashboardHeader";
import { Inbox, FileText, UploadCloud, Send, MessageSquare, ChevronDown, CheckCircle } from "lucide-react";

import { useProcurement } from "../../context/ProcurementContext";

export default function SupplierRFQ() {
    const { rfqs, submitQuotation } = useProcurement();
    const [viewState, setViewState] = useState<"LIST" | "DETAIL">("LIST");
    const [selectedRfqId, setSelectedRfqId] = useState<string | null>(null);
    
    const openRfqs = rfqs.filter(r => r.status === "OPEN");
    const activeRFQ = selectedRfqId ? rfqs.find(r => r.id === selectedRfqId) : openRfqs[0];

    const [prices, setPrices] = useState<Record<string, string>>({});
    const [leadTime, setLeadTime] = useState("");
    const [paymentTerms, setPaymentTerms] = useState("Net 30");

    const handleSubmit = () => {
        if (!activeRFQ) return;
        
        let total = 0;
        const pricesObj: Record<string, number> = {};
        activeRFQ.items.forEach(item => {
            const val = Number(prices[item.id]) || 0;
            pricesObj[item.id] = val;
            total += val * item.qty;
        });

        submitQuotation(activeRFQ.id, {
            prices: pricesObj,
            leadTime,
            paymentTerms,
            total
        });

        alert("Báo giá đã được gửi tới Buyer. Trạng thái RFQ đã cập nhật thành QUOTED.");
        setViewState("LIST");
    };

    if (viewState === "DETAIL" && activeRFQ) {
        return (
            <main className="pt-16 px-8 pb-12 animate-in fade-in duration-300 bg-slate-50 min-h-screen">
                <DashboardHeader breadcrumbs={["Bàn làm việc B2B", "Chi tiết RFQ"]} />
                
                <div className="mt-8 mb-6 flex justify-between items-end">
                    <div>
                        <div className="flex items-center gap-2 mb-2 text-[10px] font-black uppercase tracking-widest text-slate-500">
                            <span className="bg-red-500 text-white px-2 py-1 rounded">Sắp hết hạn</span> Hạn nộp: {new Date().toLocaleDateString()}
                        </div>
                        <h1 className="text-3xl font-black text-erp-navy tracking-tight">{activeRFQ.id} - Phụ kiện tự động hóa</h1>
                        <p className="text-sm font-bold text-slate-500 mt-1">Từ: Cửa hàng trung tâm</p>
                    </div>
                    <div className="text-right">
                        <div className="text-[10px] font-black uppercase text-erp-blue tracking-widest bg-blue-100 px-3 py-1.5 rounded-lg border border-blue-200 shadow-sm inline-flex items-center gap-2">
                            <Inbox size={14}/> RFQ
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                    {/* Cột trái: Thông tin RFQ & Q&A */}
                    <div className="space-y-6">
                        <div className="erp-card shadow-sm border border-slate-200">
                            <h3 className="text-xs font-black uppercase tracking-widest text-erp-navy mb-4 border-b border-slate-100 pb-2">
                                Yêu cầu kỹ thuật & File đính kèm
                            </h3>
                            <p className="text-sm text-slate-600 mb-6 leading-relaxed font-medium">
                                Xin vui lòng báo giá cho các mã sản phẩm yêu cầu bên dưới.
                            </p>
                            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex justify-between items-center cursor-pointer hover:bg-slate-100">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-white text-erp-navy rounded shadow-sm"><FileText size={16}/></div>
                                    <div className="text-xs font-bold text-slate-700">Spec_Requirement.pdf</div>
                                </div>
                                <div className="text-[10px] font-black uppercase text-erp-blue">Tải xuống</div>
                            </div>
                        </div>

                        <div className="erp-card shadow-sm border border-slate-200 flex flex-col h-[400px]">
                            <h3 className="text-xs font-black uppercase tracking-widest text-erp-navy mb-4 border-b border-slate-100 pb-2 flex items-center justify-between">
                                Q&A Thread 
                                <span className="bg-slate-100 px-2 py-0.5 rounded text-[10px] text-slate-400">Ẩn danh NCC</span>
                            </h3>
                            <div className="flex-1 overflow-y-auto space-y-4 pr-2 custom-scrollbar">
                                <div className="bg-slate-50 p-3 rounded-tr-none rounded-xl border border-slate-200 ml-8 text-xs text-slate-600 font-medium">
                                    <div className="font-bold text-slate-400 text-[9px] uppercase mb-1">NCC Khác</div>
                                    Xin hỏi yêu cầu thông số kỹ thuật là gì?
                                </div>
                                <div className="bg-blue-50 p-3 rounded-tl-none rounded-xl border border-blue-200 mr-8 text-xs text-erp-navy font-medium">
                                    <div className="font-bold text-erp-blue text-[9px] uppercase mb-1">Buyer (ProcurePro)</div>
                                    Vui lòng báo loại tiêu chuẩn mới nhất.
                                </div>
                            </div>
                            <div className="mt-4 pt-4 border-t border-slate-100 relative">
                                <input type="text" className="erp-input w-full pr-10 bg-slate-50 text-xs" placeholder="Đặt câu hỏi làm rõ spec..." />
                                <button className="absolute right-3 top-1/2 -translate-y-1/2 text-erp-blue"><Send size={16}/></button>
                            </div>
                        </div>
                    </div>

                    {/* Cột phải: Form Báo giá */}
                    <div className="xl:col-span-2 space-y-6">
                        <div className="erp-card shadow-sm border border-slate-200 bg-white">
                            <h3 className="text-sm font-black uppercase tracking-widest text-erp-navy mb-6 flex items-center gap-2">
                                <FileText size={16}/> Bảng báo giá (Quotation Form)
                            </h3>
                            
                            <table className="erp-table text-xs m-0 border border-slate-200 shadow-sm rounded-xl mb-6">
                                <thead className="bg-slate-50">
                                    <tr>
                                        <th>Hạng mục hàng hóa</th>
                                        <th className="text-center w-20">SL</th>
                                        <th className="w-48 text-right">Đơn giá (VNĐ)</th>
                                        <th className="w-1/4">Ghi chú SP đề xuất</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {activeRFQ.items.map(item => (
                                        <tr key={item.id} className="border-b border-slate-100 hover:bg-slate-50 group">
                                            <td className="font-bold text-slate-700">{item.description}</td>
                                            <td className="text-center font-mono font-black">{item.qty} {item.unit}</td>
                                            <td className="text-right">
                                                <input 
                                                    type="number" 
                                                    className="erp-input w-full text-right font-mono text-emerald-600 font-black focus:border-emerald-500 bg-slate-50 group-hover:bg-white" 
                                                    placeholder="0"
                                                    value={prices[item.id] || ""}  
                                                    onChange={e => setPrices({...prices, [item.id]: e.target.value})}
                                                />
                                            </td>
                                            <td>
                                                <input type="text" className="erp-input w-full text-[10px] bg-slate-50 group-hover:bg-white" placeholder="Model, xuất xứ..." />
                                            </td>
                                        </tr>
                                    ))}
                                    <tr className="bg-slate-100/50">
                                        <td colSpan={2} className="text-right font-black text-slate-500 uppercase tracking-widest py-4">Tổng tiền nháp:</td>
                                        <td className="text-right font-black font-mono text-erp-navy text-lg py-4">
                                            {(() => {
                                                const total = activeRFQ.items.reduce((sum, item) => {
                                                    const priceVal = Number(prices[item.id]) || 0;
                                                    return sum + (priceVal * item.qty);
                                                }, 0);
                                                return total.toLocaleString();
                                            })()} ₫
                                        </td>
                                        <td></td>
                                    </tr>
                                </tbody>
                            </table>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50 p-6 rounded-2xl border border-slate-200">
                                <div>
                                    <label className="block text-[10px] font-black uppercase text-slate-500 tracking-widest mb-2">Thủ tục Thanh toán</label>
                                    <select className="erp-input w-full bg-white" value={paymentTerms} onChange={e => setPaymentTerms(e.target.value)}>
                                        <option value="Net 30">Net 30 (Chấp nhận)</option>
                                        <option value="Net 45">Net 45 (Lợi thế cạnh tranh)</option>
                                        <option value="Advanced 100%">Trả trước 100% (Mất điểm hệ thống)</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black uppercase text-slate-500 tracking-widest mb-2">Lead time (Ngày giao hàng)</label>
                                    <input type="number" className="erp-input w-full bg-white font-mono" placeholder="Vd: 14" value={leadTime} onChange={e => setLeadTime(e.target.value)} />
                                </div>
                            </div>
                            
                            <div className="mt-6 border-2 border-dashed border-emerald-200 rounded-xl p-8 text-center hover:bg-emerald-50 cursor-pointer group transition-colors">
                                <UploadCloud size={32} className="mx-auto text-emerald-400 group-hover:text-emerald-500 mb-2 transition-colors" />
                                <div className="text-sm font-bold text-emerald-800">Upload Báo giá chính thức (Bản Scan dấu mộc)</div>
                                <div className="text-[10px] font-black text-emerald-600/60 uppercase tracking-widest mt-1">Bắt buộc File PDF (Max 25MB)</div>
                            </div>
                        </div>

                        {/* Action Submit */}
                        <div className="erp-card shadow-lg bg-emerald-900 border-2 border-emerald-800 text-white flex justify-between items-center overflow-hidden relative">
                            <div className="absolute -left-10 top-1/2 -translate-y-1/2 opacity-10"><Send size={150}/></div>
                            <div className="relative z-10">
                                <h3 className="text-sm font-black uppercase tracking-widest mb-1 flex items-center gap-2"><CheckCircle size={16}/> Cam kết Submission</h3>
                                <p className="text-[10px] font-bold text-emerald-300 max-w-sm">Tôi xác nhận báo giá tuân thủ quy định Anti-bribery & Code of Conduct của hệ thống ProcurePro.</p>
                            </div>
                            <div className="relative z-10 flex gap-4">
                                <button className="px-6 py-3 border border-emerald-700 hover:bg-emerald-800 text-emerald-100 font-black uppercase tracking-widest text-[10px] rounded-xl transition-colors">Lưu DRAFT</button>
                                <button onClick={handleSubmit} className="px-8 py-3 bg-emerald-500 hover:bg-emerald-400 text-emerald-950 shadow-xl shadow-emerald-500/20 font-black uppercase tracking-widest text-xs rounded-xl flex items-center gap-2 transition-all">Submit Báo Giá</button>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        )
    }

    return (
        <main className="pt-16 px-8 pb-12">
            <DashboardHeader breadcrumbs={["Nhà cung cấp", "Danh sách Yêu cầu báo giá"]} />
            <div className="mt-8 mb-8">
                <h1 className="text-3xl font-black text-erp-navy tracking-tight">Thư mời (RFQ) cần báo giá</h1>
            </div>

            <div className="erp-card !p-0 overflow-hidden shadow-sm border border-slate-200">
                <table className="erp-table text-xs m-0">
                    <thead className="bg-slate-50">
                        <tr>
                            <th>Số RFQ</th>
                            <th>Khách hàng</th>
                            <th>Hạng mục tóm tắt</th>
                            <th>Hạn nộp</th>
                            <th className="text-center">Countdown</th>
                            <th className="text-right">Hành động</th>
                        </tr>
                    </thead>
                    <tbody>
                        {openRfqs.map(r => (
                            <tr key={r.id} className="hover:bg-slate-50 border-b border-slate-100 cursor-pointer" onClick={() => { setSelectedRfqId(r.id); setViewState("DETAIL"); }}>
                                <td className="font-bold text-erp-navy">{r.id}</td>
                                <td className="font-bold text-slate-700">ProcurePro (Buyer)</td>
                                <td className="text-slate-500 truncate max-w-[200px]" title="Mua vật tư">Mua vật tư từ {r.prId}</td>
                                <td className="font-mono">{r.createdAt}</td>
                                <td className="text-center">
                                    <span className="bg-red-50 text-red-600 border border-red-200 font-black uppercase text-[9px] px-2 py-1 rounded tracking-widest animate-pulse">20h 15m</span>
                                </td>
                                <td className="text-right">
                                    <button className="text-[10px] font-black uppercase tracking-widest text-erp-blue flex items-center gap-1 ml-auto">Xem chi tiết & Báo giá <ChevronDown size={14} className="-rotate-90"/></button>
                                </td>
                            </tr>
                        ))}
                        {openRfqs.length === 0 && (
                            <tr>
                                <td colSpan={6} className="text-center py-12 text-slate-400 font-bold uppercase tracking-widest">
                                    Chưa có thư mời thầu (RFQ) nào.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </main>
    );
}
