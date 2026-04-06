"use client";

import React, { useState } from "react";
import { Lock, Mail, User, ShieldCheck, ArrowRight, CheckCircle2, Zap } from "lucide-react";
import { useProcurement } from "../context/ProcurementContext";
import { useRouter } from "next/navigation";
import Link from 'next/link';

export default function RegisterPage() {
    const { register } = useProcurement();
    const router = useRouter();

    const [form, setForm] = useState({
        name: "",
        email: "",
        password: "",
        role: "REQUESTER"
    });
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");

    const roles = [
        { value: "REQUESTER", label: "Người yêu cầu (Requester)" },
        { value: "DEPT_APPROVER", label: "Trưởng phòng (Manager)" },
        { value: "DIRECTOR", label: "Giám đốc (Director)" },
        { value: "PROCUREMENT", label: "Nhân viên Thu mua" },
        { value: "FINANCE", label: "Kế toán / Tài chính" },
        { value: "WAREHOUSE", label: "Quản lý Kho" },
        { value: "SUPPLIER", label: "Nhà cung cấp" },
        { value: "PLATFORM_ADMIN", label: "Quản trị viên Hệ thống" }
    ];

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError("");

        if (!form.name || !form.email || !form.password) {
            setError("Vui lòng điền đầy đủ các trường bắt buộc.");
            setIsLoading(false);
            return;
        }

        const success = await register(form);
        if (success) {
            router.push("/login");
        } else {
            setError("Đăng ký thất bại. Email có thể đã tồn tại.");
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#0a0e1a] flex items-center justify-center p-6 relative overflow-hidden">
            {/* Background Decorations */}
            <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-600/10 blur-[120px] rounded-full"></div>
            <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-emerald-600/10 blur-[120px] rounded-full"></div>

            <div className="w-full max-w-5xl grid md:grid-cols-2 gap-12 relative z-10 items-center">
                {/* Visual Section */}
                <div className="hidden md:block pr-8 animate-in fade-in slide-in-from-left-12 duration-700">
                    <div className="inline-flex items-center justify-center h-20 w-20 bg-emerald-600 rounded-3xl shadow-2xl shadow-emerald-500/30 mb-8 border border-white/10">
                        <CheckCircle2 size={40} className="text-white" />
                    </div>
                    <h1 className="text-6xl font-black text-white tracking-tighter mb-4 uppercase leading-none">
                        Gia nhập<br /><span className="text-emerald-500">ProcurePro</span>
                    </h1>
                    <p className="text-slate-400 text-lg font-medium mb-12 max-w-md leading-relaxed">
                        Khởi tạo tài khoản doanh nghiệp để bắt đầu tối ưu hóa quy trình mua sắm của bạn ngay hôm nay.
                    </p>

                    <div className="space-y-6">
                        <div className="flex items-center gap-4 group">
                            <div className="h-12 w-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-emerald-500 group-hover:bg-emerald-500 group-hover:text-white transition-all">
                                <ShieldCheck size={20} />
                            </div>
                            <div>
                                <h4 className="text-sm font-black text-white uppercase tracking-widest">Bảo mật đa lớp</h4>
                                <p className="text-xs text-slate-500 font-bold">Dữ liệu được mã hóa chuẩn Enterprise.</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-4 group">
                            <div className="h-12 w-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-emerald-500 group-hover:bg-emerald-500 group-hover:text-white transition-all">
                                <Zap size={20} />
                            </div>
                            <div>
                                <h4 className="text-sm font-black text-white uppercase tracking-widest">Kết nối tức thì</h4>
                                <p className="text-xs text-slate-500 font-bold">Phê duyệt PR/PO chỉ trong tích tắc.</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Register Form Section */}
                <div className="w-full max-w-md mx-auto animate-in fade-in slide-in-from-right-12 duration-700">
                    <div className="bg-[#0f1525] border border-white/10 rounded-[40px] p-10 shadow-2xl shadow-black/50 backdrop-blur-2xl relative overflow-hidden group">
                        <div className="absolute top-0 left-0 w-full h-1 bg-linear-to-r from-transparent via-emerald-500/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-1000"></div>

                        <div className="mb-8 text-center md:text-left">
                            <h2 className="text-xl font-black text-white uppercase tracking-widest mb-2">Đăng ký tài khoản</h2>
                            <p className="text-slate-500 text-xs font-bold">Khởi tạo định danh công việc mới.</p>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-5">
                            {error && (
                                <div className="bg-red-500/10 border border-red-500/20 text-red-500 text-[10px] font-black py-4 px-4 rounded-2xl text-center uppercase tracking-widest animate-pulse">
                                    {error}
                                </div>
                            )}

                            <div className="space-y-2">
                                <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 ml-1">Họ và Tên</label>
                                <div className="relative group">
                                    <div className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 flex items-center justify-center text-slate-500 group-focus-within:text-emerald-500 transition-colors">
                                        <User size={18} />
                                    </div>
                                    <input
                                        type="text"
                                        required
                                        value={form.name}
                                        onChange={(e) => setForm({ ...form, name: e.target.value })}
                                        placeholder="Nhập họ tên đầy đủ..."
                                        className="w-full bg-[#161c31] border border-white/5 rounded-2xl pl-14 pr-6 py-4 text-white text-sm outline-none focus:border-emerald-500/50 focus:ring-4 focus:ring-emerald-500/5 transition-all font-bold placeholder:text-slate-700"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 ml-1">Email Công sở</label>
                                <div className="relative group">
                                    <div className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 flex items-center justify-center text-slate-500 group-focus-within:text-emerald-500 transition-colors">
                                        <Mail size={18} />
                                    </div>
                                    <input
                                        type="email"
                                        required
                                        value={form.email}
                                        onChange={(e) => setForm({ ...form, email: e.target.value })}
                                        placeholder="user@name.com"
                                        className="w-full bg-[#161c31] border border-white/5 rounded-2xl pl-14 pr-6 py-4 text-white text-sm outline-none focus:border-emerald-500/50 focus:ring-4 focus:ring-emerald-500/5 transition-all font-bold placeholder:text-slate-700"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 ml-1">Mật khẩu</label>
                                <div className="relative group">
                                    <div className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 flex items-center justify-center text-slate-500 group-focus-within:text-emerald-500 transition-colors">
                                        <Lock size={18} />
                                    </div>
                                    <input
                                        type="password"
                                        required
                                        value={form.password}
                                        onChange={(e) => setForm({ ...form, password: e.target.value })}
                                        placeholder="••••••••"
                                        className="w-full bg-[#161c31] border border-white/5 rounded-2xl pl-14 pr-6 py-4 text-white text-sm outline-none focus:border-emerald-500/50 focus:ring-4 focus:ring-emerald-500/5 transition-all font-bold placeholder:text-slate-700"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 ml-1">Vai trò (Role)</label>
                                <select
                                    className="w-full bg-[#161c31] border border-white/5 rounded-2xl px-6 py-4 text-white text-sm outline-none focus:border-emerald-500/50 transition-all font-black appearance-none cursor-pointer"
                                    value={form.role}
                                    onChange={(e) => setForm({ ...form, role: e.target.value })}
                                >
                                    {roles.map(r => (
                                        <option key={r.value} value={r.value} className="bg-[#0f1525]">{r.label}</option>
                                    ))}
                                </select>
                            </div>

                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-black uppercase tracking-[0.2em] text-[11px] py-5 rounded-2xl shadow-xl shadow-emerald-600/20 transition-all active:scale-[0.98] flex items-center justify-center gap-3 relative group overflow-hidden mt-6"
                            >
                                {isLoading ? (
                                    <div className="h-5 w-5 border-3 border-white/20 border-t-white rounded-full animate-spin"></div>
                                ) : (
                                    <>
                                        Thực hiện Đăng ký
                                        <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                                    </>
                                )}
                            </button>
                        </form>

                        <div className="mt-8 text-center border-t border-white/5 pt-6">
                            <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Đã có tài khoản? </span>
                            <Link href="/login" className="text-[10px] font-black text-emerald-500 uppercase tracking-widest hover:text-emerald-400 ml-1 underline underline-offset-4 decoration-emerald-500/50 transition-all">Đăng nhập</Link>
                        </div>
                    </div>
                </div>
            </div>

            <div className="absolute bottom-8 left-1/2 -translate-x-1/2">
                <p className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-800">Registration Portal v1.0</p>
            </div>
        </div>
    );
}
