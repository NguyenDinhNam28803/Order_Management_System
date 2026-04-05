"use client";

import React, { useState } from "react";
import DashboardHeader from "../../../components/DashboardHeader";
import { Search, Package, AlertTriangle, FileCheck, CheckCircle2, RotateCcw, UploadCloud, Info, FileText } from "lucide-react";

import { useProcurement } from "../../../context/ProcurementContext";
import { useRouter } from "next/navigation";

interface POItem {
    id: string;
    description: string;
    qty: number;
}

interface PO {
    id: string;
    vendor: string;
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
    const { pos, createGRN, notify } = useProcurement();
    const router = useRouter();

    const [poLookup, setPoLookup] = useState("");
    const [activePO, setActivePO] = useState<PO | null>(null);

    const handleSearch = () => {
        const found = pos.find((p) => (p.id.includes(poLookup.trim())) && p.status === "SHIPPED");
        if (found) {
            setActivePO(found);
            // Initialize forms
            const initialRecv: Record<string, RecvDataItem> = {};
            const initialQC: Record<string, QcDataItem> = {};
            found.items.forEach((i: POItem) => {
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
        
        const receivedItems: Record<string, number> = {};
        activePO.items.forEach((item) => {
            receivedItems[item.id] = Number(recvData[item.id].actual) || 0;
        });

        const success = await createGRN({
            poId: activePO.id,
            receivedItems,
            notes: "Nhập kho thực tế từ Dashboard"
        });

        if (success) {
            notify("GRN Đã được ghi nhận thành công!", "success");
            setActivePO(null);
            setPoLookup("");
            router.push("/warehouse/dashboard");
        }
    };

    return (
        <main className="pt-16 px-8 pb-12 animate-in fade-in duration-300 min-h-screen bg-slate-50">
            <DashboardHeader breadcrumbs={["Kho vận", "Kiểm định Nhập Kho", "Tạo GRN & QC"]} />

            <div className="mt-8 mb-8 border-b border-slate-200 pb-4 flex justify-between items-end">
                <div>
                    <h1 className="text-3xl font-black text-erp-navy tracking-tight flex items-center gap-3">
                        Goods Receipt Note (GRN) <span className="text-[10px] font-bold text-blue-600 bg-blue-100 border border-blue-200 px-2 py-1 rounded uppercase tracking-widest ml-2">Phiếu Nhập & QC</span>
                    </h1>
                    <p className="text-sm text-slate-500 mt-1">Quét Barcode hoặc Nhập mã PO (Ví dụ: PO-2026-088) để bắt đầu đếm số lượng & kiểm định chất lượng.</p>
                </div>
            </div>

            {/* 7.2: Tìm kiếm PO */}
            <div className="erp-card shadow-sm border border-slate-200 mb-8 bg-white flex flex-col md:flex-row gap-4 items-center">
                <div className="flex-1 w-full">
                    <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest mb-2 block">Dò tìm đơn mua hàng (PO)</label>
                    <div className="relative">
                        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input 
                            type="text" 
                            className="erp-input w-full pl-10 font-bold font-mono text-erp-navy" 
                            placeholder="Nhập/Scan PO-2026-..." 
                            value={poLookup}
                            onChange={e => setPoLookup(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && handleSearch()}
                        />
                    </div>
                </div>
                <button onClick={handleSearch} className="btn-primary w-full md:w-auto h-12 flex items-center justify-center gap-2 mt-4 md:mt-5 text-sm uppercase tracking-widest px-8 shadow-md">
                    Load Data PO
                </button>
            </div>

            {activePO && (
                <div className="space-y-8 fade-in">
                    {/* Header Info PO */}
                    <div className="bg-slate-800 text-white rounded-2xl p-6 shadow-xl relative overflow-hidden flex flex-col md:flex-row justify-between items-center z-10">
                        <div className="absolute top-0 right-0 p-4 opacity-5"><Package size={150} /></div>
                        <div>
                            <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Incoming Shipment</div>
                            <h2 className="text-2xl font-black">{activePO.id}</h2>
                            <p className="text-sm text-slate-300 font-medium">Bên giao: <span className="font-bold text-white">{activePO.vendor}</span></p>
                        </div>
                        <div className="flex flex-col text-right mt-4 md:mt-0 relative z-10">
                            <span className="text-[10px] uppercase font-bold text-emerald-400 tracking-widest rounded px-2 py-1 border border-emerald-500 bg-emerald-900/50">Hàng chuẩn bị dỡ (Ready for Unload)</span>
                            <span className="text-xs text-slate-300 mt-2 font-mono">Date: {activePO.createdAt || new Date().toLocaleDateString()}</span>
                        </div>
                    </div>

                    {/* Step 1: Nhận hàng vật lý */}
                    <div className="erp-card shadow-sm border border-slate-200 bg-white !p-0 overflow-hidden">
                        <div className="p-4 bg-orange-50 border-b border-orange-100 flex items-center gap-2">
                            <Package size={16} className="text-orange-600" />
                            <h3 className="text-sm font-black uppercase tracking-widest text-orange-900">Bước 1: Đối chiếu & đếm số lượng (Phát sinh chênh lệch)</h3>
                        </div>
                        <table className="erp-table text-xs m-0">
                            <thead>
                                <tr>
                                    <th>Mã / Diễn Giải</th>
                                    <th className="text-center w-24">SL Đặt (PO)</th>
                                    <th className="text-center w-28 border-l border-slate-200">SL Packing List</th>
                                    <th className="text-center w-32 border-l-2 border-orange-200 bg-orange-50/30">Thực Nhận Input</th>
                                    <th className="text-center w-24">Chênh lệch</th>
                                    <th>Notes Thường/Lệch</th>
                                </tr>
                            </thead>
                            <tbody>
                                                {activePO.items.map((item) => {
                                    const rData = recvData[item.id];
                                    if (!rData) return null;
                                    const { diff, pct, isHigh } = calculateVariance(item.qty, rData.actual);
                                    
                                    return (
                                        <tr key={item.id} className="border-b border-slate-100 hover:bg-slate-50">
                                            <td className="font-bold text-slate-700">{item.description}</td>
                                            <td className="text-center font-mono font-bold text-slate-500">{item.qty}</td>
                                            <td className="text-center border-l border-slate-200">
                                                <input type="number" className="w-16 text-center font-mono text-xs border border-slate-300 rounded focus:outline-none focus:border-erp-blue py-1" value={rData.pList} onChange={e => handleRecvChange(item.id, 'pList', Number(e.target.value))} />
                                            </td>
                                            <td className="text-center border-l-2 border-orange-200 bg-orange-50/10 p-2">
                                                <input type="number" className="w-full text-center font-black font-mono text-sm border border-orange-300 bg-white rounded shadow-inner focus:outline-none focus:ring-2 focus:ring-orange-500 py-1" value={rData.actual} onChange={e => handleRecvChange(item.id, 'actual', Number(e.target.value))} />
                                            </td>
                                            <td className="text-center">
                                                {diff !== 0 ? (
                                                    <span className={`font-mono font-bold px-2 py-1 rounded text-[10px] ${isHigh ? 'bg-red-100 text-red-700 border border-red-200' : 'bg-orange-50 text-orange-600'}`}>
                                                        {diff > 0 ? '+' : ''}{diff} ({pct.toFixed(1)}%)
                                                        {isHigh && <AlertTriangle size={10} className="inline ml-1" />}
                                                    </span>
                                                ) : <span className="text-emerald-500 font-bold text-[10px]">Khớp</span>}
                                            </td>
                                            <td>
                                                <input type="text" className="w-full text-xs text-slate-600 border border-slate-200 rounded px-2 py-1 bg-slate-50" placeholder="Lý do lệch..." value={rData.note} onChange={e => handleRecvChange(item.id, 'note', e.target.value)}/>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>

                    {/* Step 2: Quality Control */}
                    <div className="erp-card shadow-sm border border-slate-200 bg-white !p-0 overflow-hidden">
                        <div className="p-4 bg-blue-50 border-b border-blue-100 flex justify-between items-center">
                            <div className="flex items-center gap-2">
                                <FileCheck size={16} className="text-blue-600" />
                                <h3 className="text-sm font-black uppercase tracking-widest text-blue-900">Bước 2: Quality Control (QC)</h3>
                            </div>
                            <span className="text-[10px] font-bold text-blue-600 bg-white px-2 py-1 border border-blue-200 rounded">Checklist: Đã áp dụng tiêu chuẩn ISO-9001</span>
                        </div>
                        
                        <div className="divide-y divide-slate-100">
                            {activePO.items.map((item) => {
                                const qData = qcData[item.id];
                                if (!qData) return null;
                                
                                return (
                                    <div key={item.id} className="p-6 transition-colors hover:bg-slate-50 relative group">
                                        <div className="flex flex-col xl:flex-row gap-6">
                                            {/* Item Info & QC Dropdown */}
                                            <div className="w-full xl:w-1/3 border-r border-slate-100 pr-6">
                                                <h4 className="font-bold text-erp-navy mb-2">{item.description}</h4>
                                                <p className="text-[10px] font-mono text-slate-400 mb-4">Mã nội bộ: SP-100{item.id}</p>
                                                
                                                <label className="text-[9px] font-black uppercase text-slate-500 tracking-widest mb-1 block">Kết quả QC Dropdown</label>
                                                <select 
                                                    className={`w-full p-2 border rounded-lg font-bold text-xs outline-none focus:ring-2 ${qData.status === 'PASS' ? 'border-emerald-500 text-emerald-700 bg-emerald-50 focus:ring-emerald-200' : qData.status === 'FAIL' ? 'border-red-500 text-red-700 bg-red-50 focus:ring-red-200' : 'border-orange-500 text-orange-700 bg-orange-50 focus:ring-orange-200'}`}
                                                    value={qData.status}
                                                    onChange={e => handleQcChange(item.id, 'status', e.target.value)}
                                                >
                                                    <option value="PASS">PASS (Đạt toàn bộ)</option>
                                                    <option value="PARTIAL_PASS">PARTIAL_PASS (Đạt 1 phần)</option>
                                                    <option value="FAIL">FAIL (Trả hàng)</option>
                                                </select>

                                                <div className="mt-4 space-y-2">
                                                    <label className="flex items-center gap-2 cursor-pointer">
                                                        <input type="checkbox" className="w-3 h-3 text-erp-blue" defaultChecked />
                                                        <span className="text-[10px] text-slate-600 font-medium">Bao bì nguyên vẹn</span>
                                                    </label>
                                                    <label className="flex items-center gap-2 cursor-pointer">
                                                        <input type="checkbox" className="w-3 h-3 text-erp-blue" defaultChecked={qData.status === 'PASS'} />
                                                        <span className="text-[10px] text-slate-600 font-medium">Đúng quy cách kỹ thuật</span>
                                                    </label>
                                                </div>
                                            </div>

                                            {/* Resolution Details (Show if NOT full pass) */}
                                            {qData.status !== 'PASS' ? (
                                                <div className="flex-1 space-y-4 animate-in fade-in slide-in-from-left-4">
                                                    <div className="flex items-start gap-4 p-4 border border-red-200 bg-red-50/50 rounded-xl">
                                                        <AlertTriangle size={24} className="text-red-500 mt-1 shrink-0" />
                                                        <div className="w-full space-y-3">
                                                            <div className="flex items-center justify-between border-b border-red-100 pb-2">
                                                                <span className="text-xs font-black text-red-900 uppercase">Khai báo Lỗi (Defect Handling)</span>
                                                                <span className="text-xs font-mono font-bold text-red-600">SL Thực nhận: {recvData[item.id]?.actual}</span>
                                                            </div>
                                                            <div className="grid grid-cols-2 gap-4">
                                                                <div>
                                                                    <label className="text-[10px] font-black uppercase text-slate-500 mb-1 block">Số lượng Lỗi/Hỏng</label>
                                                                    <input type="number" className="erp-input w-full font-mono text-red-600 font-bold border-red-300 focus:border-red-500" value={qData.failQty} onChange={e => handleQcChange(item.id, 'failQty', Number(e.target.value))} />
                                                                </div>
                                                                <div>
                                                                    <label className="text-[10px] font-black uppercase text-slate-500 mb-1 block">Lý do chính</label>
                                                                    <select className="erp-input w-full bg-white text-xs" value={qData.reason} onChange={e => handleQcChange(item.id, 'reason', e.target.value)}>
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
                                                                    <label className="text-[10px] font-black uppercase text-slate-500 mb-1 block flex items-center gap-1"><RotateCcw size={10}/> Action Xử lý</label>
                                                                    <select className="erp-input w-full bg-white text-xs text-indigo-700 font-bold" value={qData.action} onChange={e => handleQcChange(item.id, 'action', e.target.value)}>
                                                                        <option value="">-- Hành động kho --</option>
                                                                        <option value="Trả Nhà Cung Cấp">Return to Vendor (RTV)</option>
                                                                        <option value="Giữ tại kho chờ giải quyết">Hold & Chờ Procurement QĐ</option>
                                                                        <option value="Nhận nhưng chiết khấu">Accept with Discount</option>
                                                                    </select>
                                                                </div>
                                                                <div>
                                                                    <label className="text-[10px] font-black uppercase text-slate-500 mb-1 block flex items-center gap-1"><UploadCloud size={10}/> Ảnh Bằng Chứng</label>
                                                                    <div className="border border-dashed border-red-300 bg-white h-10 rounded cursor-pointer flex items-center justify-center text-[10px] font-bold text-red-600 hover:bg-red-50">
                                                                        {qData.proof ? "Đã đính kèm ảnh lỗi.jpg" : "Click / Drag thả ảnh"}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            
                                                            <div>
                                                                <input type="text" className="w-full text-xs text-slate-600 border border-slate-200 rounded px-3 py-2 bg-white" placeholder="Ghi chú chi tiết cho bộ phận Thu Mua theo dõi..." />
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="flex-1 flex items-center justify-center border-2 border-dashed border-emerald-100 bg-emerald-50/50 rounded-xl">
                                                    <div className="text-center text-emerald-600 py-6">
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
                    <div className="erp-card shadow-lg bg-erp-navy border-none text-white relative overflow-hidden">
                        <div className="absolute -right-20 -bottom-20 opacity-10"><FileText size={250} /></div>
                        
                        <div className="flex flex-col md:flex-row justify-between items-center gap-8 relative z-10 p-4">
                            <div className="w-full md:w-1/2">
                                <h3 className="text-sm font-black uppercase tracking-widest text-emerald-400 mb-6 flex items-center gap-2">
                                    <CheckCircle2 size={16}/> Summary Hoàn Thành GRN
                                </h3>
                                
                                <div className="grid grid-cols-2 gap-x-8 gap-y-4 text-xs font-bold text-slate-300">
                                    <div className="flex justify-between border-b border-white/10 pb-2">
                                        <span>Tổng SL Nhận:</span>
                                        <span className="font-mono text-white text-base">
                                            {activePO.items.reduce((sum: number, i) => sum + (recvData[i.id]?.actual||0), 0)}
                                        </span>
                                    </div>
                                    <div className="flex justify-between border-b border-red-500/30 pb-2 text-red-200">
                                        <span>Tổng SL Lỗi/Từ chối:</span>
                                        <span className="font-mono text-red-400 text-base">
                                            {activePO.items.reduce((sum: number, i) => sum + (qcData[i.id]?.failQty||0), 0)}
                                        </span>
                                    </div>
                                    <div className="flex justify-between border-b border-white/10 pb-2 col-span-2 mt-2">
                                        <span className="uppercase tracking-widest text-[10px] text-slate-400">Tỷ lệ Pass (Kho):</span>
                                        <span className="font-mono text-emerald-400 text-xl flex items-center gap-1">
                                            {(() => {
                                                const total = activePO.items.reduce((sum: number, i) => sum + (recvData[i.id]?.actual||0), 0);
                                                const fail = activePO.items.reduce((sum: number, i) => sum + (qcData[i.id]?.failQty||0), 0);
                                                if (total===0) return "0%";
                                                return `${((total - fail)/total * 100).toFixed(0)}%`;
                                            })()}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className="w-full md:w-auto text-right flex flex-col items-end gap-4">
                                <div className="erp-card flex flex-col items-center justify-center p-6 border-dashed border-2 border-emerald-200 bg-emerald-50/30">
                                                    <div className="text-[10px] font-black uppercase tracking-widest text-emerald-600 mb-2">Final Step</div>
                                                    <button onClick={handleConfirm} className="bg-emerald-500 hover:bg-emerald-400 text-emerald-950 font-black uppercase tracking-widest text-xs px-8 py-4 rounded-xl shadow-lg shadow-emerald-500/20 transition-all flex items-center gap-2">
                                                        <FileCheck size={18} /> Confirm GRN
                                                    </button>
                                                    <p className="text-[9px] text-emerald-800/60 mt-4 text-center max-w-xs font-bold">Data sẽ đẩy về ERP Tồn Kho & Hệ thống Kế toán Đối soát (3-Way Matching).</p>
                                                </div>
                            </div>
                        </div>
                    </div>

                </div>
            )}
        </main>
    );
}
