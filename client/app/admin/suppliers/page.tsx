"use client";

import React, { useState } from "react";
import { useProcurement, Organization } from "../../context/ProcurementContext";
import DashboardHeader from "../../components/DashboardHeader";
import { 
    Truck, Plus, Search, Filter, 
    MoreHorizontal, Edit, Trash2, 
    CheckCircle2, XCircle, Star, 
    Mail, Phone, ExternalLink, Globe
} from "lucide-react";

export interface Supplier {
    id: string;
    name: string;
    code: string;
    category: string;
    status: 'ACTIVE' | 'INACTIVE';
    rating: number;
    email: string;
    phone: string;
    website?: string;
}

export default function SupplierManagementPage() {
    const { currentUser, notify } = useProcurement();
    const [searchTerm, setSearchTerm] = useState("");
    
    // Initial mock data
    const [suppliers, setSuppliers] = useState<Supplier[]>([
        { id: "v1", name: "Thiên Long Digital", code: "TL-DGT", category: "IT Equipment", status: 'ACTIVE', rating: 5, email: "sales@thienlong.vn", phone: "028 3750 5555", website: "https://thienlong.vn" },
        { id: "v2", name: "Hòa Phát Furniture", code: "HP-FURN", category: "Office Furniture", status: 'ACTIVE', rating: 4, email: "contact@hoaphat.com", phone: "024 3665 8888", website: "https://hoaphat.com.vn" },
        { id: "v3", name: "Sunhouse Group", code: "SH-GRP", category: "Appliances", status: 'ACTIVE', rating: 4, email: "support@sunhouse.com.vn", phone: "1800 6680", website: "https://sunhouse.com.vn" },
        { id: "v4", name: "FPT Information System", code: "FPT-IS", category: "Software/Server", status: 'ACTIVE', rating: 5, email: "info@fpt-is.com", phone: "024 3562 6000", website: "https://fpt-is.com" },
        { id: "v5", name: "Thế giới di động", code: "TGDĐ", category: "Retail/Consumer Electronics", status: 'ACTIVE', rating: 5, email: "contact@tgdd.vn", phone: "1800 1060", website: "https://thegioididong.com" },
        { id: "v6", name: "Hanoi Hardware", code: "HN-HW", category: "Hardware & Construction", status: 'ACTIVE', rating: 4, email: "sales@hanoihardware.vn", phone: "024 3999 1234" },
        { id: "v7", name: "Vinamilk Logistics", code: "VNM-LOG", category: "Food/Services", status: 'INACTIVE', rating: 3, email: "logistics@vinamilk.com.vn", phone: "028 5415 5555" }
    ]);

    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [newSupplier, setNewSupplier] = useState<Partial<Supplier>>({
        status: 'ACTIVE',
        rating: 4
    });

    if (currentUser?.role !== "PLATFORM_ADMIN") {
        return <div className="p-20 text-center font-black text-slate-400">Bạn không có quyền truy cập trang quản trị này.</div>;
    }

    const handleAddSupplier = () => {
        if (!newSupplier.name || !newSupplier.code) {
            notify("Vui lòng nhập tên và mã NCC", "error");
            return;
        }

        const supplier: Supplier = {
            id: `v-${suppliers.length + 1}`,
            name: newSupplier.name!,
            code: newSupplier.code!,
            category: newSupplier.category || "General",
            status: newSupplier.status || 'ACTIVE',
            rating: newSupplier.rating || 4,
            email: newSupplier.email || "",
            phone: newSupplier.phone || "",
            website: newSupplier.website
        };

        setSuppliers([supplier, ...suppliers]);
        setIsAddModalOpen(false);
        setNewSupplier({ status: 'ACTIVE', rating: 4 });
        notify(`Đã thêm nhà cung cấp ${supplier.name} thành công.`, "success");
    };

    const filteredSuppliers = suppliers.filter(s => 
        s.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        s.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.category.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <main className="animate-in fade-in duration-500 p-6 min-h-screen bg-[#0F1117] text-[#F8FAFC]">
            <DashboardHeader breadcrumbs={["Admin", "Quản lý Nhà cung cấp"]} />

            <div className="mt-8 flex justify-between items-end mb-10">
                <div>
                    <h1 className="text-4xl font-black text-erp-navy tracking-tighter uppercase mb-2">Quản lý Nhà cung cấp</h1>
                    <p className="text-slate-400 font-bold text-sm tracking-tight flex items-center gap-2">
                        <Truck size={14} className="text-erp-blue" /> 
                        Danh mục đối tác và nhà cung ứng chiến lược của hệ thống
                    </p>
                </div>
                <button 
                    onClick={() => setIsAddModalOpen(true)}
                    className="flex items-center gap-2 bg-erp-navy text-white px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-erp-navy/30 hover:scale-105 active:scale-95 transition-all"
                >
                    <Plus size={18} /> Thêm nhà cung cấp mới
                </button>
            </div>

            <div className="bg-white rounded-[40px] border border-slate-100 shadow-2xl shadow-erp-navy/5 overflow-hidden">
                <div className="p-8 border-b border-slate-50 flex items-center justify-between gap-6">
                    <div className="relative flex-1 max-w-md group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-erp-blue transition-colors" size={18} />
                        <input 
                            className="w-full pl-12 pr-4 py-4 bg-slate-50 border-transparent rounded-[20px] text-sm font-bold focus:bg-white focus:border-erp-blue/20 focus:ring-4 focus:ring-erp-blue/5 transition-all outline-none" 
                            placeholder="Tìm theo tên, mã hoặc lĩnh vực..." 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div className="flex gap-3">
                        <button className="h-14 w-14 flex items-center justify-center bg-slate-50 text-slate-400 rounded-2xl hover:bg-slate-100 transition-all border border-transparent hover:border-slate-200">
                            <Filter size={20} />
                        </button>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-slate-50/50 text-[10px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-100">
                                <th className="px-8 py-5">Nhà cung cấp</th>
                                <th className="px-6 py-5">Lĩnh vực</th>
                                <th className="px-6 py-5">Liên hệ</th>
                                <th className="px-6 py-5">Đánh giá</th>
                                <th className="px-6 py-5">Trạng thái</th>
                                <th className="px-8 py-5 text-right w-20"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {filteredSuppliers.map((s) => (
                                <tr key={s.id} className="hover:bg-slate-50/50 transition-all group">
                                    <td className="px-8 py-6">
                                        <div className="flex items-center gap-4">
                                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-white shadow-lg shadow-slate-200 transition-transform group-hover:scale-110 ${s.status === 'ACTIVE' ? 'bg-erp-navy' : 'bg-slate-300'}`}>
                                                {s.name.substring(0,2).toUpperCase()}
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="font-black text-erp-navy leading-none mb-1 group-hover:text-erp-blue transition-colors">{s.name}</span>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter bg-slate-100 px-1.5 py-0.5 rounded">{s.code}</span>
                                                    {s.website && <Globe size={10} className="text-slate-300" />}
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-6">
                                        <span className="text-xs font-black text-slate-600 uppercase tracking-tight">{s.category}</span>
                                    </td>
                                    <td className="px-6 py-6 font-medium">
                                        <div className="flex flex-col gap-1">
                                            <div className="flex items-center gap-2 text-xs text-slate-500">
                                                <Mail size={12} className="text-slate-300" /> {s.email}
                                            </div>
                                            <div className="flex items-center gap-2 text-xs text-slate-500">
                                                <Phone size={12} className="text-slate-300" /> {s.phone}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-6">
                                        <div className="flex gap-0.5">
                                            {[1,2,3,4,5].map(i => (
                                                <Star key={i} size={12} className={i <= s.rating ? "fill-amber-400 text-amber-400" : "text-slate-200"} />
                                            ))}
                                        </div>
                                    </td>
                                    <td className="px-6 py-6">
                                        <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-[9px] font-black uppercase tracking-widest ${
                                            s.status === 'ACTIVE' ? 'bg-emerald-50 border-emerald-100 text-emerald-600' : 'bg-slate-50 border-slate-100 text-slate-400'
                                        }`}>
                                            {s.status === 'ACTIVE' ? <CheckCircle2 size={10} /> : <XCircle size={10} />}
                                            {s.status === 'ACTIVE' ? 'Đang hoạt động' : 'Tạm ngưng'}
                                        </div>
                                    </td>
                                    <td className="px-8 py-6 text-right">
                                        <button className="w-10 h-10 flex items-center justify-center text-slate-300 hover:text-erp-navy hover:bg-white rounded-xl transition-all shadow-sm hover:shadow-md">
                                            <MoreHorizontal size={18} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Add Supplier Modal Simulation */}
            {isAddModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-erp-navy/40 backdrop-blur-md animate-in fade-in duration-300" onClick={() => setIsAddModalOpen(false)} />
                    <div className="relative bg-white rounded-[40px] w-full max-w-xl overflow-hidden shadow-2xl animate-in zoom-in slide-in-from-bottom-8 duration-500">
                        <div className="p-10">
                            <h2 className="text-2xl font-black text-erp-navy uppercase mb-8 flex items-center gap-3">
                                <Plus className="text-erp-blue" /> Thêm nhà cung cấp mới
                            </h2>
                            
                            <div className="grid grid-cols-2 gap-6 mb-8">
                                <div className="col-span-2">
                                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-2 block">Tên nhà cung cấp</label>
                                    <input 
                                        className="erp-input" 
                                        placeholder="VD: Công ty TNHH Giải pháp Số" 
                                        value={newSupplier.name || ""}
                                        onChange={e => setNewSupplier({...newSupplier, name: e.target.value})}
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-2 block">Mã NCC</label>
                                    <input 
                                        className="erp-input " 
                                        placeholder="VD: DGT-SOL" 
                                        value={newSupplier.code || ""}
                                        onChange={e => setNewSupplier({...newSupplier, code: e.target.value})}
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-2 block">Lĩnh vực chuyên môn</label>
                                    <input 
                                        className="erp-input" 
                                        placeholder="VD: IT, Nội thất..." 
                                        value={newSupplier.category || ""}
                                        onChange={e => setNewSupplier({...newSupplier, category: e.target.value})}
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-2 block">Email liên hệ</label>
                                    <input 
                                        className="erp-input" 
                                        placeholder="supplier@email.com" 
                                        value={newSupplier.email || ""}
                                        onChange={e => setNewSupplier({...newSupplier, email: e.target.value})}
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-2 block">Số điện thoại</label>
                                    <input 
                                        className="erp-input" 
                                        placeholder="024 XXXX XXXX" 
                                        value={newSupplier.phone || ""}
                                        onChange={e => setNewSupplier({...newSupplier, phone: e.target.value})}
                                    />
                                </div>
                            </div>

                            <div className="flex gap-4">
                                <button className="flex-1 py-4 font-black text-slate-400 uppercase tracking-widest text-xs hover:bg-slate-50 rounded-2xl transition-all" onClick={() => setIsAddModalOpen(false)}>Hủy bỏ</button>
                                <button className="flex-1 py-4 bg-erp-navy text-white rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl shadow-erp-navy/20 hover:scale-105 transition-all" onClick={handleAddSupplier}>
                                    Xác nhận lưu
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </main>
    );
}
