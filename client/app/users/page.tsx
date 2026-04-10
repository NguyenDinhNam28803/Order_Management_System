"use client";

import React, { useState } from "react";
import Image from "next/image";
import { UserPlus, Mail, Edit2, Trash2, Search, Building, ShieldCheck, ChevronDown } from "lucide-react";
import { useProcurement, User, Department, Organization, UserRole } from "../context/ProcurementContext";
import { CreateUserPayload } from "../types/api-types";

export default function UsersPage() {
    const { users, departments, organizations, addUser, updateUser, removeUser } = useProcurement();
    const [showModal, setShowModal] = useState(false);
    const [editingUser, setEditingUser] = useState<User | null>(null);
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
        <main className="animate-in fade-in duration-500 p-6 min-h-screen bg-[#0F1117] text-[#F8FAFC]">
            <div className="flex justify-between items-end mb-10">
                <div>
                    <h1 className="text-3xl font-black text-[#F8FAFC] tracking-tight uppercase">Quản trị Nhân sự</h1>
                    <p className="text-sm text-[#94A3B8] mt-1 font-medium italic">TOÀN QUYỀN TRUY CẬP VÀ PHÂN QUYỀN HỆ THỐNG ERP</p>
                </div>
                <button 
                    onClick={() => handleOpenModal()}
                    className="flex items-center gap-2 bg-[#3B82F6] text-white px-8 py-3.5 rounded-[20px] font-black uppercase tracking-widest text-[11px] shadow-xl shadow-[#3B82F6]/20 hover:scale-[1.02] transition-transform active:scale-95"
                >
                    <UserPlus size={18} /> Thêm nhân sự mới
                </button>
            </div>

            <div className="bg-[#161922] rounded-[32px] border border-[rgba(148,163,184,0.1)] shadow-xl shadow-[#3B82F6]/5 overflow-hidden">
                <div className="p-8 bg-[#0F1117] border-b border-[rgba(148,163,184,0.1)] flex justify-between items-center">
                    <div className="flex items-center gap-4">
                        <div className="text-[10px] font-black text-[#64748B] uppercase tracking-widest border-r border-[rgba(148,163,184,0.1)] pr-4">Danh mục nhân sự (Directory)</div>
                        <div className="text-[10px] font-black text-[#3B82F6] bg-[#3B82F6]/10 px-3 py-1 rounded-full">{filteredUsers?.length || 0} Kết quả</div>
                    </div>
                    <div className="flex items-center gap-3 flex-wrap">
                        {/* Org Filter */}
                        <div className="relative group">
                            <select 
                                value={selectedOrg}
                                onChange={(e) => setSelectedOrg(e.target.value)}
                                className="pl-4 pr-8 py-2.5 bg-[#0F1117] border border-[rgba(148,163,184,0.1)] rounded-xl text-[10px] font-black uppercase text-[#F8FAFC] outline-none focus:ring-2 focus:ring-[#3B82F6]/10 appearance-none shadow-sm min-w-[140px]"
                            >
                                <option value="all">Tổ chức</option>
                                {organizations?.map((org: Organization) => (
                                    <option key={org.id} value={org.id}>{org.name}</option>
                                ))}
                            </select>
                            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-[#64748B]">
                                <ChevronDown size={12} />
                            </div>
                        </div>

                        {/* Dept Filter */}
                        <div className="relative group">
                            <select 
                                value={selectedDept}
                                onChange={(e) => setSelectedDept(e.target.value)}
                                className="pl-4 pr-8 py-2.5 bg-[#0F1117] border border-[rgba(148,163,184,0.1)] rounded-xl text-[10px] font-black uppercase text-[#F8FAFC] outline-none focus:ring-2 focus:ring-[#3B82F6]/10 appearance-none shadow-sm min-w-[140px]"
                            >
                                <option value="all">Phòng ban</option>
                                {departments?.map((d: Department) => (
                                    <option key={d.id} value={d.id}>{d.name}</option>
                                ))}
                            </select>
                            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-[#64748B]">
                                <ChevronDown size={12} />
                            </div>
                        </div>

                        {/* Role Filter */}
                        <div className="relative group">
                            <select 
                                value={selectedRole}
                                onChange={(e) => setSelectedRole(e.target.value)}
                                className="pl-4 pr-8 py-2.5 bg-[#0F1117] border border-[rgba(148,163,184,0.1)] rounded-xl text-[10px] font-black uppercase text-[#F8FAFC] outline-none focus:ring-2 focus:ring-[#3B82F6]/10 appearance-none shadow-sm min-w-[140px]"
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
                            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                                <ChevronDown size={12} />
                            </div>
                        </div>

                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#64748B]" size={14} />
                            <input 
                                type="text" 
                                placeholder="Tìm kiếm tên, email..." 
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-10 pr-4 py-2.5 bg-[#0F1117] border border-[rgba(148,163,184,0.1)] rounded-xl text-xs font-bold focus:ring-2 focus:ring-[#3B82F6]/20 w-48 shadow-inner text-[#F8FAFC] placeholder:text-[#64748B]"
                            />
                        </div>
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="erp-table text-xs">
                        <thead>
                            <tr className="bg-[#0F1117]">
                                <th>Họ tên & Email</th>
                                <th>Phòng ban & Chức danh</th>
                                <th>Vai trò Hệ thống</th>
                                <th className="text-center">Trạng thái</th>
                                <th className="text-center">Thao tác</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredUsers?.map((user: User, i: number) => (
                                <tr key={user.id || i} className="hover:bg-[#0F1117]/50 transition-colors border-b border-[rgba(148,163,184,0.1)]">
                                    <td className="p-5">
                                        <div className="flex items-center gap-4">
                                            <div className={`h-12 w-12 rounded-2xl ${user.isActive === false ? 'bg-[#64748B]' : 'bg-[#3B82F6]'} flex items-center justify-center font-black text-white shadow-lg shadow-[#3B82F6]/10 text-xs`}>
                                                {user.avatarUrl ? <img src={user.avatarUrl} alt="" className="h-full w-full rounded-2xl object-cover" /> : (user.fullName || user.name || "??").substring(0,2).toUpperCase()}
                                            </div>
                                            <div>
                                                <div className="text-sm font-black text-[#F8FAFC] leading-tight">{user.fullName || user.name}</div>
                                                <div className="text-[10px] text-[#64748B] font-bold flex items-center gap-1.5 mt-1 tracking-tight">
                                                    <Mail size={12} className="text-[#94A3B8]" /> {user.email}
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td>
                                        <div className="flex flex-col gap-1">
                                            <div className="flex items-center gap-1.5 text-[#94A3B8] font-bold">
                                                <Building size={12} className="text-[#64748B]" />
                                                {typeof user.department === 'object' ? user.department?.name : (departments?.find(d => d.id === user.deptId)?.name || "Chưa có phòng ban")}
                                            </div>
                                            <div className="text-[10px] text-[#64748B] italic bg-[#0F1117] w-fit px-2 py-0.5 rounded-md">
                                                {getJobTitle(user)}
                                            </div>
                                        </div>
                                    </td>
                                    <td>
                                        <div className="min-w-[100px]">
                                            <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider ${
                                                user.role === 'ADMIN' || user.role === 'PLATFORM_ADMIN' ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20' :
                                                user.role === 'DIRECTOR' || user.role === 'CEO' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                                                user.role === 'PROCUREMENT' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' :
                                                user.role === 'FINANCE' || user.role === 'CFO' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                                                user.role === 'REQUESTER' ? 'bg-slate-500/10 text-slate-400 border border-slate-500/20' :
                                                'bg-[#3B82F6]/10 text-[#3B82F6] border border-[#3B82F6]/20'
                                            }`}>
                                                <ShieldCheck size={10} /> {user.role}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="text-center">
                                        <div className="min-w-[80px]">
                                            <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider ${
                                                user.isActive === false ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
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
                                                className="p-1.5 text-[#64748B] hover:text-[#3B82F6] hover:bg-[#3B82F6]/10 rounded-lg border border-transparent hover:border-[#3B82F6]/20 transition-all"
                                            >
                                                <Edit2 size={14} />
                                            </button>
                                            <button 
                                                onClick={() => {
                                                    if(confirm("Bạn có chắc chắn muốn xóa nhân sự này?")) {
                                                        removeUser(user.id);
                                                    }
                                                }}
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
                    <div className="bg-[#161922] rounded-[40px] w-full max-w-2xl overflow-hidden shadow-2xl border border-[rgba(148,163,184,0.1)]">
                        <div className="p-10">
                            <h2 className="text-2xl font-black text-[#F8FAFC] uppercase mb-2 tracking-tight">
                                {editingUser ? "Cập nhật hồ sơ Nhân sự" : "Tạo tài khoản nhân viên mới"}
                            </h2>
                            <p className="text-xs text-[#64748B] font-bold uppercase tracking-widest mb-10">QUẢN LÝ QUYỀN TRUY CẬP VÀ PHÂN BỔ PHÒNG BAN</p>

                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div className="grid grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-[#64748B] uppercase tracking-widest ml-1">Họ và tên</label>
                                        <input 
                                            required
                                            value={formData.fullName}
                                            onChange={(e) => setFormData({...formData, fullName: e.target.value})}
                                            type="text" 
                                            placeholder="VD: Nguyễn Văn A"
                                            disabled={!!editingUser}
                                            className={`w-full bg-[#0F1117] border-2 border-[rgba(148,163,184,0.1)] rounded-2xl px-5 py-3 text-sm font-bold focus:border-[#3B82F6]/20 focus:bg-[#0F1117] outline-none transition-all placeholder:text-[#64748B] text-[#F8FAFC] ${editingUser ? 'opacity-60 cursor-not-allowed' : ''}`}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-[#64748B] uppercase tracking-widest ml-1">Email nội bộ</label>
                                        <input 
                                            required
                                            value={formData.email}
                                            onChange={(e) => setFormData({...formData, email: e.target.value})}
                                            type="email" 
                                            placeholder="email@company.com"
                                            disabled={!!editingUser}
                                            className={`w-full bg-[#0F1117] border-2 border-[rgba(148,163,184,0.1)] rounded-2xl px-5 py-3 text-sm font-bold focus:border-[#3B82F6]/20 focus:bg-[#0F1117] outline-none transition-all placeholder:text-[#64748B] text-[#F8FAFC] ${editingUser ? 'opacity-60 cursor-not-allowed' : ''}`}
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-[#64748B] uppercase tracking-widest ml-1">Vai trò hệ thống</label>
                                        <select 
                                            required
                                            value={formData.role}
                                            onChange={(e) => setFormData({...formData, role: e.target.value as UserRole})}
                                            className="w-full bg-[#0F1117] border-2 border-[rgba(148,163,184,0.1)] rounded-2xl px-5 py-3 text-sm font-bold focus:border-[#3B82F6]/20 focus:bg-[#0F1117] outline-none transition-all text-[#F8FAFC]"
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
                                        <label className="text-[10px] font-black text-[#64748B] uppercase tracking-widest ml-1">Phòng ban</label>
                                        <select 
                                            value={formData.deptId}
                                            onChange={(e) => setFormData({...formData, deptId: e.target.value})}
                                            className="w-full bg-[#0F1117] border-2 border-[rgba(148,163,184,0.1)] rounded-2xl px-5 py-3 text-sm font-bold focus:border-[#3B82F6]/20 focus:bg-[#0F1117] outline-none transition-all text-[#F8FAFC]"
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
                                        <label className="text-[10px] font-black text-[#64748B] uppercase tracking-widest ml-1">Chức danh</label>
                                        <input 
                                            value={formData.jobTitle}
                                            onChange={(e) => setFormData({...formData, jobTitle: e.target.value})}
                                            type="text" 
                                            placeholder="VD: Senior Developer"
                                            disabled={!!editingUser}
                                            className={`w-full bg-[#0F1117] border-2 border-[rgba(148,163,184,0.1)] rounded-2xl px-5 py-3 text-sm font-bold focus:border-[#3B82F6]/20 focus:bg-[#0F1117] outline-none transition-all placeholder:text-[#64748B] text-[#F8FAFC] ${editingUser ? 'opacity-60 cursor-not-allowed' : ''}`}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-[#64748B] uppercase tracking-widest ml-1">Mã nhân viên (Tự động nếu để trống)</label>
                                        <input 
                                            value={formData.employeeCode}
                                            onChange={(e) => setFormData({...formData, employeeCode: e.target.value})}
                                            type="text" 
                                            placeholder="VD: EMP001"
                                            disabled={!!editingUser}
                                            className={`w-full bg-[#0F1117] border-2 border-[rgba(148,163,184,0.1)] rounded-2xl px-5 py-3 text-sm font-bold focus:border-[#3B82F6]/20 focus:bg-[#0F1117] outline-none transition-all placeholder:text-[#64748B] text-[#F8FAFC] ${editingUser ? 'opacity-60 cursor-not-allowed' : ''}`}
                                        />
                                    </div>
                                </div>

                                <div className="flex items-center justify-between p-6 bg-[#0F1117] rounded-3xl border border-[rgba(148,163,184,0.1)]">
                                    <div>
                                        <div className="text-xs font-black text-[#F8FAFC] uppercase tracking-tight">Trạng thái tài khoản</div>
                                        <div className="text-[10px] text-[#64748B] font-bold uppercase mt-1">Khóa hoặc kích hoạt quyền truy nhập hệ thống</div>
                                    </div>
                                    <div 
                                        onClick={() => !editingUser && setFormData({...formData, isActive: !formData.isActive})}
                                        className={`w-14 h-8 rounded-full transition-all p-1 flex items-center ${formData.isActive ? 'bg-emerald-500 justify-end' : 'bg-[#64748B] justify-start'} ${editingUser ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}
                                    >
                                        <div className="w-6 h-6 bg-white rounded-full shadow-md"></div>
                                    </div>
                                </div>

                                <div className="flex gap-4 pt-6">
                                    <button 
                                        type="button"
                                        onClick={() => setShowModal(false)}
                                        className="flex-1 px-8 py-4 bg-[#0F1117] rounded-3xl font-black text-[#64748B] uppercase tracking-widest hover:bg-[#1A1D23] transition-colors"
                                    >
                                        Bỏ qua
                                    </button>
                                    <button 
                                        type="submit"
                                        className="flex-1 px-8 py-4 bg-[#3B82F6] text-white rounded-3xl font-black uppercase tracking-widest shadow-xl shadow-[#3B82F6]/20 hover:scale-[1.02] transition-all"
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
