"use client";

import React, { useState } from "react";
import Image from "next/image";
import { UserPlus, Mail, Edit2, Trash2, Building, ShieldCheck, Users } from "lucide-react";
import PageHeader from "../components/shared/PageHeader";
import { useProcurement, User, Department, Organization, UserRole } from "../context/ProcurementContext";
import { CreateUserPayload } from "../types/api-types";
import ConfirmDialog from "../components/shared/ConfirmDialog";
import { DataTable, DataTableColumn } from "../components/shared/DataTable";
import TableToolbar from "../components/shared/TableToolbar";
import StatusBadge from "../components/shared/StatusBadge";

export default function UsersPage() {
    const { users, departments, organizations, addUser, updateUser, removeUser } = useProcurement();
    const [showModal, setShowModal] = useState(false);
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [confirmState, setConfirmState] = useState<{ open: boolean; title: string; message: string; onConfirm: () => void }>({ open: false, title: "", message: "", onConfirm: () => {} });
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedDept, setSelectedDept] = useState("all");
    const [selectedOrg, setSelectedOrg] = useState("all");
    const [selectedRole, setSelectedRole] = useState("all");
    const [formData, setFormData] = useState<{
        orgId: string;
        deptId: string;
        email: string;
        fullName: string;
        role: UserRole;
        jobTitle: string;
        employeeCode: string;
        passwordHash: string;
        isActive: boolean;
    }>({
        orgId: "",
        deptId: "",
        email: "",
        fullName: "",
        role: UserRole.REQUESTER,
        jobTitle: "",
        employeeCode: "",
        passwordHash: "password123",
        isActive: true
    });

    const ROLE_TITLES: Record<string, string> = {
        [UserRole.REQUESTER]: 'Nhân viên (Requester)',
        [UserRole.DEPT_APPROVER]: 'Trưởng phòng (Manager)',
        [UserRole.PROCUREMENT]: 'Chuyên viên mua hàng',
        [UserRole.FINANCE]: 'Kế toán trưởng',
        [UserRole.WAREHOUSE]: 'Thủ kho',
        [UserRole.DIRECTOR]: 'Giám đốc khối',
        [UserRole.CEO]: 'Tổng giám đốc',
        [UserRole.PLATFORM_ADMIN]: 'Quản trị hệ thống',
        [UserRole.QA]: 'Chuyên viên QA',
        [UserRole.SUPPLIER]: 'Nhà cung cấp'
    };

    const getJobTitle = (user: User) => {
        if (user.jobTitle) return user.jobTitle;
        const roleKey = user.role as string;
        return ROLE_TITLES[roleKey] || "Nhân viên";
    };

    const handleOpenModal = (user?: User) => {
        if (user) {
            setEditingUser(user);
            setFormData({
                orgId: user.orgId || organizations?.[0]?.id || "",
                deptId: user.deptId || "",
                email: user.email,
                fullName: user.fullName || user.name || "",
                role: (user.role as UserRole) || UserRole.REQUESTER,
                jobTitle: user.jobTitle || "",
                employeeCode: user.employeeCode || "",
                passwordHash: "********", // Hidden for edit
                isActive: user.isActive !== undefined ? user.isActive : true
            });
        } else {
            setEditingUser(null);
            setFormData({
                orgId: organizations?.[0]?.id || "",
                deptId: "",
                email: "",
                fullName: "",
                role: UserRole.REQUESTER,
                jobTitle: "",
                employeeCode: "",
                passwordHash: "password123",
                isActive: true
            });
        }
        setShowModal(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        // Ensure deptId is null/undefined if empty string, to pass UUID validation
        const cleanedDeptId = formData.deptId === "" ? undefined : formData.deptId;
        
        // Ensure orgId is not empty (fallback to first org if needed)
        const cleanedOrgId = formData.orgId === "" ? (organizations?.[0]?.id || "") : formData.orgId;

        const data = {
            ...formData, 
            deptId: cleanedDeptId,
            orgId: cleanedOrgId
        };

        if (editingUser) {
            delete (data as { passwordHash?: string }).passwordHash;
            const success = await updateUser(editingUser.id, data);
            if (success) setShowModal(false);
        } else {
            const success = await addUser(data as CreateUserPayload);
            if (success) setShowModal(false);
        }
    };

    const filteredUsers = users?.filter((user: User) => {
        const matchesSearch = (user.fullName || user.name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
                              (user.email.toLowerCase().includes(searchTerm.toLowerCase()));
        const matchesDept = selectedDept === "all" || user.deptId === selectedDept;
        const matchesOrg = selectedOrg === "all" || user.orgId === selectedOrg;
        const matchesRole = selectedRole === "all" || user.role === selectedRole;
        return matchesSearch && matchesDept && matchesOrg && matchesRole;
    });

    const selectCls = "h-10 px-3 bg-white border border-slate-200 rounded-lg text-xs font-bold uppercase text-slate-900 focus:outline-none focus:border-blue-500/50 transition-all cursor-pointer";

    const columns: DataTableColumn<User>[] = [
        {
            label: "Họ tên & Email", key: "fullName", sortable: true,
            render: (user) => (
                <div className="flex items-center gap-4">
                    <div className={`h-11 w-11 rounded-2xl ${user.isActive === false ? 'bg-slate-900' : 'bg-[#2563EB]'} flex items-center justify-center font-black text-white text-xs shrink-0`}>
                        {user.avatarUrl ? <Image src={user.avatarUrl} alt="" width={44} height={44} className="h-full w-full rounded-2xl object-cover" unoptimized /> : (user.fullName || user.name || "??").substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                        <div className="text-sm font-bold text-slate-900 leading-tight">{user.fullName || user.name}</div>
                        <div className="text-[10px] text-slate-500 font-bold flex items-center gap-1.5 mt-1"><Mail size={12} /> {user.email}</div>
                    </div>
                </div>
            ),
        },
        {
            label: "Phòng ban & Chức danh", hideOnMobile: true,
            render: (user) => (
                <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-1.5 text-slate-900 font-medium text-xs">
                        <Building size={12} className="text-slate-400" />
                        {typeof user.department === 'object' ? user.department?.name : (departments?.find(d => d.id === user.deptId)?.name || "Chưa có phòng ban")}
                    </div>
                    <div className="text-[10px] text-slate-500 italic bg-white w-fit px-2 py-0.5 rounded-md border border-slate-100">{getJobTitle(user)}</div>
                </div>
            ),
        },
        {
            label: "Vai trò Hệ thống",
            render: (user) => (
                <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[0.6875rem] font-black uppercase tracking-wider ${
                    user.role === 'ADMIN' || user.role === 'PLATFORM_ADMIN' ? 'bg-purple-500/10 text-purple-700 border border-purple-500/20' :
                    user.role === 'DIRECTOR' || user.role === 'CEO' ? 'bg-amber-500/10 text-amber-700 border border-amber-500/20' :
                    user.role === 'PROCUREMENT' ? 'bg-[#2563EB]/10 text-[#3B82F6] border border-[#2563EB]/20' :
                    user.role === 'FINANCE' ? 'bg-emerald-500/10 text-emerald-700 border border-emerald-500/20' :
                    'bg-slate-500/10 text-slate-700 border border-slate-500/20'
                }`}>
                    <ShieldCheck size={10} /> {user.role}
                </span>
            ),
        },
        {
            label: "Trạng thái", align: "center",
            render: (user) => <StatusBadge status={user.isActive === false ? "INACTIVE" : "ACTIVE"} label={user.isActive === false ? "Khóa" : "Hoạt động"} size="sm" />,
        },
        {
            label: "Thao tác", align: "center",
            render: (user) => (
                <div className="flex justify-center gap-1">
                    <button onClick={() => handleOpenModal(user)} className="p-2 text-slate-900 hover:text-[#2563EB] hover:bg-[#2563EB]/10 rounded-lg transition-all" title="Sửa">
                        <Edit2 size={14} />
                    </button>
                    <button
                        onClick={() => setConfirmState({
                            open: true,
                            title: "Xóa nhân sự",
                            message: "Bạn có chắc chắn muốn xóa nhân sự này?",
                            onConfirm: () => { removeUser(user.id); setConfirmState(s => ({ ...s, open: false })); }
                        })}
                        className="h-9 w-9 flex items-center justify-center bg-white border border-slate-200 text-slate-500 hover:text-red-500 hover:border-red-200 rounded-xl transition-all"
                        aria-label="Xóa nhân sự"
                    >
                        <Trash2 size={14} />
                    </button>
                </div>
            ),
        },
    ];

    return (
        <main className="animate-in fade-in duration-500 p-6 min-h-screen bg-[#F8FAFC] text-slate-900">
            <ConfirmDialog
                open={confirmState.open}
                title={confirmState.title}
                message={confirmState.message}
                onConfirm={confirmState.onConfirm}
                onCancel={() => setConfirmState(s => ({ ...s, open: false }))}
            />
            <PageHeader
                icon={Users}
                iconColor="blue"
                title="Quản lý người dùng"
                subtitle="Toàn quyền truy cập và phân quyền hệ thống ERP"
                actions={
                    <button
                        onClick={() => handleOpenModal()}
                        className="btn-primary text-[11px]"
                    >
                        <UserPlus size={18} /> Thêm nhân sự mới
                    </button>
                }
            />

            <div className="erp-card table-card p-4 space-y-4">
                <TableToolbar
                    search={searchTerm}
                    onSearchChange={setSearchTerm}
                    searchPlaceholder="Tìm kiếm tên, email..."
                    filters={
                        <>
                            <select value={selectedOrg} onChange={(e) => setSelectedOrg(e.target.value)} className={selectCls}>
                                <option value="all">Tổ chức</option>
                                {organizations?.map((org: Organization) => <option key={org.id} value={org.id}>{org.name}</option>)}
                            </select>
                            <select value={selectedDept} onChange={(e) => setSelectedDept(e.target.value)} className={selectCls}>
                                <option value="all">Phòng ban</option>
                                {departments?.map((d: Department) => <option key={d.id} value={d.id}>{d.name}</option>)}
                            </select>
                            <select value={selectedRole} onChange={(e) => setSelectedRole(e.target.value)} className={selectCls}>
                                <option value="all">Vai trò</option>
                                <option value="REQUESTER">REQUESTER</option>
                                <option value="DEPT_APPROVER">APPROVER</option>
                                <option value="PROCUREMENT">PROCUREMENT</option>
                                <option value="FINANCE">FINANCE</option>
                                <option value="WAREHOUSE">WAREHOUSE</option>
                                <option value="DIRECTOR">DIRECTOR</option>
                                <option value="CEO">CEO</option>
                                <option value="PLATFORM_ADMIN">ADMIN</option>
                            </select>
                        </>
                    }
                />
                <DataTable
                    columns={columns}
                    data={filteredUsers ?? []}
                    pageSize={12}
                    getRowKey={(user) => user.id}
                    emptyMessage="Không tìm thấy người dùng nào"
                    emptyDescription="Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm"
                />
            </div>

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#FFFFFF]/80 backdrop-blur-sm p-4 animate-in fade-in zoom-in duration-300">
                    <div className="bg-[#F1F5F9] rounded-xl w-full max-w-2xl overflow-hidden shadow-2xl border border-slate-200">
                        <div className="p-6">
                            <h2 className="text-2xl font-black text-slate-900 uppercase mb-2 tracking-tight">
                                {editingUser ? "Cập nhật hồ sơ Nhân sự" : "Tạo tài khoản nhân viên mới"}
                            </h2>
                            <p className="text-[0.8125rem] text-[#64748B] font-medium uppercase tracking-widest mb-10">QUẢN LÝ QUYỀN TRUY CẬP VÀ PHÂN BỔ PHÒNG BAN</p>

                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div className="grid grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-900 uppercase tracking-widest ml-1">Họ và tên</label>
                                        <input 
                                            required
                                            value={formData.fullName}
                                            onChange={(e) => setFormData({...formData, fullName: e.target.value})}
                                            type="text" 
                                            placeholder="VD: Nguyễn Văn A"
                                            disabled={!!editingUser}
                                            className={`w-full bg-[#FFFFFF] border-2 border-slate-200 rounded-xl px-5 py-3 text-sm font-bold focus:border-[#2563EB]/20 focus:bg-[#FFFFFF] outline-none transition-all placeholder:text-slate-400 text-slate-900 ${editingUser ? 'opacity-60 cursor-not-allowed' : ''}`}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-900 uppercase tracking-widest ml-1">Email nội bộ</label>
                                        <input 
                                            required
                                            value={formData.email}
                                            onChange={(e) => setFormData({...formData, email: e.target.value})}
                                            type="email" 
                                            placeholder="email@company.com"
                                            disabled={!!editingUser}
                                            className={`w-full bg-[#FFFFFF] border-2 border-slate-200 rounded-xl px-5 py-3 text-sm font-bold focus:border-[#2563EB]/20 focus:bg-[#FFFFFF] outline-none transition-all placeholder:text-slate-400 text-slate-900 ${editingUser ? 'opacity-60 cursor-not-allowed' : ''}`}
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-900 uppercase tracking-widest ml-1">Vai trò hệ thống</label>
                                        <select 
                                            required
                                            value={formData.role}
                                            onChange={(e) => setFormData({...formData, role: e.target.value as UserRole})}
                                            className="w-full bg-[#FFFFFF] border-2 border-slate-200 rounded-xl px-5 py-3 text-sm font-bold focus:border-[#2563EB]/20 focus:bg-[#FFFFFF] outline-none transition-all text-slate-900"
                                        >
                                            <option value={UserRole.REQUESTER}>REQUESTER (Người yêu cầu)</option>
                                            <option value={UserRole.DEPT_APPROVER}>DEPT_APPROVER (Trưởng bộ phận)</option>
                                            <option value={UserRole.PROCUREMENT}>PROCUREMENT (Bộ phận Mua hàng)</option>
                                            <option value={UserRole.DIRECTOR}>DIRECTOR (Giám đốc)</option>
                                            <option value={UserRole.CEO}>CEO (Tổng giám đốc)</option>
                                            <option value={UserRole.FINANCE}>FINANCE (Kế toán/Tài chính)</option>
                                            <option value={UserRole.WAREHOUSE}>WAREHOUSE (Kho vận)</option>
                                            <option value={UserRole.PLATFORM_ADMIN}>PLATFORM_ADMIN (Quản trị hệ thống)</option>
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-900 uppercase tracking-widest ml-1">Phòng ban</label>
                                        <select 
                                            value={formData.deptId}
                                            onChange={(e) => setFormData({...formData, deptId: e.target.value})}
                                            className="w-full bg-[#FFFFFF] border-2 border-slate-200 rounded-xl px-5 py-3 text-sm font-bold focus:border-[#2563EB]/20 focus:bg-[#FFFFFF] outline-none transition-all text-slate-900"
                                        >
                                            <option value="">Chưa phân bổ</option>
                                            {departments?.map((d: Department) => (
                                                <option key={d.id} value={d.id}>{d.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-900 uppercase tracking-widest ml-1">Chức danh</label>
                                        <input 
                                            value={formData.jobTitle}
                                            onChange={(e) => setFormData({...formData, jobTitle: e.target.value})}
                                            type="text" 
                                            placeholder="VD: Senior Developer"
                                            disabled={!!editingUser}
                                            className={`w-full bg-[#FFFFFF] border-2 border-slate-200 rounded-xl px-5 py-3 text-sm font-bold focus:border-[#2563EB]/20 focus:bg-[#FFFFFF] outline-none transition-all placeholder:text-slate-400 text-slate-900 ${editingUser ? 'opacity-60 cursor-not-allowed' : ''}`}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-900 uppercase tracking-widest ml-1">Mã nhân viên (Tự động nếu để trống)</label>
                                        <input 
                                            value={formData.employeeCode}
                                            onChange={(e) => setFormData({...formData, employeeCode: e.target.value})}
                                            type="text" 
                                            placeholder="VD: EMP001"
                                            disabled={!!editingUser}
                                            className={`w-full bg-[#FFFFFF] border-2 border-slate-200 rounded-xl px-5 py-3 text-sm font-bold focus:border-[#2563EB]/20 focus:bg-[#FFFFFF] outline-none transition-all placeholder:text-slate-400 text-slate-900 ${editingUser ? 'opacity-60 cursor-not-allowed' : ''}`}
                                        />
                                    </div>
                                </div>

                                <div className="flex items-center justify-between p-6 bg-[#FFFFFF] rounded-xl border border-slate-200">
                                    <div>
                                        <div className="text-xs font-black text-slate-900 uppercase tracking-tight">Trạng thái tài khoản</div>
                                        <div className="text-[10px] text-slate-900 font-bold uppercase mt-1">Khóa hoặc kích hoạt quyền truy nhập hệ thống</div>
                                    </div>
                                    <div 
                                        onClick={() => !editingUser && setFormData({...formData, isActive: !formData.isActive})}
                                        className={`w-14 h-8 rounded-full transition-all p-1 flex items-center ${formData.isActive ? 'bg-emerald-500 justify-end' : 'bg-[#000000] justify-start'} ${editingUser ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}
                                    >
                                        <div className="w-6 h-6 bg-white rounded-full shadow-md"></div>
                                    </div>
                                </div>

                                <div className="flex gap-4 pt-6">
                                    <button 
                                        type="button"
                                        onClick={() => setShowModal(false)}
                                        className="flex-1 px-8 py-4 bg-[#FFFFFF] rounded-xl font-black text-slate-900 uppercase tracking-widest hover:bg-slate-100 transition-colors"
                                    >
                                        Bỏ qua
                                    </button>
                                    <button 
                                        type="submit"
                                        className="flex-1 px-8 py-4 bg-[#2563EB] text-white rounded-xl font-black uppercase tracking-widest shadow-xl shadow-[#2563EB]/20 hover:scale-[1.02] transition-all"
                                    >
                                        {editingUser ? "Lưu cập nhật" : "Tạo tài khoản"}
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

