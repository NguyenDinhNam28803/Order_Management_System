"use client";

import React, { useState } from "react";
import { useProcurement, Organization } from "../../context/ProcurementContext";
import { CreateOrganizationPayload } from "@/app/types/api-types";
import ConfirmDialog from "../../components/shared/ConfirmDialog";
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
    const [confirmState, setConfirmState] = useState<{ open: boolean; title: string; message: string; onConfirm: () => void }>({ open: false, title: "", message: "", onConfirm: () => {} });
    
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
        return <div className="p-20 text-center font-black text-black">Bạn không có quyền truy cập trang quản trị này.</div>;
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
            companyType: "SUPPLIER" as const,
            email: newSupplier.email || "",
            phone: newSupplier.phone,
            website: newSupplier.website,
            countryCode: "VN"
        } as CreateOrganizationPayload);

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
            <ConfirmDialog
                open={confirmState.open}
                title={confirmState.title}
                message={confirmState.message}
                onConfirm={confirmState.onConfirm}
                onCancel={() => setConfirmState(s => ({ ...s, open: false }))}
            />
            <div className="mt-8 flex justify-between items-end mb-10 border-b border-[rgba(148,163,184,0.1)] pb-8">
                <div>
                    <h1 className="text-4xl font-black text-slate-900 tracking-tighter uppercase mb-2">Quản lý Nhà cung cấp</h1>
                    <p className="text-slate-900 font-bold text-sm tracking-tight flex items-center gap-2">
                        <Truck size={14} className="text-[#2563EB]" /> 
                        Danh mục đối tác và nhà cung ứng chiến lược của hệ thống
                    </p>
                </div>
                <button 
                    onClick={() => setIsAddModalOpen(true)}
                    className="flex items-center gap-2 bg-[#2563EB] text-white px-8 py-3.5 rounded-xl font-black uppercase tracking-widest text-[11px] shadow-xl shadow-[#2563EB]/20 hover:scale-[1.02] transition-transform active:scale-95"
                >
                    <Plus size={18} /> Thêm nhà cung cấp
                </button>
            </div>

            <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-sm overflow-hidden bg-[#F1F5F9] border border-[rgba(148,163,184,0.1)]">
                <div className="p-8 border-b border-[rgba(148,163,184,0.1)] flex items-center justify-between gap-6 bg-[#FFFFFF]">
                    <div className="relative flex-1 max-w-md group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-900 group-focus-within:text-[#2563EB] transition-colors" size={18} />
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
                            <tr>
                                <th className="px-8 py-5">Nhà cung cấp</th>
                                <th className="px-6 py-5">Lĩnh vực</th>
                                <th className="px-6 py-5">Liên hệ</th>
                                <th className="px-6 py-5">Đánh giá</th>
                                <th className="px-6 py-5">Trạng thái</th>
                                <th className="px-8 py-5 text-right w-20"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[rgba(148,163,184,0.05)]">
                            {filteredSuppliers.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="py-16 text-center text-slate-400">
                                        <svg className="mx-auto mb-2" xmlns="http://www.w3.org/2000/svg" width="28" height="28" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 13.5h3.86a2.25 2.25 0 0 1 2.012 1.244l.256.512a2.25 2.25 0 0 0 2.013 1.244h3.218a2.25 2.25 0 0 0 2.013-1.244l.256-.512a2.25 2.25 0 0 1 2.013-1.244h3.859m-19.5.338V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18v-4.162c0-.224-.034-.447-.1-.661L19.24 5.338a2.25 2.25 0 0 0-2.15-1.588H6.911a2.25 2.25 0 0 0-2.15 1.588L2.35 13.177a2.25 2.25 0 0 0-.1.661Z" /></svg>
                                        <p className="text-sm font-semibold">Không tìm thấy nhà cung cấp nào</p>
                                        <p className="text-xs mt-1">Thử thay đổi từ khóa tìm kiếm</p>
                                    </td>
                                </tr>
                            )}
                            {filteredSuppliers.map((s) => (
                                <tr key={s.id} className="hover:bg-[#FFFFFF]/50 transition-all group">
                                    <td className="px-8 py-6">
                                        <div className="flex items-center gap-4">
                                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-white shadow-lg shadow-black/20 transition-transform group-hover:scale-110 ${s.isActive !== false ? 'bg-[#2563EB]' : 'bg-[#000000]'}`}>
                                                {s.name.substring(0,2).toUpperCase()}
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="font-black text-slate-900 leading-none mb-1 group-hover:text-[#2563EB] transition-colors">{s.name}</span>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-[10px] font-black text-slate-900 uppercase tracking-tighter bg-[#FFFFFF] px-1.5 py-0.5 rounded border border-[rgba(148,163,184,0.1)]">{s.code}</span>
                                                    {s.website && <Globe size={10} className="text-slate-900" />}
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-6">
                                        <span className="text-xs font-black text-slate-900 uppercase tracking-tight">{s.industry || "General"}</span>
                                    </td>
                                    <td className="px-6 py-6 font-medium">
                                        <div className="flex flex-col gap-1">
                                            <div className="flex items-center gap-2 text-xs text-slate-900">
                                                <Mail size={12} className="text-slate-900" /> {s.email || "N/A"}
                                            </div>
                                            <div className="flex items-center gap-2 text-xs text-slate-900">
                                                <Phone size={12} className="text-slate-900" /> {s.phone || "N/A"}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-6">
                                        <div className="flex gap-0.5">
                                            {[1,2,3,4,5].map(i => (
                                                <Star key={i} size={12} className={i <= (s.trustScore ? Math.ceil(s.trustScore / 20) : 4) ? "fill-amber-400 text-black" : "text-[#0F172A]"} />
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
                                        <div className="flex justify-end gap-2 text-slate-900">
                                            <button
                                                onClick={() => setConfirmState({
                                                    open: true,
                                                    title: "Xóa nhà cung cấp",
                                                    message: "Xác nhận xóa đối tác này?",
                                                    onConfirm: () => { removeOrganization(s.id); setConfirmState(st => ({ ...st, open: false })); }
                                                })}
                                                className="p-2 border border-slate-200 rounded-lg hover:bg-red-50 hover:border-red-200 transition-colors text-slate-500 hover:text-red-500"
                                                aria-label="Xóa nhà cung cấp"
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
                    <div className="absolute inset-0 bg-[#FFFFFF]/80 backdrop-blur-md animate-in fade-in duration-300" onClick={() => setIsAddModalOpen(false)} />
                    <div className="relative bg-white border border-[#E2E8F0] rounded-xl w-full max-w-xl overflow-hidden shadow-sm animate-in zoom-in-95 duration-300">
                        <div className="p-6">
                            <h2 className="text-2xl font-black text-slate-900 uppercase mb-2 tracking-tight">
                                Thêm nhà cung cấp mới
                            </h2>
                            <p className="text-xs text-slate-900 font-bold uppercase tracking-widest mb-6">QUẢN LÝ NHÀ CUNG CẤP</p>
                            
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

