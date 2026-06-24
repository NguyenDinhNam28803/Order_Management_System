"use client";

import React, { useState } from "react";
import { useProcurement } from "../context/ProcurementContext";
import { useRouter } from "next/navigation";
import Cookies from 'js-cookie';

export default function LoginPage() {
    const { login, users } = useProcurement();
    const router = useRouter();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");
    const [sidebarOpen, setSidebarOpen] = useState(false);

    const demoUsers = [
        { name: "IT Requester", email: "itrequesterprocuresmart@gmail.com", role: "REQUESTER" },
        { name: "IT Manager", email: "lyhung.dn81@gmail.com", role: "DEPT_APPROVER" },
        { name: "Procurement", email: "procurementprocuresmart@gmail.com", role: "PROCUREMENT" },
        { name: "Finance", email: "financeprocuresmart@gmail.com", role: "FINANCE" },
        { name: "Warehouse", email: "hunglctb00380@fpt.edu.vn", role: "WAREHOUSE" },
        { name: "Admin", email: "adminprocuresmart@gmail.com", role: "PLATFORM_ADMIN" },
    ];

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError("");

        try {
            const success = await login(email, password);
            if (success) {
                const userCookie = Cookies.get('user');
                const user = userCookie ? JSON.parse(userCookie) : null;
                if (user?.role === 'SUPPLIER') {
                    router.push("/supplier");
                } else {
                    router.push("/");
                }
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
        <div className="min-h-screen bg-[#F8FAFC] flex flex-col font-sans selection:bg-[#2563EB] selection:text-white">
            {/* Top Bar */}
            <div className="h-12 border-b border-[#E2E8F0] flex items-center justify-between px-6 bg-[#F1F5F9] z-50">
                <div className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-900">Sign In</div>
                <div className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#94A3B8]">
                    /Login — <span className="text-slate-900">Editorial Split Layout</span>
                </div>
            </div>

            <div className="flex-1 flex flex-col md:flex-row">
                {/* Left Panel - Brand */}
                <div className="flex-1 bg-[#0F172A] relative flex flex-col justify-center px-12 md:px-20 py-20 overflow-hidden">
                    {/* Background Subtle Gradient */}
                    <div className="absolute inset-0 bg-linear-to-br from-[#2A2A25] to-transparent opacity-50"></div>

                    <div className="relative z-10 flex flex-col h-full">
                        <div className="flex items-center gap-3 mb-auto">
                            <div className="w-10 h-10 bg-[#2563EB] rounded-lg flex items-center justify-center text-white font-serif text-xl font-bold shadow-xl shadow-[#2563EB]/20">P</div>
                            <span className="text-xl font-serif font-black text-bg-primary tracking-tight">ProcureSmart</span>
                        </div>

                        <div className="my-auto max-w-xl">
                            <h1 className="text-5xl md:text-7xl font-serif font-bold leading-[1.1] tracking-tight mb-8">
                                <span className="text-white">Mua sắm thông minh,</span> <span className="italic text-[#2563EB]">quy trình tinh gọn.</span>
                            </h1>
                            <p className="text-lg md:text-xl text-[#94A3B8] leading-relaxed font-medium max-w-lg">
                                Một hệ thống duy nhất cho toàn bộ chu trình Procure-to-Pay — từ yêu cầu, phê duyệt đa cấp, RFQ, nhập kho đến đối soát và thanh toán. Tự động hoá bằng AI, minh bạch bằng audit trail.
                            </p>
                        </div>

                        <div className="mt-auto pt-12 flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-[#55554F]">
                            <div>Phiên bản 4.2 • Q2 2026</div>
                            <div>SSO • SOC 2 TYPE II</div>
                        </div>
                    </div>
                </div>

                {/* Right Panel - Form */}
                <div className="flex-1 bg-[#F8FAFC] flex flex-col justify-center px-12 md:px-24 py-20 relative">
                    <div className="max-w-md w-full mx-auto">
                        <div className="mb-12">
                            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[#94A3B8] mb-4">Đăng nhập doanh nghiệp</p>
                            <h2 className="text-4xl md:text-5xl font-serif font-bold text-slate-900">
                                Chào mừng <span className="italic font-medium text-[#6B6658]">trở lại.</span>
                            </h2>
                        </div>

                        <form onSubmit={handleLogin} className="space-y-8">
                            {error && (
                                <div className="p-4 bg-[#A52A2A]/5 border border-[#A52A2A]/20 text-[#A52A2A] text-[10px] font-black uppercase tracking-widest rounded-xl">
                                    {error}
                                </div>
                            )}

                            <div className="space-y-3">
                                <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-[#94A3B8] ml-1">Email Công ty</label>
                                <input
                                    type="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="lam@procuresmart.vn"
                                    className="w-full bg-[#F1F5F9] border border-[#E2E8F0] rounded-xl px-6 py-4 text-slate-900 text-sm outline-none focus:border-[#000000] transition-all font-medium placeholder:text-[#E2E8F0]"
                                />
                            </div>

                            <div className="space-y-3">
                                <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-[#94A3B8] ml-1">Mật khẩu</label>
                                <input
                                    type="password"
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••••••"
                                    className="w-full bg-[#F1F5F9] border border-[#E2E8F0] rounded-xl px-6 py-4 text-slate-900 text-sm outline-none focus:border-[#000000] transition-all font-medium placeholder:text-[#E2E8F0]"
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full bg-[#0F172A] hover:bg-black text-[#F8FAFC] font-black text-sm py-4 rounded-xl transition-all flex items-center justify-center gap-2 group disabled:opacity-50"
                            >
                                {isLoading ? "Đang xử lý..." : "Đăng nhập · ↵"}
                            </button>

                            <div className="flex justify-between items-center pt-4">
                                <button type="button" className="text-[10px] font-black uppercase tracking-widest text-[#94A3B8] hover:text-slate-900 transition-colors border-b border-transparent hover:border-[#000000]">
                                    Quên mật khẩu?
                                </button>
                                <button type="button" className="text-[10px] font-black uppercase tracking-widest text-[#94A3B8] hover:text-slate-900 transition-colors border-b border-transparent hover:border-[#000000]">
                                    Liên hệ quản trị
                                </button>
                            </div>
                        </form>

                        <div className="mt-12 pt-12 border-t border-[#E2E8F0]">
                            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[#94A3B8] mb-6">Truy cập nhanh Demo</p>
                            <div className="grid grid-cols-2 gap-3">
                                {demoUsers.map((u, i) => (
                                    <button
                                        key={i}
                                        type="button"
                                        onClick={() => { setEmail(u.email); setPassword(""); }}
                                        className="p-3 bg-[#FFFFFF] border border-[#E2E8F0] rounded-xl text-left hover:border-[#000000] transition-all group flex flex-col gap-1"
                                    >
                                        <div className="text-[8px] font-black text-black uppercase tracking-widest">{u.role}</div>
                                        <div className="text-[11px] font-bold text-slate-900 truncate">{u.name}</div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

