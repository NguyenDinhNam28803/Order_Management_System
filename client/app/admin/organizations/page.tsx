"use client";

import React, { useState } from "react";
import { Plus, Edit2, Trash2, Search, MapPin, Hash, Building2 } from "lucide-react";
import { useProcurement } from "../../context/ProcurementContext";
import { Organization, CreateOrganizationPayload, UpdateOrganizationPayload } from "@/app/types/api-types";
import PageHeader from "../../components/shared/PageHeader";

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
            countryCode: "VN"
        };

        if (editingOrg) {
            success = await updateOrganization(editingOrg.id, payload as UpdateOrganizationPayload);
        } else {
            success = await addOrganization(payload as CreateOrganizationPayload);
        }

        if (success) {
            setShowModal(false);
        }
    };

    return (
        <div className="animate-in fade-in duration-500">
            <PageHeader
                icon={Building2}
                iconColor="blue"
                title="Quản lý Tổ chức"
                subtitle="Thiết lập thực thể pháp nhân và thông tin công ty."
                actions={
                    <button
                        onClick={() => handleOpenModal()}
                        className="btn-primary flex items-center gap-2"
                    >
                        <Plus size={16} /> Thêm Tổ chức
                    </button>
                }
            />

            <div className="bg-[#F1F5F9] rounded-xl border border-slate-200 shadow-xl shadow-[#2563EB]/5 overflow-hidden">
                <div className="p-8 bg-[#FFFFFF] border-b border-slate-200 flex justify-between items-center">
                    <div className="flex items-center gap-4">
                        <div className="text-[10px] font-black text-slate-900 uppercase tracking-widest border-r border-slate-200 pr-4">Entity Directory</div>
                        <div className="text-[10px] font-black text-[#2563EB] bg-[#2563EB]/10 px-3 py-1 rounded-full">{organizations?.length || 0} Entities</div>
                    </div>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8]" size={14} />
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="Tìm kiếm mã hoặc tên..."
                            className="pl-10 pr-4 py-2 bg-[#FFFFFF] border border-slate-200 rounded-xl text-xs font-bold focus:ring-2 focus:ring-[#2563EB]/20 w-64 outline-none text-slate-900 placeholder:text-slate-400"
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="erp-table text-xs">
                        <thead>
                            <tr>
                                <th>Mã & Tên Tổ chức</th>
                                <th>Địa chỉ trụ sở</th>
                                <th>Mã số thuế</th>
                                <th className="text-center">Thao tác</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredOrganizations?.map((org: Organization) => (
                                <tr key={org.id} className="hover:bg-[#FFFFFF]/50 transition-colors border-b border-slate-200">
                                    <td className="p-5">
                                        <div className="flex items-center gap-4">
                                            <div className="h-12 w-12 rounded-2xl bg-[#FFFFFF] flex items-center justify-center font-black text-[#2563EB] shadow-sm transition-transform hover:rotate-12">
                                                <Building2 size={20} />
                                            </div>
                                            <div>
                                                <div className="text-sm font-black text-slate-900 leading-tight">{org.name}</div>
                                                <div className="text-[10px] text-[#2563EB] font-black mt-1 bg-[#2563EB]/10 px-2 py-0.5 rounded w-fit uppercase">
                                                    CODE: {org.code}
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td>
                                        <div className="flex items-center gap-2 max-w-xs">
                                            <MapPin size={14} className="text-slate-900 shrink-0" />
                                            <span className="font-bold text-slate-900 truncate">{org.address || "N/A"}</span>
                                        </div>
                                    </td>
                                    <td>
                                        <div className="flex items-center gap-2 font-black text-slate-900">
                                            <Hash size={14} className="text-[#2563EB]" />
                                            {org.taxCode || "N/A"}
                                        </div>
                                    </td>
                                    <td className="text-center">
                                        <div className="flex justify-center gap-3">
                                            <button
                                                onClick={() => handleOpenModal(org)}
                                                className="h-9 w-9 flex items-center justify-center bg-[#F1F5F9] border border-slate-200 text-slate-900 hover:text-[#2563EB] hover:border-[#2563EB]/30 rounded-xl transition-all shadow-sm"
                                            >
                                                <Edit2 size={14} />
                                            </button>
                                            <button
                                                onClick={() => removeOrganization(org.id)}
                                                className="h-9 w-9 flex items-center justify-center bg-[#F1F5F9] border border-slate-200 text-slate-900 hover:text-red-500 hover:border-red-500/30 rounded-xl transition-all shadow-sm"
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
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#FFFFFF]/80 backdrop-blur-sm p-4 animate-in fade-in zoom-in duration-300">
                    <div className="bg-[#F1F5F9] rounded-xl w-full max-w-xl overflow-hidden shadow-2xl border border-slate-200">
                        <div className="p-6">
                            <h2 className="text-lg font-bold text-slate-900 mb-2">
                                {editingOrg ? "Cập nhật Tổ chức" : "Thêm Tổ chức mới"}
                            </h2>
                            <p className="text-xs text-slate-900 font-bold uppercase tracking-widest mb-10">ENTITY MANAGEMENT SYSTEM</p>

                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div className="form-grid">
                                    <div className="form-group">
                                        <label className="erp-label">Mã Tổ chức</label>
                                        <input
                                            required
                                            value={formData.code}
                                            onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                                            type="text"
                                            placeholder="VD: PP-GLOBAL"
                                            className="erp-input"
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label className="erp-label">Tên Tổ chức</label>
                                        <input
                                            required
                                            value={formData.name}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                            type="text"
                                            placeholder="VD: Công ty TNHH ProcurePro"
                                            className="erp-input"
                                        />
                                    </div>
                                </div>

                                <div className="form-group">
                                    <label className="erp-label">Địa chỉ trụ sở</label>
                                    <input
                                        required
                                        value={formData.address}
                                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                        type="text"
                                        placeholder="Số 123, Đường ABC, Quận XYZ..."
                                        className="erp-input"
                                    />
                                </div>

                                <div className="form-group">
                                    <label className="erp-label">Mã số thuế</label>
                                    <input
                                        required
                                        value={formData.taxCode}
                                        onChange={(e) => setFormData({ ...formData, taxCode: e.target.value })}
                                        type="text"
                                        placeholder="0123456789"
                                        className="erp-input"
                                    />
                                </div>

                                <div className="flex gap-4 pt-6">
                                    <button
                                        type="button"
                                        onClick={() => setShowModal(false)}
                                        className="btn-secondary flex-1 py-4 uppercase tracking-widest text-xs"
                                    >
                                        Hủy bỏ
                                    </button>
                                    <button
                                        type="submit"
                                        className="btn-primary flex-1 py-4 uppercase tracking-widest text-xs"
                                    >
                                        {editingOrg ? "Lưu thay đổi" : "Khởi tạo Tổ chức"}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

