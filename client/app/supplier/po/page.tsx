"use client";

import React, { useState } from "react";
import { Package, DownloadCloud, FileText, CheckCircle, AlertTriangle, Truck, Clock, RefreshCcw, Send, XCircle, Search, Eye, X } from "lucide-react";

import { useProcurement, PO, POItem } from "../../context/ProcurementContext";
import { getStatusLabel } from "../../utils/formatUtils";
import { Organization } from "../../types/api-types";

// Extended PO with API-specific fields
type ExtendedPOItem = POItem & {
    productName?: string;
    product?: { name?: string };
    quantity?: number;
    unit?: string;
    uom?: string;
    price?: number;
};

type POWithDetails = PO & {
    buyer?: Organization;
    org?: Organization;
    totalAmount?: number;
    products?: ExtendedPOItem[];
    poLines?: ExtendedPOItem[];
    lines?: ExtendedPOItem[];
};

export default function SupplierPO() {
    const [viewState, setViewState] = useState<"LIST" | "DETAIL">("LIST");
    const [poIdInput, setPoIdInput] = useState("");
    const [searchedPO, setSearchedPO] = useState<POWithDetails | null>(null);
    const [selectedPO, setSelectedPO] = useState<POWithDetails | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    
    const { currentUser, pos, allPos, ackPO, shipPO, rejectPO, notify, fetchPOById } = useProcurement();
    
    // Lọc thủ công từ global pos state
    const supplierId = currentUser?.orgId || "";
    const supplierPOs = allPos.filter((p) => p.supplierId === supplierId);
    const [showAll, setShowAll] = useState(false);
    
    // Nếu không có PO cho supplier, hiển thị tất cả PO để debug
    const displayPOs = supplierPOs.length > 0 || showAll ? supplierPOs : pos;
    
    // Lọc các PO đang active (chưa hoàn thành/hủy)
    const activePOs = supplierPOs.filter((p) => !["SHIPPED", "RECEIVED", "INVOICED", "PAID", "CANCELLED"].includes(p.status));
    
    const [selectedPoId, setSelectedPoId] = useState<string | null>(null);
    const po = selectedPoId ? activePOs.find((p) => p.id === selectedPoId) : activePOs[0];

    const isConfirmed = po?.status === "ACKNOWLEDGED" || po?.status === "CONFIRMED";
    const isRejected = po?.status === "REJECTED";
    const [progressStatus, setProgressStatus] = useState("Sản xuất loạt 1...");

    const handleCheckPO = async () => {
        if (!poIdInput.trim()) return;
        const found = pos.find(p => p.id === poIdInput || p.poNumber === poIdInput);
        if (found) {
            setSearchedPO(found);
            notify(`Tìm thấy PO`, "info");
        } else {
            // Thử fetch từ server
            const fetched = await fetchPOById(poIdInput);
            if (fetched) {
                setSearchedPO(fetched);
                notify(`Tìm thấy PO từ server`, "info");
            } else {
                setSearchedPO(null);
                notify("Không tìm thấy PO", "error");
            }
        }
    };

    const openModal = (po: PO) => {
        setSelectedPO(po);
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setSelectedPO(null);
        setIsModalOpen(false);
    };

    const handleConfirmModal = async () => {
        if(!selectedPO) return;
        await ackPO(selectedPO.id);
        notify("Đã xác nhận đơn hàng (ACK)", "success");
        closeModal();
    };

    const handleRejectModal = async () => {
        if(!selectedPO) return;
        if (!confirm("Bạn có chắc muốn từ chối PO này?")) return;
        await rejectPO(selectedPO.id);
        notify("Đã từ chối đơn hàng", "warning");
        closeModal();
    };

    const handleShipModal = async () => {
        if(!selectedPO) return;
        await shipPO(selectedPO.id);
        notify("Đã cập nhật vận đơn (ASN/DO). Hệ thống Kho Vận Buyer sẽ nhận thông báo.", "success");
        closeModal();
    };

    const handleConfirm = async () => {
        if(!po) return;
        await ackPO(po.id);
        notify("Đã xác nhận đơn hàng (ACK)", "success");
    };

    const handleReject = async () => {
        if(!po) return;
        if (!confirm("Bạn có chắc muốn từ chối PO này?")) return;
        await rejectPO(po.id);
        notify("Đã từ chối đơn hàng", "warning");
        setViewState("LIST");
    };

    const handleShip = async () => {
        if(!po) return;
        await shipPO(po.id);
        notify("Đã cập nhật vận đơn (ASN/DO). Hệ thống Kho Vận Buyer sẽ nhận thông báo.", "success");
        setViewState("LIST");
    };

    if (viewState === "DETAIL" && po) {
        return (
        <main className="animate-in fade-in duration-500 p-6 min-h-screen bg-bg-primary text-[#F8FAFC]">
                <div className="mt-8 mb-6 flex justify-between items-end">
                    <div>
                        <div className="flex items-center gap-2 mb-2 text-[10px] font-black uppercase tracking-widest text-[#64748B]">
                            PO Mới <span className="text-emerald-400 font-bold ml-1">{po.createdAt}</span>
                        </div>
                        <h1 className="text-3xl font-black text-[#F8FAFC] tracking-tight">Đơn hàng mới</h1>
                        <p className="text-sm font-bold text-[#94A3B8] mt-1">Hợp đồng mua bán từ ProcurePro</p>
                    </div>
                    {/* Action Banner (6.3 Spec) */}
                    <div className="flex gap-4 p-4 bg-[#161922] border border-[rgba(148,163,184,0.1)] rounded-2xl shadow-sm items-center">
                        {isRejected ? (
                            <div className="flex items-center gap-2 text-xs font-black uppercase text-rose-400 tracking-widest bg-rose-500/10 px-6 py-3 rounded-xl border border-rose-500/20">
                                <XCircle size={16} /> Đã Từ chối PO
                            </div>
                        ) : !isConfirmed ? (
                            <>
                                <button onClick={handleReject} className="px-6 py-3 border-2 border-rose-500/20 text-rose-400 hover:bg-rose-500/10 font-black uppercase tracking-widest text-[10px] rounded-xl transition-colors flex items-center gap-2">
                                    <XCircle size={14}/> Từ chối PO
                                </button>
                                <button onClick={handleConfirm} className="px-8 py-3 bg-emerald-500 hover:bg-emerald-400 text-white font-black uppercase tracking-widest text-xs rounded-xl flex items-center gap-2 transition-all shadow-md shadow-emerald-500/20">
                                    <CheckCircle size={16}/> Xác nhận có thể thực hiện (Ack)
                                </button>
                            </>
                        ) : (
                            <div className="flex items-center gap-2 text-xs font-black uppercase text-emerald-400 tracking-widest bg-emerald-500/10 px-6 py-3 rounded-xl border border-emerald-500/20">
                                <CheckCircle size={16} /> Đã Confirm PO
                            </div>
                        )}
                    </div>
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                    {/* Cột trái: PO Document Info */}
                    <div className="xl:col-span-2 space-y-6">
                        <div className="bg-[#161922] rounded-3xl shadow-xl shadow-[#3B82F6]/5 border border-[rgba(148,163,184,0.1)] min-h-[500px] flex flex-col p-0 overflow-hidden">
                            <div className="p-6 border-b border-[rgba(148,163,184,0.1)] flex justify-between items-center bg-[#0F1117]">
                                <h3 className="text-sm font-black uppercase tracking-widest text-[#F8FAFC] flex items-center gap-2">
                                    <FileText size={16}/> Purchase Order PDF
                                </h3>
                                <button className="text-[10px] font-black uppercase tracking-widest text-[#3B82F6] flex items-center gap-1 p-2 hover:bg-[#3B82F6]/10 rounded-lg transition-colors">
                                    <DownloadCloud size={14} /> Tải bản mốc
                                </button>
                            </div>
                            
                            <div className="p-8 font-serif bg-[#0F1117] flex-1 flex flex-col">
                                {/* Mock PDF View */}
                                <div className="bg-[#161922] mx-auto w-full max-w-2xl border border-[rgba(148,163,184,0.1)] shadow-sm p-10 mt-4 flex-1 relative">
                                    <div className="absolute top-10 right-10 p-2 border-2 border-rose-500 text-rose-500 font-bold uppercase tracking-widest -rotate-12 opacity-50">Confidential</div>
                                    <h1 className="text-3xl font-black text-[#F8FAFC] mb-6 border-b-2 border-[rgba(148,163,184,0.1)] pb-4">PURCHASE ORDER</h1>
                                    <div className="flex justify-between text-sm mb-8 text-[#94A3B8] font-sans">
                                        <div><strong className="text-[#F8FAFC]">TO:</strong> {po.vendor}<br/><strong className="text-[#F8FAFC]">ATTN:</strong> Account Manager</div>
                                        <div><strong className="text-[#F8FAFC]">DATE:</strong> {po.createdAt}</div>
                                    </div>
                                    <table className="erp-table text-xs font-sans mb-8">
                                        <thead><tr className="bg-[#0F1117]"><th className="p-2 text-left text-[#64748B]">Item</th><th className="p-2 text-center text-[#64748B]">Qty</th><th className="p-2 text-right text-[#64748B]">Price</th></tr></thead>
                                        <tbody>
                                            {po.items?.map((i) => (
                                                <tr key={i.id} className="border-b border-[rgba(148,163,184,0.1)]"><td className="p-2 text-[#F8FAFC]">{i.description || 'N/A'}</td><td className="p-2 text-center text-[#94A3B8]">{i.qty}</td><td className="p-2 text-right text-[#F8FAFC]">{(i.unitPrice || i.estimatedPrice || 0).toLocaleString()} ₫</td></tr>
                                            ))}
                                            <tr><td colSpan={2} className="p-2 text-right font-bold uppercase text-[#64748B]">Total</td><td className="p-2 text-right font-bold text-lg text-[#F8FAFC]">{Number(po.total || 0).toLocaleString()} ₫</td></tr>
                                        </tbody>
                                    </table>
                                    <div className="text-[9px] text-[#64748B] uppercase font-sans mt-20">Terms: DDP, Net 30. Penalty SLA 1%/day.</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Cột phải: Timeline Cập nhật giao hàng (6.3) */}
                    <div className="space-y-6 flex flex-col">
                        <div className="bg-[#161922] rounded-3xl p-6 border border-[rgba(148,163,184,0.1)] shadow-xl shadow-[#3B82F6]/5">
                            <h3 className="text-xs font-black uppercase tracking-widest text-[#F8FAFC] mb-4 border-b border-[rgba(148,163,184,0.1)] pb-2 flex items-center gap-2">
                                <Clock size={16}/> Timeline Tiến độ Sản xuất/Nhập hàng
                            </h3>

                            <div className="space-y-6 relative ml-2 before:absolute before:inset-0 before:ml-2 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-[#3B82F6]/20 before:to-transparent mb-6">
                                <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                                    <div className="flex items-center justify-center w-6 h-6 rounded-full border border-white bg-emerald-500 text-white shadow relative z-10 font-bold"><CheckCircle size={10} /></div>
                                    <div className="w-[calc(100%-2rem)] md:w-[calc(50%-1.5rem)] bg-[#0F1117] p-3 rounded-xl shadow-sm border border-[rgba(148,163,184,0.1)] ml-4 font-medium text-xs text-[#94A3B8]">
                                        <div className="font-bold text-[#F8FAFC] text-[10px] uppercase tracking-widest mb-1">Hôm nay 10:00</div>
                                        Đã xác nhận PO. Nguyên vật liệu đang được chuẩn bị.
                                    </div>
                                </div>
                                <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group">
                                    <div className="flex items-center justify-center w-6 h-6 rounded-full border-2 border-[#3B82F6] bg-[#161922] text-[#3B82F6] shadow relative z-10"><RefreshCcw size={10} /></div>
                                    <div className="w-[calc(100%-2rem)] md:w-[calc(50%-1.5rem)] bg-[#0F1117] p-3 rounded-xl shadow-sm border border-[rgba(148,163,184,0.1)] ml-4 font-medium text-xs text-[#94A3B8]">
                                        <div className="font-bold text-[#3B82F6] text-[10px] uppercase tracking-widest mb-1">Cập nhật tiếp theo</div>
                                        Chờ Cập nhật tiến độ thêm...
                                    </div>
                                </div>
                            </div>

                            <div className="mt-4 pt-4 border-t border-[rgba(148,163,184,0.1)] bg-[#0F1117] p-4 rounded-xl relative">
                                <label className="block text-[10px] font-black uppercase text-[#64748B] tracking-widest mb-2">Thêm Log Progress:</label>
                                <div className="flex gap-2">
                                    <input type="text" className="w-full pl-4 pr-4 py-2 bg-[#161922] border border-[rgba(148,163,184,0.1)] rounded-xl text-xs text-[#F8FAFC] placeholder:text-[#64748B] focus:outline-none focus:border-[#3B82F6]/30 focus:bg-[#1A1D23] transition-all" placeholder="Ví dụ: Lên chuyền sản xuất..." value={progressStatus} onChange={e => setProgressStatus(e.target.value)}/>
                                    <button className="bg-[#3B82F6] text-white p-2 rounded-xl hover:bg-[#2563EB] transition-colors"><Send size={16}/></button>
                                </div>
                                <p className="text-[9px] text-[#64748B] mt-2 font-medium">Buyer sẽ nhận Notification khi bạn cập nhật Status này.</p>
                            </div>
                        </div>

                        {/* Chuẩn bị Giao - Tạo Vận Đơn (6.3) */}
                        <div className={`bg-[#161922] rounded-3xl p-6 border border-[rgba(148,163,184,0.1)] shadow-xl shadow-[#3B82F6]/5 flex-1 ${!isConfirmed ? 'opacity-50 pointer-events-none filter grayscale' : 'border-[#3B82F6]/30'}`}>
                            <h3 className="text-xs font-black uppercase tracking-widest text-[#F8FAFC] mb-4 border-b border-[rgba(148,163,184,0.1)] pb-2 flex items-center gap-2">
                                <Truck size={16}/> Lệnh Giao Hàng (ASN / DO)
                            </h3>
                            <div className="space-y-4 text-xs font-medium text-[#94A3B8]">
                                <div>
                                    <label className="block text-[10px] font-black uppercase text-[#64748B] tracking-widest mb-1">Số Vận Đơn (Mã DO NCC)</label>
                                    <input type="text" className="w-full pl-4 pr-4 py-3 bg-[#0F1117] border border-[rgba(148,163,184,0.1)] rounded-xl text-[#3B82F6] font-bold placeholder:text-[#64748B] focus:outline-none focus:border-[#3B82F6]/30 focus:bg-[#161922] transition-all" placeholder="DO-2026-###"/>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black uppercase text-[#64748B] tracking-widest mb-1">Bên Vận Chuyển / Biển số Xe</label>
                                    <input type="text" className="w-full pl-4 pr-4 py-3 bg-[#0F1117] border border-[rgba(148,163,184,0.1)] rounded-xl text-[#F8FAFC] placeholder:text-[#64748B] focus:outline-none focus:border-[#3B82F6]/30 focus:bg-[#161922] transition-all" placeholder="Biển số 51C-12345"/>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black uppercase text-[#64748B] tracking-widest mb-1">Upload Packing List + Giấy kiểm xưởng (COA)</label>
                                    <div className="p-3 border border-dashed border-[rgba(148,163,184,0.1)] rounded-xl cursor-pointer text-center text-[10px] font-black uppercase text-[#64748B] hover:text-[#3B82F6] hover:border-[#3B82F6]/30 transition-all">
                                        Tải file lên
                                    </div>
                                </div>
                                <button onClick={handleShip} className="w-full mt-4 py-3 bg-[#3B82F6] hover:bg-[#2563EB] text-white shadow-xl shadow-[#3B82F6]/20 uppercase tracking-widest text-[10px] font-black rounded-xl transition-colors flex items-center gap-2 justify-center">
                                    <Truck size={14}/> Notify Shipped (Báo Giao)
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        )
    }

    return (
        <main className="pt-16 px-8 pb-12 bg-[#0F1117] min-h-screen text-[#F8FAFC]">
            <div className="mt-8 mb-4 flex justify-between items-center">
                <h1 className="text-3xl font-black text-[#F8FAFC] tracking-tight">Hợp đồng mua bán từ Buyer</h1>
                <div className="flex gap-2 items-center">
                    <span className="text-xs text-[#64748B]">Tổng PO: {pos.length} | PO của bạn: {supplierPOs.length}</span>
                    <button 
                        onClick={() => setShowAll(!showAll)} 
                        className={`text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-xl ${showAll ? 'bg-[#3B82F6] text-white' : 'bg-[#161922] text-[#94A3B8] border border-[rgba(148,163,184,0.1)]'}`}
                    >
                        {showAll ? 'Chỉ hiện PO của tôi' : 'Hiện tất cả PO'}
                    </button>
                </div>
            </div>

            {/* Debug: Kiểm tra PO theo ID */}
            <div className="mb-4 p-4 bg-[#161922] border border-[rgba(148,163,184,0.1)] rounded-xl">
                <div className="flex gap-2 items-center mb-2">
                    <Search size={16} className="text-[#64748B]" />
                    <span className="text-xs font-bold text-[#94A3B8]">Kiểm tra PO theo ID:</span>
                </div>
                <div className="flex gap-2">
                    <input 
                        type="text" 
                        value={poIdInput}
                        onChange={(e) => setPoIdInput(e.target.value)}
                        placeholder="Nhập PO ID..."
                        className="flex-1 px-3 py-2 bg-[#0F1117] border border-[rgba(148,163,184,0.1)] rounded-lg text-sm text-[#F8FAFC] placeholder:text-[#64748B] focus:outline-none focus:border-[#3B82F6]/30"
                    />
                    <button 
                        onClick={handleCheckPO}
                        className="px-4 py-2 bg-[#3B82F6] text-white text-xs font-bold uppercase rounded-lg hover:bg-[#2563EB] transition-colors"
                    >
                        Kiểm tra
                    </button>
                </div>
                {searchedPO && (
                    <div className="mt-3 p-3 bg-[#0F1117] border border-[rgba(148,163,184,0.1)] rounded-lg text-xs text-[#F8FAFC]">
                        <p><strong className="text-[#3B82F6]">PO ID:</strong> {searchedPO.id}</p>
                        <p><strong className="text-[#3B82F6]">Mã đơn:</strong> ***</p>
                        <p><strong className="text-[#3B82F6]">Status:</strong> {searchedPO.status}</p>
                        <p><strong className="text-[#3B82F6]">Supplier ID:</strong> {searchedPO.supplierId || 'N/A'}</p>
                        <p><strong className="text-[#3B82F6]">Your ID:</strong> {supplierId}</p>
                        <p><strong className="text-[#3B82F6]">Match:</strong> {(searchedPO.supplierId === supplierId) ? '✅ Có' : '❌ Không'}</p>
                    </div>
                )}
            </div>

            <div className="bg-[#161922] rounded-3xl overflow-hidden shadow-xl shadow-[#3B82F6]/5 border border-[rgba(148,163,184,0.1)]">
                <table className="erp-table text-xs w-full" style={{ tableLayout: 'fixed' }}>
                    <thead className="bg-[#0F1117] border-b border-[rgba(148,163,184,0.1)]">
                        <tr className="text-[10px] font-black uppercase tracking-widest text-[#64748B]">
                            <th className="py-4 px-4 text-left w-[18%]">Số PO</th>
                            <th className="py-4 px-4 text-left w-[35%]">Sản phẩm / Mô tả</th>
                            <th className="py-4 px-4 text-center w-[12%]">SL / Tổng tiền</th>
                            <th className="py-4 px-4 text-center w-[12%]">Ngày tạo</th>
                            <th className="py-4 px-4 text-center w-[12%]">Tình trạng</th>
                            <th className="py-4 px-4 text-right w-[11%]">Thao tác</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-[rgba(148,163,184,0.1)]">
                        {displayPOs.map((p) => {
                            const items = p.items || [];
                            const totalQty = items.reduce((sum: number, item: { qty?: number }) => sum + (item.qty || 0), 0);
                            const totalAmount = p.total || items.reduce((sum: number, item: { qty?: number; unitPrice?: number }) => sum + ((item.qty || 0) * (item.unitPrice || 0)), 0);
                            const firstItem = items[0];
                            const itemName = firstItem?.description || 'Sản phẩm';
                            const itemCode = firstItem?.id ? "***" : "N/A";
                            const moreItems = items.length > 1 ? `+${items.length - 1} sản phẩm khác` : '';

                            return (
                                <tr key={p.id} className={`hover:bg-[#0F1117]/50 transition-colors ${p.supplierId === supplierId ? 'bg-[#3B82F6]/5' : ''}`}>
                                    {/* PO Number */}
                                    <td className="py-4 px-4">
                                        <div className="font-bold text-[#F8FAFC] text-xs mb-1 truncate">
                                            Đơn hàng
                                        </div>
                                        <div className="text-[9px] font-bold text-[#64748B] uppercase tracking-wider truncate">
                                            {"ProcurePro"}
                                        </div>
                                    </td>

                                    {/* Product Info */}
                                    <td className="py-4 px-4">
                                        <div className="font-black text-[#F8FAFC] text-xs mb-1 uppercase tracking-tight truncate" title={itemName}>
                                            {itemName}
                                        </div>
                                        {itemCode && (
                                            <div className="text-[9px] font-bold text-[#64748B] uppercase tracking-widest">
                                                SKU: <span className="text-[#94A3B8]">{itemCode}</span>
                                            </div>
                                        )}
                                        {moreItems && (
                                            <div className="text-[9px] text-[#3B82F6] mt-1 font-bold">
                                                {moreItems}
                                            </div>
                                        )}
                                    </td>

                                    {/* Qty / Total */}
                                    <td className="py-4 px-4 text-center">
                                        <div className="text-xs font-bold text-[#F8FAFC]">
                                            {totalQty} <span className="text-[#64748B] font-normal">SP</span>
                                        </div>
                                        <div className="text-[10px] font-black text-emerald-400 mt-1">
                                            {new Intl.NumberFormat('vi-VN').format(totalAmount)} ₫
                                        </div>
                                    </td>

                                    {/* Date */}
                                    <td className="py-4 px-4 text-center">
                                        <div className="text-xs text-[#94A3B8]">
                                            {p.createdAt ? new Date(p.createdAt).toLocaleDateString("vi-VN") : "N/A"}
                                        </div>
                                    </td>

                                    {/* Status */}
                                    <td className="py-4 px-4 text-center">
                                        <span className={`${p.status === "ISSUED" || p.status === "PENDING" ? "bg-rose-500/10 text-rose-400 border border-rose-500/20" : p.status === "REJECTED" ? "bg-rose-500/20 text-rose-400 border border-rose-500/30" : p.status === "ACKNOWLEDGED" || p.status === "CONFIRMED" ? "bg-blue-500/10 text-blue-400 border border-blue-500/20" : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"} font-black uppercase px-2 py-1 rounded text-[9px] tracking-widest whitespace-nowrap`}>
                                            {getStatusLabel(p.status)}
                                        </span>
                                    </td>

                                    {/* Actions */}
                                    <td className="py-4 px-4 text-right">
                                        <div className="flex items-center gap-1 justify-end">
                                            {/* Quick Confirm - Only show for ISSUED/PENDING status */}
                                            {(p.status === "ISSUED" || p.status === "PENDING") && (
                                                <button
                                                    onClick={async () => {
                                                        await ackPO(p.id);
                                                        notify("Đã xác nhận đơn hàng (ACK)", "success");
                                                    }}
                                                    className="p-2 rounded-lg hover:bg-emerald-500/10 text-emerald-400 transition-colors"
                                                    title="Xác nhận PO"
                                                >
                                                    <CheckCircle size={16}/>
                                                </button>
                                            )}
                                            {/* Quick Ship - Only show for ACKNOWLEDGED/CONFIRMED status */}
                                            {(p.status === "ACKNOWLEDGED" || p.status === "CONFIRMED") && (
                                                <button
                                                    onClick={async () => {
                                                        await shipPO(p.id);
                                                        notify("Đã cập nhật vận đơn (ASN/DO)", "success");
                                                    }}
                                                    className="p-2 rounded-lg hover:bg-[#3B82F6]/10 text-[#3B82F6] transition-colors"
                                                    title="Báo giao hàng"
                                                >
                                                    <Truck size={16}/>
                                                </button>
                                            )}
                                            <button 
                                                onClick={() => openModal(p)}
                                                className="p-2 rounded-lg hover:bg-[#0F1117] text-[#64748B] transition-colors"
                                                title="Xem chi tiết"
                                            >
                                                <Eye size={16}/>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                        {displayPOs.length === 0 && (
                            <tr>
                                <td colSpan={6} className="text-center py-12 text-[#64748B] font-bold uppercase tracking-widest">
                                    Chưa có đơn hàng nào.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Modal Chi tiết PO */}
            {isModalOpen && selectedPO && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0F1117]/80 backdrop-blur-sm p-4">
                    <div className="bg-[#161922] rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto border border-[rgba(148,163,184,0.1)]">
                        {/* Header */}
                        <div className="flex justify-between items-center p-6 border-b border-[rgba(148,163,184,0.1)] bg-[#0F1117] rounded-t-2xl">
                            <div>
                                <h2 className="text-xl font-black text-[#F8FAFC] tracking-tight">Chi tiết Purchase Order</h2>
                                <p className="text-sm text-[#64748B]">Chi tiết đơn hàng</p>
                            </div>
                            <button 
                                onClick={closeModal}
                                className="p-2 hover:bg-[#1A1D23] rounded-lg transition-colors"
                            >
                                <X size={20} className="text-[#64748B]"/>
                            </button>
                        </div>

                        {/* Content */}
                        <div className="p-6 space-y-6">
                            {/* Status & Info */}
                            <div className="flex justify-between items-start">
                                <div className="space-y-2">
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm font-bold text-[#64748B]">Trạng thái:</span>
                                        <span className={`${selectedPO.status === "ISSUED" || selectedPO.status === "PENDING" ? "bg-rose-500/10 text-rose-400 border border-rose-500/20" : selectedPO.status === "REJECTED" ? "bg-rose-500/20 text-rose-400 border border-rose-500/30" : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"} font-black uppercase px-3 py-1 rounded text-xs tracking-widest`}>
                                            {getStatusLabel(selectedPO.status)}
                                        </span>
                                    </div>
                                    <p className="text-sm text-[#94A3B8]"><strong className="text-[#F8FAFC]">Ngày tạo:</strong> {selectedPO.createdAt ? new Date(selectedPO.createdAt).toLocaleDateString("vi-VN") : "N/A"}</p>
                                    <p className="text-sm text-[#94A3B8]"><strong className="text-[#F8FAFC]">Bên mua:</strong> {selectedPO.buyer?.name || selectedPO.org?.name || "ProcurePro"}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-sm font-bold text-[#64748B]">Tổng tiền:</p>
                                    <p className="text-2xl font-black text-[#F8FAFC]">{Number(selectedPO.totalAmount || selectedPO.total || 0).toLocaleString()} ₫</p>
                                </div>
                            </div>

                            {/* PO Items */}
                            <div className="border border-[rgba(148,163,184,0.1)] rounded-xl overflow-hidden">
                                <div className="bg-[#0F1117] p-4 border-b border-[rgba(148,163,184,0.1)] flex justify-between items-center">
                                    <h3 className="text-sm font-black uppercase tracking-widest text-[#F8FAFC]">Danh sách sản phẩm</h3>
                                    <span className="text-[10px] text-[#64748B]">
                                        items: {selectedPO.items?.length || 0} | products: {selectedPO.products?.length || 0} | poLines: {selectedPO.poLines?.length || 0}
                                    </span>
                                </div>
                                <table className="erp-table text-sm">
                                    <thead className="bg-[#161922]">
                                        <tr className="text-[#64748B]">
                                            <th className="p-3 text-left font-bold">Sản phẩm</th>
                                            <th className="p-3 text-center font-bold">Số lượng</th>
                                            <th className="p-3 text-center font-bold">Đơn vị</th>
                                            <th className="p-3 text-right font-bold">Đơn giá</th>
                                            <th className="p-3 text-right font-bold">Thành tiền</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-[rgba(148,163,184,0.1)]">
                                        {(() => {
                                            const items = selectedPO.items || selectedPO.products || selectedPO.poLines || selectedPO.lines || [];
                                            if (items.length === 0) {
                                                return (
                                                    <tr>
                                                        <td colSpan={5} className="p-4 text-center text-[#64748B]">
                                                            Không có dữ liệu sản phẩm
                                                            <div className="text-[10px] text-[#64748B]/50 mt-1">
                                                                Debug: items={selectedPO.items?.length}, products={selectedPO.products?.length}, poLines={selectedPO.poLines?.length}
                                                            </div>
                                                        </td>
                                                    </tr>
                                                );
                                            }
                                            return items.map((item: ExtendedPOItem, idx: number) => (
                                                <tr key={item.id || idx} className="hover:bg-[#0F1117]/30">
                                                    <td className="p-3 text-[#F8FAFC]">{item.description || item.productName || item.product?.name || "Sản phẩm"}</td>
                                                    <td className="p-3 text-center text-[#94A3B8]">{item.qty || item.quantity || 0}</td>
                                                    <td className="p-3 text-center text-[#94A3B8]">{item.unit || item.uom || "pcs"}</td>
                                                    <td className="p-3 text-right text-[#94A3B8]">{Number(item.estimatedPrice || item.unitPrice || item.price || 0).toLocaleString()} ₫</td>
                                                    <td className="p-3 text-right font-bold text-[#F8FAFC]">{Number((item.qty || item.quantity || 0) * (item.estimatedPrice || item.unitPrice || item.price || 0)).toLocaleString()} ₫</td>
                                                </tr>
                                            ));
                                        })()}
                                    </tbody>
                                </table>
                            </div>

                            {/* Notes */}
                            <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4">
                                <div className="flex items-center gap-2 text-amber-400 font-bold text-sm mb-1">
                                    <AlertTriangle size={16}/>
                                    Ghi chú quan trọng
                                </div>
                                <p className="text-sm text-amber-300/80">Vui lòng kiểm tra kỹ thông tin trước khi xác nhận. Sau khi xác nhận, PO sẽ được chuyển sang trạng thái đã Ack và bạn sẽ chịu trách nhiệm thực hiện giao hàng đúng hạn.</p>
                            </div>
                        </div>

                        {/* Footer - Action Buttons */}
                        <div className="flex justify-between items-center p-6 border-t border-[rgba(148,163,184,0.1)] bg-[#0F1117] rounded-b-2xl">
                            <button 
                                onClick={closeModal}
                                className="px-4 py-2 text-[#64748B] font-bold text-sm hover:bg-[#1A1D23] rounded-lg transition-colors"
                            >
                                Đóng
                            </button>
                            
                            <div className="flex gap-3">
                                {selectedPO.status === "REJECTED" ? (
                                    <div className="flex items-center gap-2 text-rose-400 font-bold text-sm">
                                        <XCircle size={16}/> Đã Từ chối PO
                                    </div>
                                ) : selectedPO.status === "ACKNOWLEDGED" || selectedPO.status === "CONFIRMED" ? (
                                    <>
                                        <button 
                                            onClick={handleShipModal}
                                            className="px-6 py-3 bg-[#3B82F6] hover:bg-[#2563EB] text-white font-black uppercase tracking-widest text-xs rounded-xl flex items-center gap-2 transition-all shadow-lg shadow-[#3B82F6]/20"
                                        >
                                            <Truck size={14}/> Báo Giao Hàng
                                        </button>
                                        <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm bg-emerald-500/10 px-4 py-2 rounded-lg border border-emerald-500/20">
                                            <CheckCircle size={16}/> Đã Confirm
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <button 
                                            onClick={handleRejectModal}
                                            className="px-6 py-3 border-2 border-rose-500/20 text-rose-400 hover:bg-rose-500/10 font-black uppercase tracking-widest text-xs rounded-xl transition-colors flex items-center gap-2"
                                        >
                                            <XCircle size={14}/> Từ chối
                                        </button>
                                        <button 
                                            onClick={handleConfirmModal}
                                            className="px-8 py-3 bg-emerald-500 hover:bg-emerald-400 text-white font-black uppercase tracking-widest text-xs rounded-xl flex items-center gap-2 transition-all shadow-md shadow-emerald-500/20"
                                        >
                                            <CheckCircle size={16}/> Xác nhận PO
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </main>
    );
}
