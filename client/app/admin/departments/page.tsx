"use client";

import React, { useState } from "react";
import { Building2, Plus, Edit2, Trash2, Users, Search } from "lucide-react";
import { useProcurement, Department, User } from "../../context/ProcurementContext";
import { Organization } from "@/app/types/api-types";

export default function DepartmentsPage() {
    const { departments, users, addDept, updateDept, removeDept, organizations } = useProcurement();
    const [showModal, setShowModal] = useState(false);
    const [editingDept, setEditingDept] = useState<Department | null>(null);
    const [formData, setFormData] = useState({
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
                orgId: organizations?.[0]?.id || "",
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
        <main className="animate-in fade-in duration-500">
            <div className="flex justify-between items-end mb-10">
                <div>
                    <h1 className="text-3xl font-black text-erp-navy tracking-tight uppercase">Quản lý Phòng ban</h1>
                    <p className="text-sm text-slate-500 mt-1 font-medium italic">THIẾT LẬP CƠ CẤU TỔ CHỨC VÀ NGÂN SÁCH PHÒNG BAN</p>
                </div>
                <button
                    onClick={() => handleOpenModal()}
                    className="flex items-center gap-2 bg-erp-navy text-white px-8 py-3.5 rounded-[20px] font-black uppercase tracking-widest text-[11px] shadow-xl shadow-erp-navy/20 hover:scale-[1.02] transition-transform active:scale-95"
                >
                    <Plus size={18} /> Thêm phòng ban
                </button>
            </div>

            <div className="bg-white rounded-4xl border border-slate-100 shadow-xl shadow-erp-navy/5 overflow-hidden">
                <div className="p-8 bg-slate-50/20 border-b border-slate-50 flex justify-between items-center">
                    <div className="flex items-center gap-4">
                        <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-r border-slate-200 pr-4">Cơ cấu Tổ chức (Structure)</div>
                        <div className="text-[10px] font-black text-erp-blue bg-blue-50 px-3 py-1 rounded-full">{filteredDepartments?.length || 0} Phòng ban</div>
                    </div>
                    <div className="flex items-center gap-3">
                        <select
                            value={filterOrgId}
                            onChange={(e) => setFilterOrgId(e.target.value)}
                            className="bg-slate-100/50 border-none rounded-xl text-xs font-bold focus:ring-2 focus:ring-erp-blue/20 py-2 px-4 outline-none"
                        >
                            <option value="">Tất cả tổ chức</option>
                            {organizations?.map((org: Organization) => (
                                <option key={org.id} value={org.id}>{org.name}</option>
                            ))}
                        </select>
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                placeholder="Tìm kiếm phòng ban..."
                                className="pl-10 pr-4 py-2 bg-slate-100/50 border-none rounded-xl text-xs font-bold focus:ring-2 focus:ring-erp-blue/20 w-64 outline-none"
                            />
                        </div>
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="erp-table text-xs">
                        <thead>
                            <tr className="bg-slate-50/30">
                                <th>Mã & Tên Phòng ban</th>
                                <th>Trưởng bộ phận</th>
                                <th className="text-center text-slate-400">Trạng thái</th>
                                <th className="text-center">Nhân sự</th>
                                <th className="text-center">Thao tác</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredDepartments?.map((dept: Department) => (
                                <tr key={dept.id} className="hover:bg-slate-50/50 transition-colors border-b border-slate-50">
                                    <td className="p-5">
                                        <div className="flex items-center gap-4">
                                            <div className="h-12 w-12 rounded-2xl bg-slate-100 flex items-center justify-center font-black text-erp-navy shadow-sm transition-transform hover:rotate-12">
                                                <Building2 size={20} />
                                            </div>
                                            <div>
                                                <div className="text-sm font-black text-erp-navy leading-tight">{dept.name}</div>
                                                <div className="text-[10px] text-slate-400 font-bold flex items-center gap-1.5 mt-1 tracking-tight">
                                                    ID: {dept.code} • {dept.organization?.name}
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td>
                                        <div className="flex items-center gap-2">
                                            <div className="h-6 w-6 rounded-full bg-erp-navy/10 flex items-center justify-center text-[8px] font-black text-erp-navy">
                                                {dept.head?.fullName?.substring(0, 2).toUpperCase() || "NA"}
                                            </div>
                                            <span className="font-bold text-slate-600">{dept.head?.fullName || "Chưa chỉ định"}</span>
                                        </div>
                                    </td>
                                    <td className="text-center font-bold text-green-500 uppercase tracking-widest text-[10px]">Đang hoạt động</td>
                                    <td className="text-center">
                                        <div className="flex items-center justify-center gap-1 text-erp-blue font-black">
                                            <Users size={12} />
                                            <span>{dept._count?.users || 0} nhân viên</span>
                                        </div>
                                    </td>
                                    <td className="text-center">
                                        <div className="flex justify-center gap-3">
                                            <button
                                                onClick={() => handleOpenModal(dept)}
                                                className="h-9 w-9 flex items-center justify-center bg-white border border-slate-100 text-slate-400 hover:text-erp-blue hover:border-erp-blue/30 rounded-xl transition-all shadow-sm"
                                            >
                                                <Edit2 size={14} />
                                            </button>
                                            <button
                                                onClick={() => removeDept(dept.id)}
                                                className="h-9 w-9 flex items-center justify-center bg-white border border-slate-100 text-slate-400 hover:text-red-500 hover:border-red-100 rounded-xl transition-all shadow-sm"
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
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-erp-navy/40 backdrop-blur-sm p-4 animate-in fade-in zoom-in duration-300">
                    <div className="bg-white rounded-[40px] w-full max-w-xl overflow-hidden shadow-2xl border border-white/20">
                        <div className="p-10">
                            <h2 className="text-2xl font-black text-erp-navy uppercase mb-2 tracking-tight">
                                {editingDept ? "Cập nhật Phòng ban" : "Thêm Phòng ban mới"}
                            </h2>
                            <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mb-10">CẤU CƠ TỔ CHỨC HỆ THỐNG</p>

                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div className="grid grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Mã phòng ban</label>
                                        <input
                                            value={formData.code}
                                            onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                                            type="text"
                                            placeholder="VD: IT-DEPT"
                                            className="w-full bg-slate-50 border-2 border-slate-50 rounded-2xl px-5 py-3 text-sm font-bold focus:border-erp-blue/20 focus:bg-white outline-none transition-all placeholder:text-slate-300"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Tên phòng ban</label>
                                        <input
                                            required
                                            value={formData.name}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                            type="text"
                                            placeholder="VD: Phòng Công nghệ Thông tin"
                                            className="w-full bg-slate-50 border-2 border-slate-50 rounded-2xl px-5 py-3 text-sm font-bold focus:border-erp-blue/20 focus:bg-white outline-none transition-all placeholder:text-slate-300"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Thuộc Tổ chức/Công ty</label>
                                    <select
                                        required
                                        value={formData.orgId}
                                        onChange={(e) => setFormData({ ...formData, orgId: e.target.value })}
                                        className="w-full bg-slate-50 border-2 border-slate-50 rounded-2xl px-5 py-3 text-sm font-bold focus:border-erp-blue/20 focus:bg-white outline-none transition-all"
                                    >
                                        <option value="">Chọn tổ chức</option>
                                        {organizations?.map((org: Organization) => (
                                            <option key={org.id} value={org.id}>{org.name}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Ngân sách hàng năm (Budget)</label>
                                    <div className="relative">
                                        <input
                                            required
                                            value={formData.budgetAnnual}
                                            onChange={(e) => setFormData({ ...formData, budgetAnnual: Number(e.target.value) })}
                                            type="number"
                                            placeholder="0"
                                            className="w-full bg-slate-50 border-2 border-slate-50 rounded-2xl px-5 py-3 text-sm font-bold focus:border-erp-blue/20 focus:bg-white outline-none transition-all placeholder:text-slate-300"
                                        />
                                        <span className="absolute right-5 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-400">VND</span>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Trưởng bộ phận</label>
                                    <select
                                        value={formData.headUserId}
                                        onChange={(e) => setFormData({ ...formData, headUserId: e.target.value })}
                                        className="w-full bg-slate-50 border-2 border-slate-50 rounded-2xl px-5 py-3 text-sm font-bold focus:border-erp-blue/20 focus:bg-white outline-none transition-all"
                                    >
                                        <option value="">Chưa chỉ định</option>
                                        {users?.map((u: User) => (
                                            <option key={u.id} value={u.id}>{u.fullName} ({u.email})</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="flex gap-4 pt-6">
                                    <button
                                        type="button"
                                        onClick={() => setShowModal(false)}
                                        className="flex-1 px-8 py-4 bg-slate-100 rounded-3xl font-black text-slate-400 uppercase tracking-widest hover:bg-slate-200 transition-colors"
                                    >
                                        Hủy
                                    </button>
                                    <button
                                        type="submit"
                                        className="flex-1 px-8 py-4 bg-erp-navy text-white rounded-3xl font-black uppercase tracking-widest shadow-xl shadow-erp-navy/20 hover:scale-[1.02] transition-all"
                                    >
                                        {editingDept ? "Lưu thay đổi" : "Tạo phòng ban"}
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
