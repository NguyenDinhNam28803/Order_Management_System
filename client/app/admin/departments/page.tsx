"use client";

import React, { useState } from "react";
import { Building2, Plus, Edit2, Trash2, Users, Search } from "lucide-react";
import { useProcurement, Department, User } from "../../context/ProcurementContext";
import { Organization, CreateDepartmentPayload, UpdateDepartmentPayload } from "@/app/types/api-types";

export default function DepartmentsPage() {
    const { departments, users, addDept, updateDept, removeDept, organizations, currentUser } = useProcurement();
    const [showModal, setShowModal] = useState(false);
    const [editingDept, setEditingDept] = useState<Department | null>(null);
    const [formData, setFormData] = useState<CreateDepartmentPayload>({
        orgId: "",
        code: "",
        name: "",
        headUserId: "",
        budgetAnnual: 0,
    });

    const [searchTerm, setSearchTerm] = useState("");
    const [filterOrgId, setFilterOrgId] = useState("");

    const filteredDepartments = departments?.filter((dept: Department) => {
        const matchesSearch =
            dept.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            dept.code.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesOrg = filterOrgId === "" || dept.orgId === filterOrgId;
        return matchesSearch && matchesOrg;
    });

    const handleOpenModal = (dept?: Department) => {
        if (dept) {
            setEditingDept(dept);
            setFormData({
                orgId: dept.orgId || "",
                code: dept.code,
                name: dept.name,
                headUserId: dept.headUserId || "",
                budgetAnnual: dept.budgetAnnual || 0,
            });
        } else {
            setEditingDept(null);
            setFormData({
                orgId: currentUser?.orgId || organizations?.[0]?.id || "",
                code: "",
                name: "",
                headUserId: "",
                budgetAnnual: 0,
            });
        }
        setShowModal(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const data = {
            ...formData,
        };

        let success = false;
        if (editingDept) {
            success = await updateDept(editingDept.id, data);
        } else {
            success = await addDept(data);
        }

        if (success) {
            setShowModal(false);
        }
    };

    return (
        <div className="animate-in fade-in duration-500">
            <div className="flex justify-between items-end mb-10">
                <div>
                    <h1 className="text-3xl font-black text-[#000000] tracking-tight uppercase">Quản lý Phòng ban</h1>
                    <p className="text-sm text-[#000000] mt-1 font-medium italic">THIẾT LẬP CƠ CẤU TỔ CHỨC VÀ NGÂN SÁCH PHÒNG BAN</p>
                </div>
                <button
                    onClick={() => handleOpenModal()}
                    className="flex items-center gap-2 bg-[#B4533A] text-[#000000] px-8 py-3.5 rounded-[20px] font-black uppercase tracking-widest text-[11px] shadow-xl shadow-[#B4533A]/20 hover:scale-[1.02] transition-transform active:scale-95"
                >
                    <Plus size={18} /> Thêm phòng ban
                </button>
            </div>

            <div className="bg-[#FAF8F5] rounded-4xl border border-[rgba(148,163,184,0.1)] shadow-xl shadow-[#B4533A]/5 overflow-hidden">
                <div className="p-8 bg-[#FFFFFF] border-b border-[rgba(148,163,184,0.1)] flex justify-between items-center">
                    <div className="flex items-center gap-4">
                        <div className="text-[10px] font-black text-[#000000] uppercase tracking-widest border-r border-[rgba(148,163,184,0.1)] pr-4">Cơ cấu Tổ chức (Structure)</div>
                        <div className="text-[10px] font-black text-[#B4533A] bg-[#B4533A]/10 px-3 py-1 rounded-full border border-[#B4533A]/20">{filteredDepartments?.length || 0} Phòng ban</div>
                    </div>
                    <div className="flex items-center gap-3">
                        <select
                            value={filterOrgId}
                            onChange={(e) => setFilterOrgId(e.target.value)}
                            className="bg-[#FFFFFF] border border-[rgba(148,163,184,0.1)] rounded-xl text-xs font-bold text-[#000000] focus:ring-2 focus:ring-[#B4533A]/20 py-2 px-4 outline-none"
                        >
                            <option value="">Tất cả tổ chức</option>
                            {organizations?.map((org: Organization) => (
                                <option key={org.id} value={org.id}>{org.name}</option>
                            ))}
                        </select>
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#000000]" size={14} />
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                placeholder="Tìm kiếm phòng ban..."
                                className="pl-10 pr-4 py-2 bg-[#FFFFFF] border border-[rgba(148,163,184,0.1)] rounded-xl text-xs font-bold text-[#000000] placeholder:text-[#000000] focus:ring-2 focus:ring-[#B4533A]/20 w-64 outline-none"
                            />
                        </div>
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="erp-table text-xs">
                        <thead>
                            <tr className="bg-[#FFFFFF]">
                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-[#000000] text-left">Mã & Tên Phòng ban</th>
                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-[#000000] text-left">Trưởng bộ phận</th>
                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-[#000000] text-center">Trạng thái</th>
                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-[#000000] text-center">Nhân sự</th>
                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-[#000000] text-center">Thao tác</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[rgba(148,163,184,0.1)]">
                            {filteredDepartments?.map((dept: Department) => (
                                <tr key={dept.id} className="hover:bg-[#FFFFFF]/30 transition-colors">
                                    <td className="p-5">
                                        <div className="flex items-center gap-4">
                                            <div className="h-12 w-12 rounded-2xl bg-[#FFFFFF] flex items-center justify-center font-black text-[#B4533A] shadow-sm transition-transform hover:rotate-12 border border-[rgba(148,163,184,0.1)]">
                                                <Building2 size={20} />
                                            </div>
                                            <div>
                                                <div className="text-sm font-black text-[#000000] leading-tight">{dept.name}</div>
                                                <div className="text-[10px] text-[#000000] font-bold flex items-center gap-1.5 mt-1 tracking-tight">
                                                    ID: {dept.code} • {dept.organization?.name}
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="p-5">
                                        <div className="flex items-center gap-2">
                                            <div className="h-6 w-6 rounded-full bg-[#B4533A]/10 flex items-center justify-center text-[8px] font-black text-[#B4533A]">
                                                {dept.head?.fullName?.substring(0, 2).toUpperCase() || "NA"}
                                            </div>
                                            <span className="font-bold text-[#000000]">{dept.head?.fullName || "Chưa chỉ định"}</span>
                                        </div>
                                    </td>
                                    <td className="p-5 text-center font-bold text-black uppercase tracking-widest text-[10px]">Đang hoạt động</td>
                                    <td className="p-5 text-center">
                                        <div className="flex items-center justify-center gap-1 text-[#B4533A] font-black">
                                            <Users size={12} />
                                            <span>{dept._count?.users || 0} nhân viên</span>
                                        </div>
                                    </td>
                                    <td className="p-5 text-center">
                                        <div className="flex justify-center gap-3">
                                            <button
                                                onClick={() => handleOpenModal(dept)}
                                                className="h-9 w-9 flex items-center justify-center bg-[#FFFFFF] border border-[rgba(148,163,184,0.1)] text-[#000000] hover:text-[#B4533A] hover:border-[#B4533A]/30 rounded-xl transition-all shadow-sm"
                                            >
                                                <Edit2 size={14} />
                                            </button>
                                            <button
                                                onClick={() => {
                                                    if(confirm("Bạn có chắc chắn muốn xóa phòng ban này?")) {
                                                        removeDept(dept.id);
                                                    }
                                                }}
                                                className="h-9 w-9 flex items-center justify-center bg-[#FFFFFF] border border-[rgba(148,163,184,0.1)] text-[#000000] hover:text-black hover:border-rose-400/30 rounded-xl transition-all shadow-sm"
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
                    <div className="bg-[#FAF8F5] rounded-[40px] w-full max-w-xl overflow-hidden shadow-2xl border border-[rgba(148,163,184,0.1)]">
                        <div className="p-10">
                            <h2 className="text-2xl font-black text-[#000000] uppercase mb-2 tracking-tight">
                                {editingDept ? "Cập nhật Phòng ban" : "Thêm Phòng ban mới"}
                            </h2>
                            <p className="text-xs text-[#000000] font-bold uppercase tracking-widest mb-10">CẤU CƠ TỔ CHỨC HỆ THỐNG</p>

                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div className="form-grid">
                                    <div className="form-group">
                                        <label className="erp-label">Mã phòng ban</label>
                                        <input
                                            value={formData.code}
                                            onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                                            type="text"
                                            placeholder="VD: IT-DEPT"
                                            className="erp-input"
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label className="erp-label">Tên phòng ban</label>
                                        <input
                                            required
                                            value={formData.name}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                            type="text"
                                            placeholder="VD: Phòng Công nghệ Thông tin"
                                            className="erp-input"
                                        />
                                    </div>
                                </div>

                                <div className="form-group">
                                    <label className="erp-label">Thuộc Tổ chức/Công ty</label>
                                    <select
                                        required
                                        value={formData.orgId}
                                        onChange={(e) => setFormData({ ...formData, orgId: e.target.value })}
                                        className="erp-input"
                                    >
                                        <option value="">Chọn tổ chức</option>
                                        {organizations?.map((org: Organization) => (
                                            <option key={org.id} value={org.id}>{org.name}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="form-grid">
                                    <div className="form-group">
                                        <label className="erp-label">Ngân sách hàng năm (Budget)</label>
                                        <div className="relative">
                                            <input
                                                required
                                                value={formData.budgetAnnual}
                                                onChange={(e) => setFormData({ ...formData, budgetAnnual: Number(e.target.value) })}
                                                type="number"
                                                placeholder="0"
                                                className="erp-input pr-12 font-bold text-[#B4533A]"
                                            />
                                            <span className="absolute right-5 top-1/2 -translate-y-1/2 text-[10px] font-black text-[#000000]">VND</span>
                                        </div>
                                    </div>

                                    <div className="form-group">
                                        <label className="erp-label">Trưởng bộ phận</label>
                                        <select
                                            value={formData.headUserId}
                                            onChange={(e) => setFormData({ ...formData, headUserId: e.target.value })}
                                            className="erp-input"
                                        >
                                            <option value="">Chưa chỉ định</option>
                                            {users?.filter((u: User) => editingDept && u.deptId === editingDept.id).map((u: User) => (
                                                <option key={u.id} value={u.id}>{u.fullName || u.name} ({u.email})</option>
                                            ))}
                                        </select>
                                    </div>
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
                                        {editingDept ? "Lưu thay đổi" : "Khởi tạo Phòng ban"}
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

