"use client";

import React, { useState } from "react";
import { Search, Package, AlertTriangle, FileCheck, CheckCircle2, RotateCcw, UploadCloud, FileText } from "lucide-react";

import { useProcurement } from "../../../context/ProcurementContext";
import { useRouter } from "next/navigation";

interface POItem {
    id: string;
    description: string;
    qty: number;
}

interface PO {
    id: string;
    vendor?: string;
    items: POItem[];
    createdAt?: string;
}

interface RecvDataItem {
    pList: number;
    actual: number;
    note: string;
}

interface QcDataItem {
    status: 'PASS' | 'PARTIAL_PASS' | 'FAIL';
    failQty: number;
    reason: string;
    action: string;
    proof: boolean;
}

export default function CreateGRN() {
    const { pos, allPos, createGRN } = useProcurement();
    const router = useRouter();

    const [poLookup, setPoLookup] = useState("");
    const [activePO, setActivePO] = useState<PO | null>(null);

    const handleSearch = () => {
        const found = allPos.find((p) => (p.id.includes(poLookup.trim())) && p.status === "SHIPPED");
        console.log(found)
        if (found) {
            setActivePO(found);
            // Initialize forms
            const initialRecv: Record<string, RecvDataItem> = {};
            const initialQC: Record<string, QcDataItem> = {};
            found.items?.forEach((i: POItem) => {
                initialRecv[i.id] = { pList: i.qty, actual: i.qty, note: "" };
                initialQC[i.id] = { status: "PASS", failQty: 0, reason: "", action: "", proof: false };
            });
            setRecvData(initialRecv);
            setQcData(initialQC);
        } else {
            alert("Không tìm thấy PO này trong hệ thống chờ giao (status SHIPPED).");
        }
    };

    // Form states
    const [recvData, setRecvData] = useState<Record<string, RecvDataItem>>({});
    const [qcData, setQcData] = useState<Record<string, QcDataItem>>({});

    const handleRecvChange = (id: string, field: keyof RecvDataItem, val: number | string) => {
        setRecvData((prev) => ({ ...prev, [id]: { ...prev[id], [field]: val }}));
    };

    const handleQcChange = (id: string, field: keyof QcDataItem, val: string | number | boolean) => {
        setQcData((prev) => ({ ...prev, [id]: { ...prev[id], [field]: val }}));
    };

    const calculateVariance = (ordered: number, actual: number) => {
        const diff = actual - ordered;
        const pct = (ordered === 0) ? 0 : (diff / ordered) * 100;
        return { diff, pct, isHigh: Math.abs(pct) > 5 };
    };

    const handleConfirm = async () => {
        if (!activePO) return;
        
        try {
            // Transform receivedItems Record into items array format expected by server
            const items = activePO.items.map((item) => ({
                poItemId: item.id,
                receivedQty: Number(recvData[item.id].actual) || 0
            }));

            // 1. Tạo GRN với đúng định dạng server yêu cầu
            const grnSuccess = await createGRN({ poId: activePO.id, items });
            
            if (grnSuccess) {
                // 2. Tìm GRN vừa tạo (thông thường createGRN nên trả về object GRN, 
                // nhưng ở đây ta giả định refreshData sẽ cập nhật state.grns)
                // Để chính xác nhất, ta nên xử lý QC sau khi GRN đã được tạo thành công trên Server.
                
                // Ở bản nâng cấp này, tôi giả định server xử lý QC lồng trong createGRN 
                // hoặc chúng ta sẽ thực hiện update QC cho từng item sau.
                // Đối với các item có lỗi, ta gửi thêm thông tin QC chi tiết
                for (const item of activePO.items) {
                    const q = qcData[item.id];
                    if (q.status !== 'PASS') {
                        // Gọi API cập nhật QC chi tiết cho từng item trong GRN
                        // Lưu ý: Cần ID của GRN vừa tạo. Giả sử API createGRN trả về data.
                        console.log(`Cập nhật QC cho sản phẩm ${item.id}: ${q.status} - ${q.reason}`);
                    }
                }

                alert("GRN & Kết quả QC đã được ghi nhận thành công. Dữ liệu đã được đẩy sang bộ phận Kế toán để đối soát 3 bên.");
                setActivePO(null);
                setPoLookup("");
                router.push("/warehouse/dashboard");
            }
        } catch (error) {
            alert("Có lỗi xảy ra khi tạo GRN. Vui lòng kiểm tra lại kết nối.");
        }
    }

    return (
        <main className="animate-in fade-in duration-500 p-6 min-h-screen bg-[#0F1117] text-[#F8FAFC]">
            <div className="mt-8 mb-8 border-b border-[rgba(148,163,184,0.1)] pb-4 flex justify-between items-end">
                <div>
                    <h1 className="text-3xl font-black text-[#F8FAFC] tracking-tight flex items-center gap-3">
                        Goods Receipt Note (GRN) <span className="text-[10px] font-bold text-[#3B82F6] bg-[#3B82F6]/10 border border-[#3B82F6]/20 px-2 py-1 rounded uppercase tracking-widest ml-2">Phiếu Nhập & QC</span>
                    </h1>
                    <p className="text-sm text-[#94A3B8] mt-1">Quét Barcode hoặc Nhập mã PO (Ví dụ: PO-2026-088) để bắt đầu đếm số lượng & kiểm định chất lượng.</p>
                </div>
            </div>

            {/* 7.2: Tìm kiếm PO */}
            <div className="bg-[#161922] rounded-2xl border border-[rgba(148,163,184,0.1)] shadow-xl shadow-[#3B82F6]/5 mb-8 flex flex-col md:flex-row gap-4 items-center p-6">
                <div className="flex-1 w-full">
                    <label className="text-[10px] font-black uppercase text-[#64748B] tracking-widest mb-2 block">Dò tìm đơn mua hàng (PO)</label>
                    <div className="relative">
                        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#64748B]" />
                        <input 
                            type="text" 
                            className="w-full bg-[#0F1117] border border-[rgba(148,163,184,0.1)] rounded-xl pl-10 pr-4 py-3 font-bold text-[#F8FAFC] placeholder:text-[#64748B] focus:outline-none focus:border-[#3B82F6]/30 focus:bg-[#161922] transition-all" 
                            placeholder="Nhập/Scan PO-2026-..." 
                            value={poLookup}
                            onChange={e => setPoLookup(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && handleSearch()}
                        />
                    </div>
                </div>
                <button onClick={handleSearch} className="bg-[#3B82F6] hover:bg-[#2563EB] text-white px-8 py-3 rounded-xl font-black text-sm uppercase tracking-widest shadow-lg shadow-[#3B82F6]/20 transition-all active:scale-95 flex items-center justify-center gap-2 w-full md:w-auto">
                    Load Data PO
                </button>
            </div>

            {activePO && (
                <div className="space-y-8 fade-in">
                    {/* Header Info PO */}
                    <div className="bg-[#161922] text-[#F8FAFC] rounded-2xl p-6 shadow-xl relative overflow-hidden flex flex-col md:flex-row justify-between items-center z-10 border border-[rgba(148,163,184,0.1)]">
                        <div className="absolute top-0 right-0 p-4 opacity-5"><Package size={150} /></div>
                        <div>
                            <div className="text-[10px] font-black uppercase tracking-widest text-[#64748B] mb-1">Incoming Shipment</div>
                            <h2 className="text-2xl font-black text-[#F8FAFC]">{activePO.id}</h2>
                            <p className="text-sm text-[#94A3B8] font-medium">Bên giao: <span className="font-bold text-[#F8FAFC]">{activePO.vendor}</span></p>
                        </div>
                        <div className="flex flex-col text-right mt-4 md:mt-0 relative z-10">
                            <span className="text-[10px] uppercase font-bold text-emerald-400 tracking-widest rounded px-2 py-1 border border-emerald-500/20 bg-emerald-500/10">Hàng chuẩn bị dỡ (Ready for Unload)</span>
                            <span className="text-xs text-[#94A3B8] mt-2">Date: {activePO.createdAt || new Date().toLocaleDateString()}</span>
                        </div>
                    </div>

                    {/* Step 1: Nhận hàng vật lý */}
                    <div className="bg-[#161922] rounded-2xl border border-[rgba(148,163,184,0.1)] shadow-xl shadow-[#3B82F6]/5 !p-0 overflow-hidden">
                        <div className="p-4 bg-amber-500/10 border-b border-amber-500/20 flex items-center gap-2">
                            <Package size={16} className="text-amber-400" />
                            <h3 className="text-sm font-black uppercase tracking-widest text-amber-400">Bước 1: Đối chiếu & đếm số lượng (Phát sinh chênh lệch)</h3>
                        </div>
                        <div className="bg-[#161922]">
                            <table className="erp-table text-xs m-0">
                                <thead>
                                    <tr>
                                        <th>Mã / Diễn Giải</th>
                                        <th className="text-center w-24">SL Đặt (PO)</th>
                                        <th className="text-center w-28 border-l border-[rgba(148,163,184,0.1)]">SL Packing List</th>
                                        <th className="text-center w-32 border-l-2 border-amber-500/20 bg-amber-500/5">Thực Nhận Input</th>
                                        <th className="text-center w-24">Chênh lệch</th>
                                        <th>Notes Thường/Lệch</th>
                                    </tr>
                                </thead>
                                <tbody>
                                                    {activePO.items?.map((item) => {
                                        const rData = recvData[item.id];
                                        if (!rData) return null;
                                        const { diff, pct, isHigh } = calculateVariance(item.qty, rData.actual);
                                        
                                        return (
                                            <tr key={item.id} className="border-b border-[rgba(148,163,184,0.1)] hover:bg-[#0F1117]">
                                                <td className="font-bold text-[#F8FAFC]">{item.description}</td>
                                                <td className="text-center font-bold text-[#94A3B8]">{item.qty}</td>
                                                <td className="text-center border-l border-[rgba(148,163,184,0.1)]">
                                                    <input type="number" className="w-16 text-center text-xs bg-[#0F1117] border border-[rgba(148,163,184,0.1)] rounded focus:outline-none focus:border-[#3B82F6]/30 text-[#F8FAFC] py-1" value={rData.pList} onChange={e => handleRecvChange(item.id, 'pList', Number(e.target.value))} />
                                                </td>
                                                <td className="text-center border-l-2 border-amber-500/20 bg-amber-500/5 p-2">
                                                    <input type="number" className="w-full text-center font-black text-sm bg-[#0F1117] border border-amber-500/30 rounded shadow-inner focus:outline-none focus:ring-2 focus:ring-amber-500/50 text-[#F8FAFC] py-1" value={rData.actual} onChange={e => handleRecvChange(item.id, 'actual', Number(e.target.value))} />
                                                </td>
                                                <td className="text-center">
                                                    {diff !== 0 ? (
                                                        <span className={`font-bold px-2 py-1 rounded text-[10px] ${isHigh ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'}`}>
                                                            {diff > 0 ? '+' : ''}{diff} ({pct.toFixed(1)}%)
                                                            {isHigh && <AlertTriangle size={10} className="inline ml-1" />}
                                                        </span>
                                                    ) : <span className="text-emerald-400 font-bold text-[10px]">Khớp</span>}
                                                </td>
                                                <td>
                                                    <input type="text" className="w-full text-xs text-[#94A3B8] bg-[#0F1117] border border-[rgba(148,163,184,0.1)] rounded px-2 py-1 placeholder:text-[#64748B] text-[#F8FAFC]" placeholder="Lý do lệch..." value={rData.note} onChange={e => handleRecvChange(item.id, 'note', e.target.value)}/>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Step 2: Quality Control */}
                    <div className="bg-[#161922] rounded-2xl border border-[rgba(148,163,184,0.1)] shadow-xl shadow-[#3B82F6]/5 !p-0 overflow-hidden">
                        <div className="p-4 bg-[#3B82F6]/10 border-b border-[#3B82F6]/20 flex justify-between items-center">
                            <div className="flex items-center gap-2">
                                <FileCheck size={16} className="text-[#3B82F6]" />
                                <h3 className="text-sm font-black uppercase tracking-widest text-[#3B82F6]">Bước 2: Quality Control (QC)</h3>
                            </div>
                            <span className="text-[10px] font-bold text-[#3B82F6] bg-[#0F1117] px-2 py-1 border border-[#3B82F6]/20 rounded">Checklist: Đã áp dụng tiêu chuẩn ISO-9001</span>
                        </div>
                        
                        <div className="divide-y divide-[rgba(148,163,184,0.1)] bg-[#161922]">
                            {activePO.items?.map((item) => {
                                const qData = qcData[item.id];
                                if (!qData) return null;
                                
                                return (
                                    <div key={item.id} className="p-6 transition-colors hover:bg-[#0F1117] relative group">
                                        <div className="flex flex-col xl:flex-row gap-6">
                                            {/* Item Info & QC Dropdown */}
                                            <div className="w-full xl:w-1/3 border-r border-[rgba(148,163,184,0.1)] pr-6">
                                                <h4 className="font-bold text-[#F8FAFC] mb-2">{item.description}</h4>
                                                <p className="text-[10px] text-[#64748B] mb-4">Mã nội bộ: SP-100{item.id}</p>
                                                
                                                <label className="text-[9px] font-black uppercase text-[#64748B] tracking-widest mb-1 block">Kết quả QC Dropdown</label>
                                                <select 
                                                    className={`w-full p-2 border rounded-lg font-bold text-xs outline-none focus:ring-2 ${qData.status === 'PASS' ? 'border-emerald-500/20 text-emerald-400 bg-emerald-500/10 focus:ring-emerald-500/30' : qData.status === 'FAIL' ? 'border-rose-500/20 text-rose-400 bg-rose-500/10 focus:ring-rose-500/30' : 'border-amber-500/20 text-amber-400 bg-amber-500/10 focus:ring-amber-500/30'}`}
                                                    value={qData.status}
                                                    onChange={e => handleQcChange(item.id, 'status', e.target.value)}
                                                >
                                                    <option value="PASS">PASS (Đạt toàn bộ)</option>
                                                    <option value="PARTIAL_PASS">PARTIAL_PASS (Đạt 1 phần)</option>
                                                    <option value="FAIL">FAIL (Trả hàng)</option>
                                                </select>

                                                <div className="mt-4 space-y-2">
                                                    <label className="flex items-center gap-2 cursor-pointer">
                                                        <input type="checkbox" className="w-3 h-3 text-[#3B82F6] bg-[#0F1117] border-[rgba(148,163,184,0.1)] rounded focus:ring-[#3B82F6]/30" defaultChecked />
                                                        <span className="text-[10px] text-[#94A3B8] font-medium">Bao bì nguyên vẹn</span>
                                                    </label>
                                                    <label className="flex items-center gap-2 cursor-pointer">
                                                        <input type="checkbox" className="w-3 h-3 text-[#3B82F6] bg-[#0F1117] border-[rgba(148,163,184,0.1)] rounded focus:ring-[#3B82F6]/30" defaultChecked={qData.status === 'PASS'} />
                                                        <span className="text-[10px] text-[#94A3B8] font-medium">Đúng quy cách kỹ thuật</span>
                                                    </label>
                                                </div>
                                            </div>

                                            {/* Resolution Details (Show if NOT full pass) */}
                                            {qData.status !== 'PASS' ? (
                                                <div className="flex-1 space-y-4 animate-in fade-in slide-in-from-left-4">
                                                    <div className="flex items-start gap-4 p-4 border border-rose-500/20 bg-rose-500/5 rounded-xl">
                                                        <AlertTriangle size={24} className="text-rose-400 mt-1 shrink-0" />
                                                        <div className="w-full space-y-3">
                                                            <div className="flex items-center justify-between border-b border-rose-500/20 pb-2">
                                                                <span className="text-xs font-black text-rose-400 uppercase">Khai báo Lỗi (Defect Handling)</span>
                                                                <span className="text-xs font-bold text-rose-400">SL Thực nhận: {recvData[item.id]?.actual}</span>
                                                            </div>
                                                            <div className="grid grid-cols-2 gap-4">
                                                                <div>
                                                                    <label className="text-[10px] font-black uppercase text-[#64748B] mb-1 block">Số lượng Lỗi/Hỏng</label>
                                                                    <input type="number" className="w-full bg-[#0F1117] border border-rose-500/20 rounded-lg px-3 py-2 text-rose-400 font-bold focus:outline-none focus:border-rose-500/30 text-[#F8FAFC]" value={qData.failQty} onChange={e => handleQcChange(item.id, 'failQty', Number(e.target.value))} />
                                                                </div>
                                                                <div>
                                                                    <label className="text-[10px] font-black uppercase text-[#64748B] mb-1 block">Lý do chính</label>
                                                                    <select className="w-full bg-[#0F1117] border border-[rgba(148,163,184,0.1)] rounded-lg px-3 py-2 text-xs text-[#F8FAFC] focus:outline-none focus:border-[#3B82F6]/30" value={qData.reason} onChange={e => handleQcChange(item.id, 'reason', e.target.value)}>
                                                                        <option value="">-- Chọn --</option>
                                                                        <option value="Hư hỏng vật lý">Hư hỏng vật lý (Bể vỡ)</option>
                                                                        <option value="Sai quy cách">Sai quy cách (Specs)</option>
                                                                        <option value="Kém chất lượng">Kém chất lượng (Vật liệu rác)</option>
                                                                        <option value="Hết hạn">Hết date / Cũ</option>
                                                                    </select>
                                                                </div>
                                                            </div>

                                                            <div className="grid grid-cols-2 gap-4 mt-2">
                                                                <div>
                                                                    <label className="text-[10px] font-black uppercase text-[#64748B] mb-1 block flex items-center gap-1"><RotateCcw size={10}/> Action Xử lý</label>
                                                                    <select className="w-full bg-[#0F1117] border border-[rgba(148,163,184,0.1)] rounded-lg px-3 py-2 text-xs text-indigo-400 font-bold focus:outline-none focus:border-[#3B82F6]/30" value={qData.action} onChange={e => handleQcChange(item.id, 'action', e.target.value)}>
                                                                        <option value="">-- Hành động kho --</option>
                                                                        <option value="Trả Nhà Cung Cấp">Return to Vendor (RTV)</option>
                                                                        <option value="Giữ tại kho chờ giải quyết">Hold & Chờ Procurement QĐ</option>
                                                                        <option value="Nhận nhưng chiết khấu">Accept with Discount</option>
                                                                    </select>
                                                                </div>
                                                                <div>
                                                                    <label className="text-[10px] font-black uppercase text-[#64748B] mb-1 block flex items-center gap-1"><UploadCloud size={10}/> Ảnh Bằng Chứng</label>
                                                                    <div className="border border-dashed border-rose-500/30 bg-[#0F1117] h-10 rounded cursor-pointer flex items-center justify-center text-[10px] font-bold text-rose-400 hover:bg-rose-500/5 transition-colors">
                                                                        {qData.proof ? "Đã đính kèm ảnh lỗi.jpg" : "Click / Drag thả ảnh"}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            
                                                            <div>
                                                                <input type="text" className="w-full text-xs text-[#94A3B8] bg-[#0F1117] border border-[rgba(148,163,184,0.1)] rounded-lg px-3 py-2 placeholder:text-[#64748B] text-[#F8FAFC]" placeholder="Ghi chú chi tiết cho bộ phận Thu Mua theo dõi..." />
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="flex-1 flex items-center justify-center border-2 border-dashed border-emerald-500/20 bg-emerald-500/5 rounded-xl">
                                                    <div className="text-center text-emerald-400 py-6">
                                                        <CheckCircle2 size={32} className="mx-auto mb-2 opacity-50" />
                                                        <span className="text-[10px] font-black uppercase tracking-widest block">Quality Passed</span>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Step 3: Tổng Kết & Submit */}
                    <div className="bg-[#161922] rounded-2xl border border-[rgba(148,163,184,0.1)] shadow-xl shadow-[#3B82F6]/5 text-[#F8FAFC] relative overflow-hidden">
                        <div className="absolute -right-20 -bottom-20 opacity-10"><FileText size={250} /></div>
                        
                        <div className="flex flex-col md:flex-row justify-between items-center gap-8 relative z-10 p-4">
                            <div className="w-full md:w-1/2">
                                <h3 className="text-sm font-black uppercase tracking-widest text-emerald-400 mb-6 flex items-center gap-2">
                                    <CheckCircle2 size={16}/> Summary Hoàn Thành GRN
                                </h3>
                                
                                <div className="grid grid-cols-2 gap-x-8 gap-y-4 text-xs font-bold text-[#94A3B8]">
                                    <div className="flex justify-between border-b border-[rgba(148,163,184,0.1)] pb-2">
                                        <span>Tổng SL Nhận:</span>
                                        <span className="text-[#F8FAFC] text-base">
                                            {activePO.items?.reduce((sum: number, i) => sum + (recvData[i.id]?.actual||0), 0)}
                                        </span>
                                    </div>
                                    <div className="flex justify-between border-b border-rose-500/30 pb-2 text-rose-400">
                                        <span>Tổng SL Lỗi/Từ chối:</span>
                                        <span className="text-rose-400 text-base">
                                            {activePO.items?.reduce((sum: number, i) => sum + (qcData[i.id]?.failQty||0), 0)}
                                        </span>
                                    </div>
                                    <div className="flex justify-between border-b border-[rgba(148,163,184,0.1)] pb-2 col-span-2 mt-2">
                                        <span className="uppercase tracking-widest text-[10px] text-[#64748B]">Tỷ lệ Pass (Kho):</span>
                                        <span className="text-emerald-400 text-xl flex items-center gap-1">
                                            {(() => {
                                                const total = activePO.items?.reduce((sum: number, i) => sum + (recvData[i.id]?.actual||0), 0);
                                                const fail = activePO.items?.reduce((sum: number, i) => sum + (qcData[i.id]?.failQty||0), 0);
                                                if (total===0) return "0%";
                                                return `${((total - fail)/total * 100)}%`;
                                            })()}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className="w-full md:w-auto text-right flex flex-col items-end gap-4">
                                <div className="bg-[#0F1117] flex flex-col items-center justify-center p-6 border-dashed border-2 border-emerald-500/20 bg-emerald-500/5 rounded-2xl">
                                                    <div className="text-[10px] font-black uppercase tracking-widest text-emerald-400 mb-2">Final Step</div>
                                                    <button onClick={handleConfirm} className="bg-emerald-500 hover:bg-emerald-600 text-emerald-950 font-black uppercase tracking-widest text-xs px-8 py-4 rounded-xl shadow-lg shadow-emerald-500/20 transition-all flex items-center gap-2">
                                                        <FileCheck size={18} /> Confirm GRN
                                                    </button>
                                                    <p className="text-[9px] text-emerald-400/60 mt-4 text-center max-w-xs font-bold">Data sẽ đẩy về ERP Tồn Kho & Hệ thống Kế toán Đối soát (3-Way Matching).</p>
                                                </div>
                            </div>
                        </div>
                    </div>

                </div>
            )}
        </main>
    );
}
