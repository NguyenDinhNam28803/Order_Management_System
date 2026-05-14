"use client";

import React, { useState } from "react";
import Image from "next/image";
import { UserPlus, Mail, Edit2, Trash2, Search, Building, ShieldCheck, ChevronDown } from "lucide-react";
import { useProcurement, User, Department, Organization, UserRole } from "../context/ProcurementContext";
import { CreateUserPayload } from "../types/api-types";
import ConfirmDialog from "../components/shared/ConfirmDialog";

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

    return (
        <main className="animate-in fade-in duration-500 p-6 min-h-screen bg-[#FFFFFF] text-slate-900">
            <ConfirmDialog
                open={confirmState.open}
                title={confirmState.title}
                message={confirmState.message}
                onConfirm={confirmState.onConfirm}
                onCancel={() => setConfirmState(s => ({ ...s, open: false }))}
            />
            <div className="flex justify-between items-end mb-10">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight uppercase">Quản trị Nhân sự</h1>
                    <p className="text-sm text-slate-900 mt-1 font-medium italic">TOÀN QUYỀN TRUY CẬP VÀ PHÂN QUYỀN HỆ THỐNG ERP</p>
                </div>
                <button 
                    onClick={() => handleOpenModal()}
                    className="flex items-center gap-2 bg-[#2563EB] text-white px-8 py-3.5 rounded-xl font-black uppercase tracking-widest text-[11px] shadow-xl shadow-[#2563EB]/20 hover:scale-[1.02] transition-transform active:scale-95"
                >
                    <UserPlus size={18} /> Thêm nhân sự mới
                </button>
            </div>

            <div className="bg-[#F1F5F9] rounded-xl border border-[rgba(148,163,184,0.1)] shadow-xl shadow-[#2563EB]/5 overflow-hidden">
                <div className="p-8 bg-[#FFFFFF] border-b border-[rgba(148,163,184,0.1)] flex justify-between items-center">
                    <div className="flex items-center gap-4">
                        <div className="text-[10px] font-black text-slate-900 uppercase tracking-widest border-r border-[rgba(148,163,184,0.1)] pr-4">Danh mục nhân sự (Directory)</div>
                        <div className="text-[10px] font-black text-[#2563EB] bg-[#2563EB]/10 px-3 py-1 rounded-full">{filteredUsers?.length || 0} Kết quả</div>
                    </div>
                    <div className="flex items-center gap-3 flex-wrap">
                        {/* Org Filter */}
                        <div className="relative group">
                            <select 
                                value={selectedOrg}
                                onChange={(e) => setSelectedOrg(e.target.value)}
                                className="pl-4 pr-8 py-2.5 bg-[#FFFFFF] border border-[rgba(148,163,184,0.1)] rounded-xl text-[10px] font-black uppercase text-slate-900 outline-none focus:ring-2 focus:ring-[#2563EB]/10 appearance-none shadow-sm min-w-[140px]"
                            >
                                <option value="all">Tổ chức</option>
                                {organizations?.map((org: Organization) => (
                                    <option key={org.id} value={org.id}>{org.name}</option>
                                ))}
                            </select>
                            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-900">
                                <ChevronDown size={12} />
                            </div>
                        </div>

                        {/* Dept Filter */}
                        <div className="relative group">
                            <select 
                                value={selectedDept}
                                onChange={(e) => setSelectedDept(e.target.value)}
                                className="pl-4 pr-8 py-2.5 bg-[#FFFFFF] border border-[rgba(148,163,184,0.1)] rounded-xl text-[10px] font-black uppercase text-slate-900 outline-none focus:ring-2 focus:ring-[#2563EB]/10 appearance-none shadow-sm min-w-[140px]"
                            >
                                <option value="all">Phòng ban</option>
                                {departments?.map((d: Department) => (
                                    <option key={d.id} value={d.id}>{d.name}</option>
                                ))}
                            </select>
                            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-900">
                                <ChevronDown size={12} />
                            </div>
                        </div>

                        {/* Role Filter */}
                        <div className="relative group">
                            <select 
                                value={selectedRole}
                                onChange={(e) => setSelectedRole(e.target.value)}
                                className="pl-4 pr-8 py-2.5 bg-[#FFFFFF] border border-[rgba(148,163,184,0.1)] rounded-xl text-[10px] font-black uppercase text-slate-900 outline-none focus:ring-2 focus:ring-[#2563EB]/10 appearance-none shadow-sm min-w-[140px]"
                            >
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
                            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-black">
                                <ChevronDown size={12} />
                            </div>
                        </div>

                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-900" size={14} />
                            <input 
                                type="text" 
                                placeholder="Tìm kiếm tên, email..." 
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-10 pr-4 py-2.5 bg-[#FFFFFF] border border-[rgba(148,163,184,0.1)] rounded-xl text-xs font-bold focus:ring-2 focus:ring-[#2563EB]/20 w-48 shadow-inner text-slate-900 placeholder:text-slate-900"
                            />
                        </div>
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="erp-table text-xs">
                        <thead>
                            <tr>
                                <th>Họ tên & Email</th>
                                <th>Phòng ban & Chức danh</th>
                                <th>Vai trò Hệ thống</th>
                                <th className="text-center">Trạng thái</th>
                                <th className="text-center">Thao tác</th>
                            </tr>
                        </thead>
                        <tbody>
                            {(!filteredUsers || filteredUsers.length === 0) && (
                                <tr>
                                    <td colSpan={5} className="py-16 text-center">
                                        <div className="flex flex-col items-center gap-2 text-slate-400">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 13.5h3.86a2.25 2.25 0 0 1 2.012 1.244l.256.512a2.25 2.25 0 0 0 2.013 1.244h3.218a2.25 2.25 0 0 0 2.013-1.244l.256-.512a2.25 2.25 0 0 1 2.013-1.244h3.859m-19.5.338V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18v-4.162c0-.224-.034-.447-.1-.661L19.24 5.338a2.25 2.25 0 0 0-2.15-1.588H6.911a2.25 2.25 0 0 0-2.15 1.588L2.35 13.177a2.25 2.25 0 0 0-.1.661Z" /></svg>
                                            <p className="text-sm font-semibold">Không tìm thấy người dùng nào</p>
                                            <p className="text-xs">Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                            {filteredUsers?.map((user: User, i: number) => (
                                <tr key={user.id || i} className="hover:bg-[#FFFFFF]/50 transition-colors border-b border-[rgba(148,163,184,0.1)]">
                                    <td className="p-5">
                                        <div className="flex items-center gap-4">
                                            <div className={`h-12 w-12 rounded-2xl ${user.isActive === false ? 'bg-[#000000]' : 'bg-[#2563EB]'} flex items-center justify-center font-black text-white shadow-lg shadow-[#2563EB]/10 text-xs`}>
                                                {user.avatarUrl ? <img src={user.avatarUrl} alt="" className="h-full w-full rounded-2xl object-cover" /> : (user.fullName || user.name || "??").substring(0,2).toUpperCase()}
                                            </div>
                                            <div>
                                                <div className="text-sm font-black text-slate-900 leading-tight">{user.fullName || user.name}</div>
                                                <div className="text-[10px] text-slate-900 font-bold flex items-center gap-1.5 mt-1 tracking-tight">
                                                    <Mail size={12} className="text-slate-900" /> {user.email}
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td>
                                        <div className="flex flex-col gap-1">
                                            <div className="flex items-center gap-1.5 text-slate-900 font-bold">
                                                <Building size={12} className="text-slate-900" />
                                                {typeof user.department === 'object' ? user.department?.name : (departments?.find(d => d.id === user.deptId)?.name || "Chưa có phòng ban")}
                                            </div>
                                            <div className="text-[10px] text-slate-900 italic bg-[#FFFFFF] w-fit px-2 py-0.5 rounded-md">
                                                {getJobTitle(user)}
                                            </div>
                                        </div>
                                    </td>
                                    <td>
                                        <div className="min-w-[100px]">
                                            <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider ${
                                                user.role === 'ADMIN' || user.role === 'PLATFORM_ADMIN' ? 'bg-purple-500/10 text-black border border-purple-500/20' :
                                                user.role === 'DIRECTOR' || user.role === 'CEO' ? 'bg-amber-500/10 text-black border border-amber-500/20' :
                                                user.role === 'PROCUREMENT' ? 'bg-[#2563EB]/10 text-[#3B82F6] border border-[#2563EB]/20' :
                                                user.role === 'FINANCE' || user.role === 'CFO' ? 'bg-emerald-500/10 text-black border border-emerald-500/20' :
                                                user.role === 'REQUESTER' ? 'bg-slate-500/10 text-black border border-slate-500/20' :
                                                'bg-[#2563EB]/10 text-[#2563EB] border border-[#2563EB]/20'
                                            }`}>
                                                <ShieldCheck size={10} /> {user.role}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="text-center">
                                        <div className="min-w-[80px]">
                                            <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider ${
                                                user.isActive === false ? 'bg-rose-500/10 text-black border border-rose-500/20' : 'bg-emerald-500/10 text-black border border-emerald-500/20'
                                            }`}>
                                                <div className={`h-1.5 w-1.5 rounded-full ${user.isActive === false ? 'bg-rose-500' : 'bg-emerald-500 animate-pulse'}`}></div>
                                                {user.isActive === false ? "Khóa" : "Hoạt động"}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="text-center">
                                        <div className="flex justify-center gap-1">
                                            <button 
                                                onClick={() => handleOpenModal(user)}
                                                className="p-1.5 text-slate-900 hover:text-[#2563EB] hover:bg-[#2563EB]/10 rounded-lg border border-transparent hover:border-[#2563EB]/20 transition-all"
                                            >
                                                <Edit2 size={14} />
                                            </button>
                                            <button
                                                onClick={() => setConfirmState({
                                                    open: true,
                                                    title: "Xóa nhân sự",
                                                    message: "Bạn có chắc chắn muốn xóa nhân sự này?",
                                                    onConfirm: () => { removeUser(user.id); setConfirmState(s => ({ ...s, open: false })); }
                                                })}
                                                className="h-9 w-9 flex items-center justify-center bg-slate-50 border border-slate-200 text-slate-500 hover:text-red-500 hover:border-red-200 rounded-xl transition-all shadow-sm"
                                                aria-label="Xóa nhân sự"
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
                    <div className="bg-[#F1F5F9] rounded-xl w-full max-w-2xl overflow-hidden shadow-2xl border border-[rgba(148,163,184,0.1)]">
                        <div className="p-6">
                            <h2 className="text-2xl font-black text-slate-900 uppercase mb-2 tracking-tight">
                                {editingUser ? "Cập nhật hồ sơ Nhân sự" : "Tạo tài khoản nhân viên mới"}
                            </h2>
                            <p className="text-xs text-slate-900 font-bold uppercase tracking-widest mb-10">QUẢN LÝ QUYỀN TRUY CẬP VÀ PHÂN BỔ PHÒNG BAN</p>

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
                                            className={`w-full bg-[#FFFFFF] border-2 border-[rgba(148,163,184,0.1)] rounded-xl px-5 py-3 text-sm font-bold focus:border-[#2563EB]/20 focus:bg-[#FFFFFF] outline-none transition-all placeholder:text-slate-900 text-slate-900 ${editingUser ? 'opacity-60 cursor-not-allowed' : ''}`}
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
                                            className={`w-full bg-[#FFFFFF] border-2 border-[rgba(148,163,184,0.1)] rounded-xl px-5 py-3 text-sm font-bold focus:border-[#2563EB]/20 focus:bg-[#FFFFFF] outline-none transition-all placeholder:text-slate-900 text-slate-900 ${editingUser ? 'opacity-60 cursor-not-allowed' : ''}`}
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
                                            className="w-full bg-[#FFFFFF] border-2 border-[rgba(148,163,184,0.1)] rounded-xl px-5 py-3 text-sm font-bold focus:border-[#2563EB]/20 focus:bg-[#FFFFFF] outline-none transition-all text-slate-900"
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
                                            className="w-full bg-[#FFFFFF] border-2 border-[rgba(148,163,184,0.1)] rounded-xl px-5 py-3 text-sm font-bold focus:border-[#2563EB]/20 focus:bg-[#FFFFFF] outline-none transition-all text-slate-900"
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
                                            className={`w-full bg-[#FFFFFF] border-2 border-[rgba(148,163,184,0.1)] rounded-xl px-5 py-3 text-sm font-bold focus:border-[#2563EB]/20 focus:bg-[#FFFFFF] outline-none transition-all placeholder:text-slate-900 text-slate-900 ${editingUser ? 'opacity-60 cursor-not-allowed' : ''}`}
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
                                            className={`w-full bg-[#FFFFFF] border-2 border-[rgba(148,163,184,0.1)] rounded-xl px-5 py-3 text-sm font-bold focus:border-[#2563EB]/20 focus:bg-[#FFFFFF] outline-none transition-all placeholder:text-slate-900 text-slate-900 ${editingUser ? 'opacity-60 cursor-not-allowed' : ''}`}
                                        />
                                    </div>
                                </div>

                                <div className="flex items-center justify-between p-6 bg-[#FFFFFF] rounded-xl border border-[rgba(148,163,184,0.1)]">
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
                                        className="flex-1 px-8 py-4 bg-[#FFFFFF] rounded-3xl font-black text-slate-900 uppercase tracking-widest hover:bg-slate-100 transition-colors"
                                    >
                                        Bỏ qua
                                    </button>
                                    <button 
                                        type="submit"
                                        className="flex-1 px-8 py-4 bg-[#2563EB] text-white rounded-3xl font-black uppercase tracking-widest shadow-xl shadow-[#2563EB]/20 hover:scale-[1.02] transition-all"
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

