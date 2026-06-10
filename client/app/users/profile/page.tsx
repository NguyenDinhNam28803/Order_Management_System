"use client";

import React, { useState, useEffect } from "react";
import { useProcurement, User } from "../../context/ProcurementContext";
import { 
    UserCircle, 
    Mail, 
    Phone, 
    Building2, 
    Briefcase, 
    Shield, 
    Calendar,
    IdCard,
    Edit,
    Lock,
    Loader2,
    Save,
    X,
    CheckCircle2
} from "lucide-react";

const ROLE_LABELS: Record<string, string> = {
    REQUESTER: "Nhân viên",
    DEPT_APPROVER: "Trưởng phòng",
    PROCUREMENT: "Chuyên viên mua hàng",
    FINANCE: "Kế toán trưởng",
    WAREHOUSE: "Thủ kho",
    DIRECTOR: "Giám đốc khối",
    CEO: "Tổng giám đốc",
    PLATFORM_ADMIN: "Quản trị hệ thống",
    QA: "Chuyên viên QA",
    SUPPLIER: "Nhà cung cấp",
};

const COMPANY_TYPE_LABELS: Record<string, string> = {
    BUYER: "Công ty mua hàng",
    SUPPLIER: "Nhà cung cấp",
    BOTH: "Cả hai",
};

const ROLE_COLORS: Record<string, string> = {
    REQUESTER: "bg-[#2563EB]/20 text-[#3B82F6] border-[#2563EB]/30",
    DEPT_APPROVER: "bg-emerald-500/10 text-emerald-700 border-emerald-500/30",
    PROCUREMENT: "bg-purple-500/10 text-purple-700 border-purple-500/30",
    FINANCE: "bg-amber-500/10 text-amber-700 border-amber-500/30",
    WAREHOUSE: "bg-orange-500/20 text-orange-700 border-orange-500/30",
    DIRECTOR: "bg-pink-500/20 text-pink-400 border-pink-500/30",
    CEO: "bg-red-500/20 text-red-400 border-red-500/30",
    PLATFORM_ADMIN: "bg-slate-500/20 text-slate-600 border-slate-500/30",
    QA: "bg-teal-500/20 text-teal-400 border-teal-500/30",
    SUPPLIER: "bg-cyan-500/20 text-cyan-700 border-cyan-500/30",
};

function formatDate(dateString: string | Date | undefined): string {
    if (!dateString) return "-";
    const date = new Date(dateString);
    return date.toLocaleDateString("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
    });
}

export default function UserProfilePage() {
    const { fetchUserProfile } = useProcurement();
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const loadProfile = async () => {
            try {
                setLoading(true);
                const profile = await fetchUserProfile();
                setUser(profile);
            } catch (err) {
                setError("Không thể tải thông tin hồ sơ");
            } finally {
                setLoading(false);
            }
        };

        loadProfile();
    }, [fetchUserProfile]);

    if (loading) {
        return (
            <main className="animate-in fade-in duration-500 p-6 min-h-screen bg-[#F8FAFC] flex items-center justify-center">
                <div className="flex items-center gap-3">
                    <Loader2 className="h-6 w-6 animate-spin text-[#2563EB]" />
                    <span className="text-slate-900 text-sm font-medium">Đang tải...</span>
                </div>
            </main>
        );
    }

    if (error || !user) {
        return (
            <main className="animate-in fade-in duration-500 p-6 min-h-screen bg-[#F8FAFC]">
                <div className="max-w-2xl mx-auto mt-20">
                    <div className="bg-[#F1F5F9] rounded-xl border border-slate-200 p-12 text-center shadow-xl">
                        <UserCircle className="mx-auto h-16 w-16 text-slate-900 mb-4" />
                        <h2 className="text-xl font-black text-slate-900 mb-2">Không tìm thấy thông tin</h2>
                        <p className="text-slate-900">{error || "Không tìm thấy thông tin người dùng"}</p>
                    </div>
                </div>
            </main>
        );
    }

    return (
        <main className="animate-in fade-in duration-500 p-6 min-h-screen bg-[#F8FAFC]">
            {/* Header */}
            <div className="mt-4 mb-8 flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-black text-slate-900 tracking-tight">Hồ sơ người dùng</h1>
                    <p className="text-[0.8125rem] text-[#64748B] mt-1">Quản lý thông tin cá nhân và tổ chức</p>
                </div>
                <div className="flex gap-3">
                    <button className="flex items-center gap-2 px-4 py-2.5 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 hover:bg-[#F1F5F9] hover:text-slate-900 transition-all">
                        <Lock size={16} />
                        <span className="hidden sm:inline">Đổi mật khẩu</span>
                    </button>
                    <button className="flex items-center gap-2 bg-[#2563EB] hover:bg-[#1D4ED8] text-white px-4 py-2.5 rounded-xl text-sm font-bold shadow-lg shadow-[#2563EB]/20 transition-all">
                        <Edit size={16} />
                        <span className="hidden sm:inline">Chỉnh sửa</span>
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column - Main Info */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Thông tin cá nhân */}
                    <div className="bg-[#F1F5F9] rounded-xl border border-slate-200 shadow-xl shadow-[#2563EB]/5 overflow-hidden">
                        <div className="px-6 py-4 border-b border-slate-200">
                            <h2 className="text-sm font-black uppercase tracking-wider text-slate-900 flex items-center gap-2">
                                <UserCircle className="h-4 w-4 text-[#2563EB]" />
                                Thông tin cá nhân
                            </h2>
                        </div>
                        <div className="p-6">
                            <div className="flex flex-col sm:flex-row gap-6">
                                {/* Avatar */}
                                <div className="shrink-0">
                                    {user.avatarUrl ? (
                                        <img
                                            src={user.avatarUrl}
                                            alt={user.fullName}
                                            className="h-24 w-24 rounded-2xl object-cover border-2 border-slate-200"
                                        />
                                    ) : (
                                        <div className="h-24 w-24 rounded-2xl bg-gradient-to-br from-[#2563EB] to-[#8B5CF6] flex items-center justify-center text-slate-900 text-3xl font-black border-2 border-slate-200">
                                            {user.fullName?.charAt(0).toUpperCase() || "U"}
                                        </div>
                                    )}
                                </div>

                                {/* Info */}
                                <div className="flex-1 space-y-4">
                                    <div>
                                        <h3 className="text-xl font-black text-slate-900">{user.fullName}</h3>
                                        <span className={`inline-flex items-center px-3 py-1 rounded-lg text-xs font-bold mt-2 border ${ROLE_COLORS[user.role] || "bg-[#2563EB]/20 text-[#2563EB] border-[#2563EB]/30"}`}>
                                            {ROLE_LABELS[user.role] || user.role}
                                        </span>
                                        {user.jobTitle && (
                                            <p className="text-slate-900 mt-2 text-sm">{user.jobTitle}</p>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Contact Details Grid */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6 pt-6 border-t border-slate-200">
                                <div className="flex items-center gap-3">
                                    <div className="h-10 w-10 rounded-xl bg-[#2563EB]/10 flex items-center justify-center shrink-0">
                                        <Mail className="h-5 w-5 text-[#2563EB]" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black uppercase tracking-wider text-slate-900">Email</p>
                                        <p className="text-sm font-bold text-slate-900">{user.email}</p>
                                    </div>
                                </div>

                                {user.phone && (
                                    <div className="flex items-center gap-3">
                                        <div className="h-10 w-10 rounded-xl bg-emerald-500/10 flex items-center justify-center shrink-0">
                                            <Phone className="h-5 w-5 text-emerald-600" />
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black uppercase tracking-wider text-slate-900">Số điện thoại</p>
                                            <p className="text-sm font-bold text-slate-900">{user.phone}</p>
                                        </div>
                                    </div>
                                )}

                                {user.employeeCode && (
                                    <div className="flex items-center gap-3">
                                        <div className="h-10 w-10 rounded-xl bg-purple-500/10 flex items-center justify-center shrink-0">
                                            <IdCard className="h-5 w-5 text-purple-600" />
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black uppercase tracking-wider text-slate-900">Mã nhân viên</p>
                                            <p className="text-sm font-bold text-slate-900">{user.employeeCode}</p>
                                        </div>
                                    </div>
                                )}

                                <div className="flex items-center gap-3">
                                    <div className="h-10 w-10 rounded-xl bg-amber-500/10 flex items-center justify-center shrink-0">
                                        <Shield className="h-5 w-5 text-amber-600" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black uppercase tracking-wider text-slate-900">Trạng thái</p>
                                        <span className={`inline-flex items-center gap-1 text-xs font-bold ${user.isActive ? "text-emerald-600" : "text-red-400"}`}>
                                            {user.isActive ? (
                                                <><CheckCircle2 size={12} /> Đang hoạt động</>
                                            ) : (
                                                "Không hoạt động"
                                            )}
                                        </span>
                                    </div>
                                </div>

                                {user.createdAt && (
                                    <div className="flex items-center gap-3">
                                        <div className="h-10 w-10 rounded-xl bg-pink-500/10 flex items-center justify-center shrink-0">
                                            <Calendar className="h-5 w-5 text-pink-400" />
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black uppercase tracking-wider text-slate-900">Ngày tham gia</p>
                                            <p className="text-sm font-bold text-slate-900">{formatDate(user.createdAt)}</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Thông tin tổ chức */}
                    <div className="bg-[#F1F5F9] rounded-xl border border-slate-200 shadow-xl shadow-[#2563EB]/5 overflow-hidden">
                        <div className="px-6 py-4 border-b border-slate-200">
                            <h2 className="text-sm font-black uppercase tracking-wider text-slate-900 flex items-center gap-2">
                                <Building2 className="h-4 w-4 text-[#2563EB]" />
                                Thông tin tổ chức
                            </h2>
                        </div>
                        <div className="p-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Organization */}
                                <div className="space-y-3">
                                    <h3 className="text-[0.6875rem] font-bold uppercase tracking-widest text-[#64748B]">Tổ chức / Công ty</h3>
                                    {user.organization ? (
                                        <div className="bg-[#FFFFFF] rounded-xl p-5 border border-slate-200">
                                            <div className="flex items-start gap-4">
                                                <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-[#2563EB] to-[#8B5CF6] flex items-center justify-center shrink-0">
                                                    <Building2 className="h-6 w-6 text-white" />
                                                </div>
                                                <div className="min-w-0">
                                                    <h4 className="text-base font-bold text-slate-900 truncate">{user.organization.name}</h4>
                                                    <p className="text-xs text-slate-900">Mã: {user.organization.code}</p>
                                                    {user.organization.companyType && (
                                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-lg text-xs font-bold bg-[#2563EB]/20 text-[#2563EB] border border-[#2563EB]/30 mt-2">
                                                            {COMPANY_TYPE_LABELS[user.organization.companyType] || user.organization.companyType}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        <p className="text-slate-900 italic text-sm">Chưa có thông tin tổ chức</p>
                                    )}
                                </div>

                                {/* Department */}
                                <div className="space-y-3">
                                    <h3 className="text-[0.6875rem] font-bold uppercase tracking-widest text-[#64748B]">Phòng ban</h3>
                                    {user.department && typeof user.department === 'object' ? (
                                        <div className="bg-[#FFFFFF] rounded-xl p-5 border border-slate-200">
                                            <div className="flex items-start gap-4">
                                                <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shrink-0">
                                                    <Briefcase className="h-6 w-6 text-white" />
                                                </div>
                                                <div className="min-w-0">
                                                    <h4 className="text-base font-bold text-slate-900 truncate">{(user.department as { name: string }).name}</h4>
                                                    {(user.department as { code?: string }).code && (
                                                        <p className="text-xs text-slate-900">Mã: {(user.department as { code?: string }).code}</p>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        <p className="text-slate-900 italic text-sm">Chưa có thông tin phòng ban</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Column - Role & Quick Actions */}
                <div className="space-y-6">
                    {/* Vai trò */}
                    <div className="bg-[#F1F5F9] rounded-xl border border-slate-200 shadow-xl shadow-[#2563EB]/5 overflow-hidden">
                        <div className="px-6 py-4 border-b border-slate-200">
                            <h2 className="text-sm font-black uppercase tracking-wider text-slate-900 flex items-center gap-2">
                                <Shield className="h-4 w-4 text-[#2563EB]" />
                                Vai trò hệ thống
                            </h2>
                        </div>
                        <div className="p-6">
                            <div className="space-y-4">
                                <span className={`inline-flex items-center px-4 py-2 rounded-xl text-sm font-bold border ${ROLE_COLORS[user.role] || "bg-[#2563EB]/20 text-[#2563EB] border-[#2563EB]/30"}`}>
                                    {ROLE_LABELS[user.role] || user.role}
                                </span>
                                <p className="text-xs text-slate-900 leading-relaxed">
                                    {user.role === "PLATFORM_ADMIN" && "Có toàn quyền quản trị hệ thống"}
                                    {user.role === "CEO" && "Quyền phê duyệt cao nhất trong tổ chức"}
                                    {user.role === "SUPPLIER" && "Quyền truy cập với tư cách nhà cung cấp"}
                                    {user.role === "REQUESTER" && "Tạo yêu cầu mua hàng (PR)"}
                                    {user.role === "DEPT_APPROVER" && "Phê duyệt yêu cầu trong phòng ban"}
                                    {user.role === "PROCUREMENT" && "Xử lý mua sắm và đơn hàng"}
                                    {user.role === "FINANCE" && "Quản lý ngân sách và thanh toán"}
                                    {user.role === "WAREHOUSE" && "Quản lý nhập kho và tồn kho"}
                                    {user.role === "DIRECTOR" && "Phê duyệt cấp giám đốc khối"}
                                    {user.role === "QA" && "Kiểm tra chất lượng sản phẩm"}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Quick Actions */}
                    <div className="bg-[#F1F5F9] rounded-xl border border-slate-200 shadow-xl shadow-[#2563EB]/5 overflow-hidden">
                        <div className="px-6 py-4 border-b border-slate-200">
                            <h2 className="text-sm font-black uppercase tracking-wider text-slate-900">Thao tác nhanh</h2>
                        </div>
                        <div className="p-4 space-y-2">
                            <button className="w-full flex items-center gap-3 px-4 py-3 bg-[#FFFFFF] hover:bg-[#2563EB]/10 border border-slate-200 hover:border-[#2563EB]/30 rounded-xl text-sm font-bold text-slate-900 hover:text-[#2563EB] transition-all group">
                                <Edit size={16} className="group-hover:scale-110 transition-transform" />
                                Cập nhật thông tin
                            </button>
                            <button className="w-full flex items-center gap-3 px-4 py-3 bg-[#FFFFFF] hover:bg-rose-500/10 border border-slate-200 hover:border-rose-500/30 rounded-xl text-sm font-bold text-slate-900 hover:text-black transition-all group">
                                <Lock size={16} className="group-hover:scale-110 transition-transform" />
                                Đổi mật khẩu
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
}

