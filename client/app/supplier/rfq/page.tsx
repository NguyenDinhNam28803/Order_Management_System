"use client";

import React, { useState } from "react";
import DashboardHeader from "../../components/DashboardHeader";
import { Inbox, FileText, UploadCloud, Send, MessageSquare, ChevronDown, CheckCircle, Info } from "lucide-react";

import { useProcurement, RFQ, PR, PRItem } from "../../context/ProcurementContext";

export default function SupplierRFQ() {
    const { currentUser, rfqs, prs, createQuote, notify } = useProcurement();
    const [viewState, setViewState] = useState<"LIST" | "DETAIL">("LIST");
    const [selectedRfqId, setSelectedRfqId] = useState<string | null>(null);
    
    // Filter RFQs for this supplier and status is SENT (Initial)
    const openRfqs = rfqs.filter((r: RFQ) =>
        (r.status === "SENT" || r.status === "OPEN") && 
        (r.vendor?.toLowerCase().includes(currentUser?.name?.toLowerCase() || "") || 
         r.vendor?.toLowerCase().includes(currentUser?.fullName?.toLowerCase() || "") ||
         currentUser?.role === "PLATFORM_ADMIN")
    );
    
    const activeRFQRaw = selectedRfqId ? rfqs.find((r: RFQ) => r.id === selectedRfqId) : (openRfqs.length > 0 ? openRfqs[0] : null);
    const relatedPR = activeRFQRaw ? prs.find((p: PR) => p.id === activeRFQRaw.prId || p.prNumber === activeRFQRaw.prId) : null;
    const activeRFQ = activeRFQRaw ? { 
        ...activeRFQRaw, 
        items: relatedPR?.items && relatedPR.items.length > 0 ? relatedPR.items : (activeRFQRaw.items || []) 
    } as RFQ : null;

    const [prices, setPrices] = useState<Record<string, string>>({});
    const [leadTime, setLeadTime] = useState("");
    const [paymentTerms, setPaymentTerms] = useState("Net 30");

    const handleSubmit = () => {
        if (!activeRFQ) return;
        
        let total = 0;
        const pricesObj: Record<string, number> = {};
        (activeRFQ.items || []).forEach((item: PRItem) => {
            if (!item.id) return;
            const val = Number(prices[item.id]) || 0;
            pricesObj[item.id] = val;
            total += val * (item.qty || item.quantity || 0);
        });

        createQuote(activeRFQ.id, {
            prices: pricesObj,
            leadTime,
            paymentTerms,
            total
        });
        
        notify(`Báo giá cho RFQ ${activeRFQ.id} đã được gửi thành công!`, "success");
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
                        {/* NEW: THÔNG TIN PR THAM CHIẾU PANEL */}
                        <div className="erp-card shadow-sm border border-slate-200 bg-white overflow-hidden">
                            <h3 className="text-xs font-black uppercase tracking-widest text-erp-navy mb-4 border-b border-slate-100 pb-2 flex items-center gap-2">
                                <FileText size={14} className="text-erp-blue" /> Thông tin PR tham chiếu
                            </h3>
                            <div className="space-y-3">
                                <div className="flex justify-between">
                                    <span className="text-[10px] font-bold text-slate-400 uppercase">Mã PR</span>
                                    <span className="text-xs font-black text-erp-navy">{relatedPR?.prNumber || "N/A"}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-[10px] font-bold text-slate-400 uppercase">Người yêu cầu</span>
                                    <span className="text-xs font-bold text-slate-700">
                                        {typeof relatedPR?.requester === 'object' ? relatedPR.requester.fullName : (relatedPR?.requester || "Buyer Admin")}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-[10px] font-bold text-slate-400 uppercase">Phòng ban</span>
                                    <span className="text-xs font-bold text-slate-700">
                                        {relatedPR ? (typeof relatedPR.department === 'string' ? relatedPR.department : relatedPR.department?.name) || "Bộ phận hạ tầng" : "N/A"}
                                    </span>
                                </div>
                                <div className="pt-2 mt-2 border-t border-slate-50">
                                    <div className="text-[10px] font-bold text-slate-400 uppercase mb-1">Mục đích mua sắm</div>
                                    <p className="text-xs font-medium text-slate-600 italic">&quot;{activeRFQ?.title || relatedPR?.title || "Mua sắm trang thiết bị định kỳ"}&quot;</p>
                                </div>
                            </div>
                        </div>

                        <div className="erp-card shadow-sm border border-slate-200">
                            <h3 className="text-xs font-black uppercase tracking-widest text-erp-navy mb-4 border-b border-slate-100 pb-2">
                                Yêu cầu kỹ thuật & File đính kèm
                            </h3>
                            <p className="text-sm text-slate-600 mb-6 leading-relaxed font-medium">
                                {activeRFQ?.attachments && activeRFQ.attachments.length > 0 
                                    ? "Vui lòng xem các tài liệu đính kèm bên dưới để biết chi tiết yêu cầu kỹ thuật."
                                    : "Xin vui lòng báo giá cho các mã sản phẩm yêu cầu bên dưới."}
                            </p>
                            
                            <div className="space-y-3">
                                {activeRFQ?.attachments?.map((file, index: number) => (
                                    <div key={index} className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex justify-between items-center cursor-pointer hover:bg-slate-100 group transition-all">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-white text-erp-navy rounded shadow-sm group-hover:bg-erp-blue group-hover:text-white transition-colors duration-500"><FileText size={16}/></div>
                                            <div className="text-xs font-bold text-slate-700">{file.name}</div>
                                        </div>
                                        <div className="text-[10px] font-black uppercase text-erp-blue">Tải xuống</div>
                                    </div>
                                ))}
                                
                                {(!activeRFQ?.attachments || activeRFQ.attachments.length === 0) && (
                                    <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 text-center">
                                        <div className="text-[10px] font-black uppercase text-slate-300">Không có file đính kèm</div>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="erp-card shadow-sm border border-slate-200 flex flex-col h-[300px]">
                            <h3 className="text-xs font-black uppercase tracking-widest text-erp-navy mb-4 border-b border-slate-100 pb-2 flex items-center justify-between">
                                Q&A Thread 
                                <span className="bg-slate-100 px-2 py-0.5 rounded text-[10px] text-slate-400">Trực tuyến</span>
                            </h3>
                            <div className="flex-1 overflow-y-auto space-y-4 pr-2 custom-scrollbar">
                                {activeRFQ?.messages?.map((msg, index: number) => (
                                    <div key={index} className={`p-3 rounded-xl border text-xs font-medium ${
                                        msg.senderRole === 'SUPPLIER' 
                                            ? 'bg-slate-50 rounded-tr-none border-slate-200 ml-8 text-slate-600' 
                                            : 'bg-blue-50 rounded-tl-none border-blue-200 mr-8 text-erp-navy'
                                    }`}>
                                        <div className={`font-bold text-[9px] uppercase mb-1 ${
                                            msg.senderRole === 'SUPPLIER' ? 'text-slate-400' : 'text-erp-blue'
                                        }`}>{msg.sender}</div>
                                        {msg.text}
                                    </div>
                                ))}
                                
                                {(!activeRFQ?.messages || activeRFQ.messages.length === 0) && (
                                    <div className="flex flex-col items-center justify-center h-full opacity-20">
                                        <div className="w-12 h-12 rounded-full border-2 border-dashed border-slate-400 flex items-center justify-center mb-2">
                                            <Info size={20} />
                                        </div>
                                        <span className="text-[10px] font-black uppercase tracking-widest">Chưa có thảo luận</span>
                                    </div>
                                )}
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
                                    {(activeRFQ.items || []).map((item, idx: number) => {
                                        const itemId = item.id || `item-${idx}`;
                                        const itemName = item.item_name || item.description || "N/A";
                                        const itemCode = item.item_code || "SKU-ANY";
                                        const quantity = item.quantity || item.qty || 0;
                                        const unit = item.unit || "UNIT";

                                        return (
                                            <tr key={itemId} className="border-b border-slate-100 hover:bg-slate-50 group">
                                                <td className="px-6 py-4">
                                                    <div className="font-black text-slate-700">{itemName}</div>
                                                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Mã: {itemCode}</div>
                                                </td>
                                                <td className="text-center font-mono font-black border-x border-slate-50">
                                                    <div className="text-erp-navy">{quantity}</div>
                                                    <div className="text-[9px] text-slate-400 uppercase tracking-widest">{unit}</div>
                                                </td>
                                                <td className="text-right p-4 bg-emerald-50/20">
                                                    <input 
                                                        type="number" 
                                                        className="erp-input w-full text-right font-mono text-emerald-600 font-black focus:border-emerald-500 bg-white shadow-sm" 
                                                        placeholder="Nhập giá..."
                                                        value={prices[itemId] || ""}  
                                                        onChange={e => setPrices({...prices, [itemId]: e.target.value})}
                                                    />
                                                </td>
                                                <td className="p-4">
                                                    <input type="text" className="erp-input w-full text-[10px] bg-slate-50 group-hover:bg-white border-transparent focus:border-slate-200" placeholder="Model, xuất sứ, VAT..." />
                                                </td>
                                            </tr>
                                        );
                                    })}
                                    <tr className="bg-slate-100/50">
                                        <td colSpan={2} className="text-right font-black text-slate-500 uppercase tracking-widest py-4">Tổng tiền nháp:</td>
                                        <td className="text-right font-black font-mono text-erp-navy text-lg py-4">
                                            {(() => {
                                                const total = (activeRFQ.items || []).reduce((sum: number, item: PRItem) => {
                                                    const itemId = item.id;
                                                    if (!itemId) return sum;
                                                    const priceVal = Number(prices[itemId]) || 0;
                                                    const quantity = item.quantity || item.qty || 0;
                                                    return sum + (priceVal * quantity);
                                                }, 0);
                                                return total.toLocaleString();
                                            })()} ₫
                                        </td>
                                        <td className="text-[9px] font-bold text-slate-400 italic text-right px-4">
                                            * Các trường Đơn giá và Ghi chú là có thể chỉnh sửa.
                                        </td>
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
                        {openRfqs.map((r) => {
                            const prDetail = prs.find((p) => p.id === r.prId);
                            const customerName = prDetail ? (typeof prDetail.department === 'string' ? prDetail.department : prDetail.department?.name) : "ProcurePro Network";
                            
                            return (
                                <tr key={r.id} className="hover:bg-slate-50 border-b border-slate-100 cursor-pointer group" onClick={() => { setSelectedRfqId(r.id); setViewState("DETAIL"); }}>
                                    <td className="font-black text-erp-navy px-6 py-6 uppercase tracking-tight">{r.id}</td>
                                    <td className="font-bold text-slate-700">{customerName}</td>
                                    <td className="text-slate-500 font-medium">
                                        <div className="flex flex-wrap gap-1">
                                            {prDetail?.items && prDetail.items.length > 0 ? (
                                                prDetail.items.slice(0, 3).map((item, i: number) => (
                                                    <span key={i} className="bg-slate-100 text-[10px] px-2 py-0.5 rounded border border-slate-200">
                                                        {item.item_name || item.description} x{item.quantity || item.qty}
                                                    </span>
                                                ))
                                            ) : (
                                                <span className="italic text-slate-300">Không có hạng mục</span>
                                            )}
                                            {prDetail?.items && prDetail.items.length > 3 && (
                                                <span className="text-[9px] text-slate-400 pt-1">+{prDetail.items.length - 3} khác</span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="font-mono text-slate-400 text-[10px]">{r.createdAt ? new Date(r.createdAt).toLocaleString() : 'N/A'}</td>
                                    <td className="text-center">
                                        <span className="bg-red-50 text-red-600 border border-red-100 font-black uppercase text-[9px] px-2 py-1 rounded-lg tracking-widest animate-pulse">20h 15m</span>
                                    </td>
                                    <td className="text-right px-6">
                                        <button className="text-[10px] font-black uppercase tracking-widest text-erp-blue flex items-center gap-1 ml-auto group-hover:gap-2 transition-all">
                                            Xem chi tiết & Báo giá <ChevronDown size={14} className="-rotate-90"/>
                                        </button>
                                    </td>
                                </tr>
                            );
                        })}
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
