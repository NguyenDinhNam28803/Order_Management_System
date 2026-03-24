"use client";

import React, { useState } from "react";
import { Lock, Mail, ArrowRight, ShieldCheck, Zap } from "lucide-react";
import { useProcurement } from "../context/ProcurementContext";
import { useRouter } from "next/navigation";
import Link from "next/link";
<<<<<<< HEAD
=======
import Cookies from 'js-cookie';
>>>>>>> 2a33e5440bf544c21f0e020a6d254b6bc39af67e

export default function LoginPage() {
    const { login, users } = useProcurement();
    const router = useRouter();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");

<<<<<<< HEAD
=======
    const token = Cookies.get('accessToken');
    if(token) {
        console.log("Bạn đã đăng nhập")
    }

>>>>>>> 2a33e5440bf544c21f0e020a6d254b6bc39af67e

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError("");
        
        const success = await login(email, password);
        if (success) {
            router.push("/");
        } else {
            setError("Đăng nhập thất bại. Vui lòng kiểm tra lại email hoặc mật khẩu.");
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#0a0e1a] flex items-center justify-center p-6 relative overflow-hidden">
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/10 blur-[120px] rounded-full"></div>
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-600/10 blur-[120px] rounded-full"></div>

            <div className="w-full max-w-4xl grid md:grid-cols-2 gap-8 relative z-10 items-center">
                <div className="hidden md:block pr-8">
                    <div className="inline-flex items-center justify-center h-16 w-16 bg-blue-600 rounded-2xl shadow-2xl shadow-blue-500/20 mb-8">
                        <ShieldCheck size={32} className="text-white" />
                    </div>
                    <h1 className="text-5xl font-black text-white tracking-tighter mb-4 uppercase leading-none">Procure<span className="text-blue-500">Pro</span></h1>
                    <p className="text-slate-400 text-lg font-medium mb-8">Hệ thống Quản trị Mua sắm & Chuỗi cung ứng tập trung dành cho doanh nghiệp Enterprise.</p>
                    
                    <div className="space-y-4">
                        <div className="flex items-center justify-between mb-2">
                            <div className="text-[10px] font-black uppercase tracking-widest text-slate-500">Tài khoản Demo (Enterprise Roles):</div>
<<<<<<< HEAD
                            <div className="text-[10px] font-bold text-blue-500 bg-blue-500/10 px-2 py-0.5 rounded-full">{users.length} Roles</div>
                        </div>
                        <div className="grid grid-cols-2 gap-2 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                            {users.map(u => (
                                <button 
=======
                            <div className="text-[10px] font-bold text-blue-500 bg-blue-500/10 px-2 py-0.5 rounded-full">{users?.length} Roles</div>
                        </div>
                        <div className="grid grid-cols-2 gap-2 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                            {users?.map(u => (
                                <button
>>>>>>> 2a33e5440bf544c21f0e020a6d254b6bc39af67e
                                    key={u.id}
                                    onClick={() => { setEmail(u.email); setPassword("password123"); }}
                                    className="bg-white/5 border border-white/5 hover:bg-white/10 hover:border-blue-500/30 p-2.5 rounded-xl text-left transition-all group relative overflow-hidden"
                                >
                                    <div className="absolute top-0 right-0 p-1 opacity-20 group-hover:opacity-100 transition-opacity">
                                        <Zap size={10} className="text-blue-400" />
                                    </div>
                                    <div className="text-[9px] font-black text-blue-400 uppercase mb-0.5 truncate">{u.role.replace('_', ' ')}</div>
                                    <div className="text-xs font-bold text-white group-hover:text-blue-200 truncate">{u.name}</div>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="w-full max-w-md mx-auto">
                    <div className="md:hidden text-center mb-10">
                         <h1 className="text-3xl font-black text-white tracking-tight mb-2 uppercase">ERP</h1>
                         <p className="text-slate-500 font-medium text-sm">Hệ thống Quản trị Mua sắm</p>
                    </div>

                    <div className="bg-[#0f1525] border border-white/5 rounded-3xl p-8 shadow-2xl shadow-black/50 backdrop-blur-xl">
                        <form onSubmit={handleLogin} className="space-y-6">
                            {error && (
                                <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-[10px] font-bold py-3 px-4 rounded-xl text-center uppercase tracking-wider">
                                    {error}
                                </div>
                            )}
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

                        <div className="mt-8 pt-6 border-t border-white/5 text-center px-4 md:hidden">
                            <p className="text-slate-500 text-xs font-medium italic">Vui lòng sử dụng máy tính để trải nghiệm đầy đủ các vai trò.</p>
                        </div>
                    </div>
                </div>


                <p className="text-center mt-8 text-[10px] font-black uppercase tracking-[0.2em] text-slate-700">Powered by Antigravity Engine v2.0</p>
            </div>
        </div>
    );
}
