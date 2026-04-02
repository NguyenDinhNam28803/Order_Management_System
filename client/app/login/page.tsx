"use client";

import React, { useState } from "react";
import { Lock, Mail, ArrowRight, ShieldCheck, Zap } from "lucide-react";
import { useProcurement } from "../context/ProcurementContext";
import { useRouter } from "next/navigation";
import Link from 'next/link';
import Cookies from 'js-cookie';

export default function LoginPage() {
    const { login, users } = useProcurement();
    const router = useRouter();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");

    const token = Cookies.get('accessToken');
    if(token) {
        // We could redirect here, but usually it's handled in a layout or middleware
        // console.log("User already logged in");
    }

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError("");
        
        try {
            const success = await login(email, password);
            if (success) {
                router.push("/");
            } else {
                setError("Đăng nhập thất bại. Vui lòng kiểm tra lại email hoặc mật khẩu.");
                setIsLoading(false);
            }
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : "Đã xảy ra lỗi trong quá trình đăng nhập.";
            setError(errorMessage);
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#0a0e1a] flex items-center justify-center p-6 relative overflow-hidden">
            {/* Background Decorations */}
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/10 blur-[120px] rounded-full"></div>
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-600/10 blur-[120px] rounded-full"></div>

            <div className="w-full max-w-5xl grid md:grid-cols-2 gap-12 relative z-10 items-center">
                {/* Visual Section */}
                <div className="hidden md:block pr-8 animate-in fade-in slide-in-from-left-12 duration-700">
                    <div className="inline-flex items-center justify-center h-20 w-20 bg-blue-600 rounded-3xl shadow-2xl shadow-blue-500/30 mb-8 border border-white/10">
                        <ShieldCheck size={40} className="text-white" />
                    </div>
                    <h1 className="text-6xl font-black text-white tracking-tighter mb-4 uppercase leading-none">
                        Procure<span className="text-blue-500">Pro</span>
                    </h1>
                    <p className="text-slate-400 text-lg font-medium mb-12 max-w-md">
                        Hệ thống Quản trị Mua sắm & Chuỗi cung ứng tập trung dành cho doanh nghiệp Enterprise.
                    </p>
                    
                    <div className="space-y-4">
                        <div className="flex items-center justify-between mb-4">
                            <div className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Tài khoản Demo (Quick Login):</div>
                            <div className="text-[10px] font-black text-blue-500 bg-blue-500/10 px-3 py-1 rounded-full border border-blue-500/20">{users?.length || 0} Roles available</div>
                        </div>
                        <div className="grid grid-cols-2 gap-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                            {[
                                { name: "IT Requester", email: "it.requester@innhub.com", role: "REQUESTER" },
                                { name: "Dept Approver", email: "it.manager@innhub.com", role: "DEPT_APPROVER" },
                                { name: "Director", email: "director@innhub.com", role: "DIRECTOR" },
                                { name: "CEO", email: "ceo@innhub.com", role: "CEO" },
                                { name: "CFO (Finance)", email: "cfo@innhub.com", role: "FINANCE" },
                                { name: "System Admin", email: "admin@innhub.com", role: "ADMIN" }
                            ].map((u, idx) => (
                                <button 
                                    key={idx}
                                    type="button"
                                    onClick={() => { setEmail(u.email); setPassword("password123"); }}
                                    className="bg-white/5 border border-white/5 hover:bg-white/10 hover:border-blue-500/40 p-4 rounded-2xl text-left transition-all group relative overflow-hidden active:scale-95"
                                >
                                    <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-100 transition-opacity">
                                        <Zap size={12} className="text-blue-400" />
                                    </div>
                                    <div className="text-[9px] font-black text-blue-400 uppercase tracking-widest mb-1 truncate">{u.role}</div>
                                    <div className="text-sm font-black text-white group-hover:text-blue-100 truncate">{u.name}</div>
                                    <div className="text-[10px] text-slate-500 truncate mt-1">{u.email}</div>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Login Form Section */}
                <div className="w-full max-w-md mx-auto animate-in fade-in slide-in-from-right-12 duration-700">
                    <div className="md:hidden text-center mb-10">
                         <h1 className="text-4xl font-black text-white tracking-tighter mb-2 uppercase">PROCURE<span className="text-blue-500">PRO</span></h1>
                         <p className="text-slate-500 font-bold text-xs uppercase tracking-widest">Enterprise ERP System</p>
                    </div>

                    <div className="bg-[#0f1525] border border-white/10 rounded-[40px] p-10 shadow-2xl shadow-black/50 backdrop-blur-2xl relative overflow-hidden group">
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-blue-500/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-1000"></div>
                        
                        <div className="mb-10">
                            <h2 className="text-xl font-black text-white uppercase tracking-widest mb-2">Đăng nhập</h2>
                            <p className="text-slate-500 text-xs font-bold">Vui lòng nhập thông tin xác thực doanh nghiệp.</p>
                        </div>

                        <form onSubmit={handleLogin} className="space-y-6">
                            {error && (
                                <div className="bg-red-500/10 border border-red-500/20 text-red-500 text-[10px] font-black py-4 px-4 rounded-2xl text-center uppercase tracking-widest animate-pulse">
                                    {error}
                                </div>
                            )}
                            
                            <div className="space-y-2">
                                <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 ml-1">Email Công ty</label>
                                <div className="relative group">
                                    <div className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 flex items-center justify-center text-slate-500 group-focus-within:text-blue-500 transition-colors">
                                        <Mail size={20} />
                                    </div>
                                    <input
                                        type="email"
                                        required
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder="name@company.com"
                                        className="w-full bg-[#161c31] border border-white/5 rounded-2xl pl-14 pr-6 py-5 text-white text-sm outline-none focus:border-blue-500/50 focus:ring-4 focus:ring-blue-500/5 transition-all font-bold placeholder:text-slate-700"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <div className="flex justify-between items-end mb-2">
                                    <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 ml-1">Mật khẩu</label>
                                    <button type="button" className="text-[9px] font-black text-blue-500 uppercase tracking-widest hover:text-blue-400 transition-colors">Quên mật khẩu?</button>
                                </div>
                                <div className="relative group">
                                    <div className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 flex items-center justify-center text-slate-500 group-focus-within:text-blue-500 transition-colors">
                                        <Lock size={20} />
                                    </div>
                                    <input
                                        type="password"
                                        required
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        placeholder="••••••••"
                                        className="w-full bg-[#161c31] border border-white/5 rounded-2xl pl-14 pr-6 py-5 text-white text-sm outline-none focus:border-blue-500/50 focus:ring-4 focus:ring-blue-500/5 transition-all font-bold placeholder:text-slate-700"
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black uppercase tracking-[0.2em] text-[11px] py-5 rounded-2xl shadow-xl shadow-blue-600/20 transition-all active:scale-[0.98] flex items-center justify-center gap-3 relative group overflow-hidden mt-8 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isLoading ? (
                                    <div className="h-5 w-5 border-3 border-white/20 border-t-white rounded-full animate-spin"></div>
                                ) : (
                                    <>
                                        Đăng nhập Hệ thống
                                        <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                                    </>
                                )}
                            </button>
                        </form>

                        <div className="mt-12 pt-8 border-t border-white/5 text-center flex flex-col gap-4">
                            <p className="text-slate-600 text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2">
                                <span className="h-1 w-1 bg-slate-700 rounded-full"></span>
                                Secure Enterprise SSO Powered
                                <span className="h-1 w-1 bg-slate-700 rounded-full"></span>
                            </p>
                            <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest">
                                Chưa có tài khoản? <Link href="/register" className="text-blue-500 hover:text-blue-400 underline underline-offset-4 ml-1">Đăng ký ngay</Link>
                            </p>
                        </div>
                    </div>

                    <div className="mt-8 flex justify-center gap-6">
                        <Link href="/help" className="text-[10px] font-black text-slate-600 uppercase tracking-widest hover:text-slate-400 transition-colors">Trợ giúp</Link>
                        <Link href="/privacy" className="text-[10px] font-black text-slate-600 uppercase tracking-widest hover:text-slate-400 transition-colors">Bảo mật</Link>
                        <Link href="/terms" className="text-[10px] font-black text-slate-600 uppercase tracking-widest hover:text-slate-400 transition-colors">Điều khoản</Link>
                    </div>
                </div>
            </div>

            <div className="absolute bottom-8 left-1/2 -translate-x-1/2">
                <p className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-800">Antigravity Engine v2.0</p>
            </div>
        </div>
    );
}
