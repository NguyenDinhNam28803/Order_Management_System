"use client";

import React, { useState, useEffect } from "react";
import { 
    Plus, Search, Filter, FileText, ShoppingBag, 
    ChevronRight, ArrowLeft, MoreHorizontal, 
    Edit3, Trash2, Eye, ShieldCheck, Info,
    X, Check, AlertCircle, ShoppingCart, 
    Trash, PlusCircle, MinusCircle, Clock
} from "lucide-react";
import { useProcurement, PoStatus, Organization, PR, RFQ, PO, POItem } from "../../context/ProcurementContext";

interface POMockData extends PO {
    vendorId: string;
    vendorName: string;
    prId?: string;
    rfqId?: string;
    escrowLocked?: boolean;
    supplier?: { id?: string; name?: string };
    supplierId?: string;
    totalAmount?: string | number;
}

export default function POManagementPage() {
    const { organizations, pos } = useProcurement();
    const [view, setView] = useState<"list" | "create">("list");
    const [selectedPO, setSelectedPO] = useState<POMockData | null>(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [allPOs, setAllPOs] = useState<POMockData[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const mapped = (pos || []).map((p: any) => ({
            ...p,
            vendorId: p.vendor,
            vendorName: organizations?.find((o: any) => o.id === p.vendor)?.name || 'Unknown'
        }));
        setAllPOs(mapped);
        setLoading(false);
    }, [pos, organizations]);

    const filteredPOs = allPOs.filter(po => 
        po.poNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        po.vendorName.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const getStatusColor = (status: string) => {
        switch (status) {
            case "DRAFT": return "bg-[#1A1D23] text-[#64748B] border-[rgba(148,163,184,0.1)]";
            case "ISSUED": return "bg-[#3B82F6]/10 text-[#3B82F6] border-[#3B82F6]/20";
            case "ACKNOWLEDGED": return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
            case "COMPLETED": return "bg-purple-500/10 text-purple-400 border-purple-500/20";
            case "CANCELLED": return "bg-rose-500/10 text-rose-400 border-rose-500/20";
            default: return "bg-[#1A1D23] text-[#64748B] border-[rgba(148,163,184,0.1)]";
        }
    };

    return (
        <div className="min-h-screen bg-[#0F1117]">
            <div className="p-8 max-w-[1600px] mx-auto">
                {view === "list" ? (
                    <div className="space-y-8 animate-in fade-in duration-500">
                        {loading ? (
                            <div className="p-8 text-center text-[#64748B]">Đang tải dữ liệu...</div>
                        ) : (
                            <>
                        {/* Header & Actions */}
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                            <div>
                                <h1 className="text-4xl font-black text-[#F8FAFC] tracking-tighter uppercase mb-2">DANH SÁCH ĐƠN ĐẶT HÀNG (PO)</h1>
                                <p className="text-[#64748B] font-bold text-sm tracking-tight flex items-center gap-2">
                                    <ShoppingBag size={14} className="text-[#3B82F6]" /> 
                                    Quản lý vòng đời đơn hàng từ lúc phát hành đến khi hoàn tất
                                </p>
                            </div>
                            <button 
                                onClick={() => setView("create")}
                                className="flex items-center gap-2 bg-[#3B82F6] text-white px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-2xl shadow-[#3B82F6]/20 hover:scale-105 active:scale-95 transition-all group"
                            >
                                <Plus size={18} className="transition-transform group-hover:rotate-90" /> Tạo PO mới
                            </button>
                        </div>

                        {/* Search & Filter Bar */}
                        <div className="bg-[#161922] p-6 rounded-[32px] border border-[rgba(148,163,184,0.1)] shadow-xl shadow-[#3B82F6]/5 flex flex-col lg:flex-row gap-4 items-center">
                            <div className="flex-1 relative w-full group">
                                <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-[#64748B] group-focus-within:text-[#3B82F6] transition-colors" size={20} />
                                <input 
                                    type="text" 
                                    placeholder="Tìm kiếm theo mã PO hoặc nhà cung cấp..."
                                    className="w-full pl-16 pr-8 py-5 bg-[#0F1117] rounded-2xl border border-transparent focus:border-[#3B82F6]/30 focus:bg-[#161922] transition-all outline-none text-sm font-bold text-[#F8FAFC] placeholder:text-[#64748B]"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                            <div className="flex gap-4 w-full lg:w-auto">
                                <button className="flex-1 lg:flex-none flex items-center justify-center gap-3 bg-[#161922] border border-[rgba(148,163,184,0.1)] px-8 py-5 rounded-2xl font-black text-[10px] uppercase tracking-widest text-[#94A3B8] hover:bg-[#1A1D23] transition-all">
                                    <Filter size={18} /> Bộ lọc
                                </button>
                                <button className="flex-1 lg:flex-none flex items-center justify-center gap-3 bg-[#161922] border border-[rgba(148,163,184,0.1)] px-8 py-5 rounded-2xl font-black text-[10px] uppercase tracking-widest text-[#94A3B8] hover:bg-[#1A1D23] transition-all">
                                    Xuất file
                                </button>
                            </div>
                        </div>

                        {/* PO List Table */}
                        <div className="bg-[#161922] rounded-[40px] border border-[rgba(148,163,184,0.1)] shadow-2xl shadow-[#3B82F6]/5 overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="erp-table text-xs">
                                    <thead>
                                        <tr className="bg-[#0F1117] text-[10px] uppercase font-black tracking-widest text-[#64748B] border-b border-[rgba(148,163,184,0.1)]">
                                            <th className="px-8 py-6">Mã PO</th>
                                            <th className="px-8 py-6">Nhà cung cấp</th>
                                            <th className="px-8 py-6">Liên kết PR/RFQ</th>
                                            <th className="px-8 py-6">Trạng thái</th>
                                            <th className="px-8 py-6">Tổng tiền</th>
                                            <th className="px-8 py-6">Escrow</th>
                                            <th className="px-8 py-6 text-right">Thao tác</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-[rgba(148,163,184,0.1)]">
                                        {filteredPOs.map((po) => (
                                            <tr key={po.id} className="hover:bg-[#0F1117]/50 transition-colors group">
                                                <td className="px-8 py-6">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 rounded-xl bg-[#3B82F6] border border-white/10 flex items-center justify-center text-white text-[10px] font-black group-hover:scale-110 transition-transform">
                                                            {po.poNumber.split('-').pop()}
                                                        </div>
                                                        <div className="flex flex-col">
                                                            <span className="font-black text-[#F8FAFC]">{po.poNumber}</span>
                                                            {!po.rfqId && (
                                                                <span className="text-[8px] font-black text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20 w-fit mt-1 animate-pulse">
                                                                    AUTO-GENERATED
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-8 py-6">
                                                    <div className="flex flex-col">
                                                        <span className="font-bold text-[#F8FAFC] text-sm">{po.supplier?.name || 'N/A'}</span>
                                                        <span className="text-[10px] text-[#64748B] font-bold uppercase tracking-tighter">ID: {po.supplier?.id?.substring(0, 8) || po.supplierId?.substring(0, 8) || "N/A"}...</span>
                                                    </div>
                                                </td>
                                                <td className="px-8 py-6">
                                                    <div className="flex items-center gap-4">
                                                        <span className="text-[10px] font-black text-[#64748B] bg-[#1A1D23] px-3 py-1.5 rounded-lg border border-[rgba(148,163,184,0.1)]">{po.prId}</span>
                                                        <ChevronRight className="text-[#64748B]" size={14} />
                                                        <span className="text-[10px] font-black text-[#3B82F6] bg-[#3B82F6]/10 px-3 py-1.5 rounded-lg border border-[#3B82F6]/20">{po.rfqId}</span>
                                                    </div>
                                                </td>
                                                <td className="px-8 py-6">
                                                    <span className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border ${getStatusColor(po.status)} transition-all`}>
                                                        {po.status}
                                                    </span>
                                                </td>
                                                <td className="px-8 py-6">
                                                    <span className="font-black text-[#F8FAFC] text-base">{Number(po.totalAmount || po.total || 0).toLocaleString()} ₫</span>
                                                </td>
                                                <td className="px-8 py-6">
                                                    <div className="flex items-center gap-2 group/escrow cursor-help relative">
                                                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${po.escrowLocked ? 'bg-amber-500/10 text-amber-400' : 'bg-[#1A1D23] text-[#64748B]'}`}>
                                                            {po.escrowLocked ? <ShieldCheck size={18} /> : <Info size={16} />}
                                                        </div>
                                                        <span className={`text-[10px] font-black uppercase ${po.escrowLocked ? 'text-amber-400' : 'text-[#64748B]'}`}>
                                                            {po.escrowLocked ? 'LOCKED' : 'NO'}
                                                        </span>
                                                        {po.escrowLocked && (
                                                            <div className="absolute opacity-0 group-hover/escrow:opacity-100 bg-[#161922] text-[#F8FAFC] text-[9px] p-3 rounded-xl w-48 shadow-xl pointer-events-none transition-all -translate-y-12 border border-[rgba(148,163,184,0.1)] z-50">
                                                                Tiền đã được giữ trong Escrow. Chỉ giải ngân sau khi nhận hàng.
                                                            </div>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-8 py-6 text-right">
                                                    <div className="flex justify-end gap-2">
                                                        <button 
                                                            onClick={() => setSelectedPO(po)}
                                                            className="p-3 text-[#64748B] hover:text-[#3B82F6] hover:bg-[#3B82F6]/10 rounded-xl transition-all"
                                                            title="Xem chi tiết"
                                                        >
                                                            <Eye size={18} />
                                                        </button>
                                                        <button className="p-3 text-[#64748B] hover:text-[#3B82F6] hover:bg-[#3B82F6]/10 rounded-xl transition-all" title="Sửa PO">
                                                            <Edit3 size={18} />
                                                        </button>
                                                        <button className="p-3 text-[#64748B] hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition-all" title="Hủy PO">
                                                            <Trash2 size={18} />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                        </>
                        )}
                    </div>
                ) : (
                    <POForm onCancel={() => setView("list")} prs={[]} rfqs={[]} organizations={organizations || []} />
                )}
            </div>

            {/* PO Detail Drawer */}
            {selectedPO && (
                <PODetailDrawer po={selectedPO} onClose={() => setSelectedPO(null)} />
            )}
        </div>
    );
}

// --- PO Form Component ---
function POForm({ onCancel, prs, rfqs, organizations }: { 
    onCancel: () => void, 
    prs: PR[], rfqs: RFQ[], organizations: Organization[] 
}) {
    const [formData, setFormData] = useState({
        prId: "",
        rfqId: "",
        vendorId: "",
        title: "",
        escrowLocked: false,
        items: [{ id: "new-1", productName: "", qty: 1, unitPrice: 0, total: 0 }]
    });

    const selectedVendor = organizations.find((o: Organization) => o.id === formData.vendorId);
    const filteredRFQs = rfqs.filter((r: RFQ) => r.prId === formData.prId);

    const handleAddItem = () => {
        setFormData({
            ...formData,
            items: [...formData.items, { id: `new-${Date.now()}`, productName: "", qty: 1, unitPrice: 0, total: 0 }]
        });
    };

    const handleRemoveItem = (idx: number) => {
        const newItems = [...formData.items];
        newItems.splice(idx, 1);
        setFormData({ ...formData, items: newItems });
    };

    const handleUpdateItem = (idx: number, field: string, value: string | number) => {
        const newItems = [...formData.items];
        const item = { ...newItems[idx], [field]: value };
        if (field === "qty" || field === "unitPrice") {
            item.total = (item.qty || 0) * (item.unitPrice || 0);
        }
        newItems[idx] = item;
        setFormData({ ...formData, items: newItems });
    };

    const totalAmount = formData.items.reduce((sum, item) => sum + item.total, 0);

    const handleSave = (status: PoStatus) => {
        if (!formData.vendorId || !formData.prId) {
            console.warn("Vui lòng nhập đầy đủ thông tin bắt buộc");
            return;
        }
        console.log(`Đã ${status === 'DRAFT' ? 'lưu nháp' : 'phát hành'} PO thành công`);
        onCancel();
    };

    return (
        <div className="space-y-8 animate-in slide-in-from-bottom-8 duration-500 max-w-5xl mx-auto">
            <div className="flex items-center justify-between">
                <button onClick={onCancel} className="flex items-center gap-2 text-[#64748B] hover:text-[#F8FAFC] font-black text-[10px] uppercase tracking-widest transition-all">
                    <ArrowLeft size={16} /> Quay lại danh sách
                </button>
                <div className="flex items-center gap-4">
                    <button onClick={() => handleSave('DRAFT' as PoStatus)} className="px-8 py-4 bg-[#161922] border border-[rgba(148,163,184,0.1)] text-[#94A3B8] rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-[#1A1D23] transition-all">
                        Lưu nháp
                    </button>
                    <button onClick={() => handleSave('ISSUED' as PoStatus)} className="px-10 py-5 bg-[#3B82F6] text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-2xl shadow-[#3B82F6]/20 hover:scale-105 active:scale-95 transition-all">
                        Phát hành PO
                    </button>
                </div>
            </div>

            <div className="bg-[#161922] rounded-[40px] border border-[rgba(148,163,184,0.1)] shadow-2xl shadow-[#3B82F6]/5 overflow-hidden">
                <div className="p-10 border-b border-[rgba(148,163,184,0.1)] bg-[#0F1117]">
                    <h2 className="text-2xl font-black text-[#F8FAFC] uppercase">TẠO ĐƠN ĐẶT HÀNG MỚI</h2>
                    <p className="text-[#64748B] font-bold text-xs uppercase tracking-widest mt-1">Vui lòng nhập thông tin chi tiết để phát hành đơn hàng</p>
                </div>

                <div className="p-10 space-y-12">
                    {/* General Info */}
                    <div className="grid md:grid-cols-2 gap-10">
                        <div className="space-y-3">
                            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-[#64748B] ml-1">Chọn yêu cầu PR liên kết *</label>
                            <select 
                                className="w-full bg-[#0F1117] border border-[rgba(148,163,184,0.1)] rounded-2xl px-6 py-5 outline-none focus:bg-[#161922] focus:border-[#3B82F6] transition-all font-bold text-[#F8FAFC]"
                                value={formData.prId}
                                onChange={(e) => setFormData({ ...formData, prId: e.target.value })}
                            >
                                <option value="">-- Chọn PR --</option>
                                <option value="PR-2026-003">PR-2026-003 (Thiết bị IT định kỳ)</option>
                                <option value="PR-2026-004">PR-2026-004 (Vật tư văn phòng)</option>
                                {prs.filter((p: PR) => p.status === 'APPROVED').map((p: PR) => (
                                    <option key={p.id} value={p.prNumber}>{p.prNumber} - {p.title}</option>
                                ))}
                            </select>
                        </div>
                        <div className="space-y-3">
                            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-[#64748B] ml-1">Chọn Báo giá/RFQ liên kết</label>
                            <select 
                                className="w-full bg-[#0F1117] border border-[rgba(148,163,184,0.1)] rounded-2xl px-6 py-5 outline-none focus:bg-[#161922] focus:border-[#3B82F6] transition-all font-bold text-[#F8FAFC] disabled:opacity-50"
                                value={formData.rfqId}
                                disabled={!formData.prId}
                                onChange={(e) => setFormData({ ...formData, rfqId: e.target.value })}
                            >
                                <option value="">-- Chọn RFQ --</option>
                                {filteredRFQs.map((r: RFQ) => (
                                    <option key={r.id} value={r.rfqNumber}>{r.rfqNumber} ({r.title})</option>
                                ))}
                            </select>
                        </div>
                        <div className="space-y-3">
                            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-[#64748B] ml-1">Nhà cung cấp *</label>
                            <select 
                                className="w-full bg-[#0F1117] border border-[rgba(148,163,184,0.1)] rounded-2xl px-6 py-5 outline-none focus:bg-[#161922] focus:border-[#3B82F6] transition-all font-bold text-[#F8FAFC]"
                                value={formData.vendorId}
                                onChange={(e) => setFormData({ ...formData, vendorId: e.target.value })}
                            >
                                <option value="">-- Chọn NCC --</option>
                                <option value="v-1">Hanoi Hardware</option>
                                <option value="6c7f4a14-9238-419c-ba0f-fa8da8eb0253">ABC Supplier</option>
                                <option value="v-3">Saigon Tech</option>
                                {organizations.filter((o: Organization) => o.companyType === 'SUPPLIER').map((o: Organization) => (
                                    <option key={o.id} value={o.id}>{o.name}</option>
                                ))}
                            </select>
                        </div>
                        <div className="flex items-center gap-4 h-full pt-8">
                            <div 
                                onClick={() => setFormData({ ...formData, escrowLocked: !formData.escrowLocked })}
                                className={`w-14 h-8 rounded-full p-1 cursor-pointer transition-all ${formData.escrowLocked ? 'bg-amber-500' : 'bg-[#1A1D23]'}`}
                            >
                                <div className={`w-6 h-6 bg-white rounded-full transition-transform ${formData.escrowLocked ? 'translate-x-6' : 'translate-x-0'}`}></div>
                            </div>
                            <div className="space-y-0.5 group relative cursor-help">
                                <p className="text-[10px] font-black uppercase tracking-widest text-[#F8FAFC]">Khóa Escrow</p>
                                <p className="text-[9px] font-bold text-[#64748B]">Giữ tiền của đơn hàng cho đến khi nhận hàng</p>
                                <div className="absolute bottom-full left-0 opacity-0 group-hover:opacity-100 bg-[#161922] text-white text-[9px] p-2 rounded-lg w-48 mb-2 transition-all border border-[rgba(148,163,184,0.1)]">
                                    Thanh toán chỉ giải ngân khi Goods Receipt được ký duyệt.
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Items Section */}
                    <div className="space-y-6">
                        <div className="flex justify-between items-center bg-[#0F1117] p-6 rounded-2xl border border-[rgba(148,163,184,0.1)]">
                            <h3 className="text-sm font-black text-[#F8FAFC] uppercase">DANH SÁCH MẶT HÀNG TRÊN PO</h3>
                            <button 
                                onClick={handleAddItem}
                                className="text-[10px] font-black uppercase text-[#3B82F6] flex items-center gap-2 hover:bg-[#3B82F6]/10 px-4 py-2 rounded-xl transition-all"
                            >
                                <PlusCircle size={16} /> Thêm mặt hàng
                            </button>
                        </div>

                        <div className="space-y-4">
                            {formData.items.map((item, idx) => (
                                <div key={item.id} className="grid grid-cols-12 gap-4 items-end bg-[#161922] p-4 rounded-3xl border border-[rgba(148,163,184,0.1)] group animate-in slide-in-from-left-4 duration-300">
                                    <div className="col-span-12 lg:col-span-5 space-y-2">
                                        <label className="text-[9px] font-black uppercase text-[#64748B] tracking-widest ml-1">Tên sản phẩm *</label>
                                        <input 
                                            type="text" 
                                            placeholder="Nhập tên SP..."
                                            className="w-full bg-[#0F1117] border border-transparent rounded-xl px-5 py-4 text-xs font-bold text-[#F8FAFC] outline-none focus:bg-[#161922] focus:border-[#3B82F6]/20 transition-all"
                                            value={item.productName}
                                            onChange={(e) => handleUpdateItem(idx, "productName", e.target.value)}
                                        />
                                    </div>
                                    <div className="col-span-4 lg:col-span-2 space-y-2">
                                        <label className="text-[9px] font-black uppercase text-[#64748B] tracking-widest ml-1">Số lượng</label>
                                        <input 
                                            type="number" 
                                            className="w-full bg-[#0F1117] border border-transparent rounded-xl px-5 py-4 text-xs font-bold text-[#F8FAFC] outline-none focus:bg-[#161922] focus:border-[#3B82F6]/20 transition-all"
                                            value={item.qty}
                                            onChange={(e) => handleUpdateItem(idx, "qty", parseInt(e.target.value) || 0)}
                                        />
                                    </div>
                                    <div className="col-span-4 lg:col-span-2 space-y-2">
                                        <label className="text-[9px] font-black uppercase text-[#64748B] tracking-widest ml-1">Đơn giá</label>
                                        <input 
                                            type="number" 
                                            className="w-full bg-[#0F1117] border border-transparent rounded-xl px-5 py-4 text-xs font-bold text-[#F8FAFC] outline-none focus:bg-[#161922] focus:border-[#3B82F6]/20 transition-all"
                                            value={item.unitPrice}
                                            onChange={(e) => handleUpdateItem(idx, "unitPrice", parseInt(e.target.value) || 0)}
                                        />
                                    </div>
                                    <div className="col-span-4 lg:col-span-2 space-y-2">
                                        <label className="text-[9px] font-black uppercase text-[#64748B] tracking-widest ml-1">Thành tiền</label>
                                        <div className="w-full bg-[#3B82F6]/10 rounded-xl px-5 py-4 text-xs font-black text-[#3B82F6] flex items-center justify-end">
                                            {item.total.toLocaleString()} ₫
                                        </div>
                                    </div>
                                    <div className="col-span-12 lg:col-span-1 flex justify-center pb-2">
                                        <button 
                                            onClick={() => handleRemoveItem(idx)}
                                            className="p-2 text-[#64748B] hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition-all"
                                            disabled={formData.items.length <= 1}
                                        >
                                            <MinusCircle size={20} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Summary Footer */}
                    <div className="pt-10 border-t border-[rgba(148,163,184,0.1)] flex flex-col md:flex-row justify-between items-center gap-8">
                        <div className="flex items-center gap-6 text-[#64748B]">
                             <div className="flex items-center gap-2">
                                 <AlertCircle size={16} />
                                 <span className="text-[10px] font-bold uppercase tracking-widest">Vui lòng rà soát kỹ các điều khoản PO</span>
                             </div>
                        </div>
                        <div className="bg-[#3B82F6] px-12 py-8 rounded-[32px] text-white shadow-2xl shadow-[#3B82F6]/20 relative overflow-hidden group">
                             <div className="absolute -right-6 -bottom-6 opacity-10 rotate-12 transition-transform group-hover:scale-125 duration-700">
                                 <ShoppingCart size={100} />
                             </div>
                             <div className="relative z-10 text-right">
                                 <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-50 mb-2">TỔNG CỘNG ĐƠN HÀNG</p>
                                 <p className="text-4xl font-black tracking-tighter">{totalAmount.toLocaleString()} <span className="text-xl">₫</span></p>
                             </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

// --- PO Detail Drawer ---
function PODetailDrawer({ po, onClose }: { po: POMockData, onClose: () => void }) {
    const getStatusColor = (status: string) => {
        switch (status) {
            case "DRAFT": return "bg-[#1A1D23] text-[#64748B]";
            case "ISSUED": return "bg-[#3B82F6] text-white shadow-lg shadow-[#3B82F6]/20";
            case "ACKNOWLEDGED": return "bg-emerald-500 text-white shadow-lg shadow-emerald-500/20";
            default: return "bg-[#1A1D23] text-[#64748B]";
        }
    };

    return (
        <div className="fixed inset-0 z-50 overflow-hidden">
            <div className="absolute inset-0 bg-[#0F1117]/60 backdrop-blur-sm animate-in fade-in duration-300" onClick={onClose}></div>
            <div className="absolute inset-y-0 right-0 w-full max-w-xl bg-[#161922] shadow-2xl flex flex-col animate-in slide-in-from-right duration-500 border-l border-[rgba(148,163,184,0.1)]">
                {/* Drawer Header */}
                <div className="p-8 border-b border-[rgba(148,163,184,0.1)] flex items-center justify-between bg-[#0F1117]">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-[#3B82F6] flex items-center justify-center text-white">
                            <ShoppingCart size={24} />
                        </div>
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <h3 className="text-lg font-black text-[#F8FAFC] uppercase">{po.poNumber}</h3>
                                <span className={`px-3 py-1 rounded-lg text-[8px] font-black uppercase tracking-[0.2em] ${getStatusColor(po.status)}`}>
                                    {po.status}
                                </span>
                            </div>
                            <p className="text-[10px] font-bold text-[#64748B] uppercase tracking-widest leading-none">Phát hành lúc: {po.createdAt ? new Date(po.createdAt).toLocaleString() : "N/A"}</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-[#1A1D23] rounded-full transition-all text-[#64748B]">
                        <X size={24} />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-8 space-y-10 custom-scrollbar">
                    {/* Vendor Section */}
                    <div className="bg-[#0F1117] rounded-3xl p-6 border border-[rgba(148,163,184,0.1)] relative overflow-hidden group">
                        <div className="absolute -right-8 -bottom-8 opacity-5 text-[#3B82F6] group-hover:scale-110 transition-transform duration-700 rotate-12">
                            <Building size={120} />
                        </div>
                        <h4 className="text-[10px] font-black uppercase tracking-widest text-[#64748B] mb-4 flex items-center gap-2">
                             <div className="w-1 h-3 bg-[#3B82F6] rounded-full"></div> NHÀ CUNG CẤP
                        </h4>
                        <div className="relative z-10">
                            <div className="text-xl font-black text-[#F8FAFC] mb-1">{po.supplier?.name || 'N/A'}</div>
                            <div className="text-xs font-bold text-[#64748B]">ID: {po.supplier?.id?.substring(0, 8) || po.supplierId?.substring(0, 8)}</div>
                        </div>
                    </div>

                    {/* Linked Info */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-[#3B82F6]/10 p-4 rounded-2xl border border-[#3B82F6]/20">
                            <p className="text-[9px] font-black text-[#3B82F6] uppercase mb-1">YÊU CẦU PR</p>
                            <p className="font-black text-[#F8FAFC] text-sm">{po.prId}</p>
                        </div>
                        <div className="bg-[#8B5CF6]/10 p-4 rounded-2xl border border-[#8B5CF6]/20">
                            <p className="text-[9px] font-black text-[#8B5CF6] uppercase mb-1">BẢN CHÀO RFQ</p>
                            <p className="font-black text-[#F8FAFC] text-sm">{po.rfqId}</p>
                        </div>
                    </div>

                    {/* Items Table */}
                    <div className="space-y-4">
                        <h4 className="text-[10px] font-black uppercase tracking-widest text-[#64748B] flex items-center gap-2">
                             <div className="w-1 h-3 bg-emerald-500 rounded-full"></div> CHI TIẾT HẠNG MỤC
                        </h4>
                        {po.items && po.items.length > 0 ? (
                            <div className="bg-[#161922] rounded-3xl border border-[rgba(148,163,184,0.1)] overflow-hidden shadow-sm">
                                <table className="erp-table text-xs">
                                    <thead className="bg-[#0F1117] border-b border-[rgba(148,163,184,0.1)]">
                                        <tr className="font-black text-[#64748B] uppercase tracking-tighter">
                                            <th className="px-5 py-4">Mô tả</th>
                                            <th className="px-5 py-4 text-center">SL</th>
                                            <th className="px-5 py-4 text-right">Đơn giá</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-[rgba(148,163,184,0.1)]">
                                        {po.items.map((item: POItem) => (
                                            <tr key={item.id} className="hover:bg-[#0F1117]/50 transition-colors">
                                                <td className="px-5 py-4 font-bold text-[#F8FAFC]">{item.description}</td>
                                                <td className="px-5 py-4 text-center font-black text-[#64748B]">{item.qty}</td>
                                                <td className="px-5 py-4 text-right font-black text-[#94A3B8]">{item.estimatedPrice?.toLocaleString() || 0} ₫</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <div className="bg-[#0F1117] rounded-2xl p-6 border border-[rgba(148,163,184,0.1)] text-center">
                                <p className="text-sm text-[#64748B]">Không có chi tiết hạng mục</p>
                                <p className="text-xs text-[#64748B]/50 mt-1">PO được tạo tự động từ RFQ</p>
                            </div>
                        )}
                    </div>

                    {/* Escrow Status */}
                    <div className={`p-6 rounded-3xl border flex items-center justify-between ${po.escrowLocked ? 'bg-amber-500/10 border-amber-500/20 text-amber-400' : 'bg-[#0F1117] border-[rgba(148,163,184,0.1)] text-[#64748B]'}`}>
                        <div className="flex items-center gap-4">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${po.escrowLocked ? 'bg-amber-500 text-white' : 'bg-[#1A1D23] text-[#64748B]'}`}>
                                <ShieldCheck size={20} />
                            </div>
                            <div>
                                <p className="text-[10px] font-black uppercase tracking-widest leading-none mb-1">Trạng thái Escrow</p>
                                <p className="text-xs font-bold">{po.escrowLocked ? 'Đã khóa ngân sách (Locked)' : 'Không sử dụng Escrow'}</p>
                            </div>
                        </div>
                        {po.escrowLocked && <AlertCircle size={18} className="animate-pulse" />}
                    </div>
                </div>

                {/* Footer Drawer */}
                <div className="p-8 border-t border-[rgba(148,163,184,0.1)] bg-[#0F1117] flex flex-col gap-6">
                    <div className="flex justify-between items-center">
                        <span className="text-xs font-black text-[#64748B] uppercase tracking-widest">TỔNG THANH TOÁN:</span>
                        <span className="text-3xl font-black text-[#3B82F6] tracking-tighter">{Number(po.totalAmount || po.total).toLocaleString()} ₫</span>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <button className="py-4 border border-[rgba(148,163,184,0.1)] text-[#94A3B8] rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-[#161922] transition-all">Gửi lại thông báo</button>
                        <button className="py-4 bg-[#3B82F6] text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-[#2563EB] transition-all shadow-xl shadow-[#3B82F6]/10">In Đơn hàng</button>
                    </div>
                </div>
            </div>
        </div>
    );
}

function Building({ size, className }: { size: number, className?: string }) {
    return <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="2" width="16" height="20" rx="2" ry="2"></rect><path d="M9 22v-4h6v4"></path><path d="M8 6h.01"></path><path d="M16 6h.01"></path><path d="M8 10h.01"></path><path d="M16 10h.01"></path><path d="M8 14h.01"></path><path d="M16 14h.01"></path><path d="M8 18h.01"></path><path d="M16 18h.01"></path></svg>;
}
