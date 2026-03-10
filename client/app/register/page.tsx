"use client";

import React, { useState } from "react";
import { User, Mail, Lock, ArrowRight, ShieldCheck, CheckCircle2 } from "lucide-react";
import { useProcurement } from "../context/ProcurementContext";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function RegisterPage() {
    const { register } = useProcurement();
    const router = useRouter();
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    const handleRegister = (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setTimeout(() => {
            register(name, email);
            router.push("/");
        }, 1000);
    };

    return (
        <div className="min-h-screen bg-[#0a0e1a] flex items-center justify-center p-6 relative overflow-hidden">
            {/* Background Accents */}
            <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-emerald-600/10 blur-[120px] rounded-full"></div>
            <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/10 blur-[120px] rounded-full"></div>

            <div className="w-full max-w-md relative z-10">
                <div className="text-center mb-10 text-white">
                    <div className="inline-flex items-center justify-center h-16 w-16 bg-emerald-600 rounded-2xl shadow-2xl shadow-emerald-500/20 mb-6">
                        <User size={32} />
                    </div>
                    <h1 className="text-3xl font-black tracking-tight mb-2 uppercase">Gia nhập Hệ thống</h1>
                    <p className="text-slate-500 font-medium">Khởi tạo định danh nhân viên ERP</p>
                </div>

                <div className="bg-[#0f1525] border border-white/5 rounded-3xl p-8 shadow-2xl shadow-black/50 backdrop-blur-xl">
                    <form onSubmit={handleRegister} className="space-y-6">
                        <div>
                            <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">Họ và Tên</label>
                            <div className="relative group">
                                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-emerald-500 transition-colors" size={18} />
                                <input
                                    type="text"
                                    required
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="Nguyễn Văn A"
                                    className="w-full bg-[#151d35] border border-white/5 rounded-2xl pl-12 pr-4 py-4 text-white text-sm outline-none focus:border-emerald-500/50 focus:ring-4 focus:ring-emerald-500/10 transition-all font-medium"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">Email Công ty</label>
                            <div className="relative group">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-emerald-500 transition-colors" size={18} />
                                <input
                                    type="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="name@company.com"
                                    className="w-full bg-[#151d35] border border-white/5 rounded-2xl pl-12 pr-4 py-4 text-white text-sm outline-none focus:border-emerald-500/50 focus:ring-4 focus:ring-emerald-500/10 transition-all font-medium"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">Mật khẩu</label>
                            <div className="relative group">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-emerald-500 transition-colors" size={18} />
                                <input
                                    type="password"
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    className="w-full bg-[#151d35] border border-white/5 rounded-2xl pl-12 pr-4 py-4 text-white text-sm outline-none focus:border-emerald-500/50 focus:ring-4 focus:ring-emerald-500/10 transition-all font-medium"
                                />
                            </div>
                        </div>

                        <div className="bg-emerald-500/5 rounded-2xl p-4 border border-emerald-500/10 flex items-start gap-4">
                            <CheckCircle2 size={18} className="text-emerald-500 shrink-0" />
                            <p className="text-[10px] text-emerald-300/70 font-medium leading-relaxed">
                                Bằng cách đăng ký, bạn đồng ý tuân thủ các quy định về an toàn dữ liệu và bảo mật hệ thống của công ty.
                            </p>
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-black uppercase tracking-widest text-xs py-4 rounded-2xl shadow-xl shadow-emerald-600/20 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                        >
                            {isLoading ? (
                                <div className="h-5 w-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                            ) : (
                                <>Xác nhận Đăng ký <ArrowRight size={16} /></>
                            )}
                        </button>
                    </form>

                    <div className="mt-8 pt-8 border-t border-white/5 text-center">
                        <p className="text-slate-500 text-xs font-medium">Đã có tài khoản? <Link href="/login" className="text-white font-black hover:text-emerald-400 underline underline-offset-4 decoration-emerald-500/50 transition-all">Quay lại Đăng nhập</Link></p>
                    </div>
                </div>
            </div>
        </div>
    );
}
