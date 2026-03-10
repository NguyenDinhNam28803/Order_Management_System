"use client";

import React from "react";
import DashboardHeader from "../components/DashboardHeader";
import { Settings, Shield, Bell, Database, Save } from "lucide-react";

export default function SettingsPage() {
    return (
        <main className="pt-16 px-8 pb-12">
            <DashboardHeader breadcrumbs={["Hệ thống", "Cài đặt"]} />

            <div className="mt-8 mb-12">
                <h1 className="text-2xl font-black text-erp-navy tracking-tight">Cài đặt hệ thống</h1>
                <p className="text-sm text-slate-500 mt-1">Cấu hình tham số nghiệp vụ và bảo mật toàn hệ thống.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                <div className="space-y-2">
                    <button className="w-full flex items-center gap-3 px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-bold text-erp-navy shadow-sm">
                        <Shield size={18} /> Phân quyền & Bảo mật
                    </button>
                    <button className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white text-slate-500 rounded-xl text-sm font-bold transition-all">
                        <Bell size={18} /> Thông báo & Email
                    </button>
                    <button className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white text-slate-500 rounded-xl text-sm font-bold transition-all">
                        <Database size={18} /> Kết nối Cơ sở dữ liệu
                    </button>
                </div>

                <div className="md:col-span-3 space-y-8">
                    <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm">
                        <h3 className="text-sm font-black uppercase text-erp-navy mb-8 border-b border-slate-100 pb-4">Tham số nghiệp vụ Thu mua</h3>
                        <div className="max-w-xl space-y-6">
                            <div className="grid grid-cols-2 gap-8">
                                <div>
                                    <label className="erp-label">Ngưỡng dung sai (%)</label>
                                    <input type="number" className="erp-input" defaultValue={2} />
                                    <p className="text-[10px] text-slate-400 mt-1">Chênh lệch tối đa cho phép giữa PO và Invoice.</p>
                                </div>
                                <div>
                                    <label className="erp-label">Loại tiền tệ mặc định</label>
                                    <select className="erp-input">
                                        <option>VND (₫)</option>
                                        <option>USD ($)</option>
                                        <option>EUR (€)</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="erp-label">Quy tắc Budget Lock</label>
                                <div className="flex items-center gap-2 mt-2">
                                    <input type="checkbox" checked className="h-4 w-4 rounded border-slate-300" />
                                    <span className="text-xs font-medium text-slate-700">Tự động khóa ngân sách khi duyệt PO chính thức.</span>
                                </div>
                            </div>

                            <div className="pt-8 flex justify-end">
                                <button className="flex items-center gap-2 bg-erp-navy text-white px-8 py-3 rounded-xl font-bold shadow-lg shadow-erp-navy/20">
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
