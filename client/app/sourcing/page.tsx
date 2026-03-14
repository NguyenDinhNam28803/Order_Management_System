"use client";

import React, { useState } from "react";
import DashboardHeader from "../components/DashboardHeader";
import { Search, Filter, ChevronRight, Zap, Target, BarChart4, CheckCircle2, Trophy, Clock, FileText, UploadCloud, Users, Layers, AlertCircle, Send, CheckCircle, ArrowRight, Activity } from "lucide-react";
import { useProcurement } from "../context/ProcurementContext";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function SourcingPage() {
    const { prs, rfqs, createRFQ, createPO, currentUser } = useProcurement();
    const router = useRouter();

    const [viewState, setViewState] = useState<"PR_QUEUE" | "CREATE_RFQ" | "COMPARE_RFQ">("PR_QUEUE");
    
    const listPRs = prs.filter(p => p.status === "APPROVED" || p.status === "SOURCING");
    const [selectedPR, setSelectedPR] = useState<any>(null);

    const [rfqType, setRfqType] = useState("RFQ");
    const [selectedVendors, setSelectedVendors] = useState<any[]>([]);

    const vendors = [
        { id: "v1", name: "Formosa Corp", price: 205000000, quality: 98, delivery: 95, aiScore: 96, reason: "Lịch sử đối soát 3 bên khớp 100%. Ưu tiên.", leadTime: "14 ngày", payment: "Net 30" },
        { id: "v2", name: "Thai Binh Cotton", price: 198000000, quality: 85, delivery: 80, aiScore: 82, reason: "Giá rẻ nhất nhưng rủi ro chất lượng.", leadTime: "20 ngày", payment: "Net 45" },
        { id: "v3", name: "Global Industrial", price: 215000000, quality: 92, delivery: 99, aiScore: 91, reason: "Phí vận chuyển cao, giao cực nhanh.", leadTime: "7 ngày", payment: "100% Adv" },
    ];

    const unselectedVendors = vendors.filter(v => !selectedVendors.find(sv => sv.id === v.id));

    const rfqsForSelectedPR = rfqs.filter(r => r.prId === selectedPR?.id && r.status === "QUOTED");
    const comparisonVendors = rfqsForSelectedPR.map((r, i) => ({
        id: r.id,
        name: r.vendor,
        price: r.quotation?.total || 0,
        leadTime: r.quotation?.leadTime || "N/A",
        payment: r.quotation?.paymentTerms || "N/A",
        quality: 95 - i, // mocked slightly diff values
    }));

    const handleCreateRFQ = (pr: any) => {
        setSelectedPR(pr);
        setViewState("CREATE_RFQ");
    };

    const handleSendRFQ = () => {
        if(selectedVendors.length < 3) {
            alert("Vui lòng chọn ít nhất 3 nhà cung cấp để mời thầu cạnh tranh.");
            return;
        }
        selectedVendors.forEach(v => {
            createRFQ(selectedPR.id, v.name);
        });
        alert("Đã gửi thông báo mời thầu (RFQ) tới các Vendor! Chờ họ điền báo giá.");
        setViewState("PR_QUEUE");
        setSelectedVendors([]);
    };

    const handleSelectWinningVendor = (vendor: any) => {
        if (!selectedPR) return;
        createPO(selectedPR.id, vendor.name, selectedPR.total, vendor.id); 
        // Mock using total for PO - standard cost. vendor id acts as RFQ id in our simplified view.
        alert(`Đã chọn thầu: ${vendor.name}. Đã tạo PO thành công.`);
        setViewState("PR_QUEUE");
    };

    return (
        <main className="pt-16 px-8 pb-12">
            <DashboardHeader breadcrumbs={["Nghiệp vụ", "Quản lý Sourcing (RFQ/Compare)"]} />

            {/* View: PR QUEUE (5.1) */}
            {viewState === "PR_QUEUE" && (
                <div className="animate-in fade-in duration-300">
                    <div className="mt-8 flex justify-between items-end mb-8">
                        <div>
                            <h1 className="text-3xl font-black text-erp-navy tracking-tight">Danh sách PR đang chờ xử lý</h1>
                            <p className="text-sm text-slate-500 mt-1">Các Yêu cầu (PR) đã được duyệt, chờ Buyer đánh giá và tạo bảng chào giá (RFQ).</p>
                        </div>
                    </div>

                    {/* Filter Bar */}
                    <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 mb-6 flex gap-4 items-center flex-wrap">
                        <div className="flex items-center gap-2 font-bold text-xs uppercase tracking-widest text-slate-500"><Filter size={16}/> Bộ lọc:</div>
                        <select className="erp-input !py-2 !text-xs bg-slate-50 w-40">
                            <option>Tất cả danh mục</option>
                            <option>Vật tư tiêu hao</option>
                            <option>Thiết bị y tế</option>
                        </select>
                        <select className="erp-input !py-2 !text-xs bg-slate-50 w-40">
                            <option>Chưa Assign</option>
                            <option>Assigned cho tôi</option>
                        </select>
                        <div className="flex-1"></div>
                        <div className="flex bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 items-center gap-2">
                            <Search size={14} className="text-slate-400" />
                            <input type="text" placeholder="Tìm theo số PR, tiêu đề..." className="text-xs bg-transparent outline-none font-bold w-48" />
                        </div>
                    </div>

                    <div className="erp-card !p-0 overflow-hidden shadow-xl shadow-erp-navy/5 border border-slate-200">
                        <table className="erp-table text-xs">
                            <thead>
                                <tr className="bg-slate-50">
                                    <th>Số PR</th>
                                    <th>Tiêu đề</th>
                                    <th className="text-right">Tổng giá trị</th>
                                    <th className="text-center">Ngày duyệt</th>
                                    <th className="text-center">SLA còn lại</th>
                                    <th className="text-center">Buyer phụ trách</th>
                                    <th className="text-center">Thao tác Nhanh</th>
                                </tr>
                            </thead>
                            <tbody>
                                {listPRs.map((pr) => (
                                    <tr key={pr.id} className="hover:bg-slate-50 border-b border-slate-100">
                                        <td className="font-bold text-erp-navy">{pr.id}</td>
                                        <td className="font-bold text-slate-700 max-w-[200px] truncate" title={pr.reason}>{pr.reason}</td>
                                        <td className="text-right font-mono font-black text-erp-blue">{pr.total.toLocaleString()} ₫</td>
                                        <td className="text-center">{pr.createdAt}</td>
                                        <td className="text-center">
                                            <span className="text-[10px] font-black uppercase text-emerald-600 bg-emerald-50 px-2 py-1 rounded">2 Ngày</span>
                                        </td>
                                        <td className="text-center">
                                            <span className="text-[10px] font-bold text-slate-400">Chưa assign</span>
                                        </td>
                                        <td className="text-center">
                                            {pr.status === "APPROVED" ? (
                                                <button 
                                                    onClick={() => handleCreateRFQ(pr)}
                                                    className="bg-erp-navy text-white text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg hover:bg-erp-blue transition-all"
                                                >
                                                    Tạo RFQ
                                                </button>
                                            ) : pr.status === "SOURCING" && rfqs.some(r => r.prId === pr.id && r.status === "QUOTED") ? (
                                                <button 
                                                    onClick={() => { setSelectedPR(pr); setViewState("COMPARE_RFQ"); }}
                                                    className="bg-emerald-600 animate-pulse text-white text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg hover:bg-emerald-500 transition-all"
                                                >
                                                    So Sánh & Nhận Thầu
                                                </button>
                                            ) : (
                                                <span className="text-[10px] font-bold text-slate-400">Chờ NCC Báo Giá</span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                                {listPRs.length === 0 && (
                                    <tr>
                                        <td colSpan={7} className="text-center py-12 text-slate-400 font-bold uppercase tracking-widest">
                                            Không có PR nào đang chờ xử lý.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* View: CREATE RFQ (5.2) */}
            {viewState === "CREATE_RFQ" && selectedPR && (
                 <div className="animate-in fade-in slide-in-from-right-8 duration-300">
                    <div className="flex items-center gap-4 mb-6 relative">
                        <button onClick={() => setViewState("PR_QUEUE")} className="p-2 border border-slate-200 rounded-lg text-slate-400 hover:text-erp-navy hover:bg-slate-100"><ArrowLeftIcon /></button>
                        <h1 className="text-2xl font-black text-erp-navy">Tạo Yêu cầu Báo giá (RFQ)</h1>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Cột trái: Form thông tin RFQ */}
                        <div className="lg:col-span-2 space-y-6">
                            {/* PR Link */}
                            <div className="bg-blue-50/50 border border-blue-100 rounded-xl p-4 flex justify-between items-center">
                                <div className="flex gap-4 items-center">
                                    <div className="p-2 bg-white rounded-lg shadow-sm text-erp-blue"><FileText size={20}/></div>
                                    <div>
                                        <div className="text-[10px] uppercase font-black tracking-widest text-slate-400">Tham chiếu từ PR</div>
                                        <div className="font-bold text-erp-navy">{selectedPR.id} - {selectedPR.reason}</div>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="text-[10px] uppercase font-black tracking-widest text-slate-400">Ngân sách dự kiến</div>
                                    <div className="font-mono font-black text-erp-blue text-lg">{selectedPR.total.toLocaleString()} ₫</div>
                                </div>
                            </div>

                            <div className="erp-card shadow-sm border border-slate-200">
                                <div className="flex gap-4 mb-6 border-b border-slate-100 pb-4">
                                    <button 
                                        onClick={() => setRfqType("RFQ")}
                                        className={`flex-1 py-2 font-black uppercase tracking-widest text-xs rounded-lg transition-all ${rfqType === 'RFQ' ? 'bg-erp-navy text-white' : 'bg-slate-50 text-slate-500'}`}
                                    >RFQ (Hàng tiêu chuẩn)</button>
                                    <button 
                                        onClick={() => setRfqType("RFP")}
                                        className={`flex-1 py-2 font-black uppercase tracking-widest text-xs rounded-lg transition-all ${rfqType === 'RFP' ? 'bg-erp-navy text-white' : 'bg-slate-50 text-slate-500'}`}
                                    >RFP (Dịch vụ/Phức tạp)</button>
                                </div>

                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-xs font-black uppercase text-slate-500 mb-2">Mô tả kỹ thuật chi tiết</label>
                                        <textarea className="erp-input w-full h-24 bg-slate-50" placeholder="Nhập các yêu cầu kỹ thuật đặc biệt mà bản thân PR chưa miêu tả đủ..."></textarea>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-black uppercase text-slate-500 mb-2">Điều kiện Incoterms</label>
                                            <select className="erp-input w-full bg-slate-50">
                                                <option>DDP - Giao hàng đã nộp thuế</option>
                                                <option>EXW - Giao tại xưởng</option>
                                                <option>FOB - Giao lên tàu</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-black uppercase text-slate-500 mb-2">Hạn nộp báo giá (Deadline)</label>
                                            <input type="datetime-local" className="erp-input w-full bg-slate-50 font-mono" />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-black uppercase text-slate-500 mb-2">Địa điểm giao hàng</label>
                                        <input type="text" className="erp-input w-full bg-slate-50" defaultValue="- Kho số 1, KCN VSIP 1, Bình Dương" />
                                    </div>
                                    
                                    <div className="border border-dashed border-slate-300 rounded-xl p-6 text-center bg-slate-50 hover:bg-slate-100 transition-colors cursor-pointer group">
                                        <UploadCloud size={24} className="mx-auto text-slate-400 group-hover:text-erp-blue mb-2 transition-colors" />
                                        <div className="text-xs font-bold text-erp-navy">Upload thư mục Spec/Chứng chỉ yêu cầu (PDF, Word)</div>
                                        <div className="text-[10px] text-slate-400 mt-1">Kéo thả file vào đây hoặc click để duyệt</div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Cột phải: Chọn nhà cung cấp mời thầu */}
                        <div className="space-y-6">
                            <div className="erp-card shadow-sm border border-slate-200">
                                <h3 className="text-xs font-black uppercase tracking-widest text-erp-navy mb-4 flex items-center gap-2">
                                    <Users size={16} /> Chọn NCC Mời Báo Giá
                                </h3>

                                <div className="space-y-2 mb-6">
                                    <div className="flex justify-between items-center bg-slate-50 p-2 rounded text-[10px] font-black uppercase text-slate-500 tracking-widest">
                                        <span>Đã thêm ({selectedVendors.length}/3 yêu cầu tối thiểu)</span>
                                    </div>
                                    {selectedVendors.map(v => (
                                        <div key={v.id} className="p-3 border border-emerald-200 bg-emerald-50 rounded-lg flex justify-between items-center group">
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <span className="font-bold text-emerald-800 text-xs">{v.name}</span>
                                                    {v.aiScore > 90 && <span title="AI Suggested"><Target size={12} className="text-amber-500" /></span>}
                                                </div>
                                                <div className="text-[10px] text-emerald-600 font-mono">Điểm KPI: {v.quality}</div>
                                            </div>
                                            <button onClick={() => setSelectedVendors(prev => prev.filter(sv => sv.id !== v.id))} className="text-emerald-400 hover:text-red-500">
                                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"></path></svg>
                                            </button>
                                        </div>
                                    ))}
                                    {selectedVendors.length === 0 && (
                                        <div className="p-4 border border-dashed border-slate-200 text-center text-[10px] font-bold text-slate-400 uppercase">
                                            Chưa chọn nhà cung cấp nào
                                        </div>
                                    )}
                                </div>

                                <div>
                                    <div className="flex justify-between items-center mb-3">
                                        <div className="text-[10px] font-black uppercase text-slate-500 tracking-widest flex items-center gap-1">
                                            <Zap size={10} className="text-amber-500 fill-amber-500"/> Gợi ý từ AI 
                                        </div>
                                    </div>
                                    <div className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar">
                                        {unselectedVendors.map(v => (
                                            <div key={v.id} className="p-3 border border-slate-100 rounded-lg hover:border-erp-blue hover:bg-blue-50 transition-all flex justify-between items-center group cursor-pointer" onClick={() => setSelectedVendors(prev => [...prev, v])}>
                                                <div>
                                                    <div className="font-bold text-slate-700 text-xs">{v.name}</div>
                                                    <div className="text-[10px] text-slate-400 font-mono">Scoring: <span className="text-emerald-500 font-black">{v.aiScore}</span></div>
                                                </div>
                                                <div className="hidden group-hover:block text-erp-blue font-black text-xs">+ Thêm</div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <button onClick={handleSendRFQ} className={`w-full btn-primary flex items-center justify-center gap-2 uppercase tracking-widest text-xs py-4 shadow-xl ${selectedVendors.length < 3 ? 'opacity-50 cursor-not-allowed grayscale' : 'shadow-erp-navy/30'}`}>
                                <Send size={16} /> Preview & Gửi Lời Mời ({selectedVendors.length} NCC)
                            </button>
                        </div>
                    </div>
                 </div>
            )}

            {/* View: COMPARE QUOTATIONS (5.3) */}
            {viewState === "COMPARE_RFQ" && selectedPR && (
                 <div className="animate-in fade-in slide-in-from-bottom-8 duration-500">
                    <div className="bg-erp-navy text-white rounded-2xl p-6 shadow-xl shadow-erp-navy/10 mb-8 flex justify-between items-center">
                        <div>
                            <div className="flex items-center gap-2 text-white/50 text-[10px] font-black uppercase tracking-widest mb-1">
                                <Layers size={14}/> Comparison Matrix
                            </div>
                            <h1 className="text-2xl font-black flex items-center gap-3">
                                Bảng So Sánh Báo Giá RFQ-{selectedPR.id}
                            </h1>
                        </div>
                        <div className="text-right">
                            <div className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">Trạng thái vòng nộp báo giá</div>
                            <div className="text-sm font-bold flex items-center justify-end gap-2">
                                <span className="p-1 px-2 bg-emerald-500/20 rounded">Đã nhận: 3/3</span>
                                <span className="p-1 px-2 bg-slate-800 rounded text-slate-400 line-through">Hạn chót: 20/03</span>
                            </div>
                        </div>
                    </div>

                    {/* AI Recommendation Banner */}
                    <div className="bg-gradient-to-r from-indigo-600 to-erp-blue text-white rounded-xl shadow-lg mb-8 flex items-stretch overflow-hidden relative border border-indigo-500/50">
                        <div className="absolute top-0 right-0 p-8 opacity-10"><Zap size={120} /></div>
                        <div className="p-6 md:p-8 flex-1 relative z-10 flex flex-col justify-center">
                            <div className="flex items-center gap-2 mb-2">
                                <span className="bg-white text-indigo-700 text-[10px] font-black uppercase px-2 py-0.5 rounded shadow">AI Pick</span>
                            </div>
                            <h2 className="text-2xl font-black mb-2">Formosa Corp</h2>
                            <p className="text-indigo-100 text-sm leading-relaxed max-w-2xl">
                                Dựa trên điểm số phân tích đa chiều (Giá 40%, Chất lượng 40%, Giao hàng 20%), hệ thống AI Procurement đề xuất <strong>Formosa Corp</strong>. Lịch sử đối soát 3 bên khớp 100%, đảm bảo rủi ro vận hành thấp nhất cho đơn hàng này.
                            </p>
                        </div>
                        <div className="w-1/3 bg-black/20 p-6 flex items-center justify-center backdrop-blur-sm">
                             {/* Mock Radar Chart Logic via CSS circles & bars */}
                             <div className="relative w-32 h-32 rounded-full border-4 border-indigo-400/30 flex items-center justify-center shrink-0">
                                 <div className="absolute inset-0 bg-white/10 rounded-full" style={{ clipPath: 'polygon(50% 0%, 90% 20%, 100% 60%, 75% 100%, 25% 100%, 0% 60%, 10% 20%)'}}></div>
                                 <div className="absolute inset-2 bg-emerald-400/40 rounded-full blur-md" style={{ clipPath: 'polygon(50% 10%, 80% 30%, 90% 60%, 70% 90%, 30% 90%, 10% 60%, 20% 30%)'}}></div>
                                 <div className="text-center relative z-10">
                                     <div className="text-[10px] font-black uppercase text-indigo-200">AI Score</div>
                                     <div className="text-3xl font-black font-mono">96</div>
                                 </div>
                             </div>
                        </div>
                    </div>

                    {/* Bảng so sánh Ma trận */}
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-x-auto mb-8">
                        {comparisonVendors.length === 0 ? (
                            <div className="p-8 text-center text-slate-400 font-bold uppercase tracking-widest">Đang tính toán kết quả giải mã báo giá...</div>
                        ) : (
                        <table className="w-full text-sm text-left align-top">
                            <thead className="bg-slate-50 border-b border-slate-200">
                                <tr>
                                    <th className="p-4 border-r border-slate-200 text-xs font-black uppercase text-slate-500 tracking-widest w-48 bg-slate-100/50">Tiêu chí \ Nhà cung cấp</th>
                                    {comparisonVendors.map((v, i) => (
                                        <th key={v.id} className={`p-4 border-r border-slate-200 text-center ${i===0 ? 'bg-indigo-50/50' : ''}`}>
                                            <div className="flex justify-center mb-2">
                                                <div className="w-10 h-10 bg-slate-200 rounded-xl flex items-center justify-center font-black text-slate-500 shadow-inner">{v.name.charAt(0)}</div>
                                            </div>
                                            <div className={`font-black uppercase tracking-tight text-lg ${i===0 ? 'text-indigo-700' : 'text-erp-navy'}`}>
                                                {v.name}
                                                {i===0 && <Zap size={12} className="inline ml-1 text-amber-500 fill-amber-500 align-top" />}
                                                <div className="text-[10px] text-slate-400 font-mono mt-1">Ref: {v.id}</div>
                                            </div>
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {/* Rows: Giá TỔNG */}
                                <tr className="border-b border-slate-100 group">
                                    <td className="p-4 border-r border-slate-200 font-bold text-slate-600 bg-slate-50 group-hover:bg-slate-100 transition-colors">Giá tổng hợp</td>
                                    {comparisonVendors.map(v => (
                                        <td key={v.id} className="p-4 border-r border-slate-200 text-center font-mono font-black text-lg text-erp-navy">{v.price.toLocaleString()} ₫</td>
                                    ))}
                                </tr>
                                
                                {/* Rows: Lead time */}
                                <tr className="border-b border-slate-100 group">
                                    <td className="p-4 border-r border-slate-200 font-bold text-slate-600 bg-slate-50 group-hover:bg-slate-100 transition-colors">Thời gian giao hàng</td>
                                    {comparisonVendors.map(v => (
                                        <td key={v.id} className="p-4 border-r border-slate-200 text-center font-bold text-slate-700">{v.leadTime} ngày</td>
                                    ))}
                                </tr>

                                {/* Rows: Điều khoản TT */}
                                <tr className="border-b border-slate-100 group">
                                    <td className="p-4 border-r border-slate-200 font-bold text-slate-600 bg-slate-50 group-hover:bg-slate-100 transition-colors">Điều khoản thanh toán</td>
                                    {comparisonVendors.map(v => (
                                        <td key={v.id} className="p-4 border-r border-slate-200 text-center font-bold text-slate-700">{v.payment}</td>
                                    ))}
                                </tr>

                                {/* Rows: KPI */}
                                <tr className="group">
                                    <td className="p-4 border-r border-slate-200 font-bold text-slate-600 bg-slate-50 group-hover:bg-slate-100 transition-colors">Điểm KPI Chất lượng lịch sử</td>
                                    {comparisonVendors.map(v => (
                                        <td key={v.id} className="p-4 border-r border-slate-200 text-center">
                                            <div className="font-mono font-black text-emerald-600 bg-emerald-50 inline-block px-3 py-1 rounded">{v.quality}%</div>
                                        </td>
                                    ))}
                                </tr>

                                {/* Action Buttons Row */}
                                <tr className="bg-slate-50 border-t-2 border-slate-200">
                                    <td className="p-4 border-r border-slate-200 font-black uppercase text-xs text-slate-400 text-right">Quyết định</td>
                                    {comparisonVendors.map(v => (
                                        <td key={v.id} className="p-4 border-r border-slate-200 text-center">
                                            <div className="flex flex-col gap-2">
                                                <button onClick={() => handleSelectWinningVendor(v)} className="w-full bg-erp-navy hover:bg-erp-blue text-white py-3 rounded-xl font-black text-xs uppercase tracking-widest transition-colors shadow-lg shadow-erp-navy/20">
                                                    Chọn NCC này
                                                </button>
                                            </div>
                                        </td>
                                    ))}
                                </tr>
                            </tbody>
                        </table>
                        )}
                    </div>
                 </div>
            )}

        </main>
    );
}

function ArrowLeftIcon() {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m12 19-7-7 7-7"/><path d="M19 12H5"/></svg>
    )
}
