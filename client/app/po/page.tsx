"use client";

import { useState } from "react";
import DashboardHeader from "../components/DashboardHeader";
import { FileText, Lock, Search, Filter, ArrowRight, ShieldCheck, FileCheck, Send, DownloadCloud, UploadCloud, Eye, CheckCircle } from "lucide-react";
import { useProcurement } from "../context/ProcurementContext";
import { useRouter, useSearchParams } from "next/navigation";

export default function POPage() {
    const { pos, prs } = useProcurement();
    const router = useRouter();
    const searchParams = useSearchParams();
    
    const action = searchParams.get("action");
    const prId = searchParams.get("prId");
    const passedVendor = searchParams.get("vendor");
    const passedPrice = searchParams.get("price");

    const formatDate = (ds?: string) => {
        if (!ds) return "N/A";
        const d = new Date(ds);
        if (isNaN(d.getTime())) return ds;
        return `${String(d.getDate()).padStart(2, '0')}-${String(d.getMonth() + 1).padStart(2, '0')}-${d.getFullYear()}`;
    };

    // Form State for new PO
    const isCreateMode = action === "create" && prId;
    const relatedPR = prs.find((p) => p.id === prId) || prs[0];
    
    const [poForm, setPoForm] = useState({
        incoterms: "DDP",
        paymentTerms: "Net 30",
        deliveryAddress: "Kho số 1, KCN VSIP 1, Bình Dương",
        penalty: "1",
        gracePeriod: "3",
        specialNotes: ""
    });

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showPreview, setShowPreview] = useState(false);

    const handleSubmitPO = () => {
        setIsSubmitting(true);
        setTimeout(() => {
            // Success
            alert("Đã khởi tạo Đơn mua hàng (PO) thành công hệ thống ERP và gửi cho NCC!");
            router.push("/po");
            setIsSubmitting(false);
        }, 2000);
    };

    if (showPreview) {
        return (
            <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
                <div className="bg-white rounded-2xl w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col h-[90vh] animate-in zoom-in-95 duration-200">
                    <div className="bg-slate-800 text-white p-4 flex justify-between items-center border-b border-slate-700">
                        <div className="flex items-center gap-3">
                            <FileText size={20} className="text-blue-400" />
                            <h3 className="font-bold tracking-widest text-sm">PREVIEW: PURCHASE_ORDER_DRAFT.PDF</h3>
                        </div>
                        <div className="flex gap-2">
                            <button className="p-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-white" title="Download"><DownloadCloud size={16}/></button>
                            <button onClick={() => setShowPreview(false)} className="p-2 bg-slate-700 hover:bg-red-500 rounded-lg text-white"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg></button>
                        </div>
                    </div>
                    
                    <div className="flex-1 bg-slate-200 overflow-y-auto p-8 custom-scrollbar">
                        {/* Mock PDF Document */}
                        <div className="bg-white max-w-3xl mx-auto min-h-full shadow-lg border border-slate-300 p-12 text-slate-800 font-serif">
                            <div className="border-b-4 border-erp-navy pb-6 mb-8 flex justify-between items-end">
                                <div>
                                    <h1 className="text-4xl font-black text-erp-navy mb-2 tracking-tight">PURCHASE ORDER</h1>
                                    <div className="text-sm font-bold text-slate-500 uppercase tracking-widest">ProcurePro Corporation</div>
                                </div>
                                <div className="text-right">
                                    <div className="text-xl font-bold ">PO-2026-DRAFT</div>
                                    <div className="text-sm mt-1">Date: {formatDate(new Date().toISOString())}</div>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-12 mb-12 text-sm">
                                <div>
                                    <h3 className="font-bold text-erp-navy uppercase border-b border-slate-200 pb-2 mb-3">Thông tin Nhà cung cấp</h3>
                                    <div className="font-bold text-lg mb-1">{passedVendor || 'Formosa Corp'}</div>
                                    <div className="text-slate-600 space-y-1">
                                        <p>Lot A1, VSIP 2, Binh Duong</p>
                                        <p>Tax Code: 0123456789</p>
                                        <p>Contact: sales@formosa.com</p>
                                    </div>
                                </div>
                                <div>
                                    <h3 className="font-bold text-erp-navy uppercase border-b border-slate-200 pb-2 mb-3">Điều khoản thanh toán & Giao hàng</h3>
                                    <div className="grid grid-cols-2 gap-2 text-slate-600">
                                        <div className="font-bold text-slate-800">Payment Terms:</div><div>{poForm.paymentTerms}</div>
                                        <div className="font-bold text-slate-800">Incoterms:</div><div>{poForm.incoterms}</div>
                                        <div className="font-bold text-slate-800">Delivery To:</div><div>{poForm.deliveryAddress}</div>
                                    </div>
                                </div>
                            </div>

                            <table className="w-full text-sm mb-12">
                                <thead>
                                    <tr className="bg-slate-100 text-erp-navy">
                                        <th className="py-3 px-4 text-left font-bold border-b border-slate-300">Description</th>
                                        <th className="py-3 px-4 text-center font-bold border-b border-slate-300">Qty</th>
                                        <th className="py-3 px-4 text-right font-bold border-b border-slate-300">Unit Price</th>
                                        <th className="py-3 px-4 text-right font-bold border-b border-slate-300">Amount</th>
                                    </tr>
                                </thead>
                                <tbody className="border-b border-slate-300">
                                    {relatedPR?.items?.map((item, i: number) => (
                                        <tr key={i} className="border-b border-slate-100">
                                            <td className="py-3 px-4">{item.description || item.productName || item.productDesc}</td>
                                            <td className="py-3 px-4 text-center ">{item.qty}</td>
                                            <td className="py-3 px-4 text-right ">{item.estimatedPrice.toLocaleString()}</td>
                                            <td className="py-3 px-4 text-right  font-bold">{(Number(item.qty || 0) * item.estimatedPrice).toLocaleString()}</td>
                                        </tr>
                                    ))}
                                    {(!relatedPR?.items) && (
                                        <tr>
                                            <td colSpan={4} className="py-3 px-4 italic text-slate-400">Các mặt hàng theo báo giá đính kèm...</td>
                                        </tr>
                                    )}
                                </tbody>
                                <tfoot>
                                    <tr>
                                        <td colSpan={3} className="py-4 px-4 text-right font-bold text-slate-600 uppercase">Total Amount:</td>
                                        <td className="py-4 px-4 text-right font-bold  text-xl text-erp-navy">
                                            {passedPrice ? Number(passedPrice).toLocaleString() : relatedPR?.totalEstimate?.toLocaleString()} ₫
                                        </td>
                                    </tr>
                                </tfoot>
                            </table>

                            <div className="text-xs text-slate-500 bg-slate-50 p-6 rounded-lg border border-slate-200 leading-relaxed font-sans">
                                <strong>CHẾ TÀI / PENALTY:</strong> Trong trường hợp chậm giao hàng, bên Bán chịu phạt {poForm.penalty}% giá trị lùi hợp đồng cho mỗi ngày trễ (sau {poForm.gracePeriod} ngày ân hạn).<br/>
                                <strong>GHI CHÚ:</strong> {poForm.specialNotes || 'Tuân thủ nghiêm ngặt chuẩn an toàn kho.'}
                            </div>
                        </div>
                    </div>

                    <div className="p-6 bg-white border-t border-slate-200 flex justify-between items-center">
                        <div className="text-xs text-slate-500 font-bold uppercase tracking-widest flex items-center gap-2">
                             <ShieldCheck size={16} className="text-emerald-500" /> Bản nháp hợp lệ
                        </div>
                        <div className="flex gap-4">
                            <button onClick={() => setShowPreview(false)} className="px-6 py-3 font-black text-slate-500 hover:bg-slate-100 rounded-xl text-xs uppercase tracking-widest transition-colors">Đóng lại</button>
                            <button onClick={handleSubmitPO} disabled={isSubmitting} className="btn-primary shadow-xl shadow-erp-navy/30 bg-erp-navy">
                                {isSubmitting ? 'Đang thực thi...' : 'Xác nhận & Gửi PO'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (isCreateMode) {
        return (
            <main className="pt-16 px-8 pb-12 animate-in fade-in duration-300">
                <DashboardHeader breadcrumbs={["Nghiệp vụ tài chính", "PO", "Khởi tạo Đơn mua hàng"]} />

                <div className="mt-8 flex justify-between items-end mb-8 border-b border-slate-200 pb-4">
                    <div>
                        <h1 className="text-3xl font-black text-erp-navy tracking-tight flex items-center gap-3">
                            Khởi tạo Purchase Order (PO)
                        </h1>
                        <p className="text-sm text-slate-500 mt-1">Hệ thống auto-fill dữ liệu từ Báo giá đã chọn.</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
                    {/* Cột trái: Form Thông tin */}
                    <div className="xl:col-span-3 space-y-8">
                        
                        {/* Summary Header */}
                        <div className="bg-linear-to-r from-slate-50 to-blue-50/50 p-6 rounded-2xl border border-blue-100 flex flex-wrap gap-8 items-center shadow-sm">
                            <div>
                                <div className="text-[10px] font-black uppercase text-slate-400 mb-1">Tham chiếu PR</div>
                                <div className="font-bold text-erp-blue flex items-center gap-1"><FileText size={14}/> {prId}</div>
                            </div>
                            <div className="h-8 w-px bg-slate-200"></div>
                            <div>
                                <div className="text-[10px] font-black uppercase text-slate-400 mb-1">Nhà cung cấp đã chọn</div>
                                <div className="font-black text-erp-navy text-lg">{passedVendor || 'N/A'}</div>
                            </div>
                            <div className="h-8 w-px bg-slate-200"></div>
                            <div>
                                <div className="text-[10px] font-black uppercase text-slate-400 mb-1">Tổng GT Đơn hàng</div>
                                <div className="font-black  text-emerald-600 text-lg">
                                    {passedPrice ? Number(passedPrice).toLocaleString() : 'N/A'} ₫
                                </div>
                            </div>
                            
                            <div className="flex-1 text-right">
                                <span className="inline-flex items-center gap-1 bg-white border border-emerald-200 text-emerald-600 text-[9px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg shadow-sm">
                                    <CheckCircle size={12}/> Auto-filled từ Quotation
                                </span>
                            </div>
                        </div>

                        {/* PO Info Fields */}
                        <div className="erp-card shadow-sm border border-slate-200">
                            <h3 className="text-sm font-black uppercase tracking-widest text-erp-navy mb-6 flex items-center gap-2 border-b border-slate-100 pb-4">
                                <FileCheck size={16} /> Thông tin Hợp đồng / PO
                            </h3>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                                <div>
                                    <label className="block text-[10px] font-black uppercase text-slate-400 tracking-widest mb-2">Số PO (Tự động)</label>
                                    <input type="text" className="erp-input w-full bg-slate-100  font-bold text-slate-500 cursor-not-allowed" value="PO-2026-DRAFT" disabled />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black uppercase text-slate-400 tracking-widest mb-2">Ngày phát hành</label>
                                    <div className="relative group/date">
                                        <input 
                                            type="text" 
                                            readOnly
                                            className="erp-input w-full  font-bold h-12 group-focus-within/date:ring-2 group-focus-within/date:ring-erp-blue transition-all" 
                                            value={formatDate(new Date().toISOString())} 
                                        />
                                        <input 
                                            type="date"
                                            className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10"
                                            defaultValue={new Date().toISOString().substring(0, 10)} 
                                            // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                            onClick={(e) => (e.currentTarget as any).showPicker?.()}
                                        />
                                    </div>
                                </div>
                                
                                <div>
                                    <label className="block text-[10px] font-black uppercase text-slate-400 tracking-widest mb-2">Điều kiện Incoterms</label>
                                    <select 
                                        className="erp-input w-full focus:border-erp-blue"
                                        value={poForm.incoterms}
                                        onChange={e => setPoForm({...poForm, incoterms: e.target.value})}
                                    >
                                        <option value="DDP">DDP - Giao hàng đã nộp thuế</option>
                                        <option value="EXW">EXW - Giao tại xưởng (Ex Works)</option>
                                        <option value="FOB">FOB - Giao lên tàu (Free On Board)</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black uppercase text-slate-400 tracking-widest mb-2">Điều kiện thanh toán</label>
                                    <select 
                                        className="erp-input w-full focus:border-erp-blue"
                                        value={poForm.paymentTerms}
                                        onChange={e => setPoForm({...poForm, paymentTerms: e.target.value})}
                                    >
                                        <option value="Net 30">Net 30 (Thanh toán 30 ngày sau DO)</option>
                                        <option value="Net 45">Net 45 (Thanh toán 45 ngày sau DO)</option>
                                        <option value="100% Adv">100% Trả trước (TT)</option>
                                    </select>
                                </div>
                            </div>
                            
                            <div className="mb-6">
                                <label className="block text-[10px] font-black uppercase text-slate-400 tracking-widest mb-2">Địa chỉ giao hàng (Delivery to)</label>
                                <input 
                                    type="text" 
                                    className="erp-input w-full focus:border-erp-blue" 
                                    value={poForm.deliveryAddress}
                                    onChange={e => setPoForm({...poForm, deliveryAddress: e.target.value})}
                                />
                            </div>
                            
                        </div>

                        {/* Điểu khoản Phạt (Penalty) - 5.4 Spec */}
                        <div className="erp-card shadow-sm border border-slate-200 bg-orange-50/30">
                            <h3 className="text-sm font-black uppercase tracking-widest text-erp-navy mb-6 flex items-center gap-2 border-b border-slate-100 pb-4">
                                <ShieldCheck size={16} className="text-orange-500" /> Chế tài / Điều khoản phạt
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                                <div className="relative">
                                    <label className="block text-[10px] font-black uppercase text-slate-400 tracking-widest mb-2">% Phạt / Ngày trễ giao</label>
                                    <div className="relative">
                                        <input type="number" className="erp-input w-full pr-10 border-orange-200 focus:border-orange-500" value={poForm.penalty} onChange={e => setPoForm({...poForm, penalty: e.target.value})} />
                                        <span className="absolute right-4 top-1/2 -translate-y-1/2 font-black text-slate-400">%</span>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black uppercase text-slate-400 tracking-widest mb-2">Số ngày ân hạn (Grace Period)</label>
                                    <div className="relative">
                                        <input type="number" className="erp-input w-full pr-16 border-orange-200 focus:border-orange-500" value={poForm.gracePeriod} onChange={e => setPoForm({...poForm, gracePeriod: e.target.value})} />
                                        <span className="absolute right-4 top-1/2 -translate-y-1/2 font-black text-slate-400 text-[10px] uppercase">Ngày</span>
                                    </div>
                                </div>
                            </div>
                            <div>
                                <label className="block text-[10px] font-black uppercase text-slate-400 tracking-widest mb-2">Điều khoản đặc biệt (Special SLA/NDA)</label>
                                <textarea 
                                    className="erp-input w-full h-24 bg-white focus:border-orange-500 text-sm" 
                                    placeholder="Ví dụ: Đền bù 200% nếu dính hàng giả, bắt buộc ký NDA trước khi xem bản vẽ..."
                                    value={poForm.specialNotes}
                                    onChange={e => setPoForm({...poForm, specialNotes: e.target.value})}
                                ></textarea>
                            </div>
                        </div>

                        {/* Line Items (Locked) */}
                        <div className="erp-card p-0! shadow-sm border border-slate-200 overflow-hidden">
                            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                                <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-2">
                                    <Lock size={14} /> Chi tiết Items (Khóa giá từ Báo giá)
                                </h3>
                            </div>
                            <table className="erp-table text-xs m-0 border-none!">
                                <thead>
                                    <tr>
                                        <th>Mô tả</th>
                                        <th className="text-center w-20">SL</th>
                                        <th className="text-right w-32">Đơn giá (Lock)</th>
                                        <th className="text-right w-32">Thành tiền</th>
                                        <th className="w-1/4">Ghi chú vận hành</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {relatedPR?.items?.map((item, idx: number) => (
                                        <tr key={idx} className="border-b border-slate-50">
                                            <td className="font-bold text-erp-navy">{item.description || item.productName}</td>
                                            <td className="text-center font-black">{item.qty || 0}</td>
                                            <td className="text-right  text-slate-500">{item.estimatedPrice.toLocaleString()}</td>
                                            <td className="text-right  font-black text-erp-blue">{(Number(item.qty || 0) * item.estimatedPrice).toLocaleString()} ₫</td>
                                            <td><input type="text" className="erp-input py-1! text-[10px]! w-full bg-slate-50 font-medium" placeholder="Ghi chú item..." /></td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Cột phải: Settings, Attachments & Submit */}
                    <div className="space-y-6">
                        <div className="erp-card shadow-sm border border-slate-200">
                             <h3 className="text-xs font-black uppercase tracking-widest text-erp-navy mb-4 flex items-center gap-2">
                                 <UploadCloud size={16} /> Tài liệu Đính kèm Legal
                             </h3>
                             <p className="text-[10px] text-slate-500 mb-4 font-medium leading-relaxed">Bộ phận Mua Hàng cần bắt buộc upload các bản PDF tiêu chuẩn cho nhà cung cấp.</p>
                             
                             <div className="space-y-3">
                                 <div className="flex items-center gap-3 p-3 border border-emerald-200 bg-emerald-50 rounded-xl">
                                     <div className="p-2 bg-emerald-100 text-emerald-600 rounded-lg"><CheckCircle size={14}/></div>
                                     <div className="flex-1">
                                         <div className="text-[10px] font-black uppercase text-emerald-800 tracking-wider">Bản HĐ Điện Tử.pdf</div>
                                         <div className="text-[9px] text-emerald-600 font-bold">Quotation_Signed</div>
                                     </div>
                                 </div>
                                 
                                 <div className="flex items-center gap-3 p-3 border border-dashed border-slate-300 rounded-xl hover:bg-slate-50 cursor-pointer transition-colors">
                                     <div className="p-2 bg-slate-100 text-slate-400 rounded-lg"><UploadCloud size={14}/></div>
                                     <div className="flex-1">
                                         <div className="text-[10px] font-black uppercase text-slate-600 tracking-wider">Tech Spec / NDA</div>
                                         <div className="text-[9px] text-slate-400 font-bold">Chưa có file</div>
                                     </div>
                                 </div>
                             </div>
                        </div>

                        <div className="erp-card shadow-lg shadow-erp-navy/5 border-2 border-erp-blue rounded-2xl relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-4 opacity-10"><Send size={80} className="text-erp-blue" fill="currentColor"/></div>
                            <div className="relative z-10 space-y-4">
                                <div>
                                    <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Xác nhận PO</div>
                                    <p className="text-xs font-bold text-erp-navy leading-relaxed mb-4">Mọi thông tin sẽ được đóng dấu và gửi tự động qua cổng Portal B2B.</p>
                                </div>
                                
                                <button 
                                    onClick={() => setShowPreview(true)}
                                    className="w-full py-3 bg-blue-50 hover:bg-blue-100 text-erp-blue border border-blue-200 rounded-xl font-black uppercase tracking-widest text-[10px] transition-colors flex items-center justify-center gap-2"
                                >
                                    <Eye size={14} /> Xem PDF Nháp (Preview)
                                </button>
                                
                                <button 
                                    onClick={() => setShowPreview(true)}
                                    className="w-full py-4 bg-erp-navy hover:bg-erp-blue border border-erp-navy hover:border-erp-blue shadow-xl text-white rounded-xl font-black uppercase tracking-widest text-xs transition-colors flex items-center justify-center gap-2"
                                >
                                    <ShieldCheck size={16} /> Submit Để Phê Duyệt PO
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        )
    }

    // Default LIST view
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

            <div className="erp-card p-0! overflow-hidden shadow-xl shadow-erp-navy/5">
                <table className="erp-table text-xs">
                    <thead>
                        <tr className="bg-slate-50">
                            <th>Mã PO</th>
                            <th>Nhà cung cấp</th>
                            <th className="text-right">Giá trị (VNĐ)</th>
                            <th className="text-center">Ngày phát hành</th>
                            <th className="text-center">Ngân sách</th>
                            <th className="text-center">Trạng thái</th>
                            <th className="text-right">Hành động</th>
                        </tr>
                    </thead>
                    <tbody>
                        {pos.length > 0 ? pos.map((po) => (
                            <tr key={po.id} className="hover:bg-slate-50">
                                <td className="font-bold text-erp-navy flex items-center gap-2"><FileText size={14} className="text-erp-blue"/> {po.id}</td>
                                <td className="font-bold text-slate-700">{po.vendor}</td>
                                <td className=" font-black text-right text-erp-blue text-sm">{po.total.toLocaleString()} ₫</td>
                                <td className="text-slate-500 text-xs text-center">{formatDate(po.createdAt)}</td>
                                <td className="text-center">
                                    <div className="inline-flex items-center gap-1 text-[10px] font-black text-erp-navy bg-slate-100 px-2 py-1 rounded uppercase tracking-tighter">
                                        <Lock size={10} /> Committed
                                    </div>
                                </td>
                                <td className="text-center">
                                    <span className={`status-pill ${po.status === 'PAID' ? 'status-approved' :
                                            po.status === 'SHIPPED' ? 'status-pending' : 'status-draft'
                                        }`}>
                                        {po.status}
                                    </span>
                                </td>
                                <td className="text-right">
                                    <div className="flex justify-end items-center gap-2">
                                        {po.status === "SHIPPED" && (
                                            <button
                                                onClick={() => router.push("/warehouse/dashboard")}
                                                className="bg-emerald-50 text-emerald-600 hover:bg-emerald-500 hover:text-white px-3 py-1.5 rounded-lg text-[10px] font-black uppercase flex items-center gap-1 transition-all"
                                            >
                                                Nhập kho <ArrowRight size={12} />
                                            </button>
                                        )}
                                        <button className="p-1.5 text-slate-400 hover:bg-slate-100 hover:text-erp-navy rounded-lg transition-colors"><Eye size={16} /></button>
                                    </div>
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
        </main>
    );
}
