"use client";

import React, { useState, useEffect } from "react";
import { Inbox, FileText, UploadCloud, Send, ChevronDown, CheckCircle, AlertCircle } from "lucide-react";

import { useProcurement, RFQ, PR, PRItem } from "../../context/ProcurementContext";
import PageHeader from "../../components/shared/PageHeader";
import { DataTable, DataTableColumn } from "../../components/shared/DataTable";

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

    const rfqColumns: DataTableColumn<RFQ>[] = [
        { label: "Số RFQ", key: "id", sortable: true, render: (r) => <span className="font-black text-slate-900 uppercase num-display">{r.id}</span> },
        {
            label: "Khách hàng",
            render: (r) => {
                const prDetail = prs.find((p: PR) => p.id === r.prId);
                const customerName = prDetail ? (typeof prDetail.department === 'string' ? prDetail.department : prDetail.department?.name) : "ProcurePro Network";
                return <span className="font-bold text-slate-700">{customerName}</span>;
            },
        },
        {
            label: "Hạng mục tóm tắt", hideOnMobile: true,
            render: (r) => {
                const prDetail = prs.find((p: PR) => p.id === r.prId);
                return (
                    <div className="flex flex-wrap gap-1">
                        {prDetail?.items && prDetail.items.length > 0 ? (
                            prDetail.items.slice(0, 3).map((item: PRItem, i: number) => (
                                <span key={i} className="bg-slate-100 text-[0.6875rem] px-2 py-0.5 rounded border border-slate-200">{item.item_name || item.description} x{item.quantity || item.qty}</span>
                            ))
                        ) : <span className="italic text-slate-400">Không có hạng mục</span>}
                        {prDetail?.items && prDetail.items.length > 3 && <span className="text-[0.6875rem] text-slate-400 pt-1">+{prDetail.items.length - 3} khác</span>}
                    </div>
                );
            },
        },
        { label: "Hạn nộp", hideOnMobile: true, render: (r) => <span className="num-display text-slate-500 text-[0.6875rem]">{new Date(r.createdAt || 0).toLocaleString('vi-VN')}</span> },
        { label: "Countdown", align: "center", render: () => <span className="bg-rose-50 text-rose-600 border border-rose-100 font-black uppercase text-[0.6875rem] px-2 py-1 rounded-lg tracking-widest">20h 15m</span> },
        {
            label: "Hành động", align: "right",
            render: () => (
                <button className="text-[0.6875rem] font-black uppercase tracking-widest text-[#2563EB] flex items-center gap-1 ml-auto">
                    Xem chi tiết & Báo giá <ChevronDown size={14} className="-rotate-90" />
                </button>
            ),
        },
    ];

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

        createQuote({
            rfqId: activeRFQ.id,
            supplierId: currentUser?.orgId ?? '',
            totalPrice: total,
            leadTimeDays: Number(leadTime) || 7,
        });
        
        setViewState("LIST");
    };

    if (loading) {
        return (
            <main className="animate-in fade-in duration-500 p-6 min-h-screen bg-[#F8FAFC] text-slate-900">
                <div className="mt-8 flex flex-col items-center justify-center min-h-[400px]">
                    <div className="w-12 h-12 border-4 border-[#2563EB] border-t-transparent rounded-full animate-spin mb-4"></div>
                    <div className="text-black font-bold uppercase tracking-widest">Đang tải danh sách RFQ...</div>
                </div>
            </main>
        );
    }

    if (viewState === "DETAIL" && activeRFQ) {
        return (
        <main className="animate-in fade-in duration-700 p-8 min-h-screen bg-[#F8FAFC] text-slate-900">
                <div className="mt-12 mb-10 flex justify-between items-end">
                    <div>
                        <div className="flex items-center gap-3 mb-4 text-[0.6875rem] font-black uppercase tracking-[0.2em]">
                            <span className={`px-4 py-1.5 rounded-xl border font-black uppercase tracking-[0.15em] ${
                                activeRFQ.deadline && new Date(activeRFQ.deadline) < new Date() 
                                    ? 'bg-rose-500/10 text-rose-700 border-rose-500/20' 
                                    : 'bg-[#2563EB]/10 text-[#2563EB] border-[#2563EB]/20'
                            }`}>
                                {activeRFQ.deadline && new Date(activeRFQ.deadline) < new Date() ? 'HẾT HẠN' : activeRFQ.status}
                            </span>
                            <span className="text-[#4A4A45] font-bold">Hạn nộp: {activeRFQ.deadline ? new Date(activeRFQ.deadline).toLocaleDateString('vi-VN') : 'Không giới hạn'}</span>
                        </div>
                        <h1 className="text-4xl font-black text-[#0F172A] tracking-tighter uppercase mb-2">
                             {activeRFQ.rfqNumber || "RFQ-***"}
                        </h1>
                        <p className="text-2xl font-black text-[#2563EB] tracking-tight leading-tight">{activeRFQ.title || activeRFQ.pr?.title || "Yêu cầu báo giá chính thức"}</p>
                        <p className="text-sm font-bold text-[#4A4A45] mt-3 flex items-center gap-2">
                             <span className="h-1 w-4 bg-[#2563EB] rounded-full"></span>
                             Từ: <span className="text-[#0F172A]">{activeRFQ.pr && activeRFQ.pr.department ? (typeof activeRFQ.pr.department === 'object' ? activeRFQ.pr.department.name : activeRFQ.pr.department) : "ProcurePro Network"}</span>
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-10 gap-10">
                    {/* Cột trái: Thông tin RFQ (3/10) */}
                    <div className="xl:col-span-3 space-y-8">
                        <div className="bg-[#F1F5F9] border border-slate-200 shadow-2xl shadow-[#2563EB]/5 overflow-hidden">
                            <div className="p-6 border-b border-slate-200 bg-[#0F172A]">
                                <h3 className="text-[0.6875rem] font-black uppercase tracking-[0.2em] !text-white flex items-center gap-3">
                                    <FileText size={16} className="text-[#2563EB]" /> Thông tin PR tham chiếu
                                </h3>
                            </div>
                            <div className="p-6 space-y-5">
                                <div className="flex justify-between items-center">
                                    <span className="text-[0.6875rem] font-black text-[#4A4A45] uppercase tracking-widest">Người liên hệ</span>
                                    <span className="text-xs font-black text-[#0F172A]">
                                        {activeRFQ.pr?.requester?.fullName || activeRFQ.pr?.requester?.name || activeRFQ.createdBy?.fullName || activeRFQ.createdBy?.name || "N/A"}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-[0.6875rem] font-black text-[#4A4A45] uppercase tracking-widest">Đơn vị yêu cầu</span>
                                    <span className="text-xs font-black text-[#0F172A]">
                                        {activeRFQ.pr?.department ? (typeof activeRFQ.pr.department === 'object' ? activeRFQ.pr.department.name : activeRFQ.pr.department) : "N/A"}
                                    </span>
                                </div>
                                <div className="pt-4 border-t border-slate-200">
                                    <div className="text-[0.6875rem] font-black text-[#4A4A45] uppercase tracking-widest mb-2 leading-none">Mô tả tóm tắt lý do mua</div>
                                    <p className="text-[11px] font-bold text-[#0F172A] italic leading-relaxed bg-[#FFFFFF] p-4 rounded-xl border border-slate-200">
                                        &quot;{activeRFQ.description || activeRFQ.pr?.title || activeRFQ.title || "Yêu cầu phục vụ sản xuất"}&quot;
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Cột phải: Form Báo giá (7/10) */}
                    <div className="xl:col-span-7 space-y-8">
                        <div className="bg-[#F1F5F9] border border-slate-200 shadow-2xl shadow-[#2563EB]/5 overflow-hidden">
                            <div className="p-8 border-b border-slate-200 bg-[#0F172A] flex items-center justify-between">
                                <h3 className="text-xs font-black uppercase tracking-[0.2em] !text-white flex items-center gap-4">
                                    <div className="h-8 w-8 bg-[#2563EB]/10 text-[#2563EB] rounded-xl flex items-center justify-center border border-[#2563EB]/20">
                                        <FileText size={18}/>
                                    </div>
                                    Bảng chào giá kỹ thuật & Thương mại (Quotation)
                                </h3>
                                <div className="flex -space-x-2">
                                     <div className="h-6 w-6 rounded-full bg-emerald-500 border-2 border-[#0F172A]"></div>
                                     <div className="h-6 w-6 rounded-full bg-[#2563EB] border-2 border-[#0F172A]"></div>
                                </div>
                            </div>
                            
                            <div className="p-0">
                                <table className="erp-table text-xs w-full" style={{ tableLayout: 'fixed' }}>
                                    <thead>
                                        <tr className="text-[#0F172A] italic">
                                            <th className="px-4 py-4 w-[35%]">Hạng mục hàng hóa / SKU</th>
                                            <th className="text-center w-[10%]">SL</th>
                                            <th className="text-right w-[25%]">Đơn giá đề xuất (VNĐ)</th>
                                            <th className="px-4 w-[30%]">Thông số kỹ thuật đề xuất</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {(activeRFQ.items || []).map((item, idx: number) => {
                                            const itemId = item.id || `item-${idx}`;
                                            const itemName = item.productName || item.description || "N/A";
                                            const itemCode = item.sku || "SKU-ANY";
                                            const quantity = item.qty || 0;
                                            const unit = item.unit || "Cái";

                                            return (
                                                <tr key={itemId} className="hover:bg-[#FFFFFF]/50 group transition-all">
                                                    <td className="px-4 py-4">
                                                        <div className="font-black text-[#0F172A] text-xs mb-1 uppercase tracking-tight truncate" title={itemName}>{itemName}</div>
                                                        <div className="text-[0.6875rem] font-bold text-[#4A4A45] uppercase tracking-widest truncate">VN-SKU: <span className="text-[#2563EB]">{itemCode}</span></div>
                                                    </td>
                                                    <td className="text-center font-black py-4">
                                                        <div className="text-lg text-[#0F172A]">{quantity}</div>
                                                        <div className="text-[0.6875rem] text-[#4A4A45] uppercase tracking-widest leading-none mt-1">{unit}</div>
                                                    </td>
                                                    <td className="px-4 py-4 bg-[#2563EB]/5">
                                                        <div className="relative group/input">
                                                            <input 
                                                                type="text" 
                                                                className="erp-input w-full text-right bg-[#FFFFFF] border-slate-200 text-[#2563EB] font-black text-sm focus:border-[#2563EB] transition-all pr-10 h-10" 
                                                                placeholder="0..."
                                                                value={prices[itemId] || ""}  
                                                                onChange={e => setPrices({...prices, [itemId]: e.target.value})}
                                                            />
                                                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[0.6875rem] font-black text-[#4A4A45] uppercase tracking-widest">đ</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-4">
                                                        <input type="text" className="erp-input w-full text-[0.6875rem] bg-[#FFFFFF] border-slate-200 focus:border-[#2563EB] text-[#0F172A] placeholder:text-[#4A4A45] h-10 font-medium" placeholder="Vd: Model 2026, Bảo hành 24th..." />
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                        <tr>
                                            <td colSpan={2} className="px-4 py-6 text-right">
                                                 <div className="text-[0.6875rem] font-black text-[#4A4A45] uppercase tracking-[0.2em] mb-1">DỰ TOÁN TOTAL</div>
                                                 <div className="text-xs font-bold text-[#2563EB] italic">* Chưa bao gồm các loại thuế phí</div>
                                            </td>
                                            <td className="px-4 py-6 bg-[#2563EB]/10 text-right">
                                                <div className="text-2xl font-black text-[#0F172A] tracking-tighter">
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
                                                <div className="text-[0.6875rem] font-black text-[#2563EB] uppercase tracking-[0.2em] mt-2">Tổng giá trị báo hàng</div>
                                            </td>
                                            <td className="px-4 py-6">
                                                <div className="leading-relaxed text-[0.6875rem] font-bold text-[#0F172A] italic text-right opacity-90">
                                                    Dữ liệu sẽ được lưu nháp tự động.
                                                </div>
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>

                            <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8 bg-[#1A1D26]/50 border-t border-slate-200">
                                <div>
                                    <label className="block text-[0.6875rem] font-black uppercase text-[#F1F5F9]/60 tracking-[0.2em] mb-3 leading-none">Thủ tục Thanh toán thương thảo</label>
                                    <div className="relative group">
                                        <select className="erp-input w-full bg-[#FFFFFF] border-slate-200 text-[#0F172A] font-bold h-14" value={paymentTerms} onChange={e => setPaymentTerms(e.target.value)}>
                                            <option value="Net 30">Net 30 (Kỳ hạn 30 ngày)</option>
                                            <option value="Net 45">Net 45 (Kỳ hạn 45 ngày - Ưu tiên)</option>
                                            <option value="Advanced 100%">Trả trước 100% (Phí hệ thống)</option>
                                        </select>
                                        <div className="absolute right-4 top-1/2 -translate-y-1/2 text-[#0F172A]">
                                            <ChevronDown size={18} />
                                        </div>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-[0.6875rem] font-black uppercase text-[#F1F5F9]/60 tracking-[0.2em] mb-3 leading-none">Lead time - Thời gian cung ứng (Ngày)</label>
                                    <div className="relative">
                                        <input type="number" className="erp-input w-full bg-[#FFFFFF] border-slate-200 text-[#2563EB] font-black h-14" placeholder="Vd: 14" value={leadTime} onChange={e => setLeadTime(e.target.value)} />
                                        <div className="absolute right-4 top-1/2 -translate-y-1/2 text-[0.6875rem] font-black text-[#4A4A45] uppercase">Day(s)</div>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="mx-8 mb-8 border-2 border-dashed border-[#2563EB]/20 rounded-xl p-10 text-center hover:bg-[#2563EB]/5 hover:border-[#2563EB]/40 cursor-pointer group transition-all duration-500 bg-[#FFFFFF]/50">
                                <div className="h-16 w-16 bg-[#2563EB]/10 text-[#2563EB] rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                                     <UploadCloud size={32} />
                                </div>
                                <div className="text-base font-black text-[#0F172A] tracking-tight mb-2">Upload Báo giá chính thức (Bản Scan có dấu mộc)</div>
                                <p className="text-[11px] font-bold text-[#4A4A45] uppercase tracking-[0.2em]">Bắt buộc định dạng PDF (.pdf) • Tối đa 50MB</p>
                            </div>
                        </div>

                        {/* Banner xác nhận submission hoặc thông báo hết hạn */}
                        {activeRFQ.deadline && new Date(activeRFQ.deadline) < new Date() ? (
                            <div className="bg-gradient-to-r from-rose-900/80 to-rose-800/80 border border-rose-500/20 shadow-2xl shadow-rose-500/10 p-8 flex flex-col md:flex-row justify-between items-center relative overflow-hidden">
                                <div className="absolute -left-10 top-0 opacity-10">
                                    <AlertCircle size={180}/>
                                </div>
                                <div className="relative z-10 text-center md:text-left">
                                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-rose-500/20 text-rose-300 rounded-full text-[0.6875rem] font-black uppercase tracking-[0.15em] mb-3">
                                        <AlertCircle size={12}/> RFQ ĐÃ HẾT HẠN
                                    </div>
                                    <p className="text-xs font-bold text-rose-200/80 tracking-tight">
                                        Thời hạn nộp báo giá đã kết thúc vào {new Date(activeRFQ.deadline).toLocaleDateString('vi-VN')} {new Date(activeRFQ.deadline).toLocaleTimeString('vi-VN', {hour:'2-digit', minute:'2-digit'})}
                                    </p>
                                </div>
                            </div>
                        ) : (
                            <div className="bg-gradient-to-r from-emerald-900 to-emerald-800 border-none shadow-2xl shadow-emerald-500/10 p-10 flex flex-col md:flex-row justify-between items-center relative overflow-hidden group">
                                <div className="absolute -left-10 top-0 opacity-10 group-hover:scale-125 transition-transform duration-1000">
                                    <Send size={200}/>
                                </div>
                                <div className="relative z-10 text-center md:text-left mb-6 md:mb-0">
                                    <div className="inline-flex items-center gap-3 px-4 py-1.5 bg-emerald-500/20 text-emerald-300 rounded-full text-[0.6875rem] font-black uppercase tracking-[0.2em] mb-4">
                                         <CheckCircle size={14}/> Cam kết bảo mật thông tin
                                    </div>
                                    <h3 className="text-xl font-black text-[#F1F5F9] uppercase tracking-tight mb-2">XÁC NHẬN NỘP HỒ SƠ THẦU</h3>
                                    <p className="text-[11px] font-bold text-emerald-300/80 max-w-sm tracking-tight leading-relaxed">Tôi cam kết các thông tin báo giá là chính xác và tuân thủ quy tắc ứng xử B2B của hệ thống ProcurePro.</p>
                                </div>
                                <div className="relative z-10 flex gap-4 w-full md:w-auto">
                                    <button className="flex-1 px-5 h-10 border border-emerald-700/50 hover:bg-emerald-800 text-emerald-100 font-black uppercase tracking-[0.15em] text-[0.6875rem] rounded-xl transition-colors">Lưu nháp</button>
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
        <main className="animate-in fade-in duration-700 pt-16 px-12 pb-20 bg-[#F8FAFC] min-h-screen text-[#0F172A]">
            <PageHeader
                title="Yêu cầu báo giá (RFQ)"
                icon={Inbox}
                iconColor="amber"
            />
            <div className="mt-4 mb-12 flex justify-between items-end">
                <div>
                    <p className="text-sm font-bold text-[#4A4A45] tracking-tight uppercase flex items-center gap-3">
                         <span className="h-0.5 w-10 bg-[#2563EB] rounded-full"></span>
                         Danh sách các yêu cầu báo giá từ <span className="text-[#2563EB]">ProcurePro Network</span>
                    </p>
                </div>
                <div className="flex gap-4">
                     <div className="p-4 bg-[#F1F5F9] border border-slate-200 rounded-xl shadow-xl">
                          <div className="text-[0.6875rem] font-black text-[#4A4A45] uppercase tracking-[0.2em] mb-1">RFQ Chờ báo giá</div>
                          <div className="text-2xl font-black text-[#0F172A]">{openRfqs.length}</div>
                     </div>
                     <div className="p-4 bg-[#F1F5F9] border border-slate-200 rounded-xl shadow-xl">
                          <div className="text-[0.6875rem] font-black text-[#4A4A45] uppercase tracking-[0.2em] mb-1">Tổng RFQ</div>
                          <div className="text-2xl font-black text-[#2563EB]">{myRfqs.length}</div>
                     </div>
                </div>
            </div>

            <div className="erp-card table-card p-4">
                <DataTable
                    columns={rfqColumns}
                    data={openRfqs}
                    pageSize={10}
                    getRowKey={(r) => r.id}
                    onRowClick={(r) => { setSelectedRfqId(r.id); setViewState("DETAIL"); }}
                    emptyMessage="Không có RFQ nào chờ báo giá"
                    emptyDescription="Các yêu cầu báo giá mới sẽ xuất hiện tại đây"
                />
            </div>
        </main>
    );
}


