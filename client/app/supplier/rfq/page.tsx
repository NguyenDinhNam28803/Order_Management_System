"use client";

import React, { useState, useEffect } from "react";
import { Inbox, FileText, UploadCloud, Send, ChevronDown, CheckCircle, AlertCircle } from "lucide-react";

import { useProcurement, RFQ, PR, PRItem } from "../../context/ProcurementContext";
import type { CreateQuoteDto } from "../../types/api-types";

export default function SupplierRFQ() {
    const { currentUser, prs, createQuote, notify, fetchMySupplierRFQs, submitQuotation } = useProcurement();
    const [viewState, setViewState] = useState<"LIST" | "DETAIL">("LIST");
    const [selectedRfqId, setSelectedRfqId] = useState<string | null>(null);
    const [myRfqs, setMyRfqs] = useState<RFQ[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadRFQs = async () => {
            setLoading(true);
            try {
                const rfqs = await fetchMySupplierRFQs();
                setMyRfqs(rfqs);
            } catch (error) {
                console.error("Error fetching RFQs:", error);
                notify("Có lỗi khi tải danh sách RFQ", "error");
            } finally {
                setLoading(false);
            }
        };
        if (currentUser?.orgId) {
            loadRFQs();
        }
    }, [fetchMySupplierRFQs, currentUser?.orgId]);
    
    // Filter RFQs with status SENT or OPEN for display
    const openRfqs = myRfqs.filter((r: RFQ) =>
        r.status == "SENT" || r.status == "OPEN" || r.status == "PENDING"
    );
    
    const activeRFQRaw = selectedRfqId ? myRfqs.find((r: RFQ) => r.id === selectedRfqId) : (openRfqs.length > 0 ? openRfqs[0] : null);
    const relatedPR = activeRFQRaw ? prs.find((p: PR) => p.id === activeRFQRaw.prId || p.prNumber === activeRFQRaw.prId) : null;
    const activeRFQ = activeRFQRaw ? { 
        ...activeRFQRaw, 
        items: relatedPR?.items && relatedPR.items.length > 0 ? relatedPR.items : (activeRFQRaw.items || []) 
    } as RFQ : null;

    const [prices, setPrices] = useState<Record<string, string>>({});
    const [leadTime, setLeadTime] = useState("");
    const [paymentTerms, setPaymentTerms] = useState("Net 30");

    const handleSubmit = async () => {
        if (!activeRFQ) return;
        
        let total = 0;
        const pricesObj: Record<string, number> = {};
        (activeRFQ.items || []).forEach((item: PRItem) => {
            if (!item.id) return;
            const val = Number(prices[item.id]) || 0;
            pricesObj[item.id] = val;
            total += val * (item.qty || 0);
        });

        const payload: CreateQuoteDto = {
            rfqId: activeRFQ.id,
            supplierId: currentUser?.orgId || "",
            leadTimeDays: Number(leadTime) || 0,
            totalPrice: total,
            items: activeRFQ.items ? activeRFQ.items.map((item: PRItem) => ({
                rfqItemId: item.id || "",
                unitPrice: pricesObj[item.id || ""] || 0,
                qtyOffered: Number(item.qty) || 0,
            })) : [],
        };

        const newQuote = await createQuote(payload);
        
        if (newQuote && newQuote.id) {
            await submitQuotation(newQuote.id);
            notify(`Báo giá đã được gửi thành công!`, "success");
        } else {
            notify("Có lỗi khi gửi báo giá", "error");
        }
        
        setViewState("LIST");
    };

    if (loading) {
        return (
            <main className="animate-in fade-in duration-500 p-6 min-h-screen bg-[#FFFFFF] text-[#000000]">
                <div className="mt-8 flex flex-col items-center justify-center min-h-[400px]">
                    <div className="w-12 h-12 border-4 border-[#B4533A] border-t-transparent rounded-full animate-spin mb-4"></div>
                    <div className="text-black font-bold uppercase tracking-widest">Đang tải danh sách RFQ...</div>
                </div>
            </main>
        );
    }

    if (viewState === "DETAIL" && activeRFQ) {
        return (
        <main className="animate-in fade-in duration-700 p-8 min-h-screen bg-[#FFFFFF] text-[#000000]">
                <div className="mt-12 mb-10 flex justify-between items-end">
                    <div>
                        <div className="flex items-center gap-3 mb-4 text-[10px] font-black uppercase tracking-[0.2em]">
                            <span className={`px-4 py-1.5 rounded-xl border font-black uppercase tracking-[0.15em] ${
                                activeRFQ.deadline && new Date(activeRFQ.deadline) < new Date() 
                                    ? 'bg-rose-500/10 text-rose-700 border-rose-500/20' 
                                    : 'bg-[#B4533A]/10 text-[#B4533A] border-[#B4533A]/20'
                            }`}>
                                {activeRFQ.deadline && new Date(activeRFQ.deadline) < new Date() ? 'HẾT HẠN' : activeRFQ.status}
                            </span>
                            <span className="text-[#4A4A45] font-bold">Hạn nộp: {activeRFQ.deadline ? new Date(activeRFQ.deadline).toLocaleDateString('vi-VN') : 'Không giới hạn'}</span>
                        </div>
                        <h1 className="text-4xl font-black text-[#1A1D23] tracking-tighter uppercase mb-2">
                             {activeRFQ.rfqNumber || "RFQ-***"}
                        </h1>
                        <p className="text-2xl font-black text-[#B4533A] tracking-tight leading-tight">{activeRFQ.title || activeRFQ.pr?.title || "Yêu cầu báo giá chính thức"}</p>
                        <p className="text-sm font-bold text-[#4A4A45] mt-3 flex items-center gap-2">
                             <span className="h-1 w-4 bg-[#B4533A] rounded-full"></span>
                             Từ: <span className="text-[#1A1D23]">{activeRFQ.pr && activeRFQ.pr.department ? (typeof activeRFQ.pr.department === 'object' ? activeRFQ.pr.department.name : activeRFQ.pr.department) : "ProcurePro Network"}</span>
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-10 gap-10">
                    {/* Cột trái: Thông tin RFQ (3/10) */}
                    <div className="xl:col-span-3 space-y-8">
                        <div className="erp-card bg-[#FAF8F5] border border-[rgba(148,163,184,0.1)] shadow-2xl shadow-[#B4533A]/5 overflow-hidden">
                            <div className="p-6 border-b border-[rgba(148,163,184,0.1)] bg-[#1A1D23]">
                                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] !text-white flex items-center gap-3">
                                    <FileText size={16} className="text-[#B4533A]" /> Thông tin PR tham chiếu
                                </h3>
                            </div>
                            <div className="p-6 space-y-5">
                                <div className="flex justify-between items-center">
                                    <span className="text-[10px] font-black text-[#4A4A45] uppercase tracking-widest">Người liên hệ</span>
                                    <span className="text-xs font-black text-[#1A1D23]">
                                        {activeRFQ.pr?.requester?.fullName || activeRFQ.pr?.requester?.name || activeRFQ.createdBy?.fullName || activeRFQ.createdBy?.name || "N/A"}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-[10px] font-black text-[#4A4A45] uppercase tracking-widest">Đơn vị yêu cầu</span>
                                    <span className="text-xs font-black text-[#1A1D23]">
                                        {activeRFQ.pr?.department ? (typeof activeRFQ.pr.department === 'object' ? activeRFQ.pr.department.name : activeRFQ.pr.department) : "N/A"}
                                    </span>
                                </div>
                                <div className="pt-4 border-t border-[rgba(148,163,184,0.1)]">
                                    <div className="text-[9px] font-black text-[#4A4A45] uppercase tracking-widest mb-2 leading-none">Mô tả tóm tắt lý do mua</div>
                                    <p className="text-[11px] font-bold text-[#1A1D23] italic leading-relaxed bg-[#FFFFFF] p-4 rounded-xl border border-[rgba(148,163,184,0.1)]">
                                        &quot;{activeRFQ.description || activeRFQ.pr?.title || activeRFQ.title || "Yêu cầu phục vụ sản xuất"}&quot;
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Cột phải: Form Báo giá (7/10) */}
                    <div className="xl:col-span-7 space-y-8">
                        <div className="erp-card bg-[#FAF8F5] border border-[rgba(148,163,184,0.1)] shadow-2xl shadow-[#B4533A]/5 overflow-hidden">
                            <div className="p-8 border-b border-[rgba(148,163,184,0.1)] bg-[#1A1D23] flex items-center justify-between">
                                <h3 className="text-xs font-black uppercase tracking-[0.2em] !text-white flex items-center gap-4">
                                    <div className="h-8 w-8 bg-[#B4533A]/10 text-[#B4533A] rounded-xl flex items-center justify-center border border-[#B4533A]/20">
                                        <FileText size={18}/>
                                    </div>
                                    Bảng chào giá kỹ thuật & Thương mại (Quotation)
                                </h3>
                                <div className="flex -space-x-2">
                                     <div className="h-6 w-6 rounded-full bg-emerald-500 border-2 border-[#1A1D23]"></div>
                                     <div className="h-6 w-6 rounded-full bg-[#B4533A] border-2 border-[#1A1D23]"></div>
                                </div>
                            </div>
                            
                            <div className="p-0">
                                <table className="erp-table text-xs w-full" style={{ tableLayout: 'fixed' }}>
                                    <thead className="bg-[#FFFFFF]">
                                        <tr className="text-[#1A1D23] uppercase tracking-widest text-[9px] font-black italic">
                                            <th className="px-4 py-4 w-[35%]">Hạng mục hàng hóa / SKU</th>
                                            <th className="text-center w-[10%]">SL</th>
                                            <th className="text-right w-[25%]">Đơn giá đề xuất (VNĐ)</th>
                                            <th className="px-4 w-[30%]">Thông số kỹ thuật đề xuất</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-[rgba(148,163,184,0.05)]">
                                        {(activeRFQ.items || []).map((item, idx: number) => {
                                            const itemId = item.id || `item-${idx}`;
                                            const itemName = item.productName || item.description || "N/A";
                                            const itemCode = item.sku || "SKU-ANY";
                                            const quantity = item.qty || 0;
                                            const unit = item.unit || "Cái";

                                            return (
                                                <tr key={itemId} className="hover:bg-[#FFFFFF]/50 group transition-all">
                                                    <td className="px-4 py-4">
                                                        <div className="font-black text-[#1A1D23] text-xs mb-1 uppercase tracking-tight truncate" title={itemName}>{itemName}</div>
                                                        <div className="text-[9px] font-bold text-[#4A4A45] uppercase tracking-widest truncate">VN-SKU: <span className="text-[#B4533A]">{itemCode}</span></div>
                                                    </td>
                                                    <td className="text-center font-black py-4">
                                                        <div className="text-lg text-[#1A1D23]">{quantity}</div>
                                                        <div className="text-[9px] text-[#4A4A45] uppercase tracking-widest leading-none mt-1">{unit}</div>
                                                    </td>
                                                    <td className="px-4 py-4 bg-[#B4533A]/5">
                                                        <div className="relative group/input">
                                                            <input 
                                                                type="text" 
                                                                className="erp-input w-full text-right bg-[#FFFFFF] border-[rgba(148,163,184,0.2)] text-[#B4533A] font-black text-sm focus:border-[#B4533A] transition-all pr-10 h-10" 
                                                                placeholder="0..."
                                                                value={prices[itemId] || ""}  
                                                                onChange={e => setPrices({...prices, [itemId]: e.target.value})}
                                                            />
                                                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[9px] font-black text-[#4A4A45] uppercase tracking-widest">đ</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-4">
                                                        <input type="text" className="erp-input w-full text-[10px] bg-[#FFFFFF] border-[rgba(148,163,184,0.1)] focus:border-[#B4533A] text-[#1A1D23] placeholder:text-[#4A4A45] h-10 font-medium" placeholder="Vd: Model 2026, Bảo hành 24th..." />
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                        <tr className="bg-[#FFFFFF]">
                                            <td colSpan={2} className="px-4 py-6 text-right">
                                                 <div className="text-[10px] font-black text-[#4A4A45] uppercase tracking-[0.2em] mb-1">DỰ TOÁN TOTAL</div>
                                                 <div className="text-xs font-bold text-[#B4533A] italic">* Chưa bao gồm các loại thuế phí</div>
                                            </td>
                                            <td className="px-4 py-6 bg-[#B4533A]/10 text-right">
                                                <div className="text-2xl font-black text-[#1A1D23] tracking-tighter">
                                                    {(() => {
                                                        const total = (activeRFQ.items || []).reduce((sum: number, item: PRItem) => {
                                                            const itemId = item.id;
                                                            if (!itemId) return sum;
                                                            const priceVal = Number(prices[itemId]) || 0;
                                                            const quantity = item.qty || 0;
                                                            return sum + (priceVal * quantity);
                                                        }, 0);
                                                        return total.toLocaleString();
                                                    })()} ₫
                                                </div>
                                                <div className="text-[9px] font-black text-[#B4533A] uppercase tracking-[0.2em] mt-2">Tổng giá trị báo hàng</div>
                                            </td>
                                            <td className="px-4 py-6">
                                                <div className="leading-relaxed text-[10px] font-bold text-[#1A1D23] italic text-right opacity-90">
                                                    Dữ liệu sẽ được lưu nháp tự động.
                                                </div>
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>

                            <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8 bg-[#1A1D26]/50 border-t border-[rgba(148,163,184,0.1)]">
                                <div>
                                    <label className="block text-[10px] font-black uppercase text-[#FAF8F5]/60 tracking-[0.2em] mb-3 leading-none">Thủ tục Thanh toán thương thảo</label>
                                    <div className="relative group">
                                        <select className="erp-input w-full bg-[#FFFFFF] border-[rgba(148,163,184,0.1)] text-[#1A1D23] font-bold h-14" value={paymentTerms} onChange={e => setPaymentTerms(e.target.value)}>
                                            <option value="Net 30">Net 30 (Kỳ hạn 30 ngày)</option>
                                            <option value="Net 45">Net 45 (Kỳ hạn 45 ngày - Ưu tiên)</option>
                                            <option value="Advanced 100%">Trả trước 100% (Phí hệ thống)</option>
                                        </select>
                                        <div className="absolute right-4 top-1/2 -translate-y-1/2 text-[#1A1D23]">
                                            <ChevronDown size={18} />
                                        </div>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black uppercase text-[#FAF8F5]/60 tracking-[0.2em] mb-3 leading-none">Lead time - Thời gian cung ứng (Ngày)</label>
                                    <div className="relative">
                                        <input type="number" className="erp-input w-full bg-[#FFFFFF] border-[rgba(148,163,184,0.1)] text-[#B4533A] font-black h-14" placeholder="Vd: 14" value={leadTime} onChange={e => setLeadTime(e.target.value)} />
                                        <div className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-[#4A4A45] uppercase">Day(s)</div>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="mx-8 mb-8 border-2 border-dashed border-[#B4533A]/20 rounded-[32px] p-10 text-center hover:bg-[#B4533A]/5 hover:border-[#B4533A]/40 cursor-pointer group transition-all duration-500 bg-[#FFFFFF]/50">
                                <div className="h-16 w-16 bg-[#B4533A]/10 text-[#B4533A] rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                                     <UploadCloud size={32} />
                                </div>
                                <div className="text-base font-black text-[#1A1D23] tracking-tight mb-2">Upload Báo giá chính thức (Bản Scan có dấu mộc)</div>
                                <p className="text-[11px] font-bold text-[#4A4A45] uppercase tracking-[0.2em]">Bắt buộc định dạng PDF (.pdf) • Tối đa 50MB</p>
                            </div>
                        </div>

                        {/* Banner xác nhận submission hoặc thông báo hết hạn */}
                        {activeRFQ.deadline && new Date(activeRFQ.deadline) < new Date() ? (
                            <div className="erp-card bg-gradient-to-r from-rose-900/80 to-rose-800/80 border-rose-500/20 shadow-2xl shadow-rose-500/10 p-8 flex flex-col md:flex-row justify-between items-center relative overflow-hidden">
                                <div className="absolute -left-10 top-0 opacity-10">
                                    <AlertCircle size={180}/>
                                </div>
                                <div className="relative z-10 text-center md:text-left">
                                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-rose-500/20 text-rose-300 rounded-full text-[10px] font-black uppercase tracking-[0.15em] mb-3">
                                        <AlertCircle size={12}/> RFQ ĐÃ HẾT HẠN
                                    </div>
                                    <p className="text-xs font-bold text-rose-200/80 tracking-tight">
                                        Thời hạn nộp báo giá đã kết thúc vào {new Date(activeRFQ.deadline).toLocaleDateString('vi-VN')} {new Date(activeRFQ.deadline).toLocaleTimeString('vi-VN', {hour:'2-digit', minute:'2-digit'})}
                                    </p>
                                </div>
                            </div>
                        ) : (
                            <div className="erp-card bg-gradient-to-r from-emerald-900 to-emerald-800 border-none shadow-2xl shadow-emerald-500/10 p-10 flex flex-col md:flex-row justify-between items-center relative overflow-hidden group">
                                <div className="absolute -left-10 top-0 opacity-10 group-hover:scale-125 transition-transform duration-1000">
                                    <Send size={200}/>
                                </div>
                                <div className="relative z-10 text-center md:text-left mb-6 md:mb-0">
                                    <div className="inline-flex items-center gap-3 px-4 py-1.5 bg-emerald-500/20 text-emerald-300 rounded-full text-[10px] font-black uppercase tracking-[0.2em] mb-4">
                                         <CheckCircle size={14}/> Cam kết bảo mật thông tin
                                    </div>
                                    <h3 className="text-xl font-black text-[#FAF8F5] uppercase tracking-tight mb-2">XÁC NHẬN NỘP HỒ SƠ THẦU</h3>
                                    <p className="text-[11px] font-bold text-emerald-300/80 max-w-sm tracking-tight leading-relaxed">Tôi cam kết các thông tin báo giá là chính xác và tuân thủ quy tắc ứng xử B2B của hệ thống ProcurePro.</p>
                                </div>
                                <div className="relative z-10 flex gap-4 w-full md:w-auto">
                                    <button className="flex-1 px-5 h-10 border border-emerald-700/50 hover:bg-emerald-800 text-emerald-100 font-black uppercase tracking-[0.15em] text-[10px] rounded-xl transition-colors">Lưu nháp</button>
                                    <button onClick={handleSubmit} className="flex-1 px-6 h-10 bg-emerald-500 hover:bg-emerald-400 text-emerald-950 shadow-lg shadow-emerald-500/20 font-black uppercase tracking-[0.15em] text-xs rounded-xl flex items-center justify-center gap-2 transition-all hover:scale-105 active:scale-95 group/btn">
                                         GỬI BÁO GIÁ <Send size={14} className="group-hover/btn:translate-x-1 group-hover/btn:-translate-y-1 transition-transform" />
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </main>
        )
    }

    return (
        <main className="animate-in fade-in duration-700 pt-16 px-12 pb-20 bg-[#FFFFFF] min-h-screen text-[#1A1D23]">
            <div className="mt-16 mb-12 flex justify-between items-end">
                <div>
                    <h1 className="text-5xl font-black text-[#1A1D23] tracking-tighter uppercase mb-4 leading-none">THƯ MỜI THẦU (RFQ)</h1>
                    <p className="text-sm font-bold text-[#4A4A45] tracking-tight uppercase flex items-center gap-3">
                         <span className="h-0.5 w-10 bg-[#B4533A] rounded-full"></span>
                         Danh sách các yêu cầu báo giá từ <span className="text-[#B4533A]">ProcurePro Network</span>
                    </p>
                </div>
                <div className="flex gap-4">
                     <div className="p-4 bg-[#FAF8F5] border border-[rgba(148,163,184,0.1)] rounded-2xl shadow-xl">
                          <div className="text-[9px] font-black text-[#4A4A45] uppercase tracking-[0.2em] mb-1">RFQ Chờ báo giá</div>
                          <div className="text-2xl font-black text-[#1A1D23]">{openRfqs.length}</div>
                     </div>
                     <div className="p-4 bg-[#FAF8F5] border border-[rgba(148,163,184,0.1)] rounded-2xl shadow-xl">
                          <div className="text-[9px] font-black text-[#4A4A45] uppercase tracking-[0.2em] mb-1">Tổng RFQ</div>
                          <div className="text-2xl font-black text-[#B4533A]">{myRfqs.length}</div>
                     </div>
                </div>
            </div>

            <div className="erp-card bg-[#FAF8F5] p-0! overflow-hidden shadow-2xl shadow-[#B4533A]/5 border border-[rgba(148,163,184,0.1)] rounded-[40px]">
                <div className="overflow-x-auto">
                    <table className="erp-table text-xs whitespace-nowrap">
                        <thead className="bg-[#FFFFFF]">
                            <tr className="text-[#4A4A45] uppercase tracking-widest text-[9px] font-black italic">
                                <th className="px-6 py-6 w-[140px]">ID Giao dịch</th>
                                <th className="w-[180px]">Khách hàng</th>
                                <th className="w-[280px] max-w-[280px]">Thông tin hạng mục</th>
                                <th className="w-[110px]">Thời gian nộp</th>
                                <th className="text-center w-[100px]">Countdown</th>
                                <th className="text-right px-6 w-[140px]">Thao tác</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[rgba(148,163,184,0.05)]">
                            {myRfqs.map((r: RFQ) => {
                                const prDetail = prs.find((p) => p.id === r.prId);
                                const customerName = prDetail ? (typeof prDetail.department === 'string' ? prDetail.department : prDetail.department?.name) || "ProcurePro Network" : "ProcurePro Network";
                                
                                return (
                                    <tr 
                                        key={r.id} 
                                        className="hover:bg-[#1A1D23] border-b border-[rgba(148,163,184,0.05)] cursor-pointer group transition-all" 
                                        onClick={() => { setSelectedRfqId(r.id); setViewState("DETAIL"); }}
                                    >
                                        <td className="px-6 py-8">
                                            <div className="font-black text-[#1A1D23] text-sm uppercase tracking-tighter group-hover:text-[#B4533A] transition-colors">{r.rfqNumber || "RFQ-***"}</div>
                                        </td>
                                        <td className="py-8">
                                            <div className="flex items-center gap-3">
                                                 <div className="h-10 w-10 bg-[#B4533A]/10 text-[#B4533A] rounded-xl flex items-center justify-center border border-[#B4533A]/20 font-black group-hover:bg-[#B4533A] group-hover:text-black transition-all">
                                                      {customerName.substring(0, 1)}
                                                 </div>
                                                 <div className="font-black text-[#1A1D23] tracking-tight group-hover:text-[#F2EFE9] transition-colors">{customerName}</div>
                                            </div>
                                        </td>
                                        <td className="py-8 max-w-[280px]">
                                            <div className="flex flex-wrap gap-1.5">
                                                {(r.items && r.items.length > 0) ? (
                                                    <>
                                                        <span className="bg-[#FFFFFF] text-[#1A1D23] text-[9px] font-black uppercase px-2.5 py-1 rounded-lg border border-[rgba(148,163,184,0.1)] group-hover:bg-white/10 group-hover:text-white group-hover:border-white/20 transition-all truncate max-w-[200px]">
                                                            {r.items[0].description || r.items[0].productName || 'Item'} x{r.items[0].qty || 1}
                                                        </span>
                                                        {r.items.length > 1 && (
                                                            <span className="bg-[#B4533A]/10 text-[#B4533A] text-[9px] font-black uppercase px-2.5 py-1 rounded-lg border border-[#B4533A]/20 group-hover:bg-[#B4533A] group-hover:text-black transition-all">
                                                                +{r.items.length - 1}
                                                            </span>
                                                        )}
                                                    </>
                                                ) : prDetail?.items && prDetail.items.length > 0 ? (
                                                    <>
                                                        <span className="bg-[#FFFFFF] text-[#1A1D23] text-[9px] font-black uppercase px-2.5 py-1 rounded-lg border border-[rgba(148,163,184,0.1)] group-hover:bg-white/10 group-hover:text-white group-hover:border-white/20 transition-all truncate max-w-[200px]">
                                                            {prDetail.items[0].productName || prDetail.items[0].description} x{prDetail.items[0].qty}
                                                        </span>
                                                        {prDetail.items.length > 1 && (
                                                            <span className="bg-[#B4533A]/10 text-[#B4533A] text-[9px] font-black uppercase px-2.5 py-1 rounded-lg border border-[#B4533A]/20 group-hover:bg-[#B4533A] group-hover:text-black transition-all">
                                                                +{prDetail.items.length - 1}
                                                            </span>
                                                        )}
                                                    </>
                                                ) : (
                                                    <span className="italic text-[#4A4A45] font-bold uppercase text-[9px] tracking-widest group-hover:text-[#F2EFE9]/50 transition-colors">Không có dữ liệu</span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="py-8">
                                            <div className="text-[#1A1D23] font-bold text-[11px] mb-1 group-hover:text-[#F2EFE9] transition-colors">{r.deadline ? new Date(r.deadline).toLocaleDateString('vi-VN') : '-'}</div>
                                            <div className="text-[9px] font-black text-[#4A4A45] uppercase tracking-widest group-hover:text-[#F2EFE9]/60 transition-colors">{r.deadline ? new Date(r.deadline).toLocaleTimeString('vi-VN', {hour: '2-digit', minute:'2-digit'}) : ''}</div>
                                        </td>
                                        <td className="text-center py-8">
                                            {(() => {
                                                if (!r.deadline) return (
                                                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#1A1D23]/10 text-[#1A1D23] border border-[#1A1D23]/20 rounded-xl font-black uppercase text-[10px] tracking-widest">
                                                        Không xác định
                                                    </div>
                                                );
                                                const deadline = new Date(r.deadline).getTime();
                                                const now = Date.now();
                                                const diff = deadline - now;
                                                if (diff <= 0) {
                                                    return (
                                                        <div className="inline-flex items-center gap-2 px-4 py-2 bg-rose-500/10 text-black border border-rose-500/20 rounded-xl font-black uppercase text-[10px] tracking-widest">
                                                            <div className="h-1.5 w-1.5 rounded-full bg-rose-500"></div>
                                                            HẾT HẠN
                                                        </div>
                                                    );
                                                }
                                                const days = Math.floor(diff / (1000 * 60 * 60 * 24));
                                                const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
                                                const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
                                                const timeStr = days > 0 ? `${days}D ${hours}H` : `${hours}H ${mins}M`;
                                                const isUrgent = days === 0 && hours < 12;
                                                return (
                                                    <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl font-black uppercase text-[10px] tracking-widest group-hover:scale-105 transition-all duration-500 ${isUrgent ? 'bg-rose-500/10 text-black border border-rose-500/20 group-hover:bg-rose-500 group-hover:text-black' : 'bg-emerald-500/10 text-black border border-emerald-500/20 group-hover:bg-emerald-500 group-hover:text-black'}`}>
                                                        <div className={`h-1.5 w-1.5 rounded-full animate-pulse ${isUrgent ? 'bg-rose-500 group-hover:bg-black' : 'bg-emerald-500 group-hover:bg-black'}`}></div>
                                                        {timeStr}
                                                    </div>
                                                );
                                            })()}
                                        </td>
                                        <td className="text-right px-6 py-8">
                                            <button className="h-10 px-4 bg-[#B4533A] text-[#1A1D23] rounded-xl font-black text-[9px] uppercase tracking-[0.15em] shadow-lg shadow-[#B4533A]/10 hover:bg-[#A85032] hover:scale-105 active:scale-95 transition-all flex items-center gap-2 ml-auto group/btn">
                                                CHI TIẾT <ChevronDown size={12} className="-rotate-90 group-hover/btn:translate-x-1 transition-transform" />
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })}
                            {myRfqs.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="text-center py-32">
                                         <div className="flex flex-col items-center gap-4">
                                             <div className="w-20 h-20 bg-[#FAF8F5] rounded-full flex items-center justify-center">
                                                 <Inbox size={32} className="text-[#1A1D23]" />
                                             </div>
                                             <div className="text-[#1A1D23] font-black uppercase tracking-[0.2em] text-sm">
                                                 KHÔNG CÓ RFQ NÀO
                                             </div>
                                             <p className="text-[#4A4A45] text-xs max-w-md font-bold">
                                                 Bạn chưa được mời tham gia báo giá nào. Hệ thống sẽ tự động thông báo khi có RFQ phù hợp.
                                             </p>
                                         </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </main>
    );
}

