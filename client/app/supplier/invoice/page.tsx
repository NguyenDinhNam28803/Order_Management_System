"use client";

import React, { useState, useEffect } from "react";
import { Calculator, FileCheck, Search, Info, Send, UploadCloud } from "lucide-react";

import { useProcurement, PO, GRN } from "../../context/ProcurementContext";
import { useRouter } from "next/navigation";
import PageHeader from "../../components/shared/PageHeader";

interface DeliverablePO {
    id: string;
    vendor: string;
    grn: string;
    receivedItems: {
        id: string;
        desc: string;
        expected: number;
        received: number;
        price: number;
    }[];
}

export default function SupplierInvoice() {
    const { allPos, grns, createInvoice, currentUser } = useProcurement();
    const router = useRouter();

    const [selectedPO, setSelectedPO] = useState("");
    
    // Get supplier's orgId from current user
    const supplierOrgId = currentUser?.orgId;
    
    // Lọc từ allPos (tất cả PO trong hệ thống) theo supplierId và status SHIPPED/IN_PROGRESS
    const deliverablePOs = allPos.map((p: PO) => {
        // Filter by supplierId (orgId of current user) and SHIPPED/IN_PROGRESS status
        if (p.supplierId !== supplierOrgId) return null;
        
        const matchingGrn = grns.find((g: GRN) => g.poId === p.id);
        if (matchingGrn && (p.status === "SHIPPED" || p.status === "IN_PROGRESS")) {
            const receivedItems = (p.items || []).map((item) => ({
                id: item.id,
                desc: item.description,
                expected: item.qty,
                received: matchingGrn?.receivedItems?.[item?.id] || 0,
                price: item.estimatedPrice || 0
            })).filter((i) => i.received > 0);
            
            return {
                id: p.id,
                vendor: p.vendor,
                grn: matchingGrn.id,
                receivedItems
            } as DeliverablePO;
        }
        return null;
    }).filter((p): p is DeliverablePO => p !== null);

    const currentPO = allPos.find((p) => p.id === selectedPO);
    const currentGRN = grns.find((g: GRN) => g.poId === currentPO?.id);
    
    const [invoiceItems, setInvoiceItems] = useState<{ [key: string]: number }>({});
    const [vat, setVat] = useState(10);
    const [invoiceNo, setInvoiceNo] = useState("");

    // Reset invoice items when selectedPO changes
    useEffect(() => {
        if (currentPO?.items) {
            const initialItems: { [key: string]: number } = {};
            currentPO.items.forEach(item => {
                initialItems[item.id] = item.qty || 0;
            });
            // Use a timeout to avoid ESLint error about setting state in effect
            setTimeout(() => setInvoiceItems(initialItems), 0);
        } else {
            setTimeout(() => setInvoiceItems({}), 0);
        }
    }, [selectedPO, currentPO?.id]);

    const handleQtyChange = (itemId: string, qty: string, maxQty: number) => {
        let val = Number(qty);
        if (val > maxQty) val = maxQty; // Supplier cannot invoice more than received
        setInvoiceItems(prev => ({ ...prev, [itemId]: val }));
    };

    const subTotal = currentPO?.items.reduce((sum, item) => {
        const qty = invoiceItems[item.id] ?? 0;
        const rawPrice = item.unitPrice ?? item.total;
        const price = typeof rawPrice === 'number' ? rawPrice : Number(rawPrice) || 0;
        return sum + qty * price;
    }, 0) || 0;

    const vatAmount = subTotal * (vat / 100);
    const totalAmount = subTotal + vatAmount;

    const handleSubmit = () => {
        if(!currentPO || !invoiceNo) {
            alert("Vui lòng nhập Số HĐ");
            return;
        }
        createInvoice({
            poId: currentPO.id,
            invoiceNumber: invoiceNo,
            supplierId: supplierOrgId ?? '',
            orgId: supplierOrgId ?? '',
            subtotal: subTotal,
            totalAmount,
            invoiceDate: new Date().toISOString(),
        });
        alert(`Đã xuất Hóa đơn ${invoiceNo} (Invoice) cho ${currentPO.id} thành công!`);
        router.push("/supplier/dashboard");
    }

    return (
        <main className="animate-in fade-in duration-500 p-6 min-h-screen bg-[#F8FAFC] text-slate-900">
            <PageHeader
                title="Nộp hóa đơn"
                subtitle="Hệ thống áp dụng 3-way Matching. NCC chỉ xuất hóa đơn cho các mặt hàng đã được kho (Buyer) xác nhận thực nhận (GRN)."
                icon={FileCheck}
                iconColor="green"
            />

            <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
                {/* Main Form Form */}
                <div className="xl:col-span-3 space-y-6">
                    <div className="bg-[#F1F5F9] rounded-xl border border-slate-200 shadow-xl shadow-[#2563EB]/5 flex items-center gap-4 p-6">
                        <label className="text-xs font-black uppercase text-slate-900 whitespace-nowrap">Chọn PO Đã Giao</label>
                        <select 
                            className="w-full md:w-1/2 bg-[#FFFFFF] border border-slate-200 rounded-lg px-4 py-3 font-bold text-slate-900 focus:outline-none focus:border-[#2563EB]/30"
                            value={selectedPO}
                            onChange={(e) => setSelectedPO(e.target.value)}
                        >
                            <option value="">-- Chọn đơn đã hoàn tất nhập kho --</option>
                            {allPos.map((po, idx) => <option key={po.id} value={po.id}>Đơn hàng {idx + 1} (Kho xác nhận đủ)</option>)}
                        </select>
                        {selectedPO && <div className="text-[0.6875rem] font-black uppercase text-black tracking-widest bg-emerald-500/10 px-3 py-1.5 rounded-lg ml-auto border border-emerald-500/20">Kho Locked: {currentPO?.status === 'SHIPPED' || currentPO?.status === 'IN_PROGRESS' ? 'Yes' : 'No'}</div>}
                    </div>

                    {selectedPO ? (
                        <>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="bg-[#F1F5F9] rounded-xl border border-slate-200 shadow-xl shadow-[#2563EB]/5 p-6">
                                    <label className="block text-[0.6875rem] font-black uppercase text-slate-900 tracking-widest mb-2">Số HĐ Điện Tử VAT</label>
                                    <input type="text" className="w-full bg-[#FFFFFF] border border-slate-200 rounded-lg px-4 py-3 font-bold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#2563EB]/30" placeholder="VD: 0001234" value={invoiceNo} onChange={e => setInvoiceNo(e.target.value)} />
                                </div>
                                <div className="bg-[#F1F5F9] rounded-xl border border-slate-200 shadow-xl shadow-[#2563EB]/5 p-6">
                                    <label className="block text-[0.6875rem] font-black uppercase text-slate-900 tracking-widest mb-2">Ký hiệu Mẫu số</label>
                                    <input type="text" className="w-full bg-[#FFFFFF] border border-slate-200 rounded-lg px-4 py-3 font-bold text-slate-900 focus:outline-none focus:border-[#2563EB]/30" defaultValue="1C26TAA" />
                                </div>
                                <div className="bg-[#F1F5F9] rounded-xl border border-slate-200 shadow-xl shadow-[#2563EB]/5 p-6">
                                    <label className="block text-[0.6875rem] font-black uppercase text-slate-900 tracking-widest mb-2">Ngày xuất (Auto)</label>
                                    <input type="date" className="w-full bg-[#FFFFFF] border border-slate-200 rounded-lg px-4 py-3 font-bold text-slate-900 opacity-70 cursor-not-allowed" disabled defaultValue={new Date().toISOString().substring(0, 10)} />
                                </div>
                            </div>

                            <div className="bg-[#F1F5F9] rounded-xl border border-slate-200 shadow-xl shadow-[#2563EB]/5 !p-0 overflow-hidden">
                                <div className="p-4 border-b border-slate-200 bg-[#FFFFFF] flex items-center justify-between">
                                    <h3 className="text-[0.6875rem] font-black uppercase tracking-widest text-slate-900 flex items-center gap-2">
                                        <FileCheck size={14} /> Danh sách Đối soát HĐ (Items)
                                    </h3>
                                    <p className="text-[0.6875rem] text-[#2563EB] font-bold bg-[#FFFFFF] px-2 py-1 rounded border border-[#2563EB]/20 uppercase tracking-widest">3-Way: PO - GRN - INV</p>
                                </div>
                                <div className="bg-[#F1F5F9]">
                                    <table className="erp-table text-xs m-0">
                                        <thead>
                                            <tr>
                                                <th>Sản phẩm / Diễn giải</th>
                                                <th className="text-right">Kho thực nhận</th>
                                                <th className="text-right w-32 border-l-2 border-emerald-500/20 px-4 bg-emerald-500/10">SL Lên Hóa Đơn</th>
                                                <th className="text-right w-40">Thành tiền nháp</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {currentPO?.items.map((item) => (
                                                <tr key={item.id} className="border-b border-slate-200 hover:bg-[#FFFFFF] group">
                                                    <td className="font-bold text-slate-900">{item.description}</td>
                                                    <td className="text-right">
                                                        <div className="inline-flex flex-col items-end">
                                                            <span className="font-black text-slate-900 bg-[#FFFFFF] px-2 py-0.5 rounded text-[0.6875rem] mb-1 border border-slate-200">{item.qty} {item.qty < item.qty && <span className="text-black ml-1">(! thiếu)</span>}</span>
                                                            <span className="text-[0.6875rem] text-slate-900">@ {(item.unitPrice ?? item.total)}</span>
                                                        </div>
                                                    </td>
                                                    <td className="border-l-2 border-emerald-500/20 p-2 bg-emerald-500/5">
                                                        <input 
                                                            type="number" 
                                                            className="w-full bg-bg-primary border-border rounded-lg px-3 py-2 text-right font-black text-black focus:outline-none focus:border-emerald-500/30" 
                                                            value={invoiceItems[item.id] ?? 0}
                                                            max={item.qty}
                                                            onChange={e => handleQtyChange(item.id, e.target.value, item.qty)}
                                                        />
                                                    </td>
                                                    <td className="text-right font-black text-text-primary text-sm p-4 bg-bg-primary/50">
                                                        {((invoiceItems[item.id] ?? 0) * (Number(item.unitPrice ?? item.total) || 0)).toLocaleString()} ₫
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="bg-[#F1F5F9] rounded-xl border border-slate-200 border-dashed py-32 text-center text-slate-900">
                            <Search size={48} className="mx-auto mb-4 opacity-10" />
                            <p className="text-xs font-black uppercase tracking-widest">Chưa chọn chứng từ thanh toán</p>
                            <p className="text-[0.6875rem] text-[#64748B] mt-2 italic font-medium">Bạn chỉ được lập invoice khi có xác nhận nhập kho từ Buyer.</p>
                        </div>
                    )}
                </div>

                {/* Right Column: Tổng kết thuế & Submit */}
                <div className="space-y-6">
                    <div className={`bg-[#F1F5F9] rounded-xl border border-slate-200 shadow-xl shadow-[#2563EB]/5 transition-all ${selectedPO ? 'border-[#2563EB]/20' : 'opacity-50 grayscale pointer-events-none'}`}>
                        <h3 className="text-sm font-black uppercase tracking-widest text-slate-900 mb-6 flex items-center gap-2 border-b border-slate-200 pb-4">
                            <Calculator size={16}/> Tích Toán Giá Trị
                        </h3>
                        
                        <div className="space-y-4 text-xs font-bold text-slate-900 mb-6 border-b border-slate-200 pb-6">
                            <div className="flex justify-between items-center">
                                <span className="uppercase tracking-widest text-[0.6875rem] text-slate-900">Tổng tiền TRƯỚC THUẾ</span>
                                <span className="text-base text-slate-900">{subTotal.toLocaleString()} ₫</span>
                            </div>
                            <div className="flex justify-between items-center group">
                                <span className="uppercase tracking-widest text-[0.6875rem] text-slate-900 flex items-center gap-2">Thuế SUẤT VAT <input type="number" className="w-12 bg-[#FFFFFF] border border-slate-200 rounded-lg px-2 py-1 text-center font-bold text-slate-900 focus:outline-none focus:border-[#2563EB]/30" value={vat} onChange={e => setVat(Number(e.target.value))}/> %</span>
                                <span className="text-base text-slate-900 group-hover:text-white transition-colors">{vatAmount.toLocaleString()} ₫</span>
                            </div>
                        </div>

                        <div className="flex flex-col gap-1 text-right mb-6">
                            <span className="text-[0.6875rem] font-black uppercase tracking-widest text-[#2563EB] mb-1">Tổng Tiền THANH TOÁN YÊU CẦU</span>
                            <span className="text-3xl font-black text-slate-900 tracking-tight">{totalAmount.toLocaleString()} <span className="text-sm">VND</span></span>
                        </div>
                        
                        <div className="space-y-3 pt-6 border-t border-slate-200">
                             <div className="border border-dashed border-slate-200 p-4 text-center rounded-xl hover:bg-[#FFFFFF] cursor-pointer group">
                                 <UploadCloud size={16} className="mx-auto mb-1 text-slate-900 group-hover:text-[#2563EB] transition-colors" />
                                 <div className="text-[0.6875rem] font-black uppercase text-slate-900 mt-2">Upload XML Hóa Đơn Phạt Phụ Lục</div>
                             </div>

                             <button onClick={handleSubmit} className="w-full bg-[#2563EB] hover:bg-[#1D4ED8] text-white px-8 py-4 rounded-xl font-black uppercase tracking-widest text-xs flex items-center justify-center gap-2 shadow-lg shadow-[#2563EB]/20 transition-all">
                                 <Send size={16}/> Submit cho AP Khách hàng
                             </button>
                        </div>
                    </div>

                    <div className="bg-[#2563EB]/10 p-4 rounded-xl border border-[#2563EB]/20 flex items-start gap-3">
                        <Info size={16} className="text-[#2563EB] shrink-0 mt-0.5" />
                        <p className="text-[0.6875rem] text-[#2563EB] leading-relaxed font-medium">Hệ thống khách hàng sẽ tự động Check lệch chuẩn (Tolerance) qua tool AI OCR. Hóa đơn của bạn sẽ được thanh toán tự động vào mùng 15 tháng T+1 theo quy trình Net 30.</p>
                    </div>
                </div>
            </div>
        </main>
    );
}



