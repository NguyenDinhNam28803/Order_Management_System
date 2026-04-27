"use client";

import React, { useState, useEffect } from "react";
import { FileText, Calculator, FileCheck, Search, Info, Send, UploadCloud } from "lucide-react";

import { useProcurement, PO, GRN } from "../../context/ProcurementContext";
import { useRouter } from "next/navigation";

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
        
        // Build invoice items from current PO items with grnItemId for 3-way matching
        const items = currentPO.items.map(item => {
            // Find corresponding GRN item by poItemId
            const grnItem = currentGRN?.items?.find((g: {poItemId?: string}) => g.poItemId === item.id);
            return {
                poItemId: item.id,
                grnItemId: grnItem?.id,
                description: item.description,
                qty: Number(invoiceItems[item.id]) || 0,
                unitPrice: Number(item.unitPrice ?? item.total) || 0
            };
        }).filter(item => item.qty > 0);
        
        const payload = {
            poId: currentPO.id,
            grnId: currentGRN?.id || deliverablePOs.find(p => p.id === currentPO.id)?.grn || '',
            invoiceNumber: invoiceNo,
            supplierId: currentUser?.orgId || '',
            orgId: currentPO.orgId || '',
            subtotal: subTotal,
            taxRate: vat,
            totalAmount: totalAmount,
            currency: 'VND',
            invoiceDate: new Date().toISOString().split('T')[0],
            items: items
        };
        
        createInvoice(payload);
        alert(`Đã xuất Hóa đơn ${invoiceNo} (Invoice) cho ${currentPO.id} thành công!`);
        router.push("/supplier/dashboard");
    }

    return (
        <main className="animate-in fade-in duration-500 p-6 min-h-screen bg-[#FFFFFF] text-[#000000]">
            <div className="mt-8 mb-8 border-b border-border pb-4">
                <h1 className="text-3xl font-black text-text-primary tracking-tight flex items-center gap-3">
                    Khởi tạo Hóa đơn VAT Điện tử <span className="text-[10px] font-bold text-black bg-amber-500/10 border border-amber-500/20 px-2 py-1 rounded uppercase tracking-widest ml-2">Phiếu thu & Đối soát</span>
                </h1>
                <p className="text-sm text-[#000000] mt-1">Hệ thống áp dụng 3-way Matching. NCC chỉ xuất hóa đơn cho các mặt hàng đã được kho (Buyer) xác nhận thực nhận (GRN).</p>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
                {/* Main Form Form */}
                <div className="xl:col-span-3 space-y-6">
                    <div className="bg-[#FAF8F5] rounded-2xl border border-[rgba(148,163,184,0.1)] shadow-xl shadow-[#B4533A]/5 flex items-center gap-4 p-6">
                        <label className="text-xs font-black uppercase text-[#000000] whitespace-nowrap">Chọn PO Đã Giao</label>
                        <select 
                            className="w-full md:w-1/2 bg-[#FFFFFF] border border-[rgba(148,163,184,0.1)] rounded-lg px-4 py-3 font-bold text-[#000000] focus:outline-none focus:border-[#B4533A]/30"
                            value={selectedPO}
                            onChange={(e) => setSelectedPO(e.target.value)}
                        >
                            <option value="">-- Chọn đơn đã hoàn tất nhập kho --</option>
                            {allPos.map((po, idx) => <option key={po.id} value={po.id}>Đơn hàng {idx + 1} (Kho xác nhận đủ)</option>)}
                        </select>
                        {selectedPO && <div className="text-[10px] font-black uppercase text-black tracking-widest bg-emerald-500/10 px-3 py-1.5 rounded-lg ml-auto border border-emerald-500/20">Kho Locked: {currentPO?.status === 'SHIPPED' || currentPO?.status === 'IN_PROGRESS' ? 'Yes' : 'No'}</div>}
                    </div>

                    {selectedPO ? (
                        <>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="bg-[#FAF8F5] rounded-2xl border border-[rgba(148,163,184,0.1)] shadow-xl shadow-[#B4533A]/5 p-6">
                                    <label className="block text-[10px] font-black uppercase text-[#000000] tracking-widest mb-2">Số HĐ Điện Tử VAT</label>
                                    <input type="text" className="w-full bg-[#FFFFFF] border border-[rgba(148,163,184,0.1)] rounded-lg px-4 py-3 font-bold text-[#000000] placeholder:text-[#000000] focus:outline-none focus:border-[#B4533A]/30" placeholder="VD: 0001234" value={invoiceNo} onChange={e => setInvoiceNo(e.target.value)} />
                                </div>
                                <div className="bg-[#FAF8F5] rounded-2xl border border-[rgba(148,163,184,0.1)] shadow-xl shadow-[#B4533A]/5 p-6">
                                    <label className="block text-[10px] font-black uppercase text-[#000000] tracking-widest mb-2">Ký hiệu Mẫu số</label>
                                    <input type="text" className="w-full bg-[#FFFFFF] border border-[rgba(148,163,184,0.1)] rounded-lg px-4 py-3 font-bold text-[#000000] focus:outline-none focus:border-[#B4533A]/30" defaultValue="1C26TAA" />
                                </div>
                                <div className="bg-[#FAF8F5] rounded-2xl border border-[rgba(148,163,184,0.1)] shadow-xl shadow-[#B4533A]/5 p-6">
                                    <label className="block text-[10px] font-black uppercase text-[#000000] tracking-widest mb-2">Ngày xuất (Auto)</label>
                                    <input type="date" className="w-full bg-[#FFFFFF] border border-[rgba(148,163,184,0.1)] rounded-lg px-4 py-3 font-bold text-[#000000] opacity-70 cursor-not-allowed" disabled defaultValue={new Date().toISOString().substring(0, 10)} />
                                </div>
                            </div>

                            <div className="bg-[#FAF8F5] rounded-2xl border border-[rgba(148,163,184,0.1)] shadow-xl shadow-[#B4533A]/5 !p-0 overflow-hidden">
                                <div className="p-4 border-b border-[rgba(148,163,184,0.1)] bg-[#FFFFFF] flex items-center justify-between">
                                    <h3 className="text-[10px] font-black uppercase tracking-widest text-[#000000] flex items-center gap-2">
                                        <FileCheck size={14} /> Danh sách Đối soát HĐ (Items)
                                    </h3>
                                    <p className="text-[9px] text-[#B4533A] font-bold bg-[#FFFFFF] px-2 py-1 rounded border border-[#B4533A]/20 uppercase tracking-widest">3-Way: PO - GRN - INV</p>
                                </div>
                                <div className="bg-[#FAF8F5]">
                                    <table className="erp-table text-xs m-0">
                                        <thead>
                                            <tr>
                                                <th>Sản phẩm / Diễn giải</th>
                                                <th className="text-right">Kho thực nhận</th>
                                                <th className="text-right w-32 border-l-2 border-emerald-500/20 px-4 bg-emerald-500/10 text-black">SL Lên Hóa Đơn</th>
                                                <th className="text-right w-40">Thành tiền nháp</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {currentPO?.items.map((item) => (
                                                <tr key={item.id} className="border-b border-[rgba(148,163,184,0.1)] hover:bg-[#FFFFFF] group">
                                                    <td className="font-bold text-[#000000]">{item.description}</td>
                                                    <td className="text-right">
                                                        <div className="inline-flex flex-col items-end">
                                                            <span className="font-black text-[#000000] bg-[#FFFFFF] px-2 py-0.5 rounded text-[10px] mb-1 border border-[rgba(148,163,184,0.1)]">{item.qty} {item.qty < item.qty && <span className="text-black ml-1">(! thiếu)</span>}</span>
                                                            <span className="text-[9px] text-[#000000]">@ {(item.unitPrice ?? item.total)}</span>
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
                        <div className="bg-[#FAF8F5] rounded-2xl border border-[rgba(148,163,184,0.1)] border-dashed py-32 text-center text-[#000000]">
                            <Search size={48} className="mx-auto mb-4 opacity-10" />
                            <p className="text-xs font-black uppercase tracking-widest">Chưa chọn chứng từ thanh toán</p>
                            <p className="text-[10px] mt-2 italic font-medium">Bạn chỉ được lập invoice khi có xác nhận nhập kho từ Buyer.</p>
                        </div>
                    )}
                </div>

                {/* Right Column: Tổng kết thuế & Submit */}
                <div className="space-y-6">
                    <div className={`bg-[#FAF8F5] rounded-2xl border border-[rgba(148,163,184,0.1)] shadow-xl shadow-[#B4533A]/5 transition-all ${selectedPO ? 'border-[#B4533A]/20' : 'opacity-50 grayscale pointer-events-none'}`}>
                        <h3 className="text-sm font-black uppercase tracking-widest text-[#000000] mb-6 flex items-center gap-2 border-b border-[rgba(148,163,184,0.1)] pb-4">
                            <Calculator size={16}/> Tích Toán Giá Trị
                        </h3>
                        
                        <div className="space-y-4 text-xs font-bold text-[#000000] mb-6 border-b border-[rgba(148,163,184,0.1)] pb-6">
                            <div className="flex justify-between items-center">
                                <span className="uppercase tracking-widest text-[10px] text-[#000000]">Tổng tiền TRƯỚC THUẾ</span>
                                <span className="text-base text-[#000000]">{subTotal.toLocaleString()} ₫</span>
                            </div>
                            <div className="flex justify-between items-center group">
                                <span className="uppercase tracking-widest text-[10px] text-[#000000] flex items-center gap-2">Thuế SUẤT VAT <input type="number" className="w-12 bg-[#FFFFFF] border border-[rgba(148,163,184,0.1)] rounded-lg px-2 py-1 text-center font-bold text-[#000000] focus:outline-none focus:border-[#B4533A]/30" value={vat} onChange={e => setVat(Number(e.target.value))}/> %</span>
                                <span className="text-base text-[#000000] group-hover:text-[#000000] transition-colors">{vatAmount.toLocaleString()} ₫</span>
                            </div>
                        </div>

                        <div className="flex flex-col gap-1 text-right mb-6">
                            <span className="text-[10px] font-black uppercase tracking-widest text-[#B4533A] mb-1">Tổng Tiền THANH TOÁN YÊU CẦU</span>
                            <span className="text-3xl font-black text-[#000000] tracking-tight">{totalAmount.toLocaleString()} <span className="text-sm">VND</span></span>
                        </div>
                        
                        <div className="space-y-3 pt-6 border-t border-[rgba(148,163,184,0.1)]">
                             <div className="border border-dashed border-[rgba(148,163,184,0.1)] p-4 text-center rounded-xl hover:bg-[#FFFFFF] cursor-pointer group">
                                 <UploadCloud size={16} className="mx-auto mb-1 text-[#000000] group-hover:text-[#B4533A] transition-colors" />
                                 <div className="text-[10px] font-black uppercase text-[#000000] mt-2">Upload XML Hóa Đơn Phạt Phụ Lục</div>
                             </div>

                             <button onClick={handleSubmit} className="w-full bg-[#B4533A] hover:bg-[#A85032] text-[#000000] px-8 py-4 rounded-xl font-black uppercase tracking-widest text-xs flex items-center justify-center gap-2 shadow-lg shadow-[#B4533A]/20 transition-all">
                                 <Send size={16}/> Submit cho AP Khách hàng
                             </button>
                        </div>
                    </div>

                    <div className="bg-[#B4533A]/10 p-4 rounded-xl border border-[#B4533A]/20 flex items-start gap-3">
                        <Info size={16} className="text-[#B4533A] shrink-0 mt-0.5" />
                        <p className="text-[10px] text-[#B4533A] leading-relaxed font-medium">Hệ thống khách hàng sẽ tự động Check lệch chuẩn (Tolerance) qua tool AI OCR. Hóa đơn của bạn sẽ được thanh toán tự động vào mùng 15 tháng T+1 theo quy trình Net 30.</p>
                    </div>
                </div>
            </div>
        </main>
    );
}

