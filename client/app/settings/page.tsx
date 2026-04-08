"use client";

import React from "react";
import { Settings, Shield, Bell, Database, Save } from "lucide-react";

export default function SettingsPage() {
    return (
        <main className="animate-in fade-in duration-500 p-6 min-h-screen bg-[#0F1117] text-[#F8FAFC]">
            <div className="mt-8 mb-12">
                <h1 className="text-2xl font-black text-[#F8FAFC] tracking-tight">Cài đặt hệ thống</h1>
                <p className="text-sm text-text-secondary mt-1">Cấu hình tham số nghiệp vụ và bảo mật toàn hệ thống.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                <div className="space-y-2">
                    <button className="w-full flex items-center gap-3 px-4 py-3 bg-[#161922] border border-[rgba(148,163,184,0.1)] rounded-xl text-sm font-bold text-[#F8FAFC] shadow-sm">
                        <Shield size={18} /> Phân quyền & Bảo mật
                    </button>
                    <button className="w-full flex items-center gap-3 px-4 py-3 hover:bg-[#161922] text-[#94A3B8] rounded-xl text-sm font-bold transition-all">
                        <Bell size={18} /> Thông báo & Email
                    </button>
                    <button className="w-full flex items-center gap-3 px-4 py-3 hover:bg-[#161922] text-[#94A3B8] rounded-xl text-sm font-bold transition-all">
                        <Database size={18} /> Kết nối Cơ sở dữ liệu
                    </button>
                </div>

                <div className="md:col-span-3 space-y-8">
                    <div className="bg-[#161922] rounded-2xl border border-[rgba(148,163,184,0.1)] p-8 shadow-xl shadow-[#3B82F6]/5">
                        <h3 className="text-sm font-black uppercase text-[#F8FAFC] mb-8 border-b border-[rgba(148,163,184,0.1)] pb-4">Tham số nghiệp vụ Thu mua</h3>
                        <div className="max-w-xl space-y-6">
                            <div className="grid grid-cols-2 gap-8">
                                <div>
                                    <label className="block text-[10px] font-black uppercase tracking-widest text-[#64748B] mb-2">Ngưỡng dung sai (%)</label>
                                    <input type="number" className="w-full px-4 py-3 bg-[#0F1117] border border-[rgba(148,163,184,0.1)] rounded-xl text-xs font-bold text-[#F8FAFC] focus:outline-none focus:border-[#3B82F6]/30 focus:bg-[#161922] transition-all" defaultValue={2} />
                                    <p className="text-[10px] text-[#64748B] mt-1">Chênh lệch tối đa cho phép giữa PO và Invoice.</p>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black uppercase tracking-widest text-[#64748B] mb-2">Loại tiền tệ mặc định</label>
                                    <select className="w-full px-4 py-3 bg-[#0F1117] border border-[rgba(148,163,184,0.1)] rounded-xl text-xs font-bold text-[#F8FAFC] focus:outline-none focus:border-[#3B82F6]/30 focus:bg-[#161922] transition-all">
                                        <option>VND (₫)</option>
                                        <option>USD ($)</option>
                                        <option>EUR (€)</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-[10px] font-black uppercase tracking-widest text-[#64748B] mb-2">Quy tắc Budget Lock</label>
                                <div className="flex items-center gap-2 mt-2">
                                    <input type="checkbox" checked className="h-4 w-4 rounded border-[rgba(148,163,184,0.1)] bg-[#0F1117]" />
                                    <span className="text-xs font-medium text-[#94A3B8]">Tự động khóa ngân sách khi duyệt PO chính thức.</span>
                                </div>
                            </div>

                            <div className="pt-8 flex justify-end">
                                <button className="flex items-center gap-2 bg-[#3B82F6] hover:bg-[#2563EB] text-white px-8 py-3 rounded-xl font-bold shadow-lg shadow-[#3B82F6]/20 transition-colors">
                                    <Save size={18} /> Lưu thay đổi
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
}
