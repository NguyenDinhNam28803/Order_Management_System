"use client";

import React, { useState } from "react";
import { useProcurement, Organization } from "../../context/ProcurementContext";
import DashboardHeader from "../../components/DashboardHeader";
import { 
    Truck, Plus, Search, 
    Trash2, CheckCircle2, XCircle, Star, 
    Mail, Phone, Globe
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
    const { currentUser, notify, organizations, addOrganization, removeOrganization, refreshData } = useProcurement();
    const [searchTerm, setSearchTerm] = useState("");
    
    React.useEffect(() => {
        refreshData();
    }, [refreshData]);

    const suppliers = (organizations || []).filter(org => 
        org.companyType === 'SUPPLIER' || org.companyType === 'BOTH'
    );

    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [newSupplier, setNewSupplier] = useState<Partial<Supplier>>({
        status: 'ACTIVE',
        rating: 4
    });

    if (currentUser?.role !== "PLATFORM_ADMIN") {
        return <div className="p-20 text-center font-black text-slate-400">Bạn không có quyền truy cập trang quản trị này.</div>;
    }

    const handleAddSupplier = async () => {
        if (!newSupplier.name || !newSupplier.code) {
            notify("Vui lòng nhập tên và mã NCC", "error");
            return;
        }

        const success = await addOrganization({
            name: newSupplier.name!,
            code: newSupplier.code!,
            industry: newSupplier.category || "General",
            companyType: "SUPPLIER" as any,
            email: newSupplier.email || "",
            phone: newSupplier.phone || "",
            website: newSupplier.website,
            countryCode: "VN"
        } as any);

        if (success) {
            setIsAddModalOpen(false);
            setNewSupplier({ status: 'ACTIVE', rating: 4 });
        }
    };

    const filteredSuppliers = suppliers.filter(s => 
        s.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        s.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (s.industry || "").toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="animate-in fade-in duration-500">
            <DashboardHeader breadcrumbs={["Hệ thống", "Quản trị", "Đối tác & Nhà cung cấp"]} />

            <div className="mt-8 flex justify-between items-end mb-10 border-b border-[rgba(148,163,184,0.1)] pb-8">
                <div>
                    <h1 className="text-4xl font-black text-[#F8FAFC] tracking-tighter uppercase mb-2">Quản lý Nhà cung cấp</h1>
                    <p className="text-[#64748B] font-bold text-sm tracking-tight flex items-center gap-2">
                        <Truck size={14} className="text-[#3B82F6]" /> 
                        Danh mục đối tác và nhà cung ứng chiến lược của hệ thống
                    </p>
                </div>
                <button 
                    onClick={() => setIsAddModalOpen(true)}
                    className="btn-primary"
                >
                    <Plus size={18} /> Thêm nhà cung cấp mới
                </button>
            </div>

            <div className="erp-card p-0! overflow-hidden bg-[#161922] shadow-sm border border-[rgba(148,163,184,0.1)]">
                <div className="p-8 border-b border-[rgba(148,163,184,0.1)] flex items-center justify-between gap-6 bg-[#0F1117]">
                    <div className="relative flex-1 max-w-md group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#64748B] group-focus-within:text-[#3B82F6] transition-colors" size={18} />
                        <input 
                            className="erp-input pl-12" 
                            placeholder="Tìm theo tên, mã hoặc lĩnh vực..." 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="erp-table">
                        <thead>
                            <tr className="bg-[#0F1117]">
                                <th className="px-8 py-5">Nhà cung cấp</th>
                                <th className="px-6 py-5">Lĩnh vực</th>
                                <th className="px-6 py-5">Liên hệ</th>
                                <th className="px-6 py-5">Đánh giá</th>
                                <th className="px-6 py-5">Trạng thái</th>
                                <th className="px-8 py-5 text-right w-20"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[rgba(148,163,184,0.05)]">
                            {filteredSuppliers.map((s) => (
                                <tr key={s.id} className="hover:bg-[#0F1117]/50 transition-all group">
                                    <td className="px-8 py-6">
                                        <div className="flex items-center gap-4">
                                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-white shadow-lg shadow-black/20 transition-transform group-hover:scale-110 ${s.isActive !== false ? 'bg-[#3B82F6]' : 'bg-[#64748B]'}`}>
                                                {s.name.substring(0,2).toUpperCase()}
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="font-black text-[#F8FAFC] leading-none mb-1 group-hover:text-[#3B82F6] transition-colors">{s.name}</span>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-[10px] font-black text-[#64748B] uppercase tracking-tighter bg-[#0F1117] px-1.5 py-0.5 rounded border border-[rgba(148,163,184,0.1)]">{s.code}</span>
                                                    {s.website && <Globe size={10} className="text-[#64748B]" />}
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-6">
                                        <span className="text-xs font-black text-[#94A3B8] uppercase tracking-tight">{s.industry || "General"}</span>
                                    </td>
                                    <td className="px-6 py-6 font-medium">
                                        <div className="flex flex-col gap-1">
                                            <div className="flex items-center gap-2 text-xs text-[#64748B]">
                                                <Mail size={12} className="text-[#64748B]" /> {s.email || "N/A"}
                                            </div>
                                            <div className="flex items-center gap-2 text-xs text-[#64748B]">
                                                <Phone size={12} className="text-[#64748B]" /> {s.phone || "N/A"}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-6">
                                        <div className="flex gap-0.5">
                                            {[1,2,3,4,5].map(i => (
                                                <Star key={i} size={12} className={i <= (s.trustScore ? Math.ceil(s.trustScore / 20) : 4) ? "fill-amber-400 text-amber-400" : "text-[#1A1D23]"} />
                                            ))}
                                        </div>
                                    </td>
                                    <td className="px-6 py-6">
                                        <div className={`status-pill ${
                                            s.isActive !== false ? 'status-approved' : 'status-draft'
                                        }`}>
                                            {s.isActive !== false ? <CheckCircle2 size={10} /> : <XCircle size={10} />}
                                            {s.isActive !== false ? 'Đang hoạt động' : 'Tạm ngưng'}
                                        </div>
                                    </td>
                                    <td className="px-8 py-6 text-right">
                                        <div className="flex justify-end gap-2 text-[#64748B]">
                                            <button 
                                                onClick={() => {
                                                    if(confirm("Xác nhận xóa đối tác này?")) removeOrganization(s.id);
                                                }}
                                                className="p-2 border border-[rgba(148,163,184,0.1)] rounded-lg hover:bg-red-500/10 hover:border-red-500/30 transition-colors text-[#64748B] hover:text-red-400"
                                            >
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

            {/* Add Supplier Modal */}
            {isAddModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-[#0F1117]/80 backdrop-blur-md animate-in fade-in duration-300" onClick={() => setIsAddModalOpen(false)} />
                    <div className="relative bg-[#161922] border border-[rgba(148,163,184,0.1)] rounded-[40px] w-full max-w-xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300">
                        <div className="p-10">
                            <h2 className="text-2xl font-black text-[#F8FAFC] uppercase mb-8 flex items-center gap-3">
                                <Plus className="text-[#3B82F6]" /> Thêm nhà cung cấp mới
                            </h2>
                            
                            <div className="form-grid mb-8">
                                <div className="form-group col-span-2">
                                    <label className="erp-label">Tên nhà cung cấp</label>
                                    <input 
                                        className="erp-input" 
                                        placeholder="VD: Công ty TNHH Giải pháp Số" 
                                        value={newSupplier.name || ""}
                                        onChange={e => setNewSupplier({...newSupplier, name: e.target.value})}
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="erp-label">Mã NCC</label>
                                    <input 
                                        className="erp-input" 
                                        placeholder="VD: DGT-SOL" 
                                        value={newSupplier.code || ""}
                                        onChange={e => setNewSupplier({...newSupplier, code: e.target.value})}
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="erp-label">Lĩnh vực chuyên môn</label>
                                    <input 
                                        className="erp-input" 
                                        placeholder="VD: IT, Nội thất..." 
                                        value={newSupplier.category || ""}
                                        onChange={e => setNewSupplier({...newSupplier, category: e.target.value})}
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="erp-label">Email liên hệ</label>
                                    <input 
                                        className="erp-input" 
                                        placeholder="supplier@email.com" 
                                        value={newSupplier.email || ""}
                                        onChange={e => setNewSupplier({...newSupplier, email: e.target.value})}
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="erp-label">Số điện thoại</label>
                                    <input 
                                        className="erp-input" 
                                        placeholder="024 XXXX XXXX" 
                                        value={newSupplier.phone || ""}
                                        onChange={e => setNewSupplier({...newSupplier, phone: e.target.value})}
                                    />
                                </div>
                            </div>

                            <div className="flex gap-4">
                                <button className="btn-secondary flex-1 py-4 uppercase tracking-widest text-xs" onClick={() => setIsAddModalOpen(false)}>Hủy bỏ</button>
                                <button className="btn-primary flex-1 py-4 uppercase tracking-widest text-xs" onClick={handleAddSupplier}>
                                    Xác nhận lưu
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
