"use client";

import React, { useState } from "react";
import { Building2, Plus, Edit2, Trash2, Users, Search } from "lucide-react";
import { useProcurement, Department, User } from "../../context/ProcurementContext";
import { Organization, CreateDepartmentPayload, UpdateDepartmentPayload } from "@/app/types/api-types";
import ConfirmDialog from "../../components/shared/ConfirmDialog";

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
    const [confirmState, setConfirmState] = useState<{ open: boolean; title: string; message: string; onConfirm: () => void }>({ open: false, title: "", message: "", onConfirm: () => {} });

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
            <ConfirmDialog
                open={confirmState.open}
                title={confirmState.title}
                message={confirmState.message}
                onConfirm={confirmState.onConfirm}
                onCancel={() => setConfirmState(s => ({ ...s, open: false }))}
            />
            <div className="flex justify-between items-end mb-10">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight uppercase">Quản lý Phòng ban</h1>
                    <p className="text-sm text-slate-900 mt-1 font-medium italic">THIẾT LẬP CƠ CẤU TỔ CHỨC VÀ NGÂN SÁCH PHÒNG BAN</p>
                </div>
                <button
                    onClick={() => handleOpenModal()}
                    className="flex items-center gap-2 bg-[#2563EB] text-white px-8 py-3.5 rounded-xl font-black uppercase tracking-widest text-[11px] shadow-xl shadow-[#2563EB]/20 hover:scale-[1.02] transition-transform active:scale-95"
                >
                    <Plus size={18} /> Thêm phòng ban
                </button>
            </div>

            <div className="bg-[#F1F5F9] rounded-4xl border border-[rgba(148,163,184,0.1)] shadow-xl shadow-[#2563EB]/5 overflow-hidden">
                <div className="p-8 bg-[#FFFFFF] border-b border-[rgba(148,163,184,0.1)] flex justify-between items-center">
                    <div className="flex items-center gap-4">
                        <div className="text-[10px] font-black text-slate-900 uppercase tracking-widest border-r border-[rgba(148,163,184,0.1)] pr-4">Cơ cấu Tổ chức (Structure)</div>
                        <div className="text-[10px] font-black text-[#2563EB] bg-[#2563EB]/10 px-3 py-1 rounded-full border border-[#2563EB]/20">{filteredDepartments?.length || 0} Phòng ban</div>
                    </div>
                    <div className="flex items-center gap-3">
                        <select
                            value={filterOrgId}
                            onChange={(e) => setFilterOrgId(e.target.value)}
                            className="bg-[#FFFFFF] border border-[rgba(148,163,184,0.1)] rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-[#2563EB]/20 py-2 px-4 outline-none"
                        >
                            <option value="">Tất cả tổ chức</option>
                            {organizations?.map((org: Organization) => (
                                <option key={org.id} value={org.id}>{org.name}</option>
                            ))}
                        </select>
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-900" size={14} />
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                placeholder="Tìm kiếm phòng ban..."
                                className="pl-10 pr-4 py-2 bg-[#FFFFFF] border border-[rgba(148,163,184,0.1)] rounded-xl text-xs font-bold text-slate-900 placeholder:text-slate-900 focus:ring-2 focus:ring-[#2563EB]/20 w-64 outline-none"
                            />
                        </div>
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="erp-table text-xs">
                        <thead>
                            <tr>
                                <th className="px-6 py-4 text-left">Mã & Tên Phòng ban</th>
                                <th className="px-6 py-4 text-left">Trưởng bộ phận</th>
                                <th className="px-6 py-4 text-center">Trạng thái</th>
                                <th className="px-6 py-4 text-center">Nhân sự</th>
                                <th className="px-6 py-4 text-center">Thao tác</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[rgba(148,163,184,0.1)]">
                            {(!filteredDepartments || filteredDepartments.length === 0) && (
                                <tr>
                                    <td colSpan={5} className="py-16 text-center text-slate-400">
                                        <svg className="mx-auto mb-2" xmlns="http://www.w3.org/2000/svg" width="28" height="28" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 13.5h3.86a2.25 2.25 0 0 1 2.012 1.244l.256.512a2.25 2.25 0 0 0 2.013 1.244h3.218a2.25 2.25 0 0 0 2.013-1.244l.256-.512a2.25 2.25 0 0 1 2.013-1.244h3.859m-19.5.338V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18v-4.162c0-.224-.034-.447-.1-.661L19.24 5.338a2.25 2.25 0 0 0-2.15-1.588H6.911a2.25 2.25 0 0 0-2.15 1.588L2.35 13.177a2.25 2.25 0 0 0-.1.661Z" /></svg>
                                        <p className="text-sm font-semibold">Chưa có phòng ban nào</p>
                                        <p className="text-xs mt-1">Nhấn &ldquo;Thêm phòng ban&rdquo; để bắt đầu</p>
                                    </td>
                                </tr>
                            )}
                            {filteredDepartments?.map((dept: Department) => (
                                <tr key={dept.id} className="hover:bg-[#FFFFFF]/30 transition-colors">
                                    <td className="p-5">
                                        <div className="flex items-center gap-4">
                                            <div className="h-12 w-12 rounded-xl bg-[#FFFFFF] flex items-center justify-center font-black text-[#2563EB] shadow-sm transition-transform hover:rotate-12 border border-[rgba(148,163,184,0.1)]">
                                                <Building2 size={20} />
                                            </div>
                                            <div>
                                                <div className="text-sm font-black text-slate-900 leading-tight">{dept.name}</div>
                                                <div className="text-[10px] text-slate-900 font-bold flex items-center gap-1.5 mt-1 tracking-tight">
                                                    ID: {dept.code} • {dept.organization?.name}
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="p-5">
                                        <div className="flex items-center gap-2">
                                            <div className="h-6 w-6 rounded-full bg-[#2563EB]/10 flex items-center justify-center text-[8px] font-black text-[#2563EB]">
                                                {dept.head?.fullName?.substring(0, 2).toUpperCase() || "NA"}
                                            </div>
                                            <span className="font-bold text-slate-900">{dept.head?.fullName || "Chưa chỉ định"}</span>
                                        </div>
                                    </td>
                                    <td className="p-5 text-center">
                                        <span className={`status-pill ${dept.isActive !== false ? 'status-approved' : 'status-draft'}`}>
                                            {dept.isActive !== false ? 'Đang hoạt động' : 'Tạm ngưng'}
                                        </span>
                                    </td>
                                    <td className="p-5 text-center">
                                        <div className="flex items-center justify-center gap-1 text-[#2563EB] font-black">
                                            <Users size={12} />
                                            <span>{dept._count?.users || 0} nhân viên</span>
                                        </div>
                                    </td>
                                    <td className="p-5 text-center">
                                        <div className="flex justify-center gap-3">
                                            <button
                                                onClick={() => handleOpenModal(dept)}
                                                className="h-9 w-9 flex items-center justify-center bg-[#FFFFFF] border border-[rgba(148,163,184,0.1)] text-slate-900 hover:text-[#2563EB] hover:border-[#2563EB]/30 rounded-xl transition-all shadow-sm"
                                            >
                                                <Edit2 size={14} />
                                            </button>
                                            <button
                                                onClick={() => setConfirmState({
                                                    open: true,
                                                    title: "Xóa phòng ban",
                                                    message: "Bạn có chắc chắn muốn xóa phòng ban này?",
                                                    onConfirm: () => { removeDept(dept.id); setConfirmState(s => ({ ...s, open: false })); }
                                                })}
                                                className="h-9 w-9 flex items-center justify-center bg-white border border-slate-200 text-slate-500 hover:text-red-500 hover:border-red-200 rounded-xl transition-all shadow-sm"
                                                aria-label="Xóa phòng ban"
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
                    <div className="bg-[#F1F5F9] rounded-xl w-full max-w-xl overflow-hidden shadow-2xl border border-[rgba(148,163,184,0.1)]">
                        <div className="p-6">
                            <h2 className="text-2xl font-black text-slate-900 uppercase mb-2 tracking-tight">
                                {editingDept ? "Cập nhật Phòng ban" : "Thêm Phòng ban mới"}
                            </h2>
                            <p className="text-xs text-slate-900 font-bold uppercase tracking-widest mb-10">CẤU CƠ TỔ CHỨC HỆ THỐNG</p>

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
                                                className="erp-input pr-12 font-bold text-[#2563EB]"
                                            />
                                            <span className="absolute right-5 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-900">VND</span>
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

