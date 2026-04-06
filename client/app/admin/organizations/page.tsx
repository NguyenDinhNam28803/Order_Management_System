"use client";

import React, { useState } from "react";
import { Plus, Edit2, Trash2, Search, MapPin, Hash, Building2 } from "lucide-react";
import { useProcurement } from "../../context/ProcurementContext";
import { Organization } from "@/app/types/api-types";

export default function OrganizationsPage() {
    const { organizations, addOrganization, updateOrganization, removeOrganization, refreshData } = useProcurement();
    const [showModal, setShowModal] = useState(false);
    const [editingOrg, setEditingOrg] = useState<Organization | null>(null);

    React.useEffect(() => {
        refreshData();
    }, [refreshData]);
    const [formData, setFormData] = useState({
        code: "",
        name: "",
        address: "",
        taxCode: ""
    });

    const [searchTerm, setSearchTerm] = useState("");

    const filteredOrganizations = organizations?.filter((org: Organization) => 
        org.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        org.code.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleOpenModal = (org?: Organization) => {
        if (org) {
            setEditingOrg(org);
            setFormData({
                code: org.code,
                name: org.name,
                address: org.address || "",
                taxCode: org.taxCode || ""
            });
        } else {
            setEditingOrg(null);
            setFormData({
                code: "",
                name: "",
                address: "",
                taxCode: ""
            });
        }
        setShowModal(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        let success = false;

        const payload = {
            ...formData,
            companyType: "BUYER",
            countryCode: "VN",
            metadata: {}
        };

        if (editingOrg) {
            success = await updateOrganization(editingOrg.id, payload as any);
        } else {
            success = await addOrganization(payload as any);
        }

        if (success) {
            setShowModal(false);
        }
    };

    return (
        <main className="animate-in fade-in duration-500 p-6 min-h-screen bg-bg-primary text-[#F8FAFC]">
            <div className="flex justify-between items-end mb-10">
                <div>
                    <h1 className="text-3xl font-black text-[#F8FAFC] tracking-tight uppercase">Quản lý Tổ chức</h1>
                    <p className="text-sm text-[#94A3B8] mt-1 font-medium italic">THIẾT LẬP THỰC THỂ PHÁP NHÂN VÀ THÔNG TIN CÔNG TY</p>
                </div>
                <button
                    onClick={() => handleOpenModal()}
                    className="flex items-center gap-2 bg-[#3B82F6] text-white px-8 py-3.5 rounded-[20px] font-black uppercase tracking-widest text-[11px] shadow-xl shadow-[#3B82F6]/20 hover:scale-[1.02] transition-transform active:scale-95"
                >
                    <Plus size={18} /> Thêm Tổ chức
                </button>
            </div>

            <div className="bg-[#161922] rounded-4xl border border-[rgba(148,163,184,0.1)] shadow-xl shadow-[#3B82F6]/5 overflow-hidden">
                <div className="p-8 bg-[#0F1117] border-b border-[rgba(148,163,184,0.1)] flex justify-between items-center">
                    <div className="flex items-center gap-4">
                        <div className="text-[10px] font-black text-[#64748B] uppercase tracking-widest border-r border-[rgba(148,163,184,0.1)] pr-4">Entity Directory</div>
                        <div className="text-[10px] font-black text-[#3B82F6] bg-[#3B82F6]/10 px-3 py-1 rounded-full">{organizations?.length || 0} Entities</div>
                    </div>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#64748B]" size={14} />
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="Tìm kiếm mã hoặc tên..."
                            className="pl-10 pr-4 py-2 bg-[#0F1117] border border-[rgba(148,163,184,0.1)] rounded-xl text-xs font-bold focus:ring-2 focus:ring-[#3B82F6]/20 w-64 outline-none text-[#F8FAFC] placeholder:text-[#64748B]"
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="erp-table text-xs">
                        <thead>
                            <tr className="bg-[#0F1117]">
                                <th>Mã & Tên Tổ chức</th>
                                <th>Địa chỉ trụ sở</th>
                                <th>Mã số thuế</th>
                                <th className="text-center">Thao tác</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredOrganizations?.map((org: Organization) => (
                                <tr key={org.id} className="hover:bg-[#0F1117]/50 transition-colors border-b border-[rgba(148,163,184,0.1)]">
                                    <td className="p-5">
                                        <div className="flex items-center gap-4">
                                            <div className="h-12 w-12 rounded-2xl bg-[#0F1117] flex items-center justify-center font-black text-[#3B82F6] shadow-sm transition-transform hover:rotate-12">
                                                <Building2 size={20} />
                                            </div>
                                            <div>
                                                <div className="text-sm font-black text-[#F8FAFC] leading-tight">{org.name}</div>
                                                <div className="text-[10px] text-[#3B82F6] font-black mt-1 bg-[#3B82F6]/10 px-2 py-0.5 rounded w-fit uppercase">
                                                    CODE: {org.code}
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td>
                                        <div className="flex items-center gap-2 max-w-xs">
                                            <MapPin size={14} className="text-[#64748B] shrink-0" />
                                            <span className="font-bold text-[#94A3B8] truncate">{org.address || "N/A"}</span>
                                        </div>
                                    </td>
                                    <td>
                                        <div className="flex items-center gap-2 font-black text-[#F8FAFC]">
                                            <Hash size={14} className="text-[#3B82F6]" />
                                            {org.taxCode || "N/A"}
                                        </div>
                                    </td>
                                    <td className="text-center">
                                        <div className="flex justify-center gap-3">
                                            <button
                                                onClick={() => handleOpenModal(org)}
                                                className="h-9 w-9 flex items-center justify-center bg-[#161922] border border-[rgba(148,163,184,0.1)] text-[#64748B] hover:text-[#3B82F6] hover:border-[#3B82F6]/30 rounded-xl transition-all shadow-sm"
                                            >
                                                <Edit2 size={14} />
                                            </button>
                                            <button
                                                onClick={() => removeOrganization(org.id)}
                                                className="h-9 w-9 flex items-center justify-center bg-[#161922] border border-[rgba(148,163,184,0.1)] text-[#64748B] hover:text-red-500 hover:border-red-500/30 rounded-xl transition-all shadow-sm"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0F1117]/80 backdrop-blur-sm p-4 animate-in fade-in zoom-in duration-300">
                    <div className="bg-[#161922] rounded-[40px] w-full max-w-xl overflow-hidden shadow-2xl border border-[rgba(148,163,184,0.1)]">
                        <div className="p-10">
                            <h2 className="text-2xl font-black text-[#F8FAFC] uppercase mb-2 tracking-tight">
                                {editingOrg ? "Cập nhật Tổ chức" : "Thêm Tổ chức mới"}
                            </h2>
                            <p className="text-xs text-[#64748B] font-bold uppercase tracking-widest mb-10">ENTITY MANAGEMENT SYSTEM</p>

                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div className="grid grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-[#64748B] uppercase tracking-widest ml-1">Mã Tổ chức</label>
                                        <input
                                            required
                                            value={formData.code}
                                            onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                                            type="text"
                                            placeholder="VD: PP-GLOBAL"
                                            className="w-full bg-[#0F1117] border-2 border-[rgba(148,163,184,0.1)] rounded-2xl px-5 py-3 text-sm font-bold focus:border-[#3B82F6]/20 focus:bg-[#0F1117] outline-none transition-all placeholder:text-[#64748B] text-[#F8FAFC]"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-[#64748B] uppercase tracking-widest ml-1">Tên Tổ chức</label>
                                        <input
                                            required
                                            value={formData.name}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                            type="text"
                                            placeholder="VD: Công ty TNHH ProcurePro"
                                            className="w-full bg-[#0F1117] border-2 border-[rgba(148,163,184,0.1)] rounded-2xl px-5 py-3 text-sm font-bold focus:border-[#3B82F6]/20 focus:bg-[#0F1117] outline-none transition-all placeholder:text-[#64748B] text-[#F8FAFC]"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-[#64748B] uppercase tracking-widest ml-1">Địa chỉ trụ sở</label>
                                    <input
                                        value={formData.address}
                                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                        type="text"
                                        placeholder="Số nhà, Tên đường, Quận/Huyện, Tỉnh/Thành phố"
                                        className="w-full bg-[#0F1117] border-2 border-[rgba(148,163,184,0.1)] rounded-2xl px-5 py-3 text-sm font-bold focus:border-[#3B82F6]/20 focus:bg-[#0F1117] outline-none transition-all placeholder:text-[#64748B] text-[#F8FAFC]"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-[#64748B] uppercase tracking-widest ml-1">Mã số thuế</label>
                                    <input
                                        value={formData.taxCode}
                                        onChange={(e) => setFormData({ ...formData, taxCode: e.target.value })}
                                        type="text"
                                        placeholder="VD: 0101234567"
                                        className="w-full bg-[#0F1117] border-2 border-[rgba(148,163,184,0.1)] rounded-2xl px-5 py-3 text-sm font-bold focus:border-[#3B82F6]/20 focus:bg-[#0F1117] outline-none transition-all placeholder:text-[#64748B] text-[#F8FAFC]"
                                    />
                                </div>

                                <div className="flex gap-4 pt-6">
                                    <button
                                        type="button"
                                        onClick={() => setShowModal(false)}
                                        className="flex-1 px-8 py-4 bg-[#0F1117] rounded-3xl font-black text-[#64748B] uppercase tracking-widest hover:bg-[#1A1D23] transition-colors"
                                    >
                                        Hủy
                                    </button>
                                    <button
                                        type="submit"
                                        className="flex-1 px-8 py-4 bg-[#3B82F6] text-white rounded-3xl font-black uppercase tracking-widest shadow-xl shadow-[#3B82F6]/20 hover:scale-[1.02] transition-all"
                                    >
                                        {editingOrg ? "Lưu thay đổi" : "Tạo Tổ chức"}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </main>
    );
}
