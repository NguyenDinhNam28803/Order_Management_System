"use client";

import React, { useState } from "react";
import { Lock, Mail, ArrowRight, ShieldCheck, Zap } from "lucide-react";
import { useProcurement } from "../context/ProcurementContext";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
    const { login } = useProcurement();
    const router = useRouter();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setTimeout(() => {
            login(email);
            router.push("/");
        }, 1000);
    };

    return (
        <div className="min-h-screen bg-[#0a0e1a] flex items-center justify-center p-6 relative overflow-hidden">
            {/* Background Accents */}
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/10 blur-[120px] rounded-full"></div>
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-600/10 blur-[120px] rounded-full"></div>

            <div className="w-full max-w-md relative z-10">
                <div className="text-center mb-10">
                    <div className="inline-flex items-center justify-center h-16 w-16 bg-blue-600 rounded-2xl shadow-2xl shadow-blue-500/20 mb-6">
                        <ShieldCheck size={32} className="text-white" />
                    </div>
                    <h1 className="text-3xl font-black text-white tracking-tight mb-2 uppercase">ERP</h1>
                    <p className="text-slate-500 font-medium">Hệ thống Quản trị Mua sắm Thế hệ mới</p>
                </div>

                <div className="bg-[#0f1525] border border-white/5 rounded-3xl p-8 shadow-2xl shadow-black/50 backdrop-blur-xl">
                    <form onSubmit={handleLogin} className="space-y-6">
                        <div>
                            <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">Email Công ty</label>
                            <div className="relative group">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-blue-500 transition-colors" size={18} />
                                <input
                                    type="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="name@company.com"
                                    className="w-full bg-[#151d35] border border-white/5 rounded-2xl pl-12 pr-4 py-4 text-white text-sm outline-none focus:border-blue-500/50 focus:ring-4 focus:ring-blue-500/10 transition-all font-medium"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">Mật khẩu</label>
                            <div className="relative group">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-blue-500 transition-colors" size={18} />
                                <input
                                    type="password"
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    className="w-full bg-[#151d35] border border-white/5 rounded-2xl pl-12 pr-4 py-4 text-white text-sm outline-none focus:border-blue-500/50 focus:ring-4 focus:ring-blue-500/10 transition-all font-medium"
                                />
                            </div>
                        </div>

                        <div className="flex justify-end">
                            <a href="#" className="text-xs font-bold text-blue-500 hover:text-blue-400 transition-colors">Quên mật khẩu?</a>
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black uppercase tracking-widest text-xs py-4 rounded-2xl shadow-xl shadow-blue-600/20 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                        >
                            {isLoading ? (
                                <div className="h-5 w-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                            ) : (
                                <>Đăng nhập Hệ thống <ArrowRight size={16} /></>
                            )}
                        </button>
                    </form>

                    <div className="mt-10 pt-8 border-t border-white/5 text-center px-4">
                        <div className="bg-blue-500/10 rounded-2xl p-4 border border-blue-500/10 mb-6 group cursor-default">
                            <div className="flex items-center gap-3 text-left">
                                <div className="h-8 w-8 rounded-lg bg-blue-500/20 flex items-center justify-center shrink-0">
                                    <Zap size={16} className="text-blue-400" />
                                </div>
                                <p className="text-[10px] text-blue-300 font-bold leading-relaxed">
                                    Bảo mật đa lớp bởi AI. Vui lòng không chia sẻ tài khoản cho người khác.
                                </p>
                            </div>
                        </div>
                        <p className="text-slate-500 text-xs font-medium">Chưa có tài khoản? <Link href="/register" className="text-white font-black hover:text-blue-400 underline underline-offset-4 decoration-blue-500/50 transition-all">Đăng ký ngay</Link></p>
                    </div>
                </div>

                <p className="text-center mt-8 text-[10px] font-black uppercase tracking-[0.2em] text-slate-700">Powered by Antigravity Engine v2.0</p>
            </div>
        </div>
    );
}
