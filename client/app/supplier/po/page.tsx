"use client";

import React, { useState } from "react";
import DashboardHeader from "../../components/DashboardHeader";
import { Package, DownloadCloud, FileText, CheckCircle, AlertTriangle, Truck, Clock, RefreshCcw, Send, XCircle, Search } from "lucide-react";

import { useProcurement, PO } from "../../context/ProcurementContext";

export default function SupplierPO() {
    const [viewState, setViewState] = useState<"LIST" | "DETAIL">("LIST");
    const [poIdInput, setPoIdInput] = useState("");
    const [searchedPO, setSearchedPO] = useState<PO | null>(null);
    
    const { currentUser, pos, ackPO, shipPO, rejectPO, notify, fetchPOById } = useProcurement();
    
    // Lọc thủ công từ global pos state
    const supplierId = currentUser?.id || "";
    let supplierPOs = pos.filter((p) => (p as any).supplierId === supplierId || (p as any).supplier?.id === supplierId);
    
    // Debug: Nếu không tìm thấy PO nào, hiển thị tất cả để kiểm tra
    const [showAll, setShowAll] = useState(false);
    if (supplierPOs.length === 0 && pos.length > 0 && !showAll) {
        console.log("Không tìm thấy PO cho supplier:", supplierId);
        console.log("Tất cả PO:", pos);
        console.log("CurrentUser:", currentUser);
    }
    
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
            console.log("PO found:", found);
            notify(`Tìm thấy PO: ${found.id}`, "info");
        } else {
            // Thử fetch từ server
            const fetched = await fetchPOById(poIdInput);
            if (fetched) {
                setSearchedPO(fetched);
                console.log("PO fetched from server:", fetched);
                notify(`Tìm thấy PO từ server: ${fetched.id}`, "info");
            } else {
                setSearchedPO(null);
                notify("Không tìm thấy PO", "error");
            }
        }
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
            <main className="pt-16 px-8 pb-12 animate-in fade-in duration-300 bg-slate-50 min-h-screen">
                <DashboardHeader breadcrumbs={["Bàn làm việc B2B", "Quản lý PO", "PO Detail"]} />
                
                <div className="mt-8 mb-6 flex justify-between items-end">
                    <div>
                        <div className="flex items-center gap-2 mb-2 text-[10px] font-black uppercase tracking-widest text-slate-500">
                            PO Mới <span className="text-emerald-500 font-bold ml-1">{po.createdAt}</span>
                        </div>
                        <h1 className="text-3xl font-black text-erp-navy tracking-tight">{po.id}</h1>
                        <p className="text-sm font-bold text-slate-500 mt-1">Hợp đồng mua bán từ ProcurePro</p>
                    </div>
                    {/* Action Banner (6.3 Spec) */}
                    <div className="flex gap-4 p-4 bg-white border border-slate-200 rounded-2xl shadow-sm items-center">
                        {isRejected ? (
                            <div className="flex items-center gap-2 text-xs font-black uppercase text-red-600 tracking-widest bg-red-50 px-6 py-3 rounded-xl">
                                <XCircle size={16} /> Đã Từ chối PO
                            </div>
                        ) : !isConfirmed ? (
                            <>
                                <button onClick={handleReject} className="px-6 py-3 border-2 border-red-200 text-red-600 hover:bg-red-50 font-black uppercase tracking-widest text-[10px] rounded-xl transition-colors flex items-center gap-2">
                                    <XCircle size={14}/> Từ chối PO
                                </button>
                                <button onClick={handleConfirm} className="px-8 py-3 bg-emerald-500 hover:bg-emerald-400 text-emerald-950 font-black uppercase tracking-widest text-xs rounded-xl flex items-center gap-2 transition-all shadow-md shadow-emerald-500/20">
                                    <CheckCircle size={16}/> Xác nhận có thể thực hiện (Ack)
                                </button>
                            </>
                        ) : (
                            <div className="flex items-center gap-2 text-xs font-black uppercase text-emerald-600 tracking-widest bg-emerald-50 px-6 py-3 rounded-xl">
                                <CheckCircle size={16} /> Đã Confirm PO
                            </div>
                        )}
                    </div>
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                    {/* Cột trái: PO Document Info */}
                    <div className="xl:col-span-2 space-y-6">
                        <div className="erp-card shadow-sm border border-slate-200 bg-white min-h-[500px] flex flex-col p-0 overflow-hidden">
                            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                                <h3 className="text-sm font-black uppercase tracking-widest text-erp-navy flex items-center gap-2">
                                    <FileText size={16}/> Purchase Order PDF
                                </h3>
                                <button className="text-[10px] font-black uppercase tracking-widest text-erp-blue flex items-center gap-1 p-2 hover:bg-blue-50 rounded-lg">
                                    <DownloadCloud size={14} /> Tải bản mốc
                                </button>
                            </div>
                            
                            <div className="p-8 font-serif bg-slate-100 flex-1 flex flex-col">
                                {/* Mock PDF View */}
                                <div className="bg-white mx-auto w-full max-w-2xl border border-slate-300 shadow-sm p-10 mt-4 flex-1 relative">
                                    <div className="absolute top-10 right-10 p-2 border-2 border-red-500 text-red-500 font-bold uppercase tracking-widest -rotate-12 opacity-50">Confidential</div>
                                    <h1 className="text-3xl font-black text-slate-800 mb-6 border-b-2 border-slate-200 pb-4">PURCHASE ORDER</h1>
                                    <div className="flex justify-between text-sm mb-8 text-slate-600 font-sans">
                                        <div><strong>TO:</strong> {po.vendor}<br/><strong>ATTN:</strong> Account Manager</div>
                                        <div><strong>PO#:</strong> {po.id}<br/><strong>DATE:</strong> {po.createdAt}</div>
                                    </div>
                                    <table className="w-full text-xs font-sans mb-8">
                                        <thead><tr className="bg-slate-100"><th className="p-2 text-left">Item</th><th className="p-2 text-center">Qty</th><th className="p-2 text-right">Price</th></tr></thead>
                                        <tbody>
                                            {po.items?.map((i) => (
                                                <tr key={i.id} className="border-b"><td className="p-2">{(i as any).description || (i as any).productName}</td><td className="p-2 text-center">{i.qty}</td><td className="p-2 text-right">{((i as any).estimatedPrice || (i as any).unitPrice || 0).toLocaleString()} ₫</td></tr>
                                            ))}
                                            <tr><td colSpan={2} className="p-2 text-right font-bold uppercase">Total</td><td className="p-2 text-right font-bold text-lg">{Number((po as any).totalAmount || (po as any).total || 0).toLocaleString()} ₫</td></tr>
                                        </tbody>
                                    </table>
                                    <div className="text-[9px] text-slate-500 uppercase font-sans mt-20">Terms: DDP, Net 30. Penalty SLA 1%/day.</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Cột phải: Timeline Cập nhật giao hàng (6.3) */}
                    <div className="space-y-6 flex flex-col">
                        <div className="erp-card shadow-sm border border-slate-200">
                            <h3 className="text-xs font-black uppercase tracking-widest text-erp-navy mb-4 border-b border-slate-100 pb-2 flex items-center gap-2">
                                <Clock size={16}/> Timeline Tiến độ Sản xuất/Nhập hàng
                            </h3>

                            <div className="space-y-6 relative ml-2 before:absolute before:inset-0 before:ml-2 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-erp-navy/20 before:to-transparent mb-6">
                                <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                                    <div className="flex items-center justify-center w-6 h-6 rounded-full border border-white bg-emerald-500 text-white shadow relative z-10 font-bold"><CheckCircle size={10} /></div>
                                    <div className="w-[calc(100%-2rem)] md:w-[calc(50%-1.5rem)] bg-white p-3 rounded shadow-sm border border-slate-200 ml-4 font-medium text-xs text-slate-600">
                                        <div className="font-bold text-slate-800 text-[10px] uppercase tracking-widest mb-1">Hôm nay 10:00</div>
                                        Đã xác nhận PO. Nguyên vật liệu đang được chuẩn bị.
                                    </div>
                                </div>
                                <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group">
                                    <div className="flex items-center justify-center w-6 h-6 rounded-full border-2 border-erp-blue bg-white text-erp-blue shadow relative z-10"><RefreshCcw size={10} /></div>
                                    <div className="w-[calc(100%-2rem)] md:w-[calc(50%-1.5rem)] bg-white p-3 rounded shadow-sm border border-slate-200 ml-4 font-medium text-xs text-slate-600">
                                        <div className="font-bold text-erp-blue text-[10px] uppercase tracking-widest mb-1">Cập nhật tiếp theo</div>
                                        Chờ Cập nhật tiến độ thêm...
                                    </div>
                                </div>
                            </div>

                            <div className="mt-4 pt-4 border-t border-slate-100 bg-slate-50 p-4 rounded-xl relative">
                                <label className="block text-[10px] font-black uppercase text-slate-500 tracking-widest mb-2">Thêm Log Progress:</label>
                                <div className="flex gap-2">
                                    <input type="text" className="erp-input w-full bg-white text-xs flex-1" placeholder="Ví dụ: Lên chuyền sản xuất..." value={progressStatus} onChange={e => setProgressStatus(e.target.value)}/>
                                    <button className="bg-erp-blue text-white p-2 rounded-lg hover:bg-erp-navy transition-colors"><Send size={16}/></button>
                                </div>
                                <p className="text-[9px] text-slate-400 mt-2 font-medium">Buyer sẽ nhận Notification khi bạn cập nhật Status này.</p>
                            </div>
                        </div>

                        {/* Chuẩn bị Giao - Tạo Vận Đơn (6.3) */}
                        <div className={`erp-card shadow-sm border flex-1 ${!isConfirmed ? 'opacity-50 pointer-events-none filter grayscale' : 'border-erp-blue'}`}>
                            <h3 className="text-xs font-black uppercase tracking-widest text-erp-navy mb-4 border-b border-slate-100 pb-2 flex items-center gap-2">
                                <Truck size={16}/> Lệnh Giao Hàng (ASN / DO)
                            </h3>
                            <div className="space-y-4 text-xs font-medium text-slate-600">
                                <div>
                                    <label className="block text-[10px] font-black uppercase text-slate-500 tracking-widest mb-1">Số Vận Đơn (Mã DO NCC)</label>
                                    <input type="text" className="erp-input w-full bg-slate-50 font-mono text-erp-blue font-bold" placeholder="DO-2026-###"/>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black uppercase text-slate-500 tracking-widest mb-1">Bên Vận Chuyển / Biển số Xe</label>
                                    <input type="text" className="erp-input w-full bg-slate-50" placeholder="Biển số 51C-12345"/>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black uppercase text-slate-500 tracking-widest mb-1">Upload Packing List + Giấy kiểm xưởng (COA)</label>
                                    <div className="p-3 border border-dashed border-slate-300 rounded cursor-pointer text-center text-[10px] font-black uppercase text-slate-400 hover:text-erp-blue">
                                        Tải file lên
                                    </div>
                                </div>
                                <button onClick={handleShip} className="w-full mt-4 py-3 bg-erp-navy hover:bg-erp-blue text-white shadow-xl shadow-erp-navy/20 uppercase tracking-widest text-[10px] font-black rounded-lg transition-colors flex items-center gap-2 justify-center">
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
        <main className="pt-16 px-8 pb-12">
            <DashboardHeader breadcrumbs={["Nhà cung cấp", "Hợp đồng - Purchase Order"]} />
            <div className="mt-8 mb-4 flex justify-between items-center">
                <h1 className="text-3xl font-black text-erp-navy tracking-tight">Hợp đồng mua bán từ Buyer</h1>
                <div className="flex gap-2 items-center">
                    <span className="text-xs text-slate-500">Tổng PO: {pos.length} | PO của bạn: {supplierPOs.length}</span>
                    <button 
                        onClick={() => setShowAll(!showAll)} 
                        className={`text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded ${showAll ? 'bg-erp-blue text-white' : 'bg-slate-200 text-slate-700'}`}
                    >
                        {showAll ? 'Chỉ hiện PO của tôi' : 'Hiện tất cả PO'}
                    </button>
                </div>
            </div>

            {/* Debug: Kiểm tra PO theo ID */}
            <div className="mb-4 p-4 bg-slate-50 border border-slate-200 rounded-xl">
                <div className="flex gap-2 items-center mb-2">
                    <Search size={16} className="text-slate-500" />
                    <span className="text-xs font-bold text-slate-600">Kiểm tra PO theo ID:</span>
                </div>
                <div className="flex gap-2">
                    <input 
                        type="text" 
                        value={poIdInput}
                        onChange={(e) => setPoIdInput(e.target.value)}
                        placeholder="Nhập PO ID..."
                        className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-sm"
                    />
                    <button 
                        onClick={handleCheckPO}
                        className="px-4 py-2 bg-erp-blue text-white text-xs font-bold uppercase rounded-lg hover:bg-erp-navy"
                    >
                        Kiểm tra
                    </button>
                </div>
                {searchedPO && (
                    <div className="mt-3 p-3 bg-white border border-slate-200 rounded-lg text-xs">
                        <p><strong>PO ID:</strong> {searchedPO.id}</p>
                        <p><strong>PO Number:</strong> {searchedPO.poNumber}</p>
                        <p><strong>Status:</strong> {searchedPO.status}</p>
                        <p><strong>Supplier ID:</strong> {(searchedPO as any).supplierId || (searchedPO as any).supplier?.id || 'N/A'}</p>
                        <p><strong>Your ID:</strong> {supplierId}</p>
                        <p><strong>Match:</strong> {((searchedPO as any).supplierId === supplierId || (searchedPO as any).supplier?.id === supplierId) ? '✅ Có' : '❌ Không'}</p>
                    </div>
                )}
            </div>

            <div className="erp-card !p-0 overflow-hidden shadow-sm border border-slate-200">
                <table className="erp-table text-xs m-0">
                    <thead className="bg-slate-50">
                        <tr>
                            <th>Số PO</th>
                            <th>Bên Mua (Customer)</th>
                            <th className="text-center">Ngày tạo</th>
                            <th className="text-center">Tình trạng</th>
                            <th className="text-center">Supplier ID</th>
                            <th className="text-right">Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {displayPOs.map((p) => (
                            <tr key={p.id} className={`hover:bg-slate-50 border-b border-slate-100 cursor-pointer ${(p as any).supplierId === supplierId || (p as any).supplier?.id === supplierId ? 'bg-blue-50' : ''}`} onClick={() => { setSelectedPoId(p.id); setViewState("DETAIL"); }}>
                                <td className="font-bold text-erp-navy">{p.poNumber || p.id}</td>
                                <td className="font-bold text-slate-700">{(p as any).buyer?.name || (p as any).org?.name || "ProcurePro"}</td>
                                <td className="text-center font-mono text-slate-500">{p.createdAt ? new Date(p.createdAt).toLocaleDateString("vi-VN") : "N/A"}</td>
                                <td className="text-center">
                                    <span className={`${p.status === "ISSUED" || p.status === "PENDING" ? "bg-red-50 text-red-600 border border-red-200" : p.status === "REJECTED" ? "bg-red-100 text-red-700 border border-red-300" : "bg-emerald-50 text-emerald-600 border-none"} font-black uppercase px-2 py-1 rounded text-[9px] tracking-widest`}>
                                        {p.status === "ISSUED" || p.status === "PENDING" ? "Cần Confirm" : p.status === "REJECTED" ? "Đã Từ chối" : "Đã Ack"}
                                    </span>
                                </td>
                                <td className="text-center font-mono text-[10px] text-slate-400">{(p as any).supplierId?.substring(0, 8) || (p as any).supplier?.id?.substring(0, 8) || "N/A"}</td>
                                <td className="text-right">
                                    <button className="text-[10px] font-black uppercase tracking-widest text-erp-blue p-2 rounded hover:bg-blue-50">Xem</button>
                                </td>
                            </tr>
                        ))}
                        {displayPOs.length === 0 && (
                            <tr>
                                <td colSpan={6} className="text-center py-12 text-slate-400 font-bold uppercase tracking-widest">
                                    Chưa có đơn hàng nào.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </main>
    );
}
