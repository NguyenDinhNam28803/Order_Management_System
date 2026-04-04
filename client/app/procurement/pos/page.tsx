"use client";

import React, { useState, useMemo } from "react";
import { 
    Plus, Search, Filter, FileText, ShoppingBag, 
    ChevronRight, ArrowLeft, MoreHorizontal, 
    Edit3, Trash2, Eye, ShieldCheck, Info,
    X, Check, AlertCircle, ShoppingCart, 
    Trash, PlusCircle, MinusCircle, Clock
} from "lucide-react";
import DashboardHeader from "../../components/DashboardHeader";
import { useProcurement, PoStatus, Organization, PR, RFQ, PO } from "../../context/ProcurementContext";

// --- Mock Data ---
interface POMockData extends PO {
    vendorId: string;
    vendorName: string;
    prId: string;
    rfqId: string;
    escrowLocked: boolean;
}

const mockPOs: POMockData[] = [
    { 
        id: "po-1", 
        poNumber: "PO-2026-001", 
        vendorName: "Hanoi Hardware", 
        vendor: "v-1",
        vendorId: "v-1",
        prId: "PR-2026-003", 
        rfqId: "RFQ-2026-101",
        status: "ISSUED" as PoStatus, 
        total: 1200000000, 
        escrowLocked: true, 
        createdAt: "2026-04-01T10:00:00Z",
        items: [
            { id: "it-1", description: "Server Dell PowerEdge R750", qty: 2, estimatedPrice: 500000000 },
            { id: "it-2", description: "Ổ cứng SSD 1.92TB SAS", qty: 4, estimatedPrice: 50000000 }
        ]
    },
    { 
        id: "po-2", 
        poNumber: "PO-2026-002", 
        vendorName: "ABC Supplier", 
        vendor: "6c7f4a14-9238-419c-ba0f-fa8da8eb0253",
        vendorId: "6c7f4a14-9238-419c-ba0f-fa8da8eb0253",
        prId: "PR-2026-004", 
        rfqId: "RFQ-2026-102",
        status: "DRAFT" as PoStatus, 
        total: 85000000, 
        escrowLocked: false, 
        createdAt: "2026-04-02T14:30:00Z",
        items: [
            { id: "it-3", description: "Laptop ThinkPad X1 Carbon Gen 11", qty: 2, estimatedPrice: 42500000 }
        ]
    }
];

export default function POManagementPage() {
    const { organizations, prs, rfqs, pos: contextPOs, notify } = useProcurement();
    const [view, setView] = useState<"list" | "create">("list");
    const [selectedPO, setSelectedPO] = useState<POMockData | null>(null);
    const [searchTerm, setSearchTerm] = useState("");

    // Combine mock and context POs
    const allPOs = useMemo(() => {
        const mappedContextPOs = (contextPOs || []).map(p => {
            const org = organizations?.find(o => o.id === p.vendor);
            return { 
                ...p, 
                vendorId: p.vendor,
                vendorName: org?.name || p.vendor || "Unknown Vendor",
                prId: (p as any).prId || "PR-SIM",
                rfqId: (p as any).rfqId || "RFQ-SIM",
                escrowLocked: (p as any).escrowLocked || false,
                items: p.items || []
            } as POMockData;
        });
        return [...mockPOs, ...mappedContextPOs];
    }, [contextPOs, organizations]);

    const filteredPOs = allPOs.filter(po => 
        po.poNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        po.vendorName.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const getStatusColor = (status: string) => {
        switch (status) {
            case "DRAFT": return "bg-slate-100 text-slate-500 border-slate-200";
            case "ISSUED": return "bg-blue-100 text-blue-600 border-blue-200";
            case "ACKNOWLEDGED": return "bg-emerald-100 text-emerald-600 border-emerald-200";
            case "COMPLETED": return "bg-purple-100 text-purple-600 border-purple-200";
            case "CANCELLED": return "bg-rose-100 text-rose-600 border-rose-200";
            default: return "bg-slate-100 text-slate-500 border-slate-200";
        }
    };

    return (
        <div className="min-h-screen bg-slate-50/30">
            <DashboardHeader breadcrumbs={["Quản lý Đơn hàng", "Đơn đặt hàng (PO)"]} />

            <div className="p-8 max-w-[1600px] mx-auto">
                {view === "list" ? (
                    <div className="space-y-8 animate-in fade-in duration-500">
                        {/* Header & Actions */}
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                            <div>
                                <h1 className="text-4xl font-black text-erp-navy tracking-tighter uppercase mb-2">DANH SÁCH ĐƠN ĐẶT HÀNG (PO)</h1>
                                <p className="text-slate-400 font-bold text-sm tracking-tight flex items-center gap-2">
                                    <ShoppingBag size={14} className="text-erp-blue" /> 
                                    Quản lý vòng đời đơn hàng từ lúc phát hành đến khi hoàn tất
                                </p>
                            </div>
                            <button 
                                onClick={() => setView("create")}
                                className="flex items-center gap-2 bg-erp-navy text-white px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-2xl shadow-erp-navy/20 hover:scale-105 active:scale-95 transition-all group"
                            >
                                <Plus size={18} className="transition-transform group-hover:rotate-90" /> Tạo PO mới
                            </button>
                        </div>

                        {/* Search & Filter Bar */}
                        <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-xl shadow-erp-navy/5 flex flex-col lg:flex-row gap-4 items-center">
                            <div className="flex-1 relative w-full group">
                                <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-erp-blue transition-colors" size={20} />
                                <input 
                                    type="text" 
                                    placeholder="Tìm kiếm theo mã PO hoặc nhà cung cấp..."
                                    className="w-full pl-16 pr-8 py-5 bg-slate-50 rounded-2xl border border-transparent focus:border-erp-blue/30 focus:bg-white transition-all outline-none text-sm font-bold text-erp-navy placeholder:text-slate-300"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                            <div className="flex gap-4 w-full lg:w-auto">
                                <button className="flex-1 lg:flex-none flex items-center justify-center gap-3 bg-white border border-slate-100 px-8 py-5 rounded-2xl font-black text-[10px] uppercase tracking-widest text-slate-500 hover:bg-slate-50 transition-all">
                                    <Filter size={18} /> Bộ lọc
                                </button>
                                <button className="flex-1 lg:flex-none flex items-center justify-center gap-3 bg-white border border-slate-100 px-8 py-5 rounded-2xl font-black text-[10px] uppercase tracking-widest text-slate-500 hover:bg-slate-50 transition-all">
                                    Xuất file
                                </button>
                            </div>
                        </div>

                        {/* PO List Table */}
                        <div className="bg-white rounded-[40px] border border-slate-100 shadow-2xl shadow-erp-navy/5 overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-slate-50 text-[10px] uppercase font-black tracking-widest text-slate-400 border-b border-slate-100">
                                            <th className="px-8 py-6">Mã PO</th>
                                            <th className="px-8 py-6">Nhà cung cấp</th>
                                            <th className="px-8 py-6">Liên kết PR/RFQ</th>
                                            <th className="px-8 py-6">Trạng thái</th>
                                            <th className="px-8 py-6">Tổng tiền</th>
                                            <th className="px-8 py-6">Escrow</th>
                                            <th className="px-8 py-6 text-right">Thao tác</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50">
                                        {filteredPOs.map((po) => (
                                            <tr key={po.id} className="hover:bg-slate-50 transition-colors group">
                                                <td className="px-8 py-6">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 rounded-xl bg-erp-navy border border-white/10 flex items-center justify-center text-white text-[10px] font-black group-hover:scale-110 transition-transform">
                                                            {po.poNumber.split('-').pop()}
                                                        </div>
                                                        <span className="font-black text-erp-navy">{po.poNumber}</span>
                                                    </div>
                                                </td>
                                                <td className="px-8 py-6">
                                                    <div className="flex flex-col">
                                                        <span className="font-bold text-slate-700 text-sm">{po.vendorName}</span>
                                                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">ID: {po.vendorId ? po.vendorId.substring(0, 8) : "N/A"}...</span>
                                                    </div>
                                                </td>
                                                <td className="px-8 py-6">
                                                    <div className="flex items-center gap-4">
                                                        <span className="text-[10px] font-black text-slate-500 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200">{po.prId}</span>
                                                        <ChevronRight className="text-slate-300" size={14} />
                                                        <span className="text-[10px] font-black text-erp-blue bg-erp-blue/5 px-3 py-1.5 rounded-lg border border-erp-blue/10">{po.rfqId}</span>
                                                    </div>
                                                </td>
                                                <td className="px-8 py-6">
                                                    <span className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border ${getStatusColor(po.status)} transition-all`}>
                                                        {po.status}
                                                    </span>
                                                </td>
                                                <td className="px-8 py-6">
                                                    <span className="font-black text-erp-navy text-base">{po.total.toLocaleString()} ₫</span>
                                                </td>
                                                <td className="px-8 py-6">
                                                    <div className="flex items-center gap-2 group/escrow cursor-help">
                                                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${po.escrowLocked ? 'bg-amber-100 text-amber-600' : 'bg-slate-100 text-slate-300'}`}>
                                                            {po.escrowLocked ? <ShieldCheck size={18} /> : <Info size={16} />}
                                                        </div>
                                                        <span className={`text-[10px] font-black uppercase ${po.escrowLocked ? 'text-amber-600' : 'text-slate-300'}`}>
                                                            {po.escrowLocked ? 'LOCKED' : 'NO'}
                                                        </span>
                                                        {po.escrowLocked && (
                                                            <div className="absolute opacity-0 group-hover/escrow:opacity-100 bg-erp-navy text-white text-[9px] p-3 rounded-xl w-48 shadow-xl pointer-events-none transition-all -translate-y-12">
                                                                Tiền đã được giữ trong Escrow. Chỉ giải ngân sau khi nhận hàng.
                                                            </div>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-8 py-6 text-right">
                                                    <div className="flex justify-end gap-2">
                                                        <button 
                                                            onClick={() => setSelectedPO(po)}
                                                            className="p-3 text-slate-400 hover:text-erp-navy hover:bg-slate-100 rounded-xl transition-all"
                                                            title="Xem chi tiết"
                                                        >
                                                            <Eye size={18} />
                                                        </button>
                                                        <button className="p-3 text-slate-400 hover:text-erp-blue hover:bg-blue-50 rounded-xl transition-all" title="Sửa PO">
                                                            <Edit3 size={18} />
                                                        </button>
                                                        <button className="p-3 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all" title="Hủy PO">
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
                    </div>
                ) : (
                    <POForm onCancel={() => setView("list")} notify={notify} prs={prs || []} rfqs={rfqs || []} organizations={organizations || []} />
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
function POForm({ onCancel, notify, prs, rfqs, organizations }: any) {
    const [formData, setFormData] = useState({
        prId: "",
        rfqId: "",
        vendorId: "",
        title: "",
        escrowLocked: false,
        items: [{ id: "new-1", productName: "", qty: 1, unitPrice: 0, total: 0 }]
    });

    const selectedVendor = organizations.find((o: any) => o.id === formData.vendorId);
    const filteredRFQs = rfqs.filter((r: any) => r.prId === formData.prId);

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

    const handleUpdateItem = (idx: number, field: string, value: any) => {
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
            notify("Vui lòng nhập đầy đủ thông tin bắt buộc", "error");
            return;
        }
        notify(`Đã ${status === 'DRAFT' ? 'lưu nháp' : 'phát hành'} PO thành công`, "success");
        onCancel();
    };

    return (
        <div className="space-y-8 animate-in slide-in-from-bottom-8 duration-500 max-w-5xl mx-auto">
            <div className="flex items-center justify-between">
                <button onClick={onCancel} className="flex items-center gap-2 text-slate-400 hover:text-erp-navy font-black text-[10px] uppercase tracking-widest transition-all">
                    <ArrowLeft size={16} /> Quay lại danh sách
                </button>
                <div className="flex items-center gap-4">
                    <button onClick={() => handleSave('DRAFT' as PoStatus)} className="px-8 py-4 bg-white border border-slate-200 text-slate-500 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-50 transition-all">
                        Lưu nháp
                    </button>
                    <button onClick={() => handleSave('ISSUED' as PoStatus)} className="px-10 py-5 bg-erp-navy text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-2xl shadow-erp-navy/20 hover:scale-105 active:scale-95 transition-all">
                        Phát hành PO
                    </button>
                </div>
            </div>

            <div className="bg-white rounded-[40px] border border-slate-100 shadow-2xl shadow-erp-navy/5 overflow-hidden">
                <div className="p-10 border-b border-slate-100 bg-slate-50/30">
                    <h2 className="text-2xl font-black text-erp-navy uppercase">TẠO ĐƠN ĐẶT HÀNG MỚI</h2>
                    <p className="text-slate-400 font-bold text-xs uppercase tracking-widest mt-1">Vui lòng nhập thông tin chi tiết để phát hành đơn hàng</p>
                </div>

                <div className="p-10 space-y-12">
                    {/* General Info */}
                    <div className="grid md:grid-cols-2 gap-10">
                        <div className="space-y-3">
                            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Chọn yêu cầu PR liên kết *</label>
                            <select 
                                className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-5 outline-none focus:bg-white focus:border-erp-blue transition-all font-bold text-erp-navy"
                                value={formData.prId}
                                onChange={(e) => setFormData({ ...formData, prId: e.target.value })}
                            >
                                <option value="">-- Chọn PR --</option>
                                <option value="PR-2026-003">PR-2026-003 (Thiết bị IT định kỳ)</option>
                                <option value="PR-2026-004">PR-2026-004 (Vật tư văn phòng)</option>
                                {prs.filter((p: any) => p.status === 'APPROVED').map((p: any) => (
                                    <option key={p.id} value={p.prNumber}>{p.prNumber} - {p.title}</option>
                                ))}
                            </select>
                        </div>
                        <div className="space-y-3">
                            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Chọn Báo giá/RFQ liên kết</label>
                            <select 
                                className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-5 outline-none focus:bg-white focus:border-erp-blue transition-all font-bold text-erp-navy disabled:opacity-50"
                                value={formData.rfqId}
                                disabled={!formData.prId}
                                onChange={(e) => setFormData({ ...formData, rfqId: e.target.value })}
                            >
                                <option value="">-- Chọn RFQ --</option>
                                {filteredRFQs.map((r: any) => (
                                    <option key={r.id} value={r.rfqNumber || r.qrNumber}>{r.rfqNumber || r.qrNumber} ({r.title})</option>
                                ))}
                            </select>
                        </div>
                        <div className="space-y-3">
                            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Nhà cung cấp *</label>
                            <select 
                                className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-5 outline-none focus:bg-white focus:border-erp-blue transition-all font-bold text-erp-navy"
                                value={formData.vendorId}
                                onChange={(e) => setFormData({ ...formData, vendorId: e.target.value })}
                            >
                                <option value="">-- Chọn NCC --</option>
                                <option value="v-1">Hanoi Hardware</option>
                                <option value="6c7f4a14-9238-419c-ba0f-fa8da8eb0253">ABC Supplier</option>
                                <option value="v-3">Saigon Tech</option>
                                {organizations.filter((o: any) => o.companyType === 'SUPPLIER').map((o: Organization) => (
                                    <option key={o.id} value={o.id}>{o.name}</option>
                                ))}
                            </select>
                        </div>
                        <div className="flex items-center gap-4 h-full pt-8">
                            <div 
                                onClick={() => setFormData({ ...formData, escrowLocked: !formData.escrowLocked })}
                                className={`w-14 h-8 rounded-full p-1 cursor-pointer transition-all ${formData.escrowLocked ? 'bg-amber-500' : 'bg-slate-200'}`}
                            >
                                <div className={`w-6 h-6 bg-white rounded-full transition-transform ${formData.escrowLocked ? 'translate-x-6' : 'translate-x-0'}`}></div>
                            </div>
                            <div className="space-y-0.5 group relative cursor-help">
                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-700">Khóa Escrow</p>
                                <p className="text-[9px] font-bold text-slate-400">Giữ tiền của đơn hàng cho đến khi nhận hàng</p>
                                <div className="absolute bottom-full left-0 opacity-0 group-hover:opacity-100 bg-erp-navy text-white text-[9px] p-2 rounded-lg w-48 mb-2 transition-all">
                                    Thanh toán chỉ giải ngân khi Goods Receipt được ký duyệt.
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Items Section */}
                    <div className="space-y-6">
                        <div className="flex justify-between items-center bg-slate-50 p-6 rounded-2xl border border-slate-100">
                            <h3 className="text-sm font-black text-erp-navy uppercase">DANH SÁCH MẶT HÀNG TRÊN PO</h3>
                            <button 
                                onClick={handleAddItem}
                                className="text-[10px] font-black uppercase text-erp-blue flex items-center gap-2 hover:bg-erp-blue/5 px-4 py-2 rounded-xl transition-all"
                            >
                                <PlusCircle size={16} /> Thêm mặt hàng
                            </button>
                        </div>

                        <div className="space-y-4">
                            {formData.items.map((item, idx) => (
                                <div key={item.id} className="grid grid-cols-12 gap-4 items-end bg-white p-4 rounded-3xl border border-slate-100 group animate-in slide-in-from-left-4 duration-300">
                                    <div className="col-span-12 lg:col-span-5 space-y-2">
                                        <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest ml-1">Tên sản phẩm *</label>
                                        <input 
                                            type="text" 
                                            placeholder="Nhập tên SP..."
                                            className="w-full bg-slate-50 border border-transparent rounded-xl px-5 py-4 text-xs font-bold text-erp-navy outline-none focus:bg-white focus:border-erp-blue/20 transition-all"
                                            value={item.productName}
                                            onChange={(e) => handleUpdateItem(idx, "productName", e.target.value)}
                                        />
                                    </div>
                                    <div className="col-span-4 lg:col-span-2 space-y-2">
                                        <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest ml-1">Số lượng</label>
                                        <input 
                                            type="number" 
                                            className="w-full bg-slate-50 border border-transparent rounded-xl px-5 py-4 text-xs font-bold text-erp-navy outline-none focus:bg-white focus:border-erp-blue/20 transition-all"
                                            value={item.qty}
                                            onChange={(e) => handleUpdateItem(idx, "qty", parseInt(e.target.value) || 0)}
                                        />
                                    </div>
                                    <div className="col-span-4 lg:col-span-2 space-y-2">
                                        <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest ml-1">Đơn giá</label>
                                        <input 
                                            type="number" 
                                            className="w-full bg-slate-50 border border-transparent rounded-xl px-5 py-4 text-xs font-bold text-erp-navy outline-none focus:bg-white focus:border-erp-blue/20 transition-all"
                                            value={item.unitPrice}
                                            onChange={(e) => handleUpdateItem(idx, "unitPrice", parseInt(e.target.value) || 0)}
                                        />
                                    </div>
                                    <div className="col-span-4 lg:col-span-2 space-y-2">
                                        <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest ml-1 text-slate-300">Thành tiền</label>
                                        <div className="w-full bg-blue-50/30 rounded-xl px-5 py-4 text-xs font-black text-erp-blue flex items-center justify-end">
                                            {item.total.toLocaleString()} ₫
                                        </div>
                                    </div>
                                    <div className="col-span-12 lg:col-span-1 flex justify-center pb-2">
                                        <button 
                                            onClick={() => handleRemoveItem(idx)}
                                            className="p-2 text-slate-200 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all"
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
                    <div className="pt-10 border-t border-slate-100 flex flex-col md:flex-row justify-between items-center gap-8">
                        <div className="flex items-center gap-6 text-slate-400">
                             <div className="flex items-center gap-2">
                                 <AlertCircle size={16} />
                                 <span className="text-[10px] font-bold uppercase tracking-widest">Vui lòng rà soát kỹ các điều khoản PO</span>
                             </div>
                        </div>
                        <div className="bg-erp-navy px-12 py-8 rounded-[32px] text-white shadow-2xl shadow-erp-navy/20 relative overflow-hidden group">
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
            case "DRAFT": return "bg-slate-100 text-slate-500";
            case "ISSUED": return "bg-erp-blue text-white shadow-lg shadow-erp-blue/20";
            case "ACKNOWLEDGED": return "bg-emerald-500 text-white shadow-lg shadow-emerald-500/20";
            default: return "bg-slate-100 text-slate-500";
        }
    };

    return (
        <div className="fixed inset-0 z-50 overflow-hidden">
            <div className="absolute inset-0 bg-erp-navy/40 backdrop-blur-sm animate-in fade-in duration-300" onClick={onClose}></div>
            <div className="absolute inset-y-0 right-0 w-full max-w-xl bg-white shadow-2xl flex flex-col animate-in slide-in-from-right duration-500">
                {/* Drawer Header */}
                <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-erp-navy flex items-center justify-center text-white">
                            <ShoppingCart size={24} />
                        </div>
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <h3 className="text-lg font-black text-erp-navy uppercase">{po.poNumber}</h3>
                                <span className={`px-3 py-1 rounded-lg text-[8px] font-black uppercase tracking-[0.2em] ${getStatusColor(po.status)}`}>
                                    {po.status}
                                </span>
                            </div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">Phát hành lúc: {po.createdAt ? new Date(po.createdAt).toLocaleString() : "N/A"}</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-all">
                        <X size={24} className="text-slate-400" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-8 space-y-10 custom-scrollbar">
                    {/* Vendor Section */}
                    <div className="bg-slate-50 rounded-3xl p-6 border border-slate-100 relative overflow-hidden group">
                        <div className="absolute -right-8 -bottom-8 opacity-5 text-erp-navy group-hover:scale-110 transition-transform duration-700 rotate-12">
                            <Building size={120} />
                        </div>
                        <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4 flex items-center gap-2">
                             <div className="w-1 h-3 bg-erp-blue rounded-full"></div> NHÀ CUNG CẤP
                        </h4>
                        <div className="relative z-10">
                            <div className="text-xl font-black text-erp-navy mb-1">{po.vendorName}</div>
                            <div className="text-xs font-bold text-slate-500">ID: {po.vendorId}</div>
                        </div>
                    </div>

                    {/* Linked Info */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-blue-50/30 p-4 rounded-2xl border border-blue-50/50">
                            <p className="text-[9px] font-black text-blue-400 uppercase mb-1">YÊU CẦU PR</p>
                            <p className="font-black text-erp-navy text-sm">{po.prId}</p>
                        </div>
                        <div className="bg-indigo-50/30 p-4 rounded-2xl border border-indigo-50/50">
                            <p className="text-[9px] font-black text-indigo-400 uppercase mb-1">BẢN CHÀO RFQ</p>
                            <p className="font-black text-erp-navy text-sm">{po.rfqId}</p>
                        </div>
                    </div>

                    {/* Items Table */}
                    <div className="space-y-4">
                        <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                             <div className="w-1 h-3 bg-emerald-500 rounded-full"></div> CHI TIẾT HẠNG MỤC
                        </h4>
                        <div className="bg-white rounded-3xl border border-slate-100 overflow-hidden shadow-sm">
                            <table className="w-full text-left text-xs">
                                <thead className="bg-slate-50 border-b border-slate-100">
                                    <tr className="font-black text-slate-400 uppercase tracking-tighter">
                                        <th className="px-5 py-4">Mô tả</th>
                                        <th className="px-5 py-4 text-center">SL</th>
                                        <th className="px-5 py-4 text-right">Đơn giá</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {po.items.map((item: any) => (
                                        <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                                            <td className="px-5 py-4 font-bold text-erp-navy">{item.description}</td>
                                            <td className="px-5 py-4 text-center font-black text-slate-400">{item.qty}</td>
                                            <td className="px-5 py-4 text-right font-black text-slate-700">{item.estimatedPrice.toLocaleString()} ₫</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Escrow Status */}
                    <div className={`p-6 rounded-3xl border flex items-center justify-between ${po.escrowLocked ? 'bg-amber-50 border-amber-100 text-amber-700' : 'bg-slate-50 border-slate-100 text-slate-500'}`}>
                        <div className="flex items-center gap-4">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${po.escrowLocked ? 'bg-amber-500 text-white' : 'bg-slate-200 text-slate-400'}`}>
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
                <div className="p-8 border-t border-slate-100 bg-slate-50 flex flex-col gap-6">
                    <div className="flex justify-between items-center">
                        <span className="text-xs font-black text-slate-400 uppercase tracking-widest">TỔNG THANH TOÁN:</span>
                        <span className="text-3xl font-black text-erp-blue tracking-tighter">{po.total.toLocaleString()} ₫</span>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <button className="py-4 border border-slate-200 text-slate-500 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-white transition-all">Gửi lại thông báo</button>
                        <button className="py-4 bg-erp-navy text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-erp-blue transition-all shadow-xl shadow-erp-navy/10">In Đơn hàng</button>
                    </div>
                </div>
            </div>
        </div>
    );
}

function Building({ size, className }: { size: number, className?: string }) {
    return <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="2" width="16" height="20" rx="2" ry="2"></rect><path d="M9 22v-4h6v4"></path><path d="M8 6h.01"></path><path d="M16 6h.01"></path><path d="M8 10h.01"></path><path d="M16 10h.01"></path><path d="M8 14h.01"></path><path d="M16 14h.01"></path><path d="M8 18h.01"></path><path d="M16 18h.01"></path></svg>;
}
