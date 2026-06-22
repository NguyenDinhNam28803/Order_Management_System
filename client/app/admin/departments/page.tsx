"use client";

import React, { useState } from "react";
import { Building2, Plus, Edit2, Trash2, Users } from "lucide-react";
import PageHeader from "../../components/shared/PageHeader";
import { useProcurement, Department, User } from "../../context/ProcurementContext";
import { Organization, CreateDepartmentPayload, UpdateDepartmentPayload } from "@/app/types/api-types";
import ConfirmDialog from "../../components/shared/ConfirmDialog";
import { DataTable, DataTableColumn } from "../../components/shared/DataTable";
import TableToolbar from "../../components/shared/TableToolbar";
import StatusBadge from "../../components/shared/StatusBadge";

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

    const columns: DataTableColumn<Department>[] = [
        {
            label: "Mã & Tên Phòng ban", key: "name", sortable: true,
            render: (dept) => (
                <div className="flex items-center gap-4">
                    <div className="h-11 w-11 rounded-xl bg-[#2563EB]/10 border border-[#2563EB]/20 flex items-center justify-center text-[#2563EB] shrink-0">
                        <Building2 size={18} />
                    </div>
                    <div>
                        <div className="text-sm font-bold text-slate-900 leading-tight">{dept.name}</div>
                        <div className="text-[10px] text-slate-500 font-bold mt-1">ID: {dept.code} • {dept.organization?.name}</div>
                    </div>
                </div>
            ),
        },
        {
            label: "Trưởng bộ phận",
            render: (dept) => (
                <div className="flex items-center gap-2">
                    <div className="h-6 w-6 rounded-full bg-[#2563EB]/10 flex items-center justify-center text-[8px] font-black text-[#2563EB]">
                        {dept.head?.fullName?.substring(0, 2).toUpperCase() || "NA"}
                    </div>
                    <span className="font-medium text-slate-900">{dept.head?.fullName || "Chưa chỉ định"}</span>
                </div>
            ),
        },
        {
            label: "Trạng thái", align: "center",
            render: (dept) => <StatusBadge status={dept.isActive !== false ? "ACTIVE" : "INACTIVE"} size="sm" />,
        },
        {
            label: "Nhân sự", align: "center",
            render: (dept) => (
                <div className="flex items-center justify-center gap-1 text-[#2563EB] font-bold num-display">
                    <Users size={12} />
                    <span>{dept._count?.users || 0} nhân viên</span>
                </div>
            ),
        },
        {
            label: "Thao tác", align: "center",
            render: (dept) => (
                <div className="flex justify-center gap-2">
                    <button onClick={() => handleOpenModal(dept)} className="h-9 w-9 flex items-center justify-center bg-white border border-slate-200 text-slate-900 hover:text-[#2563EB] hover:border-[#2563EB]/30 rounded-xl transition-all" title="Sửa">
                        <Edit2 size={14} />
                    </button>
                    <button
                        onClick={() => setConfirmState({
                            open: true,
                            title: "Xóa phòng ban",
                            message: "Bạn có chắc chắn muốn xóa phòng ban này?",
                            onConfirm: () => { removeDept(dept.id); setConfirmState(s => ({ ...s, open: false })); }
                        })}
                        className="h-9 w-9 flex items-center justify-center bg-white border border-slate-200 text-slate-500 hover:text-red-500 hover:border-red-200 rounded-xl transition-all"
                        aria-label="Xóa phòng ban"
                    >
                        <Trash2 size={14} />
                    </button>
                </div>
            ),
        },
    ];

    return (
        <div className="animate-in fade-in duration-500 p-6 space-y-6">
            <ConfirmDialog
                open={confirmState.open}
                title={confirmState.title}
                message={confirmState.message}
                onConfirm={confirmState.onConfirm}
                onCancel={() => setConfirmState(s => ({ ...s, open: false }))}
            />
            <PageHeader
                icon={Building2}
                iconColor="blue"
                title="Quản lý Phòng ban"
                subtitle="Thiết lập cơ cấu tổ chức và ngân sách phòng ban."
                actions={
                    <button
                        onClick={() => handleOpenModal()}
                        className="btn-primary flex items-center gap-2"
                    >
                        <Plus size={16} /> Thêm phòng ban
                    </button>
                }
            />

            <div className="erp-card table-card p-4 space-y-4">
                <TableToolbar
                    search={searchTerm}
                    onSearchChange={setSearchTerm}
                    searchPlaceholder="Tìm kiếm phòng ban..."
                    filters={
                        <select
                            value={filterOrgId}
                            onChange={(e) => setFilterOrgId(e.target.value)}
                            className="h-10 px-3 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-900 focus:outline-none focus:border-blue-500/50 transition-all cursor-pointer"
                        >
                            <option value="">Tất cả tổ chức</option>
                            {organizations?.map((org: Organization) => (
                                <option key={org.id} value={org.id}>{org.name}</option>
                            ))}
                        </select>
                    }
                />
                <DataTable
                    columns={columns}
                    data={filteredDepartments ?? []}
                    pageSize={12}
                    getRowKey={(dept) => dept.id}
                    emptyMessage="Chưa có phòng ban nào"
                    emptyDescription="Nhấn 'Thêm phòng ban' để bắt đầu"
                />
            </div>

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#FFFFFF]/80 backdrop-blur-sm p-4 animate-in fade-in zoom-in duration-300">
                    <div className="bg-[#F1F5F9] rounded-xl w-full max-w-xl overflow-hidden shadow-2xl border border-slate-200">
                        <div className="p-6">
                            <h2 className="text-2xl font-black text-slate-900 uppercase mb-2 tracking-tight">
                                {editingDept ? "Cập nhật Phòng ban" : "Thêm Phòng ban mới"}
                            </h2>
                            <p className="text-[0.8125rem] text-[#64748B] font-medium uppercase tracking-widest mb-10">CẤU CƠ TỔ CHỨC HỆ THỐNG</p>

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

