"use client";

import React, { useState } from "react";
import { UserPlus, Mail, Edit2, Trash2, Search, Building, ShieldCheck, CheckCircle, XCircle, ChevronDown } from "lucide-react";
import { useProcurement } from "../context/ProcurementContext";

export default function UsersPage() {
    const { users, departments, organizations, addUser, updateUser } = useProcurement();
    const [showModal, setShowModal] = useState(false);
    const [editingUser, setEditingUser] = useState<any>(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedDept, setSelectedDept] = useState("all");
    const [formData, setFormData] = useState({
        orgId: "",
        deptId: "",
        email: "",
        fullName: "",
        role: "REQUESTER",
        jobTitle: "",
        employeeCode: "",
        passwordHash: "password123",
        isActive: true
    });

    const handleOpenModal = (user?: any) => {
        if (user) {
            setEditingUser(user);
            setFormData({
                orgId: user.orgId || organizations?.[0]?.id || "",
                deptId: user.deptId || "",
                email: user.email,
                fullName: user.fullName || user.name || "",
                role: user.role || "REQUESTER",
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
                role: "REQUESTER",
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
        const data = { ...formData };
        if (editingUser) {
            delete (data as any).passwordHash; // Don't send dummy password on update
            const success = await updateUser(editingUser.id, data);
            if (success) setShowModal(false);
        } else {
            const success = await addUser(data);
            if (success) setShowModal(false);
        }
    };

    const filteredUsers = users?.filter((user: any) => {
        const matchesSearch = (user.fullName || user.name || "").toLowerCase().includes(searchTerm.toLowerCase()) || 
                              user.email.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesDept = selectedDept === "all" || user.deptId === selectedDept;
        return matchesSearch && matchesDept;
    });

    return (
        <main className="animate-in fade-in duration-500">
            <div className="flex justify-between items-end mb-10">
                <div>
                    <h1 className="text-3xl font-black text-erp-navy tracking-tight uppercase">Quản trị Nhân sự</h1>
                    <p className="text-sm text-slate-500 mt-1 font-medium italic">TOÀN QUYỀN TRUY CẬP VÀ PHÂN QUYỀN HỆ THỐNG ERP</p>
                </div>
                <button 
                    onClick={() => handleOpenModal()}
                    className="flex items-center gap-2 bg-erp-navy text-white px-8 py-3.5 rounded-[20px] font-black uppercase tracking-widest text-[11px] shadow-xl shadow-erp-navy/20 hover:scale-[1.02] transition-transform active:scale-95"
                >
                    <UserPlus size={18} /> Thêm nhân sự mới
                </button>
            </div>

            <div className="bg-white rounded-[32px] border border-slate-100 shadow-xl shadow-erp-navy/5 overflow-hidden">
                <div className="p-8 bg-slate-50/20 border-b border-slate-50 flex justify-between items-center">
                    <div className="flex items-center gap-4">
                        <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-r border-slate-200 pr-4">Danh mục nhân sự (Directory)</div>
                        <div className="text-[10px] font-black text-blue-500 bg-blue-50 px-3 py-1 rounded-full">{filteredUsers?.length || 0} Kết quả</div>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="relative group">
                            <Building className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                            <select 
                                value={selectedDept}
                                onChange={(e) => setSelectedDept(e.target.value)}
                                className="pl-10 pr-8 py-2.5 bg-white border border-slate-100 rounded-xl text-xs font-bold text-erp-navy outline-none focus:ring-2 focus:ring-erp-blue/10 appearance-none shadow-sm min-w-[180px]"
                            >
                                <option value="all">Tất cả phòng ban</option>
                                {departments?.map((d: any) => (
                                    <option key={d.id} value={d.id}>{d.name}</option>
                                ))}
                            </select>
                            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                                <ChevronDown size={14} />
                            </div>
                        </div>

                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                            <input 
                                type="text" 
                                placeholder="Tìm kiếm theo tên, email..." 
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-10 pr-4 py-2.5 bg-slate-100/50 border-none rounded-xl text-xs font-bold focus:ring-2 focus:ring-erp-blue/20 w-64 shadow-inner"
                            />
                        </div>
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="erp-table text-xs">
                        <thead>
                            <tr className="bg-slate-50/30">
                                <th>Họ tên & Email</th>
                                <th>Phòng ban & Chức danh</th>
                                <th>Vai trò Hệ thống</th>
                                <th className="text-center">Trạng thái</th>
                                <th className="text-center">Thao tác</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredUsers?.map((user: any, i: number) => (
                                <tr key={user.id || i} className="hover:bg-slate-50/50 transition-colors border-b border-slate-50">
                                    <td className="p-5">
                                        <div className="flex items-center gap-4">
                                            <div className={`h-12 w-12 rounded-2xl ${user.isActive === false ? 'bg-slate-300' : 'bg-erp-navy'} flex items-center justify-center font-black text-white shadow-lg shadow-erp-navy/10 text-xs`}>
                                                {user.avatarUrl ? <img src={user.avatarUrl} alt="" className="h-full w-full rounded-2xl object-cover" /> : (user.fullName || user.name || "??").substring(0,2).toUpperCase()}
                                            </div>
                                            <div>
                                                <div className="text-sm font-black text-erp-navy leading-tight">{user.fullName || user.name}</div>
                                                <div className="text-[10px] text-slate-400 font-bold flex items-center gap-1.5 mt-1 tracking-tight">
                                                    <Mail size={12} className="text-slate-300" /> {user.email}
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td>
                                        <div className="flex flex-col gap-1">
                                            <div className="flex items-center gap-1.5 text-slate-600 font-bold">
                                                <Building size={12} className="text-slate-300" />
                                                {user.department?.name || "Chưa có phòng ban"}
                                            </div>
                                            <div className="text-[10px] text-slate-400 italic bg-slate-50 w-fit px-2 py-0.5 rounded-md">
                                                {user.jobTitle || "Nhân viên"}
                                            </div>
                                        </div>
                                    </td>
                                    <td>
                                        <span className={`status-pill status-${(user.role || 'guest').toLowerCase()}`}>
                                            <ShieldCheck size={10} className="mr-1" /> {user.role}
                                        </span>
                                    </td>
                                    <td className="text-center">
                                        <div className="flex items-center justify-center gap-2">
                                            <div className={`h-2 w-2 rounded-full ${user.isActive === false ? 'bg-red-400' : 'bg-emerald-500 animate-pulse'}`}></div>
                                            <span className="text-[10px] font-black uppercase text-slate-500 tracking-widest">
                                                {user.isActive === false ? "LOCKED" : "ACTIVE"}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="text-center">
                                        <div className="flex justify-center gap-3">
                                            <button 
                                                onClick={() => handleOpenModal(user)}
                                                className="h-9 w-9 flex items-center justify-center bg-white border border-slate-100 text-slate-400 hover:text-erp-blue hover:border-erp-blue/30 rounded-xl transition-all shadow-sm"
                                            >
                                                <Edit2 size={14} />
                                            </button>
                                            <button className="h-9 w-9 flex items-center justify-center bg-white border border-slate-100 text-slate-400 hover:text-red-500 hover:border-red-100 rounded-xl transition-all shadow-sm">
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
                    <div className="bg-white rounded-[40px] w-full max-w-2xl overflow-hidden shadow-2xl border border-white/20">
                        <div className="p-10">
                            <h2 className="text-2xl font-black text-erp-navy uppercase mb-2 tracking-tight">
                                {editingUser ? "Cập nhật hồ sơ Nhân sự" : "Tạo tài khoản nhân viên mới"}
                            </h2>
                            <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mb-10">QUẢN LÝ QUYỀN TRUY CẬP VÀ PHÂN BỔ PHÒNG BAN</p>

                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div className="grid grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Họ và tên</label>
                                        <input 
                                            required
                                            value={formData.fullName}
                                            onChange={(e) => setFormData({...formData, fullName: e.target.value})}
                                            type="text" 
                                            placeholder="VD: Nguyễn Văn A"
                                            className="w-full bg-slate-50 border-2 border-slate-50 rounded-2xl px-5 py-3 text-sm font-bold focus:border-erp-blue/20 focus:bg-white outline-none transition-all"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Email nội bộ</label>
                                        <input 
                                            required
                                            value={formData.email}
                                            onChange={(e) => setFormData({...formData, email: e.target.value})}
                                            type="email" 
                                            placeholder="email@company.com"
                                            className="w-full bg-slate-50 border-2 border-slate-50 rounded-2xl px-5 py-3 text-sm font-bold focus:border-erp-blue/20 focus:bg-white outline-none transition-all"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Vai trò hệ thống</label>
                                        <select 
                                            required
                                            value={formData.role}
                                            onChange={(e) => setFormData({...formData, role: e.target.value})}
                                            className="w-full bg-slate-50 border-2 border-slate-50 rounded-2xl px-5 py-3 text-sm font-bold focus:border-erp-blue/20 focus:bg-white outline-none transition-all"
                                        >
                                            <option value="REQUESTER">REQUESTER (Người yêu cầu)</option>
                                            <option value="DEPT_APPROVER">DEPT_APPROVER (Trưởng bộ phận)</option>
                                            <option value="PROCUREMENT">PROCUREMENT (Bộ phận Mua hàng)</option>
                                            <option value="DIRECTOR">DIRECTOR (Giám đốc)</option>
                                            <option value="CEO">CEO (Tổng giám đốc)</option>
                                            <option value="FINANCE">FINANCE (Kế toán/Tài chính)</option>
                                            <option value="WAREHOUSE">WAREHOUSE (Kho vận)</option>
                                            <option value="PLATFORM_ADMIN">PLATFORM_ADMIN (Quản trị hệ thống)</option>
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Phòng ban</label>
                                        <select 
                                            value={formData.deptId}
                                            onChange={(e) => setFormData({...formData, deptId: e.target.value})}
                                            className="w-full bg-slate-50 border-2 border-slate-50 rounded-2xl px-5 py-3 text-sm font-bold focus:border-erp-blue/20 focus:bg-white outline-none transition-all"
                                        >
                                            <option value="">Chưa phân bổ</option>
                                            {departments?.map((d: any) => (
                                                <option key={d.id} value={d.id}>{d.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Chức danh</label>
                                        <input 
                                            value={formData.jobTitle}
                                            onChange={(e) => setFormData({...formData, jobTitle: e.target.value})}
                                            type="text" 
                                            placeholder="VD: Senior Developer"
                                            className="w-full bg-slate-50 border-2 border-slate-50 rounded-2xl px-5 py-3 text-sm font-bold focus:border-erp-blue/20 focus:bg-white outline-none transition-all"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Mã nhân viên</label>
                                        <input 
                                            value={formData.employeeCode}
                                            onChange={(e) => setFormData({...formData, employeeCode: e.target.value})}
                                            type="text" 
                                            placeholder="VD: EMP001"
                                            className="w-full bg-slate-50 border-2 border-slate-50 rounded-2xl px-5 py-3 text-sm font-bold focus:border-erp-blue/20 focus:bg-white outline-none transition-all"
                                        />
                                    </div>
                                </div>

                                <div className="flex items-center justify-between p-6 bg-slate-50 rounded-3xl border border-slate-100">
                                    <div>
                                        <div className="text-xs font-black text-erp-navy uppercase tracking-tight">Trạng thái tài khoản</div>
                                        <div className="text-[10px] text-slate-400 font-bold uppercase mt-1">Khóa hoặc kích hoạt quyền truy nhập hệ thống</div>
                                    </div>
                                    <div 
                                        onClick={() => setFormData({...formData, isActive: !formData.isActive})}
                                        className={`w-14 h-8 rounded-full cursor-pointer transition-all p-1 flex items-center ${formData.isActive ? 'bg-emerald-500 justify-end' : 'bg-slate-300 justify-start'}`}
                                    >
                                        <div className="w-6 h-6 bg-white rounded-full shadow-md"></div>
                                    </div>
                                </div>

                                <div className="flex gap-4 pt-6">
                                    <button 
                                        type="button"
                                        onClick={() => setShowModal(false)}
                                        className="flex-1 px-8 py-4 bg-slate-100 rounded-3xl font-black text-slate-400 uppercase tracking-widest hover:bg-slate-200 transition-colors"
                                    >
                                        Bỏ qua
                                    </button>
                                    <button 
                                        type="submit"
                                        className="flex-1 px-8 py-4 bg-erp-navy text-white rounded-3xl font-black uppercase tracking-widest shadow-xl shadow-erp-navy/20 hover:scale-[1.02] transition-all"
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
