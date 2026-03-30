"use client";

import React, { useState } from "react";
import DashboardHeader from "../../components/DashboardHeader";
import { FileText, Calculator, FileCheck, Search, Info, Send, UploadCloud } from "lucide-react";

import { useProcurement } from "../../context/ProcurementContext";
import { useRouter } from "next/navigation";

export default function SupplierInvoice() {
    const { pos, grns, createInvoice } = useProcurement();
    const router = useRouter();
    
    const [selectedPO, setSelectedPO] = useState("");
    
    // Create data based on pos and grns for POs in RECEIVED status
    const deliverablePOs = pos.map((p: any) => {
        const matchingGrn = grns.find((g: any) => g.poId === p.id);
        if (matchingGrn && p.status === "RECEIVED") {
            const receivedItems = p.items.map((item: any) => ({
                id: item.id,
                desc: item.description,
                expected: item.qty,
                received: matchingGrn.receivedItems[item.id] || 0,
                price: item.estimatedPrice || 0
            })).filter((i: any) => i.received > 0);
            
            return {
                id: p.id,
                vendor: p.vendor,
                grn: matchingGrn.id,
                receivedItems
            };
        }
        return null;
    }).filter(Boolean) as any[];

    const currentPO = deliverablePOs.find((p: any) => p.id === selectedPO);
    
    const [invoiceItems, setInvoiceItems] = useState<{ [key: string]: number }>({});
    const [vat, setVat] = useState(10);
    const [invoiceNo, setInvoiceNo] = useState("");

    const handleQtyChange = (itemId: string, qty: string, maxQty: number) => {
        let val = Number(qty);
        if (val > maxQty) val = maxQty; // Supplier cannot invoice more than received
        setInvoiceItems(prev => ({ ...prev, [itemId]: val }));
    };

    const subTotal = currentPO?.receivedItems.reduce((sum: number, item: any) => {
        const qty = invoiceItems[item.id] !== undefined ? invoiceItems[item.id] : item.received; // Default auto fill max
        return sum + (qty * item.price);
    }, 0) || 0;

    const vatAmount = subTotal * (vat / 100);
    const totalAmount = subTotal + vatAmount;

    const handleSubmit = () => {
        if(!currentPO || !invoiceNo) {
            alert("Vui lòng nhập Số HĐ");
            return;
        }
        createInvoice({ poId: currentPO.id, vendor: currentPO.vendor, amount: totalAmount });
        alert(`Đã xuất Hóa đơn ${invoiceNo} (Invoice) cho ${currentPO.id} thành công!`);
        router.push("/supplier/dashboard");
    }

    return (
        <main className="pt-16 px-8 pb-12 animate-in fade-in duration-300">
            <DashboardHeader breadcrumbs={["Nhà cung cấp", "Tạo Hóa đơn (Invoice)"]} />

            <div className="mt-8 mb-8 border-b border-slate-200 pb-4">
                <h1 className="text-3xl font-black text-erp-navy tracking-tight flex items-center gap-3">
                    Khởi tạo Hóa đơn VAT Điện tử <span className="text-[10px] font-bold text-orange-500 bg-orange-50 border border-orange-200 px-2 py-1 rounded uppercase tracking-widest ml-2">Phiếu thu & Đối soát</span>
                </h1>
                <p className="text-sm text-slate-500 mt-1">Hệ thống áp dụng 3-way Matching. NCC chỉ xuất hóa đơn cho các mặt hàng đã được kho (Buyer) xác nhận thực nhận (GRN).</p>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
                {/* Main Form Form */}
                <div className="xl:col-span-3 space-y-6">
                    <div className="erp-card shadow-sm border border-slate-200 flex items-center gap-4 bg-blue-50/50">
                        <label className="text-xs font-black uppercase text-erp-navy whitespace-nowrap">Chọn PO Đã Giao</label>
                        <select 
                            className="erp-input w-full md:w-1/2 !bg-white focus:border-erp-blue border-blue-200 font-bold text-erp-blue"
                            value={selectedPO}
                            onChange={(e) => setSelectedPO(e.target.value)}
                        >
                            <option value="">-- Chọn đơn đã hoàn tất nhập kho --</option>
                            {deliverablePOs.map((po: any) => <option key={po.id} value={po.id}>{po.id} (Kho xác nhận đủ)</option>)}
                        </select>
                        {selectedPO && <div className="text-[10px] font-black uppercase text-emerald-600 tracking-widest bg-emerald-100 px-3 py-1.5 rounded-lg ml-auto border border-emerald-200">Kho Locked: {currentPO?.grn}</div>}
                    </div>

                    {selectedPO ? (
                        <>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="erp-card shadow-sm border border-slate-200">
                                    <label className="block text-[10px] font-black uppercase text-slate-500 tracking-widest mb-2">Số HĐ Điện Tử VAT</label>
                                    <input type="text" className="erp-input w-full font-mono font-bold text-slate-700" placeholder="VD: 0001234" value={invoiceNo} onChange={e => setInvoiceNo(e.target.value)} />
                                </div>
                                <div className="erp-card shadow-sm border border-slate-200">
                                    <label className="block text-[10px] font-black uppercase text-slate-500 tracking-widest mb-2">Ký hiệu Mẫu số</label>
                                    <input type="text" className="erp-input w-full font-mono text-slate-600" defaultValue="1C26TAA" />
                                </div>
                                <div className="erp-card shadow-sm border border-slate-200">
                                    <label className="block text-[10px] font-black uppercase text-slate-500 tracking-widest mb-2">Ngày xuất (Auto)</label>
                                    <input type="date" className="erp-input w-full font-mono bg-slate-50 opacity-70 cursor-not-allowed" disabled defaultValue={new Date().toISOString().substring(0, 10)} />
                                </div>
                            </div>

                            <div className="erp-card !p-0 shadow-sm border border-slate-200 overflow-hidden">
                                <div className="p-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
                                    <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-2">
                                        <FileCheck size={14} /> Danh sách Đối soát HĐ (Items)
                                    </h3>
                                    <p className="text-[9px] text-slate-500 font-bold bg-white px-2 py-1 rounded border border-slate-200 uppercase tracking-widest">3-Way: PO - GRN - INV</p>
                                </div>
                                <table className="erp-table text-xs m-0">
                                    <thead>
                                        <tr>
                                            <th>Sản phẩm / Diễn giải</th>
                                            <th className="text-right">Kho thực nhận</th>
                                            <th className="text-right w-32 border-l-2 border-emerald-100 px-4 bg-emerald-50/20 text-emerald-800">SL Lên Hóa Đơn</th>
                                            <th className="text-right w-40">Thành tiền nháp</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {currentPO?.receivedItems.map((item: any) => (
                                            <tr key={item.id} className="border-b border-slate-50 hover:bg-slate-50 group">
                                                <td className="font-bold text-slate-700">{item.desc}</td>
                                                <td className="text-right">
                                                    <div className="inline-flex flex-col items-end">
                                                        <span className="font-mono font-black text-slate-500 bg-slate-100 px-2 py-0.5 rounded text-[10px] mb-1">{item.received} {item.received < item.expected && <span className="text-red-500 ml-1">(! thiếu)</span>}</span>
                                                        <span className="text-[9px] text-slate-400">@ {(item.price).toLocaleString()}</span>
                                                    </div>
                                                </td>
                                                <td className="border-l-2 border-emerald-100 p-2 bg-emerald-50/10">
                                                    <input 
                                                        type="number" 
                                                        className="erp-input w-full text-right font-mono font-black text-emerald-700 focus:border-emerald-500 shadow-inner bg-white" 
                                                        value={invoiceItems[item.id] !== undefined ? invoiceItems[item.id] : item.received}
                                                        max={item.received}
                                                        onChange={e => handleQtyChange(item.id, e.target.value, item.received)}
                                                    />
                                                </td>
                                                <td className="text-right font-mono font-bold text-erp-navy text-sm p-4 bg-slate-50/50">
                                                    {((invoiceItems[item.id] !== undefined ? invoiceItems[item.id] : item.received) * item.price).toLocaleString()} ₫
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </>
                    ) : (
                        <div className="erp-card bg-slate-50 border-dashed py-32 text-center text-slate-400">
                            <Search size={48} className="mx-auto mb-4 opacity-10" />
                            <p className="text-xs font-black uppercase tracking-widest">Chưa chọn chứng từ thanh toán</p>
                            <p className="text-[10px] mt-2 italic font-medium">Bạn chỉ được lập invoice khi có xác nhận nhập kho từ Buyer.</p>
                        </div>
                    )}
                </div>

                {/* Right Column: Tổng kết thuế & Submit */}
                <div className="space-y-6">
                    <div className={`erp-card shadow-xl shadow-erp-navy/5 border-2 border-slate-200 transition-all ${selectedPO ? 'border-erp-navy/20' : 'opacity-50 grayscale pointer-events-none'}`}>
                        <h3 className="text-sm font-black uppercase tracking-widest text-erp-navy mb-6 flex items-center gap-2 border-b border-slate-100 pb-4">
                            <Calculator size={16}/> Tích Toán Giá Trị
                        </h3>
                        
                        <div className="space-y-4 text-xs font-bold text-slate-600 mb-6 border-b border-slate-100 pb-6">
                            <div className="flex justify-between items-center">
                                <span className="uppercase tracking-widest text-[10px] text-slate-500">Tổng tiền TRƯỚC THUẾ</span>
                                <span className="font-mono text-base">{subTotal.toLocaleString()} ₫</span>
                            </div>
                            <div className="flex justify-between items-center group">
                                <span className="uppercase tracking-widest text-[10px] text-slate-500 flex items-center gap-2">Thuế SUẤT VAT <input type="number" className="erp-input !py-0 !px-1 w-12 text-center font-mono border-slate-300" value={vat} onChange={e => setVat(Number(e.target.value))}/> %</span>
                                <span className="font-mono text-base text-slate-400 group-hover:text-erp-navy transition-colors">{vatAmount.toLocaleString()} ₫</span>
                            </div>
                        </div>

                        <div className="flex flex-col gap-1 text-right mb-6">
                            <span className="text-[10px] font-black uppercase tracking-widest text-erp-blue mb-1">Tổng Tiền THANH TOÁN YÊU CẦU</span>
                            <span className="text-3xl font-black font-mono text-erp-navy tracking-tight">{totalAmount.toLocaleString()} <span className="text-sm">VND</span></span>
                        </div>
                        
                        <div className="space-y-3 pt-6 border-t border-slate-100">
                             <div className="border border-dashed border-slate-300 p-4 text-center rounded-xl hover:bg-slate-50 cursor-pointer group">
                                 <UploadCloud size={16} className="mx-auto mb-1 text-slate-400 group-hover:text-erp-blue transition-colors" />
                                 <div className="text-[10px] font-black uppercase text-slate-500 mt-2">Upload XML Hóa Đơn Phạt Phụ Lục</div>
                             </div>

                             <button onClick={handleSubmit} className="w-full btn-primary bg-erp-navy border-none shadow-xl shadow-erp-navy/30 py-4 text-xs flex items-center justify-center gap-2 uppercase tracking-widest mt-4">
                                 <Send size={16}/> Submit cho AP Khách hàng
                             </button>
                        </div>
                    </div>

                    <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100 flex items-start gap-3">
                        <Info size={16} className="text-erp-blue shrink-0 mt-0.5" />
                        <p className="text-[10px] text-blue-800 leading-relaxed font-medium">Hệ thống khách hàng sẽ tự động Check lệch chuẩn (Tolerance) qua tool AI OCR. Hóa đơn của bạn sẽ được thanh toán tự động vào mùng 15 tháng T+1 theo quy trình Net 30.</p>
                    </div>
                </div>
            </div>
        </main>
    );
}
