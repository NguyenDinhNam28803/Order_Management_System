"use client";

import React, { useState, useMemo } from "react";
import { Search, Package, AlertTriangle, FileCheck, CheckCircle2, RotateCcw, UploadCloud, FileText, ArrowLeft } from "lucide-react";

import { useProcurement } from "../../../context/ProcurementContext";
import { useRouter } from "next/navigation";

interface POItem {
    id: string;
    description: string;
    qty: number;
}

interface PO {
    id: string;
    poNumber?: string;
    vendor?: string;
    supplier?: { name?: string };
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
    const { allPos, createGRN } = useProcurement();
    const router = useRouter();

    const [poLookup, setPoLookup] = useState("");
    const [activePO, setActivePO] = useState<PO | null>(null);
    const [recvData, setRecvData] = useState<Record<string, RecvDataItem>>({});
    const [qcData, setQcData] = useState<Record<string, QcDataItem>>({});

    const shippedPos = useMemo(
        () => (allPos as PO[]).filter((p: any) => p.status === "SHIPPED"),
        [allPos]
    );

    const filteredPos = useMemo(() => {
        const q = poLookup.trim().toLowerCase();
        if (!q) return shippedPos;
        return shippedPos.filter((p) =>
            p.id.toLowerCase().includes(q) ||
            (p.poNumber && p.poNumber.toLowerCase().includes(q)) ||
            (p.vendor && p.vendor.toLowerCase().includes(q))
        );
    }, [shippedPos, poLookup]);

    const handleSelectPO = (po: PO) => {
        const initialRecv: Record<string, RecvDataItem> = {};
        const initialQC: Record<string, QcDataItem> = {};
        po.items?.forEach((i: POItem) => {
            initialRecv[i.id] = { pList: i.qty, actual: i.qty, note: "" };
            initialQC[i.id] = { status: "PASS", failQty: 0, reason: "", action: "", proof: false };
        });
        setRecvData(initialRecv);
        setQcData(initialQC);
        setActivePO(po);
    };

    const handleRecvChange = (id: string, field: keyof RecvDataItem, val: number | string) => {
        setRecvData((prev) => ({ ...prev, [id]: { ...prev[id], [field]: val } }));
    };

    const handleQcChange = (id: string, field: keyof QcDataItem, val: string | number | boolean) => {
        setQcData((prev) => ({ ...prev, [id]: { ...prev[id], [field]: val } }));
    };

    const calculateVariance = (ordered: number, actual: number) => {
        const diff = actual - ordered;
        const pct = (ordered === 0) ? 0 : (diff / ordered) * 100;
        return { diff, pct, isHigh: Math.abs(pct) > 5 };
    };

    const handleConfirm = async () => {
        if (!activePO) return;
        try {
            const items = activePO.items.map((item) => ({
                poItemId: item.id,
                receivedQty: Number(recvData[item.id].actual) || 0
            }));
            const grnSuccess = await createGRN({ poId: activePO.id, items });
            if (grnSuccess) {
                alert("GRN & Kết quả QC đã được ghi nhận thành công. Dữ liệu đã được đẩy sang bộ phận Kế toán để đối soát 3 bên.");
                setActivePO(null);
                setPoLookup("");
                router.push("/warehouse/dashboard");
            }
        } catch {
            alert("Có lỗi xảy ra khi tạo GRN. Vui lòng kiểm tra lại kết nối.");
        }
    };

    return (
        <main className="animate-in fade-in duration-500 p-6 min-h-screen bg-[#FFFFFF] text-[#000000]">
            <div className="mt-8 mb-8 border-b border-[rgba(148,163,184,0.1)] pb-4 flex justify-between items-end">
                <div>
                    <h1 className="text-3xl font-black text-[#000000] tracking-tight flex items-center gap-3">
                        Goods Receipt Note (GRN) <span className="text-[10px] font-bold text-black bg-[#B4533A]/10 border border-[#B4533A]/20 px-2 py-1 rounded uppercase tracking-widest ml-2">Phiếu Nhập & QC</span>
                    </h1>
                    <p className="text-sm text-[#000000] mt-1">Chọn PO đang chờ nhập kho bên dưới để bắt đầu đếm số lượng & kiểm định chất lượng.</p>
                </div>
            </div>

            {!activePO ? (
                <div className="space-y-4">
                    {/* Search filter */}
                    <div className="bg-[#FAF8F5] rounded-2xl border border-[rgba(148,163,184,0.1)] shadow-xl shadow-[#B4533A]/5 p-6">
                        <label className="text-[10px] font-black uppercase text-[#000000] tracking-widest mb-2 block">Lọc đơn mua hàng (PO)</label>
                        <div className="relative">
                            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#000000]" />
                            <input
                                type="text"
                                className="w-full bg-[#FFFFFF] border border-[rgba(148,163,184,0.1)] rounded-xl pl-10 pr-4 py-3 font-bold text-[#000000] placeholder:text-[#000000] focus:outline-none focus:border-[#B4533A]/30 focus:bg-[#FAF8F5] transition-all"
                                placeholder="Tìm theo mã PO, nhà cung cấp..."
                                value={poLookup}
                                onChange={e => setPoLookup(e.target.value)}
                            />
                        </div>
                    </div>

                    {/* PO list */}
                    <div className="bg-[#FAF8F5] rounded-2xl border border-[rgba(148,163,184,0.1)] overflow-hidden">
                        <div className="p-4 border-b border-[rgba(148,163,184,0.1)] flex items-center justify-between">
                            <span className="text-[10px] font-black uppercase tracking-widest text-[#000000]">Đơn hàng chờ nhập kho (SHIPPED)</span>
                            <span className="text-[10px] font-bold text-black bg-emerald-500/10 border border-emerald-500/20 px-2 py-1 rounded">{filteredPos.length} đơn</span>
                        </div>

                        {filteredPos.length === 0 ? (
                            <div className="py-16 text-center text-[#000000] font-bold text-xs uppercase tracking-widest">
                                Không có PO nào ở trạng thái SHIPPED
                            </div>
                        ) : (
                            <table className="erp-table text-xs m-0">
                                <thead>
                                    <tr>
                                        <th className="text-[10px] font-black uppercase tracking-widest text-[#000000]">Mã PO</th>
                                        <th className="text-[10px] font-black uppercase tracking-widest text-[#000000]">Nhà cung cấp</th>
                                        <th className="text-center text-[10px] font-black uppercase tracking-widest text-[#000000]">Số mặt hàng</th>
                                        <th className="text-[10px] font-black uppercase tracking-widest text-[#000000]">Ngày tạo</th>
                                        <th></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredPos.map((po) => (
                                        <tr key={po.id} className="hover:bg-[#FFFFFF] cursor-pointer" onClick={() => handleSelectPO(po)}>
                                            <td className="font-black text-black">{po.poNumber || po.id.split('-').pop()}</td>
                                            <td className="font-bold text-[#000000]">{po.supplier?.name || po.vendor || "—"}</td>
                                            <td className="text-center font-bold text-[#000000]">{po.items?.length ?? 0}</td>
                                            <td className="text-[#000000]">{po.createdAt ? new Date(po.createdAt).toLocaleDateString('vi-VN') : "—"}</td>
                                            <td>
                                                <button className="text-[10px] font-black uppercase tracking-widest text-black bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded hover:bg-emerald-500/20 transition-colors">
                                                    Chọn
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>
            ) : (
                <div className="space-y-8 fade-in">
                    {/* Back button */}
                    <button
                        onClick={() => setActivePO(null)}
                        className="flex items-center gap-2 text-xs font-bold text-[#000000] hover:text-[#B4533A] transition-colors uppercase tracking-widest"
                    >
                        <ArrowLeft size={14} /> Quay lại danh sách PO
                    </button>

                    {/* Header Info PO */}
                    <div className="bg-[#FAF8F5] text-[#000000] rounded-2xl p-6 shadow-xl relative overflow-hidden flex flex-col md:flex-row justify-between items-center z-10 border border-[rgba(148,163,184,0.1)]">
                        <div className="absolute top-0 right-0 p-4 opacity-5"><Package size={150} /></div>
                        <div>
                            <div className="text-[10px] font-black uppercase tracking-widest text-[#000000] mb-1">Incoming Shipment</div>
                            <h2 className="text-2xl font-black text-[#000000]">Đơn hàng nhập kho</h2>
                            <p className="text-sm text-[#000000] font-medium">Bên giao: <span className="font-bold text-[#000000]">{activePO.supplier?.name || activePO.vendor || "—"}</span></p>
                        </div>
                        <div className="flex flex-col text-right mt-4 md:mt-0 relative z-10">
                            <span className="text-[10px] uppercase font-bold text-black tracking-widest rounded px-2 py-1 border border-emerald-500/20 bg-emerald-500/10">Hàng chuẩn bị dỡ (Ready for Unload)</span>
                            <span className="text-xs text-[#000000] mt-2">Date: {activePO.createdAt || new Date().toLocaleDateString()}</span>
                        </div>
                    </div>

                    {/* Step 1: Nhận hàng vật lý */}
                    <div className="bg-[#FAF8F5] rounded-2xl border border-[rgba(148,163,184,0.1)] shadow-xl shadow-[#B4533A]/5 !p-0 overflow-hidden">
                        <div className="p-4 bg-amber-500/10 border-b border-amber-500/20 flex items-center gap-2">
                            <Package size={16} className="text-black" />
                            <h3 className="text-sm font-black uppercase tracking-widest text-black">Bước 1: Đối chiếu & đếm số lượng (Phát sinh chênh lệch)</h3>
                        </div>
                        <div className="bg-[#FAF8F5]">
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
                                            <tr key={item.id} className="border-b border-[rgba(148,163,184,0.1)] hover:bg-[#FFFFFF]">
                                                <td className="font-bold text-[#000000]">{item.description}</td>
                                                <td className="text-center font-bold text-[#000000]">{item.qty}</td>
                                                <td className="text-center border-l border-[rgba(148,163,184,0.1)]">
                                                    <input type="number" className="w-16 text-center text-xs bg-[#FFFFFF] border border-[rgba(148,163,184,0.1)] rounded focus:outline-none focus:border-[#B4533A]/30 text-[#000000] py-1" value={rData.pList} onChange={e => handleRecvChange(item.id, 'pList', Number(e.target.value))} />
                                                </td>
                                                <td className="text-center border-l-2 border-amber-500/20 bg-amber-500/5 p-2">
                                                    <input type="number" className="w-full text-center font-black text-sm bg-[#FFFFFF] border border-amber-500/30 rounded shadow-inner focus:outline-none focus:ring-2 focus:ring-amber-500/50 text-[#000000] py-1" value={rData.actual} onChange={e => handleRecvChange(item.id, 'actual', Number(e.target.value))} />
                                                </td>
                                                <td className="text-center">
                                                    {diff !== 0 ? (
                                                        <span className={`font-bold px-2 py-1 rounded text-[10px] ${isHigh ? 'bg-rose-500/10 text-black border border-rose-500/20' : 'bg-amber-500/10 text-black border border-amber-500/20'}`}>
                                                            {diff > 0 ? '+' : ''}{diff} ({pct.toFixed(1)}%)
                                                            {isHigh && <AlertTriangle size={10} className="inline ml-1" />}
                                                        </span>
                                                    ) : <span className="text-black font-bold text-[10px]">Khớp</span>}
                                                </td>
                                                <td>
                                                    <input type="text" className="w-full text-xs text-[#000000] bg-[#FFFFFF] border border-[rgba(148,163,184,0.1)] rounded px-2 py-1 placeholder:text-[#000000] text-[#000000]" placeholder="Lý do lệch..." value={rData.note} onChange={e => handleRecvChange(item.id, 'note', e.target.value)} />
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Step 2: Quality Control */}
                    <div className="bg-[#FAF8F5] rounded-2xl border border-[rgba(148,163,184,0.1)] shadow-xl shadow-[#B4533A]/5 !p-0 overflow-hidden">
                        <div className="p-4 bg-[#B4533A]/10 border-b border-[#B4533A]/20 flex justify-between items-center">
                            <div className="flex items-center gap-2">
                                <FileCheck size={16} className="text-black" />
                                <h3 className="text-sm font-black uppercase tracking-widest text-black">Bước 2: Quality Control (QC)</h3>
                            </div>
                            <span className="text-[10px] font-bold text-black bg-[#FFFFFF] px-2 py-1 border border-[#B4533A]/20 rounded">Checklist: Đã áp dụng tiêu chuẩn ISO-9001</span>
                        </div>

                        <div className="divide-y divide-[rgba(148,163,184,0.1)] bg-[#FAF8F5]">
                            {activePO.items?.map((item) => {
                                const qData = qcData[item.id];
                                if (!qData) return null;
                                return (
                                    <div key={item.id} className="p-6 transition-colors hover:bg-[#FFFFFF] relative group">
                                        <div className="flex flex-col xl:flex-row gap-6">
                                            <div className="w-full xl:w-1/3 border-r border-[rgba(148,163,184,0.1)] pr-6">
                                                <h4 className="font-bold text-[#000000] mb-2">{item.description}</h4>
                                                <label className="text-[9px] font-black uppercase text-[#000000] tracking-widest mb-1 block">Kết quả QC Dropdown</label>
                                                <select
                                                    className={`w-full p-2 border rounded-lg font-bold text-xs outline-none focus:ring-2 ${qData.status === 'PASS' ? 'border-emerald-500/20 text-black bg-emerald-500/10 focus:ring-emerald-500/30' : qData.status === 'FAIL' ? 'border-rose-500/20 text-black bg-rose-500/10 focus:ring-rose-500/30' : 'border-amber-500/20 text-black bg-amber-500/10 focus:ring-amber-500/30'}`}
                                                    value={qData.status}
                                                    onChange={e => handleQcChange(item.id, 'status', e.target.value)}
                                                >
                                                    <option value="PASS">PASS (Đạt toàn bộ)</option>
                                                    <option value="PARTIAL_PASS">PARTIAL_PASS (Đạt 1 phần)</option>
                                                    <option value="FAIL">FAIL (Trả hàng)</option>
                                                </select>
                                                <div className="mt-4 space-y-2">
                                                    <label className="flex items-center gap-2 cursor-pointer">
                                                        <input type="checkbox" className="w-3 h-3 text-[#B4533A] bg-[#FFFFFF] border-[rgba(148,163,184,0.1)] rounded focus:ring-[#B4533A]/30" defaultChecked />
                                                        <span className="text-[10px] text-[#000000] font-medium">Bao bì nguyên vẹn</span>
                                                    </label>
                                                    <label className="flex items-center gap-2 cursor-pointer">
                                                        <input type="checkbox" className="w-3 h-3 text-[#B4533A] bg-[#FFFFFF] border-[rgba(148,163,184,0.1)] rounded focus:ring-[#B4533A]/30" defaultChecked={qData.status === 'PASS'} />
                                                        <span className="text-[10px] text-[#000000] font-medium">Đúng quy cách kỹ thuật</span>
                                                    </label>
                                                </div>
                                            </div>

                                            {qData.status !== 'PASS' ? (
                                                <div className="flex-1 space-y-4 animate-in fade-in slide-in-from-left-4">
                                                    <div className="flex items-start gap-4 p-4 border border-rose-500/20 bg-rose-500/5 rounded-xl">
                                                        <AlertTriangle size={24} className="text-black mt-1 shrink-0" />
                                                        <div className="w-full space-y-3">
                                                            <div className="flex items-center justify-between border-b border-rose-500/20 pb-2">
                                                                <span className="text-xs font-black text-black uppercase">Khai báo Lỗi (Defect Handling)</span>
                                                                <span className="text-xs font-bold text-black">SL Thực nhận: {recvData[item.id]?.actual}</span>
                                                            </div>
                                                            <div className="grid grid-cols-2 gap-4">
                                                                <div>
                                                                    <label className="text-[10px] font-black uppercase text-[#000000] mb-1 block">Số lượng Lỗi/Hỏng</label>
                                                                    <input type="number" className="w-full bg-[#FFFFFF] border border-rose-500/20 rounded-lg px-3 py-2 text-black font-bold focus:outline-none focus:border-rose-500/30 text-[#000000]" value={qData.failQty} onChange={e => handleQcChange(item.id, 'failQty', Number(e.target.value))} />
                                                                </div>
                                                                <div>
                                                                    <label className="text-[10px] font-black uppercase text-[#000000] mb-1 block">Lý do chính</label>
                                                                    <select className="w-full bg-[#FFFFFF] border border-[rgba(148,163,184,0.1)] rounded-lg px-3 py-2 text-xs text-[#000000] focus:outline-none focus:border-[#B4533A]/30" value={qData.reason} onChange={e => handleQcChange(item.id, 'reason', e.target.value)}>
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
                                                                    <label className="text-[10px] font-black uppercase text-[#000000] mb-1 block flex items-center gap-1"><RotateCcw size={10} /> Action Xử lý</label>
                                                                    <select className="w-full bg-[#FFFFFF] border border-[rgba(148,163,184,0.1)] rounded-lg px-3 py-2 text-xs text-black font-bold focus:outline-none focus:border-[#B4533A]/30" value={qData.action} onChange={e => handleQcChange(item.id, 'action', e.target.value)}>
                                                                        <option value="">-- Hành động kho --</option>
                                                                        <option value="Trả Nhà Cung Cấp">Return to Vendor (RTV)</option>
                                                                        <option value="Giữ tại kho chờ giải quyết">Hold & Chờ Procurement QĐ</option>
                                                                        <option value="Nhận nhưng chiết khấu">Accept with Discount</option>
                                                                    </select>
                                                                </div>
                                                                <div>
                                                                    <label className="text-[10px] font-black uppercase text-[#000000] mb-1 block flex items-center gap-1"><UploadCloud size={10} /> Ảnh Bằng Chứng</label>
                                                                    <div className="border border-dashed border-rose-500/30 bg-[#FFFFFF] h-10 rounded cursor-pointer flex items-center justify-center text-[10px] font-bold text-black hover:bg-rose-500/5 transition-colors">
                                                                        {qData.proof ? "Đã đính kèm ảnh lỗi.jpg" : "Click / Drag thả ảnh"}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <div>
                                                                <input type="text" className="w-full text-xs text-[#000000] bg-[#FFFFFF] border border-[rgba(148,163,184,0.1)] rounded-lg px-3 py-2 placeholder:text-[#000000] text-[#000000]" placeholder="Ghi chú chi tiết cho bộ phận Thu Mua theo dõi..." />
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="flex-1 flex items-center justify-center border-2 border-dashed border-emerald-500/20 bg-emerald-500/5 rounded-xl">
                                                    <div className="text-center text-black py-6">
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
                    <div className="bg-[#FAF8F5] rounded-2xl border border-[rgba(148,163,184,0.1)] shadow-xl shadow-[#B4533A]/5 text-[#000000] relative overflow-hidden">
                        <div className="absolute -right-20 -bottom-20 opacity-10"><FileText size={250} /></div>
                        <div className="flex flex-col md:flex-row justify-between items-center gap-8 relative z-10 p-4">
                            <div className="w-full md:w-1/2">
                                <h3 className="text-sm font-black uppercase tracking-widest text-black mb-6 flex items-center gap-2">
                                    <CheckCircle2 size={16} /> Summary Hoàn Thành GRN
                                </h3>
                                <div className="grid grid-cols-2 gap-x-8 gap-y-4 text-xs font-bold text-[#000000]">
                                    <div className="flex justify-between border-b border-[rgba(148,163,184,0.1)] pb-2">
                                        <span>Tổng SL Nhận:</span>
                                        <span className="text-[#000000] text-base">
                                            {activePO.items?.reduce((sum: number, i) => sum + (recvData[i.id]?.actual || 0), 0)}
                                        </span>
                                    </div>
                                    <div className="flex justify-between border-b border-rose-500/30 pb-2 text-black">
                                        <span>Tổng SL Lỗi/Từ chối:</span>
                                        <span className="text-black text-base">
                                            {activePO.items?.reduce((sum: number, i) => sum + (qcData[i.id]?.failQty || 0), 0)}
                                        </span>
                                    </div>
                                    <div className="flex justify-between border-b border-[rgba(148,163,184,0.1)] pb-2 col-span-2 mt-2">
                                        <span className="uppercase tracking-widest text-[10px] text-[#000000]">Tỷ lệ Pass (Kho):</span>
                                        <span className="text-black text-xl flex items-center gap-1">
                                            {(() => {
                                                const total = activePO.items?.reduce((sum: number, i) => sum + (recvData[i.id]?.actual || 0), 0);
                                                const fail = activePO.items?.reduce((sum: number, i) => sum + (qcData[i.id]?.failQty || 0), 0);
                                                if (total === 0) return "0%";
                                                return `${((total - fail) / total * 100).toFixed(1)}%`;
                                            })()}
                                        </span>
                                    </div>
                                </div>
                            </div>
                            <div className="w-full md:w-auto text-right flex flex-col items-end gap-4">
                                <div className="bg-[#FFFFFF] flex flex-col items-center justify-center p-6 border-dashed border-2 border-emerald-500/20 bg-emerald-500/5 rounded-2xl">
                                    <div className="text-[10px] font-black uppercase tracking-widest text-black mb-2">Final Step</div>
                                    <button onClick={handleConfirm} className="bg-emerald-500 hover:bg-emerald-600 text-emerald-950 font-black uppercase tracking-widest text-xs px-8 py-4 rounded-xl shadow-lg shadow-emerald-500/20 transition-all flex items-center gap-2">
                                        <FileCheck size={18} /> Confirm GRN
                                    </button>
                                    <p className="text-[9px] text-black/60 mt-4 text-center max-w-xs font-bold">Data sẽ đẩy về ERP Tồn Kho & Hệ thống Kế toán Đối soát (3-Way Matching).</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </main>
    );
}

